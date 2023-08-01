import { TestBed } from "@angular/core/testing";

import { ClubIdResolver } from "./club-id.resolver";

describe("ClubIdResolver", () => {
  let resolver: ClubIdResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ClubIdResolver);
  });

  it("should be created", () => {
    expect(resolver).toBeTruthy();
  });
});
