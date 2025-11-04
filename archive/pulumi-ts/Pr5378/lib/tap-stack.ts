import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly bastionPublicIp: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'Development',
      ManagedBy: 'Pulumi',
      ...args.tags,
    };

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...defaultTags,
            Name: `public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          tags: {
            ...defaultTags,
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs and NAT Gateways for each public subnet
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...defaultTags,
            Name: `nat-eip-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      const natGw = new aws.ec2.NatGateway(
        `nat-gw-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eip.id,
          tags: {
            ...defaultTags,
            Name: `nat-gw-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natGateways.push(natGw);
    }

    // Create private route tables and routes for each private subnet
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...defaultTags,
            Name: `private-rt-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create security group for bastion host
    const bastionSg = new aws.ec2.SecurityGroup(
      `bastion-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for bastion host',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['0.0.0.0/0'], // In production, restrict this to specific IP ranges
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...defaultTags,
          Name: `bastion-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'state', values: ['available'] },
      ],
    });

    // Create bastion host
    const bastionHost = new aws.ec2.Instance(
      `bastion-${environmentSuffix}`,
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: publicSubnets[0].id,
        vpcSecurityGroupIds: [bastionSg.id],
        associatePublicIpAddress: true,
        tags: {
          ...defaultTags,
          Name: `bastion-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create S3 bucket for VPC Flow Logs
    const flowLogsBucket = new aws.s3.Bucket(
      `vpc-flow-logs-${environmentSuffix}`,
      {
        bucket: `vpc-flow-logs-${environmentSuffix}-${Date.now()}`,
        forceDestroy: true,
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: {
          ...defaultTags,
          Name: `vpc-flow-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `flow-logs-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create bucket policy for VPC Flow Logs
    const bucketPolicy = new aws.s3.BucketPolicy(
      `flow-logs-bucket-policy-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        policy: pulumi
          .all([flowLogsBucket.arn, flowLogsRole.arn])
          .apply(([bucketArn, _roleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSLogDeliveryWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                },
                {
                  Sid: 'AWSLogDeliveryAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Enable VPC Flow Logs
    new aws.ec2.FlowLog(
      `vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        logDestination: flowLogsBucket.arn,
        logDestinationType: 's3',
        trafficType: 'ALL',
        tags: {
          ...defaultTags,
          Name: `vpc-flow-log-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    this.bastionPublicIp = bastionHost.publicIp;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      bastionPublicIp: this.bastionPublicIp,
    });
  }
}
