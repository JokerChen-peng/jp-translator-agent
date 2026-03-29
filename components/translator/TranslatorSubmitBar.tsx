'use client';

type Props = {
  disabled: boolean;
  onSubmit: () => void;
  label: string;
};

export function TranslatorSubmitBar({ disabled, onSubmit, label }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSubmit}
      className="mt-4 w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
    >
      {label}
    </button>
  );
}
