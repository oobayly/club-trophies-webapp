import { DonatedPipe } from "./donated.pipe";

describe("DonatedPipe", () => {
  it("create an instance", () => {
    const pipe = new DonatedPipe();
    expect(pipe).toBeTruthy();
  });
});
