const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

const GITHUB_TOKEN = "my token";

app.use(cors());

app.get('/api/user/:username', async (req, res) => {
    const username = req.params.username;
    const includeForked = req.query.forked === 'true';
    try {
        let page = 1;
        let repos = [];
        let result;
        do {
            result = await axios.get(`https://api.github.com/users/${username}/repos`, {
                params: { per_page: 100, page },
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });
            repos = repos.concat(result.data);
            page++;
        } while (result.data.length > 0);

        if (!includeForked) {
            repos = repos.filter(repo => !repo.fork);
        }

        const totalCount = repos.length;
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        const totalStargazers = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalSize = repos.reduce((sum, repo) => sum + repo.size, 0);
        const averageSize = totalSize / totalCount;

        const languages = {};

        for (const repo of repos) {
            const langResult = await axios.get(repo.languages_url, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });
            for (const [language, count] of Object.entries(langResult.data)) {
                languages[language] = (languages[language] || 0) + count;
            }
        }

        const sortedLanguages = Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([language, count]) => ({ language, count }));

        res.status(200).json({
            totalCount,
            totalForks,
            totalStargazers,
            averageSize: formatSize(averageSize),
            languages: sortedLanguages
        });
    } catch (error) {
        console.error('Error fetching data from GitHub:', error.message);

        if (error.response) {
            // GitHub API error responses
            if (error.response.status === 404) {
                res.status(404).json({ error: 'User not found' });
            } else if (error.response.status === 403) {
                res.status(403).json({ error: 'Rate limit exceeded' });
            } else {
                res.status(error.response.status).json({ error: error.response.statusText });
            }
        } else {
            // Other errors
            res.status(500).json({ error: 'Internal server error. Please try again later.' });
        }
    }
});

function formatSize(sizeInKB) {
    const units = ['KB', 'MB', 'GB'];
    let size = sizeInKB;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});