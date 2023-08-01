import { TestBed } from "@angular/core/testing";

import { SignOutResolver } from "./sign-out.resolver";

describe("SignOutResolver", () => {
  let resolver: SignOutResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(SignOutResolver);
  });

  it("should be created", () => {
    expect(resolver).toBeTruthy();
  });
});
