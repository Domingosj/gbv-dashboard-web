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
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
          {title && <h3 className="text-title-md text-on-surface">{title}</h3>}
          {desc && <p className="mt-1 text-body-sm text-on-surface-variant">{desc}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
