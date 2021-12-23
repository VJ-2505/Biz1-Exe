import { Component } from '@angular/core'
import { AuthService } from 'src/app/auth.service'
import { EventService } from 'src/app/services/event/event.service'

@Component({
  selector: 'cui-topbar-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class TopbarActionsComponent {
  erroredorders = []
  pendingorders = []

  constructor(private auth: AuthService, private event: EventService) {
    this.geterrorredorders()
    this.event.notify().subscribe(data => {
      if (data.hasOwnProperty('newerrororder')) {
        this.geterrorredorders()
      }
    })
  }
  geterrorredorders() {
    this.auth.erroredorders().subscribe(data => {
      console.log(data)
      this.erroredorders = data['pendingorders_e']
      this.erroredorders = [...this.erroredorders, ...data['preorders_e']]
      this.pendingorders = data['pendingorders_p']
      this.pendingorders = [...this.pendingorders, ...data['preorders_p']]
    })
  }
  deleteorder(typeid, _id) {
    if ([3, 4].includes(typeid)) {
      this.auth.deletepreorders(_id).subscribe(data => {
        this.geterrorredorders()
      })
    } else {
      this.auth.deleteorderfromnedb(_id, 0).subscribe(data => {
        this.geterrorredorders()
      })
    }
  }
}
