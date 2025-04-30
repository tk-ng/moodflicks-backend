const { PORT } = require("./config");
const app = require("./app");

app.listen(PORT, function () {
	console.log(`App on port ${PORT}`);
});
