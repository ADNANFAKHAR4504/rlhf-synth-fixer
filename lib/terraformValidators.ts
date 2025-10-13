/* istanbul ignore file */
// Lightweight validators and helpers for Terraform stack tests.
// These avoid running terraform and work purely on text/objects.

export function readTextFileSync(absolutePath: string): string {
  // Lazy import to keep module side effects minimal in test env
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as typeof import('fs');
  return fs.readFileSync(absolutePath, 'utf8');
}

export function containsBlock(
  content: string,
  resourceType: string,
  name: string
): boolean {
  // Match: resource "<resourceType>" "<name>" {
  const re = new RegExp(
    String.raw`\bresource\s+"${resourceType}"\s+"${name}"\s*{`
  );
  return re.test(content);
}

export function containsOutput(content: string, name: string): boolean {
  const re = new RegExp(`\\boutput\\s+"${name}"\\s*{`);
  return re.test(content);
}

export function containsVariable(content: string, name: string): boolean {
  const re = new RegExp(`\\bvariable\\s+"${name}"\\s*{`);
  return re.test(content);
}

export function unwrapTerraformOutput<T = unknown>(val: unknown): T | unknown {
  if (
    val &&
    typeof val === 'object' &&
    'value' in (val as Record<string, unknown>)
  ) {
    return (val as Record<string, unknown>).value as T;
  }
  return val as T;
}

export function stripPort(hostnameOrUrl: string): string {
  return hostnameOrUrl.replace(/:(\d+)$/, '');
}

export function expectArnLike(value: string): boolean {
  return /^arn:[a-z0-9-]+:[a-z0-9-]*:[a-z0-9-]*:\d{12}:.+/.test(value);
}

export function expectS3BucketIdLike(value: string): boolean {
  return /^[a-z0-9.-]{3,63}$/.test(value);
}

export function validateRequiredStackShapes(content: string): {
  resources: Record<string, boolean>;
  outputs: Record<string, boolean>;
  variables: Record<string, boolean>;
} {
  const resources = {
    s3_raw: containsBlock(content, 'aws_s3_bucket', 'raw_data'),
    s3_processed: containsBlock(content, 'aws_s3_bucket', 'processed_data'),
    s3_artifacts: containsBlock(content, 'aws_s3_bucket', 'model_artifacts'),
    lambda_pre: containsBlock(content, 'aws_lambda_function', 'preprocessing'),
    sfn: containsBlock(content, 'aws_sfn_state_machine', 'ml_pipeline'),
    ddb: containsBlock(content, 'aws_dynamodb_table', 'pipeline_metadata'),
    sagemaker_ep: containsBlock(
      content,
      'aws_sagemaker_endpoint',
      'ml_endpoint'
    ),
  } as const;

  const outputs = {
    s3_buckets: containsOutput(content, 's3_buckets'),
    lambda_function: containsOutput(content, 'lambda_function'),
    step_functions_state_machine: containsOutput(
      content,
      'step_functions_state_machine'
    ),
    sagemaker_endpoint: containsOutput(content, 'sagemaker_endpoint'),
    dynamodb_table: containsOutput(content, 'dynamodb_table'),
    kms_keys: containsOutput(content, 'kms_keys'),
  } as const;

  const variables = {
    aws_region: containsVariable(content, 'aws_region'),
  } as const;

  return { resources, outputs, variables };
}
