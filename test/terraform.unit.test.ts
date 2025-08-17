// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf'; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test('declares aws_region variable in tap_stack.tf', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test('declares core resources and modules', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    // VPC module
    expect(content).toMatch(
      /module\s+"vpc"\s*{[\s\S]*?source\s*=\s*"terraform-aws-modules\/vpc\/aws"/
    );
    // ALB + ASG
    expect(content).toMatch(
      /module\s+"alb"\s*{[\s\S]*?load_balancer_type\s*=\s*"application"/
    );
    expect(content).toMatch(
      /module\s+"asg"\s*{[\s\S]*?terraform-aws-modules\/autoscaling\/aws/
    );
    // RDS
    expect(content).toMatch(/module\s+"rds"\s*{[\s\S]*?engine\s*=\s*"mysql"/);
    // Lambda + API Gateway + Cognito
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"handler"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"api"/);
    expect(content).toMatch(/resource\s+"aws_cognito_user_pool"\s+"this"/);
    // CloudFront
    expect(content).toMatch(
      /resource\s+"aws_cloudfront_distribution"\s+"this"/
    );
    // DR region minimal
    expect(content).toMatch(/module\s+"vpc_dr"/);
    expect(content).toMatch(/module\s+"alb_dr"/);
    expect(content).toMatch(/module\s+"asg_dr"/);
  });

  test('outputs expose endpoints and identifiers', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/output\s+"alb_dns_name"/);
    expect(content).toMatch(/output\s+"cloudfront_domain_name"/);
    expect(content).toMatch(/output\s+"api_invoke_url"/);
    expect(content).toMatch(/output\s+"cognito_user_pool_id"/);
  });
});
