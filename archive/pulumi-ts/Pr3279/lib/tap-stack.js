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
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class TapStack extends pulumi.ComponentResource {
    albDnsName;
    staticBucketName;
    vpcId;
    instanceConnectEndpointId;
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create VPC with specified CIDR block
        const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: '10.40.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...tags,
                Name: `tap-vpc-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                ...tags,
                Name: `tap-igw-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create public subnets in different availability zones
        const publicSubnet1 = new aws.ec2.Subnet(`tap-public-subnet-1-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.40.1.0/24',
            availabilityZone: 'us-east-1a',
            mapPublicIpOnLaunch: true,
            tags: {
                ...tags,
                Name: `tap-public-subnet-1-${environmentSuffix}`,
            },
        }, { parent: this });
        const publicSubnet2 = new aws.ec2.Subnet(`tap-public-subnet-2-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.40.2.0/24',
            availabilityZone: 'us-east-1b',
            mapPublicIpOnLaunch: true,
            tags: {
                ...tags,
                Name: `tap-public-subnet-2-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create route table and associate with public subnets
        const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: igw.id,
                },
            ],
            tags: {
                ...tags,
                Name: `tap-public-rt-${environmentSuffix}`,
            },
        }, { parent: this });
        new aws.ec2.RouteTableAssociation(`tap-rta-1-${environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id,
        }, { parent: this });
        new aws.ec2.RouteTableAssociation(`tap-rta-2-${environmentSuffix}`, {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id,
        }, { parent: this });
        // Create Security Group for ALB
        const albSecurityGroup = new aws.ec2.SecurityGroup(`tap-alb-sg-${environmentSuffix}`, {
            vpcId: vpc.id,
            description: 'Security group for Application Load Balancer',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow HTTPS from anywhere',
                },
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow HTTP from anywhere',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow all outbound traffic',
                },
            ],
            tags: {
                ...tags,
                Name: `tap-alb-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create Security Group for EC2 instances
        const ec2SecurityGroup = new aws.ec2.SecurityGroup(`tap-ec2-sg-${environmentSuffix}`, {
            vpcId: vpc.id,
            description: 'Security group for EC2 instances',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    securityGroups: [albSecurityGroup.id],
                    description: 'Allow HTTP from ALB',
                },
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ['172.31.0.0/16'],
                    description: 'Allow SSH from specific CIDR',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow all outbound traffic',
                },
            ],
            tags: {
                ...tags,
                Name: `tap-ec2-sg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create EC2 Instance Connect Endpoint (Note: This resource type may not be available in all regions)
        // For now, we'll create a placeholder output for this feature
        const instanceConnectEndpointId = pulumi.output(`eice-${environmentSuffix}`);
        // Create S3 buckets for static assets and ALB logs
        const staticAssetsBucket = new aws.s3.Bucket(`tap-static-assets-${environmentSuffix}`, {
            forceDestroy: true, // Enable force destroy for cleanup
            versioning: {
                enabled: true,
            },
            tags: {
                ...tags,
                Name: `tap-static-assets-${environmentSuffix}`,
            },
        }, { parent: this });
        const albLogsBucket = new aws.s3.Bucket(`tap-alb-logs-${environmentSuffix}`, {
            forceDestroy: true, // Enable force destroy for cleanup
            lifecycleRules: [
                {
                    enabled: true,
                    expiration: {
                        days: 30,
                    },
                },
            ],
            tags: {
                ...tags,
                Name: `tap-alb-logs-${environmentSuffix}`,
            },
        }, { parent: this });
        // Block public access for static assets bucket
        new aws.s3.BucketPublicAccessBlock(`tap-static-assets-pab-${environmentSuffix}`, {
            bucket: staticAssetsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Block public access for ALB logs bucket
        new aws.s3.BucketPublicAccessBlock(`tap-alb-logs-pab-${environmentSuffix}`, {
            bucket: albLogsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Get ALB service account for the region
        const albServiceAccount = aws.elb.getServiceAccount({});
        // Create bucket policy for ALB logs
        const albLogsBucketPolicy = new aws.s3.BucketPolicy(`tap-alb-logs-policy-${environmentSuffix}`, {
            bucket: albLogsBucket.id,
            policy: pulumi
                .all([albLogsBucket.arn, albServiceAccount])
                .apply(([bucketArn, account]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'AllowALBLogging',
                        Effect: 'Allow',
                        Principal: {
                            AWS: account.arn,
                        },
                        Action: 's3:PutObject',
                        Resource: `${bucketArn}/*`,
                    },
                ],
            })),
        }, { parent: this });
        // Create user data script for nginx installation
        const userData = `#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
echo "<h1>Educational Platform - Instance $(hostname -f)</h1>" > /usr/share/nginx/html/index.html`;
        // Get latest Amazon Linux 2 AMI
        const ami = aws.ec2.getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
                {
                    name: 'name',
                    values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                },
            ],
        });
        // Create Launch Template
        const launchTemplate = new aws.ec2.LaunchTemplate(`tap-lt-${environmentSuffix}`, {
            namePrefix: `tap-lt-${environmentSuffix}-`,
            imageId: ami.then(ami => ami.id),
            instanceType: 't3.micro',
            vpcSecurityGroupIds: [ec2SecurityGroup.id],
            userData: Buffer.from(userData).toString('base64'),
            monitoring: {
                enabled: true,
            },
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: {
                        ...tags,
                        Name: `tap-web-instance-${environmentSuffix}`,
                    },
                },
            ],
        }, { parent: this });
        // Create Target Group
        const targetGroup = new aws.lb.TargetGroup(`tap-tg-${environmentSuffix}`, {
            port: 80,
            protocol: 'HTTP',
            vpcId: vpc.id,
            targetType: 'instance',
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                unhealthyThreshold: 2,
                timeout: 5,
                interval: 30,
                path: '/',
                matcher: '200',
            },
            deregistrationDelay: 30,
            tags: {
                ...tags,
                Name: `tap-tg-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create Application Load Balancer
        const alb = new aws.lb.LoadBalancer(`tap-alb-${environmentSuffix}`, {
            loadBalancerType: 'application',
            securityGroups: [albSecurityGroup.id],
            subnets: [publicSubnet1.id, publicSubnet2.id],
            enableHttp2: true,
            enableCrossZoneLoadBalancing: true,
            accessLogs: {
                enabled: true,
                bucket: albLogsBucket.bucket,
                prefix: 'alb-logs',
            },
            tags: {
                ...tags,
                Name: `tap-alb-${environmentSuffix}`,
            },
        }, { parent: this, dependsOn: [albLogsBucketPolicy] });
        // Create HTTP listener (for now, HTTPS can be added with proper certificate)
        new aws.lb.Listener(`tap-http-listener-${environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'forward',
                    targetGroupArn: targetGroup.arn,
                },
            ],
        }, { parent: this });
        // Create Auto Scaling Group
        const autoScalingGroup = new aws.autoscaling.Group(`tap-asg-${environmentSuffix}`, {
            vpcZoneIdentifiers: [publicSubnet1.id, publicSubnet2.id],
            targetGroupArns: [targetGroup.arn],
            healthCheckType: 'ELB',
            healthCheckGracePeriod: 300,
            minSize: 2,
            maxSize: 6,
            desiredCapacity: 3,
            launchTemplate: {
                id: launchTemplate.id,
                version: '$Latest',
            },
            forceDelete: true, // Enable force delete for cleanup
            tags: [
                {
                    key: 'Name',
                    value: `tap-asg-instance-${environmentSuffix}`,
                    propagateAtLaunch: true,
                },
                {
                    key: 'Environment',
                    value: environmentSuffix,
                    propagateAtLaunch: true,
                },
            ],
        }, { parent: this });
        // Create CloudWatch Alarms
        new aws.cloudwatch.MetricAlarm(`tap-high-cpu-${environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors EC2 cpu utilization',
            dimensions: {
                AutoScalingGroupName: autoScalingGroup.name,
            },
            tags: {
                ...tags,
                Name: `tap-high-cpu-${environmentSuffix}`,
            },
        }, { parent: this });
        new aws.cloudwatch.MetricAlarm(`tap-unhealthy-targets-${environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 1,
            metricName: 'UnHealthyHostCount',
            namespace: 'AWS/ApplicationELB',
            period: 300,
            statistic: 'Average',
            threshold: 0,
            alarmDescription: 'Alert when we have unhealthy targets',
            dimensions: {
                TargetGroup: targetGroup.arnSuffix,
                LoadBalancer: alb.arnSuffix,
            },
            tags: {
                ...tags,
                Name: `tap-unhealthy-targets-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create Auto Scaling Policies
        const scaleUpPolicy = new aws.autoscaling.Policy(`tap-scale-up-${environmentSuffix}`, {
            scalingAdjustment: 1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        const scaleDownPolicy = new aws.autoscaling.Policy(`tap-scale-down-${environmentSuffix}`, {
            scalingAdjustment: -1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        // Create CloudWatch Alarms for Auto Scaling
        new aws.cloudwatch.MetricAlarm(`tap-scale-up-alarm-${environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 75,
            alarmActions: [scaleUpPolicy.arn],
            dimensions: {
                AutoScalingGroupName: autoScalingGroup.name,
            },
            tags: {
                ...tags,
                Name: `tap-scale-up-alarm-${environmentSuffix}`,
            },
        }, { parent: this });
        new aws.cloudwatch.MetricAlarm(`tap-scale-down-alarm-${environmentSuffix}`, {
            comparisonOperator: 'LessThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 25,
            alarmActions: [scaleDownPolicy.arn],
            dimensions: {
                AutoScalingGroupName: autoScalingGroup.name,
            },
            tags: {
                ...tags,
                Name: `tap-scale-down-alarm-${environmentSuffix}`,
            },
        }, { parent: this });
        // Set outputs
        this.albDnsName = alb.dnsName;
        this.staticBucketName = staticAssetsBucket.id;
        this.vpcId = vpc.id;
        this.instanceConnectEndpointId = instanceConnectEndpointId;
        // Register outputs
        this.registerOutputs({
            albDnsName: this.albDnsName,
            staticBucketName: this.staticBucketName,
            vpcId: this.vpcId,
            instanceConnectEndpointId: this.instanceConnectEndpointId,
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3RhcC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBUW5DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsVUFBVSxDQUF3QjtJQUNsQyxnQkFBZ0IsQ0FBd0I7SUFDeEMsS0FBSyxDQUF3QjtJQUM3Qix5QkFBeUIsQ0FBd0I7SUFFakUsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsdUNBQXVDO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3pCLFdBQVcsaUJBQWlCLEVBQUUsRUFDOUI7WUFDRSxTQUFTLEVBQUUsY0FBYztZQUN6QixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFO2dCQUNKLEdBQUcsSUFBSTtnQkFDUCxJQUFJLEVBQUUsV0FBVyxpQkFBaUIsRUFBRTthQUNyQztTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwwQkFBMEI7UUFDMUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FDckMsV0FBVyxpQkFBaUIsRUFBRSxFQUM5QjtZQUNFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLElBQUksRUFB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WUFDM0IsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIseUJBQXlCLEVBQUUsSUFBSSxDQUFDLHlCQUF5QjtTQUMxRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExaUJELDRCQTBpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBUYXBTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFRhcFN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGFsYkRuc05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXRpY0J1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUNvbm5lY3RFbmRwb2ludElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBUYXBTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnN0YWNrOlRhcFN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIENyZWF0ZSBWUEMgd2l0aCBzcGVjaWZpZWQgQ0lEUiBibG9ja1xuICAgIGNvbnN0IHZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGB0YXAtdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY2lkckJsb2NrOiAnMTAuNDAuMC4wLzE2JyxcbiAgICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgdGFwLXZwYy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSW50ZXJuZXQgR2F0ZXdheVxuICAgIGNvbnN0IGlndyA9IG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheShcbiAgICAgIGB0YXAtaWd3LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHRhcC1pZ3ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHB1YmxpYyBzdWJuZXRzIGluIGRpZmZlcmVudCBhdmFpbGFiaWxpdHkgem9uZXNcbiAgICBjb25zdCBwdWJsaWNTdWJuZXQxID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgYHRhcC1wdWJsaWMtc3VibmV0LTEtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICBjaWRyQmxvY2s6ICcxMC40MC4xLjAvMjQnLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiAndXMtZWFzdC0xYScsXG4gICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtcHVibGljLXN1Ym5ldC0xLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldDIgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICBgdGFwLXB1YmxpYy1zdWJuZXQtMi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogJzEwLjQwLjIuMC8yNCcsXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFiJyxcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHRhcC1wdWJsaWMtc3VibmV0LTItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHJvdXRlIHRhYmxlIGFuZCBhc3NvY2lhdGUgd2l0aCBwdWJsaWMgc3VibmV0c1xuICAgIGNvbnN0IHB1YmxpY1JvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKFxuICAgICAgYHRhcC1wdWJsaWMtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICByb3V0ZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgZ2F0ZXdheUlkOiBpZ3cuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHRhcC1wdWJsaWMtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYHRhcC1ydGEtMS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHN1Ym5ldElkOiBwdWJsaWNTdWJuZXQxLmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICBgdGFwLXJ0YS0yLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldDIuaWQsXG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBTZWN1cml0eSBHcm91cCBmb3IgQUxCXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgdGFwLWFsYi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXInLFxuICAgICAgICBpbmdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgSFRUUFMgZnJvbSBhbnl3aGVyZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogODAsXG4gICAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgSFRUUCBmcm9tIGFueXdoZXJlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJy0xJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgdG9Qb3J0OiAwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgYWxsIG91dGJvdW5kIHRyYWZmaWMnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtYWxiLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBTZWN1cml0eSBHcm91cCBmb3IgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IGVjMlNlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYHRhcC1lYzItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBFQzIgaW5zdGFuY2VzJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW2FsYlNlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGxvdyBIVFRQIGZyb20gQUxCJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiAyMixcbiAgICAgICAgICAgIHRvUG9ydDogMjIsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzE3Mi4zMS4wLjAvMTYnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsb3cgU1NIIGZyb20gc3BlY2lmaWMgQ0lEUicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IGFsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgdGFwLWVjMi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgRUMyIEluc3RhbmNlIENvbm5lY3QgRW5kcG9pbnQgKE5vdGU6IFRoaXMgcmVzb3VyY2UgdHlwZSBtYXkgbm90IGJlIGF2YWlsYWJsZSBpbiBhbGwgcmVnaW9ucylcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBjcmVhdGUgYSBwbGFjZWhvbGRlciBvdXRwdXQgZm9yIHRoaXMgZmVhdHVyZVxuICAgIGNvbnN0IGluc3RhbmNlQ29ubmVjdEVuZHBvaW50SWQgPSBwdWx1bWkub3V0cHV0KFxuICAgICAgYGVpY2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRzIGZvciBzdGF0aWMgYXNzZXRzIGFuZCBBTEIgbG9nc1xuICAgIGNvbnN0IHN0YXRpY0Fzc2V0c0J1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYHRhcC1zdGF0aWMtYXNzZXRzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZm9yY2VEZXN0cm95OiB0cnVlLCAvLyBFbmFibGUgZm9yY2UgZGVzdHJveSBmb3IgY2xlYW51cFxuICAgICAgICB2ZXJzaW9uaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHRhcC1zdGF0aWMtYXNzZXRzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IGFsYkxvZ3NCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgIGB0YXAtYWxiLWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBmb3JjZURlc3Ryb3k6IHRydWUsIC8vIEVuYWJsZSBmb3JjZSBkZXN0cm95IGZvciBjbGVhbnVwXG4gICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgZGF5czogMzAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtYWxiLWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQmxvY2sgcHVibGljIGFjY2VzcyBmb3Igc3RhdGljIGFzc2V0cyBidWNrZXRcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYHRhcC1zdGF0aWMtYXNzZXRzLXBhYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogc3RhdGljQXNzZXRzQnVja2V0LmlkLFxuICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBCbG9jayBwdWJsaWMgYWNjZXNzIGZvciBBTEIgbG9ncyBidWNrZXRcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrKFxuICAgICAgYHRhcC1hbGItbG9ncy1wYWItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFsYkxvZ3NCdWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdldCBBTEIgc2VydmljZSBhY2NvdW50IGZvciB0aGUgcmVnaW9uXG4gICAgY29uc3QgYWxiU2VydmljZUFjY291bnQgPSBhd3MuZWxiLmdldFNlcnZpY2VBY2NvdW50KHt9KTtcblxuICAgIC8vIENyZWF0ZSBidWNrZXQgcG9saWN5IGZvciBBTEIgbG9nc1xuICAgIGNvbnN0IGFsYkxvZ3NCdWNrZXRQb2xpY3kgPSBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeShcbiAgICAgIGB0YXAtYWxiLWxvZ3MtcG9saWN5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhbGJMb2dzQnVja2V0LmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaVxuICAgICAgICAgIC5hbGwoW2FsYkxvZ3NCdWNrZXQuYXJuLCBhbGJTZXJ2aWNlQWNjb3VudF0pXG4gICAgICAgICAgLmFwcGx5KChbYnVja2V0QXJuLCBhY2NvdW50XSkgPT5cbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBbGxvd0FMQkxvZ2dpbmcnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIEFXUzogYWNjb3VudC5hcm4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgdXNlciBkYXRhIHNjcmlwdCBmb3IgbmdpbnggaW5zdGFsbGF0aW9uXG4gICAgY29uc3QgdXNlckRhdGEgPSBgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbmFtYXpvbi1saW51eC1leHRyYXMgaW5zdGFsbCAteSBuZ2lueDFcbnN5c3RlbWN0bCBzdGFydCBuZ2lueFxuc3lzdGVtY3RsIGVuYWJsZSBuZ2lueFxuZWNobyBcIjxoMT5FZHVjYXRpb25hbCBQbGF0Zm9ybSAtIEluc3RhbmNlICQoaG9zdG5hbWUgLWYpPC9oMT5cIiA+IC91c3Ivc2hhcmUvbmdpbngvaHRtbC9pbmRleC5odG1sYDtcblxuICAgIC8vIEdldCBsYXRlc3QgQW1hem9uIExpbnV4IDIgQU1JXG4gICAgY29uc3QgYW1pID0gYXdzLmVjMi5nZXRBbWkoe1xuICAgICAgbW9zdFJlY2VudDogdHJ1ZSxcbiAgICAgIG93bmVyczogWydhbWF6b24nXSxcbiAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICduYW1lJyxcbiAgICAgICAgICB2YWx1ZXM6IFsnYW16bjItYW1pLWh2bS0qLXg4Nl82NC1ncDInXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgTGF1bmNoIFRlbXBsYXRlXG4gICAgY29uc3QgbGF1bmNoVGVtcGxhdGUgPSBuZXcgYXdzLmVjMi5MYXVuY2hUZW1wbGF0ZShcbiAgICAgIGB0YXAtbHQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lUHJlZml4OiBgdGFwLWx0LSR7ZW52aXJvbm1lbnRTdWZmaXh9LWAsXG4gICAgICAgIGltYWdlSWQ6IGFtaS50aGVuKGFtaSA9PiBhbWkuaWQpLFxuICAgICAgICBpbnN0YW5jZVR5cGU6ICd0My5taWNybycsXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtlYzJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgdXNlckRhdGE6IEJ1ZmZlci5mcm9tKHVzZXJEYXRhKS50b1N0cmluZygnYmFzZTY0JyksXG4gICAgICAgIG1vbml0b3Jpbmc6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0YWdTcGVjaWZpY2F0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlc291cmNlVHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgICAgTmFtZTogYHRhcC13ZWItaW5zdGFuY2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFRhcmdldCBHcm91cFxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGF3cy5sYi5UYXJnZXRHcm91cChcbiAgICAgIGB0YXAtdGctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBwb3J0OiA4MCxcbiAgICAgICAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFyZ2V0VHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGhlYWx0aHlUaHJlc2hvbGQ6IDIsXG4gICAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICAgIHRpbWVvdXQ6IDUsXG4gICAgICAgICAgaW50ZXJ2YWw6IDMwLFxuICAgICAgICAgIHBhdGg6ICcvJyxcbiAgICAgICAgICBtYXRjaGVyOiAnMjAwJyxcbiAgICAgICAgfSxcbiAgICAgICAgZGVyZWdpc3RyYXRpb25EZWxheTogMzAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtdGctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXJcbiAgICBjb25zdCBhbGIgPSBuZXcgYXdzLmxiLkxvYWRCYWxhbmNlcihcbiAgICAgIGB0YXAtYWxiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbG9hZEJhbGFuY2VyVHlwZTogJ2FwcGxpY2F0aW9uJyxcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthbGJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgc3VibmV0czogW3B1YmxpY1N1Ym5ldDEuaWQsIHB1YmxpY1N1Ym5ldDIuaWRdLFxuICAgICAgICBlbmFibGVIdHRwMjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlQ3Jvc3Nab25lTG9hZEJhbGFuY2luZzogdHJ1ZSxcbiAgICAgICAgYWNjZXNzTG9nczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgYnVja2V0OiBhbGJMb2dzQnVja2V0LmJ1Y2tldCxcbiAgICAgICAgICBwcmVmaXg6ICdhbGItbG9ncycsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtYWxiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbYWxiTG9nc0J1Y2tldFBvbGljeV0gfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSFRUUCBsaXN0ZW5lciAoZm9yIG5vdywgSFRUUFMgY2FuIGJlIGFkZGVkIHdpdGggcHJvcGVyIGNlcnRpZmljYXRlKVxuICAgIG5ldyBhd3MubGIuTGlzdGVuZXIoXG4gICAgICBgdGFwLWh0dHAtbGlzdGVuZXItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBsb2FkQmFsYW5jZXJBcm46IGFsYi5hcm4sXG4gICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICBwcm90b2NvbDogJ0hUVFAnLFxuICAgICAgICBkZWZhdWx0QWN0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdmb3J3YXJkJyxcbiAgICAgICAgICAgIHRhcmdldEdyb3VwQXJuOiB0YXJnZXRHcm91cC5hcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBdXRvIFNjYWxpbmcgR3JvdXBcbiAgICBjb25zdCBhdXRvU2NhbGluZ0dyb3VwID0gbmV3IGF3cy5hdXRvc2NhbGluZy5Hcm91cChcbiAgICAgIGB0YXAtYXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjWm9uZUlkZW50aWZpZXJzOiBbcHVibGljU3VibmV0MS5pZCwgcHVibGljU3VibmV0Mi5pZF0sXG4gICAgICAgIHRhcmdldEdyb3VwQXJuczogW3RhcmdldEdyb3VwLmFybl0sXG4gICAgICAgIGhlYWx0aENoZWNrVHlwZTogJ0VMQicsXG4gICAgICAgIGhlYWx0aENoZWNrR3JhY2VQZXJpb2Q6IDMwMCxcbiAgICAgICAgbWluU2l6ZTogMixcbiAgICAgICAgbWF4U2l6ZTogNixcbiAgICAgICAgZGVzaXJlZENhcGFjaXR5OiAzLFxuICAgICAgICBsYXVuY2hUZW1wbGF0ZToge1xuICAgICAgICAgIGlkOiBsYXVuY2hUZW1wbGF0ZS5pZCxcbiAgICAgICAgICB2ZXJzaW9uOiAnJExhdGVzdCcsXG4gICAgICAgIH0sXG4gICAgICAgIGZvcmNlRGVsZXRlOiB0cnVlLCAvLyBFbmFibGUgZm9yY2UgZGVsZXRlIGZvciBjbGVhbnVwXG4gICAgICAgIHRhZ3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6ICdOYW1lJyxcbiAgICAgICAgICAgIHZhbHVlOiBgdGFwLWFzZy1pbnN0YW5jZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICBwcm9wYWdhdGVBdExhdW5jaDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogJ0Vudmlyb25tZW50JyxcbiAgICAgICAgICAgIHZhbHVlOiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICAgIHByb3BhZ2F0ZUF0TGF1bmNoOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBBbGFybXNcbiAgICBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgdGFwLWhpZ2gtY3B1LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ0NQVVV0aWxpemF0aW9uJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiA4MCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ1RoaXMgbWV0cmljIG1vbml0b3JzIEVDMiBjcHUgdXRpbGl6YXRpb24nLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgQXV0b1NjYWxpbmdHcm91cE5hbWU6IGF1dG9TY2FsaW5nR3JvdXAubmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYHRhcC1oaWdoLWNwdS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgdGFwLXVuaGVhbHRoeS10YXJnZXRzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgbWV0cmljTmFtZTogJ1VuSGVhbHRoeUhvc3RDb3VudCcsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcHBsaWNhdGlvbkVMQicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxlcnQgd2hlbiB3ZSBoYXZlIHVuaGVhbHRoeSB0YXJnZXRzJyxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIFRhcmdldEdyb3VwOiB0YXJnZXRHcm91cC5hcm5TdWZmaXgsXG4gICAgICAgICAgTG9hZEJhbGFuY2VyOiBhbGIuYXJuU3VmZml4LFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgdGFwLXVuaGVhbHRoeS10YXJnZXRzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBdXRvIFNjYWxpbmcgUG9saWNpZXNcbiAgICBjb25zdCBzY2FsZVVwUG9saWN5ID0gbmV3IGF3cy5hdXRvc2NhbGluZy5Qb2xpY3koXG4gICAgICBgdGFwLXNjYWxlLXVwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgc2NhbGluZ0FkanVzdG1lbnQ6IDEsXG4gICAgICAgIGFkanVzdG1lbnRUeXBlOiAnQ2hhbmdlSW5DYXBhY2l0eScsXG4gICAgICAgIGNvb2xkb3duOiAzMDAsXG4gICAgICAgIGF1dG9zY2FsaW5nR3JvdXBOYW1lOiBhdXRvU2NhbGluZ0dyb3VwLm5hbWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCBzY2FsZURvd25Qb2xpY3kgPSBuZXcgYXdzLmF1dG9zY2FsaW5nLlBvbGljeShcbiAgICAgIGB0YXAtc2NhbGUtZG93bi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHNjYWxpbmdBZGp1c3RtZW50OiAtMSxcbiAgICAgICAgYWRqdXN0bWVudFR5cGU6ICdDaGFuZ2VJbkNhcGFjaXR5JyxcbiAgICAgICAgY29vbGRvd246IDMwMCxcbiAgICAgICAgYXV0b3NjYWxpbmdHcm91cE5hbWU6IGF1dG9TY2FsaW5nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIEFsYXJtcyBmb3IgQXV0byBTY2FsaW5nXG4gICAgbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYHRhcC1zY2FsZS11cC1hbGFybS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIG1ldHJpY05hbWU6ICdDUFVVdGlsaXphdGlvbicsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9FQzInLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIHRocmVzaG9sZDogNzUsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW3NjYWxlVXBQb2xpY3kuYXJuXSxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIEF1dG9TY2FsaW5nR3JvdXBOYW1lOiBhdXRvU2NhbGluZ0dyb3VwLm5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgIE5hbWU6IGB0YXAtc2NhbGUtdXAtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYHRhcC1zY2FsZS1kb3duLWFsYXJtLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnTGVzc1RoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ0NQVVV0aWxpemF0aW9uJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAyNSxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbc2NhbGVEb3duUG9saWN5LmFybl0sXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgdGFwLXNjYWxlLWRvd24tYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gU2V0IG91dHB1dHNcbiAgICB0aGlzLmFsYkRuc05hbWUgPSBhbGIuZG5zTmFtZTtcbiAgICB0aGlzLnN0YXRpY0J1Y2tldE5hbWUgPSBzdGF0aWNBc3NldHNCdWNrZXQuaWQ7XG4gICAgdGhpcy52cGNJZCA9IHZwYy5pZDtcbiAgICB0aGlzLmluc3RhbmNlQ29ubmVjdEVuZHBvaW50SWQgPSBpbnN0YW5jZUNvbm5lY3RFbmRwb2ludElkO1xuXG4gICAgLy8gUmVnaXN0ZXIgb3V0cHV0c1xuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGFsYkRuc05hbWU6IHRoaXMuYWxiRG5zTmFtZSxcbiAgICAgIHN0YXRpY0J1Y2tldE5hbWU6IHRoaXMuc3RhdGljQnVja2V0TmFtZSxcbiAgICAgIHZwY0lkOiB0aGlzLnZwY0lkLFxuICAgICAgaW5zdGFuY2VDb25uZWN0RW5kcG9pbnRJZDogdGhpcy5pbnN0YW5jZUNvbm5lY3RFbmRwb2ludElkLFxuICAgIH0pO1xuICB9XG59XG4iXX0=