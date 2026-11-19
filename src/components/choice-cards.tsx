import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Radio buttons styled as tappable cards in the brand colours. Works without JavaScript and
 * replaces native drop-downs, which phones render in their own grey style.
 */
export function ChoiceCards({
  name,
  options,
  defaultValue,
  columns = "sm:grid-cols-2",
  size = "md",
  required = true,
}: {
  name: string;
  options: { value: string; label: string; hint?: string }[];
  defaultValue?: string | null;
  columns?: string;
  size?: "sm" | "md";
  required?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-2", columns)}>
      {options.map((o, i) => (
        <label
          key={o.value}
          className={cn(
            "group relative flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white transition",
            "hover:border-brand-300 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600/15",
            "has-focus-visible:ring-2 has-focus-visible:ring-brand-500/40",
            size === "sm" ? "justify-center px-3 py-2.5 text-center has-checked:bg-brand-600" : "px-4 py-3",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
            required={required && i === 0}
            className="peer sr-only"
          />
          {size === "md" && (
            <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-slate-300 group-has-checked:border-brand-600 group-has-checked:bg-brand-600">
              <Check className="size-3 text-white opacity-0 group-has-checked:opacity-100" strokeWidth={3} />
            </span>
          )}
          <span className="min-w-0">
            <span className={cn("block text-sm font-semibold text-slate-800", size === "sm" ? "group-has-checked:text-white" : "group-has-checked:text-brand-900")}>{o.label}</span>
            {o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export function FieldGroup({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-800">{label}</legend>
      {hint && <p className="-mt-1 mb-2 text-xs text-slate-500">{hint}</p>}
      {children}
    </fieldset>
  );
}
