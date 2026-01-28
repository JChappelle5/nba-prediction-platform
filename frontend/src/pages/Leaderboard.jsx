import { use, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gamesAPI, leaderboardAPI, predictionsAPI } from '../utils/api';

export default function Leaderboard()
{
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => 
    {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () =>
    {
        try
        {
            const [leaderboardRes, statsRes] = await Promise.all([
                leaderboardAPI.getLeaderboard(20),
                leaderboardAPI.getUserStats()
            ]);

            setLeaderboard(leaderboardRes.data.Leaderboard);
            setUserStats(statsRes.data.stats);
        }
        catch (err)
        {
            setError('Failed to load leaderboard');
            console.error(err);
        }
        finally
        {
            setLoading(false);
        }
    };

    const handleLogout = () =>
    {
        logout();
        navigate('/login');
    };

    if (loading)
    {
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
                            <h1 className="text-xl font-bold text-gray-900">
                                NBA Predictions
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.username}!</span>
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Dashboard
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

                {/* User Stats Card */}
                {userStats && (
                    <div className="bg-white shadow rounded-lg mb-6 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Your Stats
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">
                                    #{userStats.rank}
                                </p>
                                <p className="text-sm text-gray-600">Rank</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">
                                    {userStats.total_points}
                                </p>
                                <p className="text-sm text-gray-600">Points</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">
                                    {userStats.total_predictions}
                                </p>
                                <p className="text-sm text-gray-600">Total Predictions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">
                                    {userStats.correct_predictions}
                                </p>
                                <p className="text-sm text-gray-600">Correct</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">
                                    {userStats.win_percentage}%
                                </p>
                                <p className="text-sm text-gray-600">Win Rate</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h2 className="text-lg leading-6 font-medium text-gray-900">
                            Top Predictors
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Rankings based on total points earned
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Points
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Predictions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Correct
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Win Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            No rankings yet. Start predicting to appear on the
                                            leaderboard!
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((entry) => (
                                        <tr
                                            key={entry.rank}
                                            className={
                                                entry.username === user?.username ? "bg-blue-50" : ""
                                            }
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {entry.rank <= 3 ? (
                                                        <span className="text-2xl">
                                                            {entry.rank === 1
                                                                ? "🥇"
                                                                : entry.rank === 2
                                                                    ? "🥈"
                                                                    : "🥉"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-900">
                                                            #{entry.rank}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {entry.username}
                                                    {entry.username === user?.username && (
                                                        <span className="ml-2 text-xs text-blue-600">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-blue-600">
                                                    {entry.total_points}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.total_predictions}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                {entry.correct_predictions}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {entry.win_percentage}%
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}