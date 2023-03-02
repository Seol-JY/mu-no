const ReactionData = require("../../models/class/reactionData");
const User = require("../../models/schemas/user");
const Reaction = require("../../models/schemas/reaction");

module.exports = (io, socket, roomList, getUsersInfo) => {
    const playGame = (roomID) => {
        const randomTime = Math.floor(Math.random() * 3000 + 4000);
        io.to(roomID).emit("reaction-game-round-start", { randomTime: randomTime });
    };

    const endGame = (roomID) => {
        roomList[roomID].setIsGaming(false);
        const gameResult = roomList[roomID].gameData.getGameResult();
        io.to(roomID).emit("reaction-game-end", { gameResult: gameResult });
    };

    socket.on("reaction-store-data", async ({ gameResult }) => {
        try {
            const user = await User.findOne({ nickname: socket.nickname });
            const reactionId = user.reactionResult;

            await Reaction.updateOne(
                { _id: reactionId },
                {
                    $inc: {
                        rank_avg: 0,
                        num_people_together_avg: 0,
                        click_speed_avg: gameResult[socket.id].click_speed_avg,
                        foul_count_avg: 0,
                        total_games: 0,
                    },
                }
            );
        } catch {
            console.log("database store error");
        }
    });

    socket.on("reaction-selected", ({ roomID }) => {
        const room = roomList[roomID];
        const userLength = room.getUserList().length;

        room.setIsGaming(true);
        room.gameData = new ReactionData("reaction", userLength);
        room.gameData.setInitResult(room.getUserList());

        io.to(roomID).emit("reaction-selected");
    });

    socket.on("reaction-game-user-result", ({ roomID, speed }) => {
        const reactionData = roomList[roomID].gameData;
        const targetResultCounts = reactionData.getTargetResultCounts();
        reactionData.setGameResult({ socketID: socket.id, speed: speed });

        const gameResult = reactionData.getGameRoundResult();
        if (gameResult.length !== targetResultCounts) return;

        const slowestUser = gameResult.reduce((prev, value) => {
            return prev.speed >= value.speed ? prev : value;
        });
        io.sockets.sockets.get(slowestUser.socketID).isAlive = false;

        const roundResult = gameResult.map((result) => {
            return {
                ...result,
                isAlive: getUsersInfo(roomID).filter((user) => user.socketID === result.socketID)[0]
                    .isAlive,
            };
        });
        io.to(roomID).emit("reaction-game-round-result", {
            getGameResult: roundResult,
        });
    });

    socket.on("reaction-game-next-round", ({ roomID, last }) => {
        const reactionData = roomList[roomID].gameData;
        const targetResultCounts = reactionData.getTargetResultCounts();

        const lastResultCounts = last ? 1 : 2;
        reactionData.emptyResult();

        if (targetResultCounts <= lastResultCounts) {
            endGame(roomID);
        } else {
            let die = 0;
            getUsersInfo(roomID).forEach((user) => {
                if (!user.isAlive) die++;
            });
            reactionData.setTargetResultCounts(roomList[roomID].getUserList().length - die);
            playGame(roomID);
        }
    });

    socket.on("reaction-game-ready", ({ roomID }) => {
        socket.isReady = !socket.isReady;
        const userList = getUsersInfo(roomID);
        let allReady = true;
        userList.forEach((user) => {
            if (!user.isReady) {
                allReady = false;
            }
        });

        if (allReady) {
            playGame(roomID);
        }
    });
};
