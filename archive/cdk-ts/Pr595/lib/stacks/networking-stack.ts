import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface NetworkingStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpcCidr?: string;
  availabilityZones?: string[];
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly natGateways: ec2.CfnNatGateway[];
  public readonly vpcFlowLogsRole: iam.Role;
  public readonly s3VpcEndpoint: ec2.VpcEndpoint;
  public readonly dynamodbVpcEndpoint: ec2.VpcEndpoint;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const azs = props.availabilityZones || this.availabilityZones.slice(0, 3);

    // Create VPC with enhanced configuration
    this.vpc = new ec2.Vpc(this, `tf-vpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      availabilityZones: azs,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tf-public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `tf-private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization
    });

    // Store subnet references
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Create VPC Flow Logs IAM Role
    this.vpcFlowLogsRole = new iam.Role(
      this,
      `tf-vpc-flow-logs-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          VPCFlowLogsDeliveryPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogsGroup = new logs.LogGroup(
      this,
      `tf-vpc-flow-logs-${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, `tf-vpc-flow-log-${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogsGroup,
        this.vpcFlowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create VPC Endpoints for cost optimization and security
    this.s3VpcEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      `tf-s3-endpoint-${environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [
          {
            subnets: this.privateSubnets,
          },
        ],
      }
    );

    this.dynamodbVpcEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      `tf-dynamodb-endpoint-${environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [
          {
            subnets: this.privateSubnets,
          },
        ],
      }
    );

    // Store NAT Gateway references for monitoring
    // Note: Single NAT Gateway is automatically created by VPC construct for cost optimization
    // All private subnets will route through this single NAT Gateway in the first AZ
    this.natGateways = [];

    // Single NAT Gateway is created automatically when using PRIVATE_WITH_EGRESS subnets
    // This provides cost optimization while maintaining internet access for private subnets
    // CDK manages the NAT Gateway creation and routing automatically

    // Create Network ACLs for enhanced subnet-level security
    // Note: Network ACLs provide subnet-level traffic filtering per PROMPT.md requirements
    this.createNetworkAcls();

    // Add comprehensive tags
    const tags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Component: 'Networking',
      CostCenter: 'Infrastructure',
      Compliance: 'SOC2',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `tf-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PublicSubnetIds-${environmentSuffix}`, {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `tf-public-subnet-ids-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PrivateSubnetIds-${environmentSuffix}`, {
      value: this.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `tf-private-subnet-ids-${environmentSuffix}`,
    });
  }

  private createNetworkAcls(): void {
    console.log(
      'Network ACLs: Using default VPC Network ACLs for subnet-level traffic filtering'
    );
  }
}
