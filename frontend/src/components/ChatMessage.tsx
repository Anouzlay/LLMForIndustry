// src/components/ChatMessage.tsx
import React, { PropsWithChildren } from "react";
import { User, Bot, AlertTriangle } from "lucide-react";
import { Message } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface ChatMessageProps {
  message: Message;
}

// Reusable typed props for markdown override components
type WithClassName = PropsWithChildren<{ className?: string }>;
type WithChildren = PropsWithChildren<{}>;

const H1 = ({ children, className }: WithClassName) => (
  <h1 className={`text-lg font-bold text-gray-900 mb-2 ${className ?? ""}`}>{children}</h1>
);
const H2 = ({ children, className }: WithClassName) => (
  <h2 className={`text-base font-bold text-gray-900 mb-2 ${className ?? ""}`}>{children}</h2>
);
const H3 = ({ children, className }: WithClassName) => (
  <h3 className={`text-sm font-bold text-gray-900 mb-1 ${className ?? ""}`}>{children}</h3>
);
const P = ({ children, className }: WithClassName) => (
  <p className={`mb-2 text-gray-800 ${className ?? ""}`}>{children}</p>
);
const UL = ({ children, className }: WithClassName) => (
  <ul className={`list-disc list-inside mb-2 space-y-1 ${className ?? ""}`}>{children}</ul>
);
const OL = ({ children, className }: WithClassName) => (
  <ol className={`list-decimal list-inside mb-2 space-y-1 ${className ?? ""}`}>{children}</ol>
);
const LI = ({ children, className }: WithClassName) => (
  <li className={`text-gray-800 ${className ?? ""}`}>{children}</li>
);
const Strong = ({ children, className }: WithClassName) => (
  <strong className={`font-semibold text-gray-900 ${className ?? ""}`}>{children}</strong>
);
const Em = ({ children, className }: WithClassName) => (
  <em className={`italic text-gray-700 ${className ?? ""}`}>{children}</em>
);
const Blockquote = ({ children, className }: WithClassName) => (
  <blockquote className={`border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2 ${className ?? ""}`}>
    {children}
  </blockquote>
);
const Table = ({ children, className }: WithClassName) => (
  <table className={`min-w-full border-collapse border border-gray-300 mb-2 ${className ?? ""}`}>{children}</table>
);
const TH = ({ children, className }: WithClassName) => (
  <th className={`border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left ${className ?? ""}`}>
    {children}
  </th>
);
const TD = ({ children, className }: WithClassName) => (
  <td className={`border border-gray-300 px-2 py-1 ${className ?? ""}`}>{children}</td>
);
const Pre = ({ children, className }: WithClassName) => (
  <pre className={`bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2 ${className ?? ""}`}>{children}</pre>
);
const Code = ({ children, className }: WithClassName) => {
  // Inline vs block: react-markdown passes className like "language-ts" for code blocks
  const isInline = !className;
  if (isInline) {
    return <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
  }
  return <code className={className}>{children}</code>;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isOutOfContext = message.isOutOfContext;

  // Be resilient if timestamp is a string in server-rendered output
  const timeString =
    typeof message.timestamp === "string"
      ? new Date(message.timestamp).toLocaleTimeString()
      : message.timestamp.toLocaleTimeString();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? "bg-primary-600" : "bg-gray-600"
            }`}
          >
            {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              isOutOfContext
                ? "bg-red-50 border border-red-200 text-red-800"
                : isUser
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            {isOutOfContext && (
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Out of Context</span>
              </div>
            )}

            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: H1,
                    h2: H2,
                    h3: H3,
                    p: P,
                    ul: UL,
                    ol: OL,
                    li: LI,
                    code: Code,
                    pre: Pre,
                    strong: Strong,
                    em: Em,
                    blockquote: Blockquote,
                    table: Table,
                    th: TH,
                    td: TD,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 mt-1">{timeString}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
