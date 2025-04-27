jest.mock("axios");
const axios = require("axios");
const Movie = require("../models/movie");
const ExpressError = require("../expressError");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("./_testCommon");
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("searchMovieDB", function () {
	test("works with mock results", async function () {
		axios.get.mockResolvedValue({
			data: {
				page: 1,
				results: [
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [],
						id: 10000,
						original_language: "en",
						original_title: "Testing 1",
						overview: "Testing 1 overview",
						popularity: 0.7,
						poster_path: null,
						release_date: "2017-04-03",
						title: "Testing 1",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [35],
						id: 20000,
						original_language: "en",
						original_title: "Testing 2",
						overview: "Testing 2 overview",
						popularity: 0.9,
						poster_path: "/xqZp0A1FSlosBWLRcxyP0y1MnDP.jpg",
						release_date: "2022-11-17",
						title: "Testing 2",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [],
						id: 30000,
						original_language: "en",
						original_title: "Testing 3",
						overview: "Testing 3 overview",
						popularity: 0.8,
						poster_path: "/xJJegRtbTUZXsoif0bIJL60ucg7.jpg",
						release_date: "",
						title: "Testing 3",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
				],
				total_pages: 1,
				total_results: 3,
			},
		});
		let movies = await Movie.searchMovieDB("movie");
		expect(movies).toEqual([
			{
				id: 20000,
				overview: "Testing 2 overview",
				posterPath: expect.any(String),
				releaseDate: expect.any(String),
				title: "Testing 2",
			},
			{
				id: 30000,
				overview: "Testing 3 overview",
				posterPath: expect.any(String),
				releaseDate: "",
				title: "Testing 3",
			},
			{
				id: 10000,
				overview: "Testing 1 overview",
				posterPath: null,
				releaseDate: expect.any(String),
				title: "Testing 1",
			},
		]);
	});

	test("works with empty results", async function () {
		axios.get.mockResolvedValue({
			data: {
				page: 1,
				results: [],
				total_pages: 1,
				total_results: 0,
			},
		});
		let movies = await Movie.searchMovieDB("no results");
		expect(movies).toEqual([]);
	});
});

describe("get", function () {
	const mockData = {
		adult: false,
		backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
		belongs_to_collection: null,
		budget: 160000000,
		genres: [
			{
				id: 28,
				name: "Action",
			},
			{
				id: 878,
				name: "Science Fiction",
			},
			{
				id: 12,
				name: "Adventure",
			},
		],
		homepage: "https://www.warnerbros.com/movies/inception",
		id: 27205,
		imdb_id: "tt1375666",
		origin_country: ["US", "GB"],
		original_language: "en",
		original_title: "Inception",
		overview:
			"Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
		popularity: 30.1586,
		poster_path: "/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
		production_companies: [
			{
				id: 923,
				logo_path: "/5UQsZrfbfG2dYJbx8DxfoTr2Bvu.png",
				name: "Legendary Pictures",
				origin_country: "US",
			},
			{
				id: 9996,
				logo_path: "/3tvBqYsBhxWeHlu62SIJ1el93O7.png",
				name: "Syncopy",
				origin_country: "GB",
			},
			{
				id: 174,
				logo_path: "/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png",
				name: "Warner Bros. Pictures",
				origin_country: "US",
			},
		],
		production_countries: [
			{
				iso_3166_1: "GB",
				name: "United Kingdom",
			},
			{
				iso_3166_1: "US",
				name: "United States of America",
			},
		],
		release_date: "2010-07-15",
		revenue: 839030630,
		runtime: 148,
		spoken_languages: [
			{
				english_name: "English",
				iso_639_1: "en",
				name: "English",
			},
			{
				english_name: "French",
				iso_639_1: "fr",
				name: "Français",
			},
			{
				english_name: "Japanese",
				iso_639_1: "ja",
				name: "日本語",
			},
			{
				english_name: "Swahili",
				iso_639_1: "sw",
				name: "Kiswahili",
			},
		],
		status: "Released",
		tagline: "Your mind is the scene of the crime.",
		title: "Test Movie 1",
		video: false,
		vote_average: 8.368,
		vote_count: 37377,
	};

	test("works with mock results", async function () {
		axios.get.mockResolvedValue({
			data: mockData,
		});
		let movie = await Movie.get(27205);
		expect(movie).toEqual(mockData);
	});

	test("throws error when movie id does not exist", async function () {
		axios.get.mockRejectedValue({
			response: {
				success: false,
				status_code: 34,
				status_message: "The resource you requested could not be found.",
			},
		});
		try {
			let movies = await Movie.get(272052343);
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getCredits", function () {
	const mockData = {
		id: 27205,
		cast: [
			{
				adult: false,
				gender: 2,
				id: 6193,
				known_for_department: "Acting",
				name: "Test Actor 1",
				original_name: "Leonardo DiCaprio",
				popularity: 11.0335,
				profile_path: "/ts9l18VkDSooRGDWIeQegNVHciC.jpg",
				cast_id: 1,
				character: "Dom Cobb",
				credit_id: "52fe4534c3a368484e04de03",
				order: 0,
			},
			{
				adult: false,
				gender: 2,
				id: 24045,
				known_for_department: "Acting",
				name: "Test Actor 2",
				original_name: "Joseph Gordon-Levitt",
				popularity: 4.0784,
				profile_path: "/fm2vDPCzT2185e8qIt8RLvDx44U.jpg",
				cast_id: 3,
				character: "Arthur",
				credit_id: "52fe4534c3a368484e04de0b",
				order: 1,
			},
			{
				adult: false,
				gender: 2,
				id: 3899,
				known_for_department: "Acting",
				name: "Test Actor 3",
				original_name: "渡辺謙",
				popularity: 1.4875,
				profile_path: "/w2t30L5Cmr34myAaUobLoSgsLfS.jpg",
				cast_id: 2,
				character: "Saito",
				credit_id: "52fe4534c3a368484e04de07",
				order: 2,
			},
			{
				adult: false,
				gender: 2,
				id: 2524,
				known_for_department: "Acting",
				name: "Test Actor 4",
				original_name: "Tom Hardy",
				popularity: 11.9906,
				profile_path: "/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg",
				cast_id: 7,
				character: "Eames",
				credit_id: "52fe4534c3a368484e04de1b",
				order: 3,
			},
			{
				adult: false,
				gender: 3,
				id: 27578,
				known_for_department: "Acting",
				name: "Test Actor 5",
				original_name: "Elliot Page",
				popularity: 3.4589,
				profile_path: "/eCeFgzS8dYHnMfWQT0oQitCrsSz.jpg",
				cast_id: 5,
				character: "Ariadne",
				credit_id: "52fe4534c3a368484e04de13",
				order: 4,
			},
			{
				adult: false,
				gender: 2,
				id: 95697,
				known_for_department: "Acting",
				name: "Test Actor 6",
				original_name: "Dileep Rao",
				popularity: 0.1396,
				profile_path: "/jRNn8SZqFXuI5wOOlHwYsWh0hXs.jpg",
				cast_id: 19,
				character: "Yusuf",
				credit_id: "52fe4534c3a368484e04de4f",
				order: 5,
			},
			{
				adult: false,
				gender: 2,
				id: 2037,
				known_for_department: "Acting",
				name: "Test Actor 7",
				original_name: "Cillian Murphy",
				popularity: 7.9611,
				profile_path: "/llkbyWKwpfowZ6C8peBjIV9jj99.jpg",
				cast_id: 8,
				character: "Robert Fischer, Jr.",
				credit_id: "52fe4534c3a368484e04de1f",
				order: 6,
			},
			{
				adult: false,
				gender: 2,
				id: 13022,
				known_for_department: "Acting",
				name: "Test Actor 8",
				original_name: "Tom Berenger",
				popularity: 1.8248,
				profile_path: "/zLxzAdAfu7y02yEx29JSLDgXJZ4.jpg",
				cast_id: 9,
				character: "Peter Browning",
				credit_id: "52fe4534c3a368484e04de23",
				order: 7,
			},
		],
		crew: [
			{
				adult: false,
				gender: 2,
				id: 525,
				known_for_department: "Directing",
				name: "Test Producer",
				original_name: "Christopher Nolan",
				popularity: 3.1333,
				profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
				credit_id: "52fe4534c3a368484e04de2d",
				department: "Production",
				job: "Producer",
			},
			{
				adult: false,
				gender: 1,
				id: 556,
				known_for_department: "Production",
				name: "Test Producer",
				original_name: "Emma Thomas",
				popularity: 1.0905,
				profile_path: "/utc1PS6WVWR5tknzTJqXtnD0kBp.jpg",
				credit_id: "52fe4534c3a368484e04de33",
				department: "Production",
				job: "Producer",
			},
			{
				adult: false,
				gender: 2,
				id: 559,
				known_for_department: "Camera",
				name: "Test Director of Photography",
				original_name: "Wally Pfister",
				popularity: 0.2888,
				profile_path: "/uyWeYsERTTLjpjkE79QeSETLIoA.jpg",
				credit_id: "52fe4534c3a368484e04de3f",
				department: "Camera",
				job: "Director of Photography",
			},
			{
				adult: false,
				gender: 2,
				id: 525,
				known_for_department: "Directing",
				name: "Test Director",
				original_name: "Christopher Nolan",
				popularity: 3.1333,
				profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
				credit_id: "5e83ac2ee33f830018359a00",
				department: "Directing",
				job: "Director",
			},
		],
	};

	test("works with mock results", async function () {
		axios.get.mockResolvedValue({
			data: mockData,
		});
		let movie = await Movie.getCredits(27205);
		expect(movie).toEqual({
			cast: [
				"Test Actor 1",
				"Test Actor 2",
				"Test Actor 3",
				"Test Actor 4",
				"Test Actor 5",
			],
			director: "Test Director",
		});
	});

	test("throws error when movie id does not exist", async function () {
		axios.get.mockRejectedValue({
			response: {
				success: false,
				status_code: 34,
				status_message: "The resource you requested could not be found.",
			},
		});
		try {
			let movies = await Movie.getCredits(272052343);
		} catch (err) {
			expect(err instanceof ExpressError).toBeTruthy();
			expect(err.status).toBe(404);
		}
	});
});

describe("getTrending", function () {
	test("works with mock results", async function () {
		axios.get.mockResolvedValue({
			data: {
				page: 1,
				results: [
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [],
						id: 10000,
						original_language: "en",
						original_title: "Testing 1",
						overview: "Testing 1 overview",
						popularity: 0.7,
						poster_path: null,
						release_date: "2017-04-03",
						title: "Testing 1",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [35],
						id: 20000,
						original_language: "en",
						original_title: "Testing 2",
						overview: "Testing 2 overview",
						popularity: 0.9,
						poster_path: "/xqZp0A1FSlosBWLRcxyP0y1MnDP.jpg",
						release_date: "2022-11-17",
						title: "Testing 2",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
					{
						adult: false,
						backdrop_path: null,
						genre_ids: [],
						id: 30000,
						original_language: "en",
						original_title: "Testing 3",
						overview: "Testing 3 overview",
						popularity: 0.8,
						poster_path: "/xJJegRtbTUZXsoif0bIJL60ucg7.jpg",
						release_date: "",
						title: "Testing 3",
						video: false,
						vote_average: 0,
						vote_count: 0,
					},
				],
				total_pages: 500,
				total_results: 10000,
			},
		});
		let movies = await Movie.getTrending();
		expect(movies).toEqual([
			{
				id: 10000,
				overview: "Testing 1 overview",
				posterPath: null,
				releaseDate: expect.any(String),
				title: "Testing 1",
			},
			{
				id: 20000,
				overview: "Testing 2 overview",
				posterPath: expect.any(String),
				releaseDate: expect.any(String),
				title: "Testing 2",
			},
			{
				id: 30000,
				overview: "Testing 3 overview",
				posterPath: expect.any(String),
				releaseDate: expect.any(String),
				title: "Testing 3",
			},
		]);
	});
});
