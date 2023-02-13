const net = require("node:net");
const server = net
	.createServer((socket) => {
		// socket.end("goodbye\n");
		socket.on("data", (data) => {
			console.log("*** Data received ***", data);
			const command = Buffer.from(data).toString("utf-8");
			console.log("Given command: ", command);
			const separated = commandSeparator(command.replace(/[\n\r]+/g, ""));
			console.log("separated command: ", separated);
			if (!separated || !separated.length) {
				socket.write(errorFramer("ERR empty command"));
				return;
			}
			const framedCommand = commandFramer(separated);
			console.log("framed command: ", framedCommand);
			const result = commandExecutor(framedCommand);
			socket.write(result);
		});
	})
	.on("data", (err) => {
		// Handle errors here.
		throw err;
	});

server.listen(12345, () => {
	console.log("opened server on", server.address());
});

function commandSeparator(command) {
	return command.toString().split("\\r\\n");
}
function commandFramer(command) {
	console.log("From commmand framer", command[0]);
	const result = [];
	let itr = 0;
	for (itr = 0, val = command[itr].toUpperCase(); itr < command.length; ++itr, val = command[itr]?.toUpperCase()) {
		console.log("Inside command framer loop", { itr, val });
		switch (val) {
			case "PING":
				result.push(val);
				break;
			default:
				result.push(val);
		}
	}
	return result;
}

function commandExecutor(command) {
	let result = "";
	let itr = 0;
	let val = command[itr].toUpperCase();
	for (; itr < command.length; ++itr, val = command[itr]?.toUpperCase()) {
		switch (val) {
			case "PING":
				result += stringFramer(
					command
						.splice(itr)
						.filter((v) => v)
						.map((v) => {
							if (v === "PING") return "pong";
							if (isNaN(parseInt(v))) return `+${v}`;
							return `:${v}`;
						})
						.join("\\r\\n")
				);
				break;
			default:
			// result.push(val);
		}
	}
	return result;
}

function errorFramer(message) {
	return "-" + message;
}

function stringFramer(str) {
	return "+" + str;
}
