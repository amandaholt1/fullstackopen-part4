const dummy = () => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null;
  return blogs.reduce((fav, blog) => (blog.likes > fav.likes ? blog : fav));
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null;

  const authorCounts = {};

  blogs.forEach((blog) => {
    authorCounts[blog.author] = (authorCounts[blog.author] || 0) + 1;
  });

  let maxAuthor = null;
  let maxBlogs = 0;

  for (const author in authorCounts) {
    if (authorCounts[author] > maxBlogs) {
      maxAuthor = author;
      maxBlogs = authorCounts[author];
    }
  }

  return {
    author: maxAuthor,
    blogs: maxBlogs,
  };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null;

  const likesByAuthor = {};

  blogs.forEach((blog) => {
    likesByAuthor[blog.author] = (likesByAuthor[blog.author] || 0) + blog.likes;
  });

  let topAuthor = null;
  let maxLikes = 0;

  for (const author in likesByAuthor) {
    if (likesByAuthor[author] > maxLikes) {
      topAuthor = author;
      maxLikes = likesByAuthor[author];
    }
  }

  return {
    author: topAuthor,
    likes: maxLikes,
  };
};


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
