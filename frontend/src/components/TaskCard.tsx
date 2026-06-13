"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, MoreVertical, Trash2, Edit2, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  createdAt: string;
  user?: { email: string };
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: string) => void;
  onView: (id: string) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus, onView }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCompleted = task.status === "COMPLETED";

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    HIGH: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={clsx(
        "group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-300",
        isCompleted 
          ? "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100" 
          : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-500/30"
      )}
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={() => onToggleStatus(task.id, isCompleted ? "TODO" : "COMPLETED")}
          className="mt-1 flex-shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={clsx(
                "text-lg font-semibold truncate transition-colors",
                isCompleted ? "text-slate-500 line-through" : "text-slate-900 dark:text-slate-100"
              )}>
                {task.title}
              </h3>
              {task.description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 py-1">
                    <button 
                      onClick={() => { setIsMenuOpen(false); onView(task.id); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <FileText className="w-4 h-4" /> View Details
                    </button>
                    <button 
                      onClick={() => { setIsMenuOpen(false); onEdit(task); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => { setIsMenuOpen(false); onDelete(task.id); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={clsx(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
              priorityColors[task.priority]
            )}>
              {task.priority === "HIGH" && <AlertCircle className="w-3 h-3 mr-1" />}
              {task.priority}
            </span>
            
            {task.dueDate && (
              <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </span>
            )}

            {task.user?.email && (
              <span className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 ml-auto bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">
                {task.user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
