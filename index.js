const { Client, GatewayIntentBits, Events, EmbedBuilder } = require("discord.js");
require("./server.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// === Dinlenecek kanallar ===
const LISTEN_CHANNELS = [
    "1443681859522269405",
    "1443681879122379028",
    "1443681898063728753",
    "1443681916917121148",
    "1443681936064385125"
];

// === Rapor kanal ===
const REPORT_CHANNEL = "1444688574099226825";

// Her kanalın verileri
let channelData = {};
LISTEN_CHANNELS.forEach(id => {
    channelData[id] = {
        acilanBalik: 0,
        atilanCop: 0,
        istiridye: 0,
        oltayaTakilan: 0
    };
});

// === Embed'den tüm değerleri çıkar ===
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
                } else if (f.name.includes("İstiridye") || f.name.includes("istiridye") || f.name.includes("🐚")) {
                    data.istiridye = num;
                } else if (f.name.includes("Oltaya Takılan") || f.name.includes("👀")) {
                    data.oltayaTakilan = num;
                }
            });
        }
    });
    
    return data;
}

// === Mesaj dinleyici ===
client.on("messageCreate", msg => {
    if (!LISTEN_CHANNELS.includes(msg.channel.id)) return;

    const data = getValuesFromMessage(msg);
    if (data) {
        if (data.acilanBalik !== null) channelData[msg.channel.id].acilanBalik = data.acilanBalik;
        if (data.atilanCop !== null) channelData[msg.channel.id].atilanCop = data.atilanCop;
        if (data.istiridye !== null) channelData[msg.channel.id].istiridye = data.istiridye;
        if (data.oltayaTakilan !== null) channelData[msg.channel.id].oltayaTakilan = data.oltayaTakilan;
        console.log(`Güncellendi - Kanal ${msg.channel.id}`);
    }
});

// === Toplamları hesapla ===
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

// === 10 dakikada bir embed rapor gönder ===
setInterval(() => {
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
        ch.send({ embeds: [embed] });
    }
}, 15 * 60 * 1000);

// === Bot hazır olduğunda son mesajları kontrol et ===
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
                        console.log(`Başlangıç - Kanal ${channelId}: Balık=${data.acilanBalik}, Çöp=${data.atilanCop}, İstiridye=${data.istiridye}, Oltaya=${data.oltayaTakilan}`);
                    }
                }
            }
        } catch (err) {
            console.log(`Kanal ${channelId} okunamadı:`, err.message);
        }
    }
    
    console.log("Tüm kanallar kontrol edildi!");
    
    // İlk açılışta rapor gönder
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
        ch.send({ embeds: [embed] });
    }
});

// === Botu başlat ===
client.login(process.env.DISCORD_BOT_TOKEN);
