function getStatColor(value, compareValue, isOpponent = false) {
    const val = parseFloat(value);
    const cmp = parseFloat(compareValue);

    if (val > cmp) {
        return isOpponent ? 'style="background-color: #f8d7da;"' : 'style="background-color: #d4f8d4;"';
    }
    if (val === cmp) return 'style="background-color: #ffd69b;"';
    return '';
}

function displayAverageStatistics(averageStats) {
    if (!averageStats) return;

    const teamAverageStats = basketball.currentTeamData && basketball.currentTeamData.statsAverage ? basketball.currentTeamData.statsAverage : null;
    const teamPassiveStats = basketball.currentTeamData && basketball.currentTeamData.opponent && basketball.currentTeamData.opponent.statsAverage ? basketball.currentTeamData.opponent.statsAverage : null;
    const comparisonTeamId = basketball.currentTeamData && basketball.currentTeamData.id === COMPARISON_TEAM_ID ? null : COMPARISON_TEAM_ID;
    const comparisonTeamData = comparisonTeamId && basketball.teamsData ? basketball.teamsData[comparisonTeamId] : null;
    const comparisonAverageStats = comparisonTeamData && comparisonTeamData.statsAverage ? comparisonTeamData.statsAverage : null;
    const comparisonPassiveStats = comparisonTeamData && comparisonTeamData.opponent && comparisonTeamData.opponent.statsAverage ? comparisonTeamData.opponent.statsAverage : null;

    if (!teamAverageStats) return;

    const statsRows = [
        { label: 'PTS', active: { selected: teamAverageStats.pts, comparison: comparisonAverageStats ? comparisonAverageStats.pts : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.pts : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.pts : null } },
        { label: 'REB', active: { selected: teamAverageStats.reb, comparison: comparisonAverageStats ? comparisonAverageStats.reb : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.reb : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.reb : null } },
        { label: 'ORB', active: { selected: teamAverageStats.orb, comparison: comparisonAverageStats ? comparisonAverageStats.orb : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.orb : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.orb : null } },
        { label: 'DRB', active: { selected: teamAverageStats.drb, comparison: comparisonAverageStats ? comparisonAverageStats.drb : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.drb : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.drb : null } },
        { label: 'AST', active: { selected: teamAverageStats.ast, comparison: comparisonAverageStats ? comparisonAverageStats.ast : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.ast : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.ast : null } },
        { label: 'STL', active: { selected: teamAverageStats.stl, comparison: comparisonAverageStats ? comparisonAverageStats.stl : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.stl : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.stl : null } },
        { label: 'BLK', active: { selected: teamAverageStats.blk, comparison: comparisonAverageStats ? comparisonAverageStats.blk : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.blk : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.blk : null } },
        { label: 'TO', active: { selected: teamAverageStats.to, comparison: comparisonAverageStats ? comparisonAverageStats.to : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.to : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.to : null } },
        { label: 'PF', active: { selected: teamAverageStats.pf, comparison: comparisonAverageStats ? comparisonAverageStats.pf : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.pf : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.pf : null } },
        { label: 'PIR', active: { selected: teamAverageStats.pir, comparison: comparisonAverageStats ? comparisonAverageStats.pir : null }, passive: { selected: teamPassiveStats ? teamPassiveStats.pir : null, comparison: comparisonPassiveStats ? comparisonPassiveStats.pir : null } },
        { label: 'FG%', active: { selected: calculatePercentage(teamAverageStats.fgm, teamAverageStats.fga), comparison: comparisonAverageStats ? calculatePercentage(comparisonAverageStats.fgm, comparisonAverageStats.fga) : null }, passive: { selected: teamPassiveStats ? calculatePercentage(teamPassiveStats.fgm, teamPassiveStats.fga) : null, comparison: comparisonPassiveStats ? calculatePercentage(comparisonPassiveStats.fgm, comparisonPassiveStats.fga) : null } },
        { label: '3P%', active: { selected: calculatePercentage(teamAverageStats.tpm, teamAverageStats.tpa), comparison: comparisonAverageStats ? calculatePercentage(comparisonAverageStats.tpm, comparisonAverageStats.tpa) : null }, passive: { selected: teamPassiveStats ? calculatePercentage(teamPassiveStats.tpm, teamPassiveStats.tpa) : null, comparison: comparisonPassiveStats ? calculatePercentage(comparisonPassiveStats.tpm, comparisonPassiveStats.tpa) : null } },
        { label: 'FT%', active: { selected: calculatePercentage(teamAverageStats.ftm, teamAverageStats.fta), comparison: comparisonAverageStats ? calculatePercentage(comparisonAverageStats.ftm, comparisonAverageStats.fta) : null }, passive: { selected: teamPassiveStats ? calculatePercentage(teamPassiveStats.ftm, teamPassiveStats.fta) : null, comparison: comparisonPassiveStats ? calculatePercentage(comparisonPassiveStats.ftm, comparisonPassiveStats.fta) : null } }
    ];

    const avgStatsTable = document.getElementById('avg-stats-compare').querySelector('tbody');
    avgStatsTable.innerHTML = '';
    const formatStatValue = value => parseFloat(value || 0).toFixed(1);
    const isLowerBetter = label => ['TO', 'PF'].includes(label);
    const getComparisonClass = (label, comparisonValue, selectedValue, isPassive) => {
        if (comparisonValue === null || comparisonValue === undefined || comparisonValue === '') return '';
        const comparisonNumeric = parseFloat(comparisonValue || 0);
        const selectedNumeric = parseFloat(selectedValue || 0);
        const comparisonIsBetter = isPassive
            ? comparisonNumeric < selectedNumeric
            : (isLowerBetter(label) ? comparisonNumeric < selectedNumeric : comparisonNumeric > selectedNumeric);
        return comparisonIsBetter ? 'avg-stat-better' : 'avg-stat-worse';
    };

    statsRows.forEach(stat => {
        const row = document.createElement('tr');
        const isPercentage = stat.label.includes('%');
        const activeSelectedText = isPercentage ? `${formatStatValue(stat.active.selected)}%` : formatStatValue(stat.active.selected);
        const activeComparisonText = stat.active.comparison === null || stat.active.comparison === undefined || stat.active.comparison === ''
            ? ''
            : (isPercentage ? `${formatStatValue(stat.active.comparison)}%` : formatStatValue(stat.active.comparison));
        const passiveSelectedText = stat.passive.selected === null || stat.passive.selected === undefined || stat.passive.selected === ''
            ? ''
            : (isPercentage ? `${formatStatValue(stat.passive.selected)}%` : formatStatValue(stat.passive.selected));
        const passiveComparisonText = stat.passive.comparison === null || stat.passive.comparison === undefined || stat.passive.comparison === ''
            ? ''
            : (isPercentage ? `${formatStatValue(stat.passive.comparison)}%` : formatStatValue(stat.passive.comparison));
        const activeClass = activeComparisonText ? getComparisonClass(stat.label, stat.active.comparison, stat.active.selected, false) : '';
        const passiveClass = passiveComparisonText ? getComparisonClass(stat.label, stat.passive.comparison, stat.passive.selected, true) : '';
        const activeBar = isPercentage ? `<span class="pct-bar pct-bar-active"><span style="width:${Math.min(100, Math.max(0, stat.active.selected))}%"></span></span>` : '';
        const passiveBar = isPercentage ? `<span class="pct-bar"><span style="width:${Math.min(100, Math.max(0, stat.passive.selected))}%"></span></span>` : '';
        row.innerHTML = `
            <td class="text-end">
                <div class="avg-stat-inline">
                    ${activeComparisonText ? `<span class="avg-stat-secondary ${activeClass}"><strong>${activeComparisonText}</strong></span>` : ''}
                    <span class="avg-stat-primary"><strong>${activeSelectedText}</strong></span>
                </div>
                ${isPercentage ? `<div class="mt-1 d-flex justify-content-end">${activeBar}</div>` : ''}
            </td>
            <td class="text-center">${stat.label}</td>
            <td class="text-start">
                <div class="avg-stat-inline justify-content-start">
                    <span class="avg-stat-primary"><strong>${passiveSelectedText}</strong></span>
                    ${passiveComparisonText ? `<span class="avg-stat-secondary ${passiveClass}"><strong>${passiveComparisonText}</strong></span>` : ''}
                </div>
                ${isPercentage ? `<div class="mt-1 d-flex justify-content-start">${passiveBar}</div>` : ''}
            </td>
        `;
        avgStatsTable.appendChild(row);
    });
}

function displayGamesStatistics(teamStats) {
    if (!teamStats || teamStats.length === 0) return;

    if ($.fn.DataTable.isDataTable('#games-stats-table')) {
        $('#games-stats-table').DataTable().destroy();
        $('#games-stats-table tbody').empty();
    }

    const tbody = document.getElementById('games-stats-table').querySelector('tbody');
    tbody.innerHTML = '';

    teamStats.forEach(game => {
        const opponentStats = game.opponentStats || {};
        const teamScore = Math.round(game.pts);
        const opponentScore = Math.round(opponentStats.pts || 0);
        const scoreDisplay = `${teamScore} - ${opponentScore}`;
        const parsedDate = new Date(game.date);
        const formattedDate = !isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : game.date;

        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => showGameStatsModal(teamStats.indexOf(game));
        row.innerHTML = `
            <td>${game.game}</td>
            <td data-order="${parsedDate.getTime()}" data-search="${formattedDate}">${formattedDate}</td>
            <td>${game.opponent}</td>
            <td style="text-align: center; font-weight: bold;">${scoreDisplay}</td>
            <td style="text-align: center;">
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); showGameStatsModal(${teamStats.indexOf(game)})" title="Δείτε τα στατιστικά">
                    <i class="bi bi-graph-up"></i> 📊
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    $('#games-stats-table').DataTable({
        paging: true,
        searching: true,
        info: true,
        lengthChange: false,
        pageLength: 100,
        order: [[1, 'desc']],
        language: {
            search: '_INPUT_',
            searchPlaceholder: 'Αναζήτηση',
            info: 'Εμφάνιση _START_ έως _END_ από _TOTAL_ εγγραφές',
            zeroRecords: 'Δεν βρέθηκαν εγγραφές',
            infoEmpty: 'Εμφάνιση 0 έως 0 από 0 εγγραφές',
            paginate: {
                first: 'Πρώτο',
                previous: 'Προηγούμενο',
                next: 'Επόμενο',
                last: 'Τελευταίο'
            },
            lengthMenu: ''
        }
    });
    // render top players section after games table
    try {
        renderTopPlayersSection();
    } catch (e) {
        console.error('renderTopPlayersSection error', e);
    }
}

function renderTopPlayersSection() {

    const container = document.getElementById('top-players-section');
    if (!container) return;

    container.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'row justify-content-center g-3';

    const statsList = ['PTS', 'PIR', 'BREAKLINE', 'REB','ORB','DRB', 'BREAKLINE', 'AST', 'STL', 'TO', 'BREAKLINE', 'BLK', 'PF', 'BREAKLINE', 'FG%','FG', 'BREAKLINE', '3P%', '3P', 'BREAKLINE', 'FT%', 'FT'];

    const players = (basketball.currentTeamData && basketball.currentTeamData.players) || [];

    statsList.forEach(statLabel => {
        if(statLabel === 'BREAKLINE') {
            const col = document.createElement('div');
            col.className = 'col-12';
            col.innerHTML = '<div class="my-2"></div>';
            row.appendChild(col);
            return;
        }
        // compute value extractor
        const getPlayerValue = (player) => {
            const pAvg = player.statsAvarage || player.statsAverage || {};
            switch (statLabel) {
                case 'PTS': return parseFloat(pAvg.pts) || 0;
                case 'PIR': return parseFloat(pAvg.pir) || 0;
                case 'REB': return parseFloat(pAvg.reb) || 0;
                case 'ORB': return parseFloat(pAvg.orb) || 0;
                case 'DRB': return parseFloat(pAvg.drb) || 0;
                case 'AST': return parseFloat(pAvg.ast) || 0;
                case 'STL': return parseFloat(pAvg.stl) || 0;
                case 'BLK': return parseFloat(pAvg.blk) || 0;
                case 'TO': return parseFloat(pAvg.to) || 0;
                case 'PF': return parseFloat(pAvg.pf) || 0;
                case 'FG%': return parseFloat(calculatePercentage(pAvg.fgm || 0, pAvg.fga || 0)) || 0;
                case 'FG': return parseFloat((player.statsTotal || {}).fgm) || 0;
                case '3P%': return parseFloat(calculatePercentage(pAvg.tpm || 0, pAvg.tpa || 0)) || 0;
                case '3P': return parseFloat((player.statsTotal || {}).tpm) || 0;
                case 'FT%': return parseFloat(calculatePercentage(pAvg.ftm || 0, pAvg.fta || 0)) || 0;
                case 'FT': return parseFloat((player.statsTotal || {}).ftm) || 0;
                default: return 0;
            }
        };

        const sorted = players.map(p => ({ id: p.id, name: p.name, jersey: p.jersey || "-", image: (p.image ? "https://storage.googleapis.com/" + p.image : getImage(p.id, p.name)), value: getPlayerValue(p) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-4 d-flex';
        const card = document.createElement('div');
        card.className = 'card w-100';
        card.style.minHeight = '140px';
        card.innerHTML = `
            <div class="card-body d-flex flex-column">
                <h6 class="card-title text-center mb-2">${statLabel}</h6>
                <div class="flex-grow-1 d-flex flex-column justify-content-center">
                        ${sorted.map((p, idx) => { 
                            var valueDisplay;
                            if(statLabel.includes('%')) valueDisplay = (p.value.toFixed(1) + '%');
                            else if(statLabel === 'FG' || statLabel === '3P' || statLabel === 'FT') valueDisplay = p.value.toFixed(0);
                            else valueDisplay = p.value.toFixed(1);
                            return (
                            idx===0 ?
                            `<div class="row" style='justify-content: center; position: relative;'><div class="player-img" style="background-color:#f0f0f0; background-image:url('${p.image}'); width: 100px; height: 100px; background-size: 130%;"></div><div class="player-jersey" style="position: absolute; top: 80%; left: 50%; transform: translate(-50%, -50%); font-size:1.2rem; font-weight: 700;">${p.jersey}</div></div>` +
                            `<div class="row"><div class="col-12 text-center py-2" style="font-size: 1.25rem;">${p.name}</div></div>`+
                            `<div class="row"><div class="col-12 text-center pb-2" style="font-size: 1.25rem;"><strong>${valueDisplay}</strong></div><hr />` :
                            `<div class="row"><div class="col-2">${p.jersey}</div><div class="col-6 text center">${p.name}</div><div class="col-4 text-end"><strong>${valueDisplay}</strong></div></div>`
                        )}
                        ).join('')}
                </div>
            </div>
        `;
        col.appendChild(card);
        row.appendChild(col);
    });

    container.appendChild(row);
}

function showGameStatsModal(gameIndex) {
    const teamStats = basketball.currentTeamData.stats || [];
    const game = teamStats[gameIndex];

    if (!game) return;

    const homeTeamName = basketball.currentTeamData.name;
    const awayTeamName = game.opponent;

    const modalTitle = document.getElementById('gameStatsModalLabel');
    modalTitle.textContent = 'Commercial League';

    document.getElementById('gameRound').textContent = `Αγωνιστική: ${game.round || '-'}`;
    document.getElementById('gameDate').textContent = `${game.date}`;

    const statsBody = document.getElementById('modal-stats-body');
    statsBody.innerHTML = '';

    const stats = [
        { label: 'PTS', key: 'pts', format: 'number' },
        { label: 'REB', key: 'reb', format: 'number' },
        { label: 'ORB', key: 'orb', format: 'number' },
        { label: 'DRB', key: 'drb', format: 'number' },
        { label: 'AST', key: 'ast', format: 'number' },
        { label: 'STL', key: 'stl', format: 'number' },
        { label: 'BLK', key: 'blk', format: 'number' },
        { label: 'TO', key: 'to', format: 'number' },
        { label: 'PF', key: 'pf', format: 'number' },
        { label: 'PIR', key: 'pir', format: 'number' },
        { label: 'FG%', key: 'fg', format: 'percentage' },
        { label: '3P%', key: 'tp', format: 'percentage' },
        { label: 'FT%', key: 'ft', format: 'percentage' }
    ];

    const opponentStats = game.opponentStats || {};
    const formatModalValue = (value, stat) => {
        const numericValue = parseFloat(value || 0);
        if (stat.format === 'percentage') return `${numericValue.toFixed(1)}%`;
        if (stat.key === 'pir') return numericValue.toFixed(1);
        return Math.round(numericValue).toString();
    };
    const getStatValue = (stat, source) => {
        if (stat.key === 'fg') return calculatePercentage(source.fgm, source.fga);
        if (stat.key === 'tp') return calculatePercentage(source.tpm, source.tpa);
        if (stat.key === 'ft') return calculatePercentage(source.ftm, source.fta);
        return source[stat.key] || 0;
    };

    stats.forEach(stat => {
        if (stat.label === 'PTS') {
            const teamNameRow = document.createElement('tr');
            teamNameRow.classList.add('modal-team-name-row');
            teamNameRow.innerHTML = `
                <td class="text-end"><strong>${homeTeamName}</strong></td>
                <td class="text-center">&nbsp;</td>
                <td class="text-start"><strong>${awayTeamName}</strong></td>
            `;
            statsBody.appendChild(teamNameRow);
        }

        const row = document.createElement('tr');
        const homeValue = getStatValue(stat, game);
        const awayValue = getStatValue(stat, opponentStats);
        const labelText = stat.label === 'PTS' ? '<span style="font-size: 1.1rem; font-weight: 600;">-</span>' : stat.label;

        if (stat.label === 'PTS') {
            row.classList.add('modal-score-row');
        }

        if (stat.format === 'percentage') {
            const homePercent = parseFloat(homeValue) || 0;
            const awayPercent = parseFloat(awayValue) || 0;
            const homeBarHtml = `
                <div class="pct-bar-wrapper">
                    <div class="pct-bar-label"><strong>${homePercent.toFixed(1)}%</strong></div>
                    <div class="pct-bar pct-bar-active">
                        <span style="width:${Math.min(100, Math.max(0, homePercent))}%"></span>
                    </div>
                </div>
            `;
            const awayBarHtml = `
                <div class="pct-bar-wrapper">
                    <div class="pct-bar-label"><strong>${awayPercent.toFixed(1)}%</strong></div>
                    <div class="pct-bar">
                        <span style="width:${Math.min(100, Math.max(0, awayPercent))}%"></span>
                    </div>
                </div>
            `;

            row.innerHTML = `
                <td class="text-end">${homeBarHtml}</td>
                <td class="text-center" style="font-size: ${stat.label === 'PTS' ? '1.1rem' : 'inherit'}; font-weight: ${stat.label === 'PTS' ? '600' : '400'};">${labelText}</td>
                <td class="text-start">${awayBarHtml}</td>
            `;
        } else {
            row.innerHTML = `
                <td class="text-end"><strong>${formatModalValue(homeValue, stat)}</strong></td>
                <td class="text-center" style="font-size: ${stat.label === 'PTS' ? '1.1rem' : 'inherit'}; font-weight: ${stat.label === 'PTS' ? '600' : '400'};">${labelText}</td>
                <td class="text-start"><strong>${formatModalValue(awayValue, stat)}</strong></td>
            `;
        }

        statsBody.appendChild(row);
    });

    const modal = new bootstrap.Modal(document.getElementById('gameStatsModal'));
    modal.show();
}

function refreshTeamRosterTable() {
    if ($.fn.DataTable.isDataTable('#team-roster-table')) {
        $('#team-roster-table').DataTable().destroy();
        $('#team-roster-table tbody').empty();
    }

    const tbody = document.getElementById('team-roster-table').querySelector('tbody');
    const players = (basketball.currentTeamData.players || []);

    players.forEach(player => {
        const totalPoints = player.stats.reduce((sum, s) => sum + s.points, 0);
        const totalPir = player.stats.reduce((sum, s) => sum + s.pir, 0);
        const games = player.stats.length;

        const mappedData = mapApiData(player);
        const totals = mappedData.reduce((acc, s) => {
            acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast;
            acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf;
            acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga;
            acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
            return acc;
        }, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

        const img = player.image ? "https://storage.googleapis.com/" + player.image : getImage(player.id, player.name);
        let badges = [];
        if ((totals.pts / totals.games) > 20) badges.push('<span class="badge bestof badge-type-gold">Pts</span>');
        else if ((totals.pts / totals.games) > 15) badges.push('<span class="badge bestof badge-type-silver">Pts</span>');
        else if ((totals.pts / totals.games) > 10) badges.push('<span class="badge bestof badge-type-bronze">Pts</span>');

        if ((totals.reb / totals.games) > 12) badges.push('<span class="badge bestof badge-type-gold">Rb</span>');
        else if ((totals.reb / totals.games) > 9) badges.push('<span class="badge bestof badge-type-silver">Rb</span>');
        else if ((totals.reb / totals.games) > 7) badges.push('<span class="badge bestof badge-type-bronze">Rb</span>');

        if ((totals.ast / totals.games) > 5) badges.push('<span class="badge bestof badge-type-gold">A</span>');
        else if ((totals.ast / totals.games) > 4) badges.push('<span class="badge bestof badge-type-silver">A</span>');
        else if ((totals.ast / totals.games) > 3) badges.push('<span class="badge bestof badge-type-bronze">A</span>');

        if ((totals.stl / totals.games) > 3) badges.push('<span class="badge bestof badge-type-gold">Stl</span>');
        else if ((totals.stl / totals.games) > 2.5) badges.push('<span class="bestof badge badge-type-silver">Stl</span>');
        else if ((totals.stl / totals.games) > 2) badges.push('<span class="badge bestof badge-type-bronze">Stl</span>');

        if ((totals.pir / totals.games) > 20) badges.push('<span class="badge bestof badge-type-gold">Key</span>');
        else if ((totals.pir / totals.games) > 15) badges.push('<span class="badge bestof badge-type-silver">Key</span>');
        else if ((totals.pir / totals.games) > 10) badges.push('<span class="badge bestof badge-type-bronze">Key</span>');

        if ((totals.tpm / totals.tpa) > 0.42 && (totals.tpa / totals.games) > 1.5) badges.push('<span class="badge bestof badge-type-gold">3pt</span>');
        else if ((totals.tpm / totals.tpa) > 0.35 && (totals.tpa / totals.games) > 1.5) badges.push('<span class="badge bestof badge-type-silver">3pt</span>');
        else if ((totals.tpm / totals.tpa) > 0.3 && (totals.tpa / totals.games) > 1.5) badges.push('<span class="badge bestof badge-type-bronze">3pt</span>');

        const avgPoints = games > 0 ? (totalPoints / games).toFixed(1) : '0.0';
        const avgPir = games > 0 ? (totalPir / games).toFixed(1) : '0.0';

        const row = tbody.insertRow();
        if (player.stats.length > 0) {
            row.setAttribute('onclick', `refreshStatistics(${player.id}, this)`);
            row.setAttribute('data-playerid', player.id);
        } else {
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
        row.insertCell().innerHTML = (badges.length > 0 ? badges.join('') : '');
    });

    $('#team-roster-table').DataTable({
        paging: false,
        searching: false,
        ordering: true,
        info: true,
        language: {
            emptyTable: 'Δεν υπάρχουν δεδομένα', info: 'Εμφανίζονται _START_ έως _END_ από _TOTAL_ παίκτες', infoEmpty: 'Εμφανίζονται 0 έως 0 από 0 παίκτες', lengthMenu: 'Εμφάνιση _MENU_ εγγραφών', search: 'Αναζήτηση:',
            paginate: { first: 'Πρώτη', last: 'Τελευταία', next: 'Επόμενη', previous: 'Προηγούμενη' }
        }
    });
}

function renderStatisticsTable(playerData) {
    const stats = playerData;
    if (!stats) return;

    const contentDiv = document.getElementById('player-stats-content');
    contentDiv.innerHTML = '';

    const totals = stats.reduce((acc, s) => {
        acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast;
        acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf;
        acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga;
        acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
        return acc;
    }, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    const avg = (total) => (total / totals.games).toFixed(1);

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
        const isSelected = basketball.selectedMatchIds.includes(s.matchId.toString()) ? 'table-primary active' : '';
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

    setTimeout(() => {
        $('#modal-combined-table').DataTable({
            paging: false, searching: false, ordering: true, info: false,
            language: { emptyTable: 'Δεν υπάρχουν δεδομένα' }
        });

        document.querySelectorAll('.match-row').forEach(row => {
            row.addEventListener('click', function() {
                const mId = this.getAttribute('data-matchid').toString();

                if (basketball.selectedMatchIds.includes(mId)) {
                    basketball.selectedMatchIds = basketball.selectedMatchIds.filter(id => id !== mId);
                    this.classList.remove('table-primary', 'active');
                } else {
                    basketball.selectedMatchIds.push(mId);
                    this.classList.add('table-primary', 'active');
                }

                updateShotChartFromMatches(stats);
            });
        });

        document.getElementById('statisticContainer').classList.remove('hidden');
        document.getElementById('loading-message').classList.add('hidden');
    }, 100);
}

function renderStatisticsChart(playerData) {
    const stats = playerData;
    if (!stats || stats.length === 0) return;

    const pcr = document.getElementById('player-chart-radar');
    if (!!basketball.playerChartRadar) {
        basketball.playerChartRadar.destroy();
    }

    const totals = stats.reduce((acc, s) => {
        acc.games += 1; acc.pts += s.pts; acc.reb += s.reb; acc.ast += s.ast;
        acc.stl += s.stl; acc.blk += s.blk; acc.to += s.to; acc.pf += s.pf;
        acc.pir += s.pir; acc.fgm += s.fgm; acc.fga += s.fga;
        acc.tpm += s.tpm; acc.tpa += s.tpa; acc.ftm += s.ftm; acc.fta += s.fta;
        return acc;
    }, { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0, pir: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });

    const avg = (total) => parseFloat((total / totals.games).toFixed(1));

    var colors = ["#d64161", "#ff7b25", "#feb236", "#6b5b95", "#878f99", "#b2ad7f", "#a2b9bc", "#92a8d1", "#c94c4c", "#f7786b", "#034f84", "#deeaee", "#82b74b", "#405d27", "#50394c", "#ffef96"];
    let datasets = [];
    let idxColor = 0;
    const isTeamChart = (stats[0].players || 1) !== 1;
    const statsMaxValues = isTeamChart ? basketball.stats.team.avg : basketball.stats.player.avg;
    stats.forEach(s => {
        const color = colors[idxColor++];
        datasets.push({
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

    let avgDataset = [{
        label: (isTeamChart ? (basketball.currentTeamData.nickName || basketball.currentTeamData.name) : 'Μέσος όρος'),
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
        backgroundColor: '#878f9930',
        borderColor: '#878f99',
        pointBackgroundColor: '#878f99',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#878f99'
    }];

    if (isTeamChart) {
        const against = basketball.currentTeamData.opponent.statsAverage;
        avgDataset.push({
            label: (basketball.currentTeamData.nickName || basketball.currentTeamData.name) + ' (παθητικό)',
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
            backgroundColor: '#82b74b30',
            borderColor: '#82b74b',
            pointBackgroundColor: '#82b74b',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#82b74b'
        });
    }

    if (basketball.currentTeamData.id !== 39 && isTeamChart) {
        const ourStats = basketball.teamsData[39].statsAverage;
        avgDataset.push({
            label: (basketball.teamsData[39].nickName || basketball.teamsData[39].name),
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
            backgroundColor: '#7098E530',
            borderColor: '#7098E5',
            pointBackgroundColor: '#7098E5',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#7098E5'
        });
        const ourAgainst = basketball.teamsData[39].opponent.statsAverage;
        avgDataset.push({
            label: (basketball.teamsData[39].nickName || basketball.teamsData[39].name) + ' (παθητικό)',
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
            backgroundColor: '#ffef9630',
            borderColor: '#ffef96',
            pointBackgroundColor: '#ffef96',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#ffef96'
        });
    }

    const data = {
        labels: ['PTS', 'PIR', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'FG %', '3PTS %', 'FT %'],
        datasets: (document.getElementById('view-mode').value === 'avg' ? avgDataset : datasets)
    };
    const config = {
        type: 'radar',
        data: data,
        options: {
            elements: { line: { borderWidth: 3 } },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = (context.label || '').split(' ')[0].toLowerCase();
                            switch (label) {
                                case '3pts': label = 'tp'; break;
                            }
                            let value = context.raw;
                            const isAVG = document.getElementById('view-mode').value === 'avg';
                            const fixedNumber = isAVG ? 1 : 0;
                            return (isAVG ? '' : (context.dataset.label + ' : ')) + (value * statsMaxValues[label]).toFixed(fixedNumber);
                        }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    suggestedMin: 0,
                    suggestedMax: 1,
                    ticks: { display: false, beginAtZero: true, stepSize: 0.2 },
                    pointLabels: { display: true }
                }
            }
        },
    };

    basketball.playerChartRadar = new Chart(pcr, config);
    const viewModeSelect = document.getElementById('view-mode');
    viewModeSelect.addEventListener('change', function () {
        const selectedMode = this.value;
        if (selectedMode === 'avg') {
            basketball.playerChartRadar.data.datasets = avgDataset;
        } else {
            basketball.playerChartRadar.data.datasets = datasets;
        }
        basketball.playerChartRadar.update();
    });
}

function hideStatistics() {
    document.getElementById('statisticContainer').classList.add('hidden');
}

function updateShotChartFromMatches(matchesList) {
    let finalShots = [];
    if (basketball.selectedMatchIds.length > 0) {
        matchesList.forEach(m => {
            if (basketball.selectedMatchIds.includes(m.matchId.toString())) {
                finalShots = finalShots.concat(m.shots);
            }
        });
    } else {
        matchesList.forEach(m => { finalShots = finalShots.concat(m.shots); });
    }
    refreshShotHeatmap([{ shots: finalShots }]);
}

function refreshShotHeatmap(allGameStats) {
    let allShots = [];
    allGameStats.forEach(game => {
        if (game.shots) {
            allShots = allShots.concat(game.shots);
        }
    });

    let data = new Array(400).fill(0).map(() => new Array(400).fill(0));
    allShots.forEach(shot => {
        data[parseInt(shot.x * 400)][parseInt(shot.y * 400)] = (data[parseInt(shot.x * 400)][parseInt(shot.y * 400)] || 0) + (shot.made ? 1 : -1);
    });

    const weights = [100, 100, 100, 100, 100, 100, 100, 100, 85, 80, 75, 70, 65];
    const dataOD = applyOptimizedDiffusion(data, weights);
    const heatmapOpts = {
        container: 'heatmapCanvas',
        width: 400,
        height: 400,
        padding: { top: 10, left: -10, bottom: 10, right: -10 },
        radius: 1,
        palette: {
            0.0: 'rgba(255, 0, 0, 1)',
            0.25: 'rgba(255, 0, 0, 1)',
            0.5: 'orange',
            0.7: 'yellow',
            0.99: 'green',
            1.0: 'green'
        }
    };
    renderHeatmap(dataOD.gridC, heatmapOpts);
}

function smoothInputPoints(points, radiusPower, smoothingRadius) {
    const smoothedPoints = [];
    const epsilon = 1;
    const validPoints = points.filter(p => p.value !== 0);

    for (let i = 0; i < validPoints.length; i++) {
        const targetPoint = validPoints[i];
        let weightedSum = 0;
        let totalWeight = 0;

        for (let j = 0; j < validPoints.length; j++) {
            const currentPoint = validPoints[j];
            const distance = Math.sqrt(Math.pow(currentPoint.x - targetPoint.x, 2) + Math.pow(currentPoint.y - targetPoint.y, 2));

            if (distance > smoothingRadius) continue;

            let weight;
            if (distance < epsilon) {
                weight = 1.0;
            } else {
                weight = 1.0 / Math.pow(distance, radiusPower);
            }

            weightedSum += currentPoint.value * weight;
            totalWeight += weight;
        }

        const smoothedValue = totalWeight === 0 ? targetPoint.value : weightedSum / totalWeight;
        smoothedPoints.push({ x: targetPoint.x, y: targetPoint.y, value: Math.max(0, Math.min(100, smoothedValue)) });
    }

    return smoothedPoints;
}

function getInterpolatedPointsList(points, radiusPower, searchRadius, size = 100) {
    const interpolatedPointsList = [];
    const epsilon = 1e-6;
    const validPoints = points.filter(p => p.value !== 0);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const targetX = j;
            const targetY = i;

            let weightedSum = 0;
            let totalWeight = 0;
            let isExactMatch = false;

            for (const point of validPoints) {
                const distance = Math.sqrt(Math.pow(point.x - targetX, 2) + Math.pow(point.y - targetY, 2));
                if (distance > searchRadius) continue;

                let weight;
                if (distance < epsilon) {
                    weight = 1.0;
                    weightedSum = point.value * weight;
                    totalWeight = weight;
                    isExactMatch = true;
                    break;
                } else {
                    weight = 1.0 / Math.pow(distance, radiusPower);
                }

                weightedSum += point.value * weight;
                totalWeight += weight;
            }

            let finalValue;
            if (!isExactMatch && totalWeight === 0) {
                finalValue = 0;
            } else {
                finalValue = weightedSum / totalWeight;
                finalValue = Math.max(0, Math.min(100, finalValue));
            }

            if (finalValue !== 0) {
                interpolatedPointsList.push({ x: targetX, y: targetY, value: finalValue });
            }
        }
    }

    return interpolatedPointsList;
}

function applyMedianFilter(grid) {
    const radius = 3;
    const rows = grid.length;
    const cols = grid[0].length;
    const output = Array.from({ length: rows }, () => new Float64Array(cols));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let neighbors = [];
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        neighbors.push(grid[nr][nc]);
                    }
                }
            }
            neighbors.sort((a, b) => a - b);
            const median = neighbors[Math.floor(neighbors.length / 2)];
            output[r][c] = median;
        }
    }
    return output;
}

function applyOptimizedDiffusion(initialGrid, weights) {
    const rows = initialGrid.length;
    const cols = initialGrid[0].length;
    const maxRadius = weights.length;

    let gridA = Array.from({ length: rows }, () => new Float64Array(cols).fill(0));
    let gridB = Array.from({ length: rows }, () => new Float64Array(cols).fill(0));
    let gridT = Array.from({ length: rows }, () => new Float64Array(cols).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = initialGrid[r][c];
            if (val === 0) continue;
            const targetGrid = val > 0 ? gridA : gridB;
            const rStart = Math.max(0, Math.floor(r - maxRadius));
            const rEnd = Math.min(rows - 1, Math.ceil(r + maxRadius));
            const cStart = Math.max(0, Math.floor(c - maxRadius));
            const cEnd = Math.min(cols - 1, Math.ceil(c + maxRadius));

            for (let tr = rStart; tr <= rEnd; tr++) {
                for (let tc = cStart; tc <= cEnd; tc++) {
                    const dist = Math.sqrt((tr - r) ** 2 + (tc - c) ** 2);
                    if (dist < maxRadius) {
                        const i = Math.floor(dist);
                        const frac = dist - i;
                        let w;
                        if (i < maxRadius - 1) {
                            w = weights[i] + (weights[i + 1] - weights[i]) * frac;
                        } else {
                            w = weights[i] * (1 - frac);
                        }
                        targetGrid[tr][tc] += val * (w / 100);
                        gridT[tr][tc]++;
                    }
                }
            }
        }
    }

    let gridC = Array.from({ length: rows }, () => new Float64Array(cols));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const a = gridA[r][c];
            const b = gridB[r][c];
            const t = gridT[r][c];
            if (a === 0 && b === 0 && t === 0) continue;
            const absSum = Math.abs(a) + Math.abs(b);
            let value = absSum === 0 ? 0 : (a / t) + (b / t);
            value = value === 0 ? 0 : (((value + 0.99) * 0.5) + 0.01) * 0.99;
            gridC[cols - c - 1][rows - r - 1] = value;
        }
    }
    gridC = applyMedianFilter(gridC);
    return { gridA, gridB, gridC };
}

const paletteCache = new Map();

function getParsedPalette(palette) {
    const cacheKey = JSON.stringify(palette);
    if (paletteCache.has(cacheKey)) return paletteCache.get(cacheKey);

    const stops = Object.keys(palette).map(Number).sort((a, b) => a - b);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');

    const parsed = stops.map(stop => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = palette[stop];
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return { offset: stop, color: [d[0], d[1], d[2], d[3]] };
    });

    paletteCache.set(cacheKey, parsed);
    return parsed;
}

function getInterpolatedColor(val, parsedPalette) {
    let i = 0;
    while (i < parsedPalette.length - 2 && val > parsedPalette[i + 1].offset) {
        i++;
    }

    const p1 = parsedPalette[i];
    const p2 = parsedPalette[i + 1];
    const range = p2.offset - p1.offset;
    const fraction = range <= 0 ? 0 : (val - p1.offset) / range;
    const r = (p1.color[0] + (p2.color[0] - p1.color[0]) * fraction) | 0;
    const g = (p1.color[1] + (p2.color[1] - p1.color[1]) * fraction) | 0;
    const b = (p1.color[2] + (p2.color[2] - p1.color[2]) * fraction) | 0;
    const a = (p1.color[3] + (p2.color[3] - p1.color[3]) * fraction) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function smoothGrid(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const radius = 1;
    const newGrid = Array.from({ length: rows }, () => new Float64Array(cols));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let sum = 0;
            let count = 0;
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== 0) {
                        sum += grid[nr][nc];
                        count++;
                    }
                }
            }
            newGrid[r][c] = count === 0 ? 0 : sum / count;
        }
    }
    return newGrid;
}

function renderHeatmap(data, opt) {
    data = smoothGrid(data);
    opt.palette = getParsedPalette(opt.palette);
    const padding = { top: opt.padding.top || 0, left: opt.padding.left || 0, bottom: opt.padding.bottom || 0, right: opt.padding.right || 0 };
    const radius = opt.radius || 1;
    const canvas = document.getElementById(opt.container || 'heatmapCanvas');
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    canvas.width = opt.width || container.clientWidth;
    canvas.height = opt.width || container.clientHeight;

    const rows = data.length;
    const cols = data[0].length;
    const cellW = (canvas.width - (padding.left + padding.right)) / cols;
    const cellH = (canvas.height - (padding.top + padding.bottom)) / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = data[r][c];
            if (val === 0) continue;
            ctx.fillStyle = getInterpolatedColor(val, opt.palette);
            ctx.fillRect((c * cellW) + padding.left, (r * cellH) + padding.top, cellW + radius, cellH + radius);
        }
    }
}

function renderTeamOverview() {
    refreshTeamRosterTable();
    const teamStats = basketball.currentTeamData.stats;
    renderTeamAverageChart(teamStats);
    renderStatisticsTable(teamStats);
    renderStatisticsChart(teamStats);
    updateShotChartFromMatches(teamStats);
    displayGamesStatistics(teamStats);
    displayAverageStatistics(basketball.currentTeamData.statsAverage);
}

function renderTeamAverageChart(teamStats) {
    if (!teamStats || teamStats.length === 0) return;

    const canvas = document.getElementById('team-avg-chart-radar');
    if (!canvas) return;

    if (basketball.teamAvgChartRadar) {
        basketball.teamAvgChartRadar.destroy();
    }

    var maxValues = basketball.stats.team.avg || { pts: 1, pir: 1, reb: 1, ast: 1, stl: 1, blk: 1, to: 1, pf: 1, fg: 1, tp: 1, ft: 1 };
    var statsAverage = basketball.currentTeamData?.statsAverage || {};

    const avg = (total) => parseFloat((total / totals.games).toFixed(1));
    const totals = basketball.stats.team.avg || { pts: 1, pir: 1, reb: 1, ast: 1, stl: 1, blk: 1, to: 1, pf: 1, fg: 1, tp: 1, ft: 1 };

    const averageDataset = [{
        label: basketball.currentTeamData?.nickName || basketball.currentTeamData?.name || 'Ομάδα',
        data: [
            statsAverage.pts / (maxValues.pts || 1),
            statsAverage.pir / (maxValues.pir || 1),
            statsAverage.reb / (maxValues.reb || 1),
            statsAverage.ast / (maxValues.ast || 1),
            statsAverage.stl / (maxValues.stl || 1),
            statsAverage.blk / (maxValues.blk || 1),
            statsAverage.to / (maxValues.to || 1),
            statsAverage.pf / (maxValues.pf || 1),
            statsAverage.fg / (maxValues.fg || 1),
            statsAverage.tp / (maxValues.tp || 1),
            statsAverage.ft / (maxValues.ft || 1)
        ],
        fill: true,
        backgroundColor: '#878f9930',
        borderColor: '#878f99',
        pointBackgroundColor: '#878f99',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#878f99'
    }];

    const against = basketball.currentTeamData?.opponent?.statsAverage || {};
    if (against && Object.keys(against).length > 0) {
        averageDataset.push({
            label: `${basketball.currentTeamData?.nickName || basketball.currentTeamData?.name || 'Ομάδα'} (παθητικό)`,
            data: [
                against.pts / (maxValues.pts || 1),
                against.pir / (maxValues.pir || 1),
                against.reb / (maxValues.reb || 1),
                against.ast / (maxValues.ast || 1),
                against.stl / (maxValues.stl || 1),
                against.blk / (maxValues.blk || 1),
                against.to / (maxValues.to || 1),
                against.pf / (maxValues.pf || 1),
                against.fg / (maxValues.fg || 1),
                against.tp / (maxValues.tp || 1),
                against.ft / (maxValues.ft || 1)
            ],
            fill: true,
            backgroundColor: '#82b74b30',
            borderColor: '#82b74b',
            pointBackgroundColor: '#82b74b',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#82b74b'
        });
    }

    if (basketball.currentTeamData?.id !== 39 && basketball.teamsData && basketball.teamsData[39]) {
        const comparisonStats = basketball.teamsData[39].statsAverage|| {};
        const comparisonAgainst = basketball.teamsData[39].opponent?.statsAverage || {};
        averageDataset.push({
            label: basketball.teamsData[39].nickName || basketball.teamsData[39].name,
            data: [
                comparisonStats.pts / (maxValues.pts || 1),
                comparisonStats.pir / (maxValues.pir || 1),
                comparisonStats.reb / (maxValues.reb || 1),
                comparisonStats.ast / (maxValues.ast || 1),
                comparisonStats.stl / (maxValues.stl || 1),
                comparisonStats.blk / (maxValues.blk || 1),
                comparisonStats.to / (maxValues.to || 1),
                comparisonStats.pf / (maxValues.pf || 1),
                comparisonStats.fg / (maxValues.fg || 1),
                comparisonStats.tp / (maxValues.tp || 1),
                comparisonStats.ft / (maxValues.ft || 1)
            ],
            fill: true,
            backgroundColor: '#7098E530',
            borderColor: '#7098E5',
            pointBackgroundColor: '#7098E5',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#7098E5'
        });
        averageDataset.push({
            label: `${basketball.teamsData[39].nickName || basketball.teamsData[39].name} (παθητικό)`,
            data: [
                comparisonAgainst.pts / (maxValues.pts || 1),
                comparisonAgainst.pir / (maxValues.pir || 1),
                comparisonAgainst.reb / (maxValues.reb || 1),
                comparisonAgainst.ast / (maxValues.ast || 1),
                comparisonAgainst.stl / (maxValues.stl || 1),
                comparisonAgainst.blk / (maxValues.blk || 1),
                comparisonAgainst.to / (maxValues.to || 1),
                comparisonAgainst.pf / (maxValues.pf || 1),
                comparisonAgainst.fg / (maxValues.fg || 1),
                comparisonAgainst.tp / (maxValues.tp || 1),
                comparisonAgainst.ft / (maxValues.ft || 1)
            ],
            fill: true,
            backgroundColor: '#ffef9630',
            borderColor: '#ffef96',
            pointBackgroundColor: '#ffef96',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#ffef96'
        });
    }

    basketball.teamAvgChartRadar = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['PTS', 'PIR', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'FG %', '3PTS %', 'FT %'],
            datasets: averageDataset
        },
        options: {
            elements: { line: { borderWidth: 3 } },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = (context.label || '').split(' ')[0].toLowerCase();
                            switch (label) {
                                case '3pts': label = 'tp'; break;
                            }
                            let value = context.raw;
                            if(label === 'fg' || label === 'tp' || label === 'ft') {
                                return (value * (maxValues[label])).toFixed(1) + '%';
                            } else {
                                return (value * maxValues[label]).toFixed(1);
                            }
                        }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    suggestedMin: 0,
                    suggestedMax: 1,
                    ticks: { display: false, beginAtZero: true, stepSize: 0.2 },
                    pointLabels: { display: true }
                }
            }
        }
    });
}

function renderStatisticsPanel(mappedData) {
    renderStatisticsTable(mappedData);
    renderStatisticsChart(mappedData);
    updateShotChartFromMatches(mappedData);
}

function getImage(id, fullname){
    if((id || "") === "") return null;
    if(basketball.currentTeamData.id !== 39) return null;
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
    const name = names.length > 0 ? normalizePolytonicGreek(names[0]).toUpperCase() : "";
    const surname = names.length > 1 ? normalizePolytonicGreek(names[1]).toUpperCase() : "";
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

basketball.renderTeamOverview = renderTeamOverview;
basketball.renderTeamAverageChart = renderTeamAverageChart;
basketball.renderStatisticsPanel = renderStatisticsPanel;
basketball.hideStatistics = hideStatistics;
basketball.displayAverageStatistics = displayAverageStatistics;
basketball.displayGamesStatistics = displayGamesStatistics;
basketball.refreshTeamRosterTable = refreshTeamRosterTable;
basketball.renderStatisticsTable = renderStatisticsTable;
basketball.renderStatisticsChart = renderStatisticsChart;
basketball.updateShotChartFromMatches = updateShotChartFromMatches;
basketball.refreshShotHeatmap = refreshShotHeatmap;
basketball.renderHeatmap = renderHeatmap;
basketball.smoothGrid = smoothGrid;
basketball.applyOptimizedDiffusion = applyOptimizedDiffusion;
basketball.showGameStatsModal = showGameStatsModal;
basketball.getImage = getImage;
basketball.normalizeGreek = normalizeGreek;
basketball.normalizePolytonicGreek = normalizePolytonicGreek;