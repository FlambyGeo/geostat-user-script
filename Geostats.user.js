// ==UserScript==
// @name GeoGuessr Statistics
// @namespace   Flamby
// @description Download all your geoguessr results from your Activities. Your data is uploaded to a database, and then rendered on a map.
// @version 0.9
// @include https://www.geoguessr.com/*
// @run-at document-start
// @license MIT
// ==/UserScript==



var domain = "flambystats"
var tokenResult = '';
var tokenLeague = '';
var oldHref = document.location.href;
var dataLength= 0;
var geoguessrData = [];



window.onload = (event) => {
  //downloadLeague();
  downloadHistory();

  var bodyList = document.querySelector("body"),
    observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (oldHref != document.location.href) {
          oldHref = document.location.href;
          //downloadLeague();
          downloadHistory()
        }
      });
    });

  var config = {
    childList: true,
    subtree: true
  };

  observer.observe(bodyList, config);
};





async function downloadHistory(){
if (!location.pathname.startsWith("/me/activities") || location.pathname.endsWith("#")) {
    return false;
  }


  var button = '<a id="download-csv-result" href="javascript://" style="margin-bottom: 10px;background: #e0d6c6;color: #989083;text-decoration: none;padding: 2px 10px;display: inline-block;font-weight: bold;font-size: 10px;border-radius: 3px;box-shadow: 2px 3px 6px 0px #98908317;">DOWNLOAD ACTIVITIES RESULTS</a>';
  var div = document.createElement('div');
  div.innerHTML = button;

  var elements = document.getElementsByClassName('tabs');
  elements[0].parentNode.insertBefore(div, elements[0]);

  var button_element = document.getElementById('download-csv-result');
  button_element.onclick = function () {
      var myActivities;

      var activitiesRequest = new XMLHttpRequest();
      activitiesRequest.open("GET", 'https://www.geoguessr.com/api/v3/social/feed/me?count=5&page=0', false); //TODO ici
      activitiesRequest.send();


         if (activitiesRequest.status === 200) {
         myActivities = JSON.parse(activitiesRequest.responseText);
              //console.log(myActivities);
              for (var i = 0; i < myActivities.length; i++){
                  if (myActivities[i].activityType === 8){
                      var challengeToken = myActivities[i].payload.challenge.token;
                      var challengeDate = new Date(myActivities[i].dateTime);
                      setTimeout(addResult,250*i,challengeToken,challengeDate);
                  }
              }
         }

      const sleep = async () => {
    await new Promise((resolve)=>setTimeout(() => {
        console.log("timeout");
        publishResult(geoguessrData);
        resolve();
    }, 250*(myActivities.length+1)));
}

      

  }

    showStats();
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function showStats(){

   var ifrm = document.createElement("iframe");
    var nickname = getNickname();
    var ifrmTarget = "https://" + domain + ".glitch.me/?id=" + nickname;
        ifrm.setAttribute("src", ifrmTarget);
    ifrm.setAttribute("id", "istats");
        ifrm.style.width = "1000px";
        ifrm.style.height = "700px";

    var elements = document.getElementsByClassName('tabs');
  elements[0].parentNode.insertBefore(ifrm, elements[0]);
}






function publishResult(data){
    var myJSON = JSON.stringify(data);
  var div = document.createElement('div');
  var elements = document.getElementsByClassName('tabs');
  div.innerHTML = myJSON;


  elements[0].parentNode.insertBefore(div, elements[0]);



     var url = "https://"+ domain +".glitch.me/api";

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: myJSON
  };
    var response = fetch(url, options);

    div.innerHTML = div.innerHTML + response;

}



/*function downloadLeague() {

    var legFinished;
    var legCurrent;

  if (!location.pathname.startsWith("/leagues/") || location.pathname.endsWith("#")) {
    return false;
  }
  tokenLeague = location.pathname.replace("/leagues/", ""); // https://www.geoguessr.com/results/l4JvOOfTJniivkfP
  tokenLeague = tokenLeague.replace("#", "");
  tokenLeague = tokenLeague.replace("?friends", "");
  tokenLeague = tokenLeague.replace("geoguessr.com","");


  var button = '<a id="download-csv-result" href="javascript://" style="margin-bottom: 10px;background: #e0d6c6;color: #989083;text-decoration: none;padding: 2px 10px;display: inline-block;font-weight: bold;font-size: 10px;border-radius: 3px;box-shadow: 2px 3px 6px 0px #98908317;">DOWNLOAD LEAGUE RESULTS</a>';
  var div = document.createElement('div');
  div.innerHTML = button;

  var elements = document.getElementsByClassName('card-wrapper');
  elements[0].parentNode.insertBefore(div, elements[0]);

  var button_element = document.getElementById('download-csv-result');
  button_element.onclick = function () {

    var geoguessrData = [];
    geoguessrData.push(['nickname', 'mapName', 'date','gameType','timeLimit','totalScore', 'totalTime', 'totalDistanceInMeters', 'Round Score', 'Round Distance', 'Round Time', 'Player Lat', 'Player Lng','Solution Lat','Solution Lng'])

      var leagueRequest = new XMLHttpRequest();
      leagueRequest.open("GET", 'https://www.geoguessr.com/api/v3/leagues/' + tokenLeague, false);
      leagueRequest.send();


         if (leagueRequest.status === 200) {
          var MyLeague = JSON.parse(leagueRequest.responseText).league;
          legFinished = MyLeague.finishedLegs;
          legCurrent = MyLeague.currentLeg;
         }

        for (let obj in legFinished) {


            var tokenResult = legFinished[obj].challengeId;
            var legDate = legFinished[obj].startsAt;
            sleep(500);
            geoguessrData = addResult(geoguessrData,tokenResult,legDate);



        }

      publishResult(geoguessrData);

  };
}*/




function getNickname(){
var Nick;
     var profileRequest = new XMLHttpRequest();
     profileRequest.open("GET", 'https://www.geoguessr.com/api/v3/profiles/', false);
            profileRequest.send();
            if (profileRequest.status === 200) {
            var profileData = JSON.parse(profileRequest.responseText);
            Nick = profileData.user.nick;
            };
return Nick;
};





async function addResult(tokenR,date){

    var isEnd = false;
    var iter = 0;
    var solutionData;

    const options = { method: 'GET' };

    var url = 'https://www.geoguessr.com/api/v3/challenges/' + tokenR + '/game';
    console.log(url);
      var response = await fetch(url, options);
    console.log(response.status);
      const dataReturned = await response.json();
                writeGGData(dataReturned, date);

             /*   while (!isEnd) {

                    var resultRequest = new XMLHttpRequest();
                    sleep(210);
                    resultRequest.open("GET", 'https://www.geoguessr.com/api/v3/results/scores/' + tokenR + '/'+ iter + '/' + (iter+50), false); // https://www.geoguessr.com/api/v3/results/scores/l4JvOOfTJniivkfP/0/50
                    resultRequest.send();

                    if (resultRequest.status === 200) {
                        var userData = JSON.parse(resultRequest.responseText);
                        csv = csvWrite(csv, solutionData, userData, date);
                        if (dataLength < 50) {
                            isEnd = true;
                        } ;
                    }
                    else {
                        isEnd = true;
                    };
            iter = iter + 50;
            
           }*/ //download full reults
             
}


function writeGGData(game, dateLeg) {

    var guesses = game.player.guesses;
    var strGameType = "";
    var safeMapName = "";
    safeMapName = game.mapName;
    safeMapName = safeMapName.replace("#", "");

    for (let round in guesses) {

      	let row = {};
    	var roundObject = guesses[round];

   		row.nickname = game.player.nick;
        row.mapName =safeMapName;
        row.date = dateLeg;

        if (game.forbidMoving) {
            if (game.forbidZooming) {
            strGameType = "NMPZ";
            }
            else {
            strGameType = "NoMoving";
            };
        }
            else {
         strGameType = "Normal";
        };
        row.gameType =strGameType;
        row.timeLimit = game.timeLimit;
        row.totalScore = game.player.totalScore.amount;
    	row.totalTime = game.player.totalTime;
    	row.totalDistanceInMeters = game.player.totalDistanceInMeters;



        row.roundScore = roundObject.roundScoreInPoints;
        row.distanceInMeters = roundObject.distanceInMeters;
        row.time = roundObject.time;
        row.playerLat = roundObject.lat;
        row.playerLng = roundObject.lng;
        row.solutionLat = game.rounds[round].lat;
        row.solutionLng = game.rounds[round].lng;

        geoguessrData.push(row);
          };
}
