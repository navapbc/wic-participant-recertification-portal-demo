# Application Structure

The application files are:

- **`lowdefy.yaml`:** This is the application entrypoint for lowdefy. It defines important things like homepage, user, authentication, database connections, and pages.
- **`templates/page_template.yml`:** The pages on the staff portal all use the same template. It displays a header bar with logout button, and site titles
- **`pages/login.yml`:** The homepage. Only displays a login form. See [Authentication](#authentication).
- **`pages/recert.yml`:** The main page of the application. See [Recertification](#recertification).
- **`public/`:** Public static assets, like logos.

## Recertification

The staff portal operates by using a [lowdefy Knex connection](https://docs.lowdefy.com/Knex) to connect to the same postgresql database that the participant portal uses.

> Note: Under most production circumstances, two applications using the same database is _not_ a good idea and can lead to terrible race conditions. For our pilot, we determined that this was an acceptable choice because the staff portal only performed read-only operations on the database.

The [KnexRaw request](https://docs.lowdefy.com/connections-and-requests) runs a (somewhat complicated) sql query against the database to render the participant submissions. Generally, it queries: "Give me all submissions for the currently logged in user's WIC local agency and show them most recent to least recent".

### Table: Ag Grid

The returned data is rendered using a [lowdefy Ag-Grid block](https://github.com/lowdefy/blocks-aggrid). All columns are resizable, some columns are sortable, and some columns are filterable. Click on the column header to sort the table by that column. Hover over the column header to reveal the filter button (an icon of three horizontal lines).

The data can be exported to CSV. [`valueGetters`](https://www.ag-grid.com/javascript-data-grid/value-getters/) are used to format the data for CSV (the "real" value of each cell) and [`cellRenderers`](https://www.ag-grid.com/javascript-data-grid/cell-rendering/) are used to format the data for the browser. Both `valueGetters` and `cellRenderers` are formatted using [`_nunjucks`](https://docs.lowdefy.com/_nunjucks) templates.

The submitted date is shown in the timezone of the browser.

### Documents

Files that participants upload to the participant portal are saved in S3. The staff portal uses [presigned urls](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) to allow staff to access those documents. These urls are saved to the database by the participant portal and the staff portal retrieves them with the sql query.

> Note: In an ideal/production solution, these presigned S3 urls should be generated by lowdefy. Lowdefy does actually have support to [create presigned s3 urls](https://docs.lowdefy.com/AWSS3). However, lowdefy v3.23.3 does not support encrypted s3 buckets.

## Authentication

The staff portal is configured to use an OpenID Connect provider for [user authentication](https://docs.lowdefy.com/users-introduction). For our deployment, we used [AWS Cognito](https://aws.amazon.com/cognito). However, any [OpenID Connect provider](https://docs.lowdefy.com/openid-connect) will work. The authentication configuration is handled by:

- **Settings in `lowdefy.yml`**: Tells lowdefy which pages should require OpenID Connect authentication and the OpenID Connect scopes
- **Authentication secrets passed as environment variables:** Passes secrets such as the OpenID Connect client ID and secret to lowdefy. See `.env.example` for the secrets that need to be passed to lowdefy
- **Settings in your OpenID Connect provider:** You'll need to configure the allowed callback urls, allowed logout urls, etc.
- **Login flow in `login.yml`:** Renders a login block that redirects the user to the OpenID Connect provider and handles auto-redirect if a user is already logged in
- **Logout flow in `templates/page_template.yml`:** Renders a logout button that will log out the user when clicked. This button only renders if they are logged in.

> Note: Be sure to configure lowdefy and your OpenID Connect provider so that there is no  caching. Otherwise, a user that clicks log out will be successfully logged out, but when they click login again, they won't be prompted to re-authenticate. This should be handled by the lowdefy [`jwt.expiresIn`](https://docs.lowdefy.com/users-introduction) configuration setting. For security purposes, be sure to test this functionality operates as expected.