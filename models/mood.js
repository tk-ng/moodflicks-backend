const db = require("../db");
const ExpressError = require("../expressError");
const Movie = require("./movie");
const { MIN_COMMON_MOVIES, NUM_OF_ACTIVITIES } = require("../config");
const { formatDistanceToNow } = require("date-fns");

class Mood {
	// Creates a new mood in the moods table
	static async createMood({ mood, username }) {
		// Throws error if the user has already created a mood with the same given name
		const check = await db.query(
			`SELECT mood FROM moods WHERE mood=$1 AND created_by=$2`,
			[mood, username]
		);
		if (check.rows.length)
			throw new ExpressError(
				`'${mood}' has already been created by ${username}`,
				403
			);
		const result = await db.query(
			`INSERT INTO moods (mood, created_by) VALUES ($1, $2)
            RETURNING id, mood, created_by AS "createdBy"`,
			[mood, username]
		);
		return result.rows[0];
	}

	// Search and return mood(s) based on keyword, including the number
	// of movies it contains and its score based on user votings
	static async searchMood(keyword) {
		const expression = `%${keyword}%`;
		const result = await db.query(
			`SELECT m.id, m.mood, m.created_by AS "createdBy", 
			COUNT(mm.movie_id),
			SUM(CASE 
                WHEN mr.vote_type = 'up' THEN 1
                WHEN mr.vote_type = 'down' THEN -1
                ELSE 0 
                END) AS "totalVotes"
			FROM moods m 
			LEFT JOIN movies_moods mm ON m.id=mm.mood_id
			LEFT JOIN mood_ratings mr ON m.id = mr.mood_id
			WHERE m.mood ILIKE $1
			GROUP BY m.id, m.mood,m.created_by
			ORDER BY "totalVotes" DESC, COUNT(mm.movie_id) DESC`,
			[expression]
		);

		return result.rows;
	}

	// Finds all moods in the database, including the number
	// of movies each mood contains, and its score based on use votings
	static async getMoods() {
		const results = await db.query(
			`SELECT 
  				m.id, 
  				m.mood, 
  				m.created_by AS "createdBy", 
  				COUNT(mm.movie_id),
  				COALESCE(v.totalVotes, 0) AS "totalVotes"
			FROM moods m
			LEFT JOIN movies_moods mm ON m.id = mm.mood_id
			LEFT JOIN (
  				SELECT 
   					mood_id, 
    				SUM(CASE 
          				WHEN vote_type = 'up' THEN 1 
         				WHEN vote_type = 'down' THEN -1 
          				ELSE 0 
        				END) AS totalVotes
  					FROM mood_ratings
  					GROUP BY mood_id
			) v ON m.id = v.mood_id
			GROUP BY m.id, m.mood, m.created_by, v.totalVotes
			ORDER BY "totalVotes" DESC, COUNT(mm.movie_id) DESC`
		);
		const moods = results.rows;
		return moods;
	}

	// Return mood by its ID, including the number of movies it contains
	// and its score based on user voting
	static async getMood(moodID) {
		const results = await db.query(
			`SELECT 
  				m.id, 
  				m.mood, 
  				m.created_by AS "createdBy", 
  				COUNT(mm.movie_id),
  				COALESCE(v.totalVotes, 0) AS "totalVotes"
			FROM moods m
			LEFT JOIN movies_moods mm ON m.id = mm.mood_id
			LEFT JOIN (
  				SELECT 
   					mood_id, 
    				SUM(CASE 
          				WHEN vote_type = 'up' THEN 1 
         				WHEN vote_type = 'down' THEN -1 
          				ELSE 0 
        				END) AS totalVotes
  					FROM mood_ratings
  					GROUP BY mood_id
			) v ON m.id = v.mood_id
			GROUP BY m.id, m.mood, m.created_by, v.totalVotes
			HAVING m.id = $1`,
			[moodID]
		);
		const mood = results.rows[0];
		if (!mood) throw new ExpressError(`mood with id: ${moodID} not found`, 404);
		return mood;
	}

	// Find a list of moods that the movie (by its ID) has been added to
	static async getMoodsByMovie(movieId) {
		const results = await db.query({
			text: `SELECT mood_id FROM movies_moods WHERE movie_id=$1`,
			values: [movieId],
			rowMode: "array",
		});

		let moods = results.rows.flat();

		if (moods.length) {
			moods = await Promise.all(Array.from(moods, (id) => Mood.getMood(id)));
		}

		return moods;
	}

	// Adds a movie to a mood list
	static async addMovieToMood(moodID, movieID) {
		// Throws error if the mood does not exist
		let moodCheck = await db.query(`SELECT mood FROM moods WHERE id=$1`, [
			moodID,
		]);
		if (!moodCheck.rows.length)
			throw new ExpressError(`mood with id: ${moodID} not found`, 404);

		// Throws error if the movie already exists
		const movieCheck = await db.query(
			`SELECT mood_id FROM movies_moods WHERE mood_id=$1 AND movie_id=$2`,
			[moodID, movieID]
		);
		if (movieCheck.rows[0])
			throw new ExpressError(
				`${movieID} already exists in mood: ${moodID}`,
				403
			);

		// Check if the movie exists in the TMDB
		await Movie.get(movieID);

		const result = await db.query(
			`INSERT INTO movies_moods (movie_id, mood_id) VALUES ($1, $2)
            RETURNING movie_id AS "movieId", mood_id AS "moodId"`,
			[movieID, moodID]
		);
		return result.rows[0];
	}

	// Returns a list of movie ids in a mood by its ID
	static async getMovies(moodID) {
		// Throws error if the mood does not exist in the database
		const check = await db.query(`SELECT mood FROM moods WHERE id = $1`, [
			moodID,
		]);
		if (!check.rows[0])
			throw new ExpressError(`moodID: '${moodID}' does not exist`, 404);

		const results = await db.query({
			text: `SELECT movie_id FROM movies_moods WHERE mood_id = $1`,
			values: [moodID],
			rowMode: "array",
		});
		const movieIDs = results.rows.flat();
		if (!movieIDs.length) return [];
		return movieIDs;
	}

	// Returns a list of movds that have more than # of common movies
	// '#' is set as MIN_COMMON_MOVIES in config.js
	static async similarMoodsByID(moodID) {
		const check = await db.query(`SELECT mood FROM moods WHERE id = $1`, [
			moodID,
		]);
		if (!check.rows[0])
			throw new ExpressError(`moodID: '${moodID}' does not exist`, 404);

		let results = await db.query({
			text: `SELECT movie_id FROM movies_moods WHERE mood_id = $1`,
			values: [moodID],
			rowMode: "array",
		});
		const currentMoodMovieIDs = new Set(results.rows.flat());

		results = await db.query(
			`SELECT 
            array_agg(mm.movie_id) AS movies,
		    CARDINALITY(array_agg(mm.movie_id)) AS count,
            m.mood,
            m.id,
            m.created_by AS "createdBy",
  			COALESCE(v.totalVotes, 0) AS "totalVotes"
            FROM moods m 
            LEFT JOIN movies_moods mm ON mm.mood_id=m.id
			LEFT JOIN (
				SELECT 
					mood_id, 
					SUM(CASE 
						WHEN vote_type = 'up' THEN 1 
						WHEN vote_type = 'down' THEN -1 
						ELSE 0 
						END) AS totalVotes
				FROM mood_ratings
				GROUP BY mood_id
				) v ON m.id = v.mood_id
			WHERE m.id != $1 
			GROUP BY m.mood, m.id, m.created_by, v.totalVotes
			ORDER BY "totalVotes" DESC, COUNT(mm.movie_id) DESC`,
			[moodID]
		);

		const otherMoods = results.rows;

		// Only return moods that share over a certain number of common movies
		return otherMoods.filter(({ movies }) => {
			movies = new Set(movies);
			return currentMoodMovieIDs.intersection(movies).size >= MIN_COMMON_MOVIES;
		});
	}

	// Returns a list of movies that are commonly listed in other similar moods
	static async recommendedMovies(moodID) {
		// First find the similar moods
		const similarMoods = await this.similarMoodsByID(moodID);

		const watchedMovies = await this.getMovies(moodID);

		// Find the orrences of each movie in the other mood lists
		// And filters out the ones that already exists in the current mood
		const occurrences = similarMoods.reduce((accum, curr) => {
			curr.movies.forEach((m) => {
				if (!watchedMovies.includes(m)) {
					accum[m] = accum[m] + 1 || 1;
				}
			});
			return accum;
		}, {});

		// Sort the returned movies by their orrences
		const sorted = Object.entries(occurrences).sort((a, b) => b[1] - a[1]);
		// Retrieve each movie's ID
		const sortedMovieIDs = sorted.map((m) => m[0]);
		// Get and return the movies details
		const movies = await Movie.getMovies(sortedMovieIDs);
		for (let i = 0; i < movies.length; i++) {
			movies[i].poll = sorted[i][1];
		}
		return movies;
	}

	// Updates a mood's name, by its ID
	static async updateMood(moodID, name) {
		// Throw error is the mood does not exist
		const result = await db.query(
			`UPDATE moods SET mood = $1 WHERE id = $2 RETURNING id, mood`,
			[name, moodID]
		);
		if (!result.rows.length)
			throw new ExpressError(`moodID: '${moodID}' does not exist`, 404);
		return result.rows[0];
	}

	// Deletes a mood from the database. Throws error if the mood does not exist.
	static async deleteMood(moodID) {
		const result = await db.query(
			`DELETE FROM moods WHERE id = $1 RETURNING id`,
			[moodID]
		);
		if (!result.rows.length)
			throw new ExpressError(`moodID: '${moodID}' does not exist`, 404);
	}

	// Removes a movie from a mood list
	static async deleteMovieFromMood(moodID, movieID) {
		// Throws error if the mood does not exist in the given mood
		const result = await db.query(
			`DELETE FROM movies_moods WHERE movie_id = $1 AND mood_id = $2 RETURNING mood_id`,
			[movieID, moodID]
		);
		if (!result.rows.length)
			throw new ExpressError(
				`movie '${movieID}' is not in moodID: ${moodID} OR moodID: '${moodID}' does not exist`,
				404
			);
	}

	// Updates a mood's voting. Each mood can only have either one up vote
	// OR a down vote by the same user. Repeating the same vote does not affect the score.
	// Changing the vote (eg: from up vote to down vote) will simply remove that vote
	// of the mood list from that same user
	static async updateMoodRating(moodID, username, vote_type) {
		if (vote_type !== "up" && vote_type !== "down")
			throw new ExpressError(`Bad vote_type`, 403);

		try {
			const result = await db.query(
				`SELECT m.id AS "moodID", mr.vote_type AS "existingVote" 
				FROM moods m 
				LEFT JOIN mood_ratings mr ON m.id = mr.mood_id AND mr.voter = $1
				WHERE m.id = $2`,
				[username, moodID]
			);
			const vote = result.rows[0];

			if (!vote)
				throw new ExpressError(`Mood ID '${moodID}' does not exist`, 404);

			if (vote.existingVote) {
				if (vote.existingVote === vote_type) {
					return;
				} else {
					await db.query(
						`DELETE FROM mood_ratings WHERE voter = $1 AND mood_id = $2`,
						[username, moodID]
					);
					return;
				}
			}
			await db.query(
				`INSERT INTO mood_ratings (mood_id, voter, vote_type) VALUES($1, $2, $3)`,
				[moodID, username, vote_type]
			);
			return;
		} catch (err) {
			if (err.code === "23503")
				throw new ExpressError(`username ${username} not found.`, 404);
			throw new ExpressError(`Mood ID '${moodID}' does not exist`, 404);
		}
	}

	// Get the latest # of "Add movie to mood list" activites
	// '#' is set as NUM_OF_ACTIVITIES in config.js
	static async getLatestMovieMood() {
		const result = await db.query(`SELECT 
            mm.movie_id AS "movieID", 
            m.id AS "moodID",
            m.mood, 
            m.created_by AS "createdBy", 
            mm.created_at AS "created"
            FROM movies_moods mm 
            JOIN moods m ON mm.mood_id = m.id 
            ORDER BY mm.created_at DESC
            LIMIT ${NUM_OF_ACTIVITIES}`);

		const latestMovieMood = result.rows;

		if (!latestMovieMood.length) return [];

		for (let mm of latestMovieMood) {
			mm.createdAgo = formatDistanceToNow(mm.created, {
				addSuffix: true,
				includeSeconds: true,
			});
		}

		return latestMovieMood;
	}
}

module.exports = Mood;
