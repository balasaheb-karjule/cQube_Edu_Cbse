import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

import { environment } from 'src/environments/environment';
import { AuthenticationService } from 'src/app/core/services/authentication/authentication.service';
declare const $;

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChangePasswordComponent implements OnInit {

  public changePasswdData: any = {};
  public err;
  public successMsg;
  public isDisabled;
  roleIds: any;
  public otpToggle = environment.report_viewer_config_otp
  constructor(private readonly _authenticationService: AuthenticationService, public router: Router) {
    // service.logoutOnTokenExpire();
    this.changePasswdData['userName'] = localStorage.getItem('userName');
  }

  ngOnInit() {
    document.getElementById('accessProgressCard') ? document.getElementById('accessProgressCard').style.display = 'none' : '';
  }

  onSubmit(formData: NgForm) {
    document.getElementById('spinner').style.display = 'block';
    this.isDisabled = false;
    if (this.changePasswdData.userName === localStorage.getItem('userName')) {
      if (this.changePasswdData.newPasswd != this.changePasswdData.cnfpass) {
        this.err = "Password not matched";
        document.getElementById('spinner').style.display = 'none';
      } else {
        let token = localStorage.getItem('token')
        this._authenticationService.RVchangePassword(this.changePasswdData, localStorage.getItem('user_id'), token).subscribe(res => {
          document.getElementById('success').style.display = "Block";
          this.err = '';
          this.successMsg = res['msg'] + "\n" + " please login again...";
          document.getElementById('spinner').style.display = 'none';
          this.isDisabled = true;
          formData.resetForm();
          setTimeout(() => {
            localStorage.clear();
            
              redirectUri: environment.appUrl
            this.router.navigate(['/login']);
           
          }, 2000);
        }, err => {
          this.err = "Something went wrong"
          document.getElementById('spinner').style.display = 'none';
        })
      }
    } else {
      this.err = "Invalid User";
      document.getElementById('spinner').style.display = 'none';
    }
  }

}
