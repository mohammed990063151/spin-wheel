import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="gate">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <SiteHeader active="home" />

      <section className="gate-intro">
        <p className="gate-kicker">PLACE × ENALA — INDEX 2026</p>
        <h1>مسابقة عجلة الحظ</h1>
        <p>اختر الشاشة التفاعلية ثم سجّل بالاسم والجوال ولف العجلة</p>
      </section>

      <section className="gate-cards">
        <a className="gate-banner is-enala" href="/enala">
          <span className="gate-banner-media" aria-hidden>
            <img
              src="/brands/enala-villa.jpg"
              alt=""
              className="gate-banner-photo"
            />
            <span className="gate-banner-shine" />
            <span className="gate-banner-glow" />
          </span>
          <span className="gate-banner-frame" aria-hidden />
          <span className="gate-banner-badge">الجائزة الكبرى · ليلة مجانية</span>
          <span className="gate-banner-copy">
            <span className="gate-num">01</span>
            <strong lang="en">Enala</strong>
            <h2>فنادق إنالة</h2>
            <p>خصم 20% · كوبون 500 · كوبون 1000 · ليلة مجانية</p>
            <span className="gate-cta">دخول عجلة إنالة</span>
          </span>
        </a>

        <a className="gate-banner is-place" href="/place">
          <span className="gate-banner-media" aria-hidden>
            <img
              src="/brands/place-lounge.jpg"
              alt=""
              className="gate-banner-photo"
            />
            <span className="gate-banner-shine" />
            <span className="gate-banner-glow" />
          </span>
          <span className="gate-banner-frame" aria-hidden />
          <span className="gate-banner-badge">أثاث فاخر · خصم ووسادة وتركيب</span>
          <span className="gate-banner-copy">
            <span className="gate-num">02</span>
            <strong lang="en">Place</strong>
            <h2>مصنع الأثاث</h2>
            <p>خصم · وسادة · توصيل · تركيب</p>
            <span className="gate-cta">دخول عجلة Place</span>
          </span>
        </a>
      </section>
    </main>
  );
}
