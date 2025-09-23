import { goto } from '$app/navigation';
import type { Page } from '@sveltejs/kit';

import type { TransactionType } from '@prisma/client';

import { currencyNumberFormatter } from './helpers';

type PageType = Page<Record<string, string>, string>;

export abstract class Filter {
  public query: URLSearchParams;

  constructor(public page: PageType) {
    this.query = new URLSearchParams(this.page.url.searchParams.toString());
  }

  public apply() {
    this.query.delete('page');
    goto(`?${this.query.toString()}`);
  }

  public updatePage(page: PageType) {
    this.page = page;
    this.query = new URLSearchParams(this.page.url.searchParams.toString());
  }

  abstract remove(): void;
  abstract toString(): string;
}

export class AmountFilter extends Filter {
  public minAmount: number;
  public maxAmount: number;

  constructor(page: PageType, { min, max }: { min?: number; max?: number }) {
    super(page);
    this.minAmount = min;
    this.maxAmount = max;
    if (min) {
      this.query.set('minAmount', min.toString());
    }
    if (max) {
      this.query.set('maxAmount', max.toString());
    }
  }

  remove() {
    this.query.delete('minAmount');
    this.query.delete('maxAmount');
    this.apply();
  }

  toString() {
    let output = '';
    if (this.minAmount) {
      output += `از ${currencyNumberFormatter(this.minAmount)} تومان `;
    }
    if (this.maxAmount) {
      output += `تا ${currencyNumberFormatter(this.maxAmount)} تومان`;
    }
    return output;
  }
}

export class DateFilter extends Filter {
  public minDate: number;
  public maxDate: number;

  constructor(page: PageType, { min, max }: { min?: number; max?: number }) {
    super(page);
    this.minDate = min;
    this.maxDate = max;
    if (min) {
      this.query.set('minDate', min.toString());
    }
    if (max) {
      this.query.set('maxDate', max.toString());
    }
  }

  remove() {
    this.query.delete('minDate');
    this.query.delete('maxDate');
    this.apply();
  }

  toString() {
    let output = '';
    if (this.minDate) {
      const minDateAsString = new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'persian',
      }).format(new Date(this.minDate));
      output += `از ${minDateAsString} `;
    }
    if (this.maxDate) {
      const maxDateAsString = new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        calendar: 'persian',
      }).format(new Date(this.maxDate));
      output += `تا ${maxDateAsString}`;
    }
    return output;
  }
}

export class PartyFilter extends Filter {
  public party: string;

  constructor(page: PageType, { party }: { party: string }) {
    super(page);
    this.party = party;
    this.query.set('party', party);
  }

  remove() {
    this.query.delete('party');
    this.apply();
  }

  toString() {
    return this.party;
  }
}

export class TypeFilter extends Filter {
  public type: TransactionType;

  constructor(page: PageType, { type }: { type: TransactionType }) {
    super(page);
    this.type = type;
    this.query.set('type', type);
  }

  remove() {
    this.query.delete('type');
    this.apply();
  }

  toString() {
    return this.type === 'WITHDRAW' ? 'پرداخت' : 'دریافت';
  }
}

export class DescriptionFilter extends Filter {
  public keywords: string;

  constructor(page: PageType, { keywords }: { keywords: string }) {
    super(page);
    this.keywords = keywords;
    this.query.set('keywords', keywords);
  }

  remove() {
    this.query.delete('keywords');
    this.apply();
  }

  toString() {
    return `جستوجو : ${this.keywords}`;
  }
}
