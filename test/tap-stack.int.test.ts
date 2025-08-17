import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 300000; // 5 minutes

interface TerraformOutput {
  [key: string]: {
    value: string | string[];
    type: string;
  };
}

describe('Terraform Configuration Integration Tests', () => {
  beforeAll(async () => {
    // Set up test environment variables
    process.env.TF_VAR_db_password = process.env.TF_VAR_db_password || 'test-password-123!';
    process.env.TF_VAR_ec2_key_pair_name = process.env.TF_VAR_ec2_key_pair_name || 'test-key-pair';
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
    process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || 'us-east-1';
    
    // Ensure we're in the lib directory
    process.chdir(LIB_DIR);
    
    // Clean up any existing state
    try {
      execSync('terraform destroy -auto-approve -lock=false', { 
        stdio: 'pipe',
        timeout: 60000 
      });
    } catch (error) {
      // Ignore errors if no state exists
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Clean up resources after tests
    try {
      execSync('terraform destroy -auto-approve -lock=false', { 
        stdio: 'pipe',
        timeout: 300000 
      });
    } catch (error) {
      console.error('Failed to destroy resources:', error);
    }
  }, TEST_TIMEOUT);

  describe('Terraform Initialization and Validation', () => {
    test('terraform init succeeds', () => {
      expect(() => {
        execSync('terraform init -reconfigure -lock=false', { 
          stdio: 'pipe',
          timeout: 60000 
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);

    test('terraform validate passes', () => {
      expect(() => {
        execSync('terraform validate', { 
          stdio: 'pipe',
          timeout: 30000 
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);

    test('terraform fmt check passes', () => {
      expect(() => {
        execSync('terraform fmt -check -recursive', { 
          stdio: 'pipe',
          timeout: 30000 
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);
  });

  describe('Terraform Plan', () => {
    test('terraform plan succeeds without errors', () => {
      expect(() => {
        execSync('terraform plan -lock=false -out=tfplan', { 
          stdio: 'pipe',
          timeout: 120000 
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);

    test('plan file is created', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'tfplan'))).toBe(true);
    });

    test('plan shows expected resource changes', () => {
      const planOutput = execSync('terraform show -json tfplan', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      const plan = JSON.parse(planOutput);

      // Check that we have resources to create
      expect(plan.resource_changes).toBeDefined();
      expect(plan.resource_changes.length).toBeGreaterThan(0);

      // Check for key resources
      const resourceTypes = plan.resource_changes.map((rc: any) => rc.type);
      expect(resourceTypes).toContain('aws_vpc');
      expect(resourceTypes).toContain('aws_kms_key');
      expect(resourceTypes).toContain('aws_s3_bucket');
      expect(resourceTypes).toContain('aws_dynamodb_table');
      expect(resourceTypes).toContain('aws_db_instance');
      expect(resourceTypes).toContain('aws_instance');
    });
  });

  describe('Terraform Apply', () => {
    test('terraform apply succeeds', () => {
      expect(() => {
        execSync('terraform apply -auto-approve -lock=false tfplan', { 
          stdio: 'pipe',
          timeout: 600000 // 10 minutes for apply
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);

    test('terraform state list shows expected resources', () => {
      const stateList = execSync('terraform state list', { 
        encoding: 'utf8',
        timeout: 30000 
      });

      // Check for key resources in state
      expect(stateList).toContain('aws_vpc.primary');
      expect(stateList).toContain('aws_vpc.secondary');
      expect(stateList).toMatch(/aws_kms_key\.(primary|secondary)/);
      expect(stateList).toMatch(/aws_s3_bucket\.(primary|secondary|logging)/);
      expect(stateList).toMatch(/aws_dynamodb_table\.(primary|secondary)/);
      expect(stateList).toMatch(/aws_db_instance\.(primary|secondary)/);
      expect(stateList).toMatch(/aws_instance\.(primary|secondary)/);
    });
  });

  describe('Resource Validation', () => {
    let outputs: TerraformOutput;

    beforeAll(() => {
      const outputJson = execSync('terraform output -json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      outputs = JSON.parse(outputJson);
    });

    test('VPC outputs are available', () => {
      expect(outputs.primary_vpc_id).toBeDefined();
      expect(outputs.secondary_vpc_id).toBeDefined();
      expect(outputs.primary_vpc_id.value).toMatch(/^vpc-/);
      expect(outputs.secondary_vpc_id.value).toMatch(/^vpc-/);
    });

    test('S3 bucket outputs are available', () => {
      expect(outputs.primary_s3_bucket_name).toBeDefined();
      expect(outputs.primary_s3_bucket_name.value).toMatch(/^tap-stack-primary-/);
    });

    test('EC2 instance outputs are available', () => {
      expect(outputs.primary_ec2_instance_id).toBeDefined();
      expect(outputs.primary_ec2_instance_id.value).toMatch(/^i-/);
    });

    test('KMS key outputs are available', () => {
      expect(outputs.primary_kms_key_id).toBeDefined();
      expect(outputs.primary_kms_key_id.value).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('DynamoDB global table output is available', () => {
      expect(outputs.dynamodb_global_table_name).toBeDefined();
      expect(outputs.dynamodb_global_table_name.value).toBe('tap-stack-table');
    });

    test('VPC peering connection output is available', () => {
      expect(outputs.vpc_peering_connection_id).toBeDefined();
      expect(outputs.vpc_peering_connection_id.value).toMatch(/^pcx-/);
    });
  });

  describe('AWS Resource Validation', () => {
    test('VPCs are created with correct CIDR blocks', () => {
      const vpcState = execSync('terraform show -json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      const state = JSON.parse(vpcState);

      const primaryVpc = state.values.root_module.resources.find((r: any) => r.address === 'aws_vpc.primary');
      const secondaryVpc = state.values.root_module.resources.find((r: any) => r.address === 'aws_vpc.secondary');

      expect(primaryVpc).toBeDefined();
      expect(secondaryVpc).toBeDefined();
      expect(primaryVpc.values.cidr_block).toBe('10.0.0.0/16');
      expect(secondaryVpc.values.cidr_block).toBe('10.1.0.0/16');
    });

    test('Security groups have correct rules', () => {
      const sgState = execSync('terraform show -json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      const state = JSON.parse(sgState);

      const primarySg = state.values.root_module.resources.find((r: any) => r.address === 'aws_security_group.primary');
      expect(primarySg).toBeDefined();

      // Check SSH rule uses allowed CIDR blocks
      const sshRule = primarySg.values.ingress.find((rule: any) => rule.from_port === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.cidr_blocks).toEqual(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);
    });

    test('RDS instances have encryption enabled', () => {
      const rdsState = execSync('terraform show -json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      const state = JSON.parse(rdsState);

      const primaryRds = state.values.root_module.resources.find((r: any) => r.address === 'aws_db_instance.primary');
      expect(primaryRds).toBeDefined();
      expect(primaryRds.values.storage_encrypted).toBe(true);
      expect(primaryRds.values.multi_az).toBe(true);
      expect(primaryRds.values.publicly_accessible).toBe(false);
    });

    test('EC2 instances have encrypted volumes', () => {
      const ec2State = execSync('terraform show -json', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      const state = JSON.parse(ec2State);

      const primaryEc2 = state.values.root_module.resources.find((r: any) => r.address === 'aws_instance.primary');
      expect(primaryEc2).toBeDefined();
      expect(primaryEc2.values.root_block_device[0].encrypted).toBe(true);
    });
  });

  describe('Terraform Destroy', () => {
    test('terraform destroy succeeds', () => {
      expect(() => {
        execSync('terraform destroy -auto-approve -lock=false', { 
          stdio: 'pipe',
          timeout: 600000 // 10 minutes for destroy
        });
      }).not.toThrow();
    }, TEST_TIMEOUT);

    test('all resources are destroyed', () => {
      const stateList = execSync('terraform state list', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      expect(stateList.trim()).toBe('');
    });
  });
});
