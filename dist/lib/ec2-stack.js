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
exports.Ec2Stack = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class Ec2Stack extends pulumi.ComponentResource {
    autoScalingGroupName;
    targetGroupArn;
    constructor(name, args, opts) {
        super('tap:ec2:Ec2Stack', name, args, opts);
        // Create IAM role for EC2 instances
        const instanceRole = new aws.iam.Role(`${name}-instance-role-${args.environmentSuffix}`, {
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
            tags: args.tags,
        }, { parent: this });
        // Attach necessary policies
        new aws.iam.RolePolicyAttachment(`${name}-ssm-policy-${args.environmentSuffix}`, {
            role: instanceRole.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        }, { parent: this });
        new aws.iam.RolePolicyAttachment(`${name}-cloudwatch-policy-${args.environmentSuffix}`, {
            role: instanceRole.name,
            policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        }, { parent: this });
        const instanceProfile = new aws.iam.InstanceProfile(`${name}-instance-profile-${args.environmentSuffix}`, {
            role: instanceRole.name,
            tags: args.tags,
        }, { parent: this });
        // Create Security Group for EC2 instances
        const instanceSecurityGroup = new aws.ec2.SecurityGroup(`${name}-instance-sg-${args.environmentSuffix}`, {
            vpcId: args.vpcId,
            description: 'Security group for EC2 instances',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['10.5.0.0/16'], // Allow from within VPC
                },
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ['10.0.0.0/8'], // Restricted SSH access
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: {
                Name: `${name}-instance-sg-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // User data script for instance initialization
        const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and start nginx
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# Configure simple web page
echo "<h1>Media Company Web Application - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /usr/share/nginx/html/index.html

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
`;
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
        const launchTemplate = new aws.ec2.LaunchTemplate(`${name}-lt-${args.environmentSuffix}`, {
            namePrefix: `${name}-lt-${args.environmentSuffix}-`,
            imageId: ami.then(ami => ami.id),
            instanceType: 't3.micro',
            iamInstanceProfile: {
                arn: instanceProfile.arn,
            },
            vpcSecurityGroupIds: [instanceSecurityGroup.id],
            userData: Buffer.from(userData).toString('base64'),
            monitoring: {
                enabled: true,
            },
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: {
                        Name: `${name}-instance-${args.environmentSuffix}`,
                        ...args.tags,
                    },
                },
            ],
            tags: args.tags,
        }, { parent: this });
        // Create Target Group
        const targetGroup = new aws.lb.TargetGroup(`${name}-tg-${args.environmentSuffix}`, {
            port: 80,
            protocol: 'HTTP',
            vpcId: args.vpcId,
            targetType: 'instance',
            healthCheck: {
                enabled: true,
                path: '/',
                protocol: 'HTTP',
                healthyThreshold: 2,
                unhealthyThreshold: 3,
                timeout: 5,
                interval: 30,
                matcher: '200',
            },
            deregistrationDelay: 30,
            tags: {
                Name: `${name}-tg-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // Create Auto Scaling Group
        const autoScalingGroup = new aws.autoscaling.Group(`${name}-asg-${args.environmentSuffix}`, {
            namePrefix: `${name}-asg-${args.environmentSuffix}-`,
            vpcZoneIdentifiers: args.privateSubnetIds,
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
                    value: `${name}-asg-instance-${args.environmentSuffix}`,
                    propagateAtLaunch: true,
                },
                {
                    key: 'Environment',
                    value: args.environmentSuffix,
                    propagateAtLaunch: true,
                },
            ],
        }, { parent: this });
        // Create scaling policies
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _scaleUpPolicy = new aws.autoscaling.Policy(`${name}-scale-up-${args.environmentSuffix}`, {
            scalingAdjustment: 1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _scaleDownPolicy = new aws.autoscaling.Policy(`${name}-scale-down-${args.environmentSuffix}`, {
            scalingAdjustment: -1,
            adjustmentType: 'ChangeInCapacity',
            cooldown: 300,
            autoscalingGroupName: autoScalingGroup.name,
        }, { parent: this });
        this.autoScalingGroupName = autoScalingGroup.name;
        this.targetGroupArn = targetGroup.arn;
        this.registerOutputs({
            autoScalingGroupName: this.autoScalingGroupName,
            targetGroupArn: this.targetGroupArn,
        });
    }
}
exports.Ec2Stack = Ec2Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2VjMi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBVW5DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsb0JBQW9CLENBQXdCO0lBQzVDLGNBQWMsQ0FBd0I7SUFFdEQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxvQ0FBb0M7UUFDcEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FDbkMsR0FBRyxJQUFJLGtCQUFrQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDakQ7WUFDRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMvQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxnQkFBZ0I7d0JBQ3hCLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsbUJBQW1CO3lCQUM3QjtxQkFDRjtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQzlCLEdBQUcsSUFBSSxlQUFlLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUM5QztZQUNFLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSTtZQUN2QixTQUFTLEVBQUUsc0RBQXNEO1NBQ2xFLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQzlCLEdBQUcsSUFBSSxzQkFBc0IsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3JEO1lBQ0UsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJO1lBQ3ZCLFNBQVMsRUFBRSxxREFBcUQ7U0FDakUsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQ2pELEdBQUcsSUFBSSxxQkFBcUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3BEO1lBQ0UsSUFBSSxFQUFFLFlBQVksQ0FBQyxJQUFJO1lBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMENBQTBDO1FBQzFDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FDckQsR0FBRyxJQUFJLGdCQUFnQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDL0M7WUFDRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsV0FBVyxFQUFFLGtDQUFrQztZQUMvQyxPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsUUFBUSxFQUFFLEVBQUU7b0JBQ1osTUFBTSxFQUFFLEVBQUU7b0JBQ1YsVUFBVSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsd0JBQXdCO2lCQUN0RDtnQkFDRDtvQkFDRSxRQUFRLEVBQUUsS0FBSztvQkFDZixRQUFRLEVBQUUsRUFBRTtvQkFDWixNQUFNLEVBQUUsRUFBRTtvQkFDVixVQUFVLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSx3QkFBd0I7aUJBQ3JEO2FBQ0Y7WUFDRCxNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsUUFBUSxFQUFFLElBQUk7b0JBQ2QsUUFBUSxFQUFFLENBQUM7b0JBQ1gsTUFBTSxFQUFFLENBQUM7b0JBQ1QsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUMxQjthQUNGO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxHQUFHLElBQUksZ0JBQWdCLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDckQsR0FBRyxJQUFJLENBQUMsSUFBSTthQUNiO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLCtDQUErQztRQUMvQyxNQUFNLFFBQVEsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JwQixDQUFDO1FBRUUsZ0NBQWdDO1FBQ2hDLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQ3pCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUNsQixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLE1BQU07b0JBQ1osTUFBTSxFQUFFLENBQUMsNEJBQTRCLENBQUM7aUJBQ3ZDO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FDL0MsR0FBRyxJQUFJLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3RDO1lBQ0UsVUFBVSxFQUFFLEdBQUcsSUFBSSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsR0FBRztZQUNuRCxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDaEMsWUFBWSxFQUFFLFVBQVU7WUFDeEIsa0JBQWtCLEVBQUU7Z0JBQ2xCLEdBQUcsRUFBRSxlQUFlLENBQUMsR0FBRzthQUN6QjtZQUNELG1CQUFtQixFQUFFLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDO1lBQy9DLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDbEQsVUFBVSxFQUFFO2dCQUNWLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxpQkFBaUIsRUFBRTtnQkFDakI7b0JBQ0UsWUFBWSxFQUFFLFVBQVU7b0JBQ3hCLElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsR0FBRyxJQUFJLGFBQWEsSUFBSSxDQUFDLGlCQUFpQixFQUFFO3dCQUNsRCxHQUFHLElBQUksQ0FBQyxJQUFJO3FCQUNiO2lCQUNGO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHNCQUFzQjtRQUN0QixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUN4QyxHQUFHLElBQUksT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDdEM7WUFDRSxJQUFJLEVBQUUsRUFBRTtZQUNSLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixVQUFVLEVBQUUsVUFBVTtZQUN0QixXQUFXLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLGdCQUFnQixFQUFFLENBQUM7Z0JBQ25CLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFFBQVEsRUFBRSxFQUFFO2dCQUNaLE9BQU8sRUFBRSxLQUFLO2FBQ2Y7WUFDRCxtQkFBbUIsRUFBRSxFQUFFO1lBQ3ZCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsR0FBRyxJQUFJLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUM1QyxHQUFHLElBQUksQ0FBQyxJQUFJO2FBQ2I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsNEJBQTRCO1FBQzVCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FDaEQsR0FBRyxJQUFJLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3ZDO1lBQ0UsVUFBVSxFQUFFLEdBQUcsSUFBSSxRQUFRLElBQUksQ0FBQyxpQkFBaUIsR0FBRztZQUNwRCxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3pDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7WUFDbEMsZUFBZSxFQUFFLEtBQUs7WUFDdEIsc0JBQXNCLEVBQUUsR0FBRztZQUMzQixPQUFPLEVBQUUsQ0FBQztZQUNWLE9BQU8sRUFBRSxDQUFDO1lBQ1YsZUFBZSxFQUFFLENBQUM7WUFDbEIsY0FBYyxFQUFFO2dCQUNkLEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTtnQkFDckIsT0FBTyxFQUFFLFNBQVM7YUFDbkI7WUFDRCxJQUFJLEVBQUU7Z0JBQ0o7b0JBQ0UsR0FBRyxFQUFFLE1BQU07b0JBQ1gsS0FBSyxFQUFFLEdBQUcsSUFBSSxpQkFBaUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFO29CQUN2RCxpQkFBaUIsRUFBRSxJQUFJO2lCQUN4QjtnQkFDRDtvQkFDRSxHQUFHLEVBQUUsYUFBYTtvQkFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxpQkFBaUI7b0JBQzdCLGlCQUFpQixFQUFFLElBQUk7aUJBQ3hCO2FBQ0Y7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLDZEQUE2RDtRQUM3RCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUMvQyxHQUFHLElBQUksYUFBYSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDNUM7WUFDRSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGNBQWMsRUFBRSxrQkFBa0I7WUFDbEMsUUFBUSxFQUFFLEdBQUc7WUFDYixvQkFBb0IsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJO1NBQzVDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiw2REFBNkQ7UUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUNqRCxHQUFHLElBQUksZUFBZSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDOUM7WUFDRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDckIsY0FBYyxFQUFFLGtCQUFrQjtZQUNsQyxRQUFRLEVBQUUsR0FBRztZQUNiLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLElBQUk7U0FDNUMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7UUFDbEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO1FBRXRDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtZQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdFBELDRCQXNQQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVjMlN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nW10+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgRWMyU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldEdyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBFYzJTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOmVjMjpFYzJTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzXG4gICAgY29uc3QgaW5zdGFuY2VSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGAke25hbWV9LWluc3RhbmNlLXJvbGUtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZWMyLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIG5lY2Vzc2FyeSBwb2xpY2llc1xuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYCR7bmFtZX0tc3NtLXBvbGljeS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogaW5zdGFuY2VSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgJHtuYW1lfS1jbG91ZHdhdGNoLXBvbGljeS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogaW5zdGFuY2VSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0Nsb3VkV2F0Y2hBZ2VudFNlcnZlclBvbGljeScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCBpbnN0YW5jZVByb2ZpbGUgPSBuZXcgYXdzLmlhbS5JbnN0YW5jZVByb2ZpbGUoXG4gICAgICBgJHtuYW1lfS1pbnN0YW5jZS1wcm9maWxlLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBpbnN0YW5jZVJvbGUubmFtZSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFNlY3VyaXR5IEdyb3VwIGZvciBFQzIgaW5zdGFuY2VzXG4gICAgY29uc3QgaW5zdGFuY2VTZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGAke25hbWV9LWluc3RhbmNlLXNnLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgRUMyIGluc3RhbmNlcycsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogODAsXG4gICAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycxMC41LjAuMC8xNiddLCAvLyBBbGxvdyBmcm9tIHdpdGhpbiBWUENcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiAyMixcbiAgICAgICAgICAgIHRvUG9ydDogMjIsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzEwLjAuMC4wLzgnXSwgLy8gUmVzdHJpY3RlZCBTU0ggYWNjZXNzXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGAke25hbWV9LWluc3RhbmNlLXNnLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgZm9yIGluc3RhbmNlIGluaXRpYWxpemF0aW9uXG4gICAgY29uc3QgdXNlckRhdGEgPSBgIyEvYmluL2Jhc2hcbiMgVXBkYXRlIHN5c3RlbVxueXVtIHVwZGF0ZSAteVxuXG4jIEluc3RhbGwgQ2xvdWRXYXRjaCBhZ2VudFxud2dldCBodHRwczovL3MzLmFtYXpvbmF3cy5jb20vYW1hem9uY2xvdWR3YXRjaC1hZ2VudC9hbWF6b25fbGludXgvYW1kNjQvbGF0ZXN0L2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbVxucnBtIC1VIC4vYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQucnBtXG5cbiMgSW5zdGFsbCBhbmQgc3RhcnQgbmdpbnhcbmFtYXpvbi1saW51eC1leHRyYXMgaW5zdGFsbCBuZ2lueDEgLXlcbnN5c3RlbWN0bCBzdGFydCBuZ2lueFxuc3lzdGVtY3RsIGVuYWJsZSBuZ2lueFxuXG4jIENvbmZpZ3VyZSBzaW1wbGUgd2ViIHBhZ2VcbmVjaG8gXCI8aDE+TWVkaWEgQ29tcGFueSBXZWIgQXBwbGljYXRpb24gLSBJbnN0YW5jZSAkKGVjMi1tZXRhZGF0YSAtLWluc3RhbmNlLWlkIHwgY3V0IC1kIFwiIFwiIC1mIDIpPC9oMT5cIiA+IC91c3Ivc2hhcmUvbmdpbngvaHRtbC9pbmRleC5odG1sXG5cbiMgU3RhcnQgQ2xvdWRXYXRjaCBhZ2VudFxuL29wdC9hd3MvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQvYmluL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LWN0bCAtYSBmZXRjaC1jb25maWcgLW0gZWMyIC1zXG5gO1xuXG4gICAgLy8gR2V0IGxhdGVzdCBBbWF6b24gTGludXggMiBBTUlcbiAgICBjb25zdCBhbWkgPSBhd3MuZWMyLmdldEFtaSh7XG4gICAgICBtb3N0UmVjZW50OiB0cnVlLFxuICAgICAgb3duZXJzOiBbJ2FtYXpvbiddLFxuICAgICAgZmlsdGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ25hbWUnLFxuICAgICAgICAgIHZhbHVlczogWydhbXpuMi1hbWktaHZtLSoteDg2XzY0LWdwMiddLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBMYXVuY2ggVGVtcGxhdGVcbiAgICBjb25zdCBsYXVuY2hUZW1wbGF0ZSA9IG5ldyBhd3MuZWMyLkxhdW5jaFRlbXBsYXRlKFxuICAgICAgYCR7bmFtZX0tbHQtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWVQcmVmaXg6IGAke25hbWV9LWx0LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH0tYCxcbiAgICAgICAgaW1hZ2VJZDogYW1pLnRoZW4oYW1pID0+IGFtaS5pZCksXG4gICAgICAgIGluc3RhbmNlVHlwZTogJ3QzLm1pY3JvJyxcbiAgICAgICAgaWFtSW5zdGFuY2VQcm9maWxlOiB7XG4gICAgICAgICAgYXJuOiBpbnN0YW5jZVByb2ZpbGUuYXJuLFxuICAgICAgICB9LFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbaW5zdGFuY2VTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgdXNlckRhdGE6IEJ1ZmZlci5mcm9tKHVzZXJEYXRhKS50b1N0cmluZygnYmFzZTY0JyksXG4gICAgICAgIG1vbml0b3Jpbmc6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB0YWdTcGVjaWZpY2F0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlc291cmNlVHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0taW5zdGFuY2UtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFRhcmdldCBHcm91cFxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGF3cy5sYi5UYXJnZXRHcm91cChcbiAgICAgIGAke25hbWV9LXRnLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBwb3J0OiA4MCxcbiAgICAgICAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhcmdldFR5cGU6ICdpbnN0YW5jZScsXG4gICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgICAgICAgICBoZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZDogMyxcbiAgICAgICAgICB0aW1lb3V0OiA1LFxuICAgICAgICAgIGludGVydmFsOiAzMCxcbiAgICAgICAgICBtYXRjaGVyOiAnMjAwJyxcbiAgICAgICAgfSxcbiAgICAgICAgZGVyZWdpc3RyYXRpb25EZWxheTogMzAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS10Zy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQXV0byBTY2FsaW5nIEdyb3VwXG4gICAgY29uc3QgYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhd3MuYXV0b3NjYWxpbmcuR3JvdXAoXG4gICAgICBgJHtuYW1lfS1hc2ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWVQcmVmaXg6IGAke25hbWV9LWFzZy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9LWAsXG4gICAgICAgIHZwY1pvbmVJZGVudGlmaWVyczogYXJncy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICB0YXJnZXRHcm91cEFybnM6IFt0YXJnZXRHcm91cC5hcm5dLFxuICAgICAgICBoZWFsdGhDaGVja1R5cGU6ICdFTEInLFxuICAgICAgICBoZWFsdGhDaGVja0dyYWNlUGVyaW9kOiAzMDAsXG4gICAgICAgIG1pblNpemU6IDIsXG4gICAgICAgIG1heFNpemU6IDYsXG4gICAgICAgIGRlc2lyZWRDYXBhY2l0eTogMixcbiAgICAgICAgbGF1bmNoVGVtcGxhdGU6IHtcbiAgICAgICAgICBpZDogbGF1bmNoVGVtcGxhdGUuaWQsXG4gICAgICAgICAgdmVyc2lvbjogJyRMYXRlc3QnLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5OiAnTmFtZScsXG4gICAgICAgICAgICB2YWx1ZTogYCR7bmFtZX0tYXNnLWluc3RhbmNlLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgcHJvcGFnYXRlQXRMYXVuY2g6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6ICdFbnZpcm9ubWVudCcsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy5lbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgICAgIHByb3BhZ2F0ZUF0TGF1bmNoOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgc2NhbGluZyBwb2xpY2llc1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfc2NhbGVVcFBvbGljeSA9IG5ldyBhd3MuYXV0b3NjYWxpbmcuUG9saWN5KFxuICAgICAgYCR7bmFtZX0tc2NhbGUtdXAtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHNjYWxpbmdBZGp1c3RtZW50OiAxLFxuICAgICAgICBhZGp1c3RtZW50VHlwZTogJ0NoYW5nZUluQ2FwYWNpdHknLFxuICAgICAgICBjb29sZG93bjogMzAwLFxuICAgICAgICBhdXRvc2NhbGluZ0dyb3VwTmFtZTogYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IF9zY2FsZURvd25Qb2xpY3kgPSBuZXcgYXdzLmF1dG9zY2FsaW5nLlBvbGljeShcbiAgICAgIGAke25hbWV9LXNjYWxlLWRvd24tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHNjYWxpbmdBZGp1c3RtZW50OiAtMSxcbiAgICAgICAgYWRqdXN0bWVudFR5cGU6ICdDaGFuZ2VJbkNhcGFjaXR5JyxcbiAgICAgICAgY29vbGRvd246IDMwMCxcbiAgICAgICAgYXV0b3NjYWxpbmdHcm91cE5hbWU6IGF1dG9TY2FsaW5nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cE5hbWUgPSBhdXRvU2NhbGluZ0dyb3VwLm5hbWU7XG4gICAgdGhpcy50YXJnZXRHcm91cEFybiA9IHRhcmdldEdyb3VwLmFybjtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGF1dG9TY2FsaW5nR3JvdXBOYW1lOiB0aGlzLmF1dG9TY2FsaW5nR3JvdXBOYW1lLFxuICAgICAgdGFyZ2V0R3JvdXBBcm46IHRoaXMudGFyZ2V0R3JvdXBBcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==