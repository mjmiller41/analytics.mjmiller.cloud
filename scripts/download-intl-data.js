import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import chalk from 'chalk';

const src = path.resolve(process.cwd(), 'public/intl/messages');
const files = fs.readdirSync(src);

const DATA_CONFIGS = {
  countries: {
    dest: path.resolve(process.cwd(), 'public/intl/country'),
    getUrl: locale =>
      `https://raw.githubusercontent.com/umpirsky/country-list/master/data/${locale}/country.json`,
  },
  languages: {
    dest: path.resolve(process.cwd(), 'public/intl/language'),
    getUrl: locale =>
      `https://raw.githubusercontent.com/umpirsky/language-list/master/data/${locale}/language.json`,
  },
};

const parseTypeArg = () => {
  const arg = process.argv.slice(2).find(a => a.startsWith('--type=') || a === '-t');
  if (!arg) return 'all';
  if (arg.startsWith('--type=')) {
    return arg.split('=')[1];
  }
  const idx = process.argv.indexOf(arg);
  return process.argv[idx + 1] || 'all';
};

const downloadFile = (url, filepath) =>
  new Promise(resolve => {
    https
      .get(url, res => {
        if (res.statusCode === 200) {
          const fileStream = fs.createWriteStream(filepath);
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log('Downloaded', chalk.greenBright('->'), filepath);
            resolve();
          });
        } else {
          res.resume();
          console.warn(`Warning: ${url} returned ${res.statusCode}`);
          resolve();
        }
      })
      .on('error', err => {
        console.error(`Error downloading ${url}:`, err.message);
        resolve();
      });
  });

const downloadDataset = async (_type, config) => {
  const { dest, getUrl } = config;
  fs.mkdirSync(dest, { recursive: true });

  for (const file of files) {
    const locale = file.replace('-', '_').replace('.json', '');
    const filename = path.join(dest, file);

    if (!fs.existsSync(filename)) {
      const url = getUrl(locale);
      await downloadFile(url, filename);
    }
  }
};

const run = async () => {
  const type = parseTypeArg();

  if (type === 'all' || type === 'countries') {
    await downloadDataset('countries', DATA_CONFIGS.countries);
  }
  if (type === 'all' || type === 'languages') {
    await downloadDataset('languages', DATA_CONFIGS.languages);
  }
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
