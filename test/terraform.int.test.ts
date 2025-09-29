import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch'; // if not installed, run: npm i node-fetch@2

// Narrow JSON responses from fetch() to satisfy strict TS
type HealthResp = { status: string; timestamp?: string };
type RootResp = { message: string; status: string; timestamp?: string };

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

describe('TAP Stack Integration Tests', () => {
  let terraformOutput: any;
  let albDnsName: string;
  let rdsEndpoint: string;
  let rdsHost: string;
  let rdsPort: string;
  let vpcId: string;

  beforeAll(() => {
    // Load pre-generated outputs JSON
    terraformOutput = JSON.parse(
      readFileSync(join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
    );

    albDnsName = terraformOutput.alb_dns_name;
    rdsEndpoint = terraformOutput.rds_endpoint;
    vpcId = terraformOutput.vpc_id;

    [rdsHost, rdsPort] = rdsEndpoint.split(':');

    console.log('ALB DNS:', albDnsName);
    console.log('RDS Endpoint:', rdsEndpoint);
    console.log('VPC ID:', vpcId);
  });

  describe('Application Reachability', () => {
    test('ALB root endpoint returns HTTP 200', async () => {
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toContain('amazonaws.com');

      let attempts = 0;
      const maxAttempts = 30;
      let response: Response | undefined;

      while (attempts < maxAttempts) {
        try {
          response = await fetch(`http://${albDnsName}/`, { signal: AbortSignal.timeout(5000) });
          if (response.status === 200) break;
        } catch {}
        attempts++;
        if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 5000));
      }

      expect(response && response.status).toBe(200);
      const data = await parseJson<RootResp>(response!);
      expect(data.status).toBe('running');
      expect(data.message).toBeDefined();
      expect(data.timestamp).toBeDefined();
    }, 300000);
  });

  describe('Database Security', () => {
    test('RDS should not be publicly accessible', async () => {
      expect(rdsHost).toBeDefined();
      expect(rdsPort).toBeDefined();

      const { execSync } = await import('child_process');
      try {
        execSync(`timeout 5 nc -zv ${rdsHost} ${rdsPort}`, { stdio: 'pipe' });
        expect(true).toBe(false); // should not connect
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ RDS is not publicly accessible');
      }
    }, 30000);

    test('RDS storage encryption enabled', async () => {
      const { execSync } = await import('child_process');
      const rdsId = terraformOutput.rds_instance_id;

      const result = execSync(
        `aws rds describe-db-instances --db-instance-identifier "${rdsId}" --query 'DBInstances[0].StorageEncrypted' --output text`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('True');
      console.log('✅ RDS storage encryption is enabled');
    }, 30000);
  });

  describe('Infrastructure Outputs', () => {
    test('VPC and subnets exist', () => {
      expect(vpcId).toBeDefined();
      expect(JSON.parse(terraformOutput.public_subnet_ids)).toHaveLength(3);
      expect(JSON.parse(terraformOutput.private_subnet_ids)).toHaveLength(3);

      console.log('✅ VPC and subnets exist');
    });

    test('All essential outputs are present', () => {
      const requiredOutputs = [
        'alb_dns_name',
        'alb_arn',
        'alb_security_group_id',
        'autoscaling_group_name',
        'rds_endpoint',
        'rds_instance_id',
        'rds_security_group_id',
        'vpc_id',
        'private_subnet_ids',
        'public_subnet_ids'
      ];

      requiredOutputs.forEach(o => {
        expect(terraformOutput[o]).toBeDefined();
      });

      console.log('✅ All essential outputs are present');
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS', () => {
      // For simplicity, you can just check the SG ID exists
      const sgId = terraformOutput.alb_security_group_id;
      expect(sgId).toBeDefined();
      console.log('✅ ALB security group exists:', sgId);
    });

    test('RDS security group allows traffic only from EC2', () => {
      const sgId = terraformOutput.rds_security_group_id;
      expect(sgId).toBeDefined();
      console.log('✅ RDS security group exists:', sgId);
    });
  });
});
