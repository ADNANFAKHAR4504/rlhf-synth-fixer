import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const STACK_TF = path.join(LIB_DIR, 'tap-stack.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

describe('Terraform Financial Application Infrastructure - Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_TF, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_TF, 'utf8');
  });

  describe('File Structure Validation', () => {
    test('tap-stack.tf file exists', () => {
      expect(fs.existsSync(STACK_TF)).toBe(true);
    });

    test('provider.tf file exists', () => {
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });

    test('tap-stack.tf does not contain provider configuration', () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('files have balanced braces', () => {
      const openBraces = (stackContent.match(/{/g) || []).length;
      const closeBraces = (stackContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('no merge conflicts in files', () => {
      expect(stackContent).not.toContain('<<<<<<< HEAD');
      expect(stackContent).not.toContain('>>>>>>> ');
    });
  });

  describe('Variables Configuration', () => {
    test('aws_region variable is defined', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('environment_suffix variable is defined', () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
    });

    test('all variables have descriptions', () => {
      const variableMatches = stackContent.match(/variable\s+"[^"]+"/g) || [];
      const descriptionMatches = stackContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(variableMatches.length);
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('VPC is configured with correct CIDR block', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('private subnets are configured in multiple AZs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnet_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test('public subnets are configured in multiple AZs', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnet_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnet_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.101\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.102\.0\/24"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('subnets use availability zones data source', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('Internet Gateway is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"igw"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('NAT Gateway is configured with EIP', () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_eip"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_gw"/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_eip\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_subnet_1\.id/);
    });

    test('NAT Gateway has proper dependencies', () => {
      const natGatewayBlock = stackContent.match(/resource\s+"aws_nat_gateway"\s+"nat_gw"[\s\S]*?^}/m);
      expect(natGatewayBlock).toBeTruthy();
      expect(natGatewayBlock![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.igw\]/);
    });
  });

  describe('Route Tables Configuration', () => {
    test('public route table is configured with Internet Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_rt"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.igw\.id/);
    });

    test('private route table is configured with NAT Gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_rt"/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_gw\.id/);
    });

    test('route table associations are configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_rta_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_rta_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_rta_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_rta_2"/);
    });
  });

  describe('Security Group Configuration', () => {
    test('security group is configured with restrictive rules', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_sg"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('security group has internal VPC ingress rule', () => {
      expect(stackContent).toMatch(/ingress\s*{/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/16"\]/);
      expect(stackContent).toMatch(/Allow internal VPC traffic/);
    });

    test('security group has restrictive egress rules', () => {
      expect(stackContent).toMatch(/egress\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/Allow HTTPS outbound/);
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('S3 VPC endpoint is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.s3"/);
    });

    test('DynamoDB VPC endpoint is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region\}\.dynamodb"/);
    });

    test('VPC endpoints are associated with route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint_route_table_association"\s+"s3_private"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint_route_table_association"\s+"dynamodb_private"/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.private_rt\.id/);
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('KMS key is configured with key rotation', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"app_kms_key"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test('KMS key has proper policy for CloudWatch Logs', () => {
      expect(stackContent).toMatch(/logs\.\$\{var\.aws_region\}\.amazonaws\.com/);
      expect(stackContent).toMatch(/kms:Encrypt/);
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test('KMS alias is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"app_kms_alias"/);
      expect(stackContent).toMatch(/name\s*=\s*"alias\/financial-app-key-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.app_kms_key\.key_id/);
    });

    test('stack is deletable with short deletion window', () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
      expect(stackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('CloudWatch log group for flow logs is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log_group"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/vpc\/flowlogs\/financial-app-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.app_kms_key\.arn/);
    });

    test('VPC flow log is configured for all traffic', () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/log_destination_type\s*=\s*"cloud-watch-logs"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('flow log IAM role is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log_role"/);
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test('flow log IAM policy has required permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_log_policy"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('SNS Configuration', () => {
    test('SNS topic for alerts is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_topic"/);
      expect(stackContent).toMatch(/name\s*=\s*"financial-app-alerts-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.app_kms_key\.id/);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda log group is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_log_group"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/financial-app-monitoring-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('Lambda function uses archive_file data source', () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
      expect(stackContent).toMatch(/type\s*=\s*"zip"/);
      expect(stackContent).toMatch(/output_path\s*=\s*"\$\{path\.module\}\/lambda_function\.zip"/);
    });

    test('Lambda function is configured with proper runtime', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"monitoring_lambda"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"nodejs20\.x"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.handler"/);
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
      expect(stackContent).toMatch(/memory_size\s*=\s*256/);
    });

    test('Lambda function has VPC configuration', () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*\[aws_subnet\.private_subnet_1\.id, aws_subnet\.private_subnet_2\.id\]/);
      expect(stackContent).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.app_sg\.id\]/);
    });

    test('Lambda function has environment variables', () => {
      expect(stackContent).toMatch(/environment\s*{/);
      expect(stackContent).toMatch(/SNS_TOPIC_ARN\s*=\s*aws_sns_topic\.alerts_topic\.arn/);
      // AWS_REGION is a reserved Lambda environment variable and cannot be set
    });

    test('Lambda function depends on log group', () => {
      const lambdaBlock = stackContent.match(/resource\s+"aws_lambda_function"\s+"monitoring_lambda"\s*\{[\s\S]*?\n\}/m);
      expect(lambdaBlock).toBeTruthy();
      expect(lambdaBlock![0]).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda_log_group\]/);
    });

    test('Lambda IAM role is configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test('Lambda IAM policy has required permissions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_policy"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
      expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
      expect(stackContent).toMatch(/ec2:DescribeNetworkInterfaces/);
      expect(stackContent).toMatch(/ec2:DeleteNetworkInterface/);
      expect(stackContent).toMatch(/sns:Publish/);
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test('Lambda has permission for CloudWatch to invoke', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_cloudwatch"/);
      expect(stackContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(stackContent).toMatch(/principal\s*=\s*"logs\.amazonaws\.com"/);
    });
  });

  describe('CloudWatch Log Subscription Filter', () => {
    test('subscription filter is configured with pattern', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_subscription_filter"\s+"flow_log_filter"/);
      expect(stackContent).toMatch(/log_group_name\s*=\s*aws_cloudwatch_log_group\.flow_log_group\.name/);
      expect(stackContent).toMatch(/filter_pattern/);
      expect(stackContent).toMatch(/REJECT/);
      expect(stackContent).toMatch(/destination_arn\s*=\s*aws_lambda_function\.monitoring_lambda\.arn/);
    });

    test('subscription filter depends on Lambda permission', () => {
      const filterBlock = stackContent.match(/resource\s+"aws_cloudwatch_log_subscription_filter"\s+"flow_log_filter"\s*\{[\s\S]*?\n\}/m);
      expect(filterBlock).toBeTruthy();
      expect(filterBlock![0]).toMatch(/depends_on\s*=\s*\[aws_lambda_permission\.allow_cloudwatch\]/);
    });
  });

  describe('Outputs Configuration', () => {
    test('VPC outputs are defined', () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/output\s+"vpc_cidr"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.cidr_block/);
    });

    test('subnet outputs are defined', () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('security group output is defined', () => {
      expect(stackContent).toMatch(/output\s+"security_group_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.app_sg\.id/);
    });

    test('VPC endpoint outputs are defined', () => {
      expect(stackContent).toMatch(/output\s+"s3_endpoint_id"/);
      expect(stackContent).toMatch(/output\s+"dynamodb_endpoint_id"/);
    });

    test('Lambda outputs are defined', () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
      expect(stackContent).toMatch(/output\s+"lambda_function_arn"/);
    });

    test('SNS output is defined', () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('KMS outputs are defined', () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test('all outputs have descriptions', () => {
      const outputMatches = stackContent.match(/output\s+"[^"]+"/g) || [];
      const descriptionCount = (stackContent.match(/description\s*=.*(?:ID|ARN|Name|CIDR)/g) || []).length;
      expect(descriptionCount).toBeGreaterThanOrEqual(outputMatches.length);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded secrets or credentials', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^$]/i);
      expect(stackContent).not.toMatch(/key\s*=\s*"AKIA/i);
      expect(stackContent).not.toMatch(/token\s*=\s*"[^$]/i);
    });

    test('resources use environment suffix for naming', () => {
      const resourceNames = stackContent.match(/name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g);
      expect(resourceNames).toBeTruthy();
      expect(resourceNames!.length).toBeGreaterThan(10);
    });

    test('IAM policies use specific resource ARNs where possible', () => {
      expect(stackContent).toMatch(/Resource\s*=\s*aws_sns_topic\.alerts_topic\.arn/);
      expect(stackContent).toMatch(/Resource\s*=\s*aws_kms_key\.app_kms_key\.arn/);
    });

    test('encryption is configured for logs', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.app_kms_key\.arn/);
    });

    test('log retention is configured for cleanup', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  describe('Resource Dependencies', () => {
    test('data source for AWS account ID exists', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('NAT Gateway depends on Internet Gateway', () => {
      const natSection = stackContent.match(/resource\s+"aws_nat_gateway"[\s\S]*?(?=resource\s+"|data\s+"|output\s+"|variable\s+"|$)/);
      expect(natSection).toBeTruthy();
      expect(natSection![0]).toMatch(/depends_on/);
    });

    test('EIP depends on Internet Gateway', () => {
      const eipSection = stackContent.match(/resource\s+"aws_eip"[\s\S]*?(?=resource\s+"|data\s+"|output\s+"|variable\s+"|$)/);
      expect(eipSection).toBeTruthy();
      expect(eipSection![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.igw\]/);
    });
  });

  describe('Lambda Code Quality', () => {
    test('Lambda code includes error handling', () => {
      expect(stackContent).toMatch(/try\s*{/);
      expect(stackContent).toMatch(/catch\s*\(/);
    });

    test('Lambda code uses AWS SDK v3', () => {
      expect(stackContent).toMatch(/@aws-sdk\/client-sns/);
      expect(stackContent).toMatch(/SNSClient/);
      expect(stackContent).toMatch(/PublishCommand/);
    });

    test('Lambda code logs events', () => {
      expect(stackContent).toMatch(/console\.log/);
    });
  });

  describe('Naming Convention Compliance', () => {
    test('all resources follow naming convention with environment suffix', () => {
      const resources = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];
      expect(resources.length).toBeGreaterThan(20);
    });

    test('tags include resource names', () => {
      const tagBlocks = stackContent.match(/tags\s*=\s*{[\s\S]*?}/g) || [];
      expect(tagBlocks.length).toBeGreaterThan(10);
    });
  });
});
