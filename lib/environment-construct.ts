import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './interfaces';

export interface EnvironmentConstructProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
  sharedInstanceRole: iam.Role;
  sharedSecurityGroup: ec2.SecurityGroup;
}

export class EnvironmentConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly environmentName: string;
  public readonly instanceId: string;
  public readonly instancePrivateIp: string;
  private readonly environmentConfig: EnvironmentConfig;
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: EnvironmentConstructProps) {
    super(scope, id);

    this.environmentConfig = props.environmentConfig;
    this.environmentName = props.environmentConfig.name;
    this.environmentSuffix = props.environmentSuffix;

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.environmentConfig.vpcCidr),
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
      vpcName: `${props.environmentConfig.name}-vpc-${this.environmentSuffix}`,
    });

    // Create VPC Flow Logs
    const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowLogsLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${props.environmentConfig.name}-${this.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      roleName: `vpc-flow-logs-role-${props.environmentConfig.name}-${this.environmentSuffix}`,
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
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create environment-specific security group
    const environmentSecurityGroup = new ec2.SecurityGroup(
      this,
      'EnvironmentSecurityGroup',
      {
        vpc: this.vpc,
        description: `Security group for ${props.environmentConfig.name} environment`,
        securityGroupName: `${props.environmentConfig.name}-sg-${this.environmentSuffix}`,
      }
    );

    // Add environment-specific rules
    environmentSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.environmentConfig.vpcCidr),
      ec2.Port.allTcp(),
      'Allow all TCP traffic within VPC'
    );

    // Associate shared security group with this VPC (using Security Group VPC Associations)
    new ec2.CfnSecurityGroupVpcAssociation(
      this,
      'SharedSecurityGroupAssociation',
      {
        groupId: props.sharedSecurityGroup.securityGroupId,
        vpcId: this.vpc.vpcId,
      }
    );

    // Create restrictive Network ACL
    const restrictiveNetworkAcl = new ec2.NetworkAcl(
      this,
      'RestrictiveNetworkAcl',
      {
        vpc: this.vpc,
        networkAclName: `${props.environmentConfig.name}-restrictive-nacl-${this.environmentSuffix}`,
      }
    );

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
      new ec2.SubnetNetworkAclAssociation(
        this,
        `PrivateSubnetNaclAssociation${index}`,
        {
          subnet: subnet,
          networkAcl: restrictiveNetworkAcl,
        }
      );
    });

    // Create EC2 instance for testing
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'echo "Environment: ' +
        props.environmentConfig.name +
        '" > /home/ec2-user/environment.txt'
    );

    const instance = new ec2.Instance(this, 'TestInstance', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: props.environmentConfig.instanceType,
      // Using hardcoded AMI ID to avoid SSM permissions issue
      // To find the latest AMI ID, use: aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --region us-west-2
      machineImage: ec2.MachineImage.genericLinux({
        'us-west-2': 'ami-0c2d3e23e757b5d84', // Amazon Linux 2023 AMI (replace with latest if needed)
      }),
      role: props.sharedInstanceRole,
      securityGroup: environmentSecurityGroup,
      userData: userData,
      instanceName: `${props.environmentConfig.name}-test-instance-${this.environmentSuffix}`,
    });

    // Apply additional security configurations
    const cfnInstance = instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.addPropertyOverride('MetadataOptions.HttpTokens', 'required');
    cfnInstance.addPropertyOverride(
      'MetadataOptions.HttpPutResponseHopLimit',
      1
    );
    cfnInstance.addPropertyOverride('MetadataOptions.HttpEndpoint', 'enabled');

    // Store instance information
    this.instanceId = instance.instanceId;
    this.instancePrivateIp = instance.instancePrivateIp;

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
