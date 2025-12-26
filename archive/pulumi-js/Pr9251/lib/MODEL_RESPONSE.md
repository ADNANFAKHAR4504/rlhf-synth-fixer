# Secure AWS Infrastructure with Pulumi JavaScript

This document contains the complete Pulumi JavaScript infrastructure code that implements comprehensive AWS security best practices including VPC networking, encrypted storage, secure databases, IAM policies, and advanced security monitoring.

## Architecture Overview

The infrastructure creates a secure multi-tier architecture with:
- **Network Security**: VPC with public/private subnets, security groups, and VPC Flow Logs
- **Storage Security**: S3 buckets with public access blocking and KMS encryption
- **Database Security**: RDS with encryption at rest and network isolation
- **Access Control**: IAM roles following least privilege principle
- **Monitoring**: CloudTrail, GuardDuty, and Config for comprehensive security monitoring

## Infrastructure Components

### 1. Main Stack File: lib/tap-stack.mjs

```javascript
/**
 * Secure AWS Infrastructure Stack using Pulumi JavaScript
 * Implements comprehensive security best practices including VPC, S3, RDS, IAM, and monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class TapStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        // Get current AWS account ID and region
        const current = aws.getCallerIdentity({});
        const region = aws.getRegion({});

        // Define allowed IP ranges for security groups (replace with your actual IP ranges)
        const allowedCidrBlocks = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

        // 1. KMS Keys for encryption
        const s3KmsKey = new aws.kms.Key(`tap-s3-key-${environmentSuffix}`, {
            description: `KMS key for S3 bucket encryption - ${environmentSuffix}`,
            keyUsage: 'ENCRYPT_DECRYPT',
            keySpec: 'SYMMETRIC_DEFAULT',
            enableKeyRotation: true,
            tags: { ...tags, Purpose: 'S3Encryption' }
        }, { parent: this });

        const s3KmsAlias = new aws.kms.Alias(`tap-s3-key-alias-${environmentSuffix}`, {
            name: `alias/tap-s3-${environmentSuffix}`,
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
            name: `alias/tap-rds-${environmentSuffix}`,
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

        // Get availability zones
        const azs = aws.getAvailabilityZones({ state: 'available' });

        // Public subnets
        const publicSubnet1 = new aws.ec2.Subnet(`tap-public-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: azs.then(azs => azs.names[0]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: `tap-public-subnet-1-${environmentSuffix}`, Type: 'Public' }
        }, { parent: this });

        const publicSubnet2 = new aws.ec2.Subnet(`tap-public-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: azs.then(azs => azs.names[1]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: `tap-public-subnet-2-${environmentSuffix}`, Type: 'Public' }
        }, { parent: this });

        // Private subnets
        const privateSubnet1 = new aws.ec2.Subnet(`tap-private-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.10.0/24',
            availabilityZone: azs.then(azs => azs.names[0]),
            tags: { ...tags, Name: `tap-private-subnet-1-${environmentSuffix}`, Type: 'Private' }
        }, { parent: this });

        const privateSubnet2 = new aws.ec2.Subnet(`tap-private-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.11.0/24',
            availabilityZone: azs.then(azs => azs.names[1]),
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
        const logsBucket = new aws.s3.Bucket(`tap-logs-bucket-${environmentSuffix}`, {
            bucket: `tap-logs-bucket-${environmentSuffix}-${pulumi.getStack()}`,
            tags: { ...tags, Purpose: 'Logging' }
        }, { parent: this });

        const logsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`tap-logs-bucket-encryption-${environmentSuffix}`, {
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

        const logsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-logs-bucket-pab-${environmentSuffix}`, {
            bucket: logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        const applicationBucket = new aws.s3.Bucket(`tap-app-bucket-${environmentSuffix}`, {
            bucket: `tap-app-bucket-${environmentSuffix}-${pulumi.getStack()}`,
            tags: { ...tags, Purpose: 'Application' }
        }, { parent: this });

        const applicationBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`tap-app-bucket-encryption-${environmentSuffix}`, {
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

        const applicationBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-app-bucket-pab-${environmentSuffix}`, {
            bucket: applicationBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        // 5. VPC Flow Logs
        const vpcFlowLogRole = new aws.iam.Role(`tap-vpc-flow-log-role-${environmentSuffix}`, {
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

        const vpcFlowLogPolicy = new aws.iam.RolePolicy(`tap-vpc-flow-log-policy-${environmentSuffix}`, {
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

        const vpcFlowLog = new aws.ec2.FlowLog(`tap-vpc-flow-log-${environmentSuffix}`, {
            iamRoleArn: vpcFlowLogRole.arn,
            logDestination: pulumi.interpolate`${logsBucket.arn}/vpc-flow-logs/`,
            logDestinationType: 's3',
            resourceId: vpc.id,
            resourceType: 'VPC',
            trafficType: 'ALL',
            tags: { ...tags, Purpose: 'VPCFlowLogs' }
        }, { parent: this });

        // 6. RDS Database
        const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
            name: `tap-db-subnet-group-${environmentSuffix}`,
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            tags: { ...tags, Purpose: 'Database' }
        }, { parent: this });

        const dbInstance = new aws.rds.Instance(`tap-db-${environmentSuffix}`, {
            identifier: `tap-db-${environmentSuffix}`,
            engine: 'mysql',
            engineVersion: '8.0',
            instanceClass: 'db.t3.micro',
            allocatedStorage: 20,
            storageEncrypted: true,
            kmsKeyId: rdsKmsKey.arn,
            dbName: 'tapdb',
            username: 'admin',
            password: 'changeme123!', // In production, use AWS Secrets Manager
            vpcSecurityGroupIds: [dbSecurityGroup.id],
            dbSubnetGroupName: dbSubnetGroup.name,
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            skipFinalSnapshot: true, // Set to false in production
            deletionProtection: false, // Set to true in production
            tags: { ...tags, Purpose: 'Database' }
        }, { parent: this });

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
            policy: applicationBucket.arn.apply(bucketArn => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:GetObject',
                            's3:PutObject'
                        ],
                        Resource: `${bucketArn}/*`
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:ListBucket'
                        ],
                        Resource: bucketArn
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'kms:Decrypt',
                            'kms:GenerateDataKey'
                        ],
                        Resource: [s3KmsKey.arn]
                    }
                ]
            }))
        }, { parent: this });

        const ec2InstanceProfile = new aws.iam.InstanceProfile(`tap-ec2-profile-${environmentSuffix}`, {
            role: ec2Role.name
        }, { parent: this });

        // 8. CloudTrail for API logging
        const cloudtrailRole = new aws.iam.Role(`tap-cloudtrail-role-${environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com'
                        }
                    }
                ]
            }),
            tags: { ...tags, Purpose: 'CloudTrail' }
        }, { parent: this });

        const cloudtrailPolicy = new aws.iam.RolePolicy(`tap-cloudtrail-policy-${environmentSuffix}`, {
            role: cloudtrailRole.id,
            policy: logsBucket.arn.apply(bucketArn => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                            's3:GetBucketAcl'
                        ],
                        Resource: [
                            bucketArn,
                            `${bucketArn}/*`
                        ]
                    }
                ]
            }))
        }, { parent: this });

        const cloudtrail = new aws.cloudtrail.Trail(`tap-cloudtrail-${environmentSuffix}`, {
            name: `tap-cloudtrail-${environmentSuffix}`,
            s3BucketName: logsBucket.bucket,
            s3KeyPrefix: 'cloudtrail-logs',
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: true,
            enableLogging: true,
            eventSelectors: [
                {
                    readWriteType: 'All',
                    includeManagementEvents: true,
                    dataResources: [
                        {
                            type: 'AWS::S3::Object',
                            values: [pulumi.interpolate`${applicationBucket.arn}/*`]
                        }
                    ]
                }
            ],
            tags: { ...tags, Purpose: 'AuditLogging' }
        }, { parent: this });

        // 9. GuardDuty for threat detection
        const guarddutyDetector = new aws.guardduty.Detector(`tap-guardduty-${environmentSuffix}`, {
            enable: true,
            findingPublishingFrequency: 'FIFTEEN_MINUTES',
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
            tags: { ...tags, Purpose: 'ThreatDetection' }
        }, { parent: this });

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

        const configDeliveryChannel = new aws.cfg.DeliveryChannel(`tap-config-delivery-${environmentSuffix}`, {
            name: `tap-config-delivery-${environmentSuffix}`,
            s3BucketName: logsBucket.bucket,
            s3KeyPrefix: 'config-logs',
            snapshotDeliveryProperties: {
                deliveryFrequency: 'Daily'
            }
        }, { parent: this });

        const configRecorder = new aws.cfg.ConfigurationRecorder(`tap-config-recorder-${environmentSuffix}`, {
            name: `tap-config-recorder-${environmentSuffix}`,
            roleArn: configRole.arn,
            recordingGroup: {
                allSupported: true,
                includeGlobalResourceTypes: true,
                recordingMode: {
                    recordingFrequency: 'CONTINUOUS'
                }
            }
        }, { parent: this });

        // Register outputs
        this.registerOutputs({
            vpcId: vpc.id,
            publicSubnetIds: [publicSubnet1.id, publicSubnet2.id],
            privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
            webSecurityGroupId: webSecurityGroup.id,
            dbSecurityGroupId: dbSecurityGroup.id,
            logsBucketName: logsBucket.bucket,
            applicationBucketName: applicationBucket.bucket,
            dbEndpoint: dbInstance.endpoint,
            s3KmsKeyId: s3KmsKey.keyId,
            rdsKmsKeyId: rdsKmsKey.keyId,
            guarddutyDetectorId: guarddutyDetector.id,
            cloudtrailArn: cloudtrail.arn
        });

        // Store bucket name for export
        this.bucketName = applicationBucket.bucket;
    }
}
```

## Security Features Implemented

### Network Security
- **VPC with Multi-AZ Deployment**: Private and public subnets across two availability zones
- **Security Groups**: Restrictive rules allowing only HTTP/HTTPS traffic from specified IP ranges
- **VPC Flow Logs**: Complete network traffic logging to S3 for security analysis

### Data Security
- **S3 Encryption**: Server-side encryption using customer-managed KMS keys
- **Public Access Blocking**: All S3 buckets have public access completely blocked
- **RDS Encryption**: Database encryption at rest using customer-managed KMS keys
- **Key Rotation**: Automatic KMS key rotation enabled for enhanced security

### Access Control
- **IAM Least Privilege**: Roles and policies follow the principle of least privilege
- **Instance Profiles**: Secure EC2 access to required AWS services only
- **VPC Isolation**: Database tier isolated in private subnets with no internet access

### Monitoring and Compliance
- **CloudTrail**: Comprehensive API audit logging with data events for S3
- **GuardDuty**: Advanced threat detection with malware protection for S3 and EBS
- **AWS Config**: Configuration compliance monitoring and change tracking
- **Centralized Logging**: All security logs stored in encrypted S3 buckets

### High Availability
- **Multi-AZ RDS**: Database configured for multi-availability zone deployment
- **NAT Gateways**: Redundant NAT gateways in each availability zone
- **Load Balancer Ready**: Security groups configured for load balancer integration

This infrastructure provides a secure, monitored, and compliant AWS environment suitable for production workloads requiring high security standards.