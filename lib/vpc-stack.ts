import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `compliance-vpc-${suffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `compliance-vpc-${suffix}` },
      },
      { parent: this }
    );

    // Create private subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${suffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'ap-southeast-1a',
        tags: { ...tags, Name: `private-subnet-1-${suffix}` },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${suffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'ap-southeast-1b',
        tags: { ...tags, Name: `private-subnet-2-${suffix}` },
      },
      { parent: this }
    );

    // Security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${suffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for compliance Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...tags, Name: `lambda-sg-${suffix}` },
      },
      { parent: this }
    );

    // VPC Endpoints
    const _s3Endpoint = new aws.ec2.VpcEndpoint(
      `s3-endpoint-${suffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.s3',
        vpcEndpointType: 'Gateway',
        tags: { ...tags, Name: `s3-endpoint-${suffix}` },
      },
      { parent: this }
    );

    const _dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `dynamodb-endpoint-${suffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.dynamodb',
        vpcEndpointType: 'Gateway',
        tags: { ...tags, Name: `dynamodb-endpoint-${suffix}` },
      },
      { parent: this }
    );

    const _logsEndpoint = new aws.ec2.VpcEndpoint(
      `logs-endpoint-${suffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.logs',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `logs-endpoint-${suffix}` },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
    });
  }
}
