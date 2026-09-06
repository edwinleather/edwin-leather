const res = await fetch('https://www.edwinleather.com');
const html = await res.text();
const desc = html.match(/name="description" content="([^"]+)"/)?.[1];
console.log('Meta description:', desc);
const sitemap = await fetch('https://www.edwinleather.com/sitemap.xml');
const text = await sitemap.text();
const firstUrl = text.match(/<loc>([^<]+)<\/loc>/)?.[1];
console.log('Sitemap first URL:', JSON.stringify(firstUrl));
