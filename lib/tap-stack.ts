import * as cdk from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const project = 'tap';

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566') ||
      process.env.CDK_DEFAULT_ACCOUNT === '000000000000';

    // Create VPC with public and private subnets across multiple AZs
    // For LocalStack: Simplified VPC without NAT Gateway (not well supported)
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${project}-${environmentSuffix}-vpc`,
      maxAzs: isLocalStack ? 1 : 2, // LocalStack: single AZ to reduce complexity
      natGateways: isLocalStack ? 0 : 1, // LocalStack: no NAT Gateway
      subnetConfiguration: isLocalStack
        ? [
            {
              cidrMask: 24,
              name: `${project}-${environmentSuffix}-public-subnet`,
              subnetType: ec2.SubnetType.PUBLIC,
            },
          ]
        : [
            {
              cidrMask: 24,
              name: `${project}-${environmentSuffix}-public-subnet`,
              subnetType: ec2.SubnetType.PUBLIC,
            },
            {
              cidrMask: 24,
              name: `${project}-${environmentSuffix}-private-subnet`,
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
          ],
    });

    // Create S3 bucket for application logs with versioning
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${project}-${environmentSuffix}-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM role for EC2 instance
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${project}-${environmentSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create IAM role for logging service
    const loggingRole = new iam.Role(this, 'LoggingRole', {
      roleName: `${project}-${environmentSuffix}-logging-role`,
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
    });

    // Custom IAM policy for S3 bucket access (restricted to specific roles)
    const s3AccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [ec2Role, loggingRole],
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetBucketVersioning',
        's3:GetObjectVersion',
      ],
      resources: [logsBucket.bucketArn, `${logsBucket.bucketArn}/*`],
    });

    // Add the policy to the bucket
    logsBucket.addToResourcePolicy(s3AccessPolicy);

    // Add S3 access to EC2 role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [logsBucket.bucketArn, `${logsBucket.bucketArn}/*`],
      })
    );

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      securityGroupName: `${project}-${environmentSuffix}-ec2-sg`,
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      securityGroupName: `${project}-${environmentSuffix}-alb-sg`,
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // ═══════════════════════════════════════════════════════════════
    // CONDITIONAL DEPLOYMENT: AWS vs LocalStack
    // ═══════════════════════════════════════════════════════════════

    let ec2Instance1: ec2.Instance | undefined;
    let ec2Instance2: ec2.Instance | undefined;
    let elasticIp: ec2.CfnEIP | undefined;
    let alb: elbv2.ApplicationLoadBalancer | undefined;
    let apiUrl: string;

    if (isLocalStack) {
      // ═══════════════════════════════════════════════════════════════
      // LOCALSTACK PATH: Lambda + API Gateway (well supported)
      // ═══════════════════════════════════════════════════════════════

      // Create Lambda function role
      const lambdaRole = new iam.Role(this, 'LambdaRole', {
        roleName: `${project}-${environmentSuffix}-lambda-role`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      });

      // Grant Lambda access to S3 bucket
      logsBucket.grantReadWrite(lambdaRole);

      // Create Lambda function (inline code for simplicity)
      const webFunction = new lambda.Function(this, 'WebFunction', {
        functionName: `${project}-${environmentSuffix}-web`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        role: lambdaRole,
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const hostname = process.env.AWS_LAMBDA_FUNCTION_NAME || 'lambda-function';
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: '<h1>Hello from ' + hostname + '</h1>',
  };
};
        `),
        environment: {
          LOG_BUCKET: logsBucket.bucketName,
        },
      });

      // Create API Gateway
      const api = new apigateway.RestApi(this, 'WebApi', {
        restApiName: `${project}-${environmentSuffix}-api`,
        description: 'API Gateway for LocalStack deployment',
        deployOptions: {
          stageName: 'prod',
        },
      });

      // Add Lambda integration
      const integration = new apigateway.LambdaIntegration(webFunction);
      api.root.addMethod('GET', integration);

      apiUrl = api.url;

      // Output API URL
      new cdk.CfnOutput(this, 'ApiUrl', {
        value: apiUrl,
        description: 'API Gateway URL (LocalStack)',
        exportName: `${project}-${environmentSuffix}-api-url`,
      });
    } else {
      // ═══════════════════════════════════════════════════════════════
      // AWS PATH: EC2 + ALB (original design)
      // ═══════════════════════════════════════════════════════════════

      // User data script for EC2 instances
      const userData = ec2.UserData.forLinux();
      userData.addCommands(
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
        'amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default -s'
      );

      // Create EC2 instances in different AZs
      ec2Instance1 = new ec2.Instance(this, 'EC2Instance1', {
        instanceName: `${project}-${environmentSuffix}-instance-1`,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: [vpc.availabilityZones[0]],
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
        requireImdsv2: true,
      });

      ec2Instance2 = new ec2.Instance(this, 'EC2Instance2', {
        instanceName: `${project}-${environmentSuffix}-instance-2`,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: [vpc.availabilityZones[1]],
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
        requireImdsv2: true,
      });

      // Create Elastic IP and associate with primary instance
      elasticIp = new ec2.CfnEIP(this, 'ElasticIP', {
        domain: 'vpc',
        tags: [
          {
            key: 'Name',
            value: `${project}-${environmentSuffix}-eip`,
          },
        ],
      });

      new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
        eip: elasticIp.ref,
        instanceId: ec2Instance1.instanceId,
      });

      // Application Load Balancer
      alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
        loadBalancerName: `${project}-${environmentSuffix}-alb`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      });

      // Target Group
      const targetGroup = new elbv2.ApplicationTargetGroup(
        this,
        'TargetGroup',
        {
          targetGroupName: `${project}-${environmentSuffix}-tg`,
          port: 80,
          protocol: elbv2.ApplicationProtocol.HTTP,
          vpc,
          healthCheck: {
            enabled: true,
            healthyHttpCodes: '200',
            path: '/',
            protocol: elbv2.Protocol.HTTP,
          },
          targets: [
            new targets.InstanceTarget(ec2Instance1, 80),
            new targets.InstanceTarget(ec2Instance2, 80),
          ],
        }
      );

      // ALB Listener
      alb.addListener('Listener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });

      apiUrl = `http://${alb.loadBalancerDnsName}`;
    }

    // CDK Aspects for compliance validation
    cdk.Aspects.of(this).add(new SecurityComplianceAspect());

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${project}-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Bucket for Application Logs',
      exportName: `${project}-${environmentSuffix}-logs-bucket`,
    });

    // Conditional outputs based on deployment type
    if (elasticIp) {
      new cdk.CfnOutput(this, 'ElasticIPAddress', {
        value: elasticIp.ref,
        description: 'Elastic IP Address',
        exportName: `${project}-${environmentSuffix}-elastic-ip`,
      });
    }

    if (alb) {
      new cdk.CfnOutput(this, 'LoadBalancerDNS', {
        value: alb.loadBalancerDnsName,
        description: 'Application Load Balancer DNS Name',
        exportName: `${project}-${environmentSuffix}-alb-dns`,
      });
    }

    // Output the API/web endpoint
    new cdk.CfnOutput(this, 'WebEndpoint', {
      value: apiUrl,
      description: isLocalStack
        ? 'API Gateway URL (LocalStack)'
        : 'Load Balancer URL (AWS)',
      exportName: `${project}-${environmentSuffix}-web-endpoint`,
    });
  }
}

// CDK Aspect for Security Compliance
class SecurityComplianceAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    // Ensure S3 buckets have encryption
    if (node instanceof s3.Bucket) {
      const cfnBucket = node.node.defaultChild as s3.CfnBucket;
      if (cfnBucket) {
        const bucketEncryption = cfnBucket.bucketEncryption as any;
        if (
          !bucketEncryption ||
          !bucketEncryption.serverSideEncryptionConfiguration ||
          bucketEncryption.serverSideEncryptionConfiguration.length === 0
        ) {
          cdk.Annotations.of(node).addWarning(
            'S3 bucket should have encryption configured'
          );
        }
      }
    }

    // Ensure EC2 instances have IMDSv2 configured
    // Note: requireImdsv2 is already set on our instances, so we'll just validate that the property exists
    if (node instanceof ec2.Instance) {
      const cfnNode = node.node.defaultChild as ec2.CfnInstance;
      if (cfnNode) {
        // Validate that metadataOptions is configured (requireImdsv2 sets this)
        if (!cfnNode.metadataOptions) {
          cdk.Annotations.of(node).addWarning(
            'EC2 instance should have IMDSv2 configured'
          );
        }
      }
    }
  }
}
