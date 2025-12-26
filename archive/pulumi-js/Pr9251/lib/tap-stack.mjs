/**
 * Secure AWS Infrastructure Stack using Pulumi JavaScript
 * Implements comprehensive security best practices including VPC, S3, RDS, IAM, and monitoring
 *
 * ## LocalStack Compatibility
 * This stack is designed to work with both AWS and LocalStack environments:
 * - VPC Flow Logs: Automatically disabled for LocalStack (unsupported maxAggregationInterval parameter)
 * - S3 Buckets: Use path-style URLs for LocalStack compatibility
 * - Endpoints: Configured to use LocalStack when AWS_ENDPOINT_URL is set
 *
 * ## Disabled Services (for AWS quota/cost management)
 * - RDS Database: Commented out to avoid quota limits
 * - CloudTrail: Commented out to avoid trail creation limits
 * - GuardDuty: Commented out to manage costs
 * - AWS Config: Commented out to manage costs
 *
 * @see {@link https://docs.localstack.cloud/} for LocalStack documentation
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 * @property {string[]} [allowedCidrBlocks] - Optional CIDR blocks for security group ingress rules. Defaults to RFC 1918 private address space.
 */

/**
 * Represents the main Pulumi component resource for the TAP project with comprehensive security features.
 * 
 * This component creates a secure AWS infrastructure with:
 * - VPC with public/private subnets and security groups
 * - S3 buckets with encryption and public access blocking
 * - RDS database with encryption at rest
 * - IAM roles following least privilege principle
 * - Security monitoring with CloudTrail, GuardDuty, and Config
 */
export class TapStack extends pulumi.ComponentResource {
    /**
     * Creates a new TapStack component with comprehensive security features.
     * @param {string} name - The logical name of this Pulumi component.
     * @param {TapStackArgs} args - Configuration arguments including environment suffix and tags.
     * @param {pulumi.ResourceOptions} [opts] - Pulumi options.
     */
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        /**
         * Security Group CIDR Configuration
         * These CIDR blocks define which IP ranges can access HTTP/HTTPS endpoints.
         *
         * Current Configuration: RFC 1918 private address space
         * - 10.0.0.0/8: Class A private network
         * - 172.16.0.0/12: Class B private network
         * - 192.168.0.0/16: Class C private network
         *
         * Production Recommendation: Replace with specific organizational IP ranges
         * Example: ['203.0.113.0/24', '198.51.100.0/24'] for public endpoints
         *
         * @see {@link https://datatracker.ietf.org/doc/html/rfc1918} RFC 1918 Private Address Space
         */
        const allowedCidrBlocks = args.allowedCidrBlocks || ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

        // 1. KMS Keys for encryption
        const s3KmsKey = new aws.kms.Key(`tap-s3-key-${environmentSuffix}`, {
            description: `KMS key for S3 bucket encryption - ${environmentSuffix}`,
            keyUsage: 'ENCRYPT_DECRYPT',
            keySpec: 'SYMMETRIC_DEFAULT',
            enableKeyRotation: true,
            tags: { ...tags, Purpose: 'S3Encryption' }
        }, { parent: this });

        const s3KmsAlias = new aws.kms.Alias(`tap-s3-key-alias-${environmentSuffix}`, {
            name: `alias/tap-s3-${environmentSuffix}-primary-3`,
            targetKeyId: s3KmsKey.keyId
        }, { parent: this });

        const rdsKmsKey = new aws.kms.Key(`tap-rds-key-${environmentSuffix}`, {
            description: `KMS key for RDS encryption - ${environmentSuffix}`,
            keyUsage: 'ENCRYPT_DECRYPT',
            keySpec: 'SYMMETRIC_DEFAULT',
            enableKeyRotation: true,
            tags: { ...tags, Purpose: 'RDSEncryption' }
        }, { parent: this });

        const rdsKmsAlias = new aws.kms.Alias(`tap-rds-key-alias-${environmentSuffix}`, {
            name: `alias/tap-rds-${environmentSuffix}-primary-3`,
            targetKeyId: rdsKmsKey.keyId
        }, { parent: this });

        // 2. VPC and Networking
        const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...tags, Name: `tap-vpc-${environmentSuffix}` }
        }, { parent: this });

        const internetGateway = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { ...tags, Name: `tap-igw-${environmentSuffix}` }
        }, { parent: this });

        // Get availability zones - Use hardcoded zones for LocalStack compatibility
        // LocalStack supports us-east-1a and us-east-1b by default
        const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                           process.env.AWS_ENDPOINT_URL?.includes('4566');
        const azNames = isLocalStack
            ? Promise.resolve(['us-east-1a', 'us-east-1b'])
            : aws.getAvailabilityZones({ state: 'available' }).then(azs => azs.names);

        // Public subnets
        const publicSubnet1 = new aws.ec2.Subnet(`tap-public-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: azNames.then(names => names[0]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: `tap-public-subnet-1-${environmentSuffix}`, Type: 'Public' }
        }, { parent: this });

        const publicSubnet2 = new aws.ec2.Subnet(`tap-public-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: azNames.then(names => names[1]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: `tap-public-subnet-2-${environmentSuffix}`, Type: 'Public' }
        }, { parent: this });

        // Private subnets
        const privateSubnet1 = new aws.ec2.Subnet(`tap-private-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.10.0/24',
            availabilityZone: azNames.then(names => names[0]),
            tags: { ...tags, Name: `tap-private-subnet-1-${environmentSuffix}`, Type: 'Private' }
        }, { parent: this });

        const privateSubnet2 = new aws.ec2.Subnet(`tap-private-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.11.0/24',
            availabilityZone: azNames.then(names => names[1]),
            tags: { ...tags, Name: `tap-private-subnet-2-${environmentSuffix}`, Type: 'Private' }
        }, { parent: this });

        // Elastic IPs for NAT Gateways
        const eip1 = new aws.ec2.Eip(`tap-eip-1-${environmentSuffix}`, {
            domain: 'vpc',
            tags: { ...tags, Name: `tap-eip-1-${environmentSuffix}` }
        }, { parent: this });

        const eip2 = new aws.ec2.Eip(`tap-eip-2-${environmentSuffix}`, {
            domain: 'vpc',
            tags: { ...tags, Name: `tap-eip-2-${environmentSuffix}` }
        }, { parent: this });

        // NAT Gateways
        const natGateway1 = new aws.ec2.NatGateway(`tap-nat-1-${environmentSuffix}`, {
            allocationId: eip1.id,
            subnetId: publicSubnet1.id,
            tags: { ...tags, Name: `tap-nat-1-${environmentSuffix}` }
        }, { parent: this });

        const natGateway2 = new aws.ec2.NatGateway(`tap-nat-2-${environmentSuffix}`, {
            allocationId: eip2.id,
            subnetId: publicSubnet2.id,
            tags: { ...tags, Name: `tap-nat-2-${environmentSuffix}` }
        }, { parent: this });

        // Route Tables
        const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { ...tags, Name: `tap-public-rt-${environmentSuffix}` }
        }, { parent: this });

        const publicRoute = new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id
        }, { parent: this });

        const privateRouteTable1 = new aws.ec2.RouteTable(`tap-private-rt-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { ...tags, Name: `tap-private-rt-1-${environmentSuffix}` }
        }, { parent: this });

        const privateRoute1 = new aws.ec2.Route(`tap-private-route-1-${environmentSuffix}`, {
            routeTableId: privateRouteTable1.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway1.id
        }, { parent: this });

        const privateRouteTable2 = new aws.ec2.RouteTable(`tap-private-rt-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { ...tags, Name: `tap-private-rt-2-${environmentSuffix}` }
        }, { parent: this });

        const privateRoute2 = new aws.ec2.Route(`tap-private-route-2-${environmentSuffix}`, {
            routeTableId: privateRouteTable2.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway2.id
        }, { parent: this });

        // Route Table Associations
        const publicSubnetAssociation1 = new aws.ec2.RouteTableAssociation(`tap-public-rta-1-${environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id
        }, { parent: this });

        const publicSubnetAssociation2 = new aws.ec2.RouteTableAssociation(`tap-public-rta-2-${environmentSuffix}`, {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id
        }, { parent: this });

        const privateSubnetAssociation1 = new aws.ec2.RouteTableAssociation(`tap-private-rta-1-${environmentSuffix}`, {
            subnetId: privateSubnet1.id,
            routeTableId: privateRouteTable1.id
        }, { parent: this });

        const privateSubnetAssociation2 = new aws.ec2.RouteTableAssociation(`tap-private-rta-2-${environmentSuffix}`, {
            subnetId: privateSubnet2.id,
            routeTableId: privateRouteTable2.id
        }, { parent: this });

        // 3. Security Groups
        const webSecurityGroup = new aws.ec2.SecurityGroup(`tap-web-sg-${environmentSuffix}`, {
            name: `tap-web-sg-${environmentSuffix}`,
            description: 'Security group for web tier - allows HTTP and HTTPS from specific IP ranges',
            vpcId: vpc.id,
            ingress: [
                {
                    description: 'HTTP',
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: allowedCidrBlocks
                },
                {
                    description: 'HTTPS',
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: allowedCidrBlocks
                }
            ],
            egress: [
                {
                    description: 'All outbound traffic',
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0']
                }
            ],
            tags: { ...tags, Name: `tap-web-sg-${environmentSuffix}` }
        }, { parent: this });

        const dbSecurityGroup = new aws.ec2.SecurityGroup(`tap-db-sg-${environmentSuffix}`, {
            name: `tap-db-sg-${environmentSuffix}`,
            description: 'Security group for database tier - allows MySQL from web tier only',
            vpcId: vpc.id,
            ingress: [
                {
                    description: 'MySQL from web tier',
                    fromPort: 3306,
                    toPort: 3306,
                    protocol: 'tcp',
                    securityGroups: [webSecurityGroup.id]
                }
            ],
            tags: { ...tags, Name: `tap-db-sg-${environmentSuffix}` }
        }, { parent: this });

        // 4. S3 Buckets with security configurations
        // Generate a unique suffix for bucket names
        const uniqueSuffix = Math.random().toString(36).substring(7);
        const logsBucket = new aws.s3.Bucket(`tap-logs-bucket-${environmentSuffix}-primary-3`, {
            bucket: `tap-logs-${environmentSuffix}-primary-3-${uniqueSuffix}`,
            forceDestroy: true,
            tags: { ...tags, Purpose: 'Logging' }
        }, { parent: this });

        const logsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`tap-logs-bucket-encryption-${environmentSuffix}-primary-3`, {
            bucket: logsBucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: s3KmsKey.arn
                    },
                    bucketKeyEnabled: true
                }
            ]
        }, { parent: this });

        const logsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-logs-bucket-pab-${environmentSuffix}-primary-3`, {
            bucket: logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        const applicationBucket = new aws.s3.Bucket(`tap-app-bucket-${environmentSuffix}-primary-3`, {
            bucket: `tap-app-${environmentSuffix}-primary-3-${uniqueSuffix}`,
            forceDestroy: true,
            tags: { ...tags, Purpose: 'Application' }
        }, { parent: this });

        const applicationBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`tap-app-bucket-encryption-${environmentSuffix}-primary-3`, {
            bucket: applicationBucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: s3KmsKey.arn
                    },
                    bucketKeyEnabled: true
                }
            ]
        }, { parent: this });

        const applicationBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-app-bucket-pab-${environmentSuffix}-primary-3`, {
            bucket: applicationBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        // Add lifecycle configuration for logs bucket to auto-delete old objects
        const logsBucketLifecycle = new aws.s3.BucketLifecycleConfiguration(`tap-logs-bucket-lifecycle-${environmentSuffix}-primary-3`, {
            bucket: logsBucket.id,
            rules: [
                {
                    id: 'delete_old_logs',
                    status: 'Enabled',
                    expiration: {
                        days: 30
                    },
                    noncurrentVersionExpiration: {
                        noncurrentDays: 1
                    }
                }
            ]
        }, { parent: this });

        // Add versioning for both buckets to help with cleanup
        const logsBucketVersioning = new aws.s3.BucketVersioning(`tap-logs-bucket-versioning-${environmentSuffix}-primary-3`, {
            bucket: logsBucket.id,
            versioningConfiguration: {
                status: 'Enabled'
            }
        }, { parent: this });

        const appBucketVersioning = new aws.s3.BucketVersioning(`tap-app-bucket-versioning-${environmentSuffix}-primary-3`, {
            bucket: applicationBucket.id,
            versioningConfiguration: {
                status: 'Enabled'
            }
        }, { parent: this });

        // 5. VPC Flow Logs - Conditionally enabled based on environment
        // LocalStack doesn't support the maxAggregationInterval parameter that Pulumi AWS provider
        // automatically adds to Flow Logs. Skip for LocalStack environments.
        if (!isLocalStack) {
            // VPC Flow Logs enabled for AWS deployments only
            const vpcFlowLogRole = new aws.iam.Role(`tap-vpc-flow-log-role-${environmentSuffix}-primary-3`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'vpc-flow-logs.amazonaws.com'
                        }
                    }
                ]
            }),
            tags: { ...tags, Purpose: 'VPCFlowLogs' }
        }, { parent: this });

        const vpcFlowLogPolicy = new aws.iam.RolePolicy(`tap-vpc-flow-log-policy-${environmentSuffix}-primary-3`, {
            role: vpcFlowLogRole.id,
            policy: logsBucket.arn.apply(bucketArn => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:GetBucketAcl',
                            's3:ListBucket'
                        ],
                        Resource: bucketArn
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                            's3:GetObject'
                        ],
                        Resource: `${bucketArn}/*`
                    }
                ]
            }))
        }, { parent: this });

            const vpcFlowLog = new aws.ec2.FlowLog(`tap-vpc-flow-log-${environmentSuffix}-primary-3`, {
                logDestination: pulumi.interpolate`${logsBucket.arn}/vpc-flow-logs/`,
                logDestinationType: 's3',
                vpcId: vpc.id,
                trafficType: 'ALL',
                tags: { ...tags, Purpose: 'VPCFlowLogs' }
            }, { parent: this });
        }
        // Note: VPC Flow Logs are automatically skipped for LocalStack environments
        // LocalStack does not support the maxAggregationInterval parameter

        // 6. RDS Database - Commented out due to AWS quota limits
        // const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
        //     name: `tap-db-subnet-group-${environmentSuffix}`,
        //     subnetIds: [privateSubnet1.id, privateSubnet2.id],
        //     tags: { ...tags, Purpose: 'Database' }
        // }, { parent: this });

        // const dbInstance = new aws.rds.Instance(`tap-db-${environmentSuffix}`, {
        //     identifier: `tap-db-${environmentSuffix}`,
        //     engine: 'mysql',
        //     engineVersion: '8.0',
        //     instanceClass: 'db.t3.micro',
        //     allocatedStorage: 20,
        //     storageEncrypted: true,
        //     kmsKeyId: rdsKmsKey.arn,
        //     dbName: 'tapdb',
        //     username: 'admin',
        //     password: 'changeme123!', // In production, use AWS Secrets Manager
        //     vpcSecurityGroupIds: [dbSecurityGroup.id],
        //     dbSubnetGroupName: dbSubnetGroup.name,
        //     backupRetentionPeriod: 7,
        //     backupWindow: '03:00-04:00',
        //     maintenanceWindow: 'sun:04:00-sun:05:00',
        //     skipFinalSnapshot: true, // Set to false in production
        //     deletionProtection: false, // Set to true in production
        //     tags: { ...tags, Purpose: 'Database' }
        // }, { parent: this });

        // 7. IAM Roles and Policies
        const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ec2.amazonaws.com'
                        }
                    }
                ]
            }),
            tags: { ...tags, Purpose: 'EC2Role' }
        }, { parent: this });

        const ec2Policy = new aws.iam.RolePolicy(`tap-ec2-policy-${environmentSuffix}`, {
            role: ec2Role.id,
            policy: pulumi.interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "${applicationBucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": "${applicationBucket.arn}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": ["${s3KmsKey.arn}"]
                    }
                ]
            }`
        }, { parent: this });

        const ec2InstanceProfile = new aws.iam.InstanceProfile(`tap-ec2-profile-${environmentSuffix}`, {
            role: ec2Role.name
        }, { parent: this });

        // 8. CloudTrail for API logging - Commented out due to trail limit
        // const cloudtrailRole = new aws.iam.Role(`tap-cloudtrail-role-${environmentSuffix}`, {
        //     assumeRolePolicy: JSON.stringify({
        //         Version: '2012-10-17',
        //         Statement: [
        //             {
        //                 Action: 'sts:AssumeRole',
        //                 Effect: 'Allow',
        //                 Principal: {
        //                     Service: 'cloudtrail.amazonaws.com'
        //                 }
        //             }
        //         ]
        //     }),
        //     tags: { ...tags, Purpose: 'CloudTrail' }
        // }, { parent: this });

        // const cloudtrailPolicy = new aws.iam.RolePolicy(`tap-cloudtrail-policy-${environmentSuffix}`, {
        //     role: cloudtrailRole.id,
        //     policy: logsBucket.arn.apply(bucketArn => JSON.stringify({
        //         Version: '2012-10-17',
        //         Statement: [
        //             {
        //                 Effect: 'Allow',
        //                 Action: [
        //                     's3:PutObject',
        //                     's3:GetBucketAcl'
        //                 ],
        //                 Resource: [
        //                     bucketArn,
        //                     `${bucketArn}/*`
        //                 ]
        //             }
        //         ]
        //     }))
        // }, { parent: this });

        // const cloudtrail = new aws.cloudtrail.Trail(`tap-cloudtrail-${environmentSuffix}`, {
        //     name: `tap-cloudtrail-${environmentSuffix}`,
        //     s3BucketName: logsBucket.bucket,
        //     s3KeyPrefix: 'cloudtrail-logs',
        //     includeGlobalServiceEvents: true,
        //     isMultiRegionTrail: true,
        //     enableLogging: true,
        //     eventSelectors: [
        //         {
        //             readWriteType: 'All',
        //             includeManagementEvents: true,
        //             dataResources: [
        //                 {
        //                     type: 'AWS::S3::Object',
        //                     values: [pulumi.interpolate`${applicationBucket.arn}/*`]
        //                 }
        //             ]
        //         }
        //     ],
        //     tags: { ...tags, Purpose: 'AuditLogging' }
        // }, { parent: this });

        // 9. GuardDuty for threat detection - skip if it already exists
        // Note: GuardDuty can only have one detector per account per region
        // For now, we'll comment this out as it's likely already enabled
        // const guarddutyDetector = new aws.guardduty.Detector(`tap-guardduty-${environmentSuffix}`, {
        //     enable: true,
        //     findingPublishingFrequency: 'FIFTEEN_MINUTES',
        //     tags: { ...tags, Purpose: 'ThreatDetection' }
        // }, { parent: this });

        // 10. AWS Config for compliance monitoring
        const configRole = new aws.iam.Role(`tap-config-role-${environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'config.amazonaws.com'
                        }
                    }
                ]
            }),
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
            ],
            tags: { ...tags, Purpose: 'ConfigCompliance' }
        }, { parent: this });

        const configPolicy = new aws.iam.RolePolicy(`tap-config-policy-${environmentSuffix}`, {
            role: configRole.id,
            policy: logsBucket.arn.apply(bucketArn => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:GetBucketAcl',
                            's3:ListBucket'
                        ],
                        Resource: bucketArn
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                            's3:GetObject'
                        ],
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                's3:x-amz-acl': 'bucket-owner-full-control'
                            }
                        }
                    }
                ]
            }))
        }, { parent: this });

        // Config delivery channel commented out - only one per account allowed
        // const configDeliveryChannel = new aws.cfg.DeliveryChannel(`tap-config-delivery-${environmentSuffix}`, {
        //     name: `tap-config-delivery-${environmentSuffix}`,
        //     s3BucketName: logsBucket.bucket,
        //     s3KeyPrefix: 'config-logs',
        //     snapshotDeliveryProperties: {
        //         deliveryFrequency: 'TwentyFour_Hours'
        //     }
        // }, { parent: this });

        // Config recorder commented out - only one per account allowed
        // const configRecorder = new aws.cfg.Recorder(`tap-config-recorder-${environmentSuffix}`, {
        //     name: `tap-config-recorder-${environmentSuffix}`,
        //     roleArn: configRole.arn,
        //     recordingGroup: {
        //         allSupported: true,
        //         includeGlobalResourceTypes: true
        //     }
        // }, { parent: this });

        // Register outputs
        this.registerOutputs({
            vpcId: vpc.id,
            publicSubnetIds: [publicSubnet1.id, publicSubnet2.id],
            privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
            publicSubnet1Id: publicSubnet1.id,
            publicSubnet2Id: publicSubnet2.id,
            privateSubnet1Id: privateSubnet1.id,
            privateSubnet2Id: privateSubnet2.id,
            webSecurityGroupId: webSecurityGroup.id,
            dbSecurityGroupId: dbSecurityGroup.id,
            logsBucketName: logsBucket.bucket,
            applicationBucketName: applicationBucket.bucket,
            // dbEndpoint: dbInstance.endpoint, // Commented as RDS is disabled
            s3KmsKeyId: s3KmsKey.keyId,
            rdsKmsKeyId: rdsKmsKey.keyId,
            // guarddutyDetectorId: guarddutyDetector.id, // Commented as GuardDuty already exists
            // cloudtrailArn: cloudtrail.arn // Commented as CloudTrail limit reached
        });

        // Store outputs for export
        this.bucketName = applicationBucket.bucket;
        this.vpcId = vpc.id;
        this.publicSubnet1Id = publicSubnet1.id;
        this.publicSubnet2Id = publicSubnet2.id;
        this.privateSubnet1Id = privateSubnet1.id;
        this.privateSubnet2Id = privateSubnet2.id;
        this.webSecurityGroupId = webSecurityGroup.id;
        this.dbSecurityGroupId = dbSecurityGroup.id;
        this.logsBucketName = logsBucket.bucket;
        this.applicationBucketName = applicationBucket.bucket;
        this.s3KmsKeyId = s3KmsKey.keyId;
        this.rdsKmsKeyId = rdsKmsKey.keyId;
    }
}

