import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

const BASE_URL = "https://nawbahar.lovable.app";
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/zybySje5X2OUxtaoDlck6DzKJUt1/social-images/social-1767946514078-آیکن.png";

export function SEOHead({
  title,
  description = "پلتفرم انتشار محتوای تخصصی برای نخبگان افغانستانی. مقالات علمی، تحلیلی و فرهنگی با کیفیت بالا.",
  ogImage = DEFAULT_OG_IMAGE,
  ogUrl,
  ogType = "website",
  jsonLd,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title === "نوبهار" ? "نوبهار - جامعه نخبگان" : `${title} | نوبهار`;
  const canonicalUrl = ogUrl ? `${BASE_URL}${ogUrl}` : undefined;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    if (noIndex) setMeta("name", "robots", "noindex, nofollow");
    else setMeta("name", "robots", "index, follow");

    // OG
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:type", ogType);
    if (canonicalUrl) setMeta("property", "og:url", canonicalUrl);

    // Twitter
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    } else if (link) {
      link.remove();
    }

    // JSON-LD
    const existingLd = document.querySelector('script[data-seo-jsonld]');
    if (existingLd) existingLd.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.querySelector('script[data-seo-jsonld]');
      if (ld) ld.remove();
    };
  }, [fullTitle, description, ogImage, ogType, canonicalUrl, jsonLd, noIndex]);

  return null;
}
