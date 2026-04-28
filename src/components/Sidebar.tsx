"use client";

import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
  hasIncident: boolean;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-3 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-white/[0.06] transition-all hover:bg-white/10 hover:text-slate-200"
        title={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-white/[0.06] bg-[#080a0e]/95 backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 pt-4">
          <span className="text-xs font-semibold tracking-wide text-slate-400">
            INCIDENT HISTORY
          </span>
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-2.5 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-3 w-3" />
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-slate-700" />
              <p className="text-xs text-slate-600">No incidents yet</p>
              <p className="mt-1 text-[10px] text-slate-700">
                Start a conversation to begin
              </p>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative mb-1 cursor-pointer rounded-lg px-3 py-2.5 transition-all ${
                    activeSessionId === session.id
                      ? "bg-indigo-500/10 ring-1 ring-indigo-500/20"
                      : "hover:bg-white/[0.03]"
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {session.hasIncident ? (
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    ) : (
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-300">
                        {session.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{session.timestamp}</span>
                        <span>·</span>
                        <span>{session.messageCount} msgs</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="mt-0.5 hidden rounded p-1 text-slate-700 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:block"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-700">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>SentinelBrain v0.1.0</span>
            <span className="ml-auto">Mock Mode</span>
          </div>
        </div>
      </aside>
    </>
  );
}
