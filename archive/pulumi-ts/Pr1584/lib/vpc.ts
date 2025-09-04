/**
 * vpc.ts
 *
 * This module defines VPC-related resources including VPC, subnets, internet gateway,
 * and route tables for the secure AWS infrastructure.
 */
import * as aws from '@pulumi/aws';

export interface VpcResources {
  vpc: aws.ec2.Vpc;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  internetGateway: aws.ec2.InternetGateway;
  publicRouteTable: aws.ec2.RouteTable;
  privateRouteTables: aws.ec2.RouteTable[];
  natGateway: aws.ec2.NatGateway;
  vpcFlowLog: aws.ec2.FlowLog;
}

export function createVpcResources(
  environment: string,
  provider: aws.Provider
): VpcResources {
  // Get availability zones
  const availabilityZones = aws.getAvailabilityZones(
    {
      state: 'available',
    },
    { provider }
  );

  // Create VPC
  const vpc = new aws.ec2.Vpc(
    `vpc-${environment}`,
    {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create Internet Gateway
  const internetGateway = new aws.ec2.InternetGateway(
    `igw-${environment}`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create public subnets
  const publicSubnets: aws.ec2.Subnet[] = [];
  const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

  publicSubnetCidrs.forEach((cidr, index) => {
    const subnet = new aws.ec2.Subnet(
      `public-subnet-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones.then(
          azs => azs.names[index % azs.names.length]
        ),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}-${environment}`,
          Environment: environment,
          Type: 'Public',
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    publicSubnets.push(subnet);
  });

  // Create private subnets for best practices (even though not required)
  const privateSubnets: aws.ec2.Subnet[] = [];
  const privateSubnetCidrs = ['10.0.10.0/24', '10.0.20.0/24'];

  privateSubnetCidrs.forEach((cidr, index) => {
    const subnet = new aws.ec2.Subnet(
      `private-subnet-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones.then(
          azs => azs.names[index % azs.names.length]
        ),
        tags: {
          Name: `private-subnet-${index + 1}-${environment}`,
          Environment: environment,
          Type: 'Private',
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    privateSubnets.push(subnet);
  });

  // Create public route table
  const publicRouteTable = new aws.ec2.RouteTable(
    `public-rt-${environment}`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create route to Internet Gateway
  new aws.ec2.Route(
    `public-route-${environment}`,
    {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    },
    { provider }
  );

  // Associate public subnets with public route table
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `public-rta-${index + 1}-${environment}`,
      {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      },
      { provider }
    );
  });

  // Create Elastic IP for NAT Gateway
  const natEip = new aws.ec2.Eip(
    `nat-eip-${environment}`,
    {
      domain: 'vpc',
      tags: {
        Name: `nat-eip-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create NAT Gateway in first public subnet
  const natGateway = new aws.ec2.NatGateway(
    `nat-${environment}`,
    {
      allocationId: natEip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        Name: `nat-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create private route tables and routes
  const privateRouteTables: aws.ec2.RouteTable[] = [];
  privateSubnets.forEach((subnet, index) => {
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${index + 1}-${environment}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    // Route to NAT Gateway for outbound internet access
    new aws.ec2.Route(
      `private-route-${index + 1}-${environment}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { provider }
    );

    // Associate private subnet with private route table
    new aws.ec2.RouteTableAssociation(
      `private-rta-${index + 1}-${environment}`,
      {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    privateRouteTables.push(privateRouteTable);
  });

  // Create IAM role for VPC Flow Logs
  const flowLogRole = new aws.iam.Role(
    `vpc-flow-log-role-${environment}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `vpc-flow-log-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create custom policy for VPC Flow Logs
  const flowLogPolicy = new aws.iam.Policy(
    `vpc-flow-log-policy-${environment}`,
    {
      name: `vpc-flow-log-policy-${environment}`,
      description: 'Policy for VPC Flow Logs to write to CloudWatch',
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
      tags: {
        Name: `vpc-flow-log-policy-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach custom policy for VPC Flow Logs
  new aws.iam.RolePolicyAttachment(
    `vpc-flow-log-policy-attachment-${environment}`,
    {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    },
    { provider }
  );

  // Create CloudWatch Log Group for VPC Flow Logs
  const flowLogGroup = new aws.cloudwatch.LogGroup(
    `vpc-flow-logs-${environment}`,
    {
      name: `/aws/vpc/flowlogs/${environment}`,
      retentionInDays: 30, // Retain logs for 30 days
      tags: {
        Name: `vpc-flow-logs-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create VPC Flow Log
  const vpcFlowLog = new aws.ec2.FlowLog(
    `vpc-flow-log-${environment}`,
    {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      vpcId: vpc.id,
      trafficType: 'ALL',
      tags: {
        Name: `vpc-flow-log-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  return {
    vpc,
    publicSubnets,
    privateSubnets,
    internetGateway,
    publicRouteTable,
    privateRouteTables,
    natGateway,
    vpcFlowLog,
  };
}
