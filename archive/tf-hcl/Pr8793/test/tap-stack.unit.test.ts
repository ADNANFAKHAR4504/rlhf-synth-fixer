import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.join(__dirname, '..', 'lib');

interface TerraformFile {
  name: string;
  path: string;
  content: string;
  size: number;
}

function getTerraformFiles(): TerraformFile[] {
  const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
  return files.map(name => {
    const filePath = path.join(LIB_DIR, name);
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    return {
      name,
      path: filePath,
      content,
      size: stats.size,
    };
  });
}

describe('Terraform Multi-Region DR Infrastructure - Unit Tests', () => {
  let terraformFiles: TerraformFile[];

  beforeAll(() => {
    terraformFiles = getTerraformFiles();
  });

  describe('File Discovery', () => {
    it('should discover all Terraform files', () => {
      expect(terraformFiles.length).toBeGreaterThan(0);
      expect(terraformFiles.every(f => f.name.endsWith('.tf'))).toBe(true);
    });

    it('should read file contents', () => {
      expect(terraformFiles.every(f => f.content.length > 0)).toBe(true);
    });

    it('should include file sizes', () => {
      expect(terraformFiles.every(f => f.size > 0)).toBe(true);
    });
  });

  describe('Required Files Validation', () => {
    const requiredFiles = [
      'main.tf',
      'aurora.tf',
      'vpc.tf',
      'secrets.tf',
      's3.tf',
      'route53.tf',
      'sns.tf',
      'variables.tf',
      'outputs.tf',
    ];

    it('should have all required terraform files', () => {
      const fileNames = terraformFiles.map(f => f.name);
      requiredFiles.forEach(required => {
        expect(fileNames).toContain(required);
      });
    });

    it('should have at least 9 terraform files', () => {
      expect(terraformFiles.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Provider Configuration Validation', () => {
    let mainFile: TerraformFile | undefined;

    beforeAll(() => {
      mainFile = terraformFiles.find(f => f.name === 'main.tf');
    });

    it('should have main.tf file', () => {
      expect(mainFile).toBeDefined();
    });

    it('should have terraform block', () => {
      expect(mainFile!.content).toContain('terraform {');
    });

    it('should have required_providers block', () => {
      expect(mainFile!.content).toContain('required_providers');
    });

    it('should have AWS provider configuration', () => {
      expect(mainFile!.content).toContain('hashicorp/aws');
    });

    it('should have random provider configuration', () => {
      expect(mainFile!.content).toContain('hashicorp/random');
    });

    it('should have S3 backend configuration', () => {
      expect(mainFile!.content).toContain('backend "s3"');
    });

    it('should have required_version constraint', () => {
      expect(mainFile!.content).toContain('required_version');
    });
  });

  describe('Multi-Region Configuration Validation', () => {
    let mainFile: TerraformFile | undefined;

    beforeAll(() => {
      mainFile = terraformFiles.find(f => f.name === 'main.tf');
    });

    it('should have primary region provider alias', () => {
      expect(mainFile!.content).toContain('alias  = "primary"');
    });

    it('should have secondary region provider alias', () => {
      expect(mainFile!.content).toContain('alias  = "secondary"');
    });

    it('should use var.primary_region', () => {
      expect(mainFile!.content).toContain('var.primary_region');
    });

    it('should use var.secondary_region', () => {
      expect(mainFile!.content).toContain('var.secondary_region');
    });

    it('should have data source for primary availability zones', () => {
      expect(mainFile!.content).toContain('data "aws_availability_zones" "primary"');
    });

    it('should have data source for secondary availability zones', () => {
      expect(mainFile!.content).toContain('data "aws_availability_zones" "secondary"');
    });
  });

  describe('Aurora Configuration Validation', () => {
    let auroraFile: TerraformFile | undefined;

    beforeAll(() => {
      auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
    });

    it('should have aurora.tf file', () => {
      expect(auroraFile).toBeDefined();
    });

    it('should have Aurora Global Database configuration', () => {
      expect(auroraFile!.content).toContain('aws_rds_global_cluster');
    });

    it('should have primary Aurora cluster', () => {
      expect(auroraFile!.content).toContain('aws_rds_cluster" "primary"');
    });

    it('should have secondary Aurora cluster', () => {
      expect(auroraFile!.content).toContain('aws_rds_cluster" "secondary"');
    });

    it('should have global_cluster_identifier reference', () => {
      expect(auroraFile!.content).toContain('global_cluster_identifier');
    });

    it('should use db.r6g.large instance class', () => {
      expect(auroraFile!.content).toContain('db.r6g.large');
    });

    it('should have storage encryption enabled', () => {
      expect(auroraFile!.content).toContain('storage_encrypted');
      expect(auroraFile!.content).toContain('storage_encrypted               = true');
    });

    it('should have KMS key for primary region', () => {
      expect(auroraFile!.content).toContain('aws_kms_key" "primary"');
    });

    it('should have KMS key for secondary region', () => {
      expect(auroraFile!.content).toContain('aws_kms_key" "secondary"');
    });

    it('should have deletion_protection disabled for testing', () => {
      expect(auroraFile!.content).toContain('deletion_protection             = false');
    });

    it('should have skip_final_snapshot enabled', () => {
      expect(auroraFile!.content).toContain('skip_final_snapshot             = true');
    });

    it('should have pg_stat_statements parameter group', () => {
      expect(auroraFile!.content).toContain('pg_stat_statements');
    });

    it('should have aurora-postgresql15 family', () => {
      expect(auroraFile!.content).toContain('aurora-postgresql15');
    });

    it('should have primary cluster instances with count', () => {
      expect(auroraFile!.content).toContain('aws_rds_cluster_instance" "primary"');
      expect(auroraFile!.content).toContain('count               = 3');
    });

    it('should have secondary cluster instances with count', () => {
      expect(auroraFile!.content).toContain('aws_rds_cluster_instance" "secondary"');
    });

    it('should have IAM role for RDS monitoring', () => {
      expect(auroraFile!.content).toContain('aws_iam_role" "rds_monitoring_primary"');
      expect(auroraFile!.content).toContain('aws_iam_role" "rds_monitoring_secondary"');
    });

    it('should have cloudwatch logs export enabled', () => {
      expect(auroraFile!.content).toContain('enabled_cloudwatch_logs_exports');
    });
  });

  describe('Route 53 Configuration Validation', () => {
    let route53File: TerraformFile | undefined;

    beforeAll(() => {
      route53File = terraformFiles.find(f => f.name === 'route53.tf');
    });

    it('should have route53.tf file', () => {
      expect(route53File).toBeDefined();
    });

    it('should have Route 53 hosted zone', () => {
      expect(route53File!.content).toContain('aws_route53_zone');
    });

    it('should have health check for primary cluster', () => {
      expect(route53File!.content).toContain('aws_route53_health_check" "primary"');
    });

    it('should have health check for secondary cluster', () => {
      expect(route53File!.content).toContain('aws_route53_health_check" "secondary"');
    });

    it('should have failover routing policy', () => {
      expect(route53File!.content).toContain('failover_routing_policy');
    });

    it('should have PRIMARY failover type', () => {
      expect(route53File!.content).toContain('type = "PRIMARY"');
    });

    it('should have SECONDARY failover type', () => {
      expect(route53File!.content).toContain('type = "SECONDARY"');
    });

    it('should have replication lag monitoring alarm', () => {
      expect(route53File!.content).toContain('AuroraGlobalDBReplicationLag');
    });

    it('should have CloudWatch metric alarm', () => {
      expect(route53File!.content).toContain('aws_cloudwatch_metric_alarm');
    });

    it('should have calculated health check', () => {
      expect(route53File!.content).toContain('type     = "CALCULATED"');
    });

    it('should have TCP health check type', () => {
      expect(route53File!.content).toContain('type              = "TCP"');
    });
  });

  describe('S3 Configuration Validation', () => {
    let s3File: TerraformFile | undefined;

    beforeAll(() => {
      s3File = terraformFiles.find(f => f.name === 's3.tf');
    });

    it('should have s3.tf file', () => {
      expect(s3File).toBeDefined();
    });

    it('should have primary S3 bucket', () => {
      expect(s3File!.content).toContain('aws_s3_bucket" "primary"');
    });

    it('should have secondary S3 bucket', () => {
      expect(s3File!.content).toContain('aws_s3_bucket" "secondary"');
    });

    it('should have versioning enabled', () => {
      expect(s3File!.content).toContain('aws_s3_bucket_versioning');
      expect(s3File!.content).toContain('status = "Enabled"');
    });

    it('should have server-side encryption', () => {
      expect(s3File!.content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(s3File!.content).toContain('sse_algorithm = "AES256"');
    });

    it('should have public access block', () => {
      expect(s3File!.content).toContain('aws_s3_bucket_public_access_block');
      expect(s3File!.content).toContain('block_public_acls       = true');
    });

    it('should have lifecycle configuration with Glacier transition', () => {
      expect(s3File!.content).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(s3File!.content).toContain('storage_class = "GLACIER"');
      expect(s3File!.content).toContain('days          = 30');
    });

    it('should have cross-region replication configuration', () => {
      expect(s3File!.content).toContain('aws_s3_bucket_replication_configuration');
    });

    it('should have IAM role for replication', () => {
      expect(s3File!.content).toContain('aws_iam_role" "replication"');
    });

    it('should have delete marker replication enabled', () => {
      expect(s3File!.content).toContain('delete_marker_replication');
      expect(s3File!.content).toContain('status = "Enabled"');
    });
  });

  describe('SNS Configuration Validation', () => {
    let snsFile: TerraformFile | undefined;

    beforeAll(() => {
      snsFile = terraformFiles.find(f => f.name === 'sns.tf');
    });

    it('should have sns.tf file', () => {
      expect(snsFile).toBeDefined();
    });

    it('should have primary SNS topic', () => {
      expect(snsFile!.content).toContain('aws_sns_topic" "primary"');
    });

    it('should have secondary SNS topic', () => {
      expect(snsFile!.content).toContain('aws_sns_topic" "secondary"');
    });

    it('should have SQS dead letter queue for primary', () => {
      expect(snsFile!.content).toContain('aws_sqs_queue" "dlq_primary"');
    });

    it('should have SQS dead letter queue for secondary', () => {
      expect(snsFile!.content).toContain('aws_sqs_queue" "dlq_secondary"');
    });

    it('should have RDS event subscription for primary', () => {
      expect(snsFile!.content).toContain('aws_db_event_subscription" "primary"');
    });

    it('should have RDS event subscription for secondary', () => {
      expect(snsFile!.content).toContain('aws_db_event_subscription" "secondary"');
    });
  });

  describe('Secrets Configuration Validation', () => {
    let secretsFile: TerraformFile | undefined;

    beforeAll(() => {
      secretsFile = terraformFiles.find(f => f.name === 'secrets.tf');
    });

    it('should have secrets.tf file', () => {
      expect(secretsFile).toBeDefined();
    });

    it('should have random password resource', () => {
      expect(secretsFile!.content).toContain('random_password');
    });

    it('should have Secrets Manager secret for primary', () => {
      expect(secretsFile!.content).toContain('aws_secretsmanager_secret" "db_password_primary"');
    });

    it('should have Secrets Manager secret for secondary', () => {
      expect(secretsFile!.content).toContain('aws_secretsmanager_secret" "db_password_secondary"');
    });

    it('should have secret version for primary', () => {
      expect(secretsFile!.content).toContain('aws_secretsmanager_secret_version" "db_password_primary"');
    });

    it('should have secret version for secondary', () => {
      expect(secretsFile!.content).toContain('aws_secretsmanager_secret_version" "db_password_secondary"');
    });
  });

  describe('VPC Configuration Validation', () => {
    let vpcFile: TerraformFile | undefined;

    beforeAll(() => {
      vpcFile = terraformFiles.find(f => f.name === 'vpc.tf');
    });

    it('should have vpc.tf file', () => {
      expect(vpcFile).toBeDefined();
    });

    it('should have primary VPC', () => {
      expect(vpcFile!.content).toContain('aws_vpc" "primary"');
    });

    it('should have secondary VPC', () => {
      expect(vpcFile!.content).toContain('aws_vpc" "secondary"');
    });

    it('should have private subnets for primary', () => {
      expect(vpcFile!.content).toContain('aws_subnet" "primary_private"');
    });

    it('should have private subnets for secondary', () => {
      expect(vpcFile!.content).toContain('aws_subnet" "secondary_private"');
    });

    it('should have internet gateway for primary', () => {
      expect(vpcFile!.content).toContain('aws_internet_gateway" "primary"');
    });

    it('should have internet gateway for secondary', () => {
      expect(vpcFile!.content).toContain('aws_internet_gateway" "secondary"');
    });
  });

  describe('Variables Configuration Validation', () => {
    let variablesFile: TerraformFile | undefined;

    beforeAll(() => {
      variablesFile = terraformFiles.find(f => f.name === 'variables.tf');
    });

    it('should have variables.tf file', () => {
      expect(variablesFile).toBeDefined();
    });

    it('should have environment_suffix variable', () => {
      expect(variablesFile!.content).toContain('variable "environment_suffix"');
    });

    it('should have primary_region variable', () => {
      expect(variablesFile!.content).toContain('variable "primary_region"');
    });

    it('should have secondary_region variable', () => {
      expect(variablesFile!.content).toContain('variable "secondary_region"');
    });

    it('should have database_name variable', () => {
      expect(variablesFile!.content).toContain('variable "database_name"');
    });

    it('should have db_username variable', () => {
      expect(variablesFile!.content).toContain('variable "db_username"');
    });

    it('should have domain_name variable', () => {
      expect(variablesFile!.content).toContain('variable "domain_name"');
    });
  });

  describe('Outputs Configuration Validation', () => {
    let outputsFile: TerraformFile | undefined;

    beforeAll(() => {
      outputsFile = terraformFiles.find(f => f.name === 'outputs.tf');
    });

    it('should have outputs.tf file', () => {
      expect(outputsFile).toBeDefined();
    });

    it('should have primary_cluster_endpoint output', () => {
      expect(outputsFile!.content).toContain('output "primary_cluster_endpoint"');
    });

    it('should have secondary_cluster_endpoint output', () => {
      expect(outputsFile!.content).toContain('output "secondary_cluster_endpoint"');
    });

    it('should have route53_failover_dns output', () => {
      expect(outputsFile!.content).toContain('output "route53_failover_dns"');
    });

    it('should have primary_s3_bucket output', () => {
      expect(outputsFile!.content).toContain('output "primary_s3_bucket"');
    });

    it('should have secondary_s3_bucket output', () => {
      expect(outputsFile!.content).toContain('output "secondary_s3_bucket"');
    });

    it('should have sensitive outputs marked', () => {
      expect(outputsFile!.content).toContain('sensitive   = true');
    });

    it('should have replication_lag_alarm_arn output', () => {
      expect(outputsFile!.content).toContain('output "replication_lag_alarm_arn"');
    });
  });

  describe('Resource Naming Convention Validation', () => {
    it('should include environment_suffix in Aurora resources', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('${var.environment_suffix}');
    });

    it('should include environment_suffix in S3 resources', () => {
      const s3File = terraformFiles.find(f => f.name === 's3.tf');
      expect(s3File!.content).toContain('${var.environment_suffix}');
    });

    it('should include environment_suffix in Route53 resources', () => {
      const route53File = terraformFiles.find(f => f.name === 'route53.tf');
      expect(route53File!.content).toContain('${var.environment_suffix}');
    });

    it('should include environment_suffix in SNS resources', () => {
      const snsFile = terraformFiles.find(f => f.name === 'sns.tf');
      expect(snsFile!.content).toContain('${var.environment_suffix}');
    });

    it('should include environment_suffix in VPC resources', () => {
      const vpcFile = terraformFiles.find(f => f.name === 'vpc.tf');
      expect(vpcFile!.content).toContain('${var.environment_suffix}');
    });
  });

  describe('Tagging Compliance Validation', () => {
    it('should have Environment=production tags in Aurora file', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('Environment = "production"');
    });

    it('should have DR-Tier=critical tags in Aurora file', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('DR-Tier     = "critical"');
    });

    it('should have Environment=production tags in S3 file', () => {
      const s3File = terraformFiles.find(f => f.name === 's3.tf');
      expect(s3File!.content).toContain('Environment = "production"');
    });

    it('should have Environment=production tags in Route53 file', () => {
      const route53File = terraformFiles.find(f => f.name === 'route53.tf');
      expect(route53File!.content).toContain('Environment = "production"');
    });
  });

  describe('Security Best Practices Validation', () => {
    it('should not have hardcoded passwords', () => {
      terraformFiles.forEach(file => {
        expect(file.content).not.toMatch(/password\s*=\s*"[^"$]+"/i);
      });
    });

    it('should use random_password for database credentials', () => {
      const secretsFile = terraformFiles.find(f => f.name === 'secrets.tf');
      expect(secretsFile!.content).toContain('random_password');
    });

    it('should have KMS encryption enabled', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('kms_key_id');
    });

    it('should block public access on S3 buckets', () => {
      const s3File = terraformFiles.find(f => f.name === 's3.tf');
      expect(s3File!.content).toContain('block_public_acls       = true');
      expect(s3File!.content).toContain('block_public_policy     = true');
      expect(s3File!.content).toContain('restrict_public_buckets = true');
    });

    it('should have Aurora instances not publicly accessible', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('publicly_accessible = false');
    });
  });

  describe('Disaster Recovery Features Validation', () => {
    it('should have Aurora Global Database for cross-region replication', () => {
      const auroraFile = terraformFiles.find(f => f.name === 'aurora.tf');
      expect(auroraFile!.content).toContain('aws_rds_global_cluster');
    });

    it('should have Route53 failover routing', () => {
      const route53File = terraformFiles.find(f => f.name === 'route53.tf');
      expect(route53File!.content).toContain('failover_routing_policy');
    });

    it('should have S3 cross-region replication', () => {
      const s3File = terraformFiles.find(f => f.name === 's3.tf');
      expect(s3File!.content).toContain('aws_s3_bucket_replication_configuration');
    });

    it('should have health checks for both regions', () => {
      const route53File = terraformFiles.find(f => f.name === 'route53.tf');
      expect(route53File!.content).toContain('aws_route53_health_check" "primary"');
      expect(route53File!.content).toContain('aws_route53_health_check" "secondary"');
    });

    it('should monitor replication lag', () => {
      const route53File = terraformFiles.find(f => f.name === 'route53.tf');
      expect(route53File!.content).toContain('AuroraGlobalDBReplicationLag');
      expect(route53File!.content).toContain('threshold           = 60000');
    });
  });
});
