pub type Post {
  Post(id: Int, title: String, summary: String, text: String)
}

// data
pub const posts: List(Post) = [
  Post(
    id: 1,
    title: "The Empty Chair",
    summary: "A guide to uninvited furniture and its temporal implications",
    text: "
      There's an empty chair in my home that wasn't there yesterday. When I sit
      in it, I start to remember things that haven't happened yet. The chair is
      getting closer to my bedroom each night, though I never caught it move.
      Last night, I dreamt it was watching me sleep. This morning, it offered
      me coffee.
    ",
  ),
  Post(
    id: 2,
    title: "The Library of Unwritten Books",
    summary: "Warning: Reading this may shorten your narrative arc",
    text: "
      Between the shelves in the public library exists a thin space where
      books that were never written somehow exist. Their pages change when you
      blink. Forms shifting to match the souls blueprint. Librarians warn
      against reading the final chapter of any unwritten book – those who do
      find their own stories mysteriously concluding. Yourself is just another
      draft to be rewritten.
    ",
  ),
  Post(
    id: 3,
    title: "The Hum",
    summary: "A frequency analysis of the collective forgetting",
    text: "
      The citywide hum started Tuesday. Not everyone can hear it, but those who
      can't are slowly being replaced by perfect copies who smile too widely.
      The hum isn't sound – it's the universe forgetting our coordinates.
      Reports suggest humming back in harmony might postpone whatever comes
      next. Or perhaps accelerate it.
    ",
  ),
]
