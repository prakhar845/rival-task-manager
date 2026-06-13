"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { X, Activity, Clock, FileText, AlertCircle, Paperclip, UploadCloud } from "lucide-react";
import { Task } from "./TaskCard";
import { useState, useRef, useEffect } from "react";
import api from "../lib/api";
import clsx from "clsx";

interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
}

interface TaskDetails extends Task {
  activityLogs: ActivityLog[];
  attachments: Attachment[];
}

interface TaskDetailsModalProps {
  task: TaskDetails;
  onClose: () => void;
}

export default function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const priorityColors = {
    LOW: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    HIGH: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };

  const statusColors = {
    TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localTask, setLocalTask] = useState<TaskDetails>(task);
  const [isLoading, setIsLoading] = useState(!task.activityLogs);

  useEffect(() => {
    const fetchFullTask = async () => {
      try {
        const res = await api.get(`/tasks/${task.id}`);
        setLocalTask(res.data);
      } catch (err) {
        console.error("Failed to fetch full task details", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!task.activityLogs) {
      fetchFullTask();
    }
  }, [task.id, task.activityLogs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await api.post(`/tasks/${localTask.id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Fetch latest task details to update activity log and attachments
      const taskRes = await api.get(`/tasks/${localTask.id}`);
      setLocalTask(taskRes.data);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{localTask.title}</h1>
              {localTask.description && (
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{localTask.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium", statusColors[localTask.status])}>
                {localTask.status.replace("_", " ")}
              </span>
              <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border", priorityColors[localTask.priority])}>
                {localTask.priority === "HIGH" && <AlertCircle className="w-4 h-4 mr-1.5" />}
                {localTask.priority} Priority
              </span>
              {localTask.dueDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Due: {format(new Date(localTask.dueDate), "MMM d, yyyy")}
                </span>
              )}
            </div>

            {/* Attachments Section */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-indigo-500" />
                  Attachments
                </h3>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </div>

              {localTask.attachments?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localTask.attachments.map((att) => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const baseUrl = apiUrl.replace('/api', '');
                    return (
                    <a 
                      key={att.id} 
                      href={`${baseUrl}${att.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{att.filename}</p>
                        <p className="text-xs text-slate-500">{format(new Date(att.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No attachments yet.</p>
              )}
            </div>

            {/* Activity Log */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-500" />
                Activity Log
              </h3>
              
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {localTask.activityLogs?.map((log) => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{log.action}</span>
                            <span className="text-xs text-slate-500">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                          </div>
                          {log.details && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(log.details);
                                  if (typeof parsed !== 'object' || parsed === null) throw new Error("Not object");
                                  return (
                                    <ul className="space-y-1 list-disc list-inside">
                                      {Object.entries(parsed)
                                        .filter(([k]) => !['id', 'userId', 'createdAt', 'updatedAt'].includes(k))
                                        .map(([k, v]: [string, any]) => {
                                          const isDiff = v && typeof v === 'object' && 'from' in v && 'to' in v;
                                          return (
                                            <li key={k} className="break-words">
                                              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                              {isDiff ? (
                                                <span className="inline-flex items-center gap-1.5 ml-1 flex-wrap">
                                                  <span className="text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600">{v.from ? String(v.from) : "None"}</span>
                                                  <span className="text-slate-400">→</span>
                                                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">{v.to ? String(v.to) : "None"}</span>
                                                </span>
                                              ) : (
                                                <span className="break-words">{v ? String(v) : "None"}</span>
                                              )}
                                            </li>
                                          );
                                        })}
                                    </ul>
                                  );
                                } catch {
                                  return <span className="font-mono break-words block">{log.details}</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!localTask.activityLogs || localTask.activityLogs.length === 0) && (
                      <p className="text-sm text-slate-500 italic text-center">No activity recorded yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
