const Datastore = require('nedb');

var db = {};
db.product = new Datastore({ filename: '../database/product.db', autoload: true });
db.category = new Datastore({ filename: '../database/category.db', autoload: true });
db.orderkey = new Datastore({ filename: '../database/orderkey.db', autoload: true });
db.printersettings = new Datastore({ filename: '../database/printersettings.db', autoload: true });
db.user = new Datastore({ filename: '../database/user.db', autoload: true });
db.loginfo = new Datastore({ filename: '../database/loginfo.db', autoload: true });
db.storeusers = new Datastore({ filename: '../database/storeusers.db', autoload: true });
db.preferences = new Datastore({ filename: '../database/preferences.db', autoload: true });
db.taxgroups = new Datastore({ filename: '../database/taxgroups.db', autoload: true });
db.diningarea = new Datastore({ filename: '../database/diningarea.db', autoload: true });
db.diningtable = new Datastore({ filename: '../database/diningtable.db', autoload: true });
db.discountrule = new Datastore({ filename: '../database/discountrule.db', autoload: true });
db.additionalcharges = new Datastore({ filename: '../database/additionalcharges.db', autoload: true });
db.ordertype = new Datastore({ filename: '../database/ordertype.db', autoload: true });
db.customers = new Datastore({ filename: '../database/customers.db', autoload: true });
db.paymenttypes = new Datastore({ filename: '../database/paymenttypes.db', autoload: true });
db.kotgroups = new Datastore({ filename: '../database/kotgroups.db', autoload: true });
db.orderstatus = new Datastore({ filename: '../database/orderstatus.db', autoload: true });
db.preorders = new Datastore({ filename: '../database/preorders.db', autoload: true });
db.pendingorders = new Datastore({ filename: '../database/pendingorders.db', autoload: true });
db.tableorders = new Datastore({ filename: '../database/tableorders.db', autoload: true });
db.orderlogs = new Datastore({ filename: '../database/orderlogs.db', autoload: true });
db.transactions = new Datastore({ filename: '../database/transactions.db', autoload: true });
db.stores = new Datastore({ filename: '../database/stores.db', autoload: true });
db.orderstatusbtns = new Datastore({ filename: '../database/orderstatusbtns.db', autoload: true });
db.errorlogs = new Datastore({ filename: '../database/errorlogs.db', autoload: true });
db.transactionlogs = new Datastore({ filename: '../database/transactionlogs.db', autoload: true });
db.ordersaveresponselogs = new Datastore({ filename: '../database/ordersaveresponselogs.db', autoload: true });

module.exports = () => {
    const loadDatabase = () => {
        Object.keys(db).forEach(key => {
            db[key].loadDatabase((data, error) => { });
        })
    };

    const getData = (dbarray) => {
        var returndata = {}
        var i = 0
        dbarray.forEach(dbname => {
            db[dbname].find({}, function (err, docs) {
                console.log(dbname, docs.length)
                returndata[dbname] = docs
                i++
                if (i == dbarray.length) return returndata
            });
        })
    };

    const localDB = db

    return { loadDatabase, getData, localDB }
}