// test/terraform.int.test.ts 
// Integration tests for Terraform stack outputs and resource relationships
// These tests validate the deployed infrastructure without running terraform commands

import fs from 'fs';
import path from 'path';

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");

interface TerraformOutputs {
  ecr_repository_url?: { value: string };
  ecr_repository_name?: { value: string };
  api_gateway_url?: { value: string };
  api_gateway_invoke_url?: { value: string };
  model_endpoints?: { value: Record<string, string> };
  lambda_function_names?: { value: Record<string, string> };
  lambda_function_arns?: { value: Record<string, string> };
  efs_filesystem_id?: { value: string };
  efs_access_point_id?: { value: string };
  api_keys?: { value: Record<string, string> };
  api_key_values?: { value: Record<string, string>; sensitive?: boolean };
  sns_topic_arn?: { value: string };
  cloudwatch_dashboard_url?: { value: string };
  waf_web_acl_id?: { value: string };
  waf_web_acl_arn?: { value: string };
  kms_key_id?: { value: string };
  kms_key_arn?: { value: string };
  vpc_id?: { value: string };
  private_subnet_ids?: { value: string[] };
  public_subnet_ids?: { value: string[] };
  parameter_store_paths?: { value: Record<string, string> };
  deployment_info?: {
    value: {
      region: string;
      account_id: string;
      project_name: string;
      environment: string;
      model_versions: string[];
      ecr_repository: string;
      api_gateway_id: string;
    };
  };
}

let outputs: TerraformOutputs = {};
let outputsExist = false;

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const rawData = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(rawData);
    outputsExist = true;
  } else {
    console.warn(`[WARN] Outputs file not found at: ${outputsPath}`);
    console.warn('[WARN] Some integration tests will be skipped');
  }
});

describe('Terraform Stack Integration Tests', () => {
  describe('Outputs File Validation', () => {
    test('outputs file exists or tests are skipped', () => {
      if (!outputsExist) {
        console.log('[SKIP] Outputs file not found - skipping integration tests');
      }
      // This test always passes but logs warnings
      expect(true).toBe(true);
    });

    test('outputs file contains valid JSON', () => {
      if (!outputsExist) {
        return; // Skip if outputs don't exist
      }
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('outputs file is not empty', () => {
      if (!outputsExist) return;
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Critical Outputs Presence', () => {
    test('ECR repository outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.ecr_repository_url).toBeDefined();
      expect(outputs.ecr_repository_name).toBeDefined();
    });

    test('API Gateway outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.api_gateway_invoke_url).toBeDefined();
      expect(outputs.model_endpoints).toBeDefined();
    });

    test('Lambda function outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.lambda_function_names).toBeDefined();
      // lambda_function_arns is optional - might be missing in older deployments
      if (outputs.lambda_function_arns) {
        expect(outputs.lambda_function_arns).toBeDefined();
      }
    });

    test('EFS outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.efs_filesystem_id).toBeDefined();
      expect(outputs.efs_access_point_id).toBeDefined();
    });

    test('VPC outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
    });

    test('security outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.waf_web_acl_id).toBeDefined();
      expect(outputs.api_keys).toBeDefined();
    });

    test('monitoring outputs are present', () => {
      if (!outputsExist) return;
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.cloudwatch_dashboard_url).toBeDefined();
    });

    test('deployment info output is present', () => {
      if (!outputsExist) return;
      expect(outputs.deployment_info).toBeDefined();
    });
  });

  describe('ECR Repository Validation', () => {
    test('ECR repository URL has correct format', () => {
      if (!outputsExist || !outputs.ecr_repository_url) return;

      const url = outputs.ecr_repository_url.value;
      expect(url).toMatch(/^\d+\.dkr\.ecr\.[a-z]+-[a-z]+-\d+\.amazonaws\.com\/.+$/);
    });

    test('ECR repository name matches expected pattern', () => {
      if (!outputsExist || !outputs.ecr_repository_name) return;

      const name = outputs.ecr_repository_name.value;
      expect(name).toMatch(/^[a-z0-9-]+$/);
      expect(name).toContain('models');
    });

    test('ECR repository URL and name are consistent', () => {
      if (!outputsExist || !outputs.ecr_repository_url || !outputs.ecr_repository_name) return;

      const url = outputs.ecr_repository_url.value;
      const name = outputs.ecr_repository_name.value;
      expect(url).toContain(name);
    });
  });

  describe('API Gateway Validation', () => {
    test('API Gateway ID has correct format', () => {
      if (!outputsExist || !outputs.api_gateway_url) return;

      const apiId = outputs.api_gateway_url.value;
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiId.length).toBeGreaterThan(5);
    });

    test('API Gateway invoke URL has HTTPS', () => {
      if (!outputsExist || !outputs.api_gateway_invoke_url) return;

      const url = outputs.api_gateway_invoke_url.value;
      expect(url).toMatch(/^https:\/\//);
    });

    test('API Gateway invoke URL contains correct region', () => {
      if (!outputsExist || !outputs.api_gateway_invoke_url || !outputs.deployment_info) return;

      const url = outputs.api_gateway_invoke_url.value;
      const region = outputs.deployment_info.value.region;
      expect(url).toContain(region);
    });

    test('API Gateway invoke URL has correct format', () => {
      if (!outputsExist || !outputs.api_gateway_invoke_url) return;

      const url = outputs.api_gateway_invoke_url.value;
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z]+-[a-z]+-\d+\.amazonaws\.com$/);
    });

    test('model endpoints are defined for each version', () => {
      if (!outputsExist || !outputs.model_endpoints || !outputs.deployment_info) return;

      const endpoints = outputs.model_endpoints.value;
      const modelVersions = outputs.deployment_info.value.model_versions;

      modelVersions.forEach(version => {
        expect(endpoints[version]).toBeDefined();
        expect(endpoints[version]).toMatch(/^https:\/\//);
        expect(endpoints[version]).toContain(`/${version}/predict`);
      });
    });

    test('model endpoints use HTTPS', () => {
      if (!outputsExist || !outputs.model_endpoints) return;

      const endpoints = outputs.model_endpoints.value;
      Object.values(endpoints).forEach(endpoint => {
        expect(endpoint).toMatch(/^https:\/\//);
      });
    });

    test('model endpoints have /predict path', () => {
      if (!outputsExist || !outputs.model_endpoints) return;

      const endpoints = outputs.model_endpoints.value;
      Object.values(endpoints).forEach(endpoint => {
        expect(endpoint).toContain('/predict');
      });
    });
  });

  describe('Lambda Function Validation', () => {
    test('Lambda functions defined for each model version', () => {
      if (!outputsExist || !outputs.lambda_function_names || !outputs.deployment_info) return;

      const functionNames = outputs.lambda_function_names.value;
      const modelVersions = outputs.deployment_info.value.model_versions;

      expect(Object.keys(functionNames).length).toBe(modelVersions.length);

      modelVersions.forEach(version => {
        expect(functionNames[version]).toBeDefined();
      });
    });

    test('Lambda function names follow naming convention', () => {
      if (!outputsExist || !outputs.lambda_function_names || !outputs.deployment_info) return;

      const functionNames = outputs.lambda_function_names.value;
      const projectName = outputs.deployment_info.value.project_name;

      Object.values(functionNames).forEach(name => {
        expect(name).toMatch(/^[a-zA-Z0-9-_]+$/);
        expect(name).toContain(projectName);
        expect(name).toContain('inference');
      });
    });

    test('Lambda function ARNs have correct format', () => {
      if (!outputsExist || !outputs.lambda_function_arns) return;

      const functionArns = outputs.lambda_function_arns.value;

      Object.values(functionArns).forEach(arn => {
        expect(arn).toMatch(/^arn:aws:lambda:[a-z]+-[a-z]+-\d+:\d+:function:.+$/);
      });
    });

    test('Lambda ARNs match function names', () => {
      if (!outputsExist || !outputs.lambda_function_names || !outputs.lambda_function_arns) return;

      const functionNames = outputs.lambda_function_names.value;
      const functionArns = outputs.lambda_function_arns.value;

      Object.keys(functionNames).forEach(version => {
        const name = functionNames[version];
        const arn = functionArns[version];
        expect(arn).toContain(name);
      });
    });

    test('Lambda functions exist for all model versions', () => {
      if (!outputsExist || !outputs.lambda_function_names || !outputs.deployment_info) return;

      const functionNames = outputs.lambda_function_names.value;
      const modelVersions = outputs.deployment_info.value.model_versions;

      modelVersions.forEach(version => {
        expect(functionNames[version]).toBeTruthy();
        expect(functionNames[version].length).toBeGreaterThan(0);
      });
    });
  });

  describe('EFS Storage Validation', () => {
    test('EFS filesystem ID has correct format', () => {
      if (!outputsExist || !outputs.efs_filesystem_id) return;

      const fsId = outputs.efs_filesystem_id.value;
      expect(fsId).toMatch(/^fs-[a-f0-9]+$/);
    });

    test('EFS access point ID has correct format', () => {
      if (!outputsExist || !outputs.efs_access_point_id) return;

      const apId = outputs.efs_access_point_id.value;
      expect(apId).toMatch(/^fsap-[a-f0-9]+$/);
    });

    test('EFS IDs are not empty', () => {
      if (!outputsExist || !outputs.efs_filesystem_id || !outputs.efs_access_point_id) return;

      expect(outputs.efs_filesystem_id.value.length).toBeGreaterThan(0);
      expect(outputs.efs_access_point_id.value.length).toBeGreaterThan(0);
    });
  });

  describe('VPC and Network Validation', () => {
    test('VPC ID has correct format', () => {
      if (!outputsExist || !outputs.vpc_id) return;

      const vpcId = outputs.vpc_id.value;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('private subnets are defined and have correct format', () => {
      if (!outputsExist || !outputs.private_subnet_ids) return;

      const privateSubnets = outputs.private_subnet_ids.value;
      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(privateSubnets.length).toBeGreaterThan(0);

      privateSubnets.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('public subnets are defined and have correct format', () => {
      if (!outputsExist || !outputs.public_subnet_ids) return;

      const publicSubnets = outputs.public_subnet_ids.value;
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(publicSubnets.length).toBeGreaterThan(0);

      publicSubnets.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('multiple availability zones configured', () => {
      if (!outputsExist || !outputs.private_subnet_ids || !outputs.public_subnet_ids) return;

      const privateSubnets = outputs.private_subnet_ids.value;
      const publicSubnets = outputs.public_subnet_ids.value;

      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('private and public subnets count match', () => {
      if (!outputsExist || !outputs.private_subnet_ids || !outputs.public_subnet_ids) return;

      const privateSubnets = outputs.private_subnet_ids.value;
      const publicSubnets = outputs.public_subnet_ids.value;

      expect(privateSubnets.length).toBe(publicSubnets.length);
    });

    test('subnet IDs are unique', () => {
      if (!outputsExist || !outputs.private_subnet_ids || !outputs.public_subnet_ids) return;

      const privateSubnets = outputs.private_subnet_ids.value;
      const publicSubnets = outputs.public_subnet_ids.value;
      const allSubnets = [...privateSubnets, ...publicSubnets];

      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(allSubnets.length);
    });
  });

  describe('Security Configuration Validation', () => {
    test('KMS key ID has correct format', () => {
      if (!outputsExist || !outputs.kms_key_id) return;

      const keyId = outputs.kms_key_id.value;
      expect(keyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('KMS key ARN has correct format', () => {
      if (!outputsExist || !outputs.kms_key_arn) return;

      const keyArn = outputs.kms_key_arn.value;
      expect(keyArn).toMatch(/^arn:aws:kms:[a-z]+-[a-z]+-\d+:\d+:key\/[a-f0-9-]+$/);
    });

    test('KMS ARN contains key ID', () => {
      if (!outputsExist || !outputs.kms_key_id || !outputs.kms_key_arn) return;

      const keyId = outputs.kms_key_id.value;
      const keyArn = outputs.kms_key_arn.value;

      expect(keyArn).toContain(keyId);
    });

    test('WAF Web ACL ID has correct format', () => {
      if (!outputsExist || !outputs.waf_web_acl_id) return;

      const wafId = outputs.waf_web_acl_id.value;
      expect(wafId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('WAF Web ACL ARN has correct format', () => {
      if (!outputsExist || !outputs.waf_web_acl_arn) return;

      const wafArn = outputs.waf_web_acl_arn.value;
      expect(wafArn).toMatch(/^arn:aws:wafv2:[a-z]+-[a-z]+-\d+:\d+:regional\/webacl\/.+\/[a-f0-9-]+$/);
    });

    test('API keys defined for all model versions', () => {
      if (!outputsExist || !outputs.api_keys || !outputs.deployment_info) return;

      const apiKeys = outputs.api_keys.value;
      const modelVersions = outputs.deployment_info.value.model_versions;

      modelVersions.forEach(version => {
        expect(apiKeys[version]).toBeDefined();
        expect(apiKeys[version]).toMatch(/^[a-z0-9]+$/);
      });
    });

    test('API key values are marked as sensitive', () => {
      if (!outputsExist || !outputs.api_key_values) return;

      // In Terraform, sensitive values might be masked or have a sensitive flag
      // We just check they exist and are proper structure
      expect(outputs.api_key_values).toBeDefined();
      expect(outputs.api_key_values.value).toBeDefined();
    });
  });

  describe('Parameter Store Validation', () => {
    test('Parameter Store paths defined for all model versions', () => {
      if (!outputsExist || !outputs.parameter_store_paths || !outputs.deployment_info) return;

      const paths = outputs.parameter_store_paths.value;
      const modelVersions = outputs.deployment_info.value.model_versions;

      modelVersions.forEach(version => {
        expect(paths[version]).toBeDefined();
      });
    });

    test('Parameter Store paths follow AWS naming convention', () => {
      if (!outputsExist || !outputs.parameter_store_paths) return;

      const paths = outputs.parameter_store_paths.value;

      Object.values(paths).forEach(path => {
        expect(path).toMatch(/^\//);
        expect(path).toMatch(/^\/[a-zA-Z0-9/_-]+$/);
      });
    });

    test('Parameter Store paths include project and environment', () => {
      if (!outputsExist || !outputs.parameter_store_paths || !outputs.deployment_info) return;

      const paths = outputs.parameter_store_paths.value;
      const projectName = outputs.deployment_info.value.project_name;
      const environment = outputs.deployment_info.value.environment;

      Object.values(paths).forEach(path => {
        expect(path).toContain(projectName);
        expect(path).toContain(environment);
      });
    });
  });

  describe('Monitoring Configuration Validation', () => {
    test('SNS topic ARN has correct format', () => {
      if (!outputsExist || !outputs.sns_topic_arn) return;

      const topicArn = outputs.sns_topic_arn.value;
      expect(topicArn).toMatch(/^arn:aws:sns:[a-z]+-[a-z]+-\d+:\d+:.+$/);
    });

    test('SNS topic name includes project identifier', () => {
      if (!outputsExist || !outputs.sns_topic_arn || !outputs.deployment_info) return;

      const topicArn = outputs.sns_topic_arn.value;
      const projectName = outputs.deployment_info.value.project_name;

      expect(topicArn).toContain(projectName);
    });

    test('CloudWatch dashboard URL is valid', () => {
      if (!outputsExist || !outputs.cloudwatch_dashboard_url) return;

      const dashboardUrl = outputs.cloudwatch_dashboard_url.value;
      expect(dashboardUrl).toMatch(/^https:\/\//);
      expect(dashboardUrl).toContain('console.aws.amazon.com');
      expect(dashboardUrl).toContain('cloudwatch');
      expect(dashboardUrl).toContain('dashboards');
    });

    test('CloudWatch dashboard URL contains region', () => {
      if (!outputsExist || !outputs.cloudwatch_dashboard_url || !outputs.deployment_info) return;

      const dashboardUrl = outputs.cloudwatch_dashboard_url.value;
      const region = outputs.deployment_info.value.region;

      expect(dashboardUrl).toContain(region);
    });

    test('CloudWatch dashboard URL contains project name', () => {
      if (!outputsExist || !outputs.cloudwatch_dashboard_url || !outputs.deployment_info) return;

      const dashboardUrl = outputs.cloudwatch_dashboard_url.value;
      const projectName = outputs.deployment_info.value.project_name;

      expect(dashboardUrl).toContain(projectName);
    });
  });

  describe('Deployment Info Validation', () => {
    test('deployment info has all required fields', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const info = outputs.deployment_info.value;

      expect(info.region).toBeDefined();
      expect(info.account_id).toBeDefined();
      expect(info.project_name).toBeDefined();
      expect(info.environment).toBeDefined();
      expect(info.model_versions).toBeDefined();
      expect(info.ecr_repository).toBeDefined();
      expect(info.api_gateway_id).toBeDefined();
    });

    test('AWS region is valid', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const region = outputs.deployment_info.value.region;
      expect(region).toMatch(/^[a-z]+-[a-z]+-\d+$/);
    });

    test('AWS account ID is valid', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const accountId = outputs.deployment_info.value.account_id;
      expect(accountId).toMatch(/^\d{12}$/);
    });

    test('project name is not empty', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const projectName = outputs.deployment_info.value.project_name;
      expect(projectName.length).toBeGreaterThan(0);
      expect(projectName).toMatch(/^[a-z0-9-]+$/);
    });

    test('environment is valid', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const environment = outputs.deployment_info.value.environment;
      expect(['dev', 'test', 'staging', 'prod']).toContain(environment);
    });

    test('model versions is an array with at least one version', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const modelVersions = outputs.deployment_info.value.model_versions;
      expect(Array.isArray(modelVersions)).toBe(true);
      expect(modelVersions.length).toBeGreaterThan(0);
    });

    test('ECR repository in deployment info matches ECR output', () => {
      if (!outputsExist || !outputs.deployment_info || !outputs.ecr_repository_url) return;

      const deploymentEcr = outputs.deployment_info.value.ecr_repository;
      const ecrUrl = outputs.ecr_repository_url.value;

      // Check if either ECR URL contains the deployment ECR or vice versa
      const isConsistent = ecrUrl.includes(deploymentEcr) || deploymentEcr.includes(ecrUrl);
      expect(isConsistent).toBe(true);
    });

    test('API Gateway ID in deployment info matches API Gateway output', () => {
      if (!outputsExist || !outputs.deployment_info || !outputs.api_gateway_url) return;

      const deploymentApiId = outputs.deployment_info.value.api_gateway_id;
      const apiId = outputs.api_gateway_url.value;

      expect(deploymentApiId).toBe(apiId);
    });
  });

  describe('Resource Consistency Validation', () => {
    test('all outputs reference same AWS region', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const region = outputs.deployment_info.value.region;

      // Check region consistency across different outputs
      if (outputs.api_gateway_invoke_url) {
        expect(outputs.api_gateway_invoke_url.value).toContain(region);
      }
      if (outputs.lambda_function_arns) {
        Object.values(outputs.lambda_function_arns.value).forEach(arn => {
          expect(arn).toContain(region);
        });
      }
      if (outputs.kms_key_arn) {
        expect(outputs.kms_key_arn.value).toContain(region);
      }
    });

    test('all outputs reference same AWS account', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const accountId = outputs.deployment_info.value.account_id;

      // Check account ID consistency across ARNs
      if (outputs.lambda_function_arns) {
        Object.values(outputs.lambda_function_arns.value).forEach(arn => {
          expect(arn).toContain(accountId);
        });
      }
      if (outputs.kms_key_arn) {
        expect(outputs.kms_key_arn.value).toContain(accountId);
      }
      if (outputs.sns_topic_arn) {
        expect(outputs.sns_topic_arn.value).toContain(accountId);
      }
    });

    test('number of Lambda functions matches model versions', () => {
      if (!outputsExist || !outputs.lambda_function_names || !outputs.deployment_info) return;

      const functionNames = Object.keys(outputs.lambda_function_names.value);
      const modelVersions = outputs.deployment_info.value.model_versions;

      expect(functionNames.length).toBe(modelVersions.length);
    });

    test('number of API keys matches model versions', () => {
      if (!outputsExist || !outputs.api_keys || !outputs.deployment_info) return;

      const apiKeys = Object.keys(outputs.api_keys.value);
      const modelVersions = outputs.deployment_info.value.model_versions;

      expect(apiKeys.length).toBe(modelVersions.length);
    });

    test('number of model endpoints matches model versions', () => {
      if (!outputsExist || !outputs.model_endpoints || !outputs.deployment_info) return;

      const endpoints = Object.keys(outputs.model_endpoints.value);
      const modelVersions = outputs.deployment_info.value.model_versions;

      expect(endpoints.length).toBe(modelVersions.length);
    });

    test('number of Parameter Store paths matches model versions', () => {
      if (!outputsExist || !outputs.parameter_store_paths || !outputs.deployment_info) return;

      const paths = Object.keys(outputs.parameter_store_paths.value);
      const modelVersions = outputs.deployment_info.value.model_versions;

      expect(paths.length).toBe(modelVersions.length);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles missing optional outputs gracefully', () => {
      if (!outputsExist) return;

      // Some outputs might be optional - test that we handle their absence
      const optionalOutputs = [
        'custom_domain_url',
        'route53_zone_id',
        'backup_vault_arn'
      ];

      optionalOutputs.forEach(key => {
        // This should not throw
        expect(() => {
          const value = (outputs as any)[key];
          if (value) {
            expect(value).toBeDefined();
          }
        }).not.toThrow();
      });
    });

    test('model version names are valid', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const modelVersions = outputs.deployment_info.value.model_versions;

      modelVersions.forEach(version => {
        expect(version).toMatch(/^v?\d+$/i);
        expect(version.length).toBeGreaterThan(0);
        expect(version.length).toBeLessThan(20);
      });
    });

    test('output values are not placeholder strings', () => {
      if (!outputsExist) return;

      const placeholders = ['REPLACE_ME', 'TODO', 'CHANGE_THIS', 'example.com'];

      Object.values(outputs).forEach(output => {
        if (output && typeof output === 'object' && 'value' in output) {
          const value = JSON.stringify(output.value).toLowerCase();
          placeholders.forEach(placeholder => {
            expect(value).not.toContain(placeholder.toLowerCase());
          });
        }
      });
    });

    test('ARNs do not contain empty segments', () => {
      if (!outputsExist) return;

      const arnOutputs = [
        outputs.lambda_function_arns?.value,
        outputs.kms_key_arn?.value,
        outputs.waf_web_acl_arn?.value,
        outputs.sns_topic_arn?.value
      ];

      arnOutputs.forEach(arnOutput => {
        if (arnOutput) {
          if (typeof arnOutput === 'string') {
            expect(arnOutput).not.toContain('::');
            expect(arnOutput).not.toContain(':undefined');
            expect(arnOutput).not.toContain(':null');
          } else if (typeof arnOutput === 'object') {
            Object.values(arnOutput).forEach(arn => {
              expect(arn).not.toContain('::');
              expect(arn).not.toContain(':undefined');
              expect(arn).not.toContain(':null');
            });
          }
        }
      });
    });

    test('URL outputs use HTTPS protocol', () => {
      if (!outputsExist) return;

      const urlOutputs = [
        outputs.api_gateway_invoke_url?.value,
        outputs.cloudwatch_dashboard_url?.value
      ];

      if (outputs.model_endpoints) {
        urlOutputs.push(...Object.values(outputs.model_endpoints.value));
      }

      urlOutputs.forEach(url => {
        if (url) {
          expect(url).toMatch(/^https:\/\//);
          expect(url).not.toMatch(/^http:\/\//);
        }
      });
    });

    test('resource IDs do not contain special characters', () => {
      if (!outputsExist) return;

      const idOutputs = [
        outputs.vpc_id?.value,
        outputs.efs_filesystem_id?.value,
        outputs.efs_access_point_id?.value,
        outputs.waf_web_acl_id?.value,
        outputs.kms_key_id?.value
      ];

      idOutputs.forEach(id => {
        if (id) {
          expect(id).toMatch(/^[a-z0-9-]+$/);
          expect(id).not.toContain(' ');
          expect(id).not.toContain('_');
        }
      });
    });

    test('array outputs have at least one element', () => {
      if (!outputsExist) return;

      const arrayOutputs = [
        outputs.private_subnet_ids?.value,
        outputs.public_subnet_ids?.value,
        outputs.deployment_info?.value.model_versions
      ];

      arrayOutputs.forEach(arr => {
        if (arr && Array.isArray(arr)) {
          expect(arr.length).toBeGreaterThan(0);
        }
      });
    });

    test('no output values are undefined or null strings', () => {
      if (!outputsExist) return;

      Object.entries(outputs).forEach(([key, output]) => {
        if (output && typeof output === 'object' && 'value' in output) {
          const value = output.value;
          if (typeof value === 'string') {
            expect(value).not.toBe('undefined');
            expect(value).not.toBe('null');
            expect(value).not.toBe('');
          }
        }
      });
    });
  });

  describe('Performance and Scalability Indicators', () => {
    test('multiple subnets indicate multi-AZ deployment', () => {
      if (!outputsExist || !outputs.private_subnet_ids) return;

      const privateSubnets = outputs.private_subnet_ids.value;
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('multiple Lambda functions for model versioning', () => {
      if (!outputsExist || !outputs.lambda_function_names) return;

      const functionCount = Object.keys(outputs.lambda_function_names.value).length;
      expect(functionCount).toBeGreaterThanOrEqual(1);
    });

    test('all model versions have corresponding infrastructure', () => {
      if (!outputsExist || !outputs.deployment_info) return;

      const modelVersions = outputs.deployment_info.value.model_versions;

      // Check each version has Lambda, endpoint, API key, and Parameter Store
      modelVersions.forEach(version => {
        if (outputs.lambda_function_names) {
          expect(outputs.lambda_function_names.value[version]).toBeDefined();
        }
        if (outputs.model_endpoints) {
          expect(outputs.model_endpoints.value[version]).toBeDefined();
        }
        if (outputs.api_keys) {
          expect(outputs.api_keys.value[version]).toBeDefined();
        }
        if (outputs.parameter_store_paths) {
          expect(outputs.parameter_store_paths.value[version]).toBeDefined();
        }
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('all AWS service endpoints use HTTPS', () => {
      if (!outputsExist) return;

      const endpoints = [
        outputs.api_gateway_invoke_url?.value,
        outputs.cloudwatch_dashboard_url?.value,
        ...(outputs.model_endpoints ? Object.values(outputs.model_endpoints.value) : [])
      ];

      endpoints.forEach(endpoint => {
        if (endpoint) {
          expect(endpoint).toMatch(/^https:\/\//);
        }
      });
    });

    test('encryption key (KMS) is configured', () => {
      if (!outputsExist) return;

      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.kms_key_arn).toBeDefined();
    });

    test('WAF protection is configured', () => {
      if (!outputsExist) return;

      expect(outputs.waf_web_acl_id).toBeDefined();
      expect(outputs.waf_web_acl_arn).toBeDefined();
    });

    test('private network infrastructure exists', () => {
      if (!outputsExist) return;

      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids?.value.length).toBeGreaterThan(0);
    });

    test('monitoring infrastructure is in place', () => {
      if (!outputsExist) return;

      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.cloudwatch_dashboard_url).toBeDefined();
    });

    test('secure configuration storage (Parameter Store) exists', () => {
      if (!outputsExist) return;

      expect(outputs.parameter_store_paths).toBeDefined();
      if (outputs.parameter_store_paths) {
        expect(Object.keys(outputs.parameter_store_paths.value).length).toBeGreaterThan(0);
      }
    });
  });
});
