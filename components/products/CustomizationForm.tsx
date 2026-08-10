"use client";

import * as React from "react";
import type { CustomizationOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, Upload, X } from "lucide-react";

type CustomizationValues = Record<string, string>;

function parsePrice(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPrice(value: number, currencySymbol = "৳"): string {
  return `${currencySymbol}${value.toFixed(2)}`;
}

export function CustomizationForm({
  options,
  currencySymbol = "৳",
  onChange,
}: {
  options: CustomizationOption[];
  currencySymbol?: string;
  onChange: (data: { values: CustomizationValues; totalModifier: number }) => void;
}) {
  const [values, setValues] = React.useState<CustomizationValues>({});
  const [files, setFiles] = React.useState<Record<string, File | null>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const activeOptions = React.useMemo(
    () => options.filter((o) => o.is_active).sort((a, b) => a.ordering - b.ordering),
    [options]
  );

  const totalModifier = React.useMemo(
    () =>
      activeOptions.reduce((sum, opt) => {
        const val = values[opt.id];
        if (!val && opt.option_type !== "checkbox") return sum;
        if (opt.option_type === "checkbox" && val !== "true") return sum;
        return sum + parsePrice(opt.price_modifier);
      }, 0),
    [activeOptions, values]
  );

  const setValue = React.useCallback(
    (optionId: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev, [optionId]: value };
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[optionId];
        return next;
      });
    },
    []
  );

  const validate = React.useCallback(() => {
    const errs: Record<string, string> = {};
    for (const opt of activeOptions) {
      if (!opt.is_required) continue;
      const val = values[opt.id];
      if (opt.option_type === "checkbox" && val !== "true") {
        errs[opt.id] = `${opt.name} is required`;
        continue;
      }
      if (!val || val.trim() === "") {
        errs[opt.id] = `${opt.name} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [activeOptions, values]);

  React.useEffect(() => {
    const valid = validate();
    if (valid) {
      onChange({ values, totalModifier });
    }
  }, [values, totalModifier, validate, onChange]);

  const handleFileSelect = React.useCallback(
    (optionId: string, file: File | null) => {
      setFiles((prev) => ({ ...prev, [optionId]: file }));
      setValue(optionId, file ? file.name : "");
    },
    [setValue]
  );

  if (activeOptions.length === 0) return null;

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Customization Options
      </h3>

      {activeOptions.map((option) => (
        <div key={option.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
              {option.name}
              {option.is_required && <span className="text-destructive ml-1">*</span>}
            </label>
            {parsePrice(option.price_modifier) !== 0 && (
              <span className="text-xs font-semibold text-primary">
                {parsePrice(option.price_modifier) > 0 ? "+" : ""}
                {formatPrice(parsePrice(option.price_modifier), currencySymbol)}
              </span>
            )}
          </div>

          {option.help_text && (
            <p className="text-[10px] text-muted-foreground">{option.help_text}</p>
          )}

          {renderField(option, values, setValue, errors, files, handleFileSelect)}

          {errors[option.id] && (
            <p className="text-[10px] font-bold text-destructive">{errors[option.id]}</p>
          )}
        </div>
      ))}

      {totalModifier !== 0 && (
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm font-bold">
          <span>Customization Total</span>
          <span className={totalModifier > 0 ? "text-primary" : "text-success-600"}>
            {totalModifier > 0 ? "+" : ""}{formatPrice(totalModifier, currencySymbol)}
          </span>
        </div>
      )}
    </div>
  );
}

function renderField(
  option: CustomizationOption,
  values: CustomizationValues,
  setValue: (id: string, val: string) => void,
  errors: Record<string, string>,
  files: Record<string, File | null>,
  onFileSelect: (id: string, file: File | null) => void
) {
  const value = values[option.id] || "";
  const hasError = !!errors[option.id];

  switch (option.option_type) {
    case "text":
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(option.id, e.target.value)}
          placeholder={option.placeholder || undefined}
          className={cn(
            "h-10 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
            hasError ? "border-destructive" : "border-border"
          )}
        />
      );

    case "textarea":
      return (
        <textarea
          value={value}
          onChange={(e) => setValue(option.id, e.target.value)}
          placeholder={option.placeholder || undefined}
          rows={3}
          className={cn(
            "min-h-[80px] w-full rounded-xl border bg-background p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
            hasError ? "border-destructive" : "border-border"
          )}
        />
      );

    case "select":
      return (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => setValue(option.id, e.target.value)}
            className={cn(
              "h-10 w-full appearance-none rounded-xl border bg-background px-4 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
              hasError ? "border-destructive" : "border-border"
            )}
          >
            <option value="">{option.placeholder || "Select an option..."}</option>
            {(option.choices || []).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      );

    case "color":
      return (
        <div className="flex flex-wrap gap-2">
          {(option.choices || []).map((choice) => {
            const selected = value === choice;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => setValue(option.id, selected ? "" : choice)}
                className={cn(
                  "h-9 min-w-[4rem] rounded-xl border-2 px-3 text-xs font-bold uppercase tracking-wider transition-all",
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/30"
                )}
              >
                {choice}
              </button>
            );
          })}
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(option.id, e.target.value)}
          placeholder={option.placeholder || undefined}
          min={option.min_value ?? undefined}
          max={option.max_value ?? undefined}
          className={cn(
            "h-10 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
            hasError ? "border-destructive" : "border-border"
          )}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => setValue(option.id, e.target.checked ? "true" : "false")}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {option.placeholder || "Enable this option"}
          </span>
        </label>
      );

    case "file":
    case "image":
      const file = files[option.id];
      return (
        <div>
          <label
            className={cn(
              "flex h-20 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-primary/40",
              hasError ? "border-destructive" : "border-border/60"
            )}
          >
            {file ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onFileSelect(option.id, null);
                  }}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload size={20} />
                <span className="text-xs">
                  {option.placeholder || `Upload ${option.option_type}`}
                </span>
              </div>
            )}
            <input
              type="file"
              accept={option.allowed_file_types || undefined}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                onFileSelect(option.id, f);
              }}
              className="hidden"
            />
          </label>
          {option.max_file_size && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Max file size: {option.max_file_size}MB
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
