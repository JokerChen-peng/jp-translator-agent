'use client';

type Props = {
  open: boolean;
  previewUrl: string | null;
  onClose: () => void;
};

export function ImagePreviewLightbox({ open, previewUrl, onClose }: Props) {
  if (!open || !previewUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="图片大图预览"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-md hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        关闭
      </button>
      <img
        src={previewUrl}
        alt="大图预览"
        className="max-h-[min(90vh,100%)] max-w-[min(95vw,100%)] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
