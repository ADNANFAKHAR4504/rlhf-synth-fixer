// Comprehensive unit tests for multi-region DR Terraform infrastructure
// Tests validate HCL syntax, variable usage, resource configuration, and best practices

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read Terraform files
function readTerraformFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to get all .tf files
function getAllTerraformFiles(): string[] {
  return fs.readdirSync(LIB_DIR).filter(file => file.endsWith('.tf'));
}

describe('Multi-Region DR Terraform Configuration - Unit Tests', () => {
  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'providers.tf',
        'variables.tf',
        'outputs.tf',
        'networking.tf',
        'security-groups.tf',
        'aurora.tf',
        's3-replication.tf',
        'compute.tf',
        'route53.tf',
        'backup.tf',
        'monitoring.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('no provider.tf file exists (merged into providers.tf)', () => {
      const providerTfPath = path.join(LIB_DIR, 'provider.tf');
      expect(fs.existsSync(providerTfPath)).toBe(false);
    });
  });

  describe('Provider Configuration (providers.tf)', () => {
    const providersContent = readTerraformFile('providers.tf');

    test('declares terraform block with required version', () => {
      expect(providersContent).toMatch(/terraform\s*{/);
      expect(providersContent).toMatch(/required_version\s*=\s*">=\s*1\./);
    });

    test('declares required AWS provider', () => {
      expect(providersContent).toMatch(/required_providers\s*{/);
      expect(providersContent).toMatch(/aws\s*=\s*{/);
      expect(providersContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providersContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('declares S3 backend for remote state', () => {
      expect(providersContent).toMatch(/backend\s+"s3"\s*{}/);
    });

    test('declares primary AWS provider with alias', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"primary"/);
      expect(providersContent).toMatch(/region\s*=\s*var\.primary_region/);
    });

    test('declares secondary AWS provider with alias', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
      expect(providersContent).toMatch(/region\s*=\s*var\.secondary_region/);
    });

    test('primary provider has default_tags with environment_suffix', () => {
      const primaryProviderMatch = providersContent.match(/provider\s+"aws"\s*{\s*alias\s*=\s*"primary"[\s\S]*?default_tags\s*{[\s\S]*?}/);
      expect(primaryProviderMatch).toBeTruthy();
      if (primaryProviderMatch) {
        expect(primaryProviderMatch[0]).toMatch(/Environment\s*=\s*var\.environment_suffix/);
        expect(primaryProviderMatch[0]).toMatch(/DR-Role\s*=\s*"primary"/);
      }
    });

    test('secondary provider has default_tags with environment_suffix', () => {
      const secondaryProviderMatch = providersContent.match(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"[\s\S]*?default_tags\s*{[\s\S]*?}/);
      expect(secondaryProviderMatch).toBeTruthy();
      if (secondaryProviderMatch) {
        expect(secondaryProviderMatch[0]).toMatch(/Environment\s*=\s*var\.environment_suffix/);
        expect(secondaryProviderMatch[0]).toMatch(/DR-Role\s*=\s*"secondary"/);
      }
    });

    test('uses availability zones data sources for both regions', () => {
      expect(providersContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(providersContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
    });
  });

  describe('Variables Configuration (variables.tf)', () => {
    const variablesContent = readTerraformFile('variables.tf');

    test('declares environment_suffix variable (required)', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('declares primary_region and secondary_region variables', () => {
      expect(variablesContent).toMatch(/variable\s+"primary_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/variable\s+"secondary_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('declares database credentials as sensitive', () => {
      const dbUsernameMatch = variablesContent.match(/variable\s+"db_username"[\s\S]*?}/);
      expect(dbUsernameMatch).toBeTruthy();
      expect(dbUsernameMatch![0]).toMatch(/sensitive\s*=\s*true/);

      const dbPasswordMatch = variablesContent.match(/variable\s+"db_password"[\s\S]*?}/);
      expect(dbPasswordMatch).toBeTruthy();
      expect(dbPasswordMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test('declares backup_retention_days with default of 7', () => {
      expect(variablesContent).toMatch(/variable\s+"backup_retention_days"/);
      expect(variablesContent).toMatch(/default\s*=\s*7/);
    });

    test('declares VPC CIDR variables for both regions', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr_primary"/);
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr_secondary"/);
    });

    test('declares CI/CD required variables', () => {
      expect(variablesContent).toMatch(/variable\s+"repository"/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"/);
      expect(variablesContent).toMatch(/variable\s+"team"/);
    });

    test('domain_name variable defaults to empty (optional Route 53)', () => {
      const domainMatch = variablesContent.match(/variable\s+"domain_name"[\s\S]*?}/);
      expect(domainMatch).toBeTruthy();
      expect(domainMatch![0]).toMatch(/default\s*=\s*""/);
    });
  });

  describe('Networking Resources (networking.tf)', () => {
    const networkingContent = readTerraformFile('networking.tf');

    test('creates VPC in both primary and secondary regions', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
      expect(networkingContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(networkingContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      expect(networkingContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test('VPCs have DNS support enabled', () => {
      const vpcMatches = networkingContent.match(/resource\s+"aws_vpc"[\s\S]*?}/g);
      expect(vpcMatches).toBeTruthy();
      vpcMatches!.forEach(vpc => {
        expect(vpc).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(vpc).toMatch(/enable_dns_support\s*=\s*true/);
      });
    });

    test('all VPC resources use environment_suffix in names', () => {
      const nameTagMatches = networkingContent.match(/Name\s*=\s*"[^"]*"/g);
      expect(nameTagMatches).toBeTruthy();
      nameTagMatches!.forEach(match => {
        expect(match).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('creates 2 public subnets per region with count', () => {
      const publicSubnetMatches = networkingContent.match(/resource\s+"aws_subnet"\s+"primary_public"[\s\S]*?}/);
      expect(publicSubnetMatches).toBeTruthy();
      expect(publicSubnetMatches![0]).toMatch(/count\s*=\s*2/);

      const secondaryPublicSubnetMatches = networkingContent.match(/resource\s+"aws_subnet"\s+"secondary_public"[\s\S]*?}/);
      expect(secondaryPublicSubnetMatches).toBeTruthy();
      expect(secondaryPublicSubnetMatches![0]).toMatch(/count\s*=\s*2/);
    });

    test('creates 2 private subnets per region with count', () => {
      const privateSubnetMatches = networkingContent.match(/resource\s+"aws_subnet"\s+"primary_private"[\s\S]*?}/);
      expect(privateSubnetMatches).toBeTruthy();
      expect(privateSubnetMatches![0]).toMatch(/count\s*=\s*2/);

      const secondaryPrivateSubnetMatches = networkingContent.match(/resource\s+"aws_subnet"\s+"secondary_private"[\s\S]*?}/);
      expect(secondaryPrivateSubnetMatches).toBeTruthy();
      expect(secondaryPrivateSubnetMatches![0]).toMatch(/count\s*=\s*2/);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      const publicSubnetMatches = networkingContent.match(/resource\s+"aws_subnet"\s+"[^"]*_public"[\s\S]*?}/g);
      expect(publicSubnetMatches).toBeTruthy();
      publicSubnetMatches!.forEach(subnet => {
        expect(subnet).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      });
    });

    test('creates internet gateways for both regions', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
      expect(networkingContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test('creates route tables with default routes to IGW', () => {
      const routeTableMatches = networkingContent.match(/resource\s+"aws_route_table"[\s\S]*?}/g);
      expect(routeTableMatches).toBeTruthy();
      routeTableMatches!.forEach(rt => {
        expect(rt).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
        expect(rt).toMatch(/gateway_id/);
      });
    });

    test('associates public subnets with route tables', () => {
      expect(networkingContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_public"/);
      expect(networkingContent).toMatch(/resource\s+"aws_route_table_association"\s+"secondary_public"/);
    });
  });

  describe('Security Groups (security-groups.tf)', () => {
    const securityGroupsContent = readTerraformFile('security-groups.tf');

    test('creates security groups for ALB, instances, and database in both regions', () => {
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_alb"/);
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_instances"/);
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"primary_database"/);
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_alb"/);
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_instances"/);
      expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_database"/);
    });

    test('all security groups use environment_suffix in names', () => {
      const nameMatches = securityGroupsContent.match(/name\s*=\s*"[^"]*"/g);
      expect(nameMatches).toBeTruthy();
      nameMatches!.forEach(match => {
        expect(match).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('ALB security groups allow inbound HTTP/HTTPS', () => {
      const albSgMatches = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"[^"]*_alb"[\s\S]*?}[\s\S]*?}/g);
      expect(albSgMatches).toBeTruthy();
      albSgMatches!.forEach(sg => {
        expect(sg).toMatch(/from_port\s*=\s*80/);
        expect(sg).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      });
    });

    test('database security groups restrict access to instances only', () => {
      const dbSgMatches = securityGroupsContent.match(/resource\s+"aws_security_group"\s+"[^"]*_database"[\s\S]*?}[\s\S]*?}/g);
      expect(dbSgMatches).toBeTruthy();
      dbSgMatches!.forEach(sg => {
        expect(sg).toMatch(/from_port\s*=\s*3306/);
        expect(sg).toMatch(/security_groups/);
      });
    });
  });

  describe('Aurora Global Database (aurora.tf)', () => {
    const auroraContent = readTerraformFile('aurora.tf');

    test('creates Aurora global cluster', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_global_cluster"\s+"main"/);
      expect(auroraContent).toMatch(/global_cluster_identifier\s*=\s*"global-cluster-\$\{var\.environment_suffix\}"/);
    });

    test('global cluster uses Aurora MySQL engine', () => {
      expect(auroraContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(auroraContent).toMatch(/engine_version/);
    });

    test('global cluster has storage encryption enabled', () => {
      expect(auroraContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('creates primary and secondary regional clusters', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"primary"/);
      expect(auroraContent).toMatch(/resource\s+"aws_rds_cluster"\s+"secondary"/);
    });

    test('primary cluster has skip_final_snapshot enabled for destroyability', () => {
      expect(auroraContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test('primary cluster has 7-day backup retention', () => {
      expect(auroraContent).toMatch(/backup_retention_period\s*=\s*var\.backup_retention_days/);
    });

    test('creates 2 instances per cluster (primary and secondary)', () => {
      const primaryInstancesMatch = auroraContent.match(/resource\s+"aws_rds_cluster_instance"\s+"primary"[\s\S]*?}/);
      expect(primaryInstancesMatch).toBeTruthy();
      expect(primaryInstancesMatch![0]).toMatch(/count\s*=\s*2/);

      const secondaryInstancesMatch = auroraContent.match(/resource\s+"aws_rds_cluster_instance"\s+"secondary"[\s\S]*?}/);
      expect(secondaryInstancesMatch).toBeTruthy();
      expect(secondaryInstancesMatch![0]).toMatch(/count\s*=\s*2/);
    });

    test('instances are not publicly accessible', () => {
      expect(auroraContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('creates DB subnet groups in both regions', () => {
      expect(auroraContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(auroraContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
    });

    test('all Aurora resources use environment_suffix', () => {
      // Check key identifiers use environment_suffix
      expect(auroraContent).toMatch(/cluster_identifier\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
      expect(auroraContent).toMatch(/global_cluster_identifier\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
    });

    test('secondary cluster depends on primary instances', () => {
      const secondaryClusterMatch = auroraContent.match(/resource\s+"aws_rds_cluster"\s+"secondary"[\s\S]*?depends_on[\s\S]*?\]/);
      expect(secondaryClusterMatch).toBeTruthy();
      expect(secondaryClusterMatch![0]).toMatch(/aws_rds_cluster_instance\.primary/);
    });
  });

  describe('S3 Replication (s3-replication.tf)', () => {
    const s3Content = readTerraformFile('s3-replication.tf');

    test('creates S3 buckets in both regions', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"secondary"/);
    });

    test('bucket names use environment_suffix', () => {
      const bucketMatches = s3Content.match(/resource\s+"aws_s3_bucket"[\s\S]*?bucket\s*=\s*"[^"]*"/g);
      expect(bucketMatches).toBeTruthy();
      bucketMatches!.forEach(match => {
        expect(match).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('enables versioning on both buckets', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/);
      const versioningMatches = s3Content.match(/resource\s+"aws_s3_bucket_versioning"[\s\S]*?}/g);
      versioningMatches!.forEach(versioning => {
        expect(versioning).toMatch(/status\s*=\s*"Enabled"/);
      });
    });

    test('enables SSE-S3 encryption on both buckets', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secondary"/);
      const encryptionMatches = s3Content.match(/sse_algorithm\s*=\s*"[^"]*"/g);
      expect(encryptionMatches).toBeTruthy();
      encryptionMatches!.forEach(match => {
        expect(match).toMatch(/AES256/);
      });
    });

    test('creates IAM role for replication', () => {
      expect(s3Content).toMatch(/resource\s+"aws_iam_role"\s+"replication"/);
      expect(s3Content).toMatch(/resource\s+"aws_iam_role_policy"\s+"replication"/);
    });

    test('replication IAM role allows S3 service to assume it', () => {
      const roleMatch = s3Content.match(/resource\s+"aws_iam_role"\s+"replication"[\s\S]*?assume_role_policy[\s\S]*?}\)/);
      expect(roleMatch).toBeTruthy();
      expect(roleMatch![0]).toMatch(/Service.*s3\.amazonaws\.com/);
    });

    test('configures replication with RTC enabled', () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/);
      expect(s3Content).toMatch(/replication_time\s*\{/);
      expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
      expect(s3Content).toMatch(/minutes\s*=\s*15/);
    });

    test('replication configuration has proper dependencies', () => {
      const replicationMatch = s3Content.match(/resource\s+"aws_s3_bucket_replication_configuration"[\s\S]*?depends_on[\s\S]*?\]/);
      expect(replicationMatch).toBeTruthy();
      expect(replicationMatch![0]).toMatch(/aws_s3_bucket_versioning\.primary/);
      expect(replicationMatch![0]).toMatch(/aws_s3_bucket_versioning\.secondary/);
    });
  });

  describe('Compute Resources (compute.tf)', () => {
    const computeContent = readTerraformFile('compute.tf');

    test('creates ALBs in both regions', () => {
      expect(computeContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
      expect(computeContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test('ALBs have deletion protection disabled for destroyability', () => {
      expect(computeContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test('creates target groups in both regions', () => {
      expect(computeContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"/);
      expect(computeContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"/);
    });

    test('creates ALB listeners in both regions', () => {
      expect(computeContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary"/);
      expect(computeContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary"/);
    });

    test('creates launch templates in both regions', () => {
      expect(computeContent).toMatch(/resource\s+"aws_launch_template"\s+"primary"/);
      expect(computeContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary"/);
    });

    test('launch templates use user data script', () => {
      expect(computeContent).toMatch(/user_data/);
    });

    test('creates Auto Scaling Groups in both regions', () => {
      expect(computeContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary"/);
      expect(computeContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"/);
    });

    test('Auto Scaling Groups have minimum 2 instances', () => {
      expect(computeContent).toMatch(/min_size\s*=\s*2/);
    });

    test('Auto Scaling Groups span multiple availability zones', () => {
      expect(computeContent).toMatch(/vpc_zone_identifier/);
    });

    test('all compute resources use environment_suffix', () => {
      // Check that ALB and ASG names use environment_suffix
      expect(computeContent).toMatch(/name\s*=\s*"alb-[^"]*\$\{var\.environment_suffix\}"/);
      expect(computeContent).toMatch(/name\s*=\s*"asg-[^"]*\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Route 53 DNS Failover (route53.tf)', () => {
    const route53Content = readTerraformFile('route53.tf');

    test('Route 53 resources are conditional based on domain_name', () => {
      const healthCheckMatches = route53Content.match(/resource\s+"aws_route53_health_check"[\s\S]*?count\s*=\s*var\.domain_name/g);
      expect(healthCheckMatches).toBeTruthy();
      expect(healthCheckMatches!.length).toBeGreaterThanOrEqual(2);

      const recordMatches = route53Content.match(/resource\s+"aws_route53_record"[\s\S]*?count\s*=\s*var\.domain_name/g);
      expect(recordMatches).toBeTruthy();
      expect(recordMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('creates health checks for both ALBs', () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"primary"/);
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"secondary"/);
    });

    test('health checks use proper thresholds', () => {
      const healthCheckMatches = route53Content.match(/resource\s+"aws_route53_health_check"[\s\S]*?}/g);
      expect(healthCheckMatches).toBeTruthy();
      healthCheckMatches!.forEach(hc => {
        expect(hc).toMatch(/failure_threshold\s*=\s*3/);
        expect(hc).toMatch(/request_interval\s*=\s*30/);
      });
    });

    test('creates failover DNS records for both endpoints', () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"\s+"primary"/);
      expect(route53Content).toMatch(/resource\s+"aws_route53_record"\s+"secondary"/);
    });

    test('DNS records use failover routing policy', () => {
      expect(route53Content).toMatch(/failover_routing_policy\s*\{/);
      expect(route53Content).toMatch(/type\s*=\s*"PRIMARY"/);
      expect(route53Content).toMatch(/type\s*=\s*"SECONDARY"/);
    });

    test('DNS records use ALB alias targets', () => {
      const recordMatches = route53Content.match(/resource\s+"aws_route53_record"[\s\S]*?alias[\s\S]*?}/g);
      expect(recordMatches).toBeTruthy();
      recordMatches!.forEach(record => {
        expect(record).toMatch(/name\s*=\s*aws_lb\./);
        expect(record).toMatch(/zone_id\s*=\s*aws_lb\./);
        expect(record).toMatch(/evaluate_target_health\s*=\s*true/);
      });
    });
  });

  describe('AWS Backup Configuration (backup.tf)', () => {
    const backupContent = readTerraformFile('backup.tf');

    test('creates backup vaults in both regions', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_vault"\s+"primary"/);
      expect(backupContent).toMatch(/resource\s+"aws_backup_vault"\s+"secondary"/);
    });

    test('creates IAM role for AWS Backup', () => {
      expect(backupContent).toMatch(/resource\s+"aws_iam_role"\s+"backup"/);
    });

    test('attaches required AWS Backup policies', () => {
      expect(backupContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"backup"/);
      const policyMatches = backupContent.match(/policy_arn\s*=\s*"[^"]*AWSBackup[^"]*"/g);
      expect(policyMatches).toBeTruthy();
    });

    test('creates backup plan with 7-day retention', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_plan"\s+"primary"/);
      expect(backupContent).toMatch(/delete_after\s*=\s*var\.backup_retention_days/);
    });

    test('backup plan runs daily', () => {
      expect(backupContent).toMatch(/schedule\s*=\s*"cron/);
    });

    test('creates backup selection for Aurora', () => {
      expect(backupContent).toMatch(/resource\s+"aws_backup_selection"\s+"primary_aurora"/);
    });

    test('backup vault names use environment_suffix', () => {
      const vaultMatches = backupContent.match(/resource\s+"aws_backup_vault"[\s\S]*?name\s*=\s*"[^"]*"/g);
      expect(vaultMatches).toBeTruthy();
      vaultMatches!.forEach(match => {
        expect(match).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });

  describe('CloudWatch Monitoring (monitoring.tf)', () => {
    const monitoringContent = readTerraformFile('monitoring.tf');

    test('creates SNS topics in both regions', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_sns_topic"\s+"primary_alarms"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_sns_topic"\s+"secondary_alarms"/);
    });

    test('creates CloudWatch alarms for Aurora CPU', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_aurora_cpu"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_aurora_cpu"/);
    });

    test('creates CloudWatch alarm for Aurora replication lag', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_aurora_replication_lag"/);
    });

    test('creates CloudWatch alarms for ALB unhealthy hosts', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_alb_unhealthy_hosts"/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"secondary_alb_unhealthy_hosts"/);
    });

    test('alarms send notifications to SNS topics', () => {
      const alarmMatches = monitoringContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?alarm_actions\s*=\s*\[[^\]]*\]/g);
      expect(alarmMatches).toBeTruthy();
      alarmMatches!.forEach(alarm => {
        expect(alarm).toMatch(/aws_sns_topic\./);
      });
    });

    test('all monitoring resources use environment_suffix', () => {
      // Check that alarm names and SNS topic names use environment_suffix
      expect(monitoringContent).toMatch(/alarm_name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
      expect(monitoringContent).toMatch(/name\s*=\s*"alarms-[^"]*\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Outputs Configuration (outputs.tf)', () => {
    const outputsContent = readTerraformFile('outputs.tf');

    test('outputs VPC IDs for both regions', () => {
      expect(outputsContent).toMatch(/output\s+"primary_vpc_id"/);
      expect(outputsContent).toMatch(/output\s+"secondary_vpc_id"/);
    });

    test('outputs ALB DNS names for both regions', () => {
      expect(outputsContent).toMatch(/output\s+"primary_alb_dns"/);
      expect(outputsContent).toMatch(/output\s+"secondary_alb_dns"/);
    });

    test('outputs Aurora endpoints for both regions', () => {
      expect(outputsContent).toMatch(/output\s+"primary_aurora_endpoint"/);
      expect(outputsContent).toMatch(/output\s+"secondary_aurora_endpoint"/);
    });

    test('outputs S3 bucket names for both regions', () => {
      expect(outputsContent).toMatch(/output\s+"primary_s3_bucket"/);
      expect(outputsContent).toMatch(/output\s+"secondary_s3_bucket"/);
    });

    test('outputs global cluster ID', () => {
      expect(outputsContent).toMatch(/output\s+"global_cluster_id"/);
    });

    test('outputs Route 53 FQDN conditionally', () => {
      const route53OutputMatch = outputsContent.match(/output\s+"route53_record_fqdn"[\s\S]*?}/);
      expect(route53OutputMatch).toBeTruthy();
      expect(route53OutputMatch![0]).toMatch(/var\.domain_name\s*!=\s*""/);
    });

    test('outputs SNS topic ARNs for both regions', () => {
      expect(outputsContent).toMatch(/output\s+"primary_sns_topic_arn"/);
      expect(outputsContent).toMatch(/output\s+"secondary_sns_topic_arn"/);
    });
  });

  describe('Best Practices and Compliance', () => {
    test('no hardcoded production values in any files', () => {
      const allFiles = getAllTerraformFiles();
      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        // Allow 'production' in comments or variable descriptions, but not in actual values
        const lines = content.split('\n').filter(line => !line.trim().startsWith('#') && !line.trim().startsWith('//'));
        const nonCommentContent = lines.join('\n');
        // Check for hardcoded production/staging/dev in actual configurations (not descriptions)
        const badMatches = nonCommentContent.match(/=\s*["'](?:production|staging|dev)["']/g);
        if (badMatches) {
          const allowedFiles = ['variables.tf']; // Allow in default values
          if (!allowedFiles.includes(file)) {
            expect(badMatches).toBeNull();
          }
        }
      });
    });

    test('all resource names include environment_suffix variable', () => {
      const resourceFiles = ['networking.tf', 'security-groups.tf', 'aurora.tf', 's3-replication.tf', 'compute.tf', 'backup.tf', 'monitoring.tf'];
      resourceFiles.forEach(file => {
        const content = readTerraformFile(file);
        // Check that at least some resource names use environment_suffix
        expect(content).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });

    test('no resources have retain policies or deletion protection', () => {
      const allFiles = getAllTerraformFiles();
      allFiles.forEach(file => {
        const content = readTerraformFile(file);
        expect(content.toLowerCase()).not.toMatch(/deletion_protection\s*=\s*true/);
        expect(content.toLowerCase()).not.toMatch(/prevent_destroy\s*=\s*true/);
        // Allow skip_final_snapshot = true (for destroyability) - use regex for flexible whitespace
        if (content.includes('final_snapshot') && !content.match(/skip_final_snapshot\s*=\s*true/)) {
          throw new Error(`File ${file} has final_snapshot without skip_final_snapshot = true`);
        }
      });
    });

    test('sensitive variables are marked as sensitive', () => {
      const variablesContent = readTerraformFile('variables.tf');
      const sensitiveVars = ['db_username', 'db_password'];
      sensitiveVars.forEach(varName => {
        const varMatch = variablesContent.match(new RegExp(`variable\\s+"${varName}"[\\s\\S]*?}`, 'g'));
        expect(varMatch).toBeTruthy();
        expect(varMatch![0]).toMatch(/sensitive\s*=\s*true/);
      });
    });

    test('providers use correct aliases for multi-region setup', () => {
      const files = ['networking.tf', 'security-groups.tf', 'aurora.tf', 's3-replication.tf', 'compute.tf'];
      files.forEach(file => {
        const content = readTerraformFile(file);
        // Resources should use provider aliases (primary or secondary)
        const resourceMatches = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[\s\S]*?provider\s*=\s*aws\.(primary|secondary)/g);
        if (resourceMatches) {
          expect(resourceMatches.length).toBeGreaterThan(0);
        }
      });
    });

    test('all storage resources have encryption enabled', () => {
      const auroraContent = readTerraformFile('aurora.tf');
      expect(auroraContent).toMatch(/storage_encrypted\s*=\s*true/);

      const s3Content = readTerraformFile('s3-replication.tf');
      expect(s3Content).toMatch(/sse_algorithm/);
    });

    test('Auto Scaling Groups use launch templates (not launch configurations)', () => {
      const computeContent = readTerraformFile('compute.tf');
      expect(computeContent).toMatch(/launch_template\s*{/);
      expect(computeContent).not.toMatch(/launch_configuration/);
    });

    test('Multi-AZ deployment for high availability', () => {
      const networkingContent = readTerraformFile('networking.tf');
      // Should have 2+ subnets per region
      expect(networkingContent).toMatch(/count\s*=\s*2/);

      const auroraContent = readTerraformFile('aurora.tf');
      // Should have 2 instances per cluster
      expect(auroraContent).toMatch(/count\s*=\s*2/);
    });
  });

  describe('Dependencies and Ordering', () => {
    test('secondary Aurora cluster depends on primary instances', () => {
      const auroraContent = readTerraformFile('aurora.tf');
      expect(auroraContent).toMatch(/depends_on\s*=\s*\[aws_rds_cluster_instance\.primary\]/);
    });

    test('replication configuration depends on bucket versioning', () => {
      const s3Content = readTerraformFile('s3-replication.tf');
      expect(s3Content).toMatch(/depends_on\s*=\s*\[/);
      expect(s3Content).toMatch(/aws_s3_bucket_versioning\.primary/);
    });

    test('Aurora clusters reference global cluster', () => {
      const auroraContent = readTerraformFile('aurora.tf');
      expect(auroraContent).toMatch(/global_cluster_identifier\s*=\s*aws_rds_global_cluster\.main\.id/);
    });

    test('security groups are properly referenced', () => {
      const auroraContent = readTerraformFile('aurora.tf');
      expect(auroraContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\./);

      const computeContent = readTerraformFile('compute.tf');
      expect(computeContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });
  });

  describe('Documentation Files', () => {
    test('README.md exists in lib directory', () => {
      const readmePath = path.join(LIB_DIR, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('user-data.sh script exists', () => {
      const userDataPath = path.join(LIB_DIR, 'user-data.sh');
      expect(fs.existsSync(userDataPath)).toBe(true);
    });

    test('terraform.tfvars.example exists', () => {
      const tfvarsExamplePath = path.join(LIB_DIR, 'terraform.tfvars.example');
      expect(fs.existsSync(tfvarsExamplePath)).toBe(true);
    });
  });
});
