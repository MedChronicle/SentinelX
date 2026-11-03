import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ModelMetric = {
  metric: string;
  [modelName: string]: string | number;
};

type FeatureContribution = {
  feature: string;
  value: number;
};

type AnomalyInsight = {
  id: string;
  type: string;
  confidence: number;
  model: string;
  location?: string;
  detail: string;
  detectedAt?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  shap?: FeatureContribution[];
};

type ModelStatus = {
  id: string;
  name: string;
  version?: string;
  status: "Active" | "Inactive" | "Training" | "Error" | "Unknown";
  trainedAt?: string;
  trainingRecords?: number;
  accuracy?: number;
};

type MLInsightsProps = {
  /** Metrics calculated from a real held-out evaluation set. Values are percentages (0–100). */
  modelMetrics?: ModelMetric[];
  /** Names of the model series to display in the comparison chart. */
  metricModelNames?: string[];
  /** Anomalies returned by the real detection service. */
  insights?: AnomalyInsight[];
  /** Model metadata returned by the backend/model registry. */
  models?: ModelStatus[];
  lastUpdated?: string;
  isLoading?: boolean;
  error?: string | null;
  /** Connect this to your backend retraining endpoint. */
  onRetrain?: (modelId: string) => void | Promise<void>;
};

const COLORS = ["#00d4ff", "#a78bfa", "#f59e0b", "#10b981", "#fb7185"];

const formatDate = (value?: string) => {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 85) return "#ef4444";
  if (confidence >= 70) return "#f59e0b";
  return "#7c3aed";
};

const statusColor: Record<ModelStatus["status"], string> = {
  Active: "#10b981",
  Inactive: "#64748b",
  Training: "#00d4ff",
  Error: "#ef4444",
  Unknown: "#f59e0b",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[#1e3058] bg-[#0d1525] p-3 text-xs shadow-xl">
      <p className="mb-2 font-mono text-[#8ba3cf]">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="font-mono" style={{ color: item.color }}>
          {item.name}: {Number(item.value).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#29416d] bg-[#070b14]/60 px-5 py-9 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#29416d] bg-[#101c31] text-[#8ba3cf]">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-7" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#dce7fa]">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-[#7187ad]">{detail}</p>
    </div>
  );
}

export default function MLInsights({
  modelMetrics = [],
  metricModelNames,
  insights = [],
  models = [],
  lastUpdated,
  isLoading = false,
  error = null,
  onRetrain,
}: MLInsightsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retraining, setRetraining] = useState<string | null>(null);
  const [retrainMessage, setRetrainMessage] = useState<string | null>(null);

  const detectedModels = useMemo(() => {
    if (metricModelNames?.length) return metricModelNames;
    if (!modelMetrics.length) return [];
    return Object.keys(modelMetrics[0]).filter((key) => key !== "metric");
  }, [metricModelNames, modelMetrics]);

  const anomalyCount = insights.length;
  const highConfidenceCount = insights.filter((item) => item.confidence >= 85).length;

  const handleRetrain = async (model: ModelStatus) => {
    if (!onRetrain || retraining) return;
    setRetraining(model.id);
    setRetrainMessage(null);
    try {
      await onRetrain(model.id);
      setRetrainMessage(`${model.name}: retraining request submitted.`);
    } catch (err) {
      setRetrainMessage(
        `${model.name}: retraining request failed. ${
          err instanceof Error ? err.message : "Please check the backend logs."
        }`
      );
    } finally {
      setRetraining(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.07] px-4 py-3 sm:flex-row sm:items-start">
        <svg className="mt-0.5 shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <p className="text-xs leading-relaxed text-[#f4c66b]">
          <strong>Decision-support notice:</strong> Anomaly scores are indicators for investigation, not proof of wrongdoing or culpability. Verify findings against source records and human review.
        </p>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">ML Insights</h1>
          <p className="mt-1 text-xs font-mono text-[#7187ad]">
            Model evaluation and anomaly monitoring
            <span className="mx-2 text-[#29416d]">•</span>
            Last updated: {formatDate(lastUpdated)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-[#1e3058] bg-[#0d1525] px-3 py-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7187ad]">Returned detections</p>
            <p className="mt-1 text-lg font-semibold text-white">{anomalyCount}</p>
          </div>
          <div className="rounded-lg border border-[#1e3058] bg-[#0d1525] px-3 py-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#7187ad]">High confidence</p>
            <p className="mt-1 text-lg font-semibold text-[#f59e0b]">{highConfidenceCount}</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.08] px-4 py-3 text-xs text-[#fca5a5]">
          Could not load ML data: {error}
        </div>
      )}
      {retrainMessage && (
        <div role="status" className="mb-4 rounded-lg border border-[#1e3058] bg-[#0d1525] px-4 py-3 text-xs text-[#b8c9e8]">
          {retrainMessage}
        </div>
      )}

      <section className="mb-4 rounded-xl border border-[#1e3058] bg-[#0d1525] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-display font-semibold tracking-wide text-[#e2eaf8]">Model performance</h2>
          <p className="mt-1 text-xs font-mono text-[#7187ad]">
            Evaluation metrics supplied by the backend · percentages
          </p>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#7187ad]">Loading evaluation results…</div>
        ) : modelMetrics.length && detectedModels.length ? (
          <>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelMetrics} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke="#1e3058" strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fill: "#8ba3cf", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8ba3cf", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#8ba3cf", fontSize: 11 }} />
                  {detectedModels.map((model, index) => (
                    <Bar
                      key={model}
                      dataKey={model}
                      name={model}
                      fill={COLORS[index % COLORS.length]}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={34}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#7187ad]">
              Metrics are meaningful only when calculated from a documented test set. Confirm the evaluation split and class balance in your model-training pipeline.
            </p>
          </>
        ) : (
          <EmptyState
            title="No evaluation results available"
            detail="Connect the model evaluation endpoint and pass measured accuracy, precision, recall, F1-score and AUC-ROC values. No placeholder scores are shown."
          />
        )}
      </section>

      <section className="mb-4 overflow-hidden rounded-xl border border-[#1e3058] bg-[#0d1525]">
        <div className="flex flex-col justify-between gap-2 border-b border-[#1e3058] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div>
            <h2 className="font-display font-semibold tracking-wide text-[#e2eaf8]">Anomaly detections</h2>
            <p className="mt-1 text-xs font-mono text-[#7187ad]">Records returned by the detection service</p>
          </div>
          <span className="w-fit rounded-md border border-[#1e3058] px-2 py-1 text-[10px] font-mono text-[#8ba3cf]">
            {anomalyCount} records
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#7187ad]">Loading anomaly records…</div>
        ) : insights.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="No anomaly records returned"
              detail="There are no detections to display from the connected data source. This does not necessarily mean the system has verified that no suspicious activity exists."
            />
          </div>
        ) : (
          <div className="divide-y divide-[#1e3058]/70">
            {insights.map((insight) => {
              const color = confidenceColor(insight.confidence);
              const isExpanded = expanded === insight.id;
              const hasExplanation = Boolean(insight.shap?.length);

              return (
                <article key={insight.id} className="transition-colors hover:bg-[#111e35]/60">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded(isExpanded ? null : insight.id)}
                    className="w-full px-4 py-4 text-left sm:px-5"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${color}15`, border: `1px solid ${color}40` }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                          <path d="M12 2 3 20h18L12 2Z" />
                          <path d="M12 9v4m0 3h.01" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#e2eaf8]">{insight.type}</span>
                          <span className="rounded border px-2 py-0.5 text-[10px] font-mono" style={{ color, borderColor: `${color}50`, background: `${color}12` }}>
                            {insight.confidence}% confidence
                          </span>
                          {insight.severity && (
                            <span className="rounded border border-[#29416d] px-2 py-0.5 text-[10px] font-mono text-[#a9bbdc]">
                              {insight.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#00d4ff]">{insight.location || "Location not provided"}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#8ba3cf]">{insight.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-[#7187ad]">
                          <span>Model: {insight.model}</span>
                          {insight.detectedAt && <span>Detected: {formatDate(insight.detectedAt)}</span>}
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
                          <span className="text-base font-bold" style={{ color }}>{insight.confidence}</span>
                        </div>
                        <p className="mt-1 text-[10px] font-mono text-[#7187ad]">score</p>
                      </div>
                    </div>
                    <div className="ml-13 mt-3 flex items-center gap-2 text-[11px] font-mono text-[#8ba3cf]">
                      <span>{isExpanded ? "Hide details" : "View explanation"}</span>
                      <svg className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#1e3058]/70 bg-[#070b14] px-4 py-4 sm:px-5">
                      <p className="mb-3 text-[10px] font-mono uppercase tracking-wider text-[#8ba3cf]">
                        Model explanation
                      </p>
                      {hasExplanation ? (
                        <div className="space-y-3">
                          {insight.shap!.map((feature) => (
                            <div key={feature.feature}>
                              <div className="mb-1 flex justify-between gap-3 text-xs">
                                <span className="text-[#dce7fa]">{feature.feature}</span>
                                <span className="font-mono text-[#a78bfa]">{feature.value.toFixed(2)}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-[#1e3058]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed]/60 to-[#a78bfa]"
                                  style={{ width: `${Math.min(Math.abs(feature.value), 1) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          <p className="pt-1 text-[10px] italic leading-relaxed text-[#7187ad]">
                            Feature contributions describe the model output; they do not establish causation. Values and scale are supplied by the explanation service.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-[#7187ad]">
                          No feature-attribution data was supplied for this detection. An explanation cannot be generated from the confidence score alone.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-display font-semibold tracking-wide text-[#e2eaf8]">Model registry</h2>
          <p className="mt-1 text-xs font-mono text-[#7187ad]">Status and metadata reported by your backend</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-[#1e3058] bg-[#0d1525] py-10 text-center text-xs font-mono text-[#7187ad]">Loading model registry…</div>
        ) : models.length === 0 ? (
          <EmptyState
            title="No registered models"
            detail="Connect your model registry or backend status endpoint to display deployed models. Retraining is disabled until a real retraining handler is provided."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {models.map((model) => {
              const color = statusColor[model.status];
              return (
                <div key={model.id} className="rounded-xl border border-[#1e3058] bg-[#0d1525] p-4 sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold text-[#e2eaf8]">{model.name}</h3>
                      <p className="mt-1 text-[10px] font-mono text-[#7187ad]">{model.version || "Version not reported"}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono" style={{ color, borderColor: `${color}50`, background: `${color}12` }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {model.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between gap-3">
                      <span className="text-[#7187ad]">Accuracy</span>
                      <span className="text-[#dce7fa]">{model.accuracy == null ? "Not evaluated" : `${model.accuracy.toFixed(1)}%`}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[#7187ad]">Training records</span>
                      <span className="text-[#dce7fa]">{model.trainingRecords == null ? "Not reported" : model.trainingRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[#7187ad]">Last trained</span>
                      <span className="text-right text-[#dce7fa]">{formatDate(model.trainedAt)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!onRetrain || Boolean(retraining) || model.status === "Training"}
                    onClick={() => void handleRetrain(model)}
                    className="mt-4 w-full rounded-lg border border-[#7c3aed]/40 py-2 text-xs font-mono text-[#c4b5fd] transition-colors hover:bg-[#7c3aed]/10 disabled:cursor-not-allowed disabled:opacity-40"
                    title={!onRetrain ? "Connect a backend retraining handler to enable this action" : "Request model retraining"}
                  >
                    {retraining === model.id ? "Submitting request…" : model.status === "Training" ? "Training in progress" : onRetrain ? "Request retraining" : "Retraining unavailable"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-5 text-[10px] leading-relaxed text-[#536b94]">
        Data integrity note: this page displays only values passed into the component. It does not create predictions, calculate evaluation metrics, or train models in the browser. Connect these props to your actual backend responses before using the dashboard as operational evidence.
      </p>
    </div>
  );
}
