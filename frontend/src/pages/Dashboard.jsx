import { use, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, predictionsAPI } from '../utils/api';
import { formatGameDate } from '../utils/formatDate';

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">NBA Predictions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.username}!
              </span>
              <span className="text-blue-600 font-semibold">
                {user?.total_points} points
              </span>
              <button
                onClick={() => navigate('/leaderboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Leaderboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Upcoming Games */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Upcoming Games
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Make your predictions before games start
            </p>
          </div>
          <div className="border-t border-gray-200">
            {games.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-gray-500">
                No upcoming games available
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {games.map((game) => {
                  const predicted = hasPredicted(game.id);
                  const isSelected = selectedGame === game.id;
                  
                  return (
                    <li key={game.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {game.home_team_name} vs {game.away_team_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatGameDate(game.game_date)}
                            </p>
                          </div>
                          {predicted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                              Prediction submitted ✓
                            </span>
                          ) : isSelected ? (
                            <div className="mt-3 flex space-x-3">
                              <button
                                onClick={() => setSelectedTeam(game.home_team_id)}
                                className={`px-4 py-2 rounded ${
                                  selectedTeam === game.home_team_id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {game.home_team_abbreviation}
                              </button>
                              <button
                                onClick={() => setSelectedTeam(game.away_team_id)}
                                className={`px-4 py-2 rounded ${
                                  selectedTeam === game.away_team_id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {game.away_team_abbreviation}
                              </button>
                              <button
                                onClick={handlePredictionSubmit}
                                disabled={!selectedTeam || submitting}
                                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
                              >
                                {submitting ? 'Submitting...' : 'Submit'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedGame(null);
                                  setSelectedTeam(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedGame(game.id)}
                              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Make Prediction
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Your Predictions */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Your Predictions
            </h2>
          </div>
          <div className="border-t border-gray-200">
            {predictions.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-gray-500">
                No predictions yet. Start predicting above!
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {predictions.map((pred) => (
                  <li key={pred.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pred.home_team_name} vs {pred.away_team_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          You predicted: {pred.predicted_team_name}
                        </p>
                        {pred.game_status === 'finished' && (
                          <p className="text-sm mt-1">
                            {pred.points_awarded > 0 ? (
                              <span className="text-green-600 font-semibold">
                                ✓ Correct! +{pred.points_awarded} points
                              </span>
                            ) : (
                              <span className="text-red-600">
                                ✗ Incorrect
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatGameDate(pred.game_date)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pred.game_status === 'finished' 
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pred.game_status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}