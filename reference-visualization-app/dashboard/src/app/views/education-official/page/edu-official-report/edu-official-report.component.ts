import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { Router } from "@angular/router";

import { environment } from "src/environments/environment";
import { AppServiceComponent } from "src/app/app.service";
import { CrcReportService } from "src/app/core/services/core-apis/crc-report.service";
import { getChartJSConfig, getScatterDatasetConfig } from "src/app/core/config/ChartjsConfig";
// import { Chart } from "highcharts";
declare const $;

@Component({
  selector: 'app-edu-official-report',
  templateUrl: './edu-official-report.component.html',
  styleUrls: ['./edu-official-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EduOfficialReportComponent implements OnInit {
  dataTable: any;
  dtOptions: any;
  tableData: any = [];

  @ViewChild("dataTable", { static: true }) table;

  public title: string = "";
  public titleName: string = "";
  public waterMark = environment.water_mark

  public districts: any;
  public blocks: any = [];
  public cluster: any = [];
  public schools: any = [];

  public districtsNames: any = [];
  public blocksNames: any = [];
  public clusterNames: any = [];
  public schoolsNames: any = [];

  public id: any = "";

  public blockHidden: boolean = true;
  public clusterHidden: boolean = true;

  public myDistrict: any;
  public myBlock: any;
  public myCluster: any;

  public colors: any;

  public studentCount: any;
  public schoolCount: any;

  public dateRange: any = "";

  public dist: boolean = false;
  public blok: boolean = false;
  public clust: boolean = false;
  public skul: boolean = true;

  public hierName: any;
  public distName: any;
  public blockName: any;
  public clustName: any;

  public visitCount: any;
  public visitedSchools: any;
  public notVisitedSchools: any;

  public styles: any = [];
  public labelOptions: any = {};

  public mylatlngData: any = [];
  public result: any = [];

  public scatterChart: Chart;
  public xAxis: any = "visit_0";
  public yAxis: any = "visit_1_2";

  public crcDistrictsNames: any;
  public crcBlocksNames: any;
  public crcClusterNames: any;
  public crcSchoolNames: any;

  public fileName: any;
  public reportData: any = [];

  dashletData: any;
  config: any;

  public xAxisFilter = [
    { key: "visit_0", value: "% Schools (No Visit)" },
    { key: "visit_1_2", value: "% Schools (1 to 2 Visits)" },
    { key: "visit_3_5", value: "% Schools (3 to 5 Visits)" },
    { key: "visit_6_10", value: "% Schools (6 to 10 Visits)" },
    { key: "visit_10_more", value: "% Schools (More than 10 Visits)" },
    { key: "no_of_schools_per_crc", value: "Number of schools per CRC" },
    { key: "visits_per_school", value: "Visits per schools" },
    { key: "visitedSchoolCount", value: "Visited schools count" },
    { key: "totalSchools", value: "Total schools" },
    { key: "totalVisits", value: "Total visits" },
  ];

  public yAxisFilter = [
    { key: "visit_0", value: "% Schools (No Visit)" },
    { key: "visit_1_2", value: "% Schools (1 to 2 Visits)" },
    { key: "visit_3_5", value: "% Schools (3 to 5 Visits)" },
    { key: "visit_6_10", value: "% Schools (6 to 10 Visits)" },
    { key: "visit_10_more", value: "% Schools (More than 10 Visits)" },
    { key: "no_of_schools_per_crc", value: "Number of schools per CRC" },
    { key: "visits_per_school", value: "Visits per schools" },
    { key: "visitedSchoolCount", value: "Visited schools count" },
    { key: "totalSchools", value: "Total schools" },
    { key: "totalVisits", value: "Total visits" },
  ];

  public getMonthYear: any;
  public years: any = [];
  public year;
  public months: any = [];
  public month;
  yearMonth = true;
  month_year: { month: any; year: any };

  managementName;
  management;
  category;

  monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  timeRange = [
    { key: "overall", value: "Overall" },
    { key: "last_30_days", value: "Last 30 Days" },
    { key: "last_7_days", value: "Last 7 Days" },
    { key: "last_day", value: "Last Day" },
    { key: "select_month", value: "Year and Month" },
  ];
  period = "overall";
  labels: any = [];
  obj: Object = {};

  myData;
  state: string;
  public allMonths: any = ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];
  constructor(
    public http: HttpClient,
    public service: CrcReportService,
    public router: Router,
    private changeDetection: ChangeDetectorRef,
    public commonService: AppServiceComponent,
    private readonly _router: Router
  ) {
    localStorage.removeItem("resData");
    this.commonService.callProgressCard.subscribe(value => {
      if (value) {
        this.goToprogressCard();
        this.commonService.setProgressCardValue(false);
      }
    })
  }

  height = window.innerHeight;
  public h = "44vh";
  onResize() {
    if (this.chartData.length !== 0) {
      this.changeDetection.detectChanges();
      this.height = window.innerHeight;
      this.h = this.height > 1760 ? "60vh" : this.height > 1160 && this.height < 1760 ? "60vh" : this.height > 667 && this.height < 1160 ? "52vh" : "44vh";
      this.createChart(this.labels, this.chartData, this.tableHead, this.obj);
    }
  }

  public userAccessLevel = localStorage.getItem("userLevel");
  public hideIfAccessLevel: boolean = false
  public hideAccessBtn: boolean = false

  ngOnInit() {
    this.state = this.commonService.state;

    this.managementName = this.management = JSON.parse(localStorage.getItem('management')).id;
    this.category = JSON.parse(localStorage.getItem('category')).id;
    this.managementName = this.commonService.changeingStringCases(
      this.managementName.replace(/_/g, " ")
    );
    let params = JSON.parse(sessionStorage.getItem("report-level-info"));
    this.service.getMonthYear().subscribe((res) => {
      this.getMonthYear = res['data'];
      this.getMonthYear.map((item) => {
        this.years.push(item["academic_year"]);
      });
      this.year = this.years[this.years.length - 1];

      this.months = [];
      this.getMonthYear.map((item) => {
        if (item["academic_year"] == this.year) {
          this.months = item["month"];
        }
      });
      this.months.sort((a, b) => {
        return this.allMonths.indexOf(a) - this.allMonths.indexOf(b);
      });
      this.month = this.months[this.months.length - 1];
      if (this.month) {
        this.month_year = {
          month: null,
          year: null,
        };
      }
      if (params) this.period = params.timePeriod;
      if (params && params.level) {
        let data = params.data;
        if (params.level === "district") {
          this.myDistrict = data.id;
          this.getDistricts(params.level);
        } else if (params.level === "block") {
          this.myDistrict = data.districtId;
          this.myBlock = data.id;
          this.getDistricts(params.level);
          this.getBlocks(params.level, data.districtId, data.id);
        } else if (params.level === "cluster") {
          this.myDistrict = data.districtId;
          this.myBlock = data.blockId;
          this.myCluster = data.id;
          this.getDistricts(params.level);
          this.getBlocks(params.level, data.districtId, data.blockId);
          this.getClusters(data.districtId, data.blockId, data.id);
        }
      } else {
        if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
          this.onResize();
          this.levelWiseFilter()
        } else {
          this.getView()
        }

      }

    }, err => {
      this.commonService.loaderAndErr([]);
    });
    this.hideAccessBtn = (environment.auth_api === 'cqube' || this.userAccessLevel === "") ? true : false;
    this.selDist = (environment.auth_api === 'cqube' || this.userAccessLevel === '') ? false : true;

    if (environment.auth_api !== 'cqube') {
      if (this.userAccessLevel !== "") {
        this.hideIfAccessLevel = true;
      }

    }


  }

  selCluster = false;
  selBlock = false;
  selDist = false;
  levelVal = 0;
  level
  schoolLevel = false
  hideFooter = false
  getView() {
    let id = JSON.parse(localStorage.getItem("userLocation"));
    let level = localStorage.getItem("userLevel");
    let clusterid = JSON.parse(localStorage.getItem("clusterId"));
    let blockid = JSON.parse(localStorage.getItem("blockId"));
    let districtid = JSON.parse(localStorage.getItem("districtId"));
    let schoolid = JSON.parse(localStorage.getItem("schoolId"));
    this.schoolLevel = level === "School" ? true : false

    if (level === "School") {
      this.hideFooter = true
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;

      this.getDistricts('cluster');
      this.getBlocks('cluster', districtid, blockid)
      this.getClusters(districtid, blockid, clusterid)

      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;

      this.levelVal = 3;
    } else if (level === "Cluster") {
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;

      this.getDistricts('cluster');
      this.getBlocks('cluster', districtid, blockid)
      this.getClusters(districtid, blockid, clusterid)

      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;

      this.levelVal = 3;
    } else if (level === "Block") {
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;

      this.getDistricts('block');

      this.getBlocks('block', districtid, blockid)
      this.blockHidden = true

      this.selCluster = false;
      this.selBlock = true;
      this.selDist = true;

      this.levelVal = 2;
    } else if (level === "District") {
      this.myDistrict = districtid;
      this.getDistricts('district')
      this.selCluster = false;
      this.selBlock = false;
      this.selDist = false;

      this.levelVal = 1;
    }
  }
  getView1() {
    let id = JSON.parse(localStorage.getItem("userLocation"));
    let level = localStorage.getItem("userLevel");

    if (level === "Cluster") {
      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;
      this.levelVal = 3;
    } else if (level === "Block") {
      this.selCluster = false;
      this.selBlock = true;
      this.selDist = true;
      this.levelVal = 2;
    } else if (level === "District") {
      this.selCluster = false;
      this.selBlock = false;
      this.selDist = true;
      this.levelVal = 1;
    }
  }

  distlevel(id) {
    this.selCluster = false;
    this.selBlock = false;
    this.selDist = true;
    this.level = "blockPerDistrict";
    this.myDistrict = id;
    this.levelWiseFilter();
  }

  blocklevel(id) {
    this.selCluster = false;
    this.selBlock = true;
    this.selDist = true;
    this.level = "clusterPerBlock";
    this.myBlock = id;
    this.levelWiseFilter();

  }

  clusterlevel(id) {
    this.selCluster = true;
    this.selBlock = true;
    this.selDist = true;
    this.level = "schoolPerCluster";
    this.myCluster = id;
    this.levelWiseFilter();
  }

  getDistricts(level): void {
    this.service
      .crcDistWiseData({ ...{ timePeriod: this.period }, ...this.month_year, ...{ management: this.management, category: this.category } })
      .subscribe((res) => {
        localStorage.setItem("resData", JSON.stringify(res));
        this.result = res;
        let a = this.result.schoolsVisitedCount;
        this.result = this.result.visits;
        this.crcDistrictsNames = this.result;

        for (var i = 0; i < this.result.length; i++) {
          if (this.myDistrict == this.result[i].districtId) {
            localStorage.setItem("dist", this.result[i].districtName);
            localStorage.setItem("distId", this.myDistrict);
          }

          this.districtsNames.push({
            id: this.result[i].districtId,
            name: this.result[i].districtName,
          });
        }
        this.crcDistrictsNames.sort((a, b) =>
          a.districtName > b.districtName
            ? 1
            : b.districtName > a.districtName
              ? -1
              : 0
        );

        if (level === "district") {
          this.myDistData(this.myDistrict, true);
        }
      }, err => {
        this.commonService.loaderAndErr([]);
      });
  }

  getBlocks(level, distId, blockId?: any): void {

    this.service
      .crcBlockWiseData(distId, {
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe((result: any) => {
        this.crcBlocksNames = result;

        this.reportData = this.crcBlocksNames = this.crcBlocksNames.visits;
        for (var i = 0; i < this.crcBlocksNames.length; i++) {
          if (blockId == this.crcBlocksNames[i].blockId) {
            localStorage.setItem("block", this.crcBlocksNames[i].blockName);
            localStorage.setItem("blockid", blockId);
          }

          this.blocksNames.push({
            id: this.crcBlocksNames[i].blockId,
            name: this.crcBlocksNames[i].blockName,
          });
        }
        this.crcBlocksNames.sort((a, b) =>
          a.blockName > b.blockName ? 1 : b.blockName > a.blockName ? -1 : 0
        );

        if (level === "block") this.myBlockData(blockId, true);
      }, err => {
        this.commonService.loaderAndErr([]);
      });
  }

  getClusters(distId, blockId, clusterId): void {
    this.service
      .crcClusterWiseData(distId, blockId, {
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe((result: any) => {
        this.crcClusterNames = result.visits;
        this.reportData = this.crcClusterNames;

        localStorage.setItem("clusterid", clusterId);

        for (var i = 0; i < this.crcClusterNames.length; i++) {
          if (clusterId == this.crcClusterNames[i].clusterId) {
            localStorage.setItem(
              "cluster",
              this.crcClusterNames[i].clusterName
            );
          }
          this.clusterNames.push({
            id: this.crcClusterNames[i].clusterId,
            name: this.crcClusterNames[i].clusterName,
          });
        }
        this.crcClusterNames.sort((a, b) =>
          a.clusterName > b.clusterName
            ? 1
            : b.clusterName > a.clusterName
              ? -1
              : 0
        );

        this.myClusterData(clusterId, true);
      }, err => {
        this.commonService.loaderAndErr([]);
      });
  }

  public tableHead: any;
  public chartData: any = [];
  public modes: any;
  reportName = "crc_report";

  showYearMonth() {

    this.yearMonth = false;
    this.month_year = {
      month: this.monthNames.indexOf(this.month.trim()) + 1,
      year: this.year,
    };

    this.levelWiseFilter();
  }

  getMonth(event) {
    this.month_year = {
      month: this.monthNames.indexOf(this.month.trim()) + 1,
      year: this.year,
    };
    this.levelWiseFilter();
  }

  getYear() {
    this.months = [];
    this.month = undefined;
    this.getMonthYear.map((item) => {
      if (item["academic_year"] == this.year) {
        this.months = item["month"];
      }
    });
  }

  onPeriodSelect() {
    if (this.period != "overall") {

    } else {

    }
    this.yearMonth = true;
    this.month_year = {
      month: null,
      year: null,
    };
    this.levelWiseFilter()
  }
  onClockHome() {
    this.period = "overall";
    this.yearMonth = true;
    this.month_year = {
      month: null,
      year: null,
    };
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.districtWise();
    } else {
      this.getView()
    }

  }

  districtWise() {
    if ($.fn.DataTable.isDataTable("#table")) {
      $("#table").DataTable().destroy();
      $("#table").empty();
    }
    this.changeDetection.detectChanges();
    this.reportData = [];
    this.tableHead = "District Name";
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_allDistricts_${this.commonService.dateAndTime}`;
    this.blockHidden = true;
    this.clusterHidden = true;
    this.crcDistrictsNames = [];
    this.visitedSchools = 0;
    this.notVisitedSchools = 0;
    this.myDistrict = "";
    this.commonService.errMsg();
    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.skul = true;

    this.schoolCount = 0;
    this.visitCount = 0;

    this.tableData = [];

    this.dateRange = localStorage.getItem("dateRange");
    this.schoolCount = 0;
    this.visitCount = 0;
    this.chartData = [];

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcDistWiseData({ ...{ timePeriod: this.period }, ...this.month_year, ...{ management: this.management, category: this.category } })
      .subscribe(
        (res) => {
          localStorage.setItem("resData", JSON.stringify(res));
          this.result = res;
          let a = this.result.schoolsVisitedCount;
          this.result = this.result.visits;

          this.modes = [
            "District Wise",
            "Block Wise",
            "Cluster Wise",
            "School Wise",
          ];
          this.reportData = [];
          if (this.result.length > 0) {
            var labels = [];
            this.reportData = this.crcDistrictsNames = this.result;
            for (var i = 0; i < this.result.length; i++) {
              this.districtsNames.push({
                id: this.result[i].districtId,
                name: this.result[i].districtName,
              });
              labels.push(this.result[i].districtName);
              this.chartData.push({
                x: Number(this.result[i][this.xAxis]),
                y: Number(this.result[i][this.yAxis]),
              });
            }
            this.crcDistrictsNames.sort((a, b) =>
              a.districtName > b.districtName
                ? 1
                : b.districtName > a.districtName
                  ? -1
                  : 0
            );

            this.countVisitedAndNotVisited(a);

            let x_axis = this.xAxisFilter.find((o) => o.key == this.xAxis);
            let y_axis = this.yAxisFilter.find((o) => o.key == this.yAxis);
            let obj = {
              xAxis: x_axis.value,
              yAxis: y_axis.value,
            };
            this.labels = labels;
            this.obj = obj;
            this.createChart(labels, this.chartData, this.tableHead, obj);
            this.tableData = this.result;
            this.dtOptions = {
              data: this.tableData,
              iDisplayLength: this.result.length,
              bLengthChange: false,
              bInfo: false,
              bPaginate: false,
              scrollY: "auto",
              scrollCollapse: true,
              paging: false,
              searching: false,
              retrieve: true,
              bDestroy: true,
              autoWidth: false,
              fixedColumns: {
                leftColumns: 1,
              },
              columns: [
                { title: "District Name", data: "districtName" },
                { title: "% Schools (No Visit)", data: "visit_0" },
                { title: "% Schools (1 to 2 Visits)", data: "visit_1_2" },
                { title: "% Schools (3 to 5 Visits)", data: "visit_3_5" },
                { title: "% Schools (6 to 10 Visits)", data: "visit_6_10" },
                {
                  title: "% Schools (More than 10 Visits)",
                  data: "visit_10_more"
                },
                {
                  title: "Number of schools per CRC",
                  data: "no_of_schools_per_crc"
                },
                { title: "Visits per schools", data: "visits_per_school" },
                { title: "Visited schools count", data: "visitedSchoolCount" },
                { title: "Total schools", data: "totalSchools" },
                { title: "Total visits", data: "totalVisits" },
              ],
            };
            this.dataTable = $(this.table.nativeElement);
            this.dataTable.DataTable(this.dtOptions);

            this.commonService.loaderAndErr(this.chartData);
            this.changeDetection.detectChanges();
          }
        },
        (err) => {
          this.chartData = [];
          this.scatterChart.destroy();
          this.createChart([], [], "", {});
          $("#table").empty();
          this.changeDetection.detectChanges();
          this.commonService.loaderAndErr(this.chartData);
        }
      );
  }

  distWise() {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.reportData = [];
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_allDistricts_${this.commonService.dateAndTime}`;
    if (JSON.parse(localStorage.getItem("resData")) !== null) {
      this.chartData = [];
      this.result = JSON.parse(localStorage.getItem("resData"));
      this.result = this.result.visits;
      this.reportData = this.result;
      this.downloadReport();
    } else {
      alert("No data found to download");
    }
  }

  blockWise() {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.reportData = [];
    this.commonService.errMsg();
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_allBlocks_${this.commonService.dateAndTime}`;
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcAllBlockWiseData({
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        (res) => {
          this.reportData = res["visits"];
          if (res !== null) {
            document.getElementById("spinner").style.display = "none";
          }
          this.downloadReport();
          this.changeDetection.markForCheck();
        },
        (err) => {
          alert("No data found to download");
          this.chartData = [];
          this.commonService.loaderAndErr(this.chartData);
        }
      );
  }

  clusterWise() {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.reportData = [];
    this.commonService.errMsg();
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_allClusters_${this.commonService.dateAndTime}`;
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcAllClusterWiseData({
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        (res) => {
          this.reportData = res["visits"];
          if (res !== null) {
            document.getElementById("spinner").style.display = "none";
          }
          this.downloadReport();
          this.changeDetection.markForCheck();
        },
        (err) => {
          alert("No data found to download");
          this.chartData = [];
          this.commonService.loaderAndErr(this.chartData);
        }
      );
  }

  schoolWise() {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.reportData = [];
    this.commonService.errMsg();
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_allSchools_${this.commonService.dateAndTime}`;
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcAllSchoolWiseData({
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        (res) => {
          this.reportData = res["visits"];
          if (res !== null) {
            document.getElementById("spinner").style.display = "none";
          }
          this.downloadReport();
          this.changeDetection.markForCheck();
        },
        (err) => {
          alert("No data found to download");
          this.chartData = [];
          this.commonService.loaderAndErr(this.chartData);
        }
      );
  }

  myDistData(data, fromParam = false, bid?, cid?) {

    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.modes = [];
    this.downloadType = "";
    this.blockHidden = false;
    this.clusterHidden = true;
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_blocks_of_district_${data}_${this.commonService.dateAndTime}`;
    this.myBlock = "";
    this.crcBlocksNames = [];
    this.visitedSchools = 0;
    this.notVisitedSchools = 0;
    this.commonService.errMsg();
    this.schoolCount = 0;
    this.visitCount = 0;
    this.tableData = [];
    this.chartData = [];
    this.reportData = [];
    this.tableHead = "Block Name";
    this.dist = true;
    this.blok = false;
    this.clust = false;
    this.skul = false;
    let obj = this.districtsNames.find((o) => o.id == data);
    this.distName = data;
    this.hierName = obj?.name;
    localStorage.setItem("dist", obj?.name);
    localStorage.setItem("distId", data);

    if (this.myData) {
      this.myData.unsubscribe();

    }
    this.myData = this.service
      .crcBlockWiseData(data, {
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        (result: any) => {

          if (!fromParam) {
            if ($.fn.DataTable.isDataTable("#table")) {
              $("#table").DataTable().destroy();
              $("#table").empty();
            }
          }
          this.crcBlocksNames = result;

          let a = this.crcBlocksNames.schoolsVisitedCount;
          this.reportData = this.crcBlocksNames = this.crcBlocksNames.visits;

          if (this.result.length > 0) {
            var labels = [];
            for (var i = 0; i < this.crcBlocksNames.length; i++) {
              this.blocksNames.push({
                id: this.crcBlocksNames[i].blockId,
                name: this.crcBlocksNames[i].blockName,
              });
              labels.push(this.crcBlocksNames[i].blockName);
              this.chartData.push({
                x: Number(this.crcBlocksNames[i][this.xAxis]),
                y: Number(this.crcBlocksNames[i][this.yAxis]),
              });
            }

            this.crcBlocksNames.sort((a, b) =>
              a.blockName > b.blockName ? 1 : b.blockName > a.blockName ? -1 : 0
            );
            this.countVisitedAndNotVisited(a);

            let x_axis = this.xAxisFilter.find((o) => o.key == this.xAxis);
            let y_axis = this.yAxisFilter.find((o) => o.key == this.yAxis);
            let obj = {
              xAxis: x_axis.value,
              yAxis: y_axis.value,
            };
            this.labels = labels;
            this.obj = obj;
            this.createChart(labels, this.chartData, this.tableHead, obj);
            this.changeDetection.detectChanges();
            this.tableData = this.crcBlocksNames;
            this.dtOptions = {
              data: this.tableData,
              iDisplayLength: this.crcBlocksNames.length,
              bLengthChange: false,
              bInfo: false,
              bPaginate: false,
              scrollbars: false,
              scrollY: "auto",
              scrollCollapse: true,
              paging: false,
              searching: false,
              retrieve: true,
              bDestroy: true,
              fixedColumns: {
                leftColumns: 1,
              },
              columns: [
                { title: "District Name", data: "districtName" },
                { title: "Block Name", data: "blockName" },
                { title: "% Schools (No Visit)", data: "visit_0" },
                { title: "% Schools (1 to 2 Visits)", data: "visit_1_2" },
                { title: "% Schools (3 to 5 Visits)", data: "visit_3_5" },
                { title: "% Schools (6 to 10 Visits)", data: "visit_6_10" },
                {
                  title: "% Schools (More than 10 Visits)",
                  data: "visit_10_more"

                },
                {
                  title: "Number of schools per CRC",
                  data: "no_of_schools_per_crc"
                },
                { title: "Visits per schools", data: "visits_per_school" },
                { title: "Visited schools count", data: "visitedSchoolCount" },
                { title: "Total schools", data: "totalSchools" },
                { title: "Total visits", data: "totalVisits" },
              ],
            };
            this.dataTable = $(this.table.nativeElement);
            this.dataTable.DataTable(this.dtOptions);

            this.changeDetection.markForCheck();
            this.commonService.loaderAndErr(this.chartData);
          }
          if (bid) {
            this.myBlockData(bid, false, cid);
          }
        },
        (err) => {
          this.chartData = [];
          this.scatterChart.destroy();
          this.createChart([], [], "", {});
          $("#table").empty();
          this.changeDetection.detectChanges();
          this.commonService.loaderAndErr(this.chartData);
        }
      );

    this.blocksNames.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0
    );

  }

  myBlockData(data: any, fromParam = false, cid?) {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.modes = [];
    this.downloadType = "";
    this.clusterHidden = false;

    this.blockHidden = localStorage.getItem('userLevel') === 'Block' ? true : false;

    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_clusters_of_block_${data}_${this.commonService.dateAndTime}`;
    this.myCluster = "";
    this.crcClusterNames = [];
    this.visitedSchools = 0;
    this.notVisitedSchools = 0;
    this.commonService.errMsg();
    this.schoolCount = 0;
    this.visitCount = 0;
    this.tableData = [];
    this.chartData = [];
    this.reportData = [];
    this.tableHead = "Cluster Name";
    this.dist = false;
    this.blok = true;
    this.clust = false;
    this.skul = false;

    localStorage.setItem("blockid", data);
    this.titleName = localStorage.getItem("dist");
    this.distName = localStorage.getItem("distId");
    this.blockName = data;

    let obj = this.blocksNames.find((o) => o.id == data);
    localStorage.setItem("block", JSON.stringify(obj?.name));

    this.hierName = obj?.name;

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcClusterWiseData(this.myDistrict, data, {
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        (result: any) => {

          if (!fromParam) {

            if ($.fn.DataTable.isDataTable("#table")) {
              $("#table").DataTable().destroy();
              $("#table").empty();
            }
            this.changeDetection.detectChanges();
          }


          this.crcClusterNames = result;
          let a = this.crcClusterNames.schoolsVisitedCount;
          this.crcClusterNames = this.crcClusterNames.visits;
          this.reportData = this.crcClusterNames;

          var labels = [];
          for (var i = 0; i < this.crcClusterNames.length; i++) {
            this.clusterNames.push({
              id: this.crcClusterNames[i].clusterId,
              name: this.crcClusterNames[i].clusterName,
            });
            labels.push(this.crcClusterNames[i].clusterName);
            this.chartData.push({
              x: Number(this.crcClusterNames[i][this.xAxis]),
              y: Number(this.crcClusterNames[i][this.yAxis]),
            });
          }
          this.crcClusterNames.sort((a, b) =>
            a.clusterName > b.clusterName
              ? 1
              : b.clusterName > a.clusterName
                ? -1
                : 0
          );
          this.countVisitedAndNotVisited(a);

          let x_axis = this.xAxisFilter.find((o) => o.key == this.xAxis);
          let y_axis = this.yAxisFilter.find((o) => o.key == this.yAxis);
          let obj = {
            xAxis: x_axis.value,
            yAxis: y_axis.value,
          };
          this.labels = labels;
          this.obj = obj;
          this.createChart(labels, this.chartData, this.tableHead, obj);
          this.changeDetection.detectChanges();
          this.tableData = this.crcClusterNames;
          this.dtOptions = {
            data: this.tableData,
            iDisplayLength: this.crcClusterNames.length,
            bLengthChange: false,
            bInfo: false,
            bPaginate: false,
            scrollY: "auto",
            scrollCollapse: true,
            paging: false,
            searching: false,
            retrieve: true,
            bDestroy: true,
            fixedColumns: {
              leftColumns: 1,
            },
            columns: [
              { title: "District Name", data: "districtName" },
              { title: "Block Name", data: "blockName" },
              { title: "Cluster Name", data: "clusterName" },
              { title: "% Schools (No Visit)", data: "visit_0" },
              { title: "% Schools (1 to 2 Visits)", data: "visit_1_2" },
              { title: "% Schools (3 to 5 Visits)", data: "visit_3_5" },
              { title: "% Schools (6 to 10 Visits)", data: "visit_6_10" },
              {
                title: "% Schools (More than 10 Visits)",
                data: "visit_10_more"
              },
              {
                title: "Number of schools per CRC",
                data: "no_of_schools_per_crc"
              },
              { title: "Visits per schools", data: "visits_per_school" },
              { title: "Visited schools count", data: "visitedSchoolCount" },
              { title: "Total schools", data: "totalSchools" },
              { title: "Total visits", data: "totalVisits" },
            ],
          };
          this.dataTable = $(this.table.nativeElement);
          this.dataTable.DataTable(this.dtOptions);

          this.changeDetection.markForCheck();
          this.commonService.loaderAndErr(this.chartData);
          if (cid) {
            this.myClusterData(cid, false);
          }
        },
        (err) => {
          this.chartData = [];
          this.scatterChart.destroy();
          this.createChart([], [], "", {});
          $("#table").empty();
          this.changeDetection.detectChanges();
          this.commonService.loaderAndErr(this.chartData);
        }
      );
    this.blocksNames.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0
    );

  }

  myClusterData(data: any, fromParam = false) {
    if (this.period === "select_month" && !this.month || this.month === '') {
      alert("Please select month!");
      return;
    }
    this.modes = [];
    this.downloadType = "";
    this.tableHead = "School Name";
    this.commonService.errMsg();
    this.schoolCount = 0;
    this.visitCount = 0;
    this.fileName = `${this.reportName}_${this.period != 'select_month' ? this.period : this.month_year.year + '_' + this.month_year.month}_schools_of_cluster_${data}_${this.commonService.dateAndTime}`;
    this.crcSchoolNames = [];
    this.visitedSchools = 0;
    this.notVisitedSchools = 0;
    this.dist = false;
    this.blok = false;
    this.clust = true;
    this.skul = false;
    this.tableData = [];
    this.chartData = [];
    this.reportData = [];
    this.title = localStorage.getItem("block").replace(/^"(.+(?="$))"$/, "$1");
    this.titleName = localStorage.getItem("dist");
    var distId = this.myDistrict;
    var blockId = this.myBlock;
    this.distName = this.myDistrict;
    this.blockName = blockId;
    this.clustName = data;
    let obj = this.clusterNames.find((o) => o.id == data);
    this.hierName = obj?.name;
    localStorage.setItem("clusterid", data);

    this.clusterHidden = false;


    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service
      .crcSchoolWiseData(distId, blockId, data, {
        ...{
          ...{ timePeriod: this.period },
          ...this.month_year,
        }, ...{ management: this.management, category: this.category }
      })
      .subscribe(
        async (result: any) => {
          if (!fromParam) {
            if ($.fn.DataTable.isDataTable("#table")) {
              $("#table").DataTable().destroy();
              $("#table").empty();
            }
            this.changeDetection.detectChanges();
          }
          let a
          if (this.schoolLevel) {
            let schoolData = result.visits;

            let data = schoolData.filter(data => data.schoolId === Number(localStorage.getItem('schoolId')))

            this.crcSchoolNames = result;
            a = this.crcSchoolNames.schoolsVisitedCount;
            this.reportData = this.crcSchoolNames = data;
          } else {
            this.crcSchoolNames = result;
            a = this.crcSchoolNames.schoolsVisitedCount;
            this.reportData = this.crcSchoolNames = this.crcSchoolNames.visits;
          }

          var labels = [];
          for (var i = 0; i < this.crcSchoolNames.length; i++) {
            if (
              typeof parseInt(this.crcSchoolNames[i].totalSchools) ===
              "number" &&
              typeof parseInt(this.crcSchoolNames[i].totalVisits) === "number"
            ) {
              this.schoolCount =
                this.schoolCount +
                parseInt(this.crcSchoolNames[i].totalSchools);
              this.visitCount =
                this.visitCount + Number(this.crcSchoolNames[i].totalVisits);
            }
            labels.push(this.crcSchoolNames[i].schoolName);
            this.chartData.push({
              x: Number(this.crcSchoolNames[i][this.xAxis]),
              y: Number(this.crcSchoolNames[i][this.yAxis]),
            });
          }

          this.countVisitedAndNotVisited(a);

          let x_axis = this.xAxisFilter.find((o) => o.key == this.xAxis);
          let y_axis = this.yAxisFilter.find((o) => o.key == this.yAxis);
          let obj = {
            xAxis: x_axis.value,
            yAxis: y_axis.value,
          };
          this.labels = labels;
          this.obj = obj;
          this.createChart(labels, this.chartData, this.tableHead, obj);
          this.changeDetection.detectChanges();
          this.tableData = this.crcSchoolNames;
          this.dtOptions = {
            data: this.tableData,
            iDisplayLength: this.crcSchoolNames.length,
            bLengthChange: false,
            bInfo: false,
            bPaginate: false,
            scrollY: "auto",
            scrollCollapse: true,
            paging: false,
            searching: false,
            retrieve: true,
            bDestroy: true,
            fixedColumns: {
              leftColumns: 1,
            },
            columns: [
              { title: "District Name", data: "districtName" },
              { title: "Block Name", data: "blockName" },
              { title: "Cluster Name", data: "clusterName" },
              { title: "School Name", data: "schoolName" },
              { title: "% Schools (No Visit)", data: "visit_0" },
              { title: "% Schools (1 to 2 Visits)", data: "visit_1_2" },
              { title: "% Schools (3 to 5 Visits)", data: "visit_3_5" },
              { title: "% Schools (6 to 10 Visits)", data: "visit_6_10" },
              {
                title: "% Schools (More than 10 Visits)",
                data: "visit_10_more",
              },
              {
                title: "Number of schools per CRC",
                data: "no_of_schools_per_crc",
              },
              { title: "Visits per schools", data: "visits_per_school" },
              { title: "Total schools", data: "totalSchools" },
              { title: "Total visits", data: "totalVisits" },
            ],
          };
          this.dataTable = $(this.table.nativeElement);
          this.dataTable.DataTable(this.dtOptions);

          this.commonService.loaderAndErr(this.chartData);
          this.changeDetection.markForCheck();
        },
        (err) => {
          this.chartData = [];
          this.scatterChart.destroy();
          this.createChart([], [], "", {});
          $("#table").empty();
          this.changeDetection.detectChanges();
          this.commonService.loaderAndErr(this.chartData);
        }
      );

  }

  countVisitedAndNotVisited(a) {
    this.visitCount = a.totalNumberOfVisits
      .toString()
      .replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    this.schoolCount = a.totalNumberOfSchools
      .toString()
      .replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    this.visitedSchools = a.totalSchoolsVisited
      .toString()
      .replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
    this.notVisitedSchools = a.totalSchoolsNotVisited
      .toString()
      .replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
  }

  createChart(labels, chartData, name, obj) {
    this.changeDetection.detectChanges();
    this.config = getChartJSConfig({
      labelExpr: obj.xAxis,
      datasets: getScatterDatasetConfig([{
        label: obj.xAxis,
        data: chartData
      }]),
      options: {
        height: "300",
        legend: {
          display: false
        },
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              var label = labels[tooltipItem.index];
              var multistringText = [name + " : " + label];
              multistringText.push(obj.xAxis + " : " + tooltipItem.xLabel.toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,"));
              multistringText.push(obj.yAxis + " : " + tooltipItem.yLabel.toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,"));
              return multistringText;
            }
          }
        },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: obj.xAxis
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: obj.yAxis
              },
            },
          ],
        },
      }
    });

    this.dashletData = { values: chartData };

    // console.log('config', this.config);
     this.changeDetection.detectChanges();


    // if (this.scatterChart) {
    //   this.scatterChart.destroy();
    // }
    // var ctx = $("#myChart");
    // ctx.attr("height", this.h);
    // this.scatterChart = new Chart("myChart", {
    //   type: "scatter",
    //   data: {
    //     labels: labels,
    //     datasets: [
    //       {
    //         data: chartData,
    //         pointBackgroundColor: "#4890b5",
    //         pointBorderColor: "#7cd6cc",
    //         pointBorderWidth: 0.5,
    //         pointRadius:
    //           this.height > 1760
    //             ? 16
    //             : this.height > 1160 && this.height < 1760
    //               ? 12
    //               : this.height > 667 && this.height < 1160
    //                 ? 8
    //                 : 5,
    //         pointHoverRadius:
    //           this.height > 1760
    //             ? 18
    //             : this.height > 1160 && this.height < 1760
    //               ? 14
    //               : this.height > 667 && this.height < 1160
    //                 ? 9
    //                 : 6,
    //       },
    //     ],
    //   },
    //   options: {
    //     legend: {
    //       display: false,
    //     },
    //     responsive: true,
    //     tooltips: {
    //       mode: 'index',
    //       titleFontSize: 16,
    //       cornerRadius: 10,
    //       xPadding:
    //         this.height > 1760
    //           ? 30
    //           : this.height > 1160 && this.height < 1760
    //             ? 20
    //             : this.height > 667 && this.height < 1160
    //               ? 10
    //               : 7,
    //       yPadding:
    //         this.height > 1760
    //           ? 30
    //           : this.height > 1160 && this.height < 1760
    //             ? 20
    //             : this.height > 667 && this.height < 1160
    //               ? 10
    //               : 7,
    //       bodyFontSize:
    //         this.height > 1760
    //           ? 32
    //           : this.height > 1160 && this.height < 1760
    //             ? 22
    //             : this.height > 667 && this.height < 1160
    //               ? 12
    //               : 10,
    //       displayColors: false,
    //       custom: function (tooltip) {
    //         if (!tooltip) return;
    //         // disable displaying the color box;
    //         tooltip.displayColors = false;
    //       },
    //       callbacks: {
    //         label: function (tooltipItem, data) {
    //           var label = data.labels[tooltipItem.index];
    //           var multistringText = [name + ":" + label];
    //           multistringText.push(obj.xAxis + ": " + tooltipItem.xLabel);
    //           multistringText.push(obj.yAxis + ": " + tooltipItem.yLabel);
    //           return multistringText;
    //         },
    //       },
    //     },

    //     scales: {
    //       xAxes: [
    //         {
    //           gridLines: {
    //             color: "rgba(252, 239, 252)",
    //           },
    //           ticks: {
    //             fontColor: "black",
    //             min: 0,
    //             fontSize:
    //               this.height > 1760
    //                 ? 30
    //                 : this.height > 1160 && this.height < 1760
    //                   ? 25
    //                   : this.height > 667 && this.height < 1160
    //                     ? 15
    //                     : 10,
    //           },
    //           scaleLabel: {
    //             fontColor: "black",
    //             display: true,
    //             labelString: obj.xAxis,
    //             fontSize:
    //               this.height > 1760
    //                 ? 32
    //                 : this.height > 1160 && this.height < 1760
    //                   ? 24
    //                   : this.height > 667 && this.height < 1160
    //                     ? 14
    //                     : 10,
    //           },
    //         },
    //       ],
    //       yAxes: [
    //         {
    //           gridLines: {
    //             color: "rgba(252, 239, 252)",
    //           },
    //           ticks: {
    //             fontColor: "black",
    //             min: 0,
    //             fontSize:
    //               this.height > 1760
    //                 ? 30
    //                 : this.height > 1160 && this.height < 1760
    //                   ? 25
    //                   : this.height > 667 && this.height < 1160
    //                     ? 15
    //                     : 10,
    //           },
    //           scaleLabel: {
    //             fontColor: "black",
    //             display: true,
    //             labelString: obj.yAxis,
    //             fontSize:
    //               this.height > 1760
    //                 ? 32
    //                 : this.height > 1160 && this.height < 1760
    //                   ? 24
    //                   : this.height > 667 && this.height < 1160
    //                     ? 14
    //                     : 10,
    //           },
    //         },
    //       ],
    //     },
    //   },
    // });
  }

  public downloadType: string;
  downloadReportofState(downloadType) {
    if (downloadType == "District Wise") {
      this.distWise();
    } else if (downloadType == "Block Wise") {
      this.blockWise();
    } else if (downloadType == "Cluster Wise") {
      this.clusterWise();
    } else if (downloadType == "School Wise") {
      this.schoolWise();
    } else {
      alert("Please select download type");
    }
  }

  downloadReport() {
    var position = this.reportName.length;
    this.fileName = [this.fileName.slice(0, position), `_${this.management}`, this.fileName.slice(position)].join('');
    this.commonService.download(this.fileName, this.reportData);
  }

  selectAxis() {
    this.levelWiseFilter();
  }

  levelWiseFilter() {

    if (this.skul) {
      this.districtWise();
    }
    if (this.dist) {
      this.myDistData(localStorage.getItem("distId"));
    }
    if (this.blok) {
      this.myBlockData(localStorage.getItem("blockid"));
    }
    if (this.clust) {
      this.myClusterData(localStorage.getItem("clusterid"));
    }
  }



  redirectTo() {
    this.router.navigate(["home/dashboard"]);
  }

  goToprogressCard(): void {
    let data: any = {};

    if (this.dist) {
      data.level = "district";
      data.value = this.myDistrict;
    } else if (this.blok) {
      data.level = "block";
      data.value = this.myBlock;
    } else if (this.clust) {
      data.level = "cluster";
      data.value = this.myCluster;
    } else {
      data.level = "state";
      data.value = null;
    }
    data["timePeriod"] = this.period;

    sessionStorage.setItem("progress-card-info", JSON.stringify(data));
    this._router.navigate(["/progressCard"]);
  }
}
