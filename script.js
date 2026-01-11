// --- API Endpoints ---
const API_URLS = {
    // Το ID 39 χρησιμοποιείται ως παράδειγμα για την αρχική φόρτωση του ranking.
    TEAMS_RANKING: 'https://api.commercial-league.gr/api/web/teams/39/ranking?phase=regular_season', 
    TEAM_ROSTER: 'https://api.commercial-league.gr/api/web/teams/{id}?phase=regular_season&isCup=false',
    PLAYER_STATS: 'https://api.commercial-league.gr/api/web/players/{id}',
};
window.selectedMatchIds = window.selectedMatchIds || [];

// Βοηθητική συνάρτηση για fetching
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('loading-message').textContent = `Αποτυχία φόρτωσης δεδομένων: ${error.message}. Ελέγξτε το CORS ή τη διεύθυνση URL.`;
        document.getElementById('loading-message').style.color = 'red';
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
            reb: totalRebounds, 
            ast: s.assists,
            stl: s.steals,
            blk: s.blockedShots,
            to: s.turnovers,
            pf: s.personalFouls + s.technicalFouls + s.unsportsmanlikeFouls, 
            pir: s.pir,
            fgm: totalFGM, 
            fga: totalFGA, 
            tpm: s.threePointsMade,
            tpa: s.threePointAttempts,
            ftm: s.freeThrowsMade,
            fta: s.freeThrowAttempts,
            shots: s.throwPositions ? s.throwPositions.map(tp => ({ 
                x: tp.x, 
                y: tp.y, 
                made: tp.throwStatus === 'made' 
            })) : []
        };
    });

    return processedStats;
}


// Βοηθητική συνάρτηση για υπολογισμό ποσοστού
const calculatePercentage = (made, attempted) => {
    return parseFloat(attempted > 0 ? ((made / attempted) * 100).toFixed(1) : '0.0');
};

// --- 1. Φόρτωση Ομάδων στο Dropdown ---

function updateMaxValues(targetObj, sourceStats) {
    const keys = ['pts', 'pir', 'reb', 'ast', 'stl', 'blk', 'to', 'pf'];
    keys.forEach(key => {
        targetObj[key] = Math.max(targetObj[key] || 0, sourceStats[key] || 0);
    });
}

async function loadTeamsDropdown() {
    const select = document.getElementById('team-select');
    document.getElementById('loading-message').classList.remove("hidden");

    const data = await fetchData(API_URLS.TEAMS_RANKING);

    select.innerHTML = '';
    
    // Χρησιμοποιούμε τη λογική που επιβεβαιώθηκε από εσάς (ο πίνακας είναι το ίδιο το data)
    if (Array.isArray(data) && data.length > 0) {
        select.innerHTML = '<option value="">-- Επιλέξτε Ομάδα --</option>';
		window.statsMaxValues={ pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fg: 100, tp: 100, ft: 100 };
        const promises = data.map(async (rankingItem) => {
            // Ελέγχουμε αν η πληροφορία είναι στο 'team' ή απευθείας στο rankingItem
            const team = rankingItem.team || rankingItem; 
            
            if (team && team.id && team.name) {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
			
				const teamUrl = API_URLS.TEAM_ROSTER.replace('{id}', team.id);
				window.teamsData = window.teamsData || [];
				window.teamsData[team.id] = window.teamsData[team.id] || (await fetchData(teamUrl));
				window.teamsData[team.id].stats = window.teamsData[team.id].stats || mapTeamTotalStats(window.teamsData[team.id].players);
					
				window.teamsData[team.id].stats.forEach(game => {					
					updateMaxValues(window.statsMaxValues, game);
				});
				window.teamsData[team.id].statsMaxValues = {
					pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fg: 100, tp: 100, ft: 100 
				};
				window.teamsData[team.id].players.forEach(player => {
					if (player.stats && Array.isArray(player.stats)) {
						const playerMatches = mapApiData(player);
						
						playerMatches.forEach(game => {
							updateMaxValues(window.teamsData[team.id].statsMaxValues, game);
						});
					}
				});
            }
        });
		
		// 2. Περιμένουμε την ολοκλήρωση όλων των promises
		Promise.all(promises).then(() => {
			Object.values(window.teamsData).forEach(team => {
				const numGames = team.stats.length;
				const totals = {
					pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0
				};
				
				team.opponent = team.opponent || {};
				team.opponent.statsTotal = {
					pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0
				};
				team.opponent.statsAverages = {};
				
				team.stats.forEach(game => {
					
					Object.keys(totals).forEach(key => {
						totals[key] += game[key] || 0;
					});
					
					const opponentId = (Object.values(window.teamsData).find(team => { return team.name === game.opponent; }) || {}).id;
					const matchId = game.matchId;

					// Βρίσκουμε την αντίπαλη ομάδα στο global object μας
					const opponentTeam = window.teamsData[opponentId];

					if (opponentTeam) {
						// Βρίσκουμε το ίδιο ματς στα stats του αντιπάλου
						const opponentGameStats = opponentTeam.stats.find(s => s.matchId === matchId);
						
						if (opponentGameStats) {
							game.opponentStats = {};
							const statsKeys = ['pts', 'reb', 'ast', 'stl', 'blk', 'to', 'pf', 'pir', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta'];
							
							statsKeys.forEach(key => {
								game.opponentStats[key] = opponentGameStats[key] || 0;
								team.opponent.statsTotal[key] += opponentGameStats[key] || 0;
							});
						}
					}
				});
				
				// Υπολογισμός Μέσου Όρου
				const averages = {};
				Object.keys(totals).forEach(key => {
					averages[key] = parseFloat((totals[key] / numGames).toFixed(1));
					team.opponent.statsAverages[key] = parseFloat((team.opponent.statsTotal[key] / numGames).toFixed(1));
				});
				team.statsTotal=totals;
				team.statsAVG=averages;
			});
			document.getElementById('loading-message').classList.add("hidden");
		});
    } else {
        select.innerHTML = '<option value="">Αδυναμία φόρτωσης ομάδων ή κενό ranking</option>';
    }

}

// --- 2. Φόρτωση Στατιστικών Ομάδας και Ρόστερ ---

async function loadTeamData(teamId) {
    if (!teamId) {
        document.getElementById('team-stats-content').classList.add('hidden');
        return;
    }

    document.getElementById('loading-message').classList.remove("hidden");
    document.getElementById('team-stats-content').classList.add('hidden');
    
    window.currentTeamData = window.teamsData[teamId];
    if (!window.currentTeamData) return;
	
	// Εμφάνιση Στατιστικών Ομάδας (Placeholder)
	refreshTeamRosterTable();
    let teamStats = mapTeamTotalStats();
	refreshStatisticsTable(teamStats);
	refreshStatisticsChart(teamStats);
    updateShotChartFromMatches(teamStats);
	document.getElementById('team-stats-content').classList.remove('hidden');
    document.getElementById('loading-message').classList.add("hidden");
}

function mapTeamTotalStats(playersData) {
	
    // Αντικείμενο για την ομαδοποίηση ανά αγώνα
    let matchesMap = {}; 
    let teamAllShots = [];
    const players = (playersData || window.currentTeamData.players || []);

    players.forEach(pd => {
        const playerMatches = mapApiData(pd);
        
        playerMatches.forEach(s => {
            const mId = s.matchId; // Υποθέτουμε ότι το αντικείμενο έχει matchId
            
            // Αν δεν υπάρχει ακόμα ο αγώνας στο map, δημιούργησέ τον
            if (!matchesMap[mId]) {
                matchesMap[mId] = { 
                    matchId: mId, round: s.round, game: s.game, date: s.date, opponent: s.opponent, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, 
                    to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, 
                    ftm: 0, fta: 0, shots: [], players: 0
                };
            }

            // Πρόσθεση στατιστικών παίκτη στα συνολικά του συγκεκριμένου αγώνα
            const m = matchesMap[mId];
            m.pts += s.pts; m.reb += s.reb; m.ast += s.ast;
            m.stl += s.stl; m.blk += s.blk; m.to += s.to; m.pf += s.pf;
            m.pir += s.pir; m.fgm += s.fgm; m.fga += s.fga;
            m.tpm += s.tpm; m.tpa += s.tpa; m.ftm += s.ftm; m.fta += s.fta;
            m.shots = m.shots.concat(s.shots || []);
			m.players++;
            
            // Για το συνολικό heatmap όλης της ομάδας
            teamAllShots = teamAllShots.concat(s.shots || []);
        });
    });
	let result = Object.values(matchesMap);
	result.map(m => { 
		m.pir = parseFloat((m.pir / m.players).toFixed(1)); 
		m.pts = parseFloat(m.pts.toFixed(1)); 
		m.ast = parseFloat(m.ast.toFixed(1)); 
		m.stl = parseFloat(m.stl.toFixed(1)); 
		m.blk = parseFloat(m.blk.toFixed(1)); 
		m.to = parseFloat(m.to.toFixed(1)); 
		m.pf = parseFloat(m.pf.toFixed(1)); 
		m.fg = parseFloat((m.fgm / m.fga).toFixed(1)); 
		m.tp = parseFloat((m.tpm / m.tpa).toFixed(1)); 
		m.ft = parseFloat((m.ftm / m.fta).toFixed(1)); 
	});

    // Μετατροπή του map σε πίνακα για να τον εμφανίσουμε
    return result;
}

function refreshTeamRosterTable() {
    if ($.fn.DataTable.isDataTable('#team-roster-table')) {
        $('#team-roster-table').DataTable().destroy();
        $('#team-roster-table tbody').empty();
    }

    const tbody = document.getElementById('team-roster-table').querySelector('tbody');
	const players = (window.currentTeamData.players || []);
    
    players.forEach(player => {
        const totalPoints = player.stats.reduce((sum, s) => sum + s.points, 0);
        const totalPir = player.stats.reduce((sum, s) => sum + s.pir, 0);
        const games = player.stats.length;
		
		const mappedData = mapApiData(player);
		// 1. Υπολογισμός Μέσων Όρων (Totals)
		const totals = mappedData.reduce((acc, s) => {
			acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast; 
			acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf; 
			acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga; 
			acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
			return acc;
		}, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

		const img = player.image || getImage(player.id, player.name);
		let badges = [];
		if((totals.pts / totals.games) > 20) badges.push(`<span class="badge bestof badge-type-gold">Pts</span>`);
		else if((totals.pts / totals.games) > 15) badges.push(`<span class="badge bestof badge-type-silver">Pts</span>`);
		else if((totals.pts / totals.games) > 10) badges.push(`<span class="badge bestof badge-type-bronze">Pts</span>`);
		
		if((totals.reb / totals.games) > 12) badges.push(`<span class="badge bestof badge-type-gold">Rb</span>`);
		else if((totals.reb / totals.games) > 9) badges.push(`<span class="badge bestof badge-type-silver">Rb</span>`);
		else if((totals.reb / totals.games) > 7) badges.push(`<span class="badge bestof badge-type-bronze">Rb</span>`);
		
		if((totals.ast / totals.games) > 5) badges.push(`<span class="badge bestof badge-type-gold">A</span>`);
		else if((totals.ast / totals.games) > 4) badges.push(`<span class="badge bestof badge-type-silver">A</span>`);
		else if((totals.ast / totals.games) > 3) badges.push(`<span class="badge bestof badge-type-bronze">A</span>`);
		
		if((totals.stl / totals.games) > 3) badges.push(`<span class="badge bestof badge-type-gold">Stl</span>`);
		else if((totals.stl / totals.games) > 2.5) badges.push(`<span class="bestof badge badge-type-silver">Stl</span>`);
		else if((totals.stl / totals.games) > 2) badges.push(`<span class="badge bestof badge-type-bronze">Stl</span>`);
		
		if((totals.pir / totals.games) > 20) badges.push(`<span class="badge bestof badge-type-gold">Key</span>`);
		else if((totals.pir / totals.games) > 15) badges.push(`<span class="badge bestof badge-type-silver">Key</span>`);
		else if((totals.pir / totals.games) > 10) badges.push(`<span class="badge bestof badge-type-bronze">Key</span>`);
		
		if((totals.tpm / totals.tpa) > 0.42 && (totals.tpa / totals.games) > 1.5) badges.push(`<span class="badge bestof badge-type-gold">3pt</span>`);
		else if((totals.tpm / totals.tpa) > 0.35 && (totals.tpa / totals.games) > 1.5) badges.push(`<span class="badge bestof badge-type-silver">3pt</span>`);
		else if((totals.tpm / totals.tpa) > 0.3 && (totals.tpa / totals.games) > 1.5) badges.push(`<span class="badge bestof badge-type-bronze">3pt</span>`);
        
        const avgPoints = games > 0 ? (totalPoints / games).toFixed(1) : '0.0';
        const avgPir = games > 0 ? (totalPir / games).toFixed(1) : '0.0';

        const row = tbody.insertRow();
        if(player.stats.length > 0) row.setAttribute('onclick', `refreshStatistics(${player.id})`); 
		else {
			row.setAttribute('disabled', 'disabled'); 
			row.classList.add('disabled'); 
		}
        row.insertCell().textContent = player.jersey || '-';
        row.insertCell().innerHTML = `<div class="player-img" style="background-image:url('${img}');"></div>`;
        row.insertCell().textContent = player.name;
        row.insertCell().textContent = player.position ? player.position.toUpperCase() : '-';
        row.insertCell().textContent = player.height * 100;
        row.insertCell().textContent = games;
        row.insertCell().textContent = avgPoints;
        row.insertCell().textContent = avgPir;
        row.insertCell().innerHTML = (badges.length > 0 ? badges.join("") : "");
    });

    // Ενεργοποίηση DataTables με απενεργοποιημένη σελιδοποίηση και αναζήτηση
    $('#team-roster-table').DataTable({
        paging: false, 
        searching: false, 
        ordering: true, 
        info: true, 
        language: {
            emptyTable: "Δεν υπάρχουν δεδομένα", info: "Εμφανίζονται _START_ έως _END_ από _TOTAL_ παίκτες", infoEmpty: "Εμφανίζονται 0 έως 0 από 0 παίκτες", lengthMenu: "Εμφάνιση _MENU_ εγγραφών", search: "Αναζήτηση:",
            paginate: { first: "Πρώτη", last: "Τελευταία", next: "Επόμενη", previous: "Προηγούμενη" }
        }
    });
}

// --- 3. Φόρτωση Στατιστικών Παίκτη ---

async function refreshStatistics(playerId) {
	if(this.event.currentTarget.classList.contains('active')) {
		this.event.currentTarget.parentNode.querySelector('.active')?.classList.remove("active");
		hideStatistics();
		let teamStats = mapTeamTotalStats();
		refreshStatisticsTable(teamStats);
		refreshStatisticsChart(teamStats);
		updateShotChartFromMatches(teamStats);
		return;
	}
	this.event.currentTarget.parentNode.querySelector('.active')?.classList.remove("active");
	this.event.currentTarget.classList.add("active");
    document.getElementById('loading-message').classList.remove("hidden");
    
    const playerUrl = API_URLS.PLAYER_STATS.replace('{id}', playerId);
    const rawPlayerData = await fetchData(playerUrl);

    if (!rawPlayerData) {
        document.getElementById('loading-message').classList.add("hidden");
        return;
    }

    const mappedData = mapApiData(rawPlayerData);

    // Κλήση της νέας ενιαίας συνάρτησης
    refreshStatisticsTable(mappedData); 
	refreshStatisticsChart(mappedData);
    updateShotChartFromMatches(mappedData);
}

function refreshStatisticsTable(playerData) {
    const stats = playerData; 
    if (!stats) return;

    const contentDiv = document.getElementById('player-stats-content');
    contentDiv.innerHTML = ''; // Καθαρισμός προηγούμενων δεδομένων

    // 1. Υπολογισμός Μέσων Όρων (Totals)
    const totals = stats.reduce((acc, s) => {
        acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast; 
        acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf; 
        acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga; 
        acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
        return acc;
    }, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    const avg = (total) => (total / totals.games).toFixed(1);

    // 2. Δημιουργία HTML Πίνακα
    let html = `
        <div class="stats-table-wrapper">
            <table id="modal-combined-table" class="display" style="width:100%"> 
                <thead>
                    <tr>
                        <th>Αγ.</th><th>Αντίπαλος</th><th>PTS</th><th>PIR</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>PF</th><th>FG</th><th>3PT</th><th>FT</th>
                    </tr>
                </thead>
                <tbody>
    `;

    stats.forEach(s => {
        const isSelected = window.selectedMatchIds.includes(s.matchId.toString()) ? 'table-primary active' : '';
        html += `
            <tr class="match-row ${isSelected}" data-matchid="${s.matchId}" style="cursor:pointer">
                <td>${s.game}</td>
				<td>${s.opponent} (${s.date})</td>
				<td>${s.pts}</td>
				<td>${s.pir}</td>
				<td>${s.reb}</td>
				<td>${s.ast}</td>
				<td>${s.stl}</td>
				<td>${s.blk}</td>
				<td>${s.to}</td>
				<td>${s.pf}</td>
                <td data-sort="${s.fgm / s.fga || 0}">${s.fgm}/${s.fga} (${calculatePercentage(s.fgm, s.fga)}%)</td>
                <td data-sort="${s.tpm / s.tpa || 0}">${s.tpm}/${s.tpa} (${calculatePercentage(s.tpm, s.tpa)}%)</td>
                <td data-sort="${s.ftm / s.fta || 0}">${s.ftm}/${s.fta} (${calculatePercentage(s.ftm, s.fta)}%)</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot style="background-color: #e8f4fd; font-weight: bold; border-top: 2px solid #2196F3;">
                    <tr>
                        <td>Μ.Ο.</td><td>${totals.games} Αγώνες</td>
                        <td>${avg(totals.pts)}</td>
						<td>${avg(totals.pir)}</td>
                        <td>${avg(totals.reb)}</td>
						<td>${avg(totals.ast)}</td>
                        <td>${avg(totals.stl)}</td>
						<td>${avg(totals.blk)}</td>
                        <td>${avg(totals.to)}</td>
						<td>${avg(totals.pf)}</td>
                        <td>${avg(totals.fgm)}/${avg(totals.fga)} (${calculatePercentage(totals.fgm, totals.fga)}%)</td>
                        <td>${avg(totals.tpm)}/${avg(totals.tpa)} (${calculatePercentage(totals.tpm, totals.tpa)}%)</td>
                        <td>${avg(totals.ftm)}/${avg(totals.fta)} (${calculatePercentage(totals.ftm, totals.fta)}%)</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;

    contentDiv.innerHTML = html;

    // Ενεργοποίηση DataTable
    setTimeout(() => {
        $('#modal-combined-table').DataTable({ 
            paging: false, searching: false, ordering: true, info: false,
            language: { emptyTable: "Δεν υπάρχουν δεδομένα" }
        });
		
		// Event Listeners για Multiselect
		document.querySelectorAll('.match-row').forEach(row => {
			row.addEventListener('click', function() {
				const mId = this.getAttribute('data-matchid').toString();
				
				if (window.selectedMatchIds.includes(mId)) {
					window.selectedMatchIds = window.selectedMatchIds.filter(id => id !== mId);
					this.classList.remove('table-primary', 'active');
				} else {
					window.selectedMatchIds.push(mId);
					this.classList.add('table-primary', 'active');
				}
				
				// Φιλτράρισμα και κλήση της δικής σου refreshShotHeatmap
				updateShotChartFromMatches(stats);
			});
		});
    
		document.getElementById('statisticContainer').classList.remove('hidden');
		document.getElementById('loading-message').classList.add("hidden");	
    }, 100);
}

function refreshStatisticsChart(playerData) {
    const stats = playerData; 
    if (!stats || stats.length === 0) return;

    const pcr = document.getElementById('player-chart-radar');
	if (!!window.playerChartRadar) {
        window.playerChartRadar.destroy();
    }

    // 1. Υπολογισμός Μέσων Όρων (Totals)
    const totals = stats.reduce((acc, s) => {
        acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast; 
        acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf; 
        acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga; 
        acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
        return acc;
    }, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    const avg = (total) => parseFloat((total / totals.games).toFixed(1));
	
	var colors = [
		"#d64161",
		"#ff7b25",
		"#feb236",
		"#6b5b95",
		
		"#878f99",
		"#b2ad7f",
		"#a2b9bc",
		"#92a8d1",
		
		"#c94c4c",
		"#f7786b",
		"#034f84",
		"#deeaee",
		
		"#82b74b",
		"#405d27",
		"#50394c",
		"#ffef96",
	];
	let datasets=[];
	let idxColor=0;
	const isTeamChart = (stats[0].players || 1) !== 1;
	const statsMaxValues = !isTeamChart ? window.currentTeamData.statsMaxValues : window.statsMaxValues;
    stats.forEach(s => {
		const color=colors[idxColor++];
		datasets.push(
		{
			label: `${s.opponent} (${s.date})`,
			data: [
				s.pts / statsMaxValues["pts"], 
				s.pir / statsMaxValues["pir"], 
				s.reb / statsMaxValues["reb"], 
				s.ast / statsMaxValues["ast"], 
				s.stl / statsMaxValues["stl"], 
				s.blk / statsMaxValues["blk"], 
				s.to / statsMaxValues["to"], 
				s.pf / statsMaxValues["pf"], 
				calculatePercentage(s.fgm, s.fga) / statsMaxValues["fg"], 
				calculatePercentage(s.tpm, s.tpa) / statsMaxValues["tp"], 
				calculatePercentage(s.ftm, s.fta) / statsMaxValues["ft"]
			],
			fill: true,
			backgroundColor: `${color}30`,
			borderColor: `${color}`,
			pointBackgroundColor: `${color}`,
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: `${color}`
		});
    });
	
	let avgDataset=[{
		label: ( isTeamChart ? window.currentTeamData.name : `Μέσος όρος` ),
		data: [
			avg(totals.pts) / statsMaxValues["pts"], 
			avg(totals.pir) / statsMaxValues["pir"], 
			avg(totals.reb) / statsMaxValues["reb"], 
			avg(totals.ast) / statsMaxValues["ast"], 
			avg(totals.stl) / statsMaxValues["stl"], 
			avg(totals.blk) / statsMaxValues["blk"], 
			avg(totals.to) / statsMaxValues["to"], 
			avg(totals.pf) / statsMaxValues["pf"], 
			calculatePercentage(avg(totals.fgm), avg(totals.fga)) / statsMaxValues["fg"], 
			calculatePercentage(avg(totals.tpm), avg(totals.tpa)) / statsMaxValues["tp"], 
			calculatePercentage(avg(totals.ftm), avg(totals.fta)) / statsMaxValues["ft"]
		],
		fill: true,
		backgroundColor: `#878f9930`,
		borderColor: `#878f99`,
		pointBackgroundColor: `#878f99`,
		pointBorderColor: '#fff',
		pointHoverBackgroundColor: '#fff',
		pointHoverBorderColor: `#878f99`
	}];
	
	if(isTeamChart){
		const against = window.currentTeamData.opponent.statsAverages;
		avgDataset.push({
			label: window.currentTeamData.name + " (παθητικό)",
			data: [
				against.pts / statsMaxValues["pts"], 
				against.pir / statsMaxValues["pir"], 
				against.reb / statsMaxValues["reb"], 
				against.ast / statsMaxValues["ast"], 
				against.stl / statsMaxValues["stl"], 
				against.blk / statsMaxValues["blk"], 
				against.to / statsMaxValues["to"], 
				against.pf / statsMaxValues["pf"], 
				calculatePercentage(against.fgm, against.fga) / statsMaxValues["fg"], 
				calculatePercentage(against.tpm, against.tpa) / statsMaxValues["tp"], 
				calculatePercentage(against.ftm, against.fta) / statsMaxValues["ft"]
			],
			fill: true,
			backgroundColor: `#82b74b30`,
			borderColor: `#82b74b`,
			pointBackgroundColor: `#82b74b`,
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: `#82b74b`
		});		
	}
	
	if(window.currentTeamData.id !== 39 && isTeamChart){
		const ourStats = window.teamsData[39].statsAVG;
		avgDataset.push({
			label: window.teamsData[39].name,
			data: [
				ourStats.pts / statsMaxValues["pts"], 
				ourStats.pir / statsMaxValues["pir"], 
				ourStats.reb / statsMaxValues["reb"], 
				ourStats.ast / statsMaxValues["ast"], 
				ourStats.stl / statsMaxValues["stl"], 
				ourStats.blk / statsMaxValues["blk"], 
				ourStats.to / statsMaxValues["to"], 
				ourStats.pf / statsMaxValues["pf"], 
				calculatePercentage(ourStats.fgm, ourStats.fga) / statsMaxValues["fg"], 
				calculatePercentage(ourStats.tpm, ourStats.tpa) / statsMaxValues["tp"], 
				calculatePercentage(ourStats.ftm, ourStats.fta) / statsMaxValues["ft"]
			],
			fill: true,
			backgroundColor: `#7098E530`,
			borderColor: `#7098E5`,
			pointBackgroundColor: `#7098E5`,
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: `#7098E5`
		});
		const ourAgainst = window.teamsData[39].opponent.statsAverages;
		avgDataset.push({
			label: window.teamsData[39].name + " (παθητικό)",
			data: [
				ourAgainst.pts / statsMaxValues["pts"], 
				ourAgainst.pir / statsMaxValues["pir"], 
				ourAgainst.reb / statsMaxValues["reb"], 
				ourAgainst.ast / statsMaxValues["ast"], 
				ourAgainst.stl / statsMaxValues["stl"], 
				ourAgainst.blk / statsMaxValues["blk"], 
				ourAgainst.to / statsMaxValues["to"], 
				ourAgainst.pf / statsMaxValues["pf"], 
				calculatePercentage(ourAgainst.fgm, ourAgainst.fga) / statsMaxValues["fg"], 
				calculatePercentage(ourAgainst.tpm, ourAgainst.tpa) / statsMaxValues["tp"], 
				calculatePercentage(ourAgainst.ftm, ourAgainst.fta) / statsMaxValues["ft"]
			],
			fill: true,
			backgroundColor: `#ffef9630`,
			borderColor: `#ffef96`,
			pointBackgroundColor: `#ffef96`,
			pointBorderColor: '#fff',
			pointHoverBackgroundColor: '#fff',
			pointHoverBorderColor: `#ffef96`
		});
	}
	
	const data = {
		    labels: [
			'PTS', 'PIR', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'FG %', '3PTS %', 'FT %'
			],
		    datasets: (document.getElementById('view-mode').value === "avg" ? avgDataset : datasets)
		};
	const config = {
	    type: 'radar',
	    data: data,
	    options: {
	        elements: {
	            line: {
	                borderWidth: 3
	            }
	        },
	        plugins: {
	            tooltip: {
	                callbacks: {
	                    label: function (context) {
	                        let label = (context.label || '').split(' ')[0].toLowerCase();
							switch(label){
								case "3pts": label="tp"; break;
							}
	                        let value = context.raw;
							const isAVG = document.getElementById('view-mode').value === "avg";
							const fixedNumber = isAVG ? 1 : 0;
							return (isAVG ? "" : (context.dataset.label + ' : ')) + (value * statsMaxValues[label]).toFixed(fixedNumber);
	                    }
	                }
	            }
	        },
	        scales: {
	            r: {
					min: 0,
	                suggestedMin: 0,
	                suggestedMax: 1,
					ticks: {
						display: false,
						beginAtZero: true,
						stepSize: 0.2
					},
					pointLabels: {
						display: true
					}
	            }
	        }
	    },
	};
	
	window.playerChartRadar = new Chart(pcr, config);
	const viewModeSelect = document.getElementById('view-mode');

	viewModeSelect.addEventListener('change', function() {
		const selectedMode = this.value;
		
		if (selectedMode === 'avg') {
			window.playerChartRadar.data.datasets = avgDataset;
		} else {
			window.playerChartRadar.data.datasets = datasets;
		}
		
		window.playerChartRadar.update();
	});
}


function hideStatistics() {
    document.getElementById('statisticContainer').classList.add('hidden');
}

function updateShotChartFromMatches(matchesList) {
    let finalShots = [];
    if (selectedMatchIds.length > 0) {
        matchesList.forEach(m => {
            if (selectedMatchIds.includes(m.matchId.toString())) {
                finalShots = finalShots.concat(m.shots);
            }
        });
    } else {
        matchesList.forEach(m => { finalShots = finalShots.concat(m.shots); });
    }

    // Κλήση της δικής σου μεθόδου με το array format που περιμένει
    refreshShotHeatmap([{ "shots": finalShots }]);
}

// --- 4. Χάρτης Δεδομένων & Προβολή Στατιστικών Παίκτη ---

function refreshShotHeatmap(allGameStats) {

	
    var containerId = 'shot-map';
    const contentDiv = document.getElementById('shot-map-container');
    const containerDiv = document.getElementById(containerId);
	
    // Διαστάσεις γηπέδου (πρέπει να αντιστοιχούν με αυτές στο styles.css)
    const COURT_WIDTH = containerDiv.offsetWidth || 400; 
    const COURT_HEIGHT = 400; 
    const MAX_VALUE = 100; // Μέγιστη τιμή για την κλίμακα χρώματος
    const MIN_VALUE = 10;   // Ελάχιστη τιμή
	
	const power = 0.5;
	const SMOOTHING_RADIUS = 10;
	
    contentDiv.innerHTML = `
        <div id="${containerId}" style="height:${COURT_HEIGHT}px; width:${COURT_WIDTH}px;" ></div>
        <p style="margin-top:15px; color:#333;">
            <span style="color:red; font-weight:bold;">Κόκκινο:</span> Υψηλό ποσοστό αστοχίας. | 
            <span style="color:green; font-weight:bold;">Πράσινο:</span> Υψηλό ποσοστό ευστοχίας. | 
            <span style="color:orange; font-weight:bold;">Πορτοκαλί:</span> Μεικτά/Μέτρια ποσοστά.
        </p>
    `;

    // 1. Συγκέντρωση και Μετατροπή Δεδομένων Σουτ
    let allShots = [];
    allGameStats.forEach(game => {
        if (game.shots) {
            allShots = allShots.concat(game.shots);
        }
    });

    if (allShots.length === 0) {
        document.getElementById(containerId).innerHTML = '';
        return;
    }
    
    // ΕΔΩ ΟΡΙΖΟΥΜΕ ΤΟ RADIUS ΣΕ ΜΙΑ ΜΕΤΑΒΛΗΤΗ ΓΙΑ ΑΣΦΑΛΗ ΠΡΟΣΠΕΛΑΣΗ
    const POINT_RADIUS = 1; 

    // 2. Προσαρμογή Χρωματικής Κλίμακας (Gradient)
    const colorGradient = {
        0.0: 'rgba(255, 255, 255, 0)', 
        0.1: 'rgba(255, 0, 0, 0)', 
        0.2: 'red',                   
        0.5: 'orange',                
        0.7: 'yellow',                
        0.99: 'green',               
        1.0: 'green'                  
    };
	const colorGradient2 = {
        0.0: 'rgba(255, 255, 255, .1)', 
        0.01: 'rgba(255, 0, 0, 1)', 
        0.1: 'rgba(255, 0, 0, 1)', 
        0.2: 'red',                   
        0.5: 'orange',                
        0.7: 'yellow',                
        0.99: 'green',               
        1.0: 'green'                  
    };

    // 3. Αρχικοποίηση Heatmap.js
    const heatmapInstance = h337.create({
        container: document.getElementById(containerId),
        radius: POINT_RADIUS, // Χρησιμοποιούμε τη μεταβλητή
		opacity: 1,
        // maxopacity: 1,
        // minopacity: 0,
        gradient: colorGradient2 ,
		width: COURT_WIDTH,
		height: COURT_HEIGHT,
		blur: .75
    });

	const imagepadding = 60;
    // 4. Μετατροπή Συντεταγμένων και Εισαγωγή Δεδομένων
    const dataPoints = allShots.map(shot => {
        // Η "value" θα είναι το 100 αν το σουτ είναι εύστοχο (πράσινο) και το 0 αν είναι άστοχο (κόκκινο)
        const value = shot.made ? MAX_VALUE : MIN_VALUE;
        
        return {
            x: Math.round(COURT_WIDTH -(shot.x * (COURT_WIDTH - imagepadding)) - (imagepadding * 0.5)),
            y: Math.round(COURT_HEIGHT - (shot.y * (COURT_HEIGHT - imagepadding)) - (imagepadding * 0.5)), // Αντιστροφή άξονα Y
            value: value,
            //radius: POINT_RADIUS
        };
    });
	const smoothedPoints = smoothInputPoints(dataPoints, power, SMOOTHING_RADIUS);
	var finalGridAVG = getInterpolatedPointsList(smoothedPoints, power, SMOOTHING_RADIUS, COURT_WIDTH,COURT_HEIGHT);
    
	//console.log(finalGridAVG);
	
    // Εισαγωγή όλων των σημείων στο heatmap
    heatmapInstance.setData({
        max: MAX_VALUE,
        min: 0,
        data: finalGridAVG,
        //data: dataPoints,
        // maxOpacity: 1,
        // minOpacity: 0,
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


 /**
 * 1. Εξομαλύνει τις τιμές των αρχικών σημείων με βάση τις γειτονικές τους τιμές
 * εντός της ακτίνας smoothingRadius.
 *
 * @param {Array<{x: number, y: number, value: number}>} points Τα αρχικά σημεία δεδομένων.
 * @param {number} radiusPower Η δύναμη της απόστασης για τη στάθμιση.
 * @param {number} smoothingRadius Η μέγιστη ακτίνα για τον υπολογισμό της εξομάλυνσης.
 * @returns {Array<{x: number, y: number, value: number}>} Τα εξομαλυσμένα σημεία.
 */
function smoothInputPoints(points, radiusPower, smoothingRadius) {
    const smoothedPoints = [];
    //const epsilon = 1e-6;
    const epsilon = 1;

    // Φιλτράρουμε τα σημεία, αγνοώντας όσα έχουν value = 0
    const validPoints = points.filter(p => p.value !== 0);

    for (let i = 0; i < validPoints.length; i++) {
        const targetPoint = validPoints[i];
        let weightedSum = 0;
        let totalWeight = 0;

        // Υπολογισμός του σταθμισμένου μέσου για το targetPoint
        // με βάση όλα τα άλλα validPoints (συμπεριλαμβανομένου του ίδιου)
        for (let j = 0; j < validPoints.length; j++) {
            const currentPoint = validPoints[j];
            
            // Υπολογισμός Ευκλείδειας Απόστασης
            const distance = Math.sqrt(
                Math.pow(currentPoint.x - targetPoint.x, 2) + 
                Math.pow(currentPoint.y - targetPoint.y, 2)
            );

            // Περιορισμός: Υπολογίζουμε μόνο σημεία εντός της smoothingRadius
            if (distance > smoothingRadius) {
                continue; 
            }

            let weight;
            if (distance < epsilon) {
                // Απόλυτη ταύτιση (το σημείο με τον εαυτό του): Μέγιστο βάρος (π.χ. 1.0)
                weight = 1.0; 
            } else {
                // IDW Weight: Weight = 1 / (d ^ radiusPower)
                weight = 1.0 / Math.pow(distance, radiusPower);
            }
            
            weightedSum += currentPoint.value * weight;
            totalWeight += weight;
        }

        const smoothedValue = totalWeight === 0 ? targetPoint.value : weightedSum / totalWeight;

        smoothedPoints.push({
            x: targetPoint.x,
            y: targetPoint.y,
            // Η τιμή περιορίζεται μεταξύ 0 και 100
            value: Math.max(0, Math.min(100, smoothedValue))
        });
    }

    return smoothedPoints;
}

// ----------------------------------------------------------------------


/**
 * Υπολογίζει έναν πίνακα (λίστα) αντικειμένων {x, y, value} για κάθε κελί
 * ενός πλέγματος size x size, εφαρμόζοντας IDW με Όριο Ακτίνας Αναζήτησης.
 *
 * @param {Array<{x: number, y: number, value: number}>} points Τα σημεία δεδομένων εισόδου.
 * @param {number} radiusPower Η δύναμη της απόστασης (p).
 * @param {number} searchRadius Η μέγιστη ακτίνα επιρροής.
 * @param {number} size Το μέγεθος του τελικού πίνακα (π.χ. 100).
 * @returns {Array<{x: number, y: number, value: number}>} Η τελική λίστα 10000 σημείων.
 */
function getInterpolatedPointsList(points, radiusPower, searchRadius, size = 100) {
    // Αρχικοποίηση του αποτελέσματος ως μονοδιάστατος πίνακας αντικειμένων
    const interpolatedPointsList = [];
    const epsilon = 1e-6; 

    // Φιλτράρουμε τα σημεία, αγνοώντας όσα έχουν value = 0.
    const validPoints = points.filter(p => p.value !== 0);

    // 1. Επανάληψη για κάθε κελί (pixel) του τελικού πίνακα (size x size)
    for (let i = 0; i < size; i++) { // i: Γραμμές (y-coordinate, από 0 έως 99)
        for (let j = 0; j < size; j++) { // j: Στήλες (x-coordinate, από 0 έως 99)
            
            const targetX = j;
            const targetY = i;

            let weightedSum = 0;
            let totalWeight = 0;
            let isExactMatch = false;

            // 2. Υπολογισμός του σταθμισμένου μέσου
            for (const point of validPoints) {
                // Υπολογισμός Ευκλείδειας Απόστασης (d) από το τρέχον κελί
                const distance = Math.sqrt(
                    Math.pow(point.x - targetX, 2) + Math.pow(point.y - targetY, 2)
                );
                
                // Κανόνας Search Radius: Αγνοούμε το σημείο αν είναι πέρα από το searchRadius
                if (distance > searchRadius) {
                    continue; 
                }

                let weight;
                
                if (distance < epsilon) {
                    // Απόλυτη ταύτιση: Το κελί παίρνει την τιμή του σημείου
                    // Επειδή είναι ακριβώς πάνω στο σημείο, απλοποιούμε τον υπολογισμό.
                    weight = 1.0; 
                    weightedSum = point.value * weight; 
                    totalWeight = weight;
                    isExactMatch = true;
                    break; 
                } else {
                    // Υπολογισμός Βάρους (IDW): Weight = 1 / (d ^ radiusPower)
                    weight = 1.0 / Math.pow(distance, radiusPower);
                }
                
                weightedSum += point.value * weight;
                totalWeight += weight;
                //totalWeight ++;//dikh moy allagh
            }

            // 3. Εύρεση της τελικής τιμής
            let finalValue;
            if (!isExactMatch && totalWeight === 0) {
                 finalValue = 0; // Τιμή 0 αν δεν βρεθεί κανένα σημείο εντός ακτίνας
            } else {
                 finalValue = weightedSum / totalWeight;
                 // Περιορισμός της τιμής μεταξύ 0 και 100
                 finalValue = Math.max(0, Math.min(100, finalValue));
            }
            
			if(finalValue !== 0)
            // 4. Προσθήκη του αποτελέσματος στην τελική λίστα
            interpolatedPointsList.push({
                x: targetX,
                y: targetY,
                value: finalValue
            });
        }
    }

    return interpolatedPointsList;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Εκκίνηση της εφαρμογής μόλις φορτώσει η σελίδα
window.onload = loadTeamsDropdown;

function getImage(id, fullname){
	if((id || "") === "") return null;
	id=id + "";
	let images=[];
	images["938"]="KΟΤΤΗ-Κ.jpg";
	images["1884"]="ΑΜΠΕΛΑΣ-Χ.jpg";
	images["949"]="ΒΑΣΙΛΑΚΗΣ-Μ.jpg";
	images["810"]="ΚΑΡΑΚΙΤΣΙΟΣ-Γ.jpg";
	images["802"]="ΛΑΜΠΡΟΥ-Ι.jpg";
	images["812"]="ΜΑΚΡΥΓΙΑΝΝΗΣ-Ν.jpg";
	images["796"]="ΠΕΡΟΥΚΑΝΕΑΣ-Β.jpg";
	images["964"]="ΣΑΒΒΑΪΔΗΣ-Ε.jpg";
	images["876"]="Τρέχας-Αναστάσιος.jpg";
	images["752"]="ΤΡΟΥΠΗΣ-Β.jpg";
	images["0"]="Τρούπης-Μηνάς.jpg";
	if((images[id] || "") !== "") return `./images/${images[id]}`;
	
	const names = fullname.split(" ");
	const name = names.length > 0 ?  normalizePolytonicGreek(names[0]).toUpperCase() : "";
	const surname = names.length > 1 ?  normalizePolytonicGreek(names[1]).toUpperCase() : "";
	return `https://www.commercial-league.gr/wp-content/uploads/2023/11/Player-24-25-${name}-${surname.charAt(0)}-180x300.jpg`;
}

function normalizeGreek(text) {
    text = text.replace(/Ά|Α|ά/g, 'α')
        .replace(/Έ|Ε|έ/g, 'ε')
        .replace(/Ή|Η|ή/g, 'η')
        .replace(/Ί|Ϊ|Ι|ί|ΐ|ϊ/g, 'ι')
        .replace(/Ό|Ο|ό/g, 'ο')
        .replace(/Ύ|Ϋ|Υ|ύ|ΰ|ϋ/g, 'υ')
        .replace(/Ώ|Ω|ώ/g, 'ω')
        .replace(/Σ|ς/g, 'σ');
    return text;
}


function normalizePolytonicGreek(text) {
    text = text.replace(/Ά|Α|ά|ἀ|ἁ|ἂ|ἃ|ἄ|ἅ|ἆ|ἇ|ὰ|ά|ᾀ|ᾁ|ᾂ|ᾃ|ᾄ|ᾅ|ᾆ|ᾇ|ᾰ|ᾱ|ᾲ|ᾳ|ᾴ|ᾶ|ᾷ|Ἀ|Ἁ|Ἂ|Ἃ|Ἄ|Ἅ|Ἆ|Ἇ|ᾈ|ᾉ|ᾊ|ᾋ|ᾌ|ᾍ|ᾎ|ᾏ|Ᾰ|Ᾱ|Ὰ|Ά|ᾼ/g, 'α')
        .replace(/Έ|Ε|έ|ἐ|ἑ|ἒ|ἓ|ἔ|ἕ|ὲ|έ|Ἐ|Ἑ|Ἒ|Ἓ|Ἔ|Ἕ|Ὲ|Έ/g, 'ε')
        .replace(/Ή|Η|ή|ἠ|ἡ|ἢ|ἣ|ἤ|ἥ|ἦ|ἧ|ὴ|ή|ᾐ|ᾑ|ᾒ|ᾓ|ᾔ|ᾕ|ᾖ|ᾗ|ῂ|ῃ|ῄ|ῆ|ῇ|Ἠ|Ἡ|Ἢ|Ἣ|Ἤ|Ἥ|Ἦ|Ἧ|ᾘ|ᾙ|ᾚ|ᾛ|ᾜ|ᾝ|ᾞ|ᾟ|Ὴ|Ή|ῌ/g, 'η')
        .replace(/Ί|Ϊ|Ι|ί|ΐ|ἰ|ἱ|ἲ|ἳ|ἴ|ἵ|ἶ|ἷ|ὶ|ί|ῐ|ῑ|ῒ|ΐ|ῖ|ῗ|Ἰ|Ἱ|Ἲ|Ἳ|Ἴ|Ἵ|Ἶ|Ἷ|Ῐ|Ῑ|Ὶ|Ί/g, 'ι')
        .replace(/Ό|Ο|ό|ὀ|ὁ|ὂ|ὃ|ὄ|ὅ|ὸ|ό|Ὀ|Ὁ|Ὂ|Ὃ|Ὄ|Ὅ|Ὸ|Ό/g, 'ο')
        .replace(/Ύ|Ϋ|Υ|ΰ|ϋ|ύ|ὐ|ὑ|ὒ|ὓ|ὔ|ὕ|ὖ|ὗ|ὺ|ύ|ῠ|ῡ|ῢ|ΰ|ῦ|ῧ|Ὑ|Ὓ|Ὕ|Ὗ|Ῠ|Ῡ|Ὺ|Ύ/g, 'υ')
        .replace(/Ώ|Ω|ώ|ὠ|ὡ|ὢ|ὣ|ὤ|ὥ|ὦ|ὧ|ὼ|ώ|ᾠ|ᾡ|ᾢ|ᾣ|ᾤ|ᾥ|ᾦ|ᾧ|ῲ|ῳ|ῴ|ῶ|ῷ|Ὠ|Ὡ|Ὢ|Ὣ|Ὤ|Ὥ|Ὦ|Ὧ|ᾨ|ᾩ|ᾪ|ᾫ|ᾬ|ᾭ|ᾮ|ᾯ|Ὼ|Ώ|ῼ/g, 'ω')
        .replace(/ῤ|ῥ|Ῥ/g, 'ρ')
        .replace(/Σ|ς/g, 'σ');
    return text;
}
