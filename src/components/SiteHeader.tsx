"use client";

interface SiteHeaderProps {
  active?: "home" | "sofa" | "guess";
}

export default function SiteHeader({ active = "home" }: SiteHeaderProps) {
  return (
    <header className="site-topbar">
      <a className="site-topbar-brand" href="/" lang="en">
        PLACE × ENALA
      </a>
      <nav className="site-topbar-nav" aria-label="الألعاب">
        <a className={`site-topbar-btn ${active === "sofa" ? "is-active" : ""}`} href="/sofa">
          اصنع كنبتك <span aria-hidden>★★★★★</span>
        </a>
        <a className={`site-topbar-btn is-game ${active === "guess" ? "is-active" : ""}`} href="/guess">
          خمن السعر
        </a>
      </nav>
    </header>
  );
}
