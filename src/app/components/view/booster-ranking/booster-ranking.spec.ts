import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoosterRanking } from './booster-ranking';

describe('BoosterRanking', () => {
  let component: BoosterRanking;
  let fixture: ComponentFixture<BoosterRanking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoosterRanking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoosterRanking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
