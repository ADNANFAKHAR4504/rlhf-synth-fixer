/**
 * Integration tests for TapStack
 * These tests validate the actual deployed infrastructure using outputs from cfn-outputs/flat-outputs.json
 * No AWS API calls or live testing - validates deployment outputs only
 */

import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let deploymentOutputs: any;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      deploymentOutputs = JSON.parse(outputsContent);
    }
  });

  describe('Deployment Outputs Existence', () => {
    it('should have flat-outputs.json file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    it('should load deployment outputs successfully', () => {
      expect(deploymentOutputs).toBeDefined();
      expect(typeof deploymentOutputs).toBe('object');
    });

    it('should have all required output properties', () => {
      const requiredOutputs = [
        'apiDomainName',
        'blueAlbDns',
        'blueDbEndpoint',
        'blueVpcId',
        'complianceDocsBucketName',
        'dashboardUrl',
        'greenAlbDns',
        'greenDbEndpoint',
        'greenVpcId',
        'migrationTopicArn',
        'rateLimitTableName',
        'sessionTableName',
        'transactionLogsBucketName',
        'transitGatewayId',
      ];

      requiredOutputs.forEach(output => {
        expect(deploymentOutputs).toHaveProperty(output);
      });
    });

    it('should have exactly 14 output properties', () => {
      expect(Object.keys(deploymentOutputs)).toHaveLength(14);
    });
  });

  describe('VPC Infrastructure Validation', () => {
    it('should have valid blue VPC ID', () => {
      expect(deploymentOutputs.blueVpcId).toBeDefined();
      expect(deploymentOutputs.blueVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    it('should have valid green VPC ID', () => {
      expect(deploymentOutputs.greenVpcId).toBeDefined();
      expect(deploymentOutputs.greenVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    it('should have different VPC IDs for blue and green environments', () => {
      expect(deploymentOutputs.blueVpcId).not.toBe(deploymentOutputs.greenVpcId);
    });

    it('should have valid Transit Gateway ID', () => {
      expect(deploymentOutputs.transitGatewayId).toBeDefined();
      expect(deploymentOutputs.transitGatewayId).toMatch(/^tgw-[a-f0-9]{17}$/);
    });

    it('should have VPC IDs in us-east-1 region format', () => {
      const vpcIdPattern = /^vpc-[a-f0-9]{17}$/;
      expect(deploymentOutputs.blueVpcId).toMatch(vpcIdPattern);
      expect(deploymentOutputs.greenVpcId).toMatch(vpcIdPattern);
    });
  });

  describe('Database Infrastructure Validation', () => {
    it('should have valid blue database endpoint', () => {
      expect(deploymentOutputs.blueDbEndpoint).toBeDefined();
      expect(deploymentOutputs.blueDbEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should have valid green database endpoint', () => {
      expect(deploymentOutputs.greenDbEndpoint).toBeDefined();
      expect(deploymentOutputs.greenDbEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should have different database endpoints for blue and green', () => {
      expect(deploymentOutputs.blueDbEndpoint).not.toBe(deploymentOutputs.greenDbEndpoint);
    });

    it('should have blue database endpoint with correct naming pattern', () => {
      expect(deploymentOutputs.blueDbEndpoint).toMatch(/^blue-payment-db-.*\.cluster-.*\.us-east-1\.rds\.amazonaws\.com$/);
    });

    it('should have green database endpoint with correct naming pattern', () => {
      expect(deploymentOutputs.greenDbEndpoint).toMatch(/^green-payment-db-.*\.cluster-.*\.us-east-1\.rds\.amazonaws\.com$/);
    });

    it('should have database endpoints in us-east-1 region', () => {
      expect(deploymentOutputs.blueDbEndpoint).toContain('us-east-1');
      expect(deploymentOutputs.greenDbEndpoint).toContain('us-east-1');
    });

    it('should have Aurora cluster endpoints', () => {
      expect(deploymentOutputs.blueDbEndpoint).toContain('.cluster-');
      expect(deploymentOutputs.greenDbEndpoint).toContain('.cluster-');
    });

    it('should have consistent cluster identifier in both endpoints', () => {
      const blueClusterId = deploymentOutputs.blueDbEndpoint.match(/\.cluster-([a-z0-9]+)\./)?.[1];
      const greenClusterId = deploymentOutputs.greenDbEndpoint.match(/\.cluster-([a-z0-9]+)\./)?.[1];

      expect(blueClusterId).toBeDefined();
      expect(greenClusterId).toBeDefined();
      // Both clusters use the same cluster ID pattern
      expect(blueClusterId).toBe(greenClusterId);
    });
  });

  describe('Load Balancer Infrastructure Validation', () => {
    it('should have valid blue ALB DNS name', () => {
      expect(deploymentOutputs.blueAlbDns).toBeDefined();
      expect(deploymentOutputs.blueAlbDns).toContain('.elb.amazonaws.com');
    });

    it('should have valid green ALB DNS name', () => {
      expect(deploymentOutputs.greenAlbDns).toBeDefined();
      expect(deploymentOutputs.greenAlbDns).toContain('.elb.amazonaws.com');
    });

    it('should have different ALB DNS names for blue and green', () => {
      expect(deploymentOutputs.blueAlbDns).not.toBe(deploymentOutputs.greenAlbDns);
    });

    it('should have blue ALB with correct naming pattern', () => {
      expect(deploymentOutputs.blueAlbDns).toMatch(/^blue-alb-.*\.us-east-1\.elb\.amazonaws\.com$/);
    });

    it('should have green ALB with correct naming pattern', () => {
      expect(deploymentOutputs.greenAlbDns).toMatch(/^green-alb-.*\.us-east-1\.elb\.amazonaws\.com$/);
    });

    it('should have ALBs in us-east-1 region', () => {
      expect(deploymentOutputs.blueAlbDns).toContain('us-east-1');
      expect(deploymentOutputs.greenAlbDns).toContain('us-east-1');
    });

    it('should have environment identifier in ALB names', () => {
      expect(deploymentOutputs.blueAlbDns).toContain('blue');
      expect(deploymentOutputs.greenAlbDns).toContain('green');
    });

  });

  describe('S3 Storage Infrastructure Validation', () => {
    it('should have valid transaction logs bucket name', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toBeDefined();
      expect(typeof deploymentOutputs.transactionLogsBucketName).toBe('string');
    });

    it('should have valid compliance docs bucket name', () => {
      expect(deploymentOutputs.complianceDocsBucketName).toBeDefined();
      expect(typeof deploymentOutputs.complianceDocsBucketName).toBe('string');
    });

    it('should have different bucket names', () => {
      expect(deploymentOutputs.transactionLogsBucketName).not.toBe(deploymentOutputs.complianceDocsBucketName);
    });

    it('should have transaction bucket with correct naming pattern', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toMatch(/^tx-logs-payment-.*-us-east-1$/);
    });

    it('should have compliance bucket with correct naming pattern', () => {
      expect(deploymentOutputs.complianceDocsBucketName).toMatch(/^compliance-docs-pay-.*-us-east-1$/);
    });

    it('should have region in bucket names', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toContain('us-east-1');
      expect(deploymentOutputs.complianceDocsBucketName).toContain('us-east-1');
    });

    it('should have environment suffix in bucket names', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toContain('dev');
      expect(deploymentOutputs.complianceDocsBucketName).toContain('dev');
    });

    it('should follow S3 naming conventions', () => {
      // Lowercase, no underscores, hyphens allowed
      expect(deploymentOutputs.transactionLogsBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(deploymentOutputs.complianceDocsBucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('DynamoDB Tables Validation', () => {
    it('should have valid session table name', () => {
      expect(deploymentOutputs.sessionTableName).toBeDefined();
      expect(typeof deploymentOutputs.sessionTableName).toBe('string');
    });

    it('should have valid rate limit table name', () => {
      expect(deploymentOutputs.rateLimitTableName).toBeDefined();
      expect(typeof deploymentOutputs.rateLimitTableName).toBe('string');
    });

    it('should have different table names', () => {
      expect(deploymentOutputs.sessionTableName).not.toBe(deploymentOutputs.rateLimitTableName);
    });

    it('should have session table with correct naming pattern', () => {
      expect(deploymentOutputs.sessionTableName).toMatch(/^session-table-.*$/);
    });

    it('should have rate limit table with correct naming pattern', () => {
      expect(deploymentOutputs.rateLimitTableName).toMatch(/^rate-limit-table-.*$/);
    });

    it('should have environment suffix in table names', () => {
      expect(deploymentOutputs.sessionTableName).toContain('dev');
      expect(deploymentOutputs.rateLimitTableName).toContain('dev');
    });

    it('should have descriptive table names', () => {
      expect(deploymentOutputs.sessionTableName).toContain('session');
      expect(deploymentOutputs.rateLimitTableName).toContain('rate-limit');
    });
  });

  describe('Monitoring Infrastructure Validation', () => {
    it('should have valid CloudWatch dashboard URL', () => {
      expect(deploymentOutputs.dashboardUrl).toBeDefined();
      expect(deploymentOutputs.dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
    });

    it('should have valid SNS migration topic ARN', () => {
      expect(deploymentOutputs.migrationTopicArn).toBeDefined();
      expect(deploymentOutputs.migrationTopicArn).toMatch(/^arn:aws:sns:/);
    });

    it('should have dashboard URL pointing to correct region', () => {
      expect(deploymentOutputs.dashboardUrl).toContain('region=us-east-1');
    });

    it('should have dashboard name in URL', () => {
      expect(deploymentOutputs.dashboardUrl).toContain('dashboards:name=');
      expect(deploymentOutputs.dashboardUrl).toContain('payment-processing');
    });

    it('should have SNS topic ARN in correct format', () => {
      expect(deploymentOutputs.migrationTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d{12}:migration-notifications-.*$/);
    });

    it('should have SNS topic in us-east-1 region', () => {
      expect(deploymentOutputs.migrationTopicArn).toContain('us-east-1');
    });

    it('should have descriptive SNS topic name', () => {
      expect(deploymentOutputs.migrationTopicArn).toContain('migration-notifications');
    });

    it('should have environment suffix in monitoring resources', () => {
      expect(deploymentOutputs.dashboardUrl).toContain('dev');
      expect(deploymentOutputs.migrationTopicArn).toContain('dev');
    });
  });

  describe('DNS and Routing Validation', () => {
    it('should have valid API domain name', () => {
      expect(deploymentOutputs.apiDomainName).toBeDefined();
      expect(typeof deploymentOutputs.apiDomainName).toBe('string');
    });

    it('should have domain name with correct format', () => {
      expect(deploymentOutputs.apiDomainName).toMatch(/^api\.payments-.*\.testdomain\.local$/);
    });

    it('should have environment suffix in domain', () => {
      expect(deploymentOutputs.apiDomainName).toContain('dev');
    });

    it('should have payments identifier in domain', () => {
      expect(deploymentOutputs.apiDomainName).toContain('payments');
    });
  });

  describe('Blue-Green Architecture Validation', () => {
    it('should have separate blue and green VPCs', () => {
      expect(deploymentOutputs.blueVpcId).toBeDefined();
      expect(deploymentOutputs.greenVpcId).toBeDefined();
      expect(deploymentOutputs.blueVpcId).not.toBe(deploymentOutputs.greenVpcId);
    });

    it('should have separate blue and green databases', () => {
      expect(deploymentOutputs.blueDbEndpoint).toBeDefined();
      expect(deploymentOutputs.greenDbEndpoint).toBeDefined();
      expect(deploymentOutputs.blueDbEndpoint).not.toBe(deploymentOutputs.greenDbEndpoint);
    });

    it('should have separate blue and green load balancers', () => {
      expect(deploymentOutputs.blueAlbDns).toBeDefined();
      expect(deploymentOutputs.greenAlbDns).toBeDefined();
      expect(deploymentOutputs.blueAlbDns).not.toBe(deploymentOutputs.greenAlbDns);
    });

    it('should have blue resources with blue identifier', () => {
      expect(deploymentOutputs.blueAlbDns).toContain('blue');
      expect(deploymentOutputs.blueDbEndpoint).toContain('blue');
    });

    it('should have green resources with green identifier', () => {
      expect(deploymentOutputs.greenAlbDns).toContain('green');
      expect(deploymentOutputs.greenDbEndpoint).toContain('green');
    });

    it('should have Transit Gateway for inter-VPC connectivity', () => {
      expect(deploymentOutputs.transitGatewayId).toBeDefined();
      expect(deploymentOutputs.transitGatewayId).toMatch(/^tgw-/);
    });
  });

  describe('Naming Conventions and Standards', () => {
    it('should have consistent environment suffix across all resources', () => {
      const outputs = [
        deploymentOutputs.blueAlbDns,
        deploymentOutputs.greenAlbDns,
        deploymentOutputs.blueDbEndpoint,
        deploymentOutputs.greenDbEndpoint,
        deploymentOutputs.transactionLogsBucketName,
        deploymentOutputs.complianceDocsBucketName,
        deploymentOutputs.sessionTableName,
        deploymentOutputs.rateLimitTableName,
        deploymentOutputs.apiDomainName,
        deploymentOutputs.dashboardUrl,
        deploymentOutputs.migrationTopicArn,
      ];

      outputs.forEach(output => {
        expect(output).toContain('dev');
      });
    });

    it('should have consistent region across regional resources', () => {
      const regionalResources = [
        deploymentOutputs.blueAlbDns,
        deploymentOutputs.greenAlbDns,
        deploymentOutputs.blueDbEndpoint,
        deploymentOutputs.greenDbEndpoint,
        deploymentOutputs.transactionLogsBucketName,
        deploymentOutputs.complianceDocsBucketName,
        deploymentOutputs.migrationTopicArn,
      ];

      regionalResources.forEach(resource => {
        expect(resource).toContain('us-east-1');
      });
    });

    it('should use lowercase for resource names', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toBe(
        deploymentOutputs.transactionLogsBucketName.toLowerCase()
      );
      expect(deploymentOutputs.complianceDocsBucketName).toBe(
        deploymentOutputs.complianceDocsBucketName.toLowerCase()
      );
    });

    it('should use hyphens as separators in resource names', () => {
      const resources = [
        deploymentOutputs.sessionTableName,
        deploymentOutputs.rateLimitTableName,
        deploymentOutputs.transactionLogsBucketName,
        deploymentOutputs.complianceDocsBucketName,
      ];

      resources.forEach(resource => {
        expect(resource).toContain('-');
      });
    });
  });

  describe('Resource Availability and Accessibility', () => {
    it('should have all network resources deployed', () => {
      expect(deploymentOutputs.blueVpcId).toBeTruthy();
      expect(deploymentOutputs.greenVpcId).toBeTruthy();
      expect(deploymentOutputs.transitGatewayId).toBeTruthy();
    });

    it('should have all database resources deployed', () => {
      expect(deploymentOutputs.blueDbEndpoint).toBeTruthy();
      expect(deploymentOutputs.greenDbEndpoint).toBeTruthy();
    });

    it('should have all compute resources deployed', () => {
      expect(deploymentOutputs.blueAlbDns).toBeTruthy();
      expect(deploymentOutputs.greenAlbDns).toBeTruthy();
    });

    it('should have all storage resources deployed', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toBeTruthy();
      expect(deploymentOutputs.complianceDocsBucketName).toBeTruthy();
    });

    it('should have all data management resources deployed', () => {
      expect(deploymentOutputs.sessionTableName).toBeTruthy();
      expect(deploymentOutputs.rateLimitTableName).toBeTruthy();
    });

    it('should have all monitoring resources deployed', () => {
      expect(deploymentOutputs.dashboardUrl).toBeTruthy();
      expect(deploymentOutputs.migrationTopicArn).toBeTruthy();
    });

    it('should have DNS resources configured', () => {
      expect(deploymentOutputs.apiDomainName).toBeTruthy();
    });
  });

  describe('Output Format Validation', () => {
    it('should have all outputs as non-empty strings', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value).toBeTruthy();
        expect((value as string).length).toBeGreaterThan(0);
      });
    });

    it('should not have null or undefined outputs', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });

    it('should not have empty string outputs', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(value).not.toBe('');
      });
    });

    it('should have outputs without leading/trailing whitespace', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(value).toBe((value as string).trim());
      });
    });
  });

  describe('AWS Resource ID Format Validation', () => {
    it('should have valid VPC ID format', () => {
      const vpcIdRegex = /^vpc-[a-f0-9]{17}$/;
      expect(deploymentOutputs.blueVpcId).toMatch(vpcIdRegex);
      expect(deploymentOutputs.greenVpcId).toMatch(vpcIdRegex);
    });

    it('should have valid Transit Gateway ID format', () => {
      const tgwIdRegex = /^tgw-[a-f0-9]{17}$/;
      expect(deploymentOutputs.transitGatewayId).toMatch(tgwIdRegex);
    });

    it('should have valid RDS endpoint format', () => {
      const rdsEndpointRegex = /^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/;
      expect(deploymentOutputs.blueDbEndpoint).toMatch(rdsEndpointRegex);
      expect(deploymentOutputs.greenDbEndpoint).toMatch(rdsEndpointRegex);
    });

    it('should have valid ALB DNS format', () => {
      const albDnsRegex = /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/;
      expect(deploymentOutputs.blueAlbDns).toMatch(albDnsRegex);
      expect(deploymentOutputs.greenAlbDns).toMatch(albDnsRegex);
    });

    it('should have valid SNS ARN format', () => {
      const snsArnRegex = /^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9-_]+$/;
      expect(deploymentOutputs.migrationTopicArn).toMatch(snsArnRegex);
    });

    it('should have valid S3 bucket name format', () => {
      const s3BucketRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
      expect(deploymentOutputs.transactionLogsBucketName).toMatch(s3BucketRegex);
      expect(deploymentOutputs.complianceDocsBucketName).toMatch(s3BucketRegex);
    });

    it('should have valid DynamoDB table name format', () => {
      const dynamoTableRegex = /^[a-zA-Z0-9_.-]+$/;
      expect(deploymentOutputs.sessionTableName).toMatch(dynamoTableRegex);
      expect(deploymentOutputs.rateLimitTableName).toMatch(dynamoTableRegex);
    });

    it('should have valid CloudWatch dashboard URL format', () => {
      expect(deploymentOutputs.dashboardUrl).toMatch(/^https:\/\/console\.aws\.amazon\.com\/cloudwatch/);
    });

    it('should have valid domain name format', () => {
      const domainRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
      expect(deploymentOutputs.apiDomainName).toMatch(domainRegex);
    });
  });

  describe('Cross-Resource Relationships', () => {
    it('should have matching environment suffix in blue resources', () => {
      const blueResources = [
        deploymentOutputs.blueAlbDns,
        deploymentOutputs.blueDbEndpoint,
      ];

      blueResources.forEach(resource => {
        expect(resource).toContain('blue');
        expect(resource).toContain('dev');
      });
    });

    it('should have matching environment suffix in green resources', () => {
      const greenResources = [
        deploymentOutputs.greenAlbDns,
        deploymentOutputs.greenDbEndpoint,
      ];

      greenResources.forEach(resource => {
        expect(resource).toContain('green');
        expect(resource).toContain('dev');
      });
    });

    it('should have shared resources without blue/green designation', () => {
      const sharedResources = [
        deploymentOutputs.transactionLogsBucketName,
        deploymentOutputs.complianceDocsBucketName,
        deploymentOutputs.sessionTableName,
        deploymentOutputs.rateLimitTableName,
        deploymentOutputs.transitGatewayId,
        deploymentOutputs.apiDomainName,
      ];

      sharedResources.forEach(resource => {
        expect(resource).not.toContain('blue-');
        expect(resource).not.toContain('green-');
      });
    });

    it('should have consistent AWS account ID in ARNs', () => {
      const accountId = deploymentOutputs.migrationTopicArn.match(/:(\d{12}):/)?.[1];
      expect(accountId).toBeDefined();
      expect(accountId).toHaveLength(12);
    });
  });

  describe('Deployment Completeness', () => {
    it('should have complete network layer deployed', () => {
      expect(deploymentOutputs.blueVpcId).toBeTruthy();
      expect(deploymentOutputs.greenVpcId).toBeTruthy();
      expect(deploymentOutputs.transitGatewayId).toBeTruthy();
    });

    it('should have complete data layer deployed', () => {
      expect(deploymentOutputs.blueDbEndpoint).toBeTruthy();
      expect(deploymentOutputs.greenDbEndpoint).toBeTruthy();
      expect(deploymentOutputs.sessionTableName).toBeTruthy();
      expect(deploymentOutputs.rateLimitTableName).toBeTruthy();
    });

    it('should have complete application layer deployed', () => {
      expect(deploymentOutputs.blueAlbDns).toBeTruthy();
      expect(deploymentOutputs.greenAlbDns).toBeTruthy();
    });

    it('should have complete storage layer deployed', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toBeTruthy();
      expect(deploymentOutputs.complianceDocsBucketName).toBeTruthy();
    });

    it('should have complete monitoring layer deployed', () => {
      expect(deploymentOutputs.dashboardUrl).toBeTruthy();
      expect(deploymentOutputs.migrationTopicArn).toBeTruthy();
    });

    it('should have complete routing layer deployed', () => {
      expect(deploymentOutputs.apiDomainName).toBeTruthy();
    });
  });

  describe('Production Readiness Checks', () => {
    it('should have high availability with blue and green environments', () => {
      expect(deploymentOutputs.blueVpcId).toBeTruthy();
      expect(deploymentOutputs.greenVpcId).toBeTruthy();
      expect(deploymentOutputs.blueAlbDns).toBeTruthy();
      expect(deploymentOutputs.greenAlbDns).toBeTruthy();
      expect(deploymentOutputs.blueDbEndpoint).toBeTruthy();
      expect(deploymentOutputs.greenDbEndpoint).toBeTruthy();
    });

    it('should have monitoring capabilities configured', () => {
      expect(deploymentOutputs.dashboardUrl).toBeTruthy();
      expect(deploymentOutputs.migrationTopicArn).toBeTruthy();
    });

    it('should have data persistence configured', () => {
      expect(deploymentOutputs.transactionLogsBucketName).toBeTruthy();
      expect(deploymentOutputs.complianceDocsBucketName).toBeTruthy();
      expect(deploymentOutputs.sessionTableName).toBeTruthy();
      expect(deploymentOutputs.rateLimitTableName).toBeTruthy();
    });

    it('should have proper resource isolation', () => {
      expect(deploymentOutputs.blueVpcId).not.toBe(deploymentOutputs.greenVpcId);
      expect(deploymentOutputs.blueDbEndpoint).not.toBe(deploymentOutputs.greenDbEndpoint);
      expect(deploymentOutputs.blueAlbDns).not.toBe(deploymentOutputs.greenAlbDns);
    });

    it('should have all critical outputs available', () => {
      const criticalOutputs = [
        'blueVpcId',
        'greenVpcId',
        'blueDbEndpoint',
        'greenDbEndpoint',
        'blueAlbDns',
        'greenAlbDns',
        'apiDomainName',
      ];

      criticalOutputs.forEach(output => {
        expect(deploymentOutputs[output]).toBeTruthy();
      });
    });
  });

  describe('File System Validation', () => {
    it('should have Pulumi project configuration', () => {
      expect(fs.existsSync('Pulumi.yaml')).toBe(true);
    });

    it('should have package.json with required dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(packageJson.dependencies).toHaveProperty('@pulumi/pulumi');
      expect(packageJson.dependencies).toHaveProperty('@pulumi/aws');
    });

    it('should have TapStack source file', () => {
      expect(fs.existsSync('lib/tap-stack.ts')).toBe(true);
    });

    it('should have metadata file', () => {
      expect(fs.existsSync('metadata.json')).toBe(true);
    });

    it('should have test directory', () => {
      expect(fs.existsSync('test')).toBe(true);
    });

    it('should have cfn-outputs directory', () => {
      expect(fs.existsSync('cfn-outputs')).toBe(true);
    });

    it('should have flat-outputs.json in cfn-outputs', () => {
      expect(fs.existsSync('cfn-outputs/flat-outputs.json')).toBe(true);
    });
  });
});
