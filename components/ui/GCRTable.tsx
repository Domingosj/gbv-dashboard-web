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
  return <thead className={`border-b border-outline-variant ${className}`}>{children}</thead>;
}

export function GCRTBody({ children, className = "" }: TBodyProps) {
  return <tbody className={`divide-y divide-outline-variant/50 ${className}`}>{children}</tbody>;
}

export function GCRTRow({ children, className = "" }: TRowProps) {
  return <tr className={`hover:bg-surface-container-low transition-colors duration-150 ${className}`}>{children}</tr>;
}

export function GCRTCell({ children, isHeader = false, className = "", onClick }: TCellProps) {
  const Tag = isHeader ? "th" : "td";
  const base = isHeader
    ? "px-5 py-3.5 text-left text-label-caps text-on-surface-variant"
    : "px-5 py-3.5 text-body-sm text-on-surface";
  return <Tag className={`${base} ${className}`} onClick={onClick}>{children}</Tag>;
}
