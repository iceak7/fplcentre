let leagueArr = [];
let site = "index";

let loggedIn;
(async function () {
  let responseLoggedIn = await fetch("/loggedIn", {
    method: "post",
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  let respLoggedIn = await responseLoggedIn.json();

  if (respLoggedIn.mes === "logged in") {
    loggedIn = true;
    _id("notLoggedInContinue").classList.add("hidden");
    _id("saveLeague").classList.remove("hidden");

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
      _id("leagueLinkBox").classList.add("visible");
    }
  } else {
    loggedIn = false;

    if (getCookie("leagueIds")) {
      _id("leagueLinkBox").classList.add("visible");
    }
  }
})();

//när man lägger till ett lag med id
_id("enterId").addEventListener("click", (el) => {
  inputVal = _id("teamId").value;
  if (parseInt(inputVal) == inputVal) {
    if (parseInt(inputVal) > 0) {
      if (!leagueArr.find((x) => x.teamId == inputVal)) {
        printTeamPreview(inputVal);
      } else {
        _id("teamId").classList.add("inputError");
      }
    } else {
      _id("teamId").classList.add("inputError");
    }
  } else {
    _id("teamId").classList.add("inputError");
  }

  if (leagueArr.length > 0) {
    _id("showAddedTeams").classList.remove("hidden");
    _id("continueLeague").classList.remove("hidden");
  }
});

//när man läger till ett lag med spelarmenyn
_id("enterManager").addEventListener("click", (el) => {
  inputVal = _id("selectManager").options[_id("selectManager").selectedIndex]
    .value;

  if (parseInt(inputVal) == inputVal) {
    if (parseInt(inputVal) > 0) {
      if (!leagueArr.find((x) => x.teamId == inputVal)) {
        printTeamPreview(inputVal);
      } else {
        _id("selectManager").classList.add("inputError");
      }
    }
  }
  if (leagueArr.length > 0) {
    _id("showAddedTeams").classList.remove("hidden");
    _id("continueDiv").classList.remove("hidden");
  }
});

//printar ut lagen man lagt till i sin liga
async function printTeamPreview(teamId) {
  try {
    _id("loader").classList.remove("hidden");

    const data = await fetch(
      "https://isakfplserver.herokuapp.com/https://fantasy.premierleague.com/api/entry/" +
        teamId +
        "/"
    );

    let playerData = await data.json();
    if (!(playerData.detail == "Not found.")) {
      leagueArr.push({ teamId, playerData });
      _id("showAddedTeams").innerHTML += `
            <div class="previewPlayer" id="preview${teamId}">
            <div class="previewName">${playerData.player_first_name} ${playerData.player_last_name}</div>
            <div class="previewTeamName">${playerData.name}</div>
            <div class="previewRemove" onclick="removeTeam(${teamId})"><i class="fas fa-times"></i></div>
            </div>
            `;
      if (leagueArr.length > 0) {
        _id("showAddedTeams").classList.remove("hidden");
        _id("continueDiv").classList.remove("hidden");
      }
    } else {
      _id("teamId").classList.add("inputError");
    }
    _id("loader").classList.add("hidden");
  } catch (err) {
    console.log("error getting players");
  }
}

// när man går vidare med ligan
_id("continueLeague").addEventListener("click", (el) => {
  let leagueIds = [];

  leagueArr.forEach(function (player) {
    leagueIds.push(player.teamId);
  });

  document.cookie = "leagueIds=" + JSON.stringify(leagueIds);
  ("samesite=strict");
  window.location = "/league";
});

function removeTeam(id) {
  leagueArr = leagueArr.filter((el) => !(el.teamId == id));
  _id("preview" + id).remove();
  if (leagueArr.length < 1) {
    _id("showAddedTeams").classList.add("hidden");
    _id("continueLeague").classList.add("hidden");
  }
}

//när man sparar ligan på en databas
_id("saveLeague").addEventListener("click", saveLeague);

//sparar ligan på databasen
async function saveLeague(e) {
  e.preventDefault();

  let teamIds = [];

  leagueArr.forEach(function (player) {
    teamIds.push(player.teamId);
  });

  console.log(teamIds);

  let response = await fetch("/saveTeam", {
    method: "post",
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(teamIds),
  });
  response = await response.json();
  if (response.mes === "League saved") {
    _id("showAddedTeams").insertAdjacentHTML("beforeend", "<p>success</>");
    window.location = "/league";
  } else {
    _id("showAddedTeams").insertAdjacentHTML(
      "beforeend",
      "<p>Error saving league</>"
    );
  }
}

_id("teamId").addEventListener("click", (el) => {
  _id("teamId").classList.remove("inputError");
});

_id("teamId").addEventListener("onfocus", (el) => {
  _id("teamId").classList.remove("inputError");
});

_id("teamId").addEventListener("keydown", (el) => {
  _id("teamId").classList.remove("inputError");
});

_id("selectManager").addEventListener("click", (el) => {
  _id("selectManager").classList.remove("inputError");
});

_id("selectManager").addEventListener("onfcous", (el) => {
  _id("selectManager").classList.remove("inputError");
});

_id("getIdInfo").addEventListener("click", (el) => {
  _id("idInfo").classList.remove("hidden");
  _id("exitIdExpl").addEventListener("click", (el) => {
    _id("idInfo").classList.add("hidden");
  });
});

//helper
function _id(id) {
  return document.getElementById(id);
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
