import { App, Testing } from "cdktf";
import { MultiRegionStack } from "../../lib/main";
import * as fs from 'fs';
import * as path from 'path';

describe("MultiRegionStack Integration Tests", () => {
  it("should create multi-region infrastructure", () => {
    const app = new App();
    
    const usStack = new MultiRegionStack(app, "us-integration", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "integration-test",
    });
    
    const euStack = new MultiRegionStack(app, "eu-integration", {
      region: "eu-central-1",
      vpcCidr: "10.1.0.0/16",
      environment: "integration-test",
    });
    
    expect(usStack).toBeDefined();
    expect(euStack).toBeDefined();
  });

  it("should ensure cross-region isolation", () => {
    const app = Testing.app();
    
    const usStack = new MultiRegionStack(app, "us-isolation", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "isolation-test",
    });
    
    const euStack = new MultiRegionStack(app, "eu-isolation", {
      region: "eu-central-1",
      vpcCidr: "10.1.0.0/16",
      environment: "isolation-test",
    });
    
    const usSynthesized = Testing.synth(usStack);
    const euSynthesized = Testing.synth(euStack);
    
    // Verify different regions
    expect(usSynthesized).toContain('"region": "us-east-1"');
    expect(euSynthesized).toContain('"region": "eu-central-1"');
    
    // Verify no cross-region references
    expect(euSynthesized).not.toContain('us-east-1');
    expect(usSynthesized).not.toContain('eu-central-1');
  });

  it("should validate all security requirements are met", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "security-validation", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // No hardcoded passwords
    expect(synthesized).not.toContain('password": "');
    expect(synthesized).toContain('"manage_password": false');
    expect(synthesized).toContain('"password_secret_arn"');
    
    // Encryption enabled
    expect(synthesized).toContain('"storage_encrypted": true');
    expect(synthesized).toContain('"server_side_encryption_configuration"');
    expect(synthesized).toContain('"enable_key_rotation": true');
    
    // No SSH access
    expect(synthesized).not.toContain('"from_port": 22');
    expect(synthesized).not.toContain('"to_port": 22');
    
    // VPC-only traffic
    expect(synthesized).toContain('"cidr_blocks": ["10.0.0.0/16"]');
  });

  it("should validate resource tagging consistency", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "tagging-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test-env",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify consistent tagging
    expect(synthesized).toContain('"Environment": "test-env"');
    expect(synthesized).toContain('"Name": "test-env-');
    expect(synthesized).toContain('"Encrypted": "true"');
  });

  it("should validate CloudWatch and CloudTrail configuration", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "monitoring-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // CloudWatch logs
    expect(synthesized).toContain('"retention_in_days": 7');
    expect(synthesized).toContain('"/aws/application/test"');
    
    // CloudTrail
    expect(synthesized).toContain('"include_global_service_events": false');
    expect(synthesized).toContain('"is_multi_region_trail": false');
    expect(synthesized).toContain('"enable_logging": true');
  });

  it("should validate IAM roles have minimal permissions", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "iam-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify minimal IAM permissions
    expect(synthesized).toContain('"Service": "monitoring.rds.amazonaws.com"');
    expect(synthesized).toContain('AmazonRDSEnhancedMonitoringRole');
    
    // Should not contain overly broad permissions
    expect(synthesized).not.toContain('*:*');
    expect(synthesized).not.toContain('"Effect": "Allow", "Action": "*"');
  });

  it("should validate private subnet configuration", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "subnet-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify private subnets
    expect(synthesized).toContain('"map_public_ip_on_launch": false');
    expect(synthesized).toContain('"availability_zone": "us-east-1a"');
    expect(synthesized).toContain('"availability_zone": "us-east-1b"');
    
    // Verify subnet CIDRs
    expect(synthesized).toContain('10.0.0.0/24');
    expect(synthesized).toContain('10.0.0.128/25');
  });

  it("should validate database subnet group configuration", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "db-subnet-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('aws_db_subnet_group');
    expect(synthesized).toContain('"subnet_ids"');
  });

  it("should validate deployment outputs structure", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "output-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Verify all major resource types are present for output generation
    const expectedResources = [
      'aws_vpc',
      'aws_subnet',
      'aws_security_group',
      'aws_s3_bucket',
      'aws_db_instance',
      'aws_kms_key',
      'aws_secretsmanager_secret',
      'aws_cloudwatch_log_group',
      'aws_cloudtrail'
    ];
    
    expectedResources.forEach(resourceType => {
      expect(synthesized).toContain(resourceType);
    });
  });

  it("should validate resource count per region", () => {
    const app = Testing.app();
    const stack = new MultiRegionStack(app, "count-test", {
      region: "us-east-1",
      vpcCidr: "10.0.0.0/16",
      environment: "test",
    });
    
    const synthesized = Testing.synth(stack);
    
    // Count major resources (should be 13 per region as documented)
    const resourceCounts = {
      vpc: (synthesized.match(/aws_vpc/g) || []).length,
      subnets: (synthesized.match(/aws_subnet/g) || []).length,
      securityGroups: (synthesized.match(/aws_security_group/g) || []).length,
      s3Buckets: (synthesized.match(/aws_s3_bucket/g) || []).length,
      kmsKeys: (synthesized.match(/aws_kms_key/g) || []).length,
      secrets: (synthesized.match(/aws_secretsmanager_secret/g) || []).length,
      iamRoles: (synthesized.match(/aws_iam_role/g) || []).length,
      logGroups: (synthesized.match(/aws_cloudwatch_log_group/g) || []).length,
      cloudTrails: (synthesized.match(/aws_cloudtrail/g) || []).length,
      dbSubnetGroups: (synthesized.match(/aws_db_subnet_group/g) || []).length,
      dbInstances: (synthesized.match(/aws_db_instance/g) || []).length
    };
    
    // Verify expected resource counts
    expect(resourceCounts.vpc).toBe(1);
    expect(resourceCounts.subnets).toBe(2);
    expect(resourceCounts.securityGroups).toBe(2);
    expect(resourceCounts.s3Buckets).toBe(2);
    expect(resourceCounts.kmsKeys).toBe(1);
    expect(resourceCounts.dbInstances).toBe(1);
  });
});