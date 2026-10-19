import { useState, type FormEvent } from "react";
import {
  OWNERS,
  SERVICES,
  SOURCES,
  STAGES,
  STAGE_LABEL,
  type Lead,
  type LeadInput,
} from "../data/types";

const EMPTY: LeadInput = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  industry: "",
  source: "Website",
  service: "Paid social",
  owner: OWNERS[0],
  stage: "new",
  value: 2500,
  nextFollowUp: undefined,
};

type Errors = Partial<Record<keyof LeadInput, string>>;

function validate(v: LeadInput): Errors {
  const e: Errors = {};
  if (!v.company.trim()) e.company = "Enter the company name.";
  if (!v.contactName.trim()) e.contactName = "Enter who you're talking to.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "That email address doesn't look complete.";
  if (!Number.isFinite(v.value) || v.value < 0) e.value = "Enter a monthly value of 0 or more.";
  return e;
}

export function LeadForm({
  lead,
  onSubmit,
  onCancel,
}: {
  lead?: Lead;
  onSubmit: (input: LeadInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<LeadInput>(() => {
    if (!lead) return EMPTY;
    const { company, contactName, email, phone, industry, source, service, owner, stage, value, nextFollowUp } = lead;
    return { company, contactName, email, phone, industry, source, service, owner, stage, value, nextFollowUp };
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`f-${firstInvalid}`)?.focus();
      return;
    }
    onSubmit({
      ...values,
      company: values.company.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      industry: values.industry.trim(),
      nextFollowUp: values.nextFollowUp || undefined,
    });
  };

  const field = (key: keyof LeadInput, label: string, input: React.ReactNode, hint?: string) => (
    <div className={`field${errors[key] ? " has-error" : ""}`}>
      <label htmlFor={`f-${key}`}>{label}</label>
      {input}
      {errors[key] ? (
        <p className="field-error" id={`f-${key}-err`}>
          {errors[key]}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );

  const textProps = (key: "company" | "contactName" | "email" | "phone" | "industry") => ({
    id: `f-${key}`,
    className: "input",
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `f-${key}-err` : undefined,
  });

  return (
    <form className="lead-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>Company</legend>
        <div className="field-grid">
          {field("company", "Company name", <input {...textProps("company")} autoFocus autoComplete="organization" />)}
          {field("industry", "Industry", <input {...textProps("industry")} placeholder="e.g. Hospitality" />)}
        </div>
      </fieldset>
      <fieldset>
        <legend>Contact</legend>
        <div className="field-grid">
          {field("contactName", "Contact name", <input {...textProps("contactName")} autoComplete="name" />)}
          {field("email", "Email", <input {...textProps("email")} type="email" autoComplete="email" />)}
          {field("phone", "Phone", <input {...textProps("phone")} type="tel" autoComplete="tel" />)}
        </div>
      </fieldset>
      <fieldset>
        <legend>Deal</legend>
        <div className="field-grid">
          {field(
            "value",
            "Monthly retainer (USD)",
            <input
              id="f-value"
              className="input num"
              type="number"
              min={0}
              step={250}
              value={Number.isNaN(values.value) ? "" : values.value}
              onChange={(e) => set("value", e.target.valueAsNumber)}
              aria-invalid={errors.value ? true : undefined}
              aria-describedby={errors.value ? "f-value-err" : undefined}
            />,
          )}
          {field(
            "stage",
            "Stage",
            <select id="f-stage" className="select" value={values.stage} onChange={(e) => set("stage", e.target.value as LeadInput["stage"])}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>,
          )}
          {field(
            "service",
            "Service",
            <select id="f-service" className="select" value={values.service} onChange={(e) => set("service", e.target.value as LeadInput["service"])}>
              {SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
          )}
          {field(
            "source",
            "Source",
            <select id="f-source" className="select" value={values.source} onChange={(e) => set("source", e.target.value as LeadInput["source"])}>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
          )}
          {field(
            "owner",
            "Owner",
            <select id="f-owner" className="select" value={values.owner} onChange={(e) => set("owner", e.target.value as LeadInput["owner"])}>
              {OWNERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>,
          )}
          {field(
            "nextFollowUp",
            "Next follow-up",
            <input
              id="f-nextFollowUp"
              className="input"
              type="date"
              value={values.nextFollowUp ?? ""}
              onChange={(e) => set("nextFollowUp", e.target.value || undefined)}
            />,
          )}
        </div>
      </fieldset>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {lead ? "Save changes" : "Add lead"}
        </button>
      </div>
    </form>
  );
}
