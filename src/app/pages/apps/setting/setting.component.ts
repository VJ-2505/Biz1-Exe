import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { select, Store } from '@ngrx/store'
import { Observable } from 'rxjs'
import * as SettingsActions from 'src/app/store/settings/actions'
import * as Reducers from 'src/app/store/reducers'
import {
  slideFadeinUp,
  slideFadeinRight,
  zoomFadein,
  fadein,
} from '../../../layouts/router-animations'
import { AuthService } from 'src/app/auth.service'
import { ElectronService } from 'ngx-electron'
import * as moment from 'moment'
import { NzNotificationService } from 'ng-zorro-antd'
import { io, Socket } from 'socket.io-client'
import { WaiterService } from 'src/app/services/waiter/waiter.service'
import { NzTabPosition } from 'ng-zorro-antd/tabs'

declare function QRious(options: any)
@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  animations: [slideFadeinUp, slideFadeinRight, zoomFadein, fadein],
})
export class SettingComponent implements OnInit {
  activeKey = 0
  pskey = 0
  demoValue = 1
  value: string
  // olf pos
  settings$: Observable<any>
  isContentMaxWidth: Boolean
  isAppMaxWidth: Boolean
  isGrayBackground: Boolean
  isSquaredBorders: Boolean
  isCardShadow: Boolean
  isBorderless: Boolean
  menuLayoutType: string
  isMobileView: Boolean
  isMobileMenuOpen: Boolean
  routerAnimation: string
  isMenuCollapsed: Boolean
  leftMenuWidth: Number
  isTopbarFixed: Boolean
  isGrayTopbar: Boolean
  touchStartPrev: Number = 0
  touchStartLocked: Boolean = false
  // Test Print
  count = 0
  printer = ''
  template = ''
  printers = [
    
    {
      name: 'OneNote for Windows 10',
      displayName: 'OneNote for Windows 10',
      description: '',
      status: 0,
      isDefault: false,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'Microsoft Software Printer Driver',
        system_driverinfo:
          'Microsoft Software Printer Driver;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630',
      },
    },
    {
      name: 'Microsoft XPS Document Writer',
      displayName: 'Microsoft XPS Document Writer',
      description: '',
      status: 0,
      isDefault: false,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'Microsoft XPS Document Writer v4',
        system_driverinfo:
          'Microsoft XPS Document Writer v4;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630',
      },
    },
    {
      name: 'Microsoft Print to PDF',
      displayName: 'Microsoft Print to PDF',
      description: '',
      status: 0,
      isDefault: false,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'Microsoft Print To PDF',
        system_driverinfo:
          'Microsoft Print To PDF;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630',
      },
    },
    {
      name: 'HP LaserJet Pro MFP M126nw',
      displayName: 'HP LaserJet Pro MFP M126nw',
      description: '',
      status: 0,
      isDefault: false,
      options: {
        'printer-location':
          'http://[fe80::5eea:1dff:fe36:c39f%25]:3911/eb694e80-27c0-5229-e4ec-d7137e9dff98',
        'printer-make-and-model': 'Microsoft IPP Class Driver',
        system_driverinfo:
          'Microsoft IPP Class Driver;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630',
      },
    },
    {
      name: 'Fax',
      displayName: 'Fax',
      description: '',
      status: 0,
      isDefault: false,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'Microsoft Shared Fax Driver',
        system_driverinfo:
          'Microsoft Shared Fax Driver;10.0.19041.508 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.508',
      },
    },
    {
      name: 'EPSON TM-T82 ReceiptSA4',
      displayName: 'EPSON TM-T82 ReceiptSA4',
      description: '',
      status: 128,
      isDefault: true,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'EPSON TM-T82 ReceiptSA4',
        system_driverinfo:
          'EPSON TM-T82 ReceiptSA4;0, 3, 0, 0 built by: WinDDK;EPSON Advanced Printer Driver;1, 0, 19, 0',
      },
    },
      {
      name: 'EPSON TM-T82 ReceiptSA4',
      displayName: 'EPSON TM-T82 ReceiptSA4',
      description: '',
      status: 128,
      isDefault: true,
      options: {
        'printer-location': '',
        'printer-make-and-model': 'EPSON TM-T82 ReceiptSA4',
        system_driverinfo:
          'EPSON TM-T82 ReceiptSA4;0, 3, 0, 0 built by: WinDDK;EPSON Advanced Printer Driver;1, 0, 19, 0',
      },
    },
  
  ]
  printersettings = {}
  charges: any = []
  socket_server_ip: string = ''
  socket: Socket
  position: NzTabPosition = 'left'

  constructor(
    private store: Store<any>,
    private electronservice: ElectronService,
    private auth: AuthService,
    private notification: NzNotificationService,
    private waiterS: WaiterService,
  ) {
    this.store.pipe(select(Reducers.getSettings)).subscribe(state => {
      this.isContentMaxWidth = state.isContentMaxWidth
      this.isAppMaxWidth = state.isAppMaxWidth
      this.isGrayBackground = state.isGrayBackground
      this.isSquaredBorders = state.isSquaredBorders
      this.isCardShadow = state.isCardShadow
      this.isBorderless = state.isBorderless
      this.menuLayoutType = state.menuLayoutType
      this.isMobileView = state.isMobileView
      this.isMobileMenuOpen = state.isMobileMenuOpen
      this.routerAnimation = state.routerAnimation
      this.isMenuCollapsed = state.isMenuCollapsed
      this.leftMenuWidth = state.leftMenuWidth
      this.isTopbarFixed = state.isTopbarFixed
      this.isGrayTopbar = state.isGrayTopbar
    })
    this.socket_server_ip = localStorage.getItem('socket-server-ip')
    // this.printers = [{ "name": "OneNote for Windows 10", "displayName": "OneNote for Windows 10", "description": "", "status": 0, "isDefault": false, "options": { "printer-location": "", "printer-make-and-model": "Microsoft Software Printer Driver", "system_driverinfo": "Microsoft Software Printer Driver;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630" } }, { "name": "Microsoft XPS Document Writer", "displayName": "Microsoft XPS Document Writer", "description": "", "status": 0, "isDefault": false, "options": { "printer-location": "", "printer-make-and-model": "Microsoft XPS Document Writer v4", "system_driverinfo": "Microsoft XPS Document Writer v4;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630" } }, { "name": "Microsoft Print to PDF", "displayName": "Microsoft Print to PDF", "description": "", "status": 0, "isDefault": false, "options": { "printer-location": "", "printer-make-and-model": "Microsoft Print To PDF", "system_driverinfo": "Microsoft Print To PDF;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630" } }, { "name": "HP LaserJet Pro MFP M126nw", "displayName": "HP LaserJet Pro MFP M126nw", "description": "", "status": 0, "isDefault": false, "options": { "printer-location": "http://[fe80::5eea:1dff:fe36:c39f%25]:3911/eb694e80-27c0-5229-e4ec-d7137e9dff98", "printer-make-and-model": "Microsoft IPP Class Driver", "system_driverinfo": "Microsoft IPP Class Driver;10.0.19041.630 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.630" } }, { "name": "Fax", "displayName": "Fax", "description": "", "status": 0, "isDefault": false, "options": { "printer-location": "", "printer-make-and-model": "Microsoft Shared Fax Driver", "system_driverinfo": "Microsoft Shared Fax Driver;10.0.19041.508 (WinBuild.160101.0800);Microsoft® Windows® Operating System;10.0.19041.508" } }, { "name": "EPSON TM-T82 ReceiptSA4", "displayName": "EPSON TM-T82 ReceiptSA4", "description": "", "status": 128, "isDefault": true, "options": { "printer-location": "", "printer-make-and-model": "EPSON TM-T82 ReceiptSA4", "system_driverinfo": "EPSON TM-T82 ReceiptSA4;0, 3, 0, 0 built by: WinDDK;EPSON Advanced Printer Driver;1, 0, 19, 0" } }]
  }
  available_networks = []
  notAnElectronApp: boolean = false
  ngOnInit(): void {
    this.bindMobileSlide()
    this.getprinters()
    this.getprintersetting()
    this.getNetworks()
    // this.available_networks = [
    //   { address: '192.168.1.8', ifname: 'Ethernet', islive: false },
    //   { address: '192.168.1.29', ifname: 'Wi-Fi 2', islive: false }
    // ]

    if (this.socket_server_ip) {
      // this.issockserverlive()
      this.socket = io('http://' + this.socket_server_ip + ':8000')
    }
  }
  getNetworks() {
    var addresses = this.waiterS.availableAddresses()
    console.log(addresses)
    if (addresses.error) {
      this.available_networks = [
        { address: '192.168.1.8', ifname: 'Ethernet', islive: false },
        { address: '192.168.1.29', ifname: 'Wi-Fi 2', islive: false },
      ]
    } else {
      this.available_networks = addresses
    }
  }
  issockserverlive() {
    this.auth.issockserverlive(this.socket_server_ip).subscribe(
      data => {
        this.available_networks.forEach(ntw => {
          if (ntw.address == this.socket_server_ip) ntw.islive = true
          else ntw.islive = false
        })
      },
      error => {
        this.available_networks.forEach(ntw => {
          ntw.islive = false
        })
      },
    )
  }
  startServer(network) {
    localStorage.setItem('socket-server-ip', network.address)
    this.socket_server_ip = localStorage.getItem('socket-server-ip')
    this.waiterS.startServer(this.socket_server_ip)
  }
  getprintersetting() {
    this.auth.getdbdata(['printersettings', 'additionalcharges']).subscribe(data => {
      this.printersettings = data['printersettings'][0] ? data['printersettings'][0] : {}
      this.charges = data['additionalcharges']
    })
  }
  changeKey(key) {
    this.activeKey = key
  }
  changeKeyps(ps) {
    this.pskey = ps
  }

  // copy setting

  onCollapse(value: any) {
    this.store.dispatch(
      new SettingsActions.SetStateAction({
        isMenuCollapsed: value,
      }),
    )
  }
  getprinters() {
    if (this.electronservice.isElectronApp) {
      this.printers = this.electronservice.remote.getGlobal('GetPrinters')()
      console.log(JSON.stringify(this.printers))
    }
  }
  toggleCollapsed() {
    this.store.dispatch(
      new SettingsActions.SetStateAction({
        isMenuCollapsed: !this.isMenuCollapsed,
      }),
    )
  }

  toggleMobileMenu() {
    this.store.dispatch(
      new SettingsActions.SetStateAction({
        isMobileMenuOpen: !this.isMobileMenuOpen,
      }),
    )
  }

  bindMobileSlide() {
    // mobile menu touch slide opener
    const unify = e => {
      return e.changedTouches ? e.changedTouches[0] : e
    }
    document.addEventListener(
      'touchstart',
      e => {
        const x = unify(e).clientX
        this.touchStartPrev = x
        this.touchStartLocked = x > 70 ? true : false
      },
      { passive: false },
    )
    document.addEventListener(
      'touchmove',
      e => {
        const x = unify(e).clientX
        const prev = this.touchStartPrev
        if (x - <any>prev > 50 && !this.touchStartLocked) {
          this.toggleMobileMenu()
          this.touchStartLocked = true
        }
      },
      { passive: false },
    )
  }

  routeAnimation(outlet: RouterOutlet, animation: string) {
    if (animation === this.routerAnimation) {
      return outlet.isActivated && outlet.activatedRoute.routeConfig.path
    }
  }

  print() {
    this.electronservice.remote.getGlobal('testPrint')(this.count, this.printer, this.template)
  }

  saveprintersettings() {
    this.auth.updateprintersettings(this.printersettings).subscribe(data => {
      this.notification.success('Success', 'Printer settings saved')
    })
  }
  printerselect(bool, printer, kotgroupid) {
    console.log(bool, printer, kotgroupid)
    this.printersettings['kotgroups'].forEach(ktgrp => {
      if (ktgrp.Id == kotgroupid) {
        if (bool) {
          ktgrp.Printers.push(printer)
        } else {
          ktgrp.Printers = ktgrp.Printers.filter(x => x != printer)
        }
      }
    })
    console.log(this.printersettings)
  }
  savecharges() {
    this.auth.updatecharges(this.charges).subscribe(data => {
      this.notification.success('Success', 'Charges Updated')
    })
  }
}
