import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UdiseReportComponent } from './udise-report.component';

describe('UdiseReportComponent', () => {
  let component: UdiseReportComponent;
  let fixture: ComponentFixture<UdiseReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UdiseReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UdiseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
