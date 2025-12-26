# Multi-Environment AWS Infrastructure CDK TypeScript Implementation

This response provides a complete AWS CDK TypeScript implementation for multi-environment infrastructure with production, staging, and development environments.

## File Structure

The implementation consists of the following files:

1. `lib/tap-stack.ts` - Main stack orchestrating all environments
2. `lib/environment-construct.ts` - Reusable construct for each environment
3. `lib/interfaces.ts` - TypeScript interfaces and types
4. `bin/tap.ts` - CDK app entry point

## Implementation

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConstruct } from './environment-construct';
import { EnvironmentConfig } from './interfaces';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Environment configurations
    const environments: EnvironmentConfig[] = [
      {
        name: 'development',
        vpcCidr: '10.0.0.0/16',
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      },
      {
        name: 'staging',
        vpcCidr: '10.1.0.0/16',
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24'],
        privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24'],
      },
      {
        name: 'production',
        vpcCidr: '10.2.0.0/16',
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24'],
        privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24'],
      },
    ];

    // Create shared IAM role for EC2 instances
    const sharedInstanceRole = new iam.Role(this, 'SharedInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Shared IAM role for EC2 instances across environments',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Create shared security group (will be associated with multiple VPCs)
    const sharedSecurityGroup = new ec2.SecurityGroup(this, 'SharedSecurityGroup', {
      vpc: new ec2.Vpc(this, 'TempVpcForSharedSG', {
        cidr: '192.168.0.0/16',
        maxAzs: 1,
      }),
      description: 'Shared security group for common rules across environments',
      securityGroupName: 'shared-sg',
    });

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
    
    environments.forEach((config, index) => {
      const envConstruct = new EnvironmentConstruct(this, `${config.name}Environment`, {
        environmentConfig: config,
        sharedInstanceRole,
        sharedSecurityGroup,
      });
      
      environmentConstructs.push(envConstruct);

      // Apply tags to the environment
      cdk.Tags.of(envConstruct).add('Environment', config.name);
      cdk.Tags.of(envConstruct).add('Owner', 'Infrastructure Team');
      cdk.Tags.of(envConstruct).add('Purpose', 'Multi-environment testing');
    });

    // Output environment information
    environments.forEach((config) => {
      new cdk.CfnOutput(this, `${config.name}VpcId`, {
        value: environmentConstructs.find(e => e.environmentName === config.name)?.vpc.vpcId || 'Not found',
        description: `VPC ID for ${config.name} environment`,
      });
    });
  }
}
```

### lib/environment-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './interfaces';

export interface EnvironmentConstructProps {
  environmentConfig: EnvironmentConfig;
  sharedInstanceRole: iam.Role;
  sharedSecurityGroup: ec2.SecurityGroup;
}

export class EnvironmentConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly environmentName: string;
  private readonly environmentConfig: EnvironmentConfig;

  constructor(scope: Construct, id: string, props: EnvironmentConstructProps) {
    super(scope, id);

    this.environmentConfig = props.environmentConfig;
    this.environmentName = props.environmentConfig.name;

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: props.environmentConfig.vpcCidr,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${props.environmentConfig.name}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${props.environmentConfig.name}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2,
      vpcName: `${props.environmentConfig.name}-vpc`,
    });

    // Create VPC Flow Logs
    const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowLogsLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${props.environmentConfig.name}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsLogGroup, flowLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create environment-specific security group
    const environmentSecurityGroup = new ec2.SecurityGroup(this, 'EnvironmentSecurityGroup', {
      vpc: this.vpc,
      description: `Security group for ${props.environmentConfig.name} environment`,
      securityGroupName: `${props.environmentConfig.name}-sg`,
    });

    // Add environment-specific rules
    environmentSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.environmentConfig.vpcCidr),
      ec2.Port.allTcp(),
      'Allow all TCP traffic within VPC'
    );

    // Associate shared security group with this VPC (using Security Group VPC Associations)
    new ec2.CfnSecurityGroupVpcAssociation(this, 'SharedSecurityGroupAssociation', {
      groupId: props.sharedSecurityGroup.securityGroupId,
      vpcId: this.vpc.vpcId,
    });

    // Create restrictive Network ACL
    const restrictiveNetworkAcl = new ec2.NetworkAcl(this, 'RestrictiveNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `${props.environmentConfig.name}-restrictive-nacl`,
    });

    // Add Network ACL rules
    restrictiveNetworkAcl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    restrictiveNetworkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    restrictiveNetworkAcl.addEntry('AllowSshInbound', {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    restrictiveNetworkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    restrictiveNetworkAcl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Deny cross-environment traffic (example: deny staging from production)
    if (props.environmentConfig.name === 'production') {
      restrictiveNetworkAcl.addEntry('DenyStagingTraffic', {
        cidr: ec2.AclCidr.ipv4('10.1.0.0/16'), // Staging CIDR
        ruleNumber: 90,
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.DENY,
      });
    }

    // Associate Network ACL with private subnets
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(this, `PrivateSubnetNaclAssociation${index}`, {
        subnet: subnet,
        networkAcl: restrictiveNetworkAcl,
      });
    });

    // Create EC2 instance for testing
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'echo "Environment: ' + props.environmentConfig.name + '" > /home/ec2-user/environment.txt'
    );

    const instance = new ec2.Instance(this, 'TestInstance', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: props.environmentConfig.instanceType,
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: props.sharedInstanceRole,
      securityGroup: environmentSecurityGroup,
      userData: userData,
      instanceName: `${props.environmentConfig.name}-test-instance`,
    });

    // Apply additional security configurations
    const cfnInstance = instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.addPropertyOverride('MetadataOptions.HttpTokens', 'required');
    cfnInstance.addPropertyOverride('MetadataOptions.HttpPutResponseHopLimit', 1);
    cfnInstance.addPropertyOverride('MetadataOptions.HttpEndpoint', 'enabled');

    // Output instance information
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: `Instance ID for ${props.environmentConfig.name} environment`,
    });

    new cdk.CfnOutput(this, 'InstancePrivateIp', {
      value: instance.instancePrivateIp,
      description: `Private IP for ${props.environmentConfig.name} instance`,
    });
  }
}
```

### lib/interfaces.ts

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EnvironmentConfig {
  name: string;
  vpcCidr: string;
  instanceType: ec2.InstanceType;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}
```

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply global tags
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Team', 'Infrastructure');

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    region: 'us-west-2',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
```

## Key Features Implemented

1. **Multi-Environment Setup**: Three isolated environments (dev, staging, prod) with different CIDR blocks
2. **Security Group VPC Associations**: Shared security group associated with multiple VPCs
3. **Network ACLs**: Restrictive rules with cross-environment traffic prevention
4. **VPC Flow Logs**: Monitoring for all environments
5. **IAM Roles**: Shared instance role with proper permissions
6. **Tagging Strategy**: Comprehensive tagging for resource management
7. **Instance Types**: Different instance types per environment as specified
8. **Enhanced Security**: IMDSv2 enforcement and proper security configurations

The implementation uses modern AWS CDK patterns and includes the latest AWS features like Security Group VPC Associations for centralized security management across multiple VPCs.