# AurionJS

Projet développé par deux élèves de CIR² à Junia ISEN. Le but étant à terme de récupérer son emploi du temps sous la forme d'un flux iCalendar. 

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
- [x] NEW FÉV 2022 - Masquer ip vps car aurion bloque OVH
----------------------------------------------------------------------------------------------

#### Shell :
Toutes ces fonctionnalités sont disponibles dans le code. 
La suite doit être fait sur un serveur : 
- [x] Rendre le iCalendar disponible en ligne pour synchronisation
- [x] Mettre à jour le fichier `iCal` tous les trois heures

----------------------------------------------------------------------------------------------

#### Dépendances :

Pour utiliser le script, il faut installer 'puppeteer' et 'ics' via npm:
```console
npm install
```

Il faut aussi installer Tor et le configurer : 
```console
sudo apt install tor
# Ajouter à la fin du fichier /etc/tor/torrc : 

sudo nano /etc/tor/torrc

# Open 4 SOCKS ports, each providing a new Tor circuit.
SocksPort 9050
SocksPort 9052
SocksPort 9053
SocksPort 9054

# Retart tor
sudo /etc/init.d/tor restart
```
----------------------------------------------------------------------------------------------

#### Fichier de configuration :

Pour l'implementation, il faut créer un fichier `config.js` suivant le template suivant : 

```js
const user = ""; // Adresse mail junia
const password = ""; // mot de passe
const path = ""; // path sous la forme /vers/ou/vous/voulez/fichier.ics

module.exports = {
    user,
    password,
    path
};
```

----------------------------------------------------------------------------------------------

#### Shell installation :

Verifier la timezone de votre serveur 

```console
# On verifie la timezone
timedatectl
# On modifie la timezone à Paris
timedatectl set-timezone 'Europe/Paris'
```

Il faut installer un serveur web ainsi qu'un reverse proxy type `ngnix` pour rendre disponible le fichier ics disponible sur internet. 

```console
# Lien pour installer ngnix sur Ubuntu
https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04

# Lien pour installer apache2 sur Ubuntu
https://www.digitalocean.com/community/tutorials/how-to-install-the-apache-web-server-on-ubuntu-20-04
```

Ensuite il faut installer `Node` et `npm`

```console
# On installe d\'abord NVM qui permet de choisir quelle version de Node installer
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# Redemarer le terminal
nvm --version
> 0.35.3
# Liste des versions de Nodejs, choisir une version LTS
nvm ls-remote
# Installer la version
nvm install XX.XX.X
# Voila, nodejs est installé avec npm :)
```

On installe ensuite les dépendances (cf dépendances)
Dernière étape, on crée un cron pour lancer le script tous les 3 heures 

```console
# Site pour apprendre à utiliser cron
https://opensource.com/article/17/11/how-use-cron-linux
# Exemple de ma config :
# On lance le script de calandrier
* */6 * * * /home/ubuntu/.nvm/versions/node/v14.18.1/bin/node /home/ubuntu/calendar/main.js > /home/ubuntu/calendar/log.txt
# * */6 * * * /PATH/node PATH/SCRIPT/main.js >  PATH/LOG/log.txt
```

Normalement tout est configuré ! Il suffit de rajouter un agenda à partir d'un url pour que le calendrier se met à jour seul !
