I'll fix the remaining TypeScript errors. The main issue is with the VPC Flow Log configuration. Let me provide the corrected code:

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class SecureInfrastructure {
    private provider: aws.Provider;
    private region: string;
    private environment: string;
    private tags: Record<string, string>;
    private vpc: aws.ec2.Vpc;
    private privateSubnets: aws.ec2.Subnet[];
    private publicSubnets: aws.ec2.Subnet[];
    private internetGateway: aws.ec2.InternetGateway;
    private natGateway: aws.ec2.NatGateway;
    private dbSubnetGroup: aws.rds.SubnetGroup;
    private webSecurityGroup: aws.ec2.SecurityGroup;
    private dbSecurityGroup: aws.ec2.SecurityGroup;
    private ec2Role: aws.iam.Role;
    private flowLogsRole: aws.iam.Role;
    private appBucket: aws.s3.Bucket;
    private logsBucket: aws.s3.Bucket;

    constructor(region: string, environment: string, tags: Record<string, string>) {
        this.region = region;
        this.environment = environment;
        this.tags = {
            ...tags,
            Environment: environment,
            ManagedBy: "Pulumi",
            Region: region
        };

        // Create AWS Provider with explicit region
        this.provider = new aws.Provider(`aws-provider-${environment}`, {
            region: this.region,
        });

        // Initialize infrastructure components
        this.createNetworking();
        this.createSecurityGroups();
        this.createIAMRoles();
        this.createS3Buckets();
        this.createSecretsManager();
        this.createRDSDatabase();
        this.createEC2Instances();
        this.createCloudFront();
        this.createVPCFlowLogs();
    }

    private createNetworking(): void {
        // VPC
        this.vpc = new aws.ec2.Vpc(`secure-vpc-${this.environment}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...this.tags,
                Name: `secure-vpc-${this.environment}`
            }
        }, { provider: this.provider });

        // Internet Gateway
        this.internetGateway = new aws.ec2.InternetGateway(`igw-${this.environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...this.tags,
                Name: `igw-${this.environment}`
            }
        }, { provider: this.provider });

        // Public Subnets
        this.publicSubnets = [];
        const publicSubnetCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
        const availabilityZones = [`${this.region}a`, `${this.region}b`];

        for (let i = 0; i < 2; i++) {
            const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i + 1}-${this.environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: publicSubnetCidrs[i],
                availabilityZone: availabilityZones[i],
                mapPublicIpOnLaunch: true,
                tags: {
                    ...this.tags,
                    Name: `public-subnet-${i + 1}-${this.environment}`,
                    Type: "Public"
                }
            }, { provider: this.provider });
            this.publicSubnets.push(publicSubnet);
        }

        // Elastic IP for NAT Gateway
        const eip = new aws.ec2.Eip(`nat-eip-${this.environment}`, {
            domain: "vpc",
            tags: {
                ...this.tags,
                Name: `nat-eip-${this.environment}`
            }
        }, { provider: this.provider });

        // NAT Gateway
        this.natGateway = new aws.ec2.NatGateway(`nat-gateway-${this.environment}`, {
            allocationId: eip.id,
            subnetId: this.publicSubnets[0].id,
            tags: {
                ...this.tags,
                Name: `nat-gateway-${this.environment}`
            }
        }, { provider: this.provider });

        // Private Subnets
        this.privateSubnets = [];
        const privateSubnetCidrs = ["10.0.10.0/24", "10.0.11.0/24"];

        for (let i = 0; i < 2; i++) {
            const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i + 1}-${this.environment}`, {
                vpcId: this.vpc.id,
                cidrBlock: privateSubnetCidrs[i],
                availabilityZone: availabilityZones[i],
                tags: {
                    ...this.tags,
                    Name: `private-subnet-${i + 1}-${this.environment}`,
                    Type: "Private"
                }
            }, { provider: this.provider });
            this.privateSubnets.push(privateSubnet);
        }

        // Public Route Table
        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${this.environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...this.tags,
                Name: `public-rt-${this.environment}`
            }
        }, { provider: this.provider });

        new aws.ec2.Route(`public-route-${this.environment}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: this.internetGateway.id
        }, { provider: this.provider });

        // Associate public subnets with public route table
        this.publicSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`public-rta-${index + 1}-${this.environment}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id
            }, { provider: this.provider });
        });

        // Private Route Table
        const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${this.environment}`, {
            vpcId: this.vpc.id,
            tags: {
                ...this.tags,
                Name: `private-rt-${this.environment}`
            }
        }, { provider: this.provider });

        new aws.ec2.Route(`private-route-${this.environment}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: this.natGateway.id
        }, { provider: this.provider });

        // Associate private subnets with private route table
        this.privateSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`private-rta-${index + 1}-${this.environment}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id
            }, { provider: this.provider });
        });

        // DB Subnet Group
        this.dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${this.environment}`, {
            subnetIds: this.privateSubnets.map(subnet => subnet.id),
            tags: {
                ...this.tags,
                Name: `db-subnet-group-${this.environment}`
            }
        }, { provider: this.provider });
    }

    private createSecurityGroups(): void {
        // Web Security Group
        this.webSecurityGroup = new aws.ec2.SecurityGroup(`web-sg-${this.environment}`, {
            name: `web-sg-${this.environment}`,
            description: "Security group for web servers",
            vpcId: this.vpc.id,
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTP access"
                },
                {
                    protocol: "tcp",
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTPS access"
                },
                {
                    protocol: "tcp",
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ["10.0.0.0/16"],
                    description: "SSH access from VPC"
                }
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound traffic"
                }
            ],
            tags: {
                ...this.tags,
                Name: `web-sg-${this.environment}`
            }
        }, { provider: this.provider });

        // Database Security Group
        this.dbSecurityGroup = new aws.ec2.SecurityGroup(`db-sg-${this.environment}`, {
            name: `db-sg-${this.environment}`,
            description: "Security group for database servers",
            vpcId: this.vpc.id,
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 3306,
                    toPort: 3306,
                    securityGroups: [this.webSecurityGroup.id],
                    description: "MySQL access from web servers"
                }
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound traffic"
                }
            ],
            tags: {
                ...this.tags,
                Name: `db-sg-${this.environment}`
            }
        }, { provider: this.provider });
    }

    private createIAMRoles(): void {
        // EC2 Instance Role
        this.ec2Role = new aws.iam.Role(`ec2-role-${this.environment}`, {
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
            tags: {
                ...this.tags,
                Name: `ec2-role-${this.environment}`
            }
        }, { provider: this.provider });

        // EC2 Instance Policy with minimal privileges
        const ec2Policy = new aws.iam.Policy(`ec2-policy-${this.environment}`, {
            description: "Minimal policy for EC2 instances",
            policy: pulumi.all([this.appBucket.arn]).apply(([bucketArn]) => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        Resource: `${bucketArn}/*`
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "secretsmanager:GetSecretValue"
                        ],
                        Resource: `arn:aws:secretsmanager:${this.region}:*:secret:app-secrets-${this.environment}-*`
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        Resource: "*"
                    }
                ]
            })),
            tags: {
                ...this.tags,
                Name: `ec2-policy-${this.environment}`
            }
        }, { provider: this.provider });

        new aws.iam.RolePolicyAttachment(`ec2-policy-attachment-${this.environment}`, {
            role: this.ec2Role.name,
            policyArn: ec2Policy.arn
        }, { provider: this.provider });

        // Instance Profile
        new aws.iam.InstanceProfile(`ec2-instance-profile-${this.environment}`, {
            role: this.ec2Role.name,
            tags: {
                ...this.tags,
                Name: `ec2-instance-profile-${this.environment}`
            }
        }, { provider: this.provider });

        // VPC Flow Logs Role
        this.flowLogsRole = new aws.iam.Role(`flow-logs-role-${this.environment}`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "vpc-flow-logs.amazonaws.com"
                        }
                    }
                ]
            }),
            tags: {
                ...this.tags,
                Name: `flow-logs-role-${this.environment}`
            }
        }, { provider: this.provider });

        new aws.iam.RolePolicyAttachment(`flow-logs-policy-attachment-${this.environment}`, {
            role: this.flowLogsRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy"
        }, { provider: this.provider });
    }

    private createS3Buckets(): void {
        // Application Bucket
        this.appBucket = new aws.s3.Bucket(`secure-app-bucket-${this.environment}`, {
            bucket: `secure-app-bucket-${this.environment}-${Math.random().toString(36).substring(7)}`,
            tags: {
                ...this.tags,
                Name: `secure-app-bucket-${this.environment}`,
                Purpose: "Application Data"
            }
        }, { provider: this.provider });

        // Enable versioning
        new aws.s3.BucketVersioningV2(`app-bucket-versioning-${this.environment}`, {
            bucket: this.appBucket.id,
            versioningConfiguration: {
                status: "Enabled"
            }
        }, { provider: this.provider });

        // Enable server-side encryption
        new aws.s3.BucketServerSideEncryptionConfigurationV2(`app-bucket-encryption-${this.environment}`, {
            bucket: this.appBucket.id,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256"
                },
                bucketKeyEnabled: true
            }]
        }, { provider: this.provider });

        // Block public access
        new aws.s3.BucketPublicAccessBlock(`app-bucket-pab-${this.environment}`, {
            bucket: this.appBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { provider: this.provider });

        // CloudFront Logs Bucket
        this.logsBucket = new aws.s3.Bucket(`cloudfront-logs-bucket-${this.environment}`, {
            bucket: `cloudfront-logs-bucket-${this.environment}-${Math.random().toString(36).substring(7)}`,
            tags: {
                ...this.tags,
                Name: `cloudfront-logs-bucket-${this.environment}`,
                Purpose: "CloudFront Logs"
            }
        }, { provider: this.provider });

        new aws.s3.BucketVersioningV2(`logs-bucket-versioning-${this.environment}`, {
            bucket: this.logsBucket.id,
            versioningConfiguration: {
                status: "Enabled"
            }
        }, { provider: this.provider });

        new aws.s3.BucketServerSideEncryptionConfigurationV2(`logs-bucket-encryption-${this.environment}`, {
            bucket: this.logsBucket.id,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256"
                },
                bucketKeyEnabled: true
            }]
        }, { provider: this.provider });

        new aws.s3.BucketPublicAccessBlock(`logs-bucket-pab-${this.environment}`, {
            bucket: this.logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { provider: this.provider });
    }

    private createSecretsManager(): void {
        // Database credentials
        const dbSecret = new aws.secretsmanager.Secret(`db-credentials-${this.environment}`, {
            name: `app-secrets-${this.environment}`,
            description: "Database credentials for the application",
            tags: {
                ...this.tags,
                Name: `db-credentials-${this.environment}`,
                Purpose: "Database Credentials"
            }
        }, { provider: this.provider });

        new aws.secretsmanager.SecretVersion(`db-credentials-version-${this.environment}`, {
            secretId: dbSecret.id,
            secretString: JSON.stringify({
                username: "admin",
                password: "ChangeMe123!",
                engine: "mysql",
                host: "localhost",
                port: 3306,
                dbname: `appdb_${this.environment}`
            })
        }, { provider: this.provider });

        // API Keys
        const apiSecret = new aws.secretsmanager.Secret(`api-keys-${this.environment}`, {
            name: `api-keys-${this.environment}`,
            description: "API keys for external services",
            tags: {
                ...this.tags,
                Name: `api-keys-${this.environment}`,
                Purpose: "API Keys"
            }
        }, { provider: this.provider });

        new aws.secretsmanager.SecretVersion(`api-keys-version-${this.environment}`, {
            secretId: apiSecret.id,
            secretString: JSON.stringify({
                stripe_key: "sk_test_...",
                sendgrid_key: "SG...",
                jwt_secret: "your-jwt-secret-key"
            })
        }, { provider: this.provider });
    }

    private createRDSDatabase(): void {
        // RDS Parameter Group
        const parameterGroup = new aws.rds.ParameterGroup(`mysql-params-${this.environment}`, {
            family: "mysql8.0",
            description: "MySQL parameter group",
            parameters: [
                {
                    name: "innodb_buffer_pool_size",
                    value: "{DBInstanceClassMemory*3/4}"
                }
            ],
            tags: {
                ...this.tags,
                Name: `mysql-params-${this.environment}`
            }
        }, { provider: this.provider });

        // RDS Instance
        const rdsInstance = new aws.rds.Instance(`mysql-db-${this.environment}`, {
            identifier: `mysql-db-${this.environment}`,
            allocatedStorage: 20,
            maxAllocatedStorage: 100,
            storageType: "gp2",
            storageEncrypted: true,
            engine: "mysql",
            engineVersion: "8.0",
            instanceClass: "db.t3.micro",
            dbName: `appdb${this.environment.replace(/[^a-zA-Z0-9]/g, '')}`,
            username: "admin",
            password: "ChangeMe123!",
            parameterGroupName: parameterGroup.name,
            dbSubnetGroupName: this.dbSubnetGroup.name,
            vpcSecurityGroupIds: [this.dbSecurityGroup.id],
            multiAz: true,
            backupRetentionPeriod: 7,
            backupWindow: "03:00-04:00",
            maintenanceWindow: "sun:04:00-sun:05:00",
            autoMinorVersionUpgrade: true,
            deletionProtection: true,
            skipFinalSnapshot: false,
            finalSnapshotIdentifier: `mysql-db-${this.environment}-final-snapshot`,
            tags: {
                ...this.tags,
                Name: `mysql-db-${this.environment}`,
                Purpose: "Application Database"
            }
        }, { provider: this.provider });

        // Automated Backup using DB Snapshot
        new aws.rds.Snapshot(`db-snapshot-${this.environment}`, {
            dbInstanceIdentifier: rdsInstance.identifier,
            dbSnapshotIdentifier: `mysql-db-${this.environment}-snapshot-${Date.now()}`,
            tags: {
                ...this.tags,
                Name: `db-snapshot-${this.environment}`,
                Purpose: "Automated Backup"
            }
        }, { provider: this.provider });
    }

    private createEC2Instances(): void {
        // Get latest Amazon Linux 2 AMI
        const ami = aws.ec2.getAmi({
            mostRecent: true,
            owners: ["amazon"],
            filters: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*-x86_64-gp2"]
                }
            ]
        }, { provider: this.provider });

        // Launch Template
        const launchTemplate = new aws.ec2.LaunchTemplate(`web-launch-template-${this.environment}`, {
            namePrefix: `web-launch-template-${this.environment}`,
            imageId: ami.then(ami => ami.id),
            instanceType: "t3.micro",
            vpcSecurityGroupIds: [this.webSecurityGroup.id],
            iamInstanceProfile: {
                name: `ec2-instance-profile-${this.environment}`
            },
            userData: Buffer.from(`#!/bin/bash
                yum update -y
                yum install -y httpd
                systemctl start httpd
                systemctl enable httpd
                echo "<h1>Secure Web Server - ${this.environment}</h1>" > /var/www/html/index.html
            `).toString('base64'),
            tagSpecifications: [
                {
                    resourceType: "instance",
                    tags: {
                        ...this.tags,
                        Name: `web-server-${this.environment}`,
                        Purpose: "Web Server"
                    }
                }
            ]
        }, { provider: this.provider });

        // Auto Scaling Group
        new aws.autoscaling.Group(`web-asg-${this.environment}`, {
            name: `web-asg-${this.environment}`,
            vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
            healthCheckType: "EC2",
            healthCheckGracePeriod: 300,
            minSize: 1,
            maxSize: 3,
            desiredCapacity: 2,
            launchTemplate: {
                id: launchTemplate.id,
                version: "$Latest"
            },
            tags: [
                {
                    key: "Name",
                    value: `web-asg-${this.environment}`,
                    propagateAtLaunch: true
                },
                ...Object.entries(this.tags).map(([key, value]) => ({
                    key,
                    value,
                    propagateAtLaunch: true
                }))
            ]
        }, { provider: this.provider });
    }

    private createCloudFront(): void {
        // Origin Access Identity
        const oai = new aws.cloudfront.OriginAccessIdentity(`oai-${this.environment}`, {
            comment: `OAI for ${this.environment} environment`
        }, { provider: this.provider });

        // CloudFront Distribution
        new aws.cloudfront.Distribution(`cdn-${this.environment}`, {
            comment: `CDN for ${this.environment} environment`,
            defaultCacheBehavior: {
                targetOriginId: `S3-secure-app-bucket-${this.environment}`,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cachedMethods: ["GET", "HEAD"],
                compress: true,
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: "none"
                    }
                },
                minTtl: 0,
                defaultTtl: 3600,
                maxTtl: 86400
            },
            origins: [
                {
                    domainName: pulumi.interpolate`${this.appBucket.bucketDomainName}`,
                    originId: `S3-secure-app-bucket-${this.environment}`,
                    s3OriginConfig: {
                        originAccessIdentity: oai.cloudfrontAccessIdentityPath
                    }
                }
            ],
            enabled: true,
            isIpv6Enabled: true,
            defaultRootObject: "index.html",
            loggingConfig: {
                bucket: pulumi.interpolate`${this.logsBucket.bucketDomainName}`,
                includeCookies: false,
                prefix: `cloudfront-logs-${this.environment}/`
            },
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                }
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true
            },
            tags: {
                ...this.tags,
                Name: `cdn-${this.environment}`,
                Purpose: "Content Delivery Network"
            }
        }, { provider: this.provider });
    }

    private createVPCFlowLogs(): void {
        // CloudWatch Log Group for VPC Flow Logs
        const logGroup = new aws.cloudwatch.LogGroup(`vpc-flow-logs-${this.environment}`, {
            name: `/aws/vpc/flowlogs/${this.environment}`,
            retentionInDays: 14,
            tags: {
                ...this.tags,
                Name: `vpc-flow-logs-${this.environment}`,
                Purpose: "VPC Flow Logs"
            }
        }, { provider: this.provider });

        // VPC Flow Logs - Using correct property names
        new aws.ec2.FlowLog(`vpc-flow-log-${this.environment}`, {
            iamRoleArn: this.flowLogsRole.arn,
            logDestination: logGroup.arn,
            logDestinationType: "cloud-watch-logs",
            resourceId: this.vpc.id,
            resourceType: "VPC",
            trafficType: "ALL",
            tags: {
                ...this.tags,
                Name: `vpc-flow-log-${this.environment}`,
                Purpose: "Network Monitoring"
            }
        }, { provider: this.provider });
    }
}
```

## Key Fix Applied:

**VPC Flow Logs**: I reverted back to using `resourceId` (singular) instead of `resourceIds` (plural). The Pulumi AWS provider uses `resourceId` for single resource flow logs.

The main issue was that I was trying to use `resourceIds` which doesn't exist in the FlowLogArgs interface. The correct property is `resourceId` for a single VPC.

This should now compile without TypeScript errors. The other test file errors you mentioned seem to be related to a different file (`tap-stack.unit.test.ts`) that's not part of the SecureInfrastructure class, so those would need to be addressed separately in your test configuration.
