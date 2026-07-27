/**
 * Website-style footer for the portal — mirrors the public site's footer
 * (explore links, contact, legal strip) so every portal page ends the same
 * way a website page does. Links point back at the public site.
 */
export function PortalFooter({
  brandName,
  websiteUrl,
  supportEmail,
  footerLogoUrl,
}: {
  brandName: string;
  websiteUrl: string;
  supportEmail: string;
  footerLogoUrl: string | null;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            {footerLogoUrl ? (
              <a href={websiteUrl} className="f-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={footerLogoUrl} alt={brandName} />
              </a>
            ) : (
              <h4>{brandName}</h4>
            )}
            <p className="blurb">
              Specialist bookkeeping and compliance support for trades and
              construction businesses across the UK.
            </p>
            <div className="foot-tags">
              <span>Xero Partner</span>
              <span>CIS</span>
              <span>VAT</span>
              <span>MTD</span>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <a className="fl" href={`${websiteUrl}/bookkeeping.html`}>Bookkeeping</a>
            <a className="fl" href={`${websiteUrl}/vat.html`}>VAT &amp; MTD</a>
            <a className="fl" href={`${websiteUrl}/construction.html`}>Construction &amp; CIS</a>
            <a className="fl" href={`${websiteUrl}/services.html`}>Services &amp; Pricing</a>
            <a className="fl" href={`${websiteUrl}/about.html`}>About</a>
          </div>
          <div>
            <h4>Get in touch</h4>
            <a className="fl" href={`mailto:${supportEmail}`}>{supportEmail}</a>
            <a className="fl" href={`${websiteUrl}/index.html#contact`}>Book a discovery call</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>&copy; {year} {brandName}. All rights reserved.</span>
          <span className="foot-legal">
            <a href={`${websiteUrl}/privacy.html`}>Privacy</a>
            <a href={`${websiteUrl}/terms.html`}>Terms</a>
            <a href={`${websiteUrl}/cookies.html`}>Cookies</a>
            <a href={`${websiteUrl}/accessibility.html`}>Accessibility</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
