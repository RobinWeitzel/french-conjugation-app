import { useUpdateCheck } from '../hooks/useDatabase';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-indigo-500 px-4 py-2 text-sm text-white">
      <span>Version {updateAvailable} available</span>
      <button
        onClick={applyUpdate}
        className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/30"
      >
        Update
      </button>
    </div>
  );
}
