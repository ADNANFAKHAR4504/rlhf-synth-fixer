import { TapStack } from "../lib/tap-stack";

describe("TapStack Structure", () => {
  let stack: TapStack;

  describe("with props", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackWithProps", {
        environmentSuffix: "prod",
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("is a valid Pulumi ComponentResource", () => {
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault");
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("is a valid Pulumi ComponentResource", () => {
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("with minimal configuration", () => {
    it("accepts empty tags object", () => {
      stack = new TapStack("TestTapStackMinimal", {
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it("accepts tags configuration", () => {
      stack = new TapStack("TestTapStackWithTags", {
        environmentSuffix: "dev",
        tags: {
          Project: "Test",
          Owner: "Team",
        },
      });
      expect(stack).toBeDefined();
    });
  });
});
