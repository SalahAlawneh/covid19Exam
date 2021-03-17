DROP TABLE IF EXISTS card;
CREATE TABLE card (
    id SERIAL PRIMARY KEY,
    country VARCHAR (255),
    confirmed VARCHAR (255),
    deaths VARCHAR (255),
    recovered VARCHAR (255),
    date VARCHAR (255)
);
