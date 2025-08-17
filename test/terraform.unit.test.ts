import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Region Terraform Configuration: ../lib/tap_stack.tf', () => {
  let mainTfContent: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../lib/tap_stack.tf');
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Test setup failed: tap_stack.tf not found at ${filePath}`
      );
    }
    mainTfContent = fs.readFileSync(filePath, 'utf8');
  });

  const getResourceBlock = (
    resourceType: string,
    resourceName: string
  ): string | null => {
    const regex = new RegExp(
      `resource\\s+"${resourceType}"\\s+"${resourceName}"\\s+\\{[\\s\\S]*?\\n\\}`,
      'm'
    );
    const match = mainTfContent.match(regex);
    return match ? match[0] : null;
  };

  it('should successfully read the tap_stack.tf file', () => {
    expect(mainTfContent).not.toBeNull();
    expect(mainTfContent.length).toBeGreaterThan(0);
  });

  describe('Self-Contained Stack Validation', () => {
    it('should generate a random password for the database', () => {
      const randomBlock = getResourceBlock('random_password', 'db_password');
      expect(randomBlock).not.toBeNull();
      expect(randomBlock).toMatch(/length\s*=\s*16/);
    });

    it('should not contain a variable for the db_password', () => {
      expect(mainTfContent).not.toMatch(/variable "db_password"/);
    });

    it('should use the generated password in the RDS instance', () => {
      const rdsBlock = getResourceBlock('aws_db_instance', 'primary_db');
      expect(rdsBlock).not.toBeNull();
      expect(rdsBlock).toMatch(
        /password\s*=\s*random_password\.db_password\.result/
      );
    });
  });

  describe('Per-Region Resource Validation', () => {
    test.each([
      { region: 'primary', provider: 'aws.primary' },
      { region: 'secondary', provider: 'aws.secondary' },
    ])(
      'should have a correctly configured VPC for the $region region',
      ({ region, provider }) => {
        const vpcBlock = getResourceBlock('aws_vpc', region);
        expect(vpcBlock).not.toBeNull();
        expect(vpcBlock).toMatch(new RegExp(`provider\\s*=\\s*${provider}`));
        expect(vpcBlock).toMatch(
          new RegExp(
            `Name\\s*=\\s*"vpc-${region}-\\$\\{local\\.deployment_id\\}"`
          )
        );
      }
    );
  });

  describe('Security Validation', () => {
    it('should define IAM roles with the correct suffix', () => {
      const ec2RoleBlock = getResourceBlock('aws_iam_role', 'ec2_role');
      expect(ec2RoleBlock).not.toBeNull();
      expect(ec2RoleBlock).toMatch(/name_prefix\s*=\s*"iam-role-ec2-nova-"/);

      const lambdaRoleBlock = getResourceBlock('aws_iam_role', 'lambda_role');
      expect(lambdaRoleBlock).not.toBeNull();
      expect(lambdaRoleBlock).toMatch(
        /name_prefix\s*=\s*"iam-role-lambda-cost-saver-"/
      );
    });

    it('should define security groups with the correct name (no sg- prefix)', () => {
      const albSg = getResourceBlock('aws_security_group', 'primary_alb');
      expect(albSg).not.toBeNull();
      expect(albSg).toMatch(/name_prefix\s*=\s*"alb-primary-"/);

      const ec2Sg = getResourceBlock('aws_security_group', 'primary_ec2');
      expect(ec2Sg).not.toBeNull();
      expect(ec2Sg).toMatch(/name_prefix\s*=\s*"ec2-primary-"/);
    });
  });

  describe('Terraform Outputs', () => {
    it('should define all required outputs', () => {
      const outputs = [
        'primary_alb_dns',
        'secondary_alb_dns',
        'rds_endpoint',
        's3_bucket_name',
        'application_url',
      ];
      outputs.forEach(outputName => {
        expect(mainTfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });
});
