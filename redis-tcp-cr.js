const net = require("node:net");

let lenToParse = 0;
let commandParseInfo = [];
let command = [];
const history = [];
let result = "";

const storage = {};

const server = net
	.createServer((socket) => {
		socket.on("data", (data) => {
			const parsed = Buffer.from(data)
				.toString("utf-8")
				.replace(/[\r\n]/gm, "");
			console.log(parsed);
			requestFramer(parsed, socket);
			responseProvider(socket);
		});
	})
	.on("data", (err) => {
		throw err;
	});

// *2 $5 lpush *3 *1 :1



*3
*2

function requestFramer(parsed, socket) {
	const typeIdentifier = parsed[0];
	const parsedInt = parseInt(parsed.slice(1)); // *2
	switch (typeIdentifier) {
		case "*":
			if (!lenToParse) lenToParse = parsedInt;
			commandParseInfo.push({ count: parsedInt, type: typeIdentifier })
			break;
		case "$":
			commandParseInfo.push({ count: parsedInt, type: typeIdentifier })
			break;
		case ":":
			commandParseInfo.push({ count: parsedInt, type: typeIdentifier })
			break;
		case "":
			return;
		default:
			const commandInfo = commandParseInfo[commandParseInfo.length - 1];

			if(commandInfo.type == '*') {
				
			}

			else {
				if(commandInfo.count != parsed) {
					socket.write("(error) String length mismatch");
					history.push({ command, result });
					clearState();
					return;
				}
				commandParseInfo.pop();
				command.push(parsed); // [ PING, WAT ]
			}
	}
}

// Separate the command
// Meta command
// Find which command it is
// $ - store the state

function responseProvider(socket) {
	if (lenToParse) return;
	command.forEach((v) => {
		switch (v.toUpperCase()) {
			case "PING":
				result += "PONG";
				break;
			case "HISTORY":
				result = JSON.stringify(history);
				break;
			default:
				result += " " + v;
		}
	});
	history.push(result);
	socket.write(result);
	clearState();
}

function clearState() {
	lenToParse = 0;
	strLength = 0;
	command = [];
	result = "";
}

// *1\r\n$4\r\nping\r\n

server.listen(12345, () => {
	console.log("opened server on", server.address());
});

// *1\r\n$4\r\nping\r\n
