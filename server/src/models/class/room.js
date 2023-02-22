class Room {
    constructor(userList, maxPlayers = 4, gameTitle = "undefined", isGaming = false) {
        this.userList = userList; // Array
        this.maxPlayers = maxPlayers; // Number
        this.gameTitle = gameTitle; // String
        this.isGaming = isGaming; // Boolean
        this.targetResultCounts = this.userList.length;
        this.gameResult = {};
    }

    setMaxPlayers(maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    getMaxPlayers() {
        return this.maxPlayers;
    }

    setIsGaming(isGaming) {
        this.isGaming = isGaming;
    }

    getIsGaming() {
        return this.isGaming;
    }

    setUserList(userList) {
        this.userList = userList;
    }

    setTargetResultCounts(targetResultCounts) {
        this.targetResultCounts = targetResultCounts;
    }

    getTargetResultCounts() {
        return this.targetResultCounts;
    }

    setGameTitle(gameTitle) {
        this.gameTitle = gameTitle;
    }

    setEmptyResult() {
        this.gameResult[this.gameTitle] = [];
    }

    setGameResult(data) {
        const { socketID, speed } = data;
        if (!(this.gameTitle in this.gameResult)) {
            this.gameResult[this.gameTitle] = [{ socketID: socketID, speed: speed }];
        } else {
            this.gameResult[this.gameTitle].push({
                socketID: socketID,
                speed: speed,
            });
        }
    }

    getGameResult() {
        return this.gameResult[this.gameTitle];
    }

    removeUser(socketID) {
        const idx = this.userList.indexOf(socketID);
        if (idx > -1) this.userList.splice(idx, 1);
    }
}
module.exports = Room;
