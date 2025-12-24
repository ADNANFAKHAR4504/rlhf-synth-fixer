# AWS Infrastructure with VPC and Auto Scaling

Here's the CDK infrastructure code for setting up VPC with EC2 Auto Scaling:

## Main Stack (lib/tap-stack.ts)

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

    // LocalStack detection
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566') ||
      process.env.LOCALSTACK === 'true';

    // VPC with public and private subnets
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

    // Security group
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

    // IAM role for EC2
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

    // Launch template
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

    autoScalingGroup.scaleOnCpuUtilization('CpuScaleUp', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Removal policies for LocalStack
    if (isLocalStack) {
      vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      autoScalingGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      instanceRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      webSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      launchTemplate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'TapInfrastructure');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
    cdk.Tags.of(this).add('Owner', 'DevOps');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      description: 'VPC ID',
      value: vpc.vpcId,
      exportName: `${namePrefix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      description: 'Auto Scaling Group Name',
      value: autoScalingGroup.autoScalingGroupName,
      exportName: `${namePrefix}-asg-name`,
    });
  }
}
```

## Deployment

Deploy with:

```bash
npm install
cdk synth
cdk deploy --all --require-approval never
```
