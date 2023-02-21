const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//API 1

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const allPlayersResponse = await db.all(getPlayersQuery);
  response.send(
    allPlayersResponse.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE 
    player_id=${playerId};`;
  const playerResponse = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerResponse));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getPlayerQuery = `
    UPDATE player_details
    SET 
     player_name='${playerName}'
    WHERE 
    player_id=${playerId};`;
  const playerResponse = await db.run(getPlayerQuery);
  response.send("Player Details Updated");
});

//API 4
const convertDbObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE 
    match_id=${matchId};`;
  const matchResponse = await db.get(getMatchQuery);
  response.send(convertDbObject(matchResponse));
});
//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT *
    FROM player_match_score NATURAL JOIN match_details
    WHERE 
    player_id=${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(playerMatches.map((eachMatch) => convertDbObject(eachMatch)));
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT *
        FROM player_match_score
            NATURAL JOIN player_details
    WHERE match_id=${matchId};`;
  const getPlayersOfMatchResponse = await db.all(getPlayersOfMatchQuery);
  response.send(
    getPlayersOfMatchResponse.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const matchResponse = await db.get(getPlayerScored);
  response.send(matchResponse);
});

module.exports = app;
