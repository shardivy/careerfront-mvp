import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";

// ---------------------------------------------------------------------------
// Shared field primitives (label, text/date/select/number inputs, checkbox,
// and the autocomplete-style assessment-name field). Every wizard step —
// General Info, Version Settings, Grade Mapping, Structure, etc. — pulls
// these from here so styling stays consistent in one place.
// ---------------------------------------------------------------------------

export const FieldLabel = ({ children, required }) => (
  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
    {children}
    {required && <span className={cn(adminTheme.text.danger, "ml-0.5")}>*</span>}
  </label>
);

export const TextInput = ({ id, value, onChange, placeholder, disabled, required = false, error }) => (
  <div>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn(
        "h-11 w-full text-sm",
        adminTheme.radius.md,
        adminTheme.border.default,
        "border px-3 text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        error && "border-red-300 focus:ring-red-200"
      )}
    />
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export const AssessmentNameField = ({ id, value, onChange, placeholder, required = false, error, options = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredOptions = options.filter((option) => {
    const normalizedValue = String(value || "").trim().toLowerCase();
    const normalizedOption = option.toLowerCase();

    if (!normalizedValue) {
      return true;
    }

    return normalizedOption.includes(normalizedValue);
  });

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onChange(event);
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    const syntheticEvent = {
      target: {
        value: option,
      },
    };

    setInputValue(option);
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "h-11 w-full pr-10 text-sm",
          adminTheme.radius.md,
          adminTheme.border.default,
          "border px-3 text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
          error && "border-red-300 focus:ring-red-200"
        )}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
      />
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 transition hover:text-slate-600"
        aria-label="Toggle assessment name options"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelectOption(option)}
              className="flex min-h-9 w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export const DateInput = ({ id, value, onChange, error }) => (
  <div>
    <input
      id={id}
      type="date"
      value={value}
      onChange={onChange}
      className={cn(
        "h-11 w-full text-sm",
        adminTheme.radius.md,
        adminTheme.border.default,
        "border px-3 text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        error && "border-red-300 focus:ring-red-200"
      )}
    />
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export const SelectInput = ({ id, value, onChange, options, required = false, error }) => (
  <div>
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={cn(
        "h-11 w-full text-sm",
        adminTheme.radius.md,
        adminTheme.border.default,
        "border bg-white px-3 text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
        error && "border-red-300 focus:ring-red-200"
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export const NumberInput = ({ id, value, onChange, icon: Icon, suffix, error }) => (
  <div>
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        className={cn(
          "h-11 w-full text-sm",
          adminTheme.radius.md,
          adminTheme.border.default,
          "border text-slate-900",
          Icon ? "pl-9" : "pl-3",
          suffix ? "pr-9" : "pr-3",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/10",
          error && "border-red-300 focus:ring-red-200"
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      )}
    </div>
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export const Checkbox = ({ id, checked, onChange, title, description }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
    />
    <span>
      <span className="block text-sm font-medium text-slate-900">{title}</span>
      {description && <span className="block text-xs text-slate-400">{description}</span>}
    </span>
  </label>
);