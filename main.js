const puppeteer = require('puppeteer');
const config = require('./config.json');
const lib = require('./lib');
const fsPromises = require('fs/promises');

const PROXY_HOST = process.env.PROXY_HOST || "127.0.0.1";

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
            '--disable-gpu',
            `--proxy-server=socks5://${PROXY_HOST}:9050`, // Proxy TOR for bypassing AURION firewall
        ],
        headless: true,
    };

    if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;

    return puppeteer.launch(options);
}

const connection = async (page) => {
    //await page.goto('https://aurion.junia.com', { waitUntil: 'networkidle2' });
    await page.goto('https://aurion.junia.com');
    console.log('Arrived in Aurion');
    await page.focus('#username');
    await page.keyboard.type(config.username);
    console.log('username typed');
    await page.focus('#password');
    await page.keyboard.type(config.password);
    console.log('password typed');
    page.click('#j_idt28');
};

const landingPageToTimeTable = async (page) => {
    // On est arrivé sur la page de compte ! Et on attend que la page charge (c'est super long...)
    page.once('load', () => console.log('Page de connection chargée !'));
    await page.waitForNavigation();
    // On cherche le bouton "Mon planning" et on clique dessus
    let button = await page.$('a.ui-menuitem-link.ui-corner-all.link.item_2169484');
    await button.evaluate((b) => b.click());

    // On arrive sur la page de l'emploi du temps. On ne clique plus le bouton MOIS
    //await page.waitForSelector("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    page.once('load', () => console.log('Planning chargée !'));
    //button = await page.$("button.fc-month-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right");
    //await button.evaluate(b => b.click());
};

let getOneWeek = async (page, changerDePage) => {
    if (changerDePage !== 0) {
        let button = await page.$('button.fc-next-button.ui-button.ui-state-default.ui-corner-left.ui-corner-right');
        await button.evaluate((b) => b.click());
    }

    await page.waitForSelector('div.fc-center'); // On attend d'avoir la date affichée
    // On affiche la date
    console.log(await page.$eval('div.fc-center', (element) => element.textContent));
    await page.waitForSelector('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-shadow.ui-hidden-container.ui-draggable.ui-resizable', {
        visible: false,
    });

    // Technique de bourrin, on boucle jusqu'à ce que le panneau de chargement disparaisse
    while (
        await page.$eval('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-shadow.ui-hidden-container.ui-draggable.ui-resizable', (elem) => {
            return window.getComputedStyle(elem).getPropertyValue('display') !== 'none';
        })
    ) {}

    //await page.waitForSelector("div.fc-content > div.fc-title"); // On attend que les casses vertes soient affichées

    let year = await page.$eval('div.fc-center', (element) => element.textContent);
    year = year.slice(year.length - 4, year.length); // D'ici à ce que les années fassent 5 chiffres...

    // On récupère tous les cases vertes comme des events
    let events = await page.$$eval('div.fc-content > div.fc-title', (elements) => elements.map((item) => item.textContent));

    // On récupère les numéros de jour
    let nbDay = await page.$$eval('th.fc-day-header.ui-widget-header', (elements) => elements.map((item) => item.textContent));

    // On récupère le nombre d'événements par jour
    let nbEventsPerDay = [];
    let nbEventsPerDayCopy = [];

    let tab = await page.$$eval('div.fc-event-container', (elements) => elements.map((item) => item.childElementCount));
    tab.map((item) => nbEventsPerDayCopy.push(item));

    for (let i = 0; i < nbEventsPerDayCopy.length; i++) {
        i % 2 !== 0 ? nbEventsPerDay.push(nbEventsPerDayCopy[i]) : '';
    }

    return {
        events: events,
        annee: year,
        nbDay: nbDay,
        nbEventsPerDay: nbEventsPerDay,
    };
};

(async () => {
    if (!require('./secrets.json') || !require('./secrets.json').hasOwnProperty('username') || !require('./secrets.json').hasOwnProperty('password')) {
        // AurionJS isn't configured for now
        console.log('Vous devez configurer AurionJS lors de la première utilisation.');
        console.log('Pas de soucis à se faire, après vous serez tranquille !\n');

        // Ask username
        const username = await lib.ask('Mail Junia : ');

        // Ask password
        let passwordWrong = true;
        let password, passwordConfirm;
        while (passwordWrong) {
            password = await lib.askDiscreetly('Mot de passe Aurion : ');
            passwordConfirm = await lib.askDiscreetly('Confirmation : ');
            if (password !== passwordConfirm) {
                console.log('\nLes mots de passe sont différents, veuillez recommencer...');
            } else passwordWrong = false;
        }

        // Update the config object
        config.username = username;
        config.password = password;
        await fsPromises.writeFile('./secrets.json', JSON.stringify(config, null, 4));
        console.log("Le fichier configuration a été modifié... Ne le laissez pas trainer n'importe où !\n");
    }

    console.log('Lancement de AurionJS pour', config.username);
    console.log(new Date().toLocaleString());
    const browser = await startBrowser();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr',
    });

    // On met le timeout à 0
    await page.setDefaultNavigationTimeout(0);

    // On se connecte à Aurion
    await connection(page);
    console.log('Login !');
    // On va sur la page de l'emploi du temps en SEMAINE
    await landingPageToTimeTable(page);

    let mois = [];
    let week;
    let valeurs;

    for (let semaine = 0; semaine < 4; semaine++) {
        valeurs = await getOneWeek(page, semaine === 0 ? 0 : 1);
        week = lib.stringToArray(valeurs.events, valeurs.annee);
        week = lib.daterEvents(week, valeurs.nbEventsPerDay, valeurs.nbDay);
        for (let i = 0; i < week.length; i++) {
            mois.push(week[i]);
        }
    }

    await browser.close();

    // On crée un fichier ICS avec toutes les cours !
    lib.creerICS(mois);
})();
