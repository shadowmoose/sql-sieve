export * from './sql/table';
export * from './sql/row';
export * from './sql/database';

// TODO: Triggers, as a last-in thing after restores are complete.
// TODO: Views (SHOW CREATE VIEW)


// docker stop mysql; docker rm mysql; clear; docker run --detach --name=mysql --env="MYSQL_ROOT_PASSWORD=dbtest" --publish 3306:3306 mysql
