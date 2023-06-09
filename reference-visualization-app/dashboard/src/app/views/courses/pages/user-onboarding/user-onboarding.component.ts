import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { AppServiceComponent } from "src/app/app.service";
import { environment } from "src/environments/environment";
import { EnrollmentProgressLineChartService } from "src/app/core/services/enrollment-progress-line-chart.service";
import { ContentUsagePieService } from "src/app/core/services/content-usage-pie.service";
import { getChartJSConfig } from "src/app/core/config/ChartjsConfig";
import { formatNumberForReport } from "src/app/utilities/NumberFomatter";

@Component({
  selector: 'app-user-onboarding',
  templateUrl: './user-onboarding.component.html',
  styleUrls: ['./user-onboarding.component.scss']
})
export class UserOnboardingComponent implements OnInit {
  chartOptions;

  public waterMark = environment.water_mark
  public state;
  public stateData;
  public chartData: any = [];
  public distMetaData: any = [];
  public level;
  public allDistCollection;
  public distWiseCourse: any[];
  public courseToDropDown: any[];
  public uniqueDistCourse: any[];
  public selectedCourse;
  public reportData: any = [];
  public fileName;
  public districtHidden = true;
  public data
  config;
  dashletData;

  constructor(
    private changeDetection: ChangeDetectorRef,
    public commonService: AppServiceComponent,
    public service: EnrollmentProgressLineChartService,
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
    this.changeDetection.detectChanges();
    this.state = this.commonService.state;
    document.getElementById("accessProgressCard") ? document.getElementById("accessProgressCard").style.display = "none" : "";
    document.getElementById("backBtn")
      ? (document.getElementById("backBtn").style.display = "none")
      : "";
    if (environment.auth_api === 'cqube' || this.userAccessLevel === "") {
      if (this.level == "program") {
        setTimeout(() => {
          document.getElementById("spinner") ? document.getElementById("spinner").style.display = "none" : "";
        }, 200);
        this.getProgramData();
      }
      this.getExpectedMeta();
      this.getStateData();
      this.getProgramData();
      this.getAllDistCollection();
    }else{
      document.getElementById('spinner') ? document.getElementById('spinner').style.display = "none" : "";
       this.showError = true
    }
   
     this.hideIfAccessLevel = (environment.auth_api === 'cqube' || this.userAccessLevel === "") ? true : false;
    
  }

  emptyChart() {

    this.expectedEnrolled = [];
    this.netEnrolled = [];
    this.category = [];

    this.courseToDropDown = [];

  }

  getStateData() {
    this.fileName = "enrollment-progress-state";
    try {
      this.service.enrollmentProState().subscribe((res) => {
        res['data'] ? this.stateData = res["data"]["data"] : this.stateData = [];
        this.reportData = this.stateData;
        this.createLineChart(this.stateData);
        this.getDistMeta();
        this.commonService.loaderAndErr(this.stateData);
      }, (err) => {
        this.stateData = [];
        this.commonService.loaderAndErr(this.stateData);
      });
    } catch (error) {
      this.stateData = []
      console.log(error)
      this.commonService.loaderAndErr(this.stateData);
    }
  }

  expectedMeta: boolean
  getExpectedMeta() {
    try {
      this.service.enrollExpectedMeta().subscribe(res => {

        this.expectedMeta = res['jsonData'][0].data_is_available
      })
    } catch (error) {
      console.log(error)
    }
  }

  enrollExpectedMeta

  clickHome() {
    this.dist = false;
    this.skul = true;
    this.districtHidden = true;
    this.selectedDist = "";
    this.selectedCourse = "";
    this.courseSelected = false;
    this.programSelected = false;
    this.selectedProgram = "";
    this.emptyChart();
    this.getStateData();
  }

  public distData;
  getDistWise() {
    this.emptyChart();

    try {
      this.service.enrollmentProDist().subscribe((res) => {
        this.distData = res["data"]["data"];
        this.commonService.loaderAndErr(this.distData);
      });
    } catch (error) {
      this.distData = [];
      console.log(error);
      this.commonService.loaderAndErr(this.distData);
    }
  }

  public expectedEnrolled = [];
  public changeInNetEnrollment = [];
  public netEnrolled = [];
  public category = [];

  createLineChart(data) {
    this.chartData = data;
    this.getLineChart(data);
  }

  public selectedDistricts;
  public distToDropDown;

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
      });
      this.getDistWise();
      this.getAllCollection();
    } catch (error) {
    }
  }

  public programData;
  public programDropDown = [];
  public programWiseCourse: any = [];
  public uniquePrograms: any = [];

  getProgramData() {
    this.programWiseCourse = [];
    this.uniquePrograms = [];
    try {
      this.service.enrollProgam().subscribe((res) => {
        this.data = this.programData = res["data"]["data"]
        this.programData.forEach((course) => {
          this.programDropDown.push({
            program_id: course.program_id,
            program_name: course.program_name,
          });
        });
        this.programDropDown.map((x) =>
          this.uniquePrograms.filter(
            (a) =>
              a.program_id == x.program_id && a.program_name == x.program_name
          ).length > 0
            ? null
            : this.uniquePrograms.push(x)
        );
        this.commonService.loaderAndErr(this.programData)
      });
    } catch (error) {
      this.programData = []
      console.log(error)
      this.commonService.loaderAndErr(this.programData)
    }
  }

  getAllDistCollection() {
    this.emptyChart();
    this.courseToDropDown = [];
    this.uniqueDistCourse = [];
    try {

      this.service.enrollProAllCollection().subscribe((res) => {
        res['data'] ? this.allDistCollection = res["data"]["data"] : this.allDistCollection = [];
        this.commonService.loaderAndErr(this.allDistCollection)
      });

    } catch (error) {
      this.allDistCollection = []
      console.log(error)
      this.commonService.loaderAndErr(this.allDistCollection)
    }
  }

  public programWiseCollection;

  getProgramWiseColl(data) {
    this.service.enrollProgamWiseColl().subscribe((res) => {
      this.programWiseCollection = res["data"]["data"];
      this.programWiseCourse = this.programWiseCollection.filter(
        (collection) => {
          return collection.program_id == data;
        }
      );
      this.getCollectionDropDown(this.programWiseCourse);
    });
  }

  public allCollection;
  public uniqueAllCourse: any;
  getAllCollection() {
    this.emptyChart();
    this.uniqueAllCourse = [];
    this.allCollection = [];
    this.level = "allCourse";
    try {
      this.service.enrollProAllCourse().subscribe((res) => {
        this.allCollection = res["data"]["data"];
        this.getCollectionDropDown(this.allCollection);
        this.commonService.loaderAndErr(this.allCollection);
      });
    } catch (error) {
      this.allCollection = []
      console.log(error)
      this.commonService.loaderAndErr(this.allCollection)
    }
  }

  public collectionDropDown;
  getCollectionDropDown(data) {
    this.uniqueAllCourse = []
    this.courseToDropDown = [];
    this.collectionDropDown = data.slice();
    try {

      if (this.level === "district") {
        this.distWiseCourse = this.allDistCollection.filter((collection) => {
          return collection.district_id == this.selectedDist;
        });
        this.distWiseCourse.forEach((course) => {
          this.courseToDropDown.push({
            collection_id: course.collection_id,
            collection_name: course.collection_name,
          });
        });
        this.courseToDropDown.map((x) =>
          this.uniqueAllCourse.filter(
            (a) =>
              a.collection_id == x.collection_id &&
              a.collection_name == x.collection_name
          ).length > 0
            ? null
            : this.uniqueAllCourse.push(x)
        );
        document.getElementById("spinner") ? document.getElementById("spinner").style.display = "none" : "";
      } else if (this.level === "allCourse") {
        this.collectionDropDown.forEach((course) => {
          this.courseToDropDown.push({
            collection_id: course.collection_id,
            collection_name: course.collection_name,
          });
        });

        this.courseToDropDown.map((x) =>
          this.uniqueAllCourse.filter(
            (a) =>
              a.collection_id == x.collection_id &&
              a.collection_name == x.collection_name
          ).length > 0
            ? null
            : this.uniqueAllCourse.push(x)
        );

      } else if (this.level === 'program') {

        this.collectionDropDown.forEach((course) => {
          this.courseToDropDown.push({
            collection_id: course.collection_id,
            collection_name: course.collection_name,
          });
        });

        this.courseToDropDown.map((x) =>
          this.uniqueAllCourse.filter(
            (a) =>
              a.collection_id == x.collection_id &&
              a.collection_name == x.collection_name
          ).length > 0
            ? null
            : this.uniqueAllCourse.push(x)
        );
      }

    } catch (error) { }
  }

  public selectedDist;
  public selectedDistData: any;
  public districtName;
  public dist = false;
  public skul = true;
  public selectedDistWiseCourse;

  onDistSelected(distId) {
    document.getElementById("spinner") ? document.getElementById("spinner").style.display = "block" : "";
    setTimeout(() => {
      document.getElementById("spinner") ? document.getElementById("spinner").style.display = "none" : "";
    }, 1000);

    this.dist = true;
    this.skul = false;
    this.selectedDist = ""
    this.selectedDistData = [];
    this.selectedDistWiseCourse = [];
    this.reportData = [];
    this.emptyChart();
    this.selectedDist = distId;

    this.distToDropDown.filter((district) => {

      if (district.district_id === this.selectedDist) {
        this.districtName = district.district_name;
      }
    });

    try {
      if (this.courseSelected === true && this.programSelected === true) {
        this.selectedDistData = this.allDistCollection.filter((collection) => {
          return collection.district_id === this.selectedDist;
        });
        this.selectedDistWiseCourse = this.selectedDistData.filter(
          (collection) => {
            return collection.collection_id === this.selectedCourse && collection.program_id === this.selectedProgram;
          }
        );


        this.createLineChart(this.selectedDistWiseCourse);
        this.reportData = this.selectedDistWiseCourse;
      } else if (this.programSelected === true && this.courseSelected !== true) {
        this.selectedCourse = "";
        this.selectedDistData = [];
        this.selectedDistData = this.allDistCollection.filter(program => {
          return program.program_id === this.selectedProgram && program.district_id === this.selectedDist
        })
        this.reportData = this.selectedDistData;
        this.createLineChart(this.selectedDistData);
      } else if (this.courseSelected === true && this.programSelected !== true) {

        this.selectedDistData = [];
        this.selectedDistWiseCourse = [];
        this.selectedDistData = this.distData.filter((collection) => {
          return collection.district_id === this.selectedDist;
        });
        this.selectedDistWiseCourse = this.selectedDistData.filter(
          (collection) => {
            return collection.collection_id === this.selectedCourse;
          }
        );


        this.createLineChart(this.selectedDistWiseCourse);
        this.reportData = this.selectedDistWiseCourse;
      } else {

        this.selectedCourse = "";
        this.selectedDistData = []
        this.selectedDistData = this.distData[this.selectedDist];
        this.getCollectionDropDown(this.selectedDistData);


        this.reportData = this.selectedDistData;

      }
    } catch (error) { }
  }

  public selectedProgram;
  public selectedProgData;
  public programSelected = false;

  onProgramSelected(progId) {
    document.getElementById("spinner") ? document.getElementById("spinner").style.display = "block" : "";
    setTimeout(() => {
      document.getElementById("spinner") ? document.getElementById("spinner").style.display = "none" : "";
    }, 1000);
    this.programSelected = true;
    this.courseSelected = false;
    this.selectedProgData = [];
    this.selectedDist = "";
    this.selectedCourse = "";
    this.uniqueDistCourse = [];
    this.uniqueAllCourse = [];
    this.level = "program";
    this.selectedProgram = progId;
    this.selectedProgData = this.programData.filter((program) => {
      return program.program_id === this.selectedProgram;
    });
    this.createLineChart(this.selectedProgData);
    this.reportData = this.selectedProgData;
    this.getProgramWiseColl(this.selectedProgram);
  }

  public selectedCourseData: any[];
  public courseSelected = false;

  onCourseSelected(courseId) {
    document.getElementById("spinner") ? document.getElementById("spinner").style.display = "block" : "";
    setTimeout(() => {
      document.getElementById("spinner") ? document.getElementById("spinner").style.display = "none" : "";
    }, 1000);
    this.courseSelected = true;
    this.districtHidden = this.hideIfAccessLevel === true ? false : true;
    this.selectedDist = '';
    this.emptyChart();
    this.selectedCourseData = [];
    this.selectedCourse = courseId;

    if (this.level === "district") {

      this.distWiseCourse.forEach((course) => {
        if (course.collection_id === this.selectedCourse) {
          this.selectedCourseData.push(course);
        }
      });

      this.createLineChart(this.selectedCourseData);
      this.reportData = this.selectedCourseData;

    } else if (this.level === "allCourse") {
      this.allCollection.forEach((course) => {
        if (course.collection_id === this.selectedCourse) {
          this.selectedCourseData.push(course);
        }
      });
      this.createLineChart(this.selectedCourseData);
      this.reportData = this.selectedCourseData;
    } else if (this.level === "program") {
      this.selectedCourseData = []
      this.programWiseCourse.forEach((course) => {
        if (course.collection_id === this.selectedCourse) {
          this.selectedCourseData.push(course);
        }
      });
      this.createLineChart(this.selectedCourseData);
      this.reportData = this.selectedCourseData;
    }

  }

  //filter downloadable data
  dataToDownload = [];
  newDownload(element) {
    var data1 = {},
      data2 = {},
      data3 = {};
    Object.keys(element).forEach((key) => {
      data1[key] = element[key];
    });

    this.dataToDownload.push(data1);
  }

  //download UI data::::::::::::
  downloadReport() {
    this.dataToDownload = [];
    this.reportData.forEach((element) => {
      this.newDownload(element);
    });
    this.commonService.download(this.fileName, this.dataToDownload);
  }

  getLineChart(data) {
    this.config = getChartJSConfig({
      labelExpr: 'date',
      datasets: [
        { dataExpr: 'expected_enrollment', label: 'Expected Enrolled' },
        { dataExpr: 'net_enrollment', label: 'Total Net Enrolled' }
      ],
      options: {
        responsive: true,
        height: 200,
        elements: {
          line: {
            fill: false
          }
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Date'
            },
            ticks: {
              callback: function(value) { 
                  return new Date(value).toLocaleDateString('en-US', {day: '2-digit', month:'short', year:'numeric'}); 
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Expected Enrolment and Total Net Enrolment'
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems, data) {
              return `Date: ${new Date(tooltipItems[0].label).toLocaleDateString('en-US', {day: '2-digit', month:'short', year:'numeric'})}`;
            },
            label: function (tooltipItem, data) {
              let multistringText = [];
              multistringText.push(`${data.datasets[tooltipItem.datasetIndex].label}: ${formatNumberForReport(tooltipItem.yLabel)}`);
              return multistringText;
            }
          }
        }
      }
    });

    this.dashletData = {
      values: data
    };
  }
}
