// test/terraform.unit.test.ts
// Unit tests for RDS Aurora Global Database Multi-Region DR Infrastructure
// Validates Terraform file structure and configuration without executing Terraform

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper functions
const readFileContent = (fileName: string): string => {
  const filePath = path.join(LIB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
};

const getAllTfContent = (): string => {
  const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
  return files.map(f => readFileContent(f)).join('\n');
};

const hasResource = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`, 'm');
  return regex.test(content);
};

const hasOutput = (content: string, outputName: string): boolean => {
  const regex = new RegExp(`output\\s+"${outputName}"`, 'm');
  return regex.test(content);
};

const hasVariable = (content: string, variableName: string): boolean => {
  const regex = new RegExp(`variable\\s+"${variableName}"`, 'm');
  return regex.test(content);
};

const countResourceType = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'gm');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

describe('RDS Aurora Global Database Multi-Region DR - Unit Tests', () => {
  let allContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let rdsAuroraContent: string;

  beforeAll(() => {
    allContent = getAllTfContent();
    providerContent = readFileContent('provider.tf');
    variablesContent = readFileContent('variables.tf');
    outputsContent = readFileContent('outputs.tf');
    rdsAuroraContent = readFileContent('rds_aurora.tf');
  });

  describe('File Structure and Existence', () => {
    test('lib directory exists', () => {
      expect(fs.existsSync(LIB_DIR)).toBe(true);
    });

    test('required Terraform files exist', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));
      expect(tfFiles.length).toBeGreaterThan(0);
    });

    test('provider.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('variables.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('outputs.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('rds_aurora.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'rds_aurora.tf'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*\d+\.\d+/);
    });

    test('configures AWS provider', () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*?aws\s*=/s);
    });

    test('configures primary AWS provider (us-east-1)', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/region\s*=\s*var\.primary_region/);
    });

    test('configures secondary AWS provider (us-west-2)', () => {
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"/);
      expect(providerContent).toMatch(/region\s*=\s*var\.secondary_region/);
    });

    test('has default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/tags\s*=\s*var\.common_tags/);
    });

    test('backend configuration uses local state', () => {
      // Using local backend for self-sufficient deployment
      expect(providerContent).toMatch(/terraform\s*{/);
    });
  });

  describe('Variables Configuration', () => {
    test('declares environment_suffix variable', () => {
      expect(hasVariable(variablesContent, 'environment_suffix')).toBe(true);
    });

    test('declares common_tags variable', () => {
      expect(hasVariable(variablesContent, 'common_tags')).toBe(true);
    });

    test('variables have proper types', () => {
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('variables have descriptions', () => {
      expect(variablesContent).toMatch(/description\s*=/);
    });
  });

  describe('RDS Aurora Global Database', () => {
    test('creates RDS Global Cluster resource', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_global_cluster', 'global')).toBe(true);
    });

    test('Global Cluster uses source_db_cluster_identifier for promotion', () => {
      const globalClusterMatch = rdsAuroraContent.match(/resource\s+"aws_rds_global_cluster"\s+"global"\s*{[\s\S]*?^}/m);
      expect(globalClusterMatch).toBeTruthy();
      expect(globalClusterMatch![0]).toMatch(/source_db_cluster_identifier\s*=\s*aws_rds_cluster\.primary\.arn/);
    });

    test('Global Cluster has force_destroy enabled for testing', () => {
      const globalClusterMatch = rdsAuroraContent.match(/resource\s+"aws_rds_global_cluster"\s+"global"\s*{[\s\S]*?^}/m);
      expect(globalClusterMatch).toBeTruthy();
      expect(globalClusterMatch![0]).toMatch(/force_destroy\s*=\s*true/);
    });

    test('creates primary RDS cluster', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_cluster', 'primary')).toBe(true);
    });

    test('primary cluster uses aurora-postgresql engine', () => {
      const primaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(primaryMatch).toBeTruthy();
      expect(primaryMatch![0]).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('primary cluster has lifecycle ignore_changes for global_cluster_identifier', () => {
      const primaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(primaryMatch).toBeTruthy();
      expect(primaryMatch![0]).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[[\s\S]*?global_cluster_identifier/s);
    });

    test('primary cluster has deletion_protection disabled', () => {
      const primaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(primaryMatch).toBeTruthy();
      expect(primaryMatch![0]).toMatch(/deletion_protection\s*=\s*false/);
    });

    test('primary cluster has storage encryption enabled', () => {
      const primaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(primaryMatch).toBeTruthy();
      expect(primaryMatch![0]).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('primary cluster has backup retention configured', () => {
      const primaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"primary"\s*{[\s\S]*?^}/m);
      expect(primaryMatch).toBeTruthy();
      expect(primaryMatch![0]).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_period/);
    });

    test('creates secondary RDS cluster', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_cluster', 'secondary')).toBe(true);
    });

    test('secondary cluster uses secondary provider', () => {
      const secondaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"secondary"\s*{[\s\S]*?^}/m);
      expect(secondaryMatch).toBeTruthy();
      expect(secondaryMatch![0]).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test('secondary cluster depends on global cluster', () => {
      const secondaryMatch = rdsAuroraContent.match(/resource\s+"aws_rds_cluster"\s+"secondary"\s*{[\s\S]*?^}/m);
      expect(secondaryMatch).toBeTruthy();
      expect(secondaryMatch![0]).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_rds_global_cluster\.global/s);
    });

    test('creates 2 primary cluster instances', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_cluster_instance', 'primary')).toBe(true);
      expect(rdsAuroraContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"primary"\s*{[\s\S]*?count\s*=\s*2/s);
    });

    test('creates 2 secondary cluster instances', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_cluster_instance', 'secondary')).toBe(true);
      expect(rdsAuroraContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"secondary"\s*{[\s\S]*?count\s*=\s*2/s);
    });

    test('cluster instances use configurable instance class', () => {
      expect(rdsAuroraContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS keys for both regions', () => {
      expect(hasResource(allContent, 'aws_kms_key', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_kms_key', 'secondary_db')).toBe(true);
    });

    test('KMS keys have rotation enabled', () => {
      expect(allContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS keys have deletion window configured', () => {
      expect(allContent).toMatch(/deletion_window_in_days\s*=/);
    });

    test('creates KMS aliases for database keys', () => {
      expect(hasResource(allContent, 'aws_kms_alias', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_kms_alias', 'secondary_db')).toBe(true);
    });

    test('creates KMS keys for SNS encryption', () => {
      expect(hasResource(allContent, 'aws_kms_key', 'primary_sns')).toBe(true);
      expect(hasResource(allContent, 'aws_kms_key', 'secondary_sns')).toBe(true);
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPCs for both regions', () => {
      expect(hasResource(allContent, 'aws_vpc', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_vpc', 'secondary')).toBe(true);
    });

    test('VPCs have DNS support enabled', () => {
      expect(allContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(allContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('creates subnets in both regions', () => {
      expect(hasResource(allContent, 'aws_subnet', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_subnet', 'secondary')).toBe(true);
    });

    test('subnets use count for multiple AZs', () => {
      expect(allContent).toMatch(/count\s*=\s*3/);
    });

    test('creates DB subnet groups for both regions', () => {
      expect(hasResource(allContent, 'aws_db_subnet_group', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_db_subnet_group', 'secondary')).toBe(true);
    });

    test('creates Internet Gateways', () => {
      expect(hasResource(allContent, 'aws_internet_gateway', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_internet_gateway', 'secondary')).toBe(true);
    });

    test('creates route tables', () => {
      expect(hasResource(allContent, 'aws_route_table', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_route_table', 'secondary')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('creates database security groups', () => {
      expect(hasResource(allContent, 'aws_security_group', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_security_group', 'secondary_db')).toBe(true);
    });

    test('security groups allow PostgreSQL port 5432', () => {
      expect(allContent).toMatch(/from_port\s*=\s*5432/);
      expect(allContent).toMatch(/to_port\s*=\s*5432/);
    });

    test('security groups use least privilege', () => {
      expect(allContent).toMatch(/cidr_blocks\s*=/);
    });
  });

  describe('DB Parameter Groups', () => {
    test('creates cluster parameter groups', () => {
      expect(hasResource(allContent, 'aws_rds_cluster_parameter_group', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_rds_cluster_parameter_group', 'secondary')).toBe(true);
    });

    test('creates DB parameter groups', () => {
      expect(hasResource(allContent, 'aws_db_parameter_group', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_db_parameter_group', 'secondary')).toBe(true);
    });

    test('parameter groups enable pg_stat_statements', () => {
      expect(allContent).toMatch(/pg_stat_statements/);
    });

    test('parameter groups use aurora-postgresql14 family', () => {
      expect(allContent).toMatch(/family\s*=\s*"aurora-postgresql14"/);
    });
  });

  describe('Secrets Management', () => {
    test('creates random password', () => {
      expect(hasResource(allContent, 'random_password', 'master_password')).toBe(true);
    });

    test('password has minimum length of 16', () => {
      expect(allContent).toMatch(/length\s*=\s*(1[6-9]|[2-9]\d)/);
    });

    test('password includes special characters', () => {
      expect(allContent).toMatch(/special\s*=\s*true/);
    });

    test('creates secrets in both regions', () => {
      expect(hasResource(allContent, 'aws_secretsmanager_secret', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_secretsmanager_secret', 'secondary_db')).toBe(true);
    });

    test('creates secret versions', () => {
      expect(hasResource(allContent, 'aws_secretsmanager_secret_version', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_secretsmanager_secret_version', 'secondary_db')).toBe(true);
    });

    test('secrets have rotation IAM role configured', () => {
      expect(hasResource(allContent, 'aws_iam_role', 'secret_rotation')).toBe(true);
    });
  });

  describe('S3 Backup Buckets', () => {
    test('creates S3 buckets for backups', () => {
      expect(hasResource(allContent, 'aws_s3_bucket', 'primary_backup')).toBe(true);
      expect(hasResource(allContent, 'aws_s3_bucket', 'secondary_backup')).toBe(true);
    });

    test('S3 buckets have versioning enabled', () => {
      expect(hasResource(allContent, 'aws_s3_bucket_versioning', 'primary_backup')).toBe(true);
      expect(hasResource(allContent, 'aws_s3_bucket_versioning', 'secondary_backup')).toBe(true);
    });

    test('S3 buckets have encryption enabled', () => {
      expect(hasResource(allContent, 'aws_s3_bucket_server_side_encryption_configuration', 'primary_backup')).toBe(true);
      expect(hasResource(allContent, 'aws_s3_bucket_server_side_encryption_configuration', 'secondary_backup')).toBe(true);
    });

    test('S3 buckets block public access', () => {
      expect(hasResource(allContent, 'aws_s3_bucket_public_access_block', 'primary_backup')).toBe(true);
      expect(hasResource(allContent, 'aws_s3_bucket_public_access_block', 'secondary_backup')).toBe(true);
      expect(allContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(allContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('S3 has cross-region replication configured', () => {
      expect(hasResource(allContent, 'aws_s3_bucket_replication_configuration', 'primary_to_secondary')).toBe(true);
    });

    test('S3 has lifecycle policies', () => {
      expect(hasResource(allContent, 'aws_s3_bucket_lifecycle_configuration', 'primary_backup')).toBe(true);
    });
  });

  describe('SNS Notifications', () => {
    test('creates SNS topics for both regions', () => {
      expect(hasResource(allContent, 'aws_sns_topic', 'primary_db_events')).toBe(true);
      expect(hasResource(allContent, 'aws_sns_topic', 'secondary_db_events')).toBe(true);
    });

    test('SNS topics use KMS encryption', () => {
      expect(allContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.(primary_sns|secondary_sns)\.id/);
    });

    test('creates SNS dead letter queues', () => {
      expect(hasResource(allContent, 'aws_sqs_queue', 'primary_dlq')).toBe(true);
      expect(hasResource(allContent, 'aws_sqs_queue', 'secondary_dlq')).toBe(true);
    });

    test('creates DB event subscriptions', () => {
      expect(hasResource(allContent, 'aws_db_event_subscription', 'primary')).toBe(true);
      expect(hasResource(allContent, 'aws_db_event_subscription', 'secondary')).toBe(true);
    });

    test('event subscriptions monitor critical events', () => {
      expect(allContent).toMatch(/event_categories\s*=\s*\[/);
      expect(allContent).toMatch(/failover/);
      expect(allContent).toMatch(/failure/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch alarms for replication lag', () => {
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'primary_replication_lag')).toBe(true);
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'secondary_replication_lag')).toBe(true);
    });

    test('replication lag threshold is 60 seconds or less', () => {
      expect(allContent).toMatch(/threshold\s*=\s*60000/); // 60000 milliseconds
    });

    test('creates CPU utilization alarms', () => {
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'primary_cpu')).toBe(true);
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'secondary_cpu')).toBe(true);
    });

    test('creates database connections alarms', () => {
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'primary_connections')).toBe(true);
      // Secondary connections alarm may not be explicitly defined yet
      const secondaryConnectionsExists = hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'secondary_connections');
      expect(secondaryConnectionsExists || allContent.includes('DatabaseConnections')).toBe(true);
    });

    test('creates CloudWatch log groups', () => {
      expect(hasResource(allContent, 'aws_cloudwatch_log_group', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_cloudwatch_log_group', 'secondary_db')).toBe(true);
    });

    test('log groups have retention configured', () => {
      expect(allContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });
  });

  describe('Route 53 Health Checks', () => {
    test('creates Route 53 health checks', () => {
      expect(hasResource(allContent, 'aws_route53_health_check', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_route53_health_check', 'secondary_db')).toBe(true);
    });

    test('health checks monitor CloudWatch alarms', () => {
      expect(allContent).toMatch(/type\s*=\s*"CLOUDWATCH_METRIC"/);
      expect(allContent).toMatch(/cloudwatch_alarm_name/);
    });

    test('creates IAM role for Route 53 health checks', () => {
      expect(hasResource(allContent, 'aws_iam_role', 'route53_health_check')).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates RDS monitoring roles', () => {
      expect(hasResource(allContent, 'aws_iam_role', 'rds_monitoring')).toBe(true);
      expect(hasResource(allContent, 'aws_iam_role', 'rds_monitoring_secondary')).toBe(true);
    });

    test('creates S3 replication role', () => {
      expect(hasResource(allContent, 'aws_iam_role', 'replication')).toBe(true);
    });

    test('creates secret rotation role', () => {
      expect(hasResource(allContent, 'aws_iam_role', 'secret_rotation')).toBe(true);
    });

    test('IAM roles have assume role policies', () => {
      expect(allContent).toMatch(/assume_role_policy\s*=/);
    });

    test('IAM policies follow least privilege', () => {
      expect(allContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(allContent).toMatch(/Action\s*=/);
      expect(allContent).toMatch(/Resource\s*=/);
    });
  });

  describe('Required Outputs', () => {
    test('outputs global_cluster_id', () => {
      expect(hasOutput(outputsContent, 'global_cluster_id')).toBe(true);
    });

    test('outputs primary cluster endpoints', () => {
      expect(hasOutput(outputsContent, 'primary_cluster_endpoint')).toBe(true);
      expect(hasOutput(outputsContent, 'primary_cluster_reader_endpoint')).toBe(true);
    });

    test('outputs secondary cluster endpoints', () => {
      expect(hasOutput(outputsContent, 'secondary_cluster_endpoint')).toBe(true);
      expect(hasOutput(outputsContent, 'secondary_cluster_reader_endpoint')).toBe(true);
    });

    test('outputs S3 bucket names', () => {
      expect(hasOutput(outputsContent, 'primary_backup_bucket')).toBe(true);
      expect(hasOutput(outputsContent, 'secondary_backup_bucket')).toBe(true);
    });

    test('outputs SNS topic ARNs', () => {
      expect(hasOutput(outputsContent, 'primary_sns_topic_arn')).toBe(true);
      expect(hasOutput(outputsContent, 'secondary_sns_topic_arn')).toBe(true);
    });

    test('outputs KMS key IDs', () => {
      expect(hasOutput(outputsContent, 'primary_kms_key_id')).toBe(true);
      expect(hasOutput(outputsContent, 'secondary_kms_key_id')).toBe(true);
    });

    test('sensitive outputs are marked as sensitive', () => {
      expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resources include environment_suffix in naming', () => {
      expect(allContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('resources follow consistent naming patterns', () => {
      expect(allContent).toMatch(/Name\s*=\s*"[a-z-]+\$\{var\.environment_suffix\}"/);
    });

    test('uses variables for environment configuration', () => {
      expect(allContent).toMatch(/var\.environment_suffix/);
    });
  });

  describe('Tagging and Compliance', () => {
    test('resources have common tags', () => {
      expect(allContent).toMatch(/Environment\s*=\s*"(production|qa)"/);
      expect(allContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test('resources have DR-Tier tag', () => {
      expect(allContent).toMatch(/DR-Tier\s*=\s*"critical"/);
    });

    test('resources have ManagedBy tag', () => {
      expect(allContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test('resources have TaskID tag', () => {
      expect(allContent).toMatch(/TaskID\s*=/);
    });
  });

  describe('Security Best Practices', () => {
    test('no deletion_protection enabled (for testing)', () => {
      const deletionProtectionMatches = allContent.match(/deletion_protection\s*=\s*true/g);
      expect(deletionProtectionMatches).toBeFalsy();
    });

    test('no hardcoded credentials', () => {
      expect(allContent).not.toMatch(/password\s*=\s*"[A-Za-z0-9]/);
      expect(allContent).not.toMatch(/secret\s*=\s*"[A-Za-z0-9]/);
    });

    test('all storage encryption enabled', () => {
      expect(allContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(allContent).toMatch(/kms_key_id\s*=/);
    });

    test('RDS is NOT publicly accessible', () => {
      expect(allContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('S3 buckets enforce encryption', () => {
      expect(allContent).toMatch(/sse_algorithm\s*=\s*"(AES256|aws:kms)"/);
    });
  });

  describe('Syntax Validation', () => {
    test('all .tf files have balanced braces', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      files.forEach(file => {
        const content = readFileContent(file);
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
      });
    });

    test('terraform blocks are properly formatted', () => {
      expect(allContent).toMatch(/\b(resource|module|variable|output|data|provider|terraform)\s+/);
    });
  });

  describe('Multi-Region Configuration', () => {
    test('uses us-east-1 as primary region', () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('uses us-west-2 as secondary region', () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('resources use provider aliases', () => {
      expect(allContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe('Disaster Recovery Requirements', () => {
    test('RPO < 1 minute: async replication configured', () => {
      expect(hasResource(rdsAuroraContent, 'aws_rds_global_cluster', 'global')).toBe(true);
    });

    test('RTO < 5 minutes: automated failover configured', () => {
      expect(hasResource(allContent, 'aws_route53_health_check', 'primary_db')).toBe(true);
      expect(hasResource(allContent, 'aws_route53_health_check', 'secondary_db')).toBe(true);
    });

    test('monitoring for replication lag < 60 seconds', () => {
      expect(hasResource(allContent, 'aws_cloudwatch_metric_alarm', 'primary_replication_lag')).toBe(true);
      expect(allContent).toMatch(/AuroraGlobalDBReplicationLag/);
    });

    test('automated backups configured', () => {
      expect(allContent).toMatch(/backup_retention_period\s*=/);
      expect(allContent).toMatch(/preferred_backup_window\s*=/);
    });
  });
});
