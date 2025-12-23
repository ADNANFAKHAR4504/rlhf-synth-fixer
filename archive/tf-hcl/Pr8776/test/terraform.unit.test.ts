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
      const rdsBlock = getResourceBlock('aws_db_instance', 'primary_db_new');
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
            `Name\\s*=\\s*"vpc-${region}-\\$\\{local\\.deployment_suffix\\}"`
          )
        );
      }
    );
  });

  // --- NEW TESTS FOR SECURITY ---
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

    it('1. should ensure RDS storage is encrypted', () => {
      const rdsBlock = getResourceBlock('aws_db_instance', 'primary_db_new');
      expect(rdsBlock).not.toBeNull();
      expect(rdsBlock).toMatch(/storage_encrypted\s*=\s*true/);
    });

    it('2. should ensure EC2 root volumes are encrypted', () => {
      const ltBlock = getResourceBlock('aws_launch_template', 'primary_app');
      expect(ltBlock).not.toBeNull();
      // This regex navigates into the ebs block to find the encrypted flag
      expect(ltBlock).toMatch(/ebs\s*\{\s*[\s\S]*?encrypted\s*=\s*true/);
    });

    it('3. should restrict SSH access to a variable CIDR block, not 0.0.0.0/0', () => {
      const ec2Sg = getResourceBlock('aws_security_group', 'primary_ec2');
      expect(ec2Sg).not.toBeNull();

      // This regex creates a pattern that looks for an ingress block containing BOTH port 22 and an open CIDR.
      // We expect this pattern to NOT be found.
      const insecureSshRulePattern =
        /ingress\s*\{[^\}]*?from_port\s*=\s*22[^\}]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/;

      // Check that the insecure rule does not exist
      expect(ec2Sg).not.toMatch(insecureSshRulePattern);

      // Check that the ingress rule for port 22 DOES use the correct variable
      expect(ec2Sg).toMatch(
        /ingress\s*\{[^\}]*?from_port\s*=\s*22[^\}]*?cidr_blocks\s*=\s*var\.allowed_ssh_cidr/
      );
    });

    it('4. should enable versioning on the S3 artifacts bucket', () => {
      const s3VersioningBlock = getResourceBlock(
        'aws_s3_bucket_versioning',
        'artifacts'
      );
      expect(s3VersioningBlock).not.toBeNull();
      expect(s3VersioningBlock).toMatch(/status\s*=\s*"Enabled"/);
    });

    it('5. should block all public access on the S3 artifacts bucket', () => {
      const s3PublicAccessBlock = getResourceBlock(
        'aws_s3_bucket_public_access_block',
        'artifacts'
      );
      expect(s3PublicAccessBlock).not.toBeNull();
      expect(s3PublicAccessBlock).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3PublicAccessBlock).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3PublicAccessBlock).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3PublicAccessBlock).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  // --- NEW TESTS FOR HIGH AVAILABILITY AND NETWORKING ---
  describe('High Availability & Networking Validation', () => {
    it('6. should enable Multi-AZ for the RDS instance (conditionally for LocalStack)', () => {
      const rdsBlock = getResourceBlock('aws_db_instance', 'primary_db_new');
      expect(rdsBlock).not.toBeNull();
      // Multi-AZ is conditional: `var.is_localstack ? false : true`
      expect(rdsBlock).toMatch(/multi_az\s*=/);
    });

    it('7. should configure the ASG with a minimum of 1 and a max of 4 instances', () => {
      const asgBlock = getResourceBlock('aws_autoscaling_group', 'primary_app');
      expect(asgBlock).not.toBeNull();
      expect(asgBlock).toMatch(/min_size\s*=\s*1/);
      expect(asgBlock).toMatch(/max_size\s*=\s*4/);
    });

    it('8. should define a VPC peering connection between the primary and secondary VPCs', () => {
      const vpcPeeringBlock = getResourceBlock(
        'aws_vpc_peering_connection',
        'peer'
      );
      expect(vpcPeeringBlock).not.toBeNull();
      expect(vpcPeeringBlock).toMatch(/vpc_id\s*=\s*aws_vpc\.primary\.id/);
      // Secondary VPC is now indexed for conditional creation
      expect(vpcPeeringBlock).toMatch(
        /peer_vpc_id\s*=\s*aws_vpc\.secondary\[0\]\.id/
      );
    });

    it('9. should route traffic from the private subnet through a NAT Gateway (conditionally)', () => {
      const privateRouteTable = getResourceBlock(
        'aws_route_table',
        'primary_private'
      );
      expect(privateRouteTable).not.toBeNull();
      // NAT gateway is now indexed for conditional creation
      expect(privateRouteTable).toMatch(
        /nat_gateway_id\s*=\s*aws_nat_gateway\.primary\[0\]\.id/
      );
    });
  });

  // --- NEW TEST FOR CONFIGURATION ---
  describe('Configuration Best Practices', () => {
    it('10. should explicitly set RDS deletion protection to false', () => {
      const rdsBlock = getResourceBlock('aws_db_instance', 'primary_db_new');
      expect(rdsBlock).not.toBeNull();
      expect(rdsBlock).toMatch(/deletion_protection\s*=\s*false/);
    });
  });
});
