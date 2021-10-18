const data = require("./valeurs");
const puppeteer = require("puppeteer");
const ics = require("ics");
const fs = require("fs");

/**
 * Fonction qui récupére un Array de string pour le transformer en Array de JSON
 * Si le cours est le dernier de la journée, le flag #END# se trouve collé au Nom du prof
 * @param string
 * @returns {{Events: *[]}} JSON type {"salle" : '',"cours" : '', "debut" : '', "fin" : '', "prof" : ''}
 */
let stringToArray = (string, annee) => {
    let retour = {"Events" : []};
    string.forEach(line => {
        // Si la ligne n'est pas du type " - ISEN ......"
        // Elle est trop dure à traiter du coup je fais ce que je peux càd je prends heure, prof, et je garde le reste en texte
        if (line[0] !== ' '){

            let heure = Object.values(line.match(/\d\d:\d\d/g));
            let debut = {"minutes" : heure[0].replace(/:\d\d/, ''), "secondes" : heure[0].replace(/\d\d:/, '')};
            let fin = {"minutes" : heure[1].replace(/:\d\d/, ''), "secondes" : heure[1].replace(/\d\d:/, '')};
            let prof;
            if (line.match(/Monsieur|Madame/) !== null){
                prof = line.slice(line.match(/Monsieur|Madame/).index, line.length);
            }else{
                prof = line.slice(line.match(/[A-Z]/, line.length));
            }

            line = line.replace(/\d\d:\d\d/g, '');
            line = line.replace(prof, '');
            line = line.replace(debut, '');
            line = line.replace(fin, '');
            line = line.replace(/\s-\s/g, ' ');
            line = line.replace("=>", ' ');
            line = line.replace("(H)", '');
            //line = line.trim();
            let cours = line;

            retour['Events'].push({"annee" : annee, "date" : '', "salle" : '', "cours" : line, "debut" :debut, "fin" : fin, "prof" : prof});


        }else{ // Si la ligne est du type " - ISEN ...."

            let salle = Object.values(line.match(/ISEN [ABC]\d\d\d/g));
            let heure = Object.values(line.match(/\d\d:\d\d/g));
            let debut = {"minutes" : heure[0].replace(/:\d\d/, ''), "secondes" : heure[0].replace(/\d\d:/, '')};
            let fin = {"minutes" : heure[1].replace(/:\d\d/, ''), "secondes" : heure[1].replace(/\d\d:/, '')};

            // Pour trouver le nom du prof, On cherche l'emplacement du Monsieur/Madame
            let prof = line.slice(line.match(/Monsieur|Madame/).index, line.length);

            line = line.replace(/\d\d:\d\d/g, '');
            line = line.replace(prof, '');
            line = line.replace(debut, '');
            line = line.replace(fin, '');
            line = line.replace(salle, '');
            line = line.replace(/\s-\s/g, '');
            line = line.replace("Amphi JND", '');
            line = line.replace("(H)", '');
            line = line.trim();

            let cours = line;

            retour['Events'].push({"annee" : annee, "date" : '', "salle" : salle[0], "cours" : line, "debut" :debut, "fin" : fin, "prof" : prof});

        }
    });
    return retour;
}

/**
 * Fonction qui récupère des événements formatés et ajoute la date de chacun événement
 * @param events array de string formaté par stringToArray
 * @param nbEventPerDay array d'int qui donne le nombre de cours par jour
 * @param nbDay array d'int qui donne les dates de la semaine
 * @returns {events} array de string formaté avec stringToArray avec la date en plus
 */
let daterEvents = (events, nbEventPerDay, nbDay) => {

    nbDay = nbDay.map(e => e.replace(/[A-Z][a-z][a-z]\s/, ''));

    // On rajoute les dates
    // On met les events dans les jours
    let q = 0;
    let a;
    for (let i = 0; i < events.Events.length; i++){
        a = 0;
        while (a < nbEventPerDay[i]){
            events.Events[q].date = {"jour" : nbDay[i].replace(/\/\d\d/, ''), "mois" : nbDay[i].replace(/\d\d\//, '')};
            q++;
            a++;

        }
    }

    return events;
}

/**
 * Fonction qui transforme le array de String en un array utilisable par ICS
 * @param events array de string formaté avec stringToArray
 * @returns {calendar} array utilisable par ICS
 */
let arrayToIcs = events => {

    //console.log(events.Events[0].cours);
    //console.log([parseInt(events.Events[0].annee), parseInt(events.Events[0].date.mois), parseInt(events.Events[0].date.jour), parseInt(events.Events[0].debut.minutes), parseInt(events.Events[0].debut.secondes)]);

    let calendar = [];

    for (let i = 0; i < events.Events.length; i++){
        calendar.push({
            start : [parseInt(events.Events[i].annee), parseInt(events.Events[i].date.mois), parseInt(events.Events[i].date.jour), parseInt(events.Events[i].debut.minutes), parseInt(events.Events[i].debut.secondes)],
            end : [parseInt(events.Events[i].annee), parseInt(events.Events[i].date.mois), parseInt(events.Events[i].date.jour), parseInt(events.Events[i].fin.minutes), parseInt(events.Events[i].fin.secondes)],
            title : events.Events[i].cours,
            description : events.Events[i].cours + "\n" + events.Events[i].prof + "\n" + events.Events[i].salle,
        });
    }

    return calendar;

}
/**
 * Fonction qui fait le pont avec les autres fonctions. Elle demande en entrée les événements non formatés, l'année, le nombre de cours par jour,
 * les dates de la semaine en cours. Elle ne retourne rien ou un code d'erreur et crée un object ics dans le dossier courrant.
 * @param events
 * @param annee
 * @param nbEventsPerDay
 * @param nbDay
 * @returns {string}
 */
let creerICS = (events, annee, nbEventsPerDay, nbDay) => {

    let calendar = stringToArray(events, annee);
    calendar = daterEvents(calendar, nbEventsPerDay, nbDay);
    calendar = arrayToIcs(calendar);
    const { error, value } = ics.createEvents(calendar)

    if (error) {
        console.log(error)
        return error;
    }else{
        fs.writeFileSync("./events.ics", value);
    }
    return;
};


module.exports = {
    creerICS
}
