export const SITE_HOST = "independentfancommunityportal.com";
export const SITE_URL = `https://${SITE_HOST}`;
export const ADMIN_EMAIL = "sergeylazarev010@gmail.com";

export const APP_NAME = "Lazarev Circle";
export const ARTIST = "Sergey Lazarev";

export const OFFICIAL_TOUR = "https://sergeylazarev.ru/tour/";
export const OFFICIAL_TICKETS = "lazarev@artzvezdy.ru";

export const CALL_FEE_EUR = 650;

export const TIERS = [
  {
    id: "aisle" as const,
    name: "Regular",
    price: 3000,
    line: "The membership card, the fan wall, the setlist vote, serenatas, and the who’s-going list.",
    points: [
      "A digital card with your name and city",
      "Post on the fan wall, up to five notes",
      "Vote for up to three songs on the setlist ballot",
      "Request a serenata and mark the shows you are traveling to",
    ],
  },
  {
    id: "pit" as const,
    name: "Gold",
    price: 7000,
    line: "Regular, plus a city chapter, a meet window, and a hat on the signing list.",
    points: [
      "Everything in Regular",
      "Join one city chapter",
      "Request a meet window after a show",
      "Ask for a hat to be signed at one show",
    ],
  },
  {
    id: "stage" as const,
    name: "VIP",
    price: 15000,
    line: "Gold, and your meet and hat requests are read before the others.",
    points: [
      "Everything in Gold",
      "Meet and hat requests are reviewed first",
      "A wall note can be pinned by the team",
    ],
  },
];

export const SERVICES = [
  {
    to: "/membership",
    name: "Membership card",
    summary: "Apply once. Regular is €3,000, Gold is €7,000, and VIP is €15,000. The price shows as soon as you choose the card.",
    features: ["Regular €3,000", "Gold €7,000", "VIP €15,000"],
  },
  {
    to: "/calls",
    name: "Call request",
    summary: "Ask for a call with Sergey Lazarev. Write the reason, then the €650 fee is recorded before the desk can approve it. No card is charged on this site.",
    features: ["You write why you want the call", "€650 is the next page", "Staff approve only after it is recorded"],
  },
  {
    to: "/serenatas",
    name: "Serenata",
    summary: "Dedicate a song to someone at a show. Any approved card can ask. It goes public only after the desk says yes.",
    features: ["Name the song and the person", "Tie it to a night, or leave it open", "Approved dedications stay on the board"],
  },
  {
    to: "/hats",
    name: "Hat signing",
    summary: "Ask for a hat to be signed at a chosen show. Gold and VIP only. A yes is a place on that night’s list, not a promise from the stage.",
    features: ["One hat per show", "Color and the name to write", "Gold and VIP, VIP read first"],
  },
  {
    to: "/meets",
    name: "Meet window",
    summary: "Ask to be named after a specific show. Gold and VIP cards only.",
    features: ["One request per show", "You, or you and one guest", "A yes is a place on that night’s list"],
  },
  {
    to: "/going",
    name: "Who’s going",
    summary: "Mark the nights you are traveling to. Other members see the count, not your phone number.",
    features: ["Any approved card", "One mark per show", "Take it off if plans change"],
  },
  {
    to: "/ballot",
    name: "Setlist ballot",
    summary: "Choose up to three songs you want played.",
    features: ["Open to every member", "Change your three any time", "The tally is public"],
  },
  {
    to: "/chapters",
    name: "City chapter",
    summary: "Stand with other fans in one city. Included from Gold upward. Abuja is here for fans far from the Russian dates.",
    features: ["One city at a time", "Switch city when you move", "Abuja is the far-from-home chapter"],
  },
] as const;

export const NAV = [
  { to: "/tour", label: "Tour" },
  { to: "/membership", label: "Card" },
  { to: "/calls", label: "Call" },
  { to: "/serenatas", label: "Serenata" },
  { to: "/hats", label: "Hats" },
  { to: "/meets", label: "Meets" },
] as const;

export const MORE = [
  { to: "/going", label: "Going" },
  { to: "/ballot", label: "Ballot" },
  { to: "/wall", label: "Wall" },
  { to: "/chapters", label: "Chapters" },
  { to: "/discography", label: "Records" },
  { to: "/news", label: "Notes" },
  { to: "/contact", label: "Contact" },
] as const;

export const ALBUMS = [
  { year: "2005", title: "Don't Be Fake", note: "Solo debut after Smash!!. Platinum in Russia." },
  { year: "2007", title: "TV Show", note: "Second English-language record. Gold." },
  { year: "2010", title: "Electric Touch", note: "Sony era. Gold the following year." },
  { year: "2013", title: "Lazarev.", note: "Russian-language album. Home of “V samoye serdtse”." },
  { year: "2017", title: "V epitsentre", note: "“Tak krasivo” and “Shyopotom”." },
  { year: "2018", title: "The One", note: "English-language album, April 2018. Scream came the year after." },
  { year: "2019", title: "Eto ya", note: "“Ya ne boyus” and “Sneg v okeane”." },
  { year: "2021", title: "8", note: "November 2021. “Aromatom” and “Tantsuy”." },
  { year: "2023", title: "Ya videl svet", note: "“Alyy zakat”, “Vkus maliny”, and “Samoobman”." },
  { year: "2025", title: "Schastlivye tozhe plachut", note: "Studio album, March 2025. “Tonu v tvoikh glazakh”." },
  { year: "2025", title: "My i yest lyubov", note: "Follow-up the same year." },
];

export const CITIES = [
  "Moscow",
  "Volgograd",
  "Ulan-Ude",
  "Irkutsk",
  "Krasnoyarsk",
  "Novosibirsk",
  "Tomsk",
  "Kemerovo",
  "Novokuznetsk",
  "Barnaul",
  "Omsk",
  "Kurgan",
  "Chelyabinsk",
  "Surgut",
  "Khanty-Mansiysk",
  "Perm",
  "Yekaterinburg",
  "Kazan",
  "Saint Petersburg",
  "Abuja",
];
