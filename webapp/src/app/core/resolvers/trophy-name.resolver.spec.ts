import { TestBed } from "@angular/core/testing";

import { TrophyNameResolver } from "./trophy-name.resolver";

describe("TrophyNameResolver", () => {
  let resolver: TrophyNameResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(TrophyNameResolver);
  });

  it("should be created", () => {
    expect(resolver).toBeTruthy();
  });
});
