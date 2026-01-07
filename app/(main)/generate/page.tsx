import type { Metadata } from 'next';
import GenerateClient from './GenerateClient';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Generate Image - Rupantar AI',
    description: 'Create amazing AI photos with Rupantar AI. Upload your photo and watch the magic happen.',
  };
}

export default function GeneratePage() {
  return <GenerateClient />;
}
