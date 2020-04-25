const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genrateMessage,genrateLocationMessage } = require('./utils/messages')
const {addUser, removeUser, getUser,getUsersInRoom} = require('./utils/users')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection' , (socket) => {
    socket.on('join',({username,room},callback) => {
        const  {error, user} = addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',genrateMessage("Admin","Welcome!"))
        socket.broadcast.to(user.room).emit('message',genrateMessage("Admin",`${user.username} has joined the room`))
        
        io.to(user.room).emit('roomData',{
            room : user.room,
            users: getUsersInRoom(user.room)
        })
        console.log("All Uusers ",getUsersInRoom(user.room))
    })

    socket.on('sendMessage', (message,callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        //socket.emit('message',message) // emit to particular connection
        io.to(getUser(socket.id).room).emit('message',genrateMessage(getUser(socket.id).username,message)) // emit to all connection
        callback()
    })

    socket.on("sendLocation", (coords,callback) => {
        io.to(getUser(socket.id).room).emit('locationMessage',genrateLocationMessage(getUser(socket.id).username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})