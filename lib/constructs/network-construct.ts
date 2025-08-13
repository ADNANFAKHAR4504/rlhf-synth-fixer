import { Construct } from 'constructs';
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  Peer,
  FlowLog,
  FlowLogDestination,
  FlowLogTrafficType,
  FlowLogResourceType,
  NatProvider,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  GatewayVpcEndpoint,
  GatewayVpcEndpointAwsService,
} from 'aws-cdk-lib/aws-ec2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TaggingUtils } from '../utils/tagging';

export interface NetworkConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  logEncryptionKey: Key;
}

/**
 * Network Construct for VPC and security group configuration
 * Creates a secure, multi-AZ VPC with private subnets for sensitive workloads
 * Implements network segmentation and least-privilege access controls
 */
export class NetworkConstruct extends Construct {
  public vpc: Vpc;
  public webSecurityGroup: SecurityGroup;
  public appSecurityGroup: SecurityGroup;
  public databaseSecurityGroup: SecurityGroup;
  public lambdaSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id);

    // Create VPC with private and public subnets across multiple AZs
    this.vpc = new Vpc(this, 'SecureVpc', {
      maxAzs: 3, // Multi-AZ deployment for high availability
      cidr: '10.0.0.0/16',
      natGateways: 2, // NAT Gateways in multiple AZs for redundancy
      natGatewayProvider: NatProvider.gateway(),
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for network monitoring and compliance
    const flowLogGroup = new LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'vpc'
      )}`,
      retention: RetentionDays.ONE_YEAR, // Retain logs for compliance
      encryptionKey: props.logEncryptionKey, // Now properly configured with permissions
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Add explicit dependency to ensure KMS key is created before LogGroup
    flowLogGroup.node.addDependency(props.logEncryptionKey);

    new FlowLog(this, 'VpcFlowLog', {
      resourceType: FlowLogResourceType.fromVpc(this.vpc),
      destination: FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for secure AWS service communication
    this.createVpcEndpoints();

    // Security Groups with least-privilege access
    this.createSecurityGroups(props);

    // Apply standard tags
    TaggingUtils.applyStandardTags(
      this.vpc,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'VPC' }
    );
  }

  /**
   * Create VPC endpoints to avoid internet traffic for AWS services
   */
  private createVpcEndpoints(): void {
    // Interface endpoints for AWS services
    const interfaceServices = [
      InterfaceVpcEndpointAwsService.EC2,
      InterfaceVpcEndpointAwsService.ECS,
      InterfaceVpcEndpointAwsService.ECR,
      InterfaceVpcEndpointAwsService.ECR_DOCKER,
      InterfaceVpcEndpointAwsService.LAMBDA,
      InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      InterfaceVpcEndpointAwsService.KMS,
      InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
    ];

    interfaceServices.forEach((service, index) => {
      new InterfaceVpcEndpoint(this, `InterfaceEndpoint${index}`, {
        vpc: this.vpc,
        service,
        privateDnsEnabled: true,
        subnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    });

    // Gateway endpoints for S3 and DynamoDB
    new GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: GatewayVpcEndpointAwsService.S3,
    });

    new GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
      vpc: this.vpc,
      service: GatewayVpcEndpointAwsService.DYNAMODB,
    });
  }

  /**
   * Create security groups with restrictive rules
   */
  private createSecurityGroups(props: NetworkConstructProps): void {
    // Web tier security group (ALB/CloudFront)
    this.webSecurityGroup = new SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web tier (load balancers)',
      allowAllOutbound: false, // Explicit outbound rules only
    });

    // Allow HTTPS inbound from internet (443 only)
    this.webSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS from internet'
    );

    // Allow HTTP inbound for redirect to HTTPS
    this.webSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'HTTP redirect to HTTPS'
    );

    // Application tier security group
    this.appSecurityGroup = new SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    // Allow inbound from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      Port.tcp(8080),
      'HTTP from web tier'
    );

    // Database security group
    this.databaseSecurityGroup = new SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    // Allow database access only from application tier
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      Port.tcp(5432), // PostgreSQL
      'Database access from app tier'
    );

    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      Port.tcp(3306), // MySQL
      'Database access from app tier'
    );

    // Lambda security group for serverless functions
    this.lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: false,
    });

    // Allow Lambda to access database
    this.lambdaSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(5432),
      'Lambda to database'
    );

    // Allow HTTPS outbound for AWS API calls
    this.lambdaSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS for AWS APIs'
    );

    // Outbound rules for web security group
    this.webSecurityGroup.addEgressRule(
      this.appSecurityGroup,
      Port.tcp(8080),
      'To application tier'
    );

    // Outbound rules for app security group
    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(5432),
      'To database'
    );

    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(3306),
      'To database'
    );

    this.appSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS for external APIs'
    );

    // Apply tags to security groups
    const securityGroups = [
      { sg: this.webSecurityGroup, type: 'Web' },
      { sg: this.appSecurityGroup, type: 'App' },
      { sg: this.databaseSecurityGroup, type: 'Database' },
      { sg: this.lambdaSecurityGroup, type: 'Lambda' },
    ];

    securityGroups.forEach(({ sg, type }) => {
      TaggingUtils.applyStandardTags(
        sg,
        props.environment,
        props.service,
        props.owner,
        props.project,
        { ResourceType: `SecurityGroup-${type}` }
      );
    });
  }
}
