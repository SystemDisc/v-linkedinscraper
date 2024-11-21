// ==UserScript==
// @name         LinkedIn Scraper
// @namespace    http://tampermonkey.net/
// @version      2024-11-21
// @description  try to save the world!
// @author       CloneOfNone
// @match        https://www.linkedin.com/jobs/search/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// @run-at       document-idle
// @require      https://cdn.jsdelivr.net/npm/csv-stringify@6.5.1/dist/iife/sync.min.js
// ==/UserScript==

(function () {
  'use strict';

  // https://stackoverflow.com/a/45411081
  function scrollParentToChild(parent, child) {
    // Where is the parent on page
    var parentRect = parent.getBoundingClientRect();
    // What can you see?
    var parentViewableArea = {
      height: parent.clientHeight,
      width: parent.clientWidth,
    };

    // Where is the child
    var childRect = child.getBoundingClientRect();
    // Is the child viewable?
    var isViewable =
      childRect.top >= parentRect.top &&
      childRect.bottom <= parentRect.top + parentViewableArea.height;

    // if you can't see the child try to scroll parent
    if (!isViewable) {
      // Should we scroll using top or bottom? Find the smaller ABS adjustment
      const scrollTop = childRect.top - parentRect.top;
      const scrollBot = childRect.bottom - parentRect.bottom;
      if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
        // we're near the top of the list
        parent.scrollTop += scrollTop;
      } else {
        // we're near the bottom of the list
        parent.scrollTop += scrollBot;
      }
    }
  }

  const jobTitleSelector = '.job-details-jobs-unified-top-card__job-title';
  const companyNameSelector =
    '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > div.display-flex.align-items-center > div.display-flex.align-items-center.flex-1 > div > a';
  const areaSelector =
    '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > div.job-details-jobs-unified-top-card__primary-description-container > div > span:nth-child(1)';
  const areaVerboseSelector =
    'div.job-details-jobs-unified-top-card__title-container > div';
  const salarySelector =
    '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > button > div:nth-child(1) > span';
  const benefitsSelector = '#SALARY > .job-details-module';
  const senioritySelector =
    '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div:nth-child(1) > div > div:nth-child(7) > div.jobs-premium-applicant-insights.artdeco-card.premium-accent-bar > div.jobs-premium-applicant-insights__row-container.flex-column > div.jobs-details-premium-insight.jobs-details-premium-insight--row.jobs-details-premium-insight--left-column.applicant-experience > ul > li:nth-child(1) > p';

  const jobs = [];

  let grabJob = () => {
    const jobTitleElem = document.querySelector(jobTitleSelector);
    const companyNameElem = document.querySelector(companyNameSelector);
    const areaElem = document.querySelector(areaSelector);
    const areaVerboseElem = document.querySelector(areaVerboseSelector);
    const salaryElem = document.querySelector(salarySelector);
    const seniorityElem = document.querySelector(senioritySelector);
    const benefitsElem = document.querySelector(benefitsSelector);

    const jobTitle = jobTitleElem.textContent.trim();
    const companyName = companyNameElem.textContent.trim();
    const area = areaElem.textContent.trim();
    const remoteType =
      areaVerboseElem.textContent.trim().match(/(\(.+?\))$/)?.[1] ?? 'On-Site';
    const salary = salaryElem?.textContent.trim() ?? '?';
    const startSalary = salary.startsWith('$') ? salary.split(' - ')[0] : '?';
    const endSalary = salary.startsWith('$')
      ? salary.split(' - ')[1] || startSalary
      : startSalary;
    const seniority = seniorityElem.textContent.trim().split(/\s/)[1];
    const benefits = benefitsElem?.textContent.trim() ?? 'Unknown';

    const job = {
      'Job Title': jobTitle,
      'Company Name': companyName,
      Area: area,
      'Work Type': remoteType,
      'Start Salary': startSalary,
      'End Salary': endSalary,
      Seniority: seniority,
      Benefits: benefits,
    };

    jobs.push(job);

    console.log(JSON.stringify(job, null, 2));

    const jobItemSelector = '.job-card-container--clickable';
    const jobItemActiveClass = 'jobs-search-results-list__list-item--active';

    const parentElem = document.querySelector('.jobs-search-results-list');

    const jobItems = document.querySelectorAll(jobItemSelector);
    let found = false;
    const nextJob = [...jobItems].find((j) => {
      if (found) {
        return true;
      }
      found = j.classList.contains(jobItemActiveClass);
      return false;
    });

    if (nextJob) {
      scrollParentToChild(parentElem, nextJob);
      parentElem.scrollTop += 100;
      nextJob.querySelector('a').click();
    }
  };

  document.addEventListener(
    'keyup',
    function (e) {
      if (
        e.code == 'KeyG' &&
        !e.shiftKey &&
        !e.ctrlKey &&
        e.altKey &&
        !e.metaKey
      ) {
        grabJob();
      }
    },
    false
  );

  document.addEventListener(
    'keyup',
    function (e) {
      if (
        e.code == 'KeyS' &&
        !e.shiftKey &&
        !e.ctrlKey &&
        e.altKey &&
        !e.metaKey
      ) {
        console.log(csv_stringify_sync.stringify(jobs));
      }
    },
    false
  );
})();
