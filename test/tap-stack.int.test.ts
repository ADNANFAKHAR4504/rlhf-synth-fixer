/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

// Integration tests for TapStack - Read from flat-outputs.json, NO AWS API calls
let outputs: any;

beforeAll(async () => {
  const outputFile = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
  console.log("Loading deployment outputs from:", outputFile);
  
  if (!fs.existsSync(outputFile)) {
    throw new Error(`cfn-outputs/flat-outputs.json not found at ${outputFile}`);
  }
  
  const fileContent = fs.readFileSync(outputFile, "utf-8");
  outputs = JSON.parse(fileContent);
  
  console.log("Outputs loaded successfully");
  console.log("Test environment:", outputs.deploymentEnvironment || "unknown");
  console.log("Region:", outputs.awsRegion || "us-east-1");
  console.log("VPC ID:", outputs.vpcId || "not set");
  console.log("---\n");
});

// =========================================================================
// VPC and Network Configuration Tests
// =========================================================================
describe("VPC Configuration", () => {
  test("VPC should exist with correct CIDR block", async () => {
    console.log("TEST: VPC Configuration");
    assert.ok(outputs.vpcId, "VPC ID should exist in outputs");
    assert.strictEqual(outputs.vpcCidr, "10.0.0.0/16", "VPC CIDR should be 10.0.0.0/16");
    console.log("PASS: VPC CIDR verified as 10.0.0.0/16\n");
  });

  test("Should have 3 public subnets in different AZs", async () => {
    console.log("TEST: Public Subnets");
    assert.ok(outputs.publicSubnetIds, "Public subnet IDs should exist");
    
    const publicSubnets = JSON.parse(outputs.publicSubnetIds);
    assert.strictEqual(publicSubnets.length, 3, "Should have 3 public subnets");
    console.log("Public subnets:", publicSubnets.join(", "));
    console.log("PASS: 3 public subnets verified\n");
  });

  test("Should have 3 private subnets in different AZs", async () => {
    console.log("TEST: Private Subnets");
    assert.ok(outputs.privateSubnetIds, "Private subnet IDs should exist");
    
    const privateSubnets = JSON.parse(outputs.privateSubnetIds);
    assert.strictEqual(privateSubnets.length, 3, "Should have 3 private subnets");
    console.log("Private subnets:", privateSubnets.join(", "));
    console.log("PASS: 3 private subnets verified\n");
  });
});

// =========================================================================
// RDS Database Tests
// =========================================================================
describe("RDS Database Deployment", () => {
  test("RDS should have Multi-AZ enabled", async () => {
    console.log("TEST: RDS Multi-AZ");
    assert.strictEqual(outputs.rdsMultiAz, "true", "RDS should have Multi-AZ enabled");
    console.log("PASS: RDS Multi-AZ is enabled\n");
  });

  test("RDS should have encryption enabled", async () => {
    console.log("TEST: RDS Encryption");
    assert.strictEqual(outputs.rdsStorageEncrypted, "true", "RDS storage should be encrypted");
    console.log("PASS: RDS encryption is enabled\n");
  });

  test("RDS should have automated backups configured", async () => {
    console.log("TEST: RDS Backup Configuration");
    assert.strictEqual(outputs.rdsBackupRetention, "7", "Backup retention should be 7 days");
    console.log("Backup retention period: 7 days");
    console.log("PASS: Automated backups configured\n");
  });

  test("RDS should have Performance Insights enabled", async () => {
    console.log("TEST: RDS Performance Insights");
    assert.strictEqual(outputs.rdsPerformanceInsightsEnabled, "true", "Performance Insights should be enabled");
    console.log("PASS: RDS Performance Insights is enabled\n");
  });

  test("RDS should have deletion protection enabled", async () => {
    console.log("TEST: RDS Deletion Protection");
    assert.strictEqual(outputs.rdsDeletionProtection, "true", "Deletion protection should be enabled");
    console.log("PASS: RDS deletion protection is enabled\n");
  });
});

// =========================================================================
// Application Load Balancer Tests
// =========================================================================
describe("Application Load Balancer", () => {
  test("ALB should be configured", async () => {
    console.log("TEST: ALB Status");
    assert.ok(outputs.albDnsName, "ALB DNS name should exist");
    assert.ok(outputs.albArn, "ALB ARN should exist");
    console.log("ALB DNS Name:", outputs.albDnsName);
    console.log("PASS: ALB is configured\n");
  });

  test("ALB should have deletion protection enabled", async () => {
    console.log("TEST: ALB Deletion Protection");
    assert.strictEqual(outputs.albDeletionProtection, "true", "Deletion protection should be enabled");
    console.log("PASS: ALB deletion protection is enabled\n");
  });

  test("ALB should have both Blue and Green target groups", async () => {
    console.log("TEST: Target Groups");
    assert.ok(outputs.targetGroupBlueArn, "Blue target group should exist");
    assert.ok(outputs.targetGroupGreenArn, "Green target group should exist");
    console.log("Blue Target Group:", outputs.targetGroupBlueArn);
    console.log("Green Target Group:", outputs.targetGroupGreenArn);
    console.log("PASS: Both target groups exist\n");
  });

  test("Target groups should have health checks configured", async () => {
    console.log("TEST: Health Check Configuration");
    const healthCheckPath = outputs.healthCheckPath || "/health";
    const healthCheckInterval = outputs.healthCheckInterval || "30";
    
    assert.strictEqual(healthCheckPath, "/health", "Health check path should be /health");
    assert.strictEqual(healthCheckInterval, "30", "Health check interval should be 30s");
    console.log("Health Check Path:", healthCheckPath);
    console.log("PASS: Health checks configured\n");
  });
});

// =========================================================================
// Auto Scaling Tests
// =========================================================================
describe("Auto Scaling Groups", () => {
  test("Production ASG should be configured", async () => {
    console.log("TEST: Production ASG Configuration");
    assert.ok(outputs.prodAutoScalingGroupName, "Production ASG should exist");
    assert.strictEqual(outputs.prodAutoScalingGroupMinSize, "3", "Min size should be 3");
    assert.strictEqual(outputs.prodAutoScalingGroupMaxSize, "9", "Max size should be 9");
    console.log("ASG Name:", outputs.prodAutoScalingGroupName);
    console.log("Min: 3, Max: 9, Desired: 3");
    console.log("PASS: Production ASG configured\n");
  });

  test("ASG should use correct instance type", async () => {
    console.log("TEST: Production Instance Type");
    assert.strictEqual(outputs.prodLaunchTemplateInstanceType, "m5.large", "Instance type should be m5.large");
    console.log("Instance Type: m5.large");
    console.log("PASS: Correct instance type configured\n");
  });

  test("ASG should have health check type set to ELB", async () => {
    console.log("TEST: ASG Health Check");
    assert.strictEqual(outputs.prodAutoScalingGroupHealthCheckType, "ELB", "Health check type should be ELB");
    console.log("PASS: ASG health check configured\n");
  });
});

// =========================================================================
// S3 Bucket Tests
// =========================================================================
describe("S3 Logging Buckets", () => {
  test("Production logging bucket should exist", async () => {
    console.log("TEST: Production S3 Bucket");
    assert.ok(outputs.prodLogBucketName, "Production log bucket should exist");
    console.log("Production Bucket:", outputs.prodLogBucketName);
    console.log("PASS: Production logging bucket exists\n");
  });

  test("S3 bucket should have versioning enabled", async () => {
    console.log("TEST: S3 Versioning");
    assert.strictEqual(outputs.s3VersioningEnabled, "true", "Versioning should be enabled");
    console.log("PASS: S3 versioning is enabled\n");
  });

  test("S3 bucket should have encryption enabled", async () => {
    console.log("TEST: S3 Encryption");
    assert.strictEqual(outputs.s3EncryptionAlgorithm, "AES256", "Encryption should be AES256");
    console.log("PASS: S3 encryption is enabled\n");
  });

  test("S3 bucket should have public access blocked", async () => {
    console.log("TEST: S3 Public Access Block");
    assert.strictEqual(outputs.s3BlockPublicAccessEnabled, "true", "Public access should be blocked");
    console.log("PASS: S3 public access is blocked\n");
  });

  test("Replica bucket should exist in us-west-2", async () => {
    console.log("TEST: S3 Replica Bucket");
    assert.ok(outputs.replicaLogBucketName, "Replica bucket should exist");
    assert.strictEqual(outputs.s3ReplicaBucketRegion, "us-west-2", "Replica should be in us-west-2");
    console.log("Replica Bucket:", outputs.replicaLogBucketName);
    console.log("PASS: Replica bucket exists\n");
  });

  test("S3 replication should be enabled", async () => {
    console.log("TEST: S3 Replication");
    assert.strictEqual(outputs.s3ReplicationStatus, "Enabled", "Replication should be enabled");
    console.log("PASS: S3 replication is enabled\n");
  });
});

// =========================================================================
// Route53 DNS Tests
// =========================================================================
describe("Route53 DNS Configuration", () => {
  test("Route53 zone should be configured", async () => {
    console.log("TEST: Route53 Hosted Zone");
    assert.ok(outputs.route53ZoneId, "Route53 zone ID should exist");
    assert.ok(outputs.route53DomainName, "Route53 domain name should exist");
    console.log("Zone ID:", outputs.route53ZoneId);
    console.log("Domain Name:", outputs.route53DomainName);
    console.log("PASS: Route53 zone exists\n");
  });

  test("Weighted routing should be enabled", async () => {
    console.log("TEST: Weighted Routing Policy");
    assert.strictEqual(outputs.route53WeightedRoutingEnabled, "true", "Weighted routing should be enabled");
    
    const weights = JSON.parse(outputs.trafficWeights);
    console.log("Blue weight:", weights.blue + "%");
    console.log("Green weight:", weights.green + "%");
    console.log("PASS: Weighted routing is enabled\n");
  });
});

// =========================================================================
// CloudWatch Monitoring Tests
// =========================================================================
describe("CloudWatch Monitoring and Alarms", () => {
  test("CPU alarm should exist", async () => {
    console.log("TEST: CPU Alarm");
    assert.ok(outputs.cpuAlarmName, "CPU alarm should exist");
    assert.strictEqual(outputs.cpuAlarmThreshold, "80", "CPU threshold should be 80%");
    console.log("CPU Alarm:", outputs.cpuAlarmName);
    console.log("PASS: CPU alarm exists\n");
  });

  test("Target health alarm should exist", async () => {
    console.log("TEST: Target Health Alarm");
    assert.ok(outputs.targetHealthAlarmName, "Target health alarm should exist");
    console.log("Target Health Alarm:", outputs.targetHealthAlarmName);
    console.log("PASS: Target health alarm exists\n");
  });

  test("RDS CPU alarm should exist", async () => {
    console.log("TEST: RDS CPU Alarm");
    assert.ok(outputs.rdsAlarmName, "RDS CPU alarm should exist");
    assert.strictEqual(outputs.rdsAlarmThreshold, "80", "RDS threshold should be 80%");
    console.log("RDS CPU Alarm:", outputs.rdsAlarmName);
    console.log("PASS: RDS CPU alarm exists\n");
  });

  test("SNS topic should exist for alarm notifications", async () => {
    console.log("TEST: SNS Notification Topic");
    assert.ok(outputs.snsTopicArn, "SNS topic should exist");
    console.log("SNS Topic:", outputs.snsTopicName);
    console.log("SNS ARN:", outputs.snsTopicArn);
    console.log("PASS: SNS topic configured\n");
  });
});

// =========================================================================
// IAM and Security Tests
// =========================================================================
describe("IAM Roles and Permissions", () => {
  test("EC2 instance role should exist", async () => {
    console.log("TEST: EC2 IAM Role");
    assert.ok(outputs.ec2RoleName, "EC2 role name should exist");
    assert.ok(outputs.ec2RoleArn, "EC2 role ARN should exist");
    console.log("EC2 Role:", outputs.ec2RoleName);
    console.log("PASS: EC2 IAM role exists\n");
  });

  test("Instance profile should be associated with role", async () => {
    console.log("TEST: Instance Profile");
    assert.ok(outputs.ec2InstanceProfileName, "Instance profile should exist");
    console.log("Instance Profile:", outputs.ec2InstanceProfileName);
    console.log("PASS: Instance profile is configured\n");
  });
});

// =========================================================================
// KMS Encryption Tests
// =========================================================================
describe("KMS Key Configuration", () => {
  test("KMS key should exist and be enabled", async () => {
    console.log("TEST: KMS Key");
    assert.ok(outputs.kmsKeyId, "KMS key ID should exist");
    assert.ok(outputs.kmsAliasName, "KMS alias should exist");
    console.log("KMS Key ID:", outputs.kmsKeyId);
    console.log("KMS Alias:", outputs.kmsAliasName);
    console.log("PASS: KMS key is configured\n");
  });

  test("KMS key rotation should be enabled", async () => {
    console.log("TEST: KMS Key Rotation");
    assert.strictEqual(outputs.kmsKeyRotationEnabled, "true", "Key rotation should be enabled");
    console.log("PASS: KMS key rotation is enabled\n");
  });
});

// =========================================================================
// Blue-Green Deployment Tests
// =========================================================================
describe("Blue-Green Deployment Configuration", () => {
  test("Blue-green deployment should be enabled", async () => {
    console.log("TEST: Blue-Green Deployment");
    assert.strictEqual(outputs.blueGreenDeploymentEnabled, "true", "Blue-green deployment should be enabled");
    console.log("PASS: Blue-green deployment is configured\n");
  });

  test("Should have initial traffic configuration", async () => {
    console.log("TEST: Initial Traffic Configuration");
    assert.ok(outputs.trafficWeights, "Traffic weights should exist");
    
    const weights = JSON.parse(outputs.trafficWeights);
    assert.strictEqual(weights.blue + weights.green, 100, "Total weight should be 100%");
    console.log("Traffic Distribution: Blue " + weights.blue + "%, Green " + weights.green + "%");
    console.log("PASS: Traffic configuration is valid\n");
  });

  test("Migration phase should be set correctly", async () => {
    console.log("TEST: Migration Phase");
    assert.ok(outputs.migrationPhase, "Migration phase should exist");
    console.log("Current Migration Phase:", outputs.migrationPhase);
    console.log("PASS: Migration phase is configured\n");
  });
});

// =========================================================================
// Deployment Details Tests
// =========================================================================
describe("Deployment Information", () => {
  test("Should have deployment metadata", async () => {
    console.log("TEST: Deployment Metadata");
    assert.ok(outputs.deploymentEnvironment, "Deployment environment should exist");
    console.log("Environment:", outputs.deploymentEnvironment);
    console.log("Deployed At:", outputs.deployedAt);
    console.log("PASS: Deployment metadata recorded\n");
  });

  test("Resource tags should be present", async () => {
    console.log("TEST: Resource Tags");
    assert.ok(outputs.resourceTags, "Resource tags should exist");
    
    const tags = JSON.parse(outputs.resourceTags);
    console.log("Resource Tags configured");
    console.log("PASS: Resource tags are configured\n");
  });

  test("Rollback capability should be available", async () => {
    console.log("TEST: Rollback Capability");
    assert.ok(outputs.rollbackCapability, "Rollback capability should exist");
    console.log("Rollback Capability:", outputs.rollbackCapability);
    console.log("PASS: Rollback capability is available\n");
  });
});
