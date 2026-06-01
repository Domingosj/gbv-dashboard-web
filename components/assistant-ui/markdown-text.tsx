import { MessagePrimitive } from "@assistant-ui/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export const MarkdownText: React.FC = () => {
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-on-surface prose-code:text-primary prose-code:bg-surface-container prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant prose-table:text-body-sm prose-th:bg-surface-container prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-tr:even:bg-surface-container-low prose-a:text-primary prose-ul:my-1 prose-ol:my-1">
      <MessagePrimitive.Content />
    </div>
  )
}
