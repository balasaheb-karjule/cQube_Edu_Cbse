import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import * as Highcharts from "highcharts";
import _ from "lodash";

// import addMore from "highcharts/highcharts-more";
import HC_exportData from "highcharts/modules/export-data";
import { AppServiceComponent } from "src/app/app.service";
import { environment } from "src/environments/environment";
import { TotalContentPlayLineCahrtService } from "src/app/core/services/total-content-play-line-chart.service";
import { ContentUsagePieService } from "src/app/core/services/content-usage-pie.service";
import { getChartJSConfig } from "src/app/core/config/ChartjsConfig";
import { formatNumberForReport } from "src/app/utilities/NumberFomatter";

HC_exportData(Highcharts);
// addMore(Highcharts)

@Component({
  selector: "app-total-content-play-over-years",
  templateUrl: "./total-content-play-over-years.component.html",
  styleUrls: ["./total-content-play-over-years.component.css"],
})
export class TotalContentPlayOverYearsComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions;
  config;
  dashletData;

  public waterMark = environment.water_mark
  public state;
  public reportName = "overTheYears"
  constructor(
    private changeDetection: ChangeDetectorRef,
    public commonService: AppServiceComponent,
    public service: TotalContentPlayLineCahrtService,
    public metaService: ContentUsagePieService
  ) { }

  width = window.innerWidth;
  height = window.innerHeight;
  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  public userAccessLevel = localStorage.getItem("userLevel");
  public hideIfAccessLevel: boolean = false
  public hideAccessBtn: boolean = false
  showError = false
  ngOnInit(): void {
    this.commonService.errMsg();
    this.changeDetection.detectChanges();
    this.state = this.commonService.state;
    document.getElementById("accessProgressCard") ? document.getElementById("accessProgressCard").style.display = "none" : "";
    document.getElementById("backBtn")
      ? (document.getElementById("backBtn").style.display = "none")
      : "";
    
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.getStateData();
    } else {
      if (this.userAccessLevel === "District") {
        this.getDistMeta()
        this.getview()
      } else {
        document.getElementById('spinner') ? document.getElementById('spinner').style.display = "none" : "";
        this.showError = true
      }
    }
    this.hideAccessBtn = (environment.auth_api === 'cqube' || this.userAccessLevel === "" || undefined) ? true : false;
  }

  async getview(){
    let distId = Number(localStorage.getItem('userLocation'))
    try {
      this.service.getDistTotalCotentPlayLine().subscribe((res) => {
        this.distData = res["data"];
        this.onDistSelected(distId)
      });
    } catch (error) {
      this.distData = [];
    }
   
  }

  public data;
  public reportData: any = [];
  public catgory = [];
  public chartData: any = [];
  public fileName = "Total_content_play_over_years";

  emptyChart() {
    this.chartData = [];
    this.reportData = [];
    this.fileName = "Total_content_play_over_years";

  }

  clickHome() {
    this.selectedDist = '';
    this.emptyChart();
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.getStateData();
    }else{
      this.getview()
    }
    
  }

  getStateData() {
    this.stateLevel = true;
    this.dist = false;
    try {
      this.service.getTotalCotentPlayLine().subscribe((res) => {
        if (res) {
          this.data = res["data"];
          this.reportData = res["downloadData"]["data"];
          this.createLineChart(this.reportData);
          this.getDistMeta();
          this.commonService.loaderAndErr(this.reportData);
        }
      }, (err) => {

        this.data = [];
        this.emptyChart();
        this.commonService.loaderAndErr(this.data);
      });
    }
    catch (error) {
      this.chartData = [];
      this.commonService.loaderAndErr(this.chartData);
    }
  }
  public distData;
  public distChartData;

  getDistrict() {
    try {
      this.service.getDistTotalCotentPlayLine().subscribe((res) => {
        this.distData = res["data"];
      });
    } catch (error) {
      this.distData = [];
    }
  }

  public distMetaData;
  public selectedDistricts;
  public distToDropDown;
  /// distMeta
  getDistMeta() {
    try {
      this.metaService.diskshaPieMeta().subscribe((res) => {
        this.distMetaData = res["data"];
        this.selectedDistricts = [];
        this.distToDropDown = this.distMetaData.Districts.map((dist: any) => {
          this.selectedDistricts.push(dist.district_id);
          return dist;
        });

        this.distToDropDown.sort((a, b) =>
          a.district_name.localeCompare(b.district_name)
        );
        this.getDistrict();
      });
    } catch (error) {
      console.log(error);
    }
  }

  public selectedDist;
  public dist;
  public stateLevel;
  public distName;

  onDistSelected(data) {

    document.getElementById("spinner").style.display = "block";
    setTimeout(() => {
      document.getElementById("spinner").style.display = "none";
    }, 1000);

    this.dist = true;
    this.stateLevel = false;
    this.chartData = [];
    this.selectedDist = data;
    try {
      this.distToDropDown.filter((distName) => {
        if (distName.district_id === this.selectedDist) {
          this.distName = distName.district_name;
        }
      });

      this.fileName = `Total_content_play_${this.distName}`;
      this.distChartData = this.distData.data.filter((dist) => {
        return dist.district_id == this.selectedDist;
      });

      this.distChartData.forEach((dist) => {
        this.distName = dist.district_name;
      });


      this.createLineChart(this.reportData);
    } catch (error) {
      this.chartData = [];
    }
  }

  //to filter downloadable data
  public dataToDownload;

  newDownload(element) {
    var data1 = {},
      data2 = {},
      data3 = {};
    Object.keys(element).forEach((key) => {
      data1[key] = element[key];
    });

    this.dataToDownload.push(data1);
  }




  downloadReport() {
    this.dataToDownload = [];
    let selectedDistricts = []

    if (this.selectedDist) {
      selectedDistricts = this.distToDropDown.filter(districtData => {
        return districtData.district_id === this.selectedDist
      })
    } else {
      selectedDistricts = this.distToDropDown.slice()
    }
    let reportData = _.cloneDeep(this.reportData);
    reportData.forEach((element) => {
      selectedDistricts.forEach((district) => {

        let distData = this.distData.data.filter(districtData => {
          return districtData.district_id === district.district_id
        })

        let objectValue = distData.find(
          (metric) => metric.month === element.month
        );

        let distName = district.district_name;

        element[distName] =
          objectValue && objectValue.plays
            ? objectValue.plays
            : 0;

      });
      this.newDownload(element);
    });
    this.commonService.download(this.fileName, this.dataToDownload, this.reportName);
  }


  changeingStringCases(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  createLineChart(data) {

    // this.chartOptions = {
    //   chart: {
    //     type: "area",
    //     plotBackgroundColor: "transparent",
    //     plotBorderWidth: null,
    //     plotShadow: false,
    //     backgroundColor: "transparent",
    //   },
    //   title: {
    //     text: "",
    //   },
    //   yAxis: {
    //     title: {
    //       text: "Total Content Play",
    //       style: {
    //         color: 'black',
    //         fontWeight: 'bold',
    //         fontSize: this.height > 1760 ? "30px" : this.height > 1160 && this.height < 1760 ? "20px" : this.height > 667 && this.height < 1160 ? "12px" : "10px"
    //       }
    //     },
    //     style: {
    //       color: 'black',
    //       fontWeight: 'bold',
    //       fontSize: this.height > 1760 ? "30px" : this.height > 1160 && this.height < 1760 ? "20px" : this.height > 667 && this.height < 1160 ? "12px" : "10px"
    //     },

    //     labels: {
    //       style: {
    //         color: 'black',
    //         fontSize: this.height > 1760 ? "30px" : this.height > 1160 && this.height < 1760 ? "20px" : this.height > 667 && this.height < 1160 ? "12px" : "10px"
    //       },
    //       formatter: function () {
    //         var label = this.axis.defaultLabelFormatter.call(this);

    //         // Use thousands separator for four-digit numbers too
    //         if (/^[0-9]{4}$/.test(label)) {
    //           return Highcharts.numberFormat(this.value, 0);
    //         }
    //         return label;
    //       }
    //     }
    //   },

    //   xAxis: {
    //     title: {
    //       text: "Months",
    //       style: {
    //         color: 'black',
    //         fontWeight: 'bold',
    //         fontSize: this.height > 1760 ? "30px" : this.height > 1160 && this.height < 1760 ? "20px" : this.height > 667 && this.height < 1160 ? "12px" : "10px"
    //       }

    //     },
    //     margin: "5px",

    //     labels: {
    //       style: {
    //         fontWeight: "900",
    //         fontSize: this.height > 1760 ? "30px" : this.height > 1160 && this.height < 1760 ? "20px" : this.height > 667 && this.height < 1160 ? "12px" : "10px"
    //       }
    //     },
    //     type: "datetime",

    //     categories: this.catgory,

    //   },


    //   credits: {
    //     enabled: false,
    //   },
    //   tooltip: {
    //     style: {
    //       fontSize: this.height > 1760 ? "32px" : this.height > 1160 && this.height < 1760 ? "22px" : this.height > 667 && this.height < 1160 ? "12px" : "10px",
    //       opacity: 1,
    //       backgroundColor: "white"
    //     },
    //     formatter: function () {
    //       if (this.point.category != 0) {
    //         return '<span> <b>  Month:' + ' ' + this.x +
    //           '</b>' + '<br>' + '<b> Total Content Play:' + ' ' + this.y.toLocaleString('en-IN') + '</b></span>';
    //       } else {
    //         return false;
    //       }
    //     }
    //   },
    //   legend: {
    //     itemStyle: {
    //       fontSize: this.height > 1760 ? "32px" : this.height > 1160 && this.height < 1760 ? "22px" : this.height > 667 && this.height < 1160 ? "12px" : "10px",
    //     }
    //   },

    //   plotOptions: {
    //     series: {
    //       stickyTracking: false,
    //       events: {
    //         legendItemClick: function (e) {
    //           e.preventDefault();
    //         },

    //       },


    //     },
    //   },

    //   series: [
    //     {
    //       name: "Total Content Plays",
    //       data: data,
    //     },
    //   ],

    //   responsive: {
    //     rules: [
    //       {
    //         condition: {
    //           maxWidth: 500,
    //         },
    //         chartOptions: {
    //           legend: {
    //             layout: "horizontal",
    //             align: "center",
    //             verticalAlign: "bottom",
    //           },
    //         },
    //       },
    //     ],
    //   },
    // };
    // this.Highcharts.chart("container", this.chartOptions);

    this.config = getChartJSConfig({
      labelExpr: 'month',
      datasets: [
        { dataExpr: 'plays', label: 'Total Content Plays' }
      ],
      options: {
        height: '200',
        tooltips: {
          callbacks: {
            title: (tooltipItems) => {
              console.log(tooltipItems[0])
              return `Month: ` + tooltipItems[0].xLabel.charAt(0).toUpperCase() + tooltipItems[0].xLabel.slice(1)
            },
            label: (tooltipItem) => {
              return `Total Content Plays: ${formatNumberForReport(data[tooltipItem.index]['plays'])}`;
            }
          }
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Total Content Plays'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Months'
            }
          }]
        }
      }
    });

    this.dashletData = {
      values: data
    };
  }
}
