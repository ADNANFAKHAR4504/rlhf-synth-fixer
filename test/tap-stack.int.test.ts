// import * as AWS from 'aws-sdk';
// import { TapStack } from '../lib/tap-stack';
// import * as cdk from 'aws-cdk-lib';

// // Integration tests require actual AWS resources
// // These tests should be run in a dedicated test environment
// describe('TapStack Integration Tests', () => {
//   let stackName: string;
//   let region: string;
//   let app: cdk.App;
//   let stack: TapStack;

//   beforeAll(async () => {
//     region = 'us-east-1';
//     stackName = `test-tap-stack-${Date.now()}`;

//     // Set AWS region for SDK clients
//     AWS.config.update({ region });

//     app = new cdk.App();
//     stack = new TapStack(app, stackName, {
//       // projectName: 'integration-test',
//       // environment: 'test',
//       vpcId: 'vpc-abc12345', // Replace with actual test VPC
//       env: { region, account: process.env.CDK_DEFAULT_ACCOUNT },
//     });
//   });

//   describe('S3 Bucket Security', () => {
//     let s3Client: AWS.S3;
//     let bucketName: string;

//     beforeAll(() => {
//       s3Client = new AWS.S3();
//       // bucketName = stack.securityBucket.bucketName;
//     });

//     // test('should block public access', async () => {
//     //   const response = await s3Client
//     //     .getPublicAccessBlock({
//     //       // Bucket: bucketName,
//     //     })
//     //     .promise();

//     //   expect(response.PublicAccessBlockConfiguration).toEqual({
//     //     BlockPublicAcls: true,
//     //     IgnorePublicAcls: true,
//     //     BlockPublicPolicy: true,
//     //     RestrictPublicBuckets: true,
//     //   });
//     // });

//     // test('should have encryption enabled', async () => {
//     //   const response = await s3Client
//     //     .getBucketEncryption({
//     //       Bucket: bucketName,
//     //     })
//     //     .promise();

//     //   // expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
//     // });

//     // test('should have versioning enabled', async () => {
//     //   const response = await s3Client
//     //     .getBucketVersioning({
//     //       Bucket: bucketName,
//     //     })
//     //     .promise();

//     //   expect(response.Status).toBe('Enabled');
//     // });
//   });

//   describe('CloudTrail Configuration', () => {
//     let cloudTrailClient: AWS.CloudTrail;
//     let trailName: string;

//     beforeAll(() => {
//       cloudTrailClient = new AWS.CloudTrail();
//       trailName = `integration-test-test-security-trail`;
//     });

//     test('should be configured correctly', async () => {
//       const response = await cloudTrailClient
//         .describeTrails({
//           trailNameList: [trailName],
//         })
//         .promise();

//       const trail = response.trailList?.[0];
//       expect(trail).toBeDefined();
//       expect(trail?.IncludeGlobalServiceEvents).toBe(true);
//       expect(trail?.IsMultiRegionTrail).toBe(true);
//       expect(trail?.LogFileValidationEnabled).toBe(true);
//     });

//     test('should have event selectors configured', async () => {
//       const response = await cloudTrailClient
//         .getEventSelectors({
//           TrailName: trailName,
//         })
//         .promise();

//       expect(response.EventSelectors).toHaveLength(1);
//       expect(response.EventSelectors?.[0].ReadWriteType).toBe('All');
//       expect(response.EventSelectors?.[0].IncludeManagementEvents).toBe(true);
//     });
//   });

//   describe('AWS Config Setup', () => {
//     let configClient: AWS.ConfigService;

//     beforeAll(() => {
//       configClient = new AWS.ConfigService();
//     });

//     test('should have configuration recorder enabled', async () => {
//       const response = await configClient
//         .describeConfigurationRecorders()
//         .promise();

//       const recorder = response.ConfigurationRecorders?.find(r =>
//         r.name?.includes('integration-test-test')
//       );

//       expect(recorder).toBeDefined();
//       expect(recorder?.recordingGroup?.allSupported).toBe(true);
//       expect(recorder?.recordingGroup?.includeGlobalResourceTypes).toBe(true);
//     });

//     test('should have compliance rules configured', async () => {
//       const response = await configClient.describeConfigRules().promise();

//       const s3Rule = response.ConfigRules?.find(rule =>
//         rule.ConfigRuleName?.includes('s3-bucket-public-read-prohibited')
//       );

//       expect(s3Rule).toBeDefined();
//       expect(s3Rule?.Source?.Owner).toBe('AWS');
//     });
//   });

//   describe('GuardDuty Configuration', () => {
//     let guardDutyClient: AWS.GuardDuty;

//     beforeAll(() => {
//       guardDutyClient = new AWS.GuardDuty();
//     });

//     test('should have detector enabled', async () => {
//       const response = await guardDutyClient.listDetectors().promise();

//       expect(response.DetectorIds).toHaveLength(1);

//       const detectorResponse = await guardDutyClient
//         .getDetector({
//           DetectorId: response.DetectorIds![0],
//         })
//         .promise();

//       expect(detectorResponse.Status).toBe('ENABLED');
//       expect(detectorResponse.FindingPublishingFrequency).toBe(
//         'FIFTEEN_MINUTES'
//       );
//     });
//   });

//   describe('KMS Key Configuration', () => {
//     let kmsClient: AWS.KMS;
//     let keyId: string;

//     beforeAll(() => {
//       kmsClient = new AWS.KMS();
//       // keyId = stack.kmsKey.keyId;
//     });

//     test('should have key rotation enabled', async () => {
//       const response = await kmsClient
//         .getKeyRotationStatus({
//           // KeyId: keyId,
//         })
//         .promise();

//       expect(response.KeyRotationEnabled).toBe(true);
//     });

//     test('should have proper key policy', async () => {
//       const response = await kmsClient
//         .getKeyPolicy({
//           KeyId: keyId,
//           PolicyName: 'default',
//         })
//         .promise();

//       const policy = JSON.parse(response.Policy!);
//       expect(policy.Statement).toHaveLength(2);

//       // Check root permissions
//       const rootStatement = policy.Statement.find((s: any) =>
//         s.Principal?.AWS?.includes(':root')
//       );
//       expect(rootStatement).toBeDefined();
//     });
//   });

//   describe('Systems Manager Configuration', () => {
//     let ssmClient: AWS.SSM;

//     beforeAll(() => {
//       ssmClient = new AWS.SSM();
//     });

//     test('should have patch baseline configured', async () => {
//       const response = await ssmClient
//         .describePatchBaselines({
//           Filters: [
//             {
//               Key: 'NAME_PREFIX',
//               Values: ['integration-test-test-security-patch-baseline'],
//             },
//           ],
//         })
//         .promise();

//       expect(response.BaselineIdentities).toHaveLength(1);
//       expect(response.BaselineIdentities?.[0].OperatingSystem).toBe(
//         'AMAZON_LINUX_2'
//       );
//     });

//     test('should have maintenance window configured', async () => {
//       const response = await ssmClient
//         .describeMaintenanceWindows({
//           Filters: [
//             {
//               Key: 'Name',
//               Values: ['integration-test-test-patch-maintenance-window'],
//             },
//           ],
//         })
//         .promise();

//       expect(response.WindowIdentities).toHaveLength(1);
//       expect(response.WindowIdentities?.[0].Duration).toBe(4);
//       expect(response.WindowIdentities?.[0].Cutoff).toBe(1);
//     });
//   });
// });
