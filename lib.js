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
    string.forEach(line => {

        let heure = Object.values(line.match(/\d\d:\d\d/g));
        let debut = { "heures": heure[0].replace(/:\d\d/, ''), "minutes": heure[0].replace(/\d\d:/, '') };
        let fin = { "heures": heure[1].replace(/:\d\d/, ''), "minutes": heure[1].replace(/\d\d:/, '') };
        let prof = line.match(/Monsieur|Madame/) === null ? '' : line.slice(line.match(/Monsieur|Madame/).index, line.length);
        let salle = "";

        // Traitement de la salle de classe :
        // On retire les "Amphi"
        line = line.replace(/\sAmphi/gm, '');

        if (line[0] !== ' ') { // Si c'est du type 'Cours #1 ou TD #1' :
            line = line.replace(/[a-zA-Z]+\s#\d/g, '');
        }

        // Puis on traite :

        salle = line.match(/(ISEN [A-Z0-9]\d\d\d+|ISA [0-9]\d\d+|HEI [A-Z0-9]\d\d\d+)/gm) === null ? '' : Object.values(line.match(/(ISEN [A-Z0-9]\d\d\d+|ISA [0-9]\d\d+|HEI [A-Z0-9]\d\d\d+)/gm))[0];

        te = line.match(/(COURS_TD+|REUNION+|TP+|TD+|CM+|FORUM+|CONF+|PROJET+|AUTO_APPR+|ATELIER)/gm) === null ? 'PLANIFIÉ' : Object.values(line.match(/(COURS_TD+|REUNION+|TP+|TD+|CM+|FORUM+|CONF+|PROJET+|AUTO_APPR+|ATELIER)/gm))[0];

        desc = line;

        // Et enfin on supprime tout ce qui ne sert plus !
        line = line.replace(/\d\d:\d\d/g, '');
        line = line.replace(prof, '');
        line = line.replace(debut, '');
        line = line.replace(fin, '');
        line = line.replace(salle, '');
        line = line.replace(/\s-\s/g, '');
        line = line.replace("JND ", '');
        line = line.replace("(H)", '');
        line = line.replace("H micro main/cravate", '');
        line = line.replace("Salle de TP", '');
        line = line.replace(" - Conférences - WorkShop", '');
        line = line.replace("Module de Base M1-", '');
        line = line.replace("COURS_TD", '');
        line = line.replace("ATELIER", '');
        line = line.replace("Module OME M1-", '');
        line = line.replace("Module Humanité et langue M1-", '');
        line = line.replace("Module M1-", '');
        line = line.replace("REUNION", '');
        line = line.trim();


        retour.push({ "annee": annee, "date": '', "salle": salle, "cours": line, "debut": debut, "fin": fin, "prof": prof, "desc": desc, "te": te });

    });
    return retour;
}

/**
 * Fonction qui récupère des événements formatés et ajoute la date de chacun événement
 * @param events array de string formaté par stringToArray
 * @param nbEventPerDay array de nombres qui donne le nombre de cours par jour
 * @param nbDay array de nombres qui donne les dates de la semaine
 * @returns {events} array de string formaté avec stringToArray avec la date en plus
 */
let daterEvents = (events, nbEventPerDay, nbDay) => {

    nbDay = nbDay.map(e => e.replace(/[A-Z][a-z][a-z]\s/, ''));

    // On rajoute les dates
    // On met les events dans les jours
    let q = 0;
    let a; // Événement par jour

    for (let i = 0; q < events.length; i++) {

        a = 0;

        while (a < nbEventPerDay[i]) {
            events[q].date = { "jour": nbDay[i].replace(/\/\d\d/, ''), "mois": nbDay[i].replace(/\d\d\//, '') };
            q++;
            a++;
        }
    }

    return events;
}

/**
 * Fonction qui transforme le array de String en un array utilisable par ICS
 * @param events array de string formaté avec stringToArray
 * @returns {*[]} array utilisable par ICS
 */
let arrayToIcs = events => {

    let today = new Date().toLocaleString()

    let calendar = [];

    for (let i = 0; i < events.length; i++) {

        if (events[i].date == '') continue

        let annee = parseInt(events[i].annee);
        let jour = parseInt(events[i].date.jour);
        let mois = parseInt(events[i].date.mois);

        if (annee == NaN || jour == NaN || mois == NaN) continue;

        calendar.push({
            start: [annee, mois, jour, parseInt(events[i].debut.heures), parseInt(events[i].debut.minutes)],
            end: [annee, mois, jour, parseInt(events[i].fin.heures), parseInt(events[i].fin.minutes)],
            title: events[i].cours,
            location: events[i].salle,
            organizer: { name: events[i].prof }, // Ne s'affiche pas avec Outlook 
            busyStatus: 'BUSY',
            url: 'https://junia-learning.com/my/',
            status: 'CONFIRMED',
            // description: events[i].prof,
            description: `Type d'enseignement : ${teachingTypeConverter(events[i].te)}` +
                `\nEnseignant : ${events[i].prof}` +
                `\nPlus d'informations sur https://aurion.junia.com et sur https://junia-learning.com/my/ .` +
                `\n\nLigne récupérée depuis WebAurion: ${events[i].desc}` +
                `\nDernière actualisation : ${today}`
        });
    }

    return calendar;

}

//COURS_TD+|REUNION+|TP+|TD+|CM+|FORUM+|CONF+|PROJET+|AUTO_APPR

/**
 * Converts the teaching type code to its label
 * @param code teaching type code
 */
let teachingTypeConverter = (code) => {
    switch (code) {
        case "COURS_TD":
            return "Cours/TD";

        case "REUNION":
            return "Réunion";

        case "TP":
            return "Travaux pratiques";

        case "TD":
            return "Travaux dirigés";

        case "CM":
            return "Cours magistral";

        case "FORUM":
            return "Forum";

        case "CONF":
            return "Conférence";

        case "PROJET":
            return "Projet";

        case "ATELIER":
            return "Atelier";

        case "AUTO_APPR":
            return "Auto Apprentissage (Travail individuel)";

        default:
            return code;
    }
}

/**
 * Fonction qui fait le pont avec les autres fonctions. Elle demande en entrée les événements non formatés, l'année, le nombre de cours par jour,
 * les dates de la semaine en cours. Elle ne retourne rien ou un code d'erreur et crée un object ics dans le dossier courant.
 * @param events
 * @returns {string|Error}
 */
let creerICS = (events) => {

    let calendar = arrayToIcs(events);

    const { error, value } = ics.createEvents(calendar)

    if (error) {
        console.log(error)
        return error;
    } else {
        fs.writeFileSync(config.path, value);
        return value;
    }
};


module.exports = {
    stringToArray,
    daterEvents,
    creerICS
}
