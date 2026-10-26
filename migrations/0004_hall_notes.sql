-- The repeated "hall not named" sentence was noise under every 2027 row.
update events
set note = null
where note = 'Date is on the official poster. The hall is not named there yet.';
