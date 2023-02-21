const net = require("node:net");

let stack = [];
let framedCommand = [];
const history = [];

const server = net
	.createServer((socket) => {
		socket.on("data", (data) => {
			const parsed = Buffer.from(data)
				.toString("utf-8")
				.replace(/[\r\n]/gm, "");
			console.log("Parsed: ", parsed);
			commandFramer(parsed, socket);
			console.log("Framed command: ", JSON.stringify({ stack, framedCommand }));
			resultFramer(socket);
		});
	})
	.on("data", (err) => {
		throw err;
	});

function resultFramer(socket) {
	if (stack.length || !framedCommand.length) return;
	console.log("Framed Result: ", framedCommand);
	let result = "";
	// for (let itr = 0; itr < framedCommand.length; itr++) {
	switch (framedCommand[0].toUpperCase()) {
		case "PING":
			result = `PONG ${framedCommand.filter((v, i) => i != 0).join(" ")}`;
			break;
		case "HSET":
			result = framedCommand.filter((v, i) => i != 0).flat().length;
			break;
		case "HISTORY":
			result = history;
			break;
	}
	// }
	socket.write(JSON.stringify(result));
	quitState(result);
}

function quitState(result) {
	history.push({
		result,
		framedCommand,
	});
	stack = [];
	framedCommand = [];
}

function commandFramer(command, socket) {
	const typeIdentifier = command[0];
	const parsedInt = parseInt(command.slice(1));
	let info;
	switch (typeIdentifier) {
		case "*":
			if (!stack.length)
				info = {
					type: "*",
					count: parsedInt,
					ref: framedCommand,
				};
			else {
				const _ref = stack[stack.length - 1].ref;
				_ref.push([]);
				info = {
					type: "*",
					count: parsedInt,
					ref: _ref[_ref.length - 1],
				};
			}
			stack.push(info);
			break;

		case "$":
			// framedCommand[framedCommand.length] = "";
			info = {
				type: "$",
				count: parsedInt,
				ref: stack[stack.length - 1].ref,
			};
			stack.push(info);
			break;
		case ":":
			info = {
				type: ":",
				count: parsedInt,
				ref: stack[stack.length - 1].ref,
			};
			stack.push(info);
			break;
		default:
			const expectedDataInfo = stack[stack.length - 1];
			// if (typeMapper[expectedDataInfo.type] !== typeof command) {
			// 	socket.write(`(error) Invalid input: expected - ${typeMapper[expectedDataInfo.type]}, received - ${typeof command}`);
			// 	return;
			// }
			if (!stack.length) {
				socket.write(`(error) Invalid command`);
				return;
			}
			saveCommand(command, socket);
	}
}

function saveCommand(command, socket) {
	const commandInfo = stack[stack.length - 1];
	console.log("saveCommand: ", command);
	switch (commandInfo.type) {
		case "*":
			commandInfo.ref.push(command);
			commandInfo.count -= 1;
			// Should handle with recursion
			if (!commandInfo.count) stack.pop();
			doPop();
			break;
		case ":":
		case "$":
			if (command.length !== commandInfo.count) {
				socket.write(`(error) Invalid input: expected - ${typeMapper[expectedDataInfo.count]}, received - ${command.length}`);
				return;
			}
			commandInfo.ref.push(command);
			// Should handle with recursion
			stack.pop();
			doPop();
			break;
	}
}

function doPop() {
	let commandInfo = stack[stack.length - 1];
	while (commandInfo) {
		if (commandInfo.count !== 1) {
			commandInfo.count -= 1;
			return;
		}
		stack.pop();
		commandInfo = stack[stack.length - 1];
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
