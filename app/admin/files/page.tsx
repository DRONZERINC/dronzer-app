"use client";

import { useState, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { documentStats } from "@/lib/mockData";

const SUPPORTED_FORMATS = [
  { ext: "CSV", icon: "📊", desc: "Spreadsheet data", color: "#22c55e" },
  { ext: "XLSX / XLS", icon: "📗", desc: "Excel workbooks", color: "#16a34a" },
  { ext: "PDF", icon: "📕", desc: "Reports & contracts", color: "#ef4444" },
  { ext: "DOCX / DOC", icon: "📘", desc: "Word documents", color: "#3b82f6" },
];

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  status: "processing" | "done" | "queued";
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "PDF",
    csv: "CSV",
    xlsx: "Excel",
    xls: "Excel",
    docx: "Word",
    doc: "Word",
  };
  return map[ext] ?? "Document";
}

export default function FilesPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      name: f.name,
      size: fileSize(f.size),
      type: detectType(f.name),
      status: "queued",
    }));
    setUploads((prev) => [...newFiles, ...prev]);

    // Simulate processing
    newFiles.forEach((_, i) => {
      setTimeout(() => {
        setUploads((prev) =>
          prev.map((u, idx) =>
            u.name === newFiles[i].name && u.status === "queued" ? { ...u, status: "processing" } : u
          )
        );
        setTimeout(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.name === newFiles[i].name && u.status === "processing" ? { ...u, status: "done" } : u
            )
          );
        }, 1800 + i * 400);
      }, 300 + i * 200);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  const statusStyle: Record<UploadedFile["status"], { bg: string; text: string; label: string }> = {
    queued: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "Queued" },
    processing: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", label: "Processing…" },
    done: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", label: "Ready" },
  };

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>
            Admin · Documents
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
            File Upload
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Upload documents for AI processing and indexing — Phase 2 feature
          </p>
        </div>

        {/* Phase 2 notice */}
        <div
          className="rounded-xl px-5 py-4 mb-6 flex items-start gap-3"
          style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.25)" }}
        >
          <span className="text-xl mt-0.5">✦</span>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "#2dd4bf" }}>
              AI Document Processing — Phase 2
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Once live, Dronzer AI will automatically extract data from uploaded files: parse invoices, index
              contracts, summarize HSE reports, and populate project budgets from Excel exports. Files uploaded
              now are queued for processing.
            </p>
          </div>
        </div>

        {/* Drag-and-drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center cursor-pointer transition-all mb-6"
          style={{
            background: isDragging ? "rgba(245,158,11,0.06)" : "#161b27",
            border: `2px dashed ${isDragging ? "#f59e0b" : "#2a3347"}`,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.pdf,.docx,.doc"
            className="hidden"
            onChange={handleFileInput}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-all"
            style={{
              background: isDragging ? "rgba(245,158,11,0.15)" : "#1e2433",
              border: `1px solid ${isDragging ? "#f59e0b" : "#2a3347"}`,
            }}
          >
            {isDragging ? "📂" : "📁"}
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: isDragging ? "#f59e0b" : "#e2e8f0" }}>
            {isDragging ? "Drop files to upload" : "Drag & drop files here"}
          </p>
          <p className="text-sm mb-4" style={{ color: "#64748b" }}>
            or click to browse your computer
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_FORMATS.map((f) => (
              <span
                key={f.ext}
                className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: "#1e2433", border: "1px solid #2a3347", color: "#94a3b8" }}
              >
                <span>{f.icon}</span>
                {f.ext}
              </span>
            ))}
          </div>
        </div>

        {/* Supported format cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {SUPPORTED_FORMATS.map((fmt) => (
            <div
              key={fmt.ext}
              className="rounded-xl p-3.5 flex flex-col items-center text-center"
              style={{ background: "#161b27", border: "1px solid #2a3347" }}
            >
              <span className="text-2xl mb-1.5">{fmt.icon}</span>
              <span className="text-sm font-medium" style={{ color: fmt.color }}>
                {fmt.ext}
              </span>
              <span className="text-xs mt-0.5" style={{ color: "#4b5563" }}>
                {fmt.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Current session uploads */}
        {uploads.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#e2e8f0" }}>
              Session Uploads ({uploads.length})
            </h2>
            <div className="space-y-2">
              {uploads.map((u, i) => {
                const ss = statusStyle[u.status];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "#1a1f2e" }}
                  >
                    <span className="text-base">
                      {u.type === "PDF" ? "📕" : u.type === "Excel" ? "📗" : u.type === "CSV" ? "📊" : "📘"}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: "#e2e8f0" }}>
                      {u.name}
                    </span>
                    <span className="text-xs" style={{ color: "#4b5563" }}>
                      {u.size}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                      style={{ background: ss.bg, color: ss.text }}
                    >
                      {u.status === "processing" && (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      {ss.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent repository uploads */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#161b27", border: "1px solid #2a3347" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
              Repository — Recent Files
            </h2>
            <span className="text-xs" style={{ color: "#64748b" }}>
              {documentStats.total.toLocaleString()} files total
            </span>
          </div>
          <div className="space-y-2">
            {documentStats.recentUploads.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "#1a1f2e" }}
              >
                <span className="text-base">
                  {doc.type === "PDF" ? "📕" : doc.type.includes("Excel") ? "📗" : "📋"}
                </span>
                <span className="text-sm flex-1 truncate" style={{ color: "#94a3b8" }}>
                  {doc.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#252d3d", color: "#64748b" }}
                >
                  {doc.site}
                </span>
                <span className="text-xs" style={{ color: "#4b5563" }}>
                  {doc.date}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: "#374151" }}>
            Full document search and AI-powered extraction available in Phase 2
          </p>
        </div>
      </div>
    </AppShell>
  );
}
