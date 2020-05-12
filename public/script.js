let leagueArr=[];

console.log(getCookie("leagueIds"));
if(getCookie("leagueIds")){
    _id("leagueLinkBox").classList.add("visible");

}
else{
    console.log("false")
}

//när man lägger till ett lag med id
_id("enterId").addEventListener("click", el=>{
    inputVal=_id("teamId").value
    if(parseInt(inputVal)==inputVal){
        if(parseInt(inputVal)>0){
            if(!(leagueArr.find(x => x.teamId == inputVal))){       
                printTeamPreview(inputVal);
            }
            else{
                _id("teamId").classList.add("inputError");
            }
            
        }  
        else{
            _id("teamId").classList.add("inputError");
        }     
    }
    else{
        _id("teamId").classList.add("inputError");
    }

    if(leagueArr.length>0){
        _id("showAddedTeams").classList.remove("hidden");
        _id("continueLeague").classList.remove("hidden");
    }
});



//när man läger till ett lag med spelarmenyn
_id("enterManager").addEventListener("click", el=>{
    inputVal= _id("selectManager").options[_id("selectManager").selectedIndex].value;

    if(parseInt(inputVal)==inputVal){
        if(parseInt(inputVal)>0){
            if(!(leagueArr.find(x => x.teamId == inputVal))){       
                printTeamPreview(inputVal);
            }
            else{
                _id("selectManager").classList.add("inputError");
            }
        }       
    }
    if(leagueArr.length>0){
        _id("showAddedTeams").classList.remove("hidden");
        _id("continueLeague").classList.remove("hidden");
    }
});


//printar ut lagen man lagt till i sin liga
async function printTeamPreview(teamId){
    try{
        _id("loader").classList.remove("hidden");
        const data = await fetch("https://fplapiisak.herokuapp.com/entry/"+teamId);
        let playerData = await data.json();
        if(!(playerData.detail=="Not found.")){
            leagueArr.push({teamId, playerData});
            _id("showAddedTeams").innerHTML+=`
            <div class="previewPlayer" id="preview${teamId}">
            <div class="previewName">${playerData.player_first_name} ${playerData.player_last_name}</div>
            <div class="previewTeamName">${playerData.name}</div>
            <div class="previewRemove" onclick="removeTeam(${teamId})"><i class="fas fa-times"></i></div>
            </div>
            `
            if(leagueArr.length>0){
                _id("showAddedTeams").classList.remove("hidden");
                _id("continueLeague").classList.remove("hidden");
            }
        }
        else{
            _id("teamId").classList.add("inputError");
        }
        _id("loader").classList.add("hidden");
       
    }
    
    catch(err){
        console.log(err);
        console.log("error getting players",playerIds[i]);
    }
}


// när man går vidare med ligan
_id("continueLeague").addEventListener("click", el=>{

    let leagueIds=[];

    leagueArr.forEach(function(player){
        leagueIds.push(player.teamId);
    });

    document.cookie= "leagueIds="+JSON.stringify(leagueIds); "samesite=strict";
    window.location="/league";

})

function removeTeam(id){
    leagueArr=leagueArr.filter(el=>!(el.teamId==id));
    _id("preview"+id).remove();
    if(leagueArr.length<1){
        _id("showAddedTeams").classList.add("hidden");
        _id("continueLeague").classList.add("hidden");
    }
}

_id("teamId").addEventListener("click",el=>{
    _id("teamId").classList.remove("inputError");
});

_id("teamId").addEventListener("onfocus", el=>{
    _id("teamId").classList.remove("inputError");
});

_id("teamId").addEventListener("keydown", el=>{
    _id("teamId").classList.remove("inputError");
});

_id("selectManager").addEventListener("click", el=>{
    _id("selectManager").classList.remove("inputError");
});

_id("selectManager").addEventListener("onfcous", el=>{
    _id("selectManager").classList.remove("inputError");
});

_id("getIdInfo").addEventListener("click", el=>{
    _id("idInfo").classList.remove("hidden");
    _id("exitIdExpl").addEventListener("click",el=>{
        _id("idInfo").classList.add("hidden");
    })
});

//helper
function _id(id){
    return document.getElementById(id);

}


//hämta cookie
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
