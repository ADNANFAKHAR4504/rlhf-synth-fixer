import * as fs from 'fs';
import * as path from 'path';

/* ----------------------------- Utilities & Types ----------------------------- */

// Defines the expected structure of a single output from 'terraform output -json'
type TfOutputValue = { sensitive: boolean; type: string; value: string | null };

// Defines the structure of the entire JSON output file
type StructuredOutputs = {
  primary_alb_dns: TfOutputValue;
  secondary_alb_dns: TfOutputValue;
  rds_endpoint: TfOutputValue;
  s3_bucket_name: TfOutputValue;
  application_url: TfOutputValue;
  private_key_path: TfOutputValue;
  primary_alb_name: TfOutputValue;
  secondary_alb_name: TfOutputValue;
  primary_asg_name: TfOutputValue;
  secondary_asg_name: TfOutputValue;
  primary_db_identifier: TfOutputValue;
  lambda_function_name: TfOutputValue;
  event_rule_name: TfOutputValue;
};

// Reads and validates the contents of the output file
function readDeploymentOutputs(): Record<string, string> {
  const filePath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Outputs file not found at ${filePath}. Ensure this file is generated before running tests.`
    );
  }
  const outputs = JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  ) as StructuredOutputs;

  const extractedValues: Record<string, string> = {};
  for (const key in outputs) {
    const output = outputs[key as keyof StructuredOutputs];
    if (output?.value && typeof output.value === 'string') {
      extractedValues[key] = output.value;
    } else {
      throw new Error(
        `Output key '${key}' is missing, null, or not a string in the outputs file.`
      );
    }
  }
  return extractedValues;
}

/* ----------------------------- Test Suite ----------------------------- */

describe('Terraform Deployment Outputs Validation', () => {
  const outputs = readDeploymentOutputs();

  it('should have correctly formatted DNS and URL outputs', () => {
    // Check primary ALB DNS for correct region and format
    expect(outputs.primary_alb_dns).toMatch(
      /^.+\.us-east-1\.elb\.amazonaws\.com$/
    );

    // Check secondary ALB DNS for correct region and format
    expect(outputs.secondary_alb_dns).toMatch(
      /^.+\.us-west-2\.elb\.amazonaws\.com$/
    );

    // Check RDS endpoint for correct region and format
    expect(outputs.rds_endpoint).toMatch(
      /^.+\.us-east-1\.rds\.amazonaws\.com$/
    );

    // Check application URL format
    expect(outputs.application_url).toMatch(/^http:\/\/app\..+\..+$/);
  });

  it('should have correctly formatted resource names and identifiers', () => {
    // Check S3 bucket name format
    expect(outputs.s3_bucket_name).toMatch(/^nova-artifacts-\d+-.+$/);

    // Check that resource names start with the expected prefixes
    expect(outputs.primary_alb_name).toMatch(/^alb-pri-.+$/);
    expect(outputs.secondary_alb_name).toMatch(/^alb-sec-.+$/);
    expect(outputs.primary_asg_name).toMatch(/^asg-app-primary-.+$/);
    expect(outputs.secondary_asg_name).toMatch(/^asg-app-secondary-.+$/);
    expect(outputs.primary_db_identifier).toMatch(/^rds-postgres-primary-.+$/);
    expect(outputs.lambda_function_name).toMatch(/^lambda-cost-saver-nova-.+$/);
    expect(outputs.event_rule_name).toMatch(/^rule-daily-shutdown-.+$/);
  });

  it('should have a valid path for the private key file', () => {
    // Check that the private key path ends with .pem
    expect(outputs.private_key_path).toMatch(/\.pem$/);
  });
});
