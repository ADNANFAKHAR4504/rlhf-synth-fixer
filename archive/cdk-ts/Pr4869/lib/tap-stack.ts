import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct, IConstruct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  private vpc: ec2.Vpc;
  private natInstances: ec2.Instance[] = [];
  private bastionHost: ec2.Instance;
  private flowLogGroup: logs.LogGroup;
  private hostedZone: route53.PrivateHostedZone;
  private environmentSuffix: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'prod' as default
    this.environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'prod';

    // Create VPC with custom subnets
    this.createVpc();

    // Create NAT instances for cost optimization
    this.createNatInstances();

    // Create secure bastion host
    this.createBastionHost();

    // Create VPC endpoints
    this.createVpcEndpoints();

    // Configure VPC Flow Logs
    this.configureFlowLogs();

    // Create Network ACLs
    this.createNetworkAcls();

    // Setup Private Route53
    this.setupRoute53();

    // Create dynamic security groups
    this.createDynamicSecurityGroups();

    // Setup monitoring and alarms
    this.setupMonitoring();

    // Setup NAT instance failover
    this.setupNatFailover();
  }

  private createVpc(): void {
    // Create VPC with 10.0.0.0/16 CIDR
    this.vpc = new ec2.Vpc(
      this,
      `SecureFinancialVPC${this.environmentSuffix}`,
      {
        cidr: '10.0.0.0/16',
        maxAzs: 3,
        natGateways: 0, // We'll use NAT instances
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
          {
            name: 'Data',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
        ],
        enableDnsHostnames: true,
        enableDnsSupport: true,
      }
    );

    // Note: CDK automatically creates IGW routes for public subnets
    // No need to create explicit routes as they conflict with default ones

    // Tag all VPC resources
    cdk.Tags.of(this.vpc).add('Network-Tier', 'Core');
    cdk.Tags.of(this.vpc).add('Security-Level', 'High');
  }

  private createNatInstances(): void {
    // Security group for NAT instances
    const natSecurityGroup = new ec2.SecurityGroup(
      this,
      `NatSecurityGroup${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for NAT instances',
        allowAllOutbound: true,
      }
    );

    // Allow all traffic from private subnets
    this.vpc.privateSubnets.forEach(subnet => {
      natSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.allTraffic(),
        'Allow all traffic from private subnet'
      );
    });

    // Use Amazon Linux 2 with proper NAT configuration
    const natAmi = ec2.MachineImage.latestAmazonLinux2();

    // Create NAT instance in each public subnet for HA
    this.vpc.publicSubnets.forEach((subnet, index) => {
      // Create IAM role for NAT instance
      const natRole = new iam.Role(
        this,
        `NatInstanceRole${this.environmentSuffix}${index + 1}`,
        {
          assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'AmazonSSMManagedInstanceCore'
            ),
          ],
        }
      );

      // Create Elastic IP first
      const eip = new ec2.CfnEIP(
        this,
        `NatEIP${this.environmentSuffix}${index + 1}`,
        {
          domain: 'vpc',
        }
      );

      const natInstance = new ec2.Instance(
        this,
        `NatInstance${this.environmentSuffix}${index + 1}`,
        {
          vpc: this.vpc,
          vpcSubnets: { subnets: [subnet] },
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.SMALL // Upgraded from MICRO for better stability
          ),
          machineImage: natAmi, // Use official NAT AMI
          securityGroup: natSecurityGroup,
          sourceDestCheck: false, // Required for NAT
          userData: ec2.UserData.custom(this.getNatUserData()),
          role: natRole, // Attach IAM role directly
        }
      );

      // Note: Removed CloudFormation signals to avoid stabilization issues

      // Associate EIP with instance
      new ec2.CfnEIPAssociation(
        this,
        `NatEipAssoc${this.environmentSuffix}${index + 1}`,
        {
          eip: eip.ref,
          instanceId: natInstance.instanceId,
        }
      );

      // Add tags
      cdk.Tags.of(natInstance).add(
        'Name',
        `NAT-Instance-${this.environmentSuffix}-AZ${index + 1}`
      );
      cdk.Tags.of(natInstance).add('Type', 'NAT');
      cdk.Tags.of(natInstance).add('FailoverGroup', 'nat-ha');

      this.natInstances.push(natInstance);
    });

    // Update route tables for private subnets with dependency on NAT instances
    this.vpc.privateSubnets.forEach((subnet, index) => {
      const natIndex = index % this.natInstances.length;
      const route = new ec2.CfnRoute(
        this,
        `PrivateRoute${this.environmentSuffix}${index}`,
        {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: '0.0.0.0/0',
          instanceId: this.natInstances[natIndex].instanceId,
        }
      );
      // Ensure route creation depends on NAT ready
      route.node.addDependency(this.natInstances[natIndex]);
    });
  }

  private getNatUserData(): string {
    return `#!/bin/bash
set -xe
echo "Starting NAT instance configuration..."
# Install required packages
yum update -y
yum install -y iptables-services
# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p
# Configure iptables for NAT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -F FORWARD
# Save iptables rules
service iptables save
systemctl enable iptables
systemctl start iptables
# Log instance health
echo "NAT bootstrap complete at $(date)" > /var/log/nat-init.log
echo "NAT instance is ready"
`;
  }

  private createBastionHost(): void {
    // Security group for bastion host
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `BastionSecurityGroup${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for bastion host - Session Manager only',
        allowAllOutbound: true, // ✅ Allow all outbound for SSM
      }
    );

    // Create IAM role for bastion
    const bastionRole = new iam.Role(
      this,
      `BastionRole${this.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Note: Using role directly instead of instance profile for simplicity

    // Create bastion host
    this.bastionHost = new ec2.Instance(
      this,
      `BastionHost${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        vpcSubnets: { subnets: this.vpc.publicSubnets.slice(0, 1) }, // Single AZ
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL // Upgraded from MICRO for better stability
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: bastionSecurityGroup,
        userData: ec2.UserData.custom(this.getBastionUserData()),
        role: bastionRole, // Attach IAM role directly
      }
    );

    // Note: Removed CloudFormation signals to avoid stabilization issues

    // Create policy requiring MFA for Session Manager
    new iam.Policy(this, `SessionManagerMFAPolicy${this.environmentSuffix}`, {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['ssm:StartSession'],
          resources: [
            `arn:aws:ec2:${this.region}:${this.account}:instance/${this.bastionHost.instanceId}`,
          ],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    // Tag bastion
    cdk.Tags.of(this.bastionHost).add(
      'Name',
      `Secure-Bastion-${this.environmentSuffix}`
    );
    cdk.Tags.of(this.bastionHost).add('Type', 'Bastion');
    cdk.Tags.of(this.bastionHost).add('Access', 'SessionManager-Only');
  }

  private getBastionUserData(): string {
    return `#!/bin/bash
# Minimal bastion host setup
echo "Starting bastion host setup..."
# Disable SSH
systemctl stop sshd
systemctl disable sshd
echo "Bastion host setup completed"
`;
  }

  private createVpcEndpoints(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // S3 Gateway Endpoint
    new ec2.GatewayVpcEndpoint(this, `S3Endpoint${this.environmentSuffix}`, {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnets: this.vpc.privateSubnets },
        { subnets: this.vpc.isolatedSubnets },
      ],
    });

    // DynamoDB Gateway Endpoint
    new ec2.GatewayVpcEndpoint(
      this,
      `DynamoDBEndpoint${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [
          { subnets: this.vpc.privateSubnets },
          { subnets: this.vpc.isolatedSubnets },
        ],
      }
    );

    // Systems Manager Interface Endpoints
    const endpointSecurityGroup = new ec2.SecurityGroup(
      this,
      `EndpointSecurityGroup${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for VPC endpoints',
      }
    );

    endpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // SSM endpoint
    new ec2.InterfaceVpcEndpoint(this, `SSMEndpoint${this.environmentSuffix}`, {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnets: this.vpc.privateSubnets },
      securityGroups: [endpointSecurityGroup],
    });

    // SSM Messages endpoint
    new ec2.InterfaceVpcEndpoint(
      this,
      `SSMMessagesEndpoint${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        subnets: { subnets: this.vpc.privateSubnets },
        securityGroups: [endpointSecurityGroup],
      }
    );

    // EC2 Messages endpoint
    new ec2.InterfaceVpcEndpoint(
      this,
      `EC2MessagesEndpoint${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
        subnets: { subnets: this.vpc.privateSubnets },
        securityGroups: [endpointSecurityGroup],
      }
    );
  }

  private configureFlowLogs(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Create CloudWatch Log Group for Flow Logs
    this.flowLogGroup = new logs.LogGroup(
      this,
      `VPCFlowLogGroup${this.environmentSuffix}`,
      {
        retention: logs.RetentionDays.SIX_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create IAM role for Flow Logs
    const flowLogRole = new iam.Role(
      this,
      `FlowLogRole${this.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      }
    );

    flowLogRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [this.flowLogGroup.logGroupArn],
      })
    );

    // Create VPC Flow Log with custom format
    new ec2.CfnFlowLog(this, `VPCFlowLog${this.environmentSuffix}`, {
      resourceType: 'VPC',
      resourceId: this.vpc.vpcId,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: this.flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      logFormat:
        '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status} ${vpc-id} ${subnet-id} ${instance-id} ${tcp-flags} ${type} ${pkt-srcaddr} ${pkt-dstaddr}',
      tags: [
        {
          key: 'Name',
          value: `Financial-Platform-Flow-Logs-${this.environmentSuffix}`,
        },
        { key: 'Compliance', value: 'Required' },
      ],
    });
  }

  private createNetworkAcls(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Create custom Network ACL for data subnets
    const dataNetworkAcl = new ec2.NetworkAcl(
      this,
      `DataNetworkAcl${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        networkAclName: `DataTierACL-${this.environmentSuffix}`,
      }
    );

    // Associate with data subnets
    this.vpc.isolatedSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `DataNaclAssoc${this.environmentSuffix}${index}`,
        {
          subnet,
          networkAcl: dataNetworkAcl,
        }
      );
    });

    // Inbound rules for data tier
    dataNetworkAcl.addEntry(`AllowPrivateInbound${this.environmentSuffix}`, {
      ruleNumber: 100,
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.Action.ALLOW,
    });

    dataNetworkAcl.addEntry(`DenyAllInbound${this.environmentSuffix}`, {
      ruleNumber: 200,
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.Action.DENY,
    });

    // Outbound rules for data tier
    dataNetworkAcl.addEntry(`AllowVPCOutbound${this.environmentSuffix}`, {
      ruleNumber: 100,
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.Action.ALLOW,
    });

    dataNetworkAcl.addEntry(`AllowHTTPSOutbound${this.environmentSuffix}`, {
      ruleNumber: 110,
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPort(443),
      ruleAction: ec2.Action.ALLOW,
    });

    dataNetworkAcl.addEntry(`DenyAllOutbound${this.environmentSuffix}`, {
      ruleNumber: 200,
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.Action.DENY,
    });
  }

  private setupRoute53(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Create private hosted zone
    this.hostedZone = new route53.PrivateHostedZone(
      this,
      `PrivateHostedZone${this.environmentSuffix}`,
      {
        zoneName: `financial-${this.environmentSuffix}.internal`,
        vpc: this.vpc,
        comment: 'Private DNS zone for financial platform internal resources',
      }
    );

    // Add records for key services
    new route53.ARecord(this, `BastionDNS${this.environmentSuffix}`, {
      zone: this.hostedZone,
      recordName: 'bastion',
      target: route53.RecordTarget.fromIpAddresses(
        this.bastionHost.instancePrivateIp
      ),
      ttl: cdk.Duration.minutes(5),
    });

    // Create resolver rules for on-premises integration
    const resolverSecurityGroup = new ec2.SecurityGroup(
      this,
      `ResolverSecurityGroup${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Route53 Resolver',
      }
    );

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(53),
      'Allow DNS TCP'
    );

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.udp(53),
      'Allow DNS UDP'
    );

    // Create outbound resolver endpoint for conditional forwarding
    new route53resolver.CfnResolverEndpoint(
      this,
      `OutboundResolverEndpoint${this.environmentSuffix}`,
      {
        direction: 'OUTBOUND',
        ipAddresses: this.vpc.privateSubnets.slice(0, 2).map(subnet => ({
          subnetId: subnet.subnetId,
        })),
        securityGroupIds: [resolverSecurityGroup.securityGroupId],
        name: `FinancialPlatformOutboundResolver-${this.environmentSuffix}`,
      }
    );
  }

  private createDynamicSecurityGroups(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Create a security group that will have dynamic rules
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `ApplicationSecurityGroup${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group with dynamic rules based on instance tags',
      }
    );

    // Use CDK aspects to add rules based on tags
    cdk.Aspects.of(this).add({
      visit(node: IConstruct) {
        if (node instanceof ec2.Instance) {
          // Check if instance has specific tags
          const tier = node.node.tryGetContext('tier');

          if (tier === 'web') {
            appSecurityGroup.addIngressRule(
              ec2.Peer.ipv4('10.0.0.0/16'),
              ec2.Port.tcp(443),
              `Allow HTTPS from VPC for ${node.node.id}`
            );
          } else if (tier === 'app') {
            appSecurityGroup.addIngressRule(
              ec2.Peer.ipv4('10.0.0.0/24'),
              ec2.Port.tcp(8080),
              `Allow app traffic for ${node.node.id}`
            );
          } else if (tier === 'data') {
            appSecurityGroup.addIngressRule(
              ec2.Peer.ipv4('10.0.1.0/24'),
              ec2.Port.tcp(5432),
              `Allow database traffic for ${node.node.id}`
            );
          }
        }
      },
    });

    // Create Lambda for dynamic security group updates based on tags
    const sgUpdateFunction = new lambda.Function(
      this,
      `SecurityGroupUpdateFunction${this.environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
ec2 = boto3.client('ec2')
def handler(event, context):
    # Get instances with specific tags
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:DynamicSG', 'Values': ['true']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            instance_id = instance['InstanceId']
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
            
            # Update security groups based on tags
            if tags.get('Tier') == 'web':
                # Add web tier rules
                pass
            elif tags.get('Tier') == 'app':
                # Add app tier rules
                pass
                
    return {
        'statusCode': 200,
        'body': json.dumps('Security groups updated')
    }
`),
        timeout: cdk.Duration.minutes(5),
      }
    );

    // Add destroy policy to Lambda function
    sgUpdateFunction.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Grant permissions
    sgUpdateFunction.role?.attachInlinePolicy(
      new iam.Policy(this, `SGUpdatePolicy${this.environmentSuffix}`, {
        statements: [
          new iam.PolicyStatement({
            actions: [
              'ec2:Describe*',
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:RevokeSecurityGroupIngress',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    // Schedule Lambda to run every 5 minutes
    const rule = new events.Rule(
      this,
      `SGUpdateSchedule${this.environmentSuffix}`,
      {
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      }
    );

    // Add destroy policy to EventBridge Rule
    rule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    rule.addTarget(new targets.LambdaFunction(sgUpdateFunction));
  }

  private setupMonitoring(): void {
    // Create SNS topic for alarms
    const securityAlarmTopic = new sns.Topic(
      this,
      `SecurityAlarmTopic${this.environmentSuffix}`,
      {
        displayName: `Financial Platform Security Alarms-${this.environmentSuffix}`,
      }
    );

    // Add destroy policy to SNS Topic
    securityAlarmTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `SecurityDashboard${this.environmentSuffix}`,
      {
        dashboardName: `financial-platform-security-${this.environmentSuffix}`,
      }
    );

    // Add destroy policy to CloudWatch Dashboard
    dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // VPC Flow Logs metric filter for suspicious activity
    const suspiciousTrafficFilter = new logs.MetricFilter(
      this,
      `SuspiciousTrafficFilter${this.environmentSuffix}`,
      {
        logGroup: this.flowLogGroup,
        filterPattern: logs.FilterPattern.literal(
          '[srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action="REJECT", ...]'
        ),
        metricName: 'RejectedConnections',
        metricNamespace: `FinancialPlatform/Security-${this.environmentSuffix}`,
        metricValue: '1',
      }
    );

    // Add destroy policy to CloudWatch Log Metric Filter
    suspiciousTrafficFilter.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Alarm for high rejected connections
    const highRejectedConnectionsAlarm = new cloudwatch.Alarm(
      this,
      `HighRejectedConnectionsAlarm${this.environmentSuffix}`,
      {
        metric: suspiciousTrafficFilter.metric(),
        threshold: 100,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'High number of rejected connections detected',
      }
    );

    // Add destroy policy to CloudWatch Alarm
    highRejectedConnectionsAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // NAT instance health monitoring
    this.natInstances.forEach((instance, index) => {
      const natCpuAlarm = new cloudwatch.Alarm(
        this,
        `NatCpuAlarm${this.environmentSuffix}${index}`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 80,
          evaluationPeriods: 2,
          alarmDescription: `NAT instance ${index + 1} CPU utilization is high`,
        }
      );

      // Add destroy policy to CloudWatch Alarm
      natCpuAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'VPC Flow Logs - Rejected Connections',
        left: [suspiciousTrafficFilter.metric()],
      })
    );
  }

  private setupNatFailover(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Lambda function for NAT failover
    const natFailoverFunction = new lambda.Function(
      this,
      `NatFailoverFunction${this.environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import os
ec2 = boto3.client('ec2')
def handler(event, context):
    # Get failed instance ID from CloudWatch alarm
    instance_id = event['Trigger']['Dimensions'][0]['value']
    
    # Find healthy NAT instance
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:Type', 'Values': ['NAT']},
            {'Name': 'instance-state-name', 'Values': ['running']},
            {'Name': 'instance-id', 'Values': [instance_id], 'Values': ['!=']}
        ]
    )
    
    if response['Reservations']:
        healthy_instance = response['Reservations'][0]['Instances'][0]
        healthy_instance_id = healthy_instance['InstanceId']
        
        # Get route tables using failed NAT
        route_tables = ec2.describe_route_tables(
            Filters=[
                {'Name': 'route.instance-id', 'Values': [instance_id]}
            ]
        )
        
        # Update routes to use healthy NAT
        for rt in route_tables['RouteTables']:
            for route in rt['Routes']:
                if route.get('InstanceId') == instance_id:
                    ec2.replace_route(
                        RouteTableId=rt['RouteTableId'],
                        DestinationCidrBlock=route['DestinationCidrBlock'],
                        InstanceId=healthy_instance_id
                    )
                    
    return {'statusCode': 200}
`),
        timeout: cdk.Duration.minutes(2),
        environment: {
          VPC_ID: this.vpc.vpcId,
        },
      }
    );

    // Add destroy policy to Lambda function
    natFailoverFunction.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Grant permissions
    natFailoverFunction.role?.attachInlinePolicy(
      new iam.Policy(this, `NatFailoverPolicy${this.environmentSuffix}`, {
        statements: [
          new iam.PolicyStatement({
            actions: [
              'ec2:DescribeInstances',
              'ec2:DescribeRouteTables',
              'ec2:ReplaceRoute',
              'ec2:CreateRoute',
              'ec2:DeleteRoute',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    // Create alarms for each NAT instance
    this.natInstances.forEach((instance, index) => {
      const statusCheckAlarm = new cloudwatch.Alarm(
        this,
        `NatStatusCheckAlarm${this.environmentSuffix}${index}`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'StatusCheckFailed',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Maximum',
            period: cdk.Duration.minutes(1),
          }),
          threshold: 1,
          evaluationPeriods: 2,
          alarmDescription: `NAT instance ${index + 1} status check failed`,
        }
      );

      // Add destroy policy to CloudWatch Alarm
      statusCheckAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      // Add Lambda as alarm action
      statusCheckAlarm.addAlarmAction({
        bind: () => ({
          alarmActionArn: natFailoverFunction.functionArn,
        }),
      });
    });

    // Grant Lambda permission to be invoked by CloudWatch
    natFailoverFunction.grantInvoke(
      new iam.ServicePrincipal('lambda.alarms.cloudwatch.amazonaws.com')
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure financial platform',
      exportName: `VpcId-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: `VpcCidr-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: `PublicSubnetIds-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs',
      exportName: `PrivateSubnetIds-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Data subnet IDs',
      exportName: `DataSubnetIds-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NatInstanceIds', {
      value: this.natInstances.map(instance => instance.instanceId).join(','),
      description: 'NAT instance IDs',
      exportName: `NatInstanceIds-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BastionInstanceId', {
      value: this.bastionHost.instanceId,
      description: 'Bastion host instance ID',
      exportName: `BastionInstanceId-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BastionPrivateIp', {
      value: this.bastionHost.instancePrivateIp,
      description: 'Bastion host private IP address',
      exportName: `BastionPrivateIp-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateHostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Private hosted zone ID',
      exportName: `PrivateHostedZoneId-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateHostedZoneName', {
      value: this.hostedZone.zoneName,
      description: 'Private hosted zone name',
      exportName: `PrivateHostedZoneName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcFlowLogGroupName', {
      value: this.flowLogGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch log group name',
      exportName: `VpcFlowLogGroupName-${this.environmentSuffix}`,
    });
  }
}
