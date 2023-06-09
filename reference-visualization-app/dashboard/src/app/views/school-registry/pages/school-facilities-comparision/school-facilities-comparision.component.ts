import { Component, OnInit } from '@angular/core';
import { ChartJSConfig, getChartJSConfig, getScatterDatasetConfig } from 'src/app/core/config/ChartjsConfig';
import { IReportDataPayload } from 'src/app/core/models/IReportDataPayload';
import { CommonService } from 'src/app/core/services/common/common.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-school-facilities-comparision',
  templateUrl: './school-facilities-comparision.component.html',
  styleUrls: ['./school-facilities-comparision.component.scss']
})
export class SchoolFacilitiesComparisionComponent implements OnInit {
  national: boolean = environment.config === 'national' ? true : false;
  filters: any;
  levels: any;
  axisFilters: any;
  height = window.innerHeight;
  config;
  dashletData;
  showError = false;
  isLoading = true;
  fileName: string = "UDISE_Correlation";

  constructor(private readonly _commonService: CommonService) {
    this.getScatterData(this.filters, this.levels, this.axisFilters);
  }

  ngOnInit(): void {
  }

  getScatterData(filters: any, levels: any, axisFilters: any): void {
    let data: IReportDataPayload = {
      appName: environment.config.toLowerCase(),
      dataSourceName: 'school_registry',
      reportName: 'udise_performance',
      reportType: 'scatterPlot',
      stateCode: environment.stateCode,
      filters,
      levels,
      axisFilters
    };

    this._commonService.getReportData(data).subscribe(res => {
      this.isLoading = false;
      this.axisFilters = res.result.axisFilters;
      this.filters = res.result.filters;
      this.levels = res.result.levels;

      this.showError = !res.result.data || res.result.data.length === 0;

      this.dashletData = {
        values: res.result.data
      };

      this.config = getChartJSConfig({
        labelExpr: 'pm_poshan_access',
        datasets: getScatterDatasetConfig([{
          label: 'PM Poshan Access',
          data: res.result.data
        }]),
        options: {
          height: '300',
          legend: {
            display: false
          },
          scales: {
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: this.getAxisTitle(this.axisFilters[1])
              },
              ticks: {
                min: 0,
                max: 100
              }
            }],
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: this.getAxisTitle(this.axisFilters[0])
              },
              ticks: {
                min: 0,
                max: 100
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {                
                let tooltipData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].data;
                var multistringText = [];
                if (tooltipData) {
                  const tooltipDataSplit = tooltipData.split('<br>');

                  for (const toolTipSplitItem of tooltipDataSplit) {
                    multistringText.push(toolTipSplitItem);
                  }
                }
                return multistringText;
              },
            }
          }
        }
      });
    });
  }

  getAxisTitle(axisFilter: any): string {
    if (axisFilter) {
      let filterOption = axisFilter.options.find((option: any) => option.value === axisFilter.value)
      if (filterOption) {
        return filterOption.label;
      }
    }

    return "";
  }

  scatterAxisFiltersUpdated(axisFilters: any): void {
    this.getScatterData(this.filters, this.levels, axisFilters);
  }
  
  scatterFiltersUpdated(filters: any): void {
    this.getScatterData(filters, this.levels, this.axisFilters);
  }

  onScatterSelectLevel(event: any): void {
    event.items.forEach((level: any, levelInd: number) => {
      level.selected = levelInd === event.index;
    });

    this.getScatterData(this.filters, event.items, this.axisFilters);
  }

}
