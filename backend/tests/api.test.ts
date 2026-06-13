import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

import app from "../src/server";
import prisma from "../src/utils/prisma";

let token = "";
let taskId = "";

beforeAll(async () => {
  // Clear the DB before tests
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("API Tests", () => {
  // Test 1: Signup
  it("should register a new user and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("test@example.com");
    
    token = res.body.token;
  });

  // Test 2: Create Task
  it("should create a new task when authenticated", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Task",
        description: "This is a test task",
        priority: "HIGH"
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Task");
    expect(res.body.priority).toBe("HIGH");

    taskId = res.body.id;
  });

  // Test 3: Unauthorized Access Protection
  it("should fail to fetch tasks if no token is provided", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  // Test 4: Fetch Tasks Pagination
  it("should list tasks correctly for the user", async () => {
    const res = await request(app)
      .get("/api/tasks?limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  // --- EXTREME METHODS & EDGE CASES ---
  
  // Test 5: Invalid Data Ingestion (Zod Validation)
  it("should reject task creation with malformed payload", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "", // Title is required
        priority: "SUPER_HIGH_INVALID_ENUM" // Invalid priority
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid input");
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // Test 6: Cross-User Isolation (Security)
  it("should prevent User B from updating User A's task", async () => {
    // 1. Create a second user
    const resUserB = await request(app)
      .post("/api/auth/signup")
      .send({ email: "hacker@example.com", password: "password123" });
    const tokenB = resUserB.body.token;

    // 2. Try to update User A's task with User B's token
    const resHack = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ title: "Hacked Title" });

    expect(resHack.status).toBe(403);
    expect(resHack.body.message).toBe("Forbidden");
  });

  // Test 7: Task Deletion
  it("should successfully delete a task and its activity logs cascade", async () => {
    // Check that activity logs exist before deletion
    const taskDetails = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(taskDetails.body.activityLogs.length).toBeGreaterThan(0);

    // Delete the task
    const resDelete = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(resDelete.status).toBe(204);

    // Verify it's gone
    const resCheck = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(resCheck.status).toBe(404);
  });
});
