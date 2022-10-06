const dotenv=require("dotenv")
dotenv.config()
const io = require("socket.io")(process.env.PORT, {
  cors: {
    //   origin: "http://localhost:3000",
  },
});

let activeUsers = [];
let rooms=[]
io.on("connection", (socket) => {
  console.log("connected");
  //join room
  
  socket.on("join",(room,users)=>{
    console.log(room,users)
    if (!rooms.some((roomD) => roomD.roomId === room)) {
      console.log("user joined & It's new Room");
      rooms.push({ roomId: room, socketId: socket.id , users:users});
      console.log("New room Connected", rooms);
    }
    else{
      const roomData=rooms.filter((roomD)=>roomD.roomId===room)
      console.log("kuchii",roomData[0]?.users)
      if(roomData){
        console.log("koiiii");
        roomData[0]?.users.push(users) 
         console.log(roomData[0]?.users)
      }
    }
  })
    // add new User
    socket.on("new-user-add", (newUserId) => {
      // if user is not added previously
      if (!activeUsers.some((user) => user.userId === newUserId)) {
        activeUsers.push({ userId: newUserId, socketId: socket.id });
        console.log("New User Connected", activeUsers);
      }
      // send all active users to new user
      io.emit("get-users", activeUsers);
    });
    
    socket.on("addMatch",(roomId,type,fee)=>{
      activeUsers.forEach(element => {
        console.log(element.socketId);
        io.to(element.socketId).emit("added-match-data", roomId,type,fee)
        console.log(roomId,type,fee);
      });
     })
      
    socket.on("StartGame",(room,users,draw,type)=>{
      console.log("Game Started...",draw, users,room);
      console.log(rooms)
    const roomData=  rooms.filter((o)=>  o.roomId===room)
    // console.log("koii",roomData);
     if(roomData){
      console.log(roomData ,"killadii")
      // const filteredArray = activeUsers.filter(o => roomData.users.some(({userId,socketId}) => o.userId === userId && o.socketId === socketId));
      // console.log("hellooo",filteredArray)  

     
            roomData[0]?.users.forEach((element)=>{
              console.log(element);
                io.to(element).emit("StartedGame", draw);
                console.log("game satrted !!!")
            })
            
      
    
     }else{

        console.log("room not found")

     }
    })
 

    socket.on("claim",(room,username,claimType)=>{
      console.log(room,username,claimType);
    const roomData=  rooms.filter((o)=>  o.roomId===room)      
    
     if(roomData){
 
           roomData[0]?.users.forEach((element)=>{
                io.to(element).emit("claimed", username,claimType);
                console.log("claimed to ",element)
            }) 
            
    
    
     }else{
      
      const message="Not yet claimed"
      console.log(message)
     }
    })
    
    socket.on("finishRoom",(room)=>{
      rooms=rooms.filter((roomData)=>roomData.roomId!==room)
       console.log("rooms disconnected",rooms)
       activeUsers.forEach(element => {
         console.log(element.socketId);
         io.to(element.socketId).emit("finished-match-data", room)
         console.log(room);
       });
 
    })

    socket.on("disconnect", () => {
        // remove user from active users
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        console.log("User Disconnected", activeUsers);
        // send all active users to all users
        io.emit("get-users", activeUsers);

      });
});
console.log("listening",process.env.PORT);