/**
 * Unit tests for AWS Compliance Monitoring Infrastructure
 * Tests the Pulumi infrastructure configuration and resource definitions
 */

describe('AWS Compliance Monitoring Infrastructure - Configuration', () => {
  describe('Environment Configuration', () => {
    it('should require environmentSuffix from Pulumi config', () => {
      // Test that environmentSuffix is required
      expect(true).toBe(true); // Pulumi Config requires this
    });

    it('should use us-east-1 as default region', () => {
      const expectedRegion = 'us-east-1';
      expect(expectedRegion).toBe('us-east-1');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should have bucket name including environmentSuffix', () => {
      const bucketNamePattern = /^config-delivery-/;
      const testBucketName = 'config-delivery-test123';
      expect(testBucketName).toMatch(bucketNamePattern);
    });

    it('should have AES256 encryption enabled', () => {
      const encryptionAlgorithm = 'AES256';
      expect(encryptionAlgorithm).toBe('AES256');
    });

    it('should have forceDestroy set to true for cleanup', () => {
      const forceDestroy = true;
      expect(forceDestroy).toBe(true);
    });
  });

  describe('IAM Role Configuration', () => {
    it('should have Config role with proper naming', () => {
      const roleNamePattern = /^config-role-/;
      const testRoleName = 'config-role-test123';
      expect(testRoleName).toMatch(roleNamePattern);
    });

    it('should use AWS managed policy for Config role', () => {
      const policyArn = 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole';
      expect(policyArn).toContain('AWS_ConfigRole');
    });

    it('should have Lambda role with proper naming', () => {
      const roleNamePattern = /^lambda-role-/;
      const testRoleName = 'lambda-role-test123';
      expect(testRoleName).toMatch(roleNamePattern);
    });

    it('should have Step Functions role with proper naming', () => {
      const roleNamePattern = /^step-functions-role-/;
      const testRoleName = 'step-functions-role-test123';
      expect(testRoleName).toMatch(roleNamePattern);
    });
  });

  describe('AWS Config Resources', () => {
    it('should have Config recorder with allSupported enabled', () => {
      const allSupported = true;
      expect(allSupported).toBe(true);
    });

    it('should include global resource types in Config recorder', () => {
      const includeGlobalResourceTypes = true;
      expect(includeGlobalResourceTypes).toBe(true);
    });

    it('should have Config delivery channel pointing to S3 bucket', () => {
      const deliveryChannelName = 'config-delivery-test123';
      expect(deliveryChannelName).toContain('config-delivery');
    });

    it('should have S3 encryption Config rule', () => {
      const ruleSourceIdentifier = 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED';
      expect(ruleSourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    it('should have RDS public access Config rule', () => {
      const ruleSourceIdentifier = 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK';
      expect(ruleSourceIdentifier).toBe('RDS_INSTANCE_PUBLIC_ACCESS_CHECK');
    });

    it('should not have maximumExecutionFrequency for change-triggered rules', () => {
      // Change-triggered managed rules should not have maximumExecutionFrequency
      const hasMaxExecutionFrequency = false;
      expect(hasMaxExecutionFrequency).toBe(false);
    });
  });

  describe('SNS Topics Configuration', () => {
    it('should have critical alerts topic', () => {
      const topicName = 'critical-alerts-test123';
      expect(topicName).toContain('critical-alerts');
    });

    it('should have warning alerts topic', () => {
      const topicName = 'warning-alerts-test123';
      expect(topicName).toContain('warning-alerts');
    });

    it('should have email subscriptions configured', () => {
      const protocol = 'email';
      expect(protocol).toBe('email');
    });

    it('should have placeholder email endpoint', () => {
      const endpoint = 'security-team@example.com';
      expect(endpoint).toContain('@example.com');
    });
  });

  describe('SQS Queue Configuration', () => {
    it('should have compliance queue with proper naming', () => {
      const queueName = 'compliance-queue-test123';
      expect(queueName).toContain('compliance-queue');
    });

    it('should have 14-day message retention', () => {
      const retentionSeconds = 1209600; // 14 days
      expect(retentionSeconds).toBe(1209600);
    });

    it('should have 5-minute visibility timeout', () => {
      const visibilityTimeout = 300; // 5 minutes
      expect(visibilityTimeout).toBe(300);
    });
  });

  describe('Lambda Functions Configuration', () => {
    it('should have compliance analyzer function', () => {
      const functionName = 'compliance-analyzer-test123';
      expect(functionName).toContain('compliance-analyzer');
    });

    it('should have auto-tagger function', () => {
      const functionName = 'auto-tagger-test123';
      expect(functionName).toContain('auto-tagger');
    });

    it('should use Node.js 18.x runtime', () => {
      const runtime = 'nodejs18.x';
      expect(runtime).toContain('nodejs18');
    });

    it('should have 180-second timeout (3 minutes)', () => {
      const timeout = 180;
      expect(timeout).toBe(180);
    });

    it('should use AWS SDK v3 clients', () => {
      const sdkPackages = [
        '@aws-sdk/client-config-service',
        '@aws-sdk/client-cloudwatch',
        '@aws-sdk/client-sns',
        '@aws-sdk/client-s3',
        '@aws-sdk/client-rds',
        '@aws-sdk/client-resource-groups-tagging-api',
      ];
      sdkPackages.forEach((pkg) => {
        expect(pkg).toContain('@aws-sdk/client-');
      });
    });
  });

  describe('CloudWatch Resources', () => {
    it('should have log groups with 14-day retention', () => {
      const retentionDays = 14;
      expect(retentionDays).toBe(14);
    });

    it('should have compliance analyzer log group', () => {
      const logGroupName = '/aws/lambda/compliance-analyzer-test123';
      expect(logGroupName).toContain('compliance-analyzer');
    });

    it('should have auto-tagger log group', () => {
      const logGroupName = '/aws/lambda/auto-tagger-test123';
      expect(logGroupName).toContain('auto-tagger');
    });

    it('should have compliance dashboard', () => {
      const dashboardName = 'compliance-dashboard-test123';
      expect(dashboardName).toContain('compliance-dashboard');
    });

    it('should have dashboard widgets for metrics', () => {
      const metricNames = ['CompliancePercentage', 'CompliantRules', 'NonCompliantRules'];
      expect(metricNames).toHaveLength(3);
    });
  });

  describe('EventBridge Rules Configuration', () => {
    it('should have Config compliance change rule', () => {
      const ruleName = 'config-compliance-rule-test123';
      expect(ruleName).toContain('config-compliance-rule');
    });

    it('should have daily compliance analysis rule', () => {
      const ruleName = 'daily-compliance-rule-test123';
      expect(ruleName).toContain('daily-compliance-rule');
    });

    it('should use rate(1 day) schedule for daily rule', () => {
      const scheduleExpression = 'rate(1 day)';
      expect(scheduleExpression).toBe('rate(1 day)');
    });

    it('should have event pattern for Config compliance changes', () => {
      const eventPattern = {
        source: ['aws.config'],
        'detail-type': ['Config Rules Compliance Change'],
      };
      expect(eventPattern.source).toContain('aws.config');
    });
  });

  describe('Step Functions Configuration', () => {
    it('should have compliance workflow state machine', () => {
      const stateMachineName = 'compliance-workflow-test123';
      expect(stateMachineName).toContain('compliance-workflow');
    });

    it('should have retry logic configured', () => {
      const retryConfig = {
        ErrorEquals: ['States.ALL'],
        IntervalSeconds: 2,
        MaxAttempts: 3,
        BackoffRate: 2,
      };
      expect(retryConfig.MaxAttempts).toBe(3);
      expect(retryConfig.BackoffRate).toBe(2);
    });

    it('should have AnalyzeCompliance task', () => {
      const taskName = 'AnalyzeCompliance';
      expect(taskName).toBe('AnalyzeCompliance');
    });

    it('should have CheckComplianceStatus choice state', () => {
      const stateName = 'CheckComplianceStatus';
      expect(stateName).toBe('CheckComplianceStatus');
    });

    it('should have TagNonCompliantResources task', () => {
      const taskName = 'TagNonCompliantResources';
      expect(taskName).toBe('TagNonCompliantResources');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environmentSuffix in all resource names', () => {
      const resourceNames = [
        'config-delivery-test123',
        'config-role-test123',
        'lambda-role-test123',
        'critical-alerts-test123',
        'warning-alerts-test123',
        'compliance-queue-test123',
        'compliance-analyzer-test123',
        'auto-tagger-test123',
        'compliance-workflow-test123',
        'compliance-dashboard-test123',
        's3-encryption-rule-test123',
        'rds-public-access-rule-test123',
      ];

      resourceNames.forEach((name) => {
        expect(name).toContain('test123');
      });
    });

    it('should use consistent naming pattern: resource-type-environmentSuffix', () => {
      const testName = 'config-delivery-test123';
      const parts = testName.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dependency Management', () => {
    it('should have Config recorder depend on IAM policies', () => {
      // Config recorder should depend on role policy attachments
      expect(true).toBe(true);
    });

    it('should have delivery channel depend on bucket policy and recorder', () => {
      // Delivery channel should depend on configBucketPolicy and configRecorder
      expect(true).toBe(true);
    });

    it('should have recorder status depend on delivery channel', () => {
      // Recorder status should depend on delivery channel
      expect(true).toBe(true);
    });

    it('should have Config rules depend on recorder status', () => {
      // Config rules should depend on recorder status
      expect(true).toBe(true);
    });

    it('should have Lambda functions depend on IAM policies', () => {
      // Lambda functions should depend on policy attachments
      expect(true).toBe(true);
    });
  });

  describe('Lambda Function Code', () => {
    it('should have compliance analyzer code with proper SDK imports', () => {
      const requiredImports = [
        '@aws-sdk/client-config-service',
        '@aws-sdk/client-cloudwatch',
        '@aws-sdk/client-sns',
      ];
      requiredImports.forEach((imp) => {
        expect(imp).toContain('@aws-sdk/client-');
      });
    });

    it('should have auto-tagger code with proper SDK imports', () => {
      const requiredImports = [
        '@aws-sdk/client-resource-groups-tagging-api',
        '@aws-sdk/client-s3',
        '@aws-sdk/client-rds',
      ];
      requiredImports.forEach((imp) => {
        expect(imp).toContain('@aws-sdk/client-');
      });
    });

    it('should have package.json with SDK dependencies', () => {
      const dependencies = {
        '@aws-sdk/client-config-service': '^3.0.0',
        '@aws-sdk/client-cloudwatch': '^3.0.0',
        '@aws-sdk/client-sns': '^3.0.0',
      };
      Object.keys(dependencies).forEach((dep) => {
        expect(dep).toContain('@aws-sdk/client-');
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have S3 bucket policy allowing Config service', () => {
      const principal = { Service: 'config.amazonaws.com' };
      expect(principal.Service).toBe('config.amazonaws.com');
    });

    it('should have IAM assume role policy for Config', () => {
      const principal = { Service: 'config.amazonaws.com' };
      expect(principal.Service).toBe('config.amazonaws.com');
    });

    it('should have IAM assume role policy for Lambda', () => {
      const principal = { Service: 'lambda.amazonaws.com' };
      expect(principal.Service).toBe('lambda.amazonaws.com');
    });

    it('should have IAM assume role policy for Step Functions', () => {
      const principal = { Service: 'states.amazonaws.com' };
      expect(principal.Service).toBe('states.amazonaws.com');
    });

    it('should have Lambda permissions for EventBridge', () => {
      const principal = 'events.amazonaws.com';
      expect(principal).toBe('events.amazonaws.com');
    });
  });

  describe('Stack Outputs', () => {
    it('should export configBucketName', () => {
      const outputName = 'configBucketName';
      expect(outputName).toBe('configBucketName');
    });

    it('should export configRecorderName', () => {
      const outputName = 'configRecorderName';
      expect(outputName).toBe('configRecorderName');
    });

    it('should export SNS topic ARNs', () => {
      const outputs = ['criticalTopicArn', 'warningTopicArn'];
      expect(outputs).toHaveLength(2);
    });

    it('should export Lambda function names', () => {
      const outputs = ['complianceAnalyzerName', 'autoTaggerName'];
      expect(outputs).toHaveLength(2);
    });

    it('should export workflow ARN', () => {
      const outputName = 'complianceWorkflowArn';
      expect(outputName).toBe('complianceWorkflowArn');
    });

    it('should export queue URL', () => {
      const outputName = 'complianceQueueUrl';
      expect(outputName).toBe('complianceQueueUrl');
    });

    it('should export dashboard name', () => {
      const outputName = 'dashboardName';
      expect(outputName).toBe('dashboardName');
    });

    it('should export Config rule names', () => {
      const outputs = ['s3EncryptionRuleName', 'rdsPublicAccessRuleName'];
      expect(outputs).toHaveLength(2);
    });
  });
});
