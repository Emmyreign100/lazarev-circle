-- Correct halls, the missing Moscow nights, and songs filed under the wrong records.

insert into events (slug, kind, title, city, venue, starts_at, time_known, status, note) values
  ('msk-2026-10-22', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-22 20:00+03', true, 'sold_out', 'Sold out. First of the five Live Arena nights, 22–26 October.'),
  ('msk-2026-10-23', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-23 20:00+03', true, 'sold_out', 'Sold out. 20:00.'),
  ('msk-2026-10-24', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-24 19:00+03', true, 'sold_out', 'Sold out. 19:00.'),
  ('msk-2026-10-25', 'concert', 'SHOWMAN', 'Moscow', 'Live Arena', '2026-10-25 19:00+03', true, 'sold_out', 'Sold out. 19:00.')
on conflict (slug) do nothing;

update events set venue = 'Palace of Spectacles and Sports' where slug = 'tom-2026-11-27';
update events set venue = 'Kuzbass Ice Palace' where slug = 'kem-2026-11-29';
update events set venue = 'Kuznetsk Metallurgists Sports Palace' where slug = 'nvk-2026-11-30';
update events set venue = 'G-Drive Arena' where slug = 'oms-2026-12-07';
update events set venue = 'Paryshev Ice Palace' where slug = 'krg-2026-12-09';
update events set venue = 'Taganay Concert Hall' where slug in ('chl-2026-12-10', 'chl-2026-12-11');
update events set venue = 'Ice Sports Palace' where slug = 'sur-2026-12-14';
update events set venue = 'Tennis Development Centre' where slug = 'khm-2026-12-15';
update events set venue = 'UDS Molot' where slug = 'prm-2026-12-21';
update events set venue = 'UGMK Arena' where slug in ('ekb-2026-12-23', 'meet-ekb-2026-12-23');
update events set
  venue = 'Live Arena',
  note = 'Added after the 2026 run sold out. Same hall. Clock not on the poster yet.'
where slug in ('msk-2027-10-23', 'msk-2027-10-24', 'msk-2027-10-25');
update events set
  venue = 'Hall to be named',
  note = coalesce(note, 'Date is on the official poster. The hall is not named there yet.')
where venue = 'Official poster';

update chapters
set blurb = 'UGMK Arena on 23 December, plus a meet window the same night.'
where city = 'Yekaterinburg';

update songs set year = 2016, album = null, subtitle = 'Eurovision 2016 · 3rd' where title = 'You Are the Only One';
update songs set year = 2019, album = null, subtitle = 'Eurovision 2019 · 3rd' where title = 'Scream';
update songs set year = 2017, album = 'V epitsentre', subtitle = 'Shyopotom' where title = 'Шёпотом';
update songs set year = 2019, album = 'Eto ya', subtitle = 'Sneg v okeane' where title = 'Снег в океане';
update songs set year = 2025, album = null, subtitle = 'Single' where title = 'Шоумен';
update songs set year = 2024, album = 'Ya videl svet', subtitle = 'Samoobman' where title = 'Самообман';
update songs set year = 2024, album = 'Ya videl svet', subtitle = 'Tsveta odnogo' where title = 'Цвета одного';
update songs set year = 2025, album = 'Schastlivye tozhe plachut', subtitle = 'Tonu v tvoikh glazakh' where title = 'Тону в твоих глазах';
