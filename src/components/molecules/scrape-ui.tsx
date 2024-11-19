'use client';

import { doScrape } from '@/actions/scrape';
import { useState } from 'react';

export default function ScrapeUI() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex justify-center">
        <button
          className="rounded border border-black px-2 py-1 bg-neutral-200 hover:brightness-105 active:brightness-95 disabled:brightness-100 disabled:opacity-65 disabled:cursor-not-allowed"
          disabled={loading}
          type="button"
          onClick={async () => {
            setLoading(true);

            await doScrape();

            setLoading(false);
          }}
        >
          Scrape Jobs
        </button>
      </div>
      <progress
        className="[all:revert] !w-full"
        value={loading ? undefined : 0}
      ></progress>
    </div>
  );
}
