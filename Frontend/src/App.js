import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [includeForked, setIncludeForked] = useState(true);

  const fetchStats = async () => {
    try {
      setError('');
      const response = await axios.get(`http://localhost:5000/api/user/${username}`, {
        params: {
          forked: includeForked
        }
      });
      setStats(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error fetching data from server');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GitHub User Stats</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username"
        />
        <div>
          <input
            type="checkbox"
            checked={includeForked}
            onChange={(e) => setIncludeForked(e.target.checked)}
          />
          <label>Include Forked Repositories</label>
        </div>
        <button onClick={fetchStats}>Get Stats</button>
        {error && <p>{error}</p>}
        {stats && (
          <div>
            <p>Total Repositories: {stats.totalCount}</p>
            <p>Total Forks: {stats.totalForks}</p>
            <p>Total Stargazers: {stats.totalStargazers}</p>
            <p>Average Repository Size: {stats.averageSize}</p>
            <h3>Languages Used:</h3>
            <ul>
              {stats.languages.map((lang) => (
                <li key={lang.language}>
                  {lang.language}: {lang.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

