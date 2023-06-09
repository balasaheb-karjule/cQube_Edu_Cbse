import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppServiceComponent } from 'src/app/app.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentProgressLineChartService {
  public baseUrl;
  
  constructor(public http: HttpClient, public service: AppServiceComponent) {
    this.baseUrl = service.baseUrl;
  }

  enrollmentProState() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/allDistData`);
  }
  
  enrollmentProDist() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/distWise`);
  }
  enrollProAllCollection() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/allDistCollection`);
  }
  enrollProAllCourse() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/allCourse`);
  }
  enrollProgam() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/allPrograms`);
  }
  enrollProgamWiseColl() {
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/allProgCollection`);
  }
  enrollExpectedMeta(){
    //this.service.logoutOnTokenExpire();
    return this.http.get(`${this.baseUrl}/diksha/enrollmentProgress/expectedMeta`);
  }

}
