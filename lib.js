const ics = require("ics");
const fs = require("fs");
const config = require("./config");

/**
 * Fonction qui récupère un Array de string pour le transformer en Array de JSON
 * Si le cours est le dernier de la journée, le flag #END# se trouve collé au Nom du prof
 * @param string
 * @param annee
 * @returns [] JSON type {"salle" : '',"cours" : '', "debut" : '', "fin" : '', "prof" : ''}
 */
let stringToArray = (string, annee) => {
    let retour = [];
    string.forEach((line) => {
        let heure = Object.values(line.match(/\d\d:\d\d/g));
        let debut = {
            heures: heure[0].replace(/:\d\d/, ""),
            minutes: heure[0].replace(/\d\d:/, ""),
        };
        let fin = {
            heures: heure[1].replace(/:\d\d/, ""),
            minutes: heure[1].replace(/\d\d:/, ""),
        };

        ogline = line.split("\n");

        let salle = ogline[0];
        let desc = ogline[1];
        let cours = ogline[2];
        let te = ogline[3];
        let prof = ogline[4];

        retour.push({
            annee: annee,
            date: "",
            salle: salle,
            cours: cours,
            debut: debut,
            fin: fin,
            prof: prof,
            desc: desc,
            te: te,
            line: line,
        });
    });
    return retour;
};

/**
 * Fonction qui récupère des événements formatés et ajoute la date de chacun événement
 * @param events array de string formaté par stringToArray
 * @param nbEventPerDay array de nombres qui donne le nombre de cours par jour
 * @param nbDay array de nombres qui donne les dates de la semaine
 * @returns {events} array de string formaté avec stringToArray avec la date en plus
 */
let daterEvents = (events, nbEventPerDay, nbDay) => {
    nbDay = nbDay.map((e) => e.replace(/[A-Z][a-z][a-z]\s/, ""));

    // On rajoute les dates
    // On met les events dans les jours
    let q = 0;
    let a; // Événement par jour

    for (let i = 0; q < events.length; i++) {
        a = 0;

        while (a < nbEventPerDay[i]) {
            events[q].date = {
                jour: nbDay[i].replace(/\/\d\d/, ""),
                mois: nbDay[i].replace(/\d\d\//, ""),
            };
            q++;
            a++;
        }
    }

    return events;
};

/**
 * Fonction qui transforme le array de String en un array utilisable par ICS
 * @param events array de string formaté avec stringToArray
 * @returns {*[]} array utilisable par ICS
 */
let arrayToIcs = (events) => {
    let today = new Date().toLocaleString();

    let calendar = [];

    for (let i = 0; i < events.length; i++) {
        if (events[i].date == "") continue;

        let annee = parseInt(events[i].annee);
        let jour = parseInt(events[i].date.jour);
        let mois = parseInt(events[i].date.mois);

        if (annee == NaN || jour == NaN || mois == NaN) continue;

        let title =
            events[i].desc != ""
                ? events[i].desc +
                  (events[i].cours != "" ? " - " + events[i].cours : "")
                : events[i].cours != ""
                ? events[i].cours
                : "Intervention planifiée";

        calendar.push({
            start: [
                annee,
                mois,
                jour,
                parseInt(events[i].debut.heures),
                parseInt(events[i].debut.minutes),
            ],
            end: [
                annee,
                mois,
                jour,
                parseInt(events[i].fin.heures),
                parseInt(events[i].fin.minutes),
            ],
            title: title,
            //events[i].cours,
            location: events[i].salle,
            // organizer: { name: events[i].prof }, // Ne s'affiche pas avec Outlook
            busyStatus: "BUSY",
            url: "https://junia-learning.com/my/",
            status: "CONFIRMED",
            // description: events[i].prof,
            description:
                `${events[i].line}` +
                `\n\nPlus d'informations sur https://aurion.junia.com et sur https://junia-learning.com/my/ .` +
                `\nDernière actualisation : ${today}`,
        });
    }

    return calendar;
};

/**
 * Fonction qui fait le pont avec les autres fonctions. Elle demande en entrée les événements non formatés, l'année, le nombre de cours par jour,
 * les dates de la semaine en cours. Elle ne retourne rien ou un code d'erreur et crée un object ics dans le dossier courant.
 * @param events
 * @returns {string|Error}
 */
let creerICS = (events) => {
    let calendar = arrayToIcs(events);

    const { error, value } = ics.createEvents(calendar);

    if (error) {
        console.log(error);
        return error;
    } else {
        fs.writeFileSync(config.path, value);
        return value;
    }
};

module.exports = {
    stringToArray,
    daterEvents,
    creerICS,
};
