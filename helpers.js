const generateUserHelpers = (urlDatabase, users) => {
  const generateRandomString = (size) => {
    return Math.random().toString(36).substr(2, size);
  };
  
  const getUserByEmail = (email) => {
    for (let user in users) {
      if (users[user].email === email) {
        return users[user];
      }
    }
  };
  
  const getUrlsForUser = (id) => {
    const filteredURLs = {};
    for (let shortURL in urlDatabase) {
      if (urlDatabase[shortURL].userID === id) {
        filteredURLs[shortURL] = urlDatabase[shortURL];
      }
    }
    return filteredURLs;
  };
  
  return {
    generateRandomString,
    getUserByEmail,
    getUrlsForUser,
  };
};

module.exports = generateUserHelpers;