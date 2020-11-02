export * from './sql/table';
export * from './sql/row';
export * from './sql/database';

// TODO: Views (SHOW CREATE VIEW)
// TODO: Locks (database.getLock(name)). Should work via mysql GET_LOCK(name, timeout);


// docker stop mysql; docker rm mysql; clear; docker run --detach --name=mysql --env="MYSQL_ROOT_PASSWORD=dbtest" --publish 3306:3306 mysql
