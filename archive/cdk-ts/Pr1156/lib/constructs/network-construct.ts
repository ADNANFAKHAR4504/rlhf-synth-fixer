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
import {
  ApplicationLoadBalancer,
  ApplicationTargetGroup,
  TargetType,
  ListenerAction,
  ApplicationProtocol,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
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
  public alb: ApplicationLoadBalancer;
  public webAcl: CfnWebACL;

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

    // Create WAF Web ACL
    this.createWebAcl(props);

    // Create Application Load Balancer with WAF
    this.createApplicationLoadBalancer(props);

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
   * Create WAF Web ACL for ALB protection
   */
  private createWebAcl(props: NetworkConstructProps): void {
    this.webAcl = new CfnWebACL(this, 'WebACL', {
      name: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'webacl'
      ),
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rules: [
        // AWS Managed Rules - Common Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
          },
        },
        // AWS Managed Rules - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSetMetric',
          },
        },
        // AWS Managed Rules - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: {
            none: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSetMetric',
          },
        },
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 4,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRuleMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: TaggingUtils.generateResourceName(
          props.environment,
          props.service,
          'webacl'
        ),
      },
    });

    // Apply tags to WAF
    TaggingUtils.applyStandardTags(
      this.webAcl,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'WAF-WebACL' }
    );
  }

  /**
   * Create Application Load Balancer with WAF integration
   */
  private createApplicationLoadBalancer(props: NetworkConstructProps): void {
    this.alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: this.webSecurityGroup,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      loadBalancerName: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'alb'
      ),
    });

    // Create target group for application servers
    const targetGroup = new ApplicationTargetGroup(this, 'AppTargetGroup', {
      vpc: this.vpc,
      port: 8080,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.INSTANCE,
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      targets: [], // Will be populated when EC2 instances are created
    });

    // Create HTTPS listener (commented out for testing - requires certificate)
    // this.alb.addListener('HttpsListener', {
    //   port: 443,
    //   protocol: ApplicationProtocol.HTTPS,
    //   defaultAction: ListenerAction.forward([targetGroup]),
    //   // Note: Certificate ARN would be provided as a parameter in production
    //   // certificates: [certificate],
    // });

    // Create HTTP listener (redirect to HTTPS commented out for testing)
    this.alb.addListener('HttpListener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.forward([targetGroup]),
      // Note: In production, this would redirect to HTTPS
      // defaultAction: ListenerAction.redirect({
      //   protocol: 'HTTPS',
      //   port: '443',
      //   permanent: true,
      // }),
    });

    // Associate WAF with ALB
    new CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn: this.webAcl.attrArn,
    });

    // Apply tags to ALB
    TaggingUtils.applyStandardTags(
      this.alb,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'ALB' }
    );
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
