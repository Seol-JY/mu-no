const Room = require("../../models/class/room");

module.exports = (io, socket, roomList, getUserList) => {
    socket.on("create-room", (done) => {
        const roomID = new Date().getTime().toString(36);

        socket.admin = true;
        socket.join(roomID);

        const RoomObj = new Room(getUserList(roomID));
        roomList[roomID] = RoomObj;

        done(roomID);
    });

    socket.on("join-room", ({ nickname, userColor, roomID }, done) => {
        const isValidRoom = roomID in roomList;

        if (isValidRoom) {
            const isGaming = roomList[roomID].getIsGaming();
            if (isGaming) {
                socket.emit("already-gaming", isGaming);
            }

            const maxPlayers = roomList[roomID].getMaxPlayers();
            const isFull = roomList[roomID].getUserList().length == maxPlayers;
            if (isFull) {
                socket.emit("already-full", isFull);
            }

            if (!socket.admin) socket.join(roomID);

            if (!socket.admin) socket.admin = false;
            socket.nickname = nickname;
            socket.userColor = userColor;
            socket.isReady = false;

            const targetRoom = roomList[roomID];
            const userList = getUserList(roomID);

            targetRoom.setUserList(userList);
            io.to(roomID).emit("user-list", userList);
        }
        done(isValidRoom);
    });

    socket.on("set-max-players", ({ roomID, maxPlayers }, done) => {
        roomList[roomID].setMaxPlayers(maxPlayers);
        done(roomList[roomID].getMaxPlayers());
    });

    socket.on("disconnect", ({ roomID }, done) => {
        // TODO: room ID 넘겨 받기
        if (roomID !== undefined) {
            if (socket.admin) socket.admin = false;
            socket.leave(roomID);
            const userList = getUserList(roomID);
            io.to(roomID).emit("user-list", userList);
        }
    });
};
