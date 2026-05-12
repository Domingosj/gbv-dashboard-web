"use client";

export default function MapPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🗺️</div>
        <h1 className="text-section-title text-text-primary mb-3">Geographic Map</h1>
        <p className="text-body text-text-secondary mb-4">
          Esta funcionalidade está em desenvolvimento e será disponibilizada numa próxima fase.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning font-medium text-label">
          ⚙️ Em Desenvolvimento
        </div>
      </div>
    </div>
  );
}
