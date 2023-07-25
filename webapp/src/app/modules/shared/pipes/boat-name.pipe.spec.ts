import { BoatNamePipe } from "./boat-name.pipe";

describe("BoatNamePipe", () => {
  it("create an instance", () => {
    const pipe = new BoatNamePipe();
    expect(pipe).toBeTruthy();
  });
});
