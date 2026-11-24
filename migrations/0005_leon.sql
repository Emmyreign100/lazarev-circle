-- Caring León catalog, plus serenatas, hat signing, and who's-going marks.
-- Earlier seed rows were the previous tour. Memberships and call requests stay.

delete from votes;
delete from songs;
delete from meet_requests;
delete from events;
delete from chapter_members;
delete from chapters;
delete from wall_posts;
delete from news;
delete from messages;

insert into events (slug, kind, title, city, venue, starts_at, time_known, status, note) values
  ('qro-2026-10-30', 'concert', 'En Vivo', 'Querétaro', 'Hipico de Juriquilla', '2026-10-30 20:00-06', false, 'on_sale', 'Listed on the official tour. This board does not sell the ticket.'),
  ('mxl-2026-11-05', 'concert', 'En Vivo', 'Mexicali', 'Estacionamiento Ciudad Deportiva', '2026-11-05 20:00-06', false, 'on_sale', 'Listed on the official tour.'),
  ('zac-2026-11-07', 'concert', 'En Vivo', 'Zacatecas', 'Plaza de Toros Monumental 360', '2026-11-07 20:00-06', false, 'on_sale', 'Listed on the official tour.'),
  ('mid-2026-11-13', 'concert', 'En Vivo', 'Mérida', 'Feria Xmatkuil', '2026-11-13 20:00-06', false, 'on_sale', 'Feria Xmatkuil 2026. Listed on the official tour.'),
  ('ver-2026-11-14', 'concert', 'En Vivo', 'Veracruz', 'Estadio Beto Ávila', '2026-11-14 20:00-06', false, 'on_sale', 'Listed on the official tour.'),
  ('oax-2026-11-27', 'concert', 'En Vivo', 'Oaxaca', 'Auditorio Guelaguetza', '2026-11-27 20:00-06', false, 'on_sale', 'Listed on the official tour.'),
  ('vha-2026-11-28', 'concert', 'En Vivo', 'Villahermosa', 'Teatro al Aire Libre', '2026-11-28 20:00-06', false, 'on_sale', 'Listed on the official tour.'),
  ('ind-2027-04-25', 'concert', 'Stagecoach', 'Indio', 'Stagecoach', '2027-04-25 20:00-07', false, 'on_sale', 'Official tour lists 25 April 2027. Festival tickets stay with Stagecoach.'),
  ('las-2027-09-16', 'concert', 'Sphere', 'Las Vegas', 'Sphere', '2027-09-16 20:00-07', false, 'on_sale', 'First of the three Sphere nights on the official tour.'),
  ('las-2027-09-17', 'concert', 'Sphere', 'Las Vegas', 'Sphere', '2027-09-17 20:00-07', false, 'on_sale', 'Second Sphere night.'),
  ('las-2027-09-18', 'concert', 'Sphere', 'Las Vegas', 'Sphere', '2027-09-18 20:00-07', false, 'on_sale', 'Third Sphere night.'),
  ('qro-meet-2026-10-30', 'meet', 'After the show', 'Querétaro', 'Hipico de Juriquilla', '2026-10-30 23:00-06', true, 'open', 'A short list after Juriquilla. Not a private meeting and not a ticket.'),
  ('mxl-meet-2026-11-05', 'meet', 'After the show', 'Mexicali', 'Estacionamiento Ciudad Deportiva', '2026-11-05 23:00-06', true, 'open', 'A short list after Mexicali.'),
  ('las-meet-2027-09-18', 'meet', 'After the show', 'Las Vegas', 'Sphere', '2027-09-18 23:00-07', true, 'open', 'A short list after the last Sphere night.');

insert into songs (title, subtitle, year, album) values
  ('A Través del Vaso', null, 2024, 'Boca Chueca, Vol. 1'),
  ('Me La Aventé', null, 2019, 'El Malo'),
  ('Tú', null, 2020, 'Single'),
  ('Que Vuelvas', 'with Grupo Frontera', 2023, 'Single'),
  ('Como lo Hice Yo', null, 2022, 'Single'),
  ('Indispensable', null, 2023, 'Colmillo de Leche'),
  ('Desde Que Te Tengo', null, 2026, 'MUDA'),
  ('El Amor de Mi Herida', null, 2024, 'Palabra de To''s'),
  ('La Buena', null, 2026, 'MUDA'),
  ('Aunque Tú No Lo Sepas', null, 2024, 'Boca Chueca, Vol. 1');

insert into chapters (city, country, blurb, member_count) values
  ('Hermosillo', 'Mexico', 'His hometown chapter. Fans who still measure the night from Sonora.', 0),
  ('Querétaro', 'Mexico', 'Juriquilla and everyone driving in for the hipico.', 0),
  ('Mexicali', 'Mexico', 'The border chapter, for the Ciudad Deportiva night.', 0),
  ('Zacatecas', 'Mexico', 'The plaza de toros crowd.', 0),
  ('Mérida', 'Mexico', 'Feria Xmatkuil and the Yucatán rooms.', 0),
  ('Veracruz', 'Mexico', 'Beto Ávila and the gulf.', 0),
  ('Oaxaca', 'Mexico', 'Guelaguetza and the roads into the city.', 0),
  ('Villahermosa', 'Mexico', 'The open-air theatre night.', 0),
  ('Ciudad de México', 'Mexico', 'The capital chapter, for fans between tour stops.', 0),
  ('Guadalajara', 'Mexico', 'Jalisco, even when the poster is somewhere else.', 0),
  ('Monterrey', 'Mexico', 'The north, when the tour is not in the city.', 0),
  ('Los Angeles', 'United States', 'For fans following the Mexican dates from far away.', 0),
  ('Las Vegas', 'United States', 'The Sphere chapter. Three nights in September 2027.', 0);

insert into news (slug, title, excerpt, body, published_at) values
  (
    'official-tour-board',
    'The board follows the official tour',
    'Querétaro through the Sphere. Clocks stay off unless a poster names one.',
    'Caring León keeps the dates that are on carinleon.com. Querétaro is 30 October 2026 at Hipico de Juriquilla. November runs Mexicali, Zacatecas, Mérida, Veracruz, Oaxaca, and Villahermosa. Stagecoach is listed as 25 April 2027. The Sphere in Las Vegas is 16, 17, and 18 September 2027. This site does not sell those tickets.',
    '2026-10-20 12:00-06'
  ),
  (
    'serenatas-and-hats',
    'Serenatas and the hat list',
    'Two new desks. Neither one is a ticket, and neither one charges a card.',
    'An approved member can ask for a serenata: a song, a person, and a night if you have one. It stays private until the desk approves it, then it sits on the public board. Gold and VIP can also put a hat on the signing list for one show. A yes means you are on that night’s list. It is not a promise from the stage, and it is not a concert ticket.',
    '2026-10-22 12:00-06'
  ),
  (
    'call-fee-is-recorded',
    'A call is €650, recorded here',
    'Write the reason first. The fee page does not charge a card.',
    'Call requests work the same way as the rest of the desk. You write why you want to speak with Carín León. The next page is €650. Marking it paid tells the desk the fee was settled with them. This website does not take a card payment. Staff can approve the call only after that record exists.',
    '2026-10-24 12:00-06'
  );

create table if not exists serenata_requests (
  id serial primary key,
  user_id text not null,
  event_id int references events (id) on delete set null,
  song_title text not null,
  dedicatee text not null,
  note text,
  city text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists serenata_status_idx on serenata_requests (status, created_at desc);

create table if not exists hat_requests (
  id serial primary key,
  user_id text not null,
  event_id int not null references events (id) on delete cascade,
  hat_color text not null,
  inscription text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists show_attendance (
  id serial primary key,
  user_id text not null,
  event_id int not null references events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);
