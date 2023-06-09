import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppServiceComponent } from 'src/app/app.service';

@Injectable({
  providedIn: 'root'
})
export class ContentUsagePieService {
  public baseUrl;
  
  constructor(public http: HttpClient, public service: AppServiceComponent) {
    this.baseUrl = service.baseUrl;
  }

  // Diksha pie chart apis
  dikshaPieState() {
    //this.service.logoutOnTokenExpire();
    return this.http.post(`${this.baseUrl}/diksha/contentUsage/stateData`, null);
  }

  dikshaPieDist(){
    //this.service.logoutOnTokenExpire();
    return this.http.post(`${this.baseUrl}/diksha/contentUsage/distWise`, null);
  }
  diskshaPieMeta(){
    //this.service.logoutOnTokenExpire();
    return this.http.post(`${this.baseUrl}/diksha/contentUsage/distMeta`, null);
  }
}
