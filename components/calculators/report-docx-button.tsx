"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { downloadReportDocx } from "@/lib/report-docx/browser";
import type { DocxReportDocument } from "@/lib/report-docx/types";

type ReportDocxButtonProps = {
  report: DocxReportDocument;
};

export function ReportDocxButton({ report }: ReportDocxButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");

    try {
      await downloadReportDocx(report);
      setStatus("idle");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <div className="report-docx-action">
      <button
        type="button"
        className="report-docx-action__button"
        onClick={handleClick}
        disabled={status === "loading"}
      >
        <Download aria-hidden="true" size={16} />
        {status === "loading" ? "Готуємо DOCX..." : "Завантажити DOCX"}
      </button>
      {status === "error" ? (
        <p className="report-docx-action__error">
          Не вдалося сформувати DOCX. Спробуйте ще раз.
        </p>
      ) : null}
    </div>
  );
}
