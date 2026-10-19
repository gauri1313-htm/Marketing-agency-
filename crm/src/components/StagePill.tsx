import { STAGE_LABEL, type Stage } from "../data/types";

export function StageDot({ stage }: { stage: Stage }) {
  return <span className="stage-dot" style={{ background: `var(--stage-${stage})` }} aria-hidden="true" />;
}

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span className={`stage-pill stage-pill--${stage}`}>
      <StageDot stage={stage} />
      {STAGE_LABEL[stage]}
    </span>
  );
}
