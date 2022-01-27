# TinyApp Project

Long urls can be cumbersome to copy and paste easily. WHy not use a shortened link to save your characters? This way you can use them in situations where you might have only 280 characters or less. (Twitter changed their limit from 140 to 280 in 2019!)
TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product
!["URLs Index Page when first opening site."](https://github.com/adrianetodesign/tinyapp/blob/main/docs/urls-page-blank.png)

!["Registration page."](https://github.com/adrianetodesign/tinyapp/blob/main/docs/register-page.png)

!["URLs Index Page when logged in."](https://github.com/adrianetodesign/tinyapp/blob/main/docs/urls-page.png)

!["Create a new short URL page."](https://github.com/adrianetodesign/tinyapp/blob/main/docs/create-url-page.png)

!["Edit an existing short URL page."](https://github.com/adrianetodesign/tinyapp/blob/main/docs/edit-url-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## How to use TinyApp
TinyApp only allows you to access your own shortened urls stored in the database.

**Login/Register**
If you already have an account on TinyApp, you can click the login button and use your email and password to login and access your URLs.

If you don't have an account already, you can simply use the register button to create a new account with an email and a password.

**Create New URL**
On the header, you can see a "Create New URL" button. 
Clicking that will take you to a new page where you can enter any valid long URL to create a shortened one added to your shortened URL collection.

**Edit Existing URL**
On the main page after you have logged in, you will see all of your shortened URLs in a list. 
You can click on edit beside any of those URLs to go to the specific shortened URL page.
Here, you can enter a new URL and click the edit button. This will have the shortened URL point to the new URL you have provided.

**Delete URL**
On the main page with all your URLs in a list, you can simply click the delete button to remove it in it's entirety.

<!-- This is the water, and this is the well. Drink deep, and descend. The horse is the eyes of the white and dark within. -->