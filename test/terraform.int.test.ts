import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.join(__dirname, '../lib');
  const testEnvironmentSuffix = `test-${Date.now()}`;
  const terraformVars = `environment_suffix=${testEnvironmentSuffix}`;
  let deploymentAttempted = false;
  let deploymentSuccessful = false;

  beforeAll(async () => {
    console.log(`Starting integration tests with environment suffix: ${testEnvironmentSuffix}`);
    
    // Initialize Terraform
    execSync('terraform init -reconfigure', {
      cwd: libDir,
      stdio: 'inherit'
    });
  }, 60000);

  afterAll(async () => {
    // Clean up resources if deployment was successful
    if (deploymentSuccessful) {
      console.log('Cleaning up test infrastructure...');
      try {
        execSync(`terraform destroy -auto-approve -var="${terraformVars}"`, {
          cwd: libDir,
          stdio: 'inherit'
        });
        console.log('Test infrastructure destroyed successfully');
      } catch (error) {
        console.error('Failed to destroy test infrastructure:', error);
      }
    }
  }, 300000);

  describe('Terraform Plan and Validation', () => {
    test('should create a valid execution plan', async () => {
      const planOutput = execSync(`terraform plan -var="${terraformVars}" -detailed-exitcode`, {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      expect(planOutput).toMatch(/Plan:/);
      expect(planOutput).not.toMatch(/Error:/);
      expect(planOutput).not.toMatch(/Warning.*deprecated/i);
    }, 120000);

    test('should validate resource dependencies', async () => {
      const planOutput = execSync(`terraform plan -var="${terraformVars}"`, {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      // Check for common dependency issues
      expect(planOutput).not.toMatch(/cycle/i);
      expect(planOutput).not.toMatch(/circular dependency/i);
      expect(planOutput).not.toMatch(/depends on.*itself/i);
    }, 120000);
  });

  describe('Infrastructure Deployment', () => {
    test('should deploy infrastructure successfully', async () => {
      deploymentAttempted = true;
      
      console.log('Deploying test infrastructure...');
      const deployOutput = execSync(`terraform apply -auto-approve -var="${terraformVars}"`, {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      expect(deployOutput).toMatch(/Apply complete!/);
      expect(deployOutput).not.toMatch(/Error:/);
      
      deploymentSuccessful = true;
      console.log('Infrastructure deployed successfully');
    }, 600000); // 10 minutes timeout for deployment

    test('should have all outputs available', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping output test - deployment was not successful');
        return;
      }

      const outputResult = execSync(`terraform output -json`, {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const outputs = JSON.parse(outputResult);
      
      // Verify expected outputs exist
      expect(outputs).toHaveProperty('vpc_id');
      expect(outputs).toHaveProperty('s3_bucket_name');
      expect(outputs).toHaveProperty('cloudfront_distribution_id');
      expect(outputs).toHaveProperty('security_group_id');
      
      console.log('All expected outputs are present');
    }, 60000);
  });

  describe('Security Validation', () => {
    test('should have secure S3 bucket configuration', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping S3 security test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const bucketName = outputs.s3_bucket_name.value;
      
      // Check bucket encryption
      const encryptionResult = execSync(`aws s3api get-bucket-encryption --bucket ${bucketName}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const encryption = JSON.parse(encryptionResult);
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      
      console.log('S3 bucket encryption validated');
    }, 60000);

    test('should have VPC Flow Logs enabled', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping VPC Flow Logs test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const vpcId = outputs.vpc_id.value;
      
      // Check flow logs
      const flowLogsResult = execSync(`aws ec2 describe-flow-logs --filter "Name=resource-id,Values=${vpcId}"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const flowLogs = JSON.parse(flowLogsResult);
      expect(flowLogs.FlowLogs).toHaveLength(1);
      expect(flowLogs.FlowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(flowLogs.FlowLogs[0].TrafficType).toBe('ALL');
      
      console.log('VPC Flow Logs validated');
    }, 60000);

    test('should have CloudFront distribution with WAF', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping CloudFront WAF test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const distributionId = outputs.cloudfront_distribution_id.value;
      
      // Check CloudFront configuration
      const cfResult = execSync(`aws cloudfront get-distribution --id ${distributionId}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const distribution = JSON.parse(cfResult);
      expect(distribution.Distribution.DistributionConfig.WebACLId).toBeDefined();
      expect(distribution.Distribution.DistributionConfig.WebACLId).not.toBe('');
      
      // Check HTTPS redirect
      const defaultCacheBehavior = distribution.Distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      
      console.log('CloudFront WAF configuration validated');
    }, 60000);

    test('should have security group with proper restrictions', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping security group test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const sgId = outputs.security_group_id.value;
      
      // Check security group rules
      const sgResult = execSync(`aws ec2 describe-security-groups --group-ids ${sgId}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const securityGroups = JSON.parse(sgResult);
      const sg = securityGroups.SecurityGroups[0];
      
      // Validate ingress rules - should only allow HTTP (80) and HTTPS (443)
      const ingressRules = sg.IpPermissions;
      const allowedPorts = [80, 443];
      
      ingressRules.forEach((rule: any) => {
        expect(allowedPorts).toContain(rule.FromPort);
        expect(allowedPorts).toContain(rule.ToPort);
        expect(rule.IpProtocol).toBe('tcp');
      });
      
      console.log('Security group rules validated');
    }, 60000);
  });

  describe('Resource State Validation', () => {
    test('should have all resources in terraform state', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping state test - deployment was not successful');
        return;
      }

      const stateList = execSync('terraform state list', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const resources = stateList.trim().split('\n');
      
      // Verify key resources are present
      const expectedResources = [
        'aws_vpc.',
        'aws_s3_bucket.',
        'aws_cloudfront_distribution.',
        'aws_security_group.',
        'aws_kms_key.',
        'aws_flow_log.',
        'aws_wafv2_web_acl.'
      ];

      expectedResources.forEach(expectedResource => {
        const found = resources.some(resource => resource.includes(expectedResource));
        expect(found).toBe(true);
      });
      
      console.log(`Terraform state contains ${resources.length} resources`);
    }, 60000);

    test('should not have any tainted resources', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping taint test - deployment was not successful');
        return;
      }

      const showOutput = execSync('terraform show -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });

      const state = JSON.parse(showOutput);
      
      if (state.values && state.values.root_module && state.values.root_module.resources) {
        const taintedResources = state.values.root_module.resources.filter(
          (resource: any) => resource.tainted === true
        );
        
        expect(taintedResources).toHaveLength(0);
        console.log('No tainted resources found');
      }
    }, 60000);
  });

  describe('Environment Isolation Validation', () => {
    test('should use environment suffix in resource names', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping environment isolation test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      // Check that S3 bucket name includes environment suffix
      const bucketName = outputs.s3_bucket_name.value;
      expect(bucketName).toContain(testEnvironmentSuffix);
      
      console.log(`Environment suffix ${testEnvironmentSuffix} properly used in resource names`);
    }, 60000);
  });

  describe('Compliance and Best Practices', () => {
    test('should have encrypted storage for all data stores', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping encryption test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const bucketName = outputs.s3_bucket_name.value;
      
      // Verify S3 encryption
      const bucketEncryption = execSync(`aws s3api get-bucket-encryption --bucket ${bucketName}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      expect(bucketEncryption).toContain('aws:kms');
      
      // Check CloudWatch log encryption (VPC Flow Logs)
      const logGroups = execSync('aws logs describe-log-groups', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const logGroupsData = JSON.parse(logGroups);
      const flowLogGroup = logGroupsData.logGroups.find((lg: any) => 
        lg.logGroupName.includes('flowlogs') && lg.logGroupName.includes(testEnvironmentSuffix)
      );
      
      if (flowLogGroup) {
        expect(flowLogGroup.kmsKeyId).toBeDefined();
      }
      
      console.log('Encryption validated for all data stores');
    }, 60000);

    test('should have proper access logging enabled', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping access logging test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const distributionId = outputs.cloudfront_distribution_id.value;
      
      // Check CloudFront access logging
      const cfConfig = execSync(`aws cloudfront get-distribution-config --id ${distributionId}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const distribution = JSON.parse(cfConfig);
      const loggingConfig = distribution.DistributionConfig.Logging;
      
      expect(loggingConfig.Enabled).toBe(true);
      expect(loggingConfig.Bucket).toBeDefined();
      
      console.log('Access logging validated');
    }, 60000);
  });

  describe('Performance and Reliability', () => {
    test('should have CloudFront distribution properly configured', async () => {
      if (!deploymentSuccessful) {
        console.log('Skipping CloudFront performance test - deployment was not successful');
        return;
      }

      const outputs = JSON.parse(execSync('terraform output -json', {
        cwd: libDir,
        stdio: 'pipe',
        encoding: 'utf8'
      }));

      const distributionId = outputs.cloudfront_distribution_id.value;
      
      const cfConfig = execSync(`aws cloudfront get-distribution --id ${distributionId}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const distribution = JSON.parse(cfConfig);
      const config = distribution.Distribution.DistributionConfig;
      
      // Verify caching is enabled
      expect(config.DefaultCacheBehavior.CachePolicyId).toBeDefined();
      
      // Verify compression is enabled
      expect(config.DefaultCacheBehavior.Compress).toBe(true);
      
      // Verify distribution is enabled
      expect(config.Enabled).toBe(true);
      
      console.log('CloudFront performance configuration validated');
    }, 60000);
  });
});
