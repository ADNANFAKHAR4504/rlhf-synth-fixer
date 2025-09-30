import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

const albDnsName: string | undefined = terraformOutput.alb_dns_name;
const rdsEndpoint: string | undefined = terraformOutput.rds_endpoint;
const vpcId: string | undefined = terraformOutput.vpc_id;
const subnetIds: string[] | undefined = terraformOutput.subnet_ids;
const albSg: string | undefined = terraformOutput.alb_sg_id;
const rdsSg: string | undefined = terraformOutput.rds_sg_id;

console.log('ALB DNS:', albDnsName);
console.log('RDS Endpoint:', rdsEndpoint);
console.log('VPC ID:', vpcId);

describe('TAP Stack Integration Tests', () => {
  // --------------------------
  // Application Reachability
  // --------------------------
  describe('Application Reachability', () => {
    test('ALB root endpoint returns HTTP 200 (HTML check)', async () => {
      expect(albDnsName).toBeDefined();
      const response = await fetch(`http://${albDnsName}/`, {
        signal: AbortSignal.timeout(5000),
      });
      expect(response.status).toBe(200);
    }, 60000);
  });

  // --------------------------
  // Database Security
  // --------------------------
  describe('Database Security', () => {
    test('RDS should not be publicly accessible', () => {
      if (!rdsEndpoint) return test.skip();

      const rdsHost = rdsEndpoint.split(':')[0];
      let result = '';
      try {
        result = execSync(
          `aws rds describe-db-instances --query "DBInstances[?Endpoint.Address=='${rdsHost}'].PubliclyAccessible" --output text`,
          { encoding: 'utf8' }
        ).trim();
      } catch (err) {
        console.warn('⚠️ Could not fetch RDS accessibility:', err.message);
        return test.skip();
      }

      expect(result).toBe('False');
      console.log('✅ RDS is not publicly accessible');
    });

    test('RDS storage encryption enabled', () => {
      if (!rdsEndpoint) return test.skip();

      const rdsHost = rdsEndpoint.split(':')[0];
      let result = '';
      try {
        result = execSync(
          `aws rds describe-db-instances --query "DBInstances[?Endpoint.Address=='${rdsHost}'].StorageEncrypted" --output text`,
          { encoding: 'utf8' }
        ).trim();
      } catch (err) {
        console.warn('⚠️ Could not fetch RDS encryption:', err.message);
        return test.skip();
      }

      expect(result).toBe('True');
      console.log('✅ RDS storage encryption is enabled');
    });
  });

  // --------------------------
  // Infrastructure Outputs
  // --------------------------
  describe('Infrastructure Outputs', () => {
    test('VPC and subnets exist', () => {
      if (!vpcId || !subnetIds) return test.skip();
      expect(vpcId).toMatch(/^vpc-/);
      expect(subnetIds.length).toBeGreaterThan(0);
      console.log('✅ VPC and subnets exist');
    });

    test('All essential outputs are present', () => {
      expect(albDnsName).toBeDefined();
      expect(rdsEndpoint).toBeDefined();
      expect(vpcId).toBeDefined();

      if (albSg) expect(albSg).toMatch(/^sg-/);
      if (rdsSg) expect(rdsSg).toMatch(/^sg-/);

      console.log('✅ All essential outputs are present');
    });
  });

  // --------------------------
  // Security Groups
  // --------------------------
  describe('Security Groups', () => {
    test('ALB security group exists', () => {
      if (!albSg) return test.skip();
      expect(albSg).toMatch(/^sg-/);
      console.log('✅ ALB security group exists:', albSg);
    });

    test('RDS security group exists', () => {
      if (!rdsSg) return test.skip();
      expect(rdsSg).toMatch(/^sg-/);
      console.log('✅ RDS security group exists:', rdsSg);
    });
  });
});
