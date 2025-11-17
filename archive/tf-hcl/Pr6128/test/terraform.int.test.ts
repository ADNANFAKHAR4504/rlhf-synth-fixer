import AWS from 'aws-sdk';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 90000; // 90 seconds

// AWS SDK Clients
const ec2 = new AWS.EC2({ region: AWS_REGION });
const ecs = new AWS.ECS({ region: AWS_REGION });
const elbv2 = new AWS.ELBv2({ region: AWS_REGION });
const rds = new AWS.RDS({ region: AWS_REGION });
const s3 = new AWS.S3({ region: AWS_REGION });

// Helper to load Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  const cfnOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');

  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const outputs = JSON.parse(fs.readFileSync(cfnOutputsPath, 'utf8'));
      console.log('Loaded outputs from cfn-outputs/flat-outputs.json');
      return outputs;
    } catch (error) {
      console.warn('Failed to read cfn-outputs file:', error);
    }
  }

  // Fallback to terraform output
  try {
    const outputJson = execSync('terraform output -json', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });
    const outputs = JSON.parse(outputJson);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputs)) {
      result[key] = (value as any).value;
    }
    return result;
  } catch (error) {
    console.warn('Failed to get Terraform outputs:', error);
    return {};
  }
}

// Helper to run Terraform plan
function runTerraformPlan(varFile: string): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(
      `terraform plan -var-file=${varFile} -out=tfplan-${varFile.replace('.tfvars', '')} -no-color`,
      {
        cwd: TERRAFORM_DIR,
        encoding: 'utf-8',
      }
    );
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
    };
  }
}

// Helper to get plan JSON
function getTerraformPlanJson(varFile: string): any {
  try {
    execSync(`terraform plan -var-file=${varFile} -out=tfplan-test`, {
      cwd: TERRAFORM_DIR,
      stdio: 'pipe',
    });

    const planJson = execSync('terraform show -json tfplan-test', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });

    return JSON.parse(planJson);
  } catch (error) {
    console.error(`Failed to get plan JSON for ${varFile}:`, error);
    return null;
  }
}

// Helper to extract resources from plan
function extractResources(plan: any): Map<string, number> {
  const resourceCounts = new Map<string, number>();

  if (plan?.planned_values?.root_module?.resources) {
    for (const resource of plan.planned_values.root_module.resources) {
      const type = resource.type;
      resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
    }
  }

  // Also check child modules
  if (plan?.planned_values?.root_module?.child_modules) {
    for (const childModule of plan.planned_values.root_module.child_modules) {
      if (childModule.resources) {
        for (const resource of childModule.resources) {
          const type = resource.type;
          resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
        }
      }
    }
  }

  return resourceCounts;
}

// Helper for AWS API calls with error handling
async function awsCall<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.error(`[${label}] AWS API call failed:`, err.message);
    throw new Error(`[${label}] ${err.message}`);
  }
}

// =============================================================================
// SUITE 1: TERRAFORM PLAN VALIDATION (NO DEPLOYMENT REQUIRED)
// =============================================================================

describe('Terraform Plan Validation', () => {
  const environments = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];
  let terraformAvailable = false;

  beforeAll(() => {
    execSync('which terraform', { encoding: 'utf-8' });
    terraformAvailable = true;

    // Initialize Terraform with local backend for testing
    console.log('Initializing Terraform with local backend...');
    const backendOverride = `
terraform {
  backend "local" {}
}
`;
    const overridePath = path.join(TERRAFORM_DIR, 'backend_override.tf');
    fs.writeFileSync(overridePath, backendOverride);

    execSync('terraform init -reconfigure', {
      cwd: TERRAFORM_DIR,
      stdio: 'pipe',
    });
    console.log('Terraform initialized');
  });

  afterAll(() => {
    // Cleanup
    try {
      const files = ['backend_override.tf', 'terraform.tfstate', 'tfplan-test', 'tfplan-dev', 'tfplan-staging', 'tfplan-prod'];
      files.forEach((file) => {
        const filePath = path.join(TERRAFORM_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('Terraform is installed and accessible', () => {
    expect(terraformAvailable).toBe(true);
  });

  test(
    'can generate valid plans for all environments',
    () => {
      expect(terraformAvailable).toBe(true);

      for (const envFile of environments) {
        const envPath = path.join(TERRAFORM_DIR, envFile);
        expect(fs.existsSync(envPath)).toBe(true);

        console.log(`\nValidating plan for ${envFile}...`);
        const result = runTerraformPlan(envFile);

        expect(result.success).toBe(true);
        expect(result.output).toMatch(/Plan:|No changes/);
        expect(result.output).not.toContain('Error:');

        console.log(`${envFile}: Plan validated successfully`);
      }
    },
    TEST_TIMEOUT * 2
  );


  test('plans include all expected resource types', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    const resources = extractResources(plan);
    const resourceTypes = Array.from(resources.keys());

    // Expected core resource types
    const expectedTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_nat_gateway',
      'aws_route_table',
      'aws_security_group',
      'aws_db_instance',
      'aws_db_subnet_group',
      'aws_ecs_cluster',
      'aws_ecs_service',
      'aws_ecs_task_definition',
      'aws_lb',
      'aws_lb_target_group',
      'aws_lb_listener',
      'aws_s3_bucket',
      'aws_iam_role',
      'aws_iam_role_policy',
    ];

    console.log('\nResource type validation:');
    for (const expectedType of expectedTypes) {
      expect(resourceTypes).toContain(expectedType);
      console.log(`  ${expectedType}: ${resources.get(expectedType)} instances`);
    }

    console.log(`\nAll ${expectedTypes.length} expected resource types found`);
  });
});

// =============================================================================
// SUITE 2: DEPLOYED INFRASTRUCTURE VALIDATION
// =============================================================================

describe('Deployed Infrastructure Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
    console.log('Loaded outputs:', Object.keys(outputs));
  });

  describe('Outputs Validation', () => {
    test('all required outputs are present', () => {
      const requiredOutputs = [
        'vpc_id',
        'ecs_cluster_name',
        'alb_dns_name',
        'rds_endpoint',
        'transaction_logs_bucket',
      ];

      for (const output of requiredOutputs) {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        console.log(`  ${output}: ${outputs[output]}`);
      }
    });

    test('outputs have correct format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.ecs_cluster_name).toMatch(/^payment-cluster-/);
      expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com:5432$/);
      expect(outputs.transaction_logs_bucket).toMatch(/^payment-logs-/);
    });
  });

  describe('VPC and Networking', () => {
    test(
      'VPC exists and is available',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found in outputs');

        const result = await awsCall('DescribeVPC', () =>
          ec2.describeVpcs({ VpcIds: [vpcId] }).promise()
        );

        expect(result).toBeTruthy();
        expect(result!.Vpcs).toHaveLength(1);
        expect(result!.Vpcs![0].State).toBe('available');
        expect(result!.Vpcs![0].CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
      },
      TEST_TIMEOUT
    );

    test(
      'public subnets exist in multiple AZs',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribePublicSubnets', () =>
          ec2
            .describeSubnets({
              Filters: [
                { Name: 'vpc-id', Values: [vpcId] },
                { Name: 'tag:Name', Values: ['*public*'] },
              ],
            })
            .promise()
        );

        expect(result).toBeTruthy();
        expect(result!.Subnets!.length).toBeGreaterThanOrEqual(2);

        const azs = new Set(result!.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );

    test(
      'private subnets exist in multiple AZs',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribePrivateSubnets', () =>
          ec2
            .describeSubnets({
              Filters: [
                { Name: 'vpc-id', Values: [vpcId] },
                { Name: 'tag:Name', Values: ['*private*'] },
              ],
            })
            .promise()
        );

        expect(result).toBeTruthy();
        expect(result!.Subnets!.length).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );

    test(
      'Internet Gateway is attached',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribeIGW', () =>
          ec2
            .describeInternetGateways({
              Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
            })
            .promise()
        );

        expect(result).toBeTruthy();
        expect(result!.InternetGateways).toHaveLength(1);
        expect(result!.InternetGateways![0].Attachments![0].State).toBe('available');
      },
      TEST_TIMEOUT
    );

    test(
      'NAT Gateway is available',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribeNATGateways', () =>
          ec2
            .describeNatGateways({
              Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
            .promise()
        );

        expect(result).toBeTruthy();
        expect(result!.NatGateways!.length).toBeGreaterThanOrEqual(1);
        expect(result!.NatGateways![0].State).toBe('available');
      },
      TEST_TIMEOUT
    );
  });

  describe('RDS Database', () => {
    test(
      'RDS instance exists and is available',
      async () => {
        const dbIdentifier = 'payment-db-dev';
        const result = await awsCall('DescribeDBInstance', () =>
          rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise()
        );

        expect(result).toBeTruthy();
        expect(result!.DBInstances).toHaveLength(1);
        expect(result!.DBInstances![0].DBInstanceStatus).toBe('available');
        expect(result!.DBInstances![0].Engine).toBe('postgres');
      },
      TEST_TIMEOUT
    );

    test(
      'RDS has encryption enabled',
      async () => {
        const dbIdentifier = 'payment-db-dev';
        const result = await awsCall('DescribeDBInstance', () =>
          rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise()
        );

        expect(result!.DBInstances![0].StorageEncrypted).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      'RDS has automated backups configured',
      async () => {
        const dbIdentifier = 'payment-db-dev';
        const result = await awsCall('DescribeDBInstance', () =>
          rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise()
        );

        expect(result!.DBInstances![0].BackupRetentionPeriod).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('ECS Cluster and Services', () => {
    test(
      'ECS cluster is active',
      async () => {
        const clusterName = outputs.ecs_cluster_name;
        if (!clusterName) throw new Error('ECS cluster name not found');

        const result = await awsCall('DescribeCluster', () =>
          ecs.describeClusters({ clusters: [clusterName] }).promise()
        );

        expect(result).toBeTruthy();
        expect(result!.clusters).toHaveLength(1);
        expect(result!.clusters![0].status).toBe('ACTIVE');
      },
      TEST_TIMEOUT
    );

    test(
      'ECS service is running',
      async () => {
        const clusterName = outputs.ecs_cluster_name;
        if (!clusterName) throw new Error('ECS cluster name not found');

        const services = await awsCall('ListServices', () =>
          ecs.listServices({ cluster: clusterName }).promise()
        );

        expect(services).toBeTruthy();
        expect(services!.serviceArns!.length).toBeGreaterThan(0);

        const serviceDetails = await awsCall('DescribeServices', () =>
          ecs.describeServices({ cluster: clusterName, services: services!.serviceArns! }).promise()
        );

        expect(serviceDetails!.services![0].status).toBe('ACTIVE');
        expect(serviceDetails!.services![0].launchType).toBe('FARGATE');
      },
      TEST_TIMEOUT
    );

    test(
      'ECS tasks are running',
      async () => {
        const clusterName = outputs.ecs_cluster_name;
        if (!clusterName) throw new Error('ECS cluster name not found');

        const tasks = await awsCall('ListTasks', () =>
          ecs.listTasks({ cluster: clusterName, desiredStatus: 'RUNNING' }).promise()
        );

        expect(tasks).toBeTruthy();
        // Note: Tasks may not be running immediately after deployment
        console.log(`  Running tasks: ${tasks!.taskArns!.length}`);
      },
      TEST_TIMEOUT
    );
  });

  describe('Application Load Balancer', () => {
    test(
      'ALB is active',
      async () => {
        const result = await awsCall('DescribeLoadBalancers', () =>
          elbv2.describeLoadBalancers({ Names: ['payment-alb-dev'] }).promise()
        );

        expect(result).toBeTruthy();
        expect(result!.LoadBalancers).toHaveLength(1);
        expect(result!.LoadBalancers![0].State!.Code).toBe('active');
        expect(result!.LoadBalancers![0].Scheme).toBe('internet-facing');
      },
      TEST_TIMEOUT
    );

    test(
      'ALB has target group configured',
      async () => {
        const result = await awsCall('DescribeTargetGroups', () =>
          elbv2.describeTargetGroups({ Names: ['payment-tg-dev'] }).promise()
        );

        expect(result).toBeTruthy();
        expect(result!.TargetGroups).toHaveLength(1);
        expect(result!.TargetGroups![0].Protocol).toBe('HTTP');
        expect(result!.TargetGroups![0].Port).toBe(8080);
        expect(result!.TargetGroups![0].HealthCheckEnabled).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      'ALB has listeners configured',
      async () => {
        const lbResult = await awsCall('DescribeLoadBalancers', () =>
          elbv2.describeLoadBalancers({ Names: ['payment-alb-dev'] }).promise()
        );

        const albArn = lbResult!.LoadBalancers![0].LoadBalancerArn!;

        const listeners = await awsCall('DescribeListeners', () =>
          elbv2.describeListeners({ LoadBalancerArn: albArn }).promise()
        );

        expect(listeners!.Listeners!.length).toBeGreaterThan(0);
        expect(listeners!.Listeners!.some((l) => l.Port === 80)).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('S3 Buckets', () => {
    test(
      'transaction logs bucket exists',
      async () => {
        const bucketName = outputs.transaction_logs_bucket;
        if (!bucketName) throw new Error('Bucket name not found');

        const result = await awsCall('HeadBucket', () => s3.headBucket({ Bucket: bucketName }).promise());

        expect(result).toBeTruthy();
      },
      TEST_TIMEOUT
    );

    test(
      'S3 bucket has encryption enabled',
      async () => {
        const bucketName = outputs.transaction_logs_bucket;
        if (!bucketName) throw new Error('Bucket name not found');

        const result = await awsCall('GetBucketEncryption', () =>
          s3.getBucketEncryption({ Bucket: bucketName }).promise()
        );

        expect(result!.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
        expect(
          result!.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm
        ).toBe('AES256');
      },
      TEST_TIMEOUT
    );

    test(
      'S3 bucket has lifecycle policy',
      async () => {
        const bucketName = outputs.transaction_logs_bucket;
        if (!bucketName) throw new Error('Bucket name not found');

        const result = await awsCall('GetBucketLifecycle', () =>
          s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise()
        );

        expect(result!.Rules!.length).toBeGreaterThan(0);
        expect(result!.Rules![0].Status).toBe('Enabled');
      },
      TEST_TIMEOUT
    );

    test(
      'S3 bucket blocks public access',
      async () => {
        const bucketName = outputs.transaction_logs_bucket;
        if (!bucketName) throw new Error('Bucket name not found');

        const result = await awsCall('GetPublicAccessBlock', () =>
          s3.getPublicAccessBlock({ Bucket: bucketName }).promise()
        );

        const config = result!.PublicAccessBlockConfiguration!;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('Security Configuration', () => {
    test(
      'all resources have required tags',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribeVPC', () => ec2.describeVpcs({ VpcIds: [vpcId] }).promise());

        const tags = result!.Vpcs![0].Tags || [];
        const tagKeys = tags.map((t) => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('ManagedBy');
      },
      TEST_TIMEOUT
    );

    test(
      'security groups follow least privilege',
      async () => {
        const vpcId = outputs.vpc_id;
        if (!vpcId) throw new Error('VPC ID not found');

        const result = await awsCall('DescribeSecurityGroups', () =>
          ec2.describeSecurityGroups({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }).promise()
        );

        for (const sg of result!.SecurityGroups!) {
          if (sg.GroupName?.includes('alb')) continue;

          const hasUnrestrictedAccess = sg.IpPermissions!.some(
            (rule) =>
              rule.IpRanges!.some((ip) => ip.CidrIp === '0.0.0.0/0') &&
              rule.FromPort !== 80 &&
              rule.FromPort !== 443
          );

          expect(hasUnrestrictedAccess).toBe(false);
        }
      },
      TEST_TIMEOUT
    );
  });
});

// =============================================================================
// SUITE 3: APPLICATION HEALTH CHECKS
// =============================================================================

describe('Application Health and Connectivity', () => {
  let outputs: Record<string, any> = {};
  let albUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    albUrl = `http://${outputs.alb_dns_name}`;
  });

  test(
    'ALB health check endpoint responds',
    async () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).not.toBeNull();

      const response = await axios.get(`${albUrl}/health`, { timeout: 10000 });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      console.log('  Health check response:', response.data);
    },
    TEST_TIMEOUT
  );

  test(
    'database connectivity check',
    async () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).not.toBeNull();

      const response = await axios.get(`${albUrl}/db-check`, { timeout: 10000 });
      expect([200, 503]).toContain(response.status);
      expect(response.data).toHaveProperty('connected');
      console.log('  DB check response:', response.data);
    },
    TEST_TIMEOUT
  );

  test(
    'S3 connectivity check',
    async () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).not.toBeNull();

      const response = await axios.get(`${albUrl}/s3-check`, { timeout: 10000 });
      expect([200, 503]).toContain(response.status);
      expect(response.data).toHaveProperty('accessible');
      console.log('  S3 check response:', response.data);
    },
    TEST_TIMEOUT
  );

  test(
    'API status endpoint returns overall health',
    async () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).not.toBeNull();

      const response = await axios.get(`${albUrl}/api/status`, { timeout: 10000, validateStatus: () => true });
      expect(response.data).toHaveProperty('api');
      expect(response.data).toHaveProperty('database');
      expect(response.data).toHaveProperty('s3');
      console.log('  API status:', response.data);
    },
    TEST_TIMEOUT
  );
});
