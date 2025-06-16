import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetierListComponent } from './metier-list.component';

describe('MetierListComponent', () => {
  let component: MetierListComponent;
  let fixture: ComponentFixture<MetierListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetierListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MetierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
