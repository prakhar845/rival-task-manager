import { Router } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { authenticate } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import { addSseClient, removeSseClient, broadcastToUser } from "../utils/sse";

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

router.use(authenticate);

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

// SSE Stream Route
router.get("/stream", (req, res) => {
  const userId = req.user!.id;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now().toString();
  addSseClient(clientId, res, userId);

  req.on("close", () => {
    removeSseClient(clientId);
  });
});

// Create Task
router.post("/", async (req, res) => {
  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
  }

  const userId = req.user!.id;
  const task = await prisma.task.create({
    data: {
      ...result.data,
      userId,
    }
  });

  await prisma.activityLog.create({
    data: { action: "Task Created", taskId: task.id }
  });

  broadcastToUser(userId, { type: "TASK_CREATED", task });

  res.status(201).json(task);
});

// List Tasks (with pagination, filter, search, sort)
router.get("/", async (req, res) => {
  const { status, search, sortBy, sortOrder = "asc", page = "1", limit = "10" } = req.query;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const pageNumber = parseInt(page as string, 10) || 1;
  const limitNumber = parseInt(limit as string, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const where: any = {};
  
  // Role based access: Admins see all tasks, users see their own
  if (userRole !== "ADMIN") {
    where.userId = userId;
  }

  if (status) where.status = status;
  if (search) {
    where.title = { contains: search as string, mode: "insensitive" };
  }

  // Universal In-Memory Sort to guarantee COMPLETED tasks are ALWAYS pushed to the bottom!
  const allTasks = await prisma.task.findMany({
    where,
    include: { user: { select: { email: true } } }
  });

  const pWeight: Record<string, number> = { "LOW": 1, "MEDIUM": 2, "HIGH": 3 };

  allTasks.sort((a, b) => {
    // 1. For Priority and Due Date, ALWAYS push COMPLETED tasks to the bottom
    if (sortBy !== "createdAt") {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
    }

    // 2. Apply requested sort criteria
    if (sortBy === "priority") {
      const diff = (pWeight[a.priority] || 0) - (pWeight[b.priority] || 0);
      if (diff !== 0) return sortOrder === "asc" ? diff : -diff;
    } else if (sortBy === "dueDate") {
      if (!a.dueDate && b.dueDate) return 1; // nulls last
      if (a.dueDate && !b.dueDate) return -1; // nulls last
      if (a.dueDate && b.dueDate) {
        const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (diff !== 0) return sortOrder === "asc" ? diff : -diff;
      }
    } else if (sortBy === "createdAt") {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (diff !== 0) return sortOrder === "asc" ? diff : -diff;
    }

    // 3. Ultimate Tiebreaker: Newest created first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = allTasks.length;
  const paginatedTasks = allTasks.slice(skip, skip + limitNumber);

  return res.json({
    data: paginatedTasks,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  });


});

// Get Single Task
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const task = await prisma.task.findUnique({
    where: { id },
    include: { 
      activityLogs: { orderBy: { createdAt: "desc" } },
      attachments: true
    }
  });

  if (!task) return res.status(404).json({ message: "Task not found" });
  if (userRole !== "ADMIN" && task.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(task);
});

// Update Task
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const result = taskSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
  }

  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) return res.status(404).json({ message: "Task not found" });
  if (userRole !== "ADMIN" && existingTask.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: result.data
  });

  const changes: Record<string, any> = {};
  for (const key of Object.keys(result.data)) {
    const oldVal = (existingTask as any)[key];
    const newVal = (result.data as any)[key];
    
    if (key === 'dueDate') {
      const oldD = oldVal ? new Date(oldVal).toISOString() : null;
      const newD = newVal ? new Date(newVal).toISOString() : null;
      if (oldD !== newD) changes[key] = { from: oldD, to: newD };
    } else {
      if (oldVal !== newVal) {
        changes[key] = { from: oldVal, to: newVal };
      }
    }
  }

  if (Object.keys(changes).length > 0) {
    await prisma.activityLog.create({
      data: { action: "Task Updated", details: JSON.stringify(changes), taskId: id }
    });
  }

  broadcastToUser(existingTask.userId, { type: "TASK_UPDATED", task: updatedTask });

  res.json(updatedTask);
});

// Delete Task
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) return res.status(404).json({ message: "Task not found" });
  if (userRole !== "ADMIN" && existingTask.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.task.delete({ where: { id } });

  broadcastToUser(existingTask.userId, { type: "TASK_DELETED", taskId: id });

  res.status(204).send();
});

// Upload Attachment
router.post("/:id/attachments", upload.single("file"), async (req, res) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) return res.status(404).json({ message: "Task not found" });
  if (userRole !== "ADMIN" && existingTask.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const attachment = await prisma.attachment.create({
    data: {
      taskId: id,
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`
    }
  });

  await prisma.activityLog.create({
    data: { action: "Attachment Added", details: req.file.originalname, taskId: id }
  });

  res.status(201).json(attachment);
});

export default router;
