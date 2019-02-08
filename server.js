//server.js
const express = require('express');
const server = express();

server.set('port', process.env.PORT || 3000);

//Basic routes
server.get('/', (req,res)=>{
   res.send('Hixme page');
});

server.get('/persons',(req,res)=>{
   require('./app')(req, res);
});

//Express error handling middleware
server.use((req,res)=>{
   res.type('text/plain');
   res.status(505);
   res.send('Error page');
});

//Binding to a port
server.listen(3000, ()=>{
  console.log('Hixme code exercise server started at port 3000');
});