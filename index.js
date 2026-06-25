const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
const cors = require('cors');
app.use(cors());

const port = 5000;

const { neon } = require("@neondatabase/serverless");
const DATABASE_URL = 'postgresql://neondb_owner:npg_L4pyPO3qrwFZ@ep-little-hill-atsyftaf-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const sql = neon(DATABASE_URL);

app.use(function (_, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.post(`/login`, async (request, response) => {
    const { username, password } = request.body;
    const user = await sql`SELECT * FROM Users WHERE username = ${username} AND password = ${password};`;
    if (user && user.length > 0) {
        response.send({ error: false, user: { id: user[0].id } });
    } else {
        response.send({ error: true });
    }
});

// ----------- books

app.get(`/books/:id`, async (request, response) => {
    const id = request.params.id;
    const book = await sql`SELECT * FROM Books WHERE id = ${id};`
    book.length == 0 ? response.status(404).send(`Error in finding book with id ${id}`) : response.send(book[0]);
});

app.get(`/books`, async (request, response) => {
    const books = await sql`SELECT * FROM Books b;`;
    response.send(books);
});

app.post(`/books`, async (request, response) => {
    const book = request.body;
    const search = await sql`SELECT * FROM Books WHERE id = ${book.id};`;
    if (search.length == 0) {
        const created = await sql`INSERT INTO Books (id, title, cover, author, summary, year, language, pages)
    VALUES (${book.id}, ${book.title}, ${book.cover}, ${book.author}, ${book.summary}, ${book.year}, ${book.language}, ${book.pages});`;
        response.send(created);
    } else {
        response.status(404).send("Duplicate id for books.");
    }
});

app.put(`/books/:id`, async (request, response) => {
    const id = request.params.id;
    const book = request.body;
    const search = await sql`SELECT * FROM Books WHERE id = ${id};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding book with id ${id}`);
    } else {
        const created = await sql`UPDATE Books SET title = ${book.title}, cover = ${book.cover}, author = ${book.author}, summary = ${book.summary},
         year = ${book.year}, language = ${book.language} pages = ${book.pages} WHERE id = ${id};`;
        response.send(created);
    }
});

app.delete(`/books/:id`, async (request, response) => {
    const id = request.params.id;
    const search = await sql`SELECT * FROM Books WHERE id = ${id};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding book with id ${id}`);
    } else {
        await sql`DELETE FROM Books WHERE id = ${id};`;
        response.send('Deleted book successfully!');
    }
});

// --------------- users

app.get(`/users/:userID`, async (request, response) => {
    const userID = request.params.userID;
    const user = await sql`SELECT * FROM Users WHERE id = ${userID};`
    user.length == 0 ? response.status(404).send(`Error in finding user with id ${userID}`) : response.send(user[0]);
});

app.post(`/users`, async (request, response) => {
    const user = request.body;
    const created = await sql`INSERT INTO Users (first_name, last_name, picture, bio, username, password, is_admin)
    VALUES (${user.first_name}, ${user.last_name}, ${user.picture}, ${user.bio}, ${user.username}, ${user.password} ${user.is_admin});`;
    response.send(created);
});

app.put(`/users/:id`, async (request, response) => {
    const id = request.params.id;
    const user = request.body;
    const search = await sql`SELECT * FROM Users WHERE id = ${id};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding user with id ${id}`);
    } else {
        const created = await sql`UPDATE Users SET first_name = ${user.first_name}, last_name = ${user.last_name}, picture = ${user.picture},
         bio = ${user.bio}, username = ${user.username}, password = ${user.password}, is_admin = ${user.is_admin} WHERE id = ${id};`;
        response.send(created);
    }
});

app.delete(`/users/:id`, async (request, response) => {
    const id = request.params.id;
    const search = await sql`SELECT * FROM Users WHERE id = ${id};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding user with id ${id}`);
    } else {
        await sql`DELETE FROM Users WHERE id = ${id};`;
        response.send('Deleted user successfully!');
    }
});

// ----------- users list

app.get(`/users/lists/:userID`, async (request, response) => {
    const userID = request.params.userID;
    const lists = await sql`SELECT id, name, description, created FROM Lists WHERE user_id = ${userID};`
    lists.length == 0 ? response.status(404).send(`Error in finding lists for user with id ${userID}`) : response.send(lists);
});

app.post(`/users/lists`, async (request, response) => {
    const list = request.body;
    const created = await sql`INSERT INTO Lists (name, description, user_id, admin_id, created)
    VALUES (${list.name}, ${list.description}, ${list.user_id}, ${null}, ${true});`;
    response.send(created);
});

app.put(`/users/lists/:listID`, async (request, response) => {
    const listID = request.params.listID;
    const list = request.body;
    const search = await sql`SELECT * FROM Lists WHERE id = ${listID};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding list with id ${listID}`);
    } else {
        const created = await sql`UPDATE Lists SET name = ${list.name}, description = ${list.description}
         WHERE id = ${listID};`;
        response.send(created);
    }
});

app.delete(`/users/lists/:listID`, async (request, response) => {
    const listID = request.params.listID;
    const search = await sql`SELECT * FROM Lists WHERE id = ${listID};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding list with id ${listID}`);
    } else {
        await sql`DELETE FROM Lists WHERE id = ${listID};`;
        response.send('Deleted list successfully!');
    }
});

// --------- book lists

app.get(`/lists/:listID`, async (request, response) => {
    const listID = request.params.listID;
    const books = await sql`SELECT id, cover, title, author FROM Books b JOIN BookLists l on b.id = l.book_id WHERE list_id = ${listID};`;
    response.send(books);
});

app.post(`/lists`, async (request, response) => {
    const { bookID, listID, listName, userID } = request.body;
    if (listName == "") {
        const check = await sql`SELECT * FROM BookLists WHERE book_id = ${bookID} AND list_id = ${listID};`;
        if (check.length == 0) {
            const insert = await sql`INSERT INTO BookLists (book_id, list_id) VALUES (${bookID}, ${listID});`;
            response.send(true);
        } else {
            response.send(false);
        }
    } else {
        const list = await sql`SELECT id FROM Lists WHERE name LIKE ${listName} AND user_id = ${userID};`;
        console.log(list);
        const check = await sql`SELECT * FROM BookLists WHERE book_id = ${bookID} AND list_id = ${list[0].id};`;
        if (check.length == 0) {
            const insert = await sql`INSERT INTO BookLists (book_id, list_id) VALUES (${bookID}, ${list[0].id});`;
            response.send(true);
        } else {
            response.send(false);
        }
    }
});

app.delete(`/lists/:listID/:bookID`, async (request, response) => {
    const bookID = request.params.bookID;
    const listID = request.params.listID;
    const search = await sql`SELECT * FROM BookLists WHERE book_id = ${bookID} AND list_id = ${listID};`;
    if (search.length == 0) {
        response.status(404).send(`Error in finding book with id ${bookID}`);
    } else {
        await sql`DELETE FROM BookLists WHERE book_id = ${bookID} AND list_id = ${listID};`;
        response.send('Deleted book successfully!');
    }
});

// ----------- search 

app.get(`/languages`, async (request, response) => {
    const langs = await sql`SELECT DISTINCT language FROM Books;`;
    response.send(langs);
});

// ---------- genres

app.get(`/genres`, async (request, response) => {
    const genres = await sql`SELECT * FROM Subjects;`;
    response.send(genres);
});

app.get(`/genres/:genreID`, async (request, response) => {
    const genreID = request.params.genreID;
    const genre = await sql`SELECT * FROM Subjects WHERE id = ${genreID};`;
    response.send(genre);
});

app.post(`/genres`, async (request, response) => {
    const genre = request.body;
    const created = await sql`INSERT INTO Subjects (name) VALUES (${genre.name});`;
});

// ------- book genres

app.get(`/genres/:genreID/:bookID`, async (request, response) => {
    const genreID = request.params.genreID;
    const bookID = request.params.bookID;
    const search = await sql`SELECT * FROM BookSubjects WHERE book_id = ${bookID} AND subject_id = ${genreID};`;
    search.length == 0 ? response.send(false) : response.send(true);
});

app.get(`/genres/:genreID/books`, async (request, response) => {
    const genreID = request.params.genreID;
    const books = await sql`SELECT id, cover, title, author FROM Books b JOIN BookSubjects s on b.id = s.book_id
    WHERE s.subject_id = ${genreID};`
    response.send(books);
});

app.get(`/book/genres/:bookID`, async (request, response) => {
    const bookID = request.params.bookID;
    const genres = await sql`SELECT s.id, s.name FROM BookSubjects b JOIN Subjects s ON b.subject_id = s.id WHERE b.book_id = ${bookID};`;
    response.send(genres);
});

app.post(`/genres/book`, async (request, response) => {
    const { genreID, bookID } = request.body;
    const search = await sql`SELECT * FROM BookSubjects WHERE book_id = ${bookID} AND subject_id = ${genreID};`;
    if (search.length == 0) {
        const created = await sql`INSERT INTO BookSubjects (book_id, subject_id) VALUES (${bookID}, ${genreID});`;
        response.send(true);
    }
    else {
        response.status(404).send("Duplicate genres for a book.");
    }
});

app.delete(`/genres/:bookID`, async (request, response) => {
    const bookID = request.params.bookID;
    const clear = await sql`DELETE FROM BookSubjects WHERE book_id = ${bookID};`;
    response.send("Deleted genres for book.")
}); 