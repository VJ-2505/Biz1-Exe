module.exports = (io, socket) => {
    const createOrder = (payload) => {
        socket.broadcast.emit("order:create", payload)
    }

    const updateOrder = (payload) => {
        socket.broadcast.emit("order:update", payload)
    }

    const notifyOrder = (payload) => {
        socket.broadcast.emit("order:notify", payload)
    }

    const tableLock = (payload) => {
        socket.broadcast.emit("table:lock", payload)
    }

    const tableRelease = (payload) => {
        socket.broadcast.emit("table:release", payload)
    }

    const tableSplit = (payload) => {
        console.log(payload)
        socket.broadcast.emit("table:split", payload)
    }

    const tableSwap = (payload) => {
        socket.broadcast.emit("table:swap", payload)
    }

    const tableRemove = (payload) => {
        socket.broadcast.emit("table:remove", payload)
    }

    const tableOrderUpdate = (payload) => {
        socket.broadcast.emit("tableorder:update", payload)
    }

    const tableClear = (payload) => {
        socket.broadcast.emit("order:clear", payload)
    }

    const preorderUpdate = (payload) => {
        socket.broadcast.emit("preorder:update", payload)
    }

    const testEmit = (payload) => {
        console.log("testEmit", payload)
        io.emit("testback", "confirming test success from " + socket.client.id)
    }

    socket.on("order:create", createOrder);
    socket.on("order:update", updateOrder);
    socket.on("order:notify", notifyOrder);
    socket.on("table:lock", tableLock);
    socket.on("table:release", tableRelease);
    socket.on("table:split", tableSplit);
    socket.on("tableorder:update", tableOrderUpdate);
    socket.on("preorder:update", preorderUpdate);
    socket.on("testEmit", testEmit);
    socket.on("order:clear", tableClear);
    socket.on("table:remove", tableRemove);
    socket.on("table:swap", tableSwap);
}