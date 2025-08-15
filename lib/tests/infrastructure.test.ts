import { Testing } from "cdktf";
import { MultiRegionStack } from "../main";

describe("MultiRegionStack", () => {
  it("should create VPC with correct CIDR", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_vpc", {
      cidr_block: "10.0.0.0/16",
      enable_dns_hostnames: true,
      enable_dns_support: true,
    });
  });

  it("should create security groups with no SSH access", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1", 
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    const securityGroups = synthesized.filter(resource => resource.type === "aws_security_group");
    
    securityGroups.forEach(sg => {
      const ingress = sg.values.ingress || [];
      ingress.forEach(rule => {
        expect(rule.from_port).not.toBe(22);
        expect(rule.to_port).not.toBe(22);
      });
    });
  });

  it("should create encrypted RDS instance", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16", 
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_db_instance", {
      storage_encrypted: true,
      backup_retention_period: 7,
    });
  });

  it("should create KMS key with rotation enabled", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test", 
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_kms_key", {
      enable_key_rotation: true,
    });
  });
});