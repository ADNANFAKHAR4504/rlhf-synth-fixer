import AWS from 'aws-sdk';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients
const ec2 = new AWS.EC2({ region: AWS_REGION });
const elbv2 = new AWS.ELBv2({ region: AWS_REGION });
const rds = new AWS.RDS({ region: AWS_REGION });
const cloudwatch = new AWS.CloudWatch({ region: AWS_REGION });

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
    // Ensure plan file exists
    const planFile = `tfplan-${varFile.replace('.tfvars', '')}`;
    if (!fs.existsSync(path.join(TERRAFORM_DIR, planFile))) {
      runTerraformPlan(varFile);
    }

    const planJson = execSync(`terraform show -json ${planFile}`, {
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

  const scanModule = (module: any) => {
    if (module.resources) {
      for (const resource of module.resources) {
        const type = resource.type;
        resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
      }
    }
    if (module.child_modules) {
      for (const child of module.child_modules) {
        scanModule(child);
      }
    }
  };

  if (plan?.planned_values?.root_module) {
    scanModule(plan.planned_values.root_module);
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

// =============================================================================
// SUITE 1: TERRAFORM PLAN VALIDATION (PRE-DEPLOYMENT CHECKS)
// =============================================================================

describe('Terraform Plan Validation', () => {
  const environments = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];
  let terraformAvailable = false;

  beforeAll(() => {
    try {
      execSync('which terraform', { encoding: 'utf-8' });
      terraformAvailable = true;

      // Initialize Terraform if not already done
      if (!fs.existsSync(path.join(TERRAFORM_DIR, '.terraform'))) {
        console.log('Initializing Terraform...');
        execSync('terraform init -reconfigure', { cwd: TERRAFORM_DIR, stdio: 'pipe' });
      }
    } catch (e) {
      console.warn('Terraform binary not found or init failed');
    }
  });

  afterAll(() => {
    // Cleanup plan files
    try {
      const files = ['tfplan-dev', 'tfplan-staging', 'tfplan-prod'];
      files.forEach((file) => {
        const filePath = path.join(TERRAFORM_DIR, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    } catch (error) { /* ignore */ }
  });

  test('Terraform is installed and accessible', () => {
    expect(terraformAvailable).toBe(true);
  });

  test('can generate valid plans for all environments', () => {
    if (!terraformAvailable) return;

    for (const envFile of environments) {
      const envPath = path.join(TERRAFORM_DIR, envFile);
      expect(fs.existsSync(envPath)).toBe(true);

      console.log(`Validating plan for ${envFile}...`);
      const result = runTerraformPlan(envFile);
      
      // Accept success or "No changes" as valid states
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('Error:');
      console.log(`${envFile}: Plan validated`);
    }
  }, TEST_TIMEOUT * 3);

  test('plans include all expected resource types', () => {
    if (!terraformAvailable) return;

    // Check dev plan specifically
    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    const resources = extractResources(plan);
    const resourceTypes = Array.from(resources.keys());

    const expectedTypes = [
      'aws_vpc',
      'aws_subnet',               // Networking module
      'aws_nat_gateway',
      'aws_instance',             // Compute module
      'aws_db_instance',          // RDS module
      'aws_lb',                   // ALB module
      'aws_lb_target_group',
      'aws_lb_listener',
      'aws_security_group',       // Security Groups module
      'aws_cloudwatch_metric_alarm' // CloudWatch module
    ];

    console.log('\nResource counts (dev):');
    for (const type of expectedTypes) {
      expect(resourceTypes).toContain(type);
      console.log(`  ${type}: ${resources.get(type)}`);
    }
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
    
    if (!outputs.alb_dns_name) throw new Error('Skipping integration tests: No deployment outputs found.');
  });

  // --- Outputs Format Checks ---
  test('Outputs have correct format', () => {
    expect(outputs.alb_dns_name).toMatch(/\.elb\.amazonaws\.com$/);
    expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com:5432$/);
    expect(outputs.alb_security_group_id).toMatch(/^sg-/);
    expect(outputs.target_group_arn).toMatch(/^arn:aws:elasticloadbalancing/);
  });

  // --- Networking & ALB ---
  describe('Networking & Load Balancing', () => {
    test('ALB is active and internet-facing', async () => {
      const albArn = outputs.alb_arn;
      const result = await awsCall(() => elbv2.describeLoadBalancers({ LoadBalancerArns: [albArn] }).promise());
      
      expect(result.LoadBalancers).toHaveLength(1);
      expect(result.LoadBalancers![0].State!.Code).toBe('active');
      expect(result.LoadBalancers![0].Scheme).toBe('internet-facing');
    }, TEST_TIMEOUT);

    test('Target Group is healthy', async () => {
      const tgArn = outputs.target_group_arn;
      const result = await awsCall(() => elbv2.describeTargetHealth({ TargetGroupArn: tgArn }).promise());
      
      // Expect at least one target to be healthy or initial (booting)
      const validStates = ['healthy', 'initial'];
      const healthyTargets = result.TargetHealthDescriptions!.filter(t => 
        validStates.includes(t.TargetHealth!.State!)
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  // --- Compute (EC2) ---
  describe('Compute (EC2)', () => {
    test('EC2 instances are running', async () => {
      let instanceIds = outputs.ec2_instance_ids;
      if (typeof instanceIds === 'string') instanceIds = JSON.parse(instanceIds);

      const result = await awsCall(() => ec2.describeInstances({ InstanceIds: instanceIds }).promise());
      
      result.Reservations!.forEach(res => {
        res.Instances!.forEach(inst => {
          expect(inst.State!.Name).toBe('running');
          // Verify correct Instance Type from tfvars (t3.micro/small)
          expect(inst.InstanceType).toMatch(/^t3\./); 
        });
      });
    }, TEST_TIMEOUT);
  });

  // --- Database (RDS) ---
  describe('Database (RDS)', () => {
    test('RDS instance is available and encrypted', async () => {
      const sgId = outputs.rds_security_group_id;
      
      // Find DB via security group since we don't output the ID directly
      const result = await awsCall(() => rds.describeDBInstances({}).promise());
      const db = result.DBInstances!.find(d => d.VpcSecurityGroups!.some(g => g.VpcSecurityGroupId === sgId));

      expect(db).toBeDefined();
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.StorageEncrypted).toBe(true);
      expect(db!.Engine).toBe('postgres');
      expect(db!.EngineVersion).toMatch(/^15\./);
    }, TEST_TIMEOUT);
  });

  // --- Security Groups ---
  describe('Security Groups', () => {
    test('ALB Security Group allows HTTP (80)', async () => {
      const result = await awsCall(() => ec2.describeSecurityGroups({ GroupIds: [outputs.alb_security_group_id] }).promise());
      const permissions = result.SecurityGroups![0].IpPermissions!;
      
      const httpRule = permissions.find(p => p.FromPort === 80 && p.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges!.some(r => r.CidrIp === '0.0.0.0/0')).toBe(true);
    }, TEST_TIMEOUT);
  });

  // --- Monitoring ---
  describe('Monitoring (CloudWatch)', () => {
    test('Alarms exist for RDS and ALB', async () => {
      let alarmArns = outputs.cloudwatch_alarm_arns;
      if (typeof alarmArns === 'string') alarmArns = JSON.parse(alarmArns);

      const result = await awsCall(() => cloudwatch.describeAlarms({ AlarmNames: [] }).promise()); // Get all
      const allArns = result.MetricAlarms!.map(a => a.AlarmArn);

      expect(allArns).toContain(alarmArns.alb_health);
      expect(allArns).toContain(alarmArns.rds_cpu);
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
    if (outputs.alb_dns_name) {
      albUrl = `http://${outputs.alb_dns_name}`;
    }
  });

  test('Application Root returns 200 OK', async () => {
    if (!albUrl) return;
    console.log(`Testing URL: ${albUrl}`);

    // Simple retry logic for startup timing
    let response;
    for (let i = 0; i < 3; i++) {
      try {
        response = await axios.get(albUrl, { timeout: 5000 });
        if (response.status === 200) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    expect(response).toBeDefined();
    expect(response!.status).toBe(200);
    expect(response!.data).toContain('Welcome to Payment App');
  }, TEST_TIMEOUT);

  test('Health endpoint returns "healthy"', async () => {
    if (!albUrl) return;
    const response = await axios.get(`${albUrl}/health`);
    expect(response.status).toBe(200);
    expect(response.data).toMatch(/healthy/i);
  }, TEST_TIMEOUT);
});