import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Legal Document Storage - Terraform Unit Tests', () => {
  describe('File Structure', () => {
    test('versions.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'versions.tf'))).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('data.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'data.tf'))).toBe(true);
    });

    test('locals.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'locals.tf'))).toBe(true);
    });

    test('security.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'security.tf'))).toBe(true);
    });

    test('storage.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'storage.tf'))).toBe(true);
    });

    test('iam.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'iam.tf'))).toBe(true);
    });

    test('monitoring.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'monitoring.tf'))).toBe(true);
    });

    test('compute.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'compute.tf'))).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('Lambda compliance check exists', () => {
      expect(
        fs.existsSync(path.join(LIB_DIR, 'lambda-compliance-check/index.py'))
      ).toBe(true);
    });

    test('Lambda monthly report exists', () => {
      expect(
        fs.existsSync(path.join(LIB_DIR, 'lambda-monthly-report/index.py'))
      ).toBe(true);
    });
  });

  describe('Provider Configuration - versions.tf', () => {
    let versionsContent: string;

    beforeAll(() => {
      versionsContent = fs.readFileSync(
        path.join(LIB_DIR, 'versions.tf'),
        'utf8'
      );
    });

    test('requires Terraform version >= 1.0', () => {
      expect(versionsContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('declares AWS provider with version ~> 5.0', () => {
      expect(versionsContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(versionsContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('declares archive provider', () => {
      expect(versionsContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
      expect(versionsContent).toMatch(/version\s*=\s*"~>\s*2\.0"/);
    });

    test('declares random provider', () => {
      expect(versionsContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(versionsContent).toMatch(/version\s*=\s*"~>\s*3\.0"/);
    });

    test('configures default tags', () => {
      expect(versionsContent).toMatch(/default_tags/);
      expect(versionsContent).toMatch(/Project/);
      expect(versionsContent).toMatch(/Environment/);
      expect(versionsContent).toMatch(/ManagedBy.*=.*"Terraform"/);
    });
  });

  describe('Variables Configuration - variables.tf', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(
        path.join(LIB_DIR, 'variables.tf'),
        'utf8'
      );
    });

    test('defines aws_region variable with default us-east-1', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('defines project_name variable with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toContain('[a-z0-9-]');
    });

    test('defines environment variable with validation for dev, staging, prod', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/contains.*dev.*staging.*prod/);
    });

    test('defines environment_suffix variable with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toContain('[a-z0-9-]');
      expect(variablesContent).toContain('ENVIRONMENT_SUFFIX');
    });

    test('defines primary_bucket_name variable with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"primary_bucket_name"/);
      expect(variablesContent).toMatch(/validation\s*{/);
    });

    test('defines enable_object_lock variable with default true', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_object_lock"/);
      expect(variablesContent).toMatch(/type\s*=\s*bool/);
      expect(variablesContent).toMatch(/default\s*=\s*true/);
    });

    test('defines object_lock_retention_days with validation 1-36500', () => {
      expect(variablesContent).toMatch(
        /variable\s+"object_lock_retention_days"/
      );
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/>=\s*1.*<=\s*36500/);
    });

    test('defines legal_retention_years with validation 1-100', () => {
      expect(variablesContent).toMatch(/variable\s+"legal_retention_years"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/>=\s*1.*<=\s*100/);
    });

    test('defines enable_mfa_delete variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_mfa_delete"/);
      expect(variablesContent).toMatch(/type\s*=\s*bool/);
    });

    test('defines transition_to_intelligent_tiering_days with validation', () => {
      expect(variablesContent).toMatch(
        /variable\s+"transition_to_intelligent_tiering_days"/
      );
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/>=\s*0/);
    });

    test('defines enable_separate_audit_kms_key variable', () => {
      expect(variablesContent).toMatch(
        /variable\s+"enable_separate_audit_kms_key"/
      );
      expect(variablesContent).toMatch(/type\s*=\s*bool/);
    });

    test('defines kms_key_rotation_enabled variable', () => {
      expect(variablesContent).toMatch(/variable\s+"kms_key_rotation_enabled"/);
      expect(variablesContent).toMatch(/type\s*=\s*bool/);
    });

    test('defines enable_cloudtrail variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_cloudtrail"/);
      expect(variablesContent).toMatch(/type\s*=\s*bool/);
    });

    test('defines alarm threshold variables', () => {
      expect(variablesContent).toMatch(/variable\s+"failed_requests_threshold"/);
      expect(variablesContent).toMatch(
        /variable\s+"unexpected_delete_threshold"/
      );
      expect(variablesContent).toMatch(
        /variable\s+"high_download_volume_threshold_gb"/
      );
    });

    test('defines compliance_check_schedule with cron expression', () => {
      expect(variablesContent).toMatch(/variable\s+"compliance_check_schedule"/);
      expect(variablesContent).toMatch(/cron\(0 2 \* \* \? \*\)/);
    });

    test('defines reporting_schedule with cron expression', () => {
      expect(variablesContent).toMatch(/variable\s+"reporting_schedule"/);
      expect(variablesContent).toMatch(/cron\(0 3 1 \* \? \*\)/);
    });

    test('defines s3_inventory_schedule with validation', () => {
      expect(variablesContent).toMatch(/variable\s+"s3_inventory_schedule"/);
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/Daily.*Weekly/);
    });

    test('defines Lambda configuration variables', () => {
      expect(variablesContent).toMatch(/variable\s+"compliance_lambda_memory"/);
      expect(variablesContent).toMatch(/variable\s+"compliance_lambda_timeout"/);
      expect(variablesContent).toMatch(/variable\s+"reporting_lambda_memory"/);
      expect(variablesContent).toMatch(/variable\s+"reporting_lambda_timeout"/);
    });
  });

  describe('Data Sources - data.tf', () => {
    let dataContent: string;

    beforeAll(() => {
      dataContent = fs.readFileSync(path.join(LIB_DIR, 'data.tf'), 'utf8');
    });

    test('declares aws_caller_identity data source', () => {
      expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('declares aws_region data source', () => {
      expect(dataContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('declares aws_partition data source', () => {
      expect(dataContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });

    test('declares aws_canonical_user_id data source', () => {
      expect(dataContent).toMatch(/data\s+"aws_canonical_user_id"\s+"current"/);
    });

    test('defines primary bucket policy with deny unencrypted uploads', () => {
      expect(dataContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+"primary_bucket_policy"/
      );
      expect(dataContent).toMatch(/DenyUnencryptedObjectUploads/);
      expect(dataContent).toMatch(/s3:x-amz-server-side-encryption/);
      expect(dataContent).toMatch(/aws:kms/);
    });

    test('defines primary bucket policy with enforce SSL/TLS', () => {
      expect(dataContent).toMatch(/DenyInsecureTransport/);
      expect(dataContent).toMatch(/aws:SecureTransport/);
    });

    test('defines primary bucket policy with VPC endpoint restriction', () => {
      expect(dataContent).toMatch(/RestrictToVPCEndpoint/);
      expect(dataContent).toMatch(/aws:SourceVpce/);
    });

    test('defines primary bucket policy with trusted accounts', () => {
      expect(dataContent).toMatch(/AllowTrustedAccounts/);
    });

    test('defines audit bucket policy for CloudTrail', () => {
      expect(dataContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+"audit_bucket_policy"/
      );
      expect(dataContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(dataContent).toMatch(/AWSCloudTrailWrite/);
    });

    test('defines audit bucket policy for S3 access logging', () => {
      expect(dataContent).toMatch(/S3AccessLoggingWrite/);
      expect(dataContent).toMatch(/logging\.s3\.amazonaws\.com/);
    });
  });

  describe('Local Values - locals.tf', () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = fs.readFileSync(path.join(LIB_DIR, 'locals.tf'), 'utf8');
    });

    test('declares random_string resource for suffix', () => {
      expect(localsContent).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(localsContent).toMatch(/length\s*=\s*8/);
      expect(localsContent).toMatch(/special\s*=\s*false/);
      expect(localsContent).toMatch(/upper\s*=\s*false/);
    });

    test('defines name_prefix local', () => {
      expect(localsContent).toMatch(/name_prefix\s*=/);
      expect(localsContent).toMatch(/var\.project_name.*var\.environment/);
    });

    test('defines bucket name locals', () => {
      expect(localsContent).toMatch(/primary_bucket_name\s*=/);
      expect(localsContent).toMatch(/audit_bucket_name\s*=/);
      expect(localsContent).toMatch(/reporting_bucket_name\s*=/);
    });

    test('defines CloudTrail locals', () => {
      expect(localsContent).toMatch(/cloudtrail_name\s*=/);
      expect(localsContent).toMatch(/cloudtrail_log_group_name\s*=/);
      expect(localsContent).toMatch(/cloudtrail_s3_key_prefix\s*=/);
    });

    test('defines Lambda function name locals', () => {
      expect(localsContent).toMatch(/compliance_lambda_name\s*=/);
      expect(localsContent).toMatch(/reporting_lambda_name\s*=/);
    });

    test('defines CloudWatch log group locals', () => {
      expect(localsContent).toMatch(/compliance_lambda_log_group\s*=/);
      expect(localsContent).toMatch(/reporting_lambda_log_group\s*=/);
    });

    test('defines EventBridge rule name locals', () => {
      expect(localsContent).toMatch(/compliance_check_rule_name\s*=/);
      expect(localsContent).toMatch(/reporting_rule_name\s*=/);
    });

    test('defines SNS topic name local', () => {
      expect(localsContent).toMatch(/alerts_topic_name\s*=/);
    });

    test('defines dashboard name local', () => {
      expect(localsContent).toMatch(/dashboard_name\s*=/);
    });

    test('calculates legal retention days', () => {
      expect(localsContent).toMatch(/legal_retention_days\s*=/);
      expect(localsContent).toMatch(/var\.legal_retention_years.*365/);
    });

    test('defines IAM role name locals', () => {
      expect(localsContent).toMatch(/uploader_role_name\s*=/);
      expect(localsContent).toMatch(/auditor_role_name\s*=/);
      expect(localsContent).toMatch(/admin_role_name\s*=/);
      expect(localsContent).toMatch(/compliance_lambda_role_name\s*=/);
      expect(localsContent).toMatch(/reporting_lambda_role_name\s*=/);
      expect(localsContent).toMatch(/cloudtrail_cloudwatch_role_name\s*=/);
    });

    test('defines CloudWatch alarm name locals', () => {
      expect(localsContent).toMatch(/alarm_failed_requests_name\s*=/);
      expect(localsContent).toMatch(/alarm_unexpected_deletes_name\s*=/);
      expect(localsContent).toMatch(/alarm_high_download_volume_name\s*=/);
      expect(localsContent).toMatch(/alarm_upload_failures_name\s*=/);
      expect(localsContent).toMatch(/alarm_compliance_failures_name\s*=/);
    });

    test('defines metric filter name locals', () => {
      expect(localsContent).toMatch(/filter_access_denied_name\s*=/);
      expect(localsContent).toMatch(/filter_deletions_name\s*=/);
      expect(localsContent).toMatch(/filter_versioning_changes_name\s*=/);
    });

    test('defines KMS key alias locals', () => {
      expect(localsContent).toMatch(/primary_kms_key_alias\s*=/);
      expect(localsContent).toMatch(/audit_kms_key_alias\s*=/);
    });

    test('defines common_tags local with merge', () => {
      expect(localsContent).toMatch(/common_tags\s*=\s*merge/);
      expect(localsContent).toMatch(/DataClassification.*Confidential/);
    });

    test('uses environment_suffix pattern for name_suffix', () => {
      expect(localsContent).toMatch(/name_suffix\s*=/);
      expect(localsContent).toMatch(/var\.environment_suffix/);
      expect(localsContent).toMatch(/random_string\.suffix\.result/);
    });
  });

  describe('KMS Keys - security.tf', () => {
    let securityContent: string;

    beforeAll(() => {
      securityContent = fs.readFileSync(
        path.join(LIB_DIR, 'security.tf'),
        'utf8'
      );
    });

    test('declares primary KMS key with rotation', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"/);
      expect(securityContent).toMatch(
        /description.*encrypting legal documents/
      );
      expect(securityContent).toMatch(/deletion_window_in_days\s*=\s*30/);
      expect(securityContent).toMatch(/enable_key_rotation/);
    });

    test('declares primary KMS key alias', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_alias"\s+"primary"/);
      expect(securityContent).toMatch(/local\.primary_kms_key_alias/);
    });

    test('declares primary KMS key policy', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_kms_key_policy"\s+"primary"/
      );
      expect(securityContent).toMatch(/Enable IAM User Permissions/);
      expect(securityContent).toMatch(/Allow S3 to use the key/);
      expect(securityContent).toMatch(/Allow Lambda to use the key/);
    });

    test('declares audit KMS key conditionally', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_key"\s+"audit"/);
      expect(securityContent).toMatch(
        /count\s*=\s*var\.enable_separate_audit_kms_key/
      );
      expect(securityContent).toMatch(/description.*audit logs and CloudTrail/);
    });

    test('declares audit KMS key alias conditionally', () => {
      expect(securityContent).toMatch(/resource\s+"aws_kms_alias"\s+"audit"/);
      expect(securityContent).toMatch(
        /count\s*=\s*var\.enable_separate_audit_kms_key/
      );
    });

    test('declares audit KMS key policy with CloudTrail permissions', () => {
      expect(securityContent).toMatch(
        /resource\s+"aws_kms_key_policy"\s+"audit"/
      );
      expect(securityContent).toMatch(/Allow CloudTrail to encrypt logs/);
      expect(securityContent).toMatch(/Allow CloudWatch Logs/);
    });

    test('defines audit KMS key ID local', () => {
      expect(securityContent).toMatch(/audit_kms_key_id\s*=/);
      expect(securityContent).toMatch(/audit_kms_key_arn\s*=/);
    });
  });

  describe('S3 Buckets - storage.tf', () => {
    let storageContent: string;

    beforeAll(() => {
      storageContent = fs.readFileSync(
        path.join(LIB_DIR, 'storage.tf'),
        'utf8'
      );
    });

    test('declares primary S3 bucket with object lock', () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
      expect(storageContent).toMatch(/object_lock_enabled/);
    });

    test('enables versioning on primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"primary"/
      );
      expect(storageContent).toMatch(/status\s*=\s*"Enabled"/);
      expect(storageContent).toMatch(/mfa_delete/);
    });

    test('configures object lock on primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_object_lock_configuration"\s+"primary"/
      );
      expect(storageContent).toMatch(/mode\s*=\s*"COMPLIANCE"/);
      expect(storageContent).toMatch(/days\s*=\s*var\.object_lock_retention_days/);
    });

    test('enables KMS encryption on primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"primary"/
      );
      expect(storageContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(storageContent).toMatch(/kms_master_key_id/);
      expect(storageContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test('blocks public access on primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"primary"/
      );
      expect(storageContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(storageContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(storageContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(storageContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('configures lifecycle rules on primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"primary"/
      );
      expect(storageContent).toMatch(/transition-current-to-intelligent-tiering/);
      expect(storageContent).toMatch(/INTELLIGENT_TIERING/);
      expect(storageContent).toMatch(/transition-noncurrent-to-glacier/);
      expect(storageContent).toMatch(/GLACIER/);
      expect(storageContent).toMatch(/abort-incomplete-uploads/);
      expect(storageContent).toMatch(/remove-expired-delete-markers/);
    });

    test('applies bucket policy to primary bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_policy"\s+"primary"/
      );
      expect(storageContent).toMatch(
        /data\.aws_iam_policy_document\.primary_bucket_policy/
      );
    });

    test('configures S3 access logging', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_logging"\s+"primary"/
      );
      expect(storageContent).toMatch(/count\s*=\s*var\.enable_s3_access_logging/);
    });

    test('configures S3 inventory', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_inventory"\s+"primary"/
      );
      expect(storageContent).toMatch(/count\s*=\s*var\.enable_s3_inventory/);
      expect(storageContent).toMatch(/included_object_versions\s*=\s*"All"/);
      expect(storageContent).toMatch(/frequency\s*=\s*var\.s3_inventory_schedule/);
    });

    test('declares audit S3 bucket', () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit"/);
    });

    test('enables versioning on audit bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"audit"/
      );
      expect(storageContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('enables encryption on audit bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit"/
      );
      expect(storageContent).toMatch(/local\.audit_kms_key_id/);
    });

    test('blocks public access on audit bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"audit"/
      );
    });

    test('configures lifecycle on audit bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"audit"/
      );
      expect(storageContent).toMatch(/delete-old-audit-logs/);
    });

    test('declares reporting S3 bucket', () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"reporting"/);
    });

    test('enables versioning on reporting bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"reporting"/
      );
    });

    test('enables encryption on reporting bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"reporting"/
      );
    });

    test('configures lifecycle on reporting bucket', () => {
      expect(storageContent).toMatch(
        /resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"reporting"/
      );
      expect(storageContent).toMatch(/delete-old-reports/);
      expect(storageContent).toMatch(/transition-inventory-to-glacier/);
    });
  });

  describe('IAM Roles - iam.tf', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
    });

    test('declares uploader role with external ID', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"uploader"/);
      expect(iamContent).toMatch(/sts:ExternalId.*uploader-role/);
    });

    test('uploader role policy allows only PutObject', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"uploader"/);
      expect(iamContent).toMatch(/AllowPutObject/);
      expect(iamContent).toMatch(/s3:PutObject/);
      expect(iamContent).toMatch(/AllowKMSEncryption/);
    });

    test('declares auditor role with read-only access', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"auditor"/);
      expect(iamContent).toMatch(/sts:ExternalId.*auditor-role/);
    });

    test('auditor role policy allows read access', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"auditor"/);
      expect(iamContent).toMatch(/AllowReadDocuments/);
      expect(iamContent).toMatch(/s3:GetObject/);
      expect(iamContent).toMatch(/AllowReadAuditLogs/);
      expect(iamContent).toMatch(/AllowCloudTrailRead/);
    });

    test('declares admin role with MFA requirement', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"admin"/);
      expect(iamContent).toMatch(/aws:MultiFactorAuthPresent.*true/);
    });

    test('admin role policy requires MFA for delete', () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"admin"/);
      expect(iamContent).toMatch(/RequireMFAForDelete/);
      expect(iamContent).toMatch(/s3:DeleteObject/);
    });

    test('declares compliance Lambda execution role', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role"\s+"compliance_lambda"/
      );
      expect(iamContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test('compliance Lambda role has S3 and CloudTrail permissions', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"compliance_lambda"/
      );
      expect(iamContent).toMatch(/AllowS3BucketRead/);
      expect(iamContent).toMatch(/GetBucketVersioning/);
      expect(iamContent).toMatch(/GetBucketObjectLockConfiguration/);
      expect(iamContent).toMatch(/AllowCloudTrailCheck/);
      expect(iamContent).toMatch(/AllowCloudWatchMetrics/);
      expect(iamContent).toMatch(/AllowSNSPublish/);
    });

    test('declares reporting Lambda execution role', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role"\s+"reporting_lambda"/
      );
    });

    test('reporting Lambda role has S3 read and write permissions', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"reporting_lambda"/
      );
      expect(iamContent).toMatch(/AllowS3Read/);
      expect(iamContent).toMatch(/AllowReportingBucketWrite/);
      expect(iamContent).toMatch(/AllowCloudWatchMetricsRead/);
      expect(iamContent).toMatch(/AllowSESEmail/);
    });

    test('declares CloudTrail CloudWatch role', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role"\s+"cloudtrail_cloudwatch"/
      );
      expect(iamContent).toMatch(
        /count\s*=\s*var\.cloudtrail_cloudwatch_logs_enabled/
      );
    });

    test('CloudTrail role has log stream permissions', () => {
      expect(iamContent).toMatch(
        /resource\s+"aws_iam_role_policy"\s+"cloudtrail_cloudwatch"/
      );
      expect(iamContent).toMatch(/AWSCloudTrailCreateLogStream/);
      expect(iamContent).toMatch(/AWSCloudTrailPutLogEvents/);
    });
  });

  describe('CloudTrail and Monitoring - monitoring.tf', () => {
    let monitoringContent: string;

    beforeAll(() => {
      monitoringContent = fs.readFileSync(
        path.join(LIB_DIR, 'monitoring.tf'),
        'utf8'
      );
    });

    test('declares SNS topic for alerts', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(monitoringContent).toMatch(/kms_master_key_id/);
    });

    test('declares SNS topic subscriptions', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_sns_topic_subscription"\s+"email_alerts"/
      );
      expect(monitoringContent).toMatch(/count\s*=\s*length\(var\.alarm_email_endpoints\)/);
      expect(monitoringContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test('declares CloudTrail with S3 data events', () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(monitoringContent).toMatch(/count\s*=\s*var\.enable_cloudtrail/);
      expect(monitoringContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(monitoringContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(monitoringContent).toMatch(/data_resource/);
      expect(monitoringContent).toMatch(/AWS::S3::Object/);
    });

    test('declares CloudWatch log group for CloudTrail', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/
      );
      expect(monitoringContent).toMatch(/retention_in_days/);
    });

    test('declares metric filter for access denied events', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_log_metric_filter"\s+"access_denied"/
      );
      expect(monitoringContent).toMatch(/AccessDeniedCount/);
    });

    test('declares metric filter for deletions', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_log_metric_filter"\s+"deletions"/
      );
      expect(monitoringContent).toMatch(/S3DeletionCount/);
      expect(monitoringContent).toMatch(/DeleteObject/);
    });

    test('declares metric filter for versioning changes', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_log_metric_filter"\s+"versioning_changes"/
      );
      expect(monitoringContent).toMatch(/PutBucketVersioning/);
    });

    test('declares alarm for failed S3 requests', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_requests"/
      );
      expect(monitoringContent).toMatch(/4xxErrors/);
      expect(monitoringContent).toMatch(/threshold\s*=\s*var\.failed_requests_threshold/);
    });

    test('declares alarm for unexpected deletes', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"unexpected_deletes"/
      );
      expect(monitoringContent).toMatch(/S3DeletionCount/);
    });

    test('declares alarm for high download volume', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_download_volume"/
      );
      expect(monitoringContent).toMatch(/BytesDownloaded/);
    });

    test('declares alarm for upload failures', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"upload_failures"/
      );
      expect(monitoringContent).toMatch(/5xxErrors/);
    });

    test('declares alarm for compliance failures', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"compliance_failures"/
      );
      expect(monitoringContent).toMatch(/ComplianceFailures/);
    });

    test('declares CloudWatch dashboard', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_dashboard"\s+"storage"/
      );
      expect(monitoringContent).toMatch(/count\s*=\s*var\.enable_cloudwatch_dashboard/);
      expect(monitoringContent).toMatch(/dashboard_body/);
    });

    test('declares EventBridge rule for compliance checks', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"compliance_check"/
      );
      expect(monitoringContent).toMatch(/schedule_expression\s*=\s*var\.compliance_check_schedule/);
    });

    test('declares EventBridge target for compliance Lambda', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_event_target"\s+"compliance_check"/
      );
    });

    test('declares Lambda permission for EventBridge compliance', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_lambda_permission"\s+"allow_eventbridge_compliance"/
      );
    });

    test('declares EventBridge rule for monthly reports', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"monthly_report"/
      );
      expect(monitoringContent).toMatch(/schedule_expression\s*=\s*var\.reporting_schedule/);
    });

    test('declares EventBridge rule for S3 config changes', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_cloudwatch_event_rule"\s+"s3_config_changes"/
      );
      expect(monitoringContent).toMatch(/event_pattern/);
      expect(monitoringContent).toMatch(/PutBucketVersioning/);
    });

    test('declares SNS topic policy for EventBridge', () => {
      expect(monitoringContent).toMatch(
        /resource\s+"aws_sns_topic_policy"\s+"allow_eventbridge"/
      );
    });
  });

  describe('Lambda Functions - compute.tf', () => {
    let computeContent: string;

    beforeAll(() => {
      computeContent = fs.readFileSync(
        path.join(LIB_DIR, 'compute.tf'),
        'utf8'
      );
    });

    test('declares CloudWatch log group for compliance Lambda', () => {
      expect(computeContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"compliance_lambda"/
      );
      expect(computeContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('declares CloudWatch log group for reporting Lambda', () => {
      expect(computeContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"reporting_lambda"/
      );
    });

    test('packages compliance Lambda function', () => {
      expect(computeContent).toMatch(
        /data\s+"archive_file"\s+"compliance_lambda"/
      );
      expect(computeContent).toMatch(/lambda-compliance-check\/index\.py/);
    });

    test('declares compliance Lambda function', () => {
      expect(computeContent).toMatch(
        /resource\s+"aws_lambda_function"\s+"compliance_check"/
      );
      expect(computeContent).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(computeContent).toMatch(/handler\s*=\s*"index\.lambda_handler"/);
      expect(computeContent).toMatch(/timeout\s*=\s*var\.compliance_lambda_timeout/);
      expect(computeContent).toMatch(/memory_size\s*=\s*var\.compliance_lambda_memory/);
    });

    test('compliance Lambda has environment variables', () => {
      expect(computeContent).toMatch(/PRIMARY_BUCKET_NAME/);
      expect(computeContent).toMatch(/AUDIT_BUCKET_NAME/);
      expect(computeContent).toMatch(/SNS_TOPIC_ARN/);
      expect(computeContent).toMatch(/CLOUDTRAIL_NAME/);
    });

    test('packages reporting Lambda function', () => {
      expect(computeContent).toMatch(/data\s+"archive_file"\s+"reporting_lambda"/);
      expect(computeContent).toMatch(/lambda-monthly-report\/index\.py/);
    });

    test('declares reporting Lambda function', () => {
      expect(computeContent).toMatch(
        /resource\s+"aws_lambda_function"\s+"monthly_report"/
      );
      expect(computeContent).toMatch(/runtime\s*=\s*"python3\.12"/);
    });

    test('reporting Lambda has environment variables', () => {
      expect(computeContent).toMatch(/REPORTING_BUCKET_NAME/);
      expect(computeContent).toMatch(/ENABLE_SES/);
      expect(computeContent).toMatch(/SES_SENDER_EMAIL/);
      expect(computeContent).toMatch(/SES_RECIPIENT_EMAILS/);
    });
  });

  describe('Outputs - outputs.tf', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(
        path.join(LIB_DIR, 'outputs.tf'),
        'utf8'
      );
    });

    test('declares S3 bucket outputs', () => {
      expect(outputsContent).toMatch(/output\s+"primary_bucket_name"/);
      expect(outputsContent).toMatch(/output\s+"primary_bucket_arn"/);
      expect(outputsContent).toMatch(/output\s+"audit_bucket_name"/);
      expect(outputsContent).toMatch(/output\s+"audit_bucket_arn"/);
      expect(outputsContent).toMatch(/output\s+"reporting_bucket_name"/);
      expect(outputsContent).toMatch(/output\s+"reporting_bucket_arn"/);
    });

    test('declares KMS key outputs', () => {
      expect(outputsContent).toMatch(/output\s+"primary_kms_key_id"/);
      expect(outputsContent).toMatch(/output\s+"primary_kms_key_arn"/);
      expect(outputsContent).toMatch(/output\s+"audit_kms_key_id"/);
      expect(outputsContent).toMatch(/output\s+"audit_kms_key_arn"/);
    });

    test('declares IAM role outputs', () => {
      expect(outputsContent).toMatch(/output\s+"uploader_role_name"/);
      expect(outputsContent).toMatch(/output\s+"uploader_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"auditor_role_name"/);
      expect(outputsContent).toMatch(/output\s+"auditor_role_arn"/);
      expect(outputsContent).toMatch(/output\s+"admin_role_name"/);
      expect(outputsContent).toMatch(/output\s+"admin_role_arn"/);
    });

    test('declares Lambda function outputs', () => {
      expect(outputsContent).toMatch(/output\s+"compliance_lambda_function_name"/);
      expect(outputsContent).toMatch(/output\s+"compliance_lambda_function_arn"/);
      expect(outputsContent).toMatch(/output\s+"reporting_lambda_function_name"/);
      expect(outputsContent).toMatch(/output\s+"reporting_lambda_function_arn"/);
    });

    test('declares CloudTrail outputs', () => {
      expect(outputsContent).toMatch(/output\s+"cloudtrail_name"/);
      expect(outputsContent).toMatch(/output\s+"cloudtrail_arn"/);
    });

    test('declares CloudWatch outputs', () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_name"/);
      expect(outputsContent).toMatch(/output\s+"compliance_check_rule_name"/);
      expect(outputsContent).toMatch(/output\s+"monthly_report_rule_name"/);
    });

    test('declares configuration outputs', () => {
      expect(outputsContent).toMatch(/output\s+"object_lock_enabled"/);
      expect(outputsContent).toMatch(/output\s+"object_lock_retention_days"/);
      expect(outputsContent).toMatch(/output\s+"legal_retention_years"/);
      expect(outputsContent).toMatch(/output\s+"legal_retention_days"/);
    });

    test('declares helper command outputs', () => {
      expect(outputsContent).toMatch(/output\s+"assume_uploader_role_command"/);
      expect(outputsContent).toMatch(/output\s+"assume_auditor_role_command"/);
      expect(outputsContent).toMatch(/output\s+"assume_admin_role_command"/);
      expect(outputsContent).toMatch(/output\s+"upload_document_command"/);
      expect(outputsContent).toMatch(/output\s+"view_dashboard_url"/);
    });

    test('KMS outputs are marked as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"primary_kms_key_arn"[\s\S]*?sensitive\s*=\s*true/);
      expect(outputsContent).toMatch(/output\s+"audit_kms_key_arn"[\s\S]*?sensitive\s*=\s*true/);
    });
  });

  describe('Lambda Function Code', () => {
    describe('Compliance Lambda', () => {
      let complianceCode: string;

      beforeAll(() => {
        complianceCode = fs.readFileSync(
          path.join(LIB_DIR, 'lambda-compliance-check/index.py'),
          'utf8'
        );
      });

      test('imports required modules', () => {
        expect(complianceCode).toMatch(/import json/);
        expect(complianceCode).toMatch(/import os/);
        expect(complianceCode).toMatch(/import boto3/);
      });

      test('initializes AWS clients', () => {
        expect(complianceCode).toMatch(/s3_client\s*=\s*boto3\.client\('s3'\)/);
        expect(complianceCode).toMatch(/cloudtrail_client/);
        expect(complianceCode).toMatch(/cloudwatch_client/);
        expect(complianceCode).toMatch(/sns_client/);
      });

      test('reads environment variables', () => {
        expect(complianceCode).toMatch(/os\.environ\['PRIMARY_BUCKET_NAME'\]/);
        expect(complianceCode).toMatch(/os\.environ\['AUDIT_BUCKET_NAME'\]/);
        expect(complianceCode).toMatch(/os\.environ\['SNS_TOPIC_ARN'\]/);
      });

      test('defines lambda_handler function', () => {
        expect(complianceCode).toMatch(/def lambda_handler\(event, context\):/);
      });

      test('checks versioning status', () => {
        expect(complianceCode).toMatch(/get_bucket_versioning/);
        expect(complianceCode).toMatch(/VersioningEnabled/);
      });

      test('checks object lock configuration', () => {
        expect(complianceCode).toMatch(/get_object_lock_configuration/);
        expect(complianceCode).toMatch(/ObjectLockEnabled/);
      });

      test('checks bucket encryption', () => {
        expect(complianceCode).toMatch(/get_bucket_encryption/);
        expect(complianceCode).toMatch(/EncryptionEnabled/);
      });

      test('checks lifecycle policies', () => {
        expect(complianceCode).toMatch(/get_bucket_lifecycle_configuration/);
        expect(complianceCode).toMatch(/LifecyclePoliciesConfigured/);
      });

      test('checks public access block', () => {
        expect(complianceCode).toMatch(/get_public_access_block/);
        expect(complianceCode).toMatch(/PublicAccessBlocked/);
      });

      test('checks CloudTrail status', () => {
        expect(complianceCode).toMatch(/get_trail_status/);
        expect(complianceCode).toMatch(/CloudTrailLogging/);
      });

      test('sends CloudWatch metrics', () => {
        expect(complianceCode).toMatch(/def send_metric/);
        expect(complianceCode).toMatch(/put_metric_data/);
        expect(complianceCode).toMatch(/LegalDocStorage\/Compliance/);
      });

      test('sends SNS alerts', () => {
        expect(complianceCode).toMatch(/def send_alert/);
        expect(complianceCode).toMatch(/sns_client\.publish/);
      });
    });

    describe('Reporting Lambda', () => {
      let reportingCode: string;

      beforeAll(() => {
        reportingCode = fs.readFileSync(
          path.join(LIB_DIR, 'lambda-monthly-report/index.py'),
          'utf8'
        );
      });

      test('imports required modules', () => {
        expect(reportingCode).toMatch(/import json/);
        expect(reportingCode).toMatch(/import os/);
        expect(reportingCode).toMatch(/import boto3/);
        expect(reportingCode).toMatch(/import csv/);
      });

      test('initializes AWS clients', () => {
        expect(reportingCode).toMatch(/s3_client/);
        expect(reportingCode).toMatch(/cloudwatch_client/);
        expect(reportingCode).toMatch(/ses_client/);
      });

      test('reads environment variables', () => {
        expect(reportingCode).toMatch(/os\.environ\['PRIMARY_BUCKET_NAME'\]/);
        expect(reportingCode).toMatch(/os\.environ\['REPORTING_BUCKET_NAME'\]/);
      });

      test('defines lambda_handler function', () => {
        expect(reportingCode).toMatch(/def lambda_handler\(event, context\):/);
      });

      test('collects bucket statistics', () => {
        expect(reportingCode).toMatch(/def get_bucket_statistics/);
        expect(reportingCode).toMatch(/list_object_versions/);
      });

      test('collects storage metrics', () => {
        expect(reportingCode).toMatch(/def get_storage_metrics/);
        expect(reportingCode).toMatch(/get_metric_statistics/);
        expect(reportingCode).toMatch(/BucketSizeBytes/);
      });

      test('collects usage statistics', () => {
        expect(reportingCode).toMatch(/def get_usage_statistics/);
        expect(reportingCode).toMatch(/AllRequests/);
        expect(reportingCode).toMatch(/GetRequests/);
        expect(reportingCode).toMatch(/PutRequests/);
      });

      test('generates CSV report', () => {
        expect(reportingCode).toMatch(/def generate_csv_report/);
        expect(reportingCode).toMatch(/csv\.writer/);
      });

      test('saves report to S3', () => {
        expect(reportingCode).toMatch(/s3_client\.put_object/);
        expect(reportingCode).toMatch(/monthly-reports/);
      });

      test('sends email report via SES', () => {
        expect(reportingCode).toMatch(/def send_email_report/);
        expect(reportingCode).toMatch(/ses_client\.send_email/);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets use KMS encryption', () => {
      const storageContent = fs.readFileSync(
        path.join(LIB_DIR, 'storage.tf'),
        'utf8'
      );
      const buckets = ['primary', 'audit', 'reporting'];
      buckets.forEach((bucket) => {
        expect(storageContent).toMatch(
          new RegExp(
            `aws_s3_bucket_server_side_encryption_configuration.*${bucket}`
          )
        );
      });
    });

    test('all S3 buckets block public access', () => {
      const storageContent = fs.readFileSync(
        path.join(LIB_DIR, 'storage.tf'),
        'utf8'
      );
      const buckets = ['primary', 'audit', 'reporting'];
      buckets.forEach((bucket) => {
        expect(storageContent).toMatch(
          new RegExp(`aws_s3_bucket_public_access_block.*${bucket}`)
        );
      });
    });

    test('all S3 buckets have versioning enabled', () => {
      const storageContent = fs.readFileSync(
        path.join(LIB_DIR, 'storage.tf'),
        'utf8'
      );
      const buckets = ['primary', 'audit', 'reporting'];
      buckets.forEach((bucket) => {
        expect(storageContent).toMatch(
          new RegExp(`aws_s3_bucket_versioning.*${bucket}`)
        );
      });
    });

    test('KMS keys have rotation enabled', () => {
      const securityContent = fs.readFileSync(
        path.join(LIB_DIR, 'security.tf'),
        'utf8'
      );
      expect(securityContent).toMatch(/enable_key_rotation/);
    });

    test('CloudTrail log validation is enabled', () => {
      const monitoringContent = fs.readFileSync(
        path.join(LIB_DIR, 'monitoring.tf'),
        'utf8'
      );
      expect(monitoringContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('admin role requires MFA', () => {
      const iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(iamContent).toMatch(/aws:MultiFactorAuthPresent.*true/);
    });

    test('bucket policies enforce SSL/TLS', () => {
      const dataContent = fs.readFileSync(path.join(LIB_DIR, 'data.tf'), 'utf8');
      expect(dataContent).toMatch(/DenyInsecureTransport/);
      expect(dataContent).toMatch(/aws:SecureTransport/);
    });
  });

  describe('Configuration Validation', () => {
    test('no hardcoded secrets in code', () => {
      const files = [
        'versions.tf',
        'variables.tf',
        'data.tf',
        'locals.tf',
        'security.tf',
        'storage.tf',
        'iam.tf',
        'monitoring.tf',
        'compute.tf',
        'outputs.tf',
      ];

      files.forEach((file) => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key
      });
    });

    test('uses variables for configurable values', () => {
      const storageContent = fs.readFileSync(
        path.join(LIB_DIR, 'storage.tf'),
        'utf8'
      );
      expect(storageContent).toMatch(/var\.enable_object_lock/);
      expect(storageContent).toMatch(/var\.object_lock_retention_days/);
      expect(storageContent).toMatch(/var\.enable_s3_access_logging/);
    });

    test('uses locals for computed values', () => {
      const files = ['storage.tf', 'iam.tf', 'monitoring.tf', 'compute.tf'];
      files.forEach((file) => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).toMatch(/local\./);
      });
    });
  });
});
