import { Alert, Platform, Share } from "react-native";

export type ExportFormat = "pdf" | "png" | "csv" | "xlsx" | "docx";

export interface ExportCategoryRow {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface ExportReportData {
  monthLabel: string;
  generatedAt: Date;
  totalSpent: number;
  mediaDiaria: number;
  projecaoMensal: number;
  saldoPrevisto: number;
  categories: ExportCategoryRow[];
}

function money(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeFilePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function isWeb(): boolean {
  return Platform.OS === "web" && typeof document !== "undefined";
}

function downloadText(filename: string, content: string, mimeType: string): void {
  if (!isWeb()) throw new Error("unsupported");
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob): void {
  if (!isWeb()) throw new Error("unsupported");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pdfSafe(value: string | number): string {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (!/[",\n;]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    return map[char];
  });
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(" ");
}

function buildChartSvg(data: ExportReportData): string {
  const width = 760;
  const height = Math.max(360, 210 + data.categories.length * 34);
  const cx = 160;
  const cy = 178;
  const radius = 112;
  let currentAngle = -90;

  const slices = data.categories.length === 1
    ? `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${data.categories[0].color}" />`
    : data.categories.map((category) => {
        const sweep = (category.percent / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sweep;
        currentAngle = endAngle;
        return `<path d="${describeSlice(cx, cy, radius, startAngle, endAngle)}" fill="${category.color}" />`;
      }).join("");

  const legend = data.categories.map((category, index) => {
    const y = 116 + index * 34;
    return `
      <circle cx="360" cy="${y - 5}" r="7" fill="${category.color}" />
      <text x="378" y="${y}" class="legend-name">${escapeHtml(category.name)}</text>
      <text x="560" y="${y}" class="legend-value">${money(category.value)} - ${category.percent.toFixed(1)}%</text>`;
  }).join("");

  const empty = data.categories.length === 0
    ? `<text x="90" y="184" class="empty">Nenhum gasto registrado</text>`
    : slices;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .bg { fill: #ffffff; }
    .title { font: 700 26px Arial, sans-serif; fill: #111827; }
    .subtitle { font: 400 15px Arial, sans-serif; fill: #6b7280; }
    .legend-name { font: 700 15px Arial, sans-serif; fill: #111827; }
    .legend-value { font: 400 14px Arial, sans-serif; fill: #6b7280; text-anchor: end; }
    .empty { font: 500 16px Arial, sans-serif; fill: #6b7280; }
  </style>
  <rect class="bg" width="100%" height="100%" rx="18" />
  <text x="32" y="46" class="title">Gastos por categoria</text>
  <text x="32" y="76" class="subtitle">${escapeHtml(data.monthLabel)} - total ${money(data.totalSpent)}</text>
  ${empty}
  ${legend}
</svg>`;
}

function buildCsv(data: ExportReportData): string {
  const header = ["categoria", "valor_total", "percentual", "mes_ano"];
  const rows = data.categories.map((category) => [
    category.name,
    category.value.toFixed(2),
    category.percent.toFixed(1),
    data.monthLabel,
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function buildPdf(data: ExportReportData): string {
  const lines = [
    { text: "Relatorio financeiro", size: 18, x: 48, y: 790 },
    { text: `${data.monthLabel} - gerado em ${data.generatedAt.toLocaleString("pt-BR")}`, size: 10, x: 48, y: 768 },
    { text: `Total gasto no mes: ${money(data.totalSpent)}`, size: 12, x: 48, y: 730 },
    { text: `Media diaria: ${money(data.mediaDiaria)}`, size: 12, x: 48, y: 710 },
    { text: `Projecao mensal: ${money(data.projecaoMensal)}`, size: 12, x: 48, y: 690 },
    { text: `Saldo previsto: ${money(data.saldoPrevisto)}`, size: 12, x: 48, y: 670 },
    { text: "Gastos por categoria", size: 15, x: 48, y: 628 },
    { text: "Categoria", size: 11, x: 48, y: 604 },
    { text: "Valor total", size: 11, x: 270, y: 604 },
    { text: "Percentual", size: 11, x: 410, y: 604 },
  ];

  if (data.categories.length === 0) {
    lines.push({ text: "Nenhum gasto registrado.", size: 11, x: 48, y: 578 });
  } else {
    data.categories.forEach((category, index) => {
      const y = 578 - index * 20;
      lines.push(
        { text: category.name, size: 10, x: 48, y },
        { text: money(category.value), size: 10, x: 270, y },
        { text: `${category.percent.toFixed(1)}%`, size: 10, x: 410, y }
      );
    });
  }

  const stream = lines.map((line) => `BT /F1 ${line.size} Tf ${line.x} ${line.y} Td (${pdfSafe(line.text)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

async function exportCsv(data: ExportReportData): Promise<void> {
  const filename = `relatorio-financeiro-${safeFilePart(data.monthLabel)}.csv`;
  const csv = buildCsv(data);
  if (isWeb()) {
    downloadText(filename, csv, "text/csv;charset=utf-8");
    return;
  }
  await Share.share({ title: filename, message: csv });
}

async function exportPdf(data: ExportReportData): Promise<void> {
  if (!isWeb()) throw new Error("unsupported");
  const filename = `relatorio-financeiro-${safeFilePart(data.monthLabel)}.pdf`;
  downloadBlob(filename, new Blob([buildPdf(data)], { type: "application/pdf" }));
}

async function exportPng(data: ExportReportData): Promise<void> {
  if (!isWeb()) throw new Error("unsupported");
  const svg = buildChartSvg(data);
  const image = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const filename = `grafico-categorias-${safeFilePart(data.monthLabel)}.png`;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("canvas-unavailable"));
        return;
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error("png-unavailable"));
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load-failed"));
    };
    image.src = url;
  });
}

export async function exportFinancialReport(format: ExportFormat, data: ExportReportData): Promise<void> {
  if (format === "csv") return exportCsv(data);
  if (format === "pdf") return exportPdf(data);
  if (format === "png") return exportPng(data);
  throw new Error("coming-soon");
}

export function showExportResult(error?: unknown): void {
  if (!error) {
    Alert.alert("Exportação pronta", "Seu arquivo foi gerado com sucesso.");
    return;
  }
  const message = error instanceof Error ? error.message : "";
  if (message === "coming-soon" || message === "unsupported") {
    Alert.alert("Formato indisponível", "Este formato ainda não está disponível neste dispositivo.");
    return;
  }
  if (message === "popup-blocked") {
    Alert.alert("Permissão necessária", "Autorize pop-ups no navegador para gerar o PDF.");
    return;
  }
  Alert.alert("Não foi possível exportar", "Tente novamente em instantes.");
}
