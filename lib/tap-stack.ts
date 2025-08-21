import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConstruct } from './environment-construct';
import { EnvironmentConfig } from './interfaces';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;

    // Environment configurations
    const environments: EnvironmentConfig[] = [
      {
        name: 'development',
        vpcCidr: '10.0.0.0/16',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MICRO
        ),
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      },
      {
        name: 'staging',
        vpcCidr: '10.1.0.0/16',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24'],
        privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24'],
      },
      {
        name: 'production',
        vpcCidr: '10.2.0.0/16',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.M5,
          ec2.InstanceSize.LARGE
        ),
        publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24'],
        privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24'],
      },
    ];

    // Create shared IAM role for EC2 instances
    const sharedInstanceRole = new iam.Role(this, 'SharedInstanceRole', {
      roleName: `shared-instance-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Shared IAM role for EC2 instances across environments',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Create shared security group (will be associated with multiple VPCs)
    const tempVpc = new ec2.Vpc(this, 'TempVpcForSharedSG', {
      vpcName: `temp-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
      maxAzs: 1,
      natGateways: 0,
    });

    const sharedSecurityGroup = new ec2.SecurityGroup(
      this,
      'SharedSecurityGroup',
      {
        vpc: tempVpc,
        description:
          'Shared security group for common rules across environments',
        securityGroupName: `shared-sg-${environmentSuffix}`,
      }
    );

    // Add common rules to shared security group
    sharedSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(22),
      'SSH access'
    );
    sharedSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Create environment constructs
    const environmentConstructs: EnvironmentConstruct[] = [];

    environments.forEach(config => {
      const envConstruct = new EnvironmentConstruct(
        this,
        `${config.name}Environment`,
        {
          environmentConfig: config,
          environmentSuffix,
          sharedInstanceRole,
          sharedSecurityGroup,
        }
      );

      environmentConstructs.push(envConstruct);

      // Apply tags to the environment
      cdk.Tags.of(envConstruct).add('Environment', config.name);
      cdk.Tags.of(envConstruct).add('Owner', 'Infrastructure Team');
      cdk.Tags.of(envConstruct).add('Purpose', 'Multi-environment testing');
    });

    // Output environment information
    environments.forEach(config => {
      const envConstruct = environmentConstructs.find(
        e => e.environmentName === config.name
      );
      if (envConstruct) {
        new cdk.CfnOutput(this, `${config.name}VpcId`, {
          value: envConstruct.vpc.vpcId,
          description: `VPC ID for ${config.name} environment`,
          exportName: `${config.name}-vpc-id-${environmentSuffix}`,
        });

        new cdk.CfnOutput(this, `${config.name}InstanceId`, {
          value: envConstruct.instanceId,
          description: `Instance ID for ${config.name} environment`,
          exportName: `${config.name}-instance-id-${environmentSuffix}`,
        });

        new cdk.CfnOutput(this, `${config.name}InstancePrivateIp`, {
          value: envConstruct.instancePrivateIp,
          description: `Private IP for ${config.name} instance`,
          exportName: `${config.name}-instance-ip-${environmentSuffix}`,
        });
      }
    });
  }
}
