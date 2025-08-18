import { App } from "cdktf";
import { MultiRegionStack } from "../main";

describe("MultiRegionStack", () => {
  it("should create stack without errors", () => {
    const app = new App();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    expect(stack).toBeDefined();
    expect(stack.region).toBe("us-east-1");
  });

  it("should create multi-region infrastructure", () => {
    const app = new App();
    const stack1 = new MultiRegionStack(app, "us-stack", {
      region: "us-east-1", 
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const stack2 = new MultiRegionStack(app, "eu-stack", {
      region: "eu-central-1", 
      vpcCidr: "10.1.0.0/16",
      environment: "test",
    });
    
    expect(stack1).toBeDefined();
    expect(stack2).toBeDefined();
    expect(stack1.region).toBe("us-east-1");
    expect(stack2.region).toBe("eu-central-1");
  });
});