const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/user/:username', async (req, res) => {
    const username = req.params.username;
    try {
        let page = 1;
        let repos = [];
        let result;
        do {
            result = await axios.get(`https://api.github.com/users/${username}/repos`, {
                params: { per_page: 100, page }
            });
            repos = repos.concat(result.data);
            page++;
        } while (result.data.length > 0);

        const totalCount = repos.length;
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const languages = {};

        for (const repo of repos) {
            const langResult = await axios.get(repo.languages_url);
            for (const [language, count] of Object.entries(langResult.data)) {
                languages[language] = (languages[language] || 0) + count;
            }
        }

        const sortedLanguages = Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([language, count]) => ({ language, count }));

        res.json({
            totalCount,
            totalForks,
            languages: sortedLanguages
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from GitHub' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
