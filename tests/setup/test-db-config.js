module.exports = {
	SETUP_DB: true,
	DB_NAME: 'sql_sieve_test_db',
	PASSWORD: process.env.MYSQL_ROOT_PASSWORD || 'dbtest',
	USER: 'root'
}
