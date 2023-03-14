const ics = require('ics');
const fs = require('fs');
const config = require('./config.json');
const readline = require('readline');
const Writable = require('stream').Writable;

/**
 * Ask something to the user (async)
 * @param {String} question What to print before reading the user input
 * @returns The user input
 */
function ask(question) {
    return new Promise((resolve) => {
        // Init the read stream
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        // Ask the question asynchronously
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * Ask something to the user but hide the input (async)
 * @param {String} question What to print before reading the user input
 * @returns The user input
 */
function askDiscreetly(question) {
    return new Promise((resolve) => {
        // Init the writable stream
        const mutableStdout = new Writable({
            write: function (chunk, encoding, callback) {
                if (!this.muted) process.stdout.write(chunk, encoding);
                callback();
            },
        });
        mutableStdout.muted = false;

        // Init the read stream
        const rl = readline.createInterface({
            input: process.stdin,
            output: mutableStdout,
            terminal: true,
        });

        // Ask the question asynchronously
        rl.question(question, (answer) => {
            rl.close();
            console.log('');
            resolve(answer);
        });

        mutableStdout.muted = true;
    });
}

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

        salle = line.match(/(ISEN|HEI)\s[A-Z]\d\d\d/gm) === null ? '' : Object.values(line.match(/(ISEN|HEI)\s[A-Z]\d\d\d/gm))[0];

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
        line = line.trim();


        retour.push({ "annee": annee, "date": '', "salle": salle, "cours": line, "debut": debut, "fin": fin, "prof": prof });

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
    nbDay = nbDay.map((e) => e.replace(/[A-Z][a-z][a-z]\s/, ''));

    // On rajoute les dates
    // On met les events dans les jours
    let q = 0;
    let a;
    for (let i = 0; i < events.length; i++) {
        a = 0;
        while (a < nbEventPerDay[i]) {
            events[q].date = {
                jour: nbDay[i].replace(/\/\d\d/, ''),
                mois: nbDay[i].replace(/\d\d\//, ''),
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
    //console.log(events.Events[0].cours);
    //console.log([parseInt(events.Events[0].annee), parseInt(events.Events[0].date.mois), parseInt(events.Events[0].date.jour), parseInt(events.Events[0].debut.minutes), parseInt(events.Events[0].debut.secondes)]);

    let calendar = [];

    for (let i = 0; i < events.length; i++) {
        calendar.push({
            start: [parseInt(events[i].annee), parseInt(events[i].date.mois), parseInt(events[i].date.jour), parseInt(events[i].debut.heures), parseInt(events[i].debut.minutes)],
            end: [parseInt(events[i].annee), parseInt(events[i].date.mois), parseInt(events[i].date.jour), parseInt(events[i].fin.heures), parseInt(events[i].fin.minutes)],
            title: events[i].cours,
            location: events[i].salle,
            organizer: { name: events[i].prof, email: 'test@test.test' }, // Ne s'affiche pas avec Outlook 
            busyStatus: 'BUSY',
            status: 'CONFIRMED',
            description: events[i].prof,
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
    ask,
    askDiscreetly,
};
