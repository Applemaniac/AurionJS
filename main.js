const puppeteer = require('puppeteer');
const config = require("./config"); // Fichier avec 2 variables :  user et password.

const username = config.user;
const password = config.password;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    //await page.setDefaultNavigationTimeout(60000);
    // On se connecte à Aurion
    await page.goto('https://aurion.junia.com/faces/Login.xhtml');
    page.once('load', () => console.log("Page d'acueil chargée !"));
    await page.focus('#username');
    await page.keyboard.type(username);
    await page.focus('#password');
    await page.keyboard.type(password);
    page.click("#j_idt28");

    // On est arrivé sur la page de compte ! Et on attend que la page charge (c'est super long...)
    page.once('load', () => console.log("Page de connection chargée !"));
    await page.waitForNavigation();
    let button = await page.$("a.ui-menuitem-link.ui-corner-all.link.item_2169484");
    await button.evaluate(b => b.click());

    // On arrive sur la page de l'emploi du temps. On attend de pouvoir cliquer sur le bouton mois
    await page.waitForSelector("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    page.once('load', () => console.log("Planning chargée !"));
    button = await page.$("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    await button.evaluate(b => b.click());


    await page.waitForSelector("div.fc-center"); // On attend d'avoir la date affichée

    console.log(await page.$eval("div.fc-center", element => element.textContent));
    await  page.waitForSelector("td.fc-event-container"); // On attend d'avoir l'emploi du temps chargé.

    // Ca c'est toutes les cases vertes ! Sauf que ca serait trop simple. Il n'y a pas de lien entre la date de l'event et l'event...
    let events = await page.$$eval("div.fc-content > span.fc-title", elements => elements.map(item => item.textContent));
    let nbSemaine = await page.$$eval("tr > td.fc-week-number", elements => elements.map(item => item.textContent));
    let nbJour = await page.$$eval("tr > td.fc-day-number", elements => elements.map(item => item.textContent));


    // On enléve les espaces ...
    let listeCopie = [];
    nbSemaine.map(item => item !== '' ? listeCopie.push(item) : '');
    nbSemaine = listeCopie;

    console.log(events);
    // On récupére donc les dates par tranche de semaines
    // D'abord les numéros de semaines
    console.log(nbSemaine);
    // Ensuite les numéros de jour
    console.log(nbJour);


    await page.screenshot({ path: 'example.png' });

    await browser.close();
})();