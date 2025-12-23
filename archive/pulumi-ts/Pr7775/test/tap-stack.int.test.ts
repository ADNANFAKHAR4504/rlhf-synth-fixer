import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-lambda';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

describe('Tagging Audit Infrastructure Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Deploy infrastructure first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('S3 Bucket', () => {
    it('should have reportBucketName in outputs', () => {
      expect(outputs.reportBucketName).toBeDefined();
      expect(typeof outputs.reportBucketName).toBe('string');
    });

    it('should verify bucket exists and has encryption', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs.reportBucketName;

      // Verify bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.toBeDefined();

      // Verify encryption is enabled
      const encryptionResult = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResult.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      expect(
        encryptionResult.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should verify bucket has public access block enabled', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs.reportBucketName;

      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    it('should have auditLambdaName in outputs', () => {
      expect(outputs.auditLambdaName).toBeDefined();
      expect(typeof outputs.auditLambdaName).toBe('string');
    });

    it('should verify Lambda function exists and has correct configuration', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.auditLambdaName;

      const functionConfig = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(functionConfig.Configuration).toBeDefined();
      expect(functionConfig.Configuration?.Runtime).toBe('nodejs18.x');
      expect(functionConfig.Configuration?.Handler).toBe('index.handler');
      expect(functionConfig.Configuration?.Timeout).toBe(900);
      expect(functionConfig.Configuration?.MemorySize).toBe(512);
      expect(
        functionConfig.Configuration?.Environment?.Variables?.REPORT_BUCKET
      ).toBe(outputs.reportBucketName);
      expect(
        functionConfig.Configuration?.Environment?.Variables?.TARGET_REGION
      ).toBe('us-east-1');
    });

    it('should verify Lambda has EventBridge permission', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.auditLambdaName;

      const policyResponse = await lambdaClient.send(
        new GetPolicyCommand({ FunctionName: functionName })
      );

      expect(policyResponse.Policy).toBeDefined();
      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);

      const eventBridgePermission = policy.Statement.find(
        (stmt: any) =>
          stmt.Principal?.Service === 'events.amazonaws.com' &&
          stmt.Action === 'lambda:InvokeFunction'
      );
      expect(eventBridgePermission).toBeDefined();
    });
  });

  describe('IAM Role', () => {
    it('should verify Lambda IAM role exists with correct policies', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = outputs.auditLambdaName;

      const functionConfig = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      const roleArn = functionConfig.Configuration?.Role;
      expect(roleArn).toBeDefined();

      const roleName = roleArn?.split('/').pop();
      expect(roleName).toBeDefined();

      const iamClient = new IAMClient({ region });

      // Verify role exists
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName! })
      );
      expect(roleResponse.Role).toBeDefined();

      // Verify attached managed policies
      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );
      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      const hasBasicExecution = attachedPolicies.AttachedPolicies?.some(
        (policy) =>
          policy.PolicyArn ===
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(hasBasicExecution).toBe(true);

      // Verify inline policies
      const inlinePolicies = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName! })
      );
      expect(inlinePolicies.PolicyNames).toBeDefined();
      expect(inlinePolicies.PolicyNames!.length).toBeGreaterThan(0);

      // Verify scanner policy contains required permissions
      const scannerPolicyName = inlinePolicies.PolicyNames![0];
      const policyDoc = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: scannerPolicyName,
        })
      );
      expect(policyDoc.PolicyDocument).toBeDefined();

      const decodedPolicy = JSON.parse(
        decodeURIComponent(policyDoc.PolicyDocument!)
      );
      expect(decodedPolicy.Statement).toBeDefined();

      const hasEc2Permissions = decodedPolicy.Statement.some(
        (stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('ec2:DescribeInstances')
      );
      expect(hasEc2Permissions).toBe(true);

      const hasS3Permissions = decodedPolicy.Statement.some(
        (stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('s3:PutObject')
      );
      expect(hasS3Permissions).toBe(true);

      const hasCloudWatchPermissions = decodedPolicy.Statement.some(
        (stmt: any) =>
          stmt.Effect === 'Allow' &&
          Array.isArray(stmt.Action) &&
          stmt.Action.includes('cloudwatch:PutMetricData')
      );
      expect(hasCloudWatchPermissions).toBe(true);
    });
  });

  describe('EventBridge Rule', () => {
    it('should have weeklyRuleName in outputs', () => {
      expect(outputs.weeklyRuleName).toBeDefined();
      expect(typeof outputs.weeklyRuleName).toBe('string');
    });

    it('should verify EventBridge rule exists with correct schedule', async () => {
      const eventBridgeClient = new EventBridgeClient({ region });
      const ruleName = outputs.weeklyRuleName;

      const ruleResponse = await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(ruleResponse.Name).toBe(ruleName);
      expect(ruleResponse.ScheduleExpression).toBe('rate(7 days)');
      expect(ruleResponse.State).toBe('ENABLED');
      expect(ruleResponse.Description).toBe(
        'Trigger tagging compliance audit weekly'
      );
    });

    it('should verify EventBridge rule targets Lambda function', async () => {
      const eventBridgeClient = new EventBridgeClient({ region });
      const ruleName = outputs.weeklyRuleName;

      const targetsResponse = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: ruleName })
      );

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets!.length).toBeGreaterThan(0);

      const lambdaTarget = targetsResponse.Targets?.find((target) =>
        target.Arn?.includes(outputs.auditLambdaName)
      );
      expect(lambdaTarget).toBeDefined();
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should have logGroupName in outputs', () => {
      expect(outputs.logGroupName).toBeDefined();
      expect(typeof outputs.logGroupName).toBe('string');
    });

    it('should verify CloudWatch log group exists with retention', async () => {
      const logsClient = new CloudWatchLogsClient({ region });
      const logGroupName = outputs.logGroupName;

      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(logGroupsResponse.logGroups).toBeDefined();
      expect(logGroupsResponse.logGroups!.length).toBeGreaterThan(0);

      const logGroup = logGroupsResponse.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Complete Infrastructure', () => {
    it('should have all required outputs', () => {
      expect(outputs.reportBucketName).toBeDefined();
      expect(outputs.reportBucketArn).toBeDefined();
      expect(outputs.auditLambdaArn).toBeDefined();
      expect(outputs.auditLambdaName).toBeDefined();
      expect(outputs.weeklyRuleName).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
    });
  });
});
