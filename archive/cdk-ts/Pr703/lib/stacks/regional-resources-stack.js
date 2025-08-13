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
exports.RegionalResourcesStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const autoscaling = __importStar(require("aws-cdk-lib/aws-autoscaling"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const elbv2 = __importStar(require("aws-cdk-lib/aws-elasticloadbalancingv2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class RegionalResourcesStack extends cdk.Stack {
    contentBucket;
    loadBalancer;
    healthCheck;
    vpc;
    hostedZone;
    dnsRecord;
    constructor(scope, id, props) {
        super(scope, id, props);
        const environmentSuffix = props.environmentSuffix || 'dev';
        const regionSuffix = props.isPrimary ? 'primary' : 'secondary';
        // Create VPC with public and private subnets
        this.vpc = new ec2.Vpc(this, 'VPC', {
            maxAzs: 2,
            natGateways: 1, // Single NAT Gateway as specified
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'PublicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'PrivateSubnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });
        // Create S3 bucket for content
        this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
            bucketName: `globalmountpoint-content-${props.region}-${environmentSuffix}`,
            versioned: true,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
        });
        // Configure S3 Cross-Region Replication for primary bucket
        if (props.isPrimary && props.replicationRoleArn && props.secondaryRegion) {
            const cfnBucket = this.contentBucket.node.defaultChild;
            cfnBucket.replicationConfiguration = {
                role: props.replicationRoleArn,
                rules: [
                    {
                        id: 'ReplicateToSecondaryRegion',
                        destination: {
                            bucket: `arn:aws:s3:::globalmountpoint-content-${props.secondaryRegion}-${environmentSuffix}`,
                            storageClass: 'STANDARD',
                        },
                        priority: 1,
                        deleteMarkerReplication: {
                            status: 'Enabled',
                        },
                        filter: {
                            prefix: '',
                        },
                        status: 'Enabled',
                    },
                ],
            };
        }
        // IAM role for EC2 instances to access S3 (with wildcard resources to avoid circular dependency)
        const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ],
            inlinePolicies: {
                S3MountPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['s3:GetObject', 's3:ListBucket'],
                            resources: [
                                'arn:aws:s3:::globalmountpoint-content-*',
                                'arn:aws:s3:::globalmountpoint-content-*/*',
                            ],
                        }),
                    ],
                }),
            },
        });
        // S3 Replication removed for simplification
        // Security Groups
        const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
            vpc: this.vpc,
            description: 'Security group for Application Load Balancer',
            allowAllOutbound: true,
        });
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from internet');
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from internet');
        const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
            vpc: this.vpc,
            description: 'Security group for EC2 instances',
            allowAllOutbound: true,
        });
        ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(80), 'Allow HTTP traffic from ALB');
        ec2SecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.tcp(22), 'Allow SSH from private networks');
        // User data script for EC2 instances
        const userData = ec2.UserData.forLinux();
        userData.addCommands('#!/bin/bash', 'yum update -y', '', '# Install Nginx', 'yum install -y nginx', 'amazon-linux-extras install nginx1', 'systemctl enable nginx', '', '# Install AWS CLI and required tools', 'yum install -y awscli fuse', '', '# Install S3 Mountpoint', 'wget https://s3.amazonaws.com/mountpoint-s3-release/latest/x86_64/mount-s3.rpm', 'yum install -y ./mount-s3.rpm', '', '# Create mountpoint directory', 'mkdir -p /var/www/html', 'chown nginx:nginx /var/www/html', '', '# Mount S3 bucket using S3 Mountpoint', `mount-s3 ${this.contentBucket.bucketName} /var/www/html --allow-other --uid=$(id -u nginx) --gid=$(id -g nginx)`, '', '# Configure Nginx', 'cat > /etc/nginx/nginx.conf << EOF', 'user nginx;', 'worker_processes auto;', 'error_log /var/log/nginx/error.log;', 'pid /run/nginx.pid;', '', 'events {', '    worker_connections 1024;', '}', '', 'http {', '    include /etc/nginx/mime.types;', '    default_type application/octet-stream;', '    sendfile on;', '    keepalive_timeout 65;', '', '    server {', '        listen 80;', '        server_name _;', '        root /var/www/html;', '        index index.html index.htm;', '', '        location /health {', '            access_log off;', '            return 200 "healthy\\n";', '            add_header Content-Type text/plain;', '        }', '    }', '}', 'EOF', '', "# Create a default index.html if it doesn't exist", 'if [ ! -f /var/www/html/index.html ]; then', `    echo "<h1>Global Mountpoint Website - ${props.region}</h1>" > /var/www/html/index.html`, 'fi', '', '# Start Nginx', 'systemctl start nginx', '', '# Add S3 mount to fstab for persistence', `echo "${this.contentBucket.bucketName} /var/www/html fuse.mount-s3 _netdev,allow_other,uid=$(id -u nginx),gid=$(id -g nginx) 0 0" >> /etc/fstab`);
        // Launch Template
        const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            userData,
            securityGroup: ec2SecurityGroup,
            role: ec2Role,
        });
        // Application Load Balancer
        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
            vpc: this.vpc,
            internetFacing: true,
            securityGroup: albSecurityGroup,
        });
        // Target Group
        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            vpc: this.vpc,
            healthCheck: {
                enabled: true,
                path: '/health',
                healthyHttpCodes: '200',
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3,
            },
        });
        // ALB Listener
        this.loadBalancer.addListener('Listener', {
            port: 80,
            defaultTargetGroups: [targetGroup],
        });
        // Auto Scaling Group
        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: this.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            launchTemplate,
            minCapacity: 1,
            maxCapacity: 1, // Initially set to 1 as specified
            desiredCapacity: 1,
            healthCheck: autoscaling.HealthCheck.elb({
                grace: cdk.Duration.minutes(5),
            }),
        });
        // Attach ASG to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        // CPU-based scaling policy
        autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 70,
        });
        // Health check for this region's ALB using proper configuration
        this.healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
            type: 'HTTP',
            healthCheckConfig: {
                type: 'HTTP',
                resourcePath: '/health',
                fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
                requestInterval: 30,
                failureThreshold: 3,
            },
        });
        if (props.isPrimary) {
            // Primary DNS record with failover routing
            this.dnsRecord = new route53.CfnRecordSet(this, 'PrimaryDNSRecord', {
                hostedZoneId: props.zoneId,
                name: props.domainName,
                type: 'A',
                setIdentifier: 'primary',
                failover: 'PRIMARY',
                aliasTarget: {
                    dnsName: this.loadBalancer.loadBalancerDnsName,
                    hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
                },
                healthCheckId: this.healthCheck.attrHealthCheckId,
            });
        }
        else {
            // Secondary DNS record with failover routing
            this.dnsRecord = new route53.CfnRecordSet(this, 'SecondaryDNSRecord', {
                hostedZoneId: props.zoneId,
                name: props.domainName,
                type: 'A',
                setIdentifier: 'secondary',
                failover: 'SECONDARY',
                aliasTarget: {
                    dnsName: this.loadBalancer.loadBalancerDnsName,
                    hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
                },
                healthCheckId: this.healthCheck.attrHealthCheckId,
            });
            new cdk.CfnOutput(this, 'SecondaryDNSCreated', {
                value: 'Secondary DNS record created successfully',
                description: 'DNS failover is now active between regions',
            });
        }
        // Outputs
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: this.loadBalancer.loadBalancerDnsName,
            description: `Load Balancer DNS name for ${props.region}`,
        });
        new cdk.CfnOutput(this, 'ContentBucketName', {
            value: this.contentBucket.bucketName,
            description: `S3 Content bucket name for ${props.region}`,
        });
        new cdk.CfnOutput(this, 'VPCId', {
            value: this.vpc.vpcId,
            description: `VPC ID for ${props.region}`,
        });
        // DNS-related outputs
        if (props.isPrimary) {
            new cdk.CfnOutput(this, 'WebsiteURL', {
                value: `http://${props.domainName}`,
                description: 'Website URL with DNS failover',
            });
            new cdk.CfnOutput(this, 'HostedZoneId', {
                value: props.zoneId,
                description: 'Hosted Zone ID used for DNS records',
            });
        }
        new cdk.CfnOutput(this, 'RegionType', {
            value: props.isPrimary
                ? 'Primary Region (DNS + Infrastructure)'
                : 'Secondary Region (Infrastructure Only)',
            description: `Region type for ${props.region}`,
        });
        // ALB details for manual secondary DNS record creation
        new cdk.CfnOutput(this, 'ALBDNSName', {
            value: this.loadBalancer.loadBalancerDnsName,
            description: `ALB DNS name for ${props.region} - use for manual DNS record creation`,
        });
        new cdk.CfnOutput(this, 'ALBCanonicalHostedZoneId', {
            value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
            description: `ALB canonical hosted zone ID for ${props.region} - use for manual DNS record creation`,
        });
        new cdk.CfnOutput(this, 'HealthCheckId', {
            value: this.healthCheck.attrHealthCheckId,
            description: `Health check ID for ${props.region} - use for manual DNS record creation`,
        });
        // Regional infrastructure complete
        // Add tags
        cdk.Tags.of(this).add('Stack', 'RegionalResources');
        cdk.Tags.of(this).add('Environment', environmentSuffix);
        cdk.Tags.of(this).add('Region', props.region);
        cdk.Tags.of(this).add('RegionType', regionSuffix);
    }
}
exports.RegionalResourcesStack = RegionalResourcesStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaW9uYWwtcmVzb3VyY2VzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVnaW9uYWwtcmVzb3VyY2VzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5RUFBMkQ7QUFDM0QseURBQTJDO0FBQzNDLDhFQUFnRTtBQUNoRSx5REFBMkM7QUFDM0MsaUVBQW1EO0FBQ25ELHVEQUF5QztBQWF6QyxNQUFhLHNCQUF1QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ25DLGFBQWEsQ0FBWTtJQUN6QixZQUFZLENBQWdDO0lBQzVDLFdBQVcsQ0FBeUI7SUFDcEMsR0FBRyxDQUFVO0lBQ2IsVUFBVSxDQUFzQjtJQUNoQyxTQUFTLENBQXdCO0lBRWpELFlBQ0UsS0FBZ0IsRUFDaEIsRUFBVSxFQUNWLEtBQWtDO1FBRWxDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMzRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUUvRCw2Q0FBNkM7UUFDN0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUNsQyxNQUFNLEVBQUUsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLEVBQUUsa0NBQWtDO1lBQ2xELG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsY0FBYztvQkFDcEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTtpQkFDbEM7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7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QUMsWUFBWSxDQUFDLGlDQUFpQztZQUMxRCxXQUFXLEVBQUUsb0NBQW9DLEtBQUssQ0FBQyxNQUFNLHVDQUF1QztTQUNyRyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUI7WUFDekMsV0FBVyxFQUFFLHVCQUF1QixLQUFLLENBQUMsTUFBTSx1Q0FBdUM7U0FDeEYsQ0FBQyxDQUFDO1FBRUgsbUNBQW1DO1FBRW5DLFdBQVc7UUFDWCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDcEQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBblhELHdEQW1YQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmludGVyZmFjZSBSZWdpb25hbFJlc291cmNlc1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICByZWdpb246IHN0cmluZztcbiAgaXNQcmltYXJ5OiBib29sZWFuO1xuICBkb21haW5OYW1lOiBzdHJpbmc7XG4gIHpvbmVJZDogc3RyaW5nO1xuICBzZWNvbmRhcnlSZWdpb24/OiBzdHJpbmc7XG4gIHJlcGxpY2F0aW9uUm9sZUFybj86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJlZ2lvbmFsUmVzb3VyY2VzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgY29udGVudEJ1Y2tldDogczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VyOiBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcjtcbiAgcHVibGljIHJlYWRvbmx5IGhlYWx0aENoZWNrOiByb3V0ZTUzLkNmbkhlYWx0aENoZWNrO1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBlYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgaG9zdGVkWm9uZT86IHJvdXRlNTMuSG9zdGVkWm9uZTtcbiAgcHVibGljIHJlYWRvbmx5IGRuc1JlY29yZD86IHJvdXRlNTMuQ2ZuUmVjb3JkU2V0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHNjb3BlOiBDb25zdHJ1Y3QsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBwcm9wczogUmVnaW9uYWxSZXNvdXJjZXNTdGFja1Byb3BzXG4gICkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCByZWdpb25TdWZmaXggPSBwcm9wcy5pc1ByaW1hcnkgPyAncHJpbWFyeScgOiAnc2Vjb25kYXJ5JztcblxuICAgIC8vIENyZWF0ZSBWUEMgd2l0aCBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0c1xuICAgIHRoaXMudnBjID0gbmV3IGVjMi5WcGModGhpcywgJ1ZQQycsIHtcbiAgICAgIG1heEF6czogMixcbiAgICAgIG5hdEdhdGV3YXlzOiAxLCAvLyBTaW5nbGUgTkFUIEdhdGV3YXkgYXMgc3BlY2lmaWVkXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1B1YmxpY1N1Ym5ldCcsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlU3VibmV0JyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgZm9yIGNvbnRlbnRcbiAgICB0aGlzLmNvbnRlbnRCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdDb250ZW50QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGdsb2JhbG1vdW50cG9pbnQtY29udGVudC0ke3Byb3BzLnJlZ2lvbn0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldi90ZXN0IGVudmlyb25tZW50c1xuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlndXJlIFMzIENyb3NzLVJlZ2lvbiBSZXBsaWNhdGlvbiBmb3IgcHJpbWFyeSBidWNrZXRcbiAgICBpZiAocHJvcHMuaXNQcmltYXJ5ICYmIHByb3BzLnJlcGxpY2F0aW9uUm9sZUFybiAmJiBwcm9wcy5zZWNvbmRhcnlSZWdpb24pIHtcbiAgICAgIGNvbnN0IGNmbkJ1Y2tldCA9IHRoaXMuY29udGVudEJ1Y2tldC5ub2RlLmRlZmF1bHRDaGlsZCBhcyBzMy5DZm5CdWNrZXQ7XG4gICAgICBjZm5CdWNrZXQucmVwbGljYXRpb25Db25maWd1cmF0aW9uID0ge1xuICAgICAgICByb2xlOiBwcm9wcy5yZXBsaWNhdGlvblJvbGVBcm4sXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdSZXBsaWNhdGVUb1NlY29uZGFyeVJlZ2lvbicsXG4gICAgICAgICAgICBkZXN0aW5hdGlvbjoge1xuICAgICAgICAgICAgICBidWNrZXQ6IGBhcm46YXdzOnMzOjo6Z2xvYmFsbW91bnRwb2ludC1jb250ZW50LSR7cHJvcHMuc2Vjb25kYXJ5UmVnaW9ufS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgICAgIGRlbGV0ZU1hcmtlclJlcGxpY2F0aW9uOiB7XG4gICAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpbHRlcjoge1xuICAgICAgICAgICAgICBwcmVmaXg6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIElBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzIHRvIGFjY2VzcyBTMyAod2l0aCB3aWxkY2FyZCByZXNvdXJjZXMgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeSlcbiAgICBjb25zdCBlYzJSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdFQzJJbnN0YW5jZVJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWMyLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgJ0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnXG4gICAgICAgICksXG4gICAgICBdLFxuICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgUzNNb3VudFBvbGljeTogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0JywgJ3MzOkxpc3RCdWNrZXQnXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgJ2Fybjphd3M6czM6OjpnbG9iYWxtb3VudHBvaW50LWNvbnRlbnQtKicsXG4gICAgICAgICAgICAgICAgJ2Fybjphd3M6czM6OjpnbG9iYWxtb3VudHBvaW50LWNvbnRlbnQtKi8qJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFMzIFJlcGxpY2F0aW9uIHJlbW92ZWQgZm9yIHNpbXBsaWZpY2F0aW9uXG5cbiAgICAvLyBTZWN1cml0eSBHcm91cHNcbiAgICBjb25zdCBhbGJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdBTEJTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXInLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGFsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgJ0FsbG93IEhUVFAgdHJhZmZpYyBmcm9tIGludGVybmV0J1xuICAgICk7XG5cbiAgICBhbGJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDQ0MyksXG4gICAgICAnQWxsb3cgSFRUUFMgdHJhZmZpYyBmcm9tIGludGVybmV0J1xuICAgICk7XG5cbiAgICBjb25zdCBlYzJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdFQzJTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVDMiBpbnN0YW5jZXMnLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGVjMlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBhbGJTZWN1cml0eUdyb3VwLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSBBTEInXG4gICAgKTtcblxuICAgIGVjMlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5pcHY0KCcxMC4wLjAuMC84JyksXG4gICAgICBlYzIuUG9ydC50Y3AoMjIpLFxuICAgICAgJ0FsbG93IFNTSCBmcm9tIHByaXZhdGUgbmV0d29ya3MnXG4gICAgKTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICBjb25zdCB1c2VyRGF0YSA9IGVjMi5Vc2VyRGF0YS5mb3JMaW51eCgpO1xuICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKFxuICAgICAgJyMhL2Jpbi9iYXNoJyxcbiAgICAgICd5dW0gdXBkYXRlIC15JyxcbiAgICAgICcnLFxuICAgICAgJyMgSW5zdGFsbCBOZ2lueCcsXG4gICAgICAneXVtIGluc3RhbGwgLXkgbmdpbngnLFxuICAgICAgJ2FtYXpvbi1saW51eC1leHRyYXMgaW5zdGFsbCBuZ2lueDEnLFxuICAgICAgJ3N5c3RlbWN0bCBlbmFibGUgbmdpbngnLFxuICAgICAgJycsXG4gICAgICAnIyBJbnN0YWxsIEFXUyBDTEkgYW5kIHJlcXVpcmVkIHRvb2xzJyxcbiAgICAgICd5dW0gaW5zdGFsbCAteSBhd3NjbGkgZnVzZScsXG4gICAgICAnJyxcbiAgICAgICcjIEluc3RhbGwgUzMgTW91bnRwb2ludCcsXG4gICAgICAnd2dldCBodHRwczovL3MzLmFtYXpvbmF3cy5jb20vbW91bnRwb2ludC1zMy1yZWxlYXNlL2xhdGVzdC94ODZfNjQvbW91bnQtczMucnBtJyxcbiAgICAgICd5dW0gaW5zdGFsbCAteSAuL21vdW50LXMzLnJwbScsXG4gICAgICAnJyxcbiAgICAgICcjIENyZWF0ZSBtb3VudHBvaW50IGRpcmVjdG9yeScsXG4gICAgICAnbWtkaXIgLXAgL3Zhci93d3cvaHRtbCcsXG4gICAgICAnY2hvd24gbmdpbng6bmdpbnggL3Zhci93d3cvaHRtbCcsXG4gICAgICAnJyxcbiAgICAgICcjIE1vdW50IFMzIGJ1Y2tldCB1c2luZyBTMyBNb3VudHBvaW50JyxcbiAgICAgIGBtb3VudC1zMyAke3RoaXMuY29udGVudEJ1Y2tldC5idWNrZXROYW1lfSAvdmFyL3d3dy9odG1sIC0tYWxsb3ctb3RoZXIgLS11aWQ9JChpZCAtdSBuZ2lueCkgLS1naWQ9JChpZCAtZyBuZ2lueClgLFxuICAgICAgJycsXG4gICAgICAnIyBDb25maWd1cmUgTmdpbngnLFxuICAgICAgJ2NhdCA+IC9ldGMvbmdpbngvbmdpbnguY29uZiA8PCBFT0YnLFxuICAgICAgJ3VzZXIgbmdpbng7JyxcbiAgICAgICd3b3JrZXJfcHJvY2Vzc2VzIGF1dG87JyxcbiAgICAgICdlcnJvcl9sb2cgL3Zhci9sb2cvbmdpbngvZXJyb3IubG9nOycsXG4gICAgICAncGlkIC9ydW4vbmdpbngucGlkOycsXG4gICAgICAnJyxcbiAgICAgICdldmVudHMgeycsXG4gICAgICAnICAgIHdvcmtlcl9jb25uZWN0aW9ucyAxMDI0OycsXG4gICAgICAnfScsXG4gICAgICAnJyxcbiAgICAgICdodHRwIHsnLFxuICAgICAgJyAgICBpbmNsdWRlIC9ldGMvbmdpbngvbWltZS50eXBlczsnLFxuICAgICAgJyAgICBkZWZhdWx0X3R5cGUgYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtOycsXG4gICAgICAnICAgIHNlbmRmaWxlIG9uOycsXG4gICAgICAnICAgIGtlZXBhbGl2ZV90aW1lb3V0IDY1OycsXG4gICAgICAnJyxcbiAgICAgICcgICAgc2VydmVyIHsnLFxuICAgICAgJyAgICAgICAgbGlzdGVuIDgwOycsXG4gICAgICAnICAgICAgICBzZXJ2ZXJfbmFtZSBfOycsXG4gICAgICAnICAgICAgICByb290IC92YXIvd3d3L2h0bWw7JyxcbiAgICAgICcgICAgICAgIGluZGV4IGluZGV4Lmh0bWwgaW5kZXguaHRtOycsXG4gICAgICAnJyxcbiAgICAgICcgICAgICAgIGxvY2F0aW9uIC9oZWFsdGggeycsXG4gICAgICAnICAgICAgICAgICAgYWNjZXNzX2xvZyBvZmY7JyxcbiAgICAgICcgICAgICAgICAgICByZXR1cm4gMjAwIFwiaGVhbHRoeVxcXFxuXCI7JyxcbiAgICAgICcgICAgICAgICAgICBhZGRfaGVhZGVyIENvbnRlbnQtVHlwZSB0ZXh0L3BsYWluOycsXG4gICAgICAnICAgICAgICB9JyxcbiAgICAgICcgICAgfScsXG4gICAgICAnfScsXG4gICAgICAnRU9GJyxcbiAgICAgICcnLFxuICAgICAgXCIjIENyZWF0ZSBhIGRlZmF1bHQgaW5kZXguaHRtbCBpZiBpdCBkb2Vzbid0IGV4aXN0XCIsXG4gICAgICAnaWYgWyAhIC1mIC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbCBdOyB0aGVuJyxcbiAgICAgIGAgICAgZWNobyBcIjxoMT5HbG9iYWwgTW91bnRwb2ludCBXZWJzaXRlIC0gJHtwcm9wcy5yZWdpb259PC9oMT5cIiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbGAsXG4gICAgICAnZmknLFxuICAgICAgJycsXG4gICAgICAnIyBTdGFydCBOZ2lueCcsXG4gICAgICAnc3lzdGVtY3RsIHN0YXJ0IG5naW54JyxcbiAgICAgICcnLFxuICAgICAgJyMgQWRkIFMzIG1vdW50IHRvIGZzdGFiIGZvciBwZXJzaXN0ZW5jZScsXG4gICAgICBgZWNobyBcIiR7dGhpcy5jb250ZW50QnVja2V0LmJ1Y2tldE5hbWV9IC92YXIvd3d3L2h0bWwgZnVzZS5tb3VudC1zMyBfbmV0ZGV2LGFsbG93X290aGVyLHVpZD0kKGlkIC11IG5naW54KSxnaWQ9JChpZCAtZyBuZ2lueCkgMCAwXCIgPj4gL2V0Yy9mc3RhYmBcbiAgICApO1xuXG4gICAgLy8gTGF1bmNoIFRlbXBsYXRlXG4gICAgY29uc3QgbGF1bmNoVGVtcGxhdGUgPSBuZXcgZWMyLkxhdW5jaFRlbXBsYXRlKHRoaXMsICdMYXVuY2hUZW1wbGF0ZScsIHtcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihcbiAgICAgICAgZWMyLkluc3RhbmNlQ2xhc3MuVDMsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk9cbiAgICAgICksXG4gICAgICBtYWNoaW5lSW1hZ2U6IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0QW1hem9uTGludXgyKCksXG4gICAgICB1c2VyRGF0YSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IGVjMlNlY3VyaXR5R3JvdXAsXG4gICAgICByb2xlOiBlYzJSb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIHRoaXMubG9hZEJhbGFuY2VyID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdBTEInLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgICBzZWN1cml0eUdyb3VwOiBhbGJTZWN1cml0eUdyb3VwLFxuICAgIH0pO1xuXG4gICAgLy8gVGFyZ2V0IEdyb3VwXG4gICAgY29uc3QgdGFyZ2V0R3JvdXAgPSBuZXcgZWxidjIuQXBwbGljYXRpb25UYXJnZXRHcm91cCh0aGlzLCAnVGFyZ2V0R3JvdXAnLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGF0aDogJy9oZWFsdGgnLFxuICAgICAgICBoZWFsdGh5SHR0cENvZGVzOiAnMjAwJyxcbiAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgIGhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkQ291bnQ6IDMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQUxCIExpc3RlbmVyXG4gICAgdGhpcy5sb2FkQmFsYW5jZXIuYWRkTGlzdGVuZXIoJ0xpc3RlbmVyJywge1xuICAgICAgcG9ydDogODAsXG4gICAgICBkZWZhdWx0VGFyZ2V0R3JvdXBzOiBbdGFyZ2V0R3JvdXBdLFxuICAgIH0pO1xuXG4gICAgLy8gQXV0byBTY2FsaW5nIEdyb3VwXG4gICAgY29uc3QgYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdBU0cnLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXG4gICAgICBsYXVuY2hUZW1wbGF0ZSxcbiAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgbWF4Q2FwYWNpdHk6IDEsIC8vIEluaXRpYWxseSBzZXQgdG8gMSBhcyBzcGVjaWZpZWRcbiAgICAgIGRlc2lyZWRDYXBhY2l0eTogMSxcbiAgICAgIGhlYWx0aENoZWNrOiBhdXRvc2NhbGluZy5IZWFsdGhDaGVjay5lbGIoe1xuICAgICAgICBncmFjZTogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIC8vIEF0dGFjaCBBU0cgdG8gdGFyZ2V0IGdyb3VwXG4gICAgYXV0b1NjYWxpbmdHcm91cC5hdHRhY2hUb0FwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGFyZ2V0R3JvdXApO1xuXG4gICAgLy8gQ1BVLWJhc2VkIHNjYWxpbmcgcG9saWN5XG4gICAgYXV0b1NjYWxpbmdHcm91cC5zY2FsZU9uQ3B1VXRpbGl6YXRpb24oJ0NwdVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDcwLFxuICAgIH0pO1xuXG4gICAgLy8gSGVhbHRoIGNoZWNrIGZvciB0aGlzIHJlZ2lvbidzIEFMQiB1c2luZyBwcm9wZXIgY29uZmlndXJhdGlvblxuICAgIHRoaXMuaGVhbHRoQ2hlY2sgPSBuZXcgcm91dGU1My5DZm5IZWFsdGhDaGVjayh0aGlzLCAnSGVhbHRoQ2hlY2snLCB7XG4gICAgICB0eXBlOiAnSFRUUCcsXG4gICAgICBoZWFsdGhDaGVja0NvbmZpZzoge1xuICAgICAgICB0eXBlOiAnSFRUUCcsXG4gICAgICAgIHJlc291cmNlUGF0aDogJy9oZWFsdGgnLFxuICAgICAgICBmdWxseVF1YWxpZmllZERvbWFpbk5hbWU6IHRoaXMubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckRuc05hbWUsXG4gICAgICAgIHJlcXVlc3RJbnRlcnZhbDogMzAsXG4gICAgICAgIGZhaWx1cmVUaHJlc2hvbGQ6IDMsXG4gICAgICB9LFxuICAgIH0gYXMgYW55KTtcblxuICAgIGlmIChwcm9wcy5pc1ByaW1hcnkpIHtcbiAgICAgIC8vIFByaW1hcnkgRE5TIHJlY29yZCB3aXRoIGZhaWxvdmVyIHJvdXRpbmdcbiAgICAgIHRoaXMuZG5zUmVjb3JkID0gbmV3IHJvdXRlNTMuQ2ZuUmVjb3JkU2V0KHRoaXMsICdQcmltYXJ5RE5TUmVjb3JkJywge1xuICAgICAgICBob3N0ZWRab25lSWQ6IHByb3BzLnpvbmVJZCxcbiAgICAgICAgbmFtZTogcHJvcHMuZG9tYWluTmFtZSxcbiAgICAgICAgdHlwZTogJ0EnLFxuICAgICAgICBzZXRJZGVudGlmaWVyOiAncHJpbWFyeScsXG4gICAgICAgIGZhaWxvdmVyOiAnUFJJTUFSWScsXG4gICAgICAgIGFsaWFzVGFyZ2V0OiB7XG4gICAgICAgICAgZG5zTmFtZTogdGhpcy5sb2FkQmFsYW5jZXIubG9hZEJhbGFuY2VyRG5zTmFtZSxcbiAgICAgICAgICBob3N0ZWRab25lSWQ6IHRoaXMubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckNhbm9uaWNhbEhvc3RlZFpvbmVJZCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhbHRoQ2hlY2tJZDogdGhpcy5oZWFsdGhDaGVjay5hdHRySGVhbHRoQ2hlY2tJZCxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZWNvbmRhcnkgRE5TIHJlY29yZCB3aXRoIGZhaWxvdmVyIHJvdXRpbmdcbiAgICAgIHRoaXMuZG5zUmVjb3JkID0gbmV3IHJvdXRlNTMuQ2ZuUmVjb3JkU2V0KHRoaXMsICdTZWNvbmRhcnlETlNSZWNvcmQnLCB7XG4gICAgICAgIGhvc3RlZFpvbmVJZDogcHJvcHMuem9uZUlkLFxuICAgICAgICBuYW1lOiBwcm9wcy5kb21haW5OYW1lLFxuICAgICAgICB0eXBlOiAnQScsXG4gICAgICAgIHNldElkZW50aWZpZXI6ICdzZWNvbmRhcnknLFxuICAgICAgICBmYWlsb3ZlcjogJ1NFQ09OREFSWScsXG4gICAgICAgIGFsaWFzVGFyZ2V0OiB7XG4gICAgICAgICAgZG5zTmFtZTogdGhpcy5sb2FkQmFsYW5jZXIubG9hZEJhbGFuY2VyRG5zTmFtZSxcbiAgICAgICAgICBob3N0ZWRab25lSWQ6IHRoaXMubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckNhbm9uaWNhbEhvc3RlZFpvbmVJZCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhbHRoQ2hlY2tJZDogdGhpcy5oZWFsdGhDaGVjay5hdHRySGVhbHRoQ2hlY2tJZCxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU2Vjb25kYXJ5RE5TQ3JlYXRlZCcsIHtcbiAgICAgICAgdmFsdWU6ICdTZWNvbmRhcnkgRE5TIHJlY29yZCBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRE5TIGZhaWxvdmVyIGlzIG5vdyBhY3RpdmUgYmV0d2VlbiByZWdpb25zJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTG9hZEJhbGFuY2VyRE5TJywge1xuICAgICAgdmFsdWU6IHRoaXMubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckRuc05hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogYExvYWQgQmFsYW5jZXIgRE5TIG5hbWUgZm9yICR7cHJvcHMucmVnaW9ufWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29udGVudEJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jb250ZW50QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogYFMzIENvbnRlbnQgYnVja2V0IG5hbWUgZm9yICR7cHJvcHMucmVnaW9ufWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVlBDSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy52cGMudnBjSWQsXG4gICAgICBkZXNjcmlwdGlvbjogYFZQQyBJRCBmb3IgJHtwcm9wcy5yZWdpb259YCxcbiAgICB9KTtcblxuICAgIC8vIEROUy1yZWxhdGVkIG91dHB1dHNcbiAgICBpZiAocHJvcHMuaXNQcmltYXJ5KSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2Vic2l0ZVVSTCcsIHtcbiAgICAgICAgdmFsdWU6IGBodHRwOi8vJHtwcm9wcy5kb21haW5OYW1lfWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2Vic2l0ZSBVUkwgd2l0aCBETlMgZmFpbG92ZXInLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIb3N0ZWRab25lSWQnLCB7XG4gICAgICAgIHZhbHVlOiBwcm9wcy56b25lSWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSG9zdGVkIFpvbmUgSUQgdXNlZCBmb3IgRE5TIHJlY29yZHMnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlZ2lvblR5cGUnLCB7XG4gICAgICB2YWx1ZTogcHJvcHMuaXNQcmltYXJ5XG4gICAgICAgID8gJ1ByaW1hcnkgUmVnaW9uIChETlMgKyBJbmZyYXN0cnVjdHVyZSknXG4gICAgICAgIDogJ1NlY29uZGFyeSBSZWdpb24gKEluZnJhc3RydWN0dXJlIE9ubHkpJyxcbiAgICAgIGRlc2NyaXB0aW9uOiBgUmVnaW9uIHR5cGUgZm9yICR7cHJvcHMucmVnaW9ufWAsXG4gICAgfSk7XG5cbiAgICAvLyBBTEIgZGV0YWlscyBmb3IgbWFudWFsIHNlY29uZGFyeSBETlMgcmVjb3JkIGNyZWF0aW9uXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FMQkROU05hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5sb2FkQmFsYW5jZXIubG9hZEJhbGFuY2VyRG5zTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBgQUxCIEROUyBuYW1lIGZvciAke3Byb3BzLnJlZ2lvbn0gLSB1c2UgZm9yIG1hbnVhbCBETlMgcmVjb3JkIGNyZWF0aW9uYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBTEJDYW5vbmljYWxIb3N0ZWRab25lSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5sb2FkQmFsYW5jZXIubG9hZEJhbGFuY2VyQ2Fub25pY2FsSG9zdGVkWm9uZUlkLFxuICAgICAgZGVzY3JpcHRpb246IGBBTEIgY2Fub25pY2FsIGhvc3RlZCB6b25lIElEIGZvciAke3Byb3BzLnJlZ2lvbn0gLSB1c2UgZm9yIG1hbnVhbCBETlMgcmVjb3JkIGNyZWF0aW9uYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIZWFsdGhDaGVja0lkJywge1xuICAgICAgdmFsdWU6IHRoaXMuaGVhbHRoQ2hlY2suYXR0ckhlYWx0aENoZWNrSWQsXG4gICAgICBkZXNjcmlwdGlvbjogYEhlYWx0aCBjaGVjayBJRCBmb3IgJHtwcm9wcy5yZWdpb259IC0gdXNlIGZvciBtYW51YWwgRE5TIHJlY29yZCBjcmVhdGlvbmAsXG4gICAgfSk7XG5cbiAgICAvLyBSZWdpb25hbCBpbmZyYXN0cnVjdHVyZSBjb21wbGV0ZVxuXG4gICAgLy8gQWRkIHRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N0YWNrJywgJ1JlZ2lvbmFsUmVzb3VyY2VzJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1JlZ2lvbicsIHByb3BzLnJlZ2lvbik7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdSZWdpb25UeXBlJywgcmVnaW9uU3VmZml4KTtcbiAgfVxufVxuIl19