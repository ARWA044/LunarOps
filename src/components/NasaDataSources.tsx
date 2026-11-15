import { Database, ExternalLink } from "lucide-react";
import type { NasaDatasetMetadata } from "@/lib/types";

const statusLabels: Record<string, string> = {
  used: "NUMERICAL INPUT",
  unavailable_geometric_fallback: "FALLBACK ACTIVE",
  synthetic_approximation: "SYNTHETIC APPROXIMATION",
  not_integrated: "NOT INTEGRATED",
  reference_only: "REFERENCE ONLY",
};

export function NasaDataSources({ datasets }: { datasets: NasaDatasetMetadata[] }) {
  return (
    <section className="bento-card rounded-2xl border border-white/[0.08] p-4 sm:p-5" aria-labelledby="nasa-data-sources-title">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
            <Database className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <h3 id="nasa-data-sources-title" className="font-display text-sm font-semibold text-white">NASA Data Sources</h3>
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Provenance & integration status</p>
          </div>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 font-mono text-[8px] uppercase tracking-wide text-amber-200">Transparent inputs</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {datasets.map((dataset) => (
          <li key={dataset.id} className="min-w-0 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <h4 className="font-display text-[11px] font-semibold leading-snug text-slate-100">{dataset.name}</h4>
              <span className="shrink-0 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-1 font-mono text-[8px] uppercase leading-none text-slate-300">
                {statusLabels[dataset.status] ?? dataset.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mb-1 font-mono text-[9px] text-slate-400">{dataset.products}</p>
            <p className="text-[10px] leading-relaxed text-slate-300">{dataset.method}</p>
            <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">{dataset.limitations}</p>
            <a href={dataset.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] text-cyan-300 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300">
              NASA source <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
