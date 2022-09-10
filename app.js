const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER RUNNING AT HOST 3000");
    });
  } catch (error) {
    console.log(`DB ERROR:"${error.message}"`);
    process.exit(1);
  }
};

initializeDBAndServer();

//create user API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(selectUserQuery);
  const passwdLength = password.length;

  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO user(username,name,password,gender,location)
      VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}';`;
    if (passwdLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login user API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else if (dbUser !== undefined) {
    const isPasswdMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswdMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});
//update password API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const passwdLength = newPassword.length;
  const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  const getUserQuery = `
    SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else if (isPasswordMatched === true && passwdLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswdQuery = `
        UPDATE user SET password = "${hashedPassword}";`;
      await db.run(updatePasswdQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});
module.exports = app;
