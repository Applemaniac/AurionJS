const puppeteer = require('puppeteer');

const username = "";
const password = "";

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // On se connecte à Aurion
    await page.goto('https://aurion.junia.com/faces/Login.xhtml');
    await page.focus('#username');
    await page.keyboard.type(username);
    await page.focus('#password');
    await page.keyboard.type(password);
    page.click("#j_idt28");
    // On est arrivé sur la page de compte ! Et on attend que la page charge (c'est super long...)
    await page.waitForNavigation();
    await page.evaluate(() =>{
        return findElemByText({})
    });
    await page.screenshot({ path: 'example.png' });

    await browser.close();
})();