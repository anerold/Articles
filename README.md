### Overview
REST API for creating, listing, editing and deleting articles. The app is writen in NodeJS using express framework and uses MongoDB as its database.
Every article can have multiple tags and every tag can have multiple articles. Connection between articles and tags collections is done via
MongoDB's `_id` value - i.e. every article has array of `_id`s of tags associated with it and every tag has array of `_id`s of articles associated with it.
Tags' names are unique. If creating new article with a tag that already exists in the DB, the app associates this new article with the already existing tag.

By default the app uses `mongodb://localhost:27017/articles` mongo URI but can be changed via cli argument: `node main.js mongodb://path.to.mongodb`

The app runs on port 3000

Only `title` of an article needs to be unique, other values does not.

### Endpoints
## http POST
Used for creating new articles



**Endpoint: `/api/articles`**

Request body: `JSON`

JSON example (all keys are required, tags can be empty array): 

```
{ 
   "title":"ThisIsArticleTitle",
   "description":"Article about something",
   "authorName":"John Johnson",
   "publishDate":"2020-02-06",
   "tags":[ 
      "foo",
      "bar"
   ]
}
```
Response:

`Status: 201 Created, Body: {"message":"Article created"}` if succesfull

`Status: 400 Bad Request, Body: {"message":"Bad Request. Check your JSON input","reason":{"errors":[{"msg":"Invalid value","param":"title","location":"body"}]}}` if malformed request body

`Status: 409 Conflict, Body: {"message":"Article with this title already exists"}` If attempting to create article with title that already exists

## http GET
Used for getting articles and tags



**Endpoint: `/api/articles` for getting list of all article titles**

Response: `Status: 200 Ok`

```
[
    "firt",
    "second",
    "third",
    "4th"
]

```



**Endpoint: `/api/articles/<article title>` for getting one article**

Response: `Status: 200 Ok`
```
{
    "tags": [
        "foo",
        "bar",
        "baz"
    ],
    "title": "first",
    "description": "first article",
    "publishDate": "2019-02-06",
    "authorName": "John Johnson",
    "createdAt": "2020-02-13T10:00:53.524Z"
}
```
Response: `Status: 400 Not Found, Body: {"message":"Not Found"}` if article does not exist



**Endpoint: `/api/tags` for getting list of all tags and articles associated with them**

Response: `Status: 200 Ok`

```
[
    {
        "articles": [
            "first",
            "second",
            "4th"
        ],
        "name": "foo"
    },
    {
        "articles": [
            "first",
            "second"
        ],
        "name": "bar"
    },
    {
        "articles": [
            "first"
        ],
        "name": "baz"
    }
]
```

## http PUT
for editing an article



**Endpoint: `/api/articles/<article title>`**

Request body: `JSON`

JSON example (all keys are optional, provide only those you wish to change):

key `addTags` is for tags you wish to add to the article, key `removeTags` is for tags you wish to remove from the article

```
{ 
   "title":"ThisIsArticleTitle",
   "description":"Article about something",
   "authorName":"John Johnson",
   "publishDate":"2020-02-06",
   "addTags":[ 
      "foo",
      "bar"
   ],
   "removeTags":[
      "baz"
   ]
}
```
Response:

`Status: 200 Ok, Body: {"message":"OK"}` if succesfull

`Status: 404 Not Found, Body: {"message":"Not Found"}` if article does not exist

`Status: 400 Bad Request, Body: {"message":"Bad Request. Check your JSON input","reason":{"errors":[{"msg":"Invalid value","param":"title","location":"body"}]}}` if malformed request body

## http DELETE
for deleting articles



**Endpoint: `/api/articles/<article title>`**

Response:
`Status: 200 Ok, Body: {"message":"OK"}` if succesfull

`Status: 404 Not Found, Body: {"message":"Not Found"}` if article does not exist

## Aditional responses



In adition to responses there are two more for general purpouses:

`Status: 400 Bad Request, Body: {"message":"Bad Request. Check your JSON input","reason":"Input is not a valid JSON"}` if request body is not a valid JSON

`Status: 500 Internal Server Error, Body: {"message":"Internal Server Error"}` if there was some error within the app
