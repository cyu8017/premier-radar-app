import React from "react"

const DEFAULT_PLACEHOLDER_IMAGE =
  "https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_SX300.jpg"

const Movie = ({ movie, onSelect }) => {
  const poster = movie.Poster === "N/A" ? DEFAULT_PLACEHOLDER_IMAGE : movie.Poster
  const movieType = movie.Type ? movie.Type : "Movie"

  return (
    <button
      className="movie-card"
      type="button"
      onClick={() => onSelect && onSelect(movie)}
      aria-label={`Open details for ${movie.Title}`}
    >
      <div className="poster">
        <img
          className="img-rounded"
          alt={`Poster for ${movie.Title}`}
          src={poster}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE }}
        />
      </div>
      <div className="movie-meta">
        <div className="movie-title-block">
          <h3 className="movie-title">{movie.Title}</h3>
          <p className="movie-year">{movie.Year}</p>
        </div>
        <span className="movie-type">{movieType}</span>
      </div>
    </button>
  )
}

export default Movie
