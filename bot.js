const fs = require('fs')
const Discord = require('discord.js')
const auth = require('./authentication.js')
const connectionHandler = require('./connectionHandler.js')

const cachelength = 100 // Length of message history

const msghistory = {}
const client = new Discord.Client({ partials: ['MESSAGE'], shards: "auto", intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.MESSAGE_CONTENT] })

// https://stackoverflow.com/questions/1967119/why-does-javascript-replace-only-first-instance-when-using-replace

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  // console.log(client.channels.array());
})

client.on('message', async function (msg) {
  if (msghistory[msg.channel.id] && !(msghistory[msg.channel.id].get(msg.id))) {
    msghistory[msg.channel.id].set(msg.id, msg)

    if (msghistory[msg.channel.id].length > cachelength) {
      msghistory[msg.channel.id] = msghistory[msg.channel.id].slice(msghistory[msg.channel.id].length - (cachelength + 1), msghistory[msg.channel.id].length) // Limit the length of the cache to 50 messages
    }
  }

  // console.log(msghistory[msg.channel.id.toString()].length);
  if (msg.content === '^connect') {
    if (msg.webhookID) {
      msg.reply("you're already using Discross!")
    } else {
      msg.author.send('Verification code:\n`' + (await auth.createVerificationCode(msg.author.id)) + '`')
      msg.reply('you have been sent a direct message with your verification code.')
    }
  }

  // TODO: Do properly
  connectionHandler.sendToAll(msg.content, msg.channel.id)
})

// client.on('messageDelete

exports.startBot = async function () {
  client.login(fs.readFileSync('secrets/token.txt', 'utf-8').replace('\n', ''))
}

exports.addToCache = function (msg) {
  if (msghistory[msg.channel.id]) {
    msghistory[msg.channel.id].set(msg.id, msg)
  }
}

exports.getHistoryCached = async function (chnl) {
  if (!chnl.id) {
    chnl = client.channels.get(chnl)
  }
  if (!msghistory[chnl.id]) {
    const messagearray = await chnl.messages.fetch({ limit: cachelength })
    msghistory[chnl.id] = messagearray.sort((messageA, messageB) => messageA.createdTimestamp - messageB.createdTimestamp)
  }
  return Array.from(msghistory[chnl.id].values())
}

exports.client = client
