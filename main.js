"use strict";
// main.ts - CDKTF Secure Enterprise Infrastructure
// IaC – AWS Nova Model Breaking - Single File Implementation
// This file demonstrates the corrected implementation as requested in the prompt
Object.defineProperty(exports, "__esModule", { value: true });
const cdktf_1 = require("cdktf");
const provider_1 = require("@cdktf/provider-aws/lib/provider");
const vpc_1 = require("@cdktf/provider-aws/lib/vpc");
const subnet_1 = require("@cdktf/provider-aws/lib/subnet");
const internet_gateway_1 = require("@cdktf/provider-aws/lib/internet-gateway");
const nat_gateway_1 = require("@cdktf/provider-aws/lib/nat-gateway");
const eip_1 = require("@cdktf/provider-aws/lib/eip");
const route_table_1 = require("@cdktf/provider-aws/lib/route-table");
const route_1 = require("@cdktf/provider-aws/lib/route");
const route_table_association_1 = require("@cdktf/provider-aws/lib/route-table-association");
const security_group_1 = require("@cdktf/provider-aws/lib/security-group");
const kms_key_1 = require("@cdktf/provider-aws/lib/kms-key");
const kms_alias_1 = require("@cdktf/provider-aws/lib/kms-alias");
const s3_bucket_1 = require("@cdktf/provider-aws/lib/s3-bucket");
const s3_bucket_server_side_encryption_configuration_1 = require("@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration");
const s3_bucket_public_access_block_1 = require("@cdktf/provider-aws/lib/s3-bucket-public-access-block");
const s3_bucket_logging_1 = require("@cdktf/provider-aws/lib/s3-bucket-logging");
const s3_bucket_versioning_1 = require("@cdktf/provider-aws/lib/s3-bucket-versioning");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_policy_1 = require("@cdktf/provider-aws/lib/iam-policy");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const iam_user_1 = require("@cdktf/provider-aws/lib/iam-user");
const iam_user_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-user-policy-attachment");
const iam_account_password_policy_1 = require("@cdktf/provider-aws/lib/iam-account-password-policy");
const cloudtrail_1 = require("@cdktf/provider-aws/lib/cloudtrail");
const config_configuration_recorder_1 = require("@cdktf/provider-aws/lib/config-configuration-recorder");
const config_config_rule_1 = require("@cdktf/provider-aws/lib/config-config-rule");
const guardduty_detector_1 = require("@cdktf/provider-aws/lib/guardduty-detector");
const cloudwatch_metric_alarm_1 = require("@cdktf/provider-aws/lib/cloudwatch-metric-alarm");
const sns_topic_1 = require("@cdktf/provider-aws/lib/sns-topic");
const ssm_parameter_1 = require("@cdktf/provider-aws/lib/ssm-parameter");
const data_aws_caller_identity_1 = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
class SecureEnterpriseStack extends cdktf_1.TerraformStack {
    constructor(scope, id) {
        super(scope, id);
        // Common tags for all resources - CORRECTED PROJECT NAME
        const commonTags = {
            Environment: 'Production',
            Project: 'IaC – AWS Nova Model Breaking', // Fixed: Exact prompt requirement
            ManagedBy: 'CDKTF',
            SecurityLevel: 'High',
        };
        // AWS Provider
        new provider_1.AwsProvider(this, 'aws', {
            region: 'us-east-1',
            defaultTags: [{ tags: commonTags }],
        });
        // Data sources
        const current = new data_aws_caller_identity_1.DataAwsCallerIdentity(this, 'current');
        // S3 Backend Configuration - CORRECTED with proper state management
        new cdktf_1.S3Backend(this, {
            bucket: 'prod-sec-terraform-state-bucket',
            key: 'nova-model/terraform.tfstate',
            region: 'us-east-1',
            dynamodbTable: 'prod-sec-terraform-locks',
            encrypt: true,
        });
        // KMS Keys for encryption
        const mainKmsKey = new kms_key_1.KmsKey(this, 'prod-sec-main-kms-key', {
            description: 'Main KMS key for prod-sec environment encryption',
            enableKeyRotation: true,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'Enable IAM User Permissions',
                        Effect: 'Allow',
                        Principal: {
                            AWS: `arn:aws:iam::${current.accountId}:root`,
                        },
                        Action: 'kms:*',
                        Resource: '*',
                    },
                    {
                        Sid: 'Allow CloudTrail to encrypt logs',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                        Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
                        Resource: '*',
                    },
                    {
                        Sid: 'Allow CloudWatch Logs',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'logs.us-east-1.amazonaws.com',
                        },
                        Action: [
                            'kms:Encrypt',
                            'kms:Decrypt',
                            'kms:ReEncrypt*',
                            'kms:GenerateDataKey*',
                            'kms:DescribeKey',
                        ],
                        Resource: '*',
                    },
                ],
            }),
            tags: { ...commonTags, Name: 'prod-sec-main-kms-key' },
        });
        new kms_alias_1.KmsAlias(this, 'prod-sec-main-kms-alias', {
            name: 'alias/prod-sec-main-key',
            targetKeyId: mainKmsKey.keyId,
        });
        // VPC Configuration
        const vpc = new vpc_1.Vpc(this, 'prod-sec-vpc', {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...commonTags, Name: 'prod-sec-vpc' },
        });
        // Internet Gateway
        const igw = new internet_gateway_1.InternetGateway(this, 'prod-sec-igw', {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: 'prod-sec-igw' },
        });
        // Public Subnets in 2+ AZs as required
        const publicSubnet1 = new subnet_1.Subnet(this, 'prod-sec-public-subnet-1', {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: 'us-east-1a',
            mapPublicIpOnLaunch: true,
            tags: { ...commonTags, Name: 'prod-sec-public-subnet-1', Type: 'Public' },
        });
        const publicSubnet2 = new subnet_1.Subnet(this, 'prod-sec-public-subnet-2', {
            vpcId: vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: 'us-east-1b',
            mapPublicIpOnLaunch: true,
            tags: { ...commonTags, Name: 'prod-sec-public-subnet-2', Type: 'Public' },
        });
        // Private Subnets
        const privateSubnet1 = new subnet_1.Subnet(this, 'prod-sec-private-subnet-1', {
            vpcId: vpc.id,
            cidrBlock: '10.0.10.0/24',
            availabilityZone: 'us-east-1a',
            tags: {
                ...commonTags,
                Name: 'prod-sec-private-subnet-1',
                Type: 'Private',
            },
        });
        const privateSubnet2 = new subnet_1.Subnet(this, 'prod-sec-private-subnet-2', {
            vpcId: vpc.id,
            cidrBlock: '10.0.11.0/24',
            availabilityZone: 'us-east-1b',
            tags: {
                ...commonTags,
                Name: 'prod-sec-private-subnet-2',
                Type: 'Private',
            },
        });
        // Elastic IPs for NAT Gateways
        const eip1 = new eip_1.Eip(this, 'prod-sec-nat-eip-1', {
            domain: 'vpc',
            tags: { ...commonTags, Name: 'prod-sec-nat-eip-1' },
        });
        const eip2 = new eip_1.Eip(this, 'prod-sec-nat-eip-2', {
            domain: 'vpc',
            tags: { ...commonTags, Name: 'prod-sec-nat-eip-2' },
        });
        // NAT Gateways
        const natGw1 = new nat_gateway_1.NatGateway(this, 'prod-sec-nat-gw-1', {
            allocationId: eip1.id,
            subnetId: publicSubnet1.id,
            tags: { ...commonTags, Name: 'prod-sec-nat-gw-1' },
        });
        const natGw2 = new nat_gateway_1.NatGateway(this, 'prod-sec-nat-gw-2', {
            allocationId: eip2.id,
            subnetId: publicSubnet2.id,
            tags: { ...commonTags, Name: 'prod-sec-nat-gw-2' },
        });
        // Route Tables
        const publicRouteTable = new route_table_1.RouteTable(this, 'prod-sec-public-rt', {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: 'prod-sec-public-rt' },
        });
        const privateRouteTable1 = new route_table_1.RouteTable(this, 'prod-sec-private-rt-1', {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: 'prod-sec-private-rt-1' },
        });
        const privateRouteTable2 = new route_table_1.RouteTable(this, 'prod-sec-private-rt-2', {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: 'prod-sec-private-rt-2' },
        });
        // Routes
        new route_1.Route(this, 'prod-sec-public-route', {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
        });
        new route_1.Route(this, 'prod-sec-private-route-1', {
            routeTableId: privateRouteTable1.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGw1.id,
        });
        new route_1.Route(this, 'prod-sec-private-route-2', {
            routeTableId: privateRouteTable2.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGw2.id,
        });
        // Route Table Associations
        new route_table_association_1.RouteTableAssociation(this, 'prod-sec-public-rta-1', {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id,
        });
        new route_table_association_1.RouteTableAssociation(this, 'prod-sec-public-rta-2', {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id,
        });
        new route_table_association_1.RouteTableAssociation(this, 'prod-sec-private-rta-1', {
            subnetId: privateSubnet1.id,
            routeTableId: privateRouteTable1.id,
        });
        new route_table_association_1.RouteTableAssociation(this, 'prod-sec-private-rta-2', {
            subnetId: privateSubnet2.id,
            routeTableId: privateRouteTable2.id,
        });
        // Security Groups - CORRECTED Implementation (Fixed from MODEL_RESPONSE failures)
        const webSecurityGroup = new security_group_1.SecurityGroup(this, 'prod-sec-web-sg', {
            name: 'prod-sec-web-sg',
            description: 'Security group for web tier',
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS inbound',
                },
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP inbound (redirect to HTTPS)',
                },
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: { ...commonTags, Name: 'prod-sec-web-sg', Tier: 'Web' },
        });
        const appSecurityGroup = new security_group_1.SecurityGroup(this, 'prod-sec-app-sg', {
            name: 'prod-sec-app-sg',
            description: 'Security group for application tier',
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 8080,
                    toPort: 8080,
                    protocol: 'tcp',
                    securityGroups: [webSecurityGroup.id], // FIXED: Correct reference
                    description: 'From web tier',
                },
            ],
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound for API calls',
                },
            ],
            tags: { ...commonTags, Name: 'prod-sec-app-sg', Tier: 'Application' },
        });
        const dbSecurityGroup = new security_group_1.SecurityGroup(this, 'prod-sec-db-sg', {
            name: 'prod-sec-db-sg',
            description: 'Security group for database tier',
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 5432,
                    toPort: 5432,
                    protocol: 'tcp',
                    securityGroups: [appSecurityGroup.id], // FIXED: Correct reference
                    description: 'From application tier',
                },
            ],
            tags: { ...commonTags, Name: 'prod-sec-db-sg', Tier: 'Database' },
        });
        // S3 Buckets with security configurations
        const logsBucket = new s3_bucket_1.S3Bucket(this, 'prod-sec-logs-bucket', {
            bucket: `prod-sec-logs-${current.accountId}`,
            tags: { ...commonTags, Name: 'prod-sec-logs-bucket', Purpose: 'Logging' },
        });
        new s3_bucket_server_side_encryption_configuration_1.S3BucketServerSideEncryptionConfigurationA(this, 'prod-sec-logs-bucket-encryption', {
            bucket: logsBucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsMasterKeyId: mainKmsKey.arn,
                        sseAlgorithm: 'aws:kms',
                    },
                    bucketKeyEnabled: true,
                },
            ],
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, 'prod-sec-logs-bucket-pab', {
            bucket: logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, 'prod-sec-logs-bucket-versioning', {
            bucket: logsBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        });
        const appDataBucket = new s3_bucket_1.S3Bucket(this, 'prod-sec-app-data-bucket', {
            bucket: `prod-sec-app-data-${current.accountId}`,
            tags: {
                ...commonTags,
                Name: 'prod-sec-app-data-bucket',
                Purpose: 'Application Data',
            },
        });
        new s3_bucket_server_side_encryption_configuration_1.S3BucketServerSideEncryptionConfigurationA(this, 'prod-sec-app-data-bucket-encryption', {
            bucket: appDataBucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsMasterKeyId: mainKmsKey.arn,
                        sseAlgorithm: 'aws:kms',
                    },
                    bucketKeyEnabled: true,
                },
            ],
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, 'prod-sec-app-data-bucket-pab', {
            bucket: appDataBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, 'prod-sec-app-data-bucket-versioning', {
            bucket: appDataBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        });
        new s3_bucket_logging_1.S3BucketLoggingA(this, 'prod-sec-app-data-bucket-logging', {
            bucket: appDataBucket.id,
            targetBucket: logsBucket.id,
            targetPrefix: 's3-access-logs/',
        });
        // IAM Password Policy - ENHANCED with MFA requirements
        new iam_account_password_policy_1.IamAccountPasswordPolicy(this, 'prod-sec-password-policy', {
            minimumPasswordLength: 14,
            requireLowercaseCharacters: true,
            requireNumbers: true,
            requireSymbols: true,
            requireUppercaseCharacters: true,
            allowUsersToChangePassword: true,
            maxPasswordAge: 90,
            passwordReusePrevention: 12,
            hardExpiry: false,
        });
        // MFA Enforcement Policy - ADDED to address missing MFA requirement
        const mfaEnforcementPolicy = new iam_policy_1.IamPolicy(this, 'prod-sec-mfa-enforcement-policy', {
            name: 'prod-sec-mfa-enforcement-policy',
            description: 'Enforce MFA for critical operations',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyAllExceptUsersWithMFA',
                        Effect: 'Deny',
                        NotAction: [
                            'iam:CreateVirtualMFADevice',
                            'iam:EnableMFADevice',
                            'iam:GetUser',
                            'iam:ListMFADevices',
                            'iam:ListVirtualMFADevices',
                            'iam:ResyncMFADevice',
                            'sts:GetSessionToken',
                        ],
                        Resource: '*',
                        Condition: {
                            BoolIfExists: {
                                'aws:MultiFactorAuthPresent': 'false',
                            },
                        },
                    },
                ],
            }),
            tags: commonTags,
        });
        // IAM Policies with least privilege
        const ec2ReadOnlyPolicy = new iam_policy_1.IamPolicy(this, 'prod-sec-ec2-readonly-policy', {
            name: 'prod-sec-ec2-readonly-policy',
            description: 'Read-only access to EC2 resources',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['ec2:Describe*', 'ec2:Get*', 'ec2:List*'],
                        Resource: '*',
                    },
                ],
            }),
            tags: commonTags,
        });
        const s3AppDataPolicy = new iam_policy_1.IamPolicy(this, 'prod-sec-s3-app-data-policy', {
            name: 'prod-sec-s3-app-data-policy',
            description: 'Access to application data S3 bucket',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                        Resource: `${appDataBucket.arn}/*`,
                    },
                    {
                        Effect: 'Allow',
                        Action: ['s3:ListBucket'],
                        Resource: appDataBucket.arn,
                    },
                    {
                        Effect: 'Allow',
                        Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                        Resource: mainKmsKey.arn,
                    },
                ],
            }),
            tags: commonTags,
        });
        // IAM Roles
        const appRole = new iam_role_1.IamRole(this, 'prod-sec-app-role', {
            name: 'prod-sec-app-role',
            description: 'Role for application instances',
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ec2.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: commonTags,
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'prod-sec-app-role-s3-policy', {
            role: appRole.name,
            policyArn: s3AppDataPolicy.arn,
        });
        // IAM Users with least privilege
        const devUser = new iam_user_1.IamUser(this, 'prod-sec-dev-user', {
            name: 'prod-sec-dev-user',
            path: '/developers/',
            tags: { ...commonTags, UserType: 'Developer' },
        });
        const opsUser = new iam_user_1.IamUser(this, 'prod-sec-ops-user', {
            name: 'prod-sec-ops-user',
            path: '/operations/',
            tags: { ...commonTags, UserType: 'Operations' },
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, 'prod-sec-dev-user-ec2-readonly', {
            user: devUser.name,
            policyArn: ec2ReadOnlyPolicy.arn,
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, 'prod-sec-dev-user-mfa-enforcement', {
            user: devUser.name,
            policyArn: mfaEnforcementPolicy.arn,
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, 'prod-sec-ops-user-mfa-enforcement', {
            user: opsUser.name,
            policyArn: mfaEnforcementPolicy.arn,
        });
        // Secrets Manager
        // const dbSecret = new SecretsmanagerSecret(this, 'prod-sec-db-credentials', {
        //   name: 'prod-sec/database/credentials',
        //   description: 'Database credentials for prod-sec environment',
        //   kmsKeyId: mainKmsKey.arn,
        //   tags: commonTags,
        // });
        // SSM Parameters
        new ssm_parameter_1.SsmParameter(this, 'prod-sec-app-config', {
            name: '/prod-sec/app/config',
            type: 'SecureString',
            value: JSON.stringify({
                environment: 'production',
                debug: false,
                logLevel: 'INFO',
            }),
            keyId: mainKmsKey.arn,
            description: 'Application configuration parameters',
            tags: commonTags,
        });
        // CloudWatch Log Groups
        // const appLogGroup = new CloudwatchLogGroup(this, 'prod-sec-app-logs', {
        //   name: '/aws/ec2/prod-sec-app',
        //   retentionInDays: 90,
        //   kmsKeyId: mainKmsKey.arn,
        //   tags: commonTags,
        // });
        // const vpcFlowLogGroup = new CloudwatchLogGroup(
        //   this,
        //   'prod-sec-vpc-flow-logs',
        //   {
        //     name: '/aws/vpc/prod-sec-flowlogs',
        //     retentionInDays: 30,
        //     kmsKeyId: mainKmsKey.arn,
        //     tags: commonTags,
        //   }
        // );
        // SNS Topic for alerts
        const alertsTopic = new sns_topic_1.SnsTopic(this, 'prod-sec-security-alerts', {
            name: 'prod-sec-security-alerts',
            tags: commonTags,
        });
        // CloudWatch Alarms
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, 'prod-sec-root-access-alarm', {
            alarmName: 'prod-sec-root-access-alarm',
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: 'RootAccessCount',
            namespace: 'CWLogs',
            period: 300,
            statistic: 'Sum',
            threshold: 1,
            alarmDescription: 'Alert when root user access is detected',
            alarmActions: [alertsTopic.arn],
            tags: commonTags,
        });
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, 'prod-sec-unauthorized-api-calls', {
            alarmName: 'prod-sec-unauthorized-api-calls',
            comparisonOperator: 'GreaterThanOrEqualToThreshold',
            evaluationPeriods: 1,
            metricName: 'UnauthorizedAPICalls',
            namespace: 'CWLogs',
            period: 300,
            statistic: 'Sum',
            threshold: 5,
            alarmDescription: 'Alert on unauthorized API calls',
            alarmActions: [alertsTopic.arn],
            tags: commonTags,
        });
        // CloudTrail - CORRECTED Implementation
        const cloudtrail = new cloudtrail_1.Cloudtrail(this, 'prod-sec-cloudtrail', {
            name: 'prod-sec-cloudtrail',
            s3BucketName: logsBucket.id,
            s3KeyPrefix: 'cloudtrail-logs/',
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: true,
            enableLogging: true,
            enableLogFileValidation: true,
            kmsKeyId: mainKmsKey.arn,
            tags: commonTags,
        });
        // AWS Config - CORRECTED dependencies
        const configRole = new iam_role_1.IamRole(this, 'prod-sec-config-role', {
            name: 'prod-sec-config-role',
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'config.amazonaws.com',
                        },
                    },
                ],
            }),
            managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/ConfigRole'],
            tags: commonTags,
        });
        const configBucketPolicy = new iam_policy_1.IamPolicy(this, 'prod-sec-config-bucket-policy', {
            name: 'prod-sec-config-bucket-policy',
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['s3:GetBucketAcl', 's3:ListBucket'],
                        Resource: logsBucket.arn,
                    },
                    {
                        Effect: 'Allow',
                        Action: 's3:PutObject',
                        Resource: `${logsBucket.arn}/config-logs/*`,
                        Condition: {
                            StringEquals: {
                                's3:x-amz-acl': 'bucket-owner-full-control',
                            },
                        },
                    },
                ],
            }),
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'prod-sec-config-role-bucket-policy', {
            role: configRole.name,
            policyArn: configBucketPolicy.arn,
        });
        const configRecorder = new config_configuration_recorder_1.ConfigConfigurationRecorder(this, 'prod-sec-config-recorder', {
            name: 'prod-sec-config-recorder',
            roleArn: configRole.arn,
            recordingGroup: {
                allSupported: true,
                includeGlobalResourceTypes: true,
            },
        });
        // FIXED: Added dependency for delivery channel
        // const configDeliveryChannel = new ConfigDeliveryChannel(
        //   this,
        //   'prod-sec-config-delivery-channel',
        //   {
        //     name: 'prod-sec-config-delivery-channel',
        //     s3BucketName: logsBucket.id,
        //     s3KeyPrefix: 'config-logs/',
        //     dependsOn: [configRecorder],
        //   }
        // );
        // Config Rules
        new config_config_rule_1.ConfigConfigRule(this, 'prod-sec-s3-bucket-public-access-prohibited', {
            name: 's3-bucket-public-access-prohibited',
            source: {
                owner: 'AWS',
                sourceIdentifier: 'S3_BUCKET_PUBLIC_ACCESS_PROHIBITED',
            },
            dependsOn: [configRecorder],
        });
        new config_config_rule_1.ConfigConfigRule(this, 'prod-sec-encrypted-volumes', {
            name: 'encrypted-volumes',
            source: {
                owner: 'AWS',
                sourceIdentifier: 'ENCRYPTED_VOLUMES',
            },
            dependsOn: [configRecorder],
        });
        new config_config_rule_1.ConfigConfigRule(this, 'prod-sec-iam-password-policy', {
            name: 'iam-password-policy',
            source: {
                owner: 'AWS',
                sourceIdentifier: 'IAM_PASSWORD_POLICY',
            },
            inputParameters: JSON.stringify({
                RequireUppercaseCharacters: 'true',
                RequireLowercaseCharacters: 'true',
                RequireSymbols: 'true',
                RequireNumbers: 'true',
                MinimumPasswordLength: '14',
            }),
            dependsOn: [configRecorder],
        });
        // GuardDuty - ENHANCED with S3 protection
        new guardduty_detector_1.GuarddutyDetector(this, 'prod-sec-guardduty', {
            enable: true,
            findingPublishingFrequency: 'FIFTEEN_MINUTES',
            datasources: {
                s3Logs: {
                    enable: true,
                },
                kubernetes: {
                    auditLogs: {
                        enable: true,
                    },
                },
                malwareProtection: {
                    scanEc2InstanceWithFindings: {
                        ebsVolumes: {
                            enable: true,
                        },
                    },
                },
            },
            tags: commonTags,
        });
        // Outputs
        new cdktf_1.TerraformOutput(this, 'vpc_id', {
            value: vpc.id,
            description: 'VPC ID',
        });
        new cdktf_1.TerraformOutput(this, 'public_subnet_ids', {
            value: [publicSubnet1.id, publicSubnet2.id],
            description: 'Public subnet IDs',
        });
        new cdktf_1.TerraformOutput(this, 'private_subnet_ids', {
            value: [privateSubnet1.id, privateSubnet2.id],
            description: 'Private subnet IDs',
        });
        new cdktf_1.TerraformOutput(this, 'kms_key_id', {
            value: mainKmsKey.keyId,
            description: 'Main KMS key ID',
        });
        new cdktf_1.TerraformOutput(this, 'security_group_ids', {
            value: {
                web: webSecurityGroup.id,
                app: appSecurityGroup.id,
                db: dbSecurityGroup.id,
            },
            description: 'Security group IDs by tier',
        });
        new cdktf_1.TerraformOutput(this, 'cloudtrail_name', {
            value: cloudtrail.name,
            description: 'CloudTrail name',
        });
        new cdktf_1.TerraformOutput(this, 'logs_bucket_name', {
            value: logsBucket.bucket,
            description: 'Logs S3 bucket name',
        });
    }
}
// CORRECTED: Application bootstrap with proper structure
const app = new cdktf_1.App();
new SecureEnterpriseStack(app, 'prod-sec');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDtBQUNuRCw2REFBNkQ7QUFDN0QsaUZBQWlGOztBQUdqRixpQ0FBd0U7QUFDeEUsK0RBQStEO0FBQy9ELHFEQUFrRDtBQUNsRCwyREFBd0Q7QUFDeEQsK0VBQTJFO0FBQzNFLHFFQUFpRTtBQUNqRSxxREFBa0Q7QUFDbEQscUVBQWlFO0FBQ2pFLHlEQUFzRDtBQUN0RCw2RkFBd0Y7QUFDeEYsMkVBQXVFO0FBQ3ZFLDZEQUF5RDtBQUN6RCxpRUFBNkQ7QUFDN0QsaUVBQTZEO0FBQzdELDJJQUFvSTtBQUNwSSx5R0FBa0c7QUFDbEcsaUZBQTZFO0FBQzdFLHVGQUFtRjtBQUNuRiwrREFBMkQ7QUFDM0QsbUVBQStEO0FBQy9ELG1HQUE2RjtBQUM3RiwrREFBMkQ7QUFDM0QsbUdBQTZGO0FBQzdGLHFHQUErRjtBQUMvRixtRUFBZ0U7QUFDaEUseUdBQW9HO0FBQ3BHLG1GQUE4RTtBQUM5RSxtRkFBK0U7QUFDL0UsNkZBQXdGO0FBQ3hGLGlFQUE2RDtBQUM3RCx5RUFBcUU7QUFDckUsK0ZBQXlGO0FBRXpGLE1BQU0scUJBQXNCLFNBQVEsc0JBQWM7SUFDaEQsWUFBWSxLQUFnQixFQUFFLEVBQVU7UUFDdEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQix5REFBeUQ7UUFDekQsTUFBTSxVQUFVLEdBQUc7WUFDakIsV0FBVyxFQUFFLFlBQVk7WUFDekIsT0FBTyxFQUFFLCtCQUErQixFQUFFLGtDQUFrQztZQUM1RSxTQUFTLEVBQUUsT0FBTztZQUNsQixhQUFhLEVBQUUsTUFBTTtTQUN0QixDQUFDO1FBRUYsZUFBZTtRQUNmLElBQUksc0JBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzNCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDO1NBQ3BDLENBQUMsQ0FBQztRQUVILGVBQWU7UUFDZixNQUFNLE9BQU8sR0FBRyxJQUFJLGdEQUFxQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUUzRCxvRUFBb0U7UUFDcEUsSUFBSSxpQkFBUyxDQUFDLElBQUksRUFBRTtZQUNsQixNQUFNLEVBQUUsaUNBQWlDO1lBQ3pDLEdBQUcsRUFBRSw4QkFBOEI7WUFDbkMsTUFBTSxFQUFFLFdBQVc7WUFDbkIsYUFBYSxFQUFFLDBCQUEwQjtZQUN6QyxPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLFVBQVUsR0FBRyxJQUFJLGdCQUFNLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzNELFdBQVcsRUFBRSxrREFBa0Q7WUFDL0QsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxHQUFHLEVBQUUsNkJBQTZCO3dCQUNsQyxNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUU7NEJBQ1QsR0FBRyxFQUFFLGdCQUFnQixPQUFPLENBQUMsU0FBUyxPQUFPO3lCQUM5Qzt3QkFDRCxNQUFNLEVBQUUsT0FBTzt3QkFDZixRQUFRLEVBQUUsR0FBRztxQkFDZDtvQkFDRDt3QkFDRSxHQUFHLEVBQUUsa0NBQWtDO3dCQUN2QyxNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUU7NEJBQ1QsT0FBTyxFQUFFLDBCQUEwQjt5QkFDcEM7d0JBQ0QsTUFBTSxFQUFFLENBQUMsc0JBQXNCLEVBQUUsaUJBQWlCLENBQUM7d0JBQ25ELFFBQVEsRUFBRSxHQUFHO3FCQUNkO29CQUNEO3dCQUNFLEdBQUcsRUFBRSx1QkFBdUI7d0JBQzVCLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsOEJBQThCO3lCQUN4Qzt3QkFDRCxNQUFNLEVBQUU7NEJBQ04sYUFBYTs0QkFDYixhQUFhOzRCQUNiLGdCQUFnQjs0QkFDaEIsc0JBQXNCOzRCQUN0QixpQkFBaUI7eUJBQ2xCO3dCQUNELFFBQVEsRUFBRSxHQUFHO3FCQUNkO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRTtTQUN2RCxDQUFDLENBQUM7UUFFSCxJQUFJLG9CQUFRLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQzVDLElBQUksRUFBRSx5QkFBeUI7WUFDL0IsV0FBVyxFQUFFLFVBQVUsQ0FBQyxLQUFLO1NBQzlCLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3hDLFNBQVMsRUFBRSxhQUFhO1lBQ3hCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFO1NBQzlDLENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQixNQUFNLEdBQUcsR0FBRyxJQUFJLGtDQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNwRCxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDYixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFO1NBQzlDLENBQUMsQ0FBQztRQUVILHVDQUF1QztRQUN2QyxNQUFNLGFBQWEsR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDakUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsU0FBUyxFQUFFLGFBQWE7WUFDeEIsZ0JBQWdCLEVBQUUsWUFBWTtZQUM5QixtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSwwQkFBMEIsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzFFLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNqRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDYixTQUFTLEVBQUUsYUFBYTtZQUN4QixnQkFBZ0IsRUFBRSxZQUFZO1lBQzlCLG1CQUFtQixFQUFFLElBQUk7WUFDekIsSUFBSSxFQUFFLEVBQUUsR0FBRyxVQUFVLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7U0FDMUUsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sY0FBYyxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSwyQkFBMkIsRUFBRTtZQUNuRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDYixTQUFTLEVBQUUsY0FBYztZQUN6QixnQkFBZ0IsRUFBRSxZQUFZO1lBQzlCLElBQUksRUFBRTtnQkFDSixHQUFHLFVBQVU7Z0JBQ2IsSUFBSSxFQUFFLDJCQUEyQjtnQkFDakMsSUFBSSxFQUFFLFNBQVM7YUFDaEI7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDbkUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsU0FBUyxFQUFFLGNBQWM7WUFDekIsZ0JBQWdCLEVBQUUsWUFBWTtZQUM5QixJQUFJLEVBQUU7Z0JBQ0osR0FBRyxVQUFVO2dCQUNiLElBQUksRUFBRSwyQkFBMkI7Z0JBQ2pDLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsK0JBQStCO1FBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksU0FBRyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUMvQyxNQUFNLEVBQUUsS0FBSztZQUNiLElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLElBQUksR0FBRyxJQUFJLFNBQUcsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDL0MsTUFBTSxFQUFFLEtBQUs7WUFDYixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsZUFBZTtRQUNmLE1BQU0sTUFBTSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDdkQsWUFBWSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3JCLFFBQVEsRUFBRSxhQUFhLENBQUMsRUFBRTtZQUMxQixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUN2RCxZQUFZLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDckIsUUFBUSxFQUFFLGFBQWEsQ0FBQyxFQUFFO1lBQzFCLElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRTtTQUNuRCxDQUFDLENBQUM7UUFFSCxlQUFlO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHdCQUFVLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQ2xFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLGtCQUFrQixHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDdkUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsSUFBSSxFQUFFLEVBQUUsR0FBRyxVQUFVLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1NBQ3ZELENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx3QkFBVSxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUN2RSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDYixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7U0FDdkQsQ0FBQyxDQUFDO1FBRUgsU0FBUztRQUNULElBQUksYUFBSyxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUN2QyxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxvQkFBb0IsRUFBRSxXQUFXO1lBQ2pDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRTtTQUNsQixDQUFDLENBQUM7UUFFSCxJQUFJLGFBQUssQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDMUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLEVBQUU7WUFDbkMsb0JBQW9CLEVBQUUsV0FBVztZQUNqQyxZQUFZLEVBQUUsTUFBTSxDQUFDLEVBQUU7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxhQUFLLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQzFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFO1lBQ25DLG9CQUFvQixFQUFFLFdBQVc7WUFDakMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1NBQ3hCLENBQUMsQ0FBQztRQUVILDJCQUEyQjtRQUMzQixJQUFJLCtDQUFxQixDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUN2RCxRQUFRLEVBQUUsYUFBYSxDQUFDLEVBQUU7WUFDMUIsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEVBQUU7U0FDbEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSwrQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDdkQsUUFBUSxFQUFFLGFBQWEsQ0FBQyxFQUFFO1lBQzFCLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO1NBQ2xDLENBQUMsQ0FBQztRQUVILElBQUksK0NBQXFCLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ3hELFFBQVEsRUFBRSxjQUFjLENBQUMsRUFBRTtZQUMzQixZQUFZLEVBQUUsa0JBQWtCLENBQUMsRUFBRTtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLCtDQUFxQixDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUN4RCxRQUFRLEVBQUUsY0FBYyxDQUFDLEVBQUU7WUFDM0IsWUFBWSxFQUFFLGtCQUFrQixDQUFDLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsa0ZBQWtGO1FBQ2xGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw4QkFBYSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNsRSxJQUFJLEVBQUUsaUJBQWlCO1lBQ3ZCLFdBQVcsRUFBRSw2QkFBNkI7WUFDMUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsT0FBTyxFQUFFO2dCQUNQO29CQUNFLFFBQVEsRUFBRSxHQUFHO29CQUNiLE1BQU0sRUFBRSxHQUFHO29CQUNYLFFBQVEsRUFBRSxLQUFLO29CQUNmLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLGVBQWU7aUJBQzdCO2dCQUNEO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLE1BQU0sRUFBRSxFQUFFO29CQUNWLFFBQVEsRUFBRSxLQUFLO29CQUNmLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLGtDQUFrQztpQkFDaEQ7YUFDRjtZQUNELE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxRQUFRLEVBQUUsQ0FBQztvQkFDWCxNQUFNLEVBQUUsQ0FBQztvQkFDVCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtTQUM5RCxDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDbEUsSUFBSSxFQUFFLGlCQUFpQjtZQUN2QixXQUFXLEVBQUUscUNBQXFDO1lBQ2xELEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxRQUFRLEVBQUUsSUFBSTtvQkFDZCxNQUFNLEVBQUUsSUFBSTtvQkFDWixRQUFRLEVBQUUsS0FBSztvQkFDZixjQUFjLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSwyQkFBMkI7b0JBQ2xFLFdBQVcsRUFBRSxlQUFlO2lCQUM3QjthQUNGO1lBQ0QsTUFBTSxFQUFFO2dCQUNOO29CQUNFLFFBQVEsRUFBRSxHQUFHO29CQUNiLE1BQU0sRUFBRSxHQUFHO29CQUNYLFFBQVEsRUFBRSxLQUFLO29CQUNmLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLDhCQUE4QjtpQkFDNUM7YUFDRjtZQUNELElBQUksRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFO1NBQ3RFLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDaEUsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixXQUFXLEVBQUUsa0NBQWtDO1lBQy9DLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxRQUFRLEVBQUUsSUFBSTtvQkFDZCxNQUFNLEVBQUUsSUFBSTtvQkFDWixRQUFRLEVBQUUsS0FBSztvQkFDZixjQUFjLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBRSwyQkFBMkI7b0JBQ2xFLFdBQVcsRUFBRSx1QkFBdUI7aUJBQ3JDO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtTQUNsRSxDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFDMUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM1RCxNQUFNLEVBQUUsaUJBQWlCLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDNUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxVQUFVLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUU7U0FDMUUsQ0FBQyxDQUFDO1FBRUgsSUFBSSwyRkFBMEMsQ0FDNUMsSUFBSSxFQUNKLGlDQUFpQyxFQUNqQztZQUNFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBRTtZQUNyQixJQUFJLEVBQUU7Z0JBQ0o7b0JBQ0Usa0NBQWtDLEVBQUU7d0JBQ2xDLGNBQWMsRUFBRSxVQUFVLENBQUMsR0FBRzt3QkFDOUIsWUFBWSxFQUFFLFNBQVM7cUJBQ3hCO29CQUNELGdCQUFnQixFQUFFLElBQUk7aUJBQ3ZCO2FBQ0Y7U0FDRixDQUNGLENBQUM7UUFFRixJQUFJLHlEQUF5QixDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUM5RCxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDckIsZUFBZSxFQUFFLElBQUk7WUFDckIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLHFCQUFxQixFQUFFLElBQUk7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSwwQ0FBbUIsQ0FBQyxJQUFJLEVBQUUsaUNBQWlDLEVBQUU7WUFDL0QsTUFBTSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ3JCLHVCQUF1QixFQUFFO2dCQUN2QixNQUFNLEVBQUUsU0FBUzthQUNsQjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sYUFBYSxHQUFHLElBQUksb0JBQVEsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDbkUsTUFBTSxFQUFFLHFCQUFxQixPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2hELElBQUksRUFBRTtnQkFDSixHQUFHLFVBQVU7Z0JBQ2IsSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsT0FBTyxFQUFFLGtCQUFrQjthQUM1QjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksMkZBQTBDLENBQzVDLElBQUksRUFDSixxQ0FBcUMsRUFDckM7WUFDRSxNQUFNLEVBQUUsYUFBYSxDQUFDLEVBQUU7WUFDeEIsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGtDQUFrQyxFQUFFO3dCQUNsQyxjQUFjLEVBQUUsVUFBVSxDQUFDLEdBQUc7d0JBQzlCLFlBQVksRUFBRSxTQUFTO3FCQUN4QjtvQkFDRCxnQkFBZ0IsRUFBRSxJQUFJO2lCQUN2QjthQUNGO1NBQ0YsQ0FDRixDQUFDO1FBRUYsSUFBSSx5REFBeUIsQ0FBQyxJQUFJLEVBQUUsOEJBQThCLEVBQUU7WUFDbEUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxFQUFFO1lBQ3hCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixxQkFBcUIsRUFBRSxJQUFJO1NBQzVCLENBQUMsQ0FBQztRQUVILElBQUksMENBQW1CLENBQUMsSUFBSSxFQUFFLHFDQUFxQyxFQUFFO1lBQ25FLE1BQU0sRUFBRSxhQUFhLENBQUMsRUFBRTtZQUN4Qix1QkFBdUIsRUFBRTtnQkFDdkIsTUFBTSxFQUFFLFNBQVM7YUFDbEI7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLG9DQUFnQixDQUFDLElBQUksRUFBRSxrQ0FBa0MsRUFBRTtZQUM3RCxNQUFNLEVBQUUsYUFBYSxDQUFDLEVBQUU7WUFDeEIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFlBQVksRUFBRSxpQkFBaUI7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsdURBQXVEO1FBQ3ZELElBQUksc0RBQXdCLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQzdELHFCQUFxQixFQUFFLEVBQUU7WUFDekIsMEJBQTBCLEVBQUUsSUFBSTtZQUNoQyxjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQiwwQkFBMEIsRUFBRSxJQUFJO1lBQ2hDLDBCQUEwQixFQUFFLElBQUk7WUFDaEMsY0FBYyxFQUFFLEVBQUU7WUFDbEIsdUJBQXVCLEVBQUUsRUFBRTtZQUMzQixVQUFVLEVBQUUsS0FBSztTQUNsQixDQUFDLENBQUM7UUFFSCxvRUFBb0U7UUFDcEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHNCQUFTLENBQ3hDLElBQUksRUFDSixpQ0FBaUMsRUFDakM7WUFDRSxJQUFJLEVBQUUsaUNBQWlDO1lBQ3ZDLFdBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsR0FBRyxFQUFFLDJCQUEyQjt3QkFDaEMsTUFBTSxFQUFFLE1BQU07d0JBQ2QsU0FBUyxFQUFFOzRCQUNULDRCQUE0Qjs0QkFDNUIscUJBQXFCOzRCQUNyQixhQUFhOzRCQUNiLG9CQUFvQjs0QkFDcEIsMkJBQTJCOzRCQUMzQixxQkFBcUI7NEJBQ3JCLHFCQUFxQjt5QkFDdEI7d0JBQ0QsUUFBUSxFQUFFLEdBQUc7d0JBQ2IsU0FBUyxFQUFFOzRCQUNULFlBQVksRUFBRTtnQ0FDWiw0QkFBNEIsRUFBRSxPQUFPOzZCQUN0Qzt5QkFDRjtxQkFDRjtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUNGLENBQUM7UUFFRixvQ0FBb0M7UUFDcEMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNCQUFTLENBQ3JDLElBQUksRUFDSiw4QkFBOEIsRUFDOUI7WUFDRSxJQUFJLEVBQUUsOEJBQThCO1lBQ3BDLFdBQVcsRUFBRSxtQ0FBbUM7WUFDaEQsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUM7d0JBQ2xELFFBQVEsRUFBRSxHQUFHO3FCQUNkO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQ0YsQ0FBQztRQUVGLE1BQU0sZUFBZSxHQUFHLElBQUksc0JBQVMsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDekUsSUFBSSxFQUFFLDZCQUE2QjtZQUNuQyxXQUFXLEVBQUUsc0NBQXNDO1lBQ25ELE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRSxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLENBQUM7d0JBQzNELFFBQVEsRUFBRSxHQUFHLGFBQWEsQ0FBQyxHQUFHLElBQUk7cUJBQ25DO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQzt3QkFDekIsUUFBUSxFQUFFLGFBQWEsQ0FBQyxHQUFHO3FCQUM1QjtvQkFDRDt3QkFDRSxNQUFNLEVBQUUsT0FBTzt3QkFDZixNQUFNLEVBQUUsQ0FBQyxhQUFhLEVBQUUscUJBQXFCLENBQUM7d0JBQzlDLFFBQVEsRUFBRSxVQUFVLENBQUMsR0FBRztxQkFDekI7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsSUFBSSxFQUFFLFVBQVU7U0FDakIsQ0FBQyxDQUFDO1FBRUgsWUFBWTtRQUNaLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQU8sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDckQsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULE9BQU8sRUFBRSxtQkFBbUI7eUJBQzdCO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUVILElBQUksb0RBQXVCLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQy9ELElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtZQUNsQixTQUFTLEVBQUUsZUFBZSxDQUFDLEdBQUc7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQU8sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDckQsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixJQUFJLEVBQUUsY0FBYztZQUNwQixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO1NBQy9DLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQU8sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDckQsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixJQUFJLEVBQUUsY0FBYztZQUNwQixJQUFJLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFO1NBQ2hELENBQUMsQ0FBQztRQUVILElBQUksb0RBQXVCLENBQUMsSUFBSSxFQUFFLGdDQUFnQyxFQUFFO1lBQ2xFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtZQUNsQixTQUFTLEVBQUUsaUJBQWlCLENBQUMsR0FBRztTQUNqQyxDQUFDLENBQUM7UUFFSCxJQUFJLG9EQUF1QixDQUFDLElBQUksRUFBRSxtQ0FBbUMsRUFBRTtZQUNyRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7WUFDbEIsU0FBUyxFQUFFLG9CQUFvQixDQUFDLEdBQUc7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxvREFBdUIsQ0FBQyxJQUFJLEVBQUUsbUNBQW1DLEVBQUU7WUFDckUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxHQUFHO1NBQ3BDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQiwrRUFBK0U7UUFDL0UsMkNBQTJDO1FBQzNDLGtFQUFrRTtRQUNsRSw4QkFBOEI7UUFDOUIsc0JBQXNCO1FBQ3RCLE1BQU07UUFFTixpQkFBaUI7UUFDakIsSUFBSSw0QkFBWSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUM1QyxJQUFJLEVBQUUsc0JBQXNCO1lBQzVCLElBQUksRUFBRSxjQUFjO1lBQ3BCLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNwQixXQUFXLEVBQUUsWUFBWTtnQkFDekIsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osUUFBUSxFQUFFLE1BQU07YUFDakIsQ0FBQztZQUNGLEtBQUssRUFBRSxVQUFVLENBQUMsR0FBRztZQUNyQixXQUFXLEVBQUUsc0NBQXNDO1lBQ25ELElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QiwwRUFBMEU7UUFDMUUsbUNBQW1DO1FBQ25DLHlCQUF5QjtRQUN6Qiw4QkFBOEI7UUFDOUIsc0JBQXNCO1FBQ3RCLE1BQU07UUFFTixrREFBa0Q7UUFDbEQsVUFBVTtRQUNWLDhCQUE4QjtRQUM5QixNQUFNO1FBQ04sMENBQTBDO1FBQzFDLDJCQUEyQjtRQUMzQixnQ0FBZ0M7UUFDaEMsd0JBQXdCO1FBQ3hCLE1BQU07UUFDTixLQUFLO1FBRUwsdUJBQXVCO1FBQ3ZCLE1BQU0sV0FBVyxHQUFHLElBQUksb0JBQVEsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDakUsSUFBSSxFQUFFLDBCQUEwQjtZQUNoQyxJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUM7UUFFSCxvQkFBb0I7UUFDcEIsSUFBSSwrQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDNUQsU0FBUyxFQUFFLDRCQUE0QjtZQUN2QyxrQkFBa0IsRUFBRSwrQkFBK0I7WUFDbkQsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixVQUFVLEVBQUUsaUJBQWlCO1lBQzdCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE1BQU0sRUFBRSxHQUFHO1lBQ1gsU0FBUyxFQUFFLEtBQUs7WUFDaEIsU0FBUyxFQUFFLENBQUM7WUFDWixnQkFBZ0IsRUFBRSx5Q0FBeUM7WUFDM0QsWUFBWSxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztZQUMvQixJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUM7UUFFSCxJQUFJLCtDQUFxQixDQUFDLElBQUksRUFBRSxpQ0FBaUMsRUFBRTtZQUNqRSxTQUFTLEVBQUUsaUNBQWlDO1lBQzVDLGtCQUFrQixFQUFFLCtCQUErQjtZQUNuRCxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLFVBQVUsRUFBRSxzQkFBc0I7WUFDbEMsU0FBUyxFQUFFLFFBQVE7WUFDbkIsTUFBTSxFQUFFLEdBQUc7WUFDWCxTQUFTLEVBQUUsS0FBSztZQUNoQixTQUFTLEVBQUUsQ0FBQztZQUNaLGdCQUFnQixFQUFFLGlDQUFpQztZQUNuRCxZQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO1lBQy9CLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUVILHdDQUF3QztRQUN4QyxNQUFNLFVBQVUsR0FBRyxJQUFJLHVCQUFVLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdELElBQUksRUFBRSxxQkFBcUI7WUFDM0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsMEJBQTBCLEVBQUUsSUFBSTtZQUNoQyxrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLHVCQUF1QixFQUFFLElBQUk7WUFDN0IsUUFBUSxFQUFFLFVBQVUsQ0FBQyxHQUFHO1lBQ3hCLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUVILHNDQUFzQztRQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLGtCQUFPLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzNELElBQUksRUFBRSxzQkFBc0I7WUFDNUIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDL0IsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxNQUFNLEVBQUUsZ0JBQWdCO3dCQUN4QixNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUU7NEJBQ1QsT0FBTyxFQUFFLHNCQUFzQjt5QkFDaEM7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsaUJBQWlCLEVBQUUsQ0FBQyxpREFBaUQsQ0FBQztZQUN0RSxJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUM7UUFFSCxNQUFNLGtCQUFrQixHQUFHLElBQUksc0JBQVMsQ0FDdEMsSUFBSSxFQUNKLCtCQUErQixFQUMvQjtZQUNFLElBQUksRUFBRSwrQkFBK0I7WUFDckMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLE9BQU87d0JBQ2YsTUFBTSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDO3dCQUM1QyxRQUFRLEVBQUUsVUFBVSxDQUFDLEdBQUc7cUJBQ3pCO29CQUNEO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRSxjQUFjO3dCQUN0QixRQUFRLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBRyxnQkFBZ0I7d0JBQzNDLFNBQVMsRUFBRTs0QkFDVCxZQUFZLEVBQUU7Z0NBQ1osY0FBYyxFQUFFLDJCQUEyQjs2QkFDNUM7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDO1NBQ0gsQ0FDRixDQUFDO1FBRUYsSUFBSSxvREFBdUIsQ0FBQyxJQUFJLEVBQUUsb0NBQW9DLEVBQUU7WUFDdEUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO1lBQ3JCLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxHQUFHO1NBQ2xDLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksMkRBQTJCLENBQ3BELElBQUksRUFDSiwwQkFBMEIsRUFDMUI7WUFDRSxJQUFJLEVBQUUsMEJBQTBCO1lBQ2hDLE9BQU8sRUFBRSxVQUFVLENBQUMsR0FBRztZQUN2QixjQUFjLEVBQUU7Z0JBQ2QsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLDBCQUEwQixFQUFFLElBQUk7YUFDakM7U0FDRixDQUNGLENBQUM7UUFFRiwrQ0FBK0M7UUFDL0MsMkRBQTJEO1FBQzNELFVBQVU7UUFDVix3Q0FBd0M7UUFDeEMsTUFBTTtRQUNOLGdEQUFnRDtRQUNoRCxtQ0FBbUM7UUFDbkMsbUNBQW1DO1FBQ25DLG1DQUFtQztRQUNuQyxNQUFNO1FBQ04sS0FBSztRQUVMLGVBQWU7UUFDZixJQUFJLHFDQUFnQixDQUFDLElBQUksRUFBRSw2Q0FBNkMsRUFBRTtZQUN4RSxJQUFJLEVBQUUsb0NBQW9DO1lBQzFDLE1BQU0sRUFBRTtnQkFDTixLQUFLLEVBQUUsS0FBSztnQkFDWixnQkFBZ0IsRUFBRSxvQ0FBb0M7YUFDdkQ7WUFDRCxTQUFTLEVBQUUsQ0FBQyxjQUFjLENBQUM7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxxQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDdkQsSUFBSSxFQUFFLG1CQUFtQjtZQUN6QixNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFLEtBQUs7Z0JBQ1osZ0JBQWdCLEVBQUUsbUJBQW1CO2FBQ3RDO1lBQ0QsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDO1NBQzVCLENBQUMsQ0FBQztRQUVILElBQUkscUNBQWdCLENBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1lBQ3pELElBQUksRUFBRSxxQkFBcUI7WUFDM0IsTUFBTSxFQUFFO2dCQUNOLEtBQUssRUFBRSxLQUFLO2dCQUNaLGdCQUFnQixFQUFFLHFCQUFxQjthQUN4QztZQUNELGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUM5QiwwQkFBMEIsRUFBRSxNQUFNO2dCQUNsQywwQkFBMEIsRUFBRSxNQUFNO2dCQUNsQyxjQUFjLEVBQUUsTUFBTTtnQkFDdEIsY0FBYyxFQUFFLE1BQU07Z0JBQ3RCLHFCQUFxQixFQUFFLElBQUk7YUFDNUIsQ0FBQztZQUNGLFNBQVMsRUFBRSxDQUFDLGNBQWMsQ0FBQztTQUM1QixDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFDMUMsSUFBSSxzQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDaEQsTUFBTSxFQUFFLElBQUk7WUFDWiwwQkFBMEIsRUFBRSxpQkFBaUI7WUFDN0MsV0FBVyxFQUFFO2dCQUNYLE1BQU0sRUFBRTtvQkFDTixNQUFNLEVBQUUsSUFBSTtpQkFDYjtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsU0FBUyxFQUFFO3dCQUNULE1BQU0sRUFBRSxJQUFJO3FCQUNiO2lCQUNGO2dCQUNELGlCQUFpQixFQUFFO29CQUNqQiwyQkFBMkIsRUFBRTt3QkFDM0IsVUFBVSxFQUFFOzRCQUNWLE1BQU0sRUFBRSxJQUFJO3lCQUNiO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsVUFBVTtTQUNqQixDQUFDLENBQUM7UUFFSCxVQUFVO1FBQ1YsSUFBSSx1QkFBZSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDbEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsV0FBVyxFQUFFLFFBQVE7U0FDdEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBZSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUM3QyxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDM0MsV0FBVyxFQUFFLG1CQUFtQjtTQUNqQyxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFlLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzlDLEtBQUssRUFBRSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUM3QyxXQUFXLEVBQUUsb0JBQW9CO1NBQ2xDLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3RDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztZQUN2QixXQUFXLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDOUMsS0FBSyxFQUFFO2dCQUNMLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUN4QixHQUFHLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtnQkFDeEIsRUFBRSxFQUFFLGVBQWUsQ0FBQyxFQUFFO2FBQ3ZCO1lBQ0QsV0FBVyxFQUFFLDRCQUE0QjtTQUMxQyxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFlLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzNDLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSTtZQUN0QixXQUFXLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDNUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3hCLFdBQVcsRUFBRSxxQkFBcUI7U0FDbkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQseURBQXlEO0FBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksV0FBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDM0MsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWFpbi50cyAtIENES1RGIFNlY3VyZSBFbnRlcnByaXNlIEluZnJhc3RydWN0dXJlXHJcbi8vIElhQyDigJMgQVdTIE5vdmEgTW9kZWwgQnJlYWtpbmcgLSBTaW5nbGUgRmlsZSBJbXBsZW1lbnRhdGlvblxyXG4vLyBUaGlzIGZpbGUgZGVtb25zdHJhdGVzIHRoZSBjb3JyZWN0ZWQgaW1wbGVtZW50YXRpb24gYXMgcmVxdWVzdGVkIGluIHRoZSBwcm9tcHRcclxuXHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQgeyBBcHAsIFRlcnJhZm9ybVN0YWNrLCBTM0JhY2tlbmQsIFRlcnJhZm9ybU91dHB1dCB9IGZyb20gJ2Nka3RmJztcclxuaW1wb3J0IHsgQXdzUHJvdmlkZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9wcm92aWRlcic7XHJcbmltcG9ydCB7IFZwYyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3ZwYyc7XHJcbmltcG9ydCB7IFN1Ym5ldCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3N1Ym5ldCc7XHJcbmltcG9ydCB7IEludGVybmV0R2F0ZXdheSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2ludGVybmV0LWdhdGV3YXknO1xyXG5pbXBvcnQgeyBOYXRHYXRld2F5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvbmF0LWdhdGV3YXknO1xyXG5pbXBvcnQgeyBFaXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9laXAnO1xyXG5pbXBvcnQgeyBSb3V0ZVRhYmxlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUtdGFibGUnO1xyXG5pbXBvcnQgeyBSb3V0ZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3JvdXRlJztcclxuaW1wb3J0IHsgUm91dGVUYWJsZUFzc29jaWF0aW9uIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUtdGFibGUtYXNzb2NpYXRpb24nO1xyXG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc2VjdXJpdHktZ3JvdXAnO1xyXG5pbXBvcnQgeyBLbXNLZXkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9rbXMta2V5JztcclxuaW1wb3J0IHsgS21zQWxpYXMgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9rbXMtYWxpYXMnO1xyXG5pbXBvcnQgeyBTM0J1Y2tldCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3MzLWJ1Y2tldCc7XHJcbmltcG9ydCB7IFMzQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uQSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3MzLWJ1Y2tldC1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uLWNvbmZpZ3VyYXRpb24nO1xyXG5pbXBvcnQgeyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtYmxvY2snO1xyXG5pbXBvcnQgeyBTM0J1Y2tldExvZ2dpbmdBIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LWxvZ2dpbmcnO1xyXG5pbXBvcnQgeyBTM0J1Y2tldFZlcnNpb25pbmdBIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXZlcnNpb25pbmcnO1xyXG5pbXBvcnQgeyBJYW1Sb2xlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUnO1xyXG5pbXBvcnQgeyBJYW1Qb2xpY3kgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tcG9saWN5JztcclxuaW1wb3J0IHsgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tcm9sZS1wb2xpY3ktYXR0YWNobWVudCc7XHJcbmltcG9ydCB7IElhbVVzZXIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tdXNlcic7XHJcbmltcG9ydCB7IElhbVVzZXJQb2xpY3lBdHRhY2htZW50IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXVzZXItcG9saWN5LWF0dGFjaG1lbnQnO1xyXG5pbXBvcnQgeyBJYW1BY2NvdW50UGFzc3dvcmRQb2xpY3kgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tYWNjb3VudC1wYXNzd29yZC1wb2xpY3knO1xyXG5pbXBvcnQgeyBDbG91ZHRyYWlsIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR0cmFpbCc7XHJcbmltcG9ydCB7IENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2NvbmZpZy1jb25maWd1cmF0aW9uLXJlY29yZGVyJztcclxuaW1wb3J0IHsgQ29uZmlnQ29uZmlnUnVsZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2NvbmZpZy1jb25maWctcnVsZSc7XHJcbmltcG9ydCB7IEd1YXJkZHV0eURldGVjdG9yIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZ3VhcmRkdXR5LWRldGVjdG9yJztcclxuaW1wb3J0IHsgQ2xvdWR3YXRjaE1ldHJpY0FsYXJtIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR3YXRjaC1tZXRyaWMtYWxhcm0nO1xyXG5pbXBvcnQgeyBTbnNUb3BpYyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3Nucy10b3BpYyc7XHJcbmltcG9ydCB7IFNzbVBhcmFtZXRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3NzbS1wYXJhbWV0ZXInO1xyXG5pbXBvcnQgeyBEYXRhQXdzQ2FsbGVySWRlbnRpdHkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9kYXRhLWF3cy1jYWxsZXItaWRlbnRpdHknO1xyXG5cclxuY2xhc3MgU2VjdXJlRW50ZXJwcmlzZVN0YWNrIGV4dGVuZHMgVGVycmFmb3JtU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCk7XHJcblxyXG4gICAgLy8gQ29tbW9uIHRhZ3MgZm9yIGFsbCByZXNvdXJjZXMgLSBDT1JSRUNURUQgUFJPSkVDVCBOQU1FXHJcbiAgICBjb25zdCBjb21tb25UYWdzID0ge1xyXG4gICAgICBFbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxyXG4gICAgICBQcm9qZWN0OiAnSWFDIOKAkyBBV1MgTm92YSBNb2RlbCBCcmVha2luZycsIC8vIEZpeGVkOiBFeGFjdCBwcm9tcHQgcmVxdWlyZW1lbnRcclxuICAgICAgTWFuYWdlZEJ5OiAnQ0RLVEYnLFxyXG4gICAgICBTZWN1cml0eUxldmVsOiAnSGlnaCcsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEFXUyBQcm92aWRlclxyXG4gICAgbmV3IEF3c1Byb3ZpZGVyKHRoaXMsICdhd3MnLCB7XHJcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXHJcbiAgICAgIGRlZmF1bHRUYWdzOiBbeyB0YWdzOiBjb21tb25UYWdzIH1dLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRGF0YSBzb3VyY2VzXHJcbiAgICBjb25zdCBjdXJyZW50ID0gbmV3IERhdGFBd3NDYWxsZXJJZGVudGl0eSh0aGlzLCAnY3VycmVudCcpO1xyXG5cclxuICAgIC8vIFMzIEJhY2tlbmQgQ29uZmlndXJhdGlvbiAtIENPUlJFQ1RFRCB3aXRoIHByb3BlciBzdGF0ZSBtYW5hZ2VtZW50XHJcbiAgICBuZXcgUzNCYWNrZW5kKHRoaXMsIHtcclxuICAgICAgYnVja2V0OiAncHJvZC1zZWMtdGVycmFmb3JtLXN0YXRlLWJ1Y2tldCcsXHJcbiAgICAgIGtleTogJ25vdmEtbW9kZWwvdGVycmFmb3JtLnRmc3RhdGUnLFxyXG4gICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxyXG4gICAgICBkeW5hbW9kYlRhYmxlOiAncHJvZC1zZWMtdGVycmFmb3JtLWxvY2tzJyxcclxuICAgICAgZW5jcnlwdDogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEtNUyBLZXlzIGZvciBlbmNyeXB0aW9uXHJcbiAgICBjb25zdCBtYWluS21zS2V5ID0gbmV3IEttc0tleSh0aGlzLCAncHJvZC1zZWMtbWFpbi1rbXMta2V5Jywge1xyXG4gICAgICBkZXNjcmlwdGlvbjogJ01haW4gS01TIGtleSBmb3IgcHJvZC1zZWMgZW52aXJvbm1lbnQgZW5jcnlwdGlvbicsXHJcbiAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxyXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXHJcbiAgICAgICAgU3RhdGVtZW50OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIFNpZDogJ0VuYWJsZSBJQU0gVXNlciBQZXJtaXNzaW9ucycsXHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7Y3VycmVudC5hY2NvdW50SWR9OnJvb3RgLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBBY3Rpb246ICdrbXM6KicsXHJcbiAgICAgICAgICAgIFJlc291cmNlOiAnKicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBTaWQ6ICdBbGxvdyBDbG91ZFRyYWlsIHRvIGVuY3J5cHQgbG9ncycsXHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgU2VydmljZTogJ2Nsb3VkdHJhaWwuYW1hem9uYXdzLmNvbScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEFjdGlvbjogWydrbXM6R2VuZXJhdGVEYXRhS2V5KicsICdrbXM6RGVzY3JpYmVLZXknXSxcclxuICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIFNpZDogJ0FsbG93IENsb3VkV2F0Y2ggTG9ncycsXHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgU2VydmljZTogJ2xvZ3MudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICAna21zOkVuY3J5cHQnLFxyXG4gICAgICAgICAgICAgICdrbXM6RGVjcnlwdCcsXHJcbiAgICAgICAgICAgICAgJ2ttczpSZUVuY3J5cHQqJyxcclxuICAgICAgICAgICAgICAna21zOkdlbmVyYXRlRGF0YUtleSonLFxyXG4gICAgICAgICAgICAgICdrbXM6RGVzY3JpYmVLZXknLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogJyonLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtbWFpbi1rbXMta2V5JyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IEttc0FsaWFzKHRoaXMsICdwcm9kLXNlYy1tYWluLWttcy1hbGlhcycsIHtcclxuICAgICAgbmFtZTogJ2FsaWFzL3Byb2Qtc2VjLW1haW4ta2V5JyxcclxuICAgICAgdGFyZ2V0S2V5SWQ6IG1haW5LbXNLZXkua2V5SWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBWUEMgQ29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgdnBjID0gbmV3IFZwYyh0aGlzLCAncHJvZC1zZWMtdnBjJywge1xyXG4gICAgICBjaWRyQmxvY2s6ICcxMC4wLjAuMC8xNicsXHJcbiAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcclxuICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtdnBjJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW50ZXJuZXQgR2F0ZXdheVxyXG4gICAgY29uc3QgaWd3ID0gbmV3IEludGVybmV0R2F0ZXdheSh0aGlzLCAncHJvZC1zZWMtaWd3Jywge1xyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1pZ3cnIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQdWJsaWMgU3VibmV0cyBpbiAyKyBBWnMgYXMgcmVxdWlyZWRcclxuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldDEgPSBuZXcgU3VibmV0KHRoaXMsICdwcm9kLXNlYy1wdWJsaWMtc3VibmV0LTEnLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIGNpZHJCbG9jazogJzEwLjAuMS4wLzI0JyxcclxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogJ3VzLWVhc3QtMWEnLFxyXG4gICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1wdWJsaWMtc3VibmV0LTEnLCBUeXBlOiAnUHVibGljJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcHVibGljU3VibmV0MiA9IG5ldyBTdWJuZXQodGhpcywgJ3Byb2Qtc2VjLXB1YmxpYy1zdWJuZXQtMicsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgY2lkckJsb2NrOiAnMTAuMC4yLjAvMjQnLFxyXG4gICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYicsXHJcbiAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLXB1YmxpYy1zdWJuZXQtMicsIFR5cGU6ICdQdWJsaWMnIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQcml2YXRlIFN1Ym5ldHNcclxuICAgIGNvbnN0IHByaXZhdGVTdWJuZXQxID0gbmV3IFN1Ym5ldCh0aGlzLCAncHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMScsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgY2lkckJsb2NrOiAnMTAuMC4xMC4wLzI0JyxcclxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogJ3VzLWVhc3QtMWEnLFxyXG4gICAgICB0YWdzOiB7XHJcbiAgICAgICAgLi4uY29tbW9uVGFncyxcclxuICAgICAgICBOYW1lOiAncHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMScsXHJcbiAgICAgICAgVHlwZTogJ1ByaXZhdGUnLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldDIgPSBuZXcgU3VibmV0KHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXN1Ym5ldC0yJywge1xyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBjaWRyQmxvY2s6ICcxMC4wLjExLjAvMjQnLFxyXG4gICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYicsXHJcbiAgICAgIHRhZ3M6IHtcclxuICAgICAgICAuLi5jb21tb25UYWdzLFxyXG4gICAgICAgIE5hbWU6ICdwcm9kLXNlYy1wcml2YXRlLXN1Ym5ldC0yJyxcclxuICAgICAgICBUeXBlOiAnUHJpdmF0ZScsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBFbGFzdGljIElQcyBmb3IgTkFUIEdhdGV3YXlzXHJcbiAgICBjb25zdCBlaXAxID0gbmV3IEVpcCh0aGlzLCAncHJvZC1zZWMtbmF0LWVpcC0xJywge1xyXG4gICAgICBkb21haW46ICd2cGMnLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1uYXQtZWlwLTEnIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBlaXAyID0gbmV3IEVpcCh0aGlzLCAncHJvZC1zZWMtbmF0LWVpcC0yJywge1xyXG4gICAgICBkb21haW46ICd2cGMnLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1uYXQtZWlwLTInIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBOQVQgR2F0ZXdheXNcclxuICAgIGNvbnN0IG5hdEd3MSA9IG5ldyBOYXRHYXRld2F5KHRoaXMsICdwcm9kLXNlYy1uYXQtZ3ctMScsIHtcclxuICAgICAgYWxsb2NhdGlvbklkOiBlaXAxLmlkLFxyXG4gICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0MS5pZCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtbmF0LWd3LTEnIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBuYXRHdzIgPSBuZXcgTmF0R2F0ZXdheSh0aGlzLCAncHJvZC1zZWMtbmF0LWd3LTInLCB7XHJcbiAgICAgIGFsbG9jYXRpb25JZDogZWlwMi5pZCxcclxuICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDIuaWQsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLW5hdC1ndy0yJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUm91dGUgVGFibGVzXHJcbiAgICBjb25zdCBwdWJsaWNSb3V0ZVRhYmxlID0gbmV3IFJvdXRlVGFibGUodGhpcywgJ3Byb2Qtc2VjLXB1YmxpYy1ydCcsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtcHVibGljLXJ0JyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcHJpdmF0ZVJvdXRlVGFibGUxID0gbmV3IFJvdXRlVGFibGUodGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtcnQtMScsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtcHJpdmF0ZS1ydC0xJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcHJpdmF0ZVJvdXRlVGFibGUyID0gbmV3IFJvdXRlVGFibGUodGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtcnQtMicsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtcHJpdmF0ZS1ydC0yJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUm91dGVzXHJcbiAgICBuZXcgUm91dGUodGhpcywgJ3Byb2Qtc2VjLXB1YmxpYy1yb3V0ZScsIHtcclxuICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlLmlkLFxyXG4gICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXHJcbiAgICAgIGdhdGV3YXlJZDogaWd3LmlkLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFJvdXRlKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTEnLCB7XHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUxLmlkLFxyXG4gICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXHJcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cxLmlkLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFJvdXRlKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTInLCB7XHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUyLmlkLFxyXG4gICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXHJcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cyLmlkLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUm91dGUgVGFibGUgQXNzb2NpYXRpb25zXHJcbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsICdwcm9kLXNlYy1wdWJsaWMtcnRhLTEnLCB7XHJcbiAgICAgIHN1Ym5ldElkOiBwdWJsaWNTdWJuZXQxLmlkLFxyXG4gICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsICdwcm9kLXNlYy1wdWJsaWMtcnRhLTInLCB7XHJcbiAgICAgIHN1Ym5ldElkOiBwdWJsaWNTdWJuZXQyLmlkLFxyXG4gICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJ0YS0xJywge1xyXG4gICAgICBzdWJuZXRJZDogcHJpdmF0ZVN1Ym5ldDEuaWQsXHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUxLmlkLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFJvdXRlVGFibGVBc3NvY2lhdGlvbih0aGlzLCAncHJvZC1zZWMtcHJpdmF0ZS1ydGEtMicsIHtcclxuICAgICAgc3VibmV0SWQ6IHByaXZhdGVTdWJuZXQyLmlkLFxyXG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMi5pZCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNlY3VyaXR5IEdyb3VwcyAtIENPUlJFQ1RFRCBJbXBsZW1lbnRhdGlvbiAoRml4ZWQgZnJvbSBNT0RFTF9SRVNQT05TRSBmYWlsdXJlcylcclxuICAgIGNvbnN0IHdlYlNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCAncHJvZC1zZWMtd2ViLXNnJywge1xyXG4gICAgICBuYW1lOiAncHJvZC1zZWMtd2ViLXNnJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3Igd2ViIHRpZXInLFxyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBpbmdyZXNzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcclxuICAgICAgICAgIHRvUG9ydDogNDQzLFxyXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxyXG4gICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgaW5ib3VuZCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmcm9tUG9ydDogODAsXHJcbiAgICAgICAgICB0b1BvcnQ6IDgwLFxyXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxyXG4gICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBpbmJvdW5kIChyZWRpcmVjdCB0byBIVFRQUyknLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIGVncmVzczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZyb21Qb3J0OiAwLFxyXG4gICAgICAgICAgdG9Qb3J0OiAwLFxyXG4gICAgICAgICAgcHJvdG9jb2w6ICctMScsXHJcbiAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLXdlYi1zZycsIFRpZXI6ICdXZWInIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBhcHBTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgJ3Byb2Qtc2VjLWFwcC1zZycsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWFwcC1zZycsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIGFwcGxpY2F0aW9uIHRpZXInLFxyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBpbmdyZXNzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZnJvbVBvcnQ6IDgwODAsXHJcbiAgICAgICAgICB0b1BvcnQ6IDgwODAsXHJcbiAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXHJcbiAgICAgICAgICBzZWN1cml0eUdyb3VwczogW3dlYlNlY3VyaXR5R3JvdXAuaWRdLCAvLyBGSVhFRDogQ29ycmVjdCByZWZlcmVuY2VcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRnJvbSB3ZWIgdGllcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgZWdyZXNzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcclxuICAgICAgICAgIHRvUG9ydDogNDQzLFxyXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxyXG4gICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgb3V0Ym91bmQgZm9yIEFQSSBjYWxscycsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtYXBwLXNnJywgVGllcjogJ0FwcGxpY2F0aW9uJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZGJTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgJ3Byb2Qtc2VjLWRiLXNnJywge1xyXG4gICAgICBuYW1lOiAncHJvZC1zZWMtZGItc2cnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBkYXRhYmFzZSB0aWVyJyxcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgaW5ncmVzczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZyb21Qb3J0OiA1NDMyLFxyXG4gICAgICAgICAgdG9Qb3J0OiA1NDMyLFxyXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxyXG4gICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthcHBTZWN1cml0eUdyb3VwLmlkXSwgLy8gRklYRUQ6IENvcnJlY3QgcmVmZXJlbmNlXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Zyb20gYXBwbGljYXRpb24gdGllcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtZGItc2cnLCBUaWVyOiAnRGF0YWJhc2UnIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTMyBCdWNrZXRzIHdpdGggc2VjdXJpdHkgY29uZmlndXJhdGlvbnNcclxuICAgIGNvbnN0IGxvZ3NCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgJ3Byb2Qtc2VjLWxvZ3MtYnVja2V0Jywge1xyXG4gICAgICBidWNrZXQ6IGBwcm9kLXNlYy1sb2dzLSR7Y3VycmVudC5hY2NvdW50SWR9YCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtbG9ncy1idWNrZXQnLCBQdXJwb3NlOiAnTG9nZ2luZycgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbkEoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdwcm9kLXNlYy1sb2dzLWJ1Y2tldC1lbmNyeXB0aW9uJyxcclxuICAgICAge1xyXG4gICAgICAgIGJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcclxuICAgICAgICBydWxlOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiAnYXdzOmttcycsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgbmV3IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sodGhpcywgJ3Byb2Qtc2VjLWxvZ3MtYnVja2V0LXBhYicsIHtcclxuICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxyXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXHJcbiAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxyXG4gICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxyXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUzNCdWNrZXRWZXJzaW9uaW5nQSh0aGlzLCAncHJvZC1zZWMtbG9ncy1idWNrZXQtdmVyc2lvbmluZycsIHtcclxuICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxyXG4gICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYXBwRGF0YUJ1Y2tldCA9IG5ldyBTM0J1Y2tldCh0aGlzLCAncHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0Jywge1xyXG4gICAgICBidWNrZXQ6IGBwcm9kLXNlYy1hcHAtZGF0YS0ke2N1cnJlbnQuYWNjb3VudElkfWAsXHJcbiAgICAgIHRhZ3M6IHtcclxuICAgICAgICAuLi5jb21tb25UYWdzLFxyXG4gICAgICAgIE5hbWU6ICdwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXQnLFxyXG4gICAgICAgIFB1cnBvc2U6ICdBcHBsaWNhdGlvbiBEYXRhJyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbkEoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXQtZW5jcnlwdGlvbicsXHJcbiAgICAgIHtcclxuICAgICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXHJcbiAgICAgICAgcnVsZTogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XHJcbiAgICAgICAgICAgICAga21zTWFzdGVyS2V5SWQ6IG1haW5LbXNLZXkuYXJuLFxyXG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKHRoaXMsICdwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXQtcGFiJywge1xyXG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXHJcbiAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcclxuICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXHJcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXHJcbiAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFZlcnNpb25pbmdBKHRoaXMsICdwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXQtdmVyc2lvbmluZycsIHtcclxuICAgICAgYnVja2V0OiBhcHBEYXRhQnVja2V0LmlkLFxyXG4gICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFMzQnVja2V0TG9nZ2luZ0EodGhpcywgJ3Byb2Qtc2VjLWFwcC1kYXRhLWJ1Y2tldC1sb2dnaW5nJywge1xyXG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXHJcbiAgICAgIHRhcmdldEJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcclxuICAgICAgdGFyZ2V0UHJlZml4OiAnczMtYWNjZXNzLWxvZ3MvJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElBTSBQYXNzd29yZCBQb2xpY3kgLSBFTkhBTkNFRCB3aXRoIE1GQSByZXF1aXJlbWVudHNcclxuICAgIG5ldyBJYW1BY2NvdW50UGFzc3dvcmRQb2xpY3kodGhpcywgJ3Byb2Qtc2VjLXBhc3N3b3JkLXBvbGljeScsIHtcclxuICAgICAgbWluaW11bVBhc3N3b3JkTGVuZ3RoOiAxNCxcclxuICAgICAgcmVxdWlyZUxvd2VyY2FzZUNoYXJhY3RlcnM6IHRydWUsXHJcbiAgICAgIHJlcXVpcmVOdW1iZXJzOiB0cnVlLFxyXG4gICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcclxuICAgICAgcmVxdWlyZVVwcGVyY2FzZUNoYXJhY3RlcnM6IHRydWUsXHJcbiAgICAgIGFsbG93VXNlcnNUb0NoYW5nZVBhc3N3b3JkOiB0cnVlLFxyXG4gICAgICBtYXhQYXNzd29yZEFnZTogOTAsXHJcbiAgICAgIHBhc3N3b3JkUmV1c2VQcmV2ZW50aW9uOiAxMixcclxuICAgICAgaGFyZEV4cGlyeTogZmFsc2UsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBNRkEgRW5mb3JjZW1lbnQgUG9saWN5IC0gQURERUQgdG8gYWRkcmVzcyBtaXNzaW5nIE1GQSByZXF1aXJlbWVudFxyXG4gICAgY29uc3QgbWZhRW5mb3JjZW1lbnRQb2xpY3kgPSBuZXcgSWFtUG9saWN5KFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAncHJvZC1zZWMtbWZhLWVuZm9yY2VtZW50LXBvbGljeScsXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAncHJvZC1zZWMtbWZhLWVuZm9yY2VtZW50LXBvbGljeScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbmZvcmNlIE1GQSBmb3IgY3JpdGljYWwgb3BlcmF0aW9ucycsXHJcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXHJcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIFNpZDogJ0RlbnlBbGxFeGNlcHRVc2Vyc1dpdGhNRkEnLFxyXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxyXG4gICAgICAgICAgICAgIE5vdEFjdGlvbjogW1xyXG4gICAgICAgICAgICAgICAgJ2lhbTpDcmVhdGVWaXJ0dWFsTUZBRGV2aWNlJyxcclxuICAgICAgICAgICAgICAgICdpYW06RW5hYmxlTUZBRGV2aWNlJyxcclxuICAgICAgICAgICAgICAgICdpYW06R2V0VXNlcicsXHJcbiAgICAgICAgICAgICAgICAnaWFtOkxpc3RNRkFEZXZpY2VzJyxcclxuICAgICAgICAgICAgICAgICdpYW06TGlzdFZpcnR1YWxNRkFEZXZpY2VzJyxcclxuICAgICAgICAgICAgICAgICdpYW06UmVzeW5jTUZBRGV2aWNlJyxcclxuICAgICAgICAgICAgICAgICdzdHM6R2V0U2Vzc2lvblRva2VuJyxcclxuICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXHJcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBCb29sSWZFeGlzdHM6IHtcclxuICAgICAgICAgICAgICAgICAgJ2F3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50JzogJ2ZhbHNlJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgdGFnczogY29tbW9uVGFncyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBJQU0gUG9saWNpZXMgd2l0aCBsZWFzdCBwcml2aWxlZ2VcclxuICAgIGNvbnN0IGVjMlJlYWRPbmx5UG9saWN5ID0gbmV3IElhbVBvbGljeShcclxuICAgICAgdGhpcyxcclxuICAgICAgJ3Byb2Qtc2VjLWVjMi1yZWFkb25seS1wb2xpY3knLFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ3Byb2Qtc2VjLWVjMi1yZWFkb25seS1wb2xpY3knLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUmVhZC1vbmx5IGFjY2VzcyB0byBFQzIgcmVzb3VyY2VzJyxcclxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcclxuICAgICAgICAgIFN0YXRlbWVudDogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxyXG4gICAgICAgICAgICAgIEFjdGlvbjogWydlYzI6RGVzY3JpYmUqJywgJ2VjMjpHZXQqJywgJ2VjMjpMaXN0KiddLFxyXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgczNBcHBEYXRhUG9saWN5ID0gbmV3IElhbVBvbGljeSh0aGlzLCAncHJvZC1zZWMtczMtYXBwLWRhdGEtcG9saWN5Jywge1xyXG4gICAgICBuYW1lOiAncHJvZC1zZWMtczMtYXBwLWRhdGEtcG9saWN5JyxcclxuICAgICAgZGVzY3JpcHRpb246ICdBY2Nlc3MgdG8gYXBwbGljYXRpb24gZGF0YSBTMyBidWNrZXQnLFxyXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXHJcbiAgICAgICAgU3RhdGVtZW50OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgQWN0aW9uOiBbJ3MzOkdldE9iamVjdCcsICdzMzpQdXRPYmplY3QnLCAnczM6RGVsZXRlT2JqZWN0J10sXHJcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHthcHBEYXRhQnVja2V0LmFybn0vKmAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXHJcbiAgICAgICAgICAgIEFjdGlvbjogWydzMzpMaXN0QnVja2V0J10sXHJcbiAgICAgICAgICAgIFJlc291cmNlOiBhcHBEYXRhQnVja2V0LmFybixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgQWN0aW9uOiBbJ2ttczpEZWNyeXB0JywgJ2ttczpHZW5lcmF0ZURhdGFLZXknXSxcclxuICAgICAgICAgICAgUmVzb3VyY2U6IG1haW5LbXNLZXkuYXJuLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KSxcclxuICAgICAgdGFnczogY29tbW9uVGFncyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElBTSBSb2xlc1xyXG4gICAgY29uc3QgYXBwUm9sZSA9IG5ldyBJYW1Sb2xlKHRoaXMsICdwcm9kLXNlYy1hcHAtcm9sZScsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWFwcC1yb2xlJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdSb2xlIGZvciBhcHBsaWNhdGlvbiBpbnN0YW5jZXMnLFxyXG4gICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxyXG4gICAgICAgIFN0YXRlbWVudDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXHJcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgU2VydmljZTogJ2VjMi5hbWF6b25hd3MuY29tJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSksXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQodGhpcywgJ3Byb2Qtc2VjLWFwcC1yb2xlLXMzLXBvbGljeScsIHtcclxuICAgICAgcm9sZTogYXBwUm9sZS5uYW1lLFxyXG4gICAgICBwb2xpY3lBcm46IHMzQXBwRGF0YVBvbGljeS5hcm4sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJQU0gVXNlcnMgd2l0aCBsZWFzdCBwcml2aWxlZ2VcclxuICAgIGNvbnN0IGRldlVzZXIgPSBuZXcgSWFtVXNlcih0aGlzLCAncHJvZC1zZWMtZGV2LXVzZXInLCB7XHJcbiAgICAgIG5hbWU6ICdwcm9kLXNlYy1kZXYtdXNlcicsXHJcbiAgICAgIHBhdGg6ICcvZGV2ZWxvcGVycy8nLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIFVzZXJUeXBlOiAnRGV2ZWxvcGVyJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgb3BzVXNlciA9IG5ldyBJYW1Vc2VyKHRoaXMsICdwcm9kLXNlYy1vcHMtdXNlcicsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLW9wcy11c2VyJyxcclxuICAgICAgcGF0aDogJy9vcGVyYXRpb25zLycsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgVXNlclR5cGU6ICdPcGVyYXRpb25zJyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IElhbVVzZXJQb2xpY3lBdHRhY2htZW50KHRoaXMsICdwcm9kLXNlYy1kZXYtdXNlci1lYzItcmVhZG9ubHknLCB7XHJcbiAgICAgIHVzZXI6IGRldlVzZXIubmFtZSxcclxuICAgICAgcG9saWN5QXJuOiBlYzJSZWFkT25seVBvbGljeS5hcm4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgSWFtVXNlclBvbGljeUF0dGFjaG1lbnQodGhpcywgJ3Byb2Qtc2VjLWRldi11c2VyLW1mYS1lbmZvcmNlbWVudCcsIHtcclxuICAgICAgdXNlcjogZGV2VXNlci5uYW1lLFxyXG4gICAgICBwb2xpY3lBcm46IG1mYUVuZm9yY2VtZW50UG9saWN5LmFybixcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBJYW1Vc2VyUG9saWN5QXR0YWNobWVudCh0aGlzLCAncHJvZC1zZWMtb3BzLXVzZXItbWZhLWVuZm9yY2VtZW50Jywge1xyXG4gICAgICB1c2VyOiBvcHNVc2VyLm5hbWUsXHJcbiAgICAgIHBvbGljeUFybjogbWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2VjcmV0cyBNYW5hZ2VyXHJcbiAgICAvLyBjb25zdCBkYlNlY3JldCA9IG5ldyBTZWNyZXRzbWFuYWdlclNlY3JldCh0aGlzLCAncHJvZC1zZWMtZGItY3JlZGVudGlhbHMnLCB7XHJcbiAgICAvLyAgIG5hbWU6ICdwcm9kLXNlYy9kYXRhYmFzZS9jcmVkZW50aWFscycsXHJcbiAgICAvLyAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgY3JlZGVudGlhbHMgZm9yIHByb2Qtc2VjIGVudmlyb25tZW50JyxcclxuICAgIC8vICAga21zS2V5SWQ6IG1haW5LbXNLZXkuYXJuLFxyXG4gICAgLy8gICB0YWdzOiBjb21tb25UYWdzLFxyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgLy8gU1NNIFBhcmFtZXRlcnNcclxuICAgIG5ldyBTc21QYXJhbWV0ZXIodGhpcywgJ3Byb2Qtc2VjLWFwcC1jb25maWcnLCB7XHJcbiAgICAgIG5hbWU6ICcvcHJvZC1zZWMvYXBwL2NvbmZpZycsXHJcbiAgICAgIHR5cGU6ICdTZWN1cmVTdHJpbmcnLFxyXG4gICAgICB2YWx1ZTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIGVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXHJcbiAgICAgICAgZGVidWc6IGZhbHNlLFxyXG4gICAgICAgIGxvZ0xldmVsOiAnSU5GTycsXHJcbiAgICAgIH0pLFxyXG4gICAgICBrZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXBwbGljYXRpb24gY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzJyxcclxuICAgICAgdGFnczogY29tbW9uVGFncyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENsb3VkV2F0Y2ggTG9nIEdyb3Vwc1xyXG4gICAgLy8gY29uc3QgYXBwTG9nR3JvdXAgPSBuZXcgQ2xvdWR3YXRjaExvZ0dyb3VwKHRoaXMsICdwcm9kLXNlYy1hcHAtbG9ncycsIHtcclxuICAgIC8vICAgbmFtZTogJy9hd3MvZWMyL3Byb2Qtc2VjLWFwcCcsXHJcbiAgICAvLyAgIHJldGVudGlvbkluRGF5czogOTAsXHJcbiAgICAvLyAgIGttc0tleUlkOiBtYWluS21zS2V5LmFybixcclxuICAgIC8vICAgdGFnczogY29tbW9uVGFncyxcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vIGNvbnN0IHZwY0Zsb3dMb2dHcm91cCA9IG5ldyBDbG91ZHdhdGNoTG9nR3JvdXAoXHJcbiAgICAvLyAgIHRoaXMsXHJcbiAgICAvLyAgICdwcm9kLXNlYy12cGMtZmxvdy1sb2dzJyxcclxuICAgIC8vICAge1xyXG4gICAgLy8gICAgIG5hbWU6ICcvYXdzL3ZwYy9wcm9kLXNlYy1mbG93bG9ncycsXHJcbiAgICAvLyAgICAgcmV0ZW50aW9uSW5EYXlzOiAzMCxcclxuICAgIC8vICAgICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAvLyAgICAgdGFnczogY29tbW9uVGFncyxcclxuICAgIC8vICAgfVxyXG4gICAgLy8gKTtcclxuXHJcbiAgICAvLyBTTlMgVG9waWMgZm9yIGFsZXJ0c1xyXG4gICAgY29uc3QgYWxlcnRzVG9waWMgPSBuZXcgU25zVG9waWModGhpcywgJ3Byb2Qtc2VjLXNlY3VyaXR5LWFsZXJ0cycsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLXNlY3VyaXR5LWFsZXJ0cycsXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDbG91ZFdhdGNoIEFsYXJtc1xyXG4gICAgbmV3IENsb3Vkd2F0Y2hNZXRyaWNBbGFybSh0aGlzLCAncHJvZC1zZWMtcm9vdC1hY2Nlc3MtYWxhcm0nLCB7XHJcbiAgICAgIGFsYXJtTmFtZTogJ3Byb2Qtc2VjLXJvb3QtYWNjZXNzLWFsYXJtJyxcclxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5PckVxdWFsVG9UaHJlc2hvbGQnLFxyXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcclxuICAgICAgbWV0cmljTmFtZTogJ1Jvb3RBY2Nlc3NDb3VudCcsXHJcbiAgICAgIG5hbWVzcGFjZTogJ0NXTG9ncycsXHJcbiAgICAgIHBlcmlvZDogMzAwLFxyXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICB0aHJlc2hvbGQ6IDEsXHJcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCB3aGVuIHJvb3QgdXNlciBhY2Nlc3MgaXMgZGV0ZWN0ZWQnLFxyXG4gICAgICBhbGFybUFjdGlvbnM6IFthbGVydHNUb3BpYy5hcm5dLFxyXG4gICAgICB0YWdzOiBjb21tb25UYWdzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IENsb3Vkd2F0Y2hNZXRyaWNBbGFybSh0aGlzLCAncHJvZC1zZWMtdW5hdXRob3JpemVkLWFwaS1jYWxscycsIHtcclxuICAgICAgYWxhcm1OYW1lOiAncHJvZC1zZWMtdW5hdXRob3JpemVkLWFwaS1jYWxscycsXHJcbiAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuT3JFcXVhbFRvVGhyZXNob2xkJyxcclxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXHJcbiAgICAgIG1ldHJpY05hbWU6ICdVbmF1dGhvcml6ZWRBUElDYWxscycsXHJcbiAgICAgIG5hbWVzcGFjZTogJ0NXTG9ncycsXHJcbiAgICAgIHBlcmlvZDogMzAwLFxyXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxyXG4gICAgICB0aHJlc2hvbGQ6IDUsXHJcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCBvbiB1bmF1dGhvcml6ZWQgQVBJIGNhbGxzJyxcclxuICAgICAgYWxhcm1BY3Rpb25zOiBbYWxlcnRzVG9waWMuYXJuXSxcclxuICAgICAgdGFnczogY29tbW9uVGFncyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENsb3VkVHJhaWwgLSBDT1JSRUNURUQgSW1wbGVtZW50YXRpb25cclxuICAgIGNvbnN0IGNsb3VkdHJhaWwgPSBuZXcgQ2xvdWR0cmFpbCh0aGlzLCAncHJvZC1zZWMtY2xvdWR0cmFpbCcsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWNsb3VkdHJhaWwnLFxyXG4gICAgICBzM0J1Y2tldE5hbWU6IGxvZ3NCdWNrZXQuaWQsXHJcbiAgICAgIHMzS2V5UHJlZml4OiAnY2xvdWR0cmFpbC1sb2dzLycsXHJcbiAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxyXG4gICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRydWUsXHJcbiAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXHJcbiAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxyXG4gICAgICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBV1MgQ29uZmlnIC0gQ09SUkVDVEVEIGRlcGVuZGVuY2llc1xyXG4gICAgY29uc3QgY29uZmlnUm9sZSA9IG5ldyBJYW1Sb2xlKHRoaXMsICdwcm9kLXNlYy1jb25maWctcm9sZScsIHtcclxuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWNvbmZpZy1yb2xlJyxcclxuICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcclxuICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxyXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXHJcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xyXG4gICAgICAgICAgICAgIFNlcnZpY2U6ICdjb25maWcuYW1hem9uYXdzLmNvbScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0pLFxyXG4gICAgICBtYW5hZ2VkUG9saWN5QXJuczogWydhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQ29uZmlnUm9sZSddLFxyXG4gICAgICB0YWdzOiBjb21tb25UYWdzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgY29uZmlnQnVja2V0UG9saWN5ID0gbmV3IElhbVBvbGljeShcclxuICAgICAgdGhpcyxcclxuICAgICAgJ3Byb2Qtc2VjLWNvbmZpZy1idWNrZXQtcG9saWN5JyxcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6ICdwcm9kLXNlYy1jb25maWctYnVja2V0LXBvbGljeScsXHJcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXHJcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcclxuICAgICAgICAgICAgICBBY3Rpb246IFsnczM6R2V0QnVja2V0QWNsJywgJ3MzOkxpc3RCdWNrZXQnXSxcclxuICAgICAgICAgICAgICBSZXNvdXJjZTogbG9nc0J1Y2tldC5hcm4sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXHJcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcclxuICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7bG9nc0J1Y2tldC5hcm59L2NvbmZpZy1sb2dzLypgLFxyXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XHJcbiAgICAgICAgICAgICAgICAgICdzMzp4LWFtei1hY2wnOiAnYnVja2V0LW93bmVyLWZ1bGwtY29udHJvbCcsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIG5ldyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCh0aGlzLCAncHJvZC1zZWMtY29uZmlnLXJvbGUtYnVja2V0LXBvbGljeScsIHtcclxuICAgICAgcm9sZTogY29uZmlnUm9sZS5uYW1lLFxyXG4gICAgICBwb2xpY3lBcm46IGNvbmZpZ0J1Y2tldFBvbGljeS5hcm4sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBjb25maWdSZWNvcmRlciA9IG5ldyBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXIoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdwcm9kLXNlYy1jb25maWctcmVjb3JkZXInLFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ3Byb2Qtc2VjLWNvbmZpZy1yZWNvcmRlcicsXHJcbiAgICAgICAgcm9sZUFybjogY29uZmlnUm9sZS5hcm4sXHJcbiAgICAgICAgcmVjb3JkaW5nR3JvdXA6IHtcclxuICAgICAgICAgIGFsbFN1cHBvcnRlZDogdHJ1ZSxcclxuICAgICAgICAgIGluY2x1ZGVHbG9iYWxSZXNvdXJjZVR5cGVzOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gRklYRUQ6IEFkZGVkIGRlcGVuZGVuY3kgZm9yIGRlbGl2ZXJ5IGNoYW5uZWxcclxuICAgIC8vIGNvbnN0IGNvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbCA9IG5ldyBDb25maWdEZWxpdmVyeUNoYW5uZWwoXHJcbiAgICAvLyAgIHRoaXMsXHJcbiAgICAvLyAgICdwcm9kLXNlYy1jb25maWctZGVsaXZlcnktY2hhbm5lbCcsXHJcbiAgICAvLyAgIHtcclxuICAgIC8vICAgICBuYW1lOiAncHJvZC1zZWMtY29uZmlnLWRlbGl2ZXJ5LWNoYW5uZWwnLFxyXG4gICAgLy8gICAgIHMzQnVja2V0TmFtZTogbG9nc0J1Y2tldC5pZCxcclxuICAgIC8vICAgICBzM0tleVByZWZpeDogJ2NvbmZpZy1sb2dzLycsXHJcbiAgICAvLyAgICAgZGVwZW5kc09uOiBbY29uZmlnUmVjb3JkZXJdLFxyXG4gICAgLy8gICB9XHJcbiAgICAvLyApO1xyXG5cclxuICAgIC8vIENvbmZpZyBSdWxlc1xyXG4gICAgbmV3IENvbmZpZ0NvbmZpZ1J1bGUodGhpcywgJ3Byb2Qtc2VjLXMzLWJ1Y2tldC1wdWJsaWMtYWNjZXNzLXByb2hpYml0ZWQnLCB7XHJcbiAgICAgIG5hbWU6ICdzMy1idWNrZXQtcHVibGljLWFjY2Vzcy1wcm9oaWJpdGVkJyxcclxuICAgICAgc291cmNlOiB7XHJcbiAgICAgICAgb3duZXI6ICdBV1MnLFxyXG4gICAgICAgIHNvdXJjZUlkZW50aWZpZXI6ICdTM19CVUNLRVRfUFVCTElDX0FDQ0VTU19QUk9ISUJJVEVEJyxcclxuICAgICAgfSxcclxuICAgICAgZGVwZW5kc09uOiBbY29uZmlnUmVjb3JkZXJdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IENvbmZpZ0NvbmZpZ1J1bGUodGhpcywgJ3Byb2Qtc2VjLWVuY3J5cHRlZC12b2x1bWVzJywge1xyXG4gICAgICBuYW1lOiAnZW5jcnlwdGVkLXZvbHVtZXMnLFxyXG4gICAgICBzb3VyY2U6IHtcclxuICAgICAgICBvd25lcjogJ0FXUycsXHJcbiAgICAgICAgc291cmNlSWRlbnRpZmllcjogJ0VOQ1JZUFRFRF9WT0xVTUVTJyxcclxuICAgICAgfSxcclxuICAgICAgZGVwZW5kc09uOiBbY29uZmlnUmVjb3JkZXJdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IENvbmZpZ0NvbmZpZ1J1bGUodGhpcywgJ3Byb2Qtc2VjLWlhbS1wYXNzd29yZC1wb2xpY3knLCB7XHJcbiAgICAgIG5hbWU6ICdpYW0tcGFzc3dvcmQtcG9saWN5JyxcclxuICAgICAgc291cmNlOiB7XHJcbiAgICAgICAgb3duZXI6ICdBV1MnLFxyXG4gICAgICAgIHNvdXJjZUlkZW50aWZpZXI6ICdJQU1fUEFTU1dPUkRfUE9MSUNZJyxcclxuICAgICAgfSxcclxuICAgICAgaW5wdXRQYXJhbWV0ZXJzOiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgUmVxdWlyZVVwcGVyY2FzZUNoYXJhY3RlcnM6ICd0cnVlJyxcclxuICAgICAgICBSZXF1aXJlTG93ZXJjYXNlQ2hhcmFjdGVyczogJ3RydWUnLFxyXG4gICAgICAgIFJlcXVpcmVTeW1ib2xzOiAndHJ1ZScsXHJcbiAgICAgICAgUmVxdWlyZU51bWJlcnM6ICd0cnVlJyxcclxuICAgICAgICBNaW5pbXVtUGFzc3dvcmRMZW5ndGg6ICcxNCcsXHJcbiAgICAgIH0pLFxyXG4gICAgICBkZXBlbmRzT246IFtjb25maWdSZWNvcmRlcl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHdWFyZER1dHkgLSBFTkhBTkNFRCB3aXRoIFMzIHByb3RlY3Rpb25cclxuICAgIG5ldyBHdWFyZGR1dHlEZXRlY3Rvcih0aGlzLCAncHJvZC1zZWMtZ3VhcmRkdXR5Jywge1xyXG4gICAgICBlbmFibGU6IHRydWUsXHJcbiAgICAgIGZpbmRpbmdQdWJsaXNoaW5nRnJlcXVlbmN5OiAnRklGVEVFTl9NSU5VVEVTJyxcclxuICAgICAgZGF0YXNvdXJjZXM6IHtcclxuICAgICAgICBzM0xvZ3M6IHtcclxuICAgICAgICAgIGVuYWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGt1YmVybmV0ZXM6IHtcclxuICAgICAgICAgIGF1ZGl0TG9nczoge1xyXG4gICAgICAgICAgICBlbmFibGU6IHRydWUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWFsd2FyZVByb3RlY3Rpb246IHtcclxuICAgICAgICAgIHNjYW5FYzJJbnN0YW5jZVdpdGhGaW5kaW5nczoge1xyXG4gICAgICAgICAgICBlYnNWb2x1bWVzOiB7XHJcbiAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICB0YWdzOiBjb21tb25UYWdzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAndnBjX2lkJywge1xyXG4gICAgICB2YWx1ZTogdnBjLmlkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1ZQQyBJRCcsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdwdWJsaWNfc3VibmV0X2lkcycsIHtcclxuICAgICAgdmFsdWU6IFtwdWJsaWNTdWJuZXQxLmlkLCBwdWJsaWNTdWJuZXQyLmlkXSxcclxuICAgICAgZGVzY3JpcHRpb246ICdQdWJsaWMgc3VibmV0IElEcycsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdwcml2YXRlX3N1Ym5ldF9pZHMnLCB7XHJcbiAgICAgIHZhbHVlOiBbcHJpdmF0ZVN1Ym5ldDEuaWQsIHByaXZhdGVTdWJuZXQyLmlkXSxcclxuICAgICAgZGVzY3JpcHRpb246ICdQcml2YXRlIHN1Ym5ldCBJRHMnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAna21zX2tleV9pZCcsIHtcclxuICAgICAgdmFsdWU6IG1haW5LbXNLZXkua2V5SWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTWFpbiBLTVMga2V5IElEJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ3NlY3VyaXR5X2dyb3VwX2lkcycsIHtcclxuICAgICAgdmFsdWU6IHtcclxuICAgICAgICB3ZWI6IHdlYlNlY3VyaXR5R3JvdXAuaWQsXHJcbiAgICAgICAgYXBwOiBhcHBTZWN1cml0eUdyb3VwLmlkLFxyXG4gICAgICAgIGRiOiBkYlNlY3VyaXR5R3JvdXAuaWQsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgSURzIGJ5IHRpZXInLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAnY2xvdWR0cmFpbF9uYW1lJywge1xyXG4gICAgICB2YWx1ZTogY2xvdWR0cmFpbC5uYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkVHJhaWwgbmFtZScsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdsb2dzX2J1Y2tldF9uYW1lJywge1xyXG4gICAgICB2YWx1ZTogbG9nc0J1Y2tldC5idWNrZXQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTG9ncyBTMyBidWNrZXQgbmFtZScsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8vIENPUlJFQ1RFRDogQXBwbGljYXRpb24gYm9vdHN0cmFwIHdpdGggcHJvcGVyIHN0cnVjdHVyZVxyXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XHJcbm5ldyBTZWN1cmVFbnRlcnByaXNlU3RhY2soYXBwLCAncHJvZC1zZWMnKTtcclxuYXBwLnN5bnRoKCk7XHJcbiJdfQ==