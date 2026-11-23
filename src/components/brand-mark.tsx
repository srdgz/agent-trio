export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className={className}>
      <circle cx="18" cy="9" r="7" fill="#5c7cfa" />
      <circle cx="8" cy="13" r="4.500" fill="#8f7bf5" />
      <circle cx="16" cy="21" r="5" fill="#6cb6f7" />
    </svg>
  );
}
