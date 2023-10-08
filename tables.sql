CREATE TABLE public."User" (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50),
    password TEXT NOT NULL CHECK (LENGTH(password) >= 8)
) TABLESPACE pg_default;

CREATE TABLE public."Movie" (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    director TEXT NOT NULL,
    rating DOUBLE PRECISION NOT NULL,
    CONSTRAINT movies_pkey PRIMARY KEY (id)
  ) tablespace pg_default;
