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
  return <thead className={`border-b border-stroke ${className}`}>{children}</thead>;
}

export function GCRTBody({ children, className = "" }: TBodyProps) {
  return <tbody className={`divide-y divide-stroke ${className}`}>{children}</tbody>;
}

export function GCRTRow({ children, className = "" }: TRowProps) {
  return <tr className={`hover:bg-background/50 transition-colors duration-150 ${className}`}>{children}</tr>;
}

export function GCRTCell({ children, isHeader = false, className = "", onClick }: TCellProps) {
  const Tag = isHeader ? "th" : "td";
  const base = isHeader
    ? "px-6 py-4 text-left text-[13px] font-semibold text-body uppercase tracking-wider"
    : "px-6 py-4 text-[14px] text-text-primary";
  return <Tag className={`${base} ${className}`} onClick={onClick}>{children}</Tag>;
}
