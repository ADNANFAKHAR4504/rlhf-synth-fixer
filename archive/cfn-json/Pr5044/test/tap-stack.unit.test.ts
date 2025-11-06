import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
    let template: any;

    beforeAll(() => {
        const templatePath = path.join(__dirname, '../lib/TapStack.json');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
    });

    // ==================== Template Structure Tests ====================
    describe('Template Structure', () => {
        test('should have valid CloudFormation format version', () => {
            expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
        });

        test('should have comprehensive description for security baseline', () => {
            expect(template.Description).toBeDefined();
            expect(template.Description).toContain('Security Baseline CloudFormation Template');
            expect(template.Description.length).toBeGreaterThan(50);
        });

        test('should have all major sections', () => {
            expect(template.Parameters).toBeDefined();
            expect(template.Resources).toBeDefined();
            expect(template.Outputs).toBeDefined();
        });

        test('should have exactly 3 parameters', () => {
            const parameterCount = Object.keys(template.Parameters).length;
            expect(parameterCount).toBe(3);
        });

        test('should have at least 15 resources for security baseline', () => {
            const resourceCount = Object.keys(template.Resources).length;
            expect(resourceCount).toBeGreaterThanOrEqual(15);
        });

        test('should have at least 6 outputs', () => {
            const outputCount = Object.keys(template.Outputs).length;
            expect(outputCount).toBeGreaterThanOrEqual(6);
        });
    });

    // ==================== Parameters Tests ====================
    describe('Parameters', () => {
        describe('EnvironmentSuffix Parameter', () => {
            test('should exist and have correct type', () => {
                expect(template.Parameters.EnvironmentSuffix).toBeDefined();
                expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
            });

            test('should have correct default value', () => {
                expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
            });

            test('should have description', () => {
                expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
                expect(template.Parameters.EnvironmentSuffix.Description.length).toBeGreaterThan(0);
            });

            test('should have validation pattern for lowercase alphanumeric', () => {
                const pattern = template.Parameters.EnvironmentSuffix.AllowedPattern;
                expect(pattern).toBeDefined();
                expect(pattern).toBe('^[a-z0-9-]+$');
            });

            test('should have constraint description', () => {
                expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toBeDefined();
                expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toContain('lowercase');
            });
        });

        describe('AllowedIPRange Parameter', () => {
            test('should exist and have correct type', () => {
                expect(template.Parameters.AllowedIPRange).toBeDefined();
                expect(template.Parameters.AllowedIPRange.Type).toBe('String');
            });

            test('should have correct default CIDR block', () => {
                expect(template.Parameters.AllowedIPRange.Default).toBe('10.0.0.0/16');
            });

            test('should have description', () => {
                expect(template.Parameters.AllowedIPRange.Description).toBeDefined();
                expect(template.Parameters.AllowedIPRange.Description).toContain('CIDR');
            });
        });

        describe('AdminEmail Parameter', () => {
            test('should exist and have correct type', () => {
                expect(template.Parameters.AdminEmail).toBeDefined();
                expect(template.Parameters.AdminEmail.Type).toBe('String');
            });

            test('should have correct default email', () => {
                expect(template.Parameters.AdminEmail.Default).toBe('admin@example.com');
            });

            test('should have description', () => {
                expect(template.Parameters.AdminEmail.Description).toBeDefined();
                expect(template.Parameters.AdminEmail.Description).toContain('Email');
            });
        });
    });

    // ==================== KMS Resources Tests ====================
    describe('KMS Resources', () => {
        describe('KMS Key', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.KMSKey).toBeDefined();
                expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
            });

            test('should have comprehensive description', () => {
                const properties = template.Resources.KMSKey.Properties;
                expect(properties.Description).toBeDefined();
                expect(properties.Description).toContain('encryption');
            });

            test('should have key policy with version', () => {
                const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
                expect(keyPolicy).toBeDefined();
                expect(keyPolicy.Version).toBe('2012-10-17');
            });

            test('should have IAM root permissions statement', () => {
                const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
                const statements = keyPolicy.Statement;

                const rootStatement = statements.find((s: any) =>
                    s.Sid === 'Enable IAM User Permissions'
                );

                expect(rootStatement).toBeDefined();
                expect(rootStatement.Effect).toBe('Allow');
                expect(rootStatement.Action).toBe('kms:*');
                expect(rootStatement.Resource).toBe('*');
                expect(rootStatement.Principal.AWS).toEqual({
                    'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
                });
            });

            test('should allow CloudTrail to encrypt logs', () => {
                const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
                const statements = keyPolicy.Statement;

                const cloudTrailStatement = statements.find((s: any) =>
                    s.Sid === 'Allow CloudTrail to encrypt logs'
                );

                expect(cloudTrailStatement).toBeDefined();
                expect(cloudTrailStatement.Effect).toBe('Allow');
                expect(cloudTrailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
                expect(cloudTrailStatement.Action).toContain('kms:GenerateDataKey*');
                expect(cloudTrailStatement.Action).toContain('kms:Decrypt');
            });

            test('should allow S3 to use the key', () => {
                const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
                const statements = keyPolicy.Statement;

                const s3Statement = statements.find((s: any) =>
                    s.Sid === 'Allow S3 to use the key'
                );

                expect(s3Statement).toBeDefined();
                expect(s3Statement.Effect).toBe('Allow');
                expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
                expect(s3Statement.Action).toContain('kms:Decrypt');
                expect(s3Statement.Action).toContain('kms:GenerateDataKey');
            });
        });

        describe('KMS Key Alias', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.KMSKeyAlias).toBeDefined();
                expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
            });

            test('should have correct alias name with environment suffix', () => {
                const properties = template.Resources.KMSKeyAlias.Properties;
                expect(properties.AliasName).toEqual({
                    'Fn::Sub': 'alias/security-baseline-${EnvironmentSuffix}-key'
                });
            });

            test('should reference KMS key', () => {
                const properties = template.Resources.KMSKeyAlias.Properties;
                expect(properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
            });
        });
    });

    // ==================== IAM Resources Tests ====================
    describe('IAM Resources', () => {
        describe('S3 Read-Only Role', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.S3ReadOnlyRole).toBeDefined();
                expect(template.Resources.S3ReadOnlyRole.Type).toBe('AWS::IAM::Role');
            });

            test('should have deterministic role name', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                expect(properties.RoleName).toEqual({
                    'Fn::Sub': 'SecurityBaselineS3ReadOnlyRole-${EnvironmentSuffix}'
                });
            });

            test('should have description following least privilege', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                expect(properties.Description).toBeDefined();
                expect(properties.Description).toContain('read-only');
                expect(properties.Description).toContain('least privilege');
            });

            test('should have correct trust policy for EC2', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                const assumePolicy = properties.AssumeRolePolicyDocument;

                expect(assumePolicy.Version).toBe('2012-10-17');
                expect(assumePolicy.Statement).toHaveLength(1);

                const statement = assumePolicy.Statement[0];
                expect(statement.Effect).toBe('Allow');
                expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
                expect(statement.Action).toBe('sts:AssumeRole');
            });

            test('should have SSM managed policy attached', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                expect(properties.ManagedPolicyArns).toBeDefined();
                expect(properties.ManagedPolicyArns).toContain(
                    'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
                );
            });

            test('should have S3 read-only inline policy', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                const policies = properties.Policies;

                expect(policies).toBeDefined();
                expect(policies).toHaveLength(1);

                const s3Policy = policies[0];
                expect(s3Policy.PolicyName).toBe('S3ReadOnlyPolicy');
                expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');
            });

            test('S3 policy should grant only read permissions', () => {
                const properties = template.Resources.S3ReadOnlyRole.Properties;
                const s3Policy = properties.Policies[0];
                const statement = s3Policy.PolicyDocument.Statement[0];

                expect(statement.Sid).toBe('S3ReadOnlyAccess');
                expect(statement.Effect).toBe('Allow');
                expect(statement.Action).toContain('s3:GetObject');
                expect(statement.Action).toContain('s3:GetObjectVersion');
                expect(statement.Action).toContain('s3:ListBucket');
                expect(statement.Action).toContain('s3:GetBucketLocation');
                expect(statement.Action).toContain('s3:ListAllMyBuckets');
                expect(statement.Resource).toBe('*');
            });

            test('should have proper tags', () => {
                const tags = template.Resources.S3ReadOnlyRole.Properties.Tags;
                expect(tags).toBeDefined();
                expect(tags.some((t: any) => t.Key === 'Purpose' && t.Value === 'SecurityBaseline')).toBe(true);
                expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
            });
        });
    });

    // ==================== VPC Resources Tests ====================
    describe('VPC Resources', () => {
        describe('Security VPC', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.SecurityVPC).toBeDefined();
                expect(template.Resources.SecurityVPC.Type).toBe('AWS::EC2::VPC');
            });

            test('should have correct CIDR block', () => {
                const properties = template.Resources.SecurityVPC.Properties;
                expect(properties.CidrBlock).toBe('10.0.0.0/16');
            });

            test('should enable DNS hostnames and support', () => {
                const properties = template.Resources.SecurityVPC.Properties;
                expect(properties.EnableDnsHostnames).toBe(true);
                expect(properties.EnableDnsSupport).toBe(true);
            });

            test('should have proper tags with environment suffix', () => {
                const tags = template.Resources.SecurityVPC.Properties.Tags;
                expect(tags).toBeDefined();

                const nameTag = tags.find((t: any) => t.Key === 'Name');
                expect(nameTag).toBeDefined();
                expect(nameTag.Value).toEqual({
                    'Fn::Sub': 'SecurityBaselineVPC-${EnvironmentSuffix}'
                });
            });
        });

        describe('VPC Flow Logs Bucket', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.VPCFlowLogsBucket).toBeDefined();
                expect(template.Resources.VPCFlowLogsBucket.Type).toBe('AWS::S3::Bucket');
            });

            test('should have deterministic bucket name', () => {
                const properties = template.Resources.VPCFlowLogsBucket.Properties;
                expect(properties.BucketName).toEqual({
                    'Fn::Sub': 'vpc-flow-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
                });
            });

            test('should block all public access', () => {
                const properties = template.Resources.VPCFlowLogsBucket.Properties;
                const publicAccessBlock = properties.PublicAccessBlockConfiguration;

                expect(publicAccessBlock.BlockPublicAcls).toBe(true);
                expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
                expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
                expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
            });

            test('should have versioning enabled', () => {
                const properties = template.Resources.VPCFlowLogsBucket.Properties;
                expect(properties.VersioningConfiguration.Status).toBe('Enabled');
            });

            test('should have lifecycle policy', () => {
                const properties = template.Resources.VPCFlowLogsBucket.Properties;
                const lifecycleRules = properties.LifecycleConfiguration.Rules;

                expect(lifecycleRules).toHaveLength(1);
                expect(lifecycleRules[0].Id).toBe('DeleteOldFlowLogs');
                expect(lifecycleRules[0].Status).toBe('Enabled');
                expect(lifecycleRules[0].ExpirationInDays).toBe(90);
            });
        });

        describe('VPC Flow Logs Bucket Policy', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.VPCFlowLogsBucketPolicy).toBeDefined();
                expect(template.Resources.VPCFlowLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
            });

            test('should be attached to VPC flow logs bucket', () => {
                const properties = template.Resources.VPCFlowLogsBucketPolicy.Properties;
                expect(properties.Bucket).toEqual({ Ref: 'VPCFlowLogsBucket' });
            });

            test('should allow log delivery service to write', () => {
                const properties = template.Resources.VPCFlowLogsBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const writeStatement = statements.find((s: any) => s.Sid === 'AWSLogDeliveryWrite');
                expect(writeStatement).toBeDefined();
                expect(writeStatement.Effect).toBe('Allow');
                expect(writeStatement.Principal.Service).toBe('delivery.logs.amazonaws.com');
                expect(writeStatement.Action).toBe('s3:PutObject');
            });

            test('should allow log delivery service ACL check', () => {
                const properties = template.Resources.VPCFlowLogsBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const aclStatement = statements.find((s: any) => s.Sid === 'AWSLogDeliveryAclCheck');
                expect(aclStatement).toBeDefined();
                expect(aclStatement.Action).toContain('s3:GetBucketAcl');
            });
        });

        describe('VPC Flow Log', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.VPCFlowLog).toBeDefined();
                expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
            });

            test('should depend on bucket policy', () => {
                expect(template.Resources.VPCFlowLog.DependsOn).toBe('VPCFlowLogsBucketPolicy');
            });

            test('should be configured for VPC', () => {
                const properties = template.Resources.VPCFlowLog.Properties;
                expect(properties.ResourceType).toBe('VPC');
                expect(properties.ResourceId).toEqual({ Ref: 'SecurityVPC' });
            });

            test('should capture all traffic', () => {
                const properties = template.Resources.VPCFlowLog.Properties;
                expect(properties.TrafficType).toBe('ALL');
            });

            test('should use S3 as destination', () => {
                const properties = template.Resources.VPCFlowLog.Properties;
                expect(properties.LogDestinationType).toBe('s3');
                expect(properties.LogDestination).toEqual({
                    'Fn::GetAtt': ['VPCFlowLogsBucket', 'Arn']
                });
            });
        });
    });

    // ==================== Security Group Tests ====================
    describe('Security Groups', () => {
        describe('Web Server Security Group', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.WebServerSecurityGroup).toBeDefined();
                expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
            });

            test('should have deterministic group name', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                expect(properties.GroupName).toEqual({
                    'Fn::Sub': 'SecurityBaselineWebServerSG-${EnvironmentSuffix}'
                });
            });

            test('should be associated with security VPC', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                expect(properties.VpcId).toEqual({ Ref: 'SecurityVPC' });
            });

            test('should have description', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                expect(properties.GroupDescription).toBeDefined();
                expect(properties.GroupDescription).toContain('SSH');
                expect(properties.GroupDescription).toContain('HTTP');
            });

            test('should allow SSH from allowed IP range', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                const sshRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);

                expect(sshRule).toBeDefined();
                expect(sshRule.IpProtocol).toBe('tcp');
                expect(sshRule.ToPort).toBe(22);
                expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
                expect(sshRule.Description).toContain('SSH');
            });

            test('should allow HTTP from allowed IP range', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                const httpRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

                expect(httpRule).toBeDefined();
                expect(httpRule.IpProtocol).toBe('tcp');
                expect(httpRule.ToPort).toBe(80);
                expect(httpRule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
                expect(httpRule.Description).toContain('HTTP');
            });

            test('should allow all outbound traffic', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                const egressRule = properties.SecurityGroupEgress[0];

                expect(egressRule.IpProtocol).toBe('-1');
                expect(egressRule.CidrIp).toBe('0.0.0.0/0');
                expect(egressRule.Description).toBe('Allow all outbound traffic');
            });

            test('all ingress rules should have descriptions', () => {
                const properties = template.Resources.WebServerSecurityGroup.Properties;
                properties.SecurityGroupIngress.forEach((rule: any) => {
                    expect(rule.Description).toBeDefined();
                    expect(rule.Description.length).toBeGreaterThan(0);
                });
            });

            test('should have proper tags', () => {
                const tags = template.Resources.WebServerSecurityGroup.Properties.Tags;
                expect(tags).toBeDefined();

                const nameTag = tags.find((t: any) => t.Key === 'Name');
                expect(nameTag).toBeDefined();
                expect(nameTag.Value).toBe('SecurityBaselineWebServerSG');
            });
        });
    });

    // ==================== CloudTrail Resources Tests ====================
    describe('CloudTrail Resources', () => {
        describe('CloudTrail Bucket', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.CloudTrailBucket).toBeDefined();
                expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
            });

            test('should have deterministic bucket name', () => {
                const properties = template.Resources.CloudTrailBucket.Properties;
                expect(properties.BucketName).toEqual({
                    'Fn::Sub': 'cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
                });
            });

            test('should have KMS encryption', () => {
                const properties = template.Resources.CloudTrailBucket.Properties;
                const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

                expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
                expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
            });

            test('should block all public access', () => {
                const properties = template.Resources.CloudTrailBucket.Properties;
                const publicAccessBlock = properties.PublicAccessBlockConfiguration;

                expect(publicAccessBlock.BlockPublicAcls).toBe(true);
                expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
                expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
                expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
            });

            test('should have versioning enabled', () => {
                const properties = template.Resources.CloudTrailBucket.Properties;
                expect(properties.VersioningConfiguration.Status).toBe('Enabled');
            });

            test('should have lifecycle policy for long-term retention', () => {
                const properties = template.Resources.CloudTrailBucket.Properties;
                const lifecycleRules = properties.LifecycleConfiguration.Rules;

                expect(lifecycleRules).toHaveLength(1);
                expect(lifecycleRules[0].Id).toBe('DeleteOldTrailLogs');
                expect(lifecycleRules[0].Status).toBe('Enabled');
                expect(lifecycleRules[0].ExpirationInDays).toBe(365);
            });
        });

        describe('CloudTrail Bucket Policy', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
                expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
            });

            test('should be attached to CloudTrail bucket', () => {
                const properties = template.Resources.CloudTrailBucketPolicy.Properties;
                expect(properties.Bucket).toEqual({ Ref: 'CloudTrailBucket' });
            });

            test('should allow CloudTrail to check bucket ACL', () => {
                const properties = template.Resources.CloudTrailBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
                expect(aclStatement).toBeDefined();
                expect(aclStatement.Effect).toBe('Allow');
                expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
                expect(aclStatement.Action).toBe('s3:GetBucketAcl');
            });

            test('should allow CloudTrail to write logs', () => {
                const properties = template.Resources.CloudTrailBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
                expect(writeStatement).toBeDefined();
                expect(writeStatement.Effect).toBe('Allow');
                expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
                expect(writeStatement.Action).toBe('s3:PutObject');
                expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
            });
        });

        describe('CloudTrail', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.CloudTrail).toBeDefined();
                expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
            });

            test('should depend on bucket policy', () => {
                expect(template.Resources.CloudTrail.DependsOn).toBe('CloudTrailBucketPolicy');
            });

            test('should have deterministic trail name', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.TrailName).toEqual({
                    'Fn::Sub': 'SecurityBaselineTrail-${EnvironmentSuffix}'
                });
            });

            test('should write to CloudTrail bucket', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
            });

            test('should include global service events', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.IncludeGlobalServiceEvents).toBe(true);
            });

            test('should be logging', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.IsLogging).toBe(true);
            });

            test('should be multi-region trail', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.IsMultiRegionTrail).toBe(true);
            });

            test('should enable log file validation', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.EnableLogFileValidation).toBe(true);
            });

            test('should have event selectors for all events', () => {
                const properties = template.Resources.CloudTrail.Properties;
                const eventSelector = properties.EventSelectors[0];

                expect(eventSelector.IncludeManagementEvents).toBe(true);
                expect(eventSelector.ReadWriteType).toBe('All');
            });

            test('should use KMS key for encryption', () => {
                const properties = template.Resources.CloudTrail.Properties;
                expect(properties.KMSKeyId).toEqual({ Ref: 'KMSKey' });
            });
        });

        describe('CloudTrail Log Group', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.CloudTrailLogGroup).toBeDefined();
                expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
            });

            test('should have correct log group name', () => {
                const properties = template.Resources.CloudTrailLogGroup.Properties;
                expect(properties.LogGroupName).toBe('/aws/cloudtrail');
            });

            test('should have retention policy', () => {
                const properties = template.Resources.CloudTrailLogGroup.Properties;
                expect(properties.RetentionInDays).toBe(365);
            });
        });
    });

    // ==================== Monitoring Resources Tests ====================
    describe('Monitoring Resources', () => {
        describe('SNS Alarm Topic', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.AlarmTopic).toBeDefined();
                expect(template.Resources.AlarmTopic.Type).toBe('AWS::SNS::Topic');
            });

            test('should have display name', () => {
                const properties = template.Resources.AlarmTopic.Properties;
                expect(properties.DisplayName).toBe('Security Alarms Topic');
            });

            test('should have topic name with environment suffix', () => {
                const properties = template.Resources.AlarmTopic.Properties;
                expect(properties.TopicName).toEqual({
                    'Fn::Sub': 'SecurityBaselineAlarms-${EnvironmentSuffix}'
                });
            });

            test('should have email subscription', () => {
                const properties = template.Resources.AlarmTopic.Properties;
                const subscription = properties.Subscription[0];

                expect(subscription.Endpoint).toEqual({ Ref: 'AdminEmail' });
                expect(subscription.Protocol).toBe('email');
            });
        });

        describe('Console Sign-In Failures Metric Filter', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConsoleSignInFailuresMetricFilter).toBeDefined();
                expect(template.Resources.ConsoleSignInFailuresMetricFilter.Type).toBe('AWS::Logs::MetricFilter');
            });

            test('should depend on CloudTrail log group', () => {
                expect(template.Resources.ConsoleSignInFailuresMetricFilter.DependsOn).toBe('CloudTrailLogGroup');
            });

            test('should be associated with CloudTrail log group', () => {
                const properties = template.Resources.ConsoleSignInFailuresMetricFilter.Properties;
                expect(properties.LogGroupName).toBe('/aws/cloudtrail');
            });

            test('should have correct filter name', () => {
                const properties = template.Resources.ConsoleSignInFailuresMetricFilter.Properties;
                expect(properties.FilterName).toBe('ConsoleSignInFailures');
            });

            test('should have correct filter pattern', () => {
                const properties = template.Resources.ConsoleSignInFailuresMetricFilter.Properties;
                const pattern = properties.FilterPattern;

                expect(pattern).toContain('ConsoleLogin');
                expect(pattern).toContain('Failed authentication');
            });

            test('should have correct metric transformation', () => {
                const properties = template.Resources.ConsoleSignInFailuresMetricFilter.Properties;
                const transformation = properties.MetricTransformations[0];

                expect(transformation.MetricName).toBe('ConsoleSignInFailureCount');
                expect(transformation.MetricNamespace).toBe('CloudTrailMetrics');
                expect(transformation.MetricValue).toBe('1');
                expect(transformation.DefaultValue).toBe(0);
            });
        });

        describe('Console Sign-In Failures Alarm', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConsoleSignInFailuresAlarm).toBeDefined();
                expect(template.Resources.ConsoleSignInFailuresAlarm.Type).toBe('AWS::CloudWatch::Alarm');
            });

            test('should have correct alarm name', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.AlarmName).toBe('Console-SignIn-Failures');
            });

            test('should have description', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.AlarmDescription).toBeDefined();
                expect(properties.AlarmDescription).toContain('failed');
                expect(properties.AlarmDescription).toContain('sign-in');
            });

            test('should monitor correct metric', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.MetricName).toBe('ConsoleSignInFailureCount');
                expect(properties.Namespace).toBe('CloudTrailMetrics');
            });

            test('should have correct threshold configuration', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.Statistic).toBe('Sum');
                expect(properties.Period).toBe(300);
                expect(properties.EvaluationPeriods).toBe(1);
                expect(properties.Threshold).toBe(3);
                expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
            });

            test('should send notification to SNS topic', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.AlarmActions).toEqual([{ Ref: 'AlarmTopic' }]);
            });

            test('should treat missing data as not breaching', () => {
                const properties = template.Resources.ConsoleSignInFailuresAlarm.Properties;
                expect(properties.TreatMissingData).toBe('notBreaching');
            });
        });
    });

    // ==================== S3 Secure Data Bucket Tests ====================
    describe('S3 Secure Data Bucket', () => {
        describe('Secure Data Bucket', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.SecureDataBucket).toBeDefined();
                expect(template.Resources.SecureDataBucket.Type).toBe('AWS::S3::Bucket');
            });

            test('should have deterministic bucket name', () => {
                const properties = template.Resources.SecureDataBucket.Properties;
                expect(properties.BucketName).toEqual({
                    'Fn::Sub': 'secure-data-bucket-${AWS::Region}-${EnvironmentSuffix}'
                });
            });

            test('should have KMS encryption', () => {
                const properties = template.Resources.SecureDataBucket.Properties;
                const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

                expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
                expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
            });

            test('should block all public access', () => {
                const properties = template.Resources.SecureDataBucket.Properties;
                const publicAccessBlock = properties.PublicAccessBlockConfiguration;

                expect(publicAccessBlock.BlockPublicAcls).toBe(true);
                expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
                expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
                expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
            });

            test('should have versioning enabled', () => {
                const properties = template.Resources.SecureDataBucket.Properties;
                expect(properties.VersioningConfiguration.Status).toBe('Enabled');
            });

            test('should have object lock disabled', () => {
                const properties = template.Resources.SecureDataBucket.Properties;
                expect(properties.ObjectLockEnabled).toBe(false);
            });
        });

        describe('Secure Data Bucket Policy', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.SecureDataBucketPolicy).toBeDefined();
                expect(template.Resources.SecureDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
            });

            test('should be attached to secure data bucket', () => {
                const properties = template.Resources.SecureDataBucketPolicy.Properties;
                expect(properties.Bucket).toEqual({ Ref: 'SecureDataBucket' });
            });

            test('should deny insecure transport', () => {
                const properties = template.Resources.SecureDataBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const denyInsecureStatement = statements.find((s: any) =>
                    s.Sid === 'DenyInsecureTransport'
                );

                expect(denyInsecureStatement).toBeDefined();
                expect(denyInsecureStatement.Effect).toBe('Deny');
                expect(denyInsecureStatement.Principal).toBe('*');
                expect(denyInsecureStatement.Action).toBe('s3:*');
                expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
            });

            test('should restrict access to CIDR', () => {
                const properties = template.Resources.SecureDataBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const cidrStatement = statements.find((s: any) =>
                    s.Sid === 'RestrictAccessToCIDR'
                );

                expect(cidrStatement).toBeDefined();
                expect(cidrStatement.Effect).toBe('Deny');
                expect(cidrStatement.Condition.NotIpAddress).toBeDefined();
                expect(cidrStatement.Condition.NotIpAddress['aws:SourceIp']).toEqual({ Ref: 'AllowedIPRange' });
            });
        });
    });

    // ==================== Secrets Manager Tests ====================
    describe('Secrets Manager', () => {
        describe('Database Secret', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.DatabaseSecret).toBeDefined();
                expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
            });

            test('should have deterministic secret name', () => {
                const properties = template.Resources.DatabaseSecret.Properties;
                expect(properties.Name).toEqual({
                    'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-Database-Credentials'
                });
            });

            test('should have description', () => {
                const properties = template.Resources.DatabaseSecret.Properties;
                expect(properties.Description).toBe('Database credentials for Security Baseline');
            });

            test('should generate secret with username and password', () => {
                const properties = template.Resources.DatabaseSecret.Properties;
                const generateConfig = properties.GenerateSecretString;

                expect(generateConfig.SecretStringTemplate).toBe('{"username": "admin"}');
                expect(generateConfig.GenerateStringKey).toBe('password');
                expect(generateConfig.PasswordLength).toBe(32);
                expect(generateConfig.ExcludeCharacters).toBe('\"@/\\\'');
                expect(generateConfig.RequireEachIncludedType).toBe(true);
            });

            test('should use KMS key for encryption', () => {
                const properties = template.Resources.DatabaseSecret.Properties;
                expect(properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
            });

            test('should have proper tags', () => {
                const tags = template.Resources.DatabaseSecret.Properties.Tags;
                expect(tags).toBeDefined();
                expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
                expect(tags.some((t: any) => t.Key === 'Purpose' && t.Value === 'SecurityBaseline')).toBe(true);
            });
        });
    });

    // ==================== AWS Config Resources Tests ====================
    describe('AWS Config Resources', () => {
        describe('Config Recorder', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConfigRecorder).toBeDefined();
                expect(template.Resources.ConfigRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
            });

            test('should have deterministic name', () => {
                const properties = template.Resources.ConfigRecorder.Properties;
                expect(properties.Name).toEqual({
                    'Fn::Sub': 'SecurityBaselineRecorder-${EnvironmentSuffix}'
                });
            });

            test('should record all supported resource types', () => {
                const properties = template.Resources.ConfigRecorder.Properties;
                const recordingGroup = properties.RecordingGroup;

                expect(recordingGroup.AllSupported).toBe(true);
                expect(recordingGroup.IncludeGlobalResourceTypes).toBe(true);
            });

            test('should use Config role', () => {
                const properties = template.Resources.ConfigRecorder.Properties;
                expect(properties.RoleARN).toEqual({
                    'Fn::GetAtt': ['ConfigRole', 'Arn']
                });
            });
        });

        describe('Config Bucket', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConfigBucket).toBeDefined();
                expect(template.Resources.ConfigBucket.Type).toBe('AWS::S3::Bucket');
            });

            test('should have deterministic bucket name', () => {
                const properties = template.Resources.ConfigBucket.Properties;
                expect(properties.BucketName).toEqual({
                    'Fn::Sub': 'config-bucket-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
                });
            });

            test('should have KMS encryption', () => {
                const properties = template.Resources.ConfigBucket.Properties;
                const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

                expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
                expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
            });

            test('should block all public access', () => {
                const properties = template.Resources.ConfigBucket.Properties;
                const publicAccessBlock = properties.PublicAccessBlockConfiguration;

                expect(publicAccessBlock.BlockPublicAcls).toBe(true);
                expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
                expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
                expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
            });
        });

        describe('Config Bucket Policy', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConfigBucketPolicy).toBeDefined();
                expect(template.Resources.ConfigBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
            });

            test('should be attached to Config bucket', () => {
                const properties = template.Resources.ConfigBucketPolicy.Properties;
                expect(properties.Bucket).toEqual({ Ref: 'ConfigBucket' });
            });

            test('should allow Config service to check bucket permissions', () => {
                const properties = template.Resources.ConfigBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const aclStatement = statements.find((s: any) =>
                    s.Sid === 'AWSConfigBucketPermissionsCheck'
                );

                expect(aclStatement).toBeDefined();
                expect(aclStatement.Principal.Service).toBe('config.amazonaws.com');
                expect(aclStatement.Action).toBe('s3:GetBucketAcl');
            });

            test('should allow Config service to write', () => {
                const properties = template.Resources.ConfigBucketPolicy.Properties;
                const statements = properties.PolicyDocument.Statement;

                const writeStatement = statements.find((s: any) =>
                    s.Sid === 'AWSConfigBucketWrite'
                );

                expect(writeStatement).toBeDefined();
                expect(writeStatement.Action).toBe('s3:PutObject');
                expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
            });
        });

        describe('Config Role', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConfigRole).toBeDefined();
                expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
            });

            test('should have correct trust policy', () => {
                const properties = template.Resources.ConfigRole.Properties;
                const assumePolicy = properties.AssumeRolePolicyDocument;

                expect(assumePolicy.Statement[0].Effect).toBe('Allow');
                expect(assumePolicy.Statement[0].Principal.Service).toBe('config.amazonaws.com');
                expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
            });

            test('should have AWS Config managed policy', () => {
                const properties = template.Resources.ConfigRole.Properties;
                expect(properties.ManagedPolicyArns).toContain(
                    'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
                );
            });

            test('should have S3 bucket policy', () => {
                const properties = template.Resources.ConfigRole.Properties;
                const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3BucketPolicy');

                expect(s3Policy).toBeDefined();
                expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetBucketAcl');
                expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
            });
        });

        describe('Config Delivery Channel', () => {
            test('should exist and be of correct type', () => {
                expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
                expect(template.Resources.ConfigDeliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
            });

            test('should have deterministic name', () => {
                const properties = template.Resources.ConfigDeliveryChannel.Properties;
                expect(properties.Name).toEqual({
                    'Fn::Sub': 'SecurityBaselineDeliveryChannel-${EnvironmentSuffix}'
                });
            });

            test('should use Config bucket', () => {
                const properties = template.Resources.ConfigDeliveryChannel.Properties;
                expect(properties.S3BucketName).toEqual({ Ref: 'ConfigBucket' });
            });

            test('should have snapshot delivery frequency', () => {
                const properties = template.Resources.ConfigDeliveryChannel.Properties;
                const snapshotProps = properties.ConfigSnapshotDeliveryProperties;

                expect(snapshotProps.DeliveryFrequency).toBe('TwentyFour_Hours');
            });
        });

        describe('Config Rules', () => {
            test('should have S3 public read prohibited rule', () => {
                expect(template.Resources.S3BucketPublicReadProhibited).toBeDefined();
                expect(template.Resources.S3BucketPublicReadProhibited.Type).toBe('AWS::Config::ConfigRule');
            });

            test('S3 public read rule should depend on recorder and channel', () => {
                const rule = template.Resources.S3BucketPublicReadProhibited;
                expect(rule.DependsOn).toContain('ConfigRecorder');
                expect(rule.DependsOn).toContain('ConfigDeliveryChannel');
            });

            test('S3 public read rule should have correct configuration', () => {
                const properties = template.Resources.S3BucketPublicReadProhibited.Properties;

                expect(properties.ConfigRuleName).toBe('s3-bucket-public-read-prohibited');
                expect(properties.Description).toContain('public read');
                expect(properties.Source.Owner).toBe('AWS');
                expect(properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
                expect(properties.Scope.ComplianceResourceTypes).toContain('AWS::S3::Bucket');
            });

            test('should have S3 public write prohibited rule', () => {
                expect(template.Resources.S3BucketPublicWriteProhibited).toBeDefined();
                expect(template.Resources.S3BucketPublicWriteProhibited.Type).toBe('AWS::Config::ConfigRule');
            });

            test('S3 public write rule should have correct configuration', () => {
                const properties = template.Resources.S3BucketPublicWriteProhibited.Properties;

                expect(properties.ConfigRuleName).toBe('s3-bucket-public-write-prohibited');
                expect(properties.Description).toContain('public write');
                expect(properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_WRITE_PROHIBITED');
            });
        });
    });

    // ==================== Outputs Tests ====================
    describe('Outputs', () => {
        test('should have at least 6 outputs', () => {
            const outputCount = Object.keys(template.Outputs).length;
            expect(outputCount).toBeGreaterThanOrEqual(6);
        });

        test('KMSKeyId output should be correct', () => {
            const output = template.Outputs.KMSKeyId;
            expect(output).toBeDefined();
            expect(output.Description).toContain('KMS key');
            expect(output.Value).toEqual({ Ref: 'KMSKey' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-KMSKeyId'
            });
        });

        test('SecureDataBucketName output should be correct', () => {
            const output = template.Outputs.SecureDataBucketName;
            expect(output).toBeDefined();
            expect(output.Description).toContain('secure data bucket');
            expect(output.Value).toEqual({ Ref: 'SecureDataBucket' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-SecureDataBucket'
            });
        });

        test('CloudTrailName output should be correct', () => {
            const output = template.Outputs.CloudTrailName;
            expect(output).toBeDefined();
            expect(output.Description).toContain('CloudTrail');
            expect(output.Value).toEqual({ Ref: 'CloudTrail' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-CloudTrail'
            });
        });

        test('VPCId output should be correct', () => {
            const output = template.Outputs.VPCId;
            expect(output).toBeDefined();
            expect(output.Description).toContain('Security VPC');
            expect(output.Value).toEqual({ Ref: 'SecurityVPC' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-VPCId'
            });
        });

        test('SecurityGroupId output should be correct', () => {
            const output = template.Outputs.SecurityGroupId;
            expect(output).toBeDefined();
            expect(output.Description).toContain('Security Group');
            expect(output.Value).toEqual({ Ref: 'WebServerSecurityGroup' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-SecurityGroupId'
            });
        });

        test('DatabaseSecretArn output should be correct', () => {
            const output = template.Outputs.DatabaseSecretArn;
            expect(output).toBeDefined();
            expect(output.Description).toContain('Secrets Manager secret');
            expect(output.Value).toEqual({ Ref: 'DatabaseSecret' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': 'SecurityBaseline-${EnvironmentSuffix}-DatabaseSecretArn'
            });
        });

        test('all outputs should have export names', () => {
            Object.keys(template.Outputs).forEach(outputKey => {
                const output = template.Outputs[outputKey];
                expect(output.Export).toBeDefined();
                expect(output.Export.Name).toBeDefined();
            });
        });
    });

    // ==================== Security Best Practices Tests ====================
    describe('Security Best Practices', () => {
        test('all S3 buckets should have encryption enabled', () => {
            const s3Buckets = Object.keys(template.Resources).filter(key =>
                template.Resources[key].Type === 'AWS::S3::Bucket'
            );

            s3Buckets.forEach(bucketKey => {
                const bucket = template.Resources[bucketKey].Properties;
                expect(bucket.BucketEncryption).toBeDefined();
                expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
            });
        });

        test('all S3 buckets should block public access', () => {
            const s3Buckets = Object.keys(template.Resources).filter(key =>
                template.Resources[key].Type === 'AWS::S3::Bucket'
            );

            s3Buckets.forEach(bucketKey => {
                const bucket = template.Resources[bucketKey].Properties;
                const publicAccessBlock = bucket.PublicAccessBlockConfiguration;

                expect(publicAccessBlock).toBeDefined();
                expect(publicAccessBlock.BlockPublicAcls).toBe(true);
                expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
                expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
                expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
            });
        });

        test('all security group rules should have descriptions', () => {
            const securityGroups = Object.keys(template.Resources).filter(key =>
                template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
            );

            securityGroups.forEach(sgKey => {
                const sg = template.Resources[sgKey].Properties;

                if (sg.SecurityGroupIngress) {
                    sg.SecurityGroupIngress.forEach((rule: any) => {
                        expect(rule.Description).toBeDefined();
                        expect(rule.Description.length).toBeGreaterThan(0);
                    });
                }
            });
        });

        test('CloudTrail should be enabled and logging', () => {
            const cloudTrail = template.Resources.CloudTrail.Properties;
            expect(cloudTrail.IsLogging).toBe(true);
        });

        test('CloudTrail should be multi-region', () => {
            const cloudTrail = template.Resources.CloudTrail.Properties;
            expect(cloudTrail.IsMultiRegionTrail).toBe(true);
        });

        test('CloudTrail should have log file validation enabled', () => {
            const cloudTrail = template.Resources.CloudTrail.Properties;
            expect(cloudTrail.EnableLogFileValidation).toBe(true);
        });

        test('Secrets Manager should use KMS encryption', () => {
            const secret = template.Resources.DatabaseSecret.Properties;
            expect(secret.KmsKeyId).toEqual({ Ref: 'KMSKey' });
        });

        test('IAM roles should follow least privilege principle', () => {
            const s3Role = template.Resources.S3ReadOnlyRole.Properties;
            const s3Policy = s3Role.Policies[0];

            // Should only have read permissions, not write
            const actions = s3Policy.PolicyDocument.Statement[0].Action;
            expect(actions).toContain('s3:GetObject');
            expect(actions).toContain('s3:ListBucket');
            expect(actions).not.toContain('s3:PutObject');
            expect(actions).not.toContain('s3:DeleteObject');
        });

        test('all buckets should have lifecycle policies where appropriate', () => {
            const bucketsWithLifecycle = ['VPCFlowLogsBucket', 'CloudTrailBucket'];

            bucketsWithLifecycle.forEach(bucketKey => {
                const bucket = template.Resources[bucketKey].Properties;
                expect(bucket.LifecycleConfiguration).toBeDefined();
                expect(bucket.LifecycleConfiguration.Rules).toBeDefined();
                expect(bucket.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
            });
        });

        test('Config rules should monitor S3 public access', () => {
            expect(template.Resources.S3BucketPublicReadProhibited).toBeDefined();
            expect(template.Resources.S3BucketPublicWriteProhibited).toBeDefined();
        });

        test('CloudWatch alarms should be configured for security events', () => {
            expect(template.Resources.ConsoleSignInFailuresAlarm).toBeDefined();

            const alarm = template.Resources.ConsoleSignInFailuresAlarm.Properties;
            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions.length).toBeGreaterThan(0);
        });

        test('SNS topic should be configured for alerting', () => {
            const topic = template.Resources.AlarmTopic.Properties;
            expect(topic.Subscription).toBeDefined();
            expect(topic.Subscription.length).toBeGreaterThan(0);
            expect(topic.Subscription[0].Protocol).toBe('email');
        });
    });

    // ==================== Template Validation Tests ====================
    describe('Template Validation', () => {
        test('should have valid JSON structure', () => {
            expect(template).toBeDefined();
            expect(typeof template).toBe('object');
        });

        test('should not have any undefined or null required sections', () => {
            expect(template.AWSTemplateFormatVersion).not.toBeNull();
            expect(template.Description).not.toBeNull();
            expect(template.Parameters).not.toBeNull();
            expect(template.Resources).not.toBeNull();
            expect(template.Outputs).not.toBeNull();
        });

        test('all resource types should be valid AWS CloudFormation types', () => {
            const validTypes = [
                'AWS::KMS::Key',
                'AWS::KMS::Alias',
                'AWS::IAM::Role',
                'AWS::EC2::VPC',
                'AWS::EC2::SecurityGroup',
                'AWS::EC2::FlowLog',
                'AWS::S3::Bucket',
                'AWS::S3::BucketPolicy',
                'AWS::CloudTrail::Trail',
                'AWS::SNS::Topic',
                'AWS::Logs::LogGroup',
                'AWS::Logs::MetricFilter',
                'AWS::CloudWatch::Alarm',
                'AWS::SecretsManager::Secret',
                'AWS::Config::ConfigurationRecorder',
                'AWS::Config::DeliveryChannel',
                'AWS::Config::ConfigRule'
            ];

            Object.keys(template.Resources).forEach(resourceKey => {
                const resourceType = template.Resources[resourceKey].Type;
                expect(validTypes).toContain(resourceType);
            });
        });

        test('all parameters should have descriptions', () => {
            Object.keys(template.Parameters).forEach(paramKey => {
                const param = template.Parameters[paramKey];
                expect(param.Description).toBeDefined();
                expect(param.Description.length).toBeGreaterThan(0);
            });
        });

        test('all outputs should have descriptions', () => {
            Object.keys(template.Outputs).forEach(outputKey => {
                const output = template.Outputs[outputKey];
                expect(output.Description).toBeDefined();
                expect(output.Description.length).toBeGreaterThan(0);
            });
        });

        test('all Fn::Sub functions should have valid syntax', () => {
            const templateStr = JSON.stringify(template);
            const fnSubMatches = templateStr.match(/"Fn::Sub":\s*"[^"]*"/g);

            if (fnSubMatches) {
                fnSubMatches.forEach(match => {
                    // Check for valid variable syntax ${VarName} or ${Resource.Attribute}
                    const varMatches = match.match(/\$\{[^}]+\}/g);
                    if (varMatches) {
                        varMatches.forEach(varMatch => {
                            // Allow alphanumeric, colons (for pseudo params), dots (for GetAtt), and hyphens
                            expect(varMatch).toMatch(/^\$\{[A-Za-z0-9:.\-_]+\}$/);
                        });
                    }
                });
            }
        });

        test('all Ref functions should reference valid resources or parameters', () => {
            const allResources = Object.keys(template.Resources);
            const allParameters = Object.keys(template.Parameters);
            const pseudoParameters = [
                'AWS::AccountId',
                'AWS::Region',
                'AWS::StackName',
                'AWS::StackId',
                'AWS::NotificationARNs',
                'AWS::NoValue',
                'AWS::Partition',
                'AWS::URLSuffix'
            ];

            const validRefs = [...allResources, ...allParameters, ...pseudoParameters];

            const templateStr = JSON.stringify(template);
            const refMatches = templateStr.match(/"Ref":\s*"([^"]+)"/g);

            if (refMatches) {
                refMatches.forEach(match => {
                    const refMatch = match.match(/"Ref":\s*"([^"]+)"/);
                    if (refMatch && refMatch[1]) {
                        const refValue = refMatch[1];
                        expect(validRefs).toContain(refValue);
                    }
                });
            }
        });
    });
});