import { App, Testing } from "cdktf";
import { MultiRegionStack } from "../../lib/main";

describe("MultiRegionStack Unit Tests", () => {
  it("should create stack without errors", () => {
    const app = new App();
    const stack = new MultiRegionStack(app, "test-stack", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    expect(stack).toBeDefined();
  });

  it("should synthesize with all required AWS resources", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "resource-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify all expected AWS resources are present
    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('aws_subnet');
    expect(synthesized).toContain('aws_security_group');
    expect(synthesized).toContain('aws_s3_bucket');
    expect(synthesized).toContain('aws_iam_role');
    expect(synthesized).toContain('aws_db_instance');
    expect(synthesized).toContain('aws_db_subnet_group');
    expect(synthesized).toContain('aws_cloudwatch_log_group');
    expect(synthesized).toContain('aws_cloudtrail');
    expect(synthesized).toContain('aws_kms_key');
    expect(synthesized).toContain('aws_secretsmanager_secret');
  });

  it("should configure VPC with proper DNS settings", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "vpc-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"cidr_block": "10.0.0.0/16"');
    expect(synthesized).toContain('"enable_dns_hostnames": true');
    expect(synthesized).toContain('"enable_dns_support": true');
  });

  it("should block SSH access in security groups", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "security-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify no SSH (port 22) access
    expect(synthesized).not.toContain('"from_port": 22');
    expect(synthesized).not.toContain('"to_port": 22');
    
    // Verify only necessary ports are allowed
    expect(synthesized).toContain('"from_port": 443');
    expect(synthesized).toContain('"from_port": 3306');
  });

  it("should enable RDS encryption with KMS", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "rds-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"storage_encrypted": true');
    expect(synthesized).toContain('"kms_key_id"');
    expect(synthesized).toContain('"manage_password": false');
    expect(synthesized).toContain('"password_secret_arn"');
  });

  it("should configure S3 buckets with encryption", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "s3-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"server_side_encryption_configuration"');
    expect(synthesized).toContain('"sse_algorithm": "AES256"');
  });

  it("should enable KMS key rotation", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "kms-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"enable_key_rotation": true');
  });

  it("should configure Secrets Manager with KMS encryption", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "secrets-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('aws_secretsmanager_secret');
    expect(synthesized).toContain('aws_secretsmanager_secret_version');
    expect(synthesized).toContain('"password_length": 32');
    expect(synthesized).toContain('"exclude_characters": "\\"@/\\\\"');
  });

  it("should configure RDS with backups and monitoring", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "backup-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"backup_retention_period": 7');
    expect(synthesized).toContain('"backup_window": "03:00-04:00"');
    expect(synthesized).toContain('"maintenance_window": "sun:04:00-sun:05:00"');
    expect(synthesized).toContain('"monitoring_interval": 60');
  });

  it("should use different VPC CIDRs for different regions", () => {
    const app = Testing.app();
    
    const usStack = new MultiRegionStack(app, "us-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const euStack = new MultiRegionStack(app, "eu-test", {
      region: "eu-central-1",
      vpcCidr: "10.1.0.0/16",
      environment: "test",
    });
    
    const usSynthesized = Testing.synth(usStack);
    const euSynthesized = Testing.synth(euStack);
    
    expect(usSynthesized).toContain('"cidr_block": "10.0.0.0/16"');
    expect(euSynthesized).toContain('"cidr_block": "10.1.0.0/16"');
    expect(usSynthesized).not.toContain('"cidr_block": "10.1.0.0/16"');
    expect(euSynthesized).not.toContain('"cidr_block": "10.0.0.0/16"');
  });
});