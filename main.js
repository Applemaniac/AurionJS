const puppeteer = require('puppeteer');
const config = require("./config"); // Fichier avec 2 variables :  user et password.
const lib = require("./lib");
const {daterEvents, stringToArray} = require("./lib");
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
    await page.waitForSelector('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-shadow.ui-hidden-container.ui-draggable.ui-resizable', {
        visible: false,
    });

    // Technique de bourrain, on boucle jusqu'à ce que le panneau de chargement disparaisse
    while (await page.$eval('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-shadow.ui-hidden-container.ui-draggable.ui-resizable', (elem) => {
        return window.getComputedStyle(elem).getPropertyValue('display') !== 'none';})){

    }

    //await page.waitForSelector("div.fc-content > div.fc-title"); // On attend que les casses vertes soient affichées

    let annee = (await page.$eval("div.fc-center", element => element.textContent));
    annee = annee.slice(annee.length - 4, annee.length); // D'ici à ce que les années fassent 5 chiffres...

    // On récupère tous les cases vertes comme des events
    let events = await page.$$eval("div.fc-content > div.fc-title", elements => elements.map(item => item.textContent));

    // On récupère les numéros de jour
    let nbDay = await page.$$eval("th.fc-day-header.ui-widget-header", elements => elements.map(item => item.textContent));

    // On récupère le nombre d'events par jour
    let nbEventsPerDay = [];
    let nbEventsPerDayCopy = [];

    let tab = await page.$$eval("div.fc-event-container", elements => elements.map(item => item.childElementCount));
    tab.map(item => nbEventsPerDayCopy.push(item));

    for (let i = 0; i < nbEventsPerDayCopy.length; i++){
        i % 2 !== 0 ? nbEventsPerDay.push(nbEventsPerDayCopy[i]) : '';
    }

    return {"events" : events, "annee" : annee, "nbDay" : nbDay, "nbEventsPerDay" : nbEventsPerDay};
}

(async () => {
    const browser = await startBrowser();
    const page = await browser.newPage();

    // On se connecte à Aurion
    await connection(page);

    // On va sur la page de l'emploi du temps en SEMAINE
    await landingPageToTimeTable(page);

    let mois = [];
    let semaine = {};

    let valeurs = await getOneWeek(page,0);
    semaine = lib.stringToArray(valeurs.events, valeurs.annee);
    semaine = lib.daterEvents(semaine, valeurs.nbEventsPerDay, valeurs.nbDay);
    for (let i = 0; i < semaine.length; i++){
        mois.push(semaine[i]);
    }

    valeurs = await getOneWeek(page,1);
    semaine = lib.stringToArray(valeurs.events, valeurs.annee);
    semaine = lib.daterEvents(semaine, valeurs.nbEventsPerDay, valeurs.nbDay);
    for (let i = 0; i < semaine.length; i++){
        mois.push(semaine[i]);
    }

    valeurs = await getOneWeek(page,1);
    semaine = lib.stringToArray(valeurs.events, valeurs.annee);
    semaine = lib.daterEvents(semaine, valeurs.nbEventsPerDay, valeurs.nbDay);
    for (let i = 0; i < semaine.length; i++){
        mois.push(semaine[i]);
    }

    valeurs = await getOneWeek(page,1);
    semaine = lib.stringToArray(valeurs.events, valeurs.annee);
    semaine = lib.daterEvents(semaine, valeurs.nbEventsPerDay, valeurs.nbDay);
    for (let i = 0; i < semaine.length; i++){
        mois.push(semaine[i]);
    }

    await browser.close();

    // On crée un fichier ICS avec toutes les cours !
    lib.creerICS(mois);

})();