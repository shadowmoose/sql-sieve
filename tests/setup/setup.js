/*
	Basic Jest setup file, which exists to create the Database before any tests are run.
 */
const db = require('mysql2/promise');
const config = require('./test-db-config');
const sql = require('./test-db.sql');

module.exports = async () => {
	if (!config.SETUP_DB) return;

	const pool = await db.createConnection({
		user: config.USER,
		password: config.PASSWORD,
		multipleStatements: true
	});

	await pool.query(`DROP DATABASE IF EXISTS ${config.DB_NAME};`);
	await pool.query(`CREATE DATABASE ${config.DB_NAME};`);
	await pool.query(`USE ${config.DB_NAME};`);

	await pool.beginTransaction();
	await pool.query(sql);
	await pool.commit();

	await pool.end();
}
