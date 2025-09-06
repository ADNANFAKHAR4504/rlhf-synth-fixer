
/**
 * Integration Tests for TAP Stack Terraform Infrastructure
 * 
 * These tests validate the actual AWS resources created by the Terraform configuration
 * and verify their proper configuration and integration.
 */

import * as AWS from 'aws-sdk';
// Using Jest's built-in expect
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
    // Jest timeout is set via jest.setTimeout() or in jest config

    // AWS SDK clients
    let s3: AWS.S3;
    let kms: AWS.KMS;
    let cloudtrail: AWS.CloudTrail;
    let cloudfront: AWS.CloudFront;
    let rds: AWS.RDS;
    let iam: AWS.IAM;
    let ec2: AWS.EC2;
    let cloudwatch: AWS.CloudWatchLogs;
    let sns: AWS.SNS;

    // Test configuration
    const testConfig = {
        environment: process.env.TEST_ENVIRONMENT || 'test',
        region: process.env.AWS_REGION || 'us-east-1',
        accountId: '',
        vpcId: process.env.TEST_VPC_ID || '',
        approvedCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
        namePrefix: ''
    };

    // Resource names and ARNs
    let resourceInfo: {
        kmsKeyId?: string;
        kmsKeyArn?: string;
        logsBucketName?: string;
        dataBucketName?: string;
        cloudtrailName?: string;
        distributionId?: string;
        rdsInstanceId?: string;
        appRoleArn?: string;
        adminRoleArn?: string;
        snsTopicArn?: string;
    } = {};

    beforeAll(async () => {
        // Initialize AWS SDK
        AWS.config.update({ region: testConfig.region });
        s3 = new AWS.S3();
        kms = new AWS.KMS();
        cloudtrail = new AWS.CloudTrail();
        cloudfront = new AWS.CloudFront();
        rds = new AWS.RDS();
        iam = new AWS.IAM();
        ec2 = new AWS.EC2();
        cloudwatch = new AWS.CloudWatchLogs();
        sns = new AWS.SNS();

        // Get account ID
        const sts = new AWS.STS();
        const identity = await sts.getCallerIdentity().promise();
        testConfig.accountId = identity.Account!;
        testConfig.namePrefix = `${testConfig.environment}-tap`;

        console.log(`Running integration tests for environment: ${testConfig.environment}`);
        console.log(`AWS Account ID: ${testConfig.accountId}`);
        console.log(`AWS Region: ${testConfig.region}`);

        // Get Terraform outputs
        try {
            const outputJson = execSync('terraform output -json', { 
                cwd: path.join(__dirname, '..'),
                encoding: 'utf8' 
            });
            const outputs = JSON.parse(outputJson);
            
            resourceInfo = {
                kmsKeyArn: outputs.kms_key_arn?.value,
                logsBucketName: outputs.s3_logs_bucket_name?.value,
                dataBucketName: outputs.s3_data_bucket_name?.value,
                cloudtrailName: outputs.cloudtrail_name?.value,
                distributionId: outputs.cloudfront_distribution_id?.value,
                rdsInstanceId: outputs.rds_instance_endpoint?.value?.split('.')[0],
                appRoleArn: outputs.iam_app_role_arn?.value,
                adminRoleArn: outputs.iam_admin_role_arn?.value,
                snsTopicArn: outputs.sns_topic_arn?.value
            };

            if (resourceInfo.kmsKeyArn) {
                resourceInfo.kmsKeyId = resourceInfo.kmsKeyArn.split('/')[1];
            }
        } catch (error) {
            console.warn('Could not retrieve Terraform outputs:', error.message);
        }
    });

    describe('KMS Key Management', () => {
        it('should have created a customer-managed KMS key', async () => {
            expect(resourceInfo.kmsKeyId).not.toBeUndefined();
            
            const key = await kms.describeKey({ KeyId: resourceInfo.kmsKeyId! }).promise();
            
            expect(key.KeyMetadata).toBeDefined();
            expect(key.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
            expect(key.KeyMetadata!.KeyState).toBe('Enabled');
            expect(key.KeyMetadata!.Origin).toBe('AWS_KMS');
        });

        it('should have key rotation enabled', async () => {
            const rotation = await kms.getKeyRotationStatus({ 
                KeyId: resourceInfo.kmsKeyId! 
            }).promise();
            
            expect(rotation.KeyRotationEnabled).toBe(true);
        });

        it('should have proper key policy for service access', async () => {
            const policy = await kms.getKeyPolicy({
                KeyId: resourceInfo.kmsKeyId!,
                PolicyName: 'default'
            }).promise();

            const policyDoc = JSON.parse(policy.Policy!);
            
            // Check for CloudTrail permissions
            const cloudtrailStmt = policyDoc.Statement.find((stmt: any) => 
                stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
            );
            expect(cloudtrailStmt).toBeDefined();

            // Check for CloudWatch Logs permissions
            const logsStmt = policyDoc.Statement.find((stmt: any) =>
                stmt.Principal?.Service === 'logs.amazonaws.com'
            );
            expect(logsStmt).toBeDefined();
        });

        it('should have created KMS alias', async () => {
            const aliases = await kms.listAliases().promise();
            const expectedAlias = `alias/${testConfig.namePrefix}-key`;
            
            const alias = aliases.Aliases?.find(a => a.AliasName === expectedAlias);
            expect(alias).toBeDefined();
            expect(alias!.TargetKeyId).toBe(resourceInfo.kmsKeyId);
        });
    });

    describe('S3 Buckets', () => {
        describe('Logs Bucket', () => {
            it('should exist and be accessible', async () => {
                expect(resourceInfo.logsBucketName).not.toBeUndefined();
                
                const response = await s3.headBucket({ 
                    Bucket: resourceInfo.logsBucketName! 
                }).promise();
                
                expect(response).toBeDefined();
            });

            it('should have versioning enabled', async () => {
                const versioning = await s3.getBucketVersioning({
                    Bucket: resourceInfo.logsBucketName!
                }).promise();
                
                expect(versioning.Status).toBe('Enabled');
            });

            it('should have encryption configured', async () => {
                const encryption = await s3.getBucketEncryption({
                    Bucket: resourceInfo.logsBucketName!
                }).promise();
                
                expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
                const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
                expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
                expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe(resourceInfo.kmsKeyArn);
            });

            it('should have public access blocked', async () => {
                const blockConfig = await s3.getPublicAccessBlock({
                    Bucket: resourceInfo.logsBucketName!
                }).promise();
                
                expect(blockConfig.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
                expect(blockConfig.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
                expect(blockConfig.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
                expect(blockConfig.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
            });

            it('should have lifecycle policy configured', async () => {
                const lifecycle = await s3.getBucketLifecycleConfiguration({
                    Bucket: resourceInfo.logsBucketName!
                }).promise();
                
                expect(lifecycle.Rules).toHaveLength(0);
                const rule = lifecycle.Rules![0];
                expect(rule.Status).toBe('Enabled');
                expect(rule.Expiration?.Days).toBe(90);
            });

            it('should enforce HTTPS-only access via bucket policy', async () => {
                const policy = await s3.getBucketPolicy({
                    Bucket: resourceInfo.logsBucketName!
                }).promise();
                
                const policyDoc = JSON.parse(policy.Policy!);
                const httpsStmt = policyDoc.Statement.find((stmt: any) =>
                    stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
                );
                
                expect(httpsStmt).toBeDefined();
                expect(httpsStmt.Effect).toBe('Deny');
            });
        });

        describe('Data Bucket', () => {
            it('should exist and be accessible', async () => {
                expect(resourceInfo.dataBucketName).not.toBeUndefined();
                
                const response = await s3.headBucket({ 
                    Bucket: resourceInfo.dataBucketName! 
                }).promise();
                
                expect(response).toBeDefined();
            });

            it('should have logging configured to logs bucket', async () => {
                const logging = await s3.getBucketLogging({
                    Bucket: resourceInfo.dataBucketName!
                }).promise();
                
                expect(logging.LoggingEnabled).toBeDefined();
                expect(logging.LoggingEnabled!.TargetBucket).toBe(resourceInfo.logsBucketName);
                expect(logging.LoggingEnabled!.TargetPrefix).toBe('data-bucket-access-logs/');
            });

            it('should have CloudFront OAI access in bucket policy', async () => {
                const policy = await s3.getBucketPolicy({
                    Bucket: resourceInfo.dataBucketName!
                }).promise();
                
                const policyDoc = JSON.parse(policy.Policy!);
                const oaiStmt = policyDoc.Statement.find((stmt: any) =>
                    stmt.Principal?.AWS && stmt.Action === 's3:GetObject'
                );
                
                expect(oaiStmt).toBeDefined();
                expect(oaiStmt.Effect).toBe('Allow');
            });
        });
    });

    describe('CloudTrail', () => {
        it('should be created and active', async () => {
            expect(resourceInfo.cloudtrailName).not.toBeUndefined();
            
            const trail = await cloudtrail.getTrail({
                Name: resourceInfo.cloudtrailName!
            }).promise();
            
            expect(trail.Trail).toBeDefined();
            expect(trail.Trail!.IsMultiRegionTrail).toBe(true);
            expect(trail.Trail!.IncludeGlobalServiceEvents).toBe(true);
        });

        it('should have log file validation enabled', async () => {
            const trail = await cloudtrail.getTrail({
                Name: resourceInfo.cloudtrailName!
            }).promise();
            
            expect(trail.Trail!.LogFileValidationEnabled).toBe(true);
        });

        it('should be logging to correct S3 bucket', async () => {
            const trail = await cloudtrail.getTrail({
                Name: resourceInfo.cloudtrailName!
            }).promise();
            
            expect(trail.Trail!.S3BucketName).toBe(resourceInfo.logsBucketName);
            expect(trail.Trail!.S3KeyPrefix).toBe('cloudtrail-logs');
        });

        it('should have CloudWatch Logs integration', async () => {
            const trail = await cloudtrail.getTrail({
                Name: resourceInfo.cloudtrailName!
            }).promise();
            
            expect(trail.Trail!.CloudWatchLogsLogGroupArn).toBeDefined();
            expect(trail.Trail!.CloudWatchLogsRoleArn).toBeDefined();
        });

        it('should capture data events for S3', async () => {
            const eventSelectors = await cloudtrail.getEventSelectors({
                TrailName: resourceInfo.cloudtrailName!
            }).promise();
            
            expect(eventSelectors.EventSelectors).toHaveLength(0);
            const selector = eventSelectors.EventSelectors![0];
            
            const s3DataResource = selector.DataResources?.find(dr => 
                dr.Type === 'AWS::S3::Object'
            );
            
            expect(s3DataResource).toBeDefined();
        });
    });

    describe('CloudFront Distribution', () => {
        it('should be created and deployed', async () => {
            expect(resourceInfo.distributionId).not.toBeUndefined();
            
            const distribution = await cloudfront.getDistribution({
                Id: resourceInfo.distributionId!
            }).promise();
            
            expect(distribution.Distribution).toBeDefined();
            expect(distribution.Distribution!.Status).to.be.oneOf(['InProgress', 'Deployed']);
        });

        it('should have correct S3 origin configuration', async () => {
            const distribution = await cloudfront.getDistribution({
                Id: resourceInfo.distributionId!
            }).promise();
            
            const origin = distribution.Distribution!.DistributionConfig.Origins.Items[0];
            expect(origin.DomainName).toContain(resourceInfo.dataBucketName);
            expect(origin.S3OriginConfig).toBeDefined();
            expect(origin.S3OriginConfig!.OriginAccessIdentity).toBeDefined();
        });

        it('should enforce HTTPS redirect', async () => {
            const distribution = await cloudfront.getDistribution({
                Id: resourceInfo.distributionId!
            }).promise();
            
            const behavior = distribution.Distribution!.DistributionConfig.DefaultCacheBehavior;
            expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        });

        it('should have logging configured', async () => {
            const distribution = await cloudfront.getDistribution({
                Id: resourceInfo.distributionId!
            }).promise();
            
            const logging = distribution.Distribution!.DistributionConfig.Logging;
            expect(logging.Enabled).toBe(true);
            expect(logging.Bucket).toContain(resourceInfo.logsBucketName);
            expect(logging.Prefix).toBe('cloudfront-logs/');
        });
    });

    describe('Security Groups', () => {
        let securityGroups: AWS.EC2.SecurityGroup[];

        beforeAll(async () => {
            const response = await ec2.describeSecurityGroups({
                Filters: [
                    {
                        Name: 'tag:Name',
                        Values: [
                            `${testConfig.namePrefix}-web-sg`,
                            `${testConfig.namePrefix}-ssh-sg`,
                            `${testConfig.namePrefix}-database-sg`
                        ]
                    }
                ]
            }).promise();
            
            securityGroups = response.SecurityGroups!;
        });

        it('should have created web security group with correct rules', async () => {
            const webSg = securityGroups.find(sg => 
                sg.Tags?.some(tag => tag.Value === `${testConfig.namePrefix}-web-sg`)
            );
            
            expect(webSg).toBeDefined();
            
            // Check HTTP rule
            const httpRule = webSg!.IpPermissions?.find(rule =>
                rule.FromPort === 80 && rule.ToPort === 80
            );
            expect(httpRule).toBeDefined();
            
            // Check HTTPS rule
            const httpsRule = webSg!.IpPermissions?.find(rule =>
                rule.FromPort === 443 && rule.ToPort === 443
            );
            expect(httpsRule).toBeDefined();
        });

        it('should have created SSH security group with restricted access', async () => {
            const sshSg = securityGroups.find(sg => 
                sg.Tags?.some(tag => tag.Value === `${testConfig.namePrefix}-ssh-sg`)
            );
            
            expect(sshSg).toBeDefined();
            
            const sshRule = sshSg!.IpPermissions?.find(rule =>
                rule.FromPort === 22 && rule.ToPort === 22
            );
            expect(sshRule).toBeDefined();
            
            // Verify restricted to approved CIDRs
            const cidrs = sshRule!.IpRanges?.map(range => range.CidrIp) || [];
            expect(cidrs.every(cidr => testConfig.approvedCidrs.includes(cidr!))).toBe(true);
        });

        it('should have created database security group', async () => {
            const dbSg = securityGroups.find(sg => 
                sg.Tags?.some(tag => tag.Value === `${testConfig.namePrefix}-database-sg`)
            );
            
            expect(dbSg).toBeDefined();
            
            const mysqlRule = dbSg!.IpPermissions?.find(rule =>
                rule.FromPort === 3306 && rule.ToPort === 3306
            );
            expect(mysqlRule).toBeDefined();
        });
    });

    describe('IAM Roles and Policies', () => {
        it('should have created application role with correct policies', async () => {
            expect(resourceInfo.appRoleArn).not.toBeUndefined();
            
            const roleName = resourceInfo.appRoleArn!.split('/').pop()!;
            const role = await iam.getRole({ RoleName: roleName }).promise();
            
            expect(role.Role).toBeDefined();
            expect(role.Role.AssumeRolePolicyDocument).toBeDefined();
            
            // Check assume role policy allows EC2
            const assumePolicy = decodeURIComponent(role.Role.AssumeRolePolicyDocument!);
            const policyDoc = JSON.parse(assumePolicy);
            
            expect(policyDoc.Statement.some((stmt: any) =>
                stmt.Principal?.Service === 'ec2.amazonaws.com'
            )).toBe(true);
        });

        it('should have created admin role with external ID requirement', async () => {
            expect(resourceInfo.adminRoleArn).not.toBeUndefined();
            
            const roleName = resourceInfo.adminRoleArn!.split('/').pop()!;
            const role = await iam.getRole({ RoleName: roleName }).promise();
            
            const assumePolicy = decodeURIComponent(role.Role.AssumeRolePolicyDocument!);
            const policyDoc = JSON.parse(assumePolicy);
            
            // Check for external ID condition
            const stmt = policyDoc.Statement[0];
            expect(stmt.Condition?.StringEquals?.['sts:ExternalId']).toBeDefined();
        });

        it('should have attached proper policies to application role', async () => {
            const roleName = resourceInfo.appRoleArn!.split('/').pop()!;
            const policies = await iam.listRolePolicies({ RoleName: roleName }).promise();
            
            expect(policies.PolicyNames).toHaveLength(0);
            
            // Get policy document
            const policyName = policies.PolicyNames[0];
            const policy = await iam.getRolePolicy({
                RoleName: roleName,
                PolicyName: policyName
            }).promise();
            
            const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument!));
            
            // Verify S3 permissions
            const s3Stmt = policyDoc.Statement.find((stmt: any) =>
                stmt.Action.some((action: string) => action.startsWith('s3:'))
            );
            expect(s3Stmt).toBeDefined();
        });
    });

    describe('CloudWatch Monitoring', () => {
        it('should have created CloudTrail log group', async () => {
            const logGroupName = `/aws/cloudtrail/${testConfig.namePrefix}`;
            
            const response = await cloudwatch.describeLogGroups({
                logGroupNamePrefix: logGroupName
            }).promise();
            
            const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
            expect(logGroup).toBeDefined();
            expect(logGroup!.retentionInDays).toBe(90);
        });

        it('should have created metric filter for IAM policy changes', async () => {
            const logGroupName = `/aws/cloudtrail/${testConfig.namePrefix}`;
            
            const response = await cloudwatch.describeMetricFilters({
                logGroupName: logGroupName
            }).promise();
            
            const metricFilter = response.metricFilters?.find(mf =>
                mf.filterName === `${testConfig.namePrefix}-iam-policy-changes`
            );
            
            expect(metricFilter).toBeDefined();
            expect(metricFilter!.filterPattern).toContain('AttachUserPolicy');
        });

        it('should have created CloudWatch alarm for IAM changes', async () => {
            const cloudwatchAlarms = new AWS.CloudWatch();
            
            const response = await cloudwatchAlarms.describeAlarms({
                AlarmNames: [`${testConfig.namePrefix}-iam-policy-changes`]
            }).promise();
            
            expect(response.MetricAlarms).to.have.length(1);
            const alarm = response.MetricAlarms![0];
            
            expect(alarm.AlarmActions).toContain(resourceInfo.snsTopicArn);
            expect(alarm.MetricName).toBe('IAMPolicyChangeCount');
        });
    });

    describe('SNS Topic', () => {
        it('should have created SNS topic for alarms', async () => {
            expect(resourceInfo.snsTopicArn).not.toBeUndefined();
            
            const response = await sns.getTopicAttributes({
                TopicArn: resourceInfo.snsTopicArn!
            }).promise();
            
            expect(response.Attributes).toBeDefined();
            expect(response.Attributes!.KmsMasterKeyId).toBe(resourceInfo.kmsKeyId);
        });
    });

    describe('Conditional RDS Resources', () => {
        it('should create RDS instance only when VPC is provided', async () => {
            if (testConfig.vpcId) {
                expect(resourceInfo.rdsInstanceId).not.toBeUndefined();
                
                const response = await rds.describeDBInstances({
                    DBInstanceIdentifier: resourceInfo.rdsInstanceId!
                }).promise();
                
                expect(response.DBInstances).to.have.length(1);
                const instance = response.DBInstances![0];
                
                expect(instance.StorageEncrypted).toBe(true);
                expect(instance.KmsKeyId).toBe(resourceInfo.kmsKeyArn);
                expect(instance.BackupRetentionPeriod).toBe(7);
            } else {
                expect(resourceInfo.rdsInstanceId).toBeUndefined();
            }
        });

        it('should create VPC Flow Logs when VPC is provided', async () => {
            if (testConfig.vpcId) {
                const response = await ec2.describeFlowLogs({
                    Filters: [
                        {
                            Name: 'resource-id',
                            Values: [testConfig.vpcId]
                        }
                    ]
                }).promise();
                
                const flowLog = response.FlowLogs?.find(fl =>
                    fl.LogDestinationType === 'cloud-watch-logs'
                );
                
                expect(flowLog).toBeDefined();
                expect(flowLog!.TrafficType).toBe('ALL');
            }
        });
    });

    describe('Resource Tagging', () => {
        it('should have consistent tagging across all resources', async () => {
            const expectedTags = {
                Environment: testConfig.environment,
                ManagedBy: 'Terraform'
            };

            // Check S3 bucket tags
            const s3Tags = await s3.getBucketTagging({
                Bucket: resourceInfo.logsBucketName!
            }).promise();
            
            expectedTags['Environment'] = testConfig.environment;
            for (const [key, value] of Object.entries(expectedTags)) {
                const tag = s3Tags.TagSet.find(t => t.Key === key);
                expect(tag).toBeDefined();
                expect(tag!.Value).toBe(value);
            }
        });
    });

    afterAll(() => {
        console.log('Integration tests completed');
        console.log('Resources validated:');
        console.log('- KMS Key:', resourceInfo.kmsKeyId);
        console.log('- S3 Buckets:', resourceInfo.logsBucketName, resourceInfo.dataBucketName);
        console.log('- CloudTrail:', resourceInfo.cloudtrailName);
        console.log('- CloudFront:', resourceInfo.distributionId);
        if (resourceInfo.rdsInstanceId) {
            console.log('- RDS Instance:', resourceInfo.rdsInstanceId);
        }
    });
});