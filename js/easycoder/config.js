const EasyCoderConfig = {
	debugToConsole: true   // true = browser console.log; false = VS Code tooling
};

function print(message) {
	if (EasyCoderConfig.debugToConsole) {
		console.log(message);
	}
	// When false, VS Code tooling provides its own print()
}
