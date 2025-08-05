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
const config_delivery_channel_1 = require("@cdktf/provider-aws/lib/config-delivery-channel");
const config_config_rule_1 = require("@cdktf/provider-aws/lib/config-config-rule");
const guardduty_detector_1 = require("@cdktf/provider-aws/lib/guardduty-detector");
const cloudwatch_log_group_1 = require("@cdktf/provider-aws/lib/cloudwatch-log-group");
const cloudwatch_metric_alarm_1 = require("@cdktf/provider-aws/lib/cloudwatch-metric-alarm");
const sns_topic_1 = require("@cdktf/provider-aws/lib/sns-topic");
const secretsmanager_secret_1 = require("@cdktf/provider-aws/lib/secretsmanager-secret");
const ssm_parameter_1 = require("@cdktf/provider-aws/lib/ssm-parameter");
const data_aws_caller_identity_1 = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
class SecureEnterpriseStack extends cdktf_1.TerraformStack {
    constructor(scope, id) {
        super(scope, id);
        // Common tags for all resources - CORRECTED PROJECT NAME
        const commonTags = {
            Environment: "Production",
            Project: "IaC – AWS Nova Model Breaking", // Fixed: Exact prompt requirement
            ManagedBy: "CDKTF",
            SecurityLevel: "High"
        };
        // AWS Provider
        new provider_1.AwsProvider(this, "aws", {
            region: "us-east-1",
            defaultTags: [{ tags: commonTags }]
        });
        // Data sources
        const current = new data_aws_caller_identity_1.DataAwsCallerIdentity(this, "current");
        // S3 Backend Configuration - CORRECTED with proper state management
        new cdktf_1.S3Backend(this, {
            bucket: "prod-sec-terraform-state-bucket",
            key: "nova-model/terraform.tfstate",
            region: "us-east-1",
            dynamodbTable: "prod-sec-terraform-locks",
            encrypt: true
        });
        // KMS Keys for encryption
        const mainKmsKey = new kms_key_1.KmsKey(this, "prod-sec-main-kms-key", {
            description: "Main KMS key for prod-sec environment encryption",
            enableKeyRotation: true,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "Enable IAM User Permissions",
                        Effect: "Allow",
                        Principal: {
                            AWS: `arn:aws:iam::${current.accountId}:root`
                        },
                        Action: "kms:*",
                        Resource: "*"
                    },
                    {
                        Sid: "Allow CloudTrail to encrypt logs",
                        Effect: "Allow",
                        Principal: {
                            Service: "cloudtrail.amazonaws.com"
                        },
                        Action: [
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        Resource: "*"
                    },
                    {
                        Sid: "Allow CloudWatch Logs",
                        Effect: "Allow",
                        Principal: {
                            Service: "logs.us-east-1.amazonaws.com"
                        },
                        Action: [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        Resource: "*"
                    }
                ]
            }),
            tags: { ...commonTags, Name: "prod-sec-main-kms-key" }
        });
        new kms_alias_1.KmsAlias(this, "prod-sec-main-kms-alias", {
            name: "alias/prod-sec-main-key",
            targetKeyId: mainKmsKey.keyId
        });
        // VPC Configuration
        const vpc = new vpc_1.Vpc(this, "prod-sec-vpc", {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...commonTags, Name: "prod-sec-vpc" }
        });
        // Internet Gateway
        const igw = new internet_gateway_1.InternetGateway(this, "prod-sec-igw", {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: "prod-sec-igw" }
        });
        // Public Subnets in 2+ AZs as required
        const publicSubnet1 = new subnet_1.Subnet(this, "prod-sec-public-subnet-1", {
            vpcId: vpc.id,
            cidrBlock: "10.0.1.0/24",
            availabilityZone: "us-east-1a",
            mapPublicIpOnLaunch: true,
            tags: { ...commonTags, Name: "prod-sec-public-subnet-1", Type: "Public" }
        });
        const publicSubnet2 = new subnet_1.Subnet(this, "prod-sec-public-subnet-2", {
            vpcId: vpc.id,
            cidrBlock: "10.0.2.0/24",
            availabilityZone: "us-east-1b",
            mapPublicIpOnLaunch: true,
            tags: { ...commonTags, Name: "prod-sec-public-subnet-2", Type: "Public" }
        });
        // Private Subnets
        const privateSubnet1 = new subnet_1.Subnet(this, "prod-sec-private-subnet-1", {
            vpcId: vpc.id,
            cidrBlock: "10.0.10.0/24",
            availabilityZone: "us-east-1a",
            tags: { ...commonTags, Name: "prod-sec-private-subnet-1", Type: "Private" }
        });
        const privateSubnet2 = new subnet_1.Subnet(this, "prod-sec-private-subnet-2", {
            vpcId: vpc.id,
            cidrBlock: "10.0.11.0/24",
            availabilityZone: "us-east-1b",
            tags: { ...commonTags, Name: "prod-sec-private-subnet-2", Type: "Private" }
        });
        // Elastic IPs for NAT Gateways
        const eip1 = new eip_1.Eip(this, "prod-sec-nat-eip-1", {
            domain: "vpc",
            tags: { ...commonTags, Name: "prod-sec-nat-eip-1" }
        });
        const eip2 = new eip_1.Eip(this, "prod-sec-nat-eip-2", {
            domain: "vpc",
            tags: { ...commonTags, Name: "prod-sec-nat-eip-2" }
        });
        // NAT Gateways
        const natGw1 = new nat_gateway_1.NatGateway(this, "prod-sec-nat-gw-1", {
            allocationId: eip1.id,
            subnetId: publicSubnet1.id,
            tags: { ...commonTags, Name: "prod-sec-nat-gw-1" }
        });
        const natGw2 = new nat_gateway_1.NatGateway(this, "prod-sec-nat-gw-2", {
            allocationId: eip2.id,
            subnetId: publicSubnet2.id,
            tags: { ...commonTags, Name: "prod-sec-nat-gw-2" }
        });
        // Route Tables
        const publicRouteTable = new route_table_1.RouteTable(this, "prod-sec-public-rt", {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: "prod-sec-public-rt" }
        });
        const privateRouteTable1 = new route_table_1.RouteTable(this, "prod-sec-private-rt-1", {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: "prod-sec-private-rt-1" }
        });
        const privateRouteTable2 = new route_table_1.RouteTable(this, "prod-sec-private-rt-2", {
            vpcId: vpc.id,
            tags: { ...commonTags, Name: "prod-sec-private-rt-2" }
        });
        // Routes
        new route_1.Route(this, "prod-sec-public-route", {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: igw.id
        });
        new route_1.Route(this, "prod-sec-private-route-1", {
            routeTableId: privateRouteTable1.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: natGw1.id
        });
        new route_1.Route(this, "prod-sec-private-route-2", {
            routeTableId: privateRouteTable2.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: natGw2.id
        });
        // Route Table Associations
        new route_table_association_1.RouteTableAssociation(this, "prod-sec-public-rta-1", {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id
        });
        new route_table_association_1.RouteTableAssociation(this, "prod-sec-public-rta-2", {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id
        });
        new route_table_association_1.RouteTableAssociation(this, "prod-sec-private-rta-1", {
            subnetId: privateSubnet1.id,
            routeTableId: privateRouteTable1.id
        });
        new route_table_association_1.RouteTableAssociation(this, "prod-sec-private-rta-2", {
            subnetId: privateSubnet2.id,
            routeTableId: privateRouteTable2.id
        });
        // Security Groups - CORRECTED Implementation (Fixed from MODEL_RESPONSE failures)
        const webSecurityGroup = new security_group_1.SecurityGroup(this, "prod-sec-web-sg", {
            name: "prod-sec-web-sg",
            description: "Security group for web tier",
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTPS inbound"
                },
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTP inbound (redirect to HTTPS)"
                }
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: "-1",
                    cidrBlocks: ["0.0.0.0/0"]
                }
            ],
            tags: { ...commonTags, Name: "prod-sec-web-sg", Tier: "Web" }
        });
        const appSecurityGroup = new security_group_1.SecurityGroup(this, "prod-sec-app-sg", {
            name: "prod-sec-app-sg",
            description: "Security group for application tier",
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 8080,
                    toPort: 8080,
                    protocol: "tcp",
                    securityGroups: [webSecurityGroup.id], // FIXED: Correct reference
                    description: "From web tier"
                }
            ],
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTPS outbound for API calls"
                }
            ],
            tags: { ...commonTags, Name: "prod-sec-app-sg", Tier: "Application" }
        });
        const dbSecurityGroup = new security_group_1.SecurityGroup(this, "prod-sec-db-sg", {
            name: "prod-sec-db-sg",
            description: "Security group for database tier",
            vpcId: vpc.id,
            ingress: [
                {
                    fromPort: 5432,
                    toPort: 5432,
                    protocol: "tcp",
                    securityGroups: [appSecurityGroup.id], // FIXED: Correct reference
                    description: "From application tier"
                }
            ],
            tags: { ...commonTags, Name: "prod-sec-db-sg", Tier: "Database" }
        });
        // S3 Buckets with security configurations
        const logsBucket = new s3_bucket_1.S3Bucket(this, "prod-sec-logs-bucket", {
            bucket: `prod-sec-logs-${current.accountId}`,
            tags: { ...commonTags, Name: "prod-sec-logs-bucket", Purpose: "Logging" }
        });
        new s3_bucket_server_side_encryption_configuration_1.S3BucketServerSideEncryptionConfigurationA(this, "prod-sec-logs-bucket-encryption", {
            bucket: logsBucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsMasterKeyId: mainKmsKey.arn,
                        sseAlgorithm: "aws:kms"
                    },
                    bucketKeyEnabled: true
                }
            ]
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, "prod-sec-logs-bucket-pab", {
            bucket: logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, "prod-sec-logs-bucket-versioning", {
            bucket: logsBucket.id,
            versioningConfiguration: {
                status: "Enabled"
            }
        });
        const appDataBucket = new s3_bucket_1.S3Bucket(this, "prod-sec-app-data-bucket", {
            bucket: `prod-sec-app-data-${current.accountId}`,
            tags: { ...commonTags, Name: "prod-sec-app-data-bucket", Purpose: "Application Data" }
        });
        new s3_bucket_server_side_encryption_configuration_1.S3BucketServerSideEncryptionConfigurationA(this, "prod-sec-app-data-bucket-encryption", {
            bucket: appDataBucket.id,
            rule: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsMasterKeyId: mainKmsKey.arn,
                        sseAlgorithm: "aws:kms"
                    },
                    bucketKeyEnabled: true
                }
            ]
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, "prod-sec-app-data-bucket-pab", {
            bucket: appDataBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, "prod-sec-app-data-bucket-versioning", {
            bucket: appDataBucket.id,
            versioningConfiguration: {
                status: "Enabled"
            }
        });
        new s3_bucket_logging_1.S3BucketLoggingA(this, "prod-sec-app-data-bucket-logging", {
            bucket: appDataBucket.id,
            targetBucket: logsBucket.id,
            targetPrefix: "s3-access-logs/"
        });
        // IAM Password Policy - ENHANCED with MFA requirements
        new iam_account_password_policy_1.IamAccountPasswordPolicy(this, "prod-sec-password-policy", {
            minimumPasswordLength: 14,
            requireLowercaseCharacters: true,
            requireNumbers: true,
            requireSymbols: true,
            requireUppercaseCharacters: true,
            allowUsersToChangePassword: true,
            maxPasswordAge: 90,
            passwordReusePrevention: 12,
            hardExpiry: false
        });
        // MFA Enforcement Policy - ADDED to address missing MFA requirement
        const mfaEnforcementPolicy = new iam_policy_1.IamPolicy(this, "prod-sec-mfa-enforcement-policy", {
            name: "prod-sec-mfa-enforcement-policy",
            description: "Enforce MFA for critical operations",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "DenyAllExceptUsersWithMFA",
                        Effect: "Deny",
                        NotAction: [
                            "iam:CreateVirtualMFADevice",
                            "iam:EnableMFADevice",
                            "iam:GetUser",
                            "iam:ListMFADevices",
                            "iam:ListVirtualMFADevices",
                            "iam:ResyncMFADevice",
                            "sts:GetSessionToken"
                        ],
                        Resource: "*",
                        Condition: {
                            BoolIfExists: {
                                "aws:MultiFactorAuthPresent": "false"
                            }
                        }
                    }
                ]
            }),
            tags: commonTags
        });
        // IAM Policies with least privilege
        const ec2ReadOnlyPolicy = new iam_policy_1.IamPolicy(this, "prod-sec-ec2-readonly-policy", {
            name: "prod-sec-ec2-readonly-policy",
            description: "Read-only access to EC2 resources",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "ec2:Describe*",
                            "ec2:Get*",
                            "ec2:List*"
                        ],
                        Resource: "*"
                    }
                ]
            }),
            tags: commonTags
        });
        const s3AppDataPolicy = new iam_policy_1.IamPolicy(this, "prod-sec-s3-app-data-policy", {
            name: "prod-sec-s3-app-data-policy",
            description: "Access to application data S3 bucket",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        Resource: `${appDataBucket.arn}/*`
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:ListBucket"
                        ],
                        Resource: appDataBucket.arn
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        Resource: mainKmsKey.arn
                    }
                ]
            }),
            tags: commonTags
        });
        // IAM Roles
        const appRole = new iam_role_1.IamRole(this, "prod-sec-app-role", {
            name: "prod-sec-app-role",
            description: "Role for application instances",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "ec2.amazonaws.com"
                        }
                    }
                ]
            }),
            tags: commonTags
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, "prod-sec-app-role-s3-policy", {
            role: appRole.name,
            policyArn: s3AppDataPolicy.arn
        });
        // IAM Users with least privilege
        const devUser = new iam_user_1.IamUser(this, "prod-sec-dev-user", {
            name: "prod-sec-dev-user",
            path: "/developers/",
            tags: { ...commonTags, UserType: "Developer" }
        });
        const opsUser = new iam_user_1.IamUser(this, "prod-sec-ops-user", {
            name: "prod-sec-ops-user",
            path: "/operations/",
            tags: { ...commonTags, UserType: "Operations" }
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, "prod-sec-dev-user-ec2-readonly", {
            user: devUser.name,
            policyArn: ec2ReadOnlyPolicy.arn
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, "prod-sec-dev-user-mfa-enforcement", {
            user: devUser.name,
            policyArn: mfaEnforcementPolicy.arn
        });
        new iam_user_policy_attachment_1.IamUserPolicyAttachment(this, "prod-sec-ops-user-mfa-enforcement", {
            user: opsUser.name,
            policyArn: mfaEnforcementPolicy.arn
        });
        // Secrets Manager
        const dbSecret = new secretsmanager_secret_1.SecretsmanagerSecret(this, "prod-sec-db-credentials", {
            name: "prod-sec/database/credentials",
            description: "Database credentials for prod-sec environment",
            kmsKeyId: mainKmsKey.arn,
            tags: commonTags
        });
        // SSM Parameters
        new ssm_parameter_1.SsmParameter(this, "prod-sec-app-config", {
            name: "/prod-sec/app/config",
            type: "SecureString",
            value: JSON.stringify({
                environment: "production",
                debug: false,
                logLevel: "INFO"
            }),
            keyId: mainKmsKey.arn,
            description: "Application configuration parameters",
            tags: commonTags
        });
        // CloudWatch Log Groups
        const appLogGroup = new cloudwatch_log_group_1.CloudwatchLogGroup(this, "prod-sec-app-logs", {
            name: "/aws/ec2/prod-sec-app",
            retentionInDays: 90,
            kmsKeyId: mainKmsKey.arn,
            tags: commonTags
        });
        const vpcFlowLogGroup = new cloudwatch_log_group_1.CloudwatchLogGroup(this, "prod-sec-vpc-flow-logs", {
            name: "/aws/vpc/prod-sec-flowlogs",
            retentionInDays: 30,
            kmsKeyId: mainKmsKey.arn,
            tags: commonTags
        });
        // SNS Topic for alerts
        const alertsTopic = new sns_topic_1.SnsTopic(this, "prod-sec-security-alerts", {
            name: "prod-sec-security-alerts",
            tags: commonTags
        });
        // CloudWatch Alarms
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, "prod-sec-root-access-alarm", {
            alarmName: "prod-sec-root-access-alarm",
            comparisonOperator: "GreaterThanOrEqualToThreshold",
            evaluationPeriods: 1,
            metricName: "RootAccessCount",
            namespace: "CWLogs",
            period: 300,
            statistic: "Sum",
            threshold: 1,
            alarmDescription: "Alert when root user access is detected",
            alarmActions: [alertsTopic.arn],
            tags: commonTags
        });
        new cloudwatch_metric_alarm_1.CloudwatchMetricAlarm(this, "prod-sec-unauthorized-api-calls", {
            alarmName: "prod-sec-unauthorized-api-calls",
            comparisonOperator: "GreaterThanOrEqualToThreshold",
            evaluationPeriods: 1,
            metricName: "UnauthorizedAPICalls",
            namespace: "CWLogs",
            period: 300,
            statistic: "Sum",
            threshold: 5,
            alarmDescription: "Alert on unauthorized API calls",
            alarmActions: [alertsTopic.arn],
            tags: commonTags
        });
        // CloudTrail - CORRECTED Implementation
        const cloudtrail = new cloudtrail_1.Cloudtrail(this, "prod-sec-cloudtrail", {
            name: "prod-sec-cloudtrail",
            s3BucketName: logsBucket.id,
            s3KeyPrefix: "cloudtrail-logs/",
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: true,
            enableLogging: true,
            enableLogFileValidation: true,
            kmsKeyId: mainKmsKey.arn,
            tags: commonTags
        });
        // AWS Config - CORRECTED dependencies
        const configRole = new iam_role_1.IamRole(this, "prod-sec-config-role", {
            name: "prod-sec-config-role",
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "config.amazonaws.com"
                        }
                    }
                ]
            }),
            managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/ConfigRole"],
            tags: commonTags
        });
        const configBucketPolicy = new iam_policy_1.IamPolicy(this, "prod-sec-config-bucket-policy", {
            name: "prod-sec-config-bucket-policy",
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:GetBucketAcl",
                            "s3:ListBucket"
                        ],
                        Resource: logsBucket.arn
                    },
                    {
                        Effect: "Allow",
                        Action: "s3:PutObject",
                        Resource: `${logsBucket.arn}/config-logs/*`,
                        Condition: {
                            StringEquals: {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            })
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, "prod-sec-config-role-bucket-policy", {
            role: configRole.name,
            policyArn: configBucketPolicy.arn
        });
        const configRecorder = new config_configuration_recorder_1.ConfigConfigurationRecorder(this, "prod-sec-config-recorder", {
            name: "prod-sec-config-recorder",
            roleArn: configRole.arn,
            recordingGroup: {
                allSupported: true,
                includeGlobalResourceTypes: true
            }
        });
        // FIXED: Added dependency for delivery channel
        const configDeliveryChannel = new config_delivery_channel_1.ConfigDeliveryChannel(this, "prod-sec-config-delivery-channel", {
            name: "prod-sec-config-delivery-channel",
            s3BucketName: logsBucket.id,
            s3KeyPrefix: "config-logs/",
            dependsOn: [configRecorder]
        });
        // Config Rules
        new config_config_rule_1.ConfigConfigRule(this, "prod-sec-s3-bucket-public-access-prohibited", {
            name: "s3-bucket-public-access-prohibited",
            source: {
                owner: "AWS",
                sourceIdentifier: "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
            },
            dependsOn: [configRecorder]
        });
        new config_config_rule_1.ConfigConfigRule(this, "prod-sec-encrypted-volumes", {
            name: "encrypted-volumes",
            source: {
                owner: "AWS",
                sourceIdentifier: "ENCRYPTED_VOLUMES"
            },
            dependsOn: [configRecorder]
        });
        new config_config_rule_1.ConfigConfigRule(this, "prod-sec-iam-password-policy", {
            name: "iam-password-policy",
            source: {
                owner: "AWS",
                sourceIdentifier: "IAM_PASSWORD_POLICY"
            },
            inputParameters: JSON.stringify({
                RequireUppercaseCharacters: "true",
                RequireLowercaseCharacters: "true",
                RequireSymbols: "true",
                RequireNumbers: "true",
                MinimumPasswordLength: "14"
            }),
            dependsOn: [configRecorder]
        });
        // GuardDuty - ENHANCED with S3 protection
        new guardduty_detector_1.GuarddutyDetector(this, "prod-sec-guardduty", {
            enable: true,
            findingPublishingFrequency: "FIFTEEN_MINUTES",
            datasources: {
                s3Logs: {
                    enable: true
                },
                kubernetes: {
                    auditLogs: {
                        enable: true
                    }
                },
                malwareProtection: {
                    scanEc2InstanceWithFindings: {
                        ebsVolumes: {
                            enable: true
                        }
                    }
                }
            },
            tags: commonTags
        });
        // Outputs
        new cdktf_1.TerraformOutput(this, "vpc_id", {
            value: vpc.id,
            description: "VPC ID"
        });
        new cdktf_1.TerraformOutput(this, "public_subnet_ids", {
            value: [publicSubnet1.id, publicSubnet2.id],
            description: "Public subnet IDs"
        });
        new cdktf_1.TerraformOutput(this, "private_subnet_ids", {
            value: [privateSubnet1.id, privateSubnet2.id],
            description: "Private subnet IDs"
        });
        new cdktf_1.TerraformOutput(this, "kms_key_id", {
            value: mainKmsKey.keyId,
            description: "Main KMS key ID"
        });
        new cdktf_1.TerraformOutput(this, "security_group_ids", {
            value: {
                web: webSecurityGroup.id,
                app: appSecurityGroup.id,
                db: dbSecurityGroup.id
            },
            description: "Security group IDs by tier"
        });
        new cdktf_1.TerraformOutput(this, "cloudtrail_name", {
            value: cloudtrail.name,
            description: "CloudTrail name"
        });
        new cdktf_1.TerraformOutput(this, "logs_bucket_name", {
            value: logsBucket.bucket,
            description: "Logs S3 bucket name"
        });
    }
}
// CORRECTED: Application bootstrap with proper structure
const app = new cdktf_1.App();
new SecureEnterpriseStack(app, "prod-sec");
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9EQUFvRDtBQUNwRCw2REFBNkQ7QUFDN0QsaUZBQWlGOztBQUdqRixpQ0FBd0U7QUFDeEUsK0RBQStEO0FBQy9ELHFEQUFrRDtBQUNsRCwyREFBd0Q7QUFDeEQsK0VBQTJFO0FBQzNFLHFFQUFpRTtBQUNqRSxxREFBa0Q7QUFDbEQscUVBQWlFO0FBQ2pFLHlEQUFzRDtBQUN0RCw2RkFBd0Y7QUFDeEYsMkVBQXVFO0FBQ3ZFLDZEQUF5RDtBQUN6RCxpRUFBNkQ7QUFDN0QsaUVBQTZEO0FBQzdELDJJQUFvSTtBQUNwSSx5R0FBa0c7QUFDbEcsaUZBQTZFO0FBQzdFLHVGQUFtRjtBQUNuRiwrREFBMkQ7QUFDM0QsbUVBQStEO0FBQy9ELG1HQUE2RjtBQUM3RiwrREFBMkQ7QUFDM0QsbUdBQTZGO0FBQzdGLHFHQUErRjtBQUMvRixtRUFBZ0U7QUFDaEUseUdBQW9HO0FBQ3BHLDZGQUF3RjtBQUN4RixtRkFBOEU7QUFDOUUsbUZBQStFO0FBQy9FLHVGQUFrRjtBQUNsRiw2RkFBd0Y7QUFDeEYsaUVBQTZEO0FBQzdELHlGQUFxRjtBQUNyRix5RUFBcUU7QUFDckUsK0ZBQXlGO0FBRXpGLE1BQU0scUJBQXNCLFNBQVEsc0JBQWM7SUFDaEQsWUFBWSxLQUFnQixFQUFFLEVBQVU7UUFDdEMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQix5REFBeUQ7UUFDekQsTUFBTSxVQUFVLEdBQUc7WUFDakIsV0FBVyxFQUFFLFlBQVk7WUFDekIsT0FBTyxFQUFFLCtCQUErQixFQUFFLGtDQUFrQztZQUM1RSxTQUFTLEVBQUUsT0FBTztZQUNsQixhQUFhLEVBQUUsTUFBTTtTQUN0QixDQUFDO1FBRUYsZUFBZTtRQUNmLElBQUksc0JBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzNCLE1BQU0sRUFBRSxXQUFXO1lB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QUFFLHFCQUFxQjtTQUNuQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCx5REFBeUQ7QUFDekQsTUFBTSxHQUFHLEdBQUcsSUFBSSxXQUFHLEVBQUUsQ0FBQztBQUN0QixJQUFJLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUMzQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBtYWluLnRzIC0gQ0RLVEYgU2VjdXJlIEVudGVycHJpc2UgSW5mcmFzdHJ1Y3R1cmUgXHJcbi8vIElhQyDigJMgQVdTIE5vdmEgTW9kZWwgQnJlYWtpbmcgLSBTaW5nbGUgRmlsZSBJbXBsZW1lbnRhdGlvblxyXG4vLyBUaGlzIGZpbGUgZGVtb25zdHJhdGVzIHRoZSBjb3JyZWN0ZWQgaW1wbGVtZW50YXRpb24gYXMgcmVxdWVzdGVkIGluIHRoZSBwcm9tcHRcclxuXHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IEFwcCwgVGVycmFmb3JtU3RhY2ssIFMzQmFja2VuZCwgVGVycmFmb3JtT3V0cHV0IH0gZnJvbSBcImNka3RmXCI7XHJcbmltcG9ydCB7IEF3c1Byb3ZpZGVyIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL3Byb3ZpZGVyXCI7XHJcbmltcG9ydCB7IFZwYyB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi92cGNcIjtcclxuaW1wb3J0IHsgU3VibmV0IH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL3N1Ym5ldFwiO1xyXG5pbXBvcnQgeyBJbnRlcm5ldEdhdGV3YXkgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaW50ZXJuZXQtZ2F0ZXdheVwiO1xyXG5pbXBvcnQgeyBOYXRHYXRld2F5IH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL25hdC1nYXRld2F5XCI7XHJcbmltcG9ydCB7IEVpcCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9laXBcIjtcclxuaW1wb3J0IHsgUm91dGVUYWJsZSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZS10YWJsZVwiO1xyXG5pbXBvcnQgeyBSb3V0ZSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZVwiO1xyXG5pbXBvcnQgeyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24gfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUtdGFibGUtYXNzb2NpYXRpb25cIjtcclxuaW1wb3J0IHsgU2VjdXJpdHlHcm91cCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zZWN1cml0eS1ncm91cFwiO1xyXG5pbXBvcnQgeyBLbXNLZXkgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIva21zLWtleVwiO1xyXG5pbXBvcnQgeyBLbXNBbGlhcyB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9rbXMtYWxpYXNcIjtcclxuaW1wb3J0IHsgUzNCdWNrZXQgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0XCI7XHJcbmltcG9ydCB7IFMzQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uQSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtc2VydmVyLXNpZGUtZW5jcnlwdGlvbi1jb25maWd1cmF0aW9uXCI7XHJcbmltcG9ydCB7IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtYmxvY2tcIjtcclxuaW1wb3J0IHsgUzNCdWNrZXRMb2dnaW5nQSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtbG9nZ2luZ1wiO1xyXG5pbXBvcnQgeyBTM0J1Y2tldFZlcnNpb25pbmdBIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL3MzLWJ1Y2tldC12ZXJzaW9uaW5nXCI7XHJcbmltcG9ydCB7IElhbVJvbGUgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGVcIjtcclxuaW1wb3J0IHsgSWFtUG9saWN5IH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1wb2xpY3lcIjtcclxuaW1wb3J0IHsgSWFtUm9sZVBvbGljeUF0dGFjaG1lbnQgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUtcG9saWN5LWF0dGFjaG1lbnRcIjtcclxuaW1wb3J0IHsgSWFtVXNlciB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tdXNlclwiO1xyXG5pbXBvcnQgeyBJYW1Vc2VyUG9saWN5QXR0YWNobWVudCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tdXNlci1wb2xpY3ktYXR0YWNobWVudFwiO1xyXG5pbXBvcnQgeyBJYW1BY2NvdW50UGFzc3dvcmRQb2xpY3kgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLWFjY291bnQtcGFzc3dvcmQtcG9saWN5XCI7XHJcbmltcG9ydCB7IENsb3VkdHJhaWwgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR0cmFpbFwiO1xyXG5pbXBvcnQgeyBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXIgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY29uZmlnLWNvbmZpZ3VyYXRpb24tcmVjb3JkZXJcIjtcclxuaW1wb3J0IHsgQ29uZmlnRGVsaXZlcnlDaGFubmVsIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL2NvbmZpZy1kZWxpdmVyeS1jaGFubmVsXCI7XHJcbmltcG9ydCB7IENvbmZpZ0NvbmZpZ1J1bGUgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY29uZmlnLWNvbmZpZy1ydWxlXCI7XHJcbmltcG9ydCB7IEd1YXJkZHV0eURldGVjdG9yIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL2d1YXJkZHV0eS1kZXRlY3RvclwiO1xyXG5pbXBvcnQgeyBDbG91ZHdhdGNoTG9nR3JvdXAgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvY2xvdWR3YXRjaC1sb2ctZ3JvdXBcIjtcclxuaW1wb3J0IHsgQ2xvdWR3YXRjaE1ldHJpY0FsYXJtIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL2Nsb3Vkd2F0Y2gtbWV0cmljLWFsYXJtXCI7XHJcbmltcG9ydCB7IFNuc1RvcGljIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL3Nucy10b3BpY1wiO1xyXG5pbXBvcnQgeyBTZWNyZXRzbWFuYWdlclNlY3JldCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zZWNyZXRzbWFuYWdlci1zZWNyZXRcIjtcclxuaW1wb3J0IHsgU3NtUGFyYW1ldGVyIH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL3NzbS1wYXJhbWV0ZXJcIjtcclxuaW1wb3J0IHsgRGF0YUF3c0NhbGxlcklkZW50aXR5IH0gZnJvbSBcIkBjZGt0Zi9wcm92aWRlci1hd3MvbGliL2RhdGEtYXdzLWNhbGxlci1pZGVudGl0eVwiO1xyXG5cclxuY2xhc3MgU2VjdXJlRW50ZXJwcmlzZVN0YWNrIGV4dGVuZHMgVGVycmFmb3JtU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCk7XHJcblxyXG4gICAgLy8gQ29tbW9uIHRhZ3MgZm9yIGFsbCByZXNvdXJjZXMgLSBDT1JSRUNURUQgUFJPSkVDVCBOQU1FXHJcbiAgICBjb25zdCBjb21tb25UYWdzID0ge1xyXG4gICAgICBFbnZpcm9ubWVudDogXCJQcm9kdWN0aW9uXCIsXHJcbiAgICAgIFByb2plY3Q6IFwiSWFDIOKAkyBBV1MgTm92YSBNb2RlbCBCcmVha2luZ1wiLCAvLyBGaXhlZDogRXhhY3QgcHJvbXB0IHJlcXVpcmVtZW50XHJcbiAgICAgIE1hbmFnZWRCeTogXCJDREtURlwiLFxyXG4gICAgICBTZWN1cml0eUxldmVsOiBcIkhpZ2hcIlxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBBV1MgUHJvdmlkZXJcclxuICAgIG5ldyBBd3NQcm92aWRlcih0aGlzLCBcImF3c1wiLCB7XHJcbiAgICAgIHJlZ2lvbjogXCJ1cy1lYXN0LTFcIixcclxuICAgICAgZGVmYXVsdFRhZ3M6IFt7IHRhZ3M6IGNvbW1vblRhZ3MgfV1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERhdGEgc291cmNlc1xyXG4gICAgY29uc3QgY3VycmVudCA9IG5ldyBEYXRhQXdzQ2FsbGVySWRlbnRpdHkodGhpcywgXCJjdXJyZW50XCIpO1xyXG5cclxuICAgIC8vIFMzIEJhY2tlbmQgQ29uZmlndXJhdGlvbiAtIENPUlJFQ1RFRCB3aXRoIHByb3BlciBzdGF0ZSBtYW5hZ2VtZW50XHJcbiAgICBuZXcgUzNCYWNrZW5kKHRoaXMsIHtcclxuICAgICAgYnVja2V0OiBcInByb2Qtc2VjLXRlcnJhZm9ybS1zdGF0ZS1idWNrZXRcIixcclxuICAgICAga2V5OiBcIm5vdmEtbW9kZWwvdGVycmFmb3JtLnRmc3RhdGVcIixcclxuICAgICAgcmVnaW9uOiBcInVzLWVhc3QtMVwiLFxyXG4gICAgICBkeW5hbW9kYlRhYmxlOiBcInByb2Qtc2VjLXRlcnJhZm9ybS1sb2Nrc1wiLCBcclxuICAgICAgZW5jcnlwdDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gS01TIEtleXMgZm9yIGVuY3J5cHRpb25cclxuICAgIGNvbnN0IG1haW5LbXNLZXkgPSBuZXcgS21zS2V5KHRoaXMsIFwicHJvZC1zZWMtbWFpbi1rbXMta2V5XCIsIHtcclxuICAgICAgZGVzY3JpcHRpb246IFwiTWFpbiBLTVMga2V5IGZvciBwcm9kLXNlYyBlbnZpcm9ubWVudCBlbmNyeXB0aW9uXCIsXHJcbiAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxyXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgU2lkOiBcIkVuYWJsZSBJQU0gVXNlciBQZXJtaXNzaW9uc1wiLFxyXG4gICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7Y3VycmVudC5hY2NvdW50SWR9OnJvb3RgXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEFjdGlvbjogXCJrbXM6KlwiLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogXCIqXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIFNpZDogXCJBbGxvdyBDbG91ZFRyYWlsIHRvIGVuY3J5cHQgbG9nc1wiLFxyXG4gICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XHJcbiAgICAgICAgICAgICAgU2VydmljZTogXCJjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb21cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXkqXCIsXHJcbiAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIlxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogXCIqXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIFNpZDogXCJBbGxvdyBDbG91ZFdhdGNoIExvZ3NcIixcclxuICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsIFxyXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICBTZXJ2aWNlOiBcImxvZ3MudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcImttczpFbmNyeXB0XCIsXHJcbiAgICAgICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxyXG4gICAgICAgICAgICAgIFwia21zOlJlRW5jcnlwdCpcIixcclxuICAgICAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXkqXCIsXHJcbiAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIlxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogXCIqXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH0pLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6IFwicHJvZC1zZWMtbWFpbi1rbXMta2V5XCIgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IEttc0FsaWFzKHRoaXMsIFwicHJvZC1zZWMtbWFpbi1rbXMtYWxpYXNcIiwge1xyXG4gICAgICBuYW1lOiBcImFsaWFzL3Byb2Qtc2VjLW1haW4ta2V5XCIsXHJcbiAgICAgIHRhcmdldEtleUlkOiBtYWluS21zS2V5LmtleUlkXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBWUEMgQ29uZmlndXJhdGlvblxyXG4gICAgY29uc3QgdnBjID0gbmV3IFZwYyh0aGlzLCBcInByb2Qtc2VjLXZwY1wiLCB7XHJcbiAgICAgIGNpZHJCbG9jazogXCIxMC4wLjAuMC8xNlwiLFxyXG4gICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXHJcbiAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy12cGNcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnRlcm5ldCBHYXRld2F5XHJcbiAgICBjb25zdCBpZ3cgPSBuZXcgSW50ZXJuZXRHYXRld2F5KHRoaXMsIFwicHJvZC1zZWMtaWd3XCIsIHtcclxuICAgICAgdnBjSWQ6IHZwYy5pZCxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLWlnd1wiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFB1YmxpYyBTdWJuZXRzIGluIDIrIEFacyBhcyByZXF1aXJlZFxyXG4gICAgY29uc3QgcHVibGljU3VibmV0MSA9IG5ldyBTdWJuZXQodGhpcywgXCJwcm9kLXNlYy1wdWJsaWMtc3VibmV0LTFcIiwge1xyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBjaWRyQmxvY2s6IFwiMTAuMC4xLjAvMjRcIixcclxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogXCJ1cy1lYXN0LTFhXCIsXHJcbiAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1wdWJsaWMtc3VibmV0LTFcIiwgVHlwZTogXCJQdWJsaWNcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBwdWJsaWNTdWJuZXQyID0gbmV3IFN1Ym5ldCh0aGlzLCBcInByb2Qtc2VjLXB1YmxpYy1zdWJuZXQtMlwiLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIGNpZHJCbG9jazogXCIxMC4wLjIuMC8yNFwiLFxyXG4gICAgICBhdmFpbGFiaWxpdHlab25lOiBcInVzLWVhc3QtMWJcIixcclxuICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLXB1YmxpYy1zdWJuZXQtMlwiLCBUeXBlOiBcIlB1YmxpY1wiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFByaXZhdGUgU3VibmV0c1xyXG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldDEgPSBuZXcgU3VibmV0KHRoaXMsIFwicHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMVwiLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIGNpZHJCbG9jazogXCIxMC4wLjEwLjAvMjRcIixcclxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogXCJ1cy1lYXN0LTFhXCIsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1wcml2YXRlLXN1Ym5ldC0xXCIsIFR5cGU6IFwiUHJpdmF0ZVwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHByaXZhdGVTdWJuZXQyID0gbmV3IFN1Ym5ldCh0aGlzLCBcInByb2Qtc2VjLXByaXZhdGUtc3VibmV0LTJcIiwge1xyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBjaWRyQmxvY2s6IFwiMTAuMC4xMS4wLzI0XCIsXHJcbiAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IFwidXMtZWFzdC0xYlwiLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6IFwicHJvZC1zZWMtcHJpdmF0ZS1zdWJuZXQtMlwiLCBUeXBlOiBcIlByaXZhdGVcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBFbGFzdGljIElQcyBmb3IgTkFUIEdhdGV3YXlzXHJcbiAgICBjb25zdCBlaXAxID0gbmV3IEVpcCh0aGlzLCBcInByb2Qtc2VjLW5hdC1laXAtMVwiLCB7XHJcbiAgICAgIGRvbWFpbjogXCJ2cGNcIixcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLW5hdC1laXAtMVwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGVpcDIgPSBuZXcgRWlwKHRoaXMsIFwicHJvZC1zZWMtbmF0LWVpcC0yXCIsIHtcclxuICAgICAgZG9tYWluOiBcInZwY1wiLCBcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLW5hdC1laXAtMlwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE5BVCBHYXRld2F5c1xyXG4gICAgY29uc3QgbmF0R3cxID0gbmV3IE5hdEdhdGV3YXkodGhpcywgXCJwcm9kLXNlYy1uYXQtZ3ctMVwiLCB7XHJcbiAgICAgIGFsbG9jYXRpb25JZDogZWlwMS5pZCxcclxuICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDEuaWQsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1uYXQtZ3ctMVwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG5hdEd3MiA9IG5ldyBOYXRHYXRld2F5KHRoaXMsIFwicHJvZC1zZWMtbmF0LWd3LTJcIiwge1xyXG4gICAgICBhbGxvY2F0aW9uSWQ6IGVpcDIuaWQsXHJcbiAgICAgIHN1Ym5ldElkOiBwdWJsaWNTdWJuZXQyLmlkLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6IFwicHJvZC1zZWMtbmF0LWd3LTJcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSb3V0ZSBUYWJsZXNcclxuICAgIGNvbnN0IHB1YmxpY1JvdXRlVGFibGUgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCBcInByb2Qtc2VjLXB1YmxpYy1ydFwiLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1wdWJsaWMtcnRcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBwcml2YXRlUm91dGVUYWJsZTEgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCBcInByb2Qtc2VjLXByaXZhdGUtcnQtMVwiLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1wcml2YXRlLXJ0LTFcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBwcml2YXRlUm91dGVUYWJsZTIgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCBcInByb2Qtc2VjLXByaXZhdGUtcnQtMlwiLCB7XHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1wcml2YXRlLXJ0LTJcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSb3V0ZXNcclxuICAgIG5ldyBSb3V0ZSh0aGlzLCBcInByb2Qtc2VjLXB1YmxpYy1yb3V0ZVwiLCB7XHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcclxuICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6IFwiMC4wLjAuMC8wXCIsXHJcbiAgICAgIGdhdGV3YXlJZDogaWd3LmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGUodGhpcywgXCJwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTFcIiwge1xyXG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMS5pZCxcclxuICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6IFwiMC4wLjAuMC8wXCIsXHJcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cxLmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGUodGhpcywgXCJwcm9kLXNlYy1wcml2YXRlLXJvdXRlLTJcIiwge1xyXG4gICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlMi5pZCxcclxuICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6IFwiMC4wLjAuMC8wXCIsXHJcbiAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cyLmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSb3V0ZSBUYWJsZSBBc3NvY2lhdGlvbnNcclxuICAgIG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24odGhpcywgXCJwcm9kLXNlYy1wdWJsaWMtcnRhLTFcIiwge1xyXG4gICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0MS5pZCxcclxuICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlLmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsIFwicHJvZC1zZWMtcHVibGljLXJ0YS0yXCIsIHtcclxuICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDIuaWQsXHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFJvdXRlVGFibGVBc3NvY2lhdGlvbih0aGlzLCBcInByb2Qtc2VjLXByaXZhdGUtcnRhLTFcIiwge1xyXG4gICAgICBzdWJuZXRJZDogcHJpdmF0ZVN1Ym5ldDEuaWQsXHJcbiAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUxLmlkXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsIFwicHJvZC1zZWMtcHJpdmF0ZS1ydGEtMlwiLCB7XHJcbiAgICAgIHN1Ym5ldElkOiBwcml2YXRlU3VibmV0Mi5pZCxcclxuICAgICAgcm91dGVUYWJsZUlkOiBwcml2YXRlUm91dGVUYWJsZTIuaWRcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNlY3VyaXR5IEdyb3VwcyAtIENPUlJFQ1RFRCBJbXBsZW1lbnRhdGlvbiAoRml4ZWQgZnJvbSBNT0RFTF9SRVNQT05TRSBmYWlsdXJlcylcclxuICAgIGNvbnN0IHdlYlNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCBcInByb2Qtc2VjLXdlYi1zZ1wiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtd2ViLXNnXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlNlY3VyaXR5IGdyb3VwIGZvciB3ZWIgdGllclwiLFxyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBpbmdyZXNzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcclxuICAgICAgICAgIHRvUG9ydDogNDQzLFxyXG4gICAgICAgICAgcHJvdG9jb2w6IFwidGNwXCIsXHJcbiAgICAgICAgICBjaWRyQmxvY2tzOiBbXCIwLjAuMC4wLzBcIl0sXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJIVFRQUyBpbmJvdW5kXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZyb21Qb3J0OiA4MCxcclxuICAgICAgICAgIHRvUG9ydDogODAsXHJcbiAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcclxuICAgICAgICAgIGNpZHJCbG9ja3M6IFtcIjAuMC4wLjAvMFwiXSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkhUVFAgaW5ib3VuZCAocmVkaXJlY3QgdG8gSFRUUFMpXCJcclxuICAgICAgICB9XHJcbiAgICAgIF0sXHJcbiAgICAgIGVncmVzczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZyb21Qb3J0OiAwLFxyXG4gICAgICAgICAgdG9Qb3J0OiAwLFxyXG4gICAgICAgICAgcHJvdG9jb2w6IFwiLTFcIixcclxuICAgICAgICAgIGNpZHJCbG9ja3M6IFtcIjAuMC4wLjAvMFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgXSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLXdlYi1zZ1wiLCBUaWVyOiBcIldlYlwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGFwcFNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCBcInByb2Qtc2VjLWFwcC1zZ1wiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtYXBwLXNnXCIsIFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJTZWN1cml0eSBncm91cCBmb3IgYXBwbGljYXRpb24gdGllclwiLFxyXG4gICAgICB2cGNJZDogdnBjLmlkLFxyXG4gICAgICBpbmdyZXNzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZnJvbVBvcnQ6IDgwODAsXHJcbiAgICAgICAgICB0b1BvcnQ6IDgwODAsXHJcbiAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcclxuICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbd2ViU2VjdXJpdHlHcm91cC5pZF0sIC8vIEZJWEVEOiBDb3JyZWN0IHJlZmVyZW5jZVxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IFwiRnJvbSB3ZWIgdGllclwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdLFxyXG4gICAgICBlZ3Jlc3M6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmcm9tUG9ydDogNDQzLFxyXG4gICAgICAgICAgdG9Qb3J0OiA0NDMsXHJcbiAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcclxuICAgICAgICAgIGNpZHJCbG9ja3M6IFtcIjAuMC4wLjAvMFwiXSxcclxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkhUVFBTIG91dGJvdW5kIGZvciBBUEkgY2FsbHNcIlxyXG4gICAgICAgIH1cclxuICAgICAgXSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLWFwcC1zZ1wiLCBUaWVyOiBcIkFwcGxpY2F0aW9uXCIgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZGJTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgXCJwcm9kLXNlYy1kYi1zZ1wiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtZGItc2dcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiU2VjdXJpdHkgZ3JvdXAgZm9yIGRhdGFiYXNlIHRpZXJcIiwgXHJcbiAgICAgIHZwY0lkOiB2cGMuaWQsXHJcbiAgICAgIGluZ3Jlc3M6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmcm9tUG9ydDogNTQzMixcclxuICAgICAgICAgIHRvUG9ydDogNTQzMixcclxuICAgICAgICAgIHByb3RvY29sOiBcInRjcFwiLFxyXG4gICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthcHBTZWN1cml0eUdyb3VwLmlkXSwgLy8gRklYRUQ6IENvcnJlY3QgcmVmZXJlbmNlXHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGcm9tIGFwcGxpY2F0aW9uIHRpZXJcIlxyXG4gICAgICAgIH1cclxuICAgICAgXSxcclxuICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCBOYW1lOiBcInByb2Qtc2VjLWRiLXNnXCIsIFRpZXI6IFwiRGF0YWJhc2VcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTMyBCdWNrZXRzIHdpdGggc2VjdXJpdHkgY29uZmlndXJhdGlvbnNcclxuICAgIGNvbnN0IGxvZ3NCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgXCJwcm9kLXNlYy1sb2dzLWJ1Y2tldFwiLCB7XHJcbiAgICAgIGJ1Y2tldDogYHByb2Qtc2VjLWxvZ3MtJHtjdXJyZW50LmFjY291bnRJZH1gLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIE5hbWU6IFwicHJvZC1zZWMtbG9ncy1idWNrZXRcIiwgUHVycG9zZTogXCJMb2dnaW5nXCIgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFMzQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uQSh0aGlzLCBcInByb2Qtc2VjLWxvZ3MtYnVja2V0LWVuY3J5cHRpb25cIiwge1xyXG4gICAgICBidWNrZXQ6IGxvZ3NCdWNrZXQuaWQsXHJcbiAgICAgIHJ1bGU6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XHJcbiAgICAgICAgICAgIGttc01hc3RlcktleUlkOiBtYWluS21zS2V5LmFybixcclxuICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiBcImF3czprbXNcIlxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKHRoaXMsIFwicHJvZC1zZWMtbG9ncy1idWNrZXQtcGFiXCIsIHtcclxuICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxyXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXHJcbiAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxyXG4gICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxyXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldFZlcnNpb25pbmdBKHRoaXMsIFwicHJvZC1zZWMtbG9ncy1idWNrZXQtdmVyc2lvbmluZ1wiLCB7XHJcbiAgICAgIGJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcclxuICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICBzdGF0dXM6IFwiRW5hYmxlZFwiXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGFwcERhdGFCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgXCJwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXRcIiwge1xyXG4gICAgICBidWNrZXQ6IGBwcm9kLXNlYy1hcHAtZGF0YS0ke2N1cnJlbnQuYWNjb3VudElkfWAsXHJcbiAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgTmFtZTogXCJwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXRcIiwgUHVycG9zZTogXCJBcHBsaWNhdGlvbiBEYXRhXCIgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFMzQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uQSh0aGlzLCBcInByb2Qtc2VjLWFwcC1kYXRhLWJ1Y2tldC1lbmNyeXB0aW9uXCIsIHtcclxuICAgICAgYnVja2V0OiBhcHBEYXRhQnVja2V0LmlkLFxyXG4gICAgICBydWxlOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xyXG4gICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgICAgICAgIHNzZUFsZ29yaXRobTogXCJhd3M6a21zXCJcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBidWNrZXRLZXlFbmFibGVkOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgUzNCdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayh0aGlzLCBcInByb2Qtc2VjLWFwcC1kYXRhLWJ1Y2tldC1wYWJcIiwge1xyXG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXHJcbiAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcclxuICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXHJcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXHJcbiAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFMzQnVja2V0VmVyc2lvbmluZ0EodGhpcywgXCJwcm9kLXNlYy1hcHAtZGF0YS1idWNrZXQtdmVyc2lvbmluZ1wiLCB7XHJcbiAgICAgIGJ1Y2tldDogYXBwRGF0YUJ1Y2tldC5pZCxcclxuICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICBzdGF0dXM6IFwiRW5hYmxlZFwiXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBTM0J1Y2tldExvZ2dpbmdBKHRoaXMsIFwicHJvZC1zZWMtYXBwLWRhdGEtYnVja2V0LWxvZ2dpbmdcIiwge1xyXG4gICAgICBidWNrZXQ6IGFwcERhdGFCdWNrZXQuaWQsXHJcbiAgICAgIHRhcmdldEJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcclxuICAgICAgdGFyZ2V0UHJlZml4OiBcInMzLWFjY2Vzcy1sb2dzL1wiXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJQU0gUGFzc3dvcmQgUG9saWN5IC0gRU5IQU5DRUQgd2l0aCBNRkEgcmVxdWlyZW1lbnRzXHJcbiAgICBuZXcgSWFtQWNjb3VudFBhc3N3b3JkUG9saWN5KHRoaXMsIFwicHJvZC1zZWMtcGFzc3dvcmQtcG9saWN5XCIsIHtcclxuICAgICAgbWluaW11bVBhc3N3b3JkTGVuZ3RoOiAxNCxcclxuICAgICAgcmVxdWlyZUxvd2VyY2FzZUNoYXJhY3RlcnM6IHRydWUsXHJcbiAgICAgIHJlcXVpcmVOdW1iZXJzOiB0cnVlLFxyXG4gICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcclxuICAgICAgcmVxdWlyZVVwcGVyY2FzZUNoYXJhY3RlcnM6IHRydWUsXHJcbiAgICAgIGFsbG93VXNlcnNUb0NoYW5nZVBhc3N3b3JkOiB0cnVlLFxyXG4gICAgICBtYXhQYXNzd29yZEFnZTogOTAsXHJcbiAgICAgIHBhc3N3b3JkUmV1c2VQcmV2ZW50aW9uOiAxMixcclxuICAgICAgaGFyZEV4cGlyeTogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE1GQSBFbmZvcmNlbWVudCBQb2xpY3kgLSBBRERFRCB0byBhZGRyZXNzIG1pc3NpbmcgTUZBIHJlcXVpcmVtZW50XHJcbiAgICBjb25zdCBtZmFFbmZvcmNlbWVudFBvbGljeSA9IG5ldyBJYW1Qb2xpY3kodGhpcywgXCJwcm9kLXNlYy1tZmEtZW5mb3JjZW1lbnQtcG9saWN5XCIsIHtcclxuICAgICAgbmFtZTogXCJwcm9kLXNlYy1tZmEtZW5mb3JjZW1lbnQtcG9saWN5XCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkVuZm9yY2UgTUZBIGZvciBjcml0aWNhbCBvcGVyYXRpb25zXCIsXHJcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxyXG4gICAgICAgIFN0YXRlbWVudDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBTaWQ6IFwiRGVueUFsbEV4Y2VwdFVzZXJzV2l0aE1GQVwiLFxyXG4gICAgICAgICAgICBFZmZlY3Q6IFwiRGVueVwiLFxyXG4gICAgICAgICAgICBOb3RBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcImlhbTpDcmVhdGVWaXJ0dWFsTUZBRGV2aWNlXCIsXHJcbiAgICAgICAgICAgICAgXCJpYW06RW5hYmxlTUZBRGV2aWNlXCIsIFxyXG4gICAgICAgICAgICAgIFwiaWFtOkdldFVzZXJcIixcclxuICAgICAgICAgICAgICBcImlhbTpMaXN0TUZBRGV2aWNlc1wiLFxyXG4gICAgICAgICAgICAgIFwiaWFtOkxpc3RWaXJ0dWFsTUZBRGV2aWNlc1wiLFxyXG4gICAgICAgICAgICAgIFwiaWFtOlJlc3luY01GQURldmljZVwiLFxyXG4gICAgICAgICAgICAgIFwic3RzOkdldFNlc3Npb25Ub2tlblwiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcclxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XHJcbiAgICAgICAgICAgICAgQm9vbElmRXhpc3RzOiB7XHJcbiAgICAgICAgICAgICAgICBcImF3czpNdWx0aUZhY3RvckF1dGhQcmVzZW50XCI6IFwiZmFsc2VcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSksXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3NcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElBTSBQb2xpY2llcyB3aXRoIGxlYXN0IHByaXZpbGVnZVxyXG4gICAgY29uc3QgZWMyUmVhZE9ubHlQb2xpY3kgPSBuZXcgSWFtUG9saWN5KHRoaXMsIFwicHJvZC1zZWMtZWMyLXJlYWRvbmx5LXBvbGljeVwiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtZWMyLXJlYWRvbmx5LXBvbGljeVwiLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJSZWFkLW9ubHkgYWNjZXNzIHRvIEVDMiByZXNvdXJjZXNcIixcclxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXHJcbiAgICAgICAgU3RhdGVtZW50OiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZSpcIixcclxuICAgICAgICAgICAgICBcImVjMjpHZXQqXCIsIFxyXG4gICAgICAgICAgICAgIFwiZWMyOkxpc3QqXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KSxcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgczNBcHBEYXRhUG9saWN5ID0gbmV3IElhbVBvbGljeSh0aGlzLCBcInByb2Qtc2VjLXMzLWFwcC1kYXRhLXBvbGljeVwiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtczMtYXBwLWRhdGEtcG9saWN5XCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFjY2VzcyB0byBhcHBsaWNhdGlvbiBkYXRhIFMzIGJ1Y2tldFwiLFxyXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgIEFjdGlvbjogW1xyXG4gICAgICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgXCJzMzpQdXRPYmplY3RcIixcclxuICAgICAgICAgICAgICBcInMzOkRlbGV0ZU9iamVjdFwiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHthcHBEYXRhQnVja2V0LmFybn0vKmBcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIlxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogYXBwRGF0YUJ1Y2tldC5hcm5cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICBBY3Rpb246IFtcclxuICAgICAgICAgICAgICBcImttczpEZWNyeXB0XCIsXHJcbiAgICAgICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5XCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgUmVzb3VyY2U6IG1haW5LbXNLZXkuYXJuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KSxcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSUFNIFJvbGVzXHJcbiAgICBjb25zdCBhcHBSb2xlID0gbmV3IElhbVJvbGUodGhpcywgXCJwcm9kLXNlYy1hcHAtcm9sZVwiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtYXBwLXJvbGVcIixcclxuICAgICAgZGVzY3JpcHRpb246IFwiUm9sZSBmb3IgYXBwbGljYXRpb24gaW5zdGFuY2VzXCIsXHJcbiAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgQWN0aW9uOiBcInN0czpBc3N1bWVSb2xlXCIsXHJcbiAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICBTZXJ2aWNlOiBcImVjMi5hbWF6b25hd3MuY29tXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSksXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3NcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBJYW1Sb2xlUG9saWN5QXR0YWNobWVudCh0aGlzLCBcInByb2Qtc2VjLWFwcC1yb2xlLXMzLXBvbGljeVwiLCB7XHJcbiAgICAgIHJvbGU6IGFwcFJvbGUubmFtZSxcclxuICAgICAgcG9saWN5QXJuOiBzM0FwcERhdGFQb2xpY3kuYXJuXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJQU0gVXNlcnMgd2l0aCBsZWFzdCBwcml2aWxlZ2VcclxuICAgIGNvbnN0IGRldlVzZXIgPSBuZXcgSWFtVXNlcih0aGlzLCBcInByb2Qtc2VjLWRldi11c2VyXCIsIHtcclxuICAgICAgbmFtZTogXCJwcm9kLXNlYy1kZXYtdXNlclwiLFxyXG4gICAgICBwYXRoOiBcIi9kZXZlbG9wZXJzL1wiLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIFVzZXJUeXBlOiBcIkRldmVsb3BlclwiIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG9wc1VzZXIgPSBuZXcgSWFtVXNlcih0aGlzLCBcInByb2Qtc2VjLW9wcy11c2VyXCIsIHtcclxuICAgICAgbmFtZTogXCJwcm9kLXNlYy1vcHMtdXNlclwiLFxyXG4gICAgICBwYXRoOiBcIi9vcGVyYXRpb25zL1wiLFxyXG4gICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIFVzZXJUeXBlOiBcIk9wZXJhdGlvbnNcIiB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgSWFtVXNlclBvbGljeUF0dGFjaG1lbnQodGhpcywgXCJwcm9kLXNlYy1kZXYtdXNlci1lYzItcmVhZG9ubHlcIiwge1xyXG4gICAgICB1c2VyOiBkZXZVc2VyLm5hbWUsXHJcbiAgICAgIHBvbGljeUFybjogZWMyUmVhZE9ubHlQb2xpY3kuYXJuXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgSWFtVXNlclBvbGljeUF0dGFjaG1lbnQodGhpcywgXCJwcm9kLXNlYy1kZXYtdXNlci1tZmEtZW5mb3JjZW1lbnRcIiwge1xyXG4gICAgICB1c2VyOiBkZXZVc2VyLm5hbWUsXHJcbiAgICAgIHBvbGljeUFybjogbWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgSWFtVXNlclBvbGljeUF0dGFjaG1lbnQodGhpcywgXCJwcm9kLXNlYy1vcHMtdXNlci1tZmEtZW5mb3JjZW1lbnRcIiwge1xyXG4gICAgICB1c2VyOiBvcHNVc2VyLm5hbWUsXHJcbiAgICAgIHBvbGljeUFybjogbWZhRW5mb3JjZW1lbnRQb2xpY3kuYXJuXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZWNyZXRzIE1hbmFnZXJcclxuICAgIGNvbnN0IGRiU2VjcmV0ID0gbmV3IFNlY3JldHNtYW5hZ2VyU2VjcmV0KHRoaXMsIFwicHJvZC1zZWMtZGItY3JlZGVudGlhbHNcIiwge1xyXG4gICAgICBuYW1lOiBcInByb2Qtc2VjL2RhdGFiYXNlL2NyZWRlbnRpYWxzXCIsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkRhdGFiYXNlIGNyZWRlbnRpYWxzIGZvciBwcm9kLXNlYyBlbnZpcm9ubWVudFwiLFxyXG4gICAgICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3NcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNTTSBQYXJhbWV0ZXJzXHJcbiAgICBuZXcgU3NtUGFyYW1ldGVyKHRoaXMsIFwicHJvZC1zZWMtYXBwLWNvbmZpZ1wiLCB7XHJcbiAgICAgIG5hbWU6IFwiL3Byb2Qtc2VjL2FwcC9jb25maWdcIixcclxuICAgICAgdHlwZTogXCJTZWN1cmVTdHJpbmdcIixcclxuICAgICAgdmFsdWU6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBlbnZpcm9ubWVudDogXCJwcm9kdWN0aW9uXCIsXHJcbiAgICAgICAgZGVidWc6IGZhbHNlLFxyXG4gICAgICAgIGxvZ0xldmVsOiBcIklORk9cIlxyXG4gICAgICB9KSxcclxuICAgICAga2V5SWQ6IG1haW5LbXNLZXkuYXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJBcHBsaWNhdGlvbiBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnNcIixcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2cgR3JvdXBzXHJcbiAgICBjb25zdCBhcHBMb2dHcm91cCA9IG5ldyBDbG91ZHdhdGNoTG9nR3JvdXAodGhpcywgXCJwcm9kLXNlYy1hcHAtbG9nc1wiLCB7XHJcbiAgICAgIG5hbWU6IFwiL2F3cy9lYzIvcHJvZC1zZWMtYXBwXCIsXHJcbiAgICAgIHJldGVudGlvbkluRGF5czogOTAsXHJcbiAgICAgIGttc0tleUlkOiBtYWluS21zS2V5LmFybixcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdnBjRmxvd0xvZ0dyb3VwID0gbmV3IENsb3Vkd2F0Y2hMb2dHcm91cCh0aGlzLCBcInByb2Qtc2VjLXZwYy1mbG93LWxvZ3NcIiwge1xyXG4gICAgICBuYW1lOiBcIi9hd3MvdnBjL3Byb2Qtc2VjLWZsb3dsb2dzXCIsXHJcbiAgICAgIHJldGVudGlvbkluRGF5czogMzAsXHJcbiAgICAgIGttc0tleUlkOiBtYWluS21zS2V5LmFybixcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU05TIFRvcGljIGZvciBhbGVydHNcclxuICAgIGNvbnN0IGFsZXJ0c1RvcGljID0gbmV3IFNuc1RvcGljKHRoaXMsIFwicHJvZC1zZWMtc2VjdXJpdHktYWxlcnRzXCIsIHtcclxuICAgICAgbmFtZTogXCJwcm9kLXNlYy1zZWN1cml0eS1hbGVydHNcIixcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2xvdWRXYXRjaCBBbGFybXNcclxuICAgIG5ldyBDbG91ZHdhdGNoTWV0cmljQWxhcm0odGhpcywgXCJwcm9kLXNlYy1yb290LWFjY2Vzcy1hbGFybVwiLCB7XHJcbiAgICAgIGFsYXJtTmFtZTogXCJwcm9kLXNlYy1yb290LWFjY2Vzcy1hbGFybVwiLFxyXG4gICAgICBjb21wYXJpc29uT3BlcmF0b3I6IFwiR3JlYXRlclRoYW5PckVxdWFsVG9UaHJlc2hvbGRcIixcclxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXHJcbiAgICAgIG1ldHJpY05hbWU6IFwiUm9vdEFjY2Vzc0NvdW50XCIsXHJcbiAgICAgIG5hbWVzcGFjZTogXCJDV0xvZ3NcIixcclxuICAgICAgcGVyaW9kOiAzMDAsXHJcbiAgICAgIHN0YXRpc3RpYzogXCJTdW1cIixcclxuICAgICAgdGhyZXNob2xkOiAxLFxyXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiBcIkFsZXJ0IHdoZW4gcm9vdCB1c2VyIGFjY2VzcyBpcyBkZXRlY3RlZFwiLFxyXG4gICAgICBhbGFybUFjdGlvbnM6IFthbGVydHNUb3BpYy5hcm5dLFxyXG4gICAgICB0YWdzOiBjb21tb25UYWdzXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgQ2xvdWR3YXRjaE1ldHJpY0FsYXJtKHRoaXMsIFwicHJvZC1zZWMtdW5hdXRob3JpemVkLWFwaS1jYWxsc1wiLCB7XHJcbiAgICAgIGFsYXJtTmFtZTogXCJwcm9kLXNlYy11bmF1dGhvcml6ZWQtYXBpLWNhbGxzXCIsXHJcbiAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogXCJHcmVhdGVyVGhhbk9yRXF1YWxUb1RocmVzaG9sZFwiLFxyXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcclxuICAgICAgbWV0cmljTmFtZTogXCJVbmF1dGhvcml6ZWRBUElDYWxsc1wiLFxyXG4gICAgICBuYW1lc3BhY2U6IFwiQ1dMb2dzXCIsXHJcbiAgICAgIHBlcmlvZDogMzAwLFxyXG4gICAgICBzdGF0aXN0aWM6IFwiU3VtXCIsXHJcbiAgICAgIHRocmVzaG9sZDogNSxcclxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogXCJBbGVydCBvbiB1bmF1dGhvcml6ZWQgQVBJIGNhbGxzXCIsXHJcbiAgICAgIGFsYXJtQWN0aW9uczogW2FsZXJ0c1RvcGljLmFybl0sXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3NcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENsb3VkVHJhaWwgLSBDT1JSRUNURUQgSW1wbGVtZW50YXRpb25cclxuICAgIGNvbnN0IGNsb3VkdHJhaWwgPSBuZXcgQ2xvdWR0cmFpbCh0aGlzLCBcInByb2Qtc2VjLWNsb3VkdHJhaWxcIiwge1xyXG4gICAgICBuYW1lOiBcInByb2Qtc2VjLWNsb3VkdHJhaWxcIixcclxuICAgICAgczNCdWNrZXROYW1lOiBsb2dzQnVja2V0LmlkLFxyXG4gICAgICBzM0tleVByZWZpeDogXCJjbG91ZHRyYWlsLWxvZ3MvXCIsXHJcbiAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiB0cnVlLFxyXG4gICAgICBpc011bHRpUmVnaW9uVHJhaWw6IHRydWUsXHJcbiAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXHJcbiAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiB0cnVlLFxyXG4gICAgICBrbXNLZXlJZDogbWFpbkttc0tleS5hcm4sXHJcbiAgICAgIHRhZ3M6IGNvbW1vblRhZ3NcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFXUyBDb25maWcgLSBDT1JSRUNURUQgZGVwZW5kZW5jaWVzXHJcbiAgICBjb25zdCBjb25maWdSb2xlID0gbmV3IElhbVJvbGUodGhpcywgXCJwcm9kLXNlYy1jb25maWctcm9sZVwiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtY29uZmlnLXJvbGVcIixcclxuICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxyXG4gICAgICAgIFN0YXRlbWVudDogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBBY3Rpb246IFwic3RzOkFzc3VtZVJvbGVcIixcclxuICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsIFxyXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgICBTZXJ2aWNlOiBcImNvbmZpZy5hbWF6b25hd3MuY29tXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgICAgfSksXHJcbiAgICAgIG1hbmFnZWRQb2xpY3lBcm5zOiBbXCJhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQ29uZmlnUm9sZVwiXSxcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgY29uZmlnQnVja2V0UG9saWN5ID0gbmV3IElhbVBvbGljeSh0aGlzLCBcInByb2Qtc2VjLWNvbmZpZy1idWNrZXQtcG9saWN5XCIsIHtcclxuICAgICAgbmFtZTogXCJwcm9kLXNlYy1jb25maWctYnVja2V0LXBvbGljeVwiLFxyXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBTdGF0ZW1lbnQ6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgIEFjdGlvbjogW1xyXG4gICAgICAgICAgICAgIFwiczM6R2V0QnVja2V0QWNsXCIsXHJcbiAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgUmVzb3VyY2U6IGxvZ3NCdWNrZXQuYXJuXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgQWN0aW9uOiBcInMzOlB1dE9iamVjdFwiLFxyXG4gICAgICAgICAgICBSZXNvdXJjZTogYCR7bG9nc0J1Y2tldC5hcm59L2NvbmZpZy1sb2dzLypgLFxyXG4gICAgICAgICAgICBDb25kaXRpb246IHtcclxuICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcclxuICAgICAgICAgICAgICAgIFwiczM6eC1hbXotYWNsXCI6IFwiYnVja2V0LW93bmVyLWZ1bGwtY29udHJvbFwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IElhbVJvbGVQb2xpY3lBdHRhY2htZW50KHRoaXMsIFwicHJvZC1zZWMtY29uZmlnLXJvbGUtYnVja2V0LXBvbGljeVwiLCB7XHJcbiAgICAgIHJvbGU6IGNvbmZpZ1JvbGUubmFtZSxcclxuICAgICAgcG9saWN5QXJuOiBjb25maWdCdWNrZXRQb2xpY3kuYXJuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBjb25maWdSZWNvcmRlciA9IG5ldyBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXIodGhpcywgXCJwcm9kLXNlYy1jb25maWctcmVjb3JkZXJcIiwge1xyXG4gICAgICBuYW1lOiBcInByb2Qtc2VjLWNvbmZpZy1yZWNvcmRlclwiLFxyXG4gICAgICByb2xlQXJuOiBjb25maWdSb2xlLmFybixcclxuICAgICAgcmVjb3JkaW5nR3JvdXA6IHtcclxuICAgICAgICBhbGxTdXBwb3J0ZWQ6IHRydWUsXHJcbiAgICAgICAgaW5jbHVkZUdsb2JhbFJlc291cmNlVHlwZXM6IHRydWVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRklYRUQ6IEFkZGVkIGRlcGVuZGVuY3kgZm9yIGRlbGl2ZXJ5IGNoYW5uZWxcclxuICAgIGNvbnN0IGNvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbCA9IG5ldyBDb25maWdEZWxpdmVyeUNoYW5uZWwodGhpcywgXCJwcm9kLXNlYy1jb25maWctZGVsaXZlcnktY2hhbm5lbFwiLCB7XHJcbiAgICAgIG5hbWU6IFwicHJvZC1zZWMtY29uZmlnLWRlbGl2ZXJ5LWNoYW5uZWxcIixcclxuICAgICAgczNCdWNrZXROYW1lOiBsb2dzQnVja2V0LmlkLFxyXG4gICAgICBzM0tleVByZWZpeDogXCJjb25maWctbG9ncy9cIixcclxuICAgICAgZGVwZW5kc09uOiBbY29uZmlnUmVjb3JkZXJdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDb25maWcgUnVsZXNcclxuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsIFwicHJvZC1zZWMtczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtcHJvaGliaXRlZFwiLCB7XHJcbiAgICAgIG5hbWU6IFwiczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtcHJvaGliaXRlZFwiLFxyXG4gICAgICBzb3VyY2U6IHtcclxuICAgICAgICBvd25lcjogXCJBV1NcIixcclxuICAgICAgICBzb3VyY2VJZGVudGlmaWVyOiBcIlMzX0JVQ0tFVF9QVUJMSUNfQUNDRVNTX1BST0hJQklURURcIlxyXG4gICAgICB9LFxyXG4gICAgICBkZXBlbmRzT246IFtjb25maWdSZWNvcmRlcl1cclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsIFwicHJvZC1zZWMtZW5jcnlwdGVkLXZvbHVtZXNcIiwge1xyXG4gICAgICBuYW1lOiBcImVuY3J5cHRlZC12b2x1bWVzXCIsXHJcbiAgICAgIHNvdXJjZToge1xyXG4gICAgICAgIG93bmVyOiBcIkFXU1wiLFxyXG4gICAgICAgIHNvdXJjZUlkZW50aWZpZXI6IFwiRU5DUllQVEVEX1ZPTFVNRVNcIlxyXG4gICAgICB9LFxyXG4gICAgICBkZXBlbmRzT246IFtjb25maWdSZWNvcmRlcl1cclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBDb25maWdDb25maWdSdWxlKHRoaXMsIFwicHJvZC1zZWMtaWFtLXBhc3N3b3JkLXBvbGljeVwiLCB7XHJcbiAgICAgIG5hbWU6IFwiaWFtLXBhc3N3b3JkLXBvbGljeVwiLFxyXG4gICAgICBzb3VyY2U6IHtcclxuICAgICAgICBvd25lcjogXCJBV1NcIixcclxuICAgICAgICBzb3VyY2VJZGVudGlmaWVyOiBcIklBTV9QQVNTV09SRF9QT0xJQ1lcIlxyXG4gICAgICB9LFxyXG4gICAgICBpbnB1dFBhcmFtZXRlcnM6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBSZXF1aXJlVXBwZXJjYXNlQ2hhcmFjdGVyczogXCJ0cnVlXCIsXHJcbiAgICAgICAgUmVxdWlyZUxvd2VyY2FzZUNoYXJhY3RlcnM6IFwidHJ1ZVwiLFxyXG4gICAgICAgIFJlcXVpcmVTeW1ib2xzOiBcInRydWVcIixcclxuICAgICAgICBSZXF1aXJlTnVtYmVyczogXCJ0cnVlXCIsXHJcbiAgICAgICAgTWluaW11bVBhc3N3b3JkTGVuZ3RoOiBcIjE0XCJcclxuICAgICAgfSksXHJcbiAgICAgIGRlcGVuZHNPbjogW2NvbmZpZ1JlY29yZGVyXVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR3VhcmREdXR5IC0gRU5IQU5DRUQgd2l0aCBTMyBwcm90ZWN0aW9uXHJcbiAgICBuZXcgR3VhcmRkdXR5RGV0ZWN0b3IodGhpcywgXCJwcm9kLXNlYy1ndWFyZGR1dHlcIiwge1xyXG4gICAgICBlbmFibGU6IHRydWUsXHJcbiAgICAgIGZpbmRpbmdQdWJsaXNoaW5nRnJlcXVlbmN5OiBcIkZJRlRFRU5fTUlOVVRFU1wiLFxyXG4gICAgICBkYXRhc291cmNlczoge1xyXG4gICAgICAgIHMzTG9nczoge1xyXG4gICAgICAgICAgZW5hYmxlOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBrdWJlcm5ldGVzOiB7XHJcbiAgICAgICAgICBhdWRpdExvZ3M6IHtcclxuICAgICAgICAgICAgZW5hYmxlOiB0cnVlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBtYWx3YXJlUHJvdGVjdGlvbjoge1xyXG4gICAgICAgICAgc2NhbkVjMkluc3RhbmNlV2l0aEZpbmRpbmdzOiB7XHJcbiAgICAgICAgICAgIGVic1ZvbHVtZXM6IHtcclxuICAgICAgICAgICAgICBlbmFibGU6IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgdGFnczogY29tbW9uVGFnc1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCBcInZwY19pZFwiLCB7XHJcbiAgICAgIHZhbHVlOiB2cGMuaWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlZQQyBJRFwiXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsIFwicHVibGljX3N1Ym5ldF9pZHNcIiwge1xyXG4gICAgICB2YWx1ZTogW3B1YmxpY1N1Ym5ldDEuaWQsIHB1YmxpY1N1Ym5ldDIuaWRdLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJQdWJsaWMgc3VibmV0IElEc1wiXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsIFwicHJpdmF0ZV9zdWJuZXRfaWRzXCIsIHtcclxuICAgICAgdmFsdWU6IFtwcml2YXRlU3VibmV0MS5pZCwgcHJpdmF0ZVN1Ym5ldDIuaWRdLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJQcml2YXRlIHN1Ym5ldCBJRHNcIlxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IFRlcnJhZm9ybU91dHB1dCh0aGlzLCBcImttc19rZXlfaWRcIiwge1xyXG4gICAgICB2YWx1ZTogbWFpbkttc0tleS5rZXlJZCxcclxuICAgICAgZGVzY3JpcHRpb246IFwiTWFpbiBLTVMga2V5IElEXCJcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgXCJzZWN1cml0eV9ncm91cF9pZHNcIiwge1xyXG4gICAgICB2YWx1ZToge1xyXG4gICAgICAgIHdlYjogd2ViU2VjdXJpdHlHcm91cC5pZCxcclxuICAgICAgICBhcHA6IGFwcFNlY3VyaXR5R3JvdXAuaWQsXHJcbiAgICAgICAgZGI6IGRiU2VjdXJpdHlHcm91cC5pZFxyXG4gICAgICB9LFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJTZWN1cml0eSBncm91cCBJRHMgYnkgdGllclwiXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgVGVycmFmb3JtT3V0cHV0KHRoaXMsIFwiY2xvdWR0cmFpbF9uYW1lXCIsIHtcclxuICAgICAgdmFsdWU6IGNsb3VkdHJhaWwubmFtZSxcclxuICAgICAgZGVzY3JpcHRpb246IFwiQ2xvdWRUcmFpbCBuYW1lXCJcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBUZXJyYWZvcm1PdXRwdXQodGhpcywgXCJsb2dzX2J1Y2tldF9uYW1lXCIsIHtcclxuICAgICAgdmFsdWU6IGxvZ3NCdWNrZXQuYnVja2V0LFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJMb2dzIFMzIGJ1Y2tldCBuYW1lXCJcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLy8gQ09SUkVDVEVEOiBBcHBsaWNhdGlvbiBib290c3RyYXAgd2l0aCBwcm9wZXIgc3RydWN0dXJlXHJcbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcclxubmV3IFNlY3VyZUVudGVycHJpc2VTdGFjayhhcHAsIFwicHJvZC1zZWNcIik7XHJcbmFwcC5zeW50aCgpO1xyXG4iXX0=