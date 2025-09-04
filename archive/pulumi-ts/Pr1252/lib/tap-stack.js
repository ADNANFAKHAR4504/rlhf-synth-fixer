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
exports.TapStack = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class TapStack extends pulumi.ComponentResource {
    loadBalancerDns;
    bucketName;
    databaseEndpoint;
    vpcId;
    cacheEndpoint;
    autoScalingGroupName;
    targetGroupArn;
    albSecurityGroupId;
    ec2SecurityGroupId;
    rdsSecurityGroupId;
    publicSubnet1Id;
    publicSubnet2Id;
    privateSubnet1Id;
    privateSubnet2Id;
    ec2RoleArn;
    instanceProfileName;
    systemLogGroupName;
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
        const commonTags = {
            Environment: environmentSuffix,
            Project: 'WebApp',
            ManagedBy: 'Pulumi',
            ...args.tags,
        };
        // Get availability zones
        const availabilityZones = aws.getAvailabilityZones({
            state: 'available',
        });
        // Create VPC
        const vpc = new aws.ec2.Vpc(`webapp-vpc-${environmentSuffix}`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...commonTags,
                Name: `webapp-vpc-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create public subnets
        const publicSubnet1 = new aws.ec2.Subnet(`webapp-public-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: availabilityZones.then(az => az.names[0]),
            mapPublicIpOnLaunch: true,
            tags: {
                ...commonTags,
                Name: `webapp-public-subnet-1-${environmentSuffix}`,
                Type: 'Public',
            },
        }, { parent: this });
        const publicSubnet2 = new aws.ec2.Subnet(`webapp-public-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.2.0/24',
            availabilityZone: availabilityZones.then(az => az.names[1]),
            mapPublicIpOnLaunch: true,
            tags: {
                ...commonTags,
                Name: `webapp-public-subnet-2-${environmentSuffix}`,
                Type: 'Public',
            },
        }, { parent: this });
        // Create private subnets for database
        const privateSubnet1 = new aws.ec2.Subnet(`webapp-private-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.3.0/24',
            availabilityZone: availabilityZones.then(az => az.names[0]),
            tags: {
                ...commonTags,
                Name: `webapp-private-subnet-1-${environmentSuffix}`,
                Type: 'Private',
            },
        }, { parent: this });
        const privateSubnet2 = new aws.ec2.Subnet(`webapp-private-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.4.0/24',
            availabilityZone: availabilityZones.then(az => az.names[1]),
            tags: {
                ...commonTags,
                Name: `webapp-private-subnet-2-${environmentSuffix}`,
                Type: 'Private',
            },
        }, { parent: this });
        // Create Internet Gateway
        const internetGateway = new aws.ec2.InternetGateway(`webapp-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                ...commonTags,
                Name: `webapp-igw-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create route table for public subnets
        const publicRouteTable = new aws.ec2.RouteTable(`webapp-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: internetGateway.id,
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-public-rt-${environmentSuffix}`,
            },
        }, { parent: this });
        // Associate public subnets with route table
        new aws.ec2.RouteTableAssociation(`webapp-public-rta-1-${environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id,
        }, { parent: this });
        new aws.ec2.RouteTableAssociation(`webapp-public-rta-2-${environmentSuffix}`, {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id,
        }, { parent: this });
        // Create security group for ALB
        const albSecurityGroup = new aws.ec2.SecurityGroup(`webapp-alb-sg-${environmentSuffix}`, {
            name: `webapp-alb-sg-${environmentSuffix}`,
            vpcId: vpc.id,
            description: 'Security group for Application Load Balancer',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP',
                },
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-alb-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create security group for EC2 instances
        const ec2SecurityGroup = new aws.ec2.SecurityGroup(`webapp-ec2-sg-${environmentSuffix}`, {
            name: `webapp-ec2-sg-${environmentSuffix}`,
            vpcId: vpc.id,
            description: 'Security group for EC2 instances',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    securityGroups: [albSecurityGroup.id],
                    description: 'HTTP from ALB',
                },
                {
                    protocol: 'tcp',
                    fromPort: 8080,
                    toPort: 8080,
                    securityGroups: [albSecurityGroup.id],
                    description: 'Application port from ALB',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-ec2-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create security group for RDS
        const rdsSecurityGroup = new aws.ec2.SecurityGroup(`webapp-rds-sg-${environmentSuffix}`, {
            name: `webapp-rds-sg-${environmentSuffix}`,
            vpcId: vpc.id,
            description: 'Security group for RDS PostgreSQL',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    securityGroups: [ec2SecurityGroup.id],
                    description: 'PostgreSQL from EC2',
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-rds-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create security group for ElastiCache
        const cacheSecurityGroup = new aws.ec2.SecurityGroup(`webapp-cache-sg-${environmentSuffix}`, {
            name: `webapp-cache-sg-${environmentSuffix}`,
            vpcId: vpc.id,
            description: 'Security group for ElastiCache',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 6379,
                    toPort: 6379,
                    securityGroups: [ec2SecurityGroup.id],
                    description: 'Redis from EC2',
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-cache-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create DB subnet group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`webapp-db-subnet-group-${environmentSuffix}`, {
            name: `webapp-db-subnet-group-${environmentSuffix}`,
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            tags: {
                ...commonTags,
                Name: `webapp-db-subnet-group-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create RDS PostgreSQL instance
        const database = new aws.rds.Instance(`webapp-postgres-${environmentSuffix}`, {
            identifier: `webapp-postgres-${environmentSuffix}`,
            engine: 'postgres',
            engineVersion: '16.3',
            instanceClass: 'db.t3.micro',
            allocatedStorage: 20,
            storageType: 'gp2',
            storageEncrypted: true,
            multiAz: true,
            dbName: 'webapp',
            username: 'webappuser',
            password: 'TempPassword123!', // In production, use AWS Secrets Manager
            vpcSecurityGroupIds: [rdsSecurityGroup.id],
            dbSubnetGroupName: dbSubnetGroup.name,
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            skipFinalSnapshot: true,
            deletionProtection: false,
            tags: {
                ...commonTags,
                Name: `webapp-postgres-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create ElastiCache subnet group
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cacheSubnetGroup = new aws.elasticache.SubnetGroup(`webapp-cache-subnet-group-${environmentSuffix}`, {
            name: `webapp-cache-subnet-group-${environmentSuffix}`,
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            tags: commonTags,
        }, { parent: this });
        // Create ElastiCache Serverless cache
        const cache = new aws.elasticache.ServerlessCache(`webapp-cache-${environmentSuffix}`, {
            name: `webapp-cache-${environmentSuffix}`,
            engine: 'redis',
            majorEngineVersion: '7',
            description: 'Serverless Redis cache for web application',
            cacheUsageLimits: {
                dataStorage: {
                    maximum: 10,
                    unit: 'GB',
                },
            },
            securityGroupIds: [cacheSecurityGroup.id],
            subnetIds: [privateSubnet1.id, privateSubnet2.id],
            tags: commonTags,
        }, { parent: this });
        // Create S3 bucket for static content
        // Generate a unique but valid bucket name (limited to 63 chars)
        const accountId = pulumi.output(aws.getCallerIdentity()).accountId;
        const bucket = new aws.s3.Bucket(`webapp-static-${environmentSuffix}`, {
            bucket: accountId.apply(id => `webapp-${environmentSuffix.toLowerCase().substring(0, 15)}-${id.substring(0, 8)}`),
            versioning: {
                enabled: true,
            },
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            },
            tags: {
                ...commonTags,
                Name: `webapp-static-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create S3 bucket public access block
        new aws.s3.BucketPublicAccessBlock(`webapp-static-pab-${environmentSuffix}`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Create IAM role for EC2 instances
        const ec2Role = new aws.iam.Role(`webapp-ec2-role-${environmentSuffix}`, {
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
            tags: {
                ...commonTags,
                Name: `webapp-ec2-role-${environmentSuffix}`,
            },
        }, { parent: this });
        // Attach policies to EC2 role
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ec2PolicyAttachment = new aws.iam.RolePolicyAttachment(`webapp-ec2-policy-${environmentSuffix}`, {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
        }, { parent: this });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cloudWatchPolicyAttachment = new aws.iam.RolePolicyAttachment(`webapp-cloudwatch-policy-${environmentSuffix}`, {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        }, { parent: this });
        // Create instance profile
        const instanceProfile = new aws.iam.InstanceProfile(`webapp-instance-profile-${environmentSuffix}`, {
            name: `webapp-instance-profile-${environmentSuffix}`,
            role: ec2Role.name,
            tags: {
                ...commonTags,
                Name: `webapp-instance-profile-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create launch template
        const launchTemplate = new aws.ec2.LaunchTemplate(`webapp-launch-template-${environmentSuffix}`, {
            name: `webapp-launch-template-${environmentSuffix}`,
            imageId: 'ami-0e2c8caa4b6378d8c', // Amazon Linux 2023 AMI for us-east-1
            instanceType: 't3.micro', // Using t3.micro instead of i8g for cost efficiency
            keyName: undefined, // Add your key pair name if needed
            vpcSecurityGroupIds: [ec2SecurityGroup.id],
            iamInstanceProfile: {
                name: instanceProfile.name,
            },
            userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user

# Install CloudWatch agent configuration
cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "webapp-${environmentSuffix}-system",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s`).toString('base64'),
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: {
                        ...commonTags,
                        Name: `webapp-instance-${environmentSuffix}`,
                    },
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-launch-template-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create CloudWatch Log Groups
        const systemLogGroup = new aws.cloudwatch.LogGroup(`webapp-${environmentSuffix}-system`, {
            name: `webapp-${environmentSuffix}-system`,
            retentionInDays: 30,
            tags: {
                ...commonTags,
                Name: `webapp-${environmentSuffix}-system-logs`,
            },
        }, { parent: this });
        // Create Application Load Balancer
        const loadBalancer = new aws.lb.LoadBalancer(`webapp-alb-${environmentSuffix}`, {
            name: `wapp-alb-${environmentSuffix.substring(0, 15)}`,
            loadBalancerType: 'application',
            securityGroups: [albSecurityGroup.id],
            subnets: [publicSubnet1.id, publicSubnet2.id],
            enableDeletionProtection: false,
            tags: {
                ...commonTags,
                Name: `webapp-alb-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create target group
        const targetGroup = new aws.lb.TargetGroup(`webapp-tg-${environmentSuffix}`, {
            name: `webapp-tg-${environmentSuffix}`,
            port: 80,
            protocol: 'HTTP',
            vpcId: vpc.id,
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                interval: 30,
                matcher: '200',
                path: '/health',
                port: 'traffic-port',
                protocol: 'HTTP',
                timeout: 5,
                unhealthyThreshold: 2,
            },
            tags: {
                ...commonTags,
                Name: `webapp-tg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create listener
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const listener = new aws.lb.Listener(`webapp-listener-${environmentSuffix}`, {
            loadBalancerArn: loadBalancer.arn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'forward',
                    targetGroupArn: targetGroup.arn,
                },
            ],
            tags: {
                ...commonTags,
                Name: `webapp-listener-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create Auto Scaling Group
        const autoScalingGroup = new aws.autoscaling.Group(`webapp-asg-${environmentSuffix}`, {
            name: `webapp-asg-${environmentSuffix}`,
            vpcZoneIdentifiers: [publicSubnet1.id, publicSubnet2.id],
            targetGroupArns: [targetGroup.arn],
            healthCheckType: 'ELB',
            healthCheckGracePeriod: 300,
            minSize: 2,
            maxSize: 6,
            desiredCapacity: 2,
            launchTemplate: {
                id: launchTemplate.id,
                version: '$Latest',
            },
            tags: [
                {
                    key: 'Name',
                    value: `webapp-asg-${environmentSuffix}`,
                    propagateAtLaunch: true,
                },
                ...Object.entries(commonTags).map(([key, value]) => ({
                    key,
                    value,
                    propagateAtLaunch: true,
                })),
            ],
        }, { parent: this });
        // Create Auto Scaling Policy
        const scaleUpPolicy = new aws.autoscaling.Policy(`webapp-scale-up-${environmentSuffix}`, {
            name: `webapp-scale-up-${environmentSuffix}`,
            scalingAdjustment: 1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        const scaleDownPolicy = new aws.autoscaling.Policy(`webapp-scale-down-${environmentSuffix}`, {
            name: `webapp-scale-down-${environmentSuffix}`,
            scalingAdjustment: -1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        // Create CloudWatch Alarms
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`webapp-high-cpu-${environmentSuffix}`, {
            name: `webapp-high-cpu-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors ec2 cpu utilization',
            alarmActions: [scaleUpPolicy.arn],
            dimensions: {
                AutoScalingGroupName: autoScalingGroup.name,
            },
            tags: {
                ...commonTags,
                Name: `webapp-high-cpu-alarm-${environmentSuffix}`,
            },
        }, { parent: this });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const lowCpuAlarm = new aws.cloudwatch.MetricAlarm(`webapp-low-cpu-${environmentSuffix}`, {
            name: `webapp-low-cpu-${environmentSuffix}`,
            comparisonOperator: 'LessThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 10,
            alarmDescription: 'This metric monitors ec2 cpu utilization',
            alarmActions: [scaleDownPolicy.arn],
            dimensions: {
                AutoScalingGroupName: autoScalingGroup.name,
            },
            tags: {
                ...commonTags,
                Name: `webapp-low-cpu-alarm-${environmentSuffix}`,
            },
        }, { parent: this });
        // Export important values
        this.loadBalancerDns = loadBalancer.dnsName;
        this.bucketName = bucket.bucket;
        this.databaseEndpoint = database.endpoint;
        this.vpcId = vpc.id;
        this.cacheEndpoint = cache.endpoints.apply(endpoints => endpoints && endpoints.length > 0 ? endpoints[0].address || '' : '');
        this.autoScalingGroupName = autoScalingGroup.name;
        this.targetGroupArn = targetGroup.arn;
        this.albSecurityGroupId = albSecurityGroup.id;
        this.ec2SecurityGroupId = ec2SecurityGroup.id;
        this.rdsSecurityGroupId = rdsSecurityGroup.id;
        this.publicSubnet1Id = publicSubnet1.id;
        this.publicSubnet2Id = publicSubnet2.id;
        this.privateSubnet1Id = privateSubnet1.id;
        this.privateSubnet2Id = privateSubnet2.id;
        this.ec2RoleArn = ec2Role.arn;
        this.instanceProfileName = instanceProfile.name;
        this.systemLogGroupName = systemLogGroup.name;
        this.registerOutputs({
            loadBalancerDns: this.loadBalancerDns,
            bucketName: this.bucketName,
            databaseEndpoint: this.databaseEndpoint,
            vpcId: this.vpcId,
            cacheEndpoint: this.cacheEndpoint,
            autoScalingGroupName: autoScalingGroup.name,
            targetGroupArn: targetGroup.arn,
            albSecurityGroupId: albSecurityGroup.id,
            ec2SecurityGroupId: ec2SecurityGroup.id,
            rdsSecurityGroupId: rdsSecurityGroup.id,
            publicSubnet1Id: publicSubnet1.id,
            publicSubnet2Id: publicSubnet2.id,
            privateSubnet1Id: privateSubnet1.id,
            privateSubnet2Id: privateSubnet2.id,
            ec2RoleArn: ec2Role.arn,
            instanceProfileName: instanceProfile.name,
            systemLogGroupName: systemLogGroup.name,
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFRekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxlQUFlLENBQXdCO0lBQ3ZDLFVBQVUsQ0FBd0I7SUFDbEMsZ0JBQWdCLENBQXdCO0lBQ3hDLEtBQUssQ0FBd0I7SUFDN0IsYUFBYSxDQUF3QjtJQUNyQyxvQkFBb0IsQ0FBd0I7SUFDNUMsY0FBYyxDQUF3QjtJQUN0QyxrQkFBa0IsQ0FBd0I7SUFDMUMsa0JBQWtCLENBQXdCO0lBQzFDLGtCQUFrQixDQUF3QjtJQUMxQyxlQUFlLENBQXdCO0lBQ3ZDLGVBQWUsQ0FBd0I7SUFDdkMsZ0JBQWdCLENBQXdCO0lBQ3hDLGdCQUFnQixDQUF3QjtJQUN4QyxVQUFVLENBQXdCO0lBQ2xDLG1CQUFtQixDQUF3QjtJQUMzQyxrQkFBa0IsQ0FBd0I7SUFFMUQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5QyxNQUFNLGlCQUFpQixHQUNyQixJQUFJLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxLQUFLLENBQUM7UUFDcEUsTUFBTSxVQUFVLEdBQUc7WUFDakIsV0FBVyxFQUFFLGlCQUFpQjtZQUM5QixPQUFPLEVBQUUsUUFBUTtZQUNqQixTQUFTLEVBQUUsUUFBUTtZQUNuQixHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLHlCQUF5QjtRQUN6QixNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQztZQUNqRCxLQUFLLEVBQUUsV0FBVztTQUNu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Q0FBQyxrQkFBa0IsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO1FBRTlDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUMsSUFBSTtZQUMzQyxjQUFjLEVBQUUsV0FBVyxDQUFDLEdBQUc7WUFDL0Isa0JBQWtCLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUN2QyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO1lBQ3ZDLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLEVBQUU7WUFDdkMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxFQUFFO1lBQ2pDLGVBQWUsRUFBRSxhQUFhLENBQUMsRUFBRTtZQUNqQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsRUFBRTtZQUNuQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsRUFBRTtZQUNuQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUc7WUFDdkIsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLElBQUk7WUFDekMsa0JBQWtCLEVBQUUsY0FBYyxDQUFDLElBQUk7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdnZCRCw0QkF1dkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFwU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXBTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXJEbnM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlRW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjYWNoZUVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhdXRvU2NhbGluZ0dyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGFsYlNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZWMyU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSByZHNTZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldDFJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0MklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0MUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0MklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBlYzJSb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVByb2ZpbGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzeXN0ZW1Mb2dHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcFN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6c3RhY2s6VGFwU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgICAgIGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuICAgIGNvbnN0IGNvbW1vblRhZ3MgPSB7XG4gICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICBQcm9qZWN0OiAnV2ViQXBwJyxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIC8vIEdldCBhdmFpbGFiaWxpdHkgem9uZXNcbiAgICBjb25zdCBhdmFpbGFiaWxpdHlab25lcyA9IGF3cy5nZXRBdmFpbGFiaWxpdHlab25lcyh7XG4gICAgICBzdGF0ZTogJ2F2YWlsYWJsZScsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgVlBDXG4gICAgY29uc3QgdnBjID0gbmV3IGF3cy5lYzIuVnBjKFxuICAgICAgYHdlYmFwcC12cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjaWRyQmxvY2s6ICcxMC4wLjAuMC8xNicsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC12cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHB1YmxpYyBzdWJuZXRzXG4gICAgY29uc3QgcHVibGljU3VibmV0MSA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGB3ZWJhcHAtcHVibGljLXN1Ym5ldC0xLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgY2lkckJsb2NrOiAnMTAuMC4xLjAvMjQnLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhdmFpbGFiaWxpdHlab25lcy50aGVuKGF6ID0+IGF6Lm5hbWVzWzBdKSxcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC1wdWJsaWMtc3VibmV0LTEtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFR5cGU6ICdQdWJsaWMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgcHVibGljU3VibmV0MiA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGB3ZWJhcHAtcHVibGljLXN1Ym5ldC0yLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgY2lkckJsb2NrOiAnMTAuMC4yLjAvMjQnLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhdmFpbGFiaWxpdHlab25lcy50aGVuKGF6ID0+IGF6Lm5hbWVzWzFdKSxcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC1wdWJsaWMtc3VibmV0LTItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFR5cGU6ICdQdWJsaWMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHByaXZhdGUgc3VibmV0cyBmb3IgZGF0YWJhc2VcbiAgICBjb25zdCBwcml2YXRlU3VibmV0MSA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGB3ZWJhcHAtcHJpdmF0ZS1zdWJuZXQtMS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogJzEwLjAuMy4wLzI0JyxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXZhaWxhYmlsaXR5Wm9uZXMudGhlbihheiA9PiBhei5uYW1lc1swXSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi5jb21tb25UYWdzLFxuICAgICAgICAgIE5hbWU6IGB3ZWJhcHAtcHJpdmF0ZS1zdWJuZXQtMS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgVHlwZTogJ1ByaXZhdGUnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldDIgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICBgd2ViYXBwLXByaXZhdGUtc3VibmV0LTItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICBjaWRyQmxvY2s6ICcxMC4wLjQuMC8yNCcsXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGF2YWlsYWJpbGl0eVpvbmVzLnRoZW4oYXogPT4gYXoubmFtZXNbMV0pLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLXByaXZhdGUtc3VibmV0LTItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFR5cGU6ICdQcml2YXRlJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJbnRlcm5ldCBHYXRld2F5XG4gICAgY29uc3QgaW50ZXJuZXRHYXRld2F5ID0gbmV3IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5KFxuICAgICAgYHdlYmFwcC1pZ3ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWlndy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgcm91dGUgdGFibGUgZm9yIHB1YmxpYyBzdWJuZXRzXG4gICAgY29uc3QgcHVibGljUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgd2ViYXBwLXB1YmxpYy1ydC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIHJvdXRlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgICAgICBnYXRld2F5SWQ6IGludGVybmV0R2F0ZXdheS5pZCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLXB1YmxpYy1ydC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBc3NvY2lhdGUgcHVibGljIHN1Ym5ldHMgd2l0aCByb3V0ZSB0YWJsZVxuICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgIGB3ZWJhcHAtcHVibGljLXJ0YS0xLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDEuaWQsXG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgIGB3ZWJhcHAtcHVibGljLXJ0YS0yLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDIuaWQsXG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgQUxCXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgd2ViYXBwLWFsYi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtYWxiLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcicsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogODAsXG4gICAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWFsYi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICBjb25zdCBlYzJTZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGB3ZWJhcHAtZWMyLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1lYzItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBFQzIgaW5zdGFuY2VzJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW2FsYlNlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIGZyb20gQUxCJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MDgwLFxuICAgICAgICAgICAgdG9Qb3J0OiA4MDgwLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthbGJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXBwbGljYXRpb24gcG9ydCBmcm9tIEFMQicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWVjMi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIFJEU1xuICAgIGNvbnN0IHJkc1NlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYHdlYmFwcC1yZHMtc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgd2ViYXBwLXJkcy1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIFJEUyBQb3N0Z3JlU1FMJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA1NDMyLFxuICAgICAgICAgICAgdG9Qb3J0OiA1NDMyLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtlYzJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUG9zdGdyZVNRTCBmcm9tIEVDMicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC1yZHMtc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBFbGFzdGlDYWNoZVxuICAgIGNvbnN0IGNhY2hlU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgd2ViYXBwLWNhY2hlLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1jYWNoZS1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVsYXN0aUNhY2hlJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA2Mzc5LFxuICAgICAgICAgICAgdG9Qb3J0OiA2Mzc5LFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtlYzJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVkaXMgZnJvbSBFQzInLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi5jb21tb25UYWdzLFxuICAgICAgICAgIE5hbWU6IGB3ZWJhcHAtY2FjaGUtc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIERCIHN1Ym5ldCBncm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChcbiAgICAgIGB3ZWJhcHAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzdWJuZXRJZHM6IFtwcml2YXRlU3VibmV0MS5pZCwgcHJpdmF0ZVN1Ym5ldDIuaWRdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgUkRTIFBvc3RncmVTUUwgaW5zdGFuY2VcbiAgICBjb25zdCBkYXRhYmFzZSA9IG5ldyBhd3MucmRzLkluc3RhbmNlKFxuICAgICAgYHdlYmFwcC1wb3N0Z3Jlcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGlkZW50aWZpZXI6IGB3ZWJhcHAtcG9zdGdyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBlbmdpbmU6ICdwb3N0Z3JlcycsXG4gICAgICAgIGVuZ2luZVZlcnNpb246ICcxNi4zJyxcbiAgICAgICAgaW5zdGFuY2VDbGFzczogJ2RiLnQzLm1pY3JvJyxcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogMjAsXG4gICAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AyJyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgbXVsdGlBejogdHJ1ZSxcbiAgICAgICAgZGJOYW1lOiAnd2ViYXBwJyxcbiAgICAgICAgdXNlcm5hbWU6ICd3ZWJhcHB1c2VyJyxcbiAgICAgICAgcGFzc3dvcmQ6ICdUZW1wUGFzc3dvcmQxMjMhJywgLy8gSW4gcHJvZHVjdGlvbiwgdXNlIEFXUyBTZWNyZXRzIE1hbmFnZXJcbiAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW3Jkc1NlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogZGJTdWJuZXRHcm91cC5uYW1lLFxuICAgICAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q6IDcsXG4gICAgICAgIGJhY2t1cFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcbiAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IHRydWUsXG4gICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi5jb21tb25UYWdzLFxuICAgICAgICAgIE5hbWU6IGB3ZWJhcHAtcG9zdGdyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEVsYXN0aUNhY2hlIHN1Ym5ldCBncm91cFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBjYWNoZVN1Ym5ldEdyb3VwID0gbmV3IGF3cy5lbGFzdGljYWNoZS5TdWJuZXRHcm91cChcbiAgICAgIGB3ZWJhcHAtY2FjaGUtc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1jYWNoZS1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzdWJuZXRJZHM6IFtwcml2YXRlU3VibmV0MS5pZCwgcHJpdmF0ZVN1Ym5ldDIuaWRdLFxuICAgICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEVsYXN0aUNhY2hlIFNlcnZlcmxlc3MgY2FjaGVcbiAgICBjb25zdCBjYWNoZSA9IG5ldyBhd3MuZWxhc3RpY2FjaGUuU2VydmVybGVzc0NhY2hlKFxuICAgICAgYHdlYmFwcC1jYWNoZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtY2FjaGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBlbmdpbmU6ICdyZWRpcycsXG4gICAgICAgIG1ham9yRW5naW5lVmVyc2lvbjogJzcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlcnZlcmxlc3MgUmVkaXMgY2FjaGUgZm9yIHdlYiBhcHBsaWNhdGlvbicsXG4gICAgICAgIGNhY2hlVXNhZ2VMaW1pdHM6IHtcbiAgICAgICAgICBkYXRhU3RvcmFnZToge1xuICAgICAgICAgICAgbWF4aW11bTogMTAsXG4gICAgICAgICAgICB1bml0OiAnR0InLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IFtjYWNoZVNlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICBzdWJuZXRJZHM6IFtwcml2YXRlU3VibmV0MS5pZCwgcHJpdmF0ZVN1Ym5ldDIuaWRdLFxuICAgICAgICB0YWdzOiBjb21tb25UYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3Igc3RhdGljIGNvbnRlbnRcbiAgICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBidXQgdmFsaWQgYnVja2V0IG5hbWUgKGxpbWl0ZWQgdG8gNjMgY2hhcnMpXG4gICAgY29uc3QgYWNjb3VudElkID0gcHVsdW1pLm91dHB1dChhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKSkuYWNjb3VudElkO1xuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYHdlYmFwcC1zdGF0aWMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFjY291bnRJZC5hcHBseShcbiAgICAgICAgICBpZCA9PlxuICAgICAgICAgICAgYHdlYmFwcC0ke2Vudmlyb25tZW50U3VmZml4LnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDAsIDE1KX0tJHtpZC5zdWJzdHJpbmcoMCwgOCl9YFxuICAgICAgICApLFxuICAgICAgICB2ZXJzaW9uaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdBRVMyNTYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLXN0YXRpYy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgUzMgYnVja2V0IHB1YmxpYyBhY2Nlc3MgYmxvY2tcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYHdlYmFwcC1zdGF0aWMtcGFiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBidWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IGVjMlJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHdlYmFwcC1lYzItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZWMyLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC1lYzItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBdHRhY2ggcG9saWNpZXMgdG8gRUMyIHJvbGVcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgZWMyUG9saWN5QXR0YWNobWVudCA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHdlYmFwcC1lYzItcG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogZWMyUm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46ICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9BbWF6b25TM1JlYWRPbmx5QWNjZXNzJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBjbG91ZFdhdGNoUG9saWN5QXR0YWNobWVudCA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHdlYmFwcC1jbG91ZHdhdGNoLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOiAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBpbnN0YW5jZSBwcm9maWxlXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKFxuICAgICAgYHdlYmFwcC1pbnN0YW5jZS1wcm9maWxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1pbnN0YW5jZS1wcm9maWxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcm9sZTogZWMyUm9sZS5uYW1lLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWluc3RhbmNlLXByb2ZpbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGxhdW5jaCB0ZW1wbGF0ZVxuICAgIGNvbnN0IGxhdW5jaFRlbXBsYXRlID0gbmV3IGF3cy5lYzIuTGF1bmNoVGVtcGxhdGUoXG4gICAgICBgd2ViYXBwLWxhdW5jaC10ZW1wbGF0ZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtbGF1bmNoLXRlbXBsYXRlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgaW1hZ2VJZDogJ2FtaS0wZTJjOGNhYTRiNjM3OGQ4YycsIC8vIEFtYXpvbiBMaW51eCAyMDIzIEFNSSBmb3IgdXMtZWFzdC0xXG4gICAgICAgIGluc3RhbmNlVHlwZTogJ3QzLm1pY3JvJywgLy8gVXNpbmcgdDMubWljcm8gaW5zdGVhZCBvZiBpOGcgZm9yIGNvc3QgZWZmaWNpZW5jeVxuICAgICAgICBrZXlOYW1lOiB1bmRlZmluZWQsIC8vIEFkZCB5b3VyIGtleSBwYWlyIG5hbWUgaWYgbmVlZGVkXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtlYzJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgaWFtSW5zdGFuY2VQcm9maWxlOiB7XG4gICAgICAgICAgbmFtZTogaW5zdGFuY2VQcm9maWxlLm5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHVzZXJEYXRhOiBCdWZmZXIuZnJvbShcbiAgICAgICAgICBgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbnl1bSBpbnN0YWxsIC15IGFtYXpvbi1jbG91ZHdhdGNoLWFnZW50XG5hbWF6b24tbGludXgtZXh0cmFzIGluc3RhbGwgZG9ja2VyXG5zZXJ2aWNlIGRvY2tlciBzdGFydFxudXNlcm1vZCAtYSAtRyBkb2NrZXIgZWMyLXVzZXJcblxuIyBJbnN0YWxsIENsb3VkV2F0Y2ggYWdlbnQgY29uZmlndXJhdGlvblxuY2F0IDw8ICdFT0YnID4gL29wdC9hd3MvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQvZXRjL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50Lmpzb25cbntcbiAgXCJsb2dzXCI6IHtcbiAgICBcImxvZ3NfY29sbGVjdGVkXCI6IHtcbiAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICBcImNvbGxlY3RfbGlzdFwiOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJmaWxlX3BhdGhcIjogXCIvdmFyL2xvZy9tZXNzYWdlc1wiLFxuICAgICAgICAgICAgXCJsb2dfZ3JvdXBfbmFtZVwiOiBcIndlYmFwcC0ke2Vudmlyb25tZW50U3VmZml4fS1zeXN0ZW1cIixcbiAgICAgICAgICAgIFwibG9nX3N0cmVhbV9uYW1lXCI6IFwie2luc3RhbmNlX2lkfVwiLFxuICAgICAgICAgICAgXCJyZXRlbnRpb25faW5fZGF5c1wiOiAzMFxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuRU9GXG5cbi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2Jpbi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtYyBmaWxlOi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uIC1zYFxuICAgICAgICApLnRvU3RyaW5nKCdiYXNlNjQnKSxcbiAgICAgICAgdGFnU3BlY2lmaWNhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZXNvdXJjZVR5cGU6ICdpbnN0YW5jZScsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgICAgIE5hbWU6IGB3ZWJhcHAtaW5zdGFuY2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWxhdW5jaC10ZW1wbGF0ZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgR3JvdXBzXG4gICAgY29uc3Qgc3lzdGVtTG9nR3JvdXAgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXAoXG4gICAgICBgd2ViYXBwLSR7ZW52aXJvbm1lbnRTdWZmaXh9LXN5c3RlbWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtJHtlbnZpcm9ubWVudFN1ZmZpeH0tc3lzdGVtYCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiAzMCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC0ke2Vudmlyb25tZW50U3VmZml4fS1zeXN0ZW0tbG9nc2AsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIGNvbnN0IGxvYWRCYWxhbmNlciA9IG5ldyBhd3MubGIuTG9hZEJhbGFuY2VyKFxuICAgICAgYHdlYmFwcC1hbGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgd2FwcC1hbGItJHtlbnZpcm9ubWVudFN1ZmZpeC5zdWJzdHJpbmcoMCwgMTUpfWAsXG4gICAgICAgIGxvYWRCYWxhbmNlclR5cGU6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbYWxiU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICAgIHN1Ym5ldHM6IFtwdWJsaWNTdWJuZXQxLmlkLCBwdWJsaWNTdWJuZXQyLmlkXSxcbiAgICAgICAgZW5hYmxlRGVsZXRpb25Qcm90ZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC1hbGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHRhcmdldCBncm91cFxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGF3cy5sYi5UYXJnZXRHcm91cChcbiAgICAgIGB3ZWJhcHAtdGctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgd2ViYXBwLXRnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBoZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICAgIGludGVydmFsOiAzMCxcbiAgICAgICAgICBtYXRjaGVyOiAnMjAwJyxcbiAgICAgICAgICBwYXRoOiAnL2hlYWx0aCcsXG4gICAgICAgICAgcG9ydDogJ3RyYWZmaWMtcG9ydCcsXG4gICAgICAgICAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgICAgICAgICB0aW1lb3V0OiA1LFxuICAgICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZDogMixcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmNvbW1vblRhZ3MsXG4gICAgICAgICAgTmFtZTogYHdlYmFwcC10Zy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgbGlzdGVuZXJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgbGlzdGVuZXIgPSBuZXcgYXdzLmxiLkxpc3RlbmVyKFxuICAgICAgYHdlYmFwcC1saXN0ZW5lci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGxvYWRCYWxhbmNlckFybjogbG9hZEJhbGFuY2VyLmFybixcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICAgIGRlZmF1bHRBY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2ZvcndhcmQnLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IHRhcmdldEdyb3VwLmFybixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWxpc3RlbmVyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBdXRvIFNjYWxpbmcgR3JvdXBcbiAgICBjb25zdCBhdXRvU2NhbGluZ0dyb3VwID0gbmV3IGF3cy5hdXRvc2NhbGluZy5Hcm91cChcbiAgICAgIGB3ZWJhcHAtYXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1hc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB2cGNab25lSWRlbnRpZmllcnM6IFtwdWJsaWNTdWJuZXQxLmlkLCBwdWJsaWNTdWJuZXQyLmlkXSxcbiAgICAgICAgdGFyZ2V0R3JvdXBBcm5zOiBbdGFyZ2V0R3JvdXAuYXJuXSxcbiAgICAgICAgaGVhbHRoQ2hlY2tUeXBlOiAnRUxCJyxcbiAgICAgICAgaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZDogMzAwLFxuICAgICAgICBtaW5TaXplOiAyLFxuICAgICAgICBtYXhTaXplOiA2LFxuICAgICAgICBkZXNpcmVkQ2FwYWNpdHk6IDIsXG4gICAgICAgIGxhdW5jaFRlbXBsYXRlOiB7XG4gICAgICAgICAgaWQ6IGxhdW5jaFRlbXBsYXRlLmlkLFxuICAgICAgICAgIHZlcnNpb246ICckTGF0ZXN0JyxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogJ05hbWUnLFxuICAgICAgICAgICAgdmFsdWU6IGB3ZWJhcHAtYXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIHByb3BhZ2F0ZUF0TGF1bmNoOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgLi4uT2JqZWN0LmVudHJpZXMoY29tbW9uVGFncykubWFwKChba2V5LCB2YWx1ZV0pID0+ICh7XG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIHByb3BhZ2F0ZUF0TGF1bmNoOiB0cnVlLFxuICAgICAgICAgIH0pKSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBdXRvIFNjYWxpbmcgUG9saWN5XG4gICAgY29uc3Qgc2NhbGVVcFBvbGljeSA9IG5ldyBhd3MuYXV0b3NjYWxpbmcuUG9saWN5KFxuICAgICAgYHdlYmFwcC1zY2FsZS11cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtc2NhbGUtdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzY2FsaW5nQWRqdXN0bWVudDogMSxcbiAgICAgICAgYWRqdXN0bWVudFR5cGU6ICdDaGFuZ2VJbkNhcGFjaXR5JyxcbiAgICAgICAgY29vbGRvd246IDMwMCxcbiAgICAgICAgYXV0b3NjYWxpbmdHcm91cE5hbWU6IGF1dG9TY2FsaW5nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHNjYWxlRG93blBvbGljeSA9IG5ldyBhd3MuYXV0b3NjYWxpbmcuUG9saWN5KFxuICAgICAgYHdlYmFwcC1zY2FsZS1kb3duLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHdlYmFwcC1zY2FsZS1kb3duLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgc2NhbGluZ0FkanVzdG1lbnQ6IC0xLFxuICAgICAgICBhZGp1c3RtZW50VHlwZTogJ0NoYW5nZUluQ2FwYWNpdHknLFxuICAgICAgICBjb29sZG93bjogMzAwLFxuICAgICAgICBhdXRvc2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggQWxhcm1zXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IGhpZ2hDcHVBbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGB3ZWJhcHAtaGlnaC1jcHUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgd2ViYXBwLWhpZ2gtY3B1LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ0NQVVV0aWxpemF0aW9uJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiA4MCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ1RoaXMgbWV0cmljIG1vbml0b3JzIGVjMiBjcHUgdXRpbGl6YXRpb24nLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFtzY2FsZVVwUG9saWN5LmFybl0sXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWhpZ2gtY3B1LWFsYXJtLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBsb3dDcHVBbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGB3ZWJhcHAtbG93LWNwdS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB3ZWJhcHAtbG93LWNwdS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0xlc3NUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIG1ldHJpY05hbWU6ICdDUFVVdGlsaXphdGlvbicsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9FQzInLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdUaGlzIG1ldHJpYyBtb25pdG9ycyBlYzIgY3B1IHV0aWxpemF0aW9uJyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbc2NhbGVEb3duUG9saWN5LmFybl0sXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uY29tbW9uVGFncyxcbiAgICAgICAgICBOYW1lOiBgd2ViYXBwLWxvdy1jcHUtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRXhwb3J0IGltcG9ydGFudCB2YWx1ZXNcbiAgICB0aGlzLmxvYWRCYWxhbmNlckRucyA9IGxvYWRCYWxhbmNlci5kbnNOYW1lO1xuICAgIHRoaXMuYnVja2V0TmFtZSA9IGJ1Y2tldC5idWNrZXQ7XG4gICAgdGhpcy5kYXRhYmFzZUVuZHBvaW50ID0gZGF0YWJhc2UuZW5kcG9pbnQ7XG4gICAgdGhpcy52cGNJZCA9IHZwYy5pZDtcbiAgICB0aGlzLmNhY2hlRW5kcG9pbnQgPSBjYWNoZS5lbmRwb2ludHMuYXBwbHkoZW5kcG9pbnRzID0+XG4gICAgICBlbmRwb2ludHMgJiYgZW5kcG9pbnRzLmxlbmd0aCA+IDAgPyBlbmRwb2ludHNbMF0uYWRkcmVzcyB8fCAnJyA6ICcnXG4gICAgKTtcbiAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXBOYW1lID0gYXV0b1NjYWxpbmdHcm91cC5uYW1lO1xuICAgIHRoaXMudGFyZ2V0R3JvdXBBcm4gPSB0YXJnZXRHcm91cC5hcm47XG4gICAgdGhpcy5hbGJTZWN1cml0eUdyb3VwSWQgPSBhbGJTZWN1cml0eUdyb3VwLmlkO1xuICAgIHRoaXMuZWMyU2VjdXJpdHlHcm91cElkID0gZWMyU2VjdXJpdHlHcm91cC5pZDtcbiAgICB0aGlzLnJkc1NlY3VyaXR5R3JvdXBJZCA9IHJkc1NlY3VyaXR5R3JvdXAuaWQ7XG4gICAgdGhpcy5wdWJsaWNTdWJuZXQxSWQgPSBwdWJsaWNTdWJuZXQxLmlkO1xuICAgIHRoaXMucHVibGljU3VibmV0MklkID0gcHVibGljU3VibmV0Mi5pZDtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXQxSWQgPSBwcml2YXRlU3VibmV0MS5pZDtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXQySWQgPSBwcml2YXRlU3VibmV0Mi5pZDtcbiAgICB0aGlzLmVjMlJvbGVBcm4gPSBlYzJSb2xlLmFybjtcbiAgICB0aGlzLmluc3RhbmNlUHJvZmlsZU5hbWUgPSBpbnN0YW5jZVByb2ZpbGUubmFtZTtcbiAgICB0aGlzLnN5c3RlbUxvZ0dyb3VwTmFtZSA9IHN5c3RlbUxvZ0dyb3VwLm5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBsb2FkQmFsYW5jZXJEbnM6IHRoaXMubG9hZEJhbGFuY2VyRG5zLFxuICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXROYW1lLFxuICAgICAgZGF0YWJhc2VFbmRwb2ludDogdGhpcy5kYXRhYmFzZUVuZHBvaW50LFxuICAgICAgdnBjSWQ6IHRoaXMudnBjSWQsXG4gICAgICBjYWNoZUVuZHBvaW50OiB0aGlzLmNhY2hlRW5kcG9pbnQsXG4gICAgICBhdXRvU2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgdGFyZ2V0R3JvdXBBcm46IHRhcmdldEdyb3VwLmFybixcbiAgICAgIGFsYlNlY3VyaXR5R3JvdXBJZDogYWxiU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgIGVjMlNlY3VyaXR5R3JvdXBJZDogZWMyU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgIHJkc1NlY3VyaXR5R3JvdXBJZDogcmRzU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgIHB1YmxpY1N1Ym5ldDFJZDogcHVibGljU3VibmV0MS5pZCxcbiAgICAgIHB1YmxpY1N1Ym5ldDJJZDogcHVibGljU3VibmV0Mi5pZCxcbiAgICAgIHByaXZhdGVTdWJuZXQxSWQ6IHByaXZhdGVTdWJuZXQxLmlkLFxuICAgICAgcHJpdmF0ZVN1Ym5ldDJJZDogcHJpdmF0ZVN1Ym5ldDIuaWQsXG4gICAgICBlYzJSb2xlQXJuOiBlYzJSb2xlLmFybixcbiAgICAgIGluc3RhbmNlUHJvZmlsZU5hbWU6IGluc3RhbmNlUHJvZmlsZS5uYW1lLFxuICAgICAgc3lzdGVtTG9nR3JvdXBOYW1lOiBzeXN0ZW1Mb2dHcm91cC5uYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=