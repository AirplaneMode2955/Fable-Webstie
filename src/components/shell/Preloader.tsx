/**
 * First-paint intro. Pure CSS, so it plays and clears itself before React
 * hydrates and can never trap the page behind it.
 */
export default function Preloader() {
  const name = 'Jett Iverson';
  return (
    <div className="preloader" aria-hidden="true">
      <span className="preloader-word font-headline italic text-primary">
        {Array.from(name).map((ch, i) => (
          <span key={i} className="preloader-mask">
            <span className="preloader-char" style={{ animationDelay: `${0.05 + i * 0.035}s` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          </span>
        ))}
      </span>
      <span className="preloader-rule" />
    </div>
  );
}
