import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

import { select, Store } from '@ngrx/store'
import store from 'store'
import * as SettingsActions from 'src/app/store/settings/actions'
import * as Reducers from 'src/app/store/reducers'
import { NotificationService } from 'src/app/services/notification/notification.service'
import { AuthService } from 'src/app/auth.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'cui-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  time = new Date();
  theme: string
  isOnlineserv: Observable<boolean>
  isOnline: boolean


  constructor(
    private store: Store<any>,
    private ns: NotificationService,
    private auth: AuthService,
    // private sync: SyncService,
    // private event: EventService,
    private router: Router,
  ) {
    this.store.pipe(select(Reducers.getSettings)).subscribe(state => {
      this.theme = state.theme
    })
  }

  ngOnInit() {
    setInterval(() => {
      this.time = new Date();
    }, 1000);
  }

  setTheme(nextTheme) {
    this.store.dispatch(
      new SettingsActions.SetStateAction({
        theme: nextTheme,
      }),
    )
  }

  stopnotificationsound() {
    this.ns.stopnotificationsound()
  }

  syncdata() {
    // this.isOnlineserv.subscribe(data => {
    //   console.log(data)
    //   this.isOnline = data
    // })
    var logInfo = JSON.parse(localStorage.getItem('logInfo'))
    this.auth.getStoreData(logInfo.CompanyId, logInfo.StoreId).subscribe(data => {
      console.log(data)
      console.log(JSON.stringify(Object.keys(data)))
      var storedata = {}
      storedata['product'] = data['Product']
      storedata['category'] = data['Category']
      storedata['customers'] = data['Customers']
      storedata['kotgroups'] = data['KotGroups']
      storedata['diningarea'] = data['DiningArea']
      storedata['diningtable'] = data['DiningTable']
      storedata['paymenttypes'] = data['StorePaymentTypes']
      storedata['discountrule'] = data['DiscountRule']
      storedata['additionalcharges'] = data['AdditionalCharge']
      storedata['stores'] = data['Stores']
      storedata['pendingorders'] = []
      storedata['preorders'] = []
      storedata['orderstatusbtns'] = data['OrderStatusButtons']
      data['PendingOrders'].forEach((oj, index) => {
        // console.log(oj.Id,index, oj.OrderNo)
        if (oj.OrderJson) {
          var json = JSON.parse(oj.OrderJson)
          console.log(json.InvoiceNo, oj.OrderNo)
          json.datastatus = ''
          json.status = 'S'
          delete json._id
          storedata['preorders'].push(json)
        } else {
          // console.log(oj.OrderJson)
        }
      })
      this.auth.storeselect(storedata).subscribe(data1 => {
        console.log(data1)
        this.router.navigateByUrl('/auth/lockpage')
      })
      this.auth.getdbdata(['printersettings']).subscribe(data => {
        var printersettings = data['printersettings'][0] ? data['printersettings'][0] : {}
        printersettings.kotgroups = []
        if (storedata['kotgroups']) {
          storedata['kotgroups'].forEach(kotgrp => {
            var obj = kotgrp
            obj.Printers = JSON.parse(kotgrp.Printer)
            delete obj.Printer
            printersettings.kotgroups.push(obj)
          })
        }
        this.auth.updateprintersettings(printersettings).subscribe(data => { })
      })
      // ["<Category>","<TaxGroup>","<Product>","<DiningArea>","<DiningTable>","<DiscountRule>","<AdditionalCharge>",
      // "<OrderType>","<Customers>","<PaymentType>","<KotGroups>","PendingOrders","<StorePaymentTypes>",
      // "<OrderStatus>","<ItemStatus>","<KOTStatus>","<PaymentStatus>","<TableStatus>","<TransType>","<Aggregators>"]
    })
  }
}
