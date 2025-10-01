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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWlncmF0aW9uLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MsOEVBQWdFO0FBQ2hFLHlFQUEyRDtBQUMzRCx5REFBMkM7QUFDM0MsdURBQTJDO0FBUTNDLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDbkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsNENBQTRDO1FBQzVDLE1BQU0sZUFBZSxHQUFHLEtBQUssRUFBRSxlQUFlLElBQUksV0FBVyxDQUFDO1FBRTlELGtDQUFrQztRQUNsQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1QyxJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLE1BQU0sRUFBRSxDQUFDLEVBQUUsYUFBYTtZQUN4QixtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTtpQkFDbEM7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLG9CQUFvQjtvQkFDMUIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2lCQUMvQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsaUJBQWlCO29CQUN2QixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7aUJBQzVDO2FBQ0Y7WUFDRCxXQUFXLEVBQUUsQ0FBQyxFQUFFLHlCQUF5QjtTQUMxQyxDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFFckIsdURBQXVEO1FBQ3ZELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN2RSxHQUFHO1lBQ0gsV0FBVyxFQUFFLGtEQUFrRDtZQUMvRCxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztRQUNILGdCQUFnQixDQUFDLGNBQWMsQ0FDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLHNDQUFzQyxDQUN2QyxDQUFDO1FBRUYsdURBQXVEO1FBQ3ZELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUNoRCxJQUFJLEVBQ0osc0JBQXNCLEVBQ3RCO1lBQ0UsR0FBRztZQUNILFdBQVcsRUFBRSwrQ0FBK0M7WUFDNUQsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUNGLENBQUM7UUFDRixvQkFBb0IsQ0FBQyxjQUFjLENBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxFQUMxRCxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFDaEIsa0NBQWtDLENBQ25DLENBQUM7UUFFRiwyREFBMkQ7UUFDM0QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQ2hELElBQUksRUFDSixzQkFBc0IsRUFDdEI7WUFDRSxHQUFHO1lBQ0gsV0FBVyxFQUFFLHFDQUFxQztZQUNsRCxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQ0YsQ0FBQztRQUNGLG9CQUFvQixDQUFDLGNBQWMsQ0FDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQzlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQixxQ0FBcUMsQ0FDdEMsQ0FBQztRQUVGLG1CQUFtQjtRQUVuQix3QkFBd0I7UUFDeEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQztZQUM5QyxPQUFPLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLE1BQU07U0FDdkMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxVQUFVLEdBQUcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN0RSxHQUFHO1lBQ0gsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUMvQixHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFDcEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQ3ZCO1lBQ0QsWUFBWSxFQUFFLEdBQUc7WUFDakIsYUFBYSxFQUFFLG9CQUFvQjtZQUNuQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRTtZQUM5RCxXQUFXLEVBQUUsQ0FBQyxFQUFFLDRDQUE0QztZQUM1RCxXQUFXLEVBQUUsQ0FBQztZQUNkLGVBQWUsRUFBRSxDQUFDO1NBQ25CLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxXQUFXLENBQ3BCLGlCQUFpQixFQUNqQixvQkFBb0IsRUFDcEIsNENBQTRDLEVBQzVDLG1EQUFtRCxFQUNuRCxvTUFBb00sRUFDcE0sS0FBSyxFQUNMLDRCQUE0QixFQUM1Qiw2QkFBNkIsQ0FDOUIsQ0FBQztRQUVGLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQzlCLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUMsQ0FDM0UsQ0FBQztRQUVGLCtCQUErQjtRQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2hFLEdBQUc7WUFDSCxjQUFjLEVBQUUsSUFBSTtZQUNwQixhQUFhLEVBQUUsZ0JBQWdCO1lBQy9CLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtTQUNsRCxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUU7WUFDL0MsSUFBSSxFQUFFLEVBQUU7WUFDUixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUNsRCxJQUFJLEVBQ0osb0JBQW9CLEVBQ3BCO1lBQ0UsR0FBRztZQUNILElBQUksRUFBRSxFQUFFO1lBQ1IsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ3JCLFdBQVcsRUFBRTtnQkFDWCxJQUFJLEVBQUUsR0FBRztnQkFDVCxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2FBQ25DO1NBQ0YsQ0FDRixDQUFDO1FBRUYsUUFBUSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QyxZQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUM7U0FDNUIsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sR0FBRyxHQUFHLElBQUksMEJBQU8sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDOUMsV0FBVyxFQUFFLGtCQUFrQjtZQUMvQixXQUFXLEVBQUUsMkJBQTJCO1lBQ3hDLGNBQWMsRUFBRSxJQUFJLEVBQUUsbURBQW1EO1NBQzFFLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3BELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztTQUN6RCxDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQzFCLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUMsQ0FDM0UsQ0FBQztRQUVGLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3hELEdBQUc7WUFDSCxZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQy9CLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUNwQixHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDdEI7WUFDRCxZQUFZLEVBQUUsR0FBRztZQUNqQixhQUFhLEVBQUUsb0JBQW9CO1lBQ25DLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUNqRCxPQUFPLEVBQUUsR0FBRyxDQUFDLFdBQVc7WUFDeEIsSUFBSSxFQUFFLFdBQVc7U0FDbEIsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQy9CLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztZQUNoQixXQUFXLEVBQUUsbUJBQW1CO1NBQ2pDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxlQUFlO1lBQzFCLFdBQVcsRUFBRSw4QkFBOEI7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN6QyxLQUFLLEVBQUUsR0FBRyxDQUFDLG1CQUFtQjtZQUM5QixXQUFXLEVBQUUsbUNBQW1DO1NBQ2pELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDM0MsS0FBSyxFQUFFLFdBQVcsQ0FBQyxVQUFVO1lBQzdCLFdBQVcsRUFBRSxxQ0FBcUM7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxnQkFBZ0I7WUFDbkMsV0FBVyxFQUFFLDJDQUEyQztTQUN6RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxHQUFHLENBQUMsV0FBVztZQUN0QixXQUFXLEVBQUUsa0NBQWtDO1NBQ2hELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxvQkFBb0I7WUFDdEMsV0FBVyxFQUFFLCtDQUErQztTQUM3RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxXQUFXLENBQUMsY0FBYztZQUNqQyxXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDM0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtZQUN0QyxXQUFXLEVBQUUsaUNBQWlDO1NBQy9DLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDM0MsS0FBSyxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtZQUN0QyxXQUFXLEVBQUUsaUNBQWlDO1NBQy9DLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDOUMsS0FBSyxFQUFFLGVBQWUsR0FBRyxDQUFDLFdBQVcsVUFBVTtZQUMvQyxXQUFXLEVBQUUsd0RBQXdEO1NBQ3RFLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJPRCx3Q0FxT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0ICogYXMgYXV0b3NjYWxpbmcgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IEtleVBhaXIgfSBmcm9tICdjZGstZWMyLWtleS1wYWlyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvblN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIC8vIEFsbG93IGZvciBjdXN0b21pemF0aW9uIG9mIGJhc3Rpb24gaG9zdCBzb3VyY2UgSVBcbiAgYmFzdGlvblNvdXJjZUlwPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTWlncmF0aW9uU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IE1pZ3JhdGlvblN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIERlZmF1bHQgYmFzdGlvbiBzb3VyY2UgSVAgaWYgbm90IHByb3ZpZGVkXG4gICAgY29uc3QgYmFzdGlvblNvdXJjZUlwID0gcHJvcHM/LmJhc3Rpb25Tb3VyY2VJcCB8fCAnMC4wLjAuMC8wJztcblxuICAgIC8vIDEuIFZQQyBhbmQgU3VibmV0IENvbmZpZ3VyYXRpb25cbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnTWlncmF0aW9uVlBDJywge1xuICAgICAgY2lkcjogJzE5Mi4xNjguMC4wLzE2JyxcbiAgICAgIG1heEF6czogMiwgLy8gU3BhbiAyIEFac1xuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQdWJsaWMnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAnUHJpdmF0ZUFwcGxpY2F0aW9uJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlRGF0YWJhc2UnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgbmF0R2F0ZXdheXM6IDIsIC8vIE9uZSBOQVQgR2F0ZXdheSBwZXIgQVpcbiAgICB9KTtcblxuICAgIC8vIDIuIFNlY3VyaXR5IEdyb3Vwc1xuXG4gICAgLy8gQUxCIFNlY3VyaXR5IEdyb3VwOiBBbGxvdyBpbmJvdW5kIEhUVFAgZnJvbSBhbnl3aGVyZVxuICAgIGNvbnN0IGFsYlNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0FMQlNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciB0aGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcicsXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgIH0pO1xuICAgIGFsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoODApLFxuICAgICAgJ0FsbG93IEhUVFAgdHJhZmZpYyBmcm9tIHRoZSBpbnRlcm5ldCdcbiAgICApO1xuXG4gICAgLy8gV2ViIFRpZXIgU2VjdXJpdHkgR3JvdXA6IE9ubHkgYWxsb3cgaW5ib3VuZCBmcm9tIEFMQlxuICAgIGNvbnN0IHdlYlRpZXJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdXZWJUaWVyU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgdGhlIFdlYiBUaWVyIEVDMiBpbnN0YW5jZXMnLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgICAgfVxuICAgICk7XG4gICAgd2ViVGllclNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5zZWN1cml0eUdyb3VwSWQoYWxiU2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSBBTEIgb25seSdcbiAgICApO1xuXG4gICAgLy8gQmFzdGlvbiBIb3N0IFNlY3VyaXR5IEdyb3VwOiBBbGxvdyBTU0ggZnJvbSBzcGVjaWZpZWQgSVBcbiAgICBjb25zdCBiYXN0aW9uU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnQmFzdGlvblNlY3VyaXR5R3JvdXAnLFxuICAgICAge1xuICAgICAgICB2cGMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIHRoZSBCYXN0aW9uIEhvc3QnLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgICAgfVxuICAgICk7XG4gICAgYmFzdGlvblNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5pcHY0KGJhc3Rpb25Tb3VyY2VJcCksXG4gICAgICBlYzIuUG9ydC50Y3AoMjIpLFxuICAgICAgJ0FsbG93IFNTSCB0cmFmZmljIGZyb20gc3BlY2lmaWVkIElQJ1xuICAgICk7XG5cbiAgICAvLyAzLiBFQzIgSW5zdGFuY2VzXG5cbiAgICAvLyBBTUkgZm9yIEVDMiBJbnN0YW5jZXNcbiAgICBjb25zdCBhbWkgPSBlYzIuTWFjaGluZUltYWdlLmxhdGVzdEFtYXpvbkxpbnV4Mih7XG4gICAgICBjcHVUeXBlOiBlYzIuQW1hem9uTGludXhDcHVUeXBlLlg4Nl82NCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdlYlRpZXJBc2cgPSBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cCh0aGlzLCAnV2ViVGllckFTRycsIHtcbiAgICAgIHZwYyxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihcbiAgICAgICAgZWMyLkluc3RhbmNlQ2xhc3MuVDMsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk9cbiAgICAgICksXG4gICAgICBtYWNoaW5lSW1hZ2U6IGFtaSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IHdlYlRpZXJTZWN1cml0eUdyb3VwLFxuICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH0sXG4gICAgICBtaW5DYXBhY2l0eTogMiwgLy8gT25lIGluc3RhbmNlIHBlciBBWiBmb3IgaGlnaCBhdmFpbGFiaWxpdHlcbiAgICAgIG1heENhcGFjaXR5OiA0LFxuICAgICAgZGVzaXJlZENhcGFjaXR5OiAyLFxuICAgIH0pO1xuXG4gICAgd2ViVGllckFzZy5hZGRVc2VyRGF0YShcbiAgICAgICcjIS9iaW4vYmFzaCAteGUnLFxuICAgICAgJ3N1ZG8geXVtIHVwZGF0ZSAteScsXG4gICAgICAnc3VkbyBhbWF6b24tbGludXgtZXh0cmFzIGluc3RhbGwgbmdpbngxIC15JyxcbiAgICAgICdzdWRvIGNhdCA+IC91c3Ivc2hhcmUvbmdpbngvaHRtbC9pbmRleC5odG1sIDw8RU9GJyxcbiAgICAgICc8aHRtbD48aGVhZD48dGl0bGU+TWlncmF0aW9uIFdlYiBBcHA8L3RpdGxlPjwvaGVhZD48Ym9keT48aDE+V2VsY29tZSB0byB0aGUgTWlncmF0aW9uIFdlYiBBcHAhPC9oMT48cD5UaGlzIGlzIGEgc2ltcGxlIHdlYiBzZXJ2ZXIgZGVwbG95ZWQgYXMgcGFydCBvZiBhIHRocmVlLXRpZXIgYXJjaGl0ZWN0dXJlLjwvcD48L2JvZHk+PC9odG1sPicsXG4gICAgICAnRU9GJyxcbiAgICAgICdzdWRvIHN5c3RlbWN0bCBzdGFydCBuZ2lueCcsXG4gICAgICAnc3VkbyBzeXN0ZW1jdGwgZW5hYmxlIG5naW54J1xuICAgICk7XG5cbiAgICB3ZWJUaWVyQXNnLnJvbGUuYWRkTWFuYWdlZFBvbGljeShcbiAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZScpXG4gICAgKTtcblxuICAgIC8vIDQuIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXJcbiAgICBjb25zdCBhbGIgPSBuZXcgZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXIodGhpcywgJ1dlYlRpZXJBTEInLCB7XG4gICAgICB2cGMsXG4gICAgICBpbnRlcm5ldEZhY2luZzogdHJ1ZSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IGFsYlNlY3VyaXR5R3JvdXAsXG4gICAgICB2cGNTdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyB9LFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGxpc3RlbmVyIHRvIEFMQlxuICAgIGNvbnN0IGxpc3RlbmVyID0gYWxiLmFkZExpc3RlbmVyKCdIVFRQTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YXJnZXRHcm91cCA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvblRhcmdldEdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdXZWJUaWVyVGFyZ2V0R3JvdXAnLFxuICAgICAge1xuICAgICAgICB2cGMsXG4gICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICB0YXJnZXRzOiBbd2ViVGllckFzZ10sXG4gICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIGxpc3RlbmVyLmFkZFRhcmdldEdyb3VwcygnRGVmYXVsdFRhcmdldEdyb3VwJywge1xuICAgICAgdGFyZ2V0R3JvdXBzOiBbdGFyZ2V0R3JvdXBdLFxuICAgIH0pO1xuXG4gICAgLy8gNS4gQmFzdGlvbiBIb3N0XG4gICAgY29uc3Qga2V5ID0gbmV3IEtleVBhaXIodGhpcywgJ0Jhc3Rpb25LZXlQYWlyJywge1xuICAgICAga2V5UGFpck5hbWU6ICdiYXN0aW9uLWtleS1wYWlyJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnS2V5IHBhaXIgZm9yIGJhc3Rpb24gaG9zdCcsXG4gICAgICBzdG9yZVB1YmxpY0tleTogdHJ1ZSwgLy8gQWxzbyBzdG9yZSB0aGUgcHVibGljIGtleSBpbiBTU00gUGFyYW1ldGVyIFN0b3JlXG4gICAgfSk7XG5cbiAgICBjb25zdCBiYXN0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQmFzdGlvblJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWMyLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcblxuICAgIGJhc3Rpb25Sb2xlLmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnKVxuICAgICk7XG5cbiAgICBjb25zdCBiYXN0aW9uSG9zdCA9IG5ldyBlYzIuSW5zdGFuY2UodGhpcywgJ0Jhc3Rpb25Ib3N0Jywge1xuICAgICAgdnBjLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICBlYzIuSW5zdGFuY2VDbGFzcy5UMyxcbiAgICAgICAgZWMyLkluc3RhbmNlU2l6ZS5OQU5PXG4gICAgICApLFxuICAgICAgbWFjaGluZUltYWdlOiBhbWksXG4gICAgICBzZWN1cml0eUdyb3VwOiBiYXN0aW9uU2VjdXJpdHlHcm91cCxcbiAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDIH0sXG4gICAgICBrZXlOYW1lOiBrZXkua2V5UGFpck5hbWUsXG4gICAgICByb2xlOiBiYXN0aW9uUm9sZSxcbiAgICB9KTtcblxuICAgIC8vIDYuIE91dHB1dCB0aGUgQUxCIEROUyBuYW1lIGFuZCBCYXN0aW9uIEhvc3QgcHVibGljIElQXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1ZwY0lkJywge1xuICAgICAgdmFsdWU6IHZwYy52cGNJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBWUEMnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xvYWRCYWxhbmNlckFybicsIHtcbiAgICAgIHZhbHVlOiBhbGIubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGUgQVJOIG9mIHRoZSBsb2FkIGJhbGFuY2VyJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMb2FkQmFsYW5jZXJETlMnLCB7XG4gICAgICB2YWx1ZTogYWxiLmxvYWRCYWxhbmNlckRuc05hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBETlMgbmFtZSBvZiB0aGUgbG9hZCBiYWxhbmNlcicsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmFzdGlvbkluc3RhbmNlSWQnLCB7XG4gICAgICB2YWx1ZTogYmFzdGlvbkhvc3QuaW5zdGFuY2VJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBiYXN0aW9uIGhvc3QgaW5zdGFuY2UnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Jhc3Rpb25Ib3N0SVAnLCB7XG4gICAgICB2YWx1ZTogYmFzdGlvbkhvc3QuaW5zdGFuY2VQdWJsaWNJcCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHB1YmxpYyBJUCBhZGRyZXNzIG9mIHRoZSBiYXN0aW9uIGhvc3QnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Jhc3Rpb25LZXlQYWlyTmFtZScsIHtcbiAgICAgIHZhbHVlOiBrZXkua2V5UGFpck5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lIG9mIHRoZSBiYXN0aW9uIGtleSBwYWlyJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJTZXJ2ZXJBc2dOYW1lJywge1xuICAgICAgdmFsdWU6IHdlYlRpZXJBc2cuYXV0b1NjYWxpbmdHcm91cE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lIG9mIHRoZSB3ZWIgc2VydmVyIGF1dG8gc2NhbGluZyBncm91cCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVGFyZ2V0R3JvdXBBcm4nLCB7XG4gICAgICB2YWx1ZTogdGFyZ2V0R3JvdXAudGFyZ2V0R3JvdXBBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBBUk4gb2YgdGhlIHRhcmdldCBncm91cCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YWJhc2VTdWJuZXRBSWQnLCB7XG4gICAgICB2YWx1ZTogdnBjLmlzb2xhdGVkU3VibmV0c1swXS5zdWJuZXRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBkYXRhYmFzZSBzdWJuZXQgQScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YWJhc2VTdWJuZXRCSWQnLCB7XG4gICAgICB2YWx1ZTogdnBjLmlzb2xhdGVkU3VibmV0c1sxXS5zdWJuZXRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSBkYXRhYmFzZSBzdWJuZXQgQicsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmFzdGlvbktleVNlY3JldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogYGVjMi1zc2gta2V5LyR7a2V5LmtleVBhaXJOYW1lfS9wcml2YXRlYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIG5hbWUgb2YgdGhlIHNlY3JldCBjb250YWluaW5nIHRoZSBiYXN0aW9uIGtleSBwYWlyJyxcbiAgICB9KTtcbiAgfVxufVxuIl19