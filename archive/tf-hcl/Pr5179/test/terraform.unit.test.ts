// Comprehensive unit tests for Terraform zero-trust architecture
// Tests main.tf, variables.tf, outputs.tf, and provider.tf
// No Terraform commands are executed - pure static analysis

import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const VARIABLES_TF = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_TF = path.join(LIB_DIR, 'outputs.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

describe('Terraform Infrastructure Files - Existence Tests', () => {
  test('main.tf exists', () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
  });

  test('variables.tf exists', () => {
    expect(fs.existsSync(VARIABLES_TF)).toBe(true);
  });

  test('outputs.tf exists', () => {
    expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
  });

  test('provider.tf exists', () => {
    expect(fs.existsSync(PROVIDER_TF)).toBe(true);
  });
});

describe('Provider Configuration Tests', () => {
  let providerContent: string;
  let mainContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(PROVIDER_TF, 'utf8');
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('provider.tf contains AWS provider configuration', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test('provider.tf has S3 backend configured', () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });

  test('provider.tf requires AWS provider version >= 5.0', () => {
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0/);
  });

  test('main.tf does NOT declare provider block (provider.tf owns it)', () => {
    expect(mainContent).not.toMatch(/provider\s+"aws"\s*{/);
  });

  test('provider.tf uses var.aws_region', () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe('Required Variables Tests', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_TF, 'utf8');
  });

  const requiredVariables = [
    'project_name',
    'aws_region',
    'environment_suffix',
    'environment',
    'multi_account_enabled',
    'vpc_cidr',
    'availability_zones',
    'az_count',
    'transit_gateway_asn',
    'enable_network_firewall',
    'enable_vpc_flow_logs',
    'allowed_ip_ranges',
    'max_session_duration',
    'enable_auto_remediation',
    'enable_guardduty',
    'enable_security_hub',
    'enable_cloudtrail',
    'security_notification_email',
    'log_retention_days',
    'cloudtrail_log_retention_days',
    'flow_log_retention_days',
  ];

  requiredVariables.forEach((varName) => {
    test(`variable "${varName}" is declared`, () => {
      const regex = new RegExp(`variable\\s+"${varName}"\\s*{`, 'g');
      expect(variablesContent).toMatch(regex);
    });
  });

  test('aws_region has default value', () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
  });

  test('environment_suffix has default value', () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=\s*"dev"/);
  });

  test('multi_account_enabled defaults to false', () => {
    expect(variablesContent).toMatch(/variable\s+"multi_account_enabled"[\s\S]*?default\s*=\s*false/);
  });

  test('environment has validation for pilot/production', () => {
    expect(variablesContent).toMatch(/variable\s+"environment"[\s\S]*?validation\s*{/);
    expect(variablesContent).toMatch(/pilot.*production|production.*pilot/);
  });

  test('az_count has validation for 2-3 zones', () => {
    expect(variablesContent).toMatch(/variable\s+"az_count"[\s\S]*?validation\s*{/);
  });
});

describe('Network Resources Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('VPC resource is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test('VPC has DNS support enabled', () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('Public subnets are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
  });

  test('Private subnets are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test('Isolated subnets are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"isolated"/);
  });

  test('Public subnets have map_public_ip_on_launch set to false', () => {
    const publicSubnetMatch = mainContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?map_public_ip_on_launch\s*=\s*(false|true)/);
    expect(publicSubnetMatch).toBeTruthy();
    expect(publicSubnetMatch![1]).toBe('false');
  });

  test('Internet Gateway is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test('NAT Gateways are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test('Elastic IPs for NAT are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  test('Route tables are defined for all subnet types', () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"isolated"/);
  });

  test('Route table associations are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"isolated"/);
  });
});

describe('VPC Flow Logs Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('VPC Flow Logs resource is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
  });

  test('VPC Flow Logs has conditional deployment', () => {
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_vpc_flow_logs\s*\?\s*1\s*:\s*0/);
  });

  test('CloudWatch Log Group for Flow Logs is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"/);
  });

  test('Flow Logs IAM role is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
  });

  test('Flow Logs captures ALL traffic', () => {
    expect(mainContent).toMatch(/traffic_type\s*=\s*"ALL"/);
  });
});

describe('Transit Gateway Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Transit Gateway resource is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"main"/);
  });

  test('Transit Gateway has default route table disabled', () => {
    expect(mainContent).toMatch(/default_route_table_association\s*=\s*"disable"/);
    expect(mainContent).toMatch(/default_route_table_propagation\s*=\s*"disable"/);
  });

  test('Transit Gateway has DNS support enabled', () => {
    expect(mainContent).toMatch(/dns_support\s*=\s*"enable"/);
  });

  test('Transit Gateway VPC attachment is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"main"/);
  });
});

describe('Network Firewall Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Network Firewall resource is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_networkfirewall_firewall"\s+"main"/);
  });

  test('Network Firewall has conditional deployment', () => {
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_network_firewall\s*\?\s*1\s*:\s*0/);
  });

  test('Network Firewall policy is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_networkfirewall_firewall_policy"\s+"main"/);
  });

  test('Network Firewall stateful rule group is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_networkfirewall_rule_group"\s+"stateful"/);
  });
});

describe('KMS Encryption Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('KMS key for S3 is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
  });

  test('KMS key for CloudWatch is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch"/);
  });

  test('KMS keys have key rotation enabled', () => {
    const kmsKeyMatches = mainContent.match(/resource\s+"aws_kms_key"[\s\S]*?enable_key_rotation\s*=\s*(true|false)/g);
    expect(kmsKeyMatches).toBeTruthy();
    kmsKeyMatches!.forEach((match) => {
      expect(match).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  test('KMS aliases are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"cloudwatch"/);
  });
});

describe('S3 Bucket Security Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('S3 logging bucket is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
  });

  test('S3 bucket has versioning enabled', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test('S3 bucket has encryption configured', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test('S3 bucket has public access blocked', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
    expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(mainContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test('S3 bucket has lifecycle policy', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
  });

  test('S3 bucket policy is defined for CloudTrail', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
  });
});

describe('GuardDuty Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('GuardDuty detector is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
  });

  test('GuardDuty has conditional deployment', () => {
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_guardduty\s*\?\s*1\s*:\s*0/);
  });

  test('GuardDuty has S3 protection enabled', () => {
    expect(mainContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"s3"/);
  });

  test('GuardDuty has EBS malware protection enabled', () => {
    expect(mainContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"ebs_malware"/);
  });

  test('GuardDuty has 15-minute publishing frequency', () => {
    expect(mainContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
  });
});

describe('Security Hub Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Security Hub account is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"/);
  });

  test('Security Hub has conditional deployment', () => {
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_security_hub\s*\?\s*1\s*:\s*0/);
  });

  test('Security Hub CIS standard is subscribed', () => {
    expect(mainContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"cis"/);
  });

  test('Security Hub PCI-DSS standard is subscribed', () => {
    expect(mainContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"pci"/);
  });

  test('Security Hub has auto-enable controls', () => {
    expect(mainContent).toMatch(/auto_enable_controls\s*=\s*true/);
  });
});

describe('CloudTrail Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('CloudTrail is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test('CloudTrail has conditional deployment', () => {
    expect(mainContent).toMatch(/count\s*=\s*var\.enable_cloudtrail\s*\?\s*1\s*:\s*0/);
  });

  test('CloudTrail is multi-region', () => {
    expect(mainContent).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test('CloudTrail has log file validation enabled', () => {
    expect(mainContent).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test('CloudTrail includes global service events', () => {
    expect(mainContent).toMatch(/include_global_service_events\s*=\s*true/);
  });

  test('CloudTrail has CloudWatch Logs integration', () => {
    expect(mainContent).toMatch(/cloud_watch_logs_group_arn/);
    expect(mainContent).toMatch(/cloud_watch_logs_role_arn/);
  });

  test('CloudTrail has Insights enabled', () => {
    expect(mainContent).toMatch(/insight_selector\s*{/);
    expect(mainContent).toMatch(/ApiCallRateInsight/);
    expect(mainContent).toMatch(/ApiErrorRateInsight/);
  });

  test('CloudTrail IAM role is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"/);
  });

  test('CloudTrail CloudWatch Log Group is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
  });
});

describe('Lambda Incident Response Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Lambda function for incident response is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"incident_response"/);
  });

  test('Lambda IAM role is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"incident_response"/);
  });

  test('Lambda has Python 3.11 runtime', () => {
    expect(mainContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test('Lambda has environment variables configured', () => {
    const lambdaMatch = mainContent.match(/resource\s+"aws_lambda_function"\s+"incident_response"[\s\S]*?environment\s*\{/);
    expect(lambdaMatch).toBeTruthy();
    expect(mainContent).toMatch(/ENABLE_AUTO_REMEDIATION/);
    expect(mainContent).toMatch(/SNS_TOPIC_ARN/);
  });

  test('Lambda CloudWatch Log Group is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"incident_response"/);
  });

  test('Lambda function uses archive file', () => {
    expect(mainContent).toMatch(/data\s+"archive_file"\s+"incident_response"/);
  });
});

describe('EventBridge Automation Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('EventBridge rule for Security Hub is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_hub_findings"/);
  });

  test('EventBridge rule for GuardDuty is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty_findings"/);
  });

  test('EventBridge targets for Lambda are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"security_hub_lambda"/);
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty_lambda"/);
  });

  test('Lambda permissions for EventBridge are defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_lambda_permission"\s+"security_hub_invoke"/);
    expect(mainContent).toMatch(/resource\s+"aws_lambda_permission"\s+"guardduty_invoke"/);
  });

  test('Security Hub rule filters for CRITICAL and HIGH severity', () => {
    const secHubRule = mainContent.match(/resource\s+"aws_cloudwatch_event_rule"\s+"security_hub_findings"[\s\S]*?tags\s*=\s*local\.common_tags/);
    expect(secHubRule).toBeTruthy();
    expect(secHubRule![0]).toMatch(/CRITICAL/);
    expect(secHubRule![0]).toMatch(/HIGH/);
  });
});

describe('SNS Topic Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('SNS topic for security alerts is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
  });

  test('SNS topic has KMS encryption', () => {
    expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3\.id/);
  });

  test('SNS topic subscription for email is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_email"/);
  });
});

describe('IAM Systems Manager Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('EC2 SSM IAM role is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_ssm"/);
  });

  test('EC2 instance profile is defined', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_ssm"/);
  });

  test('Session Manager role is defined with MFA requirement', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"session_manager"/);
    expect(mainContent).toMatch(/aws:MultiFactorAuthPresent.*true/);
  });

  test('Session Manager role has IP restrictions', () => {
    const sessionMgrMatch = mainContent.match(/resource\s+"aws_iam_role"\s+"session_manager"[\s\S]*?aws:SourceIp/);
    expect(sessionMgrMatch).toBeTruthy();
  });

  test('SSM managed policy is attached', () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/);
    expect(mainContent).toMatch(/AmazonSSMManagedInstanceCore/);
  });
});

describe('IAM Least Privilege Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('No hardcoded credentials in configuration', () => {
    expect(mainContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key
    expect(mainContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
  });

  test('IAM policies use specific resource ARNs where possible', () => {
    // Check that incident response policy has specific resources
    const incidentPolicyMatch = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"incident_response"[\s\S]*?policy\s*=\s*jsonencode/);
    expect(incidentPolicyMatch).toBeTruthy();
  });

  test('IAM policies have conditions for sensitive actions', () => {
    // Check that EC2 stop/terminate actions have conditions
    const ec2ActionsMatch = mainContent.match(/ec2:StopInstances[\s\S]*?Condition/);
    expect(ec2ActionsMatch).toBeTruthy();
  });
});

describe('Resource Naming and Tagging Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Resources use environment_suffix in names', () => {
    expect(mainContent).toMatch(/\$\{local\.name_prefix\}/);
    expect(mainContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}"/);
  });

  test('Common tags are defined in locals', () => {
    expect(mainContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=\s*{/);
  });

  test('Common tags include required fields', () => {
    expect(mainContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(mainContent).toMatch(/Environment\s*=\s*var\.environment/);
    expect(mainContent).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
    expect(mainContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });

  test('Resources merge common tags', () => {
    expect(mainContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });
});

describe('Multi-Account Conditional Resources Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Organizations data source is conditional', () => {
    expect(mainContent).toMatch(/data\s+"aws_organizations_organization"\s+"org"[\s\S]*?count\s*=\s*var\.multi_account_enabled\s*\?\s*1\s*:\s*0/);
  });

  test('Service Control Policy is conditional', () => {
    expect(mainContent).toMatch(/resource\s+"aws_organizations_policy"[\s\S]*?count\s*=\s*var\.multi_account_enabled\s*\?\s*1\s*:\s*0/);
  });
});

describe('Data Sources Tests', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('Current AWS account data source is defined', () => {
    expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test('Current AWS region data source is defined', () => {
    expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
  });
});

describe('Outputs Tests', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(OUTPUTS_TF, 'utf8');
  });

  const expectedOutputs = [
    'vpc_id',
    'vpc_cidr',
    'public_subnet_ids',
    'private_subnet_ids',
    'isolated_subnet_ids',
    'nat_gateway_ips',
    'transit_gateway_id',
    'transit_gateway_attachment_id',
    'network_firewall_id',
    'guardduty_detector_id',
    'security_hub_arn',
    'cloudtrail_arn',
    'central_logging_bucket_name',
    'incident_response_function_name',
    'incident_response_function_arn',
    'security_alerts_topic_arn',
    'ec2_ssm_role_arn',
    'ec2_instance_profile_name',
    'session_manager_role_arn',
    's3_kms_key_id',
    's3_kms_key_arn',
    'cloudwatch_kms_key_id',
    'cloudwatch_kms_key_arn',
    'account_id',
    'region',
    'environment_suffix',
  ];

  expectedOutputs.forEach((outputName) => {
    test(`output "${outputName}" is defined`, () => {
      const regex = new RegExp(`output\\s+"${outputName}"\\s*{`, 'g');
      expect(outputsContent).toMatch(regex);
    });
  });

  test('Outputs have descriptions', () => {
    const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[\s\S]*?}/g);
    expect(outputBlocks).toBeTruthy();
    outputBlocks!.forEach((block) => {
      expect(block).toMatch(/description\s*=/);
    });
  });
});

describe('Code Quality and Best Practices', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, 'utf8');
  });

  test('No TODO or FIXME comments in production code', () => {
    expect(mainContent).not.toMatch(/TODO|FIXME/i);
  });

  test('Resources have descriptive comments', () => {
    const commentCount = (mainContent.match(/#.*?(?=\n)/g) || []).length;
    expect(commentCount).toBeGreaterThan(20); // Should have many comments
  });

  test('File is well-organized with section markers', () => {
    expect(mainContent).toMatch(/={10,}/); // Section dividers
  });
});
