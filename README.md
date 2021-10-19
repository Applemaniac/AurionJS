# AurionJS

Projet en cours de développement par deux élèves de CIR² à Junia ISEN. Le but étant à terme de récupérer son emploi du temps sous la forme d'un flux iCalendar. 

### TODO :
#### Node.js :
- [x] Se connecter
- [x] Arriver à la page "Mon planning"
- [x] Passer en affichage "SEMAINE"
- [x] Récupérer les données de semaine
- [x] Traiter les donner pour les passer dans un tableau
- [x] Exporter les données dans un fichier iCalendar
- [x] Boucler 4 fois pour récupérer le mois (les vacances posent problèmes) 
- [x] Ecrire le fichier ics à la racine du script
----------------------------------------------------------------------------------------------
#### Shell :
Toutes ces fonctionnalités sont disponibles dans le code. 
La suite doit être fait sur un serveur : 
- [ ] Rendre le iCalendar disponible en ligne pour synchronisation
- [ ] Mettre à jour le fichier `iCal` tous les soirs


Pour utiliser le script, il faut installer 'puppeteer' et 'ics' :
```console
npm i -g puppeteer
npm i -g ics
```

Pour l'implementation, il faut créer un fichier `config.js` suivant le template suivant : 

```js
const user = ""; // Adresse mail junia
const password = ""; // mot de passe

module.exports = {
    user,
    password
};
```
