import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-material-table',
  templateUrl: './material-table.component.html',
  styleUrls: ['./material-table.component.scss']
})
export class MaterialTableComponent implements OnInit {
  _tableData: any;
  _columns: any;
  columnProperties: any[] = [];
  dataSource!: MatTableDataSource<any>;

  @Input() set tableData(tableData: any) {
    if (tableData) {
      this._tableData = tableData;
      this.dataSource = new MatTableDataSource(tableData);
      this.dataSource.sort = this.sort;
    }
  };

  get tableData(): any {
    return this._tableData;
  }

  @Input() set columns(columns: any) {
    if (columns) {
      this._columns = columns;
      this.columnProperties = [...['id'], ...columns.map((column: any) => column.property)];
    }
  };

  get columns(): any {
    return this._columns;
  }

  @ViewChild(MatSort) sort!: MatSort;

  constructor() { }

  ngOnInit(): void {
  }
}