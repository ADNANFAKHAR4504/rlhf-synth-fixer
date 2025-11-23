import fs from 'fs';
import path from 'path';

const libDir = path.resolve(__dirname, '..', 'lib');

type BlockKind = 'resource' | 'data' | 'output';
interface TerraformBlock {
  type: string;
  name: string;
  body: string;
}

function listTerraformFiles(dir: string = libDir): string[] {
  if (!fs.existsSync(dir)) throw new Error(`Directory not found: ${dir}`);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tf'))
    .map((f) => path.join(dir, f))
    .sort();
}

function readTerraformFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function extractBlocks(content: string, keyword: BlockKind = 'resource'): TerraformBlock[] {
  const blocks: TerraformBlock[] = [];
  const hasTwoNames = keyword !== 'output';
  const re = hasTwoNames
    ? new RegExp(`${keyword}\\s+"([^"]+)"\\s+"([^"]+)"\\s*\\{`, 'g')
    : new RegExp(`${keyword}\\s+"([^"]+)"\\s*\\{`, 'g');

  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
      i += 1;
    }

    if (depth !== 0) {
      const name = hasTwoNames ? `${match[1]}.${match[2]}` : match[1];
      throw new Error(`Unbalanced braces for ${keyword} ${name}`);
    }

    const body = content.slice(start, i - 1).trim();
    const type = hasTwoNames ? match[1] : keyword;
    const name = hasTwoNames ? match[2] : match[1];
    blocks.push({ type, name, body });
  }

  return blocks;
}

function findBlock(blocks: TerraformBlock[], type: string, name: string) {
  return blocks.find((b) => b.type === type && b.name === name);
}

function getAttribute(body: string, attribute: string): string | undefined {
  const esc = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\b${esc}\\s*=\\s*([^\\n#]+)`).exec(body);
  return match ? match[1].trim() : undefined;
}

function parseTransitions(body: string, storageClass = 'STANDARD_IA'): number[] {
  const results: number[] = [];
  const re = /transition\s*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(body))) {
    const block = match[1];
    if (new RegExp(`storage_class\\s*=\\s*"${storageClass}"`).test(block)) {
      const daysMatch = /days\s*=\s*(\d+)/.exec(block);
      if (daysMatch) results.push(parseInt(daysMatch[1], 10));
    }
  }
  return results;
}

function blockUsesVariables(body: string, variables: string[]): boolean {
  return variables.every((variable) => new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(body));
}

function namingHasParts(value: string | undefined, parts: string[]): boolean {
  if (!value) return false;
  return parts.every((part) => value.includes(part));
}

function hasTag(body: string, tagKey: string): boolean {
  return new RegExp(tagKey.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).test(body);
}

const tfFiles = listTerraformFiles(libDir);
const fileContents = tfFiles.map((file) => ({ file, content: readTerraformFile(file) }));
const allResources = fileContents.flatMap((file) => extractBlocks(file.content, 'resource'));
const allOutputs = fileContents.flatMap((file) => extractBlocks(file.content, 'output'));
const allDataSources = fileContents.flatMap((file) => extractBlocks(file.content, 'data'));

describe('Terraform library validation', () => {
  test('lists terraform files and guards invalid directories', () => {
    expect(tfFiles.length).toBeGreaterThan(0);
    expect(() => listTerraformFiles(path.join(libDir, 'missing-dir'))).toThrow('Directory not found');
    // default path uses __dirname inside lib/terraformMeta.ts
    expect(listTerraformFiles().length).toBeGreaterThan(0);
  });

  test('extractBlocks parses resources and detects unbalanced braces', () => {
    const sample = 'resource "aws_example" "one" { name = "ok" }';
    const parsed = extractBlocks(sample);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('aws_example');
    expect(() => extractBlocks('resource "aws_example" "broken" { name = "x" ')).toThrow(
      /Unbalanced braces/,
    );
  });

  test('helpers cover attribute parsing and variable usage paths', () => {
    const bucket = findBlock(allResources, 'aws_s3_bucket', 'webhook_payloads');
    expect(getAttribute(bucket!.body, 'bucket')).toBeDefined();
    expect(getAttribute(bucket!.body, 'does_not_exist')).toBeUndefined();
    expect(blockUsesVariables(bucket!.body, ['var.project', 'var.environment'])).toBe(true);
    expect(blockUsesVariables(bucket!.body, ['nonexistent_variable'])).toBe(false);
    expect(namingHasParts(undefined, ['anything'])).toBe(false);
    expect(parseTransitions('transition { storage_class = "GLACIER" days = 10 }')).toEqual([]);
  });

  test('variables and locals are defined with expected keys', () => {
    const variablesFile = fileContents.find(({ file }) => file.endsWith('variables.tf'))!.content;
    expect(variablesFile).toMatch(/variable\s+"aws_region"/);
    expect(variablesFile).toMatch(/variable\s+"environment"/);
    expect(variablesFile).toMatch(/lambda_configs/);

    const localsFile = fileContents.find(({ file }) => file.endsWith('locals.tf'))!.content;
    expect(localsFile).toMatch(/name_prefix/);
    expect(hasTag(localsFile, 'iac-rlhf-amazon')).toBe(true);
    expect(localsFile).toMatch(/CreatedBy\s*=\s*"iac-automation"/);
  });

  describe('S3 buckets', () => {
    const payloadBucket = findBlock(allResources, 'aws_s3_bucket', 'webhook_payloads');
    const payloadLifecycle = findBlock(
      allResources,
      'aws_s3_bucket_lifecycle_configuration',
      'webhook_payloads',
    );
    const failedBucket = findBlock(allResources, 'aws_s3_bucket', 'failed_messages');
    const failedLifecycle = findBlock(
      allResources,
      'aws_s3_bucket_lifecycle_configuration',
      'failed_messages',
    );

    test('exist with naming, encryption, and versioning', () => {
      expect(payloadBucket).toBeDefined();
      const bucketName = getAttribute(payloadBucket!.body, 'bucket');
      expect(namingHasParts(bucketName, ['${var.project}', '${var.environment}', '${local.suffix}'])).toBe(
        true,
      );
      expect(failedBucket).toBeDefined();

      // Check for separate versioning resources
      const payloadVersioning = findBlock(allResources, 'aws_s3_bucket_versioning', 'webhook_payloads');
      const failedVersioning = findBlock(allResources, 'aws_s3_bucket_versioning', 'failed_messages');
      expect(payloadVersioning).toBeDefined();
      expect(payloadVersioning!.body).toMatch(/status\s*=\s*"Enabled"/);
      expect(failedVersioning).toBeDefined();
      expect(failedVersioning!.body).toMatch(/status\s*=\s*"Enabled"/);

      // Check for separate encryption resources
      const payloadEncryption = findBlock(allResources, 'aws_s3_bucket_server_side_encryption_configuration', 'webhook_payloads');
      const failedEncryption = findBlock(allResources, 'aws_s3_bucket_server_side_encryption_configuration', 'failed_messages');
      expect(payloadEncryption).toBeDefined();
      expect(payloadEncryption!.body).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(failedEncryption).toBeDefined();
      expect(failedEncryption!.body).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('enforce lifecycle transitions and public access blocks', () => {
      const iaDays = parseTransitions(payloadLifecycle!.body, 'STANDARD_IA');
      expect(iaDays.length).toBeGreaterThan(0);
      expect(iaDays.every((d) => d >= 30)).toBe(true);
      const failedDays = parseTransitions(failedLifecycle!.body, 'STANDARD_IA');
      expect(failedDays.every((d) => d >= 30)).toBe(true);

      const payloadAccess = findBlock(allResources, 'aws_s3_bucket_public_access_block', 'webhook_payloads');
      expect(payloadAccess!.body).toMatch(/block_public_acls\s*=\s*true/);
      const failedAccess = findBlock(allResources, 'aws_s3_bucket_public_access_block', 'failed_messages');
      expect(failedAccess!.body).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe('SQS queues', () => {
    test('define processing, validated, and DLQ queues with redrive policies', () => {
      const dlq = findBlock(allResources, 'aws_sqs_queue', 'webhook_dlq');
      const processing = findBlock(allResources, 'aws_sqs_queue', 'webhook_processing_queue');
      const validated = findBlock(allResources, 'aws_sqs_queue', 'validated_queue');

      expect(dlq).toBeDefined();
      expect(processing!.body).toMatch(/visibility_timeout_seconds\s*=\s*300/);
      expect(validated!.body).toMatch(/visibility_timeout_seconds\s*=\s*300/);
      expect(processing!.body).toMatch(/deadLetterTargetArn\s*=\s*aws_sqs_queue\.webhook_dlq\.arn/);
      expect(validated!.body).toMatch(/deadLetterTargetArn\s*=\s*aws_sqs_queue\.webhook_dlq\.arn/);
    });
  });

  describe('DynamoDB', () => {
    test('transactions table uses pay-per-request, encryption, PITR, and GSI', () => {
      const table = findBlock(allResources, 'aws_dynamodb_table', 'transactions');
      expect(table).toBeDefined();
      expect(table!.body).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(table!.body).toMatch(/server_side_encryption\s*{\s*enabled\s*=\s*true/);
      expect(table!.body).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);
      expect(table!.body).toMatch(/global_secondary_index/);
      expect(table!.body).toMatch(/customer-index/);
    });
  });

  describe('Lambda functions and event sources', () => {
    const webhook = findBlock(allResources, 'aws_lambda_function', 'webhook_receiver');
    const validator = findBlock(allResources, 'aws_lambda_function', 'payload_validator');
    const processor = findBlock(allResources, 'aws_lambda_function', 'transaction_processor');

    test('functions exist with correct runtime, handlers, and tracing', () => {
      for (const fn of [webhook, validator, processor]) {
        expect(fn).toBeDefined();
        expect(fn!.body).toMatch(/runtime\s*=\s*"python3\.11"/);
        expect(fn!.body).toMatch(/handler\s*=\s*"index\.handler"/);
        expect(fn!.body).toMatch(/architectures\s*=\s*\["arm64"\]/);
        expect(fn!.body).toMatch(/tracing_config\s*{\s*mode\s*=\s*"Active"/);
      }
    });

    test('environment variables reference SSM parameters and dependent resources', () => {
      expect(blockUsesVariables(webhook!.body, ['var.ssm_prefix'])).toBe(true);
      expect(webhook!.body).toMatch(/API_KEY_PARAM\s*=\s*"\$\{var\.ssm_prefix\}\/api_key"/);
      expect(validator!.body).toMatch(/VALIDATION_RULES_PARAM\s*=\s*"\$\{var\.ssm_prefix\}\/validation_rules"/);
      expect(processor!.body).toMatch(/DB_CREDENTIALS_PARAM\s*=\s*"\$\{var\.ssm_prefix\}\/db_credentials"/);
      expect(webhook!.body).toMatch(/PROCESSING_QUEUE_URL\s*=\s*aws_sqs_queue\.webhook_processing_queue\.id/);
      expect(processor!.body).toMatch(/TRANSACTIONS_TABLE\s*=\s*aws_dynamodb_table\.transactions\.name/);
    });

    test('SQS event source mappings are configured for validator and processor', () => {
      const validatorMapping = findBlock(allResources, 'aws_lambda_event_source_mapping', 'validator_sqs');
      const processorMapping = findBlock(allResources, 'aws_lambda_event_source_mapping', 'processor_sqs');
      expect(validatorMapping!.body).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.webhook_processing_queue\.arn/);
      expect(processorMapping!.body).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.validated_queue\.arn/);
    });
  });

  describe('IAM', () => {
    test('Lambda role and policy grant least-privilege access to dependencies', () => {
      const role = findBlock(allResources, 'aws_iam_role', 'lambda_role');
      const policy = findBlock(allResources, 'aws_iam_policy', 'lambda_common_policy');
      expect(role).toBeDefined();
      expect(role!.body).toMatch(/lambda\.amazonaws\.com/);
      expect(policy).toBeDefined();
      expect(policy!.body).toMatch(/logs:CreateLogGroup/);
      expect(policy!.body).toMatch(/sqs:SendMessage/);
      expect(policy!.body).toMatch(/dynamodb:PutItem/);
      expect(policy!.body).toMatch(/ssm:GetParameter/);
      expect(policy!.body).toMatch(/arn:aws:ssm:\${var.aws_region}:\*:parameter\${var.ssm_prefix}\/\*/);
      expect(policy!.body).toMatch(/xray:PutTraceSegments/);
    });
  });

  describe('API Gateway', () => {
    test('REST API, resource, method, integration, and stage exist', () => {
      const api = findBlock(allResources, 'aws_api_gateway_rest_api', 'webhook_api');
      const resource = findBlock(allResources, 'aws_api_gateway_resource', 'webhook');
      const method = findBlock(allResources, 'aws_api_gateway_method', 'webhook_post');
      const integration = findBlock(allResources, 'aws_api_gateway_integration', 'webhook_lambda');
      const stage = findBlock(allResources, 'aws_api_gateway_stage', 'webhook_stage');

      expect(api).toBeDefined();
      expect(resource).toBeDefined();
      expect(method!.body).toMatch(/http_method\s*=\s*"POST"/);
      expect(method!.body).toMatch(/api_key_required\s*=\s*true/);
      expect(integration!.body).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stage!.body).toMatch(/stage_name\s*=\s*var\.environment/);
      expect(stage!.body).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test('usage plan and API key configuration present with throttling', () => {
      const usagePlan = findBlock(allResources, 'aws_api_gateway_usage_plan', 'webhook_plan');
      const apiKey = findBlock(allResources, 'aws_api_gateway_api_key', 'webhook_key');
      expect(apiKey).toBeDefined();
      expect(usagePlan!.body).toMatch(/throttle_settings/);
      expect(usagePlan!.body).toMatch(/burst_limit\s*=\s*2000/);
      expect(usagePlan!.body).toMatch(/rate_limit\s*=\s*1000/);
    });
  });

  describe('CloudWatch', () => {
    test('log groups created per lambda with retention policy', () => {
      const logGroups = ['webhook_receiver_logs', 'payload_validator_logs', 'transaction_processor_logs'].map(
        (name) => findBlock(allResources, 'aws_cloudwatch_log_group', name),
      );
      for (const group of logGroups) {
        expect(group).toBeDefined();
        expect(group!.body).toMatch(/retention_in_days\s*=\s*7/);
      }
    });

    test('alarms monitor error rates and DLQ depth', () => {
      const errorAlarm = findBlock(allResources, 'aws_cloudwatch_metric_alarm', 'lambda_error_rate');
      const validatorAlarm = findBlock(allResources, 'aws_cloudwatch_metric_alarm', 'lambda_error_rate_validator');
      const processorAlarm = findBlock(allResources, 'aws_cloudwatch_metric_alarm', 'lambda_error_rate_processor');
      const dlqAlarm = findBlock(allResources, 'aws_cloudwatch_metric_alarm', 'dlq_messages');
      expect(errorAlarm).toBeDefined();
      expect(validatorAlarm).toBeDefined();
      expect(processorAlarm).toBeDefined();
      expect(dlqAlarm!.body).toMatch(/QueueName\s*=\s*aws_sqs_queue\.webhook_dlq\.name/);
    });
  });

  describe('SNS and outputs', () => {
    test('alerts topic and subscriptions are present', () => {
      const topic = findBlock(allResources, 'aws_sns_topic', 'alerts');
      expect(topic).toBeDefined();
      const subscription = findBlock(allResources, 'aws_sns_topic_subscription', 'emails');
      expect(subscription!.body).toMatch(/topic_arn\s*=\s*aws_sns_topic\.alerts\.arn/);
    });

    test('outputs expose key resource identifiers', () => {
      const outputNames = [
        'api_endpoint',
        'api_key_id',
        'webhook_receiver_arn',
        'payload_validator_arn',
        'transaction_processor_arn',
        'dynamodb_table_name',
        'webhook_payloads_bucket',
        'failed_messages_bucket',
        'processing_queue_url',
        'validated_queue_url',
        'dlq_url',
        'random_suffix',
      ];
      for (const name of outputNames) {
        expect(findBlock(allOutputs, 'output', name)).toBeDefined();
      }
      const endpoint = findBlock(allOutputs, 'output', 'api_endpoint');
      expect(endpoint!.body).toMatch(/aws_api_gateway_rest_api\.webhook_api\.id/);
      expect(endpoint!.body).toMatch(/var\.aws_region/);
    });
  });

  describe('Random strings and data sources', () => {
    test('random suffix resource is defined with predictable settings', () => {
      const random = findBlock(allResources, 'random_string', 'suffix');
      expect(random!.body).toMatch(/length\s*=\s*6/);
      expect(random!.body).toMatch(/upper\s*=\s*false/);
      expect(random!.body).toMatch(/special\s*=\s*false/);
    });

    test('data sources include caller identity and DynamoDB KMS alias', () => {
      const caller = findBlock(allDataSources, 'aws_caller_identity', 'current');
      const kms = findBlock(allDataSources, 'aws_kms_alias', 'dynamodb');
      expect(caller).toBeDefined();
      expect(kms!.body).toMatch(/alias\/aws\/dynamodb/);
    });
  });
});
