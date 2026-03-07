import { PurgeCSS } from 'purgecss';
import {
  CSS_DEAD_CONTENT_FILES,
  CSS_DEAD_CSS_FILES,
  CSS_DEAD_MESSAGES,
  CSS_DEAD_SAFELIST_STANDARD,
} from './config/css.js';

const purgecss = new PurgeCSS();

const results = await purgecss.purge({
  css: CSS_DEAD_CSS_FILES,
  content: CSS_DEAD_CONTENT_FILES,
  safelist: {
    standard: CSS_DEAD_SAFELIST_STANDARD,
  },
  rejected: true,
});

const rejectedSelectors = [...new Set(results.flatMap((entry) => entry.rejected || []))].sort();

if (rejectedSelectors.length === 0) {
  console.log(CSS_DEAD_MESSAGES.clean);
  process.exit(0);
}

console.error(CSS_DEAD_MESSAGES.header);
for (const selector of rejectedSelectors) {
  console.error(`- ${selector}`);
}
process.exit(1);
