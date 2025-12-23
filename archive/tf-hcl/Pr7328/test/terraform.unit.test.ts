// Comprehensive unit tests for Terraform multi-region DR infrastructure
// Tests validate configuration structure, resource definitions, and compliance

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read Terraform file content
function readTerraformFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to check if file exists
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

// Helper to run terraform commands
function runTerraformCommand(command: string): string {
  try {
    return execSync(`cd ${LIB_DIR} && ${command}`, {
      encoding: 'utf8',
      env: {
        ...process.env,
        TF_IN_AUTOMATION: '1',
        NO_COLOR: '1', // Disable ANSI color codes for CI/CD compatibility
      },
    });
  } catch (error: any) {
    return error.stdout || error.stderr || '';
  }
}

describe('Terraform Configuration Structure', () => {
  describe('File Existence', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'outputs.tf',
      'locals.tf',
      'vpc-primary.tf',
      'vpc-secondary.tf',
      'vpc-peering.tf',
      'security-groups.tf',
      'aurora-global-database.tf',
      'alb-primary.tf',
      'alb-secondary.tf',
      'ec2-asg-primary.tf',
      'ec2-asg-secondary.tf',
      'route53.tf',
      's3-replication.tf',
      'backup.tf',
      'cloudwatch.tf',
      'iam.tf',
    ];

    test.each(requiredFiles)('%s exists', (filename) => {
      expect(fileExists(filename)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readTerraformFile('provider.tf');
    });

    test('declares AWS provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('configures primary provider with alias', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"primary"/);
    });

    test('configures secondary provider with alias', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"secondary"/);
    });

    test('primary provider uses var.primary_region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.primary_region/);
    });

    test('secondary provider uses var.secondary_region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.secondary_region/);
    });

    test('configures S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test('includes default tags with environment_suffix', () => {
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });

    test('includes default tags with Region', () => {
      expect(providerContent).toMatch(/Region\s*=\s*"(primary|secondary)"/);
    });

    test('includes default tags with DR-Role', () => {
      expect(providerContent).toMatch(/DR-Role\s*=\s*"(primary|secondary)"/);
    });
  });

  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = readTerraformFile('variables.tf');
    });

    test('declares primary_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"primary_region"/);
    });

    test('declares secondary_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"secondary_region"/);
    });

    test('declares environment_suffix variable with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesContent).toMatch(/validation\s*{/);
    });

    test('declares db_master_password as sensitive', () => {
      expect(variablesContent).toMatch(/variable\s+"db_master_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test('declares domain_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"domain_name"/);
    });

    test('declares backup_retention_days variable', () => {
      expect(variablesContent).toMatch(/variable\s+"backup_retention_days"/);
    });
  });

  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = readTerraformFile('outputs.tf');
    });

    test('outputs primary VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"primary_vpc_id"/);
    });

    test('outputs secondary VPC ID', () => {
      expect(outputsContent).toMatch(/output\s+"secondary_vpc_id"/);
    });

    test('outputs Route53 zone ID', () => {
      expect(outputsContent).toMatch(/output\s+"route53_zone_id"/);
    });

    test('outputs primary S3 bucket', () => {
      expect(outputsContent).toMatch(/output\s+"primary_s3_bucket"/);
    });

    test('outputs secondary S3 bucket', () => {
      expect(outputsContent).toMatch(/output\s+"secondary_s3_bucket"/);
    });

    test('marks Aurora endpoints as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"primary_aurora_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('VPC Configuration', () => {
    let vpcPrimaryContent: string;
    let vpcSecondaryContent: string;

    beforeAll(() => {
      vpcPrimaryContent = readTerraformFile('vpc-primary.tf');
      vpcSecondaryContent = readTerraformFile('vpc-secondary.tf');
    });

    test('primary VPC uses environment_suffix in name', () => {
      expect(vpcPrimaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('secondary VPC uses environment_suffix in name', () => {
      expect(vpcSecondaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('primary VPC has at least 2 subnets', () => {
      const subnetMatches = vpcPrimaryContent.match(/resource\s+"aws_subnet"/g);
      expect(subnetMatches).toBeTruthy();
      expect(subnetMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('secondary VPC has at least 2 subnets', () => {
      const subnetMatches = vpcSecondaryContent.match(/resource\s+"aws_subnet"/g);
      expect(subnetMatches).toBeTruthy();
      expect(subnetMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('primary VPC enables DNS support', () => {
      expect(vpcPrimaryContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('secondary VPC enables DNS support', () => {
      expect(vpcSecondaryContent).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  describe('VPC Peering Configuration', () => {
    let peeringContent: string;

    beforeAll(() => {
      peeringContent = readTerraformFile('vpc-peering.tf');
    });

    test('creates VPC peering connection', () => {
      expect(peeringContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);
    });

    test('auto-accepts peering connection', () => {
      expect(peeringContent).toMatch(/auto_accept\s*=\s*true/);
    });

    test('tags peering connection with environment_suffix', () => {
      expect(peeringContent).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('Security Groups Configuration', () => {
    let securityGroupsContent: string;

    beforeAll(() => {
      securityGroupsContent = readTerraformFile('security-groups.tf');
    });

    test('creates primary ALB security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_alb"/);
    });

    test('creates secondary ALB security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_alb"/);
    });

    test('creates primary app security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_app"/);
    });

    test('creates secondary app security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_app"/);
    });

    test('creates primary Aurora security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_aurora"/);
    });

    test('creates secondary Aurora security group', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_aurora"/);
    });

    test('security group names do not start with sg-', () => {
      expect(securityGroupsContent).not.toMatch(/name\s*=\s*"sg-/);
    });

    test('ALB security groups allow HTTP (80)', () => {
      expect(securityGroupsContent).toMatch(/from_port\s*=\s*80/);
    });

    test('ALB security groups allow HTTPS (443)', () => {
      expect(securityGroupsContent).toMatch(/from_port\s*=\s*443/);
    });

    test('Aurora security groups allow PostgreSQL (5432)', () => {
      expect(securityGroupsContent).toMatch(/from_port\s*=\s*5432/);
    });

    test('all security groups use environment_suffix', () => {
      const sgResources = securityGroupsContent.match(/resource\s+"aws_security_group"/g);
      const envSuffixRefs = securityGroupsContent.match(/\$\{var\.environment_suffix\}/g);
      expect(sgResources).toBeTruthy();
      expect(envSuffixRefs).toBeTruthy();
      expect(envSuffixRefs!.length).toBeGreaterThanOrEqual(sgResources!.length);
    });
  });

  describe('Aurora Global Database Configuration', () => {
    let auroraContent: string;

    beforeAll(() => {
      auroraContent = readTerraformFile('aurora-global-database.tf');
    });

    test('creates KMS keys for Aurora encryption', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_primary"/);
      expect(auroraContent).toMatch(/resource\s+"aws_kms_key"\s+"aurora_secondary"/);
    });

    test('KMS keys have rotation enabled', () => {
      expect(auroraContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('creates Aurora global cluster', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_global_cluster"/);
    });

    test('creates primary Aurora cluster', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
    });

    test('creates secondary Aurora cluster', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"secondary"/);
    });

    test('primary cluster has at least 1 instance', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"/);
    });

    test('secondary cluster has at least 1 instance', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"secondary"/);
    });

    test('Aurora clusters use environment_suffix', () => {
      expect(auroraContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('primary cluster specifies subnet group', () => {
      expect(auroraContent).toMatch(/db_subnet_group_name/);
    });

    test('Aurora uses PostgreSQL engine', () => {
      expect(auroraContent).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('enables backup retention', () => {
      expect(auroraContent).toMatch(/backup_retention_period/);
    });

    test('primary cluster uses KMS encryption', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.aurora_primary\.arn/);
    });

    test('secondary cluster uses KMS encryption', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"secondary"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.aurora_secondary\.arn/);
    });

    test('both clusters have storage_encrypted = true', () => {
      const storageEncryptedMatches = auroraContent.match(/storage_encrypted\s*=\s*true/g);
      expect(storageEncryptedMatches).toBeTruthy();
      expect(storageEncryptedMatches!.length).toBeGreaterThanOrEqual(3); // Global cluster + 2 regional clusters
    });
  });

  describe('ALB Configuration', () => {
    let albPrimaryContent: string;
    let albSecondaryContent: string;

    beforeAll(() => {
      albPrimaryContent = readTerraformFile('alb-primary.tf');
      albSecondaryContent = readTerraformFile('alb-secondary.tf');
    });

    test('creates primary ALB', () => {
      expect(albPrimaryContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
    });

    test('creates secondary ALB', () => {
      expect(albSecondaryContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test('primary ALB uses environment_suffix', () => {
      expect(albPrimaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('secondary ALB uses environment_suffix', () => {
      expect(albSecondaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('primary ALB creates target group', () => {
      expect(albPrimaryContent).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test('secondary ALB creates target group', () => {
      expect(albSecondaryContent).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test('primary ALB creates listener', () => {
      expect(albPrimaryContent).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test('secondary ALB creates listener', () => {
      expect(albSecondaryContent).toMatch(/resource\s+"aws_lb_listener"/);
    });
  });

  describe('EC2 Auto Scaling Configuration', () => {
    let asgPrimaryContent: string;
    let asgSecondaryContent: string;

    beforeAll(() => {
      asgPrimaryContent = readTerraformFile('ec2-asg-primary.tf');
      asgSecondaryContent = readTerraformFile('ec2-asg-secondary.tf');
    });

    test('creates primary launch template', () => {
      expect(asgPrimaryContent).toMatch(/resource\s+"aws_launch_template"/);
    });

    test('creates secondary launch template', () => {
      expect(asgSecondaryContent).toMatch(/resource\s+"aws_launch_template"/);
    });

    test('creates primary auto scaling group', () => {
      expect(asgPrimaryContent).toMatch(/resource\s+"aws_autoscaling_group"/);
    });

    test('creates secondary auto scaling group', () => {
      expect(asgSecondaryContent).toMatch(/resource\s+"aws_autoscaling_group"/);
    });

    test('primary ASG has minimum 2 instances', () => {
      expect(asgPrimaryContent).toMatch(/min_size\s*=\s*[2-9]/);
    });

    test('secondary ASG has minimum 2 instances', () => {
      expect(asgSecondaryContent).toMatch(/min_size\s*=\s*[2-9]/);
    });

    test('primary ASG uses environment_suffix', () => {
      expect(asgPrimaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('secondary ASG uses environment_suffix', () => {
      expect(asgSecondaryContent).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('Route53 Configuration', () => {
    let route53Content: string;

    beforeAll(() => {
      route53Content = readTerraformFile('route53.tf');
    });

    test('creates hosted zone', () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_zone"/);
    });

    test('creates health checks', () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"/);
    });

    test('creates failover records', () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"/);
    });

    test('uses failover routing policy', () => {
      expect(route53Content).toMatch(/failover_routing_policy/);
    });

    test('health checks monitor primary and secondary', () => {
      const healthCheckMatches = route53Content.match(/resource\s+"aws_route53_health_check"/g);
      expect(healthCheckMatches).toBeTruthy();
      expect(healthCheckMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('S3 Replication Configuration', () => {
    let s3Content: string;

    beforeAll(() => {
      s3Content = readTerraformFile('s3-replication.tf');
    });

    test('creates primary S3 bucket', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
    });

    test('creates secondary S3 bucket', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary"/);
    });

    test('enables versioning on primary bucket', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
    });

    test('enables versioning on secondary bucket', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/);
    });

    test('configures replication', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
    });

    test('enables RTC (Replication Time Control)', () => {
      expect(s3Content).toMatch(/replication_time/);
    });

    test('S3 buckets use environment_suffix', () => {
      expect(s3Content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('AWS Backup Configuration', () => {
    let backupContent: string;

    beforeAll(() => {
      backupContent = readTerraformFile('backup.tf');
    });

    test('creates primary backup vault', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_vault"\s+"primary"/);
    });

    test('creates secondary backup vault', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_vault"\s+"secondary"/);
    });

    test('creates primary backup plan', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_plan"\s+"primary"/);
    });

    test('creates secondary backup plan', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_plan"\s+"secondary"/);
    });

    test('backup plans use 7-day retention', () => {
      // Check for either hardcoded 7 or var.backup_retention_days (which defaults to 7)
      expect(backupContent).toMatch(/delete_after\s*=\s*(7|var\.backup_retention_days)/);
    });

    test('backup plans copy to secondary region', () => {
      expect(backupContent).toMatch(/copy_action/);
    });

    test('creates backup selections', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_selection"/);
    });
  });

  describe('CloudWatch Configuration', () => {
    let cloudwatchContent: string;

    beforeAll(() => {
      cloudwatchContent = readTerraformFile('cloudwatch.tf');
    });

    test('creates primary CloudWatch dashboard', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"primary"/);
    });

    test('creates secondary CloudWatch dashboard', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"secondary"/);
    });

    test('creates alarms for failover monitoring', () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('dashboards use environment_suffix', () => {
      expect(cloudwatchContent).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe('IAM Configuration', () => {
    let iamContent: string;
    let s3ReplicationContent: string;

    beforeAll(() => {
      iamContent = readTerraformFile('iam.tf');
      s3ReplicationContent = readTerraformFile('s3-replication.tf');
    });

    test('creates S3 replication role', () => {
      // S3 replication role is defined in s3-replication.tf for better organization
      expect(s3ReplicationContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
    });

    test('creates backup role', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"backup_role"/);
    });

    test('creates backup role policy attachments (not managed_policy_arns)', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"backup_service"/);
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"backup_restores"/);
      expect(iamContent).not.toMatch(/managed_policy_arns/);
    });

    test('creates EC2 instance profile', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });

    test('IAM roles have assume role policies', () => {
      const roleMatches = iamContent.match(/resource\s+"aws_iam_role"/g);
      const assumePolicyMatches = iamContent.match(/assume_role_policy/g);
      expect(roleMatches).toBeTruthy();
      expect(assumePolicyMatches).toBeTruthy();
      expect(assumePolicyMatches!.length).toBeGreaterThanOrEqual(roleMatches!.length);
    });
  });

  describe('Locals Configuration', () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = readTerraformFile('locals.tf');
    });

    test('defines common tags', () => {
      expect(localsContent).toMatch(/common_tags/);
    });

    test('common tags include Environment', () => {
      expect(localsContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });

    test('common tags include ManagedBy', () => {
      expect(localsContent).toMatch(/ManagedBy/);
    });
  });

  describe('Resource Tagging', () => {
    const taggedFiles = [
      'vpc-primary.tf',
      'vpc-secondary.tf',
      'security-groups.tf',
      'aurora-global-database.tf',
      'alb-primary.tf',
      'alb-secondary.tf',
      'ec2-asg-primary.tf',
      'ec2-asg-secondary.tf',
      's3-replication.tf',
      'backup.tf',
    ];

    test.each(taggedFiles)('%s includes Environment tag (inline or via common_tags)', (filename) => {
      const content = readTerraformFile(filename);
      // Check for inline Environment tag OR local.common_tags reference (which includes Environment)
      expect(content).toMatch(/Environment|local\.common_tags/);
    });

    test.each(taggedFiles)('%s includes Region tag', (filename) => {
      const content = readTerraformFile(filename);
      expect(content).toMatch(/Region/);
    });

    test.each(taggedFiles)('%s includes DR-Role tag', (filename) => {
      const content = readTerraformFile(filename);
      expect(content).toMatch(/DR-Role/);
    });
  });

  describe('Terraform Validation', () => {
    test('terraform fmt check passes (excluding .tfvars files)', () => {
      // Check formatting for .tf files only (exclude terraform.tfvars)
      const output = runTerraformCommand('terraform fmt -check -recursive -diff=false $(find . -name "*.tf" -not -name "*.tfvars")');
      expect(output.trim()).toBe('');
    });
  });

  describe('No Retain Policies', () => {
    const allTfFiles = fs.readdirSync(LIB_DIR).filter((f) => f.endsWith('.tf'));

    test.each(allTfFiles)('%s does not contain Retain deletion protection', (filename) => {
      const content = readTerraformFile(filename);
      expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
    });
  });

  describe('Environment Suffix Usage', () => {
    const resourceFiles = [
      'vpc-primary.tf',
      'vpc-secondary.tf',
      'security-groups.tf',
      'aurora-global-database.tf',
      'alb-primary.tf',
      'alb-secondary.tf',
      'ec2-asg-primary.tf',
      'ec2-asg-secondary.tf',
      's3-replication.tf',
      'backup.tf',
      'cloudwatch.tf',
    ];

    test.each(resourceFiles)('%s uses environment_suffix for resource naming', (filename) => {
      const content = readTerraformFile(filename);
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });
});
