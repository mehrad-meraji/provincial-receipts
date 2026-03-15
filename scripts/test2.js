const fs = require('fs');
const cheerio = require('cheerio');

const BUDGET_YEAR = '2025-26'

function parseDollarString(raw, unit) {
  const negative = raw.includes('(')
  const cleaned = raw.replace(/[$(),\s]/g, '')
  if (!cleaned || cleaned === '') throw new Error(`Cannot parse dollar string: "${raw}"`)

  const [intPart, fracPart = ''] = cleaned.split('.')
  const intVal = BigInt(intPart || '0')
  const fracDigit = fracPart.length > 0 ? BigInt(fracPart[0]) : 0n

  let cents
  if (unit === 'billions') {
    cents = intVal * 100_000_000_000n + fracDigit * 10_000_000_000n
  } else {
    cents = intVal * 100_000_000n + fracDigit * 10_000_000n
  }

  return negative ? -cents : cents
}

const html = fs.readFileSync('/tmp/budget.html', 'utf8');
const $ = cheerio.load(html);

const fiscalValues = new Map();
const ministries = [];

function findYearColumnIndex(table) {
  let colIndex = -1;
  // ONLY look at the first row (headers) to prevent flattened indexing bugs
  $(table).find('tr').first().find('th, td').each((idx, th) => {
    const text = $(th).text().replace(/–/g, '-').replace(/\s+/g, '');
    if (text.includes(BUDGET_YEAR)) {
      colIndex = idx;
    }
  });
  return colIndex;
}

function getTableUnit(table) {
  const text = $(table).text().toLowerCase();
  return text.includes('billions') ? 'billions' : 'millions';
}

function dumpPass2() {
  $('table').each((_i, table) => {
    const caption = $(table).find('caption').text().toLowerCase()
    if (!caption.includes('expense')) return

    const colIndex = findYearColumnIndex(table)
    if (colIndex === -1) return

    const unit = getTableUnit(table)

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('th, td')
      if (cells.length <= colIndex) return

      let name = $(cells[0]).text().trim()
      if (!name) return

      const lowerName = name.toLowerCase()
      if (lowerName === 'total expense' || lowerName.includes('total base programs') || lowerName.includes('significant exceptional') || lowerName.includes('interest and other debt')) {
        return
      }

      name = name.replace(/\(Total\)/i, '').replace(/\(Base\)/i, '').trim()

      const valueText = $(cells[colIndex]).text().trim()
      if (!valueText || valueText === '–') return

      try {
        const amount = parseDollarString(valueText, unit)
        if (amount > 0n) {
          const existing = ministries.find(m => m.name === name)
          if (existing) existing.amount = existing.amount < amount ? amount : existing.amount
          else ministries.push({ name, amount })
        }
      } catch {
        // skip
      }
    })
  })

  console.log(ministries.map(m => m.name));
}

dumpPass2();
