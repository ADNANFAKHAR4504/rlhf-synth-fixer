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
exports.ApplicationTierConstruct = void 0;
const constructs_1 = require("constructs");
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const elbv2 = __importStar(require("aws-cdk-lib/aws-elasticloadbalancingv2"));
const autoscaling = __importStar(require("aws-cdk-lib/aws-autoscaling"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * Application Tier Construct that creates an Auto Scaling Group of EC2 instances
 * behind an Application Load Balancer for high availability and scalability
 */
class ApplicationTierConstruct extends constructs_1.Construct {
    loadBalancer;
    autoScalingGroup;
    applicationSecurityGroup;
    loadBalancerSecurityGroup;
    constructor(scope, id, vpc, config) {
        super(scope, id);
        // Create security group for Application Load Balancer
        this.loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSecurityGroup', {
            vpc,
            description: 'Security group for Application Load Balancer - allows HTTP/HTTPS from internet',
            allowAllOutbound: true
        });
        // Allow HTTP and HTTPS traffic from the internet to ALB
        this.loadBalancerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from internet');
        this.loadBalancerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from internet');
        // Create security group for EC2 instances
        this.applicationSecurityGroup = new ec2.SecurityGroup(this, 'ApplicationSecurityGroup', {
            vpc,
            description: 'Security group for application EC2 instances - allows traffic from ALB',
            allowAllOutbound: true // Allow outbound for package updates and external API calls
        });
        // Allow traffic from ALB to EC2 instances on port 80
        this.applicationSecurityGroup.addIngressRule(this.loadBalancerSecurityGroup, ec2.Port.tcp(80), 'Allow HTTP traffic from Application Load Balancer');
        // Allow SSH access for maintenance (restrict to specific IP ranges in production)
        if (config.security.allowSSHAccess) {
            config.security.sshAllowedCidrs.forEach(cidr => {
                this.applicationSecurityGroup.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(22), 'Allow SSH access for maintenance');
            });
        }
        // Create IAM role for EC2 instances with necessary permissions
        const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            description: 'IAM role for EC2 instances in the application tier',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
            ]
        });
        // Create instance profile for EC2 role
        const instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
            roles: [ec2Role.roleName],
            instanceProfileName: `MultiRegionApp-EC2-Profile-${config.region}`
        });
        // User data script for EC2 instances
        const userData = ec2.UserData.forLinux();
        userData.addCommands('#!/bin/bash', 'yum update -y', 'yum install -y httpd mysql', 'systemctl start httpd', 'systemctl enable httpd', 
        // Install CloudWatch agent
        'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm', 'rpm -U ./amazon-cloudwatch-agent.rpm', 
        // Create a simple web page
        'echo "<html><body><h1>Multi-Region Application</h1>" > /var/www/html/index.html', `echo "<p>Region: ${config.region}</p>" >> /var/www/html/index.html`, 'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html', 'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html', 'echo "</body></html>" >> /var/www/html/index.html', 
        // Configure CloudWatch agent
        'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF', JSON.stringify({
            metrics: {
                namespace: 'MultiRegionApp/EC2',
                metrics_collected: {
                    cpu: {
                        measurement: ['cpu_usage_idle', 'cpu_usage_iowait', 'cpu_usage_user', 'cpu_usage_system'],
                        metrics_collection_interval: 60
                    },
                    disk: {
                        measurement: ['used_percent'],
                        metrics_collection_interval: 60,
                        resources: ['*']
                    },
                    mem: {
                        measurement: ['mem_used_percent'],
                        metrics_collection_interval: 60
                    }
                }
            },
            logs: {
                logs_collected: {
                    files: {
                        collect_list: [
                            {
                                file_path: '/var/log/httpd/access_log',
                                log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
                                log_stream_name: '{instance_id}'
                            },
                            {
                                file_path: '/var/log/httpd/error_log',
                                log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
                                log_stream_name: '{instance_id}'
                            }
                        ]
                    }
                }
            }
        }), 'EOF', 
        // Start CloudWatch agent
        '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s');
        // Create launch template for Auto Scaling Group
        const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
            instanceType: new ec2.InstanceType(config.autoScaling.instanceType),
            machineImage: ec2.MachineImage.latestAmazonLinux2023(),
            securityGroup: this.applicationSecurityGroup,
            userData,
            role: ec2Role,
            // Enable detailed monitoring
            detailedMonitoring: config.security.enableDetailedMonitoring,
            // Instance metadata service configuration
            requireImdsv2: true,
            httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
            httpPutResponseHopLimit: 2
        });
        // Create Auto Scaling Group
        this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
            vpc,
            launchTemplate,
            minCapacity: config.autoScaling.minCapacity,
            maxCapacity: config.autoScaling.maxCapacity,
            desiredCapacity: config.autoScaling.desiredCapacity,
            // Deploy instances in private subnets for security
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            // Health check configuration
            healthCheck: autoscaling.HealthCheck.elb({
                grace: cdk.Duration.seconds(config.autoScaling.healthCheckGracePeriod)
            }),
            // Instance replacement policy
            updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
                maxBatchSize: 1,
                minInstancesInService: config.autoScaling.minCapacity,
                pauseTime: cdk.Duration.seconds(config.autoScaling.scaleUpCooldown)
            })
        });
        // Configure Auto Scaling policies based on CPU utilization
        this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: config.autoScaling.scaleUpThreshold
        });
        // Create Application Load Balancer
        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
            vpc,
            internetFacing: true,
            securityGroup: this.loadBalancerSecurityGroup,
            // Deploy ALB in public subnets
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });
        // Create target group for Auto Scaling Group
        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
            vpc,
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [this.autoScalingGroup],
            // Health check configuration
            healthCheck: {
                enabled: true,
                healthyHttpCodes: '200',
                interval: cdk.Duration.seconds(config.loadBalancer.healthCheckInterval),
                path: config.loadBalancer.healthCheckPath,
                protocol: elbv2.Protocol.HTTP,
                timeout: cdk.Duration.seconds(config.loadBalancer.healthCheckTimeout),
                unhealthyThresholdCount: config.loadBalancer.unhealthyThresholdCount,
                healthyThresholdCount: config.loadBalancer.healthyThresholdCount
            },
            // Deregistration delay
            deregistrationDelay: cdk.Duration.seconds(30)
        });
        // Create listener for ALB
        this.loadBalancer.addListener('HttpListener', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            defaultTargetGroups: [targetGroup]
        });
        // Apply comprehensive tagging
        const resources = [
            this.loadBalancer,
            this.autoScalingGroup,
            this.applicationSecurityGroup,
            this.loadBalancerSecurityGroup,
            launchTemplate,
            targetGroup
        ];
        resources.forEach(resource => {
            Object.entries(config.tags).forEach(([key, value]) => {
                cdk.Tags.of(resource).add(key, value);
            });
        });
        // Add specific name tags
        cdk.Tags.of(this.loadBalancer).add('Name', `MultiRegionApp-ALB-${config.region}`);
        cdk.Tags.of(this.autoScalingGroup).add('Name', `MultiRegionApp-ASG-${config.region}`);
        cdk.Tags.of(this.applicationSecurityGroup).add('Name', `MultiRegionApp-App-SG-${config.region}`);
        cdk.Tags.of(this.loadBalancerSecurityGroup).add('Name', `MultiRegionApp-ALB-SG-${config.region}`);
    }
}
exports.ApplicationTierConstruct = ApplicationTierConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24tdGllci1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBsaWNhdGlvbi10aWVyLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMseURBQTJDO0FBQzNDLDhFQUFnRTtBQUNoRSx5RUFBMkQ7QUFDM0QseURBQTJDO0FBQzNDLGlEQUFtQztBQUduQzs7O0dBR0c7QUFDSCxNQUFhLHdCQUF5QixTQUFRLHNCQUFTO0lBQ3JDLFlBQVksQ0FBZ0M7SUFDNUMsZ0JBQWdCLENBQStCO0lBQy9DLHdCQUF3QixDQUFvQjtJQUM1Qyx5QkFBeUIsQ0FBb0I7SUFFN0QsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxHQUFZLEVBQUUsTUFBbUI7UUFDekUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDeEYsR0FBRztZQUNILFdBQVcsRUFBRSxnRkFBZ0Y7WUFDN0YsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGNBQWMsQ0FDM0MsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLGtDQUFrQyxDQUNuQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGNBQWMsQ0FDM0MsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQ2pCLG1DQUFtQyxDQUNwQyxDQUFD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RSxDQUFDLENBQUM7SUFDcEcsQ0FBQztDQUNGO0FBdlBELDREQXVQQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgYXV0b3NjYWxpbmcgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTdGFja0NvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvc3RhY2stY29uZmlnJztcblxuLyoqXG4gKiBBcHBsaWNhdGlvbiBUaWVyIENvbnN0cnVjdCB0aGF0IGNyZWF0ZXMgYW4gQXV0byBTY2FsaW5nIEdyb3VwIG9mIEVDMiBpbnN0YW5jZXNcbiAqIGJlaGluZCBhbiBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyIGZvciBoaWdoIGF2YWlsYWJpbGl0eSBhbmQgc2NhbGFiaWxpdHlcbiAqL1xuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uVGllckNvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cDogYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwOiBlYzIuU2VjdXJpdHlHcm91cDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCB2cGM6IGVjMi5WcGMsIGNvbmZpZzogU3RhY2tDb25maWcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyXG4gICAgdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdMb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciAtIGFsbG93cyBIVFRQL0hUVFBTIGZyb20gaW50ZXJuZXQnLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgSFRUUCBhbmQgSFRUUFMgdHJhZmZpYyBmcm9tIHRoZSBpbnRlcm5ldCB0byBBTEJcbiAgICB0aGlzLmxvYWRCYWxhbmNlclNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgJ0FsbG93IEhUVFAgdHJhZmZpYyBmcm9tIGludGVybmV0J1xuICAgICk7XG4gICAgdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDQ0MyksXG4gICAgICAnQWxsb3cgSFRUUFMgdHJhZmZpYyBmcm9tIGludGVybmV0J1xuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICB0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnQXBwbGljYXRpb25TZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgYXBwbGljYXRpb24gRUMyIGluc3RhbmNlcyAtIGFsbG93cyB0cmFmZmljIGZyb20gQUxCJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUgLy8gQWxsb3cgb3V0Ym91bmQgZm9yIHBhY2thZ2UgdXBkYXRlcyBhbmQgZXh0ZXJuYWwgQVBJIGNhbGxzXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyB0cmFmZmljIGZyb20gQUxCIHRvIEVDMiBpbnN0YW5jZXMgb24gcG9ydCA4MFxuICAgIHRoaXMuYXBwbGljYXRpb25TZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyJ1xuICAgICk7XG5cbiAgICAvLyBBbGxvdyBTU0ggYWNjZXNzIGZvciBtYWludGVuYW5jZSAocmVzdHJpY3QgdG8gc3BlY2lmaWMgSVAgcmFuZ2VzIGluIHByb2R1Y3Rpb24pXG4gICAgaWYgKGNvbmZpZy5zZWN1cml0eS5hbGxvd1NTSEFjY2Vzcykge1xuICAgICAgY29uZmlnLnNlY3VyaXR5LnNzaEFsbG93ZWRDaWRycy5mb3JFYWNoKGNpZHIgPT4ge1xuICAgICAgICB0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgICAgICBlYzIuUGVlci5pcHY0KGNpZHIpLFxuICAgICAgICAgIGVjMi5Qb3J0LnRjcCgyMiksXG4gICAgICAgICAgJ0FsbG93IFNTSCBhY2Nlc3MgZm9yIG1haW50ZW5hbmNlJ1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzIHdpdGggbmVjZXNzYXJ5IHBlcm1pc3Npb25zXG4gICAgY29uc3QgZWMyUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnRUMySW5zdGFuY2VSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ0lBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzIGluIHRoZSBhcHBsaWNhdGlvbiB0aWVyJyxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0Nsb3VkV2F0Y2hBZ2VudFNlcnZlclBvbGljeScpLFxuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnKVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGluc3RhbmNlIHByb2ZpbGUgZm9yIEVDMiByb2xlXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IGlhbS5DZm5JbnN0YW5jZVByb2ZpbGUodGhpcywgJ0VDMkluc3RhbmNlUHJvZmlsZScsIHtcbiAgICAgIHJvbGVzOiBbZWMyUm9sZS5yb2xlTmFtZV0sXG4gICAgICBpbnN0YW5jZVByb2ZpbGVOYW1lOiBgTXVsdGlSZWdpb25BcHAtRUMyLVByb2ZpbGUtJHtjb25maWcucmVnaW9ufWBcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICBjb25zdCB1c2VyRGF0YSA9IGVjMi5Vc2VyRGF0YS5mb3JMaW51eCgpO1xuICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKFxuICAgICAgJyMhL2Jpbi9iYXNoJyxcbiAgICAgICd5dW0gdXBkYXRlIC15JyxcbiAgICAgICd5dW0gaW5zdGFsbCAteSBodHRwZCBteXNxbCcsXG4gICAgICAnc3lzdGVtY3RsIHN0YXJ0IGh0dHBkJyxcbiAgICAgICdzeXN0ZW1jdGwgZW5hYmxlIGh0dHBkJyxcbiAgICAgIFxuICAgICAgLy8gSW5zdGFsbCBDbG91ZFdhdGNoIGFnZW50XG4gICAgICAnd2dldCBodHRwczovL3MzLmFtYXpvbmF3cy5jb20vYW1hem9uY2xvdWR3YXRjaC1hZ2VudC9hbWF6b25fbGludXgvYW1kNjQvbGF0ZXN0L2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbScsXG4gICAgICAncnBtIC1VIC4vYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQucnBtJyxcbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIGEgc2ltcGxlIHdlYiBwYWdlXG4gICAgICAnZWNobyBcIjxodG1sPjxib2R5PjxoMT5NdWx0aS1SZWdpb24gQXBwbGljYXRpb248L2gxPlwiID4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sJyxcbiAgICAgIGBlY2hvIFwiPHA+UmVnaW9uOiAke2NvbmZpZy5yZWdpb259PC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbGAsXG4gICAgICAnZWNobyBcIjxwPkluc3RhbmNlIElEOiAkKGN1cmwgLXMgaHR0cDovLzE2OS4yNTQuMTY5LjI1NC9sYXRlc3QvbWV0YS1kYXRhL2luc3RhbmNlLWlkKTwvcD5cIiA+PiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWwnLFxuICAgICAgJ2VjaG8gXCI8cD5BdmFpbGFiaWxpdHkgWm9uZTogJChjdXJsIC1zIGh0dHA6Ly8xNjkuMjU0LjE2OS4yNTQvbGF0ZXN0L21ldGEtZGF0YS9wbGFjZW1lbnQvYXZhaWxhYmlsaXR5LXpvbmUpPC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbCcsXG4gICAgICAnZWNobyBcIjwvYm9keT48L2h0bWw+XCIgPj4gL3Zhci93d3cvaHRtbC9pbmRleC5odG1sJyxcbiAgICAgIFxuICAgICAgLy8gQ29uZmlndXJlIENsb3VkV2F0Y2ggYWdlbnRcbiAgICAgICdjYXQgPiAvb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9ldGMvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQuanNvbiA8PCBFT0YnLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXRyaWNzOiB7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnTXVsdGlSZWdpb25BcHAvRUMyJyxcbiAgICAgICAgICBtZXRyaWNzX2NvbGxlY3RlZDoge1xuICAgICAgICAgICAgY3B1OiB7XG4gICAgICAgICAgICAgIG1lYXN1cmVtZW50OiBbJ2NwdV91c2FnZV9pZGxlJywgJ2NwdV91c2FnZV9pb3dhaXQnLCAnY3B1X3VzYWdlX3VzZXInLCAnY3B1X3VzYWdlX3N5c3RlbSddLFxuICAgICAgICAgICAgICBtZXRyaWNzX2NvbGxlY3Rpb25faW50ZXJ2YWw6IDYwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzazoge1xuICAgICAgICAgICAgICBtZWFzdXJlbWVudDogWyd1c2VkX3BlcmNlbnQnXSxcbiAgICAgICAgICAgICAgbWV0cmljc19jb2xsZWN0aW9uX2ludGVydmFsOiA2MCxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lbToge1xuICAgICAgICAgICAgICBtZWFzdXJlbWVudDogWydtZW1fdXNlZF9wZXJjZW50J10sXG4gICAgICAgICAgICAgIG1ldHJpY3NfY29sbGVjdGlvbl9pbnRlcnZhbDogNjBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ3M6IHtcbiAgICAgICAgICBsb2dzX2NvbGxlY3RlZDoge1xuICAgICAgICAgICAgZmlsZXM6IHtcbiAgICAgICAgICAgICAgY29sbGVjdF9saXN0OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZmlsZV9wYXRoOiAnL3Zhci9sb2cvaHR0cGQvYWNjZXNzX2xvZycsXG4gICAgICAgICAgICAgICAgICBsb2dfZ3JvdXBfbmFtZTogYC9hd3MvZWMyL211bHRpcmVnaW9uYXBwLyR7Y29uZmlnLnJlZ2lvbn0vaHR0cGQvYWNjZXNzYCxcbiAgICAgICAgICAgICAgICAgIGxvZ19zdHJlYW1fbmFtZTogJ3tpbnN0YW5jZV9pZH0nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBmaWxlX3BhdGg6ICcvdmFyL2xvZy9odHRwZC9lcnJvcl9sb2cnLFxuICAgICAgICAgICAgICAgICAgbG9nX2dyb3VwX25hbWU6IGAvYXdzL2VjMi9tdWx0aXJlZ2lvbmFwcC8ke2NvbmZpZy5yZWdpb259L2h0dHBkL2Vycm9yYCxcbiAgICAgICAgICAgICAgICAgIGxvZ19zdHJlYW1fbmFtZTogJ3tpbnN0YW5jZV9pZH0nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgICdFT0YnLFxuICAgICAgXG4gICAgICAvLyBTdGFydCBDbG91ZFdhdGNoIGFnZW50XG4gICAgICAnL29wdC9hd3MvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQvYmluL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LWN0bCAtYSBmZXRjaC1jb25maWcgLW0gZWMyIC1jIGZpbGU6L29wdC9hd3MvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQvZXRjL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50Lmpzb24gLXMnXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBsYXVuY2ggdGVtcGxhdGUgZm9yIEF1dG8gU2NhbGluZyBHcm91cFxuICAgIGNvbnN0IGxhdW5jaFRlbXBsYXRlID0gbmV3IGVjMi5MYXVuY2hUZW1wbGF0ZSh0aGlzLCAnTGF1bmNoVGVtcGxhdGUnLCB7XG4gICAgICBpbnN0YW5jZVR5cGU6IG5ldyBlYzIuSW5zdGFuY2VUeXBlKGNvbmZpZy5hdXRvU2NhbGluZy5pbnN0YW5jZVR5cGUpLFxuICAgICAgbWFjaGluZUltYWdlOiBlYzIuTWFjaGluZUltYWdlLmxhdGVzdEFtYXpvbkxpbnV4MjAyMygpLFxuICAgICAgc2VjdXJpdHlHcm91cDogdGhpcy5hcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAsXG4gICAgICB1c2VyRGF0YSxcbiAgICAgIHJvbGU6IGVjMlJvbGUsXG4gICAgICBcbiAgICAgIC8vIEVuYWJsZSBkZXRhaWxlZCBtb25pdG9yaW5nXG4gICAgICBkZXRhaWxlZE1vbml0b3Jpbmc6IGNvbmZpZy5zZWN1cml0eS5lbmFibGVEZXRhaWxlZE1vbml0b3JpbmcsXG4gICAgICBcbiAgICAgIC8vIEluc3RhbmNlIG1ldGFkYXRhIHNlcnZpY2UgY29uZmlndXJhdGlvblxuICAgICAgcmVxdWlyZUltZHN2MjogdHJ1ZSxcbiAgICAgIGh0dHBUb2tlbnM6IGVjMi5MYXVuY2hUZW1wbGF0ZUh0dHBUb2tlbnMuUkVRVUlSRUQsXG4gICAgICBodHRwUHV0UmVzcG9uc2VIb3BMaW1pdDogMlxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIEF1dG8gU2NhbGluZyBHcm91cFxuICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdBdXRvU2NhbGluZ0dyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgbGF1bmNoVGVtcGxhdGUsXG4gICAgICBtaW5DYXBhY2l0eTogY29uZmlnLmF1dG9TY2FsaW5nLm1pbkNhcGFjaXR5LFxuICAgICAgbWF4Q2FwYWNpdHk6IGNvbmZpZy5hdXRvU2NhbGluZy5tYXhDYXBhY2l0eSxcbiAgICAgIGRlc2lyZWRDYXBhY2l0eTogY29uZmlnLmF1dG9TY2FsaW5nLmRlc2lyZWRDYXBhY2l0eSxcbiAgICAgIFxuICAgICAgLy8gRGVwbG95IGluc3RhbmNlcyBpbiBwcml2YXRlIHN1Ym5ldHMgZm9yIHNlY3VyaXR5XG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1NcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEhlYWx0aCBjaGVjayBjb25maWd1cmF0aW9uXG4gICAgICBoZWFsdGhDaGVjazogYXV0b3NjYWxpbmcuSGVhbHRoQ2hlY2suZWxiKHtcbiAgICAgICAgZ3JhY2U6IGNkay5EdXJhdGlvbi5zZWNvbmRzKGNvbmZpZy5hdXRvU2NhbGluZy5oZWFsdGhDaGVja0dyYWNlUGVyaW9kKVxuICAgICAgfSksXG4gICAgICBcbiAgICAgIC8vIEluc3RhbmNlIHJlcGxhY2VtZW50IHBvbGljeVxuICAgICAgdXBkYXRlUG9saWN5OiBhdXRvc2NhbGluZy5VcGRhdGVQb2xpY3kucm9sbGluZ1VwZGF0ZSh7XG4gICAgICAgIG1heEJhdGNoU2l6ZTogMSxcbiAgICAgICAgbWluSW5zdGFuY2VzSW5TZXJ2aWNlOiBjb25maWcuYXV0b1NjYWxpbmcubWluQ2FwYWNpdHksXG4gICAgICAgIHBhdXNlVGltZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoY29uZmlnLmF1dG9TY2FsaW5nLnNjYWxlVXBDb29sZG93bilcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAvLyBDb25maWd1cmUgQXV0byBTY2FsaW5nIHBvbGljaWVzIGJhc2VkIG9uIENQVSB1dGlsaXphdGlvblxuICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cC5zY2FsZU9uQ3B1VXRpbGl6YXRpb24oJ0NwdVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IGNvbmZpZy5hdXRvU2NhbGluZy5zY2FsZVVwVGhyZXNob2xkXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIHRoaXMubG9hZEJhbGFuY2VyID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdBcHBsaWNhdGlvbkxvYWRCYWxhbmNlcicsIHtcbiAgICAgIHZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgICAgc2VjdXJpdHlHcm91cDogdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwLFxuICAgICAgXG4gICAgICAvLyBEZXBsb3kgQUxCIGluIHB1YmxpYyBzdWJuZXRzXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQ1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRhcmdldCBncm91cCBmb3IgQXV0byBTY2FsaW5nIEdyb3VwXG4gICAgY29uc3QgdGFyZ2V0R3JvdXAgPSBuZXcgZWxidjIuQXBwbGljYXRpb25UYXJnZXRHcm91cCh0aGlzLCAnVGFyZ2V0R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICB0YXJnZXRzOiBbdGhpcy5hdXRvU2NhbGluZ0dyb3VwXSxcbiAgICAgIFxuICAgICAgLy8gSGVhbHRoIGNoZWNrIGNvbmZpZ3VyYXRpb25cbiAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGhlYWx0aHlIdHRwQ29kZXM6ICcyMDAnLFxuICAgICAgICBpbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoY29uZmlnLmxvYWRCYWxhbmNlci5oZWFsdGhDaGVja0ludGVydmFsKSxcbiAgICAgICAgcGF0aDogY29uZmlnLmxvYWRCYWxhbmNlci5oZWFsdGhDaGVja1BhdGgsXG4gICAgICAgIHByb3RvY29sOiBlbGJ2Mi5Qcm90b2NvbC5IVFRQLFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyhjb25maWcubG9hZEJhbGFuY2VyLmhlYWx0aENoZWNrVGltZW91dCksXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiBjb25maWcubG9hZEJhbGFuY2VyLnVuaGVhbHRoeVRocmVzaG9sZENvdW50LFxuICAgICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IGNvbmZpZy5sb2FkQmFsYW5jZXIuaGVhbHRoeVRocmVzaG9sZENvdW50XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBEZXJlZ2lzdHJhdGlvbiBkZWxheVxuICAgICAgZGVyZWdpc3RyYXRpb25EZWxheTogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbGlzdGVuZXIgZm9yIEFMQlxuICAgIHRoaXMubG9hZEJhbGFuY2VyLmFkZExpc3RlbmVyKCdIdHRwTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICBkZWZhdWx0VGFyZ2V0R3JvdXBzOiBbdGFyZ2V0R3JvdXBdXG4gICAgfSk7XG5cbiAgICAvLyBBcHBseSBjb21wcmVoZW5zaXZlIHRhZ2dpbmdcbiAgICBjb25zdCByZXNvdXJjZXMgPSBbXG4gICAgICB0aGlzLmxvYWRCYWxhbmNlcixcbiAgICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cCxcbiAgICAgIHRoaXMuYXBwbGljYXRpb25TZWN1cml0eUdyb3VwLFxuICAgICAgdGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwLFxuICAgICAgbGF1bmNoVGVtcGxhdGUsXG4gICAgICB0YXJnZXRHcm91cFxuICAgIF07XG5cbiAgICByZXNvdXJjZXMuZm9yRWFjaChyZXNvdXJjZSA9PiB7XG4gICAgICBPYmplY3QuZW50cmllcyhjb25maWcudGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIGNkay5UYWdzLm9mKHJlc291cmNlKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCBzcGVjaWZpYyBuYW1lIHRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzLmxvYWRCYWxhbmNlcikuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLUFMQi0ke2NvbmZpZy5yZWdpb259YCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5hdXRvU2NhbGluZ0dyb3VwKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtQVNHLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cCkuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLUFwcC1TRy0ke2NvbmZpZy5yZWdpb259YCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5sb2FkQmFsYW5jZXJTZWN1cml0eUdyb3VwKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtQUxCLVNHLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgfVxufSJdfQ==