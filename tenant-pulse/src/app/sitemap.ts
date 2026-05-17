import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tenant-pulse.com';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    const clausesDir = path.join(process.cwd(), 'src', 'content', 'clauses');
    if (fs.existsSync(clausesDir)) {
      const files = fs.readdirSync(clausesDir).filter(file => file.endsWith('.json'));
      
      files.forEach(file => {
        const keyword = file.replace('.json', '');
        let lastModified = new Date();
        
        try {
           const content = fs.readFileSync(path.join(clausesDir, file), 'utf8');
           const data = JSON.parse(content);
           if (data.publish_date) {
             const parsedDate = new Date(data.publish_date);
             if (!isNaN(parsedDate.getTime())) {
                lastModified = parsedDate;
             }
           }
        } catch {}

        // Tenant Pulse A/B Test: Dump everything immediately regardless of date
        routes.push({
          url: `${baseUrl}/clause/${keyword}`,
          lastModified,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return routes;
}
