import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
  DescribeConfigRuleEvaluationStatusCommand,
} from '@aws-sdk/client-config-service';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  SSMClient,
  DescribeDocumentCommand,
  GetDocumentCommand,
} from '@aws-sdk/client-ssm';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests - Deployed Resources', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Deploy the stack first.`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.TagComplianceFunctionArn).toBeDefined();
      expect(outputs.EncryptionComplianceFunctionArn).toBeDefined();
      expect(outputs.SecurityGroupComplianceFunctionArn).toBeDefined();
      expect(outputs.ComplianceReportFunctionArn).toBeDefined();
      expect(outputs.ComplianceReportsBucketName).toBeDefined();
      expect(outputs.ComplianceTopicArn).toBeDefined();
      expect(outputs.SNSEncryptionKeyId).toBeDefined();
      expect(outputs.RemediationDocumentName).toBeDefined();
      expect(outputs.ConfigRecorderName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('environment suffix should be included in resource names', () => {
      expect(outputs.TagComplianceFunctionArn).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ComplianceReportsBucketName).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ComplianceTopicArn).toContain(outputs.EnvironmentSuffix);
      expect(outputs.ConfigRecorderName).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaClient = new LambdaClient({ region });

    const lambdaFunctions = [
      { key: 'TagComplianceFunctionArn', name: 'Tag Compliance' },
      { key: 'EncryptionComplianceFunctionArn', name: 'Encryption Compliance' },
      { key: 'SecurityGroupComplianceFunctionArn', name: 'Security Group Compliance' },
      { key: 'ComplianceReportFunctionArn', name: 'Compliance Report' },
    ];

    lambdaFunctions.forEach(({ key, name }) => {
      test(`${name} Lambda should exist and be accessible`, async () => {
        const arn = outputs[key];
        const functionName = arn.split(':').pop();

        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionArn).toBe(arn);
      }, 30000);

      test(`${name} Lambda should have Python 3.11 runtime`, async () => {
        const arn = outputs[key];
        const functionName = arn.split(':').pop();

        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: functionName })
        );

        expect(response.Runtime).toBe('python3.11');
      }, 30000);

      test(`${name} Lambda should have 256MB memory`, async () => {
        const arn = outputs[key];
        const functionName = arn.split(':').pop();

        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: functionName })
        );

        expect(response.MemorySize).toBe(256);
      }, 30000);

      test(`${name} Lambda should have reserved concurrent executions`, async () => {
        const arn = outputs[key];
        const functionName = arn.split(':').pop();

        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Concurrency?.ReservedConcurrentExecutions).toBe(5);
      }, 30000);
    });
  });

  describe('S3 Buckets', () => {
    const s3Client = new S3Client({ region });

    test('ComplianceReportsBucket should exist', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    }, 30000);

    test('ComplianceReportsBucket should have versioning enabled', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('ComplianceReportsBucket should have encryption enabled', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault
          ?.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    test('ComplianceReportsBucket should block public access', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('ComplianceReportsBucket should have 90-day lifecycle policy', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThanOrEqual(1);

      const lifecycleRule = response.Rules?.find((rule: any) => rule.Status === 'Enabled');
      expect(lifecycleRule).toBeDefined();
      expect(lifecycleRule?.Expiration?.Days).toBe(90);
    }, 30000);
  });

  describe('SNS Topic', () => {
    const snsClient = new SNSClient({ region });

    test('ComplianceTopic should exist', async () => {
      const topicArn = outputs.ComplianceTopicArn;

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    }, 30000);

    test('ComplianceTopic should use KMS encryption', async () => {
      const topicArn = outputs.ComplianceTopicArn;

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toContain(outputs.SNSEncryptionKeyId);
    }, 30000);

    test('ComplianceTopic should have display name', async () => {
      const topicArn = outputs.ComplianceTopicArn;

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes?.DisplayName).toBe('AWS Config Compliance Notifications');
    }, 30000);
  });

  describe('KMS Key', () => {
    const kmsClient = new KMSClient({ region });

    test('SNS Encryption Key should exist', async () => {
      const keyId = outputs.SNSEncryptionKeyId;

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyId).toBe(keyId);
    }, 30000);

    test('SNS Encryption Key should be enabled', async () => {
      const keyId = outputs.SNSEncryptionKeyId;

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    }, 30000);

    test('SNS Encryption Key should have alias', async () => {
      const keyId = outputs.SNSEncryptionKeyId;

      const response = await kmsClient.send(
        new ListAliasesCommand({ KeyId: keyId })
      );

      expect(response.Aliases).toBeDefined();
      expect(response.Aliases?.length).toBeGreaterThanOrEqual(1);

      const alias = response.Aliases?.find((a: any) =>
        a.AliasName.includes(`sns-compliance-${outputs.EnvironmentSuffix}`)
      );
      expect(alias).toBeDefined();
    }, 30000);
  });

  describe('AWS Config', () => {
    const configClient = new ConfigServiceClient({ region });

    test('Config Recorder should exist', async () => {
      const recorderName = outputs.ConfigRecorderName;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      const recorder = response.ConfigurationRecorders?.find(
        (r: any) => r.name === recorderName
      );

      expect(recorder).toBeDefined();
      expect(recorder?.name).toBe(recorderName);
    }, 30000);

    test('Config Recorder should record all supported resources', async () => {
      const recorderName = outputs.ConfigRecorderName;

      const response = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );

      const recorder = response.ConfigurationRecorders?.find(
        (r: any) => r.name === recorderName
      );

      expect(recorder?.recordingGroup?.allSupported).toBe(true);
      expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    }, 30000);

    test('Delivery Channel should exist', async () => {
      const response = await configClient.send(
        new DescribeDeliveryChannelsCommand({})
      );

      const channel = response.DeliveryChannels?.find((c: any) =>
        c.name.includes(outputs.EnvironmentSuffix)
      );

      expect(channel).toBeDefined();
    }, 30000);

    test('Config Rules should exist', async () => {
      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      const expectedRules = [
        `required-tags-compliance-${outputs.EnvironmentSuffix}`,
        `encryption-compliance-${outputs.EnvironmentSuffix}`,
        `security-group-compliance-${outputs.EnvironmentSuffix}`,
      ];

      expectedRules.forEach((ruleName) => {
        const rule = response.ConfigRules?.find((r: any) => r.ConfigRuleName === ruleName);
        expect(rule).toBeDefined();
      });
    }, 30000);

    test('Config Rules should use custom Lambda source', async () => {
      const response = await configClient.send(
        new DescribeConfigRulesCommand({})
      );

      const rules = response.ConfigRules?.filter((r: any) =>
        r.ConfigRuleName.includes(outputs.EnvironmentSuffix)
      );

      rules?.forEach((rule: any) => {
        expect(rule.Source.Owner).toBe('CUSTOM_LAMBDA');
        expect(rule.Source.SourceIdentifier).toContain('arn:aws:lambda');
      });
    }, 30000);
  });

  describe('SSM Document', () => {
    const ssmClient = new SSMClient({ region });

    test('Remediation Document should exist', async () => {
      const documentName = outputs.RemediationDocumentName;

      const response = await ssmClient.send(
        new DescribeDocumentCommand({ Name: documentName })
      );

      expect(response.Document).toBeDefined();
      expect(response.Document?.Name).toBe(documentName);
    }, 30000);

    test('Remediation Document should be Automation type', async () => {
      const documentName = outputs.RemediationDocumentName;

      const response = await ssmClient.send(
        new DescribeDocumentCommand({ Name: documentName })
      );

      expect(response.Document?.DocumentType).toBe('Automation');
    }, 30000);

    test('Remediation Document should have content', async () => {
      const documentName = outputs.RemediationDocumentName;

      const response = await ssmClient.send(
        new GetDocumentCommand({ Name: documentName })
      );

      expect(response.Content).toBeDefined();
      expect(response.Content).toContain('add_tags');
      expect(response.Content).toContain('python3.11');
    }, 30000);
  });

  describe('IAM Roles', () => {
    const iamClient = new IAMClient({ region });

    test('Lambda Execution Role should exist', async () => {
      const roleName = `lambda-compliance-role-${outputs.EnvironmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    }, 30000);

    test('Lambda Execution Role should have inline policies', async () => {
      const roleName = `lambda-compliance-role-${outputs.EnvironmentSuffix}`;

      const response = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThanOrEqual(1);
      expect(response.PolicyNames).toContain('LambdaExecutionPolicy');
    }, 30000);

    test('Config Role should exist', async () => {
      const roleName = `config-role-${outputs.EnvironmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    }, 30000);

    test('Config Role should have inline policies', async () => {
      const roleName = `config-role-${outputs.EnvironmentSuffix}`;

      const response = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThanOrEqual(1);
      expect(response.PolicyNames).toContain('ConfigPolicy');
    }, 30000);
  });

  describe('EventBridge Rule', () => {
    const eventBridgeClient = new EventBridgeClient({ region });

    test('Report Generation Schedule should exist', async () => {
      const ruleName = `compliance-report-schedule-${outputs.EnvironmentSuffix}`;

      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    }, 30000);

    test('Report Generation Schedule should trigger daily', async () => {
      const ruleName = `compliance-report-schedule-${outputs.EnvironmentSuffix}`;

      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(response.ScheduleExpression).toBe('rate(1 day)');
    }, 30000);

    test('Report Generation Schedule should target Compliance Report Function', async () => {
      const ruleName = `compliance-report-schedule-${outputs.EnvironmentSuffix}`;

      const response = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: ruleName })
      );

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThanOrEqual(1);

      const target = response.Targets?.find((t: any) =>
        t.Arn === outputs.ComplianceReportFunctionArn
      );
      expect(target).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('all critical resources should be operational', async () => {
      // Verify Lambda functions are invocable
      const lambdaClient = new LambdaClient({ region });
      const tagFunctionName = outputs.TagComplianceFunctionArn.split(':').pop();

      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: tagFunctionName })
      );
      expect(lambdaResponse.State).toBe('Active');

      // Verify S3 bucket is accessible
      const s3Client = new S3Client({ region });
      await expect(
        s3Client.send(
          new HeadBucketCommand({ Bucket: outputs.ComplianceReportsBucketName })
        )
      ).resolves.not.toThrow();

      // Verify SNS topic is accessible
      const snsClient = new SNSClient({ region });
      const snsResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.ComplianceTopicArn })
      );
      expect(snsResponse.Attributes).toBeDefined();

      // Verify Config recorder exists
      const configClient = new ConfigServiceClient({ region });
      const configResponse = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );
      const recorder = configResponse.ConfigurationRecorders?.find(
        (r: any) => r.name === outputs.ConfigRecorderName
      );
      expect(recorder).toBeDefined();
    }, 30000);
  });
});
