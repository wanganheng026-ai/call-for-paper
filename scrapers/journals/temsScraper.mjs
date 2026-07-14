import { createIEEEScraper } from './utils/ieee.mjs';

export const scraperObject = createIEEEScraper('IEEE Transactions on Engineering Management', 'tems', 'https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=17');
