"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  HelpCircle,
  BarChart2,
  Send,
  ThumbsUp,
  Trash2,
  CheckCircle,
  Plus,
  Radio,
  Users
} from "lucide-react";
import {
  sendChatMessage,
  deleteChatMessage,
  askQuestion,
  upvoteQuestion,
  markQuestionAnswered,
  createPoll,
  votePoll,
} from "@/lib/dbActions";

interface Props {
  eventId: string;
  userName: string;
  userRole: "host" | "speaker" | "attendee";
  roomState: any;
  onRefresh: () => void;
}

export default function LiveEngagementSidebar({
  eventId,
  userName,
  userRole,
  roomState,
  onRefresh,
}: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "qa" | "polls">("chat");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Q&A state
  const [questionInput, setQuestionInput] = useState("");

  // Polls creator state (Host only)
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomState?.chatMessages, activeTab]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput("");
    await sendChatMessage(eventId, userName, userRole, text);
    onRefresh();
  };

  // Delete message (moderation)
  const handleDeleteMessage = async (msgId: string) => {
    await deleteChatMessage(msgId);
    onRefresh();
  };

  // Ask Question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    const text = questionInput.trim();
    setQuestionInput("");
    await askQuestion(eventId, userName, text);
    onRefresh();
  };

  // Upvote Question
  const handleUpvote = async (qId: string) => {
    await upvoteQuestion(qId);
    onRefresh();
  };

  // Mark Answered
  const handleAnswer = async (qId: string) => {
    await markQuestionAnswered(qId);
    onRefresh();
  };

  // Create Poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.filter((o) => o.trim().length > 0);
    if (!pollQuestion.trim() || validOptions.length < 2) return;

    await createPoll(eventId, pollQuestion, validOptions);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setIsCreatingPoll(false);
    onRefresh();
  };

  // Vote on poll
  const handleVote = async (pollId: string, optIndex: number) => {
    await votePoll(pollId, optIndex, userName);
    onRefresh();
  };

  return (
    <div className="flex h-full flex-col border-l border-slate-800 bg-slate-950 text-white font-sans w-80 sm:w-96">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/50 p-1.5">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            activeTab === "chat"
              ? "bg-slate-800 text-[#00b4fb] shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setActiveTab("qa")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            activeTab === "qa"
              ? "bg-slate-800 text-[#00b4fb] shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Q&A</span>
          {roomState?.questions?.length > 0 && (
            <span className="rounded-full bg-[#00b4fb]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00b4fb]">
              {roomState.questions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("polls")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            activeTab === "polls"
              ? "bg-slate-800 text-[#00b4fb] shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Enquetes</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ================= CHAT TAB ================= */}
        {activeTab === "chat" && (
          <div className="space-y-3">
            {(!roomState?.chatMessages || roomState.chatMessages.length === 0) && (
              <div className="py-12 text-center text-xs text-slate-500">
                <MessageSquare className="mx-auto h-7 w-7 text-slate-700 mb-1" />
                <p className="font-semibold text-slate-400">O chat ao vivo está aberto!</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Envie uma mensagem para interagir.</p>
              </div>
            )}

            {roomState?.chatMessages?.map((msg: any) => (
              <div
                key={msg.id}
                className="group flex flex-col rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-200 truncate">{msg.senderName}</span>
                    {msg.senderRole === "host" && (
                      <span className="rounded-full bg-[#00b4fb]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#00b4fb]">
                        Host
                      </span>
                    )}
                    {msg.senderRole === "speaker" && (
                      <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-bold text-purple-400">
                        Speaker
                      </span>
                    )}
                  </div>

                  {userRole === "host" && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-500 transition"
                      title="Excluir mensagem (Moderação)"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-300 leading-relaxed break-words">{msg.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* ================= Q&A TAB ================= */}
        {activeTab === "qa" && (
          <div className="space-y-3">
            {(!roomState?.questions || roomState.questions.length === 0) && (
              <div className="py-12 text-center text-xs text-slate-500">
                <HelpCircle className="mx-auto h-7 w-7 text-slate-700 mb-1" />
                <p className="font-semibold text-slate-400">Nenhuma pergunta enviada</p>
                <p className="text-[10px] text-slate-600 mt-0.5">As melhores perguntas sobem com os votos da plateia!</p>
              </div>
            )}

            {roomState?.questions?.map((q: any) => (
              <div
                key={q.id}
                className={`rounded-2xl border p-3.5 space-y-2 transition ${
                  q.isAnswered
                    ? "border-emerald-500/30 bg-emerald-950/20"
                    : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold">{q.askerName}</span>
                    <p className="font-medium text-slate-200 mt-0.5 leading-snug">{q.text}</p>
                  </div>

                  {/* Upvote button */}
                  <button
                    onClick={() => handleUpvote(q.id)}
                    className="flex items-center gap-1 rounded-xl bg-slate-800 px-2 py-1 text-xs font-bold text-[#00b4fb] hover:bg-slate-700 transition"
                    title="Votar nesta pergunta"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>{q.upvotes}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                  {q.isAnswered ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Respondida ao vivo
                    </span>
                  ) : (
                    <span className="text-slate-500">Aguardando resposta</span>
                  )}

                  {(userRole === "host" || userRole === "speaker") && !q.isAnswered && (
                    <button
                      onClick={() => handleAnswer(q.id)}
                      className="text-[#00b4fb] hover:underline font-bold"
                    >
                      Marcar como respondida
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= POLLS TAB ================= */}
        {activeTab === "polls" && (
          <div className="space-y-4">
            {/* Host: Create Poll Trigger */}
            {userRole === "host" && (
              <div>
                {!isCreatingPoll ? (
                  <button
                    onClick={() => setIsCreatingPoll(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#00b4fb] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#009ce0] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Lançar Nova Enquete</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreatePoll} className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-2.5">
                    <h4 className="text-xs font-bold text-[#00b4fb] uppercase">Nova Enquete ao Vivo</h4>
                    <input
                      type="text"
                      required
                      placeholder="Pergunta da enquete..."
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00b4fb] focus:outline-none"
                    />

                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        required
                        placeholder={`Opção ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...pollOptions];
                          copy[idx] = e.target.value;
                          setPollOptions(copy);
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00b4fb] focus:outline-none"
                      />
                    ))}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingPoll(false)}
                        className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-[#00b4fb] py-1.5 text-xs font-bold text-white hover:bg-[#009ce0]"
                      >
                        Lançar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Polls List */}
            {roomState?.polls?.map((poll: any) => {
              const options: string[] = JSON.parse(poll.optionsJson || "[]");
              const totalVotes = poll.votes?.length || 0;

              return (
                <div key={poll.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#00b4fb]/20 px-2 py-0.5 text-[9px] font-bold text-[#00b4fb] uppercase">
                      Enquete Ativa
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{totalVotes} votos</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{poll.question}</h4>

                  <div className="space-y-2">
                    {options.map((optionText, idx) => {
                      const count = poll.votes?.filter((v: any) => v.optionIndex === idx).length || 0;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleVote(poll.id, idx)}
                          className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-left text-xs transition hover:border-[#00b4fb]"
                        >
                          {/* Progress bar background */}
                          <div
                            className="absolute inset-y-0 left-0 bg-[#00b4fb]/20 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between text-[11px] font-medium text-slate-200">
                            <span>{optionText}</span>
                            <span className="font-bold text-[#00b4fb]">{pct}% ({count})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-3">
        {activeTab === "chat" && (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Digite uma mensagem..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00b4fb] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00b4fb] text-white hover:bg-[#009ce0] transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {activeTab === "qa" && (
          <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Faça uma pergunta aos palestrantes..."
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00b4fb] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!questionInput.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00b4fb] text-white hover:bg-[#009ce0] transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
