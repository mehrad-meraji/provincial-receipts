const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('/tmp/budget.html', 'utf8');
const $ = cheerio.load(html);

const fiscalValues = new Map();

$('table tr').each((i, row) => {
  const cells = $(row).find('th, td');
  if (cells.length < 2) return;
  const label = $(cells[0]).text().trim().toLowerCase();
  const val = $(cells[cells.length - 1]).text().trim();
  
  if (label.includes('total revenue')) {
    console.log('ROW:', label, '=>', val);
  } else if (label.includes('total expense') || label.includes('total expenditure')) {
    console.log('ROW:', label, '=>', val);
  }
});
