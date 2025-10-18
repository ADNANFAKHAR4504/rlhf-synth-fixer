import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as config from 'aws-cdk-lib/aws-config';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
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

    // Configure AWS Config rules
    this.setupConfigRules();

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

    // Create NAT instance in each public subnet for HA
    this.vpc.publicSubnets.forEach((subnet, index) => {
      const natInstance = new ec2.Instance(
        this,
        `NatInstance${this.environmentSuffix}${index + 1}`,
        {
          vpc: this.vpc,
          vpcSubnets: { subnets: [subnet] },
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
          }),
          securityGroup: natSecurityGroup,
          sourceDestCheck: false, // Required for NAT
          userData: ec2.UserData.custom(this.getNatUserData()),
        }
      );

      // Add tags
      cdk.Tags.of(natInstance).add(
        'Name',
        `NAT-Instance-${this.environmentSuffix}-AZ${index + 1}`
      );
      cdk.Tags.of(natInstance).add('Type', 'NAT');
      cdk.Tags.of(natInstance).add('FailoverGroup', 'nat-ha');

      // Create Elastic IP
      new ec2.CfnEIP(this, `NatEIP${this.environmentSuffix}${index + 1}`, {
        domain: 'vpc',
        instanceId: natInstance.instanceId,
      });

      this.natInstances.push(natInstance);

      // Grant permissions for NAT functionality
      natInstance.role.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        )
      );
    });

    // Update route tables for private subnets
    this.vpc.privateSubnets.forEach((subnet, index) => {
      const natIndex = index % this.natInstances.length;
      new ec2.CfnRoute(this, `PrivateRoute${this.environmentSuffix}${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '0.0.0.0/0',
        instanceId: this.natInstances[natIndex].instanceId,
      });
    });
  }

  private getNatUserData(): string {
    return `#!/bin/bash
yum update -y
yum install -y iptables-services

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p

# Configure iptables
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -F FORWARD
service iptables save

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent for monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "metrics": {
    "namespace": "FinancialPlatform/NAT",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
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
        allowAllOutbound: false, // Restrict outbound
      }
    );

    // Only allow HTTPS for Session Manager
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(443),
      'Allow HTTPS for Session Manager'
    );

    // Create bastion host
    this.bastionHost = new ec2.Instance(
      this,
      `BastionHost${this.environmentSuffix}`,
      {
        vpc: this.vpc,
        vpcSubnets: { subnets: this.vpc.publicSubnets.slice(0, 1) }, // Single AZ
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        securityGroup: bastionSecurityGroup,
        userData: ec2.UserData.custom(this.getBastionUserData()),
      }
    );

    // Create IAM role for bastion with MFA requirement
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

    // Apply role to bastion
    this.bastionHost.instance.iamInstanceProfile = new iam.CfnInstanceProfile(
      this,
      `BastionInstanceProfile${this.environmentSuffix}`,
      {
        roles: [bastionRole.roleName],
      }
    ).ref;

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
# Update and secure the system
yum update -y

# Disable SSH completely
systemctl stop sshd
systemctl disable sshd
rm -rf /etc/ssh/sshd_config

# Remove SSH keys
rm -rf /home/ec2-user/.ssh
rm -rf /root/.ssh

# Install security tools
yum install -y aide
aide --init
mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Configure audit logging
cat >> /etc/audit/rules.d/financial-platform.rules << EOF
-w /etc/passwd -p wa -k passwd_changes
-w /etc/group -p wa -k group_changes
-w /etc/sudoers -p wa -k sudoers_changes
EOF

service auditd restart

# Install Session Manager plugin
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
yum install -y session-manager-plugin.rpm

# Harden the system
echo "* hard core 0" >> /etc/security/limits.conf
echo "kernel.exec-shield = 1" >> /etc/sysctl.conf
echo "kernel.randomize_va_space = 2" >> /etc/sysctl.conf
sysctl -p
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
        logGroupName: `/aws/vpc/flowlogs/financial-platform-${this.environmentSuffix}`,
        retention: logs.RetentionDays.SIX_MONTHS,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
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
    rule.addTarget(new targets.LambdaFunction(sgUpdateFunction));
  }

  private setupMonitoring(): void {
    // Create SNS topic for alarms
    new sns.Topic(this, `SecurityAlarmTopic${this.environmentSuffix}`, {
      displayName: `Financial Platform Security Alarms-${this.environmentSuffix}`,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `SecurityDashboard${this.environmentSuffix}`,
      {
        dashboardName: `financial-platform-security-${this.environmentSuffix}`,
      }
    );

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

    // Alarm for high rejected connections
    new cloudwatch.Alarm(
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

    // NAT instance health monitoring
    this.natInstances.forEach((instance, index) => {
      new cloudwatch.Alarm(
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
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'VPC Flow Logs - Rejected Connections',
        left: [suspiciousTrafficFilter.metric()],
      })
    );
  }

  private setupConfigRules(): void {
    // Get environment suffix from props, context, or use 'prod' as default

    // Create S3 bucket for Config
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket${this.environmentSuffix}`,
      {
        bucketName: `financial-platform-config-${this.environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            transitions: [
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
          },
        ],
      }
    );

    // Config Service Role
    const configRole = new iam.Role(
      this,
      `ConfigRole${this.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
        ],
      }
    );

    // Grant Config access to S3 bucket
    configBucket.grantReadWrite(configRole);

    // Create Configuration Recorder
    new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder${this.environmentSuffix}`,
      {
        name: `financial-platform-recorder-${this.environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Create Delivery Channel
    new config.CfnDeliveryChannel(
      this,
      `ConfigDeliveryChannel${this.environmentSuffix}`,
      {
        name: `financial-platform-delivery-${this.environmentSuffix}`,
        s3BucketName: configBucket.bucketName,
        configSnapshotDeliveryProperties: {
          deliveryFrequency: 'TwentyFour_Hours',
        },
      }
    );

    // VPC Security Group Compliance Rule
    new config.ManagedRule(
      this,
      `VPCSecurityGroupRestrictedRule${this.environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers.VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS,
        inputParameters: {
          authorizedTcpPorts: '443,22',
        },
        description: 'Checks that security groups only allow specific ports',
      }
    );

    // VPC Flow Logs Enabled Rule
    new config.ManagedRule(
      this,
      `VPCFlowLogsEnabledRule${this.environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
        description: 'Ensures VPC Flow Logs are enabled',
      }
    );

    // Instance Managed by Systems Manager
    new config.ManagedRule(
      this,
      `EC2ManagedBySSMRule${this.environmentSuffix}`,
      {
        identifier: config.ManagedRuleIdentifiers.EC2_INSTANCE_MANAGED_BY_SSM,
        description: 'Ensures EC2 instances are managed by Systems Manager',
      }
    );

    // MFA Enabled for IAM Users
    new config.ManagedRule(this, `IAMMFAEnabledRule${this.environmentSuffix}`, {
      identifier:
        config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      description: 'Ensures MFA is enabled for IAM users with console access',
    });
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
  }
}
