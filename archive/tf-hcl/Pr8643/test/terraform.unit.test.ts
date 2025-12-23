// tests/terraform.unit.test.ts
// Comprehensive unit tests for Terraform multi-environment infrastructure

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const STACK_FILE = path.join(LIB_DIR, 'tap_stack.tf');
const PROVIDER_FILE = path.join(LIB_DIR, 'provider.tf');
const VARIABLES_FILE = path.join(LIB_DIR, 'variables.tf');
const DEV_TFVARS = path.join(LIB_DIR, 'dev.tfvars');
const STAGING_TFVARS = path.join(LIB_DIR, 'staging.tfvars');
const PROD_TFVARS = path.join(LIB_DIR, 'prod.tfvars');

describe('Terraform Multi-Environment Infrastructure - Unit Tests', () => {
  describe('File Structure Validation', () => {
    test('tap_stack.tf file exists', () => {
      expect(fs.existsSync(STACK_FILE)).toBe(true);
    });

    test('provider.tf file exists', () => {
      expect(fs.existsSync(PROVIDER_FILE)).toBe(true);
    });

    test('variables.tf file exists', () => {
      expect(fs.existsSync(VARIABLES_FILE)).toBe(true);
    });

    test('dev.tfvars file exists', () => {
      expect(fs.existsSync(DEV_TFVARS)).toBe(true);
    });

    test('staging.tfvars file exists', () => {
      expect(fs.existsSync(STAGING_TFVARS)).toBe(true);
    });

    test('prod.tfvars file exists', () => {
      expect(fs.existsSync(PROD_TFVARS)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_FILE, 'utf8');
    });

    test('declares AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('specifies required Terraform version', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('specifies required AWS provider version', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('uses region variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures default tags', () => {
      expect(providerContent).toMatch(/default_tags\s*\{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(providerContent).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(VARIABLES_FILE, 'utf8');
    });

    test('declares environment variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*\{/);
    });

    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test('declares vpc_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
    });

    test('declares instance_type variable', () => {
      expect(variablesContent).toMatch(/variable\s+"instance_type"\s*\{/);
    });

    test('declares db_instance_class variable', () => {
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*\{/);
    });

    test('declares db_password variable as sensitive', () => {
      const dbPasswordBlock = variablesContent.match(
        /variable\s+"db_password"\s*\{[^}]*\}/s
      );
      expect(dbPasswordBlock).toBeTruthy();
      expect(dbPasswordBlock![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test('declares Auto Scaling variables', () => {
      expect(variablesContent).toMatch(/variable\s+"asg_min_size"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"asg_max_size"\s*\{/);
      expect(variablesContent).toMatch(/variable\s+"asg_desired_capacity"\s*\{/);
    });
  });

  describe('Infrastructure Stack Resources', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, 'utf8');
    });

    test('does NOT declare provider in stack file', () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*\{/);
    });

    test('declares VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
    });

    test('declares Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*\{/);
    });

    test('declares public subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*\{/);
      expect(stackContent).toMatch(/count\s*=\s*var\.az_count/);
    });

    test('declares private subnets with count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*\{/);
      const privateSubnetBlock = stackContent.match(
        /resource\s+"aws_subnet"\s+"private"\s*\{[^}]*count[^}]*\}/s
      );
      expect(privateSubnetBlock).toBeTruthy();
    });

    test('declares NAT Gateway with conditional count', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*\{/);
      expect(stackContent).toMatch(/count\s*=\s*var\.enable_nat_gateway\s*\?\s*var\.az_count\s*:\s*0/);
    });

    test('declares Elastic IPs for NAT', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*\{/);
    });

    test('declares route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*\{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*\{/);
    });

    test('declares security group for ALB', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*\{/);
    });

    test('declares security group for EC2', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*\{/);
    });

    test('declares security group for RDS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*\{/);
    });

    test('declares IAM role for EC2', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*\{/);
    });

    test('declares IAM role policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"\s*\{/);
    });

    test('declares IAM instance profile', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*\{/);
    });

    test('declares Application Load Balancer', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*\{/);
    });

    test('declares target group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*\{/);
    });

    test('declares ALB listener', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*\{/);
    });

    test('declares launch template', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*\{/);
    });

    test('declares Auto Scaling Group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*\{/);
    });

    test('declares RDS subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*\{/);
    });

    test('declares RDS instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*\{/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test('declares S3 bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app"\s*\{/);
    });

    test('declares S3 bucket versioning', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app"\s*\{/);
    });

    test('declares S3 lifecycle configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"app"\s*\{/);
    });

    test('declares CloudWatch log group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"\s*\{/);
    });

    test('uses data source for availability zones', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*\{/);
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, 'utf8');
    });

    test('VPC name includes environment and suffix', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });

    test('IGW name includes environment and suffix', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"igw-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });

    test('ALB name includes environment and suffix', () => {
      expect(stackContent).toMatch(/name\s*=\s*"alb-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });

    test('RDS identifier includes environment and suffix', () => {
      expect(stackContent).toMatch(/identifier\s*=\s*"rds-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });

    test('S3 bucket name includes environment and suffix', () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"app-storage-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });

    test('Security groups include environment and suffix', () => {
      expect(stackContent).toMatch(/name\s*=\s*"alb-sg-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/name\s*=\s*"ec2-sg-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/name\s*=\s*"rds-sg-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Security Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, 'utf8');
    });

    test('RDS has deletion_protection disabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('RDS has skip_final_snapshot enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('ALB has deletion_protection disabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('RDS is not publicly accessible', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('ALB security group allows HTTP', () => {
      const albSgBlock = stackContent.match(
        /resource\s+"aws_security_group"\s+"alb"\s*\{[\s\S]*?ingress\s*\{[\s\S]*?from_port\s*=\s*80[\s\S]*?\}/
      );
      expect(albSgBlock).toBeTruthy();
    });

    test('EC2 security group restricts SSH access', () => {
      const ec2SgBlock = stackContent.match(
        /resource\s+"aws_security_group"\s+"ec2"\s*\{[\s\S]*?ingress\s*\{[\s\S]*?from_port\s*=\s*22[\s\S]*?\}/
      );
      expect(ec2SgBlock).toBeTruthy();
      expect(ec2SgBlock![0]).toMatch(/var\.ssh_cidr_blocks/);
    });

    test('RDS security group allows MySQL from EC2', () => {
      const rdsSgBlock = stackContent.match(
        /resource\s+"aws_security_group"\s+"rds"\s*\{[\s\S]*?ingress\s*\{[\s\S]*?from_port\s*=\s*3306[\s\S]*?\}/
      );
      expect(rdsSgBlock).toBeTruthy();
    });
  });

  describe('Outputs Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, 'utf8');
    });

    test('outputs VPC ID', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*\{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test('outputs ALB DNS name', () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*\{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    });

    test('outputs RDS endpoint', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*\{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    });

    test('outputs S3 bucket name', () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*\{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.app\.id/);
    });
  });

  describe('Environment-Specific Configuration - dev.tfvars', () => {
    let devContent: string;

    beforeAll(() => {
      devContent = fs.readFileSync(DEV_TFVARS, 'utf8');
    });

    test('sets environment to dev', () => {
      expect(devContent).toMatch(/environment\s*=\s*"dev"/);
    });

    test('sets environment_suffix', () => {
      expect(devContent).toMatch(/environment_suffix\s*=\s*"[^"]+"/);
    });

    test('specifies instance_type', () => {
      expect(devContent).toMatch(/instance_type\s*=\s*"t3\./);
    });

    test('specifies AMI ID', () => {
      expect(devContent).toMatch(/ami_id\s*=\s*"ami-[a-f0-9]+"/);
    });

    test('specifies db_instance_class', () => {
      expect(devContent).toMatch(/db_instance_class\s*=\s*"db\.t3\./);
    });

    test('specifies db_password', () => {
      expect(devContent).toMatch(/db_password\s*=\s*"[^"]+"/);
    });

    test('configures Auto Scaling parameters', () => {
      expect(devContent).toMatch(/asg_min_size\s*=\s*\d+/);
      expect(devContent).toMatch(/asg_max_size\s*=\s*\d+/);
      expect(devContent).toMatch(/asg_desired_capacity\s*=\s*\d+/);
    });

    test('configures NAT Gateway', () => {
      expect(devContent).toMatch(/enable_nat_gateway\s*=\s*(true|false)/);
    });
  });

  describe('Environment-Specific Configuration - staging.tfvars', () => {
    let stagingContent: string;

    beforeAll(() => {
      stagingContent = fs.readFileSync(STAGING_TFVARS, 'utf8');
    });

    test('sets environment to staging', () => {
      expect(stagingContent).toMatch(/environment\s*=\s*"staging"/);
    });

    test('sets environment_suffix', () => {
      expect(stagingContent).toMatch(/environment_suffix\s*=\s*"[^"]+"/);
    });

    test('specifies instance_type', () => {
      expect(stagingContent).toMatch(/instance_type\s*=\s*"t3\./);
    });

    test('specifies AMI ID', () => {
      expect(stagingContent).toMatch(/ami_id\s*=\s*"ami-[a-f0-9]+"/);
    });

    test('specifies db_password', () => {
      expect(stagingContent).toMatch(/db_password\s*=\s*"[^"]+"/);
    });
  });

  describe('Environment-Specific Configuration - prod.tfvars', () => {
    let prodContent: string;

    beforeAll(() => {
      prodContent = fs.readFileSync(PROD_TFVARS, 'utf8');
    });

    test('sets environment to prod', () => {
      expect(prodContent).toMatch(/environment\s*=\s*"prod"/);
    });

    test('sets environment_suffix', () => {
      expect(prodContent).toMatch(/environment_suffix\s*=\s*"[^"]+"/);
    });

    test('specifies instance_type', () => {
      expect(prodContent).toMatch(/instance_type\s*=\s*"t3\./);
    });

    test('specifies AMI ID', () => {
      expect(prodContent).toMatch(/ami_id\s*=\s*"ami-[a-f0-9]+"/);
    });

    test('specifies db_password', () => {
      expect(prodContent).toMatch(/db_password\s*=\s*"[^"]+"/);
    });

    test('configures higher capacity than dev', () => {
      expect(prodContent).toMatch(/asg_min_size\s*=\s*[2-9]/);
    });
  });

  describe('Multi-Environment Consistency', () => {
    let devContent: string;
    let stagingContent: string;
    let prodContent: string;

    beforeAll(() => {
      devContent = fs.readFileSync(DEV_TFVARS, 'utf8');
      stagingContent = fs.readFileSync(STAGING_TFVARS, 'utf8');
      prodContent = fs.readFileSync(PROD_TFVARS, 'utf8');
    });

    test('all environments have consistent variable names', () => {
      const requiredVars = [
        'environment',
        'environment_suffix',
        'instance_type',
        'db_instance_class',
        'asg_min_size',
      ];

      requiredVars.forEach((varName) => {
        expect(devContent).toMatch(new RegExp(`${varName}\\s*=`));
        expect(stagingContent).toMatch(new RegExp(`${varName}\\s*=`));
        expect(prodContent).toMatch(new RegExp(`${varName}\\s*=`));
      });
    });

    test('environments use different VPC CIDR blocks', () => {
      const devCidr = devContent.match(/vpc_cidr\s*=\s*"([^"]+)"/);
      const stagingCidr = stagingContent.match(/vpc_cidr\s*=\s*"([^"]+)"/);
      const prodCidr = prodContent.match(/vpc_cidr\s*=\s*"([^"]+)"/);

      expect(devCidr).toBeTruthy();
      expect(stagingCidr).toBeTruthy();
      expect(prodCidr).toBeTruthy();

      // Ensure they're different
      expect(devCidr![1]).not.toBe(stagingCidr![1]);
      expect(stagingCidr![1]).not.toBe(prodCidr![1]);
    });

    test('environments have unique suffixes', () => {
      const devSuffix = devContent.match(/environment_suffix\s*=\s*"([^"]+)"/);
      const stagingSuffix = stagingContent.match(/environment_suffix\s*=\s*"([^"]+)"/);
      const prodSuffix = prodContent.match(/environment_suffix\s*=\s*"([^"]+)"/);

      expect(devSuffix![1]).not.toBe(stagingSuffix![1]);
      expect(stagingSuffix![1]).not.toBe(prodSuffix![1]);
    });
  });

  describe('IAM Configuration', () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, 'utf8');
    });

    test('IAM role has AssumeRole policy for EC2', () => {
      const iamRoleBlock = stackContent.match(
        /resource\s+"aws_iam_role"\s+"ec2"\s*\{[\s\S]*?assume_role_policy[\s\S]*?\}/
      );
      expect(iamRoleBlock).toBeTruthy();
      expect(iamRoleBlock![0]).toMatch(/AssumeRole/);
      expect(iamRoleBlock![0]).toMatch(/ec2\.amazonaws\.com/);
    });

    test('IAM policy allows CloudWatch logs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test('IAM policy allows S3 access', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });
  });
});
