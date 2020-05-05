# The Spark Makerspace Submission Website

## How to set up on a new computer
1. Install node.js
2. Install MongoDB
   1. Create folder `/data/db` (or specify another database location)
   2. Run `mongod` in a terminal (leave this open)
3. Clone repo
4. Run `node server.js` in the repo folder
5. Profit! (On port 8080)

## Description
`server.js` what you run to actually start the whole thing. Sets up a HTTP server on port 8080 to display the website

`app/routes.js` controls what data is sent to the user when they request certain pages, and handles the data the user sends back when they post data to pages.

`app/printing.js` handles everything to do with the database collection for 3D print requests

`app/cnc.js` `app/laser.js` `app/embroidery.js` and `app/otherRequest.js` will handle all the other stuff (not made yet)

`config/passport.js` configures the user authentication system

`config/database.js` really just holds the URL for the database

`views/` holds the ejs files that will be turned into html that the user sees (also includes partials)

`public/` holds the css and js files that the ejs in views needs to reference
