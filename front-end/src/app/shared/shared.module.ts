import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

import { MultiBarChartComponent } from './components/charts/multi-bar-chart/multi-bar-chart.component';
import { DashboardCardComponent } from './components/cards/dashboard-card/dashboard-card.component';
import { RouterModule } from '@angular/router';
import { MetricCardComponent } from './components/cards/metric-card/metric-card.component';
import { MapMyIndiaComponent } from './components/maps/map-my-india/map-my-india.component';
import { TableHeatMapDirective, TableHeatMapCellDirective, TableHeatMapColumnDirective } from './directives/table-heat-map/table-heat-map.directive';
import { GuageChartComponent } from './components/charts/guage-chart/guage-chart.component';
import { MaterialHeatChartTableComponent } from './components/tables/material-heat-chart-table/material-heat-chart-table.component';

const IMPORTS: any[] = [
  MatTableModule,
  MatSortModule,
];

const DECLARATIONS = [
  MultiBarChartComponent,
  DashboardCardComponent,
  MetricCardComponent,
  MaterialHeatChartTableComponent,
  MapMyIndiaComponent,
  TableHeatMapDirective,
  TableHeatMapCellDirective,
  TableHeatMapColumnDirective,
  GuageChartComponent
];

@NgModule({
  declarations: [
    DECLARATIONS
  ],
  imports: [
    CommonModule,
    RouterModule,
    IMPORTS
  ],
  exports: [
    IMPORTS,
    DECLARATIONS
  ]
})
export class SharedModule { }