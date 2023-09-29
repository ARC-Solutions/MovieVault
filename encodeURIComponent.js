var username = 'postgres';
var password = encodeURIComponent('o%$5^3XCTsMR5OQO7#XZXul8SfoRTqED#6^Cb$jU8nN$e7MYa3$ndeSDzBveN^xo');
var host = 'db.hdkwclzvsshlxetactbc.supabase.co';
var port = 5432;
var database = 'postgres';
var DATABASE_URL = "postgresql://".concat(username, ":").concat(password, "@").concat(host, ":").concat(port, "/").concat(database);
console.log(DATABASE_URL);
