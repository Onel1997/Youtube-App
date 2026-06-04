export interface TimingStep {
  name: string;
  ms: number;
}

export interface TimingSummary {
  context: string;
  totalMs: number;
  steps: TimingStep[];
  slowest: TimingStep;
}

/** Wraps an async step with console.time / console.timeEnd and records duration. */
export async function timeStep<T>(
  label: string,
  fn: () => Promise<T>,
  steps: TimingStep[]
): Promise<T> {
  console.time(label);
  const started = Date.now();
  try {
    return await fn();
  } finally {
    const ms = Date.now() - started;
    console.timeEnd(label);
    steps.push({ name: label, ms });
    console.log(`${label} finished in ${ms}ms`);
  }
}

export function logTimingBreakdown(
  context: string,
  steps: TimingStep[],
  totalMs: number
): TimingSummary {
  const sorted = [...steps].sort((a, b) => b.ms - a.ms);
  const slowest = sorted[0] ?? { name: "(none)", ms: 0 };

  console.log(`\n========== [${context}] Timing breakdown ==========`);
  for (const step of sorted) {
    const pct = totalMs > 0 ? ((step.ms / totalMs) * 100).toFixed(1) : "0.0";
    console.log(`  ${step.ms}ms (${pct}%) — ${step.name}`);
  }
  console.log(`  TOTAL: ${totalMs}ms`);
  console.log(`  SLOWEST: ${slowest.name} (${slowest.ms}ms)`);
  console.log(`====================================================\n`);

  return { context, totalMs, steps: sorted, slowest };
}
