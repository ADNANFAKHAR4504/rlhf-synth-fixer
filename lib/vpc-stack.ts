import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class VpcStack extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly webSecurityGroupId: string;
  public readonly appSecurityGroupId: string;
  public readonly instanceIds: string[];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const awsRegion = 'eu-south-1';
    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'PaymentGateway',
      ManagedBy: 'CDKTF',
    };

    // Define availability zones for eu-south-1
    const availabilityZones = [`${awsRegion}a`];

    // Create VPC with DNS support enabled
    const vpc = new Vpc(this, 'payment-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        ...commonTags,
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'internet-gateway', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    // Note: Set skipDestroy to true to prevent CloudFormation from deleting the log group
    // This avoids conflicts when log groups are created in parallel or across environments
    const flowLogGroup = new CloudwatchLogGroup(this, 'vpcs-flow-logs', {
      name: `/aws/vpcs/flowlogs-${environmentSuffix}`,
      retentionInDays: 7,
      skipDestroy: true,
      tags: {
        Name: `vpc-flow-logs-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Create IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'abcdvpc', {
      name: `abcdvpc-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `abcdvpc-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Attach policy to Flow Log role
    new IamRolePolicy(this, 'vpc-flow-log-policy', {
      name: `vpc-flow-log-policy-${environmentSuffix}`,
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Create VPC Flow Logs capturing all traffic
    new FlowLog(this, 'vpc-flow-log', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      maxAggregationInterval: 60, // 1 minute intervals
      tags: {
        Name: `vpc-flow-log-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Create public and private subnets in each AZ
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];
    const eips: Eip[] = [];

    availabilityZones.forEach((az, index) => {
      // Create public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${index + 1}-${environmentSuffix}`,
          Type: 'Public',
          ...commonTags,
        },
      });
      publicSubnets.push(publicSubnet);

      // Create private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index * 2 + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-private-subnet-${index + 1}-${environmentSuffix}`,
          Type: 'Private',
          ...commonTags,
        },
      });
      privateSubnets.push(privateSubnet);

      // Create Elastic IP for NAT Gateway
      // Set skipDestroy to true to preserve EIPs and avoid hitting the 5 EIP limit per region
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${index + 1}-${environmentSuffix}`,
          ...commonTags,
        },
      });
      // Configure EIP lifecycle to prevent deletion
      Object.defineProperty(eip, 'skipDestroy', {
        value: true,
        writable: false,
      });
      eips.push(eip);

      // Create NAT Gateway in each public subnet for high availability
      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `payment-nat-gateway-${index + 1}-${environmentSuffix}`,
          ...commonTags,
        },
      });
      natGateways.push(natGateway);
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Add route to Internet Gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create private route tables (one per AZ for NAT Gateway association)
    const privateRouteTables: RouteTable[] = [];
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `payment-private-rt-${index + 1}-${environmentSuffix}`,
            ...commonTags,
          },
        }
      );
      privateRouteTables.push(privateRouteTable);

      // Add route to NAT Gateway for private subnet
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create Security Group for Web Tier
    const webSecurityGroup = new SecurityGroup(this, 'web-security-group', {
      name: `payment-web-sg-${environmentSuffix}`,
      description: 'Security group for web tier - allows HTTP and HTTPS',
      vpcId: vpc.id,
      tags: {
        Name: `payment-web-sg-${environmentSuffix}`,
        Tier: 'Web',
        ...commonTags,
      },
    });

    // Web tier inbound rules - HTTP from VPC
    new SecurityGroupRule(this, 'web-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow HTTP from VPC',
    });

    // Web tier inbound rules - HTTPS from VPC
    new SecurityGroupRule(this, 'web-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow HTTPS from VPC',
    });

    // Web tier outbound rule
    new SecurityGroupRule(this, 'web-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    this.webSecurityGroupId = webSecurityGroup.id;

    // Create Security Group for App Tier
    const appSecurityGroup = new SecurityGroup(this, 'app-security-group', {
      name: `payment-app-sg-${environmentSuffix}`,
      description:
        'Security group for app tier - allows port 8080 from web tier',
      vpcId: vpc.id,
      tags: {
        Name: `payment-app-sg-${environmentSuffix}`,
        Tier: 'App',
        ...commonTags,
      },
    });

    // App tier inbound rule - port 8080 from web security group only
    new SecurityGroupRule(this, 'app-8080-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: 'Allow port 8080 from web tier',
    });

    // App tier outbound rule
    new SecurityGroupRule(this, 'app-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    this.appSecurityGroupId = appSecurityGroup.id;

    // Create VPC Endpoint for S3 (Gateway type)
    const s3Endpoint = new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Create VPC Endpoint for DynamoDB (Gateway type)
    const dynamodbEndpoint = new VpcEndpoint(this, 'dynamodb-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Get the latest Amazon Linux 2023 AMI
    const amiData = new DataAwsAmi(this, 'amazon-linux-2023', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create IAM Role for EC2 instances to use Session Manager
    const ec2Role = new IamRole(this, 'ec2-ssm-role', {
      name: `abcdssm-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `abcdssm-${environmentSuffix}`,
        ...commonTags,
      },
    });

    // Attach the SSM managed policy to the EC2 role
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy-attachment', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create IAM Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `abcdec2-${environmentSuffix}`,
        role: ec2Role.name,
      }
    );

    // Create EC2 instances in each private subnet
    const instances: Instance[] = [];
    privateSubnets.forEach((subnet, index) => {
      const instance = new Instance(this, `app-instance-${index}`, {
        ami: amiData.id,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [appSecurityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        tags: {
          Name: `payment-app-instance-${index + 1}-${environmentSuffix}`,
          ...commonTags,
        },
        // Enable detailed monitoring for better CloudWatch metrics
        monitoring: true,
        // Ensure instances have proper metadata service configuration
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
      });
      instances.push(instance);
    });

    this.instanceIds = instances.map(instance => instance.id);

    // Create CloudWatch Dashboard for VPC Flow Logs metrics
    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'log',
          x: 0,
          y: 0,
          width: 24,
          height: 6,
          properties: {
            query: `SOURCE '${flowLogGroup.name}'
| fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, protocol, packets, bytes, action
| sort @timestamp desc
| limit 100`,
            region: awsRegion,
            stacked: false,
            title: 'VPC Flow Logs - Recent Traffic',
            view: 'table',
          },
        },
        {
          type: 'log',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            query: `SOURCE '${flowLogGroup.name}'
| filter action = "ACCEPT"
| stats count() as acceptedConnections by srcAddr
| sort acceptedConnections desc
| limit 10`,
            region: awsRegion,
            stacked: false,
            title: 'Top 10 Sources - Accepted Traffic',
            view: 'table',
          },
        },
        {
          type: 'log',
          x: 12,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            query: `SOURCE '${flowLogGroup.name}'
| filter action = "REJECT"
| stats count() as rejectedConnections by srcAddr
| sort rejectedConnections desc
| limit 10`,
            region: awsRegion,
            stacked: false,
            title: 'Top 10 Sources - Rejected Traffic',
            view: 'table',
          },
        },
      ],
    });

    new CloudwatchDashboard(this, 'vpc-flow-logs-dashboard', {
      dashboardName: `payment-vpc-flowlogs-${environmentSuffix}`,
      dashboardBody: dashboardBody,
    });

    // Store public and private subnet IDs
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

    // Create Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: this.publicSubnetIds,
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: this.privateSubnetIds,
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'web-security-group-id', {
      value: webSecurityGroup.id,
      description: 'Web Tier Security Group ID',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: appSecurityGroup.id,
      description: 'App Tier Security Group ID',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: natGateways.map(nat => nat.id),
      description: 'NAT Gateway IDs',
    });

    new TerraformOutput(this, 'instance-ids', {
      value: this.instanceIds,
      description: 'EC2 Instance IDs',
    });

    new TerraformOutput(this, 's3-endpoint-id', {
      value: s3Endpoint.id,
      description: 'S3 VPC Endpoint ID',
    });

    new TerraformOutput(this, 'dynamodb-endpoint-id', {
      value: dynamodbEndpoint.id,
      description: 'DynamoDB VPC Endpoint ID',
    });

    new TerraformOutput(this, 'flow-log-group-name', {
      value: flowLogGroup.name,
      description: 'VPC Flow Logs CloudWatch Log Group Name',
    });
  }
}
