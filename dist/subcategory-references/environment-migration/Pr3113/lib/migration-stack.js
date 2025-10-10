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
exports.MigrationStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const elbv2 = __importStar(require("aws-cdk-lib/aws-elasticloadbalancingv2"));
const autoscaling = __importStar(require("aws-cdk-lib/aws-autoscaling"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cdk_ec2_key_pair_1 = require("cdk-ec2-key-pair");
class MigrationStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Default bastion source IP if not provided
        const bastionSourceIp = props?.bastionSourceIp || '0.0.0.0/0';
        // 1. VPC and Subnet Configuration
        const vpc = new ec2.Vpc(this, 'MigrationVPC', {
            cidr: '192.168.0.0/16',
            maxAzs: 2, // Span 2 AZs
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'PrivateApplication',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 24,
                    name: 'PrivateDatabase',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
            natGateways: 2, // One NAT Gateway per AZ
        });
        // 2. Security Groups
        // ALB Security Group: Allow inbound HTTP from anywhere
        const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
            vpc,
            description: 'Security group for the Application Load Balancer',
            allowAllOutbound: true,
        });
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from the internet');
        // Web Tier Security Group: Only allow inbound from ALB
        const webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
            vpc,
            description: 'Security group for the Web Tier EC2 instances',
            allowAllOutbound: true,
        });
        webTierSecurityGroup.addIngressRule(ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId), ec2.Port.tcp(80), 'Allow HTTP traffic from ALB only');
        // Bastion Host Security Group: Allow SSH from specified IP
        const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
            vpc,
            description: 'Security group for the Bastion Host',
            allowAllOutbound: true,
        });
        bastionSecurityGroup.addIngressRule(ec2.Peer.ipv4(bastionSourceIp), ec2.Port.tcp(22), 'Allow SSH traffic from specified IP');
        // 3. EC2 Instances
        // AMI for EC2 Instances
        const ami = ec2.MachineImage.latestAmazonLinux2({
            cpuType: ec2.AmazonLinuxCpuType.X86_64,
        });
        const webTierAsg = new autoscaling.AutoScalingGroup(this, 'WebTierASG', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: ami,
            securityGroup: webTierSecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            minCapacity: 2, // One instance per AZ for high availability
            maxCapacity: 4,
            desiredCapacity: 2,
        });
        webTierAsg.addUserData('#!/bin/bash -xe', 'sudo yum update -y', 'sudo amazon-linux-extras install nginx1 -y', 'sudo cat > /usr/share/nginx/html/index.html <<EOF', '<html><head><title>Migration Web App</title></head><body><h1>Welcome to the Migration Web App!</h1><p>This is a simple web server deployed as part of a three-tier architecture.</p></body></html>', 'EOF', 'sudo systemctl start nginx', 'sudo systemctl enable nginx');
        webTierAsg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        // 4. Application Load Balancer
        const alb = new elbv2.ApplicationLoadBalancer(this, 'WebTierALB', {
            vpc,
            internetFacing: true,
            securityGroup: albSecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        });
        // Add listener to ALB
        const listener = alb.addListener('HTTPListener', {
            port: 80,
            open: true,
        });
        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebTierTargetGroup', {
            vpc,
            port: 80,
            targets: [webTierAsg],
            healthCheck: {
                path: '/',
                interval: cdk.Duration.seconds(30),
            },
        });
        listener.addTargetGroups('DefaultTargetGroup', {
            targetGroups: [targetGroup],
        });
        // 5. Bastion Host
        const key = new cdk_ec2_key_pair_1.KeyPair(this, 'BastionKeyPair', {
            keyPairName: 'bastion-key-pair',
            description: 'Key pair for bastion host',
            storePublicKey: true, // Also store the public key in SSM Parameter Store
        });
        const bastionRole = new iam.Role(this, 'BastionRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        });
        bastionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        const bastionHost = new ec2.Instance(this, 'BastionHost', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: ami,
            securityGroup: bastionSecurityGroup,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            keyName: key.keyPairName,
            role: bastionRole,
        });
        // 6. Output the ALB DNS name and Bastion Host public IP
        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'The ID of the VPC',
        });
        new cdk.CfnOutput(this, 'LoadBalancerArn', {
            value: alb.loadBalancerArn,
            description: 'The ARN of the load balancer',
        });
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: alb.loadBalancerDnsName,
            description: 'The DNS name of the load balancer',
        });
        new cdk.CfnOutput(this, 'BastionInstanceId', {
            value: bastionHost.instanceId,
            description: 'The ID of the bastion host instance',
        });
        new cdk.CfnOutput(this, 'BastionHostIP', {
            value: bastionHost.instancePublicIp,
            description: 'The public IP address of the bastion host',
        });
        new cdk.CfnOutput(this, 'BastionKeyPairName', {
            value: key.keyPairName,
            description: 'The name of the bastion key pair',
        });
        new cdk.CfnOutput(this, 'WebServerAsgName', {
            value: webTierAsg.autoScalingGroupName,
            description: 'The name of the web server auto scaling group',
        });
        new cdk.CfnOutput(this, 'TargetGroupArn', {
            value: targetGroup.targetGroupArn,
            description: 'The ARN of the target group',
        });
        new cdk.CfnOutput(this, 'DatabaseSubnetAId', {
            value: vpc.isolatedSubnets[0].subnetId,
            description: 'The ID of the database subnet A',
        });
        new cdk.CfnOutput(this, 'DatabaseSubnetBId', {
            value: vpc.isolatedSubnets[1].subnetId,
            description: 'The ID of the database subnet B',
        });
        new cdk.CfnOutput(this, 'BastionKeySecretName', {
            value: `ec2-ssh-key/${key.keyPairName}/private`,
            description: 'The name of the secret containing the bastion key pair',
        });
    }
}
exports.MigrationStack = MigrationStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3ViY2F0ZWdvcnktcmVmZXJlbmNlcy9lbnZpcm9ubWVudC1taWdyYXRpb24vUHIzMTEzL2xpYi9taWdyYXRpb24tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHlEQUEyQztBQUMzQyw4RUFBZ0U7QUFDaEUseUVBQTJEO0FBQzNELHlEQUEyQztBQUMzQyx1REFBMkM7QUFRM0MsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEyQjtRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qiw0Q0FBNEM7UUFDNUMsTUFBTSxlQUFlLEdBQUcsS0FBSyxFQUFFLGVBQWUsSUFBSSxXQUFXLENBQUM7UUFFOUQsa0NBQWtDO1FBQ2xDLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzVDLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsTUFBTSxFQUFFLENBQUMsRUFBRSxhQUFhO1lBQ3hCLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsb0JBQW9CO29CQUMxQixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7aUJBQy9DO2dCQUNEO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxpQkFBaUI7b0JBQ3ZCLFVBQVUsRUFB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QUFVO1lBQy9DLFdBQVcsRUFBRSx3REFBd0Q7U0FDdEUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBck9ELHdDQXFPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgS2V5UGFpciB9IGZyb20gJ2Nkay1lYzIta2V5LXBhaXInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgLy8gQWxsb3cgZm9yIGN1c3RvbWl6YXRpb24gb2YgYmFzdGlvbiBob3N0IHNvdXJjZSBJUFxuICBiYXN0aW9uU291cmNlSXA/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNaWdyYXRpb25TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogTWlncmF0aW9uU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRGVmYXVsdCBiYXN0aW9uIHNvdXJjZSBJUCBpZiBub3QgcHJvdmlkZWRcbiAgICBjb25zdCBiYXN0aW9uU291cmNlSXAgPSBwcm9wcz8uYmFzdGlvblNvdXJjZUlwIHx8ICcwLjAuMC4wLzAnO1xuXG4gICAgLy8gMS4gVlBDIGFuZCBTdWJuZXQgQ29uZmlndXJhdGlvblxuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdNaWdyYXRpb25WUEMnLCB7XG4gICAgICBjaWRyOiAnMTkyLjE2OC4wLjAvMTYnLFxuICAgICAgbWF4QXpzOiAyLCAvLyBTcGFuIDIgQVpzXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1B1YmxpYycsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlQXBwbGljYXRpb24nLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1ByaXZhdGVEYXRhYmFzZScsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBuYXRHYXRld2F5czogMiwgLy8gT25lIE5BVCBHYXRld2F5IHBlciBBWlxuICAgIH0pO1xuXG4gICAgLy8gMi4gU2VjdXJpdHkgR3JvdXBzXG5cbiAgICAvLyBBTEIgU2VjdXJpdHkgR3JvdXA6IEFsbG93IGluYm91bmQgSFRUUCBmcm9tIGFueXdoZXJlXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnQUxCU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIHRoZSBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgfSk7XG4gICAgYWxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MCksXG4gICAgICAnQWxsb3cgSFRUUCB0cmFmZmljIGZyb20gdGhlIGludGVybmV0J1xuICAgICk7XG5cbiAgICAvLyBXZWIgVGllciBTZWN1cml0eSBHcm91cDogT25seSBhbGxvdyBpbmJvdW5kIGZyb20gQUxCXG4gICAgY29uc3Qgd2ViVGllclNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ1dlYlRpZXJTZWN1cml0eUdyb3VwJyxcbiAgICAgIHtcbiAgICAgICAgdnBjLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciB0aGUgV2ViIFRpZXIgRUMyIGluc3RhbmNlcycsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcbiAgICB3ZWJUaWVyU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLnNlY3VyaXR5R3JvdXBJZChhbGJTZWN1cml0eUdyb3VwLnNlY3VyaXR5R3JvdXBJZCksXG4gICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgJ0FsbG93IEhUVFAgdHJhZmZpYyBmcm9tIEFMQiBvbmx5J1xuICAgICk7XG5cbiAgICAvLyBCYXN0aW9uIEhvc3QgU2VjdXJpdHkgR3JvdXA6IEFsbG93IFNTSCBmcm9tIHNwZWNpZmllZCBJUFxuICAgIGNvbnN0IGJhc3Rpb25TZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdCYXN0aW9uU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgdGhlIEJhc3Rpb24gSG9zdCcsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcbiAgICBiYXN0aW9uU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmlwdjQoYmFzdGlvblNvdXJjZUlwKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCgyMiksXG4gICAgICAnQWxsb3cgU1NIIHRyYWZmaWMgZnJvbSBzcGVjaWZpZWQgSVAnXG4gICAgKTtcblxuICAgIC8vIDMuIEVDMiBJbnN0YW5jZXNcblxuICAgIC8vIEFNSSBmb3IgRUMyIEluc3RhbmNlc1xuICAgIGNvbnN0IGFtaSA9IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0QW1hem9uTGludXgyKHtcbiAgICAgIGNwdVR5cGU6IGVjMi5BbWF6b25MaW51eENwdVR5cGUuWDg2XzY0LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd2ViVGllckFzZyA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdXZWJUaWVyQVNHJywge1xuICAgICAgdnBjLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICBlYzIuSW5zdGFuY2VDbGFzcy5UMyxcbiAgICAgICAgZWMyLkluc3RhbmNlU2l6ZS5NSUNST1xuICAgICAgKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogYW1pLFxuICAgICAgc2VjdXJpdHlHcm91cDogd2ViVGllclNlY3VyaXR5R3JvdXAsXG4gICAgICB2cGNTdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MgfSxcbiAgICAgIG1pbkNhcGFjaXR5OiAyLCAvLyBPbmUgaW5zdGFuY2UgcGVyIEFaIGZvciBoaWdoIGF2YWlsYWJpbGl0eVxuICAgICAgbWF4Q2FwYWNpdHk6IDQsXG4gICAgICBkZXNpcmVkQ2FwYWNpdHk6IDIsXG4gICAgfSk7XG5cbiAgICB3ZWJUaWVyQXNnLmFkZFVzZXJEYXRhKFxuICAgICAgJyMhL2Jpbi9iYXNoIC14ZScsXG4gICAgICAnc3VkbyB5dW0gdXBkYXRlIC15JyxcbiAgICAgICdzdWRvIGFtYXpvbi1saW51eC1leHRyYXMgaW5zdGFsbCBuZ2lueDEgLXknLFxuICAgICAgJ3N1ZG8gY2F0ID4gL3Vzci9zaGFyZS9uZ2lueC9odG1sL2luZGV4Lmh0bWwgPDxFT0YnLFxuICAgICAgJzxodG1sPjxoZWFkPjx0aXRsZT5NaWdyYXRpb24gV2ViIEFwcDwvdGl0bGU+PC9oZWFkPjxib2R5PjxoMT5XZWxjb21lIHRvIHRoZSBNaWdyYXRpb24gV2ViIEFwcCE8L2gxPjxwPlRoaXMgaXMgYSBzaW1wbGUgd2ViIHNlcnZlciBkZXBsb3llZCBhcyBwYXJ0IG9mIGEgdGhyZWUtdGllciBhcmNoaXRlY3R1cmUuPC9wPjwvYm9keT48L2h0bWw+JyxcbiAgICAgICdFT0YnLFxuICAgICAgJ3N1ZG8gc3lzdGVtY3RsIHN0YXJ0IG5naW54JyxcbiAgICAgICdzdWRvIHN5c3RlbWN0bCBlbmFibGUgbmdpbngnXG4gICAgKTtcblxuICAgIHdlYlRpZXJBc2cucm9sZS5hZGRNYW5hZ2VkUG9saWN5KFxuICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25TU01NYW5hZ2VkSW5zdGFuY2VDb3JlJylcbiAgICApO1xuXG4gICAgLy8gNC4gQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgIGNvbnN0IGFsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnV2ViVGllckFMQicsIHtcbiAgICAgIHZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgICAgc2VjdXJpdHlHcm91cDogYWxiU2VjdXJpdHlHcm91cCxcbiAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgbGlzdGVuZXIgdG8gQUxCXG4gICAgY29uc3QgbGlzdGVuZXIgPSBhbGIuYWRkTGlzdGVuZXIoJ0hUVFBMaXN0ZW5lcicsIHtcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ1dlYlRpZXJUYXJnZXRHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHRhcmdldHM6IFt3ZWJUaWVyQXNnXSxcbiAgICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgbGlzdGVuZXIuYWRkVGFyZ2V0R3JvdXBzKCdEZWZhdWx0VGFyZ2V0R3JvdXAnLCB7XG4gICAgICB0YXJnZXRHcm91cHM6IFt0YXJnZXRHcm91cF0sXG4gICAgfSk7XG5cbiAgICAvLyA1LiBCYXN0aW9uIEhvc3RcbiAgICBjb25zdCBrZXkgPSBuZXcgS2V5UGFpcih0aGlzLCAnQmFzdGlvbktleVBhaXInLCB7XG4gICAgICBrZXlQYWlyTmFtZTogJ2Jhc3Rpb24ta2V5LXBhaXInLFxuICAgICAgZGVzY3JpcHRpb246ICdLZXkgcGFpciBmb3IgYmFzdGlvbiBob3N0JyxcbiAgICAgIHN0b3JlUHVibGljS2V5OiB0cnVlLCAvLyBBbHNvIHN0b3JlIHRoZSBwdWJsaWMga2V5IGluIFNTTSBQYXJhbWV0ZXIgU3RvcmVcbiAgICB9KTtcblxuICAgIGNvbnN0IGJhc3Rpb25Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdCYXN0aW9uUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgIH0pO1xuXG4gICAgYmFzdGlvblJvbGUuYWRkTWFuYWdlZFBvbGljeShcbiAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZScpXG4gICAgKTtcblxuICAgIGNvbnN0IGJhc3Rpb25Ib3N0ID0gbmV3IGVjMi5JbnN0YW5jZSh0aGlzLCAnQmFzdGlvbkhvc3QnLCB7XG4gICAgICB2cGMsXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLlQzLFxuICAgICAgICBlYzIuSW5zdGFuY2VTaXplLk5BTk9cbiAgICAgICksXG4gICAgICBtYWNoaW5lSW1hZ2U6IGFtaSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IGJhc3Rpb25TZWN1cml0eUdyb3VwLFxuICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfSxcbiAgICAgIGtleU5hbWU6IGtleS5rZXlQYWlyTmFtZSxcbiAgICAgIHJvbGU6IGJhc3Rpb25Sb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gNi4gT3V0cHV0IHRoZSBBTEIgRE5TIG5hbWUgYW5kIEJhc3Rpb24gSG9zdCBwdWJsaWMgSVBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVnBjSWQnLCB7XG4gICAgICB2YWx1ZTogdnBjLnZwY0lkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIFZQQycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTG9hZEJhbGFuY2VyQXJuJywge1xuICAgICAgdmFsdWU6IGFsYi5sb2FkQmFsYW5jZXJBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBBUk4gb2YgdGhlIGxvYWQgYmFsYW5jZXInLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xvYWRCYWxhbmNlckROUycsIHtcbiAgICAgIHZhbHVlOiBhbGIubG9hZEJhbGFuY2VyRG5zTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIEROUyBuYW1lIG9mIHRoZSBsb2FkIGJhbGFuY2VyJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCYXN0aW9uSW5zdGFuY2VJZCcsIHtcbiAgICAgIHZhbHVlOiBiYXN0aW9uSG9zdC5pbnN0YW5jZUlkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIGJhc3Rpb24gaG9zdCBpbnN0YW5jZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmFzdGlvbkhvc3RJUCcsIHtcbiAgICAgIHZhbHVlOiBiYXN0aW9uSG9zdC5pbnN0YW5jZVB1YmxpY0lwLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgcHVibGljIElQIGFkZHJlc3Mgb2YgdGhlIGJhc3Rpb24gaG9zdCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmFzdGlvbktleVBhaXJOYW1lJywge1xuICAgICAgdmFsdWU6IGtleS5rZXlQYWlyTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIG5hbWUgb2YgdGhlIGJhc3Rpb24ga2V5IHBhaXInLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNlcnZlckFzZ05hbWUnLCB7XG4gICAgICB2YWx1ZTogd2ViVGllckFzZy5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIG5hbWUgb2YgdGhlIHdlYiBzZXJ2ZXIgYXV0byBzY2FsaW5nIGdyb3VwJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUYXJnZXRHcm91cEFybicsIHtcbiAgICAgIHZhbHVlOiB0YXJnZXRHcm91cC50YXJnZXRHcm91cEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIEFSTiBvZiB0aGUgdGFyZ2V0IGdyb3VwJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZVN1Ym5ldEFJZCcsIHtcbiAgICAgIHZhbHVlOiB2cGMuaXNvbGF0ZWRTdWJuZXRzWzBdLnN1Ym5ldElkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIGRhdGFiYXNlIHN1Ym5ldCBBJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZVN1Ym5ldEJJZCcsIHtcbiAgICAgIHZhbHVlOiB2cGMuaXNvbGF0ZWRTdWJuZXRzWzFdLnN1Ym5ldElkLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgSUQgb2YgdGhlIGRhdGFiYXNlIHN1Ym5ldCBCJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCYXN0aW9uS2V5U2VjcmV0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBgZWMyLXNzaC1rZXkvJHtrZXkua2V5UGFpck5hbWV9L3ByaXZhdGVgLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgbmFtZSBvZiB0aGUgc2VjcmV0IGNvbnRhaW5pbmcgdGhlIGJhc3Rpb24ga2V5IHBhaXInLFxuICAgIH0pO1xuICB9XG59XG4iXX0=