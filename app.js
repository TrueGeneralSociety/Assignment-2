require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;
const MONGODB_SESSION_SECRET = process.env.MONGODB_SESSION_SECRET;
const NODE_SESSION_SECRET = process.env.NODE_SESSION_SECRET;

const MONGO_URI =
  process.env.MONGO_URI ||
  `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/?appName=${MONGODB_DATABASE}`;

let userCollection;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");
  const db = client.db(MONGODB_DATABASE);
  userCollection = db.collection("users");
}

connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

// Middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: NODE_SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      crypto: { secret: MONGODB_SESSION_SECRET },
      collectionName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000,
      secure: false,
    },
  }),
);

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  if (req.session.user_type !== "admin") {
    return res.status(403).render("403");
  }
  next();
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.render("index", {
    loggedIn: !!req.session.userId,
    name: req.session.name || "",
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

app.post("/signupSubmit", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name) return res.render("signup", { error: "Name is required." });
  if (!email) return res.render("signup", { error: "Email is required." });
  if (!password)
    return res.render("signup", { error: "Password is required." });

  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const { error } = schema.validate({ name, email, password });
  if (error)
    return res.render("signup", { error: "Invalid input. Please try again." });

  const passwordHash = await bcrypt.hash(password, 10);

  await userCollection.insertOne({
    name,
    email,
    passwordHash,
    user_type: "user",
  });

  req.session.userId = email;
  req.session.name = name;
  req.session.user_type = "user";
  res.redirect("/members");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/loginSubmit", async (req, res) => {
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const { error } = schema.validate({ email, password });
  if (error) return res.render("login", { error: "Invalid input." });

  const user = await userCollection.findOne({ email });
  if (!user)
    return res.render("login", {
      error: "Invalid email/password combination.",
    });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    return res.render("login", {
      error: "Invalid email/password combination.",
    });

  req.session.userId = user.email;
  req.session.name = user.name;
  req.session.user_type = user.user_type || "user";
  res.redirect("/members");
});

app.get("/members", requireLogin, (req, res) => {
  const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
  res.render("members", { name: req.session.name, images });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed");
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

app.get("/admin", requireAdmin, async (req, res) => {
  const users = await userCollection.find({}).toArray();
  res.render("admin", { users, currentUser: req.session.userId });
});

app.post("/admin/promote", requireAdmin, async (req, res) => {
  const schema = Joi.object({ email: Joi.string().email().required() });
  const { error } = schema.validate({ email: req.body.email });
  if (error) return res.redirect("/admin");

  await userCollection.updateOne(
    { email: req.body.email },
    { $set: { user_type: "admin" } },
  );
  res.redirect("/admin");
});

app.post("/admin/demote", requireAdmin, async (req, res) => {
  const schema = Joi.object({ email: Joi.string().email().required() });
  const { error } = schema.validate({ email: req.body.email });
  if (error) return res.redirect("/admin");

  await userCollection.updateOne(
    { email: req.body.email },
    { $set: { user_type: "user" } },
  );
  res.redirect("/admin");
});

// 404
app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
