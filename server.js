const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const LISTEN_CHANNELS = [
    "1443681859522269405",
    "1443681879122379028",
    "1443681898063728753",
    "1443681916917121148",
    "1443681936064385125"
];

const REPORT_CHANNEL = "1444688574099226825";

let channelData = {};
LISTEN_CHANNELS.forEach(id => {
    channelData[id] = {
        acilanBalik: 0,
        atilanCop: 0,
        istiridye: 0,
        oltayaTakilan: 0
    };
});

function getValuesFromMessage(msg) {
    if (msg.embeds.length === 0) return null;

    let data = {
        acilanBalik: null,
        atilanCop: null,
        istiridye: null,
        oltayaTakilan: null
    };

    msg.embeds.forEach(embed => {
        if (embed.fields) {
            embed.fields.forEach(f => {
                let num = Number(f.value.trim());
                if (isNaN(num)) return;

                if (f.name.includes("Açılan Balık") || f.name.includes("🎣")) {
                    data.acilanBalik = num;
                } else if (f.name.includes("Atılan Çöp") || f.name.includes("🗑️")) {
                    data.atilanCop = num;
                } else if (f.name.includes("İstiridye") || f.name.includes("🐚")) {
                    data.istiridye = num;
                } else if (f.name.includes("Oltaya Takılan") || f.name.includes("👀")) {
                    data.oltayaTakilan = num;
                }
            });
        }
    });

    return data;
}

function getTotals() {
    let totals = { acilanBalik: 0, atilanCop: 0, istiridye: 0, oltayaTakilan: 0 };

    Object.values(channelData).forEach(data => {
        totals.acilanBalik += data.acilanBalik;
        totals.atilanCop += data.atilanCop;
        totals.istiridye += data.istiridye;
        totals.oltayaTakilan += data.oltayaTakilan;
    });

    return totals;
}

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Bot giriş yaptı: ${readyClient.user.tag}`);

    for (const channelId of LISTEN_CHANNELS) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel) {
                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMsg = messages.first();

                if (lastMsg) {
                    const data = getValuesFromMessage(lastMsg);
                    if (data) {
                        if (data.acilanBalik !== null) channelData[channelId].acilanBalik = data.acilanBalik;
                        if (data.atilanCop !== null) channelData[channelId].atilanCop = data.atilanCop;
                        if (data.istiridye !== null) channelData[channelId].istiridye = data.istiridye;
                        if (data.oltayaTakilan !== null) channelData[channelId].oltayaTakilan = data.oltayaTakilan;
                    }
                }
            }
        } catch (err) {
            console.log(`Kanal ${channelId} okunamadı:`, err.message);
        }
    }

    const totals = getTotals();

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("📊 Toplam İstatistikler")
        .addFields(
            { name: "🎣 Açılan Balık", value: `${totals.acilanBalik}`, inline: false },
            { name: "────────────", value: "‎", inline: false },
            { name: "🗑️ Atılan Çöp", value: `${totals.atilanCop}`, inline: false },
            { name: "────────────", value: "‎", inline: false },
            { name: "🐚 İstiridye", value: `${totals.istiridye}`, inline: false },
            { name: "────────────", value: "‎", inline: false },
            { name: "👀 Oltaya Takılan Balık", value: `${totals.oltayaTakilan}`, inline: false }
        );

    let ch = client.channels.cache.get(REPORT_CHANNEL);
    if (ch) {
        await ch.send({ embeds: [embed] });
        console.log("Rapor gönderildi.");
    }

    setTimeout(() => {
        console.log("Bot kapatılıyor...");
        client.destroy();
        process.exit(0);
    }, 5000);
});

client.login(process.env.DISCORD_BOT_TOKEN);
