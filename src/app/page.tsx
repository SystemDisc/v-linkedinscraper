import ScrapeUI from '@/components/molecules/scrape-ui';

export default async function Home() {
  return (
    <div className="mx-auto max-w-4xl mt-4 p-4 dark:bg-neutral-700 rounded border border-neutral-500 shadow-md dark:shadow-neutral-500 shadow-neutral-700">
      <ScrapeUI />
    </div>
  );
}
