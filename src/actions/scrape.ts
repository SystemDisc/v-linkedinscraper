'use server';

import puppeteer from 'puppeteer';

export const doScrape = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--allow-third-party-cookies',
    ],
  });

  const page = await browser.newPage();

  console.log('Navigating to LinkedIn...');
  await page.goto('https://www.linkedin.com', { waitUntil: 'networkidle2' });

  console.log('Waiting for user to log in...');
  await page.waitForSelector('.global-nav__me', { timeout: 0 });
  console.log('User is logged in.');

  const searchURL =
    'https://www.linkedin.com/jobs/search/?currentJobId=&f_T=977&geoId=90000070&keywords=&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=R';
  await page.goto(searchURL, { waitUntil: 'load', timeout: 0 });
  console.log('Navigated to job search page.');

  const scrapedJobs: Array<{
    title: string;
    company: string;
    location: string;
  }> = [];
  let jobsScraped = 0;

  while (jobsScraped < 100) {
    console.log(`Scraping jobs, current count: ${jobsScraped}...`);

    await page.waitForSelector(
      '.jobs-search-results-list:not(.jobs-search-results-list--loading)'
    );

    await page.evaluate(async () => {
      const listElem = window.document.querySelector<HTMLElement>(
        '.jobs-search-results-list'
      )!;
      listElem.style.overflowY = 'visible';
      listElem.scrollTo({
        behavior: 'instant',
        top: listElem.scrollHeight,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    const jobElems = await page.$$('.job-card-container');
    const jobs: {
      title: string;
      company: string;
      location: string;
    }[] = [];
    for (const jobElem of jobElems) {
      const linkElem = await jobElem.$('.job-card-container__link');
      linkElem?.click();
      const title = linkElem?.toString().trim() || '';
      const company =
        jobElem
          .$('.job-card-container__primary-description')
          ?.toString()
          ?.trim() || '';
      const location =
        jobElem.$('.job-card-container__metadata-item')?.toString()?.trim() ||
        '';
      jobs.push({ title, company, location });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    await page.waitForSelector(
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text'
    );

    await page.evaluate(async () => {
      const listElem = window.document.querySelector<HTMLElement>(
        '.jobs-search-results-list'
      )!;
      listElem.scrollTo({
        behavior: 'instant',
        top: listElem.scrollHeight,
      });
    });

    for (const job of jobs) {
      if (jobsScraped >= 100) break;
      if (
        !scrapedJobs.some(
          (j) => j.title === job.title && j.company === job.company
        )
      ) {
        scrapedJobs.push(job);
        jobsScraped++;
      }
    }

    if (jobsScraped < 100) {
      const numberElems = await page.$$('.artdeco-pagination__indicator');
      let breakNext = false;
      for (const elem of numberElems) {
        if (breakNext) {
          await elem.evaluate((elem) => elem.querySelector('button')?.click());
          break;
        }
        if (
          await elem.evaluate((elem) => elem.classList.contains('selected'))
        ) {
          breakNext = true;
        }
      }
      if (breakNext) {
        await page.waitForNavigation({ waitUntil: 'load' });
      } else {
        console.log('No more pages available.');
        break;
      }
    }
  }

  console.log(`Scraping complete. Total jobs scraped: ${scrapedJobs.length}`);
  console.log(scrapedJobs);

  await browser.close();

  return scrapedJobs;
};
