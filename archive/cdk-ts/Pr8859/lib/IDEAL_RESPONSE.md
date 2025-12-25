# AWS VPC with Auto Scaling Infrastructure - Ideal Implementation

Complete infrastructure as code solution using AWS CDK with TypeScript for provisioning VPC, EC2 instances, and Auto Scaling with LocalStack compatibility.

## Stack Implementation

The solution creates a fully functional VPC environment with Auto Scaling capability, optimized for both AWS and LocalStack deployments.

### Key Features

- VPC with 10.0.0.0/16 CIDR across 2 availability zones
- Public and private subnets (CIDR /24 each)
- NAT Gateway for private subnet internet access (skipped for LocalStack)
- Auto Scaling Group maintaining 2-4 EC2 instances
- Security Groups with SSH and HTTP access controls
- IAM roles with proper permissions
- CloudWatch integration and cost tracking tags

### LocalStack Compatibility

The implementation includes runtime detection for LocalStack environment and conditionally configures:
- Private subnet type (PRIVATE_ISOLATED vs PRIVATE_WITH_NAT)
- NAT Gateway creation (disabled for LocalStack)
- IAM managed policies (skipped for LocalStack Community)
- AWS Compute Optimizer permissions (skipped for LocalStack)
- RemovalPolicy.DESTROY for easy cleanup

## Complete Code

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const namePrefix = `tap-${environmentSuffix}`;

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566') ||
      process.env.LOCALSTACK === 'true';

    // Create VPC with conditional NAT Gateway
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `${namePrefix}-vpc`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: isLocalStack
            ? ec2.SubnetType.PRIVATE_ISOLATED
            : ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      natGateways: isLocalStack ? 0 : 1,
    });

    // Security group with proper ingress rules
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      securityGroupName: `${namePrefix}-web-sg`,
      vpc,
      description: 'Security group for web instances',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH access from specific IP range'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access'
    );

    // IAM role with conditional managed policies
    const instanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: `${namePrefix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: isLocalStack
        ? []
        : [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'CloudWatchAgentServerPolicy'
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'AmazonSSMManagedInstanceCore'
            ),
          ],
    });

    // AWS Compute Optimizer permissions (skip for LocalStack)
    if (!isLocalStack) {
      instanceRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'compute-optimizer:GetRecommendationSummaries',
            'compute-optimizer:GetAutoScalingGroupRecommendations',
          ],
          resources: ['*'],
        })
      );
    }

    // Launch template with t3.micro instance type
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `${namePrefix}-launch-template`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: webSecurityGroup,
      role: instanceRole,
      userData: ec2.UserData.forLinux(),
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAutoScalingGroup',
      {
        autoScalingGroupName: `${namePrefix}-asg`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 4,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.seconds(300),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          minInstancesInService: 1,
        }),
      }
    );

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CpuScaleUp', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Apply removal policies for LocalStack cleanup
    if (isLocalStack) {
      vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      autoScalingGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      instanceRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      webSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      launchTemplate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Cost tracking tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'TapInfrastructure');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
    cdk.Tags.of(this).add('Owner', 'DevOps');
    cdk.Tags.of(vpc).add('Name', `${namePrefix}-vpc`);
    cdk.Tags.of(autoScalingGroup).add('Name', `${namePrefix}-asg`);
    cdk.Tags.of(webSecurityGroup).add('Name', `${namePrefix}-web-sg`);

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'VpcId', {
      description: 'VPC ID',
      value: vpc.vpcId,
      exportName: `${namePrefix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      description: 'VPC CIDR Block',
      value: vpc.vpcCidrBlock,
      exportName: `${namePrefix}-vpc-cidr`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      description: 'Auto Scaling Group Name',
      value: autoScalingGroup.autoScalingGroupName,
      exportName: `${namePrefix}-asg-name`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      description: 'Security Group ID',
      value: webSecurityGroup.securityGroupId,
      exportName: `${namePrefix}-sg-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      description: 'Public Subnet IDs',
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      exportName: `${namePrefix}-public-subnet-ids`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      description: 'Private Subnet IDs',
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      exportName: `${namePrefix}-private-subnet-ids`,
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      description: 'Availability Zones',
      value: vpc.availabilityZones.join(','),
      exportName: `${namePrefix}-azs`,
    });

    new cdk.CfnOutput(this, 'LaunchTemplateName', {
      description: 'Launch Template Name',
      value: launchTemplate.launchTemplateName || 'N/A',
      exportName: `${namePrefix}-launch-template-name`,
    });

    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      description: 'EC2 Instance Role ARN',
      value: instanceRole.roleArn,
      exportName: `${namePrefix}-instance-role-arn`,
    });
  }
}
```

## Deployment Instructions

### AWS Deployment

```bash
npm install
npx cdk synth
npx cdk deploy --all --require-approval never
```

### LocalStack Deployment

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export LOCALSTACK=true
npm install
npx cdk synth
npx cdklocal deploy --all --require-approval never
```

## Testing

Run unit and integration tests:

```bash
npm test
npm run test:integration
```

## Architecture Benefits

1. High Availability: Resources distributed across 2 AZs
2. Security: SSH access restricted to specific IP range
3. Scalability: Auto Scaling maintains 2-4 instances based on CPU
4. Cost Optimization: Single NAT Gateway, t3.micro instances
5. Observability: CloudWatch integration via IAM policies
6. LocalStack Compatible: Conditional resource creation
