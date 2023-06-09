import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DikshaReportService } from 'src/app/core/services/diksha-report.service';
import { AppServiceComponent } from 'src/app/app.service';
import { getBarDatasetConfig, getChartJSConfig } from 'src/app/core/config/ChartjsConfig';
import { formatNumberForReport } from 'src/app/utilities/NumberFomatter';

@Component({
  selector: 'app-usage-by-text-book',
  templateUrl: './usage-by-text-book.component.html',
  styleUrls: ['./usage-by-text-book.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UsageByTextBookComponent implements OnInit {
  //chart data variabes:::::::::::::
  chart: boolean = false;
  public colors = [];
  header = '';
  public category: String[] = [];
  public chartData: Number[] = [];
  public xAxisLabel: String = "Total Content Plays";
  public yAxisLabel: String = "District Names"

  public waterMark = environment.water_mark
  public collection_type = 'textbook';

  public result: any = [];
  public timePeriod = 'all';
  public hierName: any;
  public dist: boolean = false;
  public all: boolean = false;
  public timeDetails: any = [{ id: "all", name: "Overall" }, { id: "last_30_days", name: "Last 30 Days" }, { id: "last_7_days", name: "Last 7 Days" }, { id: "last_day", name: "Last Day" }];
  public districtsDetails: any = '';
  public myChart: Chart;
  public showAllChart: boolean = false;
  public allDataNotFound: any;
  public collectioTypes: any = [{ id: "textbook", type: "TextBook" }];
  public collectionNames: any = [];
  collectionName = '';
  footer;

  downloadType;
  fileName: any;
  reportData: any = [];
  y_axisValue;
  state: string;
  public reportName = "usage_by_textbook";
  config;
  data;

  constructor(
    public http: HttpClient,
    public service: DikshaReportService,
    public commonService: AppServiceComponent,
    public router: Router,
  ) {
  }

  userAccessLevel =localStorage.getItem('userLevel')
  showError = false
  ngOnInit(): void {
    this.state = this.commonService.state;

    document.getElementById('accessProgressCard') ? document.getElementById('accessProgressCard').style.display = "none" : "";
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      this.getAllData();
    }else{
      document.getElementById('spinner') ? document.getElementById('spinner').style.display = "none" : "";
      this.showError = true
    }
    
  }

  emptyChart() {
    this.result = [];
    this.chartData = [];
    this.category = [];
  }

  homeClick() {

    this.timePeriod = 'all';
    this.getAllData()
  }

  getBarChartData() {
    if (this.result.labels.length <= 25) {
      for (let i = 0; i <= 25; i++) {
        this.category.push(this.result.labels[i] ? this.result.labels[i] : ' ')
      }
    } else {
      this.category = this.result.labels;
    }
    this.result.data.forEach(element => {
      this.chartData.push(Number(element[`total_content_plays`]));
    });

    this.config = getChartJSConfig({
      labels: this.result.labels,
      datasets: getBarDatasetConfig([
        { dataExpr: 'total_content_plays', label: 'Total Content Plays' }
      ]),
      options: {
        height: (this.result.labels.length * 15 + 150).toString(),
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              let multistringText = [];                

              multistringText.push(`Total Content Plays: ${formatNumberForReport(this.result.data[tooltipItem.index]['total_content_plays'])}`);

              return multistringText;
            }
          }
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Districts'
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Total Content Plays'
            }
          }]
        }
      }
    });

    this.data = {
      values: this.result.data
    };
  }

  async getAllData() {
    this.emptyChart();
    if (this.timePeriod != "all") {

    } else {

    }
    this.reportData = [];
    this.commonService.errMsg();

    this.collectionName = '';
    this.footer = '';
    this.fileName = `${this.reportName}_${this.timePeriod}_${this.commonService.dateAndTime}`;
    console.log("The filename is:", this.fileName);
    this.result = [];
    this.all = true
    this.dist = false;
    this.header = this.changeingStringCases(this.collection_type) + " Linked";
    this.listCollectionNames();
    this.service.dikshaBarChart({ collection_type: this.collection_type }).subscribe(async result => {
      this.result = result['chartData'];
      this.reportData = result['downloadData'];
      this.footer = result['footer'].toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
      this.getBarChartData();
      this.time = this.timePeriod == 'all' ? 'overall' : this.timePeriod;
      this.fileToDownload = `diksha_raw_data/table_reports/textbook/${this.time}/${this.time}.csv`;
      this.commonService.loaderAndErr(this.result);
    }, err => {
      this.result = [];
      this.emptyChart();
      this.commonService.loaderAndErr(this.result);
    });

  }

  listCollectionNames() {
    this.commonService.errMsg();
    this.collectionName = '';
    this.footer = '';
    this.reportData = [];
    this.service.listCollectionNames({ collection_type: this.collection_type, timePeriod: this.timePeriod == 'all' ? '' : this.timePeriod }).subscribe(async res => {
      this.collectionNames = [];
      this.collectionNames = res['uniqueCollections'];
      this.collectionNames.sort((a, b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
      if (res['chartData']) {

        this.emptyChart();
        this.result = res['chartData'];
        this.footer = res['footer'].toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
        this.getBarChartData();
        this.reportData = res['downloadData'];
      }
      this.commonService.loaderAndErr(this.result);
    }, err => {
      this.collectionNames = [];
      this.result = [];
      this.emptyChart();
      this.commonService.loaderAndErr(this.result);
    })
  }

  downloadRawFile() {
    this.service.downloadFile({ fileName: this.fileToDownload }).subscribe(res => {
      window.open(`${res['downloadUrl']}`, "_blank");
    }, err => {
      alert("No Raw Data File Available in Bucket");
    })
  }
  time = this.timePeriod == 'all' ? 'overall' : this.timePeriod;
  fileToDownload = `diksha_raw_data/table_reports/textbook/${this.time}/${this.time}.csv`;
  async chooseTimeRange() {
    this.emptyChart();
    this.time = this.timePeriod == 'all' ? 'overall' : this.timePeriod;
    this.fileToDownload = `diksha_raw_data/table_reports/textbook/${this.time}/${this.time}.csv`;

    if (this.timePeriod == 'all') {
      await this.getAllData();
    } else {
      this.listCollectionNames();
    }
  }

  getDataBasedOnCollections() {
    this.emptyChart();
    this.reportData = [];

    this.commonService.errMsg();
    this.fileName = `${this.reportName}_${this.timePeriod}_${this.commonService.dateAndTime}`;
    console.log("The filename is:", this.fileName);
    this.footer = '';
    this.result = [];
    this.all = true
    this.dist = false
    this.service.getDataByCollectionNames({ collection_type: this.collection_type, timePeriod: this.timePeriod == 'all' ? '' : this.timePeriod, collection_name: this.collectionName }).subscribe(async res => {
      this.result = res['chartData'];
      this.reportData = res['downloadData'];
      this.footer = res['footer'].toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
      this.getBarChartData();
      this.commonService.loaderAndErr(this.result);
    }, err => {
      this.commonService.loaderAndErr(this.result);
    });
  }

  onChange() {
    document.getElementById('errMsg').style.display = 'none';
  }

  downloadReport() {
    let time = this.timePeriod === 'Overall' ? 'all':this.timePeriod
    this.fileName = `${this.reportName}_${time}_${this.commonService.dateAndTime}`;
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
}
