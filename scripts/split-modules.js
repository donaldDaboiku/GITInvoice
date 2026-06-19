const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'GITInvoice.js'), 'utf8').split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function write(file, start, end, header) {
  fs.writeFileSync(path.join(root, 'js', file), header + '\n' + slice(start, end) + '\n');
}

write('demo-data.js', 5, 115, "// GITInvoice — demo seed data\n'use strict';");
write('utils.js', 2689, 2792, "// GITInvoice — shared utilities\n'use strict';");
write(
  'inventory.js',
  435,
  849,
  "// GITInvoice — products, expenses, quotes, catalogue\n'use strict';\n" +
    'let currentProduct = null;\n' +
    'let currentExpense = null;\n' +
    'let currentQuote = null;\n' +
    "let _pickerTargetContainer = null;\n" +
    "let _pickerSearchTerm = '';"
);
write(
  'invoices.js',
  1323,
  2017,
  "// GITInvoice — invoices, dashboard, line items\n'use strict';\n" +
    'let currentInvoice = null;\n' +
    'let currentViewInvoice = null;'
);
write(
  'customers.js',
  2143,
  2400,
  "// GITInvoice — customer management and email marketing\n'use strict';\n" +
    'let currentCustomer = null;'
);
write('settings.js', 2019, 2141, "// GITInvoice — app settings, theme, logo, footer\n'use strict';");
write(
  'reports.js',
  2402,
  2605,
  "// GITInvoice — reports and charts\n'use strict';\n" +
    'let revenueChart = null;\n' +
    'let statusChart = null;'
);

const convert = slice(850, 868);
const invPath = path.join(root, 'js', 'invoices.js');
let inv = fs.readFileSync(invPath, 'utf8').trimEnd() + '\n\n' + convert + '\n';
fs.writeFileSync(invPath, inv);

let invContent = fs.readFileSync(path.join(root, 'js', 'inventory.js'), 'utf8');
invContent = invContent.replace(/^let currentProduct = null;\r?\n/m, '');
invContent = invContent.replace(/^let currentExpense = null;\r?\n/m, '');
invContent = invContent.replace(/^let currentQuote = null;\r?\n/m, '');
invContent = invContent.replace(/^let _pickerTargetContainer = null;.*\r?\n/m, '');
invContent = invContent.replace(/^let _pickerSearchTerm = '';\r?\n/m, '');
fs.writeFileSync(path.join(root, 'js', 'inventory.js'), invContent);

const keep = [];
for (let i = 0; i < lines.length; i++) {
  const n = i + 1;
  if (n >= 5 && n <= 115) continue;
  if (n >= 117 && n <= 122) continue;
  if (n >= 435 && n <= 868) continue;
  if (n >= 1323 && n <= 2017) continue;
  if (n >= 2019 && n <= 2141) continue;
  if (n >= 2143 && n <= 2400) continue;
  if (n >= 2402 && n <= 2605) continue;
  if (n >= 2689 && n <= 2792) continue;
  keep.push(lines[i]);
}

const header = `// GITInvoice — app shell (navigation, users, notifications, init)
// Modules loaded via index.html before this file.
'use strict';

`;

fs.writeFileSync(path.join(root, 'GITInvoice.js'), header + keep.join('\n'));
console.log('Split complete. Main file lines:', keep.length + 4);
