import { ComponentFixture, TestBed } from '@angular/core/testing';
import {CandidatureDetailComponent} from "./candidature-details.component";


describe('CandidatureDetailsComponent', () => {
  let component: CandidatureDetailComponent;
  let fixture: ComponentFixture<CandidatureDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatureDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidatureDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
