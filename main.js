const puppeteer = require('puppeteer');
const config = require("./config"); // Fichier avec 2 variables :  user et password.
const lib = require("./lib");

const username = config.user;
const password = config.password;

async function startBrowser() {
    const options = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],
        headless: true
    }

    return puppeteer.launch(options)
}

const connection = async page => {
    await page.goto('https://aurion.junia.com/faces/Login.xhtml', { waitUntil: 'networkidle2' });
    await page.focus('#username');
    await page.keyboard.type(username);
    await page.focus('#password');
    await page.keyboard.type(password);
    page.click("#j_idt28");
}

const landingPageToTimeTable = async page => {

    // On est arrivé sur la page de compte ! Et on attend que la page charge (c'est super long...)
    page.once('load', () => console.log("Page de connection chargée !"));
    await page.waitForNavigation();
    // On cherche le bouton "Mon planning" et on clique dessus
    let button = await page.$("a.ui-menuitem-link.ui-corner-all.link.item_2169484");
    await button.evaluate(b => b.click());

    // On arrive sur la page de l'emploi du temps. On ne clique plus le bouton MOIS
    //await page.waitForSelector("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    page.once('load', () => console.log("Planning chargée !"));
    //button = await page.$("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    //await button.evaluate(b => b.click());

}

let getOneWeek = async (page, changerDePage) => {

    if (changerDePage !== 0){
        let button = await page.$("button.fc-next-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
        await button.evaluate(b => b.click());
    }

    await page.waitForSelector("div.fc-center"); // On attend d'avoir la date affichée
    // On affiche la date
    console.log(await page.$eval("div.fc-center", element => element.textContent));
    await page.waitForSelector("div.fc-content > div.fc-title"); // On attend que les casses vertes soient affichées

    let annee = (await page.$eval("div.fc-center", element => element.textContent));
    annee = annee.replace(/\d\d\s—\s\d\d\s/, '');
    annee = annee.slice(annee.indexOf(' '), annee.length);
    annee = annee.replace(' ', '');

    // On récupère tous les cases vertes comme des events
    let events = await page.$$eval("div.fc-content > div.fc-title", elements => elements.map(item => item.textContent));

    // On récupère les numéros de jour
    let nbDay = await page.$$eval("th.fc-day-header.ui-widget-header", elements => elements.map(item => item.textContent));

    // On récupère le nombre d'events par jour
    let nbEventsPerDay = [];
    let tab = await page.$$eval("div.fc-event-container", elements => elements.map(item => item.childElementCount));
    tab.map(item => item !== 0 ? nbEventsPerDay.push(item) : '');

    return {"events" : events, "annee" : annee, "nbDay" : nbDay, "nbEventsPerDay" :nbEventsPerDay};
}

(async () => {
    const browser = await startBrowser();
    const page = await browser.newPage();

    // On se connecte à Aurion
    await connection(page);

    // On va sur la page de l'emploi du temps en SEMAINE
    await landingPageToTimeTable(page);

    let valeurs = await getOneWeek(page,0);
    await getOneWeek(page,1);


    await browser.close();

    // On crée un fichier ICS avec toutes les cours !
    lib.creerICS(valeurs.events, valeurs.annee, valeurs.nbEventsPerDay, valeurs.nbDay);

})();