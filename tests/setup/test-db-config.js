module.exports = {
	SETUP_DB: true,
	DB_NAME: 'test_staged_db',
	PASSWORD: process.env.MYSQL_ROOT_PASSWORD || 'dbtest',
	USER: 'root'
}
