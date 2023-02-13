const net = require("node:net");

let lenToParse = 0;
let strLength = 0;
let command = [];

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

function responseProvider(socket) {
	if (lenToParse) return;
	let result = "";
	command.forEach((v) => {
		switch (v.toUpperCase()) {
			case "PING":
				result += "PONG";
				break;
			default:
				result += " " + v;
		}
	});
	socket.write(result);
	clearState();
}

function clearState() {
	lenToParse = 0;
	strLength = 0;
	command = [];
}

function requestFramer(parsed, socket) {
	const typeIdentifier = parsed[0];
	switch (typeIdentifier) {
		case "*":
			lenToParse = parseInt(parsed.slice(1));
			break;
		case "$":
			strLength = parseInt(parsed.slice(1));
			break;
		case "":
			return;
		default:
			if (!lenToParse) lenToParse = 1;
			else lenToParse--;
			if (strLength !== parsed.length) {
				socket.write("(error) String length mismatch");
				clearState();
				return;
			}
			command.push(parsed);
	}
}

// *1\r\n$4\r\nping\r\n

server.listen(12345, () => {
	console.log("opened server on", server.address());
});
