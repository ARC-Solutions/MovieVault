const username: string = 'postgres';
const password: string = encodeURIComponent('o%$5^3XCTsMR5OQO7#XZXul8SfoRTqED#6^Cb$jU8nN$e7MYa3$ndeSDzBveN^xo');
const host: string = 'db.hdkwclzvsshlxetactbc.supabase.co';
const port: number = 5432;
const database: string = 'postgres';

const DATABASE_URL: string = `postgresql://${username}:${password}@${host}:${port}/${database}`;
console.log(DATABASE_URL);