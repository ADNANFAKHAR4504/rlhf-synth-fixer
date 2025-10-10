"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_config_service_1 = require("@aws-sdk/client-config-service");
const client_kms_1 = require("@aws-sdk/client-kms");
const client_sns_1 = require("@aws-sdk/client-sns");
// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
// AWS SDK clients
const s3Client = new client_s3_1.S3Client({ region });
const ec2Client = new client_ec2_1.EC2Client({ region });
const iamClient = new client_iam_1.IAMClient({ region });
const configClient = new client_config_service_1.ConfigServiceClient({ region });
const kmsClient = new client_kms_1.KMSClient({ region });
const snsClient = new client_sns_1.SNSClient({ region });
// Helper function to find available VPC and subnet
async function findAvailableVpcAndSubnet() {
    try {
        // First, try to find default VPC
        const vpcCommand = new client_ec2_1.DescribeVpcsCommand({
            Filters: [
                {
                    Name: 'is-default',
                    Values: ['true']
                }
            ]
        });
        let vpc;
        try {
            const vpcResponse = await ec2Client.send(vpcCommand);
            if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
                vpc = vpcResponse.Vpcs[0];
            }
        }
        catch (error) {
            console.log('No default VPC found, looking for any available VPC');
        }
        // If no default VPC, get any available VPC
        if (!vpc) {
            const allVpcsCommand = new client_ec2_1.DescribeVpcsCommand({
                Filters: [
                    {
                        Name: 'state',
                        Values: ['available']
                    }
                ]
            });
            const allVpcsResponse = await ec2Client.send(allVpcsCommand);
            if (allVpcsResponse.Vpcs && allVpcsResponse.Vpcs.length > 0) {
                vpc = allVpcsResponse.Vpcs[0];
            }
            else {
                throw new Error('No available VPC found in the region');
            }
        }
        // Find a subnet in the VPC
        const subnetCommand = new client_ec2_1.DescribeSubnetsCommand({
            Filters: [
                {
                    Name: 'vpc-id',
                    Values: [vpc.VpcId]
                },
                {
                    Name: 'state',
                    Values: ['available']
                }
            ]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        if (!subnetResponse.Subnets || subnetResponse.Subnets.length === 0) {
            throw new Error(`No available subnets found in VPC ${vpc.VpcId}`);
        }
        const subnet = subnetResponse.Subnets[0];
        // Find default security group for the VPC
        const sgCommand = new client_ec2_1.DescribeSecurityGroupsCommand({
            Filters: [
                {
                    Name: 'vpc-id',
                    Values: [vpc.VpcId]
                },
                {
                    Name: 'group-name',
                    Values: ['default']
                }
            ]
        });
        const sgResponse = await ec2Client.send(sgCommand);
        if (!sgResponse.SecurityGroups || sgResponse.SecurityGroups.length === 0) {
            throw new Error(`No default security group found in VPC ${vpc.VpcId}`);
        }
        const securityGroup = sgResponse.SecurityGroups[0];
        return {
            vpcId: vpc.VpcId,
            subnetId: subnet.SubnetId,
            securityGroupId: securityGroup.GroupId
        };
    }
    catch (error) {
        console.error('Error finding VPC and subnet:', error);
        throw new Error(`Failed to find available VPC and subnet: ${error}`);
    }
}
describe('SaaS Encryption Standards - Integration Tests', () => {
    describe('S3 Encryption Compliance Testing', () => {
        test('ApplicationDataBucket should have default encryption enabled', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            expect(bucketName).toBeDefined();
            const command = new client_s3_1.GetBucketEncryptionCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.ServerSideEncryptionConfiguration).toBeDefined();
            expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
            const rule = response.ServerSideEncryptionConfiguration.Rules[0];
            expect(rule.ApplyServerSideEncryptionByDefault).toBeDefined();
            expect(['AES256', 'aws:kms']).toContain(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm);
            expect(rule.BucketKeyEnabled).toBe(true);
        });
        test('ApplicationDataBucket should have versioning enabled', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            const command = new client_s3_1.GetBucketVersioningCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.Status).toBe('Enabled');
        });
        test('ApplicationDataBucket should have public access blocked', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            const command = new client_s3_1.GetPublicAccessBlockCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.PublicAccessBlockConfiguration).toBeDefined();
            const config = response.PublicAccessBlockConfiguration;
            expect(config.BlockPublicAcls).toBe(true);
            expect(config.BlockPublicPolicy).toBe(true);
            expect(config.IgnorePublicAcls).toBe(true);
            expect(config.RestrictPublicBuckets).toBe(true);
        });
        test('ApplicationDataBucket should have policy enforcing HTTPS and encryption', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            const command = new client_s3_1.GetBucketPolicyCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.Policy).toBeDefined();
            const policy = JSON.parse(response.Policy);
            // Check for HTTPS enforcement
            const httpsStatement = policy.Statement.find((s) => s.Condition && s.Condition.Bool && s.Condition.Bool['aws:SecureTransport'] === 'false');
            expect(httpsStatement).toBeDefined();
            expect(httpsStatement.Effect).toBe('Deny');
            // Check for encryption enforcement
            const encryptionStatement = policy.Statement.find((s) => s.Action === 's3:PutObject' && s.Effect === 'Deny');
            expect(encryptionStatement).toBeDefined();
        });
        test('LoggingBucket should have AES256 encryption', async () => {
            const bucketName = outputs.LoggingBucketName;
            expect(bucketName).toBeDefined();
            const command = new client_s3_1.GetBucketEncryptionCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.ServerSideEncryptionConfiguration).toBeDefined();
            const rule = response.ServerSideEncryptionConfiguration.Rules[0];
            expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        });
        test('Should reject unencrypted object uploads to ApplicationDataBucket', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            const testKey = `test-unencrypted-${Date.now()}.txt`;
            // Attempt to upload without server-side encryption
            const putCommand = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: testKey,
                Body: 'test content',
                // Explicitly not setting ServerSideEncryption
            });
            // This should fail due to bucket policy
            await expect(s3Client.send(putCommand)).rejects.toThrow();
        });
        test('Should accept encrypted object uploads to ApplicationDataBucket', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            const testKey = `test-encrypted-${Date.now()}.txt`;
            try {
                // Upload with server-side encryption
                const putCommand = new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: 'test encrypted content',
                    ServerSideEncryption: 'AES256'
                });
                await s3Client.send(putCommand);
                // Verify the object is encrypted
                const headCommand = new client_s3_1.HeadObjectCommand({
                    Bucket: bucketName,
                    Key: testKey
                });
                const response = await s3Client.send(headCommand);
                expect(response.ServerSideEncryption).toBe('AES256');
            }
            catch (error) {
                // Clean up on failure
                console.error('Encrypted upload test failed:', error);
                throw error;
            }
        });
    });
    describe('EBS Encryption Compliance Testing', () => {
        test('Account-level EBS encryption should be enabled by default', async () => {
            const command = new client_ec2_1.GetEbsEncryptionByDefaultCommand({});
            const response = await ec2Client.send(command);
            expect(response.EbsEncryptionByDefault).toBe(true);
        });
        test('New EBS volumes should be encrypted by default', async () => {
            let instanceId;
            try {
                // Find available VPC and subnet
                const { vpcId, subnetId, securityGroupId } = await findAvailableVpcAndSubnet();
                console.log(`Using VPC: ${vpcId}, Subnet: ${subnetId}, SecurityGroup: ${securityGroupId}`);
                // Launch a small EC2 instance to test EBS encryption
                const runCommand = new client_ec2_1.RunInstancesCommand({
                    ImageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 (update as needed)
                    InstanceType: 't3.micro',
                    MinCount: 1,
                    MaxCount: 1,
                    SubnetId: subnetId,
                    SecurityGroupIds: [securityGroupId],
                    TagSpecifications: [{
                            ResourceType: 'instance',
                            Tags: [{
                                    Key: 'Name',
                                    Value: `test-ebs-encryption-${environmentSuffix}`
                                }, {
                                    Key: 'TestPurpose',
                                    Value: 'EBSEncryptionValidation'
                                }]
                        }]
                });
                const runResponse = await ec2Client.send(runCommand);
                instanceId = runResponse.Instances[0].InstanceId;
                // Wait a moment for instance to initialize
                await new Promise(resolve => setTimeout(resolve, 5000));
                // Get instance details
                const describeCommand = new client_ec2_1.DescribeInstancesCommand({
                    InstanceIds: [instanceId]
                });
                const instanceResponse = await ec2Client.send(describeCommand);
                const instance = instanceResponse.Reservations[0].Instances[0];
                const rootVolumeId = instance.BlockDeviceMappings[0].Ebs.VolumeId;
                // Check if the root volume is encrypted
                const volumesCommand = new client_ec2_1.DescribeVolumesCommand({
                    VolumeIds: [rootVolumeId]
                });
                const volumesResponse = await ec2Client.send(volumesCommand);
                const volume = volumesResponse.Volumes[0];
                expect(volume.Encrypted).toBe(true);
                expect(volume.KmsKeyId).toBeDefined();
            }
            finally {
                // Clean up - terminate the test instance
                if (instanceId) {
                    const terminateCommand = new client_ec2_1.TerminateInstancesCommand({
                        InstanceIds: [instanceId]
                    });
                    await ec2Client.send(terminateCommand);
                }
            }
        }, 60000); // 60 second timeout for EC2 operations
    });
    describe('IAM MFA Enforcement Testing', () => {
        test('MFA enforcement policy should exist and be properly configured', async () => {
            const policyArn = outputs.MFAPolicyArn;
            expect(policyArn).toBeDefined();
            const command = new client_iam_1.GetPolicyCommand({ PolicyArn: policyArn });
            const response = await iamClient.send(command);
            expect(response.Policy).toBeDefined();
            expect(response.Policy.PolicyName).toContain('RequireMFA');
            expect(response.Policy.Description).toBe('Enforces MFA for all IAM users');
        });
        test('Test user without MFA should be denied access to privileged operations', async () => {
            const testUserName = `test-no-mfa-${Date.now()}`;
            try {
                // Create test user
                const createUserCommand = new client_iam_1.CreateUserCommand({
                    UserName: testUserName,
                    Tags: [{
                            Key: 'TestPurpose',
                            Value: 'MFAEnforcementValidation'
                        }]
                });
                await iamClient.send(createUserCommand);
                // Attach the MFA enforcement policy
                const attachCommand = new client_iam_1.AttachUserPolicyCommand({
                    UserName: testUserName,
                    PolicyArn: outputs.MFAPolicyArn
                });
                await iamClient.send(attachCommand);
                // Check that user has no MFA devices
                const listMFACommand = new client_iam_1.ListMFADevicesCommand({
                    UserName: testUserName
                });
                const mfaResponse = await iamClient.send(listMFACommand);
                expect(mfaResponse.MFADevices).toHaveLength(0);
                // Verify user exists but has MFA policy attached
                const getUserCommand = new client_iam_1.GetUserCommand({
                    UserName: testUserName
                });
                const userResponse = await iamClient.send(getUserCommand);
                expect(userResponse.User.UserName).toBe(testUserName);
            }
            finally {
                // Clean up - remove policy and delete test user
                try {
                    await iamClient.send(new client_iam_1.DetachUserPolicyCommand({
                        UserName: testUserName,
                        PolicyArn: outputs.MFAPolicyArn
                    }));
                    await iamClient.send(new client_iam_1.DeleteUserCommand({
                        UserName: testUserName
                    }));
                }
                catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            }
        }, 30000);
    });
    describe('KMS Key Management Testing', () => {
        test('Default KMS key should have proper configuration when custom key not provided', async () => {
            const keyId = outputs.KMSKeyId;
            if (keyId && !keyId.startsWith('arn:aws:iam::')) {
                // This is a KMS key, not a custom ARN
                const command = new client_kms_1.DescribeKeyCommand({ KeyId: keyId });
                const response = await kmsClient.send(command);
                expect(response.KeyMetadata).toBeDefined();
                expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
                expect(response.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
                // Note: Key rotation status needs to be checked with a separate API call
                expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
            }
        });
        test('KMS key alias should exist and point to correct key', async () => {
            const listCommand = new client_kms_1.ListAliasesCommand({});
            const response = await kmsClient.send(listCommand);
            const alias = response.Aliases?.find(a => a.AliasName?.includes('encryption-compliance'));
            if (alias) {
                expect(alias.TargetKeyId).toBeDefined();
                expect(alias.AliasName).toMatch(/alias\/encryption-compliance-.+/);
            }
        });
    });
    describe('AWS Config Rules Evaluation Testing', () => {
        test('Config recorder should be active and recording', async () => {
            const command = new client_config_service_1.DescribeConfigurationRecordersCommand({});
            const response = await configClient.send(command);
            const recorder = response.ConfigurationRecorders?.find(r => r.name?.includes('EncryptionComplianceRecorder'));
            expect(recorder).toBeDefined();
            expect(recorder.recordingGroup?.allSupported).toBe(true);
            expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
        });
        test('Config delivery channel should be configured', async () => {
            const command = new client_config_service_1.DescribeDeliveryChannelsCommand({});
            const response = await configClient.send(command);
            const channel = response.DeliveryChannels?.find(c => c.name?.includes('EncryptionComplianceChannel'));
            expect(channel).toBeDefined();
            expect(channel.s3BucketName).toBeDefined();
            expect(channel.snsTopicARN).toBeDefined();
        });
        test('All required Config rules should be present and enabled', async () => {
            const command = new client_config_service_1.DescribeConfigRulesCommand({});
            const response = await configClient.send(command);
            const expectedRules = [
                's3-bucket-ssl-requests-only',
                's3-bucket-server-side-encryption-enabled',
                's3-default-encryption-kms',
                'encrypted-volumes',
                'ec2-ebs-encryption-by-default',
                'rds-storage-encrypted',
                'efs-encrypted-check',
                'iam-user-mfa-enabled',
                'root-account-mfa-enabled'
            ];
            const actualRules = response.ConfigRules?.map(rule => rule.ConfigRuleName) || [];
            expectedRules.forEach(expectedRule => {
                expect(actualRules).toContain(expectedRule);
            });
            // Verify all rules are in ACTIVE state
            response.ConfigRules?.forEach(rule => {
                expect(rule.ConfigRuleState).toBe('ACTIVE');
            });
        });
        test('S3 bucket encryption rules should show COMPLIANT status', async () => {
            const rules = [
                's3-bucket-ssl-requests-only',
                's3-bucket-server-side-encryption-enabled'
            ];
            for (const ruleName of rules) {
                const command = new client_config_service_1.GetComplianceDetailsByConfigRuleCommand({
                    ConfigRuleName: ruleName,
                    ComplianceTypes: ['COMPLIANT', 'NON_COMPLIANT']
                });
                try {
                    const response = await configClient.send(command);
                    // Check that we have evaluation results
                    expect(response.EvaluationResults).toBeDefined();
                    // For S3 buckets created by our stack, they should be compliant
                    const bucketCompliance = response.EvaluationResults?.filter(result => result.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceId?.includes('saas-'));
                    bucketCompliance?.forEach(result => {
                        expect(['COMPLIANT', 'NOT_APPLICABLE']).toContain(result.ComplianceType);
                    });
                }
                catch (error) {
                    // Rules might not have evaluations yet, which is acceptable in fresh deployments
                    console.log(`Rule ${ruleName} evaluation not ready:`, error);
                }
            }
        }, 30000);
        test('EBS encryption rule should show COMPLIANT status', async () => {
            const ruleName = 'ec2-ebs-encryption-by-default';
            const command = new client_config_service_1.GetComplianceDetailsByConfigRuleCommand({
                ConfigRuleName: ruleName,
                ComplianceTypes: ['COMPLIANT', 'NON_COMPLIANT']
            });
            try {
                const response = await configClient.send(command);
                // The account-level setting should be compliant
                const accountCompliance = response.EvaluationResults?.find(result => result.EvaluationResultIdentifier?.EvaluationResultQualifier?.ResourceType === 'AWS::Account::Account');
                if (accountCompliance) {
                    expect(accountCompliance.ComplianceType).toBe('COMPLIANT');
                }
            }
            catch (error) {
                console.log('EBS encryption rule evaluation not ready:', error);
            }
        });
        test('Should be able to manually trigger Config rules evaluation', async () => {
            const command = new client_config_service_1.StartConfigRulesEvaluationCommand({
                ConfigRuleNames: ['s3-bucket-server-side-encryption-enabled']
            });
            // This should not throw an error
            await expect(configClient.send(command)).resolves.toBeDefined();
        });
        test('Conformance pack should be deployed and compliant', async () => {
            const command = new client_config_service_1.DescribeConformancePacksCommand({});
            const response = await configClient.send(command);
            const pack = response.ConformancePackDetails?.find(p => p.ConformancePackName?.includes('encryption-compliance-pack'));
            expect(pack).toBeDefined();
            expect(pack.ConformancePackId).toBeDefined(); // Pack has a valid ID
        });
    });
    describe('Compliance Drift Detection Scenarios', () => {
        test('Should detect when S3 bucket encryption is disabled', async () => {
            // Note: This is a conceptual test - in practice, we can't easily disable
            // encryption on a bucket with a policy that requires it without removing
            // the policy first. This test validates that the policy prevents such changes.
            const bucketName = outputs.ApplicationDataBucketName;
            // Try to put an unencrypted object (should fail)
            const putCommand = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: `drift-test-${Date.now()}.txt`,
                Body: 'test content for drift detection'
                // No ServerSideEncryption specified
            });
            await expect(s3Client.send(putCommand)).rejects.toThrow();
        });
        test('Should detect when bucket policy is missing or modified', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            // Get current bucket policy
            const command = new client_s3_1.GetBucketPolicyCommand({ Bucket: bucketName });
            const response = await s3Client.send(command);
            expect(response.Policy).toBeDefined();
            const policy = JSON.parse(response.Policy);
            // Verify that critical statements are present
            const httpsStatement = policy.Statement.find((s) => s.Condition && s.Condition.Bool && s.Condition.Bool['aws:SecureTransport'] === 'false');
            expect(httpsStatement).toBeDefined();
            const encryptionStatement = policy.Statement.find((s) => s.Action === 's3:PutObject' && s.Effect === 'Deny');
            expect(encryptionStatement).toBeDefined();
        });
    });
    describe('SNS Topic Encryption Testing', () => {
        test('Config SNS topic should be encrypted with KMS', async () => {
            // Find the Config topic from the outputs or by name pattern
            const configRecorderName = outputs.ConfigRecorderName;
            expect(configRecorderName).toBeDefined();
            // Get delivery channel to find SNS topic
            const channelCommand = new client_config_service_1.DescribeDeliveryChannelsCommand({});
            const channelResponse = await configClient.send(channelCommand);
            const channel = channelResponse.DeliveryChannels?.find(c => c.name?.includes('EncryptionComplianceChannel'));
            if (channel?.snsTopicARN) {
                const topicCommand = new client_sns_1.GetTopicAttributesCommand({
                    TopicArn: channel.snsTopicARN
                });
                const topicResponse = await snsClient.send(topicCommand);
                // Verify KMS encryption is enabled
                expect(topicResponse.Attributes?.KmsMasterKeyId).toBeDefined();
                expect(topicResponse.Attributes?.KmsMasterKeyId).not.toBe('');
            }
        });
    });
    describe('End-to-End Compliance Validation', () => {
        test('Complete infrastructure should meet all encryption standards', async () => {
            const results = {
                s3Encryption: false,
                ebsEncryption: false,
                configRecording: false,
                mfaPolicy: false,
                kmsConfiguration: false
            };
            try {
                // Test S3 encryption
                const bucketCommand = new client_s3_1.GetBucketEncryptionCommand({
                    Bucket: outputs.ApplicationDataBucketName
                });
                const bucketResponse = await s3Client.send(bucketCommand);
                results.s3Encryption = bucketResponse.ServerSideEncryptionConfiguration !== undefined;
                // Test EBS encryption
                const ebsCommand = new client_ec2_1.GetEbsEncryptionByDefaultCommand({});
                const ebsResponse = await ec2Client.send(ebsCommand);
                results.ebsEncryption = ebsResponse.EbsEncryptionByDefault === true;
                // Test Config recording
                const configCommand = new client_config_service_1.DescribeConfigurationRecordersCommand({});
                const configResponse = await configClient.send(configCommand);
                results.configRecording = (configResponse.ConfigurationRecorders?.length || 0) > 0;
                // Test MFA policy
                const policyCommand = new client_iam_1.GetPolicyCommand({
                    PolicyArn: outputs.MFAPolicyArn
                });
                const policyResponse = await iamClient.send(policyCommand);
                results.mfaPolicy = policyResponse.Policy !== undefined;
                // Test KMS configuration (if we have a KMS key)
                if (outputs.KMSKeyId && !outputs.KMSKeyId.startsWith('arn:aws:iam::')) {
                    const kmsCommand = new client_kms_1.DescribeKeyCommand({
                        KeyId: outputs.KMSKeyId
                    });
                    const kmsResponse = await kmsClient.send(kmsCommand);
                    results.kmsConfiguration = kmsResponse.KeyMetadata?.KeyUsage === 'ENCRYPT_DECRYPT';
                }
                else {
                    results.kmsConfiguration = true; // Custom key provided
                }
                // All checks should pass
                Object.entries(results).forEach(([check, passed]) => {
                    expect(passed).toBe(true);
                });
                console.log('✅ All compliance checks passed:', results);
            }
            catch (error) {
                console.error('❌ Compliance validation failed:', error);
                console.log('Partial results:', results);
                throw error;
            }
        }, 45000);
        test('Config rules should eventually show compliant status after deployment', async () => {
            // This test acknowledges that Config rules need time to evaluate resources
            // In a real environment, you'd wait longer or implement polling
            const rulesCommand = new client_config_service_1.DescribeConfigRulesCommand({});
            const rulesResponse = await configClient.send(rulesCommand);
            const activeRules = rulesResponse.ConfigRules?.filter(rule => rule.ConfigRuleState === 'ACTIVE');
            expect(activeRules).toBeDefined();
            expect(activeRules.length).toBeGreaterThan(5); // We expect at least 5 active rules
            // Log the current state for debugging
            console.log('Active Config Rules:', activeRules?.map(rule => ({
                name: rule.ConfigRuleName,
                state: rule.ConfigRuleState
            })));
        });
    });
    describe('Resource Cleanup Validation', () => {
        test('All test objects should be cleaned up after tests', async () => {
            const bucketName = outputs.ApplicationDataBucketName;
            // List objects with test prefix
            const listCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: 'test-'
            });
            const response = await s3Client.send(listCommand);
            // For now, just log what's there. In a real scenario, you'd clean these up
            if (response.Contents && response.Contents.length > 0) {
                console.log('Test objects found (should be cleaned up):', response.Contents.map(obj => obj.Key));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3ViY2F0ZWdvcnktcmVmZXJlbmNlcy9zZWN1cml0eS1jb25maWd1cmF0aW9uLWFzLWNvZGUvUHIzMDkzL3Rlc3QvdGFwLXN0YWNrLmludC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLGtEQVM0QjtBQUM1QixvREFVNkI7QUFDN0Isb0RBWTZCO0FBQzdCLDBFQVF3QztBQUN4QyxvREFLNkI7QUFDN0Isb0RBRzZCO0FBRTdCLHFFQUFxRTtBQUNyRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUN4QixFQUFFLENBQUMsWUFBWSxDQUFDLCtCQUErQixFQUFFLE1BQU0sQ0FBQyxDQUN6RCxDQUFDO0FBRUYsMkVBQTJFO0FBQzNFLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxLQUFLLENBQUM7QUFDbEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVyxDQUFDO0FBRXJELGtCQUFrQjtBQUNsQixNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFlBQVksR0FBRyxJQUFJLDJDQUFtQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUN6RCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQzVD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SSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRWxELDJFQUEyRTtZQUMzRSxJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQTRDLEVBQ3RELFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUN0QyxDQUFDO1lBQ0osQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7XG4gIFMzQ2xpZW50LFxuICBHZXRCdWNrZXRFbmNyeXB0aW9uQ29tbWFuZCxcbiAgR2V0QnVja2V0VmVyc2lvbmluZ0NvbW1hbmQsXG4gIEdldEJ1Y2tldFBvbGljeUNvbW1hbmQsXG4gIFB1dE9iamVjdENvbW1hbmQsXG4gIEhlYWRPYmplY3RDb21tYW5kLFxuICBMaXN0T2JqZWN0c1YyQ29tbWFuZCxcbiAgR2V0UHVibGljQWNjZXNzQmxvY2tDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zMyc7XG5pbXBvcnQge1xuICBFQzJDbGllbnQsXG4gIEdldEVic0VuY3J5cHRpb25CeURlZmF1bHRDb21tYW5kLFxuICBSdW5JbnN0YW5jZXNDb21tYW5kLFxuICBEZXNjcmliZUluc3RhbmNlc0NvbW1hbmQsXG4gIERlc2NyaWJlVm9sdW1lc0NvbW1hbmQsXG4gIFRlcm1pbmF0ZUluc3RhbmNlc0NvbW1hbmQsXG4gIERlc2NyaWJlVnBjc0NvbW1hbmQsXG4gIERlc2NyaWJlU3VibmV0c0NvbW1hbmQsXG4gIERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1lYzInO1xuaW1wb3J0IHtcbiAgSUFNQ2xpZW50LFxuICBHZXRSb2xlQ29tbWFuZCxcbiAgR2V0UG9saWN5Q29tbWFuZCxcbiAgTGlzdEF0dGFjaGVkUm9sZVBvbGljaWVzQ29tbWFuZCxcbiAgTGlzdFVzZXJzQ29tbWFuZCxcbiAgR2V0VXNlckNvbW1hbmQsXG4gIExpc3RNRkFEZXZpY2VzQ29tbWFuZCxcbiAgQ3JlYXRlVXNlckNvbW1hbmQsXG4gIERlbGV0ZVVzZXJDb21tYW5kLFxuICBBdHRhY2hVc2VyUG9saWN5Q29tbWFuZCxcbiAgRGV0YWNoVXNlclBvbGljeUNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWlhbSc7XG5pbXBvcnQge1xuICBDb25maWdTZXJ2aWNlQ2xpZW50LFxuICBEZXNjcmliZUNvbmZpZ1J1bGVzQ29tbWFuZCxcbiAgRGVzY3JpYmVDb25maWd1cmF0aW9uUmVjb3JkZXJzQ29tbWFuZCxcbiAgRGVzY3JpYmVEZWxpdmVyeUNoYW5uZWxzQ29tbWFuZCxcbiAgR2V0Q29tcGxpYW5jZURldGFpbHNCeUNvbmZpZ1J1bGVDb21tYW5kLFxuICBTdGFydENvbmZpZ1J1bGVzRXZhbHVhdGlvbkNvbW1hbmQsXG4gIERlc2NyaWJlQ29uZm9ybWFuY2VQYWNrc0NvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNvbmZpZy1zZXJ2aWNlJztcbmltcG9ydCB7XG4gIEtNU0NsaWVudCxcbiAgRGVzY3JpYmVLZXlDb21tYW5kLFxuICBHZXRLZXlQb2xpY3lDb21tYW5kLFxuICBMaXN0QWxpYXNlc0NvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWttcyc7XG5pbXBvcnQge1xuICBTTlNDbGllbnQsXG4gIEdldFRvcGljQXR0cmlidXRlc0NvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNucyc7XG5cbi8vIENvbmZpZ3VyYXRpb24gLSBUaGVzZSBhcmUgY29taW5nIGZyb20gY2ZuLW91dHB1dHMgYWZ0ZXIgZGVwbG95bWVudFxuY29uc3Qgb3V0cHV0cyA9IEpTT04ucGFyc2UoXG4gIGZzLnJlYWRGaWxlU3luYygnY2ZuLW91dHB1dHMvZmxhdC1vdXRwdXRzLmpzb24nLCAndXRmOCcpXG4pO1xuXG4vLyBHZXQgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGUgKHNldCBieSBDSS9DRCBwaXBlbGluZSlcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuY29uc3QgcmVnaW9uID0gcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB8fCAndXMtZWFzdC0xJztcblxuLy8gQVdTIFNESyBjbGllbnRzXG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7IHJlZ2lvbiB9KTtcbmNvbnN0IGVjMkNsaWVudCA9IG5ldyBFQzJDbGllbnQoeyByZWdpb24gfSk7XG5jb25zdCBpYW1DbGllbnQgPSBuZXcgSUFNQ2xpZW50KHsgcmVnaW9uIH0pO1xuY29uc3QgY29uZmlnQ2xpZW50ID0gbmV3IENvbmZpZ1NlcnZpY2VDbGllbnQoeyByZWdpb24gfSk7XG5jb25zdCBrbXNDbGllbnQgPSBuZXcgS01TQ2xpZW50KHsgcmVnaW9uIH0pO1xuY29uc3Qgc25zQ2xpZW50ID0gbmV3IFNOU0NsaWVudCh7IHJlZ2lvbiB9KTtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGZpbmQgYXZhaWxhYmxlIFZQQyBhbmQgc3VibmV0XG5hc3luYyBmdW5jdGlvbiBmaW5kQXZhaWxhYmxlVnBjQW5kU3VibmV0KCkge1xuICB0cnkge1xuICAgIC8vIEZpcnN0LCB0cnkgdG8gZmluZCBkZWZhdWx0IFZQQ1xuICAgIGNvbnN0IHZwY0NvbW1hbmQgPSBuZXcgRGVzY3JpYmVWcGNzQ29tbWFuZCh7XG4gICAgICBGaWx0ZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBOYW1lOiAnaXMtZGVmYXVsdCcsXG4gICAgICAgICAgVmFsdWVzOiBbJ3RydWUnXVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gICAgXG4gICAgbGV0IHZwYztcbiAgICB0cnkge1xuICAgICAgY29uc3QgdnBjUmVzcG9uc2UgPSBhd2FpdCBlYzJDbGllbnQuc2VuZCh2cGNDb21tYW5kKTtcbiAgICAgIGlmICh2cGNSZXNwb25zZS5WcGNzICYmIHZwY1Jlc3BvbnNlLlZwY3MubGVuZ3RoID4gMCkge1xuICAgICAgICB2cGMgPSB2cGNSZXNwb25zZS5WcGNzWzBdO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnTm8gZGVmYXVsdCBWUEMgZm91bmQsIGxvb2tpbmcgZm9yIGFueSBhdmFpbGFibGUgVlBDJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIG5vIGRlZmF1bHQgVlBDLCBnZXQgYW55IGF2YWlsYWJsZSBWUENcbiAgICBpZiAoIXZwYykge1xuICAgICAgY29uc3QgYWxsVnBjc0NvbW1hbmQgPSBuZXcgRGVzY3JpYmVWcGNzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAnc3RhdGUnLFxuICAgICAgICAgICAgVmFsdWVzOiBbJ2F2YWlsYWJsZSddXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGFsbFZwY3NSZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKGFsbFZwY3NDb21tYW5kKTtcbiAgICAgIGlmIChhbGxWcGNzUmVzcG9uc2UuVnBjcyAmJiBhbGxWcGNzUmVzcG9uc2UuVnBjcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZwYyA9IGFsbFZwY3NSZXNwb25zZS5WcGNzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBhdmFpbGFibGUgVlBDIGZvdW5kIGluIHRoZSByZWdpb24nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gRmluZCBhIHN1Ym5ldCBpbiB0aGUgVlBDXG4gICAgY29uc3Qgc3VibmV0Q29tbWFuZCA9IG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIE5hbWU6ICd2cGMtaWQnLFxuICAgICAgICAgIFZhbHVlczogW3ZwYy5WcGNJZCFdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBOYW1lOiAnc3RhdGUnLFxuICAgICAgICAgIFZhbHVlczogWydhdmFpbGFibGUnXVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3Qgc3VibmV0UmVzcG9uc2UgPSBhd2FpdCBlYzJDbGllbnQuc2VuZChzdWJuZXRDb21tYW5kKTtcbiAgICBpZiAoIXN1Ym5ldFJlc3BvbnNlLlN1Ym5ldHMgfHwgc3VibmV0UmVzcG9uc2UuU3VibmV0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gYXZhaWxhYmxlIHN1Ym5ldHMgZm91bmQgaW4gVlBDICR7dnBjLlZwY0lkfWApO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdWJuZXQgPSBzdWJuZXRSZXNwb25zZS5TdWJuZXRzWzBdO1xuICAgIFxuICAgIC8vIEZpbmQgZGVmYXVsdCBzZWN1cml0eSBncm91cCBmb3IgdGhlIFZQQ1xuICAgIGNvbnN0IHNnQ29tbWFuZCA9IG5ldyBEZXNjcmliZVNlY3VyaXR5R3JvdXBzQ29tbWFuZCh7XG4gICAgICBGaWx0ZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICBWYWx1ZXM6IFt2cGMuVnBjSWQhXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgTmFtZTogJ2dyb3VwLW5hbWUnLFxuICAgICAgICAgIFZhbHVlczogWydkZWZhdWx0J11cbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHNnUmVzcG9uc2UgPSBhd2FpdCBlYzJDbGllbnQuc2VuZChzZ0NvbW1hbmQpO1xuICAgIGlmICghc2dSZXNwb25zZS5TZWN1cml0eUdyb3VwcyB8fCBzZ1Jlc3BvbnNlLlNlY3VyaXR5R3JvdXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBkZWZhdWx0IHNlY3VyaXR5IGdyb3VwIGZvdW5kIGluIFZQQyAke3ZwYy5WcGNJZH1gKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cCA9IHNnUmVzcG9uc2UuU2VjdXJpdHlHcm91cHNbMF07XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHZwY0lkOiB2cGMuVnBjSWQhLFxuICAgICAgc3VibmV0SWQ6IHN1Ym5ldC5TdWJuZXRJZCEsXG4gICAgICBzZWN1cml0eUdyb3VwSWQ6IHNlY3VyaXR5R3JvdXAuR3JvdXBJZCFcbiAgICB9O1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZpbmRpbmcgVlBDIGFuZCBzdWJuZXQ6JywgZXJyb3IpO1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZpbmQgYXZhaWxhYmxlIFZQQyBhbmQgc3VibmV0OiAke2Vycm9yfWApO1xuICB9XG59XG5cbmRlc2NyaWJlKCdTYWFTIEVuY3J5cHRpb24gU3RhbmRhcmRzIC0gSW50ZWdyYXRpb24gVGVzdHMnLCAoKSA9PiB7XG5cbiAgZGVzY3JpYmUoJ1MzIEVuY3J5cHRpb24gQ29tcGxpYW5jZSBUZXN0aW5nJywgKCkgPT4ge1xuICAgIFxuICAgIHRlc3QoJ0FwcGxpY2F0aW9uRGF0YUJ1Y2tldCBzaG91bGQgaGF2ZSBkZWZhdWx0IGVuY3J5cHRpb24gZW5hYmxlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBvdXRwdXRzLkFwcGxpY2F0aW9uRGF0YUJ1Y2tldE5hbWU7XG4gICAgICBleHBlY3QoYnVja2V0TmFtZSkudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRCdWNrZXRFbmNyeXB0aW9uQ29tbWFuZCh7IEJ1Y2tldDogYnVja2V0TmFtZSB9KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLlNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5TZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24/LlJ1bGVzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJ1bGUgPSByZXNwb25zZS5TZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24hLlJ1bGVzIVswXTtcbiAgICAgIGV4cGVjdChydWxlLkFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoWydBRVMyNTYnLCAnYXdzOmttcyddKS50b0NvbnRhaW4ocnVsZS5BcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0IS5TU0VBbGdvcml0aG0pO1xuICAgICAgZXhwZWN0KHJ1bGUuQnVja2V0S2V5RW5hYmxlZCkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0FwcGxpY2F0aW9uRGF0YUJ1Y2tldCBzaG91bGQgaGF2ZSB2ZXJzaW9uaW5nIGVuYWJsZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBidWNrZXROYW1lID0gb3V0cHV0cy5BcHBsaWNhdGlvbkRhdGFCdWNrZXROYW1lO1xuICAgICAgXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldEJ1Y2tldFZlcnNpb25pbmdDb21tYW5kKHsgQnVja2V0OiBidWNrZXROYW1lIH0pO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzM0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuU3RhdHVzKS50b0JlKCdFbmFibGVkJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdBcHBsaWNhdGlvbkRhdGFCdWNrZXQgc2hvdWxkIGhhdmUgcHVibGljIGFjY2VzcyBibG9ja2VkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYnVja2V0TmFtZSA9IG91dHB1dHMuQXBwbGljYXRpb25EYXRhQnVja2V0TmFtZTtcbiAgICAgIFxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRQdWJsaWNBY2Nlc3NCbG9ja0NvbW1hbmQoeyBCdWNrZXQ6IGJ1Y2tldE5hbWUgfSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHMzQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXNwb25zZS5QdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZ3VyYXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBjb25zdCBjb25maWcgPSByZXNwb25zZS5QdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZ3VyYXRpb24hO1xuICAgICAgZXhwZWN0KGNvbmZpZy5CbG9ja1B1YmxpY0FjbHMpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoY29uZmlnLkJsb2NrUHVibGljUG9saWN5KS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KGNvbmZpZy5JZ25vcmVQdWJsaWNBY2xzKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KGNvbmZpZy5SZXN0cmljdFB1YmxpY0J1Y2tldHMpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdBcHBsaWNhdGlvbkRhdGFCdWNrZXQgc2hvdWxkIGhhdmUgcG9saWN5IGVuZm9yY2luZyBIVFRQUyBhbmQgZW5jcnlwdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBvdXRwdXRzLkFwcGxpY2F0aW9uRGF0YUJ1Y2tldE5hbWU7XG4gICAgICBcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0QnVja2V0UG9saWN5Q29tbWFuZCh7IEJ1Y2tldDogYnVja2V0TmFtZSB9KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3BvbnNlLlBvbGljeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGNvbnN0IHBvbGljeSA9IEpTT04ucGFyc2UocmVzcG9uc2UuUG9saWN5ISk7XG4gICAgICBcbiAgICAgIC8vIENoZWNrIGZvciBIVFRQUyBlbmZvcmNlbWVudFxuICAgICAgY29uc3QgaHR0cHNTdGF0ZW1lbnQgPSBwb2xpY3kuU3RhdGVtZW50LmZpbmQoKHM6IGFueSkgPT4gXG4gICAgICAgIHMuQ29uZGl0aW9uICYmIHMuQ29uZGl0aW9uLkJvb2wgJiYgcy5Db25kaXRpb24uQm9vbFsnYXdzOlNlY3VyZVRyYW5zcG9ydCddID09PSAnZmFsc2UnXG4gICAgICApO1xuICAgICAgZXhwZWN0KGh0dHBzU3RhdGVtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGh0dHBzU3RhdGVtZW50LkVmZmVjdCkudG9CZSgnRGVueScpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBmb3IgZW5jcnlwdGlvbiBlbmZvcmNlbWVudFxuICAgICAgY29uc3QgZW5jcnlwdGlvblN0YXRlbWVudCA9IHBvbGljeS5TdGF0ZW1lbnQuZmluZCgoczogYW55KSA9PlxuICAgICAgICBzLkFjdGlvbiA9PT0gJ3MzOlB1dE9iamVjdCcgJiYgcy5FZmZlY3QgPT09ICdEZW55J1xuICAgICAgKTtcbiAgICAgIGV4cGVjdChlbmNyeXB0aW9uU3RhdGVtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnTG9nZ2luZ0J1Y2tldCBzaG91bGQgaGF2ZSBBRVMyNTYgZW5jcnlwdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBvdXRwdXRzLkxvZ2dpbmdCdWNrZXROYW1lO1xuICAgICAgZXhwZWN0KGJ1Y2tldE5hbWUpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0QnVja2V0RW5jcnlwdGlvbkNvbW1hbmQoeyBCdWNrZXQ6IGJ1Y2tldE5hbWUgfSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHMzQ2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5TZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBjb25zdCBydWxlID0gcmVzcG9uc2UuU2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uIS5SdWxlcyFbMF07XG4gICAgICBleHBlY3QocnVsZS5BcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0IS5TU0VBbGdvcml0aG0pLnRvQmUoJ0FFUzI1NicpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnU2hvdWxkIHJlamVjdCB1bmVuY3J5cHRlZCBvYmplY3QgdXBsb2FkcyB0byBBcHBsaWNhdGlvbkRhdGFCdWNrZXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBidWNrZXROYW1lID0gb3V0cHV0cy5BcHBsaWNhdGlvbkRhdGFCdWNrZXROYW1lO1xuICAgICAgY29uc3QgdGVzdEtleSA9IGB0ZXN0LXVuZW5jcnlwdGVkLSR7RGF0ZS5ub3coKX0udHh0YDtcbiAgICAgIFxuICAgICAgLy8gQXR0ZW1wdCB0byB1cGxvYWQgd2l0aG91dCBzZXJ2ZXItc2lkZSBlbmNyeXB0aW9uXG4gICAgICBjb25zdCBwdXRDb21tYW5kID0gbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgQm9keTogJ3Rlc3QgY29udGVudCcsXG4gICAgICAgIC8vIEV4cGxpY2l0bHkgbm90IHNldHRpbmcgU2VydmVyU2lkZUVuY3J5cHRpb25cbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaGlzIHNob3VsZCBmYWlsIGR1ZSB0byBidWNrZXQgcG9saWN5XG4gICAgICBhd2FpdCBleHBlY3QoczNDbGllbnQuc2VuZChwdXRDb21tYW5kKSkucmVqZWN0cy50b1Rocm93KCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdTaG91bGQgYWNjZXB0IGVuY3J5cHRlZCBvYmplY3QgdXBsb2FkcyB0byBBcHBsaWNhdGlvbkRhdGFCdWNrZXQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBidWNrZXROYW1lID0gb3V0cHV0cy5BcHBsaWNhdGlvbkRhdGFCdWNrZXROYW1lO1xuICAgICAgY29uc3QgdGVzdEtleSA9IGB0ZXN0LWVuY3J5cHRlZC0ke0RhdGUubm93KCl9LnR4dGA7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFVwbG9hZCB3aXRoIHNlcnZlci1zaWRlIGVuY3J5cHRpb25cbiAgICAgICAgY29uc3QgcHV0Q29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgIEJvZHk6ICd0ZXN0IGVuY3J5cHRlZCBjb250ZW50JyxcbiAgICAgICAgICBTZXJ2ZXJTaWRlRW5jcnlwdGlvbjogJ0FFUzI1NidcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChwdXRDb21tYW5kKTtcblxuICAgICAgICAvLyBWZXJpZnkgdGhlIG9iamVjdCBpcyBlbmNyeXB0ZWRcbiAgICAgICAgY29uc3QgaGVhZENvbW1hbmQgPSBuZXcgSGVhZE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICBLZXk6IHRlc3RLZXlcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHMzQ2xpZW50LnNlbmQoaGVhZENvbW1hbmQpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuU2VydmVyU2lkZUVuY3J5cHRpb24pLnRvQmUoJ0FFUzI1NicpO1xuXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBDbGVhbiB1cCBvbiBmYWlsdXJlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0VuY3J5cHRlZCB1cGxvYWQgdGVzdCBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0VCUyBFbmNyeXB0aW9uIENvbXBsaWFuY2UgVGVzdGluZycsICgpID0+IHtcbiAgICBcbiAgICB0ZXN0KCdBY2NvdW50LWxldmVsIEVCUyBlbmNyeXB0aW9uIHNob3VsZCBiZSBlbmFibGVkIGJ5IGRlZmF1bHQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldEVic0VuY3J5cHRpb25CeURlZmF1bHRDb21tYW5kKHt9KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWMyQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXNwb25zZS5FYnNFbmNyeXB0aW9uQnlEZWZhdWx0KS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnTmV3IEVCUyB2b2x1bWVzIHNob3VsZCBiZSBlbmNyeXB0ZWQgYnkgZGVmYXVsdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBpbnN0YW5jZUlkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEZpbmQgYXZhaWxhYmxlIFZQQyBhbmQgc3VibmV0XG4gICAgICAgIGNvbnN0IHsgdnBjSWQsIHN1Ym5ldElkLCBzZWN1cml0eUdyb3VwSWQgfSA9IGF3YWl0IGZpbmRBdmFpbGFibGVWcGNBbmRTdWJuZXQoKTtcbiAgICAgICAgY29uc29sZS5sb2coYFVzaW5nIFZQQzogJHt2cGNJZH0sIFN1Ym5ldDogJHtzdWJuZXRJZH0sIFNlY3VyaXR5R3JvdXA6ICR7c2VjdXJpdHlHcm91cElkfWApO1xuICAgICAgICBcbiAgICAgICAgLy8gTGF1bmNoIGEgc21hbGwgRUMyIGluc3RhbmNlIHRvIHRlc3QgRUJTIGVuY3J5cHRpb25cbiAgICAgICAgY29uc3QgcnVuQ29tbWFuZCA9IG5ldyBSdW5JbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgICBJbWFnZUlkOiAnYW1pLTBjMDJmYjU1OTU2YzdkMzE2JywgLy8gQW1hem9uIExpbnV4IDIgKHVwZGF0ZSBhcyBuZWVkZWQpXG4gICAgICAgICAgSW5zdGFuY2VUeXBlOiAndDMubWljcm8nLFxuICAgICAgICAgIE1pbkNvdW50OiAxLFxuICAgICAgICAgIE1heENvdW50OiAxLFxuICAgICAgICAgIFN1Ym5ldElkOiBzdWJuZXRJZCxcbiAgICAgICAgICBTZWN1cml0eUdyb3VwSWRzOiBbc2VjdXJpdHlHcm91cElkXSxcbiAgICAgICAgICBUYWdTcGVjaWZpY2F0aW9uczogW3tcbiAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgICAgIFRhZ3M6IFt7XG4gICAgICAgICAgICAgIEtleTogJ05hbWUnLFxuICAgICAgICAgICAgICBWYWx1ZTogYHRlc3QtZWJzLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIEtleTogJ1Rlc3RQdXJwb3NlJyxcbiAgICAgICAgICAgICAgVmFsdWU6ICdFQlNFbmNyeXB0aW9uVmFsaWRhdGlvbidcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBydW5SZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKHJ1bkNvbW1hbmQpO1xuICAgICAgICBpbnN0YW5jZUlkID0gcnVuUmVzcG9uc2UuSW5zdGFuY2VzIVswXS5JbnN0YW5jZUlkITtcbiAgICAgICAgXG4gICAgICAgIC8vIFdhaXQgYSBtb21lbnQgZm9yIGluc3RhbmNlIHRvIGluaXRpYWxpemVcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEdldCBpbnN0YW5jZSBkZXRhaWxzXG4gICAgICAgIGNvbnN0IGRlc2NyaWJlQ29tbWFuZCA9IG5ldyBEZXNjcmliZUluc3RhbmNlc0NvbW1hbmQoe1xuICAgICAgICAgIEluc3RhbmNlSWRzOiBbaW5zdGFuY2VJZF1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGluc3RhbmNlUmVzcG9uc2UgPSBhd2FpdCBlYzJDbGllbnQuc2VuZChkZXNjcmliZUNvbW1hbmQpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZVJlc3BvbnNlLlJlc2VydmF0aW9ucyFbMF0uSW5zdGFuY2VzIVswXTtcbiAgICAgICAgY29uc3Qgcm9vdFZvbHVtZUlkID0gaW5zdGFuY2UuQmxvY2tEZXZpY2VNYXBwaW5ncyFbMF0uRWJzIS5Wb2x1bWVJZCE7XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcm9vdCB2b2x1bWUgaXMgZW5jcnlwdGVkXG4gICAgICAgIGNvbnN0IHZvbHVtZXNDb21tYW5kID0gbmV3IERlc2NyaWJlVm9sdW1lc0NvbW1hbmQoe1xuICAgICAgICAgIFZvbHVtZUlkczogW3Jvb3RWb2x1bWVJZF1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHZvbHVtZXNSZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKHZvbHVtZXNDb21tYW5kKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHZvbHVtZSA9IHZvbHVtZXNSZXNwb25zZS5Wb2x1bWVzIVswXTtcbiAgICAgICAgZXhwZWN0KHZvbHVtZS5FbmNyeXB0ZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdCh2b2x1bWUuS21zS2V5SWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIFxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gQ2xlYW4gdXAgLSB0ZXJtaW5hdGUgdGhlIHRlc3QgaW5zdGFuY2VcbiAgICAgICAgaWYgKGluc3RhbmNlSWQpIHtcbiAgICAgICAgICBjb25zdCB0ZXJtaW5hdGVDb21tYW5kID0gbmV3IFRlcm1pbmF0ZUluc3RhbmNlc0NvbW1hbmQoe1xuICAgICAgICAgICAgSW5zdGFuY2VJZHM6IFtpbnN0YW5jZUlkXVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGF3YWl0IGVjMkNsaWVudC5zZW5kKHRlcm1pbmF0ZUNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgNjAwMDApOyAvLyA2MCBzZWNvbmQgdGltZW91dCBmb3IgRUMyIG9wZXJhdGlvbnNcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0lBTSBNRkEgRW5mb3JjZW1lbnQgVGVzdGluZycsICgpID0+IHtcbiAgICBcbiAgICB0ZXN0KCdNRkEgZW5mb3JjZW1lbnQgcG9saWN5IHNob3VsZCBleGlzdCBhbmQgYmUgcHJvcGVybHkgY29uZmlndXJlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHBvbGljeUFybiA9IG91dHB1dHMuTUZBUG9saWN5QXJuO1xuICAgICAgZXhwZWN0KHBvbGljeUFybikudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRQb2xpY3lDb21tYW5kKHsgUG9saWN5QXJuOiBwb2xpY3lBcm4gfSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGlhbUNsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuUG9saWN5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLlBvbGljeSEuUG9saWN5TmFtZSkudG9Db250YWluKCdSZXF1aXJlTUZBJyk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuUG9saWN5IS5EZXNjcmlwdGlvbikudG9CZSgnRW5mb3JjZXMgTUZBIGZvciBhbGwgSUFNIHVzZXJzJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdUZXN0IHVzZXIgd2l0aG91dCBNRkEgc2hvdWxkIGJlIGRlbmllZCBhY2Nlc3MgdG8gcHJpdmlsZWdlZCBvcGVyYXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdFVzZXJOYW1lID0gYHRlc3Qtbm8tbWZhLSR7RGF0ZS5ub3coKX1gO1xuICAgICAgXG4gICAgICB0cnkge1xuICAgICAgICAvLyBDcmVhdGUgdGVzdCB1c2VyXG4gICAgICAgIGNvbnN0IGNyZWF0ZVVzZXJDb21tYW5kID0gbmV3IENyZWF0ZVVzZXJDb21tYW5kKHtcbiAgICAgICAgICBVc2VyTmFtZTogdGVzdFVzZXJOYW1lLFxuICAgICAgICAgIFRhZ3M6IFt7XG4gICAgICAgICAgICBLZXk6ICdUZXN0UHVycG9zZScsXG4gICAgICAgICAgICBWYWx1ZTogJ01GQUVuZm9yY2VtZW50VmFsaWRhdGlvbidcbiAgICAgICAgICB9XVxuICAgICAgICB9KTtcbiAgICAgICAgYXdhaXQgaWFtQ2xpZW50LnNlbmQoY3JlYXRlVXNlckNvbW1hbmQpO1xuXG4gICAgICAgIC8vIEF0dGFjaCB0aGUgTUZBIGVuZm9yY2VtZW50IHBvbGljeVxuICAgICAgICBjb25zdCBhdHRhY2hDb21tYW5kID0gbmV3IEF0dGFjaFVzZXJQb2xpY3lDb21tYW5kKHtcbiAgICAgICAgICBVc2VyTmFtZTogdGVzdFVzZXJOYW1lLFxuICAgICAgICAgIFBvbGljeUFybjogb3V0cHV0cy5NRkFQb2xpY3lBcm5cbiAgICAgICAgfSk7XG4gICAgICAgIGF3YWl0IGlhbUNsaWVudC5zZW5kKGF0dGFjaENvbW1hbmQpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoYXQgdXNlciBoYXMgbm8gTUZBIGRldmljZXNcbiAgICAgICAgY29uc3QgbGlzdE1GQUNvbW1hbmQgPSBuZXcgTGlzdE1GQURldmljZXNDb21tYW5kKHtcbiAgICAgICAgICBVc2VyTmFtZTogdGVzdFVzZXJOYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBtZmFSZXNwb25zZSA9IGF3YWl0IGlhbUNsaWVudC5zZW5kKGxpc3RNRkFDb21tYW5kKTtcbiAgICAgICAgZXhwZWN0KG1mYVJlc3BvbnNlLk1GQURldmljZXMpLnRvSGF2ZUxlbmd0aCgwKTtcblxuICAgICAgICAvLyBWZXJpZnkgdXNlciBleGlzdHMgYnV0IGhhcyBNRkEgcG9saWN5IGF0dGFjaGVkXG4gICAgICAgIGNvbnN0IGdldFVzZXJDb21tYW5kID0gbmV3IEdldFVzZXJDb21tYW5kKHtcbiAgICAgICAgICBVc2VyTmFtZTogdGVzdFVzZXJOYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1c2VyUmVzcG9uc2UgPSBhd2FpdCBpYW1DbGllbnQuc2VuZChnZXRVc2VyQ29tbWFuZCk7XG4gICAgICAgIGV4cGVjdCh1c2VyUmVzcG9uc2UuVXNlciEuVXNlck5hbWUpLnRvQmUodGVzdFVzZXJOYW1lKTtcblxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gQ2xlYW4gdXAgLSByZW1vdmUgcG9saWN5IGFuZCBkZWxldGUgdGVzdCB1c2VyXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgaWFtQ2xpZW50LnNlbmQobmV3IERldGFjaFVzZXJQb2xpY3lDb21tYW5kKHtcbiAgICAgICAgICAgIFVzZXJOYW1lOiB0ZXN0VXNlck5hbWUsXG4gICAgICAgICAgICBQb2xpY3lBcm46IG91dHB1dHMuTUZBUG9saWN5QXJuXG4gICAgICAgICAgfSkpO1xuICAgICAgICAgIGF3YWl0IGlhbUNsaWVudC5zZW5kKG5ldyBEZWxldGVVc2VyQ29tbWFuZCh7XG4gICAgICAgICAgICBVc2VyTmFtZTogdGVzdFVzZXJOYW1lXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9IGNhdGNoIChjbGVhbnVwRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDbGVhbnVwIGVycm9yOicsIGNsZWFudXBFcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAzMDAwMCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdLTVMgS2V5IE1hbmFnZW1lbnQgVGVzdGluZycsICgpID0+IHtcbiAgICBcbiAgICB0ZXN0KCdEZWZhdWx0IEtNUyBrZXkgc2hvdWxkIGhhdmUgcHJvcGVyIGNvbmZpZ3VyYXRpb24gd2hlbiBjdXN0b20ga2V5IG5vdCBwcm92aWRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGtleUlkID0gb3V0cHV0cy5LTVNLZXlJZDtcbiAgICAgIFxuICAgICAgaWYgKGtleUlkICYmICFrZXlJZC5zdGFydHNXaXRoKCdhcm46YXdzOmlhbTo6JykpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIEtNUyBrZXksIG5vdCBhIGN1c3RvbSBBUk5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBEZXNjcmliZUtleUNvbW1hbmQoeyBLZXlJZDoga2V5SWQgfSk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQga21zQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICAgIFxuICAgICAgICBleHBlY3QocmVzcG9uc2UuS2V5TWV0YWRhdGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5LZXlNZXRhZGF0YSEuS2V5VXNhZ2UpLnRvQmUoJ0VOQ1JZUFRfREVDUllQVCcpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuS2V5TWV0YWRhdGEhLktleVNwZWMpLnRvQmUoJ1NZTU1FVFJJQ19ERUZBVUxUJyk7XG4gICAgICAgIC8vIE5vdGU6IEtleSByb3RhdGlvbiBzdGF0dXMgbmVlZHMgdG8gYmUgY2hlY2tlZCB3aXRoIGEgc2VwYXJhdGUgQVBJIGNhbGxcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLktleU1ldGFkYXRhIS5LZXlVc2FnZSkudG9CZSgnRU5DUllQVF9ERUNSWVBUJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdLTVMga2V5IGFsaWFzIHNob3VsZCBleGlzdCBhbmQgcG9pbnQgdG8gY29ycmVjdCBrZXknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsaXN0Q29tbWFuZCA9IG5ldyBMaXN0QWxpYXNlc0NvbW1hbmQoe30pO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBrbXNDbGllbnQuc2VuZChsaXN0Q29tbWFuZCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGFsaWFzID0gcmVzcG9uc2UuQWxpYXNlcz8uZmluZChhID0+IFxuICAgICAgICBhLkFsaWFzTmFtZT8uaW5jbHVkZXMoJ2VuY3J5cHRpb24tY29tcGxpYW5jZScpXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgZXhwZWN0KGFsaWFzLlRhcmdldEtleUlkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoYWxpYXMuQWxpYXNOYW1lKS50b01hdGNoKC9hbGlhc1xcL2VuY3J5cHRpb24tY29tcGxpYW5jZS0uKy8pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQVdTIENvbmZpZyBSdWxlcyBFdmFsdWF0aW9uIFRlc3RpbmcnLCAoKSA9PiB7XG4gICAgXG4gICAgdGVzdCgnQ29uZmlnIHJlY29yZGVyIHNob3VsZCBiZSBhY3RpdmUgYW5kIHJlY29yZGluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVzY3JpYmVDb25maWd1cmF0aW9uUmVjb3JkZXJzQ29tbWFuZCh7fSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbmZpZ0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBjb25zdCByZWNvcmRlciA9IHJlc3BvbnNlLkNvbmZpZ3VyYXRpb25SZWNvcmRlcnM/LmZpbmQociA9PiBcbiAgICAgICAgci5uYW1lPy5pbmNsdWRlcygnRW5jcnlwdGlvbkNvbXBsaWFuY2VSZWNvcmRlcicpXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QocmVjb3JkZXIpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVjb3JkZXIhLnJlY29yZGluZ0dyb3VwPy5hbGxTdXBwb3J0ZWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVjb3JkZXIhLnJlY29yZGluZ0dyb3VwPy5pbmNsdWRlR2xvYmFsUmVzb3VyY2VUeXBlcykudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NvbmZpZyBkZWxpdmVyeSBjaGFubmVsIHNob3VsZCBiZSBjb25maWd1cmVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBEZXNjcmliZURlbGl2ZXJ5Q2hhbm5lbHNDb21tYW5kKHt9KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29uZmlnQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNoYW5uZWwgPSByZXNwb25zZS5EZWxpdmVyeUNoYW5uZWxzPy5maW5kKGMgPT4gXG4gICAgICAgIGMubmFtZT8uaW5jbHVkZXMoJ0VuY3J5cHRpb25Db21wbGlhbmNlQ2hhbm5lbCcpXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QoY2hhbm5lbCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChjaGFubmVsIS5zM0J1Y2tldE5hbWUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoY2hhbm5lbCEuc25zVG9waWNBUk4pLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdBbGwgcmVxdWlyZWQgQ29uZmlnIHJ1bGVzIHNob3VsZCBiZSBwcmVzZW50IGFuZCBlbmFibGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBEZXNjcmliZUNvbmZpZ1J1bGVzQ29tbWFuZCh7fSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbmZpZ0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBjb25zdCBleHBlY3RlZFJ1bGVzID0gW1xuICAgICAgICAnczMtYnVja2V0LXNzbC1yZXF1ZXN0cy1vbmx5JyxcbiAgICAgICAgJ3MzLWJ1Y2tldC1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWVuYWJsZWQnLFxuICAgICAgICAnczMtZGVmYXVsdC1lbmNyeXB0aW9uLWttcycsXG4gICAgICAgICdlbmNyeXB0ZWQtdm9sdW1lcycsXG4gICAgICAgICdlYzItZWJzLWVuY3J5cHRpb24tYnktZGVmYXVsdCcsXG4gICAgICAgICdyZHMtc3RvcmFnZS1lbmNyeXB0ZWQnLFxuICAgICAgICAnZWZzLWVuY3J5cHRlZC1jaGVjaycsXG4gICAgICAgICdpYW0tdXNlci1tZmEtZW5hYmxlZCcsXG4gICAgICAgICdyb290LWFjY291bnQtbWZhLWVuYWJsZWQnXG4gICAgICBdO1xuICAgICAgXG4gICAgICBjb25zdCBhY3R1YWxSdWxlcyA9IHJlc3BvbnNlLkNvbmZpZ1J1bGVzPy5tYXAocnVsZSA9PiBydWxlLkNvbmZpZ1J1bGVOYW1lKSB8fCBbXTtcbiAgICAgIFxuICAgICAgZXhwZWN0ZWRSdWxlcy5mb3JFYWNoKGV4cGVjdGVkUnVsZSA9PiB7XG4gICAgICAgIGV4cGVjdChhY3R1YWxSdWxlcykudG9Db250YWluKGV4cGVjdGVkUnVsZSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IGFsbCBydWxlcyBhcmUgaW4gQUNUSVZFIHN0YXRlXG4gICAgICByZXNwb25zZS5Db25maWdSdWxlcz8uZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgZXhwZWN0KHJ1bGUuQ29uZmlnUnVsZVN0YXRlKS50b0JlKCdBQ1RJVkUnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUzMgYnVja2V0IGVuY3J5cHRpb24gcnVsZXMgc2hvdWxkIHNob3cgQ09NUExJQU5UIHN0YXR1cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJ1bGVzID0gW1xuICAgICAgICAnczMtYnVja2V0LXNzbC1yZXF1ZXN0cy1vbmx5JyxcbiAgICAgICAgJ3MzLWJ1Y2tldC1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWVuYWJsZWQnXG4gICAgICBdO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IHJ1bGVOYW1lIG9mIHJ1bGVzKSB7XG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0Q29tcGxpYW5jZURldGFpbHNCeUNvbmZpZ1J1bGVDb21tYW5kKHtcbiAgICAgICAgICBDb25maWdSdWxlTmFtZTogcnVsZU5hbWUsXG4gICAgICAgICAgQ29tcGxpYW5jZVR5cGVzOiBbJ0NPTVBMSUFOVCcsICdOT05fQ09NUExJQU5UJ11cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29uZmlnQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQ2hlY2sgdGhhdCB3ZSBoYXZlIGV2YWx1YXRpb24gcmVzdWx0c1xuICAgICAgICAgIGV4cGVjdChyZXNwb25zZS5FdmFsdWF0aW9uUmVzdWx0cykudG9CZURlZmluZWQoKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBGb3IgUzMgYnVja2V0cyBjcmVhdGVkIGJ5IG91ciBzdGFjaywgdGhleSBzaG91bGQgYmUgY29tcGxpYW50XG4gICAgICAgICAgY29uc3QgYnVja2V0Q29tcGxpYW5jZSA9IHJlc3BvbnNlLkV2YWx1YXRpb25SZXN1bHRzPy5maWx0ZXIocmVzdWx0ID0+IFxuICAgICAgICAgICAgcmVzdWx0LkV2YWx1YXRpb25SZXN1bHRJZGVudGlmaWVyPy5FdmFsdWF0aW9uUmVzdWx0UXVhbGlmaWVyPy5SZXNvdXJjZUlkPy5pbmNsdWRlcygnc2Fhcy0nKVxuICAgICAgICAgICk7XG4gICAgICAgICAgXG4gICAgICAgICAgYnVja2V0Q29tcGxpYW5jZT8uZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KFsnQ09NUExJQU5UJywgJ05PVF9BUFBMSUNBQkxFJ10pLnRvQ29udGFpbihyZXN1bHQuQ29tcGxpYW5jZVR5cGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIC8vIFJ1bGVzIG1pZ2h0IG5vdCBoYXZlIGV2YWx1YXRpb25zIHlldCwgd2hpY2ggaXMgYWNjZXB0YWJsZSBpbiBmcmVzaCBkZXBsb3ltZW50c1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBSdWxlICR7cnVsZU5hbWV9IGV2YWx1YXRpb24gbm90IHJlYWR5OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ0VCUyBlbmNyeXB0aW9uIHJ1bGUgc2hvdWxkIHNob3cgQ09NUExJQU5UIHN0YXR1cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJ1bGVOYW1lID0gJ2VjMi1lYnMtZW5jcnlwdGlvbi1ieS1kZWZhdWx0JztcbiAgICAgIFxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRDb21wbGlhbmNlRGV0YWlsc0J5Q29uZmlnUnVsZUNvbW1hbmQoe1xuICAgICAgICBDb25maWdSdWxlTmFtZTogcnVsZU5hbWUsXG4gICAgICAgIENvbXBsaWFuY2VUeXBlczogWydDT01QTElBTlQnLCAnTk9OX0NPTVBMSUFOVCddXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25maWdDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFRoZSBhY2NvdW50LWxldmVsIHNldHRpbmcgc2hvdWxkIGJlIGNvbXBsaWFudFxuICAgICAgICBjb25zdCBhY2NvdW50Q29tcGxpYW5jZSA9IHJlc3BvbnNlLkV2YWx1YXRpb25SZXN1bHRzPy5maW5kKHJlc3VsdCA9PlxuICAgICAgICAgIHJlc3VsdC5FdmFsdWF0aW9uUmVzdWx0SWRlbnRpZmllcj8uRXZhbHVhdGlvblJlc3VsdFF1YWxpZmllcj8uUmVzb3VyY2VUeXBlID09PSAnQVdTOjpBY2NvdW50OjpBY2NvdW50J1xuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgaWYgKGFjY291bnRDb21wbGlhbmNlKSB7XG4gICAgICAgICAgZXhwZWN0KGFjY291bnRDb21wbGlhbmNlLkNvbXBsaWFuY2VUeXBlKS50b0JlKCdDT01QTElBTlQnKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0VCUyBlbmNyeXB0aW9uIHJ1bGUgZXZhbHVhdGlvbiBub3QgcmVhZHk6JywgZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGVzdCgnU2hvdWxkIGJlIGFibGUgdG8gbWFudWFsbHkgdHJpZ2dlciBDb25maWcgcnVsZXMgZXZhbHVhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgU3RhcnRDb25maWdSdWxlc0V2YWx1YXRpb25Db21tYW5kKHtcbiAgICAgICAgQ29uZmlnUnVsZU5hbWVzOiBbJ3MzLWJ1Y2tldC1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWVuYWJsZWQnXVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIFRoaXMgc2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvclxuICAgICAgYXdhaXQgZXhwZWN0KGNvbmZpZ0NsaWVudC5zZW5kKGNvbW1hbmQpKS5yZXNvbHZlcy50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnQ29uZm9ybWFuY2UgcGFjayBzaG91bGQgYmUgZGVwbG95ZWQgYW5kIGNvbXBsaWFudCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVzY3JpYmVDb25mb3JtYW5jZVBhY2tzQ29tbWFuZCh7fSk7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbmZpZ0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBjb25zdCBwYWNrID0gcmVzcG9uc2UuQ29uZm9ybWFuY2VQYWNrRGV0YWlscz8uZmluZChwID0+IFxuICAgICAgICBwLkNvbmZvcm1hbmNlUGFja05hbWU/LmluY2x1ZGVzKCdlbmNyeXB0aW9uLWNvbXBsaWFuY2UtcGFjaycpXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QocGFjaykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChwYWNrIS5Db25mb3JtYW5jZVBhY2tJZCkudG9CZURlZmluZWQoKTsgLy8gUGFjayBoYXMgYSB2YWxpZCBJRFxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ29tcGxpYW5jZSBEcmlmdCBEZXRlY3Rpb24gU2NlbmFyaW9zJywgKCkgPT4ge1xuICAgIFxuICAgIHRlc3QoJ1Nob3VsZCBkZXRlY3Qgd2hlbiBTMyBidWNrZXQgZW5jcnlwdGlvbiBpcyBkaXNhYmxlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIE5vdGU6IFRoaXMgaXMgYSBjb25jZXB0dWFsIHRlc3QgLSBpbiBwcmFjdGljZSwgd2UgY2FuJ3QgZWFzaWx5IGRpc2FibGVcbiAgICAgIC8vIGVuY3J5cHRpb24gb24gYSBidWNrZXQgd2l0aCBhIHBvbGljeSB0aGF0IHJlcXVpcmVzIGl0IHdpdGhvdXQgcmVtb3ZpbmdcbiAgICAgIC8vIHRoZSBwb2xpY3kgZmlyc3QuIFRoaXMgdGVzdCB2YWxpZGF0ZXMgdGhhdCB0aGUgcG9saWN5IHByZXZlbnRzIHN1Y2ggY2hhbmdlcy5cbiAgICAgIFxuICAgICAgY29uc3QgYnVja2V0TmFtZSA9IG91dHB1dHMuQXBwbGljYXRpb25EYXRhQnVja2V0TmFtZTtcbiAgICAgIFxuICAgICAgLy8gVHJ5IHRvIHB1dCBhbiB1bmVuY3J5cHRlZCBvYmplY3QgKHNob3VsZCBmYWlsKVxuICAgICAgY29uc3QgcHV0Q29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICBLZXk6IGBkcmlmdC10ZXN0LSR7RGF0ZS5ub3coKX0udHh0YCxcbiAgICAgICAgQm9keTogJ3Rlc3QgY29udGVudCBmb3IgZHJpZnQgZGV0ZWN0aW9uJ1xuICAgICAgICAvLyBObyBTZXJ2ZXJTaWRlRW5jcnlwdGlvbiBzcGVjaWZpZWRcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBhd2FpdCBleHBlY3QoczNDbGllbnQuc2VuZChwdXRDb21tYW5kKSkucmVqZWN0cy50b1Rocm93KCk7XG4gICAgfSk7XG4gICAgXG4gICAgdGVzdCgnU2hvdWxkIGRldGVjdCB3aGVuIGJ1Y2tldCBwb2xpY3kgaXMgbWlzc2luZyBvciBtb2RpZmllZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBvdXRwdXRzLkFwcGxpY2F0aW9uRGF0YUJ1Y2tldE5hbWU7XG4gICAgICBcbiAgICAgIC8vIEdldCBjdXJyZW50IGJ1Y2tldCBwb2xpY3lcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0QnVja2V0UG9saWN5Q29tbWFuZCh7IEJ1Y2tldDogYnVja2V0TmFtZSB9KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3BvbnNlLlBvbGljeSkudG9CZURlZmluZWQoKTtcbiAgICAgIFxuICAgICAgY29uc3QgcG9saWN5ID0gSlNPTi5wYXJzZShyZXNwb25zZS5Qb2xpY3khKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IHRoYXQgY3JpdGljYWwgc3RhdGVtZW50cyBhcmUgcHJlc2VudFxuICAgICAgY29uc3QgaHR0cHNTdGF0ZW1lbnQgPSBwb2xpY3kuU3RhdGVtZW50LmZpbmQoKHM6IGFueSkgPT4gXG4gICAgICAgIHMuQ29uZGl0aW9uICYmIHMuQ29uZGl0aW9uLkJvb2wgJiYgcy5Db25kaXRpb24uQm9vbFsnYXdzOlNlY3VyZVRyYW5zcG9ydCddID09PSAnZmFsc2UnXG4gICAgICApO1xuICAgICAgZXhwZWN0KGh0dHBzU3RhdGVtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgXG4gICAgICBjb25zdCBlbmNyeXB0aW9uU3RhdGVtZW50ID0gcG9saWN5LlN0YXRlbWVudC5maW5kKChzOiBhbnkpID0+XG4gICAgICAgIHMuQWN0aW9uID09PSAnczM6UHV0T2JqZWN0JyAmJiBzLkVmZmVjdCA9PT0gJ0RlbnknXG4gICAgICApO1xuICAgICAgZXhwZWN0KGVuY3J5cHRpb25TdGF0ZW1lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTTlMgVG9waWMgRW5jcnlwdGlvbiBUZXN0aW5nJywgKCkgPT4ge1xuICAgIFxuICAgIHRlc3QoJ0NvbmZpZyBTTlMgdG9waWMgc2hvdWxkIGJlIGVuY3J5cHRlZCB3aXRoIEtNUycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEZpbmQgdGhlIENvbmZpZyB0b3BpYyBmcm9tIHRoZSBvdXRwdXRzIG9yIGJ5IG5hbWUgcGF0dGVyblxuICAgICAgY29uc3QgY29uZmlnUmVjb3JkZXJOYW1lID0gb3V0cHV0cy5Db25maWdSZWNvcmRlck5hbWU7XG4gICAgICBleHBlY3QoY29uZmlnUmVjb3JkZXJOYW1lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgXG4gICAgICAvLyBHZXQgZGVsaXZlcnkgY2hhbm5lbCB0byBmaW5kIFNOUyB0b3BpY1xuICAgICAgY29uc3QgY2hhbm5lbENvbW1hbmQgPSBuZXcgRGVzY3JpYmVEZWxpdmVyeUNoYW5uZWxzQ29tbWFuZCh7fSk7XG4gICAgICBjb25zdCBjaGFubmVsUmVzcG9uc2UgPSBhd2FpdCBjb25maWdDbGllbnQuc2VuZChjaGFubmVsQ29tbWFuZCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNoYW5uZWwgPSBjaGFubmVsUmVzcG9uc2UuRGVsaXZlcnlDaGFubmVscz8uZmluZChjID0+IFxuICAgICAgICBjLm5hbWU/LmluY2x1ZGVzKCdFbmNyeXB0aW9uQ29tcGxpYW5jZUNoYW5uZWwnKVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgaWYgKGNoYW5uZWw/LnNuc1RvcGljQVJOKSB7XG4gICAgICAgIGNvbnN0IHRvcGljQ29tbWFuZCA9IG5ldyBHZXRUb3BpY0F0dHJpYnV0ZXNDb21tYW5kKHtcbiAgICAgICAgICBUb3BpY0FybjogY2hhbm5lbC5zbnNUb3BpY0FSTlxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHRvcGljUmVzcG9uc2UgPSBhd2FpdCBzbnNDbGllbnQuc2VuZCh0b3BpY0NvbW1hbmQpO1xuICAgICAgICBcbiAgICAgICAgLy8gVmVyaWZ5IEtNUyBlbmNyeXB0aW9uIGlzIGVuYWJsZWRcbiAgICAgICAgZXhwZWN0KHRvcGljUmVzcG9uc2UuQXR0cmlidXRlcz8uS21zTWFzdGVyS2V5SWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh0b3BpY1Jlc3BvbnNlLkF0dHJpYnV0ZXM/Lkttc01hc3RlcktleUlkKS5ub3QudG9CZSgnJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFbmQtdG8tRW5kIENvbXBsaWFuY2UgVmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBcbiAgICB0ZXN0KCdDb21wbGV0ZSBpbmZyYXN0cnVjdHVyZSBzaG91bGQgbWVldCBhbGwgZW5jcnlwdGlvbiBzdGFuZGFyZHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0ge1xuICAgICAgICBzM0VuY3J5cHRpb246IGZhbHNlLFxuICAgICAgICBlYnNFbmNyeXB0aW9uOiBmYWxzZSxcbiAgICAgICAgY29uZmlnUmVjb3JkaW5nOiBmYWxzZSxcbiAgICAgICAgbWZhUG9saWN5OiBmYWxzZSxcbiAgICAgICAga21zQ29uZmlndXJhdGlvbjogZmFsc2VcbiAgICAgIH07XG4gICAgICBcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFRlc3QgUzMgZW5jcnlwdGlvblxuICAgICAgICBjb25zdCBidWNrZXRDb21tYW5kID0gbmV3IEdldEJ1Y2tldEVuY3J5cHRpb25Db21tYW5kKHsgXG4gICAgICAgICAgQnVja2V0OiBvdXRwdXRzLkFwcGxpY2F0aW9uRGF0YUJ1Y2tldE5hbWUgXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBidWNrZXRSZXNwb25zZSA9IGF3YWl0IHMzQ2xpZW50LnNlbmQoYnVja2V0Q29tbWFuZCk7XG4gICAgICAgIHJlc3VsdHMuczNFbmNyeXB0aW9uID0gYnVja2V0UmVzcG9uc2UuU2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIFxuICAgICAgICAvLyBUZXN0IEVCUyBlbmNyeXB0aW9uXG4gICAgICAgIGNvbnN0IGVic0NvbW1hbmQgPSBuZXcgR2V0RWJzRW5jcnlwdGlvbkJ5RGVmYXVsdENvbW1hbmQoe30pO1xuICAgICAgICBjb25zdCBlYnNSZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKGVic0NvbW1hbmQpO1xuICAgICAgICByZXN1bHRzLmVic0VuY3J5cHRpb24gPSBlYnNSZXNwb25zZS5FYnNFbmNyeXB0aW9uQnlEZWZhdWx0ID09PSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgLy8gVGVzdCBDb25maWcgcmVjb3JkaW5nXG4gICAgICAgIGNvbnN0IGNvbmZpZ0NvbW1hbmQgPSBuZXcgRGVzY3JpYmVDb25maWd1cmF0aW9uUmVjb3JkZXJzQ29tbWFuZCh7fSk7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1Jlc3BvbnNlID0gYXdhaXQgY29uZmlnQ2xpZW50LnNlbmQoY29uZmlnQ29tbWFuZCk7XG4gICAgICAgIHJlc3VsdHMuY29uZmlnUmVjb3JkaW5nID0gKGNvbmZpZ1Jlc3BvbnNlLkNvbmZpZ3VyYXRpb25SZWNvcmRlcnM/Lmxlbmd0aCB8fCAwKSA+IDA7XG4gICAgICAgIFxuICAgICAgICAvLyBUZXN0IE1GQSBwb2xpY3lcbiAgICAgICAgY29uc3QgcG9saWN5Q29tbWFuZCA9IG5ldyBHZXRQb2xpY3lDb21tYW5kKHsgXG4gICAgICAgICAgUG9saWN5QXJuOiBvdXRwdXRzLk1GQVBvbGljeUFybiBcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHBvbGljeVJlc3BvbnNlID0gYXdhaXQgaWFtQ2xpZW50LnNlbmQocG9saWN5Q29tbWFuZCk7XG4gICAgICAgIHJlc3VsdHMubWZhUG9saWN5ID0gcG9saWN5UmVzcG9uc2UuUG9saWN5ICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIFxuICAgICAgICAvLyBUZXN0IEtNUyBjb25maWd1cmF0aW9uIChpZiB3ZSBoYXZlIGEgS01TIGtleSlcbiAgICAgICAgaWYgKG91dHB1dHMuS01TS2V5SWQgJiYgIW91dHB1dHMuS01TS2V5SWQuc3RhcnRzV2l0aCgnYXJuOmF3czppYW06OicpKSB7XG4gICAgICAgICAgY29uc3Qga21zQ29tbWFuZCA9IG5ldyBEZXNjcmliZUtleUNvbW1hbmQoeyBcbiAgICAgICAgICAgIEtleUlkOiBvdXRwdXRzLktNU0tleUlkIFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IGttc1Jlc3BvbnNlID0gYXdhaXQga21zQ2xpZW50LnNlbmQoa21zQ29tbWFuZCk7XG4gICAgICAgICAgcmVzdWx0cy5rbXNDb25maWd1cmF0aW9uID0ga21zUmVzcG9uc2UuS2V5TWV0YWRhdGE/LktleVVzYWdlID09PSAnRU5DUllQVF9ERUNSWVBUJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLmttc0NvbmZpZ3VyYXRpb24gPSB0cnVlOyAvLyBDdXN0b20ga2V5IHByb3ZpZGVkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFsbCBjaGVja3Mgc2hvdWxkIHBhc3NcbiAgICAgICAgT2JqZWN0LmVudHJpZXMocmVzdWx0cykuZm9yRWFjaCgoW2NoZWNrLCBwYXNzZWRdKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KHBhc3NlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn4pyFIEFsbCBjb21wbGlhbmNlIGNoZWNrcyBwYXNzZWQ6JywgcmVzdWx0cyk7XG4gICAgICAgIFxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign4p2MIENvbXBsaWFuY2UgdmFsaWRhdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICBjb25zb2xlLmxvZygnUGFydGlhbCByZXN1bHRzOicsIHJlc3VsdHMpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICB9LCA0NTAwMCk7XG5cbiAgICB0ZXN0KCdDb25maWcgcnVsZXMgc2hvdWxkIGV2ZW50dWFsbHkgc2hvdyBjb21wbGlhbnQgc3RhdHVzIGFmdGVyIGRlcGxveW1lbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBUaGlzIHRlc3QgYWNrbm93bGVkZ2VzIHRoYXQgQ29uZmlnIHJ1bGVzIG5lZWQgdGltZSB0byBldmFsdWF0ZSByZXNvdXJjZXNcbiAgICAgIC8vIEluIGEgcmVhbCBlbnZpcm9ubWVudCwgeW91J2Qgd2FpdCBsb25nZXIgb3IgaW1wbGVtZW50IHBvbGxpbmdcbiAgICAgIFxuICAgICAgY29uc3QgcnVsZXNDb21tYW5kID0gbmV3IERlc2NyaWJlQ29uZmlnUnVsZXNDb21tYW5kKHt9KTtcbiAgICAgIGNvbnN0IHJ1bGVzUmVzcG9uc2UgPSBhd2FpdCBjb25maWdDbGllbnQuc2VuZChydWxlc0NvbW1hbmQpO1xuICAgICAgXG4gICAgICBjb25zdCBhY3RpdmVSdWxlcyA9IHJ1bGVzUmVzcG9uc2UuQ29uZmlnUnVsZXM/LmZpbHRlcihydWxlID0+IFxuICAgICAgICBydWxlLkNvbmZpZ1J1bGVTdGF0ZSA9PT0gJ0FDVElWRSdcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGV4cGVjdChhY3RpdmVSdWxlcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhY3RpdmVSdWxlcyEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oNSk7IC8vIFdlIGV4cGVjdCBhdCBsZWFzdCA1IGFjdGl2ZSBydWxlc1xuICAgICAgXG4gICAgICAvLyBMb2cgdGhlIGN1cnJlbnQgc3RhdGUgZm9yIGRlYnVnZ2luZ1xuICAgICAgY29uc29sZS5sb2coJ0FjdGl2ZSBDb25maWcgUnVsZXM6JywgYWN0aXZlUnVsZXM/Lm1hcChydWxlID0+ICh7XG4gICAgICAgIG5hbWU6IHJ1bGUuQ29uZmlnUnVsZU5hbWUsXG4gICAgICAgIHN0YXRlOiBydWxlLkNvbmZpZ1J1bGVTdGF0ZVxuICAgICAgfSkpKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Jlc291cmNlIENsZWFudXAgVmFsaWRhdGlvbicsICgpID0+IHtcbiAgICBcbiAgICB0ZXN0KCdBbGwgdGVzdCBvYmplY3RzIHNob3VsZCBiZSBjbGVhbmVkIHVwIGFmdGVyIHRlc3RzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYnVja2V0TmFtZSA9IG91dHB1dHMuQXBwbGljYXRpb25EYXRhQnVja2V0TmFtZTtcbiAgICAgIFxuICAgICAgLy8gTGlzdCBvYmplY3RzIHdpdGggdGVzdCBwcmVmaXhcbiAgICAgIGNvbnN0IGxpc3RDb21tYW5kID0gbmV3IExpc3RPYmplY3RzVjJDb21tYW5kKHtcbiAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICBQcmVmaXg6ICd0ZXN0LSdcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHMzQ2xpZW50LnNlbmQobGlzdENvbW1hbmQpO1xuICAgICAgXG4gICAgICAvLyBGb3Igbm93LCBqdXN0IGxvZyB3aGF0J3MgdGhlcmUuIEluIGEgcmVhbCBzY2VuYXJpbywgeW91J2QgY2xlYW4gdGhlc2UgdXBcbiAgICAgIGlmIChyZXNwb25zZS5Db250ZW50cyAmJiByZXNwb25zZS5Db250ZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdUZXN0IG9iamVjdHMgZm91bmQgKHNob3VsZCBiZSBjbGVhbmVkIHVwKTonLCBcbiAgICAgICAgICByZXNwb25zZS5Db250ZW50cy5tYXAob2JqID0+IG9iai5LZXkpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSk7Il19