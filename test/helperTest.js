const { assert } = require('chai');

const generateUserHelpers = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

const {
  getUserByEmail,
  getUrlsForUser
} = generateUserHelpers(testUrlDatabase, testUsers);

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.deepEqual(user, testUsers[expectedUserID]);
  });
  it('should return undefined if user with invalid email', () => {
    const user = getUserByEmail("woodsman@twinpeaks.com", testUsers);
    const expectedUser = undefined;
    assert.deepEqual(user, expectedUser);
  });
});

describe('getUrlsForUser', () => {
  it('should return all Urls for given user ID', () => {
    const urls = getUrlsForUser('userRandomID');
    const expectedUrls = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "userRandomID"
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: "userRandomID"
      }
    };
    assert.deepEqual(urls, expectedUrls);
  });
  it('should return an empty object for non-existent user ID', () => {
    const urls = getUrlsForUser('woodsman');
    const expectedUrls = {};
    assert.deepEqual(urls, expectedUrls);
  });
});