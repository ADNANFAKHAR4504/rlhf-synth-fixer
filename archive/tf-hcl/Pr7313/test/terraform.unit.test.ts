/**
 * Unit tests for Terraform loan processing application infrastructure.
 * 
 * This test suite validates the Terraform configuration without deploying resources.
 * Tests cover:
 * - Configuration syntax and structure
 * - Resource naming conventions with environment_suffix
 * - Security configurations
 * - Resource tagging
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load all Terraform files
const libDir = join(__dirname, '../lib');
const loadTerraformFile = (filename: string): string => {
  const filepath = join(libDir, filename);
  return existsSync(filepath) ? readFileSync(filepath, 'utf-8') : '';
};

// Load all .tf files
const tfFiles: Record<string, string> = {
  'main.tf': loadTerraformFile('main.tf'),
  'variables.tf': loadTerraformFile('variables.tf'),
  'outputs.tf': loadTerraformFile('outputs.tf'),
  'vpc.tf': loadTerraformFile('vpc.tf'),
  'security-groups.tf': loadTerraformFile('security-groups.tf'),
  'iam.tf': loadTerraformFile('iam.tf'),
  'rds.tf': loadTerraformFile('rds.tf'),
  's3.tf': loadTerraformFile('s3.tf'),
  'alb.tf': loadTerraformFile('alb.tf'),
  'asg.tf': loadTerraformFile('asg.tf'),
  'cloudfront.tf': loadTerraformFile('cloudfront.tf'),
  'waf.tf': loadTerraformFile('waf.tf'),
  'cloudwatch.tf': loadTerraformFile('cloudwatch.tf'),
  'eventbridge.tf': loadTerraformFile('eventbridge.tf'),
  'kms.tf': loadTerraformFile('kms.tf'),
  'acm.tf': loadTerraformFile('acm.tf')
};

describe('Terraform Infrastructure Unit Tests', () => {
  
  describe('Configuration Files', () => {
    test('should have all required Terraform files', () => {
      const requiredFiles = [
        'main.tf', 'variables.tf', 'outputs.tf', 'vpc.tf', 
        'security-groups.tf', 'iam.tf', 'rds.tf', 's3.tf', 
        'alb.tf', 'asg.tf', 'cloudfront.tf', 'waf.tf', 
        'cloudwatch.tf', 'eventbridge.tf', 'kms.tf'
      ];
      
      requiredFiles.forEach(file => {
        expect(tfFiles[file]).toBeTruthy();
        expect(tfFiles[file].length).toBeGreaterThan(0);
      });
    });

    test('should have terraform.tfvars file', () => {
      const tfvarsPath = join(libDir, 'terraform.tfvars');
      expect(existsSync(tfvarsPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider', () => {
      expect(tfFiles['main.tf']).toMatch(/provider\s+"aws"/);
    });

    test('should configure random provider', () => {
      expect(tfFiles['main.tf']).toMatch(/provider\s+"random"|required_providers[\s\S]*random\s*=/);
    });

    test('should have backend configuration', () => {
      expect(tfFiles['main.tf']).toMatch(/backend\s+"local"|backend\s+"s3"/);
    });

    test('should set default tags with EnvironmentSuffix', () => {
      expect(tfFiles['main.tf']).toMatch(/default_tags/);
      expect(tfFiles['main.tf']).toMatch(/EnvironmentSuffix/);
    });
  });

  describe('Variables', () => {
    test('should define environment_suffix variable', () => {
      expect(tfFiles['variables.tf']).toMatch(/variable\s+"environment_suffix"\s+\{/);
    });

    test('should define aws_region variable with default', () => {
      expect(tfFiles['variables.tf']).toMatch(/variable\s+"aws_region"\s+\{[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should define all required variables', () => {
      const requiredVars = [
        'vpc_cidr', 'availability_zones', 'db_master_username',
        'instance_types', 'min_capacity', 'max_capacity',
        'desired_capacity', 'logs_retention_days', 'documents_retention_days',
        'documents_glacier_days', 'tags'
      ];
      
      requiredVars.forEach(varName => {
        expect(tfFiles['variables.tf']).toMatch(new RegExp(`variable\\s+"${varName}"\\s+\\{`));
      });
    });
  });

  describe('Environment Suffix Pattern', () => {
    test('should define random_string resource for unique naming', () => {
      expect(tfFiles['main.tf']).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
    });

    test('should define env_suffix in locals', () => {
      expect(tfFiles['main.tf']).toMatch(/locals\s+\{[\s\S]*?env_suffix\s*=/);
    });

    test('should use environment suffix in resource names', () => {
      const resourcesRequiringSuffix = [
        { file: 'vpc.tf', resource: 'aws_vpc', name: 'main' },
        { file: 's3.tf', resource: 'aws_s3_bucket', name: 'logs' },
        { file: 's3.tf', resource: 'aws_s3_bucket', name: 'documents' },
        { file: 'rds.tf', resource: 'aws_rds_cluster', name: 'aurora' },
        { file: 'alb.tf', resource: 'aws_lb', name: 'main' },
        { file: 'kms.tf', resource: 'aws_kms_key', name: 'main' }
      ];
      
      resourcesRequiringSuffix.forEach(({ file, resource, name }) => {
        const content = tfFiles[file];
        const resourcePattern = new RegExp(`resource\\s+"${resource}"\\s+"${name}"[\\s\\S]*?\\}`);
        const resourceBlock = content.match(resourcePattern)?.[0] || '';
        expect(resourceBlock).toMatch(/env_suffix|environment_suffix/);
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct CIDR', () => {
      expect(tfFiles['vpc.tf']).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfFiles['vpc.tf']).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('should enable DNS support and hostnames', () => {
      expect(tfFiles['vpc.tf']).toMatch(/enable_dns_support\s*=\s*true/);
      expect(tfFiles['vpc.tf']).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should create 3 public subnets', () => {
      expect(tfFiles['vpc.tf']).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfFiles['vpc.tf']).toMatch(/count\s*=\s*3/);
    });

    test('should create 3 private subnets', () => {
      expect(tfFiles['vpc.tf']).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should create Internet Gateway', () => {
      expect(tfFiles['vpc.tf']).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('should create NAT Gateway', () => {
      expect(tfFiles['vpc.tf']).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });
  });

  describe('Aurora Database', () => {
    test('should create Aurora PostgreSQL cluster', () => {
      expect(tfFiles['rds.tf']).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
      expect(tfFiles['rds.tf']).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('should configure Serverless v2 scaling', () => {
      expect(tfFiles['rds.tf']).toMatch(/serverlessv2_scaling_configuration\s*\{/);
      expect(tfFiles['rds.tf']).toMatch(/min_capacity\s*=\s*0\.5/);
      expect(tfFiles['rds.tf']).toMatch(/max_capacity\s*=\s*1\.0/);
    });

    test('should enable encryption', () => {
      expect(tfFiles['rds.tf']).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('should enable IAM database authentication', () => {
      expect(tfFiles['rds.tf']).toMatch(/iam_database_authentication_enabled\s*=\s*true/);
    });

    test('should be destroyable for testing', () => {
      expect(tfFiles['rds.tf']).toMatch(/skip_final_snapshot\s*=\s*true/);
      expect(tfFiles['rds.tf']).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('should have backup retention configured', () => {
      expect(tfFiles['rds.tf']).toMatch(/backup_retention_period\s*=\s*\d+/);
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      expect(tfFiles['alb.tf']).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfFiles['alb.tf']).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('should create target groups', () => {
      expect(tfFiles['alb.tf']).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
      expect(tfFiles['alb.tf']).toMatch(/resource\s+"aws_lb_target_group"\s+"api"/);
    });

    test('should create listener with path-based routing', () => {
      expect(tfFiles['alb.tf']).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(tfFiles['alb.tf']).toMatch(/resource\s+"aws_lb_listener_rule"/);
    });

    test('should be destroyable', () => {
      expect(tfFiles['alb.tf']).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });

  describe('Auto Scaling', () => {
    test('should create Auto Scaling Group', () => {
      expect(tfFiles['asg.tf']).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test('should configure mixed instances policy', () => {
      expect(tfFiles['asg.tf']).toMatch(/mixed_instances_policy\s*\{/);
    });

    test('should configure spot instances', () => {
      expect(tfFiles['asg.tf']).toMatch(/on_demand_percentage_above_base_capacity\s*=\s*80/);
    });

    test('should create launch template', () => {
      expect(tfFiles['asg.tf']).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test('should enforce IMDSv2', () => {
      expect(tfFiles['asg.tf']).toMatch(/metadata_options\s*\{/);
      expect(tfFiles['asg.tf']).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test('should create scaling policies', () => {
      expect(tfFiles['asg.tf']).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu"/);
      expect(tfFiles['asg.tf']).toMatch(/resource\s+"aws_autoscaling_policy"\s+"memory"/);
    });
  });

  describe('S3 Buckets', () => {
    test('should create logs bucket', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test('should create documents bucket', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket"\s+"documents"/);
    });

    test('should create static assets bucket', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket"\s+"static_assets"/);
    });

    test('should enable encryption on all buckets', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"documents"/);
      expect(tfFiles['s3.tf']).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('should enable versioning', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"documents"/);
    });

    test('should block public access', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(tfFiles['s3.tf']).toMatch(/block_public_acls\s*=\s*true/);
    });

    test('should have lifecycle policies with filter', () => {
      expect(tfFiles['s3.tf']).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
      expect(tfFiles['s3.tf']).toMatch(/filter\s*\{\}/);
    });
  });

  describe('CloudFront', () => {
    test('should create distribution', () => {
      expect(tfFiles['cloudfront.tf']).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"static_assets"/);
    });

    test('should use S3 origin', () => {
      expect(tfFiles['cloudfront.tf']).toMatch(/origin\s*\{[\s\S]*?domain_name\s*=\s*aws_s3_bucket\.static_assets/);
    });

    test('should configure HTTPS redirect', () => {
      expect(tfFiles['cloudfront.tf']).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('should set minimum TLS version', () => {
      expect(tfFiles['cloudfront.tf']).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
    });
  });

  describe('WAF', () => {
    test('should create Web ACL', () => {
      expect(tfFiles['waf.tf']).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"alb"/);
    });

    test('should have SQL injection rule', () => {
      expect(tfFiles['waf.tf']).toMatch(/rule\s*\{[\s\S]*?name\s*=\s*"sql-injection-rule"/);
    });

    test('should have XSS rule', () => {
      expect(tfFiles['waf.tf']).toMatch(/rule\s*\{[\s\S]*?name\s*=\s*"xss-rule"/);
    });

    test('should associate with ALB', () => {
      expect(tfFiles['waf.tf']).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"alb"/);
    });
  });

  describe('CloudWatch', () => {
    test('should create log groups', () => {
      expect(tfFiles['cloudwatch.tf']).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('should encrypt log groups', () => {
      expect(tfFiles['cloudwatch.tf']).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main/);
    });

    test('should create alarms', () => {
      expect(tfFiles['cloudwatch.tf']).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('should monitor CPU utilization', () => {
      expect(tfFiles['cloudwatch.tf']).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });
  });

  describe('EventBridge', () => {
    test('should create nightly batch rule', () => {
      expect(tfFiles['eventbridge.tf']).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"nightly_batch"/);
    });

    test('should have cron schedule', () => {
      expect(tfFiles['eventbridge.tf']).toMatch(/schedule_expression\s*=\s*"cron/);
    });

    test('should create event targets', () => {
      expect(tfFiles['eventbridge.tf']).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    });
  });

  describe('KMS', () => {
    test('should create KMS key', () => {
      expect(tfFiles['kms.tf']).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('should enable key rotation', () => {
      expect(tfFiles['kms.tf']).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should create key alias', () => {
      expect(tfFiles['kms.tf']).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  describe('IAM', () => {
    test('should create EC2 IAM role', () => {
      expect(tfFiles['iam.tf']).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test('should use shortened name_prefix for IAM roles', () => {
      const iamContent = tfFiles['iam.tf'];
      const namePrefixes = iamContent.match(/name_prefix\s*=\s*"[^"]+"/g) || [];
      
      namePrefixes.forEach(prefix => {
        const prefixValue = prefix.match(/"([^"]+)"/)?.[1] || '';
        // Check that name_prefix is less than 38 characters (AWS limit)
        expect(prefixValue.length).toBeLessThan(38);
      });
    });

    test('should create instance profile', () => {
      expect(tfFiles['iam.tf']).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test('should have EventBridge role', () => {
      expect(tfFiles['iam.tf']).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"/);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      expect(tfFiles['security-groups.tf']).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test('should allow HTTP and HTTPS on ALB', () => {
      const sgContent = tfFiles['security-groups.tf'];
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
    });

    test('should create EC2 security group', () => {
      expect(tfFiles['security-groups.tf']).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test('should create Aurora security group', () => {
      expect(tfFiles['security-groups.tf']).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
    });

    test('should restrict Aurora to PostgreSQL port', () => {
      const sgContent = tfFiles['security-groups.tf'];
      expect(sgContent).toMatch(/from_port\s*=\s*5432/);
      expect(sgContent).toMatch(/to_port\s*=\s*5432/);
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"vpc_id"/);
    });

    test('should output ALB DNS name', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"alb_dns_name"/);
    });

    test('should output Aurora cluster endpoint', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"aurora_cluster_endpoint"/);
    });

    test('should output S3 bucket names', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"logs_bucket_id"/);
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"documents_bucket_id"/);
    });

    test('should output KMS key ID', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"kms_key_id"/);
    });

    test('should output ASG name', () => {
      expect(tfFiles['outputs.tf']).toMatch(/output\s+"autoscaling_group_name"/);
    });
  });
});
