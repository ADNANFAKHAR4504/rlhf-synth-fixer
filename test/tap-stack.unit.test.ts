// import * as cdk from 'aws-cdk-lib';
// import { Template, Match } from 'aws-cdk-lib/assertions';
// import { TapStack } from '../lib/tap-stack';

// export class TestUtils {
//   static createTestApp(): cdk.App {
//     return new cdk.App({
//       context: {
//         projectName: 'test',
//         environment: 'test',
//         vpcId: 'vpc-test12345',
//       },
//     });
//   }

//   static getTemplate(stack: cdk.Stack): Template {
//     return Template.fromStack(stack);
//   }
// }

// // Global test setup
// beforeEach(() => {
//   jest.clearAllMocks();
// });

// describe('TapStack', () => {
//   let app: cdk.App;
//   let stack: TapStack;
//   let template: Template;

//   beforeEach(() => {
//     app = TestUtils.createTestApp();
//     stack = new TapStack(app, 'TestTapStack', {
//       projectName: 'test',
//       environment: 'test',
//       vpcId: 'vpc-test12345',
//       env: { region: 'us-east-1', account: '123456789012' },
//     });
//     template = TestUtils.getTemplate(stack);
//   });

//   describe('KMS Key', () => {
//     test('should create KMS key with proper configuration', () => {
//       template.hasResourceProperties('AWS::KMS::Key', {
//         Description: 'KMS key for encrypting security-related resources',
//         EnableKeyRotation: true,
//         KeySpec: 'SYMMETRIC_DEFAULT',
//         KeyUsage: 'ENCRYPT_DECRYPT',
//       });
//     });

//     test('should create KMS alias', () => {
//       template.hasResourceProperties('AWS::KMS::Alias', {
//         AliasName: 'alias/test-test-security-key',
//       });
//     });
//   });

//   describe('S3 Security Bucket', () => {
//     test('should create encrypted S3 bucket', () => {
//       template.hasResourceProperties('AWS::S3::Bucket', {
//         BucketEncryption: {
//           ServerSideEncryptionConfiguration: [
//             {
//               ServerSideEncryptionByDefault: {
//                 SSEAlgorithm: 'aws:kms',
//               },
//             },
//           ],
//         },
//         PublicAccessBlockConfiguration: {
//           BlockPublicAcls: true,
//           BlockPublicPolicy: true,
//           IgnorePublicAcls: true,
//           RestrictPublicBuckets: true,
//         },
//         VersioningConfiguration: {
//           Status: 'Enabled',
//         },
//       });
//     });

//     test('should have lifecycle configuration', () => {
//       template.hasResourceProperties('AWS::S3::Bucket', {
//         LifecycleConfiguration: {
//           Rules: [
//             {
//               Id: 'security-logs-lifecycle',
//               Status: 'Enabled',
//               Transitions: [
//                 {
//                   StorageClass: 'STANDARD_IA',
//                   TransitionInDays: 30,
//                 },
//                 {
//                   StorageClass: 'GLACIER',
//                   TransitionInDays: 90,
//                 },
//               ],
//               ExpirationInDays: 2555,
//             },
//           ],
//         },
//       });
//     });

//     test('should deny unencrypted uploads', () => {
//       template.hasResourceProperties('AWS::S3::BucketPolicy', {
//         PolicyDocument: {
//           Statement: Match.arrayWith([
//             {
//               Effect: 'Deny',
//               Principal: '*',
//               Action: 's3:PutObject',
//               Condition: {
//                 StringNotEquals: {
//                   's3:x-amz-server-side-encryption': 'aws:kms',
//                 },
//               },
//             },
//           ]),
//         },
//       });
//     });
//   });

//   describe('CloudTrail', () => {
//     test('should create CloudTrail with proper configuration', () => {
//       template.hasResourceProperties('AWS::CloudTrail::Trail', {
//         IncludeGlobalServiceEvents: true,
//         IsMultiRegionTrail: true,
//         EnableLogFileValidation: true,
//         CloudWatchLogsLogGroupArn: Match.anyValue(),
//         InsightSelectors: [
//           {
//             InsightType: 'ApiCallRateInsight',
//           },
//         ],
//       });
//     });

//     test('should create CloudWatch log group for CloudTrail', () => {
//       template.hasResourceProperties('AWS::Logs::LogGroup', {
//         LogGroupName: '/aws/cloudtrail/test-test',
//         RetentionInDays: 365,
//       });
//     });
//   });

//   describe('AWS Config', () => {
//     test('should create Config configuration recorder', () => {
//       template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
//         RecordingGroup: {
//           AllSupported: true,
//           IncludeGlobalResourceTypes: true,
//         },
//       });
//     });

//     test('should create Config delivery channel', () => {
//       template.hasResourceProperties('AWS::Config::DeliveryChannel', {
//         S3KeyPrefix: 'config/',
//       });
//     });

//     test('should create compliance rules', () => {
//       // S3 bucket public read prohibited
//       template.hasResourceProperties('AWS::Config::ConfigRule', {
//         ConfigRuleName: 'test-test-s3-bucket-public-read-prohibited',
//         Source: {
//           Owner: 'AWS',
//           SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
//         },
//       });

//       // MFA enabled for IAM console access
//       template.hasResourceProperties('AWS::Config::ConfigRule', {
//         ConfigRuleName: 'test-test-mfa-enabled-for-iam-console-access',
//         Source: {
//           Owner: 'AWS',
//           SourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
//         },
//       });
//     });
//   });

//   describe('GuardDuty', () => {
//     test('should create GuardDuty detector', () => {
//       template.hasResourceProperties('AWS::GuardDuty::Detector', {
//         Enable: true,
//         FindingPublishingFrequency: 'FIFTEEN_MINUTES',
//         DataSources: {
//           S3Logs: { Enable: true },
//           Kubernetes: { AuditLogs: { Enable: true } },
//           MalwareProtection: {
//             ScanEc2InstanceWithFindings: { EbsVolumes: true },
//           },
//         },
//       });
//     });

//     test('should create EventBridge rule for GuardDuty findings', () => {
//       template.hasResourceProperties('AWS::Events::Rule', {
//         EventPattern: {
//           source: ['aws.guardduty'],
//           'detail-type': ['GuardDuty Finding'],
//         },
//       });
//     });
//   });

//   describe('WAF', () => {
//     test('should create WAF WebACL with managed rules', () => {
//       template.hasResourceProperties('AWS::WAFv2::WebACL', {
//         Scope: 'CLOUDFRONT',
//         DefaultAction: { Allow: {} },
//         Rules: Match.arrayWith([
//           {
//             Name: 'AWS-AWSManagedRulesCommonRuleSet',
//             Priority: 1,
//             Statement: {
//               ManagedRuleGroupStatement: {
//                 VendorName: 'AWS',
//                 Name: 'AWSManagedRulesCommonRuleSet',
//               },
//             },
//           },
//           {
//             Name: 'RateLimitRule',
//             Priority: 3,
//             Action: { Block: {} },
//             Statement: {
//               RateBasedStatement: {
//                 Limit: 2000,
//                 AggregateKeyType: 'IP',
//               },
//             },
//           },
//         ]),
//       });
//     });
//   });

//   describe('IAM Configuration', () => {
//     test('should create MFA-required group', () => {
//       template.hasResourceProperties('AWS::IAM::Group', {
//         GroupName: 'test-test-mfa-required-group',
//       });
//     });

//     test('should create force MFA policy', () => {
//       template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
//         ManagedPolicyName: 'test-test-force-mfa-policy',
//         PolicyDocument: {
//           Statement: [
//             {
//               Effect: 'Deny',
//               NotAction: Match.arrayWith([
//                 'iam:CreateVirtualMFADevice',
//                 'iam:EnableMFADevice',
//                 'sts:GetSessionToken',
//               ]),
//               Resource: '*',
//               Condition: {
//                 BoolIfExists: {
//                   'aws:MultiFactorAuthPresent': 'false',
//                 },
//               },
//             },
//           ],
//         },
//       });
//     });

//     test('should create application role with least privilege', () => {
//       template.hasResourceProperties('AWS::IAM::Role', {
//         RoleName: 'test-test-app-role',
//         AssumeRolePolicyDocument: {
//           Statement: [
//             {
//               Effect: 'Allow',
//               Principal: { Service: 'ec2.amazonaws.com' },
//               Action: 'sts:AssumeRole',
//             },
//           ],
//         },
//       });
//     });
//   });

//   describe('Systems Manager', () => {
//     test('should create patch baseline', () => {
//       template.hasResourceProperties('AWS::SSM::PatchBaseline', {
//         Name: 'test-test-security-patch-baseline',
//         OperatingSystem: 'AMAZON_LINUX_2',
//         ApprovalRules: {
//           PatchRules: [
//             {
//               PatchFilterGroup: {
//                 PatchFilters: [
//                   {
//                     Key: 'CLASSIFICATION',
//                     Values: ['Security', 'Critical'],
//                   },
//                 ],
//               },
//               ApproveAfterDays: 0,
//               ComplianceLevel: 'CRITICAL',
//             },
//           ],
//         },
//       });
//     });

//     test('should create maintenance window', () => {
//       template.hasResourceProperties('AWS::SSM::MaintenanceWindow', {
//         Name: 'test-test-patch-maintenance-window',
//         Duration: 4,
//         Cutoff: 1,
//         Schedule: 'cron(0 2 ? * SUN *)',
//         AllowUnassociatedTargets: false,
//       });
//     });
//   });

//   describe('Lambda Remediation', () => {
//     test('should create remediation function', () => {
//       template.hasResourceProperties('AWS::Lambda::Function', {
//         FunctionName: 'test-test-security-remediation',
//         Runtime: 'python3.9',
//         Handler: 'index.handler',
//         Timeout: 300,
//         Environment: {
//           Variables: {
//             PROJECT_NAME: 'test',
//             ENVIRONMENT: 'test',
//           },
//         },
//       });
//     });

//     test('should create remediation role with proper permissions', () => {
//       template.hasResourceProperties('AWS::IAM::Role', {
//         RoleName: 'test-test-remediation-role',
//         AssumeRolePolicyDocument: {
//           Statement: [
//             {
//               Effect: 'Allow',
//               Principal: { Service: 'lambda.amazonaws.com' },
//               Action: 'sts:AssumeRole',
//             },
//           ],
//         },
//       });
//     });
//   });

//   describe('Monitoring', () => {
//     test('should create EventBridge rules for monitoring', () => {
//       // Config compliance changes
//       template.hasResourceProperties('AWS::Events::Rule', {
//         EventPattern: {
//           source: ['aws.config'],
//           'detail-type': ['Config Rules Compliance Change'],
//         },
//       });

//       // Unauthorized API calls
//       template.hasResourceProperties('AWS::Events::Rule', {
//         EventPattern: {
//           source: ['aws.cloudtrail'],
//           detail: {
//             errorCode: ['UnauthorizedOperation', 'AccessDenied'],
//           },
//         },
//       });
//     });

//     test('should create security alerts log group', () => {
//       template.hasResourceProperties('AWS::Logs::LogGroup', {
//         LogGroupName: '/aws/events/security-alerts/test-test',
//         RetentionInDays: 365,
//       });
//     });
//   });

//   describe('Resource Tagging', () => {
//     test('should apply consistent tags to resources', () => {
//       const resources = template.findResources('AWS::S3::Bucket');
//       Object.values(resources).forEach(resource => {
//         expect(resource.Properties?.Tags).toEqual(
//           expect.arrayContaining([
//             expect.objectContaining({ Key: 'Project', Value: 'test' }),
//             expect.objectContaining({ Key: 'Environment', Value: 'test' }),
//             expect.objectContaining({ Key: 'Owner', Value: 'SecurityTeam' }),
//             expect.objectContaining({ Key: 'Compliance', Value: 'Required' }),
//           ])
//         );
//       });
//     });
//   });
// });
