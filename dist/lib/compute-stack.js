"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputeStack = void 0;
const constructs_1 = require("constructs");
const security_group_1 = require("@cdktf/provider-aws/lib/security-group");
const security_group_rule_1 = require("@cdktf/provider-aws/lib/security-group-rule");
const launch_template_1 = require("@cdktf/provider-aws/lib/launch-template");
const autoscaling_group_1 = require("@cdktf/provider-aws/lib/autoscaling-group");
const alb_1 = require("@cdktf/provider-aws/lib/alb");
const alb_target_group_1 = require("@cdktf/provider-aws/lib/alb-target-group");
const alb_listener_1 = require("@cdktf/provider-aws/lib/alb-listener");
const data_aws_ami_1 = require("@cdktf/provider-aws/lib/data-aws-ami");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_attachment_1 = require("@cdktf/provider-aws/lib/iam-role-policy-attachment");
const iam_instance_profile_1 = require("@cdktf/provider-aws/lib/iam-instance-profile");
class ComputeStack extends constructs_1.Construct {
    alb;
    asg;
    constructor(scope, id, props) {
        super(scope, id);
        const ec2SecurityGroup = new security_group_1.SecurityGroup(this, 'ec2-sg', {
            vpcId: props.vpc.id,
            description: 'Security group for EC2 instances',
            tags: {
                Name: 'portfolio-ec2-sg',
            },
        });
        const albSecurityGroup = new security_group_1.SecurityGroup(this, 'alb-sg', {
            vpcId: props.vpc.id,
            description: 'Security group for ALB',
            tags: {
                Name: 'portfolio-alb-sg',
            },
        });
        new security_group_rule_1.SecurityGroupRule(this, 'alb-http-ingress', {
            type: 'ingress',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroupId: albSecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        new security_group_rule_1.SecurityGroupRule(this, 'alb-https-ingress', {
            type: 'ingress',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            securityGroupId: albSecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        new security_group_rule_1.SecurityGroupRule(this, 'alb-egress', {
            type: 'egress',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            securityGroupId: albSecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        new security_group_rule_1.SecurityGroupRule(this, 'ec2-alb-ingress', {
            type: 'ingress',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroupId: ec2SecurityGroup.id,
            sourceSecurityGroupId: albSecurityGroup.id,
        });
        new security_group_rule_1.SecurityGroupRule(this, 'ec2-egress', {
            type: 'egress',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            securityGroupId: ec2SecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        const ec2Role = new iam_role_1.IamRole(this, 'ec2-role', {
            name: `portfolio-ec2-role-${props.environmentSuffix}`,
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
        });
        new iam_role_policy_attachment_1.IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        });
        const instanceProfile = new iam_instance_profile_1.IamInstanceProfile(this, 'ec2-profile', {
            name: `portfolio-ec2-profile-${props.environmentSuffix}`,
            role: ec2Role.name,
        });
        const ami = new data_aws_ami_1.DataAwsAmi(this, 'amazon-linux-2', {
            mostRecent: true,
            owners: ['amazon'],
            filter: [
                {
                    name: 'name',
                    values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                },
                {
                    name: 'virtualization-type',
                    values: ['hvm'],
                },
            ],
        });
        const userDataScript = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
echo "Portfolio tracking app initialization complete"`;
        const launchTemplate = new launch_template_1.LaunchTemplate(this, 'lt', {
            name: `portfolio-lt-${props.environmentSuffix}`,
            imageId: ami.id,
            instanceType: 't3.medium',
            vpcSecurityGroupIds: [ec2SecurityGroup.id],
            iamInstanceProfile: {
                name: instanceProfile.name,
            },
            userData: Buffer.from(userDataScript).toString('base64'),
            tagSpecifications: [
                {
                    resourceType: 'instance',
                    tags: {
                        Name: 'portfolio-app-instance',
                    },
                },
            ],
        });
        const targetGroup = new alb_target_group_1.AlbTargetGroup(this, 'tg', {
            name: `portfolio-tg-${props.environmentSuffix}`,
            port: 80,
            protocol: 'HTTP',
            vpcId: props.vpc.id,
            targetType: 'instance',
            healthCheck: {
                enabled: true,
                path: '/health',
                port: '80',
                protocol: 'HTTP',
                healthyThreshold: 2,
                unhealthyThreshold: 2,
                timeout: 5,
                interval: 30,
            },
            stickiness: {
                type: 'lb_cookie',
                enabled: true,
                cookieDuration: 86400,
            },
            tags: {
                Name: 'portfolio-tg',
            },
        });
        this.asg = new autoscaling_group_1.AutoscalingGroup(this, 'asg', {
            name: `portfolio-asg-${props.environmentSuffix}`,
            minSize: 2,
            maxSize: 6,
            desiredCapacity: 2,
            launchTemplate: {
                id: launchTemplate.id,
                version: '$Latest',
            },
            vpcZoneIdentifier: props.privateSubnets.map(subnet => subnet.id),
            targetGroupArns: [targetGroup.arn],
            healthCheckType: 'ELB',
            healthCheckGracePeriod: 300,
            tag: [
                {
                    key: 'Name',
                    value: 'portfolio-asg-instance',
                    propagateAtLaunch: true,
                },
            ],
        });
        this.alb = new alb_1.Alb(this, 'alb', {
            name: `portfolio-alb-${props.environmentSuffix}`,
            internal: false,
            loadBalancerType: 'application',
            securityGroups: [albSecurityGroup.id],
            subnets: props.publicSubnets.map(subnet => subnet.id),
            enableHttp2: true,
            enableCrossZoneLoadBalancing: true,
            tags: {
                Name: 'portfolio-alb',
            },
        });
        new alb_listener_1.AlbListener(this, 'alb-listener', {
            loadBalancerArn: this.alb.arn,
            port: 80,
            protocol: 'HTTP',
            defaultAction: [
                {
                    type: 'forward',
                    targetGroupArn: targetGroup.arn,
                },
            ],
        });
    }
}
exports.ComputeStack = ComputeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb21wdXRlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUF1QztBQUt2QywyRUFBdUU7QUFDdkUscUZBQWdGO0FBQ2hGLDZFQUF5RTtBQUN6RSxpRkFBNkU7QUFDN0UscURBQWtEO0FBQ2xELCtFQUEwRTtBQUMxRSx1RUFBbUU7QUFDbkUsdUVBQWtFO0FBQ2xFLCtEQUEyRDtBQUMzRCxtR0FBNkY7QUFDN0YsdUZBQWtGO0FBWWxGLE1BQWEsWUFBYSxTQUFRLHNCQUFTO0lBQ3pCLEdBQUcsQ0FBTTtJQUNULEdBQUcsQ0FBbUI7SUFFdEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw4QkFBYSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDekQsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUsa0NBQWtDO1lBQy9DLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsa0JBQWtCO2FBQ3pCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDhCQUFhLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUN6RCxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLFdBQVcsRUFBRSx3QkFBd0I7WUFDckMsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxrQkFBa0I7YUFDekI7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLHVDQUFpQixDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM5QyxJQUFJLEVBQUUsU0FBUztZQUNmLFFBQVEsRUFBRSxFQUFFO1lBQ1osTUFBTSxFQUFFLEVBQUU7WUFDVixRQUFRLEVBQUUs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LElBQUk7WUFDakIsNEJBQTRCLEVBQUUsSUFBSTtZQUNsQyxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGVBQWU7YUFDdEI7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLDBCQUFXLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNwQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1lBQzdCLElBQUksRUFBRSxFQUFFO1lBQ1IsUUFBUSxFQUFFLE1BQU07WUFDaEIsYUFBYSxFQUFFO2dCQUNiO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGNBQWMsRUFBRSxXQUFXLENBQUMsR0FBRztpQkFDaEM7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9NRCxvQ0ErTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IFZwYyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3ZwYyc7XG5pbXBvcnQgeyBTdWJuZXQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zdWJuZXQnO1xuaW1wb3J0IHsgRGJJbnN0YW5jZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2RiLWluc3RhbmNlJztcbmltcG9ydCB7IEVsYXN0aWNhY2hlU2VydmVybGVzc0NhY2hlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZWxhc3RpY2FjaGUtc2VydmVybGVzcy1jYWNoZSc7XG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc2VjdXJpdHktZ3JvdXAnO1xuaW1wb3J0IHsgU2VjdXJpdHlHcm91cFJ1bGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zZWN1cml0eS1ncm91cC1ydWxlJztcbmltcG9ydCB7IExhdW5jaFRlbXBsYXRlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvbGF1bmNoLXRlbXBsYXRlJztcbmltcG9ydCB7IEF1dG9zY2FsaW5nR3JvdXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hdXRvc2NhbGluZy1ncm91cCc7XG5pbXBvcnQgeyBBbGIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hbGInO1xuaW1wb3J0IHsgQWxiVGFyZ2V0R3JvdXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hbGItdGFyZ2V0LWdyb3VwJztcbmltcG9ydCB7IEFsYkxpc3RlbmVyIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvYWxiLWxpc3RlbmVyJztcbmltcG9ydCB7IERhdGFBd3NBbWkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9kYXRhLWF3cy1hbWknO1xuaW1wb3J0IHsgSWFtUm9sZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlJztcbmltcG9ydCB7IElhbVJvbGVQb2xpY3lBdHRhY2htZW50IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLXJvbGUtcG9saWN5LWF0dGFjaG1lbnQnO1xuaW1wb3J0IHsgSWFtSW5zdGFuY2VQcm9maWxlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaWFtLWluc3RhbmNlLXByb2ZpbGUnO1xuXG5pbnRlcmZhY2UgQ29tcHV0ZVN0YWNrUHJvcHMge1xuICB2cGM6IFZwYztcbiAgcHVibGljU3VibmV0czogU3VibmV0W107XG4gIHByaXZhdGVTdWJuZXRzOiBTdWJuZXRbXTtcbiAgZGF0YWJhc2U6IERiSW5zdGFuY2U7XG4gIGNhY2hlOiBFbGFzdGljYWNoZVNlcnZlcmxlc3NDYWNoZTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wdXRlU3RhY2sgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYWxiOiBBbGI7XG4gIHB1YmxpYyByZWFkb25seSBhc2c6IEF1dG9zY2FsaW5nR3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvbXB1dGVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IGVjMlNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCAnZWMyLXNnJywge1xuICAgICAgdnBjSWQ6IHByb3BzLnZwYy5pZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVDMiBpbnN0YW5jZXMnLFxuICAgICAgdGFnczoge1xuICAgICAgICBOYW1lOiAncG9ydGZvbGlvLWVjMi1zZycsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBTZWN1cml0eUdyb3VwKHRoaXMsICdhbGItc2cnLCB7XG4gICAgICB2cGNJZDogcHJvcHMudnBjLmlkLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgQUxCJyxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogJ3BvcnRmb2xpby1hbGItc2cnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTZWN1cml0eUdyb3VwUnVsZSh0aGlzLCAnYWxiLWh0dHAtaW5ncmVzcycsIHtcbiAgICAgIHR5cGU6ICdpbmdyZXNzJyxcbiAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgIHRvUG9ydDogODAsXG4gICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICBzZWN1cml0eUdyb3VwSWQ6IGFsYlNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgIH0pO1xuXG4gICAgbmV3IFNlY3VyaXR5R3JvdXBSdWxlKHRoaXMsICdhbGItaHR0cHMtaW5ncmVzcycsIHtcbiAgICAgIHR5cGU6ICdpbmdyZXNzJyxcbiAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZDogYWxiU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgfSk7XG5cbiAgICBuZXcgU2VjdXJpdHlHcm91cFJ1bGUodGhpcywgJ2FsYi1lZ3Jlc3MnLCB7XG4gICAgICB0eXBlOiAnZWdyZXNzJyxcbiAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgdG9Qb3J0OiAwLFxuICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICBzZWN1cml0eUdyb3VwSWQ6IGFsYlNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgIH0pO1xuXG4gICAgbmV3IFNlY3VyaXR5R3JvdXBSdWxlKHRoaXMsICdlYzItYWxiLWluZ3Jlc3MnLCB7XG4gICAgICB0eXBlOiAnaW5ncmVzcycsXG4gICAgICBmcm9tUG9ydDogODAsXG4gICAgICB0b1BvcnQ6IDgwLFxuICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiBlYzJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgc291cmNlU2VjdXJpdHlHcm91cElkOiBhbGJTZWN1cml0eUdyb3VwLmlkLFxuICAgIH0pO1xuXG4gICAgbmV3IFNlY3VyaXR5R3JvdXBSdWxlKHRoaXMsICdlYzItZWdyZXNzJywge1xuICAgICAgdHlwZTogJ2VncmVzcycsXG4gICAgICBmcm9tUG9ydDogMCxcbiAgICAgIHRvUG9ydDogMCxcbiAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiBlYzJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGVjMlJvbGUgPSBuZXcgSWFtUm9sZSh0aGlzLCAnZWMyLXJvbGUnLCB7XG4gICAgICBuYW1lOiBgcG9ydGZvbGlvLWVjMi1yb2xlLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgU2VydmljZTogJ2VjMi5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgbmV3IElhbVJvbGVQb2xpY3lBdHRhY2htZW50KHRoaXMsICdlYzItc3NtLXBvbGljeScsIHtcbiAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICAgIHBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IElhbUluc3RhbmNlUHJvZmlsZSh0aGlzLCAnZWMyLXByb2ZpbGUnLCB7XG4gICAgICBuYW1lOiBgcG9ydGZvbGlvLWVjMi1wcm9maWxlLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFtaSA9IG5ldyBEYXRhQXdzQW1pKHRoaXMsICdhbWF6b24tbGludXgtMicsIHtcbiAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICBvd25lcnM6IFsnYW1hem9uJ10sXG4gICAgICBmaWx0ZXI6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICduYW1lJyxcbiAgICAgICAgICB2YWx1ZXM6IFsnYW16bjItYW1pLWh2bS0qLXg4Nl82NC1ncDInXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICd2aXJ0dWFsaXphdGlvbi10eXBlJyxcbiAgICAgICAgICB2YWx1ZXM6IFsnaHZtJ10sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlckRhdGFTY3JpcHQgPSBgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbnl1bSBpbnN0YWxsIC15IGFtYXpvbi1jbG91ZHdhdGNoLWFnZW50XG5hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtc1xuZWNobyBcIlBvcnRmb2xpbyB0cmFja2luZyBhcHAgaW5pdGlhbGl6YXRpb24gY29tcGxldGVcImA7XG5cbiAgICBjb25zdCBsYXVuY2hUZW1wbGF0ZSA9IG5ldyBMYXVuY2hUZW1wbGF0ZSh0aGlzLCAnbHQnLCB7XG4gICAgICBuYW1lOiBgcG9ydGZvbGlvLWx0LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGltYWdlSWQ6IGFtaS5pZCxcbiAgICAgIGluc3RhbmNlVHlwZTogJ3QzLm1lZGl1bScsXG4gICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbZWMyU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICBpYW1JbnN0YW5jZVByb2ZpbGU6IHtcbiAgICAgICAgbmFtZTogaW5zdGFuY2VQcm9maWxlLm5hbWUsXG4gICAgICB9LFxuICAgICAgdXNlckRhdGE6IEJ1ZmZlci5mcm9tKHVzZXJEYXRhU2NyaXB0KS50b1N0cmluZygnYmFzZTY0JyksXG4gICAgICB0YWdTcGVjaWZpY2F0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgcmVzb3VyY2VUeXBlOiAnaW5zdGFuY2UnLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIE5hbWU6ICdwb3J0Zm9saW8tYXBwLWluc3RhbmNlJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IEFsYlRhcmdldEdyb3VwKHRoaXMsICd0ZycsIHtcbiAgICAgIG5hbWU6IGBwb3J0Zm9saW8tdGctJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcG9ydDogODAsXG4gICAgICBwcm90b2NvbDogJ0hUVFAnLFxuICAgICAgdnBjSWQ6IHByb3BzLnZwYy5pZCxcbiAgICAgIHRhcmdldFR5cGU6ICdpbnN0YW5jZScsXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBwYXRoOiAnL2hlYWx0aCcsXG4gICAgICAgIHBvcnQ6ICc4MCcsXG4gICAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICAgIGhlYWx0aHlUaHJlc2hvbGQ6IDIsXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZDogMixcbiAgICAgICAgdGltZW91dDogNSxcbiAgICAgICAgaW50ZXJ2YWw6IDMwLFxuICAgICAgfSxcbiAgICAgIHN0aWNraW5lc3M6IHtcbiAgICAgICAgdHlwZTogJ2xiX2Nvb2tpZScsXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGNvb2tpZUR1cmF0aW9uOiA4NjQwMCxcbiAgICAgIH0sXG4gICAgICB0YWdzOiB7XG4gICAgICAgIE5hbWU6ICdwb3J0Zm9saW8tdGcnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYXNnID0gbmV3IEF1dG9zY2FsaW5nR3JvdXAodGhpcywgJ2FzZycsIHtcbiAgICAgIG5hbWU6IGBwb3J0Zm9saW8tYXNnLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIG1pblNpemU6IDIsXG4gICAgICBtYXhTaXplOiA2LFxuICAgICAgZGVzaXJlZENhcGFjaXR5OiAyLFxuICAgICAgbGF1bmNoVGVtcGxhdGU6IHtcbiAgICAgICAgaWQ6IGxhdW5jaFRlbXBsYXRlLmlkLFxuICAgICAgICB2ZXJzaW9uOiAnJExhdGVzdCcsXG4gICAgICB9LFxuICAgICAgdnBjWm9uZUlkZW50aWZpZXI6IHByb3BzLnByaXZhdGVTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKSxcbiAgICAgIHRhcmdldEdyb3VwQXJuczogW3RhcmdldEdyb3VwLmFybl0sXG4gICAgICBoZWFsdGhDaGVja1R5cGU6ICdFTEInLFxuICAgICAgaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZDogMzAwLFxuICAgICAgdGFnOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6ICdOYW1lJyxcbiAgICAgICAgICB2YWx1ZTogJ3BvcnRmb2xpby1hc2ctaW5zdGFuY2UnLFxuICAgICAgICAgIHByb3BhZ2F0ZUF0TGF1bmNoOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWxiID0gbmV3IEFsYih0aGlzLCAnYWxiJywge1xuICAgICAgbmFtZTogYHBvcnRmb2xpby1hbGItJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgaW50ZXJuYWw6IGZhbHNlLFxuICAgICAgbG9hZEJhbGFuY2VyVHlwZTogJ2FwcGxpY2F0aW9uJyxcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbYWxiU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICBzdWJuZXRzOiBwcm9wcy5wdWJsaWNTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKSxcbiAgICAgIGVuYWJsZUh0dHAyOiB0cnVlLFxuICAgICAgZW5hYmxlQ3Jvc3Nab25lTG9hZEJhbGFuY2luZzogdHJ1ZSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogJ3BvcnRmb2xpby1hbGInLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBBbGJMaXN0ZW5lcih0aGlzLCAnYWxiLWxpc3RlbmVyJywge1xuICAgICAgbG9hZEJhbGFuY2VyQXJuOiB0aGlzLmFsYi5hcm4sXG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICBkZWZhdWx0QWN0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnZm9yd2FyZCcsXG4gICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IHRhcmdldEdyb3VwLmFybixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==