// La Liga del Fuego - League History Data
// This file contains hardcoded champions and sackos data
// To update, edit this file directly and redeploy

const LEAGUE_HISTORY = {
    champions: [
        { year: 2024, winner: "Matthew C Kelsall" },
        { year: 2023, winner: "Scott A Williams" },
        { year: 2022, winner: "Stephen L Parr" },
        { year: 2021, winner: "Stephen L Parr" },
        { year: 2019, winner: "Justin S Price" },
        { year: 2018, winner: "Justin S Price" },
        { year: 2017, winner: "Justin S Price" },
        { year: 2016, winner: "Scott A Williams" },
        { year: 2015, winner: "Evan A Lengrich " },
        { year: 2014, winner: "Jeffrey L Parr" },
        { year: 2013, winner: "Justin S Price" }
    ],
    
    sackos: [
        { year: 2024, loser: "Shteebe Bogey" },
        { year: 2023, loser: "Un-Evan Language" },
        { year: 2022, loser: "Kwiss McKissass" },
        { year: 2021, loser: "Justine Prissy" },
        { year: 2019, loser: "Adum Limpwood" },
        { year: 2018, loser: "Eric Butthurt" },
        { year: 2017, loser: "Adum Limpwood" },
        { year: 2016, loser: "Justine Prissy" },
        { year: 2015, loser: "Eric Butthurt" },
        { year: 2014, loser: "Nik'less Murky" }
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEAGUE_HISTORY;
}