import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import '../App.css';
import Header from './Header';
import Movie from './Movie';
import Search from './Search';

const APP_NAME = 'Premiere Radar'
const API_KEY = '4a3b711b'
const DEFAULT_SEARCH_TERM = '2024'
const MAX_PAGES = 5
const DEFAULT_PLACEHOLDER_IMAGE =
  "https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_SX300.jpg"
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'
const FALLBACK_MOVIES = [
  { Title: 'Inception', Year: '2010', Poster: 'https://m.media-amazon.com/images/M/MV5BMmYxYzAyZTUt.jpg', Type: 'movie', imdbID: 'tt1375666' },
  { Title: 'The Dark Knight', Year: '2008', Poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', Type: 'movie', imdbID: 'tt0468569' },
  { Title: 'Interstellar', Year: '2014', Poster: 'https://m.media-amazon.com/images/M/MV5BNjViNWY3MTMt.jpg', Type: 'movie', imdbID: 'tt0816692' },
  { Title: 'The Matrix', Year: '1999', Poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAt.jpg', Type: 'movie', imdbID: 'tt0133093' },
  { Title: 'Mad Max: Fury Road', Year: '2015', Poster: 'https://m.media-amazon.com/images/M/MV5BMjI4NDY5NTk0OF5BMl5BanBnXkFtZTgwODczMDE1NTE@._V1_SX300.jpg', Type: 'movie', imdbID: 'tt1392190' }
]

const initialState = {
  loading: true,
  movies: [],
  errorMessage: null
}

const reducer = (state, action) => {
  switch (action.type) {
    case "SEARCH_MOVIES_REQUEST":
      return {
        ...state,
        loading: true,
        movies: [],
        errorMessage: null
      }
    case "SEARCH_MOVIES_SUCCESS":
      return {
        ...state,
        loading: false,
        movies: action.payload
      }
    case "APPEND_MOVIES_SUCCESS":
      return {
        ...state,
        loading: false,
        movies: [...state.movies, ...action.payload]
      }
    case "SEARCH_MOVIES_FAILURE":
      return {
        ...state,
        loading: false,
        movies: [],
        errorMessage: action.error
      }
    default:
      return state
  }
}

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [movieDetails, setMovieDetails] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [songsError, setSongsError] = useState(null)
  const [actorPhotos, setActorPhotos] = useState({})
  const [searchTerm, setSearchTerm] = useState(DEFAULT_SEARCH_TERM)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef(null)
  const { movies, errorMessage, loading } = state
  useEffect(() => {
    document.title = `${APP_NAME} | Fresh Movies`
  }, [])

  const fetchPage = useCallback(async (term, pageNumber) => {
    const response = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&page=${pageNumber}&apikey=${API_KEY}`
    )
    const jsonResponse = await response.json()

    if (jsonResponse.Response !== 'True' || !jsonResponse.Search) {
      throw new Error(jsonResponse.Error || 'No movies found.')
    }

    const sortedResults = jsonResponse.Search.sort((a, b) => {
      const yearA = parseInt(a.Year, 10) || 0
      const yearB = parseInt(b.Year, 10) || 0
      return yearB - yearA
    })

    const total = parseInt(jsonResponse.totalResults, 10) || sortedResults.length
    const pageHasMore =
      pageNumber < MAX_PAGES &&
      jsonResponse.Search &&
      jsonResponse.Search.length === 10 &&
      pageNumber * 10 < total

    return {
      results: sortedResults,
      total,
      hasMore: pageHasMore
    }
  }, [])

  const search = useCallback(async (searchValue) => {
    if (!searchValue || !searchValue.trim()) {
      dispatch({
        type: "SEARCH_MOVIES_FAILURE",
        error: "Enter a movie title to search."
      })
      return
    }
    const trimmed = searchValue.trim()
    setSearchTerm(trimmed)
    setPage(1)
    setTotalResults(0)
    setHasMore(true)

    dispatch({ type: "SEARCH_MOVIES_REQUEST" })

    try {
      const { results, total, hasMore: pageHasMore } = await fetchPage(trimmed, 1)
      setTotalResults(total)
      setPage(1)
      setHasMore(pageHasMore)

      dispatch({
        type: "SEARCH_MOVIES_SUCCESS",
        payload: results
      })
    } catch (err) {
      const isNetworkError = err.message.toLowerCase().includes('failed to fetch')
      dispatch({
        type: "SEARCH_MOVIES_FAILURE",
        error: isNetworkError ? "Network issue fetching movies. Showing fallback picks." : err.message
      })

      if (isNetworkError) {
        setSearchTerm(searchValue)
        setTotalResults(FALLBACK_MOVIES.length)
        setPage(1)
        dispatch({
          type: "SEARCH_MOVIES_SUCCESS",
          payload: FALLBACK_MOVIES
        })
      }
    }
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isFetchingMore) return
    const hasMore = totalResults === 0 || state.movies.length < totalResults
    if (!searchTerm || !hasMore) return
    const nextPage = page + 1
    try {
      setIsFetchingMore(true)
      const { results, hasMore: pageHasMore } = await fetchPage(searchTerm, nextPage)
      if (!results.length) {
        setHasMore(false)
        return
      }
      dispatch({
        type: "APPEND_MOVIES_SUCCESS",
        payload: results
      })
      setHasMore(pageHasMore)
      setPage(nextPage)
    } catch (err) {
      // ignore pagination errors
    } finally {
      setIsFetchingMore(false)
    }
  }, [dispatch, fetchPage, isFetchingMore, page, searchTerm, state.movies.length, totalResults])

  useEffect(() => {
    search(DEFAULT_SEARCH_TERM)
  }, [search])

  useEffect(() => {
    if (!hasMore || !state.movies.length) return
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (
          entry.isIntersecting &&
          hasMore &&
          !loading &&
          !isFetchingMore
        ) {
          loadMore()
        }
      },
      { root: null, rootMargin: '0px', threshold: 1 }
    )

    const current = loadMoreRef.current
    if (current) observer.observe(current)

    return () => {
      if (current) observer.unobserve(current)
    }
  }, [loadMore, hasMore, loading, isFetchingMore, state.movies.length])

  const fetchMovieDetails = async (movie) => {
    if (!movie || !movie.imdbID) {
      setDetailError("No details available for this title.")
      return
    }

    setDetailLoading(true)
    setDetailError(null)
    setMovieDetails(null)

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?i=${movie.imdbID}&plot=full&apikey=${API_KEY}`
      )
      const jsonResponse = await response.json()

      if (jsonResponse.Response !== 'True') {
        throw new Error(jsonResponse.Error || "Could not load details.")
      }

      setMovieDetails(jsonResponse)
      fetchSongsForMovie(jsonResponse.Title || movie.Title)
      fetchActorPhotos(jsonResponse.Actors)
    } catch (err) {
      setDetailError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchSongsForMovie = async (title) => {
    if (!title) return
    setSongsLoading(true)
    setSongsError(null)
    setSongs([])

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(title + ' soundtrack')}&entity=song&limit=6`
      )
      const jsonResponse = await response.json()

      if (!jsonResponse.results || !jsonResponse.results.length) {
        throw new Error("No songs found for this title.")
      }

      const parsedSongs = jsonResponse.results.map((s) => ({
        id: s.trackId,
        name: s.trackName,
        artist: s.artistName,
        appleUrl: s.trackViewUrl,
      }))

      setSongs(parsedSongs)
    } catch (err) {
      setSongsError(err.message)
    } finally {
      setSongsLoading(false)
    }
  }

  const buildAvatarFallback = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1b3a&color=fff`

  const fetchActorPhotos = async (actorsString) => {
    setActorPhotos({})
    if (!actorsString) return
    const names = actorsString
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
    if (!names.length) return
    if (!TMDB_API_KEY) {
      const fallbackMap = {}
      names.forEach((name) => {
        fallbackMap[name] = buildAvatarFallback(name)
      })
      setActorPhotos(fallbackMap)
      return
    }

    const resultMap = {}
    try {
      await Promise.all(
        names.map(async (name) => {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`
            )
            const data = await res.json()
            if (data && data.results && data.results[0] && data.results[0].profile_path) {
              resultMap[name] = `${TMDB_IMAGE_BASE}${data.results[0].profile_path}`
            } else {
              resultMap[name] = buildAvatarFallback(name)
            }
          } catch (err) {
            resultMap[name] = buildAvatarFallback(name)
          }
        })
      )
    } finally {
      setActorPhotos(resultMap)
    }
  }

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie)
    setDrawerOpen(true)
    fetchMovieDetails(movie)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDetailError(null)
  }

  const buildSongLinks = (song) => {
    const query = encodeURIComponent(`${song.name || ''} ${song.artist || ''}`.trim())
    return {
      spotify: `https://open.spotify.com/search/${query}`,
      apple: song.appleUrl || `https://music.apple.com/us/search?term=${query}`,
      ytMusic: `https://music.youtube.com/search?q=${query}`,
      tidal: `https://listen.tidal.com/search?q=${query}`,
      pandora: `https://www.pandora.com/search/${query}/all`,
    }
  }

  const activeDetails = movieDetails || selectedMovie
  const actorList =
    activeDetails && activeDetails.Actors
      ? activeDetails.Actors.split(',')
          .map((a) => a.trim())
          .filter(Boolean)
          .map((name) => ({
            name,
            role: 'Character not provided by the API',
            photo: actorPhotos[name] || buildAvatarFallback(name),
          }))
      : []

  return (
    <div className="App">
      <Header text={APP_NAME} />
      <main className="app-shell container-fluid">
        <Search
          search={search}
        />
        <p className="App-intro">Find something to watch!.</p>
        <div className="movies">
          {loading && !errorMessage ? (
            <span className="subtle-text">Loading fresh titles...</span>
          ) : errorMessage ? (
            <div className="error-overlay">
              <div className="error-card">
                <p className="error-title">Request limit reached!</p>
                <p className="error-subtext">Please wait a moment and try again.</p>
              </div>
            </div>
          ) : movies && movies.length ? (
            movies.map((movie, index) => (
              <Movie
                key={movie.imdbID || `${index} - ${movie.Title}`}
                movie={movie}
                onSelect={handleMovieSelect}
              />
            ))
          ) : (
            <div className="emptyMessage">
              <p>No movies yet.</p>
              <p className="subtle-text">Try another search term.</p>
            </div>
          )}
        </div>
        <div ref={loadMoreRef} className="scroll-sentinel" aria-hidden="true">
          {isFetchingMore && <span className="subtle-text">Loading more...</span>}
        </div>
      </main>
      <footer className="app-footer">
        <div className="footer-inner">
          <span>Powered by OMDb & iTunes Search</span>
          <span>{APP_NAME} · React App</span>
        </div>
      </footer>
      <div className={`drawer-overlay ${drawerOpen ? 'show' : ''}`} onClick={closeDrawer} />
      <section className={`movie-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-handle" />
        <button type="button" className="drawer-close" onClick={closeDrawer} aria-label="Close details">
          ×
        </button>
        {detailLoading && <p className="subtle-text">Loading details...</p>}
        {detailError && <p className="errorMessage">{detailError}</p>}
        {!detailLoading && !detailError && activeDetails && (
          <div className="drawer-content">
            <div className="drawer-left">
              <div className="drawer-poster">
                <img
                  src={activeDetails.Poster && activeDetails.Poster !== 'N/A' ? activeDetails.Poster : DEFAULT_PLACEHOLDER_IMAGE}
                  alt={`Poster for ${activeDetails.Title}`}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE }}
                />
              </div>
            </div>
            <div className="drawer-middle">
              <div className="drawer-meta">
                <p className="drawer-tag">{activeDetails.Type || 'Movie'}</p>
                <h3 className="drawer-title">{activeDetails.Title}</h3>
                <p className="drawer-subtitle">
                  {activeDetails.Year} · {activeDetails.Runtime || 'Runtime N/A'} · {activeDetails.Rated || 'Rating N/A'}
                </p>
                <p className="drawer-subtitle">{activeDetails.Genre || 'Genre N/A'}</p>
                <p className="drawer-section"><strong>Director:</strong> {activeDetails.Director || 'N/A'}</p>
              </div>
              <div className="drawer-plot-block">
                <div className="drawer-section">
                  <strong>Plot:</strong>
                  <p className="drawer-plot-text">{activeDetails.Plot || 'N/A'}</p>
                </div>
                <p className="drawer-section"><strong>Awards:</strong> {activeDetails.Awards || 'N/A'}</p>
                <p className="drawer-section"><strong>IMDb:</strong> {activeDetails.imdbRating || 'N/A'}</p>
              </div>
              <aside className="drawer-actors drawer-panel">
                <div className="drawer-songs-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 21c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Actors</span>
                </div>
                {actorList.length === 0 ? (
                  <p className="subtle-text">Actors not available</p>
                ) : (
                  <ul className="actor-list">
                    {actorList.map((actor) => (
                      <li key={actor.name}>
                        <div className="actor-avatar-wrap">
                          <img
                            src={actor.photo}
                            alt={actor.name}
                            className="actor-avatar"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = buildAvatarFallback(actor.name)
                            }}
                          />
                        </div>
                        <div className="actor-text">
                          <span className="actor-name">{actor.name}</span>
                          <span className="actor-role">{actor.role}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
            <aside className="drawer-songs drawer-panel">
                <div className="drawer-songs-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18V5.5L20 3v12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="18" cy="15" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>Songs</span>
                </div>
                {songsLoading && <p className="subtle-text">Loading soundtrack...</p>}
                {!songsLoading && songsError && (
                  <p className="subtle-text">Songs unavailable: {songsError}</p>
                )}
                {!songsLoading && !songsError && songs.length === 0 && (
                  <p className="subtle-text">Not available from the API</p>
                )}
                {!songsLoading && !songsError && songs.length > 0 && (
                  <ul className="song-list">
                    {songs.map((song) => {
                      const links = buildSongLinks(song)
                      return (
                        <li key={song.id || song.name}>
                          <div className="song-main">
                            <span className="song-title">{song.name}</span>
                            <span className="song-artist">{song.artist}</span>
                          </div>
                          <div className="song-links">
                            <a href={links.spotify} target="_blank" rel="noreferrer">Spotify</a>
                            <a href={links.ytMusic} target="_blank" rel="noreferrer">YT Music</a>
                            <a href={links.apple} target="_blank" rel="noreferrer">Apple</a>
                            <a href={links.tidal} target="_blank" rel="noreferrer">Tidal</a>
                            <a href={links.pandora} target="_blank" rel="noreferrer">Pandora</a>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </aside>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
