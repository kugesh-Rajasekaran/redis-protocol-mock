const net = require("node:net");
const fs = require("fs");

let stack = {};
let framedCommand = {};
const storage = {};
const history = {};

const server = net
	.createServer((socket) => {
		const id = parseInt(Math.random() * 100000);
		stack[id] = [];
		framedCommand[id] = [];
		history[id] = [];
		console.log("Client connected", id);

		socket.on("connect", (data) => {
			console.log("Connected");
		});
		socket.on("data", (data) => {
			const parsed = Buffer.from(data)
				.toString("utf-8")
				.replace(/[\r\n]/gm, "");
			console.log("Parsed: ", JSON.stringify({ parsed }));
			commandFramer(parsed, socket, id);
			console.log("Framed command: ", JSON.stringify({ stack, framedCommand }));
			resultFramer(socket, id);
		});
	})
	.on("data", (err) => {
		throw err;
	});

function commandFramer(command, socket, id) {
	console.log("Handling for commandFramer", { command, id });
	const typeIdentifier = command[0];
	const parsedInt = parseInt(command.slice(1));
	let info;
	switch (typeIdentifier) {
		case "*":
			if (!stack[id].length)
				info = {
					type: "*",
					count: parsedInt,
					ref: framedCommand[id],
				};
			else {
				const _ref = stack[id][stack[id].length - 1].ref;
				_ref.push([]);
				info = {
					type: "*",
					count: parsedInt,
					ref: _ref[_ref.length - 1],
				};
			}
			stack[id].push(info);
			break;

		case "$":
			// framedCommand[framedCommand.length] = "";
			info = {
				type: "$",
				count: parsedInt,
				ref: stack[id][stack[id].length - 1].ref,
			};
			stack[id].push(info);
			break;
		case ":":
			info = {
				type: ":",
				count: parsedInt,
				ref: stack[id][stack[id].length - 1].ref,
			};
			stack[id].push(info);
			break;
		default:
			const expectedDataInfo = stack[id][stack[id].length - 1];
			// if (typeMapper[expectedDataInfo.type] !== typeof command) {
			// 	socket.write(`(error) Invalid input: expected - ${typeMapper[expectedDataInfo.type]}, received - ${typeof command}`);
			// 	return;
			// }
			if (!stack[id].length) {
				socket.write(`(error) Invalid command`);
				return;
			}
			saveCommand(command, socket, id);
	}
}

function saveCommand(command, socket, id) {
	console.log("Handling for saveCommand", { command, id });
	const commandInfo = stack[id][stack[id].length - 1];
	console.log("saveCommand: ", command);
	switch (commandInfo.type) {
		case "*":
			commandInfo.ref.push(command);
			commandInfo.count -= 1;
			// Should handle with recursion
			if (!commandInfo.count) stack[id].pop();
			doPop(id);
			break;
		case ":":
		case "$":
			if (command.length !== commandInfo.count) {
				socket.write(`(error) Invalid input: expected - ${typeMapper[expectedDataInfo.count]}, received - ${command.length}`);
				return;
			}
			commandInfo.ref.push(command);
			// Should handle with recursion
			stack[id].pop();
			doPop(id);
			break;
	}
}

function resultFramer(socket, id) {
	console.log("Handling for resultFramer", { id });
	if (stack[id].length || !framedCommand[id].length) return;
	console.log("Framed Result: ", framedCommand);
	let result = "";
	// for (let itr = 0; itr < framedCommand.length; itr++) {
	switch (framedCommand[id][0].toUpperCase()) {
		case "PING":
			result = `PONG ${framedCommand[id].filter((v, i) => i != 0).join(" ")}`;
			break;
		case "HSET":
			result = framedCommand[id].filter((v, i) => i != 0).flat().length;
			break;
		case "SET":
			const content = framedCommand[id].filter((v, i) => i != 0);
			storage[id] || (storage[id] = {});
			storage[id][content[0]] = content[1];
			break;
		case "GET":
			result = storage[id][framedCommand[id][1]];
			break;
		case "HISTORY":
			result = history[id];
			break;
	}
	// }
	socket.write(result);
	quitState(result, id);
}

function quitState(result, id) {
	history[id].push({
		result,
		framedCommand,
	});
	stack[id] = [];
	framedCommand[id] = [];
}

// We need to know
// 1. The command starting
// 2. The command ends - *2 ,

// meta command
// executable command

function doPop(id) {
	let commandInfo = stack[id][stack[id].length - 1];
	while (commandInfo) {
		if (commandInfo.count !== 1) {
			commandInfo.count -= 1;
			return;
		}
		stack[id].pop();
		commandInfo = stack[id][stack[id].length - 1];
	}
}

const typeMapper = {
	"*": "object",
	$: "string",
	":": "number",
};

server.listen(12345, () => {
	console.log("opened server on", server.address());
});
