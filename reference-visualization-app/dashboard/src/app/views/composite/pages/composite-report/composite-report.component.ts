import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { AppServiceComponent } from 'src/app/app.service';
import { environment } from 'src/environments/environment';
import { CompositReportService } from 'src/app/core/services/core-apis/composite-report.service';
import { getChartJSConfig, getScatterDatasetConfig } from 'src/app/core/config/ChartjsConfig';
import { formatNumberForReport } from 'src/app/utilities/NumberFomatter';
declare const $;

@Component({
  selector: 'app-composite-report',
  templateUrl: './composite-report.component.html',
  styleUrls: ['./composite-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CompositeReportComponent implements OnInit {

  public scatterChart: Chart;
  public result: any = [];
  public xAxis: any;
  public yAxis: any;
  public xAxisFilter: any = [];
  public yAxisFilter: any = [];
  public downloadLevel = '';

  public waterMark = environment.water_mark

  public districtsNames: any = [];
  public blockNames: any = [];
  public clusterNames: any = [];

  public SchoolInfrastructureDistrictsNames;
  public SchoolInfrastructureBlocksNames;
  public SchoolInfrastructureClusterNames;
  public SchoolInfrastructureSchoolNames;

  public myDistrict: any;
  public myBlock: any;
  public myCluster: any;

  public blockHidden = true;
  public clusterHidden = true;

  public dist: boolean = false;
  public blok: boolean = false;
  public clust: boolean = false;
  public skul: boolean = true;

  public title: string = '';
  public titleName: string = '';

  public hierName: any;
  public distName: any;
  public blockName: any;
  public clustName: any;

  public fileName: any;
  public reportData: any;
  public myData;
  public downloadType: string;
  state: string;

  selected = '';
  managementName;
  management;
  category;
  config;
  dashletData;
  height = window.innerHeight;
  onResize() {
    this.height = window.innerHeight;
    if (this.chartData.length !== 0) {
      /* this.scatterChart.destroy(); */
    }
  }


  constructor(public http: HttpClient, public service: CompositReportService, public router: Router, private changeDetection: ChangeDetectorRef, public commonService: AppServiceComponent,) {
    localStorage.removeItem('resData');
  }

  public userAccessLevel = localStorage.getItem("userLevel");
  public hideIfAccessLevel: boolean = false
  public hideAccessBtn: boolean = false


  ngOnInit() {
    this.state = this.commonService.state;
    // document.getElementById('accessProgressCard').style.display = 'none';

    this.managementName = this.management = JSON.parse(localStorage.getItem('management'))?.id;
    this.category = JSON.parse(localStorage.getItem('category'))?.id;
    if (this.managementName) {
      this.managementName = this.commonService.changeingStringCases(
        this.managementName.replace(/_/g, " ")
      );
    }

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.dist_wise_data({ management: this.management, category: this.category }).subscribe(res => {
      this.result = res['data'];
      if (Object.keys(this.result[0]).includes("Student Attendance(%)")) {
        this.xAxis = "Student Attendance(%)";
      } else {
        this.xAxis = Object.keys(this.result[0])[2];
      }
      if (Object.keys(this.result[0]).includes("Semester Performance(%)")) {
        this.yAxis = "Semester Performance(%)";
      } else {
        this.yAxis = Object.keys(this.result[0])[3];
      }
      if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
        this.districtWise();
      } else {
        this.getView()
      }

    }, err => {
      this.result = [];
      this.createChart(["clg"], [], '', {});
      $('#table').empty();
      this.commonService.loaderAndErr(this.result);
    });

    // document.getElementById('spinner').style.display = 'block';

    this.hideAccessBtn = (environment.auth_api === 'cqube' || this.userAccessLevel === "") ? true : false;
    this.hideDist = (environment.auth_api === 'cqube' || this.userAccessLevel === '') ? false : true;

    if (environment.auth_api !== 'cqube') {
      if (this.userAccessLevel !== "" || undefined) {
        this.hideIfAccessLevel = true;
      }

    }


  }

  public tableHead: any;
  public chartData: any = [];
  public modes: any

  reportName = 'composite_report_across_metrics';

  districtWise(disId?, bid?, cid?) {
    this.districtSelected = false;
    this.selectedCluster = false;
    this.blockSelected = false;
    this.hideAllBlockBtn = false;
    this.hideAllCLusterBtn = false;
    this.hideAllSchoolBtn = false;

    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'dist';
    this.tableHead = "District Name";
    this.fileName = `${this.reportName}_allDistricts_${this.commonService.dateAndTime}`;
    this.selected = '';
    this.myDistrict = '';
    this.downloadType = '';
    this.modes = ['Dist Wise', 'Block Wise', 'Cluster Wise', 'School Wise'];

    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.skul = true;
    this.commonService.errMsg();
    this.blockHidden = true;
    this.clusterHidden = true;
    this.reportData = [];



    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.dist_wise_data({ management: this.management, category: this.category }).subscribe(res => {
      this.reportData = this.SchoolInfrastructureDistrictsNames = this.result = res['data'];
      //for chart =============================================
      this.showChart(this.result, this.downloadLevel);
      //====================================
      this.funToDownload(this.reportData);

      this.SchoolInfrastructureDistrictsNames.sort((a, b) => (a.district.value > b.district.value) ? 1 : ((b.district.value > a.district.value) ? -1 : 0));
      this.commonService.loaderAndErr(this.result);
      this.changeDetection.markForCheck();
      if (disId) {
        this.myDistData(disId, bid, cid)
      }
    }, err => {
      this.result = [];
      this.createChart(["clg"], [], '', {});
      $('#table').empty();
      this.commonService.loaderAndErr(this.result);
    });
  }

  public districtSelected: boolean = false
  public districtSlectedId
  myDistData(data, bid?, cid?) {
    this.districtSelected = true
    this.blockSelected = false
    this.selectedCluster = false
    this.districtSlectedId = data
    this.hideAllBlockBtn = true
    this.hideAllCLusterBtn = false;
    this.hideAllSchoolBtn = false;
    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'block';
    this.tableHead = "Block Name";
    this.fileName = `${this.reportName}_${this.downloadLevel}s_of_district_${data}_${this.commonService.dateAndTime}`;
    this.selected = 'district';
    this.dist = true;
    this.blok = false;
    this.clust = false;
    this.skul = false;
    this.commonService.errMsg();
    this.myBlock = '';
    this.downloadType = '';
    this.modes = [];
    this.reportData = [];

    this.distName = data;
    let obj = this.districtsNames.find(o => o.id == data);
    this.hierName = obj.name;
    localStorage.setItem('dist', obj.name);
    localStorage.setItem('distId', data);

    this.blockHidden = false;
    this.clusterHidden = true;


    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.block_per_dist_data(data, { management: this.management, category: this.category }).subscribe(res => {
      this.reportData = this.SchoolInfrastructureBlocksNames = this.result = res['data'];
      // for download========
      this.funToDownload(this.reportData);
      //for chart =============================================
      this.showChart(this.result, this.downloadLevel);
      //====================================
      this.SchoolInfrastructureBlocksNames.sort((a, b) => (a.block.value > b.block.value) ? 1 : ((b.block.value > a.block.value) ? -1 : 0));

      //========================

      this.commonService.loaderAndErr(this.result);
      this.changeDetection.markForCheck();
      if (bid) {
        this.myBlockData(bid, cid)
      }
    }, err => {
      this.result = [];
      this.createChart(["clg"], [], '', {});
      $('#table').empty();
      this.commonService.loaderAndErr(this.result);
    });
  }

  public blockSelected: boolean = false
  public blockSelectedId
  myBlockData(data, cid?) {
    this.districtSelected = false
    this.selectedCluster = false
    this.blockSelected = true
    this.blockSelectedId = data
    this.hideAllBlockBtn = true;
    this.hideAllCLusterBtn = true;
    this.hideAllSchoolBtn = false;
    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'cluster';
    this.tableHead = "Cluster Name";
    this.fileName = `${this.reportName}_${this.downloadLevel}s_of_block_${data}_${this.commonService.dateAndTime}`;
    this.selected = 'block';
    this.commonService.errMsg();
    this.dist = false;
    this.blok = true;
    this.clust = false;
    this.skul = false;

    this.myCluster = '';
    this.downloadType = '';
    this.modes = [];
    this.reportData = [];

    localStorage.setItem('blockId', data);
    this.titleName = localStorage.getItem('dist');

    this.distName = JSON.parse(localStorage.getItem('distId'));
    this.blockName = data;

    let obj = this.blockNames.find(o => o.id == data);

    obj !== undefined || "" ? localStorage.setItem('block', JSON.stringify(obj?.name)) : localStorage.getItem('block');
    this.hierName = obj?.name;

    this.blockHidden = this.selBlock ? true : false;
    this.clusterHidden = false;


    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.cluster_per_block_data(this.distName, data, { management: this.management, category: this.category }).subscribe(res => {
      this.reportData = this.SchoolInfrastructureClusterNames = this.result = res['data'];
      // for download========
      this.funToDownload(this.reportData);
      //for chart =============================================
      this.showChart(this.result, this.downloadLevel);
      //====================================
      this.SchoolInfrastructureClusterNames.sort((a, b) => (a.cluster.value > b.cluster.value) ? 1 : ((b.cluster.value > a.cluster.value) ? -1 : 0));


      //========================

      this.commonService.loaderAndErr(this.result);
      this.changeDetection.markForCheck();
      if (cid) {
        this.myClusterData(cid)
      }
    }, err => {
      this.result = [];
      this.createChart(["clg"], [], '', {});
      $('#table').empty();
      this.commonService.loaderAndErr(this.result);
    });
  }

  public selectedCluster: boolean = false;
  public selectedCLusterId
  public hideAllBlockBtn: boolean = false
  public hideAllCLusterBtn: boolean = false
  public hideAllSchoolBtn: boolean = false

  myClusterData(data) {
    this.hideAllBlockBtn = true
    this.blockSelected = false
    this.districtSelected = false
    this.selectedCluster = true
    this.hideAllCLusterBtn = true;
    this.hideAllSchoolBtn = true;
    this.selectedCLusterId = data;

    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'school';
    this.tableHead = "School Name";
    this.selected = 'cluster';
    this.fileName = `${this.reportName}_${this.downloadLevel}s_of_cluster_${data}_${this.commonService.dateAndTime}`;

    this.dist = false;
    this.blok = false;
    this.clust = true;
    this.skul = false;
    this.commonService.errMsg();
    this.modes = [];
    this.reportData = [];

    this.title = JSON.parse(localStorage.getItem('block'));

    this.titleName = localStorage.getItem('dist');
    var distId = JSON.parse(localStorage.getItem('distId'));
    var blockId = JSON.parse(localStorage.getItem('blockId'));
    this.distName = JSON.parse(localStorage.getItem('distId'));
    this.blockName = blockId;
    this.clustName = data;
    let obj = this.clusterNames?.find(o => o.id == data);
    this.hierName = obj?.name;
    localStorage.setItem('clusterId', data);
    this.blockHidden = this.selBlock ? true : false;
    this.clusterHidden = this.selCluster ? true : false;

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.school_per_cluster_data(distId, blockId, data, { management: this.management, category: this.category }).subscribe(res => {
      if (this.schoolLevel) {
        let result = res['data']

        let data = []
        for (var i = 0; result['length']; i++) {
          if (result[i].school.id === Number(localStorage.getItem('schoolId'))) {

            data.push(result[i])
            break
          }

        }

        this.reportData = this.SchoolInfrastructureSchoolNames = this.result = data;
      } else {
        this.reportData = this.SchoolInfrastructureSchoolNames = this.result = res['data'];
      }


      // for download========
      this.funToDownload(this.reportData);
      //for chart =============================================
      this.showChart(this.result, this.downloadLevel);
      //====================================

      this.commonService.loaderAndErr(this.result);
      this.changeDetection.markForCheck();
    }, err => {
      this.result = [];
      this.createChart(["clg"], [], '', {});
      $('#table').empty();
      this.commonService.loaderAndErr(this.result);
    });
  }

  distWise() {
    this.reportData = [];
    this.commonService.errMsg();
    var element1: any = document.getElementsByClassName('dwnld');

    this.fileName = `${this.reportName}_allDistricts_${this.commonService.dateAndTime}`;
    this.selected = '';
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.dist_wise_data({ management: this.management, category: this.category }).subscribe(res => {
      this.reportData = res['data'];
      if (res['data'] !== null) {
        document.getElementById('spinner').style.display = 'none';
        element1[0].disabled = false;
      }
      this.funToDownload(this.reportData);
      this.changeDetection.markForCheck();
    }, err => {
      this.chartData = [];
      this.commonService.loaderAndErr(this.result);
    });
  }

  blockWise() {
    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'block';
    this.tableHead = "Block Name";
    this.fileName = `${this.reportName}_allBlocks_${this.commonService.dateAndTime}`;
    this.selected = '';
    this.myDistrict = '';

    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.skul = true;
    this.commonService.errMsg();
    this.blockHidden = true;
    this.clusterHidden = true;
    this.reportData = [];

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.block_wise_data({ management: this.management, category: this.category }).subscribe(res => {
      this.reportData = this.result = res['data'];


      if (this.districtSelected) {
        let marker = this.result.filter(a => {
          if (a.district.id === this.districtSlectedId) {

            return a
          }

        })

        this.funToDownload(this.reportData);
        //for chart =============================================
        this.showChart(marker, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else if (this.blockSelected) {

        this.funToDownload(this.reportData);
        //for chart =============================================
        this.showChart(this.result, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else if (this.selectedCluster) {

        this.funToDownload(this.reportData);
        //for chart =============================================
        this.showChart(this.result, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else {

        this.funToDownload(this.reportData);
        //for chart =============================================
        this.showChart(this.result, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      }

    }, err => {
      this.chartData = [];
      this.commonService.loaderAndErr(this.result);
    });
  }

  clusterWise() {
    this.xAxisFilter = [];
    this.yAxisFilter = [];
    this.downloadLevel = 'cluster';
    this.tableHead = "Cluster Name";
    this.fileName = `${this.reportName}_allClusters_${this.commonService.dateAndTime}`;

    this.myDistrict = '';

    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.skul = true;
    this.commonService.errMsg();
    this.blockHidden = true;
    this.clusterHidden = true;
    this.reportData = [];

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.cluster_wise_data({ management: this.management, category: this.category }).subscribe(res => {
      this.reportData = this.result = res['data'];
      if (this.districtSelected) {
        let marker = this.result.filter(a => {
          if (a.district.id === this.districtSlectedId) {

            return a
          }

        })
        this.myDistrict = this.districtSlectedId;
        this.hierName = marker[0].district.value;

        this.titleName = "";
        this.clustName = "";

        this.dist = true;
        this.blok = false;
        this.clust = false;
        this.skul = false;
        this.blockHidden = false;
        this.clusterHidden = true;
        this.funToDownload(marker);
        //for chart =============================================
        this.showChart(marker, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else if (this.blockSelected) {
        let marker = this.result.filter(a => {
          if (a.block.id === this.blockSelectedId) {
            return a
          }

        })
        this.funToDownload(marker);
        //for chart =============================================
        this.showChart(marker, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else if (this.selectedCluster) {
        let marker = this.result.filter(a => {
          if (a.cluster.id === this.selectedCLusterId) {
            return a
          }

        })
        this.funToDownload(marker);
        //for chart =============================================
        this.showChart(marker, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      } else {
        this.funToDownload(this.reportData);
        //for chart =============================================
        this.showChart(this.result, this.downloadLevel);
        //====================================
        this.commonService.loaderAndErr(this.result);
        this.changeDetection.markForCheck();
      }


    }, err => {
      this.chartData = [];
      this.commonService.loaderAndErr(this.result);
    });
  }

  hideDist = true
  selCluster = false;
  selBlock = false;
  selDist = false;
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
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;
      this.hideFooter = true
      this.districtWise(districtid, blockid, clusterid)
      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;


    } else if (level === "Cluster") {
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;

      this.districtWise(districtid, blockid, clusterid)
      // this.myClusterData(clusterid)
      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;
    } else if (level === "Block") {

      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;


      this.districtWise(districtid, blockid)
      // this.myBlockData(blockid)
      this.selCluster = false;
      this.selBlock = true;
      this.selDist = true;

    } else if (level === "District") {
      this.myDistrict = districtid;
      this.myBlock = blockid;
      this.myCluster = clusterid;
      this.districtWise(districtid)

      this.selCluster = false;
      this.selBlock = false;
      this.selDist = false;


    } else if (level === null) {
      this.hideDist = false

    }
  }

  onHomeClick() {
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.districtWise()
    } else {
      this.getView()
    }
  }


  showChart(result, downloadType) {

    var l = undefined;
    if (downloadType == "dist") {
      l = this.management != 'overall' ? 2 : 1;
    } else if (downloadType == "block") {
      l = this.management != 'overall' ? 3 : 2;
    } else if (downloadType == "cluster") {
      l = this.management != 'overall' ? 4 : 3;
    } else if (downloadType == "school") {
      l = this.management != 'overall' ? 5 : 4;
    }

    var replace = ['_', ' %']

    for (i = l; i < Object.keys(result[0]).length; i++) {
      this.xAxisFilter.push({ key: Object.keys(result[0])[i], value: Object.keys(result[0])[i].replace(/_/g, ' ') });
      this.yAxisFilter.push({ key: Object.keys(result[0])[i], value: Object.keys(result[0])[i].replace(/_/g, ' ') });
    }
    for (i = 0; i < this.xAxisFilter.length; i++) {
      this.xAxisFilter[i].value = this.xAxisFilter[i].value.replace('(%)', " (%)");
      this.yAxisFilter[i].value = this.yAxisFilter[i].value.replace('(%)', " (%)");
    }

    var labels = [];
    this.chartData = []
    var j;

    for (var i = 0; i < result.length; i++) {
      j = i;
      if (result[i][this.xAxis] && result[i][this.yAxis]) {
        var x = undefined, y = undefined;
        if (result[i][this.xAxis].percent >= 0 && result[i][this.yAxis].percent >= 0) {
          x = parseFloat(result[i][this.xAxis].percent);
          y = parseFloat(result[i][this.yAxis].percent);
        }
        if (result[i][this.xAxis].percent >= 0 && result[i][this.yAxis].value >= 0) {
          x = parseFloat(result[i][this.xAxis].percent);
          y = parseFloat(result[i][this.yAxis].value);
        }
        if (result[i][this.xAxis].value >= 0 && result[i][this.yAxis].value >= 0) {
          x = parseFloat(result[i][this.xAxis].value);
          y = parseFloat(result[i][this.yAxis].value);
        }
        if (result[i][this.xAxis].value >= 0 && result[i][this.yAxis].percent >= 0) {
          x = parseFloat(result[i][this.xAxis].value);
          y = parseFloat(result[i][this.yAxis].percent);
        }

        this.chartData.push({ x: x, y: y });
        if (downloadType == "dist") {
          labels.push(result[i].district.value);
          this.districtsNames.push({ id: this.result[i].district.id, name: this.result[i].district.value });
        } else if (downloadType == "block") {
          labels.push(result[i].block.value);
          this.blockNames.push({ id: this.result[i].block.id, name: this.result[i].block.value });
        } else if (downloadType == "cluster") {
          labels.push(result[i].cluster.value);
          this.clusterNames.push({ id: this.result[i].cluster.id, name: this.result[i].cluster.value });
        } else if (downloadType == "school") {
          labels.push(result[i].school.value);
        }
      } else {
        this.chartData = [];
        this.result = [];
        this.commonService.loaderAndErr(this.result);
      }

    }
    if (result[j][this.xAxis] && result[j][this.yAxis]) {
      let x_axis = this.xAxisFilter.find(o => o.key == this.xAxis);
      let y_axis = this.yAxisFilter.find(o => o.key == this.yAxis);

      let obj = {
        xAxis: x_axis ? x_axis.value : this.xAxis,
        yAxis: y_axis ? y_axis.value : this.yAxis
      }
      this.labels = labels;
      this.obj = obj;


      this.createChart(labels, this.chartData, this.tableHead, obj);
    } else {
      if (downloadType == "dist") {
        this.SchoolInfrastructureDistrictsNames = [];
      } else if (downloadType == "block") {
        this.SchoolInfrastructureBlocksNames = [];
      } else if (downloadType == "cluster") {
        this.SchoolInfrastructureClusterNames = [];
      }
      this.chartData = [];
      this.result = [];
      this.commonService.loaderAndErr(this.result);
    }
  }

  selectAxis() {
    this.levelWiseFilter();
  }

  levelWiseFilter() {

    if (this.skul) {
      if (this.downloadLevel == "dist") {
        this.districtWise();
      } else if (this.downloadLevel == "block") {
        this.blockWise();
      } else if (this.downloadLevel == "cluster") {
        this.clusterWise();
      }
    }
    if (this.dist) {
      this.myDistData(JSON.parse(localStorage.getItem('distId')));
    }
    if (this.blok) {
      this.myBlockData(JSON.parse(localStorage.getItem('blockId')));
    }
    if (this.clust) {
      this.myClusterData(JSON.parse(localStorage.getItem('clusterId')));
    }
  }

  labels: any;
  obj: any;
  createChart(labels, chartData, name, obj) {
    this.config = getChartJSConfig({
      labelExpr: 'composite_report',
      datasets: getScatterDatasetConfig([{
        label: 'Composite Report',
        data: chartData
      }]),
      options: {
        height: "200",
        legend: {
          display: false
        },
        responsive: true,
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              var label = labels[tooltipItem.index];
              var multistringText = [name + " : " + label];
              multistringText.push(obj.xAxis + " : " + formatNumberForReport(tooltipItem.xLabel));
              multistringText.push(obj.yAxis + " : " + formatNumberForReport(tooltipItem.yLabel));
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
        }
      }
    });

    this.dashletData = { values: chartData };
    this.changeDetection.detectChanges();
  }

  funToDownload(data) {
    let newData = [];
    $.each(data, function (key, value) {
      let headers = Object.keys(value);
      let newObj = {}
      for (var i = 0; i < Object.keys(value).length; i++) {
        if (headers[i] != 'district' && headers[i] != 'block' && headers[i] != 'cluster' && headers[i] != 'school' && headers[i] != 'total_schools' && headers[i] != 'total_schools_data_received') {
          if (value[headers[i]].value >= 0) {
            newObj[`${headers[i]}`] = value[`${headers[i]}`].value;
          } else if (value[headers[i]].percent >= 0) {
            newObj[`${headers[i]}`] = value[`${headers[i]}`].percent;
          }
        } else {
          newObj[`${headers[i]}`] = value[`${headers[i]}`].value;
          var myStr = headers[i].charAt(0).toUpperCase() + headers[i].substr(1).toLowerCase();
          newObj[`${myStr}`] = newObj[headers[i]];
          delete newObj[headers[i]]
        }
      }
      newData.push(newObj);
    })
    this.reportData = newData
  }
  downloadReport() {
    var position = this.reportName.length;
    this.fileName = [this.fileName.slice(0, position), `_${this.management}`, this.fileName.slice(position)].join('');
    this.commonService.download(this.fileName, this.reportData);
  }

}
