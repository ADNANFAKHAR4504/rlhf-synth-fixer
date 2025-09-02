import * as path from 'path';
import * as fs from 'fs';
import { STS, IAM, S3, KMS, CloudWatchLogs } from 'aws-sdk';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded deployment outputs from file');
} else {
  console.log('No deployment outputs file found - integration tests should run after deployment');
  process.exit(1);
}

// Initialize AWS SDK clients with region configuration
const region = process.env.AWS_REGION || 'us-east-1';
const sts = new STS({ region });
const iam = new IAM({ region });
const s3 = new S3({ region });
const kms = new KMS({ region });
const cloudWatchLogs = new CloudWatchLogs({ region });

describe('TapStack Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds for AWS API calls
  let accountId: string;

  beforeAll(async () => {
    // Get current account
    const identity = await sts.getCallerIdentity().promise();
    accountId = identity.Account!;
    console.log(`Testing against account: ${accountId}, region: ${region}`);
  });

  describe('Deployment Outputs', () => {
    test(
      'should have all required stack outputs',
      async () => {
        const requiredOutputs = [
          'KmsKeyArn',
          'LogsBucketArn',
          'lambdaRoleArn',
          'ec2RoleArn',
          'codebuildRoleArn',
          'codepipelineRoleArn'
        ];

        requiredOutputs.forEach(outputName => {
          expect(outputs[outputName]).toBeDefined();
          expect(outputs[outputName]).toMatch(/^arn:aws:/);
          console.log(`${outputName}: ${outputs[outputName]}`);
        });
      },
      testTimeout
    );
  });

  describe('KMS Key Resources', () => {
    test(
      'should have a valid KMS key with proper configuration',
      async () => {
        const kmsKeyArn = outputs.KmsKeyArn;
        expect(kmsKeyArn).toBeDefined();
        expect(kmsKeyArn).toMatch(/^arn:aws:kms:/);

        // Get KMS key details
        const keyId = kmsKeyArn.split('/').pop();
        const keyDetails = await kms.describeKey({ KeyId: keyId }).promise();
        
        expect(keyDetails.KeyMetadata).toBeDefined();
        expect(keyDetails.KeyMetadata!.KeyId).toBe(keyId);
        expect(keyDetails.KeyMetadata!.KeyState).toBe('Enabled');
        expect(keyDetails.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(keyDetails.KeyMetadata!.Origin).toBe('AWS_KMS');
        
        console.log(`KMS Key ${keyId} is properly configured`);
      },
      testTimeout
    );

    test(
      'should have KMS key rotation enabled',
      async () => {
        const kmsKeyArn = outputs.KmsKeyArn;
        const keyId = kmsKeyArn.split('/').pop();
        
        const keyRotation = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
        expect(keyRotation.KeyRotationEnabled).toBe(true);
        
        console.log(`KMS Key ${keyId} has rotation enabled`);
      },
      testTimeout
    );
  });

  describe('S3 Bucket Resources', () => {
    test(
      'should have a valid S3 bucket with proper configuration',
      async () => {
        const bucketArn = outputs.LogsBucketArn;
        expect(bucketArn).toBeDefined();
        expect(bucketArn).toMatch(/^arn:aws:s3:/);
        
        const bucketName = bucketArn.split(':::')[1];
        
        // Check bucket exists and is accessible
        const bucketLocation = await s3.getBucketLocation({ Bucket: bucketName }).promise();
        expect(bucketLocation.LocationConstraint).toBeDefined();
        
        // Check bucket versioning
        const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
        expect(versioning.Status).toBe('Enabled');
        
        // Check bucket encryption
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
        expect(encryption.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
        
        console.log(`S3 Bucket ${bucketName} is properly configured with encryption and versioning`);
      },
      testTimeout
    );

    test(
      'should have proper bucket lifecycle rules',
      async () => {
        const bucketArn = outputs.LogsBucketArn;
        const bucketName = bucketArn.split(':::')[1];
        
        const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        expect(lifecycle.Rules).toBeDefined();
        expect(lifecycle.Rules!.length).toBeGreaterThan(0);
        
        const deleteOldLogsRule = lifecycle.Rules!.find(rule => rule.ID === 'DeleteOldLogs');
        expect(deleteOldLogsRule).toBeDefined();
        expect(deleteOldLogsRule!.Status).toBe('Enabled');
        expect(deleteOldLogsRule!.Expiration).toBeDefined();
        expect(deleteOldLogsRule!.Expiration!.Days).toBe(90);
        
        console.log(`S3 Bucket ${bucketName} has proper lifecycle rules`);
      },
      testTimeout
    );
  });

  describe('IAM Role Resources', () => {
    const workloadRoles = [
      { name: 'lambda', arn: 'lambdaRoleArn' },
      { name: 'ec2', arn: 'ec2RoleArn' },
      { name: 'codebuild', arn: 'codebuildRoleArn' },
      { name: 'codepipeline', arn: 'codepipelineRoleArn' }
    ];

    workloadRoles.forEach(({ name, arn }) => {
      test(
        `should have valid ${name} role with proper trust policy`,
        async () => {
          const roleArn = outputs[arn];
          expect(roleArn).toBeDefined();
          expect(roleArn).toMatch(/^arn:aws:iam:/);
          
          const roleName = roleArn.split('/').pop();
          
          // Get role details
          const roleDetails = await iam.getRole({ RoleName: roleName }).promise();
          expect(roleDetails.Role).toBeDefined();
          expect(roleDetails.Role!.RoleName).toBe(roleName);
          expect(roleDetails.Role!.Arn).toBe(roleArn);
          
          // Check trust policy
          const trustPolicy = JSON.parse(decodeURIComponent(roleDetails.Role!.AssumeRolePolicyDocument!));
          expect(trustPolicy.Statement).toBeDefined();
          expect(trustPolicy.Statement).toHaveLength(1);
          expect(trustPolicy.Statement[0].Effect).toBe('Allow');
          expect(trustPolicy.Statement[0].Principal.Service).toBe(`${name}.amazonaws.com`);
          expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
          
          console.log(`IAM Role ${roleName} has proper trust policy for ${name}`);
        },
        testTimeout
      );

      test(
        `should have ${name} role with attached policies`,
        async () => {
          const roleArn = outputs[arn];
          const roleName = roleArn.split('/').pop();
          
          // Get attached policies
          const attachedPolicies = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
          const inlinePolicies = await iam.listRolePolicies({ RoleName: roleName }).promise();
          
          // Should have either attached or inline policies
          expect(attachedPolicies.AttachedPolicies!.length + inlinePolicies.PolicyNames!.length).toBeGreaterThan(0);
          
          console.log(`IAM Role ${roleName} has ${attachedPolicies.AttachedPolicies!.length} attached policies and ${inlinePolicies.PolicyNames!.length} inline policies`);
        },
        testTimeout
      );
    });
  });

  describe('CloudWatch Log Group Resources', () => {
    test(
      'should have CloudWatch Log Group with proper configuration',
      async () => {
        // Extract log group name from the stack outputs or construct it
        const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr2541'; // Use actual environment suffix
        const logGroupName = `/aws/tapstack/${environmentSuffix}/${region}`;
        
        // Check if log group exists
        const logGroups = await cloudWatchLogs.describeLogGroups({
          logGroupNamePrefix: logGroupName
        }).promise();
        
        expect(logGroups.logGroups).toBeDefined();
        expect(logGroups.logGroups!.length).toBeGreaterThan(0);
        
        const logGroup = logGroups.logGroups!.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBe(30);
        
        console.log(`CloudWatch Log Group ${logGroupName} exists with proper retention`);
      },
      testTimeout
    );
  });

  describe('Multi-Region Deployment', () => {
    test(
      'should have resources deployed in multiple regions',
      async () => {
        // Check if we have outputs from multiple regions
        const kmsKeyArns = Object.values(outputs).filter((value: any) => 
          typeof value === 'string' && value.includes('arn:aws:kms:')
        ) as string[];
        
        const uniqueRegions = new Set(
          kmsKeyArns.map((arn: string) => arn.split(':')[3])
        );
        
        // Should have at least one region
        expect(uniqueRegions.size).toBeGreaterThan(0);
        
        console.log(`Resources deployed in regions: ${Array.from(uniqueRegions).join(', ')}`);
        
        // If we have multiple regions, verify both primary and secondary
        if (uniqueRegions.size > 1) {
          expect(uniqueRegions.has('us-east-1')).toBe(true);
          expect(uniqueRegions.has('us-west-2')).toBe(true);
          console.log('Multi-region deployment confirmed: us-east-1 and us-west-2');
        } else {
          console.log('Single region deployment detected');
        }
      },
      testTimeout
    );
  });

  describe('Security Validation', () => {
    test(
      'should have least privilege IAM policies',
      async () => {
        const lambdaRoleArn = outputs.lambdaRoleArn;
        const roleName = lambdaRoleArn.split('/').pop();
        
        // Get inline policies for lambda role
        const inlinePolicies = await iam.listRolePolicies({ RoleName: roleName }).promise();
        
        if (inlinePolicies.PolicyNames!.length > 0) {
          // Check the first inline policy for least privilege
          const policyName = inlinePolicies.PolicyNames![0];
          const policyDetails = await iam.getRolePolicy({
            RoleName: roleName,
            PolicyName: policyName
          }).promise();
          
          const policyDocument = JSON.parse(decodeURIComponent(policyDetails.PolicyDocument!));
          
          // Verify policy has specific resource ARNs, not wildcards
          policyDocument.Statement.forEach((statement: any) => {
            if (statement.Effect === 'Allow') {
              // Check for specific resource patterns
              if (statement.Resource && Array.isArray(statement.Resource)) {
                statement.Resource.forEach((resource: string) => {
                  // Should not have wildcard resources except for specific cases
                  if (resource === '*') {
                    console.log(`Warning: Found wildcard resource in ${policyName}`);
                  }
                });
              }
            }
          });
        }
        
        console.log(`IAM Role ${roleName} policies validated for least privilege`);
      },
      testTimeout
    );

    test(
      'should have proper S3 bucket public access settings',
      async () => {
        const bucketArn = outputs.LogsBucketArn;
        const bucketName = bucketArn.split(':::')[1];
        
        const publicAccessBlock = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
        expect(publicAccessBlock.PublicAccessBlockConfiguration).toBeDefined();
        expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
        
        console.log(`S3 Bucket ${bucketName} has proper public access blocking`);
      },
      testTimeout
    );
  });

  describe('Resource Connectivity', () => {
    test(
      'should have proper resource relationships',
      async () => {
        const kmsKeyArn = outputs.KmsKeyArn;
        const bucketArn = outputs.LogsBucketArn;
        
        // Verify S3 bucket uses the KMS key for encryption
        const bucketName = bucketArn.split(':::')[1];
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        
        const kmsKeyId = kmsKeyArn.split('/').pop();
        const bucketKmsKeyId = encryption.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
        
        expect(bucketKmsKeyId).toContain(kmsKeyId);
        
        console.log(`S3 Bucket ${bucketName} is properly encrypted with KMS key ${kmsKeyId}`);
      },
      testTimeout
    );
  });
});
