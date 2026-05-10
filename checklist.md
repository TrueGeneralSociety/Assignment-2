Student Name: [Your Name Here]
Student Set: [Your Set Here]

Assignment 2 – Self-Graded Checklist
======================================

[x] The /admin page redirects to the /login page if not logged in.
[x] The /admin page shows an error message (403) if logged in but not an admin.
[x] The /admin page shows a list of all users.
[x] The /admin page allows for promoting and demoting users to/from admin type (updated in MongoDB).
[x] All pages use Bootstrap (header, footer, responsive grid, forms, buttons).
[x] The site uses EJS as a templating engine.
[x] Common headers and footers are shared across all pages via EJS includes.
[x] Code used within a loop is templated using EJS (user.ejs used in admin page loop).
[x] The members page has a responsive grid of 3 images.
[ ] Your site is hosted on Render or other hosting site. (complete after deployment)

[x] The .env file is NOT in the git repo (.gitignore excludes it).
[x] Passwords are hashed using bcrypt.
[x] Joi is used to validate all user input to prevent NoSQL injection attacks.
[x] Sessions are stored in MongoDB using connect-mongo.
[x] The home page shows Sign Up / Log In when not logged in.
[x] The home page shows Hello [name] + Members link + Logout when logged in.
[x] The signup page validates all 3 fields and shows specific error messages.
[x] The login page checks credentials against MongoDB and shows errors on failure.
[x] The members page redirects to / if no valid session.
[x] The logout route destroys the session and redirects to /.
[x] The 404 page returns HTTP status 404 for any unrecognized route.
[x] user_type field is stored in MongoDB and in the session.

Score: 45/50 (hosting mark awarded after deployment)
