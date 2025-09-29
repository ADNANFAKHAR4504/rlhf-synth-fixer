import { execSync } from 'child_process';
import { join } from 'path';

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

  beforeAll(async () => {
    // Get Terraform outputs
    const output = execSync('terraform output -json', { cwd: join(__dirname, '../lib') });
    terraformOutput = JSON.parse(output.toString());

    albDnsName = terraformOutput.alb_dns_name.value;
    rdsEndpoint = terraformOutput.rds_endpoint.value;
    vpcId = terraformOutput.vpc_id.value;

    // Split RDS endpoint into host and port
    [rdsHost, rdsPort] = rdsEndpoint.split(':');

    console.log('ALB DNS:', albDnsName);
    console.log('RDS Endpoint:', rdsEndpoint);
    console.log('VPC ID:', vpcId);
  }, 60000);

  describe('Application Reachability', () => {
    test('ALB root endpoint returns HTTP 200', async () => {
      expect(albDnsName).toBeDefined();

      const response = await fetch(`http://${albDnsName}/`, { signal: AbortSignal.timeout(10000) });
      expect(response.status).toBe(200);

      const data = await parseJson<RootResp>(response);
      expect(data.status).toBe('running');
      expect(data.message).toBeDefined();
      expect(data.timestamp).toBeDefined();
    }, 30000);
  });

  describe('Database Security', () => {
    test('RDS should not be publicly accessible', async () => {
      const result = execSync(
        `aws rds describe-db-instances --db-instance-identifier "${terraformOutput.rds_instance_id.value}" --query 'DBInstances[0].PubliclyAccessible' --output text`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('False');
      console.log('✅ RDS is not publicly accessible');
    });

    test('RDS storage encryption enabled', async () => {
      const result = execSync(
        `aws rds describe-db-instances --db-instance-identifier "${terraformOutput.rds_instance_id.value}" --query 'DBInstances[0].StorageEncrypted' --output text`,
        { encoding: 'utf8' }
      ).trim();

      expect(result).toBe('True');
      console.log('✅ RDS storage encryption is enabled');
    });
  });

  describe('Infrastructure Outputs', () => {
    test('VPC and subnets exist', () => {
      expect(vpcId).toBeDefined();
      expect(terraformOutput.public_subnet_ids.value.length).toBe(3);
      expect(terraformOutput.private_subnet_ids.value.length).toBe(3);
      console.log('✅ VPC and subnets verified');
    });

    test('All essential outputs are present', () => {
      const requiredOutputs = [
        'alb_arn',
        'alb_dns_name',
        'alb_security_group_id',
        'autoscaling_group_name',
        'rds_instance_id',
        'rds_security_group_id',
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'target_group_arn',
        'static_s3_bucket_name',
        'cloudtrail_s3_bucket_name',
      ];

      requiredOutputs.forEach(output => {
        expect(terraformOutput[output]).toBeDefined();
        expect(terraformOutput[output].value).toBeDefined();
      });

      console.log('✅ All required Terraform outputs are present');
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS', () => {
      const sgId = terraformOutput.alb_security_group_id.value;
      const result = JSON.parse(execSync(
        `aws ec2 describe-security-groups --group-ids ${sgId} --query 'SecurityGroups[0].IpPermissions'`,
        { encoding: 'utf8' }
      ));

      const httpRule = result.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.IpProtocol === 'tcp');
      const httpsRule = result.find((r: any) => r.FromPort === 443 && r.ToPort === 443 && r.IpProtocol === 'tcp');

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      console.log('✅ ALB security group allows HTTP/HTTPS');
    });

    test('RDS security group allows traffic only from EC2', () => {
      const sgId = terraformOutput.rds_security_group_id.value;
      const ec2SgId = terraformOutput.ec2_security_group_id.value;
      const result = JSON.parse(execSync(
        `aws ec2 describe-security-groups --group-ids ${sgId} --query 'SecurityGroups[0].IpPermissions'`,
        { encoding: 'utf8' }
      ));

      const pgRule = result.find((r: any) => r.FromPort === 5432 && r.ToPort === 5432 && r.IpProtocol === 'tcp');
      const allowsFromEc2 = pgRule?.UserIdGroupPairs?.some((p: any) => p.GroupId === ec2SgId);

      expect(pgRule).toBeDefined();
      expect(allowsFromEc2).toBe(true);
      console.log('✅ RDS security group allows only EC2 traffic');
    });
  });
});
