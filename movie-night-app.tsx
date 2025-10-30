import React, { useState, useEffect } from 'react';
import { Film, Plus, Edit2, Trash2, ThumbsUp, ThumbsDown, Sparkles, ChevronLeft, Calendar, Bell, X } from 'lucide-react';

const MovieNightApp = () => {
  const [view, setView] = useState('home');
  const [currentUser, setCurrentUser] = useState('');
  const [movieNights, setMovieNights] = useState([]);
  const [themes, setThemes] = useState([
    'Time Travel', 'Heist', 'Sports', 'Musicals', 'Sci-Fi', 
    'Horror', 'Rom-Com', 'Based on a Book', 'Foreign Language', 
    'Documentaries', 'Animated', 'Film Noir'
  ]);
  const [selectedNight, setSelectedNight] = useState(null);
  const [newTheme, setNewTheme] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingTheme, setEditingTheme] = useState(null);
  const [editingDate, setEditingDate] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const nightsData = await window.storage.get('movie-nights', true);
      if (nightsData) setMovieNights(JSON.parse(nightsData.value));
      
      const themesData = await window.storage.get('themes', true);
      if (themesData) setThemes(JSON.parse(themesData.value));
      
      const userData = await window.storage.get('current-user');
      if (userData) setCurrentUser(userData.value);

      const remindersData = await window.storage.get('reminders', true);
      if (remindersData) setReminders(JSON.parse(remindersData.value));
    } catch (e) {
      console.log('No saved data found');
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set('movie-nights', JSON.stringify(movieNights), true);
      await window.storage.set('themes', JSON.stringify(themes), true);
      if (currentUser) await window.storage.set('current-user', currentUser);
      await window.storage.set('reminders', JSON.stringify(reminders), true);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  useEffect(() => {
    if (movieNights.length > 0 || themes.length > 0 || reminders.length > 0) {
      saveData();
    }
  }, [movieNights, themes, currentUser, reminders]);

  const createMovieNight = (theme) => {
    const newNight = {
      id: Date.now(),
      theme,
      date: new Date().toLocaleDateString(),
      submissions: [],
      eliminated: [],
      winner: null,
      reviews: []
    };
    setMovieNights([newNight, ...movieNights]);
    setSelectedNight(newNight);
    setView('submissions');
  };

  const updateNightDate = (nightId, newDate) => {
    const updated = movieNights.map(night =>
      night.id === nightId ? { ...night, date: newDate } : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === nightId));
    setEditingDate(false);
  };

  const deleteTheme = (theme) => {
    setThemes(themes.filter(t => t !== theme));
  };

  const updateTheme = (oldTheme, newTheme) => {
    setThemes(themes.map(t => t === oldTheme ? newTheme : t));
    setEditingTheme(null);
  };

  const addReminder = () => {
    if (!phoneNumber) return;
    const newReminder = {
      id: Date.now(),
      userId: currentUser,
      phone: phoneNumber
    };
    setReminders([...reminders, newReminder]);
    setPhoneNumber('');
    setShowReminders(false);
  };

  const removeReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const addMovie = (title) => {
    const userSubmission = selectedNight.submissions.find(s => s.userId === currentUser);
    if (userSubmission) return;

    const newSubmission = {
      id: Date.now(),
      title,
      userId: currentUser,
      votes: 0,
      voters: []
    };

    const updated = movieNights.map(night =>
      night.id === selectedNight.id
        ? { ...night, submissions: [...night.submissions, newSubmission] }
        : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === selectedNight.id));
  };

  const updateMovie = (movieId, newTitle) => {
    const updated = movieNights.map(night =>
      night.id === selectedNight.id
        ? {
            ...night,
            submissions: night.submissions.map(s =>
              s.id === movieId ? { ...s, title: newTitle } : s
            )
          }
        : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === selectedNight.id));
    setEditingMovie(null);
  };

  const deleteMovie = (movieId) => {
    const updated = movieNights.map(night =>
      night.id === selectedNight.id
        ? {
            ...night,
            submissions: night.submissions.filter(s => s.id !== movieId)
          }
        : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === selectedNight.id));
  };

  const voteMovie = (movieId, isUpvote) => {
    const updated = movieNights.map(night =>
      night.id === selectedNight.id
        ? {
            ...night,
            submissions: night.submissions.map(s => {
              if (s.id !== movieId) return s;
              const hasVoted = s.voters.includes(currentUser);
              const voters = hasVoted
                ? s.voters.filter(v => v !== currentUser)
                : [...s.voters, currentUser];
              const voteDelta = hasVoted ? -1 : (isUpvote ? 1 : -1);
              return { ...s, votes: s.votes + voteDelta, voters };
            })
          }
        : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === selectedNight.id));
  };

  const spinWheel = () => {
    const active = selectedNight.submissions.filter(
      s => !selectedNight.eliminated.includes(s.id)
    );
    if (active.length <= 1) {
      if (active.length === 1) {
        const updated = movieNights.map(night =>
          night.id === selectedNight.id
            ? { ...night, winner: active[0].id }
            : night
        );
        setMovieNights(updated);
        setSelectedNight(updated.find(n => n.id === selectedNight.id));
      }
      return;
    }

    setSpinning(true);
    setTimeout(() => {
      const eliminated = active[Math.floor(Math.random() * active.length)];
      const updated = movieNights.map(night =>
        night.id === selectedNight.id
          ? { ...night, eliminated: [...night.eliminated, eliminated.id] }
          : night
      );
      setMovieNights(updated);
      setSelectedNight(updated.find(n => n.id === selectedNight.id));
      setSpinning(false);
    }, 2000);
  };

  const addReview = (rating, comment) => {
    const newReview = {
      id: Date.now(),
      userId: currentUser,
      rating,
      comment,
      date: new Date().toLocaleDateString()
    };
    const updated = movieNights.map(night =>
      night.id === selectedNight.id
        ? { ...night, reviews: [...night.reviews, newReview] }
        : night
    );
    setMovieNights(updated);
    setSelectedNight(updated.find(n => n.id === selectedNight.id));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <Film className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white text-center mb-2">Movie Night</h1>
          <p className="text-gray-300 text-center mb-6">Enter your name to continue</p>
          <input
            type="text"
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onKeyPress={(e) => e.key === 'Enter' && e.target.value && setCurrentUser(e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (view === 'home') {
    const upcomingNight = movieNights.find(n => !n.winner);
    const pastNights = movieNights.filter(n => n.winner);
    const userReminder = reminders.find(r => r.userId === currentUser);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <Film className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">Movie Night</h1>
            <p className="text-gray-300">Welcome, {currentUser}!</p>
          </div>

          {upcomingNight ? (
            <div className="bg-gradient-to-br from-yellow-400/30 to-orange-500/30 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl border-2 border-yellow-400/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold text-white">This Week&apos;s Movie Night</h2>
                </div>
                <button
                  onClick={() => setShowReminders(!showReminders)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                >
                  <Bell className={`w-5 h-5 ${userReminder ? 'text-yellow-400' : 'text-white'}`} />
                </button>
              </div>

              {showReminders && (
                <div className="mb-4 p-4 bg-white/20 rounded-xl">
                  {userReminder ? (
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <div className="font-semibold">Text Reminders Active</div>
                        <div className="text-sm text-gray-300">{userReminder.phone}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Note: This is a demo - actual texts won&apos;t be sent
                        </div>
                      </div>
                      <button
                        onClick={() => removeReminder(userReminder.id)}
                        className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white text-sm mb-3">Get reminded to submit your movie</p>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          onClick={addReminder}
                          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg font-semibold transition-all"
                        >
                          Sign Up
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 mt-2">
                        Note: This is a demo - actual texts won&apos;t be sent
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedNight(upcomingNight);
                  setView('submissions');
                }}
                className="w-full text-left"
              >
                <div className="font-bold text-3xl text-white mb-2">{upcomingNight.theme}</div>
                <div className="flex items-center gap-2 mb-3">
                  {editingDate ? (
                    <input
                      type="text"
                      defaultValue={upcomingNight.date}
                      className="px-3 py-1 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateNightDate(upcomingNight.id, e.target.value);
                        }
                      }}
                      onBlur={(e) => updateNightDate(upcomingNight.id, e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 text-gray-200" />
                      <span className="text-gray-200">{upcomingNight.date}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDate(true);
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <Edit2 className="w-3 h-3 text-gray-200" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-yellow-400 font-semibold">
                    {upcomingNight.submissions.length} submissions
                  </span>
                  <span className="text-gray-300">
                    {upcomingNight.eliminated.length} eliminated
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Start New Movie Night</h2>
              <div className="space-y-3">
                {themes.map(theme => (
                  <div key={theme} className="flex items-center gap-2">
                    {editingTheme === theme ? (
                      <>
                        <input
                          type="text"
                          defaultValue={theme}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateTheme(theme, e.target.value);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingTheme(null)}
                          className="px-4 py-3 bg-white/20 rounded-xl text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => createMovieNight(theme)}
                          className="flex-1 px-6 py-4 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all text-left border border-white/20"
                        >
                          {theme}
                        </button>
                        <button
                          onClick={() => setEditingTheme(theme)}
                          className="p-4 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => deleteTheme(theme)}
                          className="p-4 bg-red-500/50 hover:bg-red-500/70 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom theme"
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={() => {
                    if (newTheme) {
                      setThemes([...themes, newTheme]);
                      setNewTheme('');
                    }
                  }}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {pastNights.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Past Movie Nights</h2>
              <div className="space-y-3">
                {pastNights.map(night => (
                  <button
                    key={night.id}
                    onClick={() => {
                      setSelectedNight(night);
                      setView('reviews');
                    }}
                    className="w-full px-6 py-4 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all text-left border border-white/20"
                  >
                    <div className="font-semibold text-lg">{night.theme}</div>
                    <div className="text-sm text-gray-300">{night.date}</div>
                    <div className="text-sm text-yellow-400 mt-1">
                      🏆 {night.submissions.find(s => s.id === night.winner)?.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'submissions') {
    const userSubmission = selectedNight.submissions.find(s => s.userId === currentUser);
    const activeMovies = selectedNight.submissions.filter(
      s => !selectedNight.eliminated.includes(s.id)
    );
    const canSpin = activeMovies.length > 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-white mb-4 hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-2">{selectedNight.theme}</h2>
            <div className="flex items-center gap-2">
              {editingDate ? (
                <input
                  type="text"
                  defaultValue={selectedNight.date}
                  className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      updateNightDate(selectedNight.id, e.target.value);
                    }
                  }}
                  onBlur={(e) => updateNightDate(selectedNight.id, e.target.value)}
                  autoFocus
                />
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-300">{selectedNight.date}</span>
                  <button
                    onClick={() => setEditingDate(true)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Edit2 className="w-3 h-3 text-gray-300" />
                  </button>
                </>
              )}
            </div>
          </div>

          {!userSubmission && !selectedNight.winner && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Submit Your Movie</h3>
              <input
                type="text"
                placeholder="Movie title"
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-400 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    addMovie(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">
              Submissions ({selectedNight.submissions.length})
            </h3>
            <div className="space-y-3">
              {selectedNight.submissions.map(movie => {
                const isEliminated = selectedNight.eliminated.includes(movie.id);
                const isWinner = selectedNight.winner === movie.id;
                const isOwn = movie.userId === currentUser;
                const hasVoted = movie.voters.includes(currentUser);

                return (
                  <div
                    key={movie.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isWinner
                        ? 'bg-yellow-400/30 border-yellow-400'
                        : isEliminated
                        ? 'bg-red-900/30 border-red-700 opacity-50'
                        : 'bg-white/20 border-white/30'
                    }`}
                  >
                    {editingMovie === movie.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={movie.title}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateMovie(movie.id, e.target.value);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => setEditingMovie(null)}
                          className="px-4 py-2 bg-white/20 rounded-lg text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-white text-lg">{movie.title}</div>
                            {isWinner && (
                              <div className="text-yellow-400 font-semibold mt-1">🏆 Winner!</div>
                            )}
                            {isEliminated && !isWinner && (
                              <div className="text-red-400 text-sm mt-1">Eliminated</div>
                            )}
                          </div>
                          {isOwn && !selectedNight.winner && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingMovie(movie.id)}
                                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                              >
                                <Edit2 className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => deleteMovie(movie.id)}
                                className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-all"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                        {!isOwn && !selectedNight.winner && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => voteMovie(movie.id, true)}
                              className={`p-2 rounded-lg transition-all ${
                                hasVoted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => voteMovie(movie.id, false)}
                              className={`p-2 rounded-lg transition-all ${
                                hasVoted
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                            <span className="text-white font-semibold">{movie.votes}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!selectedNight.winner && selectedNight.submissions.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Spin the Wheel</h3>
              <button
                onClick={spinWheel}
                disabled={spinning || !canSpin}
                className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${
                  spinning || !canSpin
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-500'
                } ${spinning ? 'animate-pulse' : ''}`}
              >
                {spinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 animate-spin" />
                    Spinning...
                  </span>
                ) : !canSpin ? (
                  activeMovies.length === 1 ? 'We have a winner!' : 'Need more submissions'
                ) : (
                  'Spin!'
                )}
              </button>
            </div>
          )}

          {selectedNight.winner && (
            <button
              onClick={() => setView('reviews')}
              className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-xl transition-all"
            >
              View Reviews
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view === 'reviews') {
    const winnerMovie = selectedNight.submissions.find(s => s.id === selectedNight.winner);
    const userReview = selectedNight.reviews.find(r => r.userId === currentUser);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setView('submissions')}
            className="flex items-center gap-2 text-white mb-4 hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-2">{selectedNight.theme}</h2>
            <p className="text-gray-300 mb-4">{selectedNight.date}</p>
            <div className="text-2xl font-bold text-yellow-400">
              🏆 {winnerMovie?.title}
            </div>
          </div>

          {!userReview && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Rate the Movie</h3>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => {
                    const comment = prompt('Add a comment (optional):');
                    addReview('up', comment || '');
                  }}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ThumbsUp className="w-6 h-6" />
                  Thumbs Up
                </button>
                <button
                  onClick={() => {
                    const comment = prompt('Add a comment (optional):');
                    addReview('down', comment || '');
                  }}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ThumbsDown className="w-6 h-6" />
                  Thumbs Down
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">
              Reviews ({selectedNight.reviews.length})
            </h3>
            <div className="space-y-4">
              {selectedNight.reviews.map(review => (
                <div key={review.id} className="p-4 bg-white/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    {review.rating === 'up' ? (
                      <ThumbsUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <ThumbsDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-gray-300 text-sm">{review.date}</span>
                  </div>
                  {review.comment && (
                    <p className="text-white">{review.comment}</p>
                  )}
                </div>
              ))}
              {selectedNight.reviews.length === 0 && (
                <p className="text-gray-400 text-center py-4">No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MovieNightApp;