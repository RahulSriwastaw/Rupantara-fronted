import type { Metadata } from 'next';
import GenerateClient from './GenerateClient';

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Ensure dynamic rendering to handle searchParams
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const templateId = searchParams.templateId;

  if (!templateId || Array.isArray(templateId)) {
    return {
      title: 'Generate Image - Rupantar AI',
      description: 'Create amazing AI photos with Rupantar AI. Upload your photo and watch the magic happen.',
    };
  }

  try {
    // Fetch template details from backend server-side
    // Using hardcoded production URL for stability or resolving process.env.NEXT_PUBLIC_API_URL if needed
    // Assuming backend returns standard template object
    const response = await fetch(`https://new-backend-g2gw.onrender.com/api/templates/${templateId}`, {
      // Revalidate often or use no-store if data changes frequently
      next: { revalidate: 60 }
    });

    if (response.ok) {
      const template = await response.json();
      const title = template.title || 'Amazing Template';
      const description = template.description || 'Try this AI photo template on Rupantar AI';
      let imageUrl = template.demoImage || template.imageUrl || template.image || '/logo.png';

      // Ensure we have an absolute URL for OG tags (Critical for WhatsApp)
      if (imageUrl && imageUrl.startsWith('/')) {
        // Prepend API base URL if relative (assuming image is served from backend)
        imageUrl = `https://new-backend-g2gw.onrender.com${imageUrl}`;
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        // Fallback or fix weird paths
        imageUrl = `https://rupantara-fronted.vercel.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      return {
        title: `${title} - Rupantar AI`,
        description: description,
        openGraph: {
          title: title,
          description: description,
          images: [
            {
              url: imageUrl,
              secureUrl: imageUrl.startsWith('https') ? imageUrl : undefined,
              type: 'image/jpeg', // Assuming largely jpegs, helps simple parsers
              width: 800,
              height: 1000, // Assuming vertical aspect
              alt: title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: title,
          description: description,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error('Error fetching template metadata:', error);
  }

  return {
    title: 'Generate with Template - Rupantar AI',
    description: 'Create your own version of this amazing AI photo template.',
  };
}

export default function GeneratePage() {
  return <GenerateClient />;
}
