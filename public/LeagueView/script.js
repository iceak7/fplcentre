//let teamIds = JSON.parse(getCookie("leagueIds"));
let teamIds;

let currentGW;
let playerDataArr = [];
let playerPerTeamArr = [];
let static;
let site = "league";

(async function () {
  /// måste köras när getPlayers är klar..
  try {
    teamIds = await getTeamIds();
    playerDataArr = await getPlayers();
    currentGW = playerDataArr[0].current_event;
    playerDataArr.sort(function (a, b) {
      return b.summary_overall_points - a.summary_overall_points;
    });
    printLeague(playerDataArr);
    await getStatic();
    if (currentGW != null) {
      printGwTeam(currentGW);
      printTransfers();
    } else {
      playerDataArr.forEach(function (player, index) {
        _id(
          "moreInfo" + index
        ).innerHTML += `<div id="waitingForSeason" class="waitingForSeason"><h3 class='waitingForSeason'>Waiting for season to start...</h3>
            <div>You will be able to see tranfers and the manager's team here.</div> </div>         
          `;
      });
    }
  } catch (error) {
    console.log("Error:" + error.message);
  }
})();

async function getTeamIds() {
  let managerIds;
  /*/ let path = window.location.pathname;
  console.log(path.length + " path: '" + path + "'");
  if (path.length > 8) {
    let sliceTest = path.slice(8);
    let code = sliceTest.replace("/", "");
    console.log(path.length + " path: '" + code + "'");
    managerIds = [];
  } /*/
  let response = await fetch("/getTeamByLogin", {
    method: "post",
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  response = await response.json();

  if (response.mes === "success") {
    managerIds = response.ids;
  } else {
    managerIds = JSON.parse(getCookie("leagueIds"));
  }

  return managerIds;
}

async function getPlayers() {
  let playerArr = [];
  for (let i in teamIds) {
    try {
      const data = await fetch(
        "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/entry/" +
          teamIds[i] +
          "/"
      );
      let playerData = await data.json();
      playerArr.push(playerData);
    } catch (err) {
      console.log(err);
      console.log("error getting players");
    }
  }
  return playerArr;
}

function printLeague(players) {
  let htmlOutput = players.map((player, index) => {
    let isOdd = "";
    if (index % 2 == 1) {
      isOdd = "leagueTableOdd";
    }
    return ` 
        <div class="leagueTablePlayer ${isOdd}">
        <div class='leagueRank tableDiv'>${index + 1}</div>
        <div class='leagueManager tableDiv'>${player.player_first_name} ${
      player.player_last_name
    }</div>
        <div class='leagueOr tableDiv'>${
          player.summary_overall_rank == null
            ? "<span class='nullReplacer'>-</>"
            : player.summary_overall_rank
        }</div>
        <div class='leagueGwPoints tableDiv'>${
          player.summary_event_points == null
            ? "<span class='nullReplacer'>-</>"
            : player.summary_event_points
        }</div> 
        <div class='leaguePoints tableDiv'>${
          player.summary_overall_points == null
            ? "<span class='nullReplacer'>-</>"
            : player.summary_overall_points
        }</div> 
        <div class='leagueMore tableDiv' onclick="showMore(${index})"><i id="moreButton${index}" class="moreButton fas fa-caret-down" ></i></div> 
        </div> 
        <div class="moreInfo hidden ${isOdd}" id="moreInfo${index}"></div>`;
  });

  _id("tableExpl").insertAdjacentHTML(
    "afterend",
    htmlOutput.join("") + "<div id='tableEndBorder'></div"
  );
}

function printGwTeam(gw) {
  playerDataArr.forEach(async function (player, index) {
    const dataTeams = await fetch(
      "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/entry/" +
        player.id +
        "/event/" +
        currentGW +
        "/picks/"
    );
    let teams = await dataTeams.json();

    let previousPosition = 0;

    let teamsOutput = teams.picks.map(function (pick, i) {
      let multiplier = 1;
      let captainIcon = "";
      let teamStartTag = "";
      let currentPosition = getPlayer(pick.element).element_type;
      let teamEndTag = "";

      playerPerTeamArr.push({
        player: pick.element,
        captain: pick.is_captain,
        entry: index,
      });

      if (i == 0) {
        teamStartTag = "<div class='gwGKRow gwTeamRow'>";
      } else if (i == 1) {
        teamStartTag = "</div><div class='gwDefRow gwTeamRow'>";
      }
      if (i == 11) {
        teamStartTag =
          "</div><div class='bench'><h3>Bench</h3></div><div class='gwBenchRow gwTeamRow'>";
      }

      if (currentPosition == 3 && previousPosition == 2 && i < 11) {
        teamStartTag = "</div><div class='gwMFRow gwTeamRow'>";
      } else if (currentPosition == 4 && previousPosition == 3 && i < 11) {
        teamStartTag = "</div><div class='gwFWRow gwTeamRow'>";
      }

      if (pick.is_captain) {
        if (i < 11) multiplier = 2;
        captainIcon = " <span><i class='fas fa-copyright'></i></span> ";
      } else if (pick.is_vice_captain) {
        captainIcon = " (<span><i class='fas fa-copyright'></i></span>) ";
        if (pick.multiplier == 2) multiplier = 2;
      }
      playerValues = getPlayer(pick.element);
      previousPosition = getPlayer(pick.element).element_type;
      return `${teamStartTag} <div class='gwPlayer'> 
                                    <div class="gwPlayerBackground" onclick='printMorePlayerInfo(${
                                      pick.element
                                    })'> 
                                    <div class='playerName'> ${
                                      playerValues.web_name
                                    } ${captainIcon}<span class="smallText gwPlayerInfoText mobileVisible"> · ${getPosition(playerValues.element_type).singular_name_short} · ${getTeam(playerValues.team).name}</span></div> 
                                    <span class="smallText gwPlayerInfoText mobileHidden">${
                                      getPosition(playerValues.element_type)
                                        .singular_name_short
                                    } · ${getTeam(playerValues.team).name}</span><div class='points'>${playerValues.event_points * multiplier} points</div>
                                    </div></div>`;
    });

    _id(
      "moreInfo" + index
    ).innerHTML += `<div class='gwTeamBlock'><h2>Team</h2>${teamsOutput.join(
      ""
    )} </div> </div>`;
  });
}
function printTransfers() {
  playerDataArr.forEach(async function (player, index) {
    try {
      const dataTransfers = await fetch(
        "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/entry/" +
          player.id +
          "/transfers/"
      );
      let transfers = await dataTransfers.json();

      const dataHistory = await fetch(
        "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/entry/" +
          player.id +
          "/history/"
      );
      let history = await dataHistory.json();

      let wildcardGW = [];
      history.chips.forEach(function (chip) {
        if (chip.name == "wildcard") {
          wildcardGW.push(chip.event);
        }
      });
      let filteredHistory = history.current.filter(function (gw) {
        let wcThisGw = false;

        if (wildcardGW.length > 0) {
          wildcardGW.forEach(function (chipGw) {
            if (chipGw == gw.event) {
              wcThisGw = true;
            }
          });
        }
        return parseFloat(gw.event_transfers) > 0 || wcThisGw == true;
      });

      let historyOutput = filteredHistory.map(function (h, i) {
        let wcThisGw = false;

        if (wildcardGW.length > 0) {
          wildcardGW.forEach(function (chipGw) {
            if (chipGw == h.event) {
              wcThisGw = true;
            }
          });
        }

        let gwTransfers = transfers.filter(function (t) {
          return t.event == h.event;
        });

        let transfersOutput = gwTransfers.map(function (transfer, index) {
          let borderClass = "";
          if (index > 0) {
            borderClass = "playerBorder";
          }
          let playerOut = getPlayer(transfer.element_out);
          let playerIn = getPlayer(transfer.element_in);

          return `
                        <div class="transferRow ${borderClass}"> 
                        <div class="playerTransfer" onclick='printMorePlayerInfo(${
                          playerOut.id
                        })'> 
                        ${playerOut.web_name} 
                        <span class="smallText playerInfoText"> <span class="mobileHidden">·</span> ${
                          getPosition(playerOut.element_type)
                            .singular_name_short
                        } · ${getTeam(playerOut.team).name}</span>
                        </div>
                        <span class="transferArrow"><i class="fas fa-long-arrow-alt-right"></i></span>
                        <div class="playerTransfer" onclick='printMorePlayerInfo(${
                          playerIn.id
                        })'> 
                        ${playerIn.web_name} 
                        <span class="smallText playerInfoText"> <span class="mobileHidden">·</span> ${
                          getPosition(playerIn.element_type).singular_name_short
                        } · ${getTeam(playerIn.team).name}</span>
                        </div>
                        </div>
                    `;
        });
        let costOutput = "Free";
        if (h.event_transfers_cost > 0) {
          costOutput = "-" + h.event_transfers_cost + " points";
        }
        if (wcThisGw)
          return `
            <div class="transferWeekBlock">
            <div class="transferWeekHeader">
            <h3>GW${
              h.event
            }<span class='transferCost'></span><span class='transferCost'>- WILDCARD USED</span></h3> 
            </div>
            <div class="transferRows">
            ${transfersOutput.join("")}
            </div>
            </div>`;
        else
          return `
            <div class="transferWeekBlock">
            <div class="transferWeekHeader">
            <h3 class='week'>GW${
              h.event
            } <span class='transferCost'>${costOutput}</span></h3>
            </div>
            <div class="transferRows">
            ${transfersOutput.join("")}
            </div>
            </div>`;
      });
      if (historyOutput.length > 0) {
        _id("moreInfo" + index).innerHTML += `
            <div class="transferBlock">
            <h2>Transfer history</h2>
            ${historyOutput.reverse().join("")}
            </div>
            
            `;
      } else {
        _id("moreInfo" + index).innerHTML += historyOutput.reverse().join("");
      }
    } catch (err) {
      console.log(err);
    }
  });
}

async function printMorePlayerInfo(playerId) {
  let player = getPlayer(playerId);
  let playerCount = 0;
  try {
    playerPerTeamArr.forEach(function (p) {
      if (p.player == playerId) {
        playerCount++;
      }
    });
  } catch {
    playerCount = "-";
  }

  let html = `
    <div id='morePlayerInfo' class='morePlayerInfo'>
        <div class='playerBoxMore'> 
            <div class='morePlayerInfoHeader'>
                <h2>${
                  player.web_name
                }<span id='removeMorePlayer' class='exitMorePlayer'><i class='far fa-times-circle'></i></span></h2>
            </div>
            <div class='morePlayerContent'>
                <div class='basicPlayerInfo'>
                    <h4>${getTeam(player.team).name}</h4>
                    <h4>${getPosition(player.element_type).singular_name}</h4>
                </div>
                <div class='gamePlayerInfo'>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Total points">Total</h5>${
                      player.total_points
                    }pts </div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Latest GW Points">GW${currentGW}</h5>${
    player.event_points
  }pts</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Player cost">Cost</h5>£${
                      player.now_cost / 10
                    }</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Globally selected by">GSB</h5>${
                      player.selected_by_percent
                    }%</div>
                    <div class='gamePlayerInfoContent'><h5 class='tooltip' title="Selected by in the league">SB</h5>${
                      Math.round((playerCount / teamIds.length) * 100 * 10) / 10
                    }%</div>
             
                </div>
                <h3>Next 5 Fixtures</h3>
                <div class='playerFixtures'></div>
                <h3>Last 5 Matches</h3>
                <div class='playerHistory'></div>
            </div>
        </div>
    </div>
    
    `;
  document.getElementById("header").insertAdjacentHTML("beforebegin", html);
  _id("removeMorePlayer").addEventListener("click", (el) => {
    _id("morePlayerInfo").remove();
  });

  try {
    const data = await fetch(
      "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/element-summary/" +
        playerId +
        "/"
    );
    let playerData = await data.json();

    let fixtureData = playerData.fixtures;
    let fixtureLength = playerData.fixtures.length;
    let fixtureHtml = [];

    for (let i = 0; i < (fixtureLength > 4 ? 5 : fixtureLength); i++) {
      let opponent;
      let last = "";
      if (fixtureData[i].is_home) {
        opponent = getTeam(fixtureData[i].team_a).name + " (H)";
      } else {
        opponent = getTeam(fixtureData[i].team_h).name + " (A)";
      }
      if (i == 4) last = "last";
      fixtureHtml[i] = `<div class='fixture fixtureDiff${
        fixtureData[i].difficulty
      } ${last}'><div class='fixtureOpp'>${opponent}</div> <div class='fixtureGw'>GW${
        fixtureData[i].event != null ? fixtureData[i].event : " TBD"
      }</div></div>`;
    }
    document.getElementsByClassName(
      "playerFixtures"
    )[0].innerHTML = fixtureHtml.join("");

    let historyData = playerData.history;
    let historyLength = playerData.history.length;
    historyData.reverse();

    let historyHtml = [];

    for (let i = 0; i < (historyLength > 4 ? 5 : historyLength); i++) {
      let opponent;
      let result = "draw";
      let first = "";

      if (historyData[i].was_home) {
        opponent = getTeam(historyData[i].opponent_team).name + " (H)";

        if (historyData[i].team_h_score > historyData[i].team_a_score) {
          result = "win";
        } else if (historyData[i].team_h_score < historyData[i].team_a_score) {
          result = "loss";
        }
      } else {
        opponent = getTeam(historyData[i].opponent_team).name + " (A)";
        if (historyData[i].team_h_score < historyData[i].team_a_score) {
          result = "win";
        } else if (historyData[i].team_h_score > historyData[i].team_a_score) {
          result = "loss";
        }
      }

      if (i == 0) first = "first";

      historyHtml[i] = `<div class='historyMatch ${first}'>
                <div class='historyGw ${result}'>GW${historyData[i].round}</div>
                <div class='historyOpp'>${opponent} ${historyData[i].team_h_score}-${historyData[i].team_a_score}</div>
                <div class='historyPts'>${historyData[i].total_points} pts</div>
                <div class='historyMinutes'>${historyData[i].minutes} min</div>
            </div>`;
    }
    document.getElementsByClassName(
      "playerHistory"
    )[0].innerHTML = historyHtml.join("");
  } catch (err) {
    console.log(err);
  }
}

function getPlayer(playerId) {
  let filteredPlayer = static.elements.filter(function (p) {
    return p.id == playerId;
  });

  return filteredPlayer[0];
}

//fetch functions
async function getStatic() {
  try {
    const data = await fetch(
      "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/bootstrap-static/"
    );
    static = await data.json();
  } catch (err) {
    console.log("error");
  }
}

function getPosition(positionId) {
  searchedPosition = static.element_types.filter(function (el) {
    return el.id == positionId;
  });
  return searchedPosition[0];
}

function getTeam(teamId) {
  searchedTeam = static.teams.filter(function (el) {
    return el.id == teamId;
  });
  return searchedTeam[0];
}

//clicks
function showMore(rowId) {
  _id("moreButton" + rowId).classList.toggle("fa-caret-down");
  _id("moreButton" + rowId).classList.toggle("fa-caret-up");
  _id("moreInfo" + rowId).classList.toggle("hidden");
}

//hämta cookie
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

//helper
function _id(id) {
  return document.getElementById(id);
}
