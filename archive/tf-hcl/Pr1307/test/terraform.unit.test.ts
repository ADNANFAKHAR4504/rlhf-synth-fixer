// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests resource declarations, variables, outputs, and configuration without deployment

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const PROVIDER_REL = '../lib/provider.tf';
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe('Terraform Infrastructure Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Stack file not found: ${stackPath}`);
    }
    if (!fs.existsSync(providerPath)) {
      throw new Error(`Provider file not found: ${providerPath}`);
    }
    stackContent = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
  });

  describe('File Structure', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test('provider.tf exists and handles providers', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test('tap_stack.tf does NOT declare providers (delegated to provider.tf)', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/\bprovider\s+"random"\s*{/);
    });
  });

  describe('Variables', () => {
    test('declares required infrastructure variables', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"lambda_function_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"lambda_runtime"\s*{/);
    });

    test('environment variable has proper validation', () => {
      const envVarMatch = stackContent.match(
        /variable\s+"environment"\s*{[\s\S]*?}/m
      );
      expect(envVarMatch).toBeTruthy();
      expect(envVarMatch![0]).toMatch(/validation\s*{/);
      expect(envVarMatch![0]).toMatch(/dev|staging|prod/);
    });

    test('aws_region variable has proper validation', () => {
      const regionVarMatch = stackContent.match(
        /variable\s+"aws_region"\s*{[\s\S]*?}/m
      );
      expect(regionVarMatch).toBeTruthy();
      expect(regionVarMatch![0]).toMatch(/validation\s*{/);
      expect(regionVarMatch![0]).toMatch(/us-east-1|us-west-2/);
    });

    test('has environment_suffix variable for conflict avoidance', () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('environment_suffix variable has proper validation for pr{number} format', () => {
      const envSuffixMatch = stackContent.match(
        /variable\s+"environment_suffix"\s*{[\s\S]*?}/m
      );
      expect(envSuffixMatch).toBeTruthy();
      expect(envSuffixMatch![0]).toMatch(/validation\s*{/);
      expect(envSuffixMatch![0]).toMatch(/pr\[0-9\]\+/);
      expect(envSuffixMatch![0]).toMatch(/pr123/); // Example in description
    });
  });

  describe('S3 Resources', () => {
    test('declares pipeline artifacts S3 bucket', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"pipeline_artifacts"\s*{/
      );
    });

    test('declares source code S3 bucket', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"source_code"\s*{/
      );
    });

    test('configures S3 versioning for both buckets', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"pipeline_artifacts"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_versioning"\s+"source_code"\s*{/
      );
    });

    test('configures S3 encryption for security', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"pipeline_artifacts"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"source_code"\s*{/
      );
    });

    test('blocks public access for security', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"pipeline_artifacts"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_bucket_public_access_block"\s+"source_code"\s*{/
      );
    });

    test('includes source code object for deployment', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_s3_object"\s+"source_code"\s*{/
      );
    });
  });

  describe('Lambda Resources', () => {
    test('declares Lambda function', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_lambda_function"\s+"main"\s*{/
      );
    });

    test('declares Lambda IAM role with proper assume policy', () => {
      const lambdaRoleMatch = stackContent.match(
        /resource\s+"aws_iam_role"\s+"lambda_role"\s*{[\s\S]*?assume_role_policy[\s\S]*?}/m
      );
      expect(lambdaRoleMatch).toBeTruthy();
      expect(lambdaRoleMatch![0]).toMatch(
        /Service.*=.*"lambda\.amazonaws\.com"/
      );
    });

    test('attaches basic execution policy to Lambda role', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"\s*{/
      );
    });

    test('declares Lambda alias for blue/green deployments', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_lambda_alias"\s+"main"\s*{/
      );
    });
  });

  describe('CodeBuild Resources', () => {
    test('declares all required CodeBuild projects', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_codebuild_project"\s+"build"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_codebuild_project"\s+"test"\s*{/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_codebuild_project"\s+"deploy"\s*{/
      );
    });

    test('declares CodeBuild IAM role', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role"\s+"codebuild_role"\s*{/
      );
    });

    test('CodeBuild role has proper assume policy', () => {
      const codebuildRoleMatch = stackContent.match(
        /resource\s+"aws_iam_role"\s+"codebuild_role"\s*{[\s\S]*?assume_role_policy[\s\S]*?}/m
      );
      expect(codebuildRoleMatch).toBeTruthy();
      expect(codebuildRoleMatch![0]).toMatch(
        /Service.*=.*"codebuild\.amazonaws\.com"/
      );
    });

    test('declares CodeBuild IAM policy with required permissions', () => {
      const codebuildPolicyMatch = stackContent.match(
        /resource\s+"aws_iam_role_policy"\s+"codebuild_policy"\s*{[\s\S]*?}\s*}\s*}/m
      );
      expect(codebuildPolicyMatch).toBeTruthy();
      expect(codebuildPolicyMatch![0]).toMatch(/"logs:CreateLogGroup"/);
      expect(codebuildPolicyMatch![0]).toMatch(/"s3:GetObject"/);
      expect(codebuildPolicyMatch![0]).toMatch(/"lambda:UpdateFunctionCode"/);
    });

    test('deploy project has environment variables for dynamic alias', () => {
      const deployProjectMatch = stackContent.match(
        /resource\s+"aws_codebuild_project"\s+"deploy"\s*{[\s\S]*?environment_variable[\s\S]*?LAMBDA_FUNCTION_NAME[\s\S]*?environment_variable[\s\S]*?LAMBDA_ALIAS_NAME[\s\S]*?}/m
      );
      expect(deployProjectMatch).toBeTruthy();
      expect(deployProjectMatch![0]).toMatch(/LAMBDA_FUNCTION_NAME/);
      expect(deployProjectMatch![0]).toMatch(/LAMBDA_ALIAS_NAME/);
    });
  });

  describe('CodePipeline Resources', () => {
    test('declares CodePipeline', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_codepipeline"\s+"main"\s*{/
      );
    });

    test('declares CodePipeline IAM role', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role"\s+"codepipeline_role"\s*{/
      );
    });

    test('CodePipeline role has proper assume policy', () => {
      const pipelineRoleMatch = stackContent.match(
        /resource\s+"aws_iam_role"\s+"codepipeline_role"\s*{[\s\S]*?assume_role_policy[\s\S]*?}/m
      );
      expect(pipelineRoleMatch).toBeTruthy();
      expect(pipelineRoleMatch![0]).toMatch(
        /Service.*=.*"codepipeline\.amazonaws\.com"/
      );
    });

    test('declares CodePipeline IAM policy with required permissions', () => {
      const pipelinePolicyMatch = stackContent.match(
        /resource\s+"aws_iam_role_policy"\s+"codepipeline_policy"\s*{[\s\S]*?}\s*}\s*}/m
      );
      expect(pipelinePolicyMatch).toBeTruthy();
      expect(pipelinePolicyMatch![0]).toMatch(/"s3:GetObject"/);
      expect(pipelinePolicyMatch![0]).toMatch(/"codebuild:BatchGetBuilds"/);
      expect(pipelinePolicyMatch![0]).toMatch(/"codebuild:StartBuild"/);
    });
  });

  describe('Security and Best Practices', () => {
    test('uses random string for unique resource naming', () => {
      expect(stackContent).toMatch(
        /resource\s+"random_string"\s+"bucket_suffix"\s*{/
      );
    });

    test('all major resources use environment_suffix for conflict avoidance', () => {
      // Check that all major resource names include environment_suffix (now via local)
      expect(stackContent).toMatch(
        /\$\{var\.environment\}-\$\{var\.project_name\}\$\{local\.environment_suffix\}/
      );

      // Verify specific resource types use the suffix
      const resourcesWithSuffix = stackContent.match(
        /\$\{var\.environment\}-\$\{var\.project_name\}\$\{local\.environment_suffix\}/g
      );
      expect(resourcesWithSuffix).toHaveLength(10); // S3 buckets, Lambda, IAM roles, CodeBuild projects, CodePipeline
    });

    test('Lambda alias uses environment_suffix', () => {
      expect(stackContent).toMatch(
        /name\s*=\s*"live\$\{local\.environment_suffix\}"/
      );
    });

    test('no hardcoded secrets or sensitive data', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/key\s*=\s*"[A-Z0-9]{20}/);
    });

    test('S3 buckets have proper security configurations', () => {
      // Check encryption
      expect(stackContent).toMatch(/AES256|aws:kms/);
      // Check public access blocking
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });
  });

  describe('Outputs', () => {
    test('declares all required infrastructure outputs', () => {
      expect(stackContent).toMatch(/output\s+"pipeline_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"pipeline_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"lambda_function_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"lambda_role_arn"\s*{/);
    });

    test('declares CodeBuild project outputs', () => {
      expect(stackContent).toMatch(/output\s+"build_project_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"test_project_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"deploy_project_arn"\s*{/);
    });

    test('declares S3 configuration outputs', () => {
      expect(stackContent).toMatch(/output\s+"artifacts_bucket"\s*{/);
      expect(stackContent).toMatch(/output\s+"source_s3_bucket_name"\s*{/);
    });

    test('deployment status output for monitoring', () => {
      expect(stackContent).toMatch(/output\s+"deployment_status"\s*{/);
    });
  });

  describe('Configuration Validation', () => {
    test('does not contain syntax errors (basic validation)', () => {
      // Basic syntax checks
      const openBraces = (stackContent.match(/{/g) || []).length;
      const closeBraces = (stackContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('does not contain hardcoded alias names', () => {
      // Ensure no hardcoded 'live' alias references remain (except in variable names)
      const hardcodedLive = stackContent.match(/"live"/g);
      expect(hardcodedLive).toBeNull(); // Should be null since we use live${var.environment_suffix}
    });

    test('uses consistent resource naming convention', () => {
      const resourceNames = stackContent.match(/resource\s+"\w+"\s+"(\w+)"/g);
      expect(resourceNames).toBeTruthy();

      // Check that resource names use snake_case
      resourceNames?.forEach(resource => {
        const name = resource.match(/"(\w+)"\s*$/)?.[1];
        if (name) {
          expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        }
      });
    });

    test('references between resources are properly structured', () => {
      // Check that resource references use proper syntax
      const resourceRefs = stackContent.match(/\$\{[\w\.\[\]"]+\}/g);
      expect(resourceRefs).toBeTruthy();
      expect(resourceRefs!.length).toBeGreaterThan(0);
    });

    test('IAM policies are properly formatted JSON', () => {
      const jsonPolicyMatches = stackContent.match(
        /policy\s*=\s*jsonencode\(([\s\S]*?)\)\)/g
      );
      if (jsonPolicyMatches) {
        jsonPolicyMatches.forEach(policyMatch => {
          expect(policyMatch).toMatch(/Version/);
          expect(policyMatch).toMatch(/Statement/);
        });
      }
    });
  });
});
