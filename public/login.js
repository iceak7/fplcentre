getLogInIcon();

async function getLogInIcon(){
    console.log("logged in körs")

    let response = await fetch("/loggedIn");
 
    let resp = await response.json();

    if(resp.mes==="logged in"){
        _id("header").insertAdjacentHTML("beforeend", "<div class='loginIconDiv'> <i title='Sign Out' id='logoutIcon' class='fas fa-sign-out-alt'></i> </>");
        _id("logoutIcon").addEventListener("click", async()=>{
            let response = await fetch("/logOut");
            let respon = await response.json();

            if(respon.mes==="logged out"){
                _id("logoutIcon").remove();
                _id("header").insertAdjacentHTML("beforeend", "<div class='loginIconDiv'> <i title='Sign In' id='loginIcon' class='fas fa-sign-in-alt'></i> </>");
                _id("loginIcon").addEventListener("click", getLoginView);
            }

        });
    }

    else{
        _id("header").insertAdjacentHTML("beforeend", "<div class='loginIconDiv'> <i title='Sign Out' id='loginIcon' class='fas fa-sign-in-alt'></i> </>");
        _id("loginIcon").addEventListener("click", getLoginView);
    }
}



function getLoginView(){
  
    let htmlString=`
    <div id='loginBackgroundDiv'>
        <div id='loginDiv'>
            <i id="exitLogin" class='far fa-times-circle'></i>
            <div id="loginDivContainer">
            <h2 id="loginTitle">Login</h2>
            <p id="loginErrorMes"></p>
            <input id = "email" type="email" name="email" placeholder="email">
            <input id = "password" type="password" name="password" placeholder="password">
            <br>
            <button  type="button"  id="loginButton" class="loginButton">Sign In</button>

            <p id="createAccFromLogin">Don't have an account? Create one...</p>
            </div>
        </div>
        
    </div>
    
    `
    _id("header").insertAdjacentHTML("beforebegin",htmlString)

    _id("loginButton").addEventListener("click", login)

    _id("createAccFromLogin").addEventListener("click", ()=>{
        createAccString=`
            <div id='loginCreateAcc'>
            <h2 id="loginCreateTitle">Create Account</h2>
            <input id = "newEmail" type="email" name="email" placeholder="email">
            <input id = "newPassword" type="password" name="password" placeholder="password">
            <br>
            <button  type="button"  id="loginCreateButton" class="loginButton">Create Account</button>
            </div>
        `;

        _id("createAccFromLogin").insertAdjacentHTML("afterend", createAccString)

        _id("loginCreateButton").addEventListener("click", register)


    })

    _id("exitLogin").addEventListener("click",el=>{
        _id("loginBackgroundDiv").remove();
    })
}


async function login(e){

    _id("loginErrorMes").innerHTML="";
    e.preventDefault();

    let email = _id("email").value;
    let password = _id("password").value;
    let user = {email,password};

    let response = await fetch("/login",{
        method:"post",
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body:JSON.stringify(user)
    });
    response = await response.json();
    console.log(response);
    if(response.mes=="logged in"){
        _id("loginDivContainer").innerHTML="<h2>You are logged in!</h2><h3>Welcome!</h3>"
        
        _id("loginIcon").remove();
        _id("header").insertAdjacentHTML("beforeend", "<div class='loginIconDiv'> <i title='Log Out' id='logoutIcon' class='fas fa-sign-out-alt'></i> </>");
        _id("logoutIcon").addEventListener("click", async()=>{
            let response = await fetch("/logOut");
            let respon = await response.json();

            if(respon.mes==="logged out"){
                _id("logoutIcon").remove();
                _id("header").insertAdjacentHTML("beforeend", "<div class='loginIconDiv'> <i title='Log In' id='loginIcon' class='fas fa-sign-in-alt'></i> </>");
                _id("loginIcon").addEventListener("click", getLoginView);
            }

        });
    }
    else{
        _id("loginErrorMes").innerHTML="<p>Login failed</p>"; 
    }
}


async function register(e){
    e.preventDefault();

    let email = _id("newEmail").value;
    let password = _id("newPassword").value;
    let user = {email,password};

    let response = await fetch("/register",{
        method:"post",
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body:JSON.stringify(user)
    });
    response = await response.json();
    if(response.mes=="User Created"){
        _id("loginCreateAcc").innerHTML="<h3>Account registered</h3>"
    }
}




function _id(id){
    return document.getElementById(id);

}