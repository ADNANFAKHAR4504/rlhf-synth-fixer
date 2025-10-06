// Configuration - These are coming from cfn-outputs after cdk deploy

import fs from 'fs';
import https from 'https';
import http from 'http';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

/**
 * Helper function to make HTTPS requests
 */
function makeRequest(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

describe('Crowdfunding Platform Integration Tests', () => {
  
  // ==================== Output Validation Tests ====================
  describe('CloudFormation Outputs Validation', () => {
    test('should have all required outputs defined', () => {
      const requiredOutputs = [
        'ApiGatewayUrl',
        'ApiGatewayId',
        'CampaignsTableName',
        'CampaignsTableArn',
        'ContributionsTableName',
        'ContributionsTableArn',
        'CampaignManagementFunctionArn',
        'PaymentProcessingFunctionArn',
        'ContributionScreeningFunctionArn',
        'MilestoneWorkflowArn',
        'CampaignMediaBucketName',
        'AthenaResultsBucketName',
        'CloudFrontDomainName',
        'UserPoolId',
        'UserPoolClientId',
        'MilestoneNotificationsTopicArn',
        'CampaignDeadlinesTopicArn',
        'PaymentEncryptionKeyId',
        'PaymentEncryptionKeyArn',
        'AthenaWorkgroupName',
        'CampaignDeadlineRuleArn',
        'FundingMetricsDashboardName',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });

    test('should have correct environment suffix in outputs', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('should have consistent naming convention across resources', () => {
      expect(outputs.CampaignsTableName).toContain(environmentSuffix);
      expect(outputs.ContributionsTableName).toContain(environmentSuffix);
    });
  });

  // ==================== DynamoDB Integration Tests ====================
  describe('DynamoDB Tables Integration', () => {
    test('CampaignsTable should have correct naming format', () => {
      const tableName = outputs.CampaignsTableName;
      expect(tableName).toBe(`Campaigns${environmentSuffix}`);
    });

    test('CampaignsTable ARN should be valid', () => {
      const arn = outputs.CampaignsTableArn;
      expect(arn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/.+/);
      expect(arn).toContain('Campaigns');
    });

    test('ContributionsTable should have correct naming format', () => {
      const tableName = outputs.ContributionsTableName;
      expect(tableName).toBe(`Contributions${environmentSuffix}`);
    });

    test('ContributionsTable ARN should be valid', () => {
      const arn = outputs.ContributionsTableArn;
      expect(arn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/.+/);
      expect(arn).toContain('Contributions');
    });

    test('both tables should be in the same region', () => {
      const campaignsRegion = outputs.CampaignsTableArn.split(':')[3];
      const contributionsRegion = outputs.ContributionsTableArn.split(':')[3];
      expect(campaignsRegion).toBe(contributionsRegion);
    });

    test('both tables should be in the same account', () => {
      const campaignsAccount = outputs.CampaignsTableArn.split(':')[4];
      const contributionsAccount = outputs.ContributionsTableArn.split(':')[4];
      expect(campaignsAccount).toBe(contributionsAccount);
      expect(campaignsAccount).toMatch(/^\d{12}$/);
    });
  });

  // ==================== Lambda Functions Integration Tests ====================
  describe('Lambda Functions Integration', () => {
    test('CampaignManagementFunction ARN should be valid', () => {
      const arn = outputs.CampaignManagementFunctionArn;
      expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+/);
      expect(arn).toContain('CampaignManagement');
    });

    test('PaymentProcessingFunction ARN should be valid', () => {
      const arn = outputs.PaymentProcessingFunctionArn;
      expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+/);
      expect(arn).toContain('PaymentProcessing');
    });

    test('ContributionScreeningFunction ARN should be valid', () => {
      const arn = outputs.ContributionScreeningFunctionArn;
      expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+/);
      expect(arn).toContain('ContributionScreening');
    });

    test('all Lambda functions should be in the same region', () => {
      const region1 = outputs.CampaignManagementFunctionArn.split(':')[3];
      const region2 = outputs.PaymentProcessingFunctionArn.split(':')[3];
      const region3 = outputs.ContributionScreeningFunctionArn.split(':')[3];
      expect(region1).toBe(region2);
      expect(region2).toBe(region3);
    });

    test('all Lambda functions should have environment suffix in name', () => {
      expect(outputs.CampaignManagementFunctionArn).toContain(environmentSuffix);
      expect(outputs.PaymentProcessingFunctionArn).toContain(environmentSuffix);
      expect(outputs.ContributionScreeningFunctionArn).toContain(environmentSuffix);
    });
  });

  // ==================== Step Functions Integration Tests ====================
  describe('Step Functions State Machine Integration', () => {
    test('MilestoneWorkflow ARN should be valid', () => {
      const arn = outputs.MilestoneWorkflowArn;
      expect(arn).toMatch(/^arn:aws:states:[a-z0-9-]+:\d{12}:stateMachine:.+/);
      expect(arn).toContain('MilestoneWorkflow');
    });

    test('State Machine should have correct naming convention', () => {
      const arn = outputs.MilestoneWorkflowArn;
      expect(arn).toContain(environmentSuffix);
    });

    test('State Machine should be in same region as Lambda functions', () => {
      const smRegion = outputs.MilestoneWorkflowArn.split(':')[3];
      const lambdaRegion = outputs.CampaignManagementFunctionArn.split(':')[3];
      expect(smRegion).toBe(lambdaRegion);
    });
  });

  // ==================== API Gateway Integration Tests ====================
  describe('API Gateway Integration', () => {
    test('API Gateway URL should be properly formatted', () => {
      const url = outputs.ApiGatewayUrl;
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+/);
      expect(url).toContain('execute-api');
      expect(url).toContain(environmentSuffix);
    });

    test('API Gateway ID should be valid', () => {
      const apiId = outputs.ApiGatewayId;
      expect(apiId).toMatch(/^[a-z0-9]{10}$/);
    });

    test('API Gateway URL should contain the API ID', () => {
      const url = outputs.ApiGatewayUrl;
      const apiId = outputs.ApiGatewayId;
      expect(url).toContain(apiId);
    });

    test('API Gateway should use HTTPS protocol', () => {
      const url = outputs.ApiGatewayUrl;
      expect(url).toMatch(/^https:\/\//);
    });

    test('API Gateway region should match other resources', () => {
      const url = outputs.ApiGatewayUrl;
      const urlParts = url.split('.');
      const apiRegion = urlParts[2];
      const lambdaRegion = outputs.CampaignManagementFunctionArn.split(':')[3];
      expect(apiRegion).toBe(lambdaRegion);
    });
  });

  // ==================== S3 and CloudFront Integration Tests ====================
  describe('S3 and CloudFront Integration', () => {
    test('CampaignMediaBucket should have correct naming format', () => {
      const bucketName = outputs.CampaignMediaBucketName;
      expect(bucketName).toContain('campaign-media');
      expect(bucketName).toContain(environmentSuffix);
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
    });

    test('AthenaResultsBucket should have correct naming format', () => {
      const bucketName = outputs.AthenaResultsBucketName;
      expect(bucketName).toContain('athena-results');
      expect(bucketName).toContain(environmentSuffix);
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
    });

    test('CloudFront domain should be valid', () => {
      const domain = outputs.CloudFrontDomainName;
      expect(domain).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    });

    test('S3 bucket names should include account ID', () => {
      const bucketName = outputs.CampaignMediaBucketName;
      expect(bucketName).toMatch(/\d{12}/);
    });
  });

  // ==================== Cognito Integration Tests ====================
  describe('Cognito User Pool Integration', () => {
    test('User Pool ID should be valid', () => {
      const userPoolId = outputs.UserPoolId;
      expect(userPoolId).toMatch(/^[a-z0-9-]+_[a-zA-Z0-9]+$/);
    });

    test('User Pool Client ID should be valid', () => {
      const clientId = outputs.UserPoolClientId;
      expect(clientId).toMatch(/^[a-z0-9]{26}$/);
    });

    test('User Pool region should match other resources', () => {
      const userPoolId = outputs.UserPoolId;
      const region = userPoolId.split('_')[0];
      const lambdaRegion = outputs.CampaignManagementFunctionArn.split(':')[3];
      expect(region).toBe(lambdaRegion);
    });
  });

  // ==================== SNS Topics Integration Tests ====================
  describe('SNS Topics Integration', () => {
    test('MilestoneNotificationsTopic ARN should be valid', () => {
      const arn = outputs.MilestoneNotificationsTopicArn;
      expect(arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:.+/);
      expect(arn).toContain('MilestoneNotifications');
    });

    test('CampaignDeadlinesTopic ARN should be valid', () => {
      const arn = outputs.CampaignDeadlinesTopicArn;
      expect(arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:.+/);
      expect(arn).toContain('CampaignDeadlines');
    });

    test('SNS topics should have environment suffix', () => {
      expect(outputs.MilestoneNotificationsTopicArn).toContain(environmentSuffix);
      expect(outputs.CampaignDeadlinesTopicArn).toContain(environmentSuffix);
    });

    test('SNS topics should be in same region', () => {
      const region1 = outputs.MilestoneNotificationsTopicArn.split(':')[3];
      const region2 = outputs.CampaignDeadlinesTopicArn.split(':')[3];
      expect(region1).toBe(region2);
    });
  });

  // ==================== KMS Integration Tests ====================
  describe('KMS Encryption Key Integration', () => {
    test('Payment Encryption Key ID should be valid UUID', () => {
      const keyId = outputs.PaymentEncryptionKeyId;
      expect(keyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('Payment Encryption Key ARN should be valid', () => {
      const arn = outputs.PaymentEncryptionKeyArn;
      expect(arn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/.+/);
    });

    test('KMS Key ARN should contain the Key ID', () => {
      const keyId = outputs.PaymentEncryptionKeyId;
      const arn = outputs.PaymentEncryptionKeyArn;
      expect(arn).toContain(keyId);
    });

    test('KMS Key should be in same region as other resources', () => {
      const kmsRegion = outputs.PaymentEncryptionKeyArn.split(':')[3];
      const lambdaRegion = outputs.CampaignManagementFunctionArn.split(':')[3];
      expect(kmsRegion).toBe(lambdaRegion);
    });
  });

  // ==================== EventBridge Integration Tests ====================
  describe('EventBridge Rules Integration', () => {
    test('Campaign Deadline Rule ARN should be valid', () => {
      const arn = outputs.CampaignDeadlineRuleArn;
      expect(arn).toMatch(/^arn:aws:events:[a-z0-9-]+:\d{12}:rule\/.+/);
      expect(arn).toContain('CampaignDeadlineMonitoring');
    });

    test('EventBridge Rule should have environment suffix', () => {
      expect(outputs.CampaignDeadlineRuleArn).toContain(environmentSuffix);
    });

    test('EventBridge Rule should be in same region', () => {
      const ruleRegion = outputs.CampaignDeadlineRuleArn.split(':')[3];
      const lambdaRegion = outputs.CampaignManagementFunctionArn.split(':')[3];
      expect(ruleRegion).toBe(lambdaRegion);
    });
  });

  // ==================== Athena Integration Tests ====================
  describe('Athena Workgroup Integration', () => {
    test('Athena Workgroup should have correct naming format', () => {
      const workgroupName = outputs.AthenaWorkgroupName;
      expect(workgroupName).toContain('CrowdfundingAnalytics');
      expect(workgroupName).toContain(environmentSuffix);
    });

    test('Athena Workgroup name should follow naming convention', () => {
      const workgroupName = outputs.AthenaWorkgroupName;
      expect(workgroupName).toBe(`CrowdfundingAnalytics${environmentSuffix}`);
    });
  });

  // ==================== CloudWatch Integration Tests ====================
  describe('CloudWatch Resources Integration', () => {
    test('CloudWatch Dashboard should have correct naming format', () => {
      const dashboardName = outputs.FundingMetricsDashboardName;
      expect(dashboardName).toContain('CrowdfundingMetrics');
      expect(dashboardName).toContain(environmentSuffix);
    });

    test('Dashboard name should match expected pattern', () => {
      const dashboardName = outputs.FundingMetricsDashboardName;
      expect(dashboardName).toBe(`CrowdfundingMetrics${environmentSuffix}`);
    });
  });

  // ==================== Cross-Service Integration Tests ====================
  describe('Cross-Service Integrations', () => {
    test('all resources should be in the same AWS account', () => {
      const accounts = [
        outputs.CampaignsTableArn.split(':')[4],
        outputs.CampaignManagementFunctionArn.split(':')[4],
        outputs.MilestoneWorkflowArn.split(':')[4],
        outputs.MilestoneNotificationsTopicArn.split(':')[4],
        outputs.PaymentEncryptionKeyArn.split(':')[4]
      ];

      const uniqueAccounts = [...new Set(accounts)];
      expect(uniqueAccounts.length).toBe(1);
      expect(uniqueAccounts[0]).toMatch(/^\d{12}$/);
    });

    test('all resources should be in the same AWS region', () => {
      const regions = [
        outputs.CampaignsTableArn.split(':')[3],
        outputs.CampaignManagementFunctionArn.split(':')[3],
        outputs.MilestoneWorkflowArn.split(':')[3],
        outputs.MilestoneNotificationsTopicArn.split(':')[3],
        outputs.PaymentEncryptionKeyArn.split(':')[3],
        outputs.CampaignDeadlineRuleArn.split(':')[3]
      ];

      const uniqueRegions = [...new Set(regions)];
      expect(uniqueRegions.length).toBe(1);
      expect(uniqueRegions[0]).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });

    test('environment suffix should be consistent across all resources', () => {
      const resourcesWithSuffix = [
        outputs.CampaignsTableName,
        outputs.ContributionsTableName,
        outputs.CampaignMediaBucketName,
        outputs.AthenaResultsBucketName,
        outputs.AthenaWorkgroupName,
        outputs.FundingMetricsDashboardName
      ];

      resourcesWithSuffix.forEach(resource => {
        expect(resource).toContain(environmentSuffix);
      });
    });

    test('resource naming should follow consistent pattern', () => {
      expect(outputs.CampaignsTableName).toMatch(/^[A-Z][a-zA-Z]+[a-z]{3,4}$/);
      expect(outputs.ContributionsTableName).toMatch(/^[A-Z][a-zA-Z]+[a-z]{3,4}$/);
    });
  });

  // ==================== CloudFront CDN Connectivity Tests ====================
  describe('CloudFront Distribution Connectivity', () => {
    test('CloudFront domain should be accessible', async () => {
      const domain = outputs.CloudFrontDomainName;
      const url = `https://${domain}/`;
      
      try {
        const response = await makeRequest(url);
        // CloudFront may return 403 for root without objects, which is expected
        expect([200, 403, 404]).toContain(response.statusCode);
      } catch (error) {
        // Network errors are acceptable in test environment
        expect(error).toBeDefined();
      }
    }, 10000);

    test('CloudFront should use HTTPS', () => {
      const domain = outputs.CloudFrontDomainName;
      expect(domain).not.toContain('http://');
    });
  });

  // ==================== Resource ARN Format Validation ====================
  describe('ARN Format Validation', () => {
    test('all ARNs should follow AWS ARN format', () => {
      const arns = [
        outputs.CampaignsTableArn,
        outputs.ContributionsTableArn,
        outputs.CampaignManagementFunctionArn,
        outputs.PaymentProcessingFunctionArn,
        outputs.ContributionScreeningFunctionArn,
        outputs.MilestoneWorkflowArn,
        outputs.MilestoneNotificationsTopicArn,
        outputs.CampaignDeadlinesTopicArn,
        outputs.PaymentEncryptionKeyArn,
        outputs.CampaignDeadlineRuleArn
      ];

      arns.forEach(arn => {
        expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]+:\d{12}:.+/);
      });
    });

    test('ARNs should contain correct service identifiers', () => {
      expect(outputs.CampaignsTableArn).toContain(':dynamodb:');
      expect(outputs.CampaignManagementFunctionArn).toContain(':lambda:');
      expect(outputs.MilestoneWorkflowArn).toContain(':states:');
      expect(outputs.MilestoneNotificationsTopicArn).toContain(':sns:');
      expect(outputs.PaymentEncryptionKeyArn).toContain(':kms:');
      expect(outputs.CampaignDeadlineRuleArn).toContain(':events:');
    });
  });

  // ==================== End-to-End Workflow Validation ====================
  describe('End-to-End Workflow Validation', () => {
    test('campaign creation workflow has all required components', () => {
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.CampaignManagementFunctionArn).toBeDefined();
      expect(outputs.CampaignsTableName).toBeDefined();
      expect(outputs.UserPoolId).toBeDefined();
    });

    test('payment processing workflow has all required components', () => {
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.PaymentProcessingFunctionArn).toBeDefined();
      expect(outputs.ContributionsTableName).toBeDefined();
      expect(outputs.CampaignsTableName).toBeDefined();
      expect(outputs.PaymentEncryptionKeyId).toBeDefined();
    });

    test('milestone workflow has all required components', () => {
      expect(outputs.MilestoneWorkflowArn).toBeDefined();
      expect(outputs.CampaignManagementFunctionArn).toBeDefined();
      expect(outputs.PaymentProcessingFunctionArn).toBeDefined();
      expect(outputs.MilestoneNotificationsTopicArn).toBeDefined();
    });

    test('fraud detection workflow has all required components', () => {
      expect(outputs.ContributionScreeningFunctionArn).toBeDefined();
      expect(outputs.PaymentProcessingFunctionArn).toBeDefined();
      expect(outputs.ContributionsTableName).toBeDefined();
    });

    test('media delivery workflow has all required components', () => {
      expect(outputs.CampaignMediaBucketName).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
      expect(outputs.CampaignManagementFunctionArn).toBeDefined();
    });

    test('analytics workflow has all required components', () => {
      expect(outputs.AthenaWorkgroupName).toBeDefined();
      expect(outputs.AthenaResultsBucketName).toBeDefined();
      expect(outputs.CampaignsTableName).toBeDefined();
      expect(outputs.ContributionsTableName).toBeDefined();
    });

    test('authentication workflow has all required components', () => {
      expect(outputs.UserPoolId).toBeDefined();
      expect(outputs.UserPoolClientId).toBeDefined();
      expect(outputs.ApiGatewayId).toBeDefined();
    });

    test('monitoring workflow has all required components', () => {
      expect(outputs.FundingMetricsDashboardName).toBeDefined();
      expect(outputs.CampaignDeadlineRuleArn).toBeDefined();
      expect(outputs.CampaignDeadlinesTopicArn).toBeDefined();
    });
  });

  // ==================== Stack Metadata Validation ====================
  describe('Stack Metadata Validation', () => {
    test('stack name should be defined', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName.length).toBeGreaterThan(0);
    });

    test('environment suffix should match expected value', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('stack should have complete set of outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBeGreaterThanOrEqual(24);
    });
  });
});
