const COMPARISON_TEAM_ID = 39;

let API_URLS = {
    Matches: 'https://api.commercial-league.gr/api/web/matches?range=%5B0%2C1000%5D&sort=%5BmatchDatetime%2C%20DESC%5D',
    LeagueTeams: 'https://api.commercial-league.gr/api/web/teams/stats/league/3?seasonId=1',
    TEAMS: 'https://api.commercial-league.gr/api/web/teams?range=%5B0%2C1000%5D&filter=%7B%22active%22%3A%20true%7D',
    TEAMS_RANKING: 'https://api.commercial-league.gr/api/web/teams/39/ranking?phase=regular_season',
    TEAM_ROSTER: 'https://api.commercial-league.gr/api/web/teams/{id}?phase=regular_season&isCup=false',
    PLAYER_STATS: 'https://api.commercial-league.gr/api/web/players/{id}',
};

let initStats = () => ({ pts: 0, reb: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, ft: 0, fg: 0, tp: 0 });
window.basketball = window.basketball || {};
let basketball = window.basketball || {};
basketball.selectedMatchIds = basketball.selectedMatchIds || [];
basketball.teamsData = basketball.teamsData || {};
basketball.stats = basketball.stats || {};
basketball.stats.team = basketball.stats.team || {};
basketball.stats.player = basketball.stats.player || {};
basketball.stats.team.max = basketball.stats.team.max || initStats();
basketball.stats.team.avg = basketball.stats.team.avg || initStats();
basketball.stats.player.max = basketball.stats.player.max || initStats();
basketball.stats.player.avg = basketball.stats.player.avg || initStats();

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = `Αποτυχία φόρτωσης δεδομένων: ${error.message}. Ελέγξτε το CORS ή τη διεύθυνση URL.`;
            loadingMessage.style.color = 'red';
        }
        return null;
    }
}

function mapApiData(data) {
    const processedStats = data.stats.map((s, index) => {
        const totalRebounds = s.offensiveRebounds + s.defensiveRebounds;
        const totalFGM = s.twoPointsMade + s.threePointsMade;
        const totalFGA = s.twoPointAttempts + s.threePointAttempts;

        return {
            matchId: s.matchId,
            round: s.round,
            game: index + 1,
            opponent: s.opponentTeamName,
            date: new Date(s.matchDatetime).toLocaleDateString('el-GR'),
            pts: s.points,
            orb: s.offensiveRebounds,
            drb: s.defensiveRebounds,
            reb: totalRebounds,
            ast: s.assists,
            stl: s.steals,
            blk: s.blockedShots,
            to: s.turnovers,
            pf: s.personalFouls + s.technicalFouls + s.unsportsmanlikeFouls,
            pir: s.pir,
            fgm: s.twoPointsMade,
            fga: s.twoPointAttempts,
            fg: calculatePercentage(s.twoPointsMade, s.twoPointAttempts),
            tpm: s.threePointsMade,
            tpa: s.threePointAttempts,
            tp: calculatePercentage(s.threePointsMade, s.threePointAttempts),
            ftm: s.freeThrowsMade,
            fta: s.freeThrowAttempts,
            ft: calculatePercentage(s.freeThrowsMade, s.freeThrowAttempts),
            shots: s.throwPositions ? s.throwPositions.map(tp => ({
                x: tp.x,
                y: tp.y,
                made: tp.throwStatus === 'made'
            })) : []
        };
    });

    return processedStats;
}

function calculatePercentage(made, attempted) {
    return parseFloat(attempted > 0 ? ((made / attempted) * 100).toFixed(2) : '0.0');
}

function updateMaxValues(targetObj, sourceStats) {
    const keys = initStats ? Object.keys(initStats()) : Object.keys(sourceStats);
    keys.forEach(key => {
        targetObj[key] = Math.max(targetObj[key] || 0, sourceStats[key] || 0);
    });
}

function mapTeamTotalStats(playersData) {
    let matchesMap = {};
    const players = (playersData || basketball.currentTeamData?.players || []);

    players.forEach(player => {
        const playerMatches = mapApiData(player);

        playerMatches.forEach(s => {
            const mId = s.matchId;

            if (!matchesMap[mId]) {
                matchesMap[mId] = { 
                    matchId: mId, round: s.round, game: s.game, date: s.date, opponent: s.opponent, 
                    pts: 0, reb: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, 
                    shots: [], players: 0 };
            }

            const m = matchesMap[mId];
            m.pts += s.pts; m.reb += s.reb; m.orb += s.orb; m.drb += s.drb; m.ast += s.ast;
            m.stl += s.stl; m.blk += s.blk; m.to += s.to; m.pf += s.pf;
            m.pir += s.pir; m.fgm += s.fgm; m.fga += s.fga;
            m.tpm += s.tpm; m.tpa += s.tpa; m.ftm += s.ftm; m.fta += s.fta;
            m.shots = m.shots.concat(s.shots || []);
            m.players++;
        });
    });

    let result = Object.values(matchesMap);
    result.map(m => {
        m.pir = parseFloat((m.pir / m.players).toFixed(2));
        m.pts = parseFloat(m.pts.toFixed(2));
        m.reb = parseFloat(m.reb.toFixed(2));
        m.orb = parseFloat(m.orb.toFixed(2));
        m.drb = parseFloat(m.drb.toFixed(2));
        m.ast = parseFloat(m.ast.toFixed(2));
        m.stl = parseFloat(m.stl.toFixed(2));
        m.blk = parseFloat(m.blk.toFixed(2));
        m.to = parseFloat(m.to.toFixed(2));
        m.pf = parseFloat(m.pf.toFixed(2));
        m.fg = calculatePercentage(m.fgm, m.fga);
        m.tp = calculatePercentage(m.tpm, m.tpa);
        m.ft = calculatePercentage(m.ftm, m.fta);
    });

    return result;
}

function setOpponentStatsForTeam(team) {
    if (!team || !Array.isArray(team.stats)) return;
    team.opponent = team.opponent || {};
    team.opponent.statsTotal = initStats();
    team.opponent.statsAverage = initStats();
    team.stats.forEach(game => {
        const opponentId = (Object.values(basketball.teamsData).find(candidate => candidate.name === game.opponent) || {}).id;
        const matchId = game.matchId;
        const opponentTeam = basketball.teamsData[opponentId];
        if (opponentTeam && Array.isArray(opponentTeam.stats)) {
            const opponentGameStats = opponentTeam.stats.find(s => s.matchId === matchId);
            if (opponentGameStats) {
                game.opponentStats = {
                    pts: opponentGameStats.pts || 0,
                    reb: opponentGameStats.reb || 0,
                    orb: opponentGameStats.orb || 0,
                    drb: opponentGameStats.drb || 0,
                    ast: opponentGameStats.ast || 0,
                    stl: opponentGameStats.stl || 0,
                    blk: opponentGameStats.blk || 0,
                    to: opponentGameStats.to || 0,
                    pf: opponentGameStats.pf || 0,
                    pir: opponentGameStats.pir || 0,
                    fgm: opponentGameStats.fgm || 0,
                    fga: opponentGameStats.fga || 0,
                    tpm: opponentGameStats.tpm || 0,
                    tpa: opponentGameStats.tpa || 0,
                    ftm: opponentGameStats.ftm || 0,
                    fta: opponentGameStats.fta || 0,
                    fg: opponentGameStats.fg || 0,
                    tp: opponentGameStats.tp || 0,
                    ft: opponentGameStats.ft || 0
                };
                Object.keys(team.opponent.statsTotal).forEach(key => {
                    team.opponent.statsTotal[key] += game.opponentStats[key] || 0;
                });
            }
        }
    });
    Object.keys(team.opponent.statsAverage).forEach(key => {
        team.opponent.statsAverage[key] = parseFloat((team.opponent.statsTotal[key] / team.stats.length).toFixed(3));
    });
}

async function loadTeamsDropdown() {
    const select = document.getElementById('team-select');
    if (!select) return;

    $('#team-select').select2({
        placeholder: '-- Επιλέξτε Ομάδα --',
        allowClear: true
    });
    $('#team-select').next('.select2-container').addClass('flex-grow-1');

    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    }

    const dataJson = await fetchData(API_URLS.TEAMS);
    const data = (dataJson?.content || []).sort((a, b) => a.name.localeCompare(b.name, 'el', { sensitivity: 'base' }));

    select.innerHTML = '';

    if (Array.isArray(data) && data.length > 0) {
        select.innerHTML = '<option value="">-- Επιλέξτε Ομάδα --</option>';
        basketball.stats.team.max = initStats();
        basketball.stats.team.avg = initStats();
        basketball.stats.player.max = initStats();
        basketball.stats.player.avg = initStats();
        basketball.teamsMaxValues = initStats();
        basketball.teamsMaxAverages = initStats();

        const globalTeamAveragesTotals = initStats();
        const globalPlayerAveragesTotals = initStats();

        const promises = data.map(async rankingItem => {
            const team = rankingItem.team || rankingItem;
            if (team && team.id && team.name) {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);

                const teamUrl = API_URLS.TEAM_ROSTER.replace('{id}', team.id);
                basketball.teamsData[team.id] = basketball.teamsData[team.id] || (await fetchData(teamUrl));
            }
        });

        Promise.all(promises).then(() => {
            Object.values(basketball.teamsData).forEach(team => {
                
                team.stats = team.stats || mapTeamTotalStats(team.players);
                team.statsTotal = initStats();
                team.statsAverage = initStats();

                team.playerMaxValues = initStats();
                team.playerMaxAverages = initStats();

                team.players.forEach(player => {
                    if (player.stats && Array.isArray(player.stats)) {
                        player.statsTotal = initStats();
                        player.statsAverage = initStats();
                        const playerMatches = mapApiData(player);
                        playerMatches.forEach(game => {        
                            Object.keys(player.statsTotal).forEach(key => {
                                player.statsTotal[key] += game[key] || 0;
                            });
                            updateMaxValues(team.playerMaxValues, game);
                        });
                        Object.keys(player.statsAverage).forEach(key => {
                            player.statsAverage[key] = parseFloat((player.statsTotal[key] / playerMatches.length).toFixed(3));
                        });
                        updateMaxValues(team.playerMaxAverages, player.statsAverage);
                    }
                });

                team.statsMax = initStats();

                team.stats.forEach(game => {
                    Object.keys(team.statsTotal).forEach(key => {
                        team.statsTotal[key] += game[key] || 0;
                    });

                    updateMaxValues(team.statsMax, game);
                });

                
                Object.keys(team.statsAverage).forEach(key => {
                    team.statsAverage[key] = parseFloat((team.statsTotal[key] / team.stats.length).toFixed(3));
                });
                updateMaxValues(basketball.stats.team.max, team.statsMax);
                updateMaxValues(basketball.stats.team.avg, team.statsAverage);
                updateMaxValues(basketball.stats.player.max, team.playerMaxValues);
                updateMaxValues(basketball.stats.player.avg, team.playerMaxAverages);
            });
            Object.values(basketball.teamsData).forEach(team => {
                setOpponentStatsForTeam(team);                
            });
            basketball.teamsMaxValues = { ...basketball.stats.team.max };
            basketball.teamsMaxAverages = { ...basketball.stats.team.avg };

            if (loadingMessage) {
                loadingMessage.classList.add('hidden');
            }
        });
    } else {
        select.innerHTML = '<option value="">Αδυναμία φόρτωσης ομάδων ή κενό ranking</option>';
    }
}

async function loadTeamData(teamId) {
    const teamStatsContent = document.getElementById('team-stats-content');
    const loadingMessage = document.getElementById('loading-message');

    if (!teamId) {
        if (teamStatsContent) {
            teamStatsContent.classList.add('hidden');
        }
        return;
    }

    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    }
    if (teamStatsContent) {
        teamStatsContent.classList.add('hidden');
    }

    basketball.currentTeamData = basketball.teamsData[teamId];
    if (!basketball.currentTeamData) return;

    if (typeof basketball.renderTeamOverview === 'function') {
        basketball.renderTeamOverview();
    }

    if (teamStatsContent) {
        teamStatsContent.classList.remove('hidden');
    }
    if (loadingMessage) {
        loadingMessage.classList.add('hidden');
    }
}

async function refreshStatistics(playerId, rowElement) {
    const activeRow = rowElement || document.querySelector(`tr[data-playerid="${playerId}"]`);
    if (activeRow && activeRow.classList.contains('active')) {
        if (typeof basketball.hideStatistics === 'function') {
            basketball.hideStatistics();
        }
        return;
    }

    const previousActiveRow = document.querySelector('#team-roster-table tbody tr.active');
    if (previousActiveRow && previousActiveRow !== activeRow) {
        previousActiveRow.classList.remove('active');
    }
    if (activeRow) {
        activeRow.classList.add('active');
    }

    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    }

    const playerUrl = API_URLS.PLAYER_STATS.replace('{id}', playerId);
    const rawPlayerData = await fetchData(playerUrl);

    if (!rawPlayerData) {
        if (loadingMessage) {
            loadingMessage.classList.add('hidden');
        }
        return;
    }

    const mappedData = mapApiData(rawPlayerData);
    if (typeof basketball.renderStatisticsPanel === 'function') {
        basketball.renderStatisticsPanel(mappedData);
    }
}

basketball.fetchData = fetchData;
basketball.mapApiData = mapApiData;
basketball.calculatePercentage = calculatePercentage;
basketball.mapTeamTotalStats = mapTeamTotalStats;
basketball.loadTeamsDropdown = loadTeamsDropdown;
basketball.loadTeamData = loadTeamData;
basketball.refreshStatistics = refreshStatistics;