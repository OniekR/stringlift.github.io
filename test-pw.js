const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto('http://localhost:8000/index.html', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#resultValue');

    // Ensure initial calc runs
    await new Promise(r => setTimeout(r, 200));
    let result = await page.$eval('#resultValue', el => el.textContent.trim());
    console.log('Initial resultValue:', result);

    // Set pressure and trigger input
    await page.evaluate(() => {
      const p = document.getElementById('pressure');
      p.value = '345';
      p.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 200));
    result = await page.$eval('#resultValue', el => el.textContent.trim());
    console.log('After setting pressure 345 bar ->', result);

    // Set inner custom and save (persistence)
    await page.evaluate(() => {
      const inner = document.getElementById('innerD_custom');
      inner.value = '5 7/8';
      inner.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 200));
    const raw = await page.evaluate(() => localStorage.getItem('stringlift.formState.v1'));
    console.log('localStorage saved (present?):', raw ? 'yes' : 'no');
    console.log('localStorage content:', raw);

  } catch (err) {
    console.error('Test failed', err);
    process.exit(2);
  } finally {
    await browser.close();
  }
  process.exit(0);
})();
