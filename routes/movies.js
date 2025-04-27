const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const Movie = require("../models/movie");
const Mood = require("../models/mood");

/** GET /movies/  { } => { movies }
 *
 * movies: { id, posterPath, title, releaseDate, overview }
 *
 * Returns a list of currently trending movies.
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
	try {
		const movies = await Movie.getTrending();
		return res.json({ movies });
	} catch (err) {
		next(err);
	}
});

/** GET /movies/search  { keyword } => { movies }
 *
 * movies: { id, posterPath, title, releaseDate, overview }
 *
 * Returns a list of movies found by the provided keyword.
 *
 * Authorization required: none
 */
router.get("/search", async function (req, res, next) {
	try {
		const { keyword } = req.query;
		if (!keyword || !keyword.trim()) throw new ExpressError("Empty query", 400);
		const movies = await Movie.searchMovieDB(keyword);
		return res.json({ movies });
	} catch (err) {
		next(err);
	}
});

/** GET /movies/:id  { id } => { movie }
 *
 * The format comes from TMDB and is not formatted.
 * movie: { budget, genre, original_title, overview, ... }
 *
 * Returns the top level details of a movie by 'id'.
 *
 * Authorization required: none
 */
router.get("/:id", async function (req, res, next) {
	try {
		const { id } = req.params;
		const movie = await Movie.get(id);
		return res.json({ movie });
	} catch (err) {
		next(err);
	}
});

/** GET /movies/:id/credits  { id } => { credits }
 *
 * credits: { director, cast }
 *
 * Returns the director and the main cast of a movie by 'id'.
 *
 * Authorization required: none
 */
router.get("/:id/credits", async function (req, res, next) {
	try {
		const { id } = req.params;
		const credits = await Movie.getCredits(id);
		return res.json({ credits });
	} catch (err) {
		next(err);
	}
});

/** GET /movies/:id/moods  { id } => { moods }
 *
 * moods: [{ id, mood, createdBy, count, totalVotes }, { ... }, ...]
 *
 * Returns a list of moods that a movie, by 'id', has appeared on.
 *
 * Authorization required: none
 */
router.get("/:id/moods", async function (req, res, next) {
	try {
		const { id } = req.params;
		const moods = await Mood.getMoodsByMovie(id);
		return res.json({ moods });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
