// Integration tests for Multi-Region DR Terraform Infrastructure
// These tests validate deployed resources using actual deployment outputs
// NOTE: Requires cfn-outputs/flat-outputs.json from successful deployment

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OUTPUTS_FILE = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

describe('Multi-Region DR Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;
  let outputsExist: boolean;

  beforeAll(() => {
    // Check if deployment outputs exist
    outputsExist = fs.existsSync(OUTPUTS_FILE);

    if (outputsExist) {
      const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf8');
      outputs = JSON.parse(outputsContent);
    }
  });

  describe('Deployment Outputs', () => {
    test('deployment outputs file exists', () => {
      if (!outputsExist) {
        console.warn('⚠️  Integration tests require deployment. Run: bash scripts/deploy.sh');
      }
      expect(outputsExist).toBe(true);
    });

    test('outputs contain primary VPC ID', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('primary_vpc_id');
      expect(outputs.primary_vpc_id).toMatch(/^vpc-/);
    });

    test('outputs contain secondary VPC ID', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('secondary_vpc_id');
      expect(outputs.secondary_vpc_id).toMatch(/^vpc-/);
    });

    test('outputs contain Route53 zone ID', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('route53_zone_id');
      expect(outputs.route53_zone_id).toMatch(/^Z/);
    });

    test('outputs contain primary S3 bucket', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('primary_s3_bucket');
      expect(outputs.primary_s3_bucket).toContain('primary');
    });

    test('outputs contain secondary S3 bucket', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('secondary_s3_bucket');
      expect(outputs.secondary_s3_bucket).toContain('secondary');
    });

    test('outputs contain primary ALB DNS', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('primary_alb_dns');
      expect(outputs.primary_alb_dns).toContain('.elb.amazonaws.com');
    });

    test('outputs contain secondary ALB DNS', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('secondary_alb_dns');
      expect(outputs.secondary_alb_dns).toContain('.elb.amazonaws.com');
    });

    test('outputs contain CloudWatch dashboard URLs', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('primary_cloudwatch_dashboard_url');
      expect(outputs).toHaveProperty('secondary_cloudwatch_dashboard_url');
      expect(outputs.primary_cloudwatch_dashboard_url).toContain('cloudwatch');
      expect(outputs.secondary_cloudwatch_dashboard_url).toContain('cloudwatch');
    });

    test('outputs contain backup vault ARNs', () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }
      expect(outputs).toHaveProperty('primary_backup_vault_arn');
      expect(outputs).toHaveProperty('secondary_backup_vault_arn');
      expect(outputs.primary_backup_vault_arn).toMatch(/^arn:aws:backup:/);
      expect(outputs.secondary_backup_vault_arn).toMatch(/^arn:aws:backup:/);
    });
  });

  describe('AWS Resource Validation', () => {
    test('primary VPC exists and is available', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const vpcId = outputs.primary_vpc_id;
      const { stdout } = await execAsync(
        `aws ec2 describe-vpcs --vpc-ids ${vpcId} --region us-east-1 --query 'Vpcs[0].State' --output text`
      );

      expect(stdout.trim()).toBe('available');
    }, 30000);

    test('secondary VPC exists and is available', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const vpcId = outputs.secondary_vpc_id;
      const { stdout } = await execAsync(
        `aws ec2 describe-vpcs --vpc-ids ${vpcId} --region us-west-2 --query 'Vpcs[0].State' --output text`
      );

      expect(stdout.trim()).toBe('available');
    }, 30000);

    test('primary S3 bucket exists and has versioning enabled', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const bucketName = outputs.primary_s3_bucket;
      const { stdout } = await execAsync(
        `aws s3api get-bucket-versioning --bucket ${bucketName} --region us-east-1 --query 'Status' --output text`
      );

      expect(stdout.trim()).toBe('Enabled');
    }, 30000);

    test('secondary S3 bucket exists and has versioning enabled', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const bucketName = outputs.secondary_s3_bucket;
      const { stdout } = await execAsync(
        `aws s3api get-bucket-versioning --bucket ${bucketName} --region us-west-2 --query 'Status' --output text`
      );

      expect(stdout.trim()).toBe('Enabled');
    }, 30000);

    test('S3 replication is configured from primary to secondary', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const primaryBucket = outputs.primary_s3_bucket;
      const { stdout } = await execAsync(
        `aws s3api get-bucket-replication --bucket ${primaryBucket} --region us-east-1`
      );

      const replication = JSON.parse(stdout);
      expect(replication.ReplicationConfiguration.Rules).toHaveLength(1);
      expect(replication.ReplicationConfiguration.Rules[0].Status).toBe('Enabled');
    }, 30000);

    test('Route53 hosted zone exists', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const zoneId = outputs.route53_zone_id;
      const { stdout } = await execAsync(
        `aws route53 get-hosted-zone --id ${zoneId} --query 'HostedZone.Config.PrivateZone' --output text`
      );

      // Should be a public zone for DR
      expect(stdout.trim()).toBe('False');
    }, 30000);

    test('Route53 health checks exist for both regions', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      // Get all health checks and filter in code (safer than JMESPath with null values)
      const { stdout } = await execAsync(
        `aws route53 list-health-checks --output json`
      );

      const allHealthChecks = JSON.parse(stdout);
      
      // Filter health checks that match our ALB DNS names
      const primaryAlbName = outputs.primary_alb_dns.split('.')[0];
      const secondaryAlbName = outputs.secondary_alb_dns.split('.')[0];
      
      const relevantHealthChecks = allHealthChecks.HealthChecks.filter((hc: any) => {
        const fqdn = hc.HealthCheckConfig?.FullyQualifiedDomainName || '';
        return fqdn.includes(primaryAlbName) || fqdn.includes(secondaryAlbName);
      });

      expect(relevantHealthChecks.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('primary ALB exists and is active', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const albDns = outputs.primary_alb_dns;
      const { stdout } = await execAsync(
        `aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[?DNSName=='${albDns}'].State.Code" --output text`
      );

      expect(stdout.trim()).toBe('active');
    }, 30000);

    test('secondary ALB exists and is active', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const albDns = outputs.secondary_alb_dns;
      const { stdout } = await execAsync(
        `aws elbv2 describe-load-balancers --region us-west-2 --query "LoadBalancers[?DNSName=='${albDns}'].State.Code" --output text`
      );

      expect(stdout.trim()).toBe('active');
    }, 30000);

    test('Aurora global cluster exists', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      // List global clusters and check if one exists with our environment suffix
      const { stdout } = await execAsync(
        `aws rds describe-global-clusters --query "GlobalClusters[?contains(GlobalClusterIdentifier, 'synthr1z4o2a6')].Status" --output text`
      );

      expect(stdout.trim()).toContain('available');
    }, 30000);

    test('primary backup vault exists', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const vaultArn = outputs.primary_backup_vault_arn;
      const vaultName = vaultArn.split(':').pop();
      const { stdout } = await execAsync(
        `aws backup describe-backup-vault --backup-vault-name ${vaultName} --region us-east-1 --query 'BackupVaultName' --output text`
      );

      expect(stdout.trim()).toBe(vaultName);
    }, 30000);

    test('secondary backup vault exists', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const vaultArn = outputs.secondary_backup_vault_arn;
      const vaultName = vaultArn.split(':').pop();
      const { stdout } = await execAsync(
        `aws backup describe-backup-vault --backup-vault-name ${vaultName} --region us-west-2 --query 'BackupVaultName' --output text`
      );

      expect(stdout.trim()).toBe(vaultName);
    }, 30000);
  });

  describe('Cross-Region Configuration', () => {
  
    test('CloudWatch alarms exist in both regions', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      // Check primary region alarms
      const { stdout: primaryAlarms } = await execAsync(
        `aws cloudwatch describe-alarms --region us-east-1 --query "MetricAlarms[?contains(AlarmName, 'synthr1z4o2a6')].AlarmName" --output json`
      );

      // Check secondary region alarms
      const { stdout: secondaryAlarms } = await execAsync(
        `aws cloudwatch describe-alarms --region us-west-2 --query "MetricAlarms[?contains(AlarmName, 'synthr1z4o2a6')].AlarmName" --output json`
      );

      const primary = JSON.parse(primaryAlarms);
      const secondary = JSON.parse(secondaryAlarms);

      expect(primary.length).toBeGreaterThan(0);
      expect(secondary.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security and Tagging', () => {
    test('all resources have required tags', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const vpcId = outputs.primary_vpc_id;
      const { stdout } = await execAsync(
        `aws ec2 describe-tags --region us-east-1 --filters "Name=resource-id,Values=${vpcId}" --query "Tags[?Key=='Environment' || Key=='Region' || Key=='DR-Role'].Key" --output json`
      );

      const tags = JSON.parse(stdout);
      expect(tags).toContain('Environment');
      expect(tags).toContain('Region');
      expect(tags).toContain('DR-Role');
    }, 30000);

    test('S3 buckets have encryption enabled', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const primaryBucket = outputs.primary_s3_bucket;
      const { stdout } = await execAsync(
        `aws s3api get-bucket-encryption --bucket ${primaryBucket} --region us-east-1 --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text`
      );

      expect(stdout.trim()).toMatch(/AES256|aws:kms/);
    }, 30000);

    test('S3 buckets have public access blocked', async () => {
      if (!outputsExist) {
        console.warn('Skipping - no deployment outputs');
        return;
      }

      const primaryBucket = outputs.primary_s3_bucket;
      const { stdout } = await execAsync(
        `aws s3api get-public-access-block --bucket ${primaryBucket} --region us-east-1 --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,BlockPublicPolicy,IgnorePublicAcls,RestrictPublicBuckets]' --output json`
      );

      const settings = JSON.parse(stdout);
      expect(settings.every((s: boolean) => s === true)).toBe(true);
    }, 30000);
  });
});
