const consts = require('./test-db-config');


/** A (valid!) SQL file that can create the entire test database from scratch. */
module.exports =`
CREATE TABLE \`USERS\` (
    \`id\` int unsigned NOT NULL AUTO_INCREMENT,
    \`xpk\` int NOT NULL,
    \`firstname\` varchar(30) NOT NULL,
    \`lastname\` varchar(30) NOT NULL,
    \`email\` varchar(50) DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`idx_users\` (\`firstname\`,\`lastname\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE \`SECOND_TABLE\` (
    \`id\` int unsigned NOT NULL AUTO_INCREMENT,
    \`xfirstname\` varchar(30) NOT NULL,
    \`xlastname\` varchar(30) NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`xfirstname\` (\`xfirstname\`,\`xlastname\`),
    CONSTRAINT \`SECOND_TABLE_ibfk_1\` FOREIGN KEY (\`xfirstname\`, \`xlastname\`) REFERENCES \`USERS\` (\`firstname\`, \`lastname\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT INTO USERS (id, xpk, firstname, lastname) VALUES
(1,	1337, "first", "last"),
(2,	1, "2-first", "2-last");

INSERT INTO SECOND_TABLE (id, xfirstname, xlastname) VALUES
(1, "2-first", "2-last"),
(2, "first", "last");


CREATE TRIGGER \`test_trigger\` BEFORE INSERT ON \`USERS\` FOR EACH ROW BEGIN
    SET NEW.email = CONCAT(NEW.firstname, "@test.com");
END;
`;
