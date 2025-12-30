import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsWithStats } from './cards-with-stats';

describe('CardsWithStats', () => {
  let component: CardsWithStats;
  let fixture: ComponentFixture<CardsWithStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsWithStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsWithStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
