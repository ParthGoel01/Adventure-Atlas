import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import util from "util";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import env from "dotenv";
import pg from "pg";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import path from 'path';
import connectPgSimple from "connect-pg-simple";
import * as fuzz from 'fuzzball';

env.config();
const { Pool } = pg;
const app = express();
const hashPassword = util.promisify(bcrypt.hash); 
const port = process.env.PORT;
const salt = parseInt(process.env.SALT);
const __dirname = new URL('.', import.meta.url).pathname;

const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
db.connect((err) => {
  if (err) console.log(err);
  else console.log('database connected successfully');
});
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const pgSession = connectPgSimple(session);
app.use(
  session({
    store: new pgSession({
      pool: db,
      tableName: 'user_sessions',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    let countries = await checkVisitedCountry(req.user.email);
    res.render("Home", { countries: countries, total: countries.length });
  } else res.redirect("/Homepage");
});

app.get('/Homepage', (req, res) => {
  res.render('Homepage');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/logout', (req, res) => {
  req.logout(err => {});
  res.redirect('/Homepage');
});

app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/terms', (req, res) => {
  res.render('terms');
});

app.get('/auth/google', passport.authenticate("google", {
  scope: ["profile", "email"],
}));

app.get('/auth/google/home', passport.authenticate("google", {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.post('/user_login', passport.authenticate('local', {
  session: true,
  successRedirect: "/",
  failureRedirect: "/login",
}));

app.post('/user_signup', async (req, res) => {
  const name = req.body.username;
  const email = req.body.email_id;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * from Users where email = $1", [email]);
    if (checkResult.rows.length > 0) {
      res.send(`<script>
        alert('User Already Exists. Redirecting to Login Page');
        window.location.href='/login';
        </script>`);
    } else {
      const hash = await hashPassword(password, salt);
      const result = await db.query("INSERT INTO Users(email,password,username) values($1,$2,$3) RETURNING *", [email, hash, name]);
      const user = result.rows[0];
      req.login(user, () => {
        res.redirect('/');
      });
    }
  } catch (err) { 
    res.send(`<script>
        alert('Error Signing Up! Please Try Again. Redirecting to SignUp Page');
        window.location.href='/signup';
        </script>`);
  }
});

// Flag To Country
let FlagToCountryQuiz = [];
db.query("SELECT * FROM flags", (err, res) => {
  if (err) { console.error("Error! Please Try Again Later.", err.stack); }
  else { FlagToCountryQuiz = res.rows; }
});

let FTC_totalCorrect = 0;
let currentFlagToCountry = {};
app.get("/FlagToCountry", async (req, res) => {
  if (req.isAuthenticated()) {
    FTC_totalCorrect = 0;
    await FTC_nextQuestion();
    const result = await db.query("SELECT b_score_ftc FROM users WHERE email = $1", [req.user.email]);
    res.render("FlagToCountry", { question: currentFlagToCountry, BestScore: result.rows[0].b_score_ftc });
  }
  else res.redirect('/');
});

app.post("/FlagToCountryGuess", async (req, res) => {
    let answer = req.body.answer.trim().toLowerCase();
    let isCorrect = false;
  
    if (answer) {
      const similarity = fuzz.ratio(answer, currentFlagToCountry.country.toLowerCase());
      const threshold = 80;
  
      if (similarity >= threshold) {
        FTC_totalCorrect++;
        isCorrect = true;
      }
    }
  
    await FTC_nextQuestion();
    const email = req.user.email;
    const result = await db.query("SELECT b_score_ftc FROM users WHERE email = $1", [email]);
    let currentBestScore = result.rows[0].b_score_ftc;
    if (FTC_totalCorrect > currentBestScore) {
      await db.query("UPDATE users SET b_score_ftc = $1 WHERE email = $2", [FTC_totalCorrect, email]);
      currentBestScore = FTC_totalCorrect;
    }
    res.render("FlagToCountry", {
      question: currentFlagToCountry,
      wasCorrect: isCorrect,
      totalScore: FTC_totalCorrect,
      BestScore: currentBestScore
    });
  });
  

async function FTC_nextQuestion() {
  const randomCountry = FlagToCountryQuiz[Math.floor(Math.random() * FlagToCountryQuiz.length)];
  currentFlagToCountry = randomCountry;
}

// Capital Quiz
let CapitalQuiz = [];
db.query("SELECT * FROM capitals", (err, res) => {
  if (err) {
    console.error("Error! Please Try Again Later.", err.stack);
  } else {
    CapitalQuiz = res.rows;
  }
});

let CQ_totalCorrect = 0;
let CQ_currentQuestion = {};
app.get("/CapitalQuiz", async (req, res) => {
  if (req.isAuthenticated()) {
    CQ_totalCorrect = 0;
    await CQ_nextQuestion();
    const result = await db.query("SELECT b_score_cq FROM users WHERE email = $1", [req.user.email]);
    res.render("CapitalQuiz", { question: CQ_currentQuestion, BestScore: result.rows[0].b_score_cq });
  }
  else res.redirect('/');
});

app.post("/CapitalQuizGuess", async (req, res) => {
    let answer = req.body.answer.trim().toLowerCase();
    let isCorrect = false;
  
    if (answer) {
      const similarity = fuzz.ratio(answer, CQ_currentQuestion.capital.toLowerCase());
      const threshold = 80;
  
      if (similarity >= threshold) {
        CQ_totalCorrect++;
        isCorrect = true;
      }
    }
  
    await CQ_nextQuestion();
    const email = req.user.email;
    const result = await db.query("SELECT b_score_cq FROM users WHERE email = $1", [email]);
    let currentBestScore = result.rows[0].b_score_cq;
    if (CQ_totalCorrect > currentBestScore) {
      await db.query("UPDATE users SET b_score_cq = $1 WHERE email = $2", [CQ_totalCorrect, email]);
      currentBestScore = CQ_totalCorrect;
    }
    res.render("CapitalQuiz", {
      question: CQ_currentQuestion,
      wasCorrect: isCorrect,
      totalScore: CQ_totalCorrect,
      BestScore: currentBestScore
    });
  });

async function CQ_nextQuestion() {
  const randomCountry = CapitalQuiz[Math.floor(Math.random() * CapitalQuiz.length)];
  CQ_currentQuestion = randomCountry;
}

// Travel Tracker
async function checkVisitedCountry(email) {
  const result = await db.query("SELECT country_code FROM visited_countries where email = $1", [email]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/TravelTracker", async (req, res) => {
  if (req.isAuthenticated()) {
    const email = req.user.email;
    let countries = await checkVisitedCountry(email);
    res.render("TravelTracker", { countries: countries, total: countries.length });
  }
  else res.redirect('/');
});

app.post("/addTravel", async (req, res) => {
  const email = req.user.email;
  const input = req.body["country"];

  try {
    const result = await db.query(`SELECT country_code FROM countries WHERE LOWER(country_name) = LOWER($1) UNION SELECT country_code FROM countries WHERE LOWER(country_name) LIKE LOWER($1) || '%'`, [input]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (email,country_code) VALUES ($1,$2)", [email, countryCode]);
      res.redirect("/TravelTracker");
    } catch (err) {
      console.log(err);
      const countries = await checkVisitedCountry(email);
      res.render("TravelTracker", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    const countries = await checkVisitedCountry(email);
    res.render("TravelTracker", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

passport.use('local', new LocalStrategy(async function verify(username, password, cb) {
  try {
    const result = await db.query('SELECT * FROM Users WHERE email = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const stored_pass = user.password;

      bcrypt.compare(password, stored_pass, (err, result) => {
        if (err) return cb(err);
        if (result) return cb(null, user);
        else return cb(null, false);
      });
    } else {
      return cb("User Not Found");
    }
  } catch (err) {
    return cb(err);
  }
}));

passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/home",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async (accessToken, refreshToken, profile, cb) => {
  try {
    const result = await db.query('SELECT * from users where email=$1', [profile.email]);
    if (result.rows.length == 0) {
      const newUser = await db.query('INSERT INTO users(email,password,username) values($1,$2,$3)', [profile.email, "google", profile.given_name + " " + profile.family_name]);
      cb(null, newUser.rows[0]);
    } else {
      cb(null, result.rows[0]);
    }
  } catch (err) {
    cb(err);
  }
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser(async (user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
