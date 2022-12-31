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
  
  socket.on("join",(data)=>{
    const {fee,room,socketId,type,username}=data
    if (!rooms.some((roomD) => roomD.roomId === room)) {
      console.log("user joined & It's new Room");
      const roomData={ roomId: room,  users:[socketId],type:type,fee:fee,usernames:[username]} 
      rooms.push(roomData);
      console.log("New room Connected", rooms);
      activeUsers.forEach(element => {
        console.log(element.socketId);
        io.to(element.socketId).emit("added-match-data", roomData)
        console.log(roomData); 
      });
    }
    else{
      const roomData=rooms.filter((roomD)=>roomD.roomId===room)
      console.log("kuchii",roomData[0]?.users)
      if(roomData){
        console.log("koiiii");
        roomData[0]?.users.push(socketId) 
        roomData[0]?.usernames.push(username) 
         console.log(roomData[0]?.users)
         roomData[0]?.users.forEach((element)=>{
          io.to(element).emit("userJoined",roomData)
         })
      }
    }
  }) 

  socket.on("joinPrivate",(data)=>{
    const {fee,room,socketId,type,username}=data
   
    if (!rooms.some((roomD) => roomD.roomId === room)) {
      console.log("user joined & It's new Room");
      const roomData={ roomId: room,  users:[socketId],type:type, fee:fee,usernames:[username]} 
      rooms.push(roomData);
      console.log("New room Connected", rooms);
     
        io.to(socketId).emit("added-match-data-Private", roomData)
        
   
    } 
    else{
      const roomData=rooms.filter((roomD)=>roomD.roomId===room)
      console.log("kuchii",roomData[0]?.users)
      if(roomData){
        console.log("koiiii");
        roomData[0]?.users.push(socketId) 
        roomData[0]?.usernames.push(username)
         console.log(roomData[0]?.users)
         roomData[0]?.users.forEach((element)=>{
          io.to(element).emit("userJoined-Private",roomData)
         })
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
    
    

  
    

     socket.on("Matchcount",(roomId,socketId)=>{
      const roomData=rooms.filter((roomD)=>roomD.roomId===roomId)
        if(roomData){
          io.to(socketId).emit("match-count-data", roomData)
        }else{
          console.log("No room found")
        }
      });
                                             
     
      socket.on("leaveGame",(roomId,socketId)=>{
        console.log(roomId,socketId);
        const roomData=  rooms.filter((o)=>  o.roomId===roomId)
        console.log(roomData);
        const index = roomData[0]?.users.indexOf(socketId);
        if (index > -1) { // only splice array when item is found
          roomData[0]?.users.splice(index, 1); // 2nd parameter means remove one item only
          roomData[0]?.users.forEach((element)=>{

            io.to(element).emit("left-user",roomData[0]?.users)
           })
        }
   
      
      })
       socket.on("UserJoinData",(roomId)=>{
        const roomData=  rooms.filter((o)=>  o.roomId===roomId)
        roomData[0]?.users.forEach((element)=>{
          io.to(element).emit("userJoined",roomData[0]?.users)
         })
       }) 
       
    socket.on("StartGame",(room,draw)=>{
      console.log("Game Started...",draw, room);
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
    socket.on("getRoomData",(socketId,type)=>{
     
     const roomData =rooms.filter((o)=>{
        o.type===type 
        
      })

      io.to(socketId).emit("getDataByFee", roomData[0]?.users)
    
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