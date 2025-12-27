export interface ReportWorkSelection {
  id: string; // work ID
  subworks: string[]; // subwork IDs
}

export type ReportRequest = ReportWorkSelection[];

export async function generateLegacyPdf(body: ReportRequest): Promise<Blob> {
  const res = await fetch(`/reports/generate/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to generate PDF");
  }

  return res.blob();
}

export async function generateExcelFromSubwork(body: unknown): Promise<Blob> {
  const res = await fetch(`/reports/generate/excel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to generate Excel");
  }

  return res.blob();
}

export async function generateReport(
  body: ReportRequest,
  format: "pdf" | "excel",
): Promise<Blob> {
  const res = await fetch(`/reports/generate-report?format=${format}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to generate report");
  }

  return res.blob();
}
