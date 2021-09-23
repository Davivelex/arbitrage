const axios = require('axios');
const util = require('util');

class Match {
    constructor(sportKey, sportTitle, homeTeam, awayTeam, commenceTime) {
        this.sportKey = sportKey;
        this.sportTitle = sportTitle;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.commenceTime = commenceTime;
    }

    setBet(bet) {
        this.bet = bet;
    }

    getBet() {
        return this.bet;
    }
}

class Bet {
    constructor() {
        this.outcomes = new Map();
    };

    insertIfHigher(outcome, bookmaker, price) {
        if (!this.outcomes.has(outcome)) {
            this.outcomes.set(outcome, {
                bookmaker: bookmaker,
                price: price
            });
        } else {
            const currentPrice = this.outcomes.get(outcome).price;
            if (price > currentPrice) {
                this.outcomes.set(outcome, {
                    bookmaker: bookmaker,
                    price: price
                });
            }
        }
    };

    getOutcome(outcome) {
        return this.outcomes.get(outcome);
    }

    getRatio() {
        let sum = 0;
        
        this.outcomes.forEach(outcome => {
            sum += 1/outcome.price;
        });

        return sum;
    }
}

module.exports = (sport, apiKey) => {
    axios.get('https://api.the-odds-api.com/v4/sports/' + sport + '/odds?apiKey=' + apiKey + '&regions=eu&market=h2h')
        .then(res => {

            res.data.forEach(data => {
                const match = new Match(data.sport_key, data.sport_title, data.home_team, data.away_team, data.commence_time);
                const bet = new Bet();
        
                data.bookmakers.forEach(bookmaker => {
                    bookmaker.markets.forEach(market => {
                        if (market.key !== 'h2h') return;
        
                        market.outcomes.forEach(outcome => {
                            bet.insertIfHigher(outcome.name, bookmaker.title, outcome.price);
                        });
                    });
                });

                match.setBet(bet);

                if (match.getBet().getRatio() < 1) console.log(util.inspect(match, {
                    showHidden: false,
                    depth: null,
                    colors: true
                }), match.getBet().getRatio(), '\n');
            });
        });
};