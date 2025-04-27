const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Mood = require("../models/mood");
const Movie = require("../models/movie");
const { ensureLoggedIn, userOrAdminOnly } = require("../middleware/auth");
const jsonschema = require("jsonschema");
const moodNewSchema = require("../schemas/moodNewSchema.json");
const moodEditSchema = require("../schemas/moodEditSchema.json");

/** GET /moods/  { } => { activities }
 *
 * activities: {movieID, moodID, mood, createdBy, created}
 *
 * The returned activities allow the frontend
 * to generate a list of "x movie added to y mood z time ago
 *
 * Authorization required: none
 */
router.get("/activities", async function (req, res, next) {
	try {
		const activities = await Mood.getLatestMovieMood();
		return res.json({ activities });
	} catch (err) {
		next(err);
	}
});

/** GET /moods/search  { keyword} => { moods }
 *
 * moods: {id, mood, createdBy, count, totalVotes}
 *
 * The returned activities allow the frontend
 * to generate a list of "x movie added to y mood z time ago
 *
 * Authorization required: none
 */
router.get("/search", async function (req, res, next) {
	try {
		const { keyword } = req.query;
		if (!keyword || !keyword.trim()) throw new ExpressError("Empty query", 400);
		const moods = await Mood.searchMood(keyword);
		return res.json({ moods });
	} catch (err) {
		next(err);
	}
});

// GET all moods sorted by their score and total movies
router.get("/", async function (req, res, next) {
	try {
		const moods = await Mood.getMoods();
		return res.json({ moods });
	} catch (err) {
		next(err);
	}
});

// GET a mood by its id
router.get("/:id/", async function (req, res, next) {
	try {
		const id = +req.params.id;
		const mood = await Mood.getMood(id);
		return res.json({ mood });
	} catch (err) {
		next(err);
	}
});

// Get all movies categorized to the given mood ID
router.get("/:id/movies", async function (req, res, next) {
	try {
		const id = +req.params.id;
		let movies;
		const movieIDs = await Mood.getMovies(id);
		if (!movieIDs.length) {
			movies = [];
		} else {
			movies = await Movie.getMovies(movieIDs);
		}
		return res.json({ movies });
	} catch (err) {
		next(err);
	}
});

// Finds other 'moods' that share common movies in their list
router.get("/:id/similar", async function (req, res, next) {
	try {
		const id = +req.params.id;
		const moods = await Mood.similarMoodsByID(id);
		return res.json({ moods });
	} catch (err) {
		next(err);
	}
});

router.get("/:id/recommended", async function (req, res, next) {
	try {
		const id = +req.params.id;
		const movies = await Mood.recommendedMovies(id);
		return res.json({ movies });
	} catch (err) {
		next(err);
	}
});

// Create a new mood
// {mood,username} => {mood}
router.post("/", ensureLoggedIn, async function (req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, moodNewSchema);

		if (!validator.valid) {
			const listOfErrors = validator.errors.map((err) => err.stack);
			const error = new ExpressError(listOfErrors, 400);
			return next(error);
		}

		const mood = await Mood.createMood(req.body);
		return res.status(201).json({ mood });
	} catch (err) {
		next(err);
	}
});

// Update a mood's name
router.patch("/:id", userOrAdminOnly, async function (req, res, next) {
	try {
		const { name } = req.body;

		const validator = jsonschema.validate({ name }, moodEditSchema);

		if (!validator.valid) {
			const listOfErrors = validator.errors.map((err) => err.stack);
			const error = new ExpressError(listOfErrors, 400);
			return next(error);
		}

		const id = +req.params.id;
		const mood = await Mood.updateMood(id, name);
		return res.json({ message: "updated", mood });
	} catch (err) {
		next(err);
	}
});

// Add the movie to the selected mood(id)
router.post(
	"/:moodID/movies/:movieID",
	userOrAdminOnly,
	async function (req, res, next) {
		try {
			const { moodID, movieID } = req.params;
			const movieMood = await Mood.addMovieToMood(moodID, movieID);
			return res.status(201).json({ message: "Added", movieMood });
		} catch (err) {
			next(err);
		}
	}
);

// Remove the movie to the selected mood(id)
router.delete(
	"/:moodID/movies/:movieID",
	userOrAdminOnly,
	async function (req, res, next) {
		try {
			const { moodID, movieID } = req.params;
			await Mood.deleteMovieFromMood(moodID, movieID);
			return res.json({ message: "Movie removed from mood" });
		} catch (err) {
			next(err);
		}
	}
);

router.delete("/:id", userOrAdminOnly, async function (req, res, next) {
	try {
		const id = +req.params.id;
		await Mood.deleteMood(id);
		return res.json({ message: "Mood deleted" });
	} catch (err) {
		next(err);
	}
});

router.post(
	"/:id/vote/:voteType",
	ensureLoggedIn,
	async function (req, res, next) {
		try {
			const { id, voteType } = req.params;
			if (voteType !== "up" && voteType !== "down")
				throw new ExpressError("Bad Request", 404);
			let { username } = req.body;
			await Mood.updateMoodRating(id, username, voteType);
			return res.json({ message: "Mood voted" });
		} catch (err) {
			next(err);
		}
	}
);

module.exports = router;
