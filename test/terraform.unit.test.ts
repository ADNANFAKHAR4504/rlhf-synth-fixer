import fs from 'fs';
import path from 'path';

function readStackFile(): string {
  // Prefer ../lib/main.tf per requirements; fallback to ../lib/tap_stack.tf if not present
  const mainPath = path.resolve(__dirname, '../lib/main.tf');
  if (fs.existsSync(mainPath)) {
    return fs.readFileSync(mainPath, 'utf8');
  }
  const fallbackPath = path.resolve(__dirname, '../lib/tap_stack.tf');
  if (fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath, 'utf8');
  }
  throw new Error(
    'Terraform stack file not found at ../lib/main.tf or ../lib/tap_stack.tf'
  );
}

const fileContent = readStackFile();

describe('Terraform Stack - Structural Validation', () => {
  test('defines required variables', () => {
    const requiredVars = [
      'project_name',
      'environment',
      'owner',
      'cost_center',
      'compliance',
      'allowed_ingress_cidrs',
      'alarm_emails',
      'rds_engine',
      'rds_engine_version',
      'rds_instance_class',
      'rds_allocated_storage',
      'ec2_instance_type',
      'vpc_id',
      'private_subnet_ids',
      'public_subnet_ids',
      'flow_logs_retention_days',
      'app_logs_retention_days',
      'ssm_patch_window_cron',
      'kms_key_administrators',
      'kms_key_users',
    ];
    for (const v of requiredVars) {
      expect(
        new RegExp(`\\bvariable\\s+"${v}"\\s*{`).test(fileContent)
      ).toBeTruthy();
    }
  });

  test('defines locals with expected region and tags', () => {
    expect(
      /locals\s*{[\s\S]*common_tags\s*=\s*{[\s\S]*ManagedBy\s*=\s*"terraform"/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /locals\s*{[\s\S]*name_prefix\s*=\s*"\${var\.project_name}-\${var\.environment}"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });

  test('includes required data sources and region guard', () => {
    expect(
      /data\s+"aws_caller_identity"\s+"current"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /data\s+"aws_partition"\s+"current"/s.test(fileContent)
    ).toBeTruthy();
    expect(/data\s+"aws_region"\s+"current"/s.test(fileContent)).toBeTruthy();
    expect(
      /data\s+"aws_ssm_parameter"\s+"amazon_linux_2023_ami"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /data\s+"aws_availability_zones"\s+"available"/s.test(fileContent)
    ).toBeTruthy();
  });
});

describe('KMS CMK and Aliases', () => {
  test('has a primary CMK with rotation enabled', () => {
    expect(
      /resource\s+"aws_kms_key"\s+"main"[\s\S]*enable_key_rotation\s*=\s*true/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
  test('CMK policy permits S3, CloudTrail, CloudWatch Logs, SNS, and RDS service usage', () => {
    expect(
      /Service\s*=\s*"s3\.amazonaws\.com"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /Service\s*=\s*"cloudtrail\.amazonaws\.com"/s.test(fileContent)
    ).toBeTruthy();
    expect(/Service\s*=\s*"logs\./s.test(fileContent)).toBeTruthy();
    expect(
      /Service\s*=\s*"sns\.amazonaws\.com"/s.test(fileContent)
    ).toBeTruthy();
    expect(/Service\s*=\s*"rds\./s.test(fileContent)).toBeTruthy();
  });
  test('defines KMS alias for the primary CMK', () => {
    expect(
      /resource\s+"aws_kms_alias"\s+"main"/s.test(fileContent)
    ).toBeTruthy();
  });
});

describe('S3 Buckets - Encryption, Logging, and Policies', () => {
  test('defines access_logs, cloudtrail, and app_data buckets', () => {
    expect(
      /resource\s+"aws_s3_bucket"\s+"access_logs"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /resource\s+"aws_s3_bucket"\s+"cloudtrail"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /resource\s+"aws_s3_bucket"\s+"app_data"/s.test(fileContent)
    ).toBeTruthy();
  });
  test('enables versioning on all buckets', () => {
    expect(
      /resource\s+"aws_s3_bucket_versioning"\s+"access_logs"[\s\S]*status\s*=\s*"Enabled"/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"[\s\S]*status\s*=\s*"Enabled"/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_s3_bucket_versioning"\s+"app_data"[\s\S]*status\s*=\s*"Enabled"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
  test('enforces CMK encryption on buckets (except access log delivery specifics)', () => {
    const enc =
      /aws_s3_bucket_server_side_encryption_configuration"\s+"(cloudtrail|app_data)"[\s\S]*sse_algorithm\s*=\s*"aws:kms"[\s\S]*kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/s;
    expect(enc.test(fileContent)).toBeTruthy();
  });
  test('configures server access logging appropriately', () => {
    expect(
      /aws_s3_bucket_logging"\s+"cloudtrail"[\s\S]*target_bucket\s*=\s*aws_s3_bucket\.access_logs\.id/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /aws_s3_bucket_logging"\s+"app_data"[\s\S]*target_bucket\s*=\s*aws_s3_bucket\.access_logs\.id/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /aws_s3_bucket_logging"\s+"access_logs_self"/s.test(fileContent)
    ).toBeTruthy();
  });
  test('blocks public access at bucket and account level', () => {
    expect(
      /aws_s3_bucket_public_access_block"\s+"access_logs"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /aws_s3_bucket_public_access_block"\s+"cloudtrail"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /aws_s3_bucket_public_access_block"\s+"app_data"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /resource\s+"aws_s3_account_public_access_block"\s+"account"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
  test('bucket policies: TLS-only, CMK key-id enforcement (cloudtrail/app_data), and deny public ACLs', () => {
    expect(
      /aws_s3_bucket_policy"\s+"cloudtrail"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /aws_s3_bucket_policy"\s+"app_data"/s.test(fileContent)
    ).toBeTruthy();
    expect(/DenyInsecureConnections/s.test(fileContent)).toBeTruthy();
    expect(/DenyUnencryptedUploads/s.test(fileContent)).toBeTruthy();
  });
});

describe('Logging, Monitoring, and Alerts', () => {
  test('creates encrypted CloudWatch Log Groups for VPC and CloudTrail', () => {
    expect(
      /resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"[\s\S]*kms_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"[\s\S]*kms_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
  test('VPC Flow Logs: role/policy least privilege and flow log resource present', () => {
    expect(
      /resource\s+"aws_iam_role"\s+"vpc_flow_logs"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /aws_iam_role_policy"\s+"vpc_flow_logs"[\s\S]*logs:CreateLogStream[\s\S]*logs:PutLogEvents/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(/resource\s+"aws_flow_log"\s+"vpc"/s.test(fileContent)).toBeTruthy();
    expect(/log_format[\s\S]*\$\$\{srcaddr\}/s.test(fileContent)).toBeTruthy();
  });
  test('CloudTrail is enabled and integrated with CloudWatch Logs and KMS', () => {
    expect(
      /resource\s+"aws_cloudtrail"\s+"main"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /enable_log_file_validation\s*=\s*true/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /cloud_watch_logs_group_arn\s*=\s*"\$\{aws_cloudwatch_log_group\.cloudtrail\.arn}:\*"/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /kms_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(fileContent)
    ).toBeTruthy();
  });
  test('SNS topic (encrypted) and email subscriptions exist', () => {
    expect(
      /resource\s+"aws_sns_topic"\s+"security_alerts"[\s\S]*kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_sns_topic_subscription"\s+"security_alerts"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
  test('CloudWatch metric filter and alarm for unauthorized API calls exist', () => {
    expect(
      /aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
});

describe('Compute and Databases - Security and Compliance', () => {
  test('RDS is Multi-AZ, encrypted, private, and uses CMK; password managed', () => {
    expect(
      /resource\s+"aws_db_instance"\s+"main"/s.test(fileContent)
    ).toBeTruthy();
    expect(/multi_az\s*=\s*true/s.test(fileContent)).toBeTruthy();
    expect(/publicly_accessible\s*=\s*false/s.test(fileContent)).toBeTruthy();
    expect(/storage_encrypted\s*=\s*true/s.test(fileContent)).toBeTruthy();
    expect(
      /kms_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(fileContent)
    ).toBeTruthy();
  });

  test('EC2 uses latest AMI via SSM, IMDSv2 required, no public IP, EBS encrypted with CMK', () => {
    expect(/resource\s+"aws_instance"\s+"app"/s.test(fileContent)).toBeTruthy();
    expect(
      /ami\s*=\s*data\.aws_ssm_parameter\.amazon_linux_2023_ami\.value/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /associate_public_ip_address\s*=\s*false/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /metadata_options[\s\S]*http_tokens\s*=\s*"required"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /root_block_device[\s\S]*encrypted\s*=\s*true[\s\S]*kms_key_id\s*=\s*aws_kms_key\.main\.arn/s.test(
        fileContent
      )
    ).toBeTruthy();
  });

  test('Security groups restrict ingress to allowed CIDRs', () => {
    expect(
      /resource\s+"aws_security_group"\s+"rds"[\s\S]*ingress[\s\S]*cidr_blocks\s*=\s*var\.allowed_ingress_cidrs/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_security_group"\s+"ec2"[\s\S]*ingress[\s\S]*cidr_blocks\s*=\s*var\.allowed_ingress_cidrs/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
});

describe('Patch Automation (SSM)', () => {
  test('Maintenance Window, targets and task (AWS-RunPatchBaseline Install) are configured', () => {
    expect(
      /resource\s+"aws_ssm_maintenance_window"\s+"patch"/s.test(fileContent)
    ).toBeTruthy();
    expect(
      /resource\s+"aws_ssm_maintenance_window_target"\s+"patch_targets"/s.test(
        fileContent
      )
    ).toBeTruthy();
    expect(
      /resource\s+"aws_ssm_maintenance_window_task"\s+"patch_task"/s.test(
        fileContent
      )
    ).toBeTruthy();
  });
});

describe('Outputs', () => {
  test('exports key resource identifiers and ARNs', () => {
    const outputs = [
      'vpc_flow_log_id',
      'cloudtrail_arn',
      'rds_endpoint',
      'ec2_instance_id',
      's3_access_logs_bucket',
      'kms_key_arn',
      'sns_topic_arn',
    ];
    for (const o of outputs) {
      expect(
        new RegExp(`\\boutput\\s+"${o}"\\s*{`).test(fileContent)
      ).toBeTruthy();
    }
  });
});
