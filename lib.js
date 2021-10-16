const data = require("./valeurs");
const puppeteer = require('puppeteer');
const {nbDay} = require("./valeurs");


/**
 * Fonction qui récupére un Array de string pour le transformer en Array de JSON
 * Si le cours est le dernier de la journée, le flag #END# se trouve collé au Nom du prof
 * @param string
 * @returns {{Events: *[]}} JSON type {"salle" : '',"cours" : '', "debut" : '', "fin" : '', "prof" : ''}
 */
let stringToArray = (string) => {
    let retour = {"Events" : []};
    string.forEach(line => {
        // Si la ligne n'est pas du type " - ISEN ......"
        // Elle est trop dure à traiter du coup je fais ce que je peux càd je prends heure, prof, et je garde le reste en texte
        if (line[0] !== ' '){

            let date = Object.values(line.match(/\d\d:\d\d/g));
            let debut = date[0];
            let fin = date[1];
            let prof;
            if (line.match(/Monsieur|Madame/) !== null){
                prof = line.slice(line.match(/Monsieur|Madame/).index, line.length);
            }else{
                prof = line.slice(line.match(/[A-Z]/, line.length));
            }

            line = line.replace(prof, '');
            line = line.replace(debut, '');
            line = line.replace(fin, '');
            line = line.replace(/\s-\s/g, ' ');
            line = line.replace("=>", ' ');
            line = line.replace("(H)", '');
            //line = line.trim();
            let cours = line;

            retour['Events'].push({"date" : '', "salle" : '', "cours" : line, "debut" :debut, "fin" : fin, "prof" : prof});


        }else{ // Si la ligne est du type " - ISEN ...."

            let salle = Object.values(line.match(/ISEN [ABC]\d\d\d/g));
            let date = Object.values(line.match(/\d\d:\d\d/g));
            let debut = date[0];
            let fin = date[1];

            // Pour trouver le nom du prof, On cherche l'emplacement du Monsieur/Madame
            let prof = line.slice(line.match(/Monsieur|Madame/).index, line.length);

            line = line.replace(prof, '');
            line = line.replace(debut, '');
            line = line.replace(fin, '');
            line = line.replace(salle, '');
            line = line.replace(/\s-\s/g, '');
            line = line.replace("Amphi JND", '');
            line = line.replace("(H)", '');
            line = line.trim();

            let cours = line;

            retour['Events'].push({"date" : '', "salle" : salle[0], "cours" : line, "debut" :debut, "fin" : fin, "prof" : prof});

        }
    });
    return retour;
}

let daterEvents = (events, nbEventPerDay, dateSemaine, nbDay) => {

    let index = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    nbDay = nbDay.map(e => e.replace(/[A-Z][a-z][a-z]\s/, ''));

     // On crée le JSON avec la semaine. Le JSON était pas facile à prendre en main. Mais dès que tu as le truc c'est simple
    let retour =
        {
            "nbSemaine": dateSemaine,
            "Lundi": [],
            "Mardi": [],
            "Mercredi": [],
            "Jeudi": [],
            "Vendredi": [],
            "Samedi": [],

        };

    // On rajoute les dates
    // On met les events dans les jours
    let q = 0;
    let a;
    for (let i = 0; i < nbEventPerDay.length; i++){
        a = 0;
        while (a < nbEventPerDay[i]){
            events.Events[q].date = nbDay[i];
            retour[index[i]][a] = events.Events[q];
            q++;
            a++;

        }
    }

    return retour;
}

//Cette ligne crée un objet JSON
//let test = JSON.stringify(stringToArray(data.events));

let test = stringToArray(data.events);
//console.log(test);
console.log(daterEvents(test, data.nbEventsPerDay, 42, data.nbDay));
/** //console.log(test.Events);
let semaine = daterEvents(test, data.nbDate, data.nbSemaine).Semaine;
console.log(semaine[0].Jeudi);
console.log(semaine); **/