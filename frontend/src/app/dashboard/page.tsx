"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import TaskCard, { Task } from "../../components/TaskCard";
import TaskForm from "../../components/TaskForm";
import TaskDetailsModal from "../../components/TaskDetailsModal";
import { Plus, Search, Filter, ArrowUpDown, Loader2, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingTask, setViewingTask] = useState<any | undefined>(undefined);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("/tasks", {
        params: { search, status: statusFilter, sortBy, sortOrder, page, limit: 9 }
      });
      setTasks(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${apiUrl}/tasks/stream?token=${token}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "TASK_CREATED" || data.type === "TASK_UPDATED" || data.type === "TASK_DELETED") {
        fetchTasks();
      }
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, statusFilter, sortBy, sortOrder, page]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, data);
      } else {
        await api.post("/tasks", data);
      }
      setIsFormOpen(false);
      setEditingTask(undefined);
      fetchTasks();
    } catch (err) {
      console.error("Error saving task", err);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus as Task["status"] } : t));
      await api.patch(`/tasks/${id}`, { status: newStatus });
    } catch (err) {
      console.error(err);
      fetchTasks(); // rollback on error
    }
  };

  const handleViewTask = async (id: string) => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setViewingTask(res.data);
    } catch (err) {
      console.error("Error fetching task details", err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your daily goals.</p>
        </div>
        <button 
          onClick={() => { setEditingTask(undefined); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative flex">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="createdAt">Created Date</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
            <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <button 
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-y border-r border-slate-200 dark:border-slate-600 rounded-r-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300 font-medium text-sm uppercase"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">No tasks found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {search || statusFilter ? "Try adjusting your filters to find what you're looking for." : "You don't have any tasks yet. Create one to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={(t) => { setEditingTask(t); setIsFormOpen(true); }}
                onDelete={handleDeleteClick}
                onToggleStatus={handleToggleStatus}
                onView={handleViewTask}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {isFormOpen && (
        <TaskForm 
          initialData={editingTask} 
          onSubmit={handleCreateOrUpdate} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Task</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to permanently delete this task? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTask && (
          <TaskDetailsModal 
            task={viewingTask} 
            onClose={() => setViewingTask(undefined)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
