import React, { useState } from "react"

const Search = ({ search }) => {
  const [searchValue, setSearchValue] = useState("")
  const handleSearchInputChanges = (e) => setSearchValue(e.target.value)
  const resetInputField = () => setSearchValue("")
  const callSearchFunction = (e) => {
    e.preventDefault()
    search(searchValue)
    resetInputField()
  }

  return (
    <form className="search" onSubmit={callSearchFunction}>
      <input
        value={searchValue}
        onChange={handleSearchInputChanges}
        type="search"
        placeholder="Search by title, actor, or year"
        aria-label="Search movies"
      />
      <button type="submit">Search</button>
    </form>
  )
}

export default Search
