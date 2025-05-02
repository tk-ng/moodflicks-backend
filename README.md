# MoodFlicks - A Movie Mood List Sharing System

Deployed Links: 
- Front-end: [https://moodflicks-frontend.onrender.com/](https://moodflicks-frontend.onrender.com/)
- Backend: [https://moodflicks-backend.onrender.com/moods](https://moodflicks-backend.onrender.com/moods)

A community-driven movie categorization platform where users can assign movies to custom moods. If multiple users categorize the same movies under the same mood, the system suggests unseen movies that fit the mood. This allows users to discover new movies based on shared emotional experiences rather than traditional genres or critic reviews.

Original Proposal: [https://docs.google.com/document/d/1OFKGpTyMP6WjZ39wwwgLImihREM6uYDmDcuFDPtdFxw/edit?tab=t.0](https://docs.google.com/document/d/1OFKGpTyMP6WjZ39wwwgLImihREM6uYDmDcuFDPtdFxw/edit?tab=t.0)

## APIs used:
- [/api/](https://moodflicks-backend.onrender.com/moods): Our own api to retrieve a list of users, moods, the mood's movies, mood ratings, and methods of retrieving movies data from TMDB.

- [TMDB API](https://api.themoviedb.org): Movie detail database with the latest information.

## Local environment database set up

Be sure to have the following database settings configured before running the application on your local environment.

- User should use [**PostgreSQL**](https://www.postgresql.org/) for database setup.
  ```console
  psql
  ```
- The database is named `moodflicks`, while the test database is named `moodflicks_test`.
  ```sql
  CREATE DATABASE moodflicks;
  CREATE DATABASE moodflicks_test;
  ```
- The database's timezone should be set to 'UTC'. See [here](https://supabase.com/docs/guides/database/postgres/configuration#managing-timezones) for more detail.
  ```sql
  ALTER DATABASE moodflicks SET TIMEZONE TO 'UTC';
  ALTER DATABASE moodflicks_test SET TIMEZONE TO 'UTC';
  ```
- Finally it is recommended to close and reopen these databases to ensure the settings are applied.
  Verify timezone setting:
  ```sql
  show timezone;
  ```
  It should return:
  ```console
   TimeZone
  ----------
   UTC
  (1 row)
  ```
- Create the required tables. You may import the "seed.sql" into your database.
   ```sql
   \c moodflicks
   \i [path to the downloaded seed.sql file]
   \c moodflicks_test
   \i [path to the downloaded seed.sql file]
   ```
## Steps to set up environment：Backend

Please review the **Local environment database set up** section first before proceeding.

1. Clone this repo to your local device
   ```console
   git clone https://github.com/hatchways-community/capstone-project-one-d6b371fb05824730baf0dff96463baba.git
   ```
2. Change directory to the backend file and install the required modules
   ```console
   cd [PATH TO THE CLONED REPO]/moodflicks-backend
   ```
   ```console
   npm install
   ```
3. Start the backend server
   ```console
   npm run dev
   ```
4. User should see the following console when the server is started properly. The port number can be configured in the config.js file.
   ```console
   App on port 3001
   ```
## Steps to set up environment：Front-end

1. Clone this repo to your local device (skip if it it's already been cloned when setting up backend)
   ```console
   git clone https://github.com/hatchways-community/capstone-project-one-d6b371fb05824730baf0dff96463baba.git
   ```
2. Change directory to the front-end file and install the required modules
   ```console
   cd [PATH TO THE CLONED REPO]/moodflicks-frontend
   ```
   ```console
   npm install
   ```
3. Start local development server on port 4000 (default). The port number can be configured in the package.json file under "scripts"
   ```console
   npm run dev
   ```
4. User should now be able to open the website at http://localhost:4000/
5. (Optional) If the port for backend is not 3001, please be sure to update the `baseURL` variable in moodflicks-frontend/src/api/api.js
## Testing

Please review the **Local environment database set up** and have test database `moodflicks_test` set up first.

The backend tests are ran in `jest`
  ```Unix
  cd moodflicks-backend
  npm test
  ```
While the frontend tests are ran in `vitest`
  ```Unix
  cd moodflicks-frontend
  npm test
  ```
---
## Features and User Flow

### Mood
- Mood: Can be treated as a category. It allows the users to customize their created moods and also explore what movies the other users have added to their own mood.
- Edit/Delete: The mood list's creator or an admin can edit the mood's title and/or delete the mood entirely.
- Count: Each mood displays the number of movies it has on its list.
- Ratings: Users can upvote or downvote a mood based on its accuracy regarding the movies' emotional associations.
- Similar Moods: When viewing a mood, the system suggests other moods with overlapping movie assignments, helping users discover related emotional themes.
- Search: Users may search for a mood by its title
- Activities: Users can see the latest of activities of movies being added to mood lists on the homepage. 

### Movie
- Search: Users can search for movies. Movie details are provided by the TMDB API.
- Mood assignment: Users can assign them to an existing mood or create a new one. They can also be removed from a mood.
- More Movies Like This: When multiple users assign the same movies to a mood, unseen movies from that mood are recommended to others who haven’t watched them. The recommended movies are sorted by how many moods each movie has appeared on.

### User
- Users: Anyone can create an account with a username and email. The user can remain signed in through out their session.
- Profile edit: A user can edit their username, email, first name, and last name.
- Moods by user: User profile displays the list of moods created by the user.


---
| Tech Stack | Description |
| ----------- | ----------- |
| Javascript | Programming language used for client-side |
| HTML | Structuring web-content |
| Express | Node.js web application framework for building APIs |
| React | JavaScript framework for building interactive user interfaces using a component-based architecture |
| Vite | A modern frontend build tool that offers fast dev server start-up and hot module replacement (HMR) |
| React Router | Declarative routing library for React applications |
| PostgreSQL | Object-relational database system |
| pg | PostgreSQL client for Node.js |
| Bcrypt | Password-hashing function |
| Axios | Makes AJAX HTTP requests from the browser |
| Bootstrap & Reactstrap | Front-end development framework |
| JSON Web Token | Compact and self-contained way to transmit information securely as a JSON object |
| Vitest | Fast unit test framework designed for Vite-powered projects |

