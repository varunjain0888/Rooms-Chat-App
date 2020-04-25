const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector("#sendLocation")
const $messages = document.querySelector("#messages")

//Template
const $messagetemplate = document.querySelector('#message-template').innerHTML
const $locationmessagetemplate = document.querySelector('#location-message-template').innerHTML
const $sideBartemplate = document.querySelector('#sidebar-template').innerHTML

//options
const{username, room} = Qs.parse(location.search,{ ignoreQueryPrefix:true })

const autoScroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render($messagetemplate,{
        username:message.username,
        text : message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render($locationmessagetemplate,{
        username:url.username,
        url,
        createdAt: moment(url.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render($sideBartemplate,{
        room,
        users
    })
    console.log(users)
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormInput.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage',message, (error) => {
        $messageFormInput.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered!')
       
    })
})

$sendLocationButton.addEventListener("click", () => {
    if(!navigator.geolocation){
        return alert("Your browser does not support geo location.")
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit("sendLocation",{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude,
        },(error)=>{
            $sendLocationButton.removeAttribute('disabled')
             if(error){
                return console.log(error)
             }
             console.log('Location shared!')   
        })
    })
})


socket.emit('join',{username,room},(error) => {
    if(error){
        console.log("dcsdcsdcsdc>>>>>Erorrrrr")
        alert(error)
        location.href = '/'
    }
})