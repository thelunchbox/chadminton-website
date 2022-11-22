class Tournament {
    constructor() {
        this.games = 0;
        this.teams = [];
        this.rounds = [];
    }

    generateGames() {
        var rounds = Math.ceil(Math.log(this.numTeams) / Math.log(2));
        var slots = Math.pow(2, rounds);
        var teams = new Array(slots);
        var i;
        for (i = 1; i <= this.numTeams; i++) {
            var seed = this.numTeams > 20 ? Math.ceil(i / 4) : i;
            var name = i - 1 < teamNames.length ? teamNames[i - 1].name : '';
            teams[i - 1] = { seed: seed, name: name };
        }
        for (i = i; i <= slots; i++) {
            teams[i - 1] = { seed: 0 };
        }

        var temp = teams.slice();
        for (var t = 1; t < rounds; t++) {
            var temp2 = temp.slice();
            temp = [];

            var groupSize = Math.pow(2, t);
            var numGroups = slots / groupSize;
            var length = temp2.length;
            for (var g = 0; g < numGroups; g++) {
                temp[g] = [temp2[g], temp2[length - (g + 1)]];
            }
        }
        teams = _.flatten(temp);

        var gameId = 0;

        this.rounds = new Array(rounds);
        for (var r = 0; r < rounds; r++) {
            this.rounds[r] = { games: [] };
            for (var j = 0; j < slots; j += 2) {
                var game = { id: gameId++, teams: new Array(2) };
                var wasBye1 = r > 0 && !this.rounds[r - 1].games[j].placeholder && this.rounds[r - 1].games[j].teams[1].seed === 0;
                var wasBye2 = r > 0 && !this.rounds[r - 1].games[j + 1].placeholder && this.rounds[r - 1].games[j + 1].teams[1].seed === 0;
                if (r == 0) {
                    game.blank = teams[j + 1].seed === 0;
                    game.teams = [
                        teams[j],
                        teams[j + 1]
                    ];
                } else if (wasBye1 || wasBye2) {
                    game.teams = [
                        wasBye1 ? this.rounds[r - 1].games[j].teams[0] : { seed: '', name: '' },
                        wasBye2 ? this.rounds[r - 1].games[j + 1].teams[0] : { seed: '', name: '' }
                    ];
                } else {
                    game.placeholder = 'round ' + (r + 1);
                }
                if (!game.blank) this.numGames++;
                this.rounds[r].games.push(game);
            }
            slots = slots / 2;
        }
        console.log(this.rounds);
        this.subRounds = [];
        this.combinedFinal = null;
    }
}