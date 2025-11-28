/**
 * VPC Stack - Creates networking infrastructure for the database migration.
 *
 * Provisions:
 * - VPC with CIDR block
 * - Private subnets across multiple AZs
 * - Security groups for RDS, DMS, Lambda, and VPC endpoints
 * - Network ACLs for enhanced security
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;
  public readonly dmsSecurityGroupId: pulumi.Output<string>;
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;
  public readonly endpointSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:VpcStack', name, args, opts);

    const tags = args.tags || {};

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `migration-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `migration-vpc-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Use us-east-2 availability zones (matching the provider in bin/tap.ts)
    // Hardcoded to ensure consistency with the explicit provider region
    const availabilityZones = ['us-east-2a', 'us-east-2b', 'us-east-2c'];

    // Create private subnets in multiple AZs for Multi-AZ deployment
    const subnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    // Create subnets using predefined AZs
    const privateSubnets = availabilityZones.map(
      (az, i) =>
        new aws.ec2.Subnet(
          `private-subnet-${i + 1}-${args.environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: subnetCidrs[i],
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: {
              ...tags,
              Name: `private-subnet-${i + 1}-${args.environmentSuffix}`,
              Tier: 'Private',
            },
          },
          { parent: this }
        )
    );

    // Security group for RDS PostgreSQL
    const databaseSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        name: `rds-security-group-${args.environmentSuffix}`,
        description: 'Security group for RDS PostgreSQL instances',
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `rds-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security group for DMS replication instances
    const dmsSecurityGroup = new aws.ec2.SecurityGroup(
      `dms-sg-${args.environmentSuffix}`,
      {
        name: `dms-security-group-${args.environmentSuffix}`,
        description: 'Security group for DMS replication instances',
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `dms-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        name: `lambda-security-group-${args.environmentSuffix}`,
        description: 'Security group for Lambda secret rotation',
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `lambda-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security group for VPC endpoints
    const endpointSecurityGroup = new aws.ec2.SecurityGroup(
      `endpoint-sg-${args.environmentSuffix}`,
      {
        name: `endpoint-security-group-${args.environmentSuffix}`,
        description: 'Security group for VPC endpoints',
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `endpoint-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Allow DMS to connect to RDS on PostgreSQL port
    new aws.ec2.SecurityGroupRule(
      `dms-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: dmsSecurityGroup.id,
        securityGroupId: databaseSecurityGroup.id,
        description: 'Allow DMS to connect to RDS',
      },
      { parent: this }
    );

    // Allow Lambda to connect to RDS for credential validation
    new aws.ec2.SecurityGroupRule(
      `lambda-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: lambdaSecurityGroup.id,
        securityGroupId: databaseSecurityGroup.id,
        description: 'Allow Lambda to connect to RDS for rotation',
      },
      { parent: this }
    );

    // Allow DMS egress to RDS
    new aws.ec2.SecurityGroupRule(
      `dms-egress-${args.environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: databaseSecurityGroup.id,
        securityGroupId: dmsSecurityGroup.id,
        description: 'Allow DMS egress to RDS',
      },
      { parent: this }
    );

    // Allow Lambda egress to RDS
    new aws.ec2.SecurityGroupRule(
      `lambda-egress-rds-${args.environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: databaseSecurityGroup.id,
        securityGroupId: lambdaSecurityGroup.id,
        description: 'Allow Lambda egress to RDS',
      },
      { parent: this }
    );

    // Allow Lambda to access VPC endpoints (HTTPS)
    new aws.ec2.SecurityGroupRule(
      `lambda-to-endpoints-${args.environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        sourceSecurityGroupId: endpointSecurityGroup.id,
        securityGroupId: lambdaSecurityGroup.id,
        description: 'Allow Lambda to access VPC endpoints',
      },
      { parent: this }
    );

    // Allow traffic to VPC endpoints
    new aws.ec2.SecurityGroupRule(
      `endpoint-ingress-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16'],
        securityGroupId: endpointSecurityGroup.id,
        description: 'Allow HTTPS to VPC endpoints from VPC',
      },
      { parent: this }
    );

    // Export values
    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.all(privateSubnets.map(s => s.id));
    this.databaseSecurityGroupId = databaseSecurityGroup.id;
    this.dmsSecurityGroupId = dmsSecurityGroup.id;
    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;
    this.endpointSecurityGroupId = endpointSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
      dmsSecurityGroupId: this.dmsSecurityGroupId,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
      endpointSecurityGroupId: this.endpointSecurityGroupId,
    });
  }
}
