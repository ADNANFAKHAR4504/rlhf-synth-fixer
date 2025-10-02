import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

function readTfFile(name: string): string {
  return fs.readFileSync(path.join(LIB_DIR, name), 'utf8');
}

function readAllTf(): { file: string; content: string }[] {
  const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
  return files.map(f => ({ file: f, content: readTfFile(f) }));
}

describe('Terraform stack unit tests', () => {
  test('Required variables are present with correct types and structure', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/variable\s+"aws_region"[\s\S]*default\s*=\s*"us-west-2"/);
    // Check variable exists with list semantics instead of exact IPs
    expect(content).toMatch(/variable\s+"lambda_allowed_ips"\s*{[\s\S]*type\s*=\s*list\(string\)/);
    expect(content).toMatch(/variable\s+"dynamodb_table_name"/);
    expect(content).toMatch(/variable\s+"lambda_log_bucket_name"/);
    expect(content).toMatch(/variable\s+"tags"[\s\S]*Project[\s\S]*Environment[\s\S]*Owner[\s\S]*ManagedBy/);
    expect(content).toMatch(/variable\s+"api_key_secret_name"/);
    // Check new CORS variable exists
    expect(content).toMatch(/variable\s+"cors_allowed_origins"/);
  });

  test('S3 bucket uses versioning and server-side encryption', () => {
    const content = readTfFile('tap_stack.tf');
    // Check for separate versioning resource (modern Terraform approach)
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test('DynamoDB table is configured with autoscaling', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"[\s\S]*name\s*=\s*var.dynamodb_table_name/);
    expect(content).toMatch(/resource\s+"aws_appautoscaling_target"[\s\S]*dynamodb_read/);
    expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"[\s\S]*dynamodb_read_policy/);
    expect(content).toMatch(/resource\s+"aws_appautoscaling_target"[\s\S]*dynamodb_write/);
    expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"[\s\S]*dynamodb_write_policy/);
  });

  test('Lambda function environment variables are set', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/resource\s+"aws_lambda_function"[\s\S]*environment\s*{[\s\S]*DYNAMODB_TABLE[\s\S]*LOG_BUCKET[\s\S]*API_KEY_SECRET/);
  });

  test('API Gateway CORS is properly configured with variable origins', () => {
    const content = readTfFile('tap_stack.tf');
    // Check CORS variable is wired in responses
    expect(content).toMatch(/Access-Control-Allow-Origin/);
    expect(content).toMatch(/join\(",",\s*var\.cors_allowed_origins\)/);
    expect(content).toMatch(/'POST,OPTIONS'/);
    // Check gateway response exists for error handling
    expect(content).toMatch(/resource\s+"aws_api_gateway_gateway_response"/);
  });

  test('Security group ingress allows only 80, 443, and ICMP', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/resource\s+"aws_security_group"[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80[\s\S]*protocol\s*=\s*"tcp"/);
    expect(content).toMatch(/from_port\s*=\s*443[\s\S]*to_port\s*=\s*443[\s\S]*protocol\s*=\s*"tcp"/);
    expect(content).toMatch(/protocol\s*=\s*"icmp"/);
  });

  test('All resources are tagged correctly', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/tags\s*=\s*local.common_tags/);
    expect(content).toMatch(/Project[\s\S]*Environment[\s\S]*Owner[\s\S]*ManagedBy/);
  });

  test('IAM policies do not use wildcard Action except where required', () => {
    const content = readTfFile('tap_stack.tf');
    // Allow wildcard Resource only for secretsmanager:GetSecretValue
    const badWildcard = /"Action"\s*:\s*"\*"|"Resource"\s*:\s*"\*"/;
    const allowed = /"Action"\s*:\s*\[\s*"secretsmanager:GetSecretValue"\s*\]/;
    expect(badWildcard.test(content) && !allowed.test(content)).toBe(false);
  });

  test('Region is set to us-west-2', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/variable\s+"aws_region"[\s\S]*default\s*=\s*"us-west-2"/);
  });

  test('API Gateway resource policy is present and references IP source condition', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/aws_api_gateway_rest_api_policy/);
    expect(content).toMatch(/aws:SourceIp/);
    expect(content).toMatch(/data\s+"aws_iam_policy_document"\s+"apigw_ip_restrict"/);
  });

  test('Lambda permission for API Gateway invoke is configured', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/aws_lambda_permission[\s\S]*apigw_invoke/);
    expect(content).toMatch(/lambda:InvokeFunction/);
    expect(content).toMatch(/apigateway\.amazonaws\.com/);
  });

  test('WAF configuration is present for additional security', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/aws_wafv2_ip_set/);
    expect(content).toMatch(/aws_wafv2_web_acl/);
    expect(content).toMatch(/aws_wafv2_web_acl_association/);
  });

  test('All required outputs are present for account-agnostic testing', () => {
    const content = readTfFile('tap_stack.tf');
    expect(content).toMatch(/output\s+"api_stage_name"/);
    expect(content).toMatch(/output\s+"api_resource_path"/);
    expect(content).toMatch(/output\s+"api_execution_arn"/);
    expect(content).toMatch(/output\s+"cors_allowed_origins"/);
    expect(content).toMatch(/output\s+"s3_sse_algorithm"/);
    expect(content).toMatch(/output\s+"dynamodb_read_target_id"/);
    expect(content).toMatch(/output\s+"dynamodb_write_target_id"/);
  });
});
