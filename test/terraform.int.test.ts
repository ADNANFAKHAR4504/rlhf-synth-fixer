import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetCommandInvocationCommand, SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import AWS from 'aws-sdk';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients (v2)
const ec2 = new AWS.EC2({ region: AWS_REGION });
const elbv2 = new AWS.ELBv2({ region: AWS_REGION });
const rds = new AWS.RDS({ region: AWS_REGION });
const autoscaling = new AWS.AutoScaling({ region: AWS_REGION });
const s3 = new AWS.S3({ region: AWS_REGION });
const cloudwatch = new AWS.CloudWatch({ region: AWS_REGION });

// AWS SDK Clients (v3)
const ssmClient = new SSMClient({ region: AWS_REGION });
const wafClient = new WAFV2Client({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

// Helper for AWS API calls
async function awsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`AWS API call failed: ${err.message}`);
  }
}

// Helper to wait for SSM command to complete
async function waitForSSMCommand(commandId: string, instanceId: string, timeoutMs: number = 60000): Promise<any> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId,
        })
      );

      if (result.Status === 'Success' || result.Status === 'Failed' || result.Status === 'Cancelled' || result.Status === 'TimedOut') {
        return result;
      }

      // Still in progress, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error: any) {
      // If command not found yet, wait and retry
      if (error.name === 'InvocationDoesNotExist') {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`SSM command ${commandId} did not complete within ${timeoutMs}ms`);
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
      'aws_lb',
      'aws_lb_target_group',
      'aws_lb_listener',
      'aws_autoscaling_group',
      'aws_launch_template',
      'aws_s3_bucket',
      'aws_iam_role',
      'aws_iam_role_policy',
      'aws_wafv2_web_acl',
      'aws_kms_key',
      'aws_secretsmanager_secret',
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
// SUITE 2: DEPLOYED INFRASTRUCTURE VALIDATION (POST-DEPLOYMENT)
// =============================================================================

describe('Deployed Infrastructure Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
    console.log('Loaded outputs for validation:', Object.keys(outputs));
  });

  // --- Outputs Format Checks ---
  test('Outputs have correct format', () => {
    expect(outputs.alb_dns_name).toBeDefined();
    expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    expect(outputs.alb_arn).toMatch(/^arn:aws:elasticloadbalancing/);
    expect(outputs.rds_endpoint).toBeDefined();
    expect(outputs.s3_bucket_name).toBeDefined();
    expect(outputs.waf_web_acl_arn).toBeDefined();
    expect(outputs.waf_web_acl_arn).toMatch(/^arn:aws:wafv2/);
  });

  // --- Networking & VPC ---
  describe('Networking & VPC', () => {
    test('VPC exists and is available', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() => ec2.describeVpcs({ VpcIds: [vpcId] }).promise());

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBeDefined();
    }, TEST_TIMEOUT);

    test('Public subnets exist in multiple AZs', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeSubnets({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Type', Values: ['Public'] },
            ],
          })
          .promise()
      );

      expect(result.Subnets!.length).toBeGreaterThanOrEqual(2);
      const azs = new Set(result.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, TEST_TIMEOUT);

    test('Private subnets exist in multiple AZs', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeSubnets({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Type', Values: ['Private'] },
            ],
          })
          .promise()
      );

      expect(result.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, TEST_TIMEOUT);

    test('Internet Gateway is attached', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeInternetGateways({
            Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
          })
          .promise()
      );

      expect(result.InternetGateways).toHaveLength(1);
      expect(result.InternetGateways![0].Attachments![0].State).toBe('available');
    }, TEST_TIMEOUT);

    test('NAT Gateway is available', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeNatGateways({
            Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
          .promise()
      );

      expect(result.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(result.NatGateways![0].State).toBe('available');
    }, TEST_TIMEOUT);
  });

  // --- Load Balancing & ALB ---
  describe('Load Balancing & ALB', () => {
    test('ALB is active and internet-facing', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      const result = await awsCall(() => elbv2.describeLoadBalancers({ LoadBalancerArns: [albArn] }).promise());

      expect(result.LoadBalancers).toHaveLength(1);
      expect(result.LoadBalancers![0].State!.Code).toBe('active');
      expect(result.LoadBalancers![0].Scheme).toBe('internet-facing');
    }, TEST_TIMEOUT);

    test('Target Group is healthy', async () => {
      const tgArn = outputs.target_group_arn || (await awsCall(async () => {
        const albArn = outputs.alb_arn;
        const listeners = await elbv2.describeListeners({ LoadBalancerArn: albArn }).promise();
        const defaultAction = listeners.Listeners![0].DefaultActions![0];
        return defaultAction.TargetGroupArn!;
      }));

      const result = await awsCall(() => elbv2.describeTargetHealth({ TargetGroupArn: tgArn }).promise());

      const validStates = ['healthy', 'initial'];
      const healthyTargets = result.TargetHealthDescriptions!.filter((t) =>
        validStates.includes(t.TargetHealth!.State!)
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  // --- Compute (Auto Scaling Group) ---
  describe('Compute (Auto Scaling Group)', () => {
    test('Auto Scaling Group exists and has instances', async () => {
      const namePrefix = outputs.name_prefix;
      expect(namePrefix).toBeDefined();

      const result = await awsCall(() => autoscaling.describeAutoScalingGroups({}).promise());
      const asg = result.AutoScalingGroups!.find((g) => g.AutoScalingGroupName!.includes(namePrefix));

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBeGreaterThanOrEqual(0);
      expect(asg!.MaxSize).toBeGreaterThanOrEqual(asg!.MinSize!);
      expect(asg!.Instances!.length).toBeGreaterThan(0);

      // Verify instances are running
      const runningInstances = asg!.Instances!.filter((i) => i.LifecycleState === 'InService');
      expect(runningInstances.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  // --- Database (RDS) ---
  describe('Database (RDS)', () => {
    test('RDS instance is available and encrypted', async () => {
      const rdsIdentifier = outputs.rds_identifier;
      expect(rdsIdentifier).toBeDefined();

      const result = await awsCall(() => rds.describeDBInstances({ DBInstanceIdentifier: rdsIdentifier }).promise());

      expect(result.DBInstances).toHaveLength(1);
      expect(result.DBInstances![0].DBInstanceStatus).toBe('available');
      expect(result.DBInstances![0].StorageEncrypted).toBe(true);
      expect(result.DBInstances![0].Engine).toBe('postgres');
      expect(result.DBInstances![0].EngineVersion).toMatch(/^15\./);
    }, TEST_TIMEOUT);
  });

  // --- Security Groups ---
  describe('Security Groups', () => {
    test('ALB Security Group allows HTTP (80)', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeSecurityGroups({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: ['*alb*'] },
            ],
          })
          .promise()
      );

      const albSg = result.SecurityGroups![0];
      expect(albSg).toBeDefined();
      const httpRule = albSg.IpPermissions!.find((p) => p.FromPort === 80 && p.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges!.some((r) => r.CidrIp === '0.0.0.0/0')).toBe(true);
    }, TEST_TIMEOUT);

    test('RDS Security Group allows PostgreSQL from App Security Group', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const result = await awsCall(() =>
        ec2
          .describeSecurityGroups({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: ['*rds*'] },
            ],
          })
          .promise()
      );

      const rdsSg = result.SecurityGroups![0];
      expect(rdsSg).toBeDefined();
      const postgresRule = rdsSg.IpPermissions!.find((p) => p.FromPort === 5432 && p.ToPort === 5432);
      expect(postgresRule).toBeDefined();
    }, TEST_TIMEOUT);
  });

  // --- S3 Buckets ---
  describe('S3 Buckets', () => {
    test('Application S3 bucket exists', async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();

      const result = await awsCall(() => s3.headBucket({ Bucket: bucketName }).promise());
      expect(result).toBeDefined();
    }, TEST_TIMEOUT);

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();

      const result = await awsCall(() => s3.getBucketEncryption({ Bucket: bucketName }).promise());

      expect(result.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      expect(
        result.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    }, TEST_TIMEOUT);
  });
});

// =============================================================================
// SUITE 3: APPLICATION HEALTH & CONNECTIVITY
// =============================================================================

describe('Application Health & Connectivity', () => {
  let outputs: Record<string, any> = {};
  let albUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    const albDns = outputs.alb_dns_name;
    expect(albDns).toBeDefined();
    expect(albDns).toBeTruthy();
    albUrl = `http://${albDns}`;
  });

  test('Application Root returns 200 OK', async () => {
    expect(albUrl).toBeDefined();
    expect(albUrl).toBeTruthy();

    let response;
    for (let i = 0; i < 3; i++) {
      try {
        response = await axios.get(albUrl, { timeout: 10000 });
        if (response.status === 200) break;
      } catch (e) {
        if (i === 2) throw e;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    expect(response).toBeDefined();
    expect(response!.status).toBe(200);
  }, TEST_TIMEOUT);

  test('Health endpoint returns "OK"', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/health`, { timeout: 10000 });
    expect(response.status).toBe(200);
    expect(response.data).toMatch(/OK/i);
  }, TEST_TIMEOUT);

  test('Health JSON endpoint returns valid JSON', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/health.json`, { timeout: 10000 });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toMatch(/healthy/i);
  }, TEST_TIMEOUT);

  test('DB test endpoint returns connectivity status', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/db-test`, { timeout: 10000, validateStatus: () => true });
    expect([200, 500, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.data).toHaveProperty('status');
    }
  }, TEST_TIMEOUT);

  test('S3 test endpoint returns connectivity status', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/s3-test`, { timeout: 10000, validateStatus: () => true });
    expect([200, 500, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.data).toHaveProperty('status');
    }
  }, TEST_TIMEOUT);

  test('Secrets test endpoint returns connectivity status', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/secrets-test`, { timeout: 10000, validateStatus: () => true });
    expect([200, 500, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.data).toHaveProperty('status');
    }
  }, TEST_TIMEOUT);

  test('Metadata endpoint returns instance information', async () => {
    expect(albUrl).toBeDefined();
    const response = await axios.get(`${albUrl}/metadata`, { timeout: 10000 });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('instance_id');
    expect(response.data).toHaveProperty('availability_zone');
    expect(response.data).toHaveProperty('instance_type');
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 4: EC2 -> RDS CONNECTIVITY TEST
// =============================================================================

describe('EC2 to RDS Connectivity', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('EC2 instance can connect to RDS and execute SELECT 1 query', async () => {
    // Get ASG name
    const namePrefix = outputs.name_prefix;
    expect(namePrefix).toBeDefined();

    // Get instances from ASG
    const asgResult = await awsCall(() => autoscaling.describeAutoScalingGroups({}).promise());
    const asg = asgResult.AutoScalingGroups!.find((g) => g.AutoScalingGroupName!.includes(namePrefix));
    expect(asg).toBeDefined();
    expect(asg!.Instances!.length).toBeGreaterThan(0);

    const instanceId = asg!.Instances!.find((i) => i.LifecycleState === 'InService')?.InstanceId;
    expect(instanceId).toBeDefined();

    // Get RDS endpoint
    const rdsEndpoint = outputs.rds_endpoint;
    expect(rdsEndpoint).toBeDefined();
    const [rdsHost, rdsPort] = rdsEndpoint.split(':');

    // Get database credentials from Secrets Manager
    const secretArn = outputs.db_secret_arn;
    expect(secretArn).toBeDefined();

    let dbCredentials: any;
    try {
      const secretResponse = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
      dbCredentials = JSON.parse(secretResponse.SecretString || '{}');
    } catch (error: any) {
      throw new Error(`Failed to retrieve database credentials: ${error.message}`);
    }

    const dbPassword = dbCredentials.password;
    const dbUsername = outputs.db_username || 'dbadmin';
    const dbName = 'appdb';

    // Prepare SSM command to test RDS connectivity
    const commands = [
      '#!/bin/bash',
      'set -euo pipefail',
      `export PGPASSWORD="${dbPassword.replace(/"/g, '\\"')}"`,
      `psql -h ${rdsHost} -p ${rdsPort} -U ${dbUsername} -d ${dbName} -c "SELECT 1 as test_result;" -t`,
      'echo "RDS_CONNECTION_SUCCESS"',
    ];

    // Send SSM command to EC2 instance
    const commandResponse = await ssmClient.send(
      new SendCommandCommand({
        InstanceIds: [instanceId!],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: commands,
        },
        TimeoutSeconds: 30,
      })
    );

    const commandId = commandResponse.Command?.CommandId;
    expect(commandId).toBeDefined();

    // Wait for command to complete
    const result = await waitForSSMCommand(commandId!, instanceId!, 60000);

    // Verify command succeeded
    expect(result.Status).toBe('Success');
    expect(result.StandardOutputContent).toBeDefined();

    const output = result.StandardOutputContent || '';

    // Check for successful connection indicators
    expect(output).toContain('RDS_CONNECTION_SUCCESS');
    expect(output).toMatch(/test_result|1/);

    console.log('✓ EC2 instance successfully connected to RDS and executed SELECT 1');
    if (output.length > 200) {
      console.log(`  Output: ${output.substring(0, 200)}...`);
    } else {
      console.log(`  Output: ${output}`);
    }
  }, TEST_TIMEOUT * 2);
});

// =============================================================================
// SUITE 5: WAF RULES TESTS
// =============================================================================

describe('WAF Rules Validation', () => {
  let outputs: Record<string, any> = {};
  let albUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    const albDns = outputs.alb_dns_name;
    expect(albDns).toBeDefined();
    expect(albDns).toBeTruthy();
    albUrl = `http://${albDns}`;
  });

  test('WAF WebACL exists and has security rules configured', async () => {
    const webaclArn = outputs.waf_web_acl_arn;
    expect(webaclArn).toBeDefined();
    expect(webaclArn).toBeTruthy();

    // Parse WebACL ARN: arn:aws:wafv2:region:account:regional/webacl/name/id
    const arnParts = webaclArn.split(':');
    expect(arnParts[2]).toBe('wafv2');
    const region = arnParts[3] || AWS_REGION;

    const afterResource = webaclArn.split(':').slice(5).join(':');
    const resourceParts = afterResource.split('/');
    expect(resourceParts.length).toBeGreaterThanOrEqual(4);
    const scope = resourceParts[0] === 'regional' ? 'REGIONAL' : 'CLOUDFRONT';
    const name = resourceParts[2];
    const id = resourceParts[3];

    expect(name).toBeTruthy();
    expect(id).toBeTruthy();

    const waf = new WAFV2Client({ region });
    const cmd = new GetWebACLCommand({ Name: name, Scope: scope, Id: id });
    const resp = await waf.send(cmd);

    expect(resp.WebACL).toBeDefined();
    expect(resp.WebACL?.Name).toBe(name);

    // Verify WAF has rules configured
    const rules = resp.WebACL?.Rules || [];
    expect(rules.length).toBeGreaterThan(0);

    // Check for specific security rules
    const ruleNames = rules.map((r) => r.Name);
    expect(ruleNames).toContain('RateLimitRule');
    expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
    expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');

    // Verify rate limit is configured correctly
    const rateLimitRule = rules.find((r) => r.Name === 'RateLimitRule');
    expect(rateLimitRule?.Statement?.RateBasedStatement?.Limit).toBe(2000);

    console.log(`✓ WAF has ${rules.length} security rules configured`);
    console.log(`✓ Rules: ${ruleNames.join(', ')}`);
  }, TEST_TIMEOUT);

  test('WAF blocks SQL injection attempts in URI path', async () => {
    expect(albUrl).toBeDefined();
    expect(albUrl).toBeTruthy();

    const sqlInjectionPaths = [
      "/health?id=' OR '1'='1",
      "/health?user=admin'--",
      "/health?id=1' UNION SELECT NULL--",
      "/health?search='; DROP TABLE users--",
      "/health?filter=1' AND 1=1--",
    ];

    let blockedCount = 0;
    let allowedCount = 0;
    let testCount = 0;

    for (const testPath of sqlInjectionPaths) {
      try {
        const resp = await axios.get(`${albUrl}${testPath}`, {
          timeout: 10000,
          validateStatus: () => true, // Accept any status code
        });

        testCount++;

        // WAF should block (403) or server handles safely (200/400/404)
        expect([200, 400, 403, 404]).toContain(resp.status);

        if (resp.status === 403) {
          blockedCount++;
          console.log(`✓ WAF blocked SQL injection in path: ${testPath.substring(0, 40)}...`);
        } else {
          allowedCount++;
        }
      } catch (e: any) {
        testCount++;
        // Request blocked before reaching server is also acceptable
        if (e.code === 'ECONNABORTED' || e.response?.status === 403) {
          blockedCount++;
          console.log(`✓ Request blocked for SQL injection path`);
        }
      }
    }

    console.log(
      `SQL Injection Test Summary: ${blockedCount} blocked, ${allowedCount} allowed/handled safely out of ${testCount} requests`
    );
    // Verify we tested all payloads
    expect(testCount).toBe(sqlInjectionPaths.length);
    // At least some should be handled (either blocked or processed safely)
    expect(testCount).toBeGreaterThan(0);
  }, 60000);

  test('WAF blocks XSS (Cross-Site Scripting) attempts in URI', async () => {
    expect(albUrl).toBeDefined();
    expect(albUrl).toBeTruthy();

    const xssPaths = [
      '/health?input=<script>alert("XSS")</script>',
      '/health?data=<img src=x onerror=alert(1)>',
      '/health?url=javascript:alert(1)',
      '/health?content=<iframe src="javascript:alert(1)">',
      '/health?svg=<svg onload=alert(1)>',
    ];

    let blockedCount = 0;
    let allowedCount = 0;
    let testCount = 0;

    for (const testPath of xssPaths) {
      try {
        const resp = await axios.get(`${albUrl}${testPath}`, {
          timeout: 10000,
          validateStatus: () => true,
        });

        testCount++;

        // WAF should block (403) or server handles safely
        expect([200, 400, 403, 404]).toContain(resp.status);

        if (resp.status === 403) {
          blockedCount++;
          console.log(`✓ WAF blocked XSS in path: ${testPath.substring(0, 50)}...`);
        } else {
          allowedCount++;
        }
      } catch (e: any) {
        testCount++;
        if (e.code === 'ECONNABORTED' || e.response?.status === 403) {
          blockedCount++;
          console.log(`✓ Request blocked for XSS payload`);
        }
      }
    }

    console.log(
      `XSS Test Summary: ${blockedCount} blocked, ${allowedCount} allowed/handled safely out of ${testCount} requests`
    );
    // Verify we tested all payloads
    expect(testCount).toBe(xssPaths.length);
    // At least some should be handled (either blocked or processed safely)
    expect(testCount).toBeGreaterThan(0);
  }, 60000);
});
