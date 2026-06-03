export default function Logo({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center bg-green-600 rounded-2xl flex-shrink-0`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3/4 h-3/4">
        <rect x="17" y="4" width="6" height="32" rx="3" fill="white" />
        <rect x="4" y="17" width="32" height="6" rx="3" fill="white" />
      </svg>
    </div>
  );
}
