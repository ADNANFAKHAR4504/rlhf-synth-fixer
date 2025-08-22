/**
 * Production-ready Highly Available Web Application Infrastructure
 * 
 * This Pulumi ComponentResource implements a complete web application infrastructure
 * following AWS Well-Architected Framework principles with high availability,
 * security, and scalability.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix for resource naming
 * @property {Object<string, string>} [tags] - Default tags to apply to resources
 */

/**
 * Highly Available Web Application Infrastructure Stack
 */
export class TapStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        // Handle undefined args gracefully
        const safeArgs = args || {};
        const environmentSuffix = safeArgs.environmentSuffix || 'dev';
        const tags = {
            Environment: environmentSuffix,
            Project: 'prod-web-app',
            ...safeArgs.tags
        };

        // Get available AZs
        const availableAZs = aws.getAvailabilityZones({
            state: 'available'
        });

        // VPC
        const vpc = new aws.ec2.Vpc('prod-vpc', {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...tags, Name: 'prod-vpc' }
        }, { parent: this });

        // Internet Gateway
        const igw = new aws.ec2.InternetGateway('prod-igw', {
            vpcId: vpc.id,
            tags: { ...tags, Name: 'prod-igw' }
        }, { parent: this });

        // Public Subnets
        const publicSubnet1 = new aws.ec2.Subnet('prod-public-subnet-1', {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: availableAZs.then(azs => azs.names[0]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: 'prod-public-subnet-1', Type: 'public' }
        }, { parent: this });

        const publicSubnet2 = new aws.ec2.Subnet('prod-public-subnet-2', {
            vpcId: vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: availableAZs.then(azs => azs.names[1]),
            mapPublicIpOnLaunch: true,
            tags: { ...tags, Name: 'prod-public-subnet-2', Type: 'public' }
        }, { parent: this });

        // Private Subnets
        const privateSubnet1 = new aws.ec2.Subnet('prod-private-subnet-1', {
            vpcId: vpc.id,
            cidrBlock: '10.0.3.0/24',
            availabilityZone: availableAZs.then(azs => azs.names[0]),
            tags: { ...tags, Name: 'prod-private-subnet-1', Type: 'private' }
        }, { parent: this });

        const privateSubnet2 = new aws.ec2.Subnet('prod-private-subnet-2', {
            vpcId: vpc.id,
            cidrBlock: '10.0.4.0/24',
            availabilityZone: availableAZs.then(azs => azs.names[1]),
            tags: { ...tags, Name: 'prod-private-subnet-2', Type: 'private' }
        }, { parent: this });

        // Elastic IPs for NAT Gateways
        const eip1 = new aws.ec2.Eip('prod-nat-eip-1', {
            domain: 'vpc',
            tags: { ...tags, Name: 'prod-nat-eip-1' }
        }, { parent: this, dependsOn: [igw] });

        const eip2 = new aws.ec2.Eip('prod-nat-eip-2', {
            domain: 'vpc',
            tags: { ...tags, Name: 'prod-nat-eip-2' }
        }, { parent: this, dependsOn: [igw] });

        // NAT Gateways
        const natGw1 = new aws.ec2.NatGateway('prod-nat-gw-1', {
            allocationId: eip1.id,
            subnetId: publicSubnet1.id,
            tags: { ...tags, Name: 'prod-nat-gw-1' }
        }, { parent: this });

        const natGw2 = new aws.ec2.NatGateway('prod-nat-gw-2', {
            allocationId: eip2.id,
            subnetId: publicSubnet2.id,
            tags: { ...tags, Name: 'prod-nat-gw-2' }
        }, { parent: this });

        // Route Tables
        const publicRouteTable = new aws.ec2.RouteTable('prod-public-rt', {
            vpcId: vpc.id,
            tags: { ...tags, Name: 'prod-public-rt' }
        }, { parent: this });

        const privateRouteTable1 = new aws.ec2.RouteTable('prod-private-rt-1', {
            vpcId: vpc.id,
            tags: { ...tags, Name: 'prod-private-rt-1' }
        }, { parent: this });

        const privateRouteTable2 = new aws.ec2.RouteTable('prod-private-rt-2', {
            vpcId: vpc.id,
            tags: { ...tags, Name: 'prod-private-rt-2' }
        }, { parent: this });

        // Routes
        new aws.ec2.Route('prod-public-route', {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.id
        }, { parent: this });

        new aws.ec2.Route('prod-private-route-1', {
            routeTableId: privateRouteTable1.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGw1.id
        }, { parent: this });

        new aws.ec2.Route('prod-private-route-2', {
            routeTableId: privateRouteTable2.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGw2.id
        }, { parent: this });

        // Route Table Associations
        new aws.ec2.RouteTableAssociation('prod-public-rta-1', {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id
        }, { parent: this });

        new aws.ec2.RouteTableAssociation('prod-public-rta-2', {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id
        }, { parent: this });

        new aws.ec2.RouteTableAssociation('prod-private-rta-1', {
            subnetId: privateSubnet1.id,
            routeTableId: privateRouteTable1.id
        }, { parent: this });

        new aws.ec2.RouteTableAssociation('prod-private-rta-2', {
            subnetId: privateSubnet2.id,
            routeTableId: privateRouteTable2.id
        }, { parent: this });

        // Security Groups
        const albSecurityGroup = new aws.ec2.SecurityGroup('prod-alb-sg', {
            namePrefix: 'prod-alb-sg',
            vpcId: vpc.id,
            description: 'Security group for Application Load Balancer',
            ingress: [
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0']
                },
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0']
                }
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0']
                }
            ],
            tags: { ...tags, Name: 'prod-alb-sg' }
        }, { parent: this });

        const ec2SecurityGroup = new aws.ec2.SecurityGroup('prod-ec2-sg', {
            namePrefix: 'prod-ec2-sg',
            vpcId: vpc.id,
            description: 'Security group for EC2 instances',
            ingress: [
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    securityGroups: [albSecurityGroup.id]
                },
                {
                    fromPort: 22,
                    toPort: 22,
                    protocol: 'tcp',
                    cidrBlocks: [vpc.cidrBlock]
                }
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0']
                }
            ],
            tags: { ...tags, Name: 'prod-ec2-sg' }
        }, { parent: this });

        const rdsSecurityGroup = new aws.ec2.SecurityGroup('prod-rds-sg', {
            namePrefix: 'prod-rds-sg',
            vpcId: vpc.id,
            description: 'Security group for RDS database',
            ingress: [
                {
                    fromPort: 3306,
                    toPort: 3306,
                    protocol: 'tcp',
                    securityGroups: [ec2SecurityGroup.id]
                }
            ],
            tags: { ...tags, Name: 'prod-rds-sg' }
        }, { parent: this });

        // IAM Role for EC2 instances
        const ec2Role = new aws.iam.Role('prod-ec2-role', {
            namePrefix: 'prod-ec2-role',
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
            tags: { ...tags, Name: 'prod-ec2-role' }
        }, { parent: this });

        // IAM policies for CloudWatch and S3 access
        new aws.iam.RolePolicyAttachment('prod-ec2-cloudwatch', {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        }, { parent: this });

        new aws.iam.RolePolicyAttachment('prod-ec2-s3-read', {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        }, { parent: this });

        const ec2InstanceProfile = new aws.iam.InstanceProfile('prod-ec2-profile', {
            namePrefix: 'prod-ec2-profile',
            role: ec2Role.name
        }, { parent: this });

        // Application Load Balancer
        const alb = new aws.lb.LoadBalancer(`prod-alb-${environmentSuffix}`, {
            name: `prod-alb-${environmentSuffix}`,
            internal: false,
            loadBalancerType: 'application',
            securityGroups: [albSecurityGroup.id],
            subnets: [publicSubnet1.id, publicSubnet2.id],
            enableDeletionProtection: false,
            tags: { ...tags, Name: `prod-alb-${environmentSuffix}` }
        }, { parent: this });

        // Target Group
        const targetGroup = new aws.lb.TargetGroup(`prod-tg-${environmentSuffix}`, {
            name: `prod-tg-${environmentSuffix}`,
            port: 80,
            protocol: 'HTTP',
            vpcId: vpc.id,
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                unhealthyThreshold: 2,
                timeout: 5,
                interval: 30,
                path: '/',
                matcher: '200',
                port: 'traffic-port',
                protocol: 'HTTP'
            },
            tags: { ...tags, Name: `prod-tg-${environmentSuffix}` }
        }, { parent: this });

        // ALB Listener
        new aws.lb.Listener(`prod-alb-listener-${environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'forward',
                    targetGroupArn: targetGroup.arn
                }
            ]
        }, { parent: this });

        // Launch Template
        const launchTemplate = new aws.ec2.LaunchTemplate(`prod-launch-template-${environmentSuffix}`, {
            namePrefix: `prod-launch-template-${environmentSuffix}`,
            imageId: aws.ec2.getAmi({
                mostRecent: true,
                owners: ['amazon'],
                filters: [
                    {
                        name: 'name',
                        values: ['amzn2-ami-hvm-*-x86_64-gp2']
                    }
                ]
            }).then(ami => ami.id),
            instanceType: 't3.micro',
            vpcSecurityGroupIds: [ec2SecurityGroup.id],
            iamInstanceProfile: {
                name: ec2InstanceProfile.name
            },
            userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
yum install -y amazon-cloudwatch-agent
`).toString('base64'),
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: { ...tags, Name: 'prod-web-server' }
                }
            ]
        }, { parent: this });

        // Auto Scaling Group
        const asg = new aws.autoscaling.Group(`prod-asg-${environmentSuffix}`, {
            name: `prod-asg-${environmentSuffix}`,
            vpcZoneIdentifiers: [privateSubnet1.id, privateSubnet2.id],
            targetGroupArns: [targetGroup.arn],
            healthCheckType: 'ELB',
            healthCheckGracePeriod: 300,
            minSize: 2,
            maxSize: 6,
            desiredCapacity: 2,
            launchTemplate: {
                id: launchTemplate.id,
                version: '$Latest'
            },
            tags: [
                {
                    key: 'Name',
                    value: `prod-asg-${environmentSuffix}`,
                    propagateAtLaunch: false
                }
            ]
        }, { parent: this });

        // Auto Scaling Policies
        const scaleUpPolicy = new aws.autoscaling.Policy(`prod-scale-up-${environmentSuffix}`, {
            name: `prod-scale-up-${environmentSuffix}`,
            scalingAdjustment: 2,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: asg.name
        }, { parent: this });

        const scaleDownPolicy = new aws.autoscaling.Policy(`prod-scale-down-${environmentSuffix}`, {
            name: `prod-scale-down-${environmentSuffix}`,
            scalingAdjustment: -1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: asg.name
        }, { parent: this });

        // CloudWatch Alarms
        new aws.cloudwatch.MetricAlarm(`prod-high-cpu-alarm-${environmentSuffix}`, {
            name: `prod-high-cpu-alarm-${environmentSuffix}`,
            description: 'Alarm when CPU exceeds 70%',
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            statistic: 'Average',
            period: 120,
            evaluationPeriods: 2,
            threshold: 70,
            comparisonOperator: 'GreaterThanThreshold',
            dimensions: {
                AutoScalingGroupName: asg.name
            },
            alarmActions: [scaleUpPolicy.arn],
            tags
        }, { parent: this });

        new aws.cloudwatch.MetricAlarm(`prod-low-cpu-alarm-${environmentSuffix}`, {
            name: `prod-low-cpu-alarm-${environmentSuffix}`,
            description: 'Alarm when CPU is below 30%',
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            statistic: 'Average',
            period: 120,
            evaluationPeriods: 2,
            threshold: 30,
            comparisonOperator: 'LessThanThreshold',
            dimensions: {
                AutoScalingGroupName: asg.name
            },
            alarmActions: [scaleDownPolicy.arn],
            tags
        }, { parent: this });

        // RDS Subnet Group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`prod-db-subnet-group-${environmentSuffix}`, {
            name: `prod-db-subnet-group-${environmentSuffix}`,
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            description: 'Subnet group for RDS database',
            tags: { ...tags, Name: `prod-db-subnet-group-${environmentSuffix}` }
        }, { parent: this });

        // RDS Parameter Group
        const dbParameterGroup = new aws.rds.ParameterGroup(`prod-db-param-group-${environmentSuffix}`, {
            name: `prod-db-param-group-${environmentSuffix}`,
            family: 'mysql8.0',
            description: 'Parameter group for RDS MySQL database',
            parameters: [
                {
                    name: 'slow_query_log',
                    value: '1'
                },
                {
                    name: 'long_query_time',
                    value: '2'
                }
            ],
            tags: { ...tags, Name: `prod-db-param-group-${environmentSuffix}` }
        }, { parent: this });

        // RDS MySQL Database
        const rdsInstance = new aws.rds.Instance(`prod-mysql-db-${environmentSuffix}`, {
            identifier: `prod-mysql-db-${environmentSuffix}`,
            engine: 'mysql',
            engineVersion: '8.0',
            instanceClass: 'db.t3.micro',
            allocatedStorage: 20,
            storageType: 'gp2',
            storageEncrypted: true,
            dbName: 'proddb',
            username: 'admin',
            manageMasterUserPassword: true,
            vpcSecurityGroupIds: [rdsSecurityGroup.id],
            dbSubnetGroupName: dbSubnetGroup.name,
            parameterGroupName: dbParameterGroup.name,
            multiAz: true,
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            deletionProtection: false,
            skipFinalSnapshot: true,
            performanceInsightsEnabled: false,
            monitoringInterval: 60,
            monitoringRoleArn: aws.iam.getRole({
                name: 'rds-monitoring-role'
            }).then(role => role.arn).catch(() => {
                // Create monitoring role if it doesn't exist
                const monitoringRole = new aws.iam.Role('prod-rds-monitoring-role', {
                    name: 'rds-monitoring-role',
                    assumeRolePolicy: JSON.stringify({
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Action: 'sts:AssumeRole',
                                Effect: 'Allow',
                                Principal: {
                                    Service: 'monitoring.rds.amazonaws.com'
                                }
                            }
                        ]
                    })
                }, { parent: this });
                
                new aws.iam.RolePolicyAttachment('prod-rds-monitoring-policy', {
                    role: monitoringRole.name,
                    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
                }, { parent: this });
                
                return monitoringRole.arn;
            }),
            tags: { ...tags, Name: `prod-mysql-db-${environmentSuffix}` }
        }, { parent: this });

        // S3 Bucket for Static Assets
        const bucket = new aws.s3.Bucket(`prod-static-assets-${environmentSuffix}`, {
            bucket: `prod-static-assets-${environmentSuffix}-primary-1`,
            tags: { ...tags, Name: `prod-static-assets-${environmentSuffix}` }
        }, { parent: this });

        // S3 Bucket Versioning (using separate resource)
        new aws.s3.BucketVersioning(`prod-bucket-versioning-${environmentSuffix}`, {
            bucket: bucket.id,
            versioningConfiguration: {
                status: 'Enabled'
            }
        }, { parent: this });

        // S3 Bucket Server Side Encryption (using separate resource)
        new aws.s3.BucketServerSideEncryptionConfiguration(`prod-bucket-encryption-${environmentSuffix}`, {
            bucket: bucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256'
                    }
                }
            ]
        }, { parent: this });

        // S3 Bucket Policy
        const bucketPolicy = new aws.s3.BucketPolicy(`prod-bucket-policy-${environmentSuffix}`, {
            bucket: bucket.id,
            policy: pulumi.jsonStringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'DenyInsecureConnections',
                        Effect: 'Deny',
                        Principal: '*',
                        Action: 's3:*',
                        Resource: [
                            bucket.arn,
                            pulumi.interpolate`${bucket.arn}/*`
                        ],
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        }
                    }
                ]
            })
        }, { parent: this });

        // Block public access
        new aws.s3.BucketPublicAccessBlock(`prod-bucket-pab-${environmentSuffix}`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        // CloudWatch Dashboard
        const dashboard = new aws.cloudwatch.Dashboard(`prod-dashboard-${environmentSuffix}`, {
            dashboardName: `prod-web-app-dashboard-${environmentSuffix}`,
            dashboardBody: pulumi.jsonStringify({
                widgets: [
                    {
                        type: 'metric',
                        x: 0,
                        y: 0,
                        width: 12,
                        height: 6,
                        properties: {
                            metrics: [
                                ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', alb.arnSuffix],
                                ['AWS/ApplicationELB', 'TargetResponseTime', 'LoadBalancer', alb.arnSuffix],
                                ['AWS/EC2', 'CPUUtilization', 'AutoScalingGroupName', asg.name],
                                ['AWS/RDS', 'CPUUtilization', 'DBInstanceIdentifier', rdsInstance.id]
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-east-1',
                            title: 'Application Metrics'
                        }
                    }
                ]
            })
        }, { parent: this });

        // CloudWatch Log Groups
        const ec2LogGroup = new aws.cloudwatch.LogGroup(`prod-ec2-logs-${environmentSuffix}`, {
            name: `/aws/ec2/prod-web-servers-${environmentSuffix}`,
            retentionInDays: 14,
            tags
        }, { parent: this });

        const albLogGroup = new aws.cloudwatch.LogGroup(`prod-alb-logs-${environmentSuffix}`, {
            name: `/aws/applicationloadbalancer/prod-alb-${environmentSuffix}`,
            retentionInDays: 14,
            tags
        }, { parent: this });

        // Register outputs
        this.registerOutputs({
            vpcId: vpc.id,
            albDnsName: alb.dnsName,
            albZoneId: alb.zoneId,
            bucketName: bucket.id,
            rdsEndpoint: rdsInstance.endpoint,
            rdsPort: rdsInstance.port,
            dashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`
        });

        // Export public properties
        this.vpcId = vpc.id;
        this.albDnsName = alb.dnsName;
        this.bucketName = bucket.id;
        this.rdsEndpoint = rdsInstance.endpoint;
        this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;
    }
}

