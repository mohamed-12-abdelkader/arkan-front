type PageLoaderProps = {
  label?: string;
  variant?: "screen" | "page" | "inline";
};

export function PageLoader({
  label = "جاري تجهيز الصفحة",
  variant = "page",
}: PageLoaderProps) {
  return (
    <div
      className={`page-loader page-loader--${variant}`}
      role="status"
      aria-live="polite"
    >
      <div className="page-loader__mark" aria-hidden>
        <span className="page-loader__orbit" />
        <span className="page-loader__core">
          <i />
          <i />
          <i />
        </span>
      </div>
      <p className="page-loader__label">{label}</p>
      <span className="page-loader__track" aria-hidden>
        <span />
      </span>
    </div>
  );
}
