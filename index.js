const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");

const app = express();

const mongo = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const conString = process.env.fplString;

app.use(express.json());
app.use(cookieParser());

app.use(express.static(__dirname + "/public"));

async function getDb() {
  try {
    const con = await mongo.connect(conString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = await con.db("FPLLeagueCentre");
    return db;
  } catch (error) {
    process.exit();
  }
}

(async function () {
  db = await getDb();
  colUsers = await db.collection("Users");
  leagues = await db.collection("Leagues");
})();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get(
  "/league",
  async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
      try {
        let user = jwt.verify(token, process.env.fplSecret);
        next();
      } catch (error) {
        if (req.cookies.leagueIds) {
          next();
        } else {
          res.redirect("/");
        }
      }
    } else if (req.cookies.leagueIds) {
      next();
    } else {
      res.redirect("/");
    }
  },
  (req, res) => {
    res.sendFile(__dirname + "/public/LeagueView/index.html");
  }
);

app.get("/league/:code", async (req, res) => {
  res.sendFile(__dirname + "/public/LeagueView/index.html");
});

app.post("/register", validateUser, async (req, res) => {
  let user = { ...req.body };
  let userCheck;
  try {
    userCheck = await colUsers.find({ email: user.email }).toArray();
  } catch {
    console.log("Error finding user");
  }

  if (userCheck.length === 0) {
    try {
      let userId = Date.now();
      let password = await bcrypt.hash(user.password, 12);
      const newUser = { email: user.email, password: password, userId: userId };
      await colUsers.insertOne(newUser);
      let token = jwt.sign({ email: user.email }, process.env.fplSecret, {
        expiresIn: 86400000,
      });
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 86400000,
      });
      res.send({ mes: "User Created" });
    } catch {
      console.log("Error adding user");
    }
  } else {
    console.log("user existed");
    res.send({ mes: "user exists" });
  }

  /**
   * Registera m h a email verifikation
   * skapa tillfällig token
   * Skicka till email med länk eller kod
   * Verifiera via ny route och uppdatera user med verified:true
   */
});

app.post("/saveTeam", auth, async (req, res) => {
  const token = req.cookies.token;

  let leagueTeamIds = req.body;

  let userCheck;
  let userEmail;
  if (token) {
    try {
      const user = jwt.verify(token, process.env.fplSecret);
      userEmail = user.email;
      userCheck = await leagues.find({ user: user.email }).toArray();
    } catch (error) {
      res.send({ mes: "error stage 1" });
    }
  } else {
    res.send({ mes: "not logged in" });
  }

  try {
    if (userCheck.length === 0) {
      let code = await createLeagueCode();
      if (code === "error") {
        res.send({ mes: "error stage 2" });
      }
      const newLeagueSaved = {
        user: userEmail,
        leagueIds: leagueTeamIds,
        leagueCode: code,
      };
      await leagues.insertOne(newLeagueSaved);
      res.send({ mes: "League saved" });
    } else {
      const leagueSaved = { user: userEmail, leagueIds: leagueTeamIds };
      await leagues.updateOne({ user: userEmail }, { $set: leagueSaved });

      res.send({ mes: "League saved" });
    }
  } catch (error) {
    console.log(error);
    res.send({ mes: "error stage 2" });
  }
});

app.post("/getTeamByLogin", auth, async (req, res) => {
  const token = req.cookies.token;

  let userCheck;
  let userEmail;
  if (token) {
    try {
      const user = jwt.verify(token, process.env.fplSecret);
      userEmail = user.email;
      userCheck = await leagues.find({ user: user.email }).toArray();
    } catch (error) {
      res.send({ mes: "error stage 1" });
    }
  } else {
    res.send({ mes: "not logged in" });
  }
  try {
    if (userCheck.length === 1) {
      let data = await leagues.findOne({ user: userEmail });
      let teamIds = data.leagueIds;

      res.send({ mes: "success", ids: teamIds });
    } else {
      res.send({ mes: "no saved league" });
    }
  } catch {
    res.send({ mes: "error stage 2" });
  }
});

app.post("/login", validateUser, async (req, res) => {
  /**
   * 1. läs in body
   * 2. validera body!!
   * 3. kolla om användare existerar
   * 4. om så, kolla lösenord
   * 5. skicka response
   *
   */

  let user = { ...req.body };

  let userCheck;
  try {
    userCheck = await colUsers.find({ email: user.email }).toArray();
  } catch {
    console.log("Error finding user");
  }

  if (userCheck.length === 1) {
    bcrypt.compare(user.password, userCheck[0].password, (err, success) => {
      if (success) {
        let token = jwt.sign({ email: user.email }, process.env.fplSecret, {
          expiresIn: 86400000,
        });
        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 86400000,
        });
        res.status(202).send({ mes: "logged in" });
      } else {
        res.send({ mes: "bad request" });
      }
    });
  } else {
    res.status(400).send({ mes: "No user" });
  }
});

app.post("/loggedIn", auth, (req, res) => {
  res.send({ mes: "logged in" });
});

app.post("/logOut", auth, (req, res) => {
  res.clearCookie("token");
  res.send({ mes: "logged out" });
});

async function validateUser(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4),
  });

  try {
    let user = await schema.validateAsync(req.body);
    next();
  } catch (error) {
    res.send({ mes: "bad input" });
  }
}

function auth(req, res, next) {
  const token = req.cookies.token;

  if (token) {
    try {
      let user = jwt.verify(token, process.env.fplSecret);
      next();
    } catch (error) {
      res.send({ mes: "no valid token" });
    }
  } else {
    res.send({ mes: "must be authorized" });
  }
}

async function createLeagueCode() {
  let idFound = false;
  let foundCode;
  while (idFound === false) {
    let randomNr = Math.floor(Math.random() * 1000) + 1;

    console.log("randomNr " + randomNr);

    let codeCheck;
    try {
      codeCheck = await leagues.find({ leagueCode: randomNr }).toArray();

      console.log("codeCheck " + codeCheck);

      if (codeCheck.length === 0) {
        console.log("true");
        foundCode = randomNr;
        idFound = true;
      }
    } catch {
      console.log("Error finding user");
      idFound === true;
      return "error";
    }
  }

  return foundCode;
}

const port = process.env.PORT || 3501;
app.listen(port, () => console.log("port: " + port));
