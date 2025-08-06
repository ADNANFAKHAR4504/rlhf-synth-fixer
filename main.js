"use strict";
// main.ts - CDKTF Secure Enterprise Infrastructure
// IaC – AWS Nova Model Breaking - Single File Implementation
// This file demonstrates the corrected implementation as requested in the prompt
Object.defineProperty(exports, "__esModule", { value: true });
const cloudtrail_1 = require("@cdktf/provider-aws/lib/cloudtrail");
const cloudwatch_metric_alarm_1 = require("@cdktf/provider-aws/lib/cloudwatch-metric-alarm");
const config_config_rule_1 = require("@cdktf/provider-aws/lib/config-config-rule");
const config_configuration_recorder_1 = require("@cdktf/provider-aws/lib/config-configuration-recorder");
const data_aws_caller_identity_1 = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
const eip_1 = require("@cdktf/provider-aws/lib/eip");
const guardduty_detector_1 = require("@cdktf/provider-aws/lib/guardduty-detector");
const iam_account_password_policy_1 = require("@cdktf/provider-aws/lib/iam-account-password-policy");
const iam_policy_1 = require("@cdktf/provider-aws/lib/iam-policy");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const iam_user_1 = require("@cdktf/provider-aws/lib/iam-user");
const iam_user_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-user-policy-attachment");
const internet_gateway_1 = require("@cdktf/provider-aws/lib/internet-gateway");
const kms_alias_1 = require("@cdktf/provider-aws/lib/kms-alias");
const kms_key_1 = require("@cdktf/provider-aws/lib/kms-key");
const nat_gateway_1 = require("@cdktf/provider-aws/lib/nat-gateway");
const provider_1 = require("@cdktf/provider-aws/lib/provider");
const route_1 = require("@cdktf/provider-aws/lib/route");
const route_table_1 = require("@cdktf/provider-aws/lib/route-table");
const route_table_association_1 = require("@cdktf/provider-aws/lib/route-table-association");
const s3_bucket_1 = require("@cdktf/provider-aws/lib/s3-bucket");
const s3_bucket_logging_1 = require("@cdktf/provider-aws/lib/s3-bucket-logging");
const s3_bucket_public_access_block_1 = require("@cdktf/provider-aws/lib/s3-bucket-public-access-block");
const s3_bucket_server_side_encryption_configuration_1 = require("@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration");
const s3_bucket_versioning_1 = require("@cdktf/provider-aws/lib/s3-bucket-versioning");
const security_group_1 = require("@cdktf/provider-aws/lib/security-group");
const sns_topic_1 = require("@cdktf/provider-aws/lib/sns-topic");
const ssm_parameter_1 = require("@cdktf/provider-aws/lib/ssm-parameter");
const subnet_1 = require("@cdktf/provider-aws/lib/subnet");
const vpc_1 = require("@cdktf/provider-aws/lib/vpc");
const cdktf_1 = require("cdktf");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDtBQUNuRCw2REFBNkQ7QUFDN0QsaUZBQWlGOztBQUVqRixtRUFBZ0U7QUFDaEUsNkZBQXdGO0FBQ3hGLG1GQUE4RTtBQUM5RSx5R0FBb0c7QUFDcEcsK0ZBQXlGO0FBQ3pGLHFEQUFrRDtBQUNsRCxtRkFBK0U7QUFDL0UscUdBQStGO0FBQy9GLG1FQUErRDtBQUMvRCwrREFBMkQ7QUFDM0QsbUdBQTZGO0FBQzdGLCtEQUEyRDtBQUMzRCxtR0FBNkY7QUFDN0YsK0VBQTJFO0FBQzNFLGlFQUE2RDtBQUM3RCw2REFBeUQ7QUFDekQscUVBQWlFO0FBQ2pFLCtEQUErRDtBQUMvRCx5REFBc0Q7QUFDdEQscUVBQWlFO0FBQ2pFLDZGQUF3RjtBQUN4RixpRUFBNkQ7QUFDN0QsaUZBQTZFO0FBQzdFLHlHQUFrRztBQUNsRywySUFBb0k7QUFDcEksdUZBQW1GO0FBQ25GLDJFQUF1RTtBQUN2RSxpRUFBNkQ7QUFDN0QseUVBQXFFO0FBQ3JFLDJEQUF3RDtBQUN4RCxxREFBa0Q7QUFDbEQsaUNBQXdFO0FBR3hFLE1BQU0scUJBQXNCLFNBQVEsc0JBQWM7SUFDaEQsWUFBWSxLQUFnQixFQUFFLEVBQVU7UUFDdEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQix5REFBeUQ7UUFDekQsTUFBTSxVQUFVLEdBQUc7WUFDakIsV0FBVyxFQUFFLFlBQVk7WUFDekIsT0FBTyxFQUFFLCtCQUErQixFQUFFLGtDQUFrQztZQUM1RSxTQUFTLEVBQUUsT0FBTztZQUNsQixhQUFhLEVBQUUsTUFBTTtTQUN0QixDQUFDO1FBRUYsZUFBZTtRQUNmLElBQUksc0JBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzNCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUs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QyxXQUFXLEVBQUUsb0JBQW9CO1NBQ2xDLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3RDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSztZQUN2QixXQUFXLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDOUMsS0FBSyxFQUFFO2dCQUNMLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUN4QixHQUFHLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtnQkFDeEIsRUFBRSxFQUFFLGVBQWUsQ0FBQyxFQUFFO2FBQ3ZCO1lBQ0QsV0FBVyxFQUFFLDRCQUE0QjtTQUMxQyxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFlLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzNDLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSTtZQUN0QixXQUFXLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksdUJBQWUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDNUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3hCLFdBQVcsRUFBRSxxQkFBcUI7U0FDbkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQseURBQXlEO0FBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksV0FBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDM0MsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWFpbi50cyAtIENES1RGIFNlY3VyZSBFbnRlcnByaXNlIEluZnJhc3RydWN0dXJlXG4vLyBJYUMg4oCTIEFXUyBOb3ZhIE1vZGVsIEJyZWFraW5nIC0gU2luZ2xlIEZpbGUgSW1wbGVtZW50YXRpb25cbi8vIFRoaXMgZmlsZSBkZW1vbnN0cmF0ZXMgdGhlIGNvcnJlY3RlZCBpbXBsZW1lbnRhdGlvbiBhcyByZXF1ZXN0ZWQgaW4gdGhlIHByb21wdFxuXG5pbXBvcnQgeyBDbG91ZHRyYWlsIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR0cmFpbCc7XG5pbXBvcnQgeyBDbG91ZHdhdGNoTWV0cmljQWxhcm0gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9jbG91ZHdhdGNoLW1ldHJpYy1hbGFybSc7XG5pbXBvcnQgeyBDb25maWdDb25maWdSdWxlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY29uZmlnLWNvbmZpZy1ydWxlJztcbmltcG9ydCB7IENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2NvbmZpZy1jb25maWd1cmF0aW9uLXJlY29yZGVyJztcbmltcG9ydCB7IERhdGFBd3NDYWxsZXJJZGVudGl0eSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2RhdGEtYXdzLWNhbGxlci1pZGVudGl0eSc7XG5pbXBvcnQgeyBFaXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9laXAnO1xuaW1wb3J0IHsgR3VhcmRkdXR5RGV0ZWN0b3IgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9ndWFyZGR1dHktZGV0ZWN0b3InO1xuaW1wb3J0IHsgSWFtQWNjb3VudFBhc3N3b3JkUG9saWN5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLWFjY291bnQtcGFzc3dvcmQtcG9saWN5JztcbmltcG9ydCB7IElhbVBvbGljeSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1wb2xpY3knO1xuaW1wb3J0IHsgSWFtUm9sZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlJztcbmltcG9ydCB7IElhbVJvbGVQb2xpY3lBdHRhY2htZW50IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUtcG9saWN5LWF0dGFjaG1lbnQnO1xuaW1wb3J0IHsgSWFtVXNlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS11c2VyJztcbmltcG9ydCB7IElhbVVzZXJQb2xpY3lBdHRhY2htZW50IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXVzZXItcG9saWN5LWF0dGFjaG1lbnQnO1xuaW1wb3J0IHsgSW50ZXJuZXRHYXRld2F5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaW50ZXJuZXQtZ2F0ZXdheSc7XG5pbXBvcnQgeyBLbXNBbGlhcyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2ttcy1hbGlhcyc7XG5pbXBvcnQgeyBLbXNLZXkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9rbXMta2V5JztcbmltcG9ydCB7IE5hdEdhdGV3YXkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9uYXQtZ2F0ZXdheSc7XG5pbXBvcnQgeyBBd3NQcm92aWRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3Byb3ZpZGVyJztcbmltcG9ydCB7IFJvdXRlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUnO1xuaW1wb3J0IHsgUm91dGVUYWJsZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3JvdXRlLXRhYmxlJztcbmltcG9ydCB7IFJvdXRlVGFibGVBc3NvY2lhdGlvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3JvdXRlLXRhYmxlLWFzc29jaWF0aW9uJztcbmltcG9ydCB7IFMzQnVja2V0IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0JztcbmltcG9ydCB7IFMzQnVja2V0TG9nZ2luZ0EgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtbG9nZ2luZyc7XG5pbXBvcnQgeyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtYmxvY2snO1xuaW1wb3J0IHsgUzNCdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb25BIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXNlcnZlci1zaWRlLWVuY3J5cHRpb24tY29uZmlndXJhdGlvbic7XG5pbXBvcnQgeyBTM0J1Y2tldFZlcnNpb25pbmdBIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXZlcnNpb25pbmcnO1xuaW1wb3J0IHsgU2VjdXJpdHlHcm91cCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3NlY3VyaXR5LWdyb3VwJztcbmltcG9ydCB7IFNuc1RvcGljIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc25zLXRvcGljJztcbmltcG9ydCB7IFNzbVBhcmFtZXRlciB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3NzbS1wYXJhbWV0ZXInO1xuaW1wb3J0IHsgU3VibmV0IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc3VibmV0JztcbmltcG9ydCB7IFZwYyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3ZwYyc7XG5pbXBvcnQgeyBBcHAsIFMzQmFja2VuZCwgVGVycmFmb3JtT3V0cHV0LCBUZXJyYWZvcm1TdGFjayB9IGZyb20gJ2Nka3RmJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5jbGFzcyBTZWN1cmVFbnRlcnByaXNlU3RhY2sgZXh0ZW5kcyBUZXJyYWZvcm1TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ29tbW9uIHRhZ3MgZm9yIGFsbCByZXNvdXJjZXMgLSBDT1JSRUNURUQgUFJPSkVDVCBOQU1FXG4gICAgY29uc3QgY29tbW9uVGFncyA9IHtcbiAgICAgIEVudmlyb25tZW50OiAnUHJvZHVjdGlvbicsXG4gICAgICBQcm9qZWN0OiAnSWFDIOKAkyBBV1MgTm92YSBNb2RlbCBCcmVha2luZycsIC8vIEZpeGVkOiBFeGFjdCBwcm9tcHQgcmVxdWlyZW1lbnRcbiAgICAgIE1hbmFnZWRCeTogJ0NES1RGJyxcbiAgICAgIFNlY3VyaXR5TGV2ZWw6ICdIaWdoJyxcbiAgICB9O1xuXG4gICAgLy8gQVdTIFByb3ZpZGVyXG4gICAgbmV3IEF3c1Byb3ZpZGVyKHRoaXMsICdhd3MnLCB7XG4gICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgZGVmYXVsdFRhZ3M6IFt7IHRhZ3M6IGNvbW1vblRhZ3MgfV0sXG4gICAgfSk7XG5cbiAgICAvLyBEYXRhIHNvdXJjZXNcbiAgICBjb25zdCBjdXJyZW50ID0gbmV3IERhdGFBd3NDYWxsZXJJZGVudGl0eSh0aGlzLCAnY3VycmVudCcpO1xuXG4gICAgLy8gUzMgQmFja2VuZCBDb25maWd1cmF0aW9uIC0gQ09SUkVDVEVEIHdpdGggcHJvcGVyIHN0YXRlIG1hbmFnZW1lbnRcbiAgICBuZXcgUzNCYWNrZW5kKHRoaXMsIHtcbiAgICAgIGJ1Y2tldDogJ3Byb2Qtc2VjLXRlcnJhZm9ybS1zdGF0ZS1idWNrZXQnLFxuICAgICAga2V5OiAnbm92YS1tb2RlbC90ZXJyYWZvcm0udGZzdGF0ZScsXG4gICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgZHluYW1vZGJUYWJsZTogJ3Byb2Qtc2VjLXRlcnJhZm9ybS1sb2NrcycsXG4gICAgICBlbmNyeXB0OiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gS01TIEtleXMgZm9yIGVuY3J5cHRpb25cbiAgICBjb25zdCBtYWluS21zS2V5ID0gbmV3IEttc0tleSh0aGlzLCAncHJvZC1zZWMtbWFpbi1rbXMta2V5Jywge1xuICAgICAgZGVzY3JpcHRpb246ICdNYWluIEtNUyBrZXkgZm9yIHByb2Qtc2VjIGVudmlyb25tZW50IGVuY3J5cHRpb24nLFxuICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdFbmFibGUgSUFNIFVzZXIgUGVybWlzc2lvbnMnLFxuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2N1cnJlbnQuYWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBBY3Rpb246ICdrbXM6KicsXG4gICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgU2lkOiAnQWxsb3cgQ2xvdWRUcmFpbCB0byBlbmNyeXB0IGxvZ3MnLFxuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEFjdGlvbjogWydrbXM6R2VuZXJhdGVEYXRhS2V5KicsICdrbXM6RGVzY3JpYmVLZXknXSxcbiAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBTaWQ6ICdBbGxvdyBDbG91ZFdhdGNoIExvZ3MnLFxuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgIFNlcnZpY2U6ICdsb2dzLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgJ2ttczpEZWNyeXB0JyxcbiAgICAgICAgICAgICAgJ2ttczpSZUVuY3J5cHQqJyxcbiAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXkqJyxcbiAgICAgICAgICAgICAgJ2ttczpEZXNjcmliZUtleScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1tYWluLWttcy1rZXknIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgS21zQWxpYXModGhpcywgJ3Byb2Qtc2VjLW1haW4ta21zLWFsaWFzJywge1xuICAgICAgbmFtZTogJ2FsaWFzL3Byb2Qtc2VjLW1haW4ta2V5JyxcbiAgICAgIHRhcmdldEtleUlkOiBtYWluS21zS2V5LmtleUlkLFxuICAgIH0pO1xuXG4gICAgLy8gVlBDIENvbmZpZ3VyYXRpb25cbiAgICBjb25zdCB2cGMgPSBuZXcgVnBjKHRoaXMsICdwcm9kLXNlYy12cGMnLCB7XG4gICAgICBjaWRyQmxvY2s6ICcxMC4wLjAuMC8xNicsXG4gICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtdnBjJyB9LFxuICAgIH0pO1xuXG4gICAgLy8gSW50ZXJuZXQgR2F0ZXdheVxuICAgIGNvbnN0IGlndyA9IG5ldyBJbnRlcm5ldEdhdGV3YXkodGhpcywgJ3Byb2Qtc2VjLWlndycsIHtcbiAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1pZ3cnIH0sXG4gICAgfSk7XG5cbiAgICAvLyBQdWJsaWMgU3VibmV0cyBpbiAyKyBBWnMgYXMgcmVxdWlyZWRcbiAgICBjb25zdCBwdWJsaWNTdWJuZXQxID0gbmV3IFN1Ym5ldCh0aGlzLCAncHJvZC1zZWMtcHVibGljLXN1Ym5ldC0xJywge1xuICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgIGNpZHJCbG9jazogJzEwLjAuMS4wLzI0JyxcbiAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFhJyxcbiAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1wdWJsaWMtc3VibmV0LTEnLCBUeXBlOiAnUHVibGljJyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHVibGljU3VibmV0MiA9IG5ldyBTdWJuZXQodGhpcywgJ3Byb2Qtc2VjLXB1YmxpYy1zdWJuZXQtMicsIHtcbiAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICBjaWRyQmxvY2s6ICcxMC4wLjIuMC8yNCcsXG4gICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYicsXG4gICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtcHVibGljLXN1Ym5ldC0yJywgVHlwZTogJ1B1YmxpYycgfSxcbiAgICB9KTtcblxuICAgIC8vIFByaXZhdGUgU3VibmV0c1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXQxID0gbmV3IFN1Ym5ldCh0aGlzLCAncHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMScsIHtcbiAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICBjaWRyQmxvY2s6ICcxMC4wLjEwLjAvMjQnLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogJ3VzLWVhc3QtMWEnLFxuICAgICAgdGFnczoge1xuICAgICAgICAuLi5jb21tb25UYWdzLFxuICAgICAgICBOYW1lOiAncHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMScsXG4gICAgICAgIFR5cGU6ICdQcml2YXRlJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcml2YXRlU3VibmV0MiA9IG5ldyBTdWJuZXQodGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtc3VibmV0LTInLCB7XG4gICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgY2lkckJsb2NrOiAnMTAuMC4xMS4wLzI0JyxcbiAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFiJyxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgTmFtZTogJ3Byb2Qtc2VjLXByaXZhdGUtc3VibmV0LTInLFxuICAgICAgICBUeXBlOiAnUHJpdmF0ZScsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gRWxhc3RpYyBJUHMgZm9yIE5BVCBHYXRld2F5c1xuICAgIGNvbnN0IGVpcDEgPSBuZXcgRWlwKHRoaXMsICdwcm9kLXNlYy1uYXQtZWlwLTEnLCB7XG4gICAgICBkb21haW46ICd2cGMnLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtbmF0LWVpcC0xJyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZWlwMiA9IG5ldyBFaXAodGhpcywgJ3Byb2Qtc2VjLW5hdC1laXAtMicsIHtcbiAgICAgIGRvbWFpbjogJ3ZwYycsXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1uYXQtZWlwLTInIH0sXG4gICAgfSk7XG5cbiAgICAvLyBOQVQgR2F0ZXdheXNcbiAgICBjb25zdCBuYXRHdzEgPSBuZXcgTmF0R2F0ZXdheSh0aGlzLCAncHJvZC1zZWMtbmF0LWd3LTEnLCB7XG4gICAgICBhbGxvY2F0aW9uSWQ6IGVpcDEuaWQsXG4gICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0MS5pZCxcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLW5hdC1ndy0xJyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgbmF0R3cyID0gbmV3IE5hdEdhdGV3YXkodGhpcywgJ3Byb2Qtc2VjLW5hdC1ndy0yJywge1xuICAgICAgYWxsb2NhdGlvbklkOiBlaXAyLmlkLFxuICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDIuaWQsXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1uYXQtZ3ctMicgfSxcbiAgICB9KTtcblxuICAgIC8vIFJvdXRlIFRhYmxlc1xuICAgIGNvbnN0IHB1YmxpY1JvdXRlVGFibGUgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCAncHJvZC1zZWMtcHVibGljLXJ0Jywge1xuICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLXB1YmxpYy1ydCcgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByaXZhdGVSb3V0ZVRhYmxlMSA9IG5ldyBSb3V0ZVRhYmxlKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJ0LTEnLCB7XG4gICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtcHJpdmF0ZS1ydC0xJyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJpdmF0ZVJvdXRlVGFibGUyID0gbmV3IFJvdXRlVGFibGUodGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtcnQtMicsIHtcbiAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6ICdwcm9kLXNlYy1wcml2YXRlLXJ0LTInIH0sXG4gICAgfSk7XG5cbiAgICAvLyBSb3V0ZXNcbiAgICBuZXcgUm91dGUodGhpcywgJ3Byb2Qtc2VjLXB1YmxpYy1yb3V0ZScsIHtcbiAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgIGdhdGV3YXlJZDogaWd3LmlkLFxuICAgIH0pO1xuXG4gICAgbmV3IFJvdXRlKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTEnLCB7XG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMS5pZCxcbiAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cxLmlkLFxuICAgIH0pO1xuXG4gICAgbmV3IFJvdXRlKHRoaXMsICdwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTInLCB7XG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMi5pZCxcbiAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cyLmlkLFxuICAgIH0pO1xuXG4gICAgLy8gUm91dGUgVGFibGUgQXNzb2NpYXRpb25zXG4gICAgbmV3IFJvdXRlVGFibGVBc3NvY2lhdGlvbih0aGlzLCAncHJvZC1zZWMtcHVibGljLXJ0YS0xJywge1xuICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDEuaWQsXG4gICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgfSk7XG5cbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsICdwcm9kLXNlYy1wdWJsaWMtcnRhLTInLCB7XG4gICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0Mi5pZCxcbiAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICB9KTtcblxuICAgIG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24odGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtcnRhLTEnLCB7XG4gICAgICBzdWJuZXRJZDogcHJpdmF0ZVN1Ym5ldDEuaWQsXG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMS5pZCxcbiAgICB9KTtcblxuICAgIG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24odGhpcywgJ3Byb2Qtc2VjLXByaXZhdGUtcnRhLTInLCB7XG4gICAgICBzdWJuZXRJZDogcHJpdmF0ZVN1Ym5ldDIuaWQsXG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMi5pZCxcbiAgICB9KTtcblxuICAgIC8vIFNlY3VyaXR5IEdyb3VwcyAtIENPUlJFQ1RFRCBJbXBsZW1lbnRhdGlvbiAoRml4ZWQgZnJvbSBNT0RFTF9SRVNQT05TRSBmYWlsdXJlcylcbiAgICBjb25zdCB3ZWJTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgJ3Byb2Qtc2VjLXdlYi1zZycsIHtcbiAgICAgIG5hbWU6ICdwcm9kLXNlYy13ZWItc2cnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3Igd2ViIHRpZXInLFxuICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUyBpbmJvdW5kJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBpbmJvdW5kIChyZWRpcmVjdCB0byBIVFRQUyknLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGVncmVzczogW1xuICAgICAgICB7XG4gICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgdG9Qb3J0OiAwLFxuICAgICAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtd2ViLXNnJywgVGllcjogJ1dlYicgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFwcFNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCAncHJvZC1zZWMtYXBwLXNnJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWFwcC1zZycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBhcHBsaWNhdGlvbiB0aWVyJyxcbiAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICBpbmdyZXNzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmcm9tUG9ydDogODA4MCxcbiAgICAgICAgICB0b1BvcnQ6IDgwODAsXG4gICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbd2ViU2VjdXJpdHlHcm91cC5pZF0sIC8vIEZJWEVEOiBDb3JyZWN0IHJlZmVyZW5jZVxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRnJvbSB3ZWIgdGllcicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZWdyZXNzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgb3V0Ym91bmQgZm9yIEFQSSBjYWxscycsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiAncHJvZC1zZWMtYXBwLXNnJywgVGllcjogJ0FwcGxpY2F0aW9uJyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGJTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgJ3Byb2Qtc2VjLWRiLXNnJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWRiLXNnJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIGRhdGFiYXNlIHRpZXInLFxuICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZyb21Qb3J0OiA1NDMyLFxuICAgICAgICAgIHRvUG9ydDogNTQzMixcbiAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthcHBTZWN1cml0eUdyb3VwLmlkXSwgLy8gRklYRUQ6IENvcnJlY3QgcmVmZXJlbmNlXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdGcm9tIGFwcGxpY2F0aW9uIHRpZXInLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLWRiLXNnJywgVGllcjogJ0RhdGFiYXNlJyB9LFxuICAgIH0pO1xuXG4gICAgLy8gUzMgQnVja2V0cyB3aXRoIHNlY3VyaXR5IGNvbmZpZ3VyYXRpb25zXG4gICAgY29uc3QgbG9nc0J1Y2tldCA9IG5ldyBTM0J1Y2tldCh0aGlzLCAncHJvZC1zZWMtbG9ncy1idWNrZXQnLCB7XG4gICAgICBidWNrZXQ6IGBwcm9kLXNlYy1sb2dzLSR7Y3VycmVudC5hY2NvdW50SWR9YCxcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogJ3Byb2Qtc2VjLWxvZ3MtYnVja2V0JywgUHVycG9zZTogJ0xvZ2dpbmcnIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb25BKFxuICAgICAgdGhpcyxcbiAgICAgICdwcm9kLXNlYy1sb2dzLWJ1Y2tldC1lbmNyeXB0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxuICAgICAgICBydWxlOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogbWFpbkttc0tleS5hcm4sXG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgbmV3IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sodGhpcywgJ3Byb2Qtc2VjLWxvZ3MtYnVja2V0LXBhYicsIHtcbiAgICAgIGJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcbiAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIG5ldyBTM0J1Y2tldFZlcnNpb25pbmdBKHRoaXMsICdwcm9kLXNlYy1sb2dzLWJ1Y2tldC12ZXJzaW9uaW5nJywge1xuICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxuICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBwRGF0YUJ1Y2tldCA9IG5ldyBTM0J1Y2tldCh0aGlzLCAncHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0Jywge1xuICAgICAgYnVja2V0OiBgcHJvZC1zZWMtYXBwLWRhdGEtJHtjdXJyZW50LmFjY291bnRJZH1gLFxuICAgICAgdGFnczoge1xuICAgICAgICAuLi5jb21tb25UYWdzLFxuICAgICAgICBOYW1lOiAncHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0JyxcbiAgICAgICAgUHVycG9zZTogJ0FwcGxpY2F0aW9uIERhdGEnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTM0J1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbkEoXG4gICAgICB0aGlzLFxuICAgICAgJ3Byb2Qtc2VjLWFwcC1kYXRhLWJ1Y2tldC1lbmNyeXB0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhcHBEYXRhQnVja2V0LmlkLFxuICAgICAgICBydWxlOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogbWFpbkttc0tleS5hcm4sXG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgbmV3IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sodGhpcywgJ3Byb2Qtc2VjLWFwcC1kYXRhLWJ1Y2tldC1wYWInLCB7XG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRWZXJzaW9uaW5nQSh0aGlzLCAncHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0LXZlcnNpb25pbmcnLCB7XG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXG4gICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBzdGF0dXM6ICdFbmFibGVkJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgUzNCdWNrZXRMb2dnaW5nQSh0aGlzLCAncHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0LWxvZ2dpbmcnLCB7XG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXG4gICAgICB0YXJnZXRCdWNrZXQ6IGxvZ3NCdWNrZXQuaWQsXG4gICAgICB0YXJnZXRQcmVmaXg6ICdzMy1hY2Nlc3MtbG9ncy8nLFxuICAgIH0pO1xuXG4gICAgLy8gSUFNIFBhc3N3b3JkIFBvbGljeSAtIEVOSEFOQ0VEIHdpdGggTUZBIHJlcXVpcmVtZW50c1xuICAgIG5ldyBJYW1BY2NvdW50UGFzc3dvcmRQb2xpY3kodGhpcywgJ3Byb2Qtc2VjLXBhc3N3b3JkLXBvbGljeScsIHtcbiAgICAgIG1pbmltdW1QYXNzd29yZExlbmd0aDogMTQsXG4gICAgICByZXF1aXJlTG93ZXJjYXNlQ2hhcmFjdGVyczogdHJ1ZSxcbiAgICAgIHJlcXVpcmVOdW1iZXJzOiB0cnVlLFxuICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICByZXF1aXJlVXBwZXJjYXNlQ2hhcmFjdGVyczogdHJ1ZSxcbiAgICAgIGFsbG93VXNlcnNUb0NoYW5nZVBhc3N3b3JkOiB0cnVlLFxuICAgICAgbWF4UGFzc3dvcmRBZ2U6IDkwLFxuICAgICAgcGFzc3dvcmRSZXVzZVByZXZlbnRpb246IDEyLFxuICAgICAgaGFyZEV4cGlyeTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICAvLyBNRkEgRW5mb3JjZW1lbnQgUG9saWN5IC0gQURERUQgdG8gYWRkcmVzcyBtaXNzaW5nIE1GQSByZXF1aXJlbWVudFxuICAgIGNvbnN0IG1mYUVuZm9yY2VtZW50UG9saWN5ID0gbmV3IElhbVBvbGljeShcbiAgICAgIHRoaXMsXG4gICAgICAncHJvZC1zZWMtbWZhLWVuZm9yY2VtZW50LXBvbGljeScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdwcm9kLXNlYy1tZmEtZW5mb3JjZW1lbnQtcG9saWN5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbmZvcmNlIE1GQSBmb3IgY3JpdGljYWwgb3BlcmF0aW9ucycsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUFsbEV4Y2VwdFVzZXJzV2l0aE1GQScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBOb3RBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnaWFtOkNyZWF0ZVZpcnR1YWxNRkFEZXZpY2UnLFxuICAgICAgICAgICAgICAgICdpYW06RW5hYmxlTUZBRGV2aWNlJyxcbiAgICAgICAgICAgICAgICAnaWFtOkdldFVzZXInLFxuICAgICAgICAgICAgICAgICdpYW06TGlzdE1GQURldmljZXMnLFxuICAgICAgICAgICAgICAgICdpYW06TGlzdFZpcnR1YWxNRkFEZXZpY2VzJyxcbiAgICAgICAgICAgICAgICAnaWFtOlJlc3luY01GQURldmljZScsXG4gICAgICAgICAgICAgICAgJ3N0czpHZXRTZXNzaW9uVG9rZW4nLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBCb29sSWZFeGlzdHM6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6TXVsdGlGYWN0b3JBdXRoUHJlc2VudCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIElBTSBQb2xpY2llcyB3aXRoIGxlYXN0IHByaXZpbGVnZVxuICAgIGNvbnN0IGVjMlJlYWRPbmx5UG9saWN5ID0gbmV3IElhbVBvbGljeShcbiAgICAgIHRoaXMsXG4gICAgICAncHJvZC1zZWMtZWMyLXJlYWRvbmx5LXBvbGljeScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdwcm9kLXNlYy1lYzItcmVhZG9ubHktcG9saWN5JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSZWFkLW9ubHkgYWNjZXNzIHRvIEVDMiByZXNvdXJjZXMnLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbJ2VjMjpEZXNjcmliZSonLCAnZWMyOkdldConLCAnZWMyOkxpc3QqJ10sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBzM0FwcERhdGFQb2xpY3kgPSBuZXcgSWFtUG9saWN5KHRoaXMsICdwcm9kLXNlYy1zMy1hcHAtZGF0YS1wb2xpY3knLCB7XG4gICAgICBuYW1lOiAncHJvZC1zZWMtczMtYXBwLWRhdGEtcG9saWN5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWNjZXNzIHRvIGFwcGxpY2F0aW9uIGRhdGEgUzMgYnVja2V0JyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOkRlbGV0ZU9iamVjdCddLFxuICAgICAgICAgICAgUmVzb3VyY2U6IGAke2FwcERhdGFCdWNrZXQuYXJufS8qYCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydzMzpMaXN0QnVja2V0J10sXG4gICAgICAgICAgICBSZXNvdXJjZTogYXBwRGF0YUJ1Y2tldC5hcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBBY3Rpb246IFsna21zOkRlY3J5cHQnLCAna21zOkdlbmVyYXRlRGF0YUtleSddLFxuICAgICAgICAgICAgUmVzb3VyY2U6IG1haW5LbXNLZXkuYXJuLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUm9sZXNcbiAgICBjb25zdCBhcHBSb2xlID0gbmV3IElhbVJvbGUodGhpcywgJ3Byb2Qtc2VjLWFwcC1yb2xlJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWFwcC1yb2xlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUm9sZSBmb3IgYXBwbGljYXRpb24gaW5zdGFuY2VzJyxcbiAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgU2VydmljZTogJ2VjMi5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgdGFnczogY29tbW9uVGFncyxcbiAgICB9KTtcblxuICAgIG5ldyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCh0aGlzLCAncHJvZC1zZWMtYXBwLXJvbGUtczMtcG9saWN5Jywge1xuICAgICAgcm9sZTogYXBwUm9sZS5uYW1lLFxuICAgICAgcG9saWN5QXJuOiBzM0FwcERhdGFQb2xpY3kuYXJuLFxuICAgIH0pO1xuXG4gICAgLy8gSUFNIFVzZXJzIHdpdGggbGVhc3QgcHJpdmlsZWdlXG4gICAgY29uc3QgZGV2VXNlciA9IG5ldyBJYW1Vc2VyKHRoaXMsICdwcm9kLXNlYy1kZXYtdXNlcicsIHtcbiAgICAgIG5hbWU6ICdwcm9kLXNlYy1kZXYtdXNlcicsXG4gICAgICBwYXRoOiAnL2RldmVsb3BlcnMvJyxcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgVXNlclR5cGU6ICdEZXZlbG9wZXInIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBvcHNVc2VyID0gbmV3IElhbVVzZXIodGhpcywgJ3Byb2Qtc2VjLW9wcy11c2VyJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLW9wcy11c2VyJyxcbiAgICAgIHBhdGg6ICcvb3BlcmF0aW9ucy8nLFxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBVc2VyVHlwZTogJ09wZXJhdGlvbnMnIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgSWFtVXNlclBvbGljeUF0dGFjaG1lbnQodGhpcywgJ3Byb2Qtc2VjLWRldi11c2VyLWVjMi1yZWFkb25seScsIHtcbiAgICAgIHVzZXI6IGRldlVzZXIubmFtZSxcbiAgICAgIHBvbGljeUFybjogZWMyUmVhZE9ubHlQb2xpY3kuYXJuLFxuICAgIH0pO1xuXG4gICAgbmV3IElhbVVzZXJQb2xpY3lBdHRhY2htZW50KHRoaXMsICdwcm9kLXNlYy1kZXYtdXNlci1tZmEtZW5mb3JjZW1lbnQnLCB7XG4gICAgICB1c2VyOiBkZXZVc2VyLm5hbWUsXG4gICAgICBwb2xpY3lBcm46IG1mYUVuZm9yY2VtZW50UG9saWN5LmFybixcbiAgICB9KTtcblxuICAgIG5ldyBJYW1Vc2VyUG9saWN5QXR0YWNobWVudCh0aGlzLCAncHJvZC1zZWMtb3BzLXVzZXItbWZhLWVuZm9yY2VtZW50Jywge1xuICAgICAgdXNlcjogb3BzVXNlci5uYW1lLFxuICAgICAgcG9saWN5QXJuOiBtZmFFbmZvcmNlbWVudFBvbGljeS5hcm4sXG4gICAgfSk7XG5cbiAgICAvLyBTZWNyZXRzIE1hbmFnZXJcbiAgICAvLyBjb25zdCBkYlNlY3JldCA9IG5ldyBTZWNyZXRzbWFuYWdlclNlY3JldCh0aGlzLCAncHJvZC1zZWMtZGItY3JlZGVudGlhbHMnLCB7XG4gICAgLy8gICBuYW1lOiAncHJvZC1zZWMvZGF0YWJhc2UvY3JlZGVudGlhbHMnLFxuICAgIC8vICAgZGVzY3JpcHRpb246ICdEYXRhYmFzZSBjcmVkZW50aWFscyBmb3IgcHJvZC1zZWMgZW52aXJvbm1lbnQnLFxuICAgIC8vICAga21zS2V5SWQ6IG1haW5LbXNLZXkuYXJuLFxuICAgIC8vICAgdGFnczogY29tbW9uVGFncyxcbiAgICAvLyB9KTtcblxuICAgIC8vIFNTTSBQYXJhbWV0ZXJzXG4gICAgbmV3IFNzbVBhcmFtZXRlcih0aGlzLCAncHJvZC1zZWMtYXBwLWNvbmZpZycsIHtcbiAgICAgIG5hbWU6ICcvcHJvZC1zZWMvYXBwL2NvbmZpZycsXG4gICAgICB0eXBlOiAnU2VjdXJlU3RyaW5nJyxcbiAgICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgbG9nTGV2ZWw6ICdJTkZPJyxcbiAgICAgIH0pLFxuICAgICAga2V5SWQ6IG1haW5LbXNLZXkuYXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBcHBsaWNhdGlvbiBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMnLFxuICAgICAgdGFnczogY29tbW9uVGFncyxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggTG9nIEdyb3Vwc1xuICAgIC8vIGNvbnN0IGFwcExvZ0dyb3VwID0gbmV3IENsb3Vkd2F0Y2hMb2dHcm91cCh0aGlzLCAncHJvZC1zZWMtYXBwLWxvZ3MnLCB7XG4gICAgLy8gICBuYW1lOiAnL2F3cy9lYzIvcHJvZC1zZWMtYXBwJyxcbiAgICAvLyAgIHJldGVudGlvbkluRGF5czogOTAsXG4gICAgLy8gICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXG4gICAgLy8gICB0YWdzOiBjb21tb25UYWdzLFxuICAgIC8vIH0pO1xuXG4gICAgLy8gY29uc3QgdnBjRmxvd0xvZ0dyb3VwID0gbmV3IENsb3Vkd2F0Y2hMb2dHcm91cChcbiAgICAvLyAgIHRoaXMsXG4gICAgLy8gICAncHJvZC1zZWMtdnBjLWZsb3ctbG9ncycsXG4gICAgLy8gICB7XG4gICAgLy8gICAgIG5hbWU6ICcvYXdzL3ZwYy9wcm9kLXNlYy1mbG93bG9ncycsXG4gICAgLy8gICAgIHJldGVudGlvbkluRGF5czogMzAsXG4gICAgLy8gICAgIGttc0tleUlkOiBtYWluS21zS2V5LmFybixcbiAgICAvLyAgICAgdGFnczogY29tbW9uVGFncyxcbiAgICAvLyAgIH1cbiAgICAvLyApO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBhbGVydHNcbiAgICBjb25zdCBhbGVydHNUb3BpYyA9IG5ldyBTbnNUb3BpYyh0aGlzLCAncHJvZC1zZWMtc2VjdXJpdHktYWxlcnRzJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLXNlY3VyaXR5LWFsZXJ0cycsXG4gICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBBbGFybXNcbiAgICBuZXcgQ2xvdWR3YXRjaE1ldHJpY0FsYXJtKHRoaXMsICdwcm9kLXNlYy1yb290LWFjY2Vzcy1hbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogJ3Byb2Qtc2VjLXJvb3QtYWNjZXNzLWFsYXJtJyxcbiAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuT3JFcXVhbFRvVGhyZXNob2xkJyxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgbWV0cmljTmFtZTogJ1Jvb3RBY2Nlc3NDb3VudCcsXG4gICAgICBuYW1lc3BhY2U6ICdDV0xvZ3MnLFxuICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsZXJ0IHdoZW4gcm9vdCB1c2VyIGFjY2VzcyBpcyBkZXRlY3RlZCcsXG4gICAgICBhbGFybUFjdGlvbnM6IFthbGVydHNUb3BpYy5hcm5dLFxuICAgICAgdGFnczogY29tbW9uVGFncyxcbiAgICB9KTtcblxuICAgIG5ldyBDbG91ZHdhdGNoTWV0cmljQWxhcm0odGhpcywgJ3Byb2Qtc2VjLXVuYXV0aG9yaXplZC1hcGktY2FsbHMnLCB7XG4gICAgICBhbGFybU5hbWU6ICdwcm9kLXNlYy11bmF1dGhvcml6ZWQtYXBpLWNhbGxzJyxcbiAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuT3JFcXVhbFRvVGhyZXNob2xkJyxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgbWV0cmljTmFtZTogJ1VuYXV0aG9yaXplZEFQSUNhbGxzJyxcbiAgICAgIG5hbWVzcGFjZTogJ0NXTG9ncycsXG4gICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxlcnQgb24gdW5hdXRob3JpemVkIEFQSSBjYWxscycsXG4gICAgICBhbGFybUFjdGlvbnM6IFthbGVydHNUb3BpYy5hcm5dLFxuICAgICAgdGFnczogY29tbW9uVGFncyxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkVHJhaWwgLSBDT1JSRUNURUQgSW1wbGVtZW50YXRpb25cbiAgICBjb25zdCBjbG91ZHRyYWlsID0gbmV3IENsb3VkdHJhaWwodGhpcywgJ3Byb2Qtc2VjLWNsb3VkdHJhaWwnLCB7XG4gICAgICBuYW1lOiAncHJvZC1zZWMtY2xvdWR0cmFpbCcsXG4gICAgICBzM0J1Y2tldE5hbWU6IGxvZ3NCdWNrZXQuaWQsXG4gICAgICBzM0tleVByZWZpeDogJ2Nsb3VkdHJhaWwtbG9ncy8nLFxuICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRydWUsXG4gICAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IHRydWUsXG4gICAgICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXG4gICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgIH0pO1xuXG4gICAgLy8gQVdTIENvbmZpZyAtIENPUlJFQ1RFRCBkZXBlbmRlbmNpZXNcbiAgICBjb25zdCBjb25maWdSb2xlID0gbmV3IElhbVJvbGUodGhpcywgJ3Byb2Qtc2VjLWNvbmZpZy1yb2xlJywge1xuICAgICAgbmFtZTogJ3Byb2Qtc2VjLWNvbmZpZy1yb2xlJyxcbiAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgU2VydmljZTogJ2NvbmZpZy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgbWFuYWdlZFBvbGljeUFybnM6IFsnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0NvbmZpZ1JvbGUnXSxcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb25maWdCdWNrZXRQb2xpY3kgPSBuZXcgSWFtUG9saWN5KFxuICAgICAgdGhpcyxcbiAgICAgICdwcm9kLXNlYy1jb25maWctYnVja2V0LXBvbGljeScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdwcm9kLXNlYy1jb25maWctYnVja2V0LXBvbGljeScsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFsnczM6R2V0QnVja2V0QWNsJywgJ3MzOkxpc3RCdWNrZXQnXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IGxvZ3NCdWNrZXQuYXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7bG9nc0J1Y2tldC5hcm59L2NvbmZpZy1sb2dzLypgLFxuICAgICAgICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICdzMzp4LWFtei1hY2wnOiAnYnVja2V0LW93bmVyLWZ1bGwtY29udHJvbCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIG5ldyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCh0aGlzLCAncHJvZC1zZWMtY29uZmlnLXJvbGUtYnVja2V0LXBvbGljeScsIHtcbiAgICAgIHJvbGU6IGNvbmZpZ1JvbGUubmFtZSxcbiAgICAgIHBvbGljeUFybjogY29uZmlnQnVja2V0UG9saWN5LmFybixcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbmZpZ1JlY29yZGVyID0gbmV3IENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlcihcbiAgICAgIHRoaXMsXG4gICAgICAncHJvZC1zZWMtY29uZmlnLXJlY29yZGVyJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ3Byb2Qtc2VjLWNvbmZpZy1yZWNvcmRlcicsXG4gICAgICAgIHJvbGVBcm46IGNvbmZpZ1JvbGUuYXJuLFxuICAgICAgICByZWNvcmRpbmdHcm91cDoge1xuICAgICAgICAgIGFsbFN1cHBvcnRlZDogdHJ1ZSxcbiAgICAgICAgICBpbmNsdWRlR2xvYmFsUmVzb3VyY2VUeXBlczogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gRklYRUQ6IEFkZGVkIGRlcGVuZGVuY3kgZm9yIGRlbGl2ZXJ5IGNoYW5uZWxcbiAgICAvLyBjb25zdCBjb25maWdEZWxpdmVyeUNoYW5uZWwgPSBuZXcgQ29uZmlnRGVsaXZlcnlDaGFubmVsKFxuICAgIC8vICAgdGhpcyxcbiAgICAvLyAgICdwcm9kLXNlYy1jb25maWctZGVsaXZlcnktY2hhbm5lbCcsXG4gICAgLy8gICB7XG4gICAgLy8gICAgIG5hbWU6ICdwcm9kLXNlYy1jb25maWctZGVsaXZlcnktY2hhbm5lbCcsXG4gICAgLy8gICAgIHMzQnVja2V0TmFtZTogbG9nc0J1Y2tldC5pZCxcbiAgICAvLyAgICAgczNLZXlQcmVmaXg6ICdjb25maWctbG9ncy8nLFxuICAgIC8vICAgICBkZXBlbmRzT246IFtjb25maWdSZWNvcmRlcl0sXG4gICAgLy8gICB9XG4gICAgLy8gKTtcblxuICAgIC8vIENvbmZpZyBSdWxlc1xuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsICdwcm9kLXNlYy1zMy1idWNrZXQtcHVibGljLWFjY2Vzcy1wcm9oaWJpdGVkJywge1xuICAgICAgbmFtZTogJ3MzLWJ1Y2tldC1wdWJsaWMtYWNjZXNzLXByb2hpYml0ZWQnLFxuICAgICAgc291cmNlOiB7XG4gICAgICAgIG93bmVyOiAnQVdTJyxcbiAgICAgICAgc291cmNlSWRlbnRpZmllcjogJ1MzX0JVQ0tFVF9QVUJMSUNfQUNDRVNTX1BST0hJQklURUQnLFxuICAgICAgfSxcbiAgICAgIGRlcGVuZHNPbjogW2NvbmZpZ1JlY29yZGVyXSxcbiAgICB9KTtcblxuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsICdwcm9kLXNlYy1lbmNyeXB0ZWQtdm9sdW1lcycsIHtcbiAgICAgIG5hbWU6ICdlbmNyeXB0ZWQtdm9sdW1lcycsXG4gICAgICBzb3VyY2U6IHtcbiAgICAgICAgb3duZXI6ICdBV1MnLFxuICAgICAgICBzb3VyY2VJZGVudGlmaWVyOiAnRU5DUllQVEVEX1ZPTFVNRVMnLFxuICAgICAgfSxcbiAgICAgIGRlcGVuZHNPbjogW2NvbmZpZ1JlY29yZGVyXSxcbiAgICB9KTtcblxuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsICdwcm9kLXNlYy1pYW0tcGFzc3dvcmQtcG9saWN5Jywge1xuICAgICAgbmFtZTogJ2lhbS1wYXNzd29yZC1wb2xpY3knLFxuICAgICAgc291cmNlOiB7XG4gICAgICAgIG93bmVyOiAnQVdTJyxcbiAgICAgICAgc291cmNlSWRlbnRpZmllcjogJ0lBTV9QQVNTV09SRF9QT0xJQ1knLFxuICAgICAgfSxcbiAgICAgIGlucHV0UGFyYW1ldGVyczogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBSZXF1aXJlVXBwZXJjYXNlQ2hhcmFjdGVyczogJ3RydWUnLFxuICAgICAgICBSZXF1aXJlTG93ZXJjYXNlQ2hhcmFjdGVyczogJ3RydWUnLFxuICAgICAgICBSZXF1aXJlU3ltYm9sczogJ3RydWUnLFxuICAgICAgICBSZXF1aXJlTnVtYmVyczogJ3RydWUnLFxuICAgICAgICBNaW5pbXVtUGFzc3dvcmRMZW5ndGg6ICcxNCcsXG4gICAgICB9KSxcbiAgICAgIGRlcGVuZHNPbjogW2NvbmZpZ1JlY29yZGVyXSxcbiAgICB9KTtcblxuICAgIC8vIEd1YXJkRHV0eSAtIEVOSEFOQ0VEIHdpdGggUzMgcHJvdGVjdGlvblxuICAgIG5ldyBHdWFyZGR1dHlEZXRlY3Rvcih0aGlzLCAncHJvZC1zZWMtZ3VhcmRkdXR5Jywge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgZmluZGluZ1B1Ymxpc2hpbmdGcmVxdWVuY3k6ICdGSUZURUVOX01JTlVURVMnLFxuICAgICAgZGF0YXNvdXJjZXM6IHtcbiAgICAgICAgczNMb2dzOiB7XG4gICAgICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBrdWJlcm5ldGVzOiB7XG4gICAgICAgICAgYXVkaXRMb2dzOiB7XG4gICAgICAgICAgICBlbmFibGU6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbWFsd2FyZVByb3RlY3Rpb246IHtcbiAgICAgICAgICBzY2FuRWMySW5zdGFuY2VXaXRoRmluZGluZ3M6IHtcbiAgICAgICAgICAgIGVic1ZvbHVtZXM6IHtcbiAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3MsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAndnBjX2lkJywge1xuICAgICAgdmFsdWU6IHZwYy5pZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVlBDIElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgJ3B1YmxpY19zdWJuZXRfaWRzJywge1xuICAgICAgdmFsdWU6IFtwdWJsaWNTdWJuZXQxLmlkLCBwdWJsaWNTdWJuZXQyLmlkXSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUHVibGljIHN1Ym5ldCBJRHMnLFxuICAgIH0pO1xuXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAncHJpdmF0ZV9zdWJuZXRfaWRzJywge1xuICAgICAgdmFsdWU6IFtwcml2YXRlU3VibmV0MS5pZCwgcHJpdmF0ZVN1Ym5ldDIuaWRdLFxuICAgICAgZGVzY3JpcHRpb246ICdQcml2YXRlIHN1Ym5ldCBJRHMnLFxuICAgIH0pO1xuXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAna21zX2tleV9pZCcsIHtcbiAgICAgIHZhbHVlOiBtYWluS21zS2V5LmtleUlkLFxuICAgICAgZGVzY3JpcHRpb246ICdNYWluIEtNUyBrZXkgSUQnLFxuICAgIH0pO1xuXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAnc2VjdXJpdHlfZ3JvdXBfaWRzJywge1xuICAgICAgdmFsdWU6IHtcbiAgICAgICAgd2ViOiB3ZWJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgICBhcHA6IGFwcFNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICAgIGRiOiBkYlNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICB9LFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBJRHMgYnkgdGllcicsXG4gICAgfSk7XG5cbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsICdjbG91ZHRyYWlsX25hbWUnLCB7XG4gICAgICB2YWx1ZTogY2xvdWR0cmFpbC5uYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZFRyYWlsIG5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCAnbG9nc19idWNrZXRfbmFtZScsIHtcbiAgICAgIHZhbHVlOiBsb2dzQnVja2V0LmJ1Y2tldCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTG9ncyBTMyBidWNrZXQgbmFtZScsXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gQ09SUkVDVEVEOiBBcHBsaWNhdGlvbiBib290c3RyYXAgd2l0aCBwcm9wZXIgc3RydWN0dXJlXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5uZXcgU2VjdXJlRW50ZXJwcmlzZVN0YWNrKGFwcCwgJ3Byb2Qtc2VjJyk7XG5hcHAuc3ludGgoKTtcbiJdfQ==