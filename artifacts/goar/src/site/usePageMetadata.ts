import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { pageMetadata } from './data/pageMetadata';

export function usePageMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    const page = pageMetadata[location === '/index.html' ? '/' : location] || { title: 'Page not found — Goar', description: 'This page could not be found. Return to the Goar marketing page or connected services.' };
    document.title = page.title;
    for (const [attribute, key, content] of [
      ['name', 'description', page.description],
      ['property', 'og:title', page.title],
      ['property', 'og:description', page.description],
      ['name', 'twitter:title', page.title],
      ['name', 'twitter:description', page.description],
    ]) {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    }
  }, [location]);
}