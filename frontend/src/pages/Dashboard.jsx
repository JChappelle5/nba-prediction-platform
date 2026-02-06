import { use, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, predictionsAPI } from '../utils/api';
import { formatGameDate } from '../utils/formatDate';

// Map team abbreviations to ESPN logo names
const getESPNTeamAbbr = (abbr) => 
{
  const mapping = 
  {
    'UTA': 'utah',
    'NOP': 'no',

  };
  return mapping[abbr] || abbr.toLowerCase();
};

export default function Dashboard()
{
    const [games, setGames] = useState([]);
    const [predictions, setPredictions]= useState([]);
    const [loading, setLoading] = useState(true);
    const [ error, setError] = useState('');
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => 
    {
        fetchData();
    }, []);

    const fetchData = async () => 
    {
        try
        {
            const[ gamesRes, predictionsRes] = await Promise.all([
                gamesAPI.getUpcoming(),
                predictionsAPI.getAll()
            ]);

            setGames(gamesRes.data.games);
            console.log('Games data:', gamesRes.data.games);
            setPredictions(predictionsRes.data.predictions);
        }
        catch (err)
        {
            setError('Failed to load data');
            console.error(err);
        }
        finally
        {
            setLoading(false);
        }
    };

    const hasPredicted = (gameId) =>
    {
        return predictions.some(p => p.game_id === gameId);
    };

    const handlePredictionSubmit = async () =>
    {
        if (!selectedGame || !selectedTeam) return;

        setSubmitting(true);
        setError('');

        try
        {
            await predictionsAPI.create(
                {
                    game_id: selectedGame,
                    predicted_winner_team_id: selectedTeam
                }
            );

            // Refresh data
            await fetchData();

            // Reset selection
            setSelectedGame(null);
            setSelectedTeam(null);

            alert('Prediction submitted successfully!');
        }
        catch (err)
        {
            setError(err.response?.data?.error || 'Failed to submit prediction');
        }
        finally
        {
            setSubmitting(false);
        }
    };

    const handleLogout = () =>
    {
        logout();
        navigate('/login');
    };

    
    
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">🏀 NBA Predictions</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-gray-400">Welcome</p>
                <p className="text-sm font-semibold text-white">{user?.username}</p>
              </div>
              <div className="text-center px-4 py-2 bg-blue-600 rounded-lg">
                <p className="text-xs text-blue-200">Points</p>
                <p className="text-lg font-bold text-white">{user?.total_points}</p>
              </div>
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
              >
                Leaderboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Upcoming Games</h2>
          <p className="text-gray-400">Make your predictions before games start</p>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-lg">No upcoming games available</p>
          </div>
        ) : (
          
          <div className="flex flex-col gap-4">
            {games.map((game) => {
              const predicted = hasPredicted(game.id);
              const isSelected = selectedGame === game.id;
              
              return (
                <div
                  key={game.id}
                  className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200"
                >
                  {/* Card Header - Date */}
                  <div className="bg-gray-700 px-4 py-2 text-center">
                    <p className="text-sm text-gray-300">{formatGameDate(game.game_date)}</p>
                  </div>

                  {/* Team Logos */}
                  <div className="p-6 flex items-center justify-center space-x-8">
                    {/* AWAY Team (was home) */}
                    <div className="flex flex-col items-center flex-1">
                      <img 
                        src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${getESPNTeamAbbr(game.away_team_abbreviation)}.png&h=100&w=100`}
                        alt={game.away_team_abbreviation}
                        className="w-20 h-20 mb-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/80/1F2937/FFFFFF?text=${game.away_team_abbreviation}`;
                        }}
                      />
                      <span className="text-white font-semibold text-center">{game.away_team_abbreviation}</span>
                    </div>
                    
                    {/* VS */}
                    <div className="text-2xl font-bold text-gray-500">@</div>
                    
                    {/* HOME Team (was away) */}
                    <div className="flex flex-col items-center flex-1">
                      <img 
                        src={`https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${getESPNTeamAbbr(game.home_team_abbreviation)}.png&h=100&w=100`}
                        alt={game.home_team_abbreviation}
                        className="w-20 h-20 mb-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/80/1F2937/FFFFFF?text=${game.home_team_abbreviation}`;
                        }}
                      />
                      <span className="text-white font-semibold text-center">{game.home_team_abbreviation}</span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="px-6 pb-6">
                    {predicted ? (
                      <div className="bg-green-900 border border-green-700 rounded-lg px-4 py-3 text-center">
                        <span className="text-green-300 font-medium">✓ Prediction Submitted</span>
                      </div>
                    ) : isSelected ? (
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedTeam(game.away_team_id)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                              selectedTeam === game.away_team_id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {game.away_team_abbreviation}
                          </button>
                          <button
                            onClick={() => setSelectedTeam(game.home_team_id)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                              selectedTeam === game.home_team_id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {game.home_team_abbreviation}
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handlePredictionSubmit}
                            disabled={!selectedTeam || submitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                          >
                            {submitting ? 'Submitting...' : 'Submit'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedGame(null);
                              setSelectedTeam(null);
                            }}
                            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedGame(game.id)}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        Make Prediction
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Your Predictions Section */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
          <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
            <h2 className="text-xl font-bold text-white">Your Predictions</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {predictions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No predictions yet. Start predicting above!
              </div>
            ) : (
              predictions.map((pred) => (
                <div key={pred.id} className="px-6 py-4 hover:bg-gray-750 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">
                        {pred.away_team_name} @ {pred.home_team_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        You predicted: <span className="text-blue-400 font-medium">{pred.predicted_team_name}</span>
                      </p>
                      {pred.game_status === 'finished' && (
                        <>
                          <p className="text-sm text-gray-300 mt-1">
                            Final Score: {pred.away_team_name} {pred.away_score} - {pred.home_team_name} {pred.home_score}
                          </p>
                          <p className="text-sm mt-2">
                            {pred.points_awarded > 0 ? (
                              <span className="text-green-400 font-semibold">
                                ✓ Correct! +{pred.points_awarded} points
                              </span>
                            ) : (
                              <span className="text-red-400 font-semibold">
                                ✗ Incorrect
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-400 mb-2">
                        {formatGameDate(pred.game_date)}
                      </p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        pred.game_status === 'finished' 
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-yellow-900 text-yellow-300'
                      }`}>
                        {pred.game_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}