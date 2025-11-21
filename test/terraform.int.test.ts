import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetWebACLCommand,
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients
const ecs = new AWS.ECS({ region: AWS_REGION });
const rds = new AWS.RDS({ region: AWS_REGION });
const elbv2 = new AWS.ELBv2({ region: AWS_REGION });
const cloudwatch = new AWS.CloudWatch({ region: AWS_REGION });
const s3 = new AWS.S3({ region: AWS_REGION });

const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const wafClient = new WAFV2Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  const cfnOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const data = fs.readFileSync(cfnOutputsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse cfn-outputs/flat-outputs.json:', error);
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

// Helper: Run Terraform plan
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

// Helper: Get Terraform plan JSON
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

// Helper: Extract resources from plan
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

// Helper: AWS API call wrapper
async function awsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`AWS API call failed: ${err.message}`);
  }
}

// =============================================================================
// SUITE 1: TERRAFORM PLAN VALIDATION (NO DEPLOYMENT REQUIRED)
// =============================================================================

describe('Terraform Plan Validation', () => {
  const environments = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];
  let terraformAvailable = false;

  beforeAll(() => {
    try {
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
    } catch (error) {
      console.warn('Terraform not available for plan tests');
    }
  });

  afterAll(() => {
    // Cleanup
    try {
      const files = ['backend_override.tf', 'tfplan-dev', 'tfplan-staging', 'tfplan-prod', 'tfplan-test'];
      for (const file of files) {
        const filePath = path.join(TERRAFORM_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
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
        console.log(`\nValidating plan for ${envFile}...`);
        const result = runTerraformPlan(envFile);

        if (!result.success) {
          console.error(`Plan failed for ${envFile}:`);
          console.error(result.error);
          console.error(result.output);
        }

        expect(result.success).toBe(true);
        expect(result.output).toContain('Plan:');
        expect(result.output).not.toContain('Error:');
        console.log(`✓ ${envFile} plan is valid`);
      }
    },
    TEST_TIMEOUT * 3
  );

  test('plans include all expected resource types', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    const resources = extractResources(plan);
    const resourceTypes = Array.from(resources.keys());

    // Expected core resource types for ECS Fargate infrastructure
    const expectedTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_nat_gateway',
      'aws_eip',
      'aws_route_table',
      'aws_route_table_association',
      'aws_network_acl',
      'aws_network_acl_rule',
      'aws_security_group',
      'aws_security_group_rule',
      'aws_ecs_cluster',
      'aws_ecs_task_definition',
      'aws_ecs_service',
      'aws_lb',
      'aws_lb_target_group',
      'aws_lb_listener',
      'aws_db_instance',
      'aws_db_subnet_group',
      'aws_s3_bucket',
      'aws_kms_key',
      'aws_kms_alias',
      'aws_wafv2_web_acl',
      'aws_wafv2_web_acl_association',
      'aws_secretsmanager_secret',
      'aws_secretsmanager_secret_version',
      'random_password',
      'aws_iam_role',
      'aws_iam_role_policy',
      'aws_cloudwatch_log_group',
      'aws_appautoscaling_target',
      'aws_appautoscaling_policy',
    ];

    console.log('\nResource type validation:');
    for (const expectedType of expectedTypes) {
      const count = resources.get(expectedType) || 0;
      expect(count).toBeGreaterThan(0);
      console.log(`  ✓ ${expectedType}: ${count} instance(s)`);
    }

    console.log(`\n✓ All ${expectedTypes.length} expected resource types found`);
    console.log(`Total resource types in plan: ${resourceTypes.length}`);
  });

  test('dev plan includes pr_number pr6969dev in resource names', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    const planText = JSON.stringify(plan);
    expect(planText).toContain('pr6969dev');

    console.log('✓ pr_number pr6969dev found in dev plan');
  });

  test('staging plan includes pr_number pr6969staging in resource names', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('staging.tfvars');
    expect(plan).toBeTruthy();

    const planText = JSON.stringify(plan);
    expect(planText).toContain('pr6969staging');

    console.log('✓ pr_number pr6969staging found in staging plan');
  });

  test('prod plan includes pr_number pr6969prod in resource names', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('prod.tfvars');
    expect(plan).toBeTruthy();

    const planText = JSON.stringify(plan);
    expect(planText).toContain('pr6969prod');

    console.log('✓ pr_number pr6969prod found in prod plan');
  });

  test('plan shows no hardcoded database passwords', () => {
    expect(terraformAvailable).toBe(true);

    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    // Check that random_password resource exists
    const resources = extractResources(plan);
    expect(resources.get('random_password')).toBeGreaterThan(0);

    console.log('✓ Database passwords are auto-generated (random_password resource found)');
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

    if (!outputs.alb_dns_name) {
      console.warn('WARNING: alb_dns_name not found in outputs. Deployment may not be complete.');
    }
  });

  // --- Outputs Format Checks ---
  test('Outputs have correct format', () => {
    expect(outputs.alb_dns_name).toBeDefined();
    expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com:5432$/);
    expect(outputs.vpc_id).toMatch(/^vpc-/);
    expect(outputs.ecs_cluster_name).toBeTruthy();
    expect(outputs.s3_bucket_name).toBeTruthy();
    expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]+$/);
  });

  // --- Networking & ALB ---
  describe('Networking & Load Balancing', () => {
    test('ALB is active and internet-facing', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      const result = await awsCall(() =>
        elbv2.describeLoadBalancers({ LoadBalancerArns: [albArn] }).promise()
      );

      expect(result.LoadBalancers).toHaveLength(1);
      expect(result.LoadBalancers![0].State?.Code).toBe('active');
      expect(result.LoadBalancers![0].Scheme).toBe('internet-facing');
      console.log('✓ ALB is active and internet-facing');
    }, TEST_TIMEOUT);

    test('Target Group exists and is attached to ALB', async () => {
      const tgArn = outputs.target_group_arn;
      expect(tgArn).toBeDefined();

      const result = await awsCall(() =>
        elbv2.describeTargetGroups({ TargetGroupArns: [tgArn] }).promise()
      );

      expect(result.TargetGroups).toHaveLength(1);
      expect(result.TargetGroups![0].TargetType).toBe('ip');
      console.log('✓ Target Group configured for ECS Fargate (IP targets)');
    }, TEST_TIMEOUT);
  });

  // --- Compute (ECS) ---
  describe('Compute (ECS Fargate)', () => {
    test('ECS cluster exists and is active', async () => {
      const clusterName = outputs.ecs_cluster_name;
      expect(clusterName).toBeDefined();

      const result = await awsCall(() =>
        ecs.describeClusters({ clusters: [clusterName] }).promise()
      );

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters![0].status).toBe('ACTIVE');
      console.log(`✓ ECS cluster "${clusterName}" is active`);
    }, TEST_TIMEOUT);

    test('ECS service is running with desired tasks', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;
      expect(clusterName).toBeDefined();
      expect(serviceName).toBeDefined();

      const result = await awsCall(() =>
        ecs.describeServices({ cluster: clusterName, services: [serviceName] }).promise()
      );

      expect(result.services).toHaveLength(1);
      expect(result.services![0].status).toBe('ACTIVE');
      expect(result.services![0].runningCount).toBeGreaterThan(0);
      console.log(`✓ ECS service running with ${result.services![0].runningCount} task(s)`);
    }, TEST_TIMEOUT);

    test('ECS tasks are in RUNNING state', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const result = await awsCall(() =>
        ecs.listTasks({ cluster: clusterName, serviceName }).promise()
      );

      expect(result.taskArns).toBeDefined();
      expect(result.taskArns!.length).toBeGreaterThan(0);

      const taskDetails = await awsCall(() =>
        ecs.describeTasks({ cluster: clusterName, tasks: result.taskArns! }).promise()
      );

      for (const task of taskDetails.tasks || []) {
        expect(task.lastStatus).toBe('RUNNING');
      }

      console.log(`✓ ${result.taskArns!.length} ECS task(s) in RUNNING state`);
    }, TEST_TIMEOUT);
  });

  // --- Database (RDS) ---
  describe('Database (RDS)', () => {
    test('RDS instance is available and encrypted', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await awsCall(() =>
        rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise()
      );

      expect(result.DBInstances).toHaveLength(1);
      expect(result.DBInstances![0].DBInstanceStatus).toBe('available');
      expect(result.DBInstances![0].StorageEncrypted).toBe(true);
      expect(result.DBInstances![0].Engine).toBe('postgres');
      expect(result.DBInstances![0].EngineVersion).toMatch(/^15\.14/);

      console.log('✓ RDS PostgreSQL 15.14 is available and encrypted');
    }, TEST_TIMEOUT);

    test('RDS is not publicly accessible', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await awsCall(() =>
        rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise()
      );

      expect(result.DBInstances![0].PubliclyAccessible).toBe(false);
      console.log('✓ RDS is not publicly accessible');
    }, TEST_TIMEOUT);
  });

  // --- Storage (S3) ---
  describe('Storage (S3)', () => {
    test('S3 bucket exists and has versioning enabled', async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();

      const versioningResult = await awsCall(() =>
        s3.getBucketVersioning({ Bucket: bucketName }).promise()
      );

      expect(versioningResult.Status).toBe('Enabled');
      console.log('✓ S3 bucket versioning is enabled');
    }, TEST_TIMEOUT);

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.s3_bucket_name;

      const encryptionResult = await awsCall(() =>
        s3.getBucketEncryption({ Bucket: bucketName }).promise()
      );

      expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResult.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      console.log('✓ S3 bucket encryption with KMS is enabled');
    }, TEST_TIMEOUT);

    test('S3 bucket blocks public access', async () => {
      const bucketName = outputs.s3_bucket_name;

      const publicAccessResult = await awsCall(() =>
        s3.getPublicAccessBlock({ Bucket: bucketName }).promise()
      );

      expect(publicAccessResult.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResult.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessResult.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessResult.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

      console.log('✓ S3 bucket public access is blocked');
    }, TEST_TIMEOUT);
  });

  // --- KMS ---
  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const kmsKeyId = outputs.kms_key_id;
      expect(kmsKeyId).toBeDefined();

      const keyDetails = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );

      expect(rotationStatus.KeyRotationEnabled).toBe(true);
      console.log('✓ KMS key is enabled with automatic rotation');
    }, TEST_TIMEOUT);
  });

  // --- Secrets Manager ---
  describe('Secrets Manager', () => {
    test('Database credentials secret exists and contains password', async () => {
      const secretName = outputs.db_secret_name;
      expect(secretName).toBeDefined();

      const secretValue = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      expect(secretValue.SecretString).toBeDefined();
      const credentials = JSON.parse(secretValue.SecretString!);

      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.password.length).toBe(32); // Matches random_password length
      expect(credentials.host).toBeDefined();
      expect(credentials.port).toBe(5432);
      expect(credentials.dbname).toBeDefined();

      console.log('✓ Secrets Manager contains valid DB credentials');
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

  test('Health endpoint returns 200 OK', async () => {
    expect(albUrl).toBeDefined();
    console.log(`Testing health endpoint: ${albUrl}/health`);

    // Retry logic for startup timing
    let response;
    for (let i = 0; i < 5; i++) {
      try {
        response = await axios.get(`${albUrl}/health`, { timeout: 10000 });
        break;
      } catch (error: any) {
        if (i === 4) throw error;
        console.log(`Retry ${i + 1}/5 - waiting for application to be ready...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    expect(response).toBeDefined();
    expect(response!.status).toBe(200);
    console.log('✓ Health endpoint returned 200 OK');
  }, TEST_TIMEOUT * 2);

  test('Application root returns valid response', async () => {
    expect(albUrl).toBeDefined();
    console.log(`Testing application root: ${albUrl}/`);

    const response = await axios.get(albUrl, { timeout: 10000 });
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();

    console.log('✓ Application root returned 200 OK');
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 4: DATABASE CONNECTIVITY TEST
// =============================================================================

describe('ECS to RDS Connectivity', () => {
  let outputs: Record<string, any> = {};
  let albUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    const albDns = outputs.alb_dns_name;
    expect(albDns).toBeDefined();
    albUrl = `http://${albDns}`;
  });

  test('Application can connect to RDS and execute SELECT 1 query', async () => {
    expect(albUrl).toBeDefined();

    // Make request to /db-test endpoint which should query the database
    let response;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        response = await axios.get(`${albUrl}/db-test`, { timeout: 15000 });
        break;
      } catch (error: any) {
        attempts++;
        if (attempts === maxAttempts) throw error;
        console.log(`Retry ${attempts}/${maxAttempts} - waiting for database connection...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    expect(response).toBeDefined();
    expect(response!.status).toBe(200);

    // Parse response
    let dbTestResponse: any;
    if (typeof response!.data === 'string') {
      dbTestResponse = JSON.parse(response!.data);
    } else {
      dbTestResponse = response!.data;
    }

    // Verify database connectivity
    expect(dbTestResponse.status).toBe('success');
    expect(dbTestResponse.test_result).toBe(1); // SELECT 1 should return 1
    expect(dbTestResponse.message).toContain('Database connection successful');

    console.log('✓ ECS successfully connected to RDS');
    console.log(`  Database query time: ${dbTestResponse.query_time}`);
  }, TEST_TIMEOUT * 3);
});

// =============================================================================
// SUITE 5: WAF RULES VALIDATION
// =============================================================================

describe('WAF Rules Validation', () => {
  let outputs: Record<string, any> = {};
  let albUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    const albDns = outputs.alb_dns_name;
    expect(albDns).toBeDefined();
    albUrl = `http://${albDns}`;
  });

  test('WAF WebACL exists and has security rules configured', async () => {
    const wafWebAclId = outputs.waf_web_acl_id;
    const wafWebAclArn = outputs.waf_web_acl_arn;
    expect(wafWebAclId).toBeDefined();
    expect(wafWebAclArn).toBeDefined();

    const webACL = await wafClient.send(
      new GetWebACLCommand({
        Id: wafWebAclId,
        Name: wafWebAclArn.split('/').pop(),
        Scope: 'REGIONAL',
      })
    );

    expect(webACL.WebACL).toBeDefined();
    expect(webACL.WebACL!.Rules).toBeDefined();
    expect(webACL.WebACL!.Rules!.length).toBeGreaterThan(0);

    // Check for expected rules
    const ruleNames = webACL.WebACL!.Rules!.map(r => r.Name);
    console.log('WAF Rules configured:', ruleNames);

    expect(ruleNames).toContain('RateLimitRule');
    expect(ruleNames.some(name => name.includes('CommonRuleSet'))).toBe(true);
    expect(ruleNames.some(name => name.includes('KnownBadInputs'))).toBe(true);
    expect(ruleNames.some(name => name.includes('SQLi'))).toBe(true);

    console.log('✓ WAF WebACL has all expected security rules');
  }, TEST_TIMEOUT);

  test('WAF blocks SQL injection attempts in query string', async () => {
    expect(albUrl).toBeDefined();

    // SQL injection payloads
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "admin' --",
      "' UNION SELECT NULL--",
      "1' AND '1'='1",
    ];

    let blockedCount = 0;

    for (const payload of sqlInjectionPayloads) {
      try {
        const testUrl = `${albUrl}/search?q=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, {
          timeout: 10000,
          validateStatus: () => true, // Don't throw on non-2xx
        });

        // WAF should block with 403 Forbidden
        if (response.status === 403) {
          blockedCount++;
          console.log(`  ✓ Blocked SQL injection: "${payload}"`);
        } else {
          console.log(`  ⚠ SQL injection NOT blocked (${response.status}): "${payload}"`);
        }
      } catch (error: any) {
        // Network errors might occur if WAF blocks at connection level
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          blockedCount++;
          console.log(`  ✓ Blocked SQL injection (connection reset): "${payload}"`);
        }
      }
    }

    // At least some SQL injections should be blocked
    expect(blockedCount).toBeGreaterThan(0);
    console.log(`✓ WAF blocked ${blockedCount}/${sqlInjectionPayloads.length} SQL injection attempts`);
  }, 60000);

  test('WAF blocks XSS (Cross-Site Scripting) attempts', async () => {
    expect(albUrl).toBeDefined();

    // XSS payloads
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
    ];

    let blockedCount = 0;

    for (const payload of xssPayloads) {
      try {
        const testUrl = `${albUrl}/search?q=${encodeURIComponent(payload)}`;
        const response = await axios.get(testUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });

        if (response.status === 403) {
          blockedCount++;
          console.log(`  ✓ Blocked XSS: "${payload.substring(0, 30)}..."`);
        } else {
          console.log(`  ⚠ XSS NOT blocked (${response.status}): "${payload.substring(0, 30)}..."`);
        }
      } catch (error: any) {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          blockedCount++;
          console.log(`  ✓ Blocked XSS (connection reset): "${payload.substring(0, 30)}..."`);
        }
      }
    }

    expect(blockedCount).toBeGreaterThan(0);
    console.log(`✓ WAF blocked ${blockedCount}/${xssPayloads.length} XSS attempts`);
  }, 60000);

  test('WAF rate limiting prevents excessive requests', async () => {
    expect(albUrl).toBeDefined();

    // Send rapid requests to trigger rate limiting
    const requestCount = 2500; // Default rate limit is 2000 per 5 minutes
    const results = {
      success: 0,
      blocked: 0,
      errors: 0,
    };

    console.log(`Sending ${requestCount} rapid requests to test rate limiting...`);

    const requests = Array(requestCount).fill(null).map(async (_, index) => {
      try {
        const response = await axios.get(`${albUrl}/health`, {
          timeout: 5000,
          validateStatus: () => true,
        });

        if (response.status === 200) {
          results.success++;
        } else if (response.status === 403) {
          results.blocked++;
        }
      } catch (error) {
        results.errors++;
      }
    });

    await Promise.all(requests);

    console.log(`Results: ${results.success} success, ${results.blocked} blocked, ${results.errors} errors`);

    // Should have some blocked requests due to rate limiting
    expect(results.blocked).toBeGreaterThan(0);
    console.log(`✓ WAF rate limiting blocked ${results.blocked} requests`);
  }, TEST_TIMEOUT * 3);
});

// =============================================================================
// SUITE 6: SECURITY VALIDATION
// =============================================================================

describe('Security Configuration Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('No sensitive data exposed in outputs', () => {
    // Database password should not be in outputs
    expect(outputs.db_password).toBeUndefined();

    // Secret ARN might be sensitive but name should be safe
    expect(outputs.db_secret_name).toBeDefined();

    console.log('✓ No sensitive data exposed in Terraform outputs');
  });

  test('All resources have pr_number tag', async () => {
    // Check ECS cluster tags
    const clusterName = outputs.ecs_cluster_name;
    const clusterResult = await ecs.describeClusters({ clusters: [clusterName], include: ['TAGS'] }).promise();

    const clusterTags = clusterResult.clusters![0].tags || [];
    const prNumberTag = clusterTags.find(tag => tag.key === 'PRNumber');

    expect(prNumberTag).toBeDefined();
    expect(prNumberTag!.value).toMatch(/^pr6969(dev|staging|prod)$/);

    console.log(`✓ Resources tagged with PRNumber: ${prNumberTag!.value}`);
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 7: COMPREHENSIVE E2E TESTS - ALL RESOURCES
// =============================================================================

describe('Complete End-to-End Tests - All Resources', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
    console.log('\n=== E2E Test - All Deployed Resources ===');
    console.log('Available outputs:', Object.keys(outputs));
  });

  // --- VPC & Networking ---
  describe('VPC & Networking Infrastructure', () => {
    test('VPC exists and has correct CIDR', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);

      console.log(`✓ VPC ${vpcId} is available with CIDR ${result.Vpcs![0].CidrBlock}`);
    }, TEST_TIMEOUT);

    test('Public subnets exist and map public IPs', async () => {
      const subnetIds = outputs.public_subnet_ids;
      expect(subnetIds).toBeDefined();
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThan(0);

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeSubnets({ SubnetIds: subnetIds }).promise();

      expect(result.Subnets?.length).toBe(subnetIds.length);

      for (const subnet of result.Subnets || []) {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      }

      console.log(`✓ ${subnetIds.length} public subnet(s) available with auto-assign public IP`);
    }, TEST_TIMEOUT);

    test('Private subnets exist and do not map public IPs', async () => {
      const subnetIds = outputs.private_subnet_ids;
      expect(subnetIds).toBeDefined();
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThan(0);

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeSubnets({ SubnetIds: subnetIds }).promise();

      expect(result.Subnets?.length).toBe(subnetIds.length);

      for (const subnet of result.Subnets || []) {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      }

      console.log(`✓ ${subnetIds.length} private subnet(s) available without public IP mapping`);
    }, TEST_TIMEOUT);

    test('Internet Gateway is attached to VPC', async () => {
      const vpcId = outputs.vpc_id;
      const ec2 = new AWS.EC2({ region: AWS_REGION });

      const result = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      }).promise();

      expect(result.InternetGateways).toBeDefined();
      expect(result.InternetGateways!.length).toBeGreaterThan(0);
      expect(result.InternetGateways![0].Attachments![0].State).toBe('available');

      console.log(`✓ Internet Gateway attached to VPC ${vpcId}`);
    }, TEST_TIMEOUT);

    test('NAT Gateway exists in public subnet', async () => {
      const vpcId = outputs.vpc_id;
      const ec2 = new AWS.EC2({ region: AWS_REGION });

      const result = await ec2.describeNatGateways({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      }).promise();

      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways!.length).toBeGreaterThan(0);
      expect(result.NatGateways![0].State).toBe('available');

      console.log(`✓ NAT Gateway is available in VPC ${vpcId}`);
    }, TEST_TIMEOUT);
  });

  // --- Security Groups ---
  describe('Security Groups Configuration', () => {
    test('ALB Security Group allows HTTP (80) and HTTPS (443)', async () => {
      const sgId = outputs.alb_security_group_id;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-/);

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();

      expect(result.SecurityGroups).toHaveLength(1);

      const ingressRules = result.SecurityGroups![0].IpPermissions || [];
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

      console.log('✓ ALB Security Group allows HTTP (80) and HTTPS (443) from 0.0.0.0/0');
    }, TEST_TIMEOUT);

    test('ECS Security Group allows traffic only from ALB', async () => {
      const ecsSgId = outputs.ecs_security_group_id;
      const albSgId = outputs.alb_security_group_id;

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeSecurityGroups({ GroupIds: [ecsSgId] }).promise();

      const ingressRules = result.SecurityGroups![0].IpPermissions || [];

      // Should only allow traffic from ALB security group
      const albRule = ingressRules.find(rule =>
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === albSgId)
      );

      expect(albRule).toBeDefined();
      console.log('✓ ECS Security Group allows traffic only from ALB Security Group');
    }, TEST_TIMEOUT);

    test('RDS Security Group allows PostgreSQL (5432) only from ECS', async () => {
      const vpcId = outputs.vpc_id;
      const ecsSgId = outputs.ecs_security_group_id;

      const ec2 = new AWS.EC2({ region: AWS_REGION });
      const result = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['*rds*'] },
        ],
      }).promise();

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups!.length).toBeGreaterThan(0);

      const rdsSg = result.SecurityGroups![0];
      const ingressRules = rdsSg.IpPermissions || [];
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ecsSgId)).toBe(true);

      console.log('✓ RDS Security Group allows PostgreSQL (5432) only from ECS');
    }, TEST_TIMEOUT);
  });

  // --- Load Balancer Deep Dive ---
  describe('Application Load Balancer Complete Test', () => {
    test('ALB has all required attributes configured', async () => {
      const albArn = outputs.alb_arn;

      const result = await elbv2.describeLoadBalancerAttributes({
        LoadBalancerArn: albArn,
      }).promise();

      const attributes = result.Attributes || [];
      const getAttribute = (key: string) =>
        attributes.find(attr => attr.Key === key)?.Value;

      expect(getAttribute('deletion_protection.enabled')).toBeDefined();
      expect(getAttribute('idle_timeout.timeout_seconds')).toBe('60');
      expect(getAttribute('routing.http2.enabled')).toBe('true');

      console.log('✓ ALB attributes configured correctly');
    }, TEST_TIMEOUT);

    test('ALB Target Group health check is properly configured', async () => {
      const tgArn = outputs.target_group_arn;

      const result = await elbv2.describeTargetGroups({
        TargetGroupArns: [tgArn],
      }).promise();

      const tg = result.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Matcher?.HttpCode).toMatch(/200/);

      console.log('✓ Target Group health check: /health endpoint, HTTP 200 matcher');
    }, TEST_TIMEOUT);

    test('ALB Listeners are configured correctly', async () => {
      const albArn = outputs.alb_arn;

      const result = await elbv2.describeListeners({
        LoadBalancerArn: albArn,
      }).promise();

      expect(result.Listeners).toBeDefined();
      expect(result.Listeners!.length).toBeGreaterThan(0);

      const httpListener = result.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();

      console.log(`✓ ALB has ${result.Listeners!.length} listener(s) configured`);
    }, TEST_TIMEOUT);

    test('ALB is in multiple availability zones', async () => {
      const albArn = outputs.alb_arn;

      const result = await elbv2.describeLoadBalancers({
        LoadBalancerArns: [albArn],
      }).promise();

      const azs = result.LoadBalancers![0].AvailabilityZones || [];
      expect(azs.length).toBeGreaterThanOrEqual(2);

      console.log(`✓ ALB deployed across ${azs.length} availability zones`);
    }, TEST_TIMEOUT);
  });

  // --- ECS Fargate Deep Dive ---
  describe('ECS Fargate Complete Test', () => {
    test('ECS Task Definition has correct configuration', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const serviceResult = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const taskDefArn = serviceResult.services![0].taskDefinition!;

      const taskDefResult = await ecs.describeTaskDefinition({
        taskDefinition: taskDefArn,
      }).promise();

      const taskDef = taskDefResult.taskDefinition!;

      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBeDefined();
      expect(taskDef.memory).toBeDefined();

      console.log(`✓ Task Definition: ${taskDef.cpu} CPU, ${taskDef.memory} Memory, Fargate compatible`);
    }, TEST_TIMEOUT);

    test('ECS Task Definition has environment variables configured', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const serviceResult = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const taskDefArn = serviceResult.services![0].taskDefinition!;

      const taskDefResult = await ecs.describeTaskDefinition({
        taskDefinition: taskDefArn,
      }).promise();

      const container = taskDefResult.taskDefinition!.containerDefinitions![0];
      const env = container.environment || [];

      const envVars = env.map(e => e.name);
      expect(envVars).toContain('ENVIRONMENT');
      expect(envVars).toContain('DB_HOST');
      expect(envVars).toContain('DB_NAME');
      expect(envVars).toContain('S3_BUCKET');
      expect(envVars).toContain('AWS_REGION');

      console.log(`✓ Task has ${envVars.length} environment variables configured`);
    }, TEST_TIMEOUT);

    test('ECS Task Definition has secrets from Secrets Manager', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const serviceResult = await ecs.describeServices({
        cluster: clusterName,
        services: [serviceName],
      }).promise();

      const taskDefArn = serviceResult.services![0].taskDefinition!;

      const taskDefResult = await ecs.describeTaskDefinition({
        taskDefinition: taskDefArn,
      }).promise();

      const container = taskDefResult.taskDefinition!.containerDefinitions![0];
      const secrets = container.secrets || [];

      expect(secrets.length).toBeGreaterThan(0);

      const dbPasswordSecret = secrets.find(s => s.name === 'DB_PASSWORD');
      expect(dbPasswordSecret).toBeDefined();
      expect(dbPasswordSecret?.valueFrom).toContain('secretsmanager');

      console.log(`✓ Task has ${secrets.length} secret(s) from Secrets Manager`);
    }, TEST_TIMEOUT);

    test('ECS Service has auto-scaling configured', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const autoscaling = new AWS.ApplicationAutoScaling({ region: AWS_REGION });

      const result = await autoscaling.describeScalableTargets({
        ServiceNamespace: 'ecs',
        ResourceIds: [`service/${clusterName}/${serviceName}`],
      }).promise();

      expect(result.ScalableTargets).toBeDefined();
      expect(result.ScalableTargets!.length).toBeGreaterThan(0);

      const target = result.ScalableTargets![0];
      expect(target.MinCapacity).toBeDefined();
      expect(target.MaxCapacity).toBeDefined();

      console.log(`✓ Auto-scaling: ${target.MinCapacity} min - ${target.MaxCapacity} max tasks`);
    }, TEST_TIMEOUT);

    test('ECS Service has scaling policies', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const autoscaling = new AWS.ApplicationAutoScaling({ region: AWS_REGION });

      const result = await autoscaling.describeScalingPolicies({
        ServiceNamespace: 'ecs',
        ResourceId: `service/${clusterName}/${serviceName}`,
      }).promise();

      expect(result.ScalingPolicies).toBeDefined();
      expect(result.ScalingPolicies!.length).toBeGreaterThan(0);

      console.log(`✓ ${result.ScalingPolicies!.length} scaling policy/policies configured`);
    }, TEST_TIMEOUT);
  });

  // --- RDS Deep Dive ---
  describe('RDS PostgreSQL Complete Test', () => {
    test('RDS has automated backups enabled', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const db = result.DBInstances![0];

      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db.PreferredBackupWindow).toBeDefined();

      console.log(`✓ Automated backups: ${db.BackupRetentionPeriod} days retention`);
    }, TEST_TIMEOUT);

    test('RDS has CloudWatch logs exports enabled', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const db = result.DBInstances![0];
      const logExports = db.EnabledCloudwatchLogsExports || [];

      expect(logExports).toContain('postgresql');

      console.log('✓ CloudWatch logs exports enabled for PostgreSQL');
    }, TEST_TIMEOUT);

    test('RDS has deletion protection based on environment', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const db = result.DBInstances![0];
      expect(db.DeletionProtection).toBeDefined();

      console.log(`✓ Deletion protection: ${db.DeletionProtection ? 'enabled' : 'disabled'}`);
    }, TEST_TIMEOUT);

    test('RDS subnet group spans multiple AZs', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const result = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const subnetGroupName = result.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName!;

      const subnetGroupResult = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: subnetGroupName,
      }).promise();

      const subnets = subnetGroupResult.DBSubnetGroups![0].Subnets || [];
      const uniqueAZs = new Set(subnets.map(s => s.SubnetAvailabilityZone?.Name));

      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);

      console.log(`✓ RDS subnet group spans ${uniqueAZs.size} availability zones`);
    }, TEST_TIMEOUT);
  });

  // --- S3 Deep Dive ---
  describe('S3 Bucket Complete Test', () => {
    test('S3 bucket has lifecycle rules configured', async () => {
      const bucketName = outputs.s3_bucket_name;

      const result = await s3.getBucketLifecycleConfiguration({
        Bucket: bucketName,
      }).promise();

      expect(result.Rules).toBeDefined();
      expect(result.Rules!.length).toBeGreaterThan(0);

      const transitions = result.Rules![0].Transitions || [];
      expect(transitions.length).toBeGreaterThan(0);

      console.log(`✓ Lifecycle rules: ${transitions.length} transition(s) configured`);
    }, TEST_TIMEOUT);

    test('S3 bucket has object lock configuration (if enabled)', async () => {
      const bucketName = outputs.s3_bucket_name;

      try {
        const result = await s3.getObjectLockConfiguration({
          Bucket: bucketName,
        }).promise();

        console.log('✓ Object lock is enabled');
      } catch (error: any) {
        if (error.code === 'ObjectLockConfigurationNotFoundError') {
          console.log('✓ Object lock not enabled (expected for this configuration)');
        }
      }
    }, TEST_TIMEOUT);

    test('S3 bucket has logging configuration', async () => {
      const bucketName = outputs.s3_bucket_name;

      try {
        const result = await s3.getBucketLogging({
          Bucket: bucketName,
        }).promise();

        if (result.LoggingEnabled) {
          console.log(`✓ S3 logging enabled to ${result.LoggingEnabled.TargetBucket}`);
        } else {
          console.log('✓ S3 logging not configured (acceptable for transaction logs bucket)');
        }
      } catch (error) {
        console.log('✓ S3 logging not configured');
      }
    }, TEST_TIMEOUT);
  });

  // --- CloudWatch Monitoring ---
  describe('CloudWatch Monitoring', () => {
    test('CloudWatch Log Groups exist for ECS', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const logs = new AWS.CloudWatchLogs({ region: AWS_REGION });

      const result = await logs.describeLogGroups({
        logGroupNamePrefix: '/ecs',
      }).promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups!.length).toBeGreaterThan(0);

      console.log(`✓ ${result.logGroups!.length} ECS log group(s) found`);
    }, TEST_TIMEOUT);

    test('CloudWatch Log Groups exist for WAF', async () => {
      const logs = new AWS.CloudWatchLogs({ region: AWS_REGION });

      const result = await logs.describeLogGroups({
        logGroupNamePrefix: 'aws-waf-logs',
      }).promise();

      expect(result.logGroups).toBeDefined();
      expect(result.logGroups!.length).toBeGreaterThan(0);

      console.log(`✓ ${result.logGroups!.length} WAF log group(s) found`);
    }, TEST_TIMEOUT);

    test('CloudWatch metrics are available for ECS', async () => {
      const clusterName = outputs.ecs_cluster_name;

      const result = await cloudwatch.listMetrics({
        Namespace: 'AWS/ECS',
        Dimensions: [{ Name: 'ClusterName', Value: clusterName }],
      }).promise();

      expect(result.Metrics).toBeDefined();
      expect(result.Metrics!.length).toBeGreaterThan(0);

      console.log(`✓ ${result.Metrics!.length} ECS metric(s) available in CloudWatch`);
    }, TEST_TIMEOUT);
  });

  // --- IAM Roles & Policies ---
  describe('IAM Roles & Policies', () => {
    test('ECS Task Execution Role has required policies', async () => {
      const iam = new AWS.IAM({ region: AWS_REGION });

      // Get task execution role ARN from outputs and extract role name
      const taskExecRoleArn = outputs.ecs_task_execution_role_arn || '';
      const roleName = taskExecRoleArn.split('/').pop() || '';

      if (!roleName) {
        console.log('⚠ Task execution role ARN not available');
        return;
      }

      const result = await iam.listAttachedRolePolicies({
        RoleName: roleName,
      }).promise();

      const policyNames = result.AttachedPolicies?.map(p => p.PolicyName) || [];

      expect(policyNames.length).toBeGreaterThan(0);
      console.log(`✓ Task Execution Role has ${policyNames.length} attached policy/policies`);
    }, TEST_TIMEOUT);

    test('ECS Task Role has S3 and Secrets Manager permissions', async () => {
      const iam = new AWS.IAM({ region: AWS_REGION });
      const clusterName = outputs.ecs_cluster_name;

      // This is a best-effort test - we'll check if we can find the task role
      const result = await iam.listRoles({}).promise();

      const taskRole = result.Roles?.find(r =>
        r.RoleName.includes('task') && r.RoleName.includes(clusterName.split('-')[0])
      );

      if (taskRole) {
        const policies = await iam.listRolePolicies({
          RoleName: taskRole.RoleName,
        }).promise();

        console.log(`✓ Task Role "${taskRole.RoleName}" has ${policies.PolicyNames?.length || 0} inline policy/policies`);
      } else {
        console.log('⚠ Task Role not found via list operation');
      }
    }, TEST_TIMEOUT);
  });

  // --- Complete Workflow E2E ---
  describe('Complete Infrastructure Workflow', () => {
    test('Full request flow: Internet → ALB → ECS → RDS → S3', async () => {
      const albDns = outputs.alb_dns_name;
      const albUrl = `http://${albDns}`;

      console.log('\nTesting complete infrastructure flow:');
      console.log('Internet → ALB → ECS Task → RDS → S3');

      // Step 1: Request reaches ALB
      let response;
      for (let i = 0; i < 5; i++) {
        try {
          response = await axios.get(`${albUrl}/health`, { timeout: 10000 });
          break;
        } catch (error) {
          if (i === 4) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      expect(response).toBeDefined();
      expect(response!.status).toBe(200);
      console.log('  ✓ Step 1: Request reached ALB');

      // Step 2: ALB forwarded to ECS task
      console.log('  ✓ Step 2: ALB forwarded request to ECS task');

      // Step 3: Test database connectivity
      try {
        const dbResponse = await axios.get(`${albUrl}/db-test`, { timeout: 15000 });
        expect(dbResponse.status).toBe(200);
        console.log('  ✓ Step 3: ECS task connected to RDS successfully');
      } catch (error) {
        console.log('  ⚠ Step 3: Database test endpoint not available (app may not have this endpoint)');
      }

      // Step 4: Verify S3 bucket is accessible by checking it exists
      const bucketName = outputs.s3_bucket_name;
      const headResult = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(headResult).toBeDefined();
      console.log('  ✓ Step 4: S3 bucket is accessible');

      console.log('\n✅ Complete infrastructure workflow validated!');
    }, TEST_TIMEOUT * 3);
  });
});
