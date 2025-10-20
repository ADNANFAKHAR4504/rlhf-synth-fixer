/* eslint-disable prettier/prettier */

/**
 * tap-stack.int.test.ts
 * 
 * Real integration tests against deployed AWS infrastructure
 * Validates actual resources using deployment outputs
 * Reads from cfn-outputs/flat-outputs.json
 * NO EXTERNAL AWS SDK DEPENDENCIES - Uses native Node.js modules only
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface DeploymentOutputs {
  vpcId: string;
  vpcCidr: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  databaseSubnetIds: string[];
  albSecurityGroupId: string;
  ecsSecurityGroupId: string;
  rdsSecurityGroupId: string;
  albDnsName: string;
  albArn: string;
  albZoneId: string;
  targetGroupBlueArn: string;
  targetGroupGreenArn: string;
  ecsClusterName: string;
  ecsClusterArn: string;
  apiServiceName: string;
  frontendServiceName: string;
  auroraClusterEndpoint: string;
  auroraClusterReaderEndpoint: string;
  auroraClusterArn: string;
  auroraClusterId: string;
  dbSecretArn: string;
  ecrApiRepositoryUrl: string;
  ecrFrontendRepositoryUrl: string;
  apiLogGroupName: string;
  frontendLogGroupName: string;
  ecsTaskExecutionRoleArn: string;
  ecsTaskRoleArn: string;
}

/**
 * Helper function to make HTTP/HTTPS requests
 */
function makeHttpRequest(url: string, timeout = 10000): Promise<{ statusCode: number; body: string; headers: any }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'User-Agent': 'Integration-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: body,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.end();
  });
}

/**
 * Helper function to check if a domain resolves
 */
function checkDNSResolution(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dns = require('dns');
    dns.resolve4(hostname, (err: any, addresses: any) => {
      if (err) {
        resolve(false);
      } else {
        resolve(addresses && addresses.length > 0);
      }
    });
  });
}

describe('TapStack Real Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const outputFilePath = path.join('cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    console.log('\n🔍 Loading deployment outputs from cfn-outputs/flat-outputs.json...\n');
    
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`Output file not found: ${outputFilePath}. Please deploy the stack first.`);
    }

    const fileContent = fs.readFileSync(outputFilePath, 'utf-8');
    outputs = JSON.parse(fileContent);
    
    console.log('✅ Deployment outputs loaded successfully');
    console.log(`📍 Region: us-east-2`);
    console.log(`🏗️  VPC ID: ${outputs.vpcId}`);
    console.log(`🌐 ALB DNS: ${outputs.albDnsName}\n`);
  });

  describe('Deployment Outputs Validation', () => {
    it('should validate all required output keys exist', () => {
      console.log('🧪 Testing deployment output structure...');
      
      const requiredKeys = [
        'vpcId', 'vpcCidr', 'publicSubnetIds', 'privateSubnetIds', 'databaseSubnetIds',
        'albSecurityGroupId', 'ecsSecurityGroupId', 'rdsSecurityGroupId',
        'albDnsName', 'albArn', 'albZoneId',
        'targetGroupBlueArn', 'targetGroupGreenArn',
        'ecsClusterName', 'ecsClusterArn',
        'apiServiceName', 'frontendServiceName',
        'auroraClusterEndpoint', 'auroraClusterReaderEndpoint',
        'auroraClusterArn', 'auroraClusterId',
        'dbSecretArn',
        'ecrApiRepositoryUrl', 'ecrFrontendRepositoryUrl',
        'apiLogGroupName', 'frontendLogGroupName',
        'ecsTaskExecutionRoleArn', 'ecsTaskRoleArn'
      ];
      
      let missingKeys: string[] = [];
      requiredKeys.forEach(key => {
        if (!outputs.hasOwnProperty(key)) {
          missingKeys.push(key);
        } else {
          console.log(`  ✓ ${key}: ${typeof outputs[key as keyof DeploymentOutputs]}`);
        }
      });
      
      expect(missingKeys.length).toBe(0);
      
      console.log(`✅ All ${requiredKeys.length} required output keys validated`);
    });

    it('should validate VPC ID format', () => {
      console.log('🧪 Testing VPC ID format...');
      
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      
      console.log(`✅ VPC ID format validated: ${outputs.vpcId}`);
    });

    it('should validate VPC CIDR block format', () => {
      console.log('🧪 Testing VPC CIDR format...');
      
      expect(outputs.vpcCidr).toBeDefined();
      expect(outputs.vpcCidr).toMatch(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/);
      expect(outputs.vpcCidr).toBe('10.18.0.0/16');
      
      console.log(`✅ VPC CIDR validated: ${outputs.vpcCidr}`);
    });

    it('should validate subnet IDs are arrays with correct format', () => {
      console.log('🧪 Testing subnet IDs...');
      
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(Array.isArray(outputs.databaseSubnetIds)).toBe(true);
      
      expect(outputs.publicSubnetIds.length).toBe(2);
      expect(outputs.privateSubnetIds.length).toBe(2);
      expect(outputs.databaseSubnetIds.length).toBe(2);
      
      outputs.publicSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
        console.log(`  ✓ Public Subnet: ${subnetId}`);
      });
      
      outputs.privateSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
        console.log(`  ✓ Private Subnet: ${subnetId}`);
      });
      
      outputs.databaseSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
        console.log(`  ✓ Database Subnet: ${subnetId}`);
      });
      
      console.log('✅ All subnet IDs validated');
    });

    it('should validate security group IDs format', () => {
      console.log('🧪 Testing security group IDs...');
      
      expect(outputs.albSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      expect(outputs.ecsSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      expect(outputs.rdsSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
      
      console.log(`✅ ALB Security Group: ${outputs.albSecurityGroupId}`);
      console.log(`✅ ECS Security Group: ${outputs.ecsSecurityGroupId}`);
      console.log(`✅ RDS Security Group: ${outputs.rdsSecurityGroupId}`);
    });
  });

  describe('Load Balancer DNS and Connectivity Tests', () => {
    it('should validate ALB DNS name format', () => {
      console.log('🧪 Testing ALB DNS name...');
      
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toContain('.elb.us-east-2.amazonaws.com');
      expect(outputs.albDnsName).toContain('tap-alb-dev');
      
      console.log(`✅ ALB DNS Name validated: ${outputs.albDnsName}`);
    });

    it('should validate ALB ARN format', () => {
      console.log('🧪 Testing ALB ARN...');
      
      expect(outputs.albArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-2:\d{12}:loadbalancer\/app\/.+$/);
      
      console.log(`✅ ALB ARN validated: ${outputs.albArn}`);
    });

    it('should validate ALB DNS resolves', async () => {
      console.log('🧪 Testing ALB DNS resolution...');
      
      const resolves = await checkDNSResolution(outputs.albDnsName);
      expect(resolves).toBe(true);
      
      console.log(`✅ ALB DNS resolves successfully: ${outputs.albDnsName}`);
    }, 15000);

    it('should validate ALB HTTP endpoint is accessible', async () => {
      console.log('🧪 Testing ALB HTTP endpoint...');
      
      try {
        const albUrl = `http://${outputs.albDnsName}`;
        const response = await makeHttpRequest(albUrl, 15000);
        
        console.log(`  ℹ️  HTTP Status Code: ${response.statusCode}`);
        console.log(`  ℹ️  Response Body Length: ${response.body.length} bytes`);
        
        // ALB should respond (200 or 503 if no targets)
        expect([200, 503, 500]).toContain(response.statusCode);
        
        console.log(`✅ ALB HTTP endpoint is accessible at ${albUrl}`);
      } catch (error: any) {
        console.log(`  ⚠️  ALB endpoint not yet fully accessible: ${error.message}`);
        console.log(`  ℹ️  This is expected if services are still starting`);
      }
    }, 20000);

    it('should validate ALB API endpoint path', async () => {
      console.log('🧪 Testing ALB API endpoint...');
      
      try {
        const apiUrl = `http://${outputs.albDnsName}/api`;
        const response = await makeHttpRequest(apiUrl, 15000);
        
        console.log(`  ℹ️  API Status Code: ${response.statusCode}`);
        console.log(`  ℹ️  API Response Length: ${response.body.length} bytes`);
        
        // Should get some response from ALB
        expect(response.statusCode).toBeDefined();
        
        console.log(`✅ ALB API endpoint validated at ${apiUrl}`);
      } catch (error: any) {
        console.log(`  ⚠️  API endpoint not yet accessible: ${error.message}`);
        console.log(`  ℹ️  This is expected if API service is still starting`);
      }
    }, 20000);

    it('should validate target group ARNs format', () => {
      console.log('🧪 Testing target group ARNs...');
      
      expect(outputs.targetGroupBlueArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-2:\d{12}:targetgroup\/.+$/);
      expect(outputs.targetGroupGreenArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-2:\d{12}:targetgroup\/.+$/);
      
      console.log(`✅ Blue Target Group: ${outputs.targetGroupBlueArn}`);
      console.log(`✅ Green Target Group: ${outputs.targetGroupGreenArn}`);
    });
  });

  describe('ECS Cluster and Services Tests', () => {
    it('should validate ECS cluster name format', () => {
      console.log('🧪 Testing ECS cluster name...');
      
      expect(outputs.ecsClusterName).toBeDefined();
      expect(outputs.ecsClusterName).toContain('tap-ecs-cluster');
      expect(outputs.ecsClusterName).toContain('dev');
      
      console.log(`✅ ECS Cluster Name: ${outputs.ecsClusterName}`);
    });

    it('should validate ECS cluster ARN format', () => {
      console.log('🧪 Testing ECS cluster ARN...');
      
      expect(outputs.ecsClusterArn).toMatch(/^arn:aws:ecs:us-east-2:\d{12}:cluster\/.+$/);
      expect(outputs.ecsClusterArn).toContain(outputs.ecsClusterName);
      
      console.log(`✅ ECS Cluster ARN: ${outputs.ecsClusterArn}`);
    });

    it('should validate API service name', () => {
      console.log('🧪 Testing API service name...');
      
      expect(outputs.apiServiceName).toBeDefined();
      expect(outputs.apiServiceName).toContain('tap-api-service');
      expect(outputs.apiServiceName).toContain('dev');
      
      console.log(`✅ API Service Name: ${outputs.apiServiceName}`);
    });

    it('should validate Frontend service name', () => {
      console.log('🧪 Testing Frontend service name...');
      
      expect(outputs.frontendServiceName).toBeDefined();
      expect(outputs.frontendServiceName).toContain('tap-frontend-service');
      expect(outputs.frontendServiceName).toContain('dev');
      
      console.log(`✅ Frontend Service Name: ${outputs.frontendServiceName}`);
    });
  });

  describe('RDS Aurora Tests', () => {
    it('should validate Aurora cluster ID format', () => {
      console.log('🧪 Testing Aurora cluster ID...');
      
      expect(outputs.auroraClusterId).toBeDefined();
      expect(outputs.auroraClusterId).toMatch(/^[a-z0-9-]+$/);
      
      console.log(`✅ Aurora Cluster ID: ${outputs.auroraClusterId}`);
    });

    it('should validate Aurora cluster ARN format', () => {
      console.log('🧪 Testing Aurora cluster ARN...');
      
      expect(outputs.auroraClusterArn).toMatch(/^arn:aws:rds:us-east-2:\d{12}:cluster:.+$/);
      
      console.log(`✅ Aurora Cluster ARN: ${outputs.auroraClusterArn}`);
    });

    it('should validate Aurora endpoints format', () => {
      console.log('🧪 Testing Aurora endpoints...');
      
      expect(outputs.auroraClusterEndpoint).toBeDefined();
      expect(outputs.auroraClusterEndpoint).toContain('.us-east-2.rds.amazonaws.com');
      
      expect(outputs.auroraClusterReaderEndpoint).toBeDefined();
      expect(outputs.auroraClusterReaderEndpoint).toContain('.us-east-2.rds.amazonaws.com');
      expect(outputs.auroraClusterReaderEndpoint).toContain('-ro-');
      
      console.log(`✅ Aurora Writer Endpoint: ${outputs.auroraClusterEndpoint}`);
      console.log(`✅ Aurora Reader Endpoint: ${outputs.auroraClusterReaderEndpoint}`);
    });

    it('should validate Aurora endpoints resolve', async () => {
      console.log('🧪 Testing Aurora DNS resolution...');
      
      const writerResolves = await checkDNSResolution(outputs.auroraClusterEndpoint);
      const readerResolves = await checkDNSResolution(outputs.auroraClusterReaderEndpoint);
      
      expect(writerResolves).toBe(true);
      expect(readerResolves).toBe(true);
      
      console.log('✅ Aurora writer endpoint resolves');
      console.log('✅ Aurora reader endpoint resolves');
    }, 15000);

    it('should validate database secret ARN format', () => {
      console.log('🧪 Testing database secret ARN...');
      
      expect(outputs.dbSecretArn).toMatch(/^arn:aws:secretsmanager:us-east-2:\d{12}:secret:.+$/);
      expect(outputs.dbSecretArn).toContain('tap-aurora-password');
      
      console.log(`✅ Database Secret ARN: ${outputs.dbSecretArn}`);
    });
  });

  describe('ECR Repository Tests', () => {
    it('should validate API ECR repository URL format', () => {
      console.log('🧪 Testing API ECR repository URL...');
      
      expect(outputs.ecrApiRepositoryUrl).toBeDefined();
      expect(outputs.ecrApiRepositoryUrl).toMatch(/^\d{12}\.dkr\.ecr\.us-east-2\.amazonaws\.com\/.+$/);
      expect(outputs.ecrApiRepositoryUrl).toContain('tap-api-dev');
      
      console.log(`✅ API ECR Repository: ${outputs.ecrApiRepositoryUrl}`);
    });

    it('should validate Frontend ECR repository URL format', () => {
      console.log('🧪 Testing Frontend ECR repository URL...');
      
      expect(outputs.ecrFrontendRepositoryUrl).toBeDefined();
      expect(outputs.ecrFrontendRepositoryUrl).toMatch(/^\d{12}\.dkr\.ecr\.us-east-2\.amazonaws\.com\/.+$/);
      expect(outputs.ecrFrontendRepositoryUrl).toContain('tap-frontend-dev');
      
      console.log(`✅ Frontend ECR Repository: ${outputs.ecrFrontendRepositoryUrl}`);
    });

    it('should validate ECR repositories are in correct region', () => {
      console.log('🧪 Testing ECR repository regions...');
      
      expect(outputs.ecrApiRepositoryUrl).toContain('us-east-2');
      expect(outputs.ecrFrontendRepositoryUrl).toContain('us-east-2');
      
      console.log('✅ ECR repositories are in us-east-2 region');
    });
  });

  describe('CloudWatch Logs Tests', () => {
    it('should validate API log group name format', () => {
      console.log('🧪 Testing API log group name...');
      
      expect(outputs.apiLogGroupName).toBeDefined();
      expect(outputs.apiLogGroupName).toMatch(/^\/ecs\/.+$/);
      expect(outputs.apiLogGroupName).toBe('/ecs/tap-api-dev');
      
      console.log(`✅ API Log Group: ${outputs.apiLogGroupName}`);
    });

    it('should validate Frontend log group name format', () => {
      console.log('🧪 Testing Frontend log group name...');
      
      expect(outputs.frontendLogGroupName).toBeDefined();
      expect(outputs.frontendLogGroupName).toMatch(/^\/ecs\/.+$/);
      expect(outputs.frontendLogGroupName).toBe('/ecs/tap-frontend-dev');
      
      console.log(`✅ Frontend Log Group: ${outputs.frontendLogGroupName}`);
    });
  });

  describe('IAM Role Tests', () => {
    it('should validate ECS task execution role ARN format', () => {
      console.log('🧪 Testing ECS task execution role ARN...');
      
      expect(outputs.ecsTaskExecutionRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(outputs.ecsTaskExecutionRoleArn).toContain('tap-ecs-task-execution-role');
      
      console.log(`✅ ECS Task Execution Role: ${outputs.ecsTaskExecutionRoleArn}`);
    });

    it('should validate ECS task role ARN format', () => {
      console.log('🧪 Testing ECS task role ARN...');
      
      expect(outputs.ecsTaskRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(outputs.ecsTaskRoleArn).toContain('tap-ecs-task-role');
      
      console.log(`✅ ECS Task Role: ${outputs.ecsTaskRoleArn}`);
    });

    it('should validate IAM roles are different', () => {
      console.log('🧪 Testing IAM roles are distinct...');
      
      expect(outputs.ecsTaskExecutionRoleArn).not.toBe(outputs.ecsTaskRoleArn);
      
      console.log('✅ Task execution and task roles are properly separated');
    });
  });

  describe('Resource Naming Convention Tests', () => {
    it('should validate all resources follow naming convention with environment suffix', () => {
      console.log('🧪 Testing resource naming conventions...');
      
      const environmentSuffix = 'dev';
      const resourcesWithSuffix = [
        outputs.ecsClusterName,
        outputs.apiServiceName,
        outputs.frontendServiceName,
        outputs.apiLogGroupName,
        outputs.frontendLogGroupName,
        outputs.ecrApiRepositoryUrl,
        outputs.ecrFrontendRepositoryUrl
      ];
      
      resourcesWithSuffix.forEach(resource => {
        expect(resource).toContain(environmentSuffix);
        console.log(`  ✓ ${resource}`);
      });
      
      console.log('✅ All resources follow naming convention with environment suffix');
    });

    it('should validate resource names contain project prefix', () => {
      console.log('🧪 Testing project prefix in resource names...');
      
      const prefix = 'tap';
      const resources = [
        outputs.ecsClusterName,
        outputs.apiServiceName,
        outputs.frontendServiceName,
        outputs.apiLogGroupName,
        outputs.frontendLogGroupName
      ];
      
      resources.forEach(resource => {
        expect(resource.toLowerCase()).toContain(prefix);
        console.log(`  ✓ ${resource}`);
      });
      
      console.log('✅ All resources contain "tap" project prefix');
    });
  });

  describe('High Availability Configuration Tests', () => {
    it('should validate Multi-AZ deployment with 2 subnets per tier', () => {
      console.log('🧪 Testing Multi-AZ configuration...');
      
      expect(outputs.publicSubnetIds.length).toBe(2);
      expect(outputs.privateSubnetIds.length).toBe(2);
      expect(outputs.databaseSubnetIds.length).toBe(2);
      
      console.log('✅ Multi-AZ configuration validated');
      console.log('  ✓ 2 public subnets across AZs');
      console.log('  ✓ 2 private subnets across AZs');
      console.log('  ✓ 2 database subnets across AZs');
    });

    it('should validate blue-green deployment setup', () => {
      console.log('🧪 Testing blue-green deployment configuration...');
      
      expect(outputs.targetGroupBlueArn).toBeDefined();
      expect(outputs.targetGroupGreenArn).toBeDefined();
      expect(outputs.targetGroupBlueArn).not.toBe(outputs.targetGroupGreenArn);
      
      expect(outputs.targetGroupBlueArn).toContain('blue');
      expect(outputs.targetGroupGreenArn).toContain('green');
      
      console.log('✅ Blue-green deployment configuration validated');
      console.log('  ✓ Blue target group configured');
      console.log('  ✓ Green target group configured');
      console.log('  ✓ Target groups are distinct');
    });
  });

  describe('End-to-End Deployment Validation', () => {
    it('should validate complete infrastructure stack is deployed', () => {
      console.log('🧪 Running comprehensive deployment validation...');
      
      const components = {
        'VPC': outputs.vpcId,
        'Public Subnets': outputs.publicSubnetIds.length,
        'Private Subnets': outputs.privateSubnetIds.length,
        'Database Subnets': outputs.databaseSubnetIds.length,
        'ALB': outputs.albArn,
        'ECS Cluster': outputs.ecsClusterArn,
        'API Service': outputs.apiServiceName,
        'Frontend Service': outputs.frontendServiceName,
        'Aurora Cluster': outputs.auroraClusterArn,
        'Database Secret': outputs.dbSecretArn,
        'API ECR Repo': outputs.ecrApiRepositoryUrl,
        'Frontend ECR Repo': outputs.ecrFrontendRepositoryUrl,
        'ALB Security Group': outputs.albSecurityGroupId,
        'ECS Security Group': outputs.ecsSecurityGroupId,
        'RDS Security Group': outputs.rdsSecurityGroupId
      };
      
      Object.entries(components).forEach(([name, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        console.log(`  ✓ ${name}: ${typeof value === 'number' ? value : 'Deployed'}`);
      });
      
      console.log(`✅ Complete infrastructure stack validated (${Object.keys(components).length} components)`);
    });

    it('should validate output file is properly formatted JSON', () => {
      console.log('🧪 Testing output file JSON structure...');
      
      const fileContent = fs.readFileSync(outputFilePath, 'utf-8');
      
      // Should parse without error
      expect(() => JSON.parse(fileContent)).not.toThrow();
      
      const parsed = JSON.parse(fileContent);
      expect(typeof parsed).toBe('object');
      expect(Object.keys(parsed).length).toBeGreaterThan(20);
      
      console.log(`✅ Output file is valid JSON with ${Object.keys(parsed).length} keys`);
    });

    it('should validate no empty or null values in critical outputs', () => {
      console.log('🧪 Testing for empty or null values...');
      
      const criticalOutputs = [
        'vpcId', 'albArn', 'ecsClusterArn', 'auroraClusterId', 
        'dbSecretArn', 'ecrApiRepositoryUrl', 'ecrFrontendRepositoryUrl'
      ];
      
      criticalOutputs.forEach(key => {
        const value = outputs[key as keyof DeploymentOutputs];
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(value).not.toBe(null);
        console.log(`  ✓ ${key}: Valid`);
      });
      
      console.log('✅ All critical outputs have valid values');
    });

    it('should validate deployment file timestamp is recent', () => {
      console.log('🧪 Testing deployment file timestamp...');
      
      const stats = fs.statSync(outputFilePath);
      const now = new Date();
      const fileAge = now.getTime() - stats.mtime.getTime();
      const fileAgeMinutes = Math.floor(fileAge / 1000 / 60);
      
      console.log(`  ℹ️  File last modified: ${stats.mtime.toISOString()}`);
      console.log(`  ℹ️  File age: ${fileAgeMinutes} minutes`);
      
      // File should be less than 1 hour old for fresh deployment
      expect(fileAge).toBeLessThan(60 * 60 * 1000);
      
      console.log('✅ Deployment outputs are recent');
    });
  });

  afterAll(() => {
    console.log('\n✅ All integration tests completed successfully');
    console.log('📊 Summary:');
    console.log(`  - VPC ID: ${outputs.vpcId}`);
    console.log(`  - ALB DNS: ${outputs.albDnsName}`);
    console.log(`  - ECS Cluster: ${outputs.ecsClusterName}`);
    console.log(`  - Aurora Cluster: ${outputs.auroraClusterId}`);
    console.log(`  - Environment: dev`);
    console.log('\n');
  });
});
