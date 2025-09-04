import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecureVpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcCidr?: string;
  allowedSshCidr?: string;
  existingVpcId?: string;
  companyTags?: { [key: string]: string };
  createNatGateway?: boolean;
}

export class SecureVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly natGateway: ec2.CfnNatGateway | undefined;
  public readonly ec2Instances: ec2.Instance[];

  constructor(scope: Construct, id: string, props?: SecureVpcStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Default values
    const createNatGateway = props?.createNatGateway ?? true;
    const vpcCidr = props?.vpcCidr || '10.0.0.0/16';
    const allowedSshCidr = props?.allowedSshCidr || '0.0.0.0/0';
    const companyTags = props?.companyTags || {
      Environment: 'Production',
      Project: 'SecureVPC',
      Owner: 'DevOps',
      CostCenter: 'IT-Infrastructure',
    };

    // Apply tags to all resources in the stack
    Object.entries(companyTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create VPC with DNS support
    const subnetConfiguration = [
      {
        cidrMask: 24,
        name: 'PublicSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      },
    ];

    // Only add private subnets if NAT Gateway is enabled
    if (createNatGateway) {
      subnetConfiguration.push({
        cidrMask: 24,
        name: 'PrivateSubnet',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      });
    }

    this.vpc = new ec2.Vpc(this, `SecureVPC${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration,
      natGateways: createNatGateway ? 1 : 0,
    });

    // Get subnet references
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Get NAT Gateway reference from the first public subnet
    const natGateways = this.vpc.publicSubnets[0].node.children.filter(child =>
      child.node.id.includes('NATGateway')
    );
    this.natGateway =
      natGateways.length > 0
        ? (natGateways[0] as ec2.CfnNatGateway)
        : undefined;

    // Create Security Group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    // Allow SSH access from specific CIDR
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'SSH access from allowed CIDR'
    );

    // Allow HTTP traffic
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Create IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2InstanceRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add S3 access policy
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::company-bucket-${environmentSuffix}/*`,
          `arn:aws:s3:::company-bucket-${environmentSuffix}`,
        ],
      })
    );

    // Get latest Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux2();

    // Create EC2 instances in public subnets
    this.ec2Instances = [];
    this.publicSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(
        this,
        `WebServer${environmentSuffix}${index + 1}`,
        {
          vpc: this.vpc,
          vpcSubnets: { subnets: [subnet] },
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: amzn2Ami,
          securityGroup: webSecurityGroup,
          role: ec2Role,
          detailedMonitoring: true,
          userData: ec2.UserData.forLinux(),
        }
      );

      // Create Elastic IP and associate with instance
      new ec2.CfnEIP(this, `EIP${environmentSuffix}${index + 1}`, {
        domain: 'vpc',
        instanceId: instance.instanceId,
      });

      this.ec2Instances.push(instance);
    });

    // Create SNS Topic for alerts
    const alertTopic = new sns.Topic(
      this,
      `CPUAlertTopic${environmentSuffix}`,
      {
        displayName: 'CPU Usage Alerts',
      }
    );

    // Create CloudWatch Log Group
    new logs.LogGroup(this, `EC2LogGroup${environmentSuffix}`, {
      logGroupName: `/aws/ec2/secure-vpc-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CloudWatch Alarms for each EC2 instance
    this.ec2Instances.forEach((instance, index) => {
      const alarm = new cloudwatch.Alarm(
        this,
        `CPUAlarm${environmentSuffix}${index + 1}`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            period: cdk.Duration.minutes(5),
          }),
          threshold: 70,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `CPU utilization alarm for ${instance.instanceId}`,
        }
      );

      alarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
    });

    // VPC Peering (conditional)
    if (props?.existingVpcId) {
      const peeringConnection = new ec2.CfnVPCPeeringConnection(
        this,
        `VPCPeering${environmentSuffix}`,
        {
          vpcId: this.vpc.vpcId,
          peerVpcId: props.existingVpcId,
        }
      );

      // Add routes for peering connection
      this.vpc.publicSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(
          this,
          `PeeringRoutePublic${environmentSuffix}${index}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: '10.1.0.0/16', // Peer VPC CIDR
            vpcPeeringConnectionId: peeringConnection.ref,
          }
        );
      });
    }

    // Store parameters in SSM
    new ssm.StringParameter(this, `VPCIdParameter${environmentSuffix}`, {
      parameterName: `/secure-vpc-${environmentSuffix}/vpc-id`,
      stringValue: this.vpc.vpcId,
      description: 'VPC ID for secure VPC stack',
    });

    // Outputs (keeping under 10KB limit)
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `SecureVPC${environmentSuffix}-VPCId`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `SecureVPC${environmentSuffix}-PublicSubnets`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `SecureVPC${environmentSuffix}-PrivateSubnets`,
    });

    new cdk.CfnOutput(this, 'NATGatewayId', {
      value: this.natGateway?.node?.id || 'NotFound',
      description: 'NAT Gateway ID',
      exportName: `SecureVPC${environmentSuffix}-NATGateway`,
    });

    new cdk.CfnOutput(this, 'ElasticIPAddresses', {
      value: this.ec2Instances
        .map(
          (instance, index) =>
            this.node.findChild(`EIP${environmentSuffix}${index + 1}`).node.id
        )
        .join(','),
      description: 'Elastic IP addresses for EC2 instances',
      exportName: `SecureVPC${environmentSuffix}-ElasticIPs`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `SecureVPC${environmentSuffix}-SNSTopicArn`,
    });
  }
}
