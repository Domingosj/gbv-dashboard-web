import { ReactNode } from "react";

interface TableProps { children: ReactNode; className?: string; }
interface THeadProps { children: ReactNode; className?: string; }
interface TBodyProps { children: ReactNode; className?: string; }
interface TRowProps { children: ReactNode; className?: string; }
interface TCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GCRTable({ children, className = "" }: TableProps) {
  return <table className={`min-w-full ${className}`}>{children}</table>;
}

export function GCRTHead({ children, className = "" }: THeadProps) {
  return <thead className={`border-b border-border bg-gray-50 ${className}`}>{children}</thead>;
}

export function GCRTBody({ children, className = "" }: TBodyProps) {
  return <tbody className={`divide-y divide-border ${className}`}>{children}</tbody>;
}

export function GCRTRow({ children, className = "" }: TRowProps) {
  return <tr className={`hover:bg-gray-50 transition-colors ${className}`}>{children}</tr>;
}

export function GCRTCell({ children, isHeader = false, className = "", onClick }: TCellProps) {
  const Tag = isHeader ? "th" : "td";
  const base = isHeader
    ? "px-5 py-3.5 text-left text-label text-text-secondary uppercase tracking-wider"
    : "px-5 py-3.5 text-body text-text-primary";
  return <Tag className={`${base} ${className}`} onClick={onClick}>{children}</Tag>;
}
