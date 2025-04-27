const { TMDB_SEARHCH_URL } = require("../config");
const tbdbToken = process.env.TMDB_TOKEN;
const axios = require("axios");
const ExpressError = require("../expressError");

class Movie {
	// Accepts an array of movie data and only return the required fields
	// return { id, posterPath, title, releaseDate, overview }
	static filterMovieSummary(data) {
		return data.map(({ id, poster_path, title, release_date, overview }) => ({
			id,
			posterPath: poster_path,
			title,
			releaseDate: release_date,
			overview,
		}));
	}

	// Fetches a list of movies from the TMDB by the keyword. The returned
	// list is sorted by the movie's popularity
	static async searchMovieDB(keyword) {
		const url = `https://api.themoviedb.org/3/search/movie?query=${keyword}`;
		const options = {
			headers: {
				accept: "application/json",
				Authorization: `Bearer ${tbdbToken}`,
			},
		};

		try {
			const { data } = await axios.get(url, options);
			data.results.sort((a, b) => {
				if (a.popularity < b.popularity) return 1;
				if (a.popularity > b.popularity) return -1;
				return 0;
			});
			return this.filterMovieSummary(data.results);
		} catch (err) {
			console.error(err);
		}
	}

	// Fetches a movie from the TMDB by its movie id
	static async get(id) {
		const url = `https://api.themoviedb.org/3/movie/${id}`;
		const options = {
			headers: {
				accept: "application/json",
				Authorization: `Bearer ${tbdbToken}`,
			},
		};

		try {
			const { data } = await axios.get(url, options);
			return data;
		} catch (err) {
			if (!err.response.success)
				throw new ExpressError(
					`The movie with movie id: ${id} cannot be found.`,
					404
				);
			console.error(err);
		}
	}

	// Fetches a movie's credit (director and top five cast member)
	// from the TMDB by its movie id
	static async getCredits(id) {
		const url = `https://api.themoviedb.org/3/movie/${id}/credits`;
		const options = {
			headers: {
				accept: "application/json",
				Authorization: `Bearer ${tbdbToken}`,
			},
		};

		try {
			const { data } = await axios.get(url, options);
			const director = data.crew.find(
				(member) => member.job === "Director"
			).name;
			const castArr = data.cast.slice(0, 5);
			const cast = castArr.map(({ name }) => name);
			return { director, cast };
		} catch (err) {
			if (!err.response.success)
				throw new ExpressError(
					`The movie with movie id: ${id} cannot be found.`,
					404
				);
			console.error(err);
		}
	}

	// Fetches a list of movie details by an array of movie ids
	static async getMovies(arr) {
		const movies = await Promise.all(Array.from(arr, (id) => this.get(id)));
		return this.filterMovieSummary(movies);
	}

	// Fetches a list of currently trending movies from the TMDB
	static async getTrending() {
		const url = `https://api.themoviedb.org/3/trending/movie/week`;
		const options = {
			headers: {
				accept: "application/json",
				Authorization: `Bearer ${tbdbToken}`,
			},
		};

		try {
			const { data } = await axios.get(url, options);
			return this.filterMovieSummary(data.results);
		} catch (err) {
			console.error(err);
		}
	}
}

module.exports = Movie;
