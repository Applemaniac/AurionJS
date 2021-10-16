const puppeteer = require('puppeteer');
const config = require("./config"); // Fichier avec 2 variables :  user et password.

const username = config.user;
const password = config.password;

const connection = async page => {
    await page.goto('https://aurion.junia.com/faces/Login.xhtml');
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

    // On arrive sur la page de l'emploi du temps. On attend de pouvoir cliquer sur le bouton MOIS
    await page.waitForSelector("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    page.once('load', () => console.log("Planning chargée !"));
    button = await page.$("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    await button.evaluate(b => b.click());

    await page.waitForSelector("div.fc-center"); // On attend d'avoir la date affichée
    // On affiche la date
    console.log(await page.$eval("div.fc-center", element => element.textContent));
    await  page.waitForSelector("td.fc-event-container"); // On attend d'avoir l'emploi du temps chargé.
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // On se connecte à Aurion
    await connection(page);

    // On va sur la page de l'emploi du temps en MOIS
    await landingPageToTimeTable(page);

    // On récupère tous les cases vertes comme des events
    let events = await page.$$eval("div.fc-content > span.fc-title", elements => elements.map(item => item.textContent));

    // On regarde si la case qui stock l'event fait plus d'une ligne (si oui, c'est que c'est le dernier événement de la journée)
    let eventsWithLimits = await  page.$$eval("td.fc-event-container", elements => elements.map(
       item => item.rowSpan
    ));
    // On rajoute un flag #END# à la fin du string pour dire que c'est le dernier événement de la journée.
    for (let i = 0; i < events.length; i++){
        eventsWithLimits[i] !== 1 ? events[i] = events[i].concat('#END#') : '';
    }

    // On récupère le numéro de la semaine
    let nbSemaine = await page.$$eval("tr > td.fc-week-number", elements => elements.map(item => item.textContent));
    // On récupère les dates de chaque jour
    let nbJour = await page.$$eval("tr > td.fc-day-number", elements => elements.map(item => item.textContent));
    // On verifie qu'il n'y a pas de vacances
    let vacances = [];
    // On regarde chaque table associée à chaque semaine et on regarde le nombre de tr qu'il y a dans chaque tbody (il n'y en a qu'un quand le semaine est vide)
    vacances.push(await page.$$eval("div.fc-content-skeleton > table > tbody", elements => elements.map(item => item.childElementCount > 1 ? 0 : 1)));

    let buttons = await page.$$eval("td.fc-event-container > a", elements => elements);
    await page.click("td.fc-event-container > a");
    await page.screenshot({ path: 'example.png' });


    // On enléve les espaces ...
    let listeCopie = [];
    nbSemaine.map(item => item !== '' ? listeCopie.push(item) : '');
    nbSemaine = listeCopie;

    //console.log(events);
    // On récupère donc les dates par tranche de semaines et tranche d'horraires


    //await page.screenshot({ path: 'example.png' });

    await browser.close();
})();