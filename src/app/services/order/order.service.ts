import { Injectable } from '@angular/core'
import {
  CustomerModule,
  KOTModule,
  OrderModule,
  Transaction,
} from 'src/app/pages/apps/order/order.module'
import { AuthService } from 'src/app/auth.service'
import { SyncService } from '../sync/sync.service'
import { PrintService } from '../print/print.service'
import * as moment from 'moment'
import * as _ from 'lodash'
import { Settings } from '../waiter/helper.module'
import { EventService } from '../event/event.service'

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  loginfo
  printersettings
  diningAreas = []
  diningTables = []

  item_options = { quantity: 0, key: '' }
  orderkey = { orderno: 1, kotno: 1, timestamp: 0, GSTno: '' }

  constructor(
    private auth: AuthService,
    private sync: SyncService,
    private printservice: PrintService,
    private eventS: EventService,
  ) {
    this.getData()
  }
  // newTableOrder(payload: Payload) {
  //   var order = new OrderModule(payload.OrderTypeId)
  //   order.UserId = payload.UserId
  //   order.DeliveryDateTime = payload.DeliveryDateTime
  //   order.Transactions = payload.Transactions
  //   order.CustomerDetails = payload.CustomerDetails
  //   payload.Items.forEach(itm => {
  //     this.item_options.quantity = itm.Quantity
  //     order.additem(itm, this.item_options)
  //     this.item_options.quantity = 0
  //   })
  //   var table = this.diningTables.filter(x => x.TableKey == order.diningtablekey)[0]
  //   var area = this.diningAreas.filter(x => x.Id == table.DiningAreaId)[0]
  //   order.OrderName = `DI/${area.DiningArea}/` + table.TableName
  //   this.savetblorder(order)
  // }
  onOrderCreate(payload: Payload) {
    var order = new OrderModule(payload.OrderTypeId)
    order.UserId = payload.UserId > 0 ? payload.UserId : null
    order.DeliveryDateTime = payload.DeliveryDateTime
    order.Transactions = payload.Transactions
    order.CustomerDetails = payload.CustomerDetails
    order.DiningTableId = payload.DiningTableId
    order.diningtablekey = payload.DiningTableKey
    order.app = 'waiter-app'
    order.appversion = '0.1.0'
    payload.Items.forEach(itm => {
      this.item_options.quantity = itm.Quantity
      itm.isorderitem = false
      order.additem(itm, this.item_options)
      this.item_options.quantity = 0
    })
    if (payload.OrderTypeId == 1) {
      console.log(order.DiningTableId, this.diningTables)
      var table = this.diningTables.filter(x => x.Id == order.DiningTableId)[0]
      var area = this.diningAreas.filter(x => x.Id == table.DiningAreaId)[0]
      order.OrderName = `DI/${area.DiningArea}/` + table.TableName
      this.savetblorder(order)
    } else {
      this.saveorder(order)
    }
  }
  // :PayerErrors
  onOrderUpdate(payload: Payload) {
    var order: OrderModule = new OrderModule(payload.OrderTypeId)
    this.auth.getpreorderby_id(payload._id).subscribe(data => {
      for (var k in data) order[k] = data[k]
      order.CustomerDetails = payload.CustomerDetails
      order.DeliveryDateTime = payload.DeliveryDateTime
      payload.Items.forEach(itm => {
        if (order.Items.some(x => x.ProductKey == itm.ProductKey)) {
          var index = order.Items.findIndex(x => x.ProductKey == itm.ProductKey)
          order.Items[index] = itm
        } else {
          this.item_options.quantity = itm.Quantity
          order.additem(itm, this.item_options)
        }
        // this.item_options.quantity = 0
      })
      order.setbillamount()
      order = this.generatekot(order)
      order.status = 'P'
      order.datastatus = 'edit_order'
      order.setrefid()
      this.auth.updatepreorders(order).subscribe(data => {
        this.sync.sync()
        // this.clearorder(this.order.OrderTypeId)
      })
    })
  }

  getOrder(_id, ordertypeid) {
    var order: OrderModule
    if (ordertypeid == 1) {
    }
    return order
  }

  updateorderno() {
    this.orderkey.orderno++
    localStorage.setItem('orderkey', JSON.stringify(this.orderkey))
    this.auth.updateorderkey(this.orderkey).subscribe(data => {})
  }

  updatekotno() {
    this.orderkey.kotno++
    localStorage.setItem('orderkey', JSON.stringify(this.orderkey))
    this.auth.updateorderkey(this.orderkey).subscribe(data => {})
  }

  cleartableorder(tablekey) {
    this.auth.deletetblorder(tablekey).subscribe(data => {
      this.eventS.emitNotif({ waiterorder: 'TABLEORDER' })
    })
  }

  swapTblOrder(fromtablekey, totablekey) {
    // const toTable = this.diningtables.filter(x => x.TableKey == totablekey)[0]
    // this.order.diningtablekey = toTable.TableKey
    // this.order.DiningTableId = toTable.Id
    // this.auth.deletetblorder(fromtablekey).subscribe(data => {
    //   this.savetblorder()
    //   // this.waiterS.waiterSocket.emit('tableorder:update', tablekey)
    //   // this.gettblorders()
    // })
    this.auth.swapTableOrders(fromtablekey, totablekey).subscribe(data => {
      this.eventS.emitNotif({ waiterorder: 'TABLEORDER' })
    })
  }

  savetblorder(order) {
    if (order.OrderTypeId == 1) {
      // this.auth.
      this.auth.savetblorder(order).subscribe(data => {
        this.eventS.emitNotif({ waiterorder: 'TABLEORDER' })
        this.getData()
      })
    }
  }

  generatekot(order: OrderModule) {
    var groupeditems = _.mapValues(
      _.groupBy(
        order.Items.filter(x => x.Quantity + x.ComplementryQty - x.kotquantity != 0),
        'KOTGroupId',
      ),
    )
    console.log(order.Items, groupeditems)
    Object.keys(groupeditems).forEach(key => {
      order.addkot(groupeditems[key], this.orderkey.kotno)
      this.updatekotno()
    })
    if (order.OrderNo == 0) {
      order.OrderNo = this.orderkey.orderno
      order.InvoiceNo = this.loginfo.StoreId + moment().format('YYYYMMDD') + '/' + order.OrderNo
      this.updateorderno()
    } else {
      if (!order.changeditems.includes('kot')) order.changeditems.push('kot')
    }
    order.Items = order.Items.filter(x => x.Quantity + x.ComplementryQty != 0)
    order.KOTS.forEach(kot => {
      kot.CreatedDate = moment().format('YYYY-MM-DD hh:mm A')
      kot.ModifiedDate = moment().format('YYYY-MM-DD hh:mm A')
      if (!kot.isprinted) {
        kot.isprinted = true
        if (order.OrderTypeId != 5) this.printkot(order, kot, this.printersettings)
      }
    })
    order.setkotquantity()
    if (order.OrderTypeId == 1) {
      this.savetblorder(order)
    }
    console.log(order.KOTS)
    return order
  }

  getData() {
    this.auth
      .getdbdata(['orderkey', 'loginfo', 'printersettings', 'diningarea', 'diningtable'])
      .subscribe(data => {
        this.orderkey = data['orderkey'][0]
        this.loginfo = data['loginfo'][0]
        this.printersettings = data['printersettings'][0]
        this.diningAreas = data['diningarea']
        this.diningTables = data['diningtable']
        this.orderkeyValidation()
      })
  }

  orderkeyValidation() {
    var todate = new Date().getDate()
    var orderkeydate = new Date(this.orderkey.timestamp).getDate()
    var ls_orderkey = JSON.parse(localStorage.getItem('orderkey'))
    if (ls_orderkey) var ls_orderkeydate = new Date(ls_orderkey.timestamp).getDate()
    var orderkey_obj: any = {}
    if (ls_orderkey && ls_orderkey.timestamp > this.orderkey.timestamp) {
      orderkey_obj = ls_orderkey
    } else {
      orderkey_obj = this.orderkey
    }
    if (new Date(orderkey_obj.timestamp).getDate() != todate) {
      orderkey_obj.kotno = 1
      orderkey_obj.orderno = 1
    }
    orderkey_obj.timestamp = new Date().getTime()
    this.orderkey = orderkey_obj
    localStorage.setItem('orderkey', JSON.stringify(this.orderkey))
    this.auth.updateorderkey(this.orderkey).subscribe(d => {})
  }

  printkot(order, kot: KOTModule, printersettings) {
    var kottemplate = `
    <div id="printelement">
    <div class="header">
    <h3>ORDER TICKET #${kot.KOTNo}</h3>
    <table class="item-table">
    <tbody>
    <tr class="nb">
    <td class="text-left">${order.InvoiceNo}</td>
    <td class="text-right">${order.OrderName}</td>
    </tr>
    <tr class="nb">
    <td class="text-left">Date/Time</td>
    <td class="text-right">${moment(kot.ModifiedDate).format('DD-MM-YYYY / hh:mm A')}</td>
    </tr>
    </tbody>
    </table>
    </div>
    <hr>`
    if (kot.added.length > 0) {
      kottemplate += `
    <div class="text-center">ADDED ITEMS</div>
    <table class="item-table">
    <thead class="nb">
    <th class="text-left">ITEM</th>
    <th class="text-right">QTY</th>
    </thead>
    <tbody>`
      kot.added.forEach(ai => {
        kottemplate += `
    <tr class="nb">
    <td class="text-left">${ai.showname}</td>
    <td class="text-right">+${ai.Quantity}</td>
    </tr>`
      })
      kottemplate += `
    </tbody>
    </table>
    <hr>`
    }
    if (kot.removed.length > 0) {
      kottemplate += `
    <div class="text-center">REMOVED ITEMS</div>
    <table class="item-table">
    <thead class="nb">
    <th class="text-left">ITEM</th>
    <th class="text-right">QTY</th>
    </thead>
    <tbody>`
      kot.removed.forEach(ri => {
        kottemplate += `
    <tr class="nb">
    <td class="text-left">${ri.showname}</td>
    <td class="text-right">(${ri.Quantity})</td>
    </tr>`
      })
      kottemplate += `
    </tbody>
    </table>
    <hr>`
    }
    kottemplate += `
    <hr ${order.Note ? '' : 'hidden'}>
    <div class="text-center" ${order.Note ? '' : 'hidden'}>
    <p>Note: ${order.Note}</p>
    </div>`
    kottemplate += `
    <div class="text-center">
    <p>Powered By Biz1Book.</p>
    </div>
    </div>`
    kottemplate += Settings.receiptStyle
    var printers = []
    if (printersettings) {
      if (printersettings['kotgroups'].some(x => x.KOTGroupId == kot.KOTGroupId)) {
        printers = printersettings['kotgroups'].filter(x => x.KOTGroupId == kot.KOTGroupId)[0]
          .Printers
      } else {
        printers = [printersettings.kotprinter]
      }
      this.printservice.print(kottemplate, printers)
    }
  }

  getavailablesplitid(tableid) {
    console.log(tableid)
    var availablesplitid = 0
    var result = this.diningTables
      .filter(x => x.TableKey.includes('_') && x.TableKey.includes(tableid.toString()))
      .map(function(a) {
        return +a.TableKey.split('_')[1]
      })
    console.log(result)
    var missedarr = []
    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        if (result[i + 1] - result[i] > 1) {
          for (let j = 1; j < result[i + 1] - result[i]; j++) {
            missedarr.push(result[i] + j)
          }
        }
      }
      if (missedarr.length > 0) {
        availablesplitid = missedarr[0] - 1
      } else {
        availablesplitid = result[result.length - 1]
      }
    }
    console.log(availablesplitid)
    return +availablesplitid
    // this.diningtables.filter(x => x.TableKey.includes('_') && x.TableKey.includes(tableid.toString()))
  }

  splittable(tableid) {
    var lastsplittableid = +this.getavailablesplitid(tableid)
    var parentTable = this.diningTables.filter(x => x.TableKey == tableid.toString())[0]
    var table = {
      Id: parentTable.Id,
      DiningAreaId: parentTable.DiningAreaId,
      TableKey: parentTable.TableKey + '_' + (lastsplittableid + 1),
      TableName: '',
      TableStatusId: 0,
    }
    table.TableName = parentTable.TableName + '/' + String.fromCharCode(65 + lastsplittableid)
    parentTable.LastSplitTableId = lastsplittableid + 1
    this.auth.splitTable({ parenttable: parentTable, splittable: table }).subscribe(data => {
      this.eventS.emitNotif({ waiterorder: 'TABLEORDER' })
      this.getData()
      // this.waiterS.waiterSocket.emit('tableorder:update', parentTable.TableKey)
      // this.gettables()
    })
  }
  removeplittable(splitetablekey) {
    var parentTable = this.diningTables.filter(x => x.Id == +splitetablekey.split('_')[0])[0]
    parentTable.LastSplitTableId -= 1
    this.auth.deletesplittable(splitetablekey).subscribe(data => {
      this.eventS.emitNotif({ waiterorder: 'TABLEORDER' })
    })
  }

  saveorder(order: OrderModule) {
    order.DiscAmount = null
    order = this.generatekot(order)
    order.BillDateTime = moment().format('YYYY-MM-DD HH:mm:ss')
    order.BillDate = moment().format('YYYY-MM-DD')
    order.OrderedDateTime = moment().format('YYYY-MM-DD HH:mm:ss')
    order.OrderedDate = moment().format('YYYY-MM-DD')
    order.StoreId = this.loginfo.StoreId
    order.CompanyId = this.loginfo.CompanyId
    order.OrderStatusId = 5
    order.InvoiceNo = this.loginfo.StoreId + moment().format('YYYYMMDD') + '/' + order.OrderNo
    order.CustomerDetails.CompanyId = this.loginfo.CompanyId
    order.CustomerDetails.StoreId = this.loginfo.StoreId
    this.printreceipt(order)
    order.setrefid()
    order.deliverytimestamp = order.DeliveryDateTime
      ? new Date(order.DeliveryDateTime).getTime()
      : 0
    order.Transactions.forEach(tranxn => {
      tranxn.OrderId = order.OrderId
      tranxn.CustomerId = order.CustomerDetails.Id
      tranxn.PaymentStatusId = 0
      tranxn.TransDateTime = moment().format('YYYY-MM-DD HH:mm:ss')
      tranxn.TransDate = moment().format('YYYY-MM-DD')
      tranxn.UserId = order.UserId
      tranxn.CompanyId = this.loginfo.CompanyId
      tranxn.StoreId = this.loginfo.StoreId
      tranxn.InvoiceNo = order.InvoiceNo
      tranxn.saved = true
      order.PaidAmount += tranxn.Amount
    })
    order.alltransactions = [...order.Transactions]
    if (order.IsAdvanceOrder || order.OrderTypeId == 2) {
      order.isordersaved = true
      order.events.push({ name: 'order_placed', time: new Date().getTime() })
      order.OrderStatusId = 1
      localStorage.setItem('lastorder', JSON.stringify(order))
      this.auth.savepreorders(order).subscribe(data => {
        this.eventS.emitNotif({ waiterorder: 'PREORDER' })
        this.sync.sync()
      })
    } else {
      localStorage.setItem('lastorder', JSON.stringify(order))
      this.auth.saveordertonedb(order).subscribe(data => {
        this.eventS.emitNotif({ waiterorder: 'NOWORDER' })
        this.sync.sync()
      })
    }
  }

  getcustomerhtml(order: OrderModule) {
    var html = ''
    if (order.CustomerDetails.PhoneNo) {
      html = `<div ${order.CustomerDetails.PhoneNo ? '' : 'hidden'} class="header">
      <h3 ${order.CustomerDetails.Name ? '' : 'hidden'}>${order.CustomerDetails.Name}</h3>
      <p>${order.CustomerDetails.Address ? order.CustomerDetails.Address + '<br>' : ''}${
        order.CustomerDetails.City ? order.CustomerDetails.City + ',' : ''
      }${order.CustomerDetails.PhoneNo}</p>
      </div>
      <hr>`
    }
    return html
  }

  printreceipt(order: OrderModule) {
    var printtemplate = `
    <div id="printelement">
    <div class="header">
    <h3>${this.loginfo.Company}</h3>
    <p>
    ${this.loginfo.Store}, ${this.loginfo.Address}<br>
    ${this.loginfo.City}, ${this.loginfo.ContactNo}
    GSTIN:${this.orderkey.GSTno}<br>
    Receipt: ${order.InvoiceNo}<br>
    ${moment(order.OrderedDateTime).format('LLL')}
    </p>
    </div>
    <hr>
    ${this.getcustomerhtml(order)}
    <table class="item-table">
    <thead class="nb">
    <th class="text-left" style="width: 100px;">ITEM</th>
    <th class="text-right">PRICE</th>
    <th class="text-right">QTY</th>
    <th class="text-right">AMOUNT</th>
    </thead>
    <tbody>`
    var extra = 0
    order.Items.forEach(item => {
      printtemplate += `
    <tr class="nb">
    <td class="text-left">${item.showname}</td>
    <td class="text-right">${item.baseprice.toFixed(2)}</td>
    <td class="text-right">${item.Quantity}${
        item.ComplementryQty > 0 ? '(' + item.ComplementryQty + ')' : ''
      }</td>
    <td class="text-right">${item.TotalAmount.toFixed(2)}</td>
    </tr>`
      extra += item.Extra
    })
    printtemplate += `
    <tr class="bt">
    <td class="text-left"><strong>Sub Total</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${order.subtotal.toFixed(2)}</td>
    </tr>
    <tr class="nb" ${order.OrderTotDisc + order.AllItemTotalDisc == 0 ? 'hidden' : ''}>
    <td class="text-left"><strong>Discount</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${(+(order.OrderTotDisc + order.AllItemTotalDisc).toFixed(0)).toFixed(
      2,
    )}</td>
    </tr>
    <tr class="nb" ${order.Tax1 == 0 ? 'hidden' : ''}>
    <td class="text-left"><strong>CGST</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${(
      order.Tax1 + +((order.OrderTotDisc + order.AllItemTotalDisc) / 2).toFixed(0)
    ).toFixed(2)}</td>
    </tr>
    <tr class="nb" ${order.Tax2 == 0 ? 'hidden' : ''}>
    <td class="text-left"><strong>SGST</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${(
      order.Tax2 + +((order.OrderTotDisc + order.AllItemTotalDisc) / 2).toFixed(0)
    ).toFixed(2)}</td>
    </tr>`
    order.additionalchargearray.forEach(charge => {
      if (charge.selected) {
        printtemplate += `
    <tr class="nb">
    <td class="text-left"><strong>${charge.Description}</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${charge.ChargeValue}</td>
    </tr>`
      }
    })
    printtemplate += `
    <tr class="nb" ${extra > 0 ? '' : 'hidden'}>
    <td class="text-left"><strong>Extra</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${extra.toFixed(2)}</td>
    </tr>
    <tr class="nb">
    <td class="text-left"><strong>Paid</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${order.PaidAmount.toFixed(2)}</td>
    </tr>
    <tr class="nb">
    <td class="text-left"><strong>Total</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${order.BillAmount.toFixed(2)}</td>
    </tr>
    <tr class="nb" ${order.BillAmount - order.PaidAmount > 0 ? '' : 'hidden'}>
    <td class="text-left"><strong>Balance</strong></td>
    <td colspan="2"></td>
    <td class="text-right">${(order.BillAmount - order.PaidAmount).toFixed(2)}</td>
    </tr>
    </tbody>
    </table>
    <hr>
    <div class="text-center">
    <p>Powered By Biz1Book.</p>
    </div>
    </div>`
    printtemplate += Settings.receiptStyle
    // console.log(printtemplate)
    // var printhtml = document.getElementById("rprintelcontainer").innerHTML
    // printhtml += this.printhtmlstyle
    // // console.log(printhtml)
    // // console.log(printtemplate)
    if (this.printersettings) {
      this.printservice.print(printtemplate, [this.printersettings.receiptprinter])
    }
  }
}

export interface Payload {
  OrderTypeId: number
  Items: Array<any>
  UserId: number
  Transactions: Array<Transaction>
  DeliveryDateTime: string
  CustomerDetails: CustomerModule
  InvoiceNo: string
  DiningTableId: number
  DiningTableKey: string
  _id: string
}
