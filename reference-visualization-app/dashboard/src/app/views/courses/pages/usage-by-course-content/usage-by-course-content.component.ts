import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppServiceComponent } from 'src/app/app.service';
import { environment } from 'src/environments/environment';
import { DikshaReportService } from 'src/app/core/services/diksha-report.service';
declare const $;
@Component({
  selector: 'app-usage-by-course-content',
  templateUrl: './usage-by-course-content.component.html',
  styleUrls: ['./usage-by-course-content.component.scss']
})
export class UsageByCourseContentComponent implements OnInit {

  //table data variables:::::::::::::::::
  public result: any = [];
  public districtId: any = null;
  public timePeriod: any = 'all';
  public collectionType = 'course';
  public allCollections = [];
  public timeDetails: any = [];
  public districtsDetails: any = '';
  public waterMark = environment.water_mark

  dataTable: any;
  dtOptions: any;
  tableData: any = [];
  public hierName: any;
  public dist: boolean = false;
  public all: boolean = false;
  fileName;
  reportData: any = [];
  header = '';
  state: string;

  reportName = 'usage_by_course_content';

  //For pagination.....
  pageSize = 500;
  currentPage = 1;
  filteredData = []
  showPagination = false;
  validTransactions: any;
  table: any;
  updatedTable: any = [];

  constructor(
    public http: HttpClient,
    public service: DikshaReportService,
    public router: Router,
    public commonService: AppServiceComponent
  ) {
    this.allCollections = [{ id: "course", name: "Course" }]
  }
  height = window.innerHeight;
  onResize() {
    this.height = window.innerHeight;
  }

  //show next page data::::::::::::::
  onChangePage() {
    document.getElementById('spinner').style.display = 'block';
    this.tableCreation(this.result);
  }

  public userAccessLevel = localStorage.getItem("userLevel");
  public hideIfAccessLevel: boolean = false
  public hideAccessBtn: boolean = false
showError = false
  ngOnInit(): void {
    this.state = this.commonService.state;
    // document.getElementById('accessProgressCard').style.display = 'none';
    // document.getElementById('backBtn') ? document.getElementById('backBtn').style.display = 'none' : "";
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.collectionWise();

    }else{
      if ( this.userAccessLevel === "District"){
        this.getview()
      }else{
        document.getElementById('spinner').style.display = 'none';
        this.showError = true
      }
    }
        this.onResize();

    

    this.hideAccessBtn = (environment.auth_api === 'cqube' || this.userAccessLevel === "" || undefined) ? true : false;




  }

  getview(){
    this.timeDetails = [];
    this.service.dikshaTableMetaData().subscribe(async result => {
      this.districtsDetails = result['data']['districtDetails']

      await result['data']['timeRange'].forEach((element) => {
        var obj = { timeRange: element, name: this.changeingStringCases(element.replace(/_/g, ' ')) }
        this.timeDetails.push(obj);
      });
      await this.timeDetails.push({ timeRange: "all", name: "Overall" });
      await this.timeDetails.reverse();
      let distId = localStorage.getItem('userLocation')
      await this.districtWise(distId);
    })
  
  }

  //Loader and error message:::::
  loaderAndErr() {
    if (this.result.length !== 0) {
      document.getElementById('spinner').style.display = 'none';
    } else {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('errMsg') ? document.getElementById('errMsg').style.color = 'red' : "";
      document.getElementById('errMsg') ? document.getElementById('errMsg').style.display = 'block' : "";
      document.getElementById('errMsg') ? document.getElementById('errMsg').innerHTML = 'No data found' : "";
    }
  }

  errMsg() {
    document.getElementById('errMsg') ? document.getElementById('errMsg').style.display = 'none' : "";
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('spinner').style.marginTop = '3%';
  }

  //default page
  default() {
    this.currentPage = 1;
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.collectionWise();
    }else{
      this.getview()
    }
   
  }

  //show data based on selected collection:::::::::
  collectionWise(distId?) {

    this.errMsg();
    this.districtId = null;
    this.timePeriod = 'all';
    this.all = true
    this.dist = false;
    this.timeDetails = [];
    this.service.dikshaTableMetaData().subscribe(async result => {
      this.districtsDetails = result['data']['districtDetails']
      
      await result['data']['timeRange'].forEach((element) => {
        var obj = { timeRange: element, name: this.changeingStringCases(element.replace(/_/g, ' ')) }
        this.timeDetails.push(obj);
      });
      await this.timeDetails.push({ timeRange: "all", name: "Overall" });
      await this.timeDetails.reverse();
    })

    
    
    if (this.result.length! > 0) {
      $('#table').DataTable().destroy();
      $('#table').empty();
    }
    this.result = [];
    this.reportData = [];
    this.header = this.changeingStringCases(this.collectionType) + " Linked";

    this.service.dikshaAllTableData({ collectionType: this.collectionType }).subscribe(res => {
      this.fileName = `${this.reportName}_${this.timePeriod}_${this.commonService.dateAndTime}`;
      this.time = this.timePeriod == 'all' ? 'overall' : this.timePeriod;
      this.fileToDownload = `diksha_raw_data/table_reports/course/${this.time}/${this.time}.csv`;
      this.updatedTable = this.result = res['data'];
      this.onChangePage();

      this.result.forEach(element => {
        var obj1 = {};
        var obj2 = {};
        Object.keys(element).forEach(key => {
          if (key !== "district_id") {
            obj1[key] = element[key];
          }
        });
        Object.keys(obj1).forEach(key => {
          if (key !== "district_name") {
            obj2[key] = obj1[key];
          }
        });
        this.reportData.push(obj2);
      });
      if (distId) {
        $('#table').DataTable().destroy();
        $('#table').empty();
        this.districtWise(distId)

      } else {

      }
    }, err => {
      this.loaderAndErr();
    })
  }


  //Showing data based on selected district:::::::::::::::::::::::::::::::::::::::::::::::::::
  districtWise(districtId) {
    this.errMsg()

    this.districtId = districtId
    var period = this.timePeriod == 'all' ? '' : this.timePeriod;
    if (period != '' && districtId != null) {
      this.all = false
      this.dist = true
      let d = this.districtsDetails.filter(item => {
        if (item.district_id == districtId)
          return item.district_name
      })
      this.hierName = d[0].district_name
      this.timeRange(this.timePeriod)
    } else {
      if (districtId == null) {
        this.all = true
        this.dist = false
      } else {
        this.all = false
        this.dist = true
        let d = this.districtsDetails.filter(item => {
          if (item.district_id == districtId)
            return item.district_name
        })
        this.hierName = d[0].district_name
      }

      if (this.result.length! > 0) {
        $('#table').DataTable().destroy();
        $('#table').empty();
      }
      this.result = [];
      this.reportData = [];
      this.service.dikshaDistrictTableData({ districtId: districtId, collectionType: this.collectionType }).subscribe(res => {
        this.fileName = `${this.reportName}_${this.timePeriod}_${districtId}_${this.commonService.dateAndTime}`;
        this.updatedTable = this.result = res['data'];
        this.onChangePage();

        this.reportData = this.result;
      }, err => {
        this.loaderAndErr();
      })
    }

  }

  time = this.timePeriod == 'all' ? 'overall' : this.timePeriod;
  fileToDownload = `diksha_raw_data/table_reports/course/${this.time}/${this.time}.csv`;

  //Showing data based on selected time-period:::::::::::::::
  timeRange(timePeriod) {
    this.errMsg();
    this.time = timePeriod == 'all' ? 'overall' : timePeriod;
    this.fileToDownload = `diksha_raw_data/table_reports/course/${this.time}/${this.time}.csv`;

    if (this.districtId == null) {
      this.districtId = undefined
    }
    var myTime = timePeriod == 'all' ? undefined : timePeriod;
    if (this.result.length! > 0) {
      $('#table').DataTable().destroy();
      $('#table').empty();
    }
    this.result = [];
    this.reportData = [];
    this.service.dikshaTimeRangeTableData({ districtId: this.districtId, timePeriod: myTime, collectionType: this.collectionType }).subscribe(res => {
      this.updatedTable = this.result = res['data'];
      this.onChangePage();
      if (this.hierName) {
        this.reportData = this.result;
        this.fileName = `${this.reportName}_${this.timePeriod}_${this.commonService.dateAndTime}`;
      } else {
        this.result.forEach(element => {
          var obj1 = {};
          var obj2 = {};
          Object.keys(element).forEach(key => {
            if (key !== "district_id") {
              obj1[key] = element[key];
            }
          });
          Object.keys(obj1).forEach(key => {
            if (key !== "district_name") {
              obj2[key] = obj1[key];
            }
          });
          this.reportData.push(obj2);
        });
        this.fileName = `Diksha_${this.collectionType}_Dist_Data_${this.timePeriod}`;
      }
    }, err => {
      this.loaderAndErr();
    })
  }

  //download raw file::::::::::
  downloadRawFile() {
    this.service.downloadFile({ fileName: this.fileToDownload }).subscribe(res => {
      window.open(`${res['downloadUrl']}`, "_blank");
    }, err => {
      alert("No Raw Data File Available in Bucket");
    })
  }

  //download the data showing on UI::::::::::
  downloadReport() {
    this.commonService.download(this.fileName, this.reportData);
  }
  changeingStringCases(str) {
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  columns;

  //Initialize table::::::::::::::::::::::
  tableCreation(dataSet) {
    var my_columns = this.commonService.getColumns(dataSet);

    this.columns = my_columns;

    $(document).ready(function () {
      var headers = '<thead><tr>'
      var body = '<tbody>';

      my_columns.forEach((column, i) => {
        var col = (column.data.replace(/_/g, ' ')).replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        headers += `<th style="font-size: 14px"> ${col}</th>`;
      });

      let newArr = [];
      $.each(dataSet, function (a, b) {
        let temp = [];
        $.each(b, function (key, value) {
          var new_item = {};
          new_item['data'] = key;
          new_item['value'] = value;
          temp.push(new_item);
        });
        newArr.push(temp)
      });

      newArr.forEach((columns) => {
        body += '<tr>';
        columns.forEach((column) => {
          body += `<td>${column.value}</td>`
        });
        body += '</tr>';
      });

      headers += `</tr></thead>`;
      body += '</tr></tbody>';
      $(`#table`).empty();
      $(`#table`).append(headers);
      $(`#table`).append(body);
      var obj = {
        destroy: true, bLengthChange: false, bInfo: false,
        bPaginate: false, scrollY: "56vh", scrollX: true,
        scrollCollapse: true, searching: true, paging: true, pageLength: 500,
        fixedColumns: {
          leftColumns: 1
        }
      }
      if (dataSet.length > 0)
        obj['order'] = [[my_columns.length - 5, "desc"]];

      this.table = $(`#table`).DataTable(obj);
      $(document).ready(function () {

        $('#table').on('page.dt', function () {
          $('.dataTables_scrollBody').scrollTop(0);
        });
      }, 300);
      document.getElementById('spinner').style.display = 'none';
    });
    this.showPagination = true;
  }

  //Search data :::::::::::::::::
  updateFilter(event: any) {
    this.columns = this.commonService.getColumns(this.updatedTable);
    var val = event.target.value.toLowerCase();
    // filter our data
    let ref = this;
    let temp: any = [];

    if (val) {
      temp = this.updatedTable.filter(function (d: any) {
        let found = false;

        for (let i = 0; i < ref.columns.length; i++) {
          let value = d[ref.columns[i].data];
          if (typeof value === 'number') {
            value = value.toString()
          }

          if (value.toLowerCase().indexOf(val) !== -1) {
            found = true;
            break;
          }
        }
        return found;
      });
    } else {
      document.getElementById('spinner').style.display = 'block';
      temp = this.updatedTable;
    }

    // update the rows
    this.result = temp;
    this.onChangePage();
  }
}
