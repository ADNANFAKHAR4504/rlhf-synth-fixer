import * as AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const kms = new AWS.KMS();
const iam = new AWS.IAM();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();
const cloudTrail = new AWS.CloudTrail();
const sns = new AWS.SNS();
const cloudWatchLogs = new AWS.CloudWatchLogs();
const ec2 = new AWS.EC2();
const lambda = new AWS.Lambda();

describe('Financial Services Security Infrastructure Integration Tests', () => {
  
  describe('Complete Security Flow Test', () => {
    test('End-to-end security infrastructure validation', async () => {
      // Test 1: Verify KMS key exists and has proper configuration
      const kmsKeyArn = outputs.KmsKeyArn;
      expect(kmsKeyArn).toBeDefined();
      
      const keyId = kmsKeyArn.split('/')[1];
      const keyDetails = await kms.describeKey({ KeyId: keyId }).promise();
      
      expect(keyDetails.KeyMetadata?.Description).toContain('Customer-managed key');
      expect(keyDetails.KeyMetadata?.KeyRotationStatus).toBe(true);
      expect(keyDetails.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyDetails.KeyMetadata?.Origin).toBe('AWS_KMS');

      // Test 2: Verify permission boundary exists and has proper restrictions
      const permissionBoundaryArn = outputs.PermissionBoundaryArn;
      expect(permissionBoundaryArn).toBeDefined();
      
      const permissionBoundaryName = permissionBoundaryArn.split('/')[1];
      const boundaryPolicy = await iam.getManagedPolicy({
        PolicyArn: permissionBoundaryArn
      }).promise();
      
      const policyVersion = await iam.getPolicyVersion({
        PolicyArn: permissionBoundaryArn,
        VersionId: boundaryPolicy.Policy?.DefaultVersionId || 'v1'
      }).promise();
      
      const policyDocument = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion?.Document || '{}'));
      const denyStatements = policyDocument.Statement.filter((s: any) => s.Effect === 'Deny');
      
      expect(denyStatements.length).toBeGreaterThan(0);
      
      // Verify privilege escalation actions are denied
      const privilegeEscalationActions = [
        'iam:CreateRole',
        'iam:AttachRolePolicy', 
        'iam:PutRolePolicy',
        'iam:PassRole'
      ];
      
      const hasPrivilegeEscalationDenial = denyStatements.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return privilegeEscalationActions.some(action => actions.includes(action));
      });
      
      expect(hasPrivilegeEscalationDenial).toBe(true);

      // Test 3: Verify developer role has permission boundary and limited access
      const developerRoleArn = outputs.DeveloperRoleArn;
      expect(developerRoleArn).toBeDefined();
      
      const roleName = developerRoleArn.split('/')[1];
      const roleDetails = await iam.getRole({ RoleName: roleName }).promise();
      
      expect(roleDetails.Role.PermissionsBoundary?.PermissionsBoundaryArn).toBe(permissionBoundaryArn);
      
      const rolePolicies = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
      const hasReadOnlyAccess = rolePolicies.AttachedPolicies?.some(
        policy => policy.PolicyName === 'ReadOnlyAccess'
      );
      expect(hasReadOnlyAccess).toBe(true);

      // Test 4: Verify secrets are encrypted with customer KMS key
      const secretArn = outputs.SecretArn;
      expect(secretArn).toBeDefined();
      
      const secretDetails = await secretsManager.describeSecret({ SecretId: secretArn }).promise();
      expect(secretDetails.KmsKeyId).toBe(keyId);
      
      // Test secret rotation configuration
      expect(secretDetails.RotationEnabled).toBe(true);
      expect(secretDetails.RotationRules?.AutomaticallyAfterDays).toBe(30);

      // Test 5: Verify S3 audit bucket security configuration
      const auditBucketName = outputs.AuditBucketName;
      expect(auditBucketName).toBeDefined();
      
      const bucketEncryption = await s3.getBucketEncryption({ Bucket: auditBucketName }).promise();
      const sseKms = bucketEncryption.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault;
      
      expect(sseKms?.SSEAlgorithm).toBe('aws:kms');
      expect(sseKms?.KMSMasterKeyID).toBe(keyId);
      
      // Test bucket public access block
      const publicAccessBlock = await s3.getPublicAccessBlock({ Bucket: auditBucketName }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Test bucket lifecycle configuration for compliance retention
      const lifecycleConfig = await s3.getBucketLifecycleConfiguration({ Bucket: auditBucketName }).promise();
      const auditRetentionRule = lifecycleConfig.Rules?.find(rule => rule.ID === 'audit-retention');
      
      expect(auditRetentionRule).toBeDefined();
      expect(auditRetentionRule?.Expiration?.Days).toBe(2555); // 7 years
      
      const transitions = auditRetentionRule?.Transitions || [];
      const iaTransition = transitions.find(t => t.StorageClass === 'STANDARD_IA');
      const glacierTransition = transitions.find(t => t.StorageClass === 'GLACIER');
      
      expect(iaTransition?.Days).toBe(30);
      expect(glacierTransition?.Days).toBe(90);

      // Test 6: Verify CloudTrail configuration
      const trails = await cloudTrail.describeTrails().promise();
      const auditTrail = trails.trailList?.find(trail => 
        trail.S3BucketName === auditBucketName
      );
      
      expect(auditTrail).toBeDefined();
      expect(auditTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(auditTrail?.IsMultiRegionTrail).toBe(true);
      expect(auditTrail?.LogFileValidationEnabled).toBe(true);
      expect(auditTrail?.KMSKeyId).toBe(kmsKeyArn);

      // Test 7: Verify SNS topic encryption and subscription
      const securityAlertsTopicArn = outputs.SecurityAlertsTopicArn;
      expect(securityAlertsTopicArn).toBeDefined();
      
      const topicAttributes = await sns.getTopicAttributes({ TopicArn: securityAlertsTopicArn }).promise();
      expect(topicAttributes.Attributes?.KmsMasterKeyId).toBe(keyId);
      
      const subscriptions = await sns.listSubscriptionsByTopic({ TopicArn: securityAlertsTopicArn }).promise();
      const emailSubscription = subscriptions.Subscriptions?.find(sub => sub.Protocol === 'email');
      expect(emailSubscription).toBeDefined();

      // Test 8: Verify VPC isolation and network security
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      // Verify no internet gateway attached (isolated VPC)
      const internetGateways = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();
      
      expect(internetGateways.InternetGateways?.length).toBe(0);
      
      // Verify private/isolated subnets exist
      const subnets = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();
      
      const privateSubnets = subnets.Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Isolated'
        )
      );
      
      expect(privateSubnets?.length).toBeGreaterThan(0);

      // Test 9: Verify Lambda deployment in secure network
      const functions = await lambda.listFunctions().promise();
      const rotationFunction = functions.Functions?.find(fn => 
        fn.FunctionName?.includes('Rotation') && 
        fn.FunctionName?.includes(environmentSuffix)
      );
      
      expect(rotationFunction).toBeDefined();
      expect(rotationFunction?.VpcConfig?.VpcId).toBe(vpcId);
      expect(rotationFunction?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      
      // Verify Lambda has no internet access (should be in isolated subnets)
      const lambdaSubnets = rotationFunction?.VpcConfig?.SubnetIds || [];
      const lambdaSubnetDetails = await ec2.describeSubnets({
        SubnetIds: lambdaSubnets
      }).promise();
      
      const allSubnetsIsolated = lambdaSubnetDetails.Subnets?.every(subnet =>
        subnet.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Isolated'
        )
      );
      
      expect(allSubnetsIsolated).toBe(true);

      // Test 10: Verify CloudWatch Logs encryption
      const logGroups = await cloudWatchLogs.describeLogGroups().promise();
      const securityLogGroups = logGroups.logGroups?.filter(lg =>
        lg.logGroupName?.includes(environmentSuffix)
      );
      
      expect(securityLogGroups?.length).toBeGreaterThan(0);
      
      securityLogGroups?.forEach(logGroup => {
        expect(logGroup.kmsKeyId).toBe(kmsKeyArn);
        expect(logGroup.retentionInDays).toBe(365);
      });

      // Test 11: Verify resource tagging compliance
      const taggedResources = [
        { resourceArn: kmsKeyArn, service: 'kms' },
        { resourceArn: secretArn, service: 'secretsmanager' },
        { resourceArn: securityAlertsTopicArn, service: 'sns' }
      ];
      
      const requiredTags = ['Environment', 'Team', 'ComplianceLevel', 'DataClassification'];
      
      for (const resource of taggedResources) {
        let tags: any[] = [];
        
        if (resource.service === 'kms') {
          const kmsTagsResponse = await kms.listResourceTags({ KeyId: keyId }).promise();
          tags = kmsTagsResponse.Tags || [];
        } else if (resource.service === 'secretsmanager') {
          const secretTagsResponse = await secretsManager.describeSecret({ SecretId: secretArn }).promise();
          tags = secretTagsResponse.Tags || [];
        } else if (resource.service === 'sns') {
          const snsTagsResponse = await sns.listTagsForResource({ ResourceArn: securityAlertsTopicArn }).promise();
          tags = snsTagsResponse.Tags || [];
        }
        
        requiredTags.forEach(requiredTag => {
          const hasRequiredTag = tags.some(tag => 
            tag.TagKey === requiredTag || tag.Key === requiredTag
          );
          expect(hasRequiredTag).toBe(true);
        });
      }
      
      console.log('✅ All security infrastructure components validated successfully');
      console.log(`✅ Environment: ${environmentSuffix}`);
      console.log(`✅ KMS Key: ${keyId}`);
      console.log(`✅ Audit Bucket: ${auditBucketName}`);
      console.log(`✅ VPC: ${vpcId}`);
      console.log(`✅ Security compliance verified`);
      
    }, 300000); // 5 minute timeout for comprehensive integration test
  });

  describe('Security Monitoring Tests', () => {
    test('CloudWatch alarms are configured for security events', async () => {
      const cloudWatch = new AWS.CloudWatch();
      const alarms = await cloudWatch.describeAlarms().promise();
      
      const securityAlarms = alarms.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes(environmentSuffix) &&
        (alarm.AlarmName?.includes('Security') || 
         alarm.AlarmName?.includes('Failed') ||
         alarm.AlarmName?.includes('Unauthorized'))
      );
      
      expect(securityAlarms?.length).toBeGreaterThan(0);
      
      securityAlarms?.forEach(alarm => {
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
        
        // Verify alarm actions point to security alerts SNS topic
        const snsAction = alarm.AlarmActions?.find(action => 
          action.includes('sns:') && action.includes(environmentSuffix)
        );
        expect(snsAction).toBeDefined();
      });
    });
  });

  describe('Secret Rotation Functionality', () => {
    test('Secret rotation Lambda can be invoked successfully', async () => {
      const functions = await lambda.listFunctions().promise();
      const rotationFunction = functions.Functions?.find(fn => 
        fn.FunctionName?.includes('Rotation') && 
        fn.FunctionName?.includes(environmentSuffix)
      );
      
      expect(rotationFunction).toBeDefined();
      
      // Test Lambda invocation with sample rotation event
      const testEvent = {
        Step: 'createSecret',
        SecretId: outputs.SecretArn,
        ClientRequestToken: 'test-rotation-token'
      };
      
      const invocationResult = await lambda.invoke({
        FunctionName: rotationFunction?.FunctionName || '',
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      }).promise();
      
      expect(invocationResult.StatusCode).toBe(200);
      
      const responsePayload = JSON.parse(invocationResult.Payload as string);
      expect(responsePayload.statusCode).toBe(200);
    });
  });

  describe('IAM Security Validation', () => {
    test('Developer role cannot perform privilege escalation', async () => {
      const developerRoleArn = outputs.DeveloperRoleArn;
      const roleName = developerRoleArn.split('/')[1];
      
      // Simulate policy evaluation for privilege escalation actions
      const privilegeEscalationActions = [
        'iam:CreateRole',
        'iam:AttachRolePolicy',
        'iam:PutRolePolicy'
      ];
      
      for (const action of privilegeEscalationActions) {
        const simulationResult = await iam.simulatePrincipalPolicy({
          PolicySourceArn: developerRoleArn,
          ActionNames: [action],
          ResourceArns: ['*']
        }).promise();
        
        const evaluation = simulationResult.EvaluationResults?.[0];
        expect(evaluation?.EvalDecision).toBe('explicitDeny');
      }
    });
  });

  describe('Network Isolation Verification', () => {
    test('Lambda functions cannot access internet', async () => {
      const functions = await lambda.listFunctions().promise();
      const vpcLambdas = functions.Functions?.filter(fn => 
        fn.VpcConfig?.VpcId && fn.FunctionName?.includes(environmentSuffix)
      );
      
      expect(vpcLambdas?.length).toBeGreaterThan(0);
      
      for (const lambdaFunc of vpcLambdas || []) {
        const subnetIds = lambdaFunc.VpcConfig?.SubnetIds || [];
        
        for (const subnetId of subnetIds) {
          const routeTables = await ec2.describeRouteTables({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: [subnetId]
              }
            ]
          }).promise();
          
          // Verify no routes to internet gateway
          const hasInternetRoute = routeTables.RouteTables?.some(rt =>
            rt.Routes?.some(route => 
              route.DestinationCidrBlock === '0.0.0.0/0' && 
              route.GatewayId?.startsWith('igw-')
            )
          );
          
          expect(hasInternetRoute).toBe(false);
        }
      }
    });
  });
});