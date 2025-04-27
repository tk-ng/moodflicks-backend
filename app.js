const express = require("express");
const cors = require("cors");
const ExpressError = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const movieRoutes = require("./routes/movies");
const moodRoutes = require("./routes/moods");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authenticateJWT);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/movies", movieRoutes);
app.use("/moods", moodRoutes);

// 404 Error Handler
app.use((req, res, next) => {
	const notFoundError = new ExpressError("Not Found", 404);
	return next(notFoundError);
});

// General Error Handler
app.use((err, req, res, next) => {
	let status = err.status || 500;
	let message = err.message;

	return res.status(status).json({ error: { message, status } });
});

module.exports = app;
