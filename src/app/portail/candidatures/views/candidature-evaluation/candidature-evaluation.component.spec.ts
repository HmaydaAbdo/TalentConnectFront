import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatureEvaluationComponent } from './candidature-evaluation.component';

describe('CandidatureEvaluationComponent', () => {
  let component: CandidatureEvaluationComponent;
  let fixture: ComponentFixture<CandidatureEvaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatureEvaluationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidatureEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
