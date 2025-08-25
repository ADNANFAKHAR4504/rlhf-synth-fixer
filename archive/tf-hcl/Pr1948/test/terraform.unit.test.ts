import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const libPath = path.resolve(__dirname, '../lib');
const providerPath = path.join(libPath, 'provider.tf');
const tapStackPath = path.join(libPath, 'tap_stack.tf');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('File Structure Tests', () => {
    test('provider.tf exists', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
    });
  });

  describe('Provider Configuration Tests', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, 'utf8');
    });

    test('provider.tf contains terraform block', () => {
      expect(providerContent).toMatch(/terraform\s*{/);
    });

    test('provider.tf requires Terraform version >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('provider.tf includes AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf includes required providers', () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/random\s*=\s*{/);
      expect(providerContent).toMatch(/tls\s*=\s*{/);
    });
  });

  describe('Main Stack Configuration Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('defines aws_region variable', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('defines environment variable', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test('defines environment_suffix variable', () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('defines vpc_cidr variable', () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test('defines availability_zones variable', () => {
      expect(stackContent).toMatch(/variable\s+"availability_zones"\s*{/);
    });

    test('contains locals block for common tags', () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
    });

    test('contains environment_suffix in locals', () => {
      expect(stackContent).toMatch(/environment_suffix\s*=/);
    });
  });

  describe('Networking Resources Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('creates VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test('creates Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('creates public subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('creates private subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      const privateSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetMatch?.[0]).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('creates NAT Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test('creates Elastic IP for NAT', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test('creates route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test('creates route table associations', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe('Security Resources Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('creates ALB security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    });

    test('ALB security group allows HTTPS (443) ingress', () => {
      const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?ingress\s*{[\s\S]*?}/);
      expect(albSgMatch?.[0]).toMatch(/from_port\s*=\s*443/);
      expect(albSgMatch?.[0]).toMatch(/to_port\s*=\s*443/);
    });

    test('creates EC2 security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test('EC2 security group restricts ingress to ALB only', () => {
      const ec2SgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?ingress\s*{[\s\S]*?}/);
      expect(ec2SgMatch?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('creates IAM role for EC2', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test('creates S3 read policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_read_policy"\s*{/);
    });

    test('S3 policy includes ListBucket permission', () => {
      const policyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"s3_read_policy"\s*{[\s\S]*?policy\s*=[\s\S]*?}\)/);
      expect(policyMatch?.[0]).toMatch(/"s3:ListBucket"/);
    });

    test('creates MFA enforcement policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_policy"\s*{/);
    });

    test('creates EC2 instance profile', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
    });
  });

  describe('Compute Resources Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('creates EC2 instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"\s*{/);
    });

    test('EC2 instance has monitoring enabled', () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?}/);
      expect(ec2Match?.[0]).toMatch(/monitoring\s*=\s*true/);
    });

    test('EC2 instance uses user_data_base64', () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?}/);
      expect(ec2Match?.[0]).toMatch(/user_data_base64\s*=\s*base64encode/);
      expect(ec2Match?.[0]).not.toMatch(/user_data\s*=\s*base64encode/); // Should not use old format
    });

    test('EC2 instance placed in private subnet', () => {
      const ec2Match = stackContent.match(/resource\s+"aws_instance"\s+"main"\s*{[\s\S]*?}/);
      expect(ec2Match?.[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[0\]\.id/);
    });

    test('creates Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    });

    test('ALB uses multiple subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('creates target group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
    });

    test('creates HTTPS listener', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"\s*{/);
    });

    test('HTTPS listener uses TLS 1.2 policy', () => {
      const listenerMatch = stackContent.match(/resource\s+"aws_lb_listener"\s+"https"\s*{[\s\S]*?}/);
      expect(listenerMatch?.[0]).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2/);
    });

    test('creates self-signed certificate for demo', () => {
      expect(stackContent).toMatch(/resource\s+"tls_self_signed_cert"\s+"example"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"example"\s*{/);
    });
  });

  describe('Storage Resources Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('creates private S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"private"\s*{/);
    });

    test('private S3 bucket has force_destroy enabled', () => {
      expect(stackContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test('creates public access block for private bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"private"\s*{/);
    });

    test('public access block blocks all public access', () => {
      const blockMatch = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"private"\s*{[\s\S]*?}/);
      expect(blockMatch?.[0]).toMatch(/block_public_acls\s*=\s*true/);
      expect(blockMatch?.[0]).toMatch(/block_public_policy\s*=\s*true/);
      expect(blockMatch?.[0]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(blockMatch?.[0]).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('creates server-side encryption for private bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"private"\s*{/);
    });

    test('encryption uses AES256 algorithm', () => {
      const encryptionMatch = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"private"\s*{[\s\S]*?}/);
      expect(encryptionMatch?.[0]).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('creates CloudTrail S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"\s*{/);
    });

    test('creates CloudTrail bucket policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"\s*{/);
    });

    test('creates CloudTrail resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    });
  });

  describe('Outputs Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('outputs VPC ID', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test('outputs ALB DNS name', () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test('outputs S3 bucket ID', () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_id"\s*{/);
    });

    test('outputs private subnet IDs', () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test('outputs public subnet IDs', () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    });

    test('outputs EC2 instance ID', () => {
      expect(stackContent).toMatch(/output\s+"ec2_instance_id"\s*{/);
    });

    test('outputs CloudTrail bucket name', () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_bucket_name"\s*{/);
    });

    test('outputs NAT Gateway IP', () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_ip"\s*{/);
    });
  });

  describe('Resource Naming Convention Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('resources use environment_suffix in naming', () => {
      expect(stackContent).toMatch(/\$\{local\.environment_suffix\}/);
      // Verify multiple resources use the suffix pattern
      expect(stackContent).toMatch(/name\s*=\s*"[^"]*-\$\{local\.environment_suffix\}"/);
    });

    test('environment_suffix variable has correct default', () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=\s*"pr1948"/);
    });

    test('all resources have tags', () => {
      const resourceMatches = stackContent.match(/resource\s+"aws_[^"]+"\s+"[^"]+"\s*{[\s\S]*?tags\s*=/g);
      expect(resourceMatches?.length).toBeGreaterThan(10);
    });

    test('tags include common_tags', () => {
      const tagMatches = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(tagMatches?.length).toBeGreaterThan(10);
    });
  });

  describe('Configuration Syntax Tests', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, 'utf8');
    });

    test('HCL syntax is valid', () => {
      // Check that files contain valid HCL syntax patterns
      expect(stackContent).toMatch(/resource\s+"[\w_]+"[\s\S]*?\{/);
      expect(stackContent).toMatch(/variable\s+"[\w_]+"[\s\S]*?\{/);
      expect(stackContent).toMatch(/output\s+"[\w_]+"[\s\S]*?\{/);
      expect(stackContent).toMatch(/locals\s*\{/);
    });

    test('No syntax errors in configuration', () => {
      // Check for common syntax issues
      expect(stackContent).not.toMatch(/\{\s*\{/); // Double opening braces on same line
      expect(stackContent).not.toMatch(/=\s*=+/); // Multiple equals signs
      expect(stackContent).not.toMatch(/resource\s+""\s*\{/); // Empty resource type
      expect(stackContent).not.toMatch(/\[\s*\[/); // Double opening brackets
    });
  });
});
