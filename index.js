/*
* Simple HTTP server that listens on port 8080 and responds to /hello route
* with a JSON message. For any other route, it responds with a statuscode of 404
* 
*/


// Dependencies
const http = require('http');
const url = require('url')
const cluster = require('cluster')
const os = require('os')

// container object
const app = {}

// Create http server
app.server = http.createServer((req, res) => {
  // Parse url object
  const parsedUrl = url.parse(req.url, true);
  // Retrieve path property from parsed URL
  const path = parsedUrl.pathname;
  // remove leading or trailing /
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  // select handler to respond with depending on path
  const chosenHandler = trimmedPath === 'hello' ? app.handlers.hello : app.handlers.rest;
  // Call chosen handler 
  chosenHandler((statusCode = 404, message = {}) => {
    // Set header 'content-type' to application/json
    res.setHeader('Content-Type', 'application/json')
    // write statuscode
    res.writeHead(statusCode)
    // send response back to user with message
    res.end(JSON.stringify(message))
  })
})

// Init funciton
app.init = () => {
  // check if current process is master
  if (cluster.isMaster) {
    // If process is master, fork it to take advantage of all cpus in the system
    for (let cores = 0; cores < os.cpus().length; cores++) {
      // create a new fork
      cluster.fork()
    }
  } else {
    // if process is not the master, start Http server and listen on port 8080
    app.server.listen(8080, () => {
      // log process Id and message to console
      console.log(`(${process.pid}): Server listening on port 8080`)
    })
  }
}

// Container for handlers
app.handlers = {};

// hello route handler
app.handlers.hello = cb => cb(200, { 'message': 'Hello World' })

// Handler for the any other route
app.handlers.rest = cb => cb(404)


// Start the application
app.init()