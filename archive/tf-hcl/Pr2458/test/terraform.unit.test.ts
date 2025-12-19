import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../lib/tap_stack.tf');
let tf: string;

beforeAll(() => {
  tf = fs.readFileSync(filePath, 'utf8');
});

function has(rx: RegExp): boolean {
  return rx.test(tf);
}

describe('tap_stack.tf static verification', () => {

  it('exists and is a non-trivial config file', () => {
    expect(tf).toBeDefined();
    expect(tf.length).toBeGreaterThan(500);
    expect(tf).toMatch(/resource|variable|output/);
  });

  it('declares required input variables', () => {
    [
      'aws_region', 'project_name', 'project_prefix', 'environment',
      'github_owner', 'github_repo', 'github_branch', 'application_name',
      'solution_stack_name', 'instance_type', 'notification_email', 'enable_manual_approval'
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  it('does not have terraform provider requirements (moved to provider.tf)', () => {
    expect(has(/terraform\s*\{/)).toBe(false);
    expect(has(/required_providers\s*\{/)).toBe(false);
    // Provider requirements are now in provider.tf file
  });

  it('declares essential data sources', () => {
    expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
  });

  it('declares KMS key and alias', () => {
    expect(has(/resource\s+"aws_kms_key"\s+"pipeline"/)).toBe(true);
    expect(has(/resource\s+"aws_kms_alias"\s+"pipeline"/)).toBe(true);
  });

  it('declares S3 buckets for artifacts and cloudtrail', () => {
    [
      /resource\s+"aws_s3_bucket"\s+"pipeline_artifacts"/,
      /resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"pipeline_artifacts"/,
      /resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"pipeline_artifacts"/,
      /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"pipeline_artifacts"/,
      /resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/,
      /resource\s+"aws_s3_bucket_policy"\s+"cloudtrail_logs"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares Secrets Manager and Parameter Store resources', () => {
    [
      /resource\s+"aws_secretsmanager_secret"\s+"app_secrets"/,
      /resource\s+"aws_secretsmanager_secret_version"\s+"app_secrets"/,
      /resource\s+"aws_ssm_parameter"\s+"app_config"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares SNS topic and subscription', () => {
    [
      /resource\s+"aws_sns_topic"\s+"pipeline_notifications"/,
      /resource\s+"aws_sns_topic_subscription"\s+"email_notification"/,
      /resource\s+"aws_sns_topic_policy"\s+"pipeline_notifications"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares CloudWatch resources', () => {
    [
      /resource\s+"aws_cloudwatch_log_group"\s+"codebuild_logs"/,
      /resource\s+"aws_cloudwatch_event_rule"\s+"pipeline_state_change"/,
      /resource\s+"aws_cloudwatch_event_rule"\s+"build_state_change"/,
      /resource\s+"aws_cloudwatch_event_target"\s+"sns"/,
      /resource\s+"aws_cloudwatch_event_target"\s+"build_sns"/,
      /resource\s+"aws_cloudwatch_dashboard"\s+"pipeline_dashboard"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares IAM roles and policies for CodePipeline', () => {
    [
      /resource\s+"aws_iam_role"\s+"codepipeline_role"/,
      /resource\s+"aws_iam_role_policy"\s+"codepipeline_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares IAM roles and policies for CodeBuild', () => {
    [
      /resource\s+"aws_iam_role"\s+"codebuild_role"/,
      /resource\s+"aws_iam_role_policy"\s+"codebuild_policy"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares IAM roles and policies for Elastic Beanstalk', () => {
    [
      /resource\s+"aws_iam_role"\s+"beanstalk_service_role"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"beanstalk_service_policy"/,
      /resource\s+"aws_iam_role"\s+"beanstalk_ec2_role"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"beanstalk_web_tier"/,
      /resource\s+"aws_iam_role_policy_attachment"\s+"beanstalk_worker_tier"/,
      /resource\s+"aws_iam_instance_profile"\s+"beanstalk_ec2_profile"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares GitHub connection and CodeBuild project', () => {
    [
      /resource\s+"aws_codestarconnections_connection"\s+"github"/,
      /resource\s+"aws_codebuild_project"\s+"build_project"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares Elastic Beanstalk application and environment', () => {
    [
      /resource\s+"aws_elastic_beanstalk_application"\s+"app"/,
      /resource\s+"aws_elastic_beanstalk_environment"\s+"production"/
    ].forEach(rx => expect(has(rx)).toBe(true));
  });

  it('declares CodePipeline with proper stages', () => {
    expect(has(/resource\s+"aws_codepipeline"\s+"main_pipeline"/)).toBe(true);
    expect(has(/name\s*=\s*"Source"/)).toBe(true);
    expect(has(/name\s*=\s*"Build"/)).toBe(true);
    expect(has(/name\s*=\s*"Deploy"/)).toBe(true);
    expect(has(/provider\s*=\s*"CodeStarSourceConnection"/)).toBe(true);
    expect(has(/provider\s*=\s*"CodeBuild"/)).toBe(true);
    expect(has(/provider\s*=\s*"ElasticBeanstalk"/)).toBe(true);
  });

  it('declares CloudTrail for audit logging', () => {
    expect(has(/resource\s+"aws_cloudtrail"\s+"pipeline_trail"/)).toBe(true);
  });

  it('declares random string for unique naming', () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  it('defines outputs for major resources', () => {
    [
      "pipeline_name",
      "pipeline_url",
      "beanstalk_environment_url",
      "beanstalk_environment_name",
      "github_connection_arn",
      "artifacts_bucket",
      "sns_topic_arn",
      "dashboard_url",
      "kms_key_id",
      "kms_key_arn",
      "secrets_manager_arn",
      "codebuild_project_name",
      "cloudtrail_s3_bucket"
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

  it('uses proper variable references', () => {
    expect(has(/var\.aws_region/)).toBe(true);
    expect(has(/var\.project_prefix/)).toBe(true);
    expect(has(/var\.application_name/)).toBe(true);
    expect(has(/var\.github_owner/)).toBe(true);
    expect(has(/var\.github_repo/)).toBe(true);
  });

  it('uses proper data source references', () => {
    expect(has(/data\.aws_caller_identity\.current\.account_id/)).toBe(true);
    expect(has(/data\.aws_region\.current\.name/)).toBe(true);
  });

  it('has proper resource dependencies', () => {
    expect(has(/aws_kms_key\.pipeline\.arn/)).toBe(true);
    expect(has(/aws_s3_bucket\.pipeline_artifacts\.arn/)).toBe(true);
    expect(has(/aws_iam_role\.codepipeline_role\.arn/)).toBe(true);
    expect(has(/aws_iam_role\.codebuild_role\.arn/)).toBe(true);
    expect(has(/aws_elastic_beanstalk_application\.app\.name/)).toBe(true);
  });

  it('includes security best practices', () => {
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
    expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
    expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    expect(has(/kms_master_key_id/)).toBe(true);
    expect(has(/sse_algorithm/)).toBe(true);
  });

  it('has proper IAM permissions for CodePipeline', () => {
    expect(has(/s3:GetBucketVersioning/)).toBe(true);
    expect(has(/s3:GetObject/)).toBe(true);
    expect(has(/s3:PutObject/)).toBe(true);
    expect(has(/codebuild:BatchGetBuilds/)).toBe(true);
    expect(has(/codebuild:StartBuild/)).toBe(true);
    expect(has(/elasticbeanstalk:CreateApplicationVersion/)).toBe(true);
    expect(has(/sns:Publish/)).toBe(true);
    expect(has(/kms:Decrypt/)).toBe(true);
    expect(has(/kms:GenerateDataKey/)).toBe(true);
  });

  it('has proper IAM permissions for CodeBuild', () => {
    expect(has(/logs:CreateLogGroup/)).toBe(true);
    expect(has(/logs:CreateLogStream/)).toBe(true);
    expect(has(/logs:PutLogEvents/)).toBe(true);
    expect(has(/secretsmanager:GetSecretValue/)).toBe(true);
    expect(has(/ssm:GetParameter/)).toBe(true);
    expect(has(/ssm:GetParameters/)).toBe(true);
  });

  it('configures Elastic Beanstalk settings properly', () => {
    expect(has(/aws:autoscaling:launchconfiguration/)).toBe(true);
    expect(has(/aws:elasticbeanstalk:environment/)).toBe(true);
    expect(has(/aws:elasticbeanstalk:healthreporting:system/)).toBe(true);
    expect(has(/aws:elasticbeanstalk:command/)).toBe(true);
    expect(has(/IamInstanceProfile/)).toBe(true);
    expect(has(/InstanceType/)).toBe(true);
    expect(has(/SingleInstance/)).toBe(true);
    expect(has(/Rolling/)).toBe(true);
  });

  it('has dynamic approval stage configuration', () => {
    expect(has(/dynamic\s+"stage"/)).toBe(true);
    expect(has(/var\.enable_manual_approval/)).toBe(true);
    expect(has(/Manual_Approval/)).toBe(true);
  });

  it('configures CloudWatch monitoring', () => {
    expect(has(/AWS\/CodeBuild/)).toBe(true);
    expect(has(/ProjectName/)).toBe(true);
    expect(has(/Builds/)).toBe(true);
    expect(has(/FailedBuilds/)).toBe(true);
    expect(has(/SucceededBuilds/)).toBe(true);
  });

  it('uses hardcoded solution stack name', () => {
    expect(has(/64bit Amazon Linux 2023 v6\.6\.4 running Node\.js 22/)).toBe(true);
  });

});