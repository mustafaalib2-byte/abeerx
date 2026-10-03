import Script from 'next/script';

export function Analytics() {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
  // Google Ads account tag, e.g. AW-123456789 (Google Ads > Goals > Conversions > your purchase action)
  const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const TAG_ID = GA_TRACKING_ID || ADS_ID;

  return (
    <>
      {/* Google tag (GA4 and/or Google Ads share one gtag.js) */}
      {TAG_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${TAG_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${GA_TRACKING_ID ? `gtag('config', '${GA_TRACKING_ID}');` : ''}
              ${ADS_ID ? `gtag('config', '${ADS_ID}', { allow_enhanced_conversions: true });` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
