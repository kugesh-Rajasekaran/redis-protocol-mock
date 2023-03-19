class UserList {
	private users: { id: User[] };

	initUser(): User {
		const user = new User();
		this.users[user.id] = user;
		return user;
	}

	getUser(userId: number) {
		return this.users[userId];
	}
}

class User {
	private _id: number;
	command: Command[];
	history: History[];

	construtor() {
		this._id = parseInt((Math.random() * 100000).toString());
		this.command = [];
		this.history = [];
	}

	get id() {
		return this.id;
	}
}

interface History {
	result: string;
	command: Command[];
}

interface Command {
	type: "*" | "$" | ":";
	count: Number;
	ref: Command;
}
