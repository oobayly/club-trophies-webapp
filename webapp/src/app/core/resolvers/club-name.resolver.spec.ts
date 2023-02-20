import { TestBed } from "@angular/core/testing";

import { ClubNameResolver } from "./club-name.resolver";

describe("ClubNameResolver", () => {
  let resolver: ClubNameResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ClubNameResolver);
  });

  it("should be created", () => {
    expect(resolver).toBeTruthy();
  });
});
