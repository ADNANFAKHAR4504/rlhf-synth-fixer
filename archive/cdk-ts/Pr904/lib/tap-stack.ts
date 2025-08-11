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

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const namePrefix = `tap-${environmentSuffix}`;

    // Create VPC with CIDR block 10.0.0.0/16
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `${namePrefix}-vpc`,
      cidr: '10.0.0.0/16',
      maxAzs: 2, // Use exactly 2 availability zones
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      natGateways: 1, // Single NAT gateway for cost optimization
    });

    // Create security group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      securityGroupName: `${namePrefix}-web-sg`,
      vpc,
      description: 'Security group for web instances',
      allowAllOutbound: true,
    });

    // Allow SSH access from specific IP range only
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH access from specific IP range'
    );

    // Allow HTTP access for web traffic
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access'
    );

    // Create IAM role for EC2 instances with AWS Compute Optimizer permissions
    const instanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: `${namePrefix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add permissions for AWS Compute Optimizer
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

    // Create launch template
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

    // Create Auto Scaling Group
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
          subnetType: ec2.SubnetType.PUBLIC, // Deploy in public subnets
        },
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.seconds(300),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          minInstancesInService: 1,
        }),
      }
    );

    // Add scaling policies for cost optimization
    autoScalingGroup.scaleOnCpuUtilization('CpuScaleUp', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Add tags for cost tracking
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'TapInfrastructure');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
    cdk.Tags.of(this).add('Owner', 'DevOps');
    cdk.Tags.of(vpc).add('Name', `${namePrefix}-vpc`);
    cdk.Tags.of(autoScalingGroup).add('Name', `${namePrefix}-asg`);
    cdk.Tags.of(webSecurityGroup).add('Name', `${namePrefix}-web-sg`);

    // Output important information
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

    new cdk.CfnOutput(this, 'NatGatewayIds', {
      description: 'NAT Gateway IDs',
      value: 'Created', // NAT gateway is created automatically by VPC construct
      exportName: `${namePrefix}-nat-gateway-ids`,
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
