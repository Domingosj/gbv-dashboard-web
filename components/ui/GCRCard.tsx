interface Props {
  title?: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}

export default function GCRCard({ title, desc, children, className = "" }: Props) {
  return (
    <div className={`gcr-card overflow-hidden ${className}`}>
      {(title || desc) && (
        <div className="px-7 py-5 border-b border-stroke bg-surface">
          {title && <h3 className="text-[18px] font-bold text-text-primary">{title}</h3>}
          {desc && <p className="mt-1 text-sm text-body">{desc}</p>}
        </div>
      )}
      <div className="p-7">{children}</div>
    </div>
  );
}
