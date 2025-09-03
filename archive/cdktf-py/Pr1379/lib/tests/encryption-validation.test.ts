import { Testing } from "cdktf";
import { MultiRegionStack } from "../main";

describe("Encryption Validation Tests", () => {
  it("should validate RDS encryption is enabled", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "rds-encryption-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"storage_encrypted": true');
    expect(synthesized).toContain('"kms_key_id"');
  });

  it("should validate S3 bucket encryption is configured", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "s3-encryption-test", {
      region: "us-east-1", 
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"server_side_encryption_configuration"');
    expect(synthesized).toContain('"sse_algorithm": "AES256"');
  });

  it("should validate KMS key rotation is enabled", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "kms-rotation-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16", 
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"enable_key_rotation": true');
  });

  it("should validate secrets are encrypted with KMS", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "secrets-encryption-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test", 
    });
    
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"kms_key_id"');
    expect(synthesized).toContain('secretsmanager_secret');
  });
});