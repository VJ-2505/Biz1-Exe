const os = require('os');
const request = require('request');
const app = require("express")();
const httpServer = require("http").createServer(app);
const options = { cors: { origin: '*' } };
const io = require("socket.io")(httpServer, options);
const notifier = require('node-notifier');
const cors = require('cors')
const bodyParser = require('body-parser');
const path = require('path')
const qr = require("qrcode");

const registerOrderHandlers = require("./orderHandler");
// const { loadDatabase, localDB } = require("./databaseHandler")();
const { localDB } = require("../database")();

const onConnection = (socket) => {
    console.log("new connection")
    registerOrderHandlers(io, socket);
    emitUsers(socket)
}

const emitUsers = async (socket) => {
    const sockets = await io.fetchSockets();
    var users = []
    sockets.forEach(sock => {
        users.push({ id: sock.id, data: sock.data, rooms: sock.rooms })
    });
    console.log("emitting users")
    socket.emit("connectedusers", users);
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(cors());

app.get('/checkserverstatus', async (req, res) => {
    const data = { status: 200, message: "server running" }
    res.send(data)
})

app.get('/getusers', async (req, res) => {
    console.log(req.ip)
    const sockets = await io.fetchSockets();
    var users = []
    sockets.forEach(sock => {
        users.push({ id: sock.id, data: sock.data, rooms: sock.rooms })
    });
    res.send({ users: users })
})

app.post('/getdbdata', (req, res) => {
    var returnData = {}, i = 0
    req.body.forEach(dbname => {
        localDB[dbname].loadDatabase()
        localDB[dbname].find({}, function (err, docs) {
            returnData[dbname] = docs
            i++
            if (i == req.body.length) res.send(returnData)
        });
    })
})

app.post('/finddata', (req, res) => {
    const { dbname, findQuery } = req.body
    localDB[dbname].loadDatabase()
    localDB[dbname].find(findQuery, function (err, docs) {
        console.log(err, docs)
        res.send(docs)
    });
})

app.post("/getQrcode", (req, res) => {
    const url = req.body.url;

    // If the input is null return "Empty Data" error
    if (url.length === 0) res.send("Empty Data!");

    // Let us convert the input stored in the url and return it as a representation of the QR Code image contained in the Data URI(Uniform Resource Identifier)
    // It shall be returned as a png image format
    // In case of an error, it will save the error inside the "err" variable and display it

    qr.toDataURL(url, (err, src) => {
        if (err) res.send("Error occured");

        res.send({ imgUrl: src });
        // Let us return the QR code image as our response and set it to be the source used in the webpage
        // res.render("scan", { src });
    });
});

io.on("connection", onConnection);

const start_server = (port, host) => {
    httpServer.close()
    // loadDatabase()
    var server = httpServer.listen(port, host, () => { console.log("http://" + server.address().address + ':' + server.address().port) });
}

const get_addresses = () => {
    let ipAddress = [];
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {//skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {// this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + iface.address);
                ipAddress.push({ address: iface.address, ifname: ifname });
            } else {// this interface has only one ipv4 adress
                console.log(ifname + ':' + iface.address);
                ipAddress.push({ address: iface.address, ifname: ifname });
            }
            ++alias;
        });
    });
    console.log(ipAddress)
    return ipAddress;
}

module.exports = {
    startServer(port, host) {
        start_server(port, host)
    },

    getAvailableAddresses() {
        return get_addresses()
    }
}
var args = process.argv.slice(2)
var ipreg = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

if (args.length >= 2) {
    if (+args[0] < 65535 && ipreg.test(args[1])) {
        start_server(+args[0], args[1])
    } else {
        if (!+args[0] < 65535) {
            console.log("port must be between 0 and 65535")
        }
        if (!ipreg.test(args[1])) {
            console.log("invalid ip address")
        }
    }
} else {
    console.log("local usage: node socketServer.js <PORT> <HOST>")
}
