# AurionJS

Projet en cours de dévéloppement par un éléve de CIR² à l'ISEN. Le but étant à terme de récupérer son emploi du temps sous la forme d'un flux icalendar. 

### TODO :
- [x] Se connecter
- [x] Arriver à la page "Mon planning"
- [x] Passer en affichage "MOIS"
- [x] Récupérer les données du mois
- [ ] Traiter les donner pour les passer en JSON
- [ ] Exporter les données JSON en un icalendar
- [ ] Rendre le icalendar disponible en ligne pour synchronisation 
- [ ] Update auto le fichier tous les soirs


Pour utiliser le script (a vos risques et peril, il n'est pas fini), il faut installer 'puppeteer' :
```console
npm i -g puppeteer
```
Pour l'implementation, il faut créer un fichier "config.js" suivant le template suivant : 

```js
const user = ""; // Adresse mail junia
const password = ""; // mot de passe

module.exports = {
    user,
    password
};
```
