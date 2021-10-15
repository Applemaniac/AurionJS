const data = require("./valeurs");
const puppeteer = require('puppeteer');

let stringToArray = (string) => {
    let retour = [];
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

            retour.push(['', line, debut, fin, prof]);


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

            retour.push([salle[0], cours, debut, fin, prof]);
        }
    });
    return retour;
}

//stringToArray(data.events);
console.log(stringToArray(data.events));