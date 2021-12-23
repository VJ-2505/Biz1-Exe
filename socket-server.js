const express = require('express');
const bodyParser = require('body-parser');
const api = express();
const Hapi = require('hapi');
const socketioLib = require('socket.io');
var os = require('os');
var ifaces = os.networkInterfaces();
// app1.use(bodyParser.json({strict: false}));

api.get('/api/ipconfig', (request, response) => response.send({ status: 200, data: { success: 1 }, message: 'ip-available' }));

api.get('/api/authentication', (request, response) => {
    var pin = request;
    response.send("datarecieved");
});

api.get('/', (request, response) => {
    const file = `D:/New folder (3)/Biz1Production/android/app/build/outputs/apk/debug/app-debug.apk`;
    response.download(file);
});

/////
var server;
var isServerRunning = false;
var socketio;
var connectedUsers = [];
var currentRunningIPAddress;

const start = async (ipAddress) => {
    var isError = false;
    try {
        server = Hapi.server({
            host: ipAddress,
            port: 8000
        });
        await server.start();
    }
    catch (err) {
        console.log('server start', err)
        isError = true;
    }

    if (!isError) {
        currentRunningIPAddress = ipAddress;
        isServerRunning = true;
        socketIOConnect();
        console.log('Socket Server running at:', server.info.uri)
    }
};

// Object.keys(ifaces).forEach(function (ifname) {
//     var alias = 0;
// ifaces[ifname].forEach(function (iface) {
//   if ('IPv4' !== iface.family || iface.internal !== false || ifname !== 'Local Area Connection') {
//     console.log(iface);
//     return;
//   }
//   if (alias >= 1) {
//     console.log('alias greater than 1', ifname + ':' + alias, iface.address);
//   } else {
//     console.log(ifname, iface.address);
//     start(iface.address)
//     api.listen(5000, iface.address, () => console.info('Api running on http://' + iface.address + ':5000'));
//   }
//   ++alias;
// });
// console.log(ifaces);
// ifaces[ifname].forEach(function (iface) {
// if (!iface.address.includes('192.168')) {
//   return;
// }
// if ('IPv4' !== iface.family || iface.internal !== false || ifname !== 'Local Area Connection') {
//     console.log(iface);
//     return;
// }

//         console.log(iface);
//         if (alias >= 1) {
//             console.log('alias greater than 1', ifname + ':' + alias, iface.address);
//         } else {
//             console.log(ifname, iface.address);
//             start(iface.address)
//             api.listen(5000, iface.address, () => console.info('Api running on http://' + iface.address + ':5000'));
//         }
//         ++alias;
//     });
// });
const app = require('express')();
const http = require('http').Server(app);
function socketIOConnect() {
    const io = socketioLib(server.listener);
    const documents = [];
    const orders = [];
    var exeroom = '';
    io.on("connection", socket => {
        console.log('new connection!');
        // socket.on("join", room => {
        //   socket.join("3fc85775-cc7d-4c3c-89cb-b4237f47ac06")
        //   socket.on("locData", data => {
        //     socket.broadcast.to(room).emit("locData", data);
        //   })
        //   socket.on("text", txt => {
        //     console.log(socket)
        //     socket.broadcast.to(room).emit("getLocData")
        //   });
        //   socket.on('table-swapped', (settings, toTableName) => {
        //     console.log(settings, toTableName);
        //   });
        //   socket.on('sync-drafts', () => {
        //     socket.broadcast.to("3fc85775-cc7d-4c3c-89cb-b4237f47ac06").emit("sync-drafts");
        //   });
        //   socket.on('order-ticket-created', (settings, orderTicket) => {
        //     socket.broadcast.to("3fc85775-cc7d-4c3c-89cb-b4237f47ac06").emit('order-ticket-created', settings, orderTicket);
        //   });
        // })
        socket.join(socket.client.id);

        socket.on("join", (data) => {
            socket.join(data)
            exeroom = data;
        });

        socket.on("getdiningdata", () => {
            console.log(socket.client.id);
            socket.broadcast.to(exeroom).emit("getdiningdata", socket.client.id)
        });

        socket.on("diningdata", (data, waiter) => {
            console.log(waiter)
            socket.broadcast.to(waiter).emit("diningdata", data);
        });

        socket.on("getproducts", () => {
            console.log('product_event')
            socket.broadcast.to(exeroom).emit("getproducts", socket.client.id)
        });

        socket.on("products", (data, waiter) => {
            console.log('product_data_event')
            socket.broadcast.to(waiter).emit("products", data)
        });

        socket.on("hold/release-table", (data) => {
            console.log('hold/release-table')
            socket.broadcast.to(exeroom).emit("hold/release-table", data)
        });

        socket.on("placingorder", (data) => {
            console.log('placingorder')
            socket.broadcast.to(exeroom).emit("placingorder", data)
        });

        socket.on("neworder", (order) => {
            console.log('order_data_event')
            io.emit("neworder", order)
        });
    });
}
function getAllIPAddress() {
    let ipAddress = [];
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                //skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
                ipAddress.push(iface.address + ' ' + ifname);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                ipAddress.push(iface.address + ' ' + ifname);
            }
            ++alias;
        });
    });
    console.log(ipAddress)
    return ipAddress;
}

module.exports = {
    getServerIpAddress() {
        return getAllIPAddress();
    },

    startServer(ipAddress) {
        if (!isServerRunning || currentRunningIPAddress != ipAddress) {
            this.stopServer();
            start(ipAddress);
        }
    },

    stopServer() {
        if (isServerRunning && server)
            server.stop();
        isServerRunning = false;
        socketIOClose();
        console.log('Socket Server stopped');
    },

    getConnectedUsers() {
        return connectedUsers;
    }
}
start('192.168.1.2');
api.listen(5000, '192.168.1.2', () => console.info('api running'));
// getAllIPAddress();
