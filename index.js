const mc = require('minecraft-protocol');
const sm = require('string-similarity')
const opn = require('opn');

const webserver = require('./webserver.js');

const itemList = require('./items.json')
const secrets = require('./secrets.json'); // read the creds
const config = require('./config.json');

let proxyClient;
let client;
let server;

let savedPackets = []
let estimatedTime = []
let lastQueue = { count: 9999, time: false }

let captcha = {}

/*
	Web server and server code taken from https://github.com/themoonisacheese/2bored2wait
*/

webserver.createServer(config.ports.web); // create the webserver
webserver.password = config.password
webserver.onstart(() => { // set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stop();
});

if (config.openBrowserOnStart) {
	opn('http://localhost:' + config.ports.web); //open a browser window
}

function stop () {
	webserver.isInQueue = false;
	webserver.queuePlace = "None";
	webserver.passedCaptcha = false
	webserver.ETA = "None";
	client.end(); // disconnect
	if (proxyClient) {
		proxyClient.end("Stopped the proxy."); // boot the player from the server
	}
	server.close(); // close the server
}

function getItemById (id) {
	return itemList.filter(r => r.id == id)[0]
}

startQueuing = () => {
	webserver.isInQueue = true;
	client = mc.createClient({
		host: "mc.salc1.com",
		port: 25565,
		username: secrets.username,
		password: secrets.password,
		version: '1.12.2'
	});

	console.log('Started')

	/* CLIENT */

	client.on('chat', function (packet) {
		let message = JSON.parse(packet.message);
		if (message.extra && message.extra[0].text == 'You are queued to join the server') {
			webserver.passedCaptcha = true
		}
		if (message.text && message.text.includes('Position in queue')) {
			let queuePlace = message.text.replace(/\u00A7[0-9A-FK-OR]/ig, '').replace('Position in queue: ', '')
			let parsedPlace = parseInt(queuePlace.match(/^\S*/)[0])
			if (parsedPlace < lastQueue.count) {
				if (lastQueue.time) {
					estimatedTime.push(Date.now() / 1000 - lastQueue.time / 1000)
				}
				lastQueue = { count: parsedPlace, time: Date.now() }
			}

			let size = estimatedTime.length
			let total = estimatedTime.reduce((a, b) => a + b, 0)
			let timePerPerson = total / size
			webserver.ETA = timePerPerson * parsedPlace

			webserver.queuePlace = queuePlace
			server.motd = `Place in queue: ${queuePlace}`;
		}
	});

	client.on('packet', function (data, meta) {

		if (meta.name == 'open_window') {
			let title = JSON.parse(data.windowTitle).text
			if (title.includes('Click the')) {
				captcha.requiredBlock = title
			}
		}

		if (meta.name == 'window_items' && captcha.requiredBlock) {
			let slots = data.items
			let parsedSlots = []
			slots.forEach((item, i) => {
				if (item) {
					let foundItem = getItemById(item.blockId)
					if (foundItem)
						parsedSlots.push({ name: foundItem.name, slot: i, blockId: item.blockId })
				}
			})
			captcha.slots = parsedSlots

			let requiredBlock = captcha.requiredBlock.replace('§0Click the §6§l', '').replace(/ /g, '_');
			captcha.requiredBlock = false
			slots = captcha.slots

			let searchSlots = []
			let indexes = []

			slots.forEach(function (slot) {
				if (slot) {
					searchSlots.push(slot.name);
					indexes.push({ slot: slot.slot, blockId: slot.blockId });
				}
			});

			let match = sm.findBestMatch(requiredBlock, searchSlots);
			let bestMatchedSlot = match.bestMatch.target
			bestMatchedSlot = indexes[searchSlots.indexOf(bestMatchedSlot)];

			client.write('window_click', {
				windowId: 1,
				slot: bestMatchedSlot.slot,
				mouseButton: 0,
				action: 1,
				mode: 0,
				item:
					{ blockId: bestMatchedSlot.blockid, itemCount: 1, itemDamage: 0, nbtData: undefined }
			})
		}

		if (!proxyClient && savedPackets.length < 800) {
			savedPackets.push({ data: data, meta: meta })
		}

		if (proxyClient) {
			filterPacketAndSend(data, meta, proxyClient);
		}
	})

	/* LOCAL SERVER */

	server = mc.createServer({ // create a server for us to connect to
		'online-mode': false,
		encryption: true,
		host: '0.0.0.0',
		port: config.ports.minecraft,
		version: config.MCversion,
		'max-players': maxPlayers = 1
	});

	server.on('login', (newProxyClient) => { // handle login
		newProxyClient.write('login', {
			entityId: newProxyClient.id,
			levelType: 'default',
			gameMode: 0,
			dimension: 0,
			difficulty: 2,
			maxPlayers: server.maxPlayers,
			reducedDebugInfo: false
		});
		newProxyClient.write('position', {
			x: 0,
			y: 1.62,
			z: 0,
			yaw: 0,
			pitch: 0,
			flags: 0x00
		});

		newProxyClient.on('packet', (data, meta) => { // redirect everything we do to SalC1 anarchy server
			filterPacketAndSend(data, meta, client);
		});

		proxyClient = newProxyClient;
		savedPackets.splice(0, 7)
		savedPackets.forEach((r, i) => {
			setTimeout(() => {
				filterPacketAndSend(r.data, r.meta, proxyClient)
			}, 1 * i);
		})
		savedPackets = []
	});


}

//function to filter out some packets that would make us disconnect otherwise.
//this is where you could filter out packets with sign data to prevent chunk bans.
function filterPacketAndSend (data, meta, dest) {
	if (meta.name != "keep_alive" && meta.name != "update_time") { //keep alive packets are handled by the client we created, so if we were to forward them, the minecraft client would respond too and the server would kick us for responding twice.
		dest.write(meta.name, data);
	}
}