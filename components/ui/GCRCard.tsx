interface Props {
  title?: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}

export default function GCRCard({ title, desc, children, className = "" }: Props) {
  return (
    <div className={`gcr-card ${className}`}>
      {(title || desc) && (
        <div className="px-5 py-4 border-b border-border">
          {title && <h3 className="text-section-title text-text-primary">{title}</h3>}
          {desc && <p className="mt-1 text-label text-text-secondary">{desc}</p>}
        </div>
      )}
      <div className="p-card">{children}</div>
    </div>
  );
}
