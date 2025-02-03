// entry point for express server

const express = require('express');
const app = express();
const snippets = require('./snippets')
 

app.use(express.json());

let nextId = snippets.length > 0 ? Math.max(...snippets.map(s => s.id)) + 1 : 1;


// POST route to add new snippets!
app.post('/snippets', (req,res) => {
    const { language, code} = req.body

    if (!language || !code) {
        return res.status(400).json({ error: 'Language AND code are both required!'})
    }

    //creates new snippet with an auto-incremented ID
    const newSnippet = {
        id: nextId++,
        language,
        code
    }

    //pushes the new snippet to the snippets array and returns it 
    snippets.push(newSnippet)
    res.status(201).json(newSnippet)
})










// initialise the local server 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on http://localhost:$(PORT');
});

