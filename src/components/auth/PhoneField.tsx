import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskTelefone, onlyDigits, validateTelefone } from "@/lib/validators";

type PhoneFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (digits11: string, masked: string) => void;
  disabled?: boolean;
};

export function PhoneField({
  id = "whatsapp",
  label = "WhatsApp",
  value,
  onChange,
  disabled,
}: PhoneFieldProps) {
  const masked = maskTelefone(value);
  const err = validateTelefone(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="(71) 9 9675-5745"
        value={masked}
        disabled={disabled}
        onChange={(e) => {
          const digits = onlyDigits(e.target.value).slice(0, 11);
          onChange(digits, maskTelefone(digits));
        }}
      />
      {err && value.length > 0 && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
