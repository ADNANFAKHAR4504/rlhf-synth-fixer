import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly s3EndpointId: pulumi.Output<string>;
  public readonly dynamodbEndpointId: pulumi.Output<string>;
  public readonly secretsManagerEndpointId: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get availability zones for us-east-1
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC with private subnets only (no IGW)
    const vpc = new aws.ec2.Vpc(
      `zero-trust-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `zero-trust-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create private subnets across 3 AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          mapPublicIpOnLaunch: false,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `private-subnet-${i}-${environmentSuffix}`,
            Type: 'Private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `private-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate route table with private subnets
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Network ACLs with explicit deny-all rules
    const privateNacl = new aws.ec2.NetworkAcl(
      `private-nacl-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `private-nacl-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow HTTPS inbound (rule 100)
    new aws.ec2.NetworkAclRule(
      `nacl-https-in-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '10.0.0.0/16',
        fromPort: 443,
        toPort: 443,
        egress: false,
      },
      { parent: this }
    );

    // Allow PostgreSQL inbound (rule 110)
    new aws.ec2.NetworkAclRule(
      `nacl-postgres-in-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '10.0.0.0/16',
        fromPort: 5432,
        toPort: 5432,
        egress: false,
      },
      { parent: this }
    );

    // Allow ephemeral ports inbound (rule 120)
    new aws.ec2.NetworkAclRule(
      `nacl-ephemeral-in-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '10.0.0.0/16',
        fromPort: 1024,
        toPort: 65535,
        egress: false,
      },
      { parent: this }
    );

    // Allow HTTPS outbound (rule 100)
    new aws.ec2.NetworkAclRule(
      `nacl-https-out-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 443,
        toPort: 443,
        egress: true,
      },
      { parent: this }
    );

    // Allow ephemeral ports outbound (rule 110)
    new aws.ec2.NetworkAclRule(
      `nacl-ephemeral-out-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 1024,
        toPort: 65535,
        egress: true,
      },
      { parent: this }
    );

    // Deny all other traffic explicitly (rule 999)
    new aws.ec2.NetworkAclRule(
      `nacl-deny-all-in-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 999,
        protocol: '-1',
        ruleAction: 'deny',
        cidrBlock: '0.0.0.0/0',
        egress: false,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `nacl-deny-all-out-${environmentSuffix}`,
      {
        networkAclId: privateNacl.id,
        ruleNumber: 999,
        protocol: '-1',
        ruleAction: 'deny',
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { parent: this }
    );

    // Associate NACL with private subnets
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.NetworkAclAssociation(
        `private-nacl-assoc-${i}-${environmentSuffix}`,
        {
          networkAclId: privateNacl.id,
          subnetId: subnet.id,
        },
        { parent: this }
      );
    });

    // Security Group for VPC Endpoints
    const endpointSg = new aws.ec2.SecurityGroup(
      `vpc-endpoint-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints - HTTPS only',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `vpc-endpoint-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // S3 Gateway Endpoint (no KMS needed for gateway endpoints)
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.s3',
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `s3-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DynamoDB Gateway Endpoint
    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.dynamodb',
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dynamodb-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Secrets Manager Interface Endpoint
    const secretsManagerEndpoint = new aws.ec2.VpcEndpoint(
      `secretsmanager-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.secretsmanager',
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `secretsmanager-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // SSM VPC Endpoints for Session Manager
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ssmEndpoint = new aws.ec2.VpcEndpoint(
      `ssm-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.ssm',
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `ssm-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ssmMessagesEndpoint = new aws.ec2.VpcEndpoint(
      `ssmmessages-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.ssmmessages',
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `ssmmessages-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ec2MessagesEndpoint = new aws.ec2.VpcEndpoint(
      `ec2messages-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.ec2messages',
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `ec2messages-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Export outputs
    this.vpcId = vpc.id;
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    this.s3EndpointId = s3Endpoint.id;
    this.dynamodbEndpointId = dynamodbEndpoint.id;
    this.secretsManagerEndpointId = secretsManagerEndpoint.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      s3EndpointId: this.s3EndpointId,
      dynamodbEndpointId: this.dynamodbEndpointId,
      secretsManagerEndpointId: this.secretsManagerEndpointId,
    });
  }
}
