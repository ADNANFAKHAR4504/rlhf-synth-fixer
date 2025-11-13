import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcComponentArgs {
  environmentName: string;
  vpcCidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly appSecurityGroup: aws.ec2.SecurityGroup;
  public readonly flowLogGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    const defaultTags = {
      Environment: args.environmentName,
      ManagedBy: 'Pulumi',
      CostCenter: 'Platform',
      ...args.tags,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentName}-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${args.environmentName}-vpc-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentName}-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${args.environmentName}-igw-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create Public Subnets
    this.publicSubnets = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${index * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${args.environmentName}-public-${az}-${args.environmentSuffix}`,
            Type: 'Public',
            ...defaultTags,
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets
    this.privateSubnets = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${index * 2 + 1}.0/24`,
          availabilityZone: az,
          tags: {
            Name: `${args.environmentName}-private-${az}-${args.environmentSuffix}`,
            Type: 'Private',
            ...defaultTags,
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    args.availabilityZones.forEach((az, _index) => {
      const eip = new aws.ec2.Eip(
        `nat-eip-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            Name: `${args.environmentName}-nat-eip-${az}-${args.environmentSuffix}`,
            ...defaultTags,
          },
        },
        { parent: this }
      );
      eips.push(eip);
    });

    // Create NAT Gateways
    this.natGateways = [];
    args.availabilityZones.forEach((az, index) => {
      const nat = new aws.ec2.NatGateway(
        `nat-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          subnetId: this.publicSubnets[index].id,
          allocationId: eips[index].id,
          tags: {
            Name: `${args.environmentName}-nat-${az}-${args.environmentSuffix}`,
            ...defaultTags,
          },
        },
        { parent: this }
      );
      this.natGateways.push(nat);
    });

    // Create Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentName}-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${args.environmentName}-public-rt-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentName}-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${args.environmentName}-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Private Route Tables (one per AZ)
    args.availabilityZones.forEach((az, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${args.environmentName}-private-rt-${az}-${args.environmentSuffix}`,
            ...defaultTags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${args.environmentName}-${az}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[index].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Web Tier Security Group
    this.webSecurityGroup = new aws.ec2.SecurityGroup(
      `web-sg-${args.environmentName}-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for web tier allowing HTTPS traffic',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `${args.environmentName}-web-sg-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create App Tier Security Group
    this.appSecurityGroup = new aws.ec2.SecurityGroup(
      `app-sg-${args.environmentName}-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description:
          'Security group for app tier allowing traffic from web tier',
        tags: {
          Name: `${args.environmentName}-app-sg-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Add ingress rule to app security group referencing web security group
    new aws.ec2.SecurityGroupRule(
      `app-sg-rule-${args.environmentName}-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 0,
        toPort: 65535,
        protocol: 'tcp',
        sourceSecurityGroupId: this.webSecurityGroup.id,
        securityGroupId: this.appSecurityGroup.id,
        description: 'Allow all TCP traffic from web tier',
      },
      { parent: this }
    );

    // Add egress rule to app security group
    new aws.ec2.SecurityGroupRule(
      `app-sg-egress-${args.environmentName}-${args.environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: this.appSecurityGroup.id,
        description: 'Allow all outbound traffic',
      },
      { parent: this }
    );

    // Create IAM Role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `flow-logs-role-${args.environmentName}-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          Name: `${args.environmentName}-flow-logs-role-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create inline policy for Flow Logs role instead of using managed policy
    new aws.iam.RolePolicy(
      `flow-logs-policy-${args.environmentName}-${args.environmentSuffix}`,
      {
        role: flowLogsRole.id,
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
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    this.flowLogGroup = new aws.cloudwatch.LogGroup(
      `flow-logs-${args.environmentName}-${args.environmentSuffix}`,
      {
        name: `/aws/vpc/flow-logs-${args.environmentName}-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `${args.environmentName}-flow-logs-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create VPC Flow Logs
    new aws.ec2.FlowLog(
      `vpc-flow-log-${args.environmentName}-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: this.flowLogGroup.arn,
        iamRoleArn: flowLogsRole.arn,
        tags: {
          Name: `${args.environmentName}-flow-log-${args.environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
      webSecurityGroupId: this.webSecurityGroup.id,
      appSecurityGroupId: this.appSecurityGroup.id,
      flowLogGroupName: this.flowLogGroup.name,
    });
  }
}
