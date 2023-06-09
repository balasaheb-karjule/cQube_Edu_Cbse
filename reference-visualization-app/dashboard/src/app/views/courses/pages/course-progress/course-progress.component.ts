import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts/highstock';
import HeatmapModule from 'highcharts/modules/heatmap';
HeatmapModule(Highcharts);
import { AppServiceComponent } from '../../../../app.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


import { environment } from 'src/environments/environment';
import { MultiSelectComponent } from 'src/app/shared/components/core-components/multi-select/multi-select.component';
import { DikshaReportService } from 'src/app/core/services/diksha-report.service';

@Component({
  selector: 'app-course-progress',
  templateUrl: './course-progress.component.html',
  styleUrls: ['./course-progress.component.scss']
})
export class CourseProgressComponent implements OnInit {

  Highcharts: typeof Highcharts = Highcharts;
  name: string;
  level = '';

  public waterMark = environment.water_mark

  height = screen.height;
  width = screen.width;
  innerWidth = screen.availWidth;

  blockHidden = true;
  clusterHidden = true;

  // For filter implementation
  districtNames = [];
  district;
  blockNames = [];
  block;
  clusterNames = [];
  cluster;

  reportType = "collection_progress";
  timePeriod = 'All';
  timePeriods = [{ key: "All", value: "Overall" }, { key: "Last_30_Day", value: "Last 30 Days" }, { key: "Last_7_Day", value: "Last 7 Days" }, { key: "Last_Day", value: "Last Day" }]

  //to set hierarchy level
  skul = true;
  dist = false;
  blok = false;
  clust = false;

  // to set hierarchy values
  districtHierarchy: any;
  blockHierarchy: any;
  clusterHierarchy: any;

  chartObject: Highcharts.Chart = null;
  data;

  // to download the excel report
  public fileName;
  public reportData: any = [];

  public metaData: any;
  myData;
  state: string;
  courses: any;
  course;

  public reportName = "TPD_course_progress";

  //For pagination.....
  items = [];
  pageOfItems: Array<any>;
  pageSize = 40;
  currentPage = 1;

  @ViewChild(MultiSelectComponent) multiSelect: MultiSelectComponent;

  screenWidth: number;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screenWidth = window.innerWidth;
    this.resetFontSizesOfChart();
  }

  constructor(
    public http: HttpClient,
    public service: DikshaReportService,
    public commonService: AppServiceComponent,
    public router: Router
  ) {
    this.screenWidth = window.innerWidth;
  }

  scousesTOShow: any = [];
  public userAccessLevel = localStorage.getItem("userLevel");
  public hideIfAccessLevel: boolean = false
  public hideAccessBtn: boolean = false
  ngOnInit(): void {
    this.state = this.commonService.state;
    document.getElementById('accessProgressCard') ? document.getElementById('accessProgressCard').style.display = 'none': '';
    document.getElementById('backBtn') ? document.getElementById('backBtn').style.display = 'none' : "";
    this.service.courseFilter({ timePeriod: 'All' }).subscribe(res => {
      this.scousesTOShow = this.courses = res['data'];
    });
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.commonFunc()
    } else {
      this.getView()
    }


    this.hideAccessBtn = (environment.auth_api === 'cqube' || this.userAccessLevel === "" || undefined) ? true : false;
    this.disHidden = (environment.auth_api === 'cqube' || this.userAccessLevel === '' || undefined) ? false : true;

    if (environment.auth_api !== 'cqube') {
      if (this.userAccessLevel !== "" || undefined) {
        this.hideIfAccessLevel = true;
      }

    }
  }
  selectedCourses = [];
  shareCheckedList(item: any[]) {
    this.selectedCourses = item;
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.levelWiseFilter();
    } else {
      this.getView()
    }

  }

  getHeight(event) {
    this.height = event.target.innerHeight;
    if (this.toolTipData)
      this.onChangePage();
  }

  onChangePage() {
    this.scousesTOShow = this.courses;
    let yLabel = this.yLabel.slice((this.currentPage - 1) * this.pageSize, ((this.currentPage - 1) * this.pageSize + this.pageSize));
    let data = this.items.slice(this.pageSize * this.xLabel.length * (this.currentPage - 1), this.pageSize * this.xLabel.length * this.currentPage);
    let tooltipData = this.toolTipData ? this.toolTipData.slice(this.pageSize * this.xLabel.length * (this.currentPage - 1), this.pageSize * this.xLabel.length * this.currentPage) : "";

    data = data.map(record => {
      record.y %= this.pageSize;
      return record;
    });

    tooltipData = tooltipData.map(record => {
      record.y %= this.pageSize;
      return record;
    });
    this.chartFun(this.xlab.length > 0 ? this.xlab : this.xLabel, this.xLabelId, this.ylab.length > 0 ? this.ylab : yLabel, this.zLabel, data, this.level, this.xLabel1, this.yLabel1, tooltipData);
  }

  resetToInitPage() {
    this.fileName = `${this.reportName}_allDistrict_${this.timePeriod != 'All' ? this.timePeriod : 'overall'}_${this.commonService.dateAndTime}`;
    this.skul = true;
    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.district = undefined;
    this.block = undefined;
    this.cluster = undefined;
    this.blockHidden = true;
    this.clusterHidden = true;
    this.timePeriod = 'All';

    this.selectedCourses = [];
    var courses = this.courses.map(course => {
      course.status = false;
      return course;
    });
    this.courses = courses;
    if (this.multiSelect)
      this.multiSelect.checkedList = [];
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.commonFunc();
    } else {
      this.getView()
    }

  }

  commonFunc = (distId?, bid?, cid?) => {
    this.fileName = `${this.reportName}_allDistrict_${this.timePeriod != 'All' ? this.timePeriod : 'overall'}_${this.commonService.dateAndTime}`;
    this.commonService.errMsg();
    this.level = 'district';
    this.reportData = [];
    let a = {
      timePeriod: this.timePeriod,
      reportType: this.reportType,
      courses: this.selectedCourses
    }

    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.tpdDistWise(a).subscribe(response => {
      this.genericFunction(response);
      this.commonService.loaderAndErr(this.reportData);
      if (distId) {
        this.selectedDistrict(distId, bid, cid)
      }
    }, err => {
      this.scousesTOShow = [];
      this.items = [];
      this.reportData = [];
      this.commonService.loaderAndErr(this.reportData);
      if (this.chart && this.chart.axes) {
        this.chart.destroy();
      }
    })
  }

  resetFontSizesOfChart(): void {
    if (this.chart) {
      let xAxis, yAxis, dataLabels, tooltipStyle;

      if (this.screenWidth <= 1920) {
        xAxis = {
          fontSize: '12px'
        };

        yAxis = {
          fontSize: '12px'
        };

        dataLabels = {
          fontSize: '11px'
        };

        tooltipStyle = {
          fontSize: '12px'
        }
      } else if (this.screenWidth > 1920 && this.screenWidth < 3840) {
        xAxis = {
          fontSize: '1.2rem'
        };

        yAxis = {
          fontSize: '1.2rem'
        };

        dataLabels = {
          fontSize: '1.1rem'
        };

        tooltipStyle = {
          fontSize: '1.2rem'
        }
      } else {
        xAxis = {
          fontSize: '1.6rem'
        };

        yAxis = {
          fontSize: '1.6rem'
        };

        dataLabels = {
          fontSize: '1.5rem'
        };

        tooltipStyle = {
          fontSize: '1.6rem'
        }
      }

      Highcharts.setOptions({
        xAxis: {
          labels: {
            style: {
              fontSize: xAxis.fontSize
            }
          }
        }
      });
    }
  }

  chart;
  chart1
  chartFun = (xLabel, xLabelId, yLabel, zLabel, data, level, xLabel1, yLabel1, tooltipData) => {

    this.chart1 = data
    let scrollBarX
    let scrollBarY
    let xAxis, yAxis, dataLabels, tooltipStyle;
    if (this.screenWidth <= 1920) {
      xAxis = {
        fontSize: '12px'
      };

      yAxis = {
        fontSize: '12px'
      };

      dataLabels = {
        fontSize: '11px'
      };

      tooltipStyle = {
        fontSize: '12px'
      }
    } else if (this.screenWidth > 1920 && this.screenWidth < 3840) {
      xAxis = {
        fontSize: '1.2rem'
      };

      yAxis = {
        fontSize: '1.2rem'
      };

      dataLabels = {
        fontSize: '1.1rem'
      };

      tooltipStyle = {
        fontSize: '1.2rem'
      }
    } else {
      xAxis = {
        fontSize: '1.6rem'
      };

      yAxis = {
        fontSize: '1.6rem'
      };

      dataLabels = {
        fontSize: '1.5rem'
      };

      tooltipStyle = {
        fontSize: '1.6rem'
      }
    }

    if (xLabel1.length <= 30) {
      scrollBarX = false
    } else {
      scrollBarX = true
    }
    var scrollLimit = this.height > 800 ? 16 : this.height > 650 && this.height < 800 ? 12 : this.height < 500 ? 8 : 12;
    if (yLabel1.length <= scrollLimit) {
      scrollBarY = false
    } else {
      scrollBarY = true
    }

    for (let i = 0; i < xLabel.length; i++) {
      xLabel[i] = xLabel[i].substr(0, 15);
    }
    this.chart = Highcharts.chart('container', {
      chart: {
        type: 'heatmap'
      },
      credits: {
        enabled: false
      },
      legend: {
        enabled: false
      },
      xAxis: [{
        categories: [],
        labels: {
          rotation: 270,
          style: {
            color: 'black',
            fontSize: '14px',
          },
          enabled: false
        },
        lineColor: '#FFFFFF',
        gridLineColor: 'transparent',
        min: 0,
        max: this.innerWidth > 1660 ? 20 : this.innerWidth > 1024 ? 14 : 10,
        scrollbar: {
          enabled: scrollBarX
        },
      }, {
        lineColor: '#FFFFFF',
        linkedTo: 0,
        opposite: true,
        categories: xLabel,
        gridLineColor: 'transparent',
        labels: {
          rotation: 270,
          style: {
            color: 'black',
            fontSize: xAxis.fontSize,
            fontFamily: 'Arial',
          },
          formatter: function (this) {
            let ret: any = this.value,
              len = ret.length
            if (len > 14) {
              ret = ret.slice(0, 14) + '...';
            }
            return ret;
          }
        },

      }],
      yAxis: {
        categories: yLabel,
        labels: {
          style: {
            color: 'black',
            fontSize: yAxis.fontSize,
            textDecoration: "underline",
            textOverflow: "ellipsis",
            fontFamily: 'Arial'
          },
          align: "right",
          formatter: function (this) {
            return this.value !== this.pos ? `${this.value}` : '';
          }
        },
        gridLineColor: 'transparent',
        title: null,
        reversed: true,
        min: 0,
        max: scrollLimit - 1,
        scrollbar: {
          enabled: scrollBarY
        }
      },
      colorAxis: {
        min: 0,
        minColor: '#ff3300',
        maxColor: '#99ff99',
      },
      series: [{
        turboThreshold: data.length + 100,
        data: data,
        dataLabels: {
          enabled: true,
          color: '#000000',
          style: {
            textOutline: 'none',
            fontSize: dataLabels.fontSize
          },
          overflow: false,
          crop: true,
        },
        type: 'heatmap'
      }],
      title: {
        text: null
      },
      tooltip: {
        style: {
          fontSize: tooltipStyle.fontSize
        },
        formatter: function () {
          return '<b>' + getPointCategoryName(this.point, 'y', level) + '</b>';
        }
      },
    });

    function getPointCategoryName(point, dimension, level) {
      let indicator;
      let name;
      tooltipData.map(a => {
        if (point.x == a.x && point.y == a.y) {
          indicator = a.indicator;
          name = a.name;
        }
      })

      var obj = '';
      if (level == 'district') {
        obj = `<b>District Name: ${name}</b> 
        <br> <b>Course: ${indicator}  <b>             
        <br> ${point.value !== null ? `<b>Collection Progress:${point.value} %` : ''}</b>`
      }

      if (level == 'block') {
        obj = `<b>Block Name: ${point.series.chart.xAxis[1].categories[point['x']]}</b>  
        <br> <b>Course: ${indicator}  <b>    
        <br> ${point.value !== null ? `<b>Collection Progress:${point.value} %` : ''}</b>`
      }

      if (level == 'cluster') {
        obj = `<b>Cluster Name: ${point.series.chart.xAxis[1].categories[point['x']]}</b> 
        <br> <b>Course: ${indicator}  <b>     
        <br> ${point.value !== null ? `<b>Collection Progress:${point.value} %` : ''}</b>`
      }

      if (level == 'school') {
        obj = `<b>School Name: ${point.series.chart.xAxis[1].categories[point['x']]}</b>  
        <br> <b>Course: ${indicator}  <b>    
        <br> ${point.value !== null ? `<b>Collection Progress:${point.value} %` : ''}</b>`
      }



      return obj
    }
  }

  allDistricts = []; allBlocks = []; allClusters = [];
  selectedTimePeriod() {
    this.levelWiseFilter();
  }

  selectedDistrict(districtId, bid?, cid?) {
    this.level = 'block';
    this.fileName = `${this.reportName}_${this.timePeriod != 'All' ? this.timePeriod : 'overall'}_${this.level}s_of_district_${districtId}_${this.commonService.dateAndTime}`;
    this.block = undefined;
    this.cluster = undefined;
    this.blockHidden = false;
    this.clusterHidden = true;

    this.commonService.errMsg();
    this.reportData = [];

    let a = {
      timePeriod: this.timePeriod,
      reportType: this.reportType,
      courses: this.selectedCourses,
      districtId: districtId
    }

    this.service.tpdBlockWise(a).subscribe(response => {
      this.genericFunction(response);
      var dist = this.allDistricts.find(a => a.district_id == districtId);
      this.districtHierarchy = {
        districtName: dist?.district_name,
        distId: dist?.district_id
      }
      this.skul = false;
      this.dist = true;
      this.blok = false;
      this.clust = false;
      this.commonService.loaderAndErr(this.reportData);
      if (bid) {
        this.selectedBlock(bid, cid)
      }
    }, err => {
      this.scousesTOShow = [];
      this.items = [];
      this.reportData = [];
      this.commonService.loaderAndErr(this.reportData);
      if (this.chart && this.chart.axes) {
        this.chart.destroy();
      }
    })

  }

  selectedBlock(blockId, cid?) {
    this.level = 'cluster';
    this.fileName = `${this.reportName}_${this.timePeriod != 'All' ? this.timePeriod : 'overall'}_${this.level}s_of_block_${blockId}_${this.commonService.dateAndTime}`;
    this.cluster = undefined;
    this.blockHidden = this.selBlock ? true : false;
    this.clusterHidden = false;

    this.commonService.errMsg();
    this.reportData = [];

    let a = {
      timePeriod: this.timePeriod,
      reportType: this.reportType,
      courses: this.selectedCourses,
      districtId: this.district,
      blockId: blockId
    }

    this.service.tpdClusterWise(a).subscribe(response => {
      this.genericFunction(response);
      let block = this.allBlocks.find(a => a.block_id == blockId);

      this.blockHierarchy = {
        districtName: block.district_name,
        distId: block.district_id,
        blockName: block.block_name,
        blockId: block.block_id
      }

      this.skul = false;
      this.dist = false;
      this.blok = true;
      this.clust = false;
      this.commonService.loaderAndErr(this.reportData);
      if (cid) {
        this.selectedCluster(cid)
      }
    }, err => {
      this.scousesTOShow = [];
      this.items = [];
      this.reportData = [];
      this.commonService.loaderAndErr(this.reportData);
      if (this.chart && this.chart.axes) {
        this.chart.destroy();
      }
    })
  }

  selectedCluster(clusterId) {
    this.level = 'school';
    this.fileName = `${this.reportName}_${this.timePeriod != 'All' ? this.timePeriod : 'overall'}_${this.level}s_of_cluster_${clusterId}_${this.commonService.dateAndTime}`;
    this.blockHidden = this.selBlock ? true : false;
    this.clusterHidden = this.selCluster ? true : false;
    this.commonService.errMsg();
    this.reportData = [];

    let a = {
      timePeriod: this.timePeriod,
      reportType: this.reportType,
      courses: this.selectedCourses,
      districtId: this.district,
      blockId: this.block,
      clusterId: clusterId,
      schoolLevel: this.schoolLevel,
      schoolId: Number(localStorage.getItem('schoolId'))
    }

    this.service.tpdSchoolWise(a).subscribe(response => {
      this.genericFunction(response);
      var cluster = this.allClusters.find(a => a.cluster_id == clusterId);
      this.clusterHierarchy = {
        districtName: cluster?.district_name,
        distId: cluster?.district_id,
        blockName: cluster?.block_name,
        blockId: cluster?.block_id,
        clusterId: cluster?.cluster_id,
        clusterName: cluster?.cluster_name
      }
      this.skul = false;
      this.dist = false;
      this.blok = false;
      this.clust = true;

      this.commonService.loaderAndErr(this.reportData);
    }, err => {
      this.scousesTOShow = [];
      this.items = [];
      this.reportData = [];
      this.commonService.loaderAndErr(this.reportData);
      if (this.chart && this.chart.axes) {
        this.chart.destroy();
      }
    })
  }

  xlab = []; ylab = []; a = {}; yLabel = []; xLabel = []; xLabelId = []; zLabel = []; xLabel1 = []; yLabel1 = []; toolTipData: any;
  genericFunction(response) {

    this.xlab = [];
    this.ylab = [];
    this.yLabel = response['result']['yLabel']
    this.xLabel = response['result']['xLabel']
    this.xLabelId = response['result']['xLabelId']
    this.data = response['result']['data']
    this.zLabel = response['result']['zLabel']
    this.reportData = response['downloadData']
    this.toolTipData = response['result']['tooltipData'];
    if (response['districtDetails']) {
      let districts = response['districtDetails'];
      this.allDistricts = this.districtNames = districts.sort((a, b) => (a.district_name > b.district_name) ? 1 : ((b.district_name > a.district_name) ? -1 : 0));
    }
    if (response['blockDetails']) {
      let blocks = response['blockDetails'];

      this.allBlocks = this.blockNames = blocks.sort((a, b) => (a.block_name > b.block_name) ? 1 : ((b.block_name > a.block_name) ? -1 : 0));
    }
    if (response['clusterDetails']) {
      let clusters = response['clusterDetails'];
      this.allClusters = this.clusterNames = clusters.sort((a, b) => (a.cluster_name > b.cluster_name) ? 1 : ((b.cluster_name > a.cluster_name) ? -1 : 0));
    }
    if (this.xLabel.length <= 30) {
      for (let i = 0; i <= 30; i++) {
        this.xlab.push(this.xLabel[i] ? this.xLabel[i] : ' ')
      }
    }

    if (this.yLabel.length <= 12) {
      for (let i = 0; i <= 12; i++) {
        this.ylab.push(this.yLabel[i] ? this.yLabel[i] : ' ')
      }
    }
    this.xLabel1 = this.xLabel
    this.yLabel1 = this.yLabel
    this.items = this.data.map((x, i) => x);
    this.onChangePage();
  }

  //level wise filter
  levelWiseFilter() {

    if (this.level == 'district') {
      this.commonFunc()
    }
    if (this.level == 'block') {
      this.selectedDistrict(this.district);
    }
    if (this.level == 'cluster') {
      this.selectedBlock(this.block)
    }
    if (this.level == 'school') {
      this.selectedCluster(this.cluster);
    }
  }

  selCluster = false;
  selBlock = false;
  selDist = false;
  disHidden = true
  levelVal = 0;
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
      this.district = districtid;
      this.block = blockid;
      this.commonFunc(districtid, blockid, clusterid)

      this.clusterHidden = true;
      this.blockHidden = true
      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;
      this.levelVal = 3;
    } else if (level === "Cluster") {
      this.district = districtid;
      this.block = blockid;
      this.commonFunc(districtid, blockid, clusterid)

      this.clusterHidden = true;
      this.blockHidden = true
      this.selCluster = true;
      this.selBlock = true;
      this.selDist = true;
      this.levelVal = 3;
    } else if (level === "Block") {
      this.district = districtid;
      this.block = blockid;
      this.commonFunc(districtid, blockid)

      this.blockHidden = true;
      this.selCluster = false;
      this.selBlock = true;
      this.selDist = true;
      this.levelVal = 2;
    } else if (level === "District") {
      this.district = districtid
      this.commonFunc(districtid)

      this.levelVal = 1;
      this.selCluster = false;
      this.selBlock = false;
      this.selDist = false;
    } else if (level === null) {
      this.disHidden = false
    }
  }

  getView1() {
    let id = JSON.parse(localStorage.getItem("userLocation"));
    let level = localStorage.getItem("userLevel");
    let clusterid = JSON.parse(localStorage.getItem("clusterId"));
    let blockid = JSON.parse(localStorage.getItem("blockId"));
    let districtid = JSON.parse(localStorage.getItem("districtId"));
    let schoolid = JSON.parse(localStorage.getItem("schoolId"));

    this.dist = false;
    this.blok = false;
    this.clust = false;
    this.skul = true;
    if (districtid) {
      this.district = districtid;


    }
    if (blockid) {
      this.district = districtid
      this.block = blockid;

    }
    if (clusterid) {
      this.cluster = clusterid;

    }

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
    this.district = id;
    this.levelWiseFilter();
  }

  blocklevel(id) {
    this.selCluster = false;
    this.selBlock = true;
    this.selDist = true;
    this.level = "clusterPerBlock";
    this.block = id;
    this.levelWiseFilter();
  }

  clusterlevel(id) {
    this.selCluster = true;
    this.selBlock = true;
    this.selDist = true;
    this.level = "schoolPerCluster";
    this.cluster = id;
    this.levelWiseFilter();
  }

  // to download the csv report
  downloadReport() {
    this.commonService.download(this.fileName, this.reportData);
  }

  public legendColors: any = [
    "#a50026",
    "#d73027",
    "#f46d43",
    "#fdae61",
    "#fee08b",
    "#d9ef8b",
    "#a6d96a",
    "#66bd63",
    "#1a9850",
    "#006837",
  ];
  public values = [
    "0-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-60",
    "61-70",
    "71-80",
    "81-90",
    "91-100",
  ];

}
