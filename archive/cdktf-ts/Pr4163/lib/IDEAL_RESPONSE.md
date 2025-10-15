**tap-stack.ts**

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { Construct } from 'constructs';

// Import all modules
import {
  VpcModule,
  SecurityGroupsModule,
  IamRolesModule,
  AlbModule,
  AsgModule,
  LambdaModule,
  SqsModule,
  CloudWatchModule,
  SsmModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider
    new ArchiveProvider(this, 'archive');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Project configuration
    const projectName = 'myapp'; // Change this to your project name
    const environment = environmentSuffix;

    // 1. Create VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      projectName,
      environment,
    });

    // 2. Create SQS Module (needed for IAM roles)
    const sqsModule = new SqsModule(this, 'sqs', {
      queueName: `${projectName}-${environment}-processing-queue`,
      environment,
    });

    // 3. Create Security Groups Module
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      'security-groups',
      {
        vpcId: vpcModule.vpc.id,
        projectName,
        environment,
      }
    );

    // 4. Create IAM Roles Module
    const iamRolesModule = new IamRolesModule(this, 'iam-roles', {
      projectName,
      environment,
      sqsQueueArn: sqsModule.queue.arn,
    });

    const albModule = new AlbModule(this, 'alb', {
      projectName,
      environment,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnetIds,
      securityGroupId: securityGroupsModule.albSecurityGroup.id,
      logBucket: `${projectName}-${environment}-alb-logs-${awsRegion}`,
    });

    // 6. Create ASG Module
    const asgModule = new AsgModule(this, 'asg', {
      projectName,
      environment,
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnetIds,
      targetGroupArn: albModule.targetGroup.arn,
      securityGroupId: securityGroupsModule.ec2SecurityGroup.id,
      instanceProfileName: iamRolesModule.ec2InstanceProfile.name,
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
    });

    // 7. Create Lambda Module
    const lambdaModule = new LambdaModule(this, 'lambda', {
      projectName,
      environment,
      roleArn: iamRolesModule.lambdaRole.arn,
      sqsQueueArn: sqsModule.queue.arn,
      timeout: 300,
    });

    // 8. Create CloudWatch Module
    new CloudWatchModule(this, 'cloudwatch', {
      projectName,
      environment,
      asgName: asgModule.autoScalingGroup.name,
      lambdaFunctionName: lambdaModule.function.functionName,
      albArn: albModule.alb.arn,
    });

    // 9. Create SSM Parameters Module
    new SsmModule(this, 'ssm', {
      projectName,
      environment,
      parameters: {
        db_host: 'localhost',
        db_port: '5432',
        app_version: '1.0.0',
        feature_flags: JSON.stringify({ newFeature: true }),
      },
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnetIds,
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnetIds,
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'ALB DNS name',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asgModule.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: lambdaModule.function.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaModule.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'sqs-queue-url', {
      value: sqsModule.queue.url,
      description: 'SQS queue URL',
    });

    new TerraformOutput(this, 'sqs-queue-arn', {
      value: sqsModule.queue.arn,
      description: 'SQS queue ARN',
    });
  }
}

```
**modules.ts**

```typescript
// lib/modules.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { Fn } from 'cdktf';

// VPC Module
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(
    scope: Construct,
    id: string,
    props: {
      cidrBlock: string;
      projectName: string;
      environment: string;
    }
  ) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.projectName}-${props.environment}-vpc`,
      },
    });

    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-${props.environment}-igw`,
      },
    });

    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.projectName}-${props.environment}-public-subnet-${i + 1}`,
          Type: 'public',
        },
      });
      publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `${props.projectName}-${props.environment}-private-subnet-${i + 1}`,
          Type: 'private',
        },
      });
      privateSubnets.push(privateSubnet);
    }

    const eip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${props.projectName}-${props.environment}-nat-eip`,
      },
    });

    const natGateway = new NatGateway(this, 'nat', {
      allocationId: eip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        Name: `${props.projectName}-${props.environment}-nat`,
      },
    });

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-${props.environment}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-${props.environment}-private-rt`,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
  }
}

// Security Groups Module
export class SecurityGroupsModule extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpcId: string;
      projectName: string;
      environment: string;
    }
  ) {
    super(scope, id);

    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${props.projectName}-${props.environment}-alb-sg`,
      description: 'Security group for ALB',
      vpcId: props.vpcId,
      tags: {
        Name: `${props.projectName}-${props.environment}-alb-sg`,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${props.projectName}-${props.environment}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      tags: {
        Name: `${props.projectName}-${props.environment}-ec2-sg`,
      },
    });

    new SecurityGroupRule(this, 'ec2-ingress-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
    });
  }
}

// IAM Roles Module
export class IamRolesModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;
  public readonly lambdaRole: IamRole;

  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      sqsQueueArn: string;
    }
  ) {
    super(scope, id);

    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${props.projectName}-${props.environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${props.projectName}-${props.environment}-ec2-role`,
      },
    });

    new IamRolePolicyAttachment(this, 'ec2-s3-readonly', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    this.ec2InstanceProfile = new IamInstanceProfile(this, 'ec2-profile', {
      name: `${props.projectName}-${props.environment}-ec2-profile`,
      role: this.ec2Role.name,
    });

    this.lambdaRole = new IamRole(this, 'lambda-role', {
      name: `${props.projectName}-${props.environment}-lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${props.projectName}-${props.environment}-lambda-role`,
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-basic', {
      role: this.lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const sqsPolicy = new IamPolicy(this, 'lambda-sqs-policy', {
      name: `${props.projectName}-${props.environment}-lambda-sqs-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Resource: props.sqsQueueArn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-sqs-attachment', {
      role: this.lambdaRole.name,
      policyArn: sqsPolicy.arn,
    });
  }
}

// ALB Module
export class AlbModule extends Construct {
  public readonly alb: Alb;
  public readonly targetGroup: AlbTargetGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      vpcId: string;
      publicSubnetIds: string[];
      securityGroupId: string;
      logBucket: string;
    }
  ) {
    super(scope, id);

    const logBucket = new S3Bucket(this, 'alb-logs', {
      bucket: props.logBucket,
      tags: {
        Name: `${props.projectName}-${props.environment}-alb-logs`,
      },
    });

    new S3BucketPublicAccessBlock(this, 'alb-logs-pab', {
      bucket: logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketPolicy(this, 'alb-logs-policy', {
      bucket: logBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::127311923021:root',
            },
            Action: 's3:PutObject',
            Resource: `${logBucket.arn}/*`,
          },
        ],
      }),
    });

    this.alb = new Alb(this, 'alb', {
      name: `${props.projectName}-${props.environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [props.securityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      accessLogs: {
        bucket: logBucket.bucket,
        enabled: true,
        prefix: 'alb',
      },
      tags: {
        Name: `${props.projectName}-${props.environment}-alb`,
      },
    });

    this.targetGroup = new AlbTargetGroup(this, 'tg', {
      name: `${props.projectName}-${props.environment}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
      },
      tags: {
        Name: `${props.projectName}-${props.environment}-tg`,
      },
    });

    new AlbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

// ASG Module
export class AsgModule extends Construct {
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      vpcId: string;
      privateSubnetIds: string[];
      targetGroupArn: string;
      securityGroupId: string;
      instanceProfileName: string;
      minSize: number;
      maxSize: number;
      desiredCapacity: number;
    }
  ) {
    super(scope, id);

    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${props.projectName}-${props.environment}</h1>" > /var/www/html/index.html
`;

    const launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `${props.projectName}-${props.environment}-lt`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [props.securityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${props.projectName}-${props.environment}-instance`,
          },
        },
      ],
    });

    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${props.projectName}-${props.environment}-asg`,
      vpcZoneIdentifier: props.privateSubnetIds,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      targetGroupArns: [props.targetGroupArn],
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${props.projectName}-${props.environment}-asg-instance`,
          propagateAtLaunch: true,
        },
      ],
    });
  }
}

// Lambda Module
export class LambdaModule extends Construct {
  public readonly function: LambdaFunction;

  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      roleArn: string;
      sqsQueueArn: string;
      timeout: number;
    }
  ) {
    super(scope, id);

    const handlerCode = `
exports.handler = async (event) => {
  console.log('Processing SQS messages:', JSON.stringify(event));
  
  for (const record of event.Records) {
    const messageBody = record.body;
    console.log('Processing message:', messageBody);
    
    try {
      const data = JSON.parse(messageBody);
      console.log('Parsed message data:', data);
      
      // Process message logic here
      await processMessage(data);
      
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Messages processed successfully' })
  };
};

async function processMessage(data) {
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Message processed:', data);
}
`;

    // Create log group first
    new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/${props.projectName}-${props.environment}-processor`,
      retentionInDays: 7,
    });

    // Create in-memory zip file for Lambda code
    const archive = new DataArchiveFile(this, 'lambda-archive', {
      type: 'zip',
      outputPath: `${props.projectName}-${props.environment}-processor.zip`,
      source: [
        {
          content: handlerCode,
          filename: 'index.js',
        },
      ],
    });

    this.function = new LambdaFunction(this, 'function', {
      functionName: `${props.projectName}-${props.environment}-processor`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: props.roleArn,
      timeout: props.timeout,
      memorySize: 256,
      environment: {
        variables: {
          ENVIRONMENT: props.environment,
        },
      },
      // Use filename and sourceCodeHash instead of inlineCode
      filename: archive.outputPath,
      sourceCodeHash: archive.outputBase64Sha256,
      tags: {
        Name: `${props.projectName}-${props.environment}-lambda`,
      },
    });

    new LambdaEventSourceMapping(this, 'sqs-trigger', {
      eventSourceArn: props.sqsQueueArn,
      functionName: this.function.functionName,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    });
  }
}

// SQS Module
export class SqsModule extends Construct {
  public readonly queue: SqsQueue;

  constructor(
    scope: Construct,
    id: string,
    props: {
      queueName: string;
      environment: string;
    }
  ) {
    super(scope, id);

    this.queue = new SqsQueue(this, 'queue', {
      name: props.queueName,
      visibilityTimeoutSeconds: 300,
      messageRetentionSeconds: 1209600,
      maxMessageSize: 262144,
      delaySeconds: 0,
      receiveWaitTimeSeconds: 20,
      tags: {
        Name: props.queueName,
        Environment: props.environment,
      },
    });
  }
}

// CloudWatch Module
export class CloudWatchModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      asgName: string;
      lambdaFunctionName: string;
      albArn: string;
      targetGroupArn?: string; // Optional target group support
    }
  ) {
    super(scope, id);

    // ALB Logs
    new CloudwatchLogGroup(this, 'alb-logs', {
      name: `/aws/alb/${props.projectName}-${props.environment}`,
      retentionInDays: 7,
    });

    // EC2 CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'cpu-alarm', {
      alarmName: `${props.projectName}-${props.environment}-cpu-high`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      dimensions: {
        AutoScalingGroupName: props.asgName,
      },
      treatMissingData: 'breaching',
    });

    // Fixed: ALB Unhealthy Hosts Alarm (only if ALB ARN is valid)
    if (props.albArn && props.albArn.includes('loadbalancer/app/')) {
      const albDimension = props.albArn.split('loadbalancer/')[1] || '';

      if (albDimension) {
        new CloudwatchMetricAlarm(this, 'alb-unhealthy-hosts', {
          alarmName: `${props.projectName}-${props.environment}-unhealthy-hosts`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'UnHealthyHostCount',
          namespace: 'AWS/ApplicationELB',
          period: 60,
          statistic: 'Average',
          threshold: 0,
          alarmDescription: 'Alert when we have unhealthy ALB targets',
          dimensions: {
            LoadBalancer: albDimension,
          },
          treatMissingData: 'notBreaching',
        });
      }
    }

    // Lambda Errors Alarm
    new CloudwatchMetricAlarm(this, 'lambda-errors', {
      alarmName: `${props.projectName}-${props.environment}-lambda-errors`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Lambda function errors',
      dimensions: {
        FunctionName: props.lambdaFunctionName,
      },
      treatMissingData: 'notBreaching',
    });
  }
}

// SSM Parameters Module
export class SsmModule extends Construct {
  private parameters: Map<string, SsmParameter> = new Map();

  constructor(
    scope: Construct,
    id: string,
    props: {
      projectName: string;
      environment: string;
      parameters: Record<string, string>;
    }
  ) {
    super(scope, id);

    Object.entries(props.parameters).forEach(([key, value]) => {
      const param = new SsmParameter(this, `param-${key}`, {
        name: `/${props.projectName}/${props.environment}/${key}`,
        type: 'String',
        value: value,
        tags: {
          Name: `${props.projectName}-${props.environment}-${key}`,
        },
      });
      this.parameters.set(key, param);
    });
  }

  public getParameterValue(key: string): string {
    const param = this.parameters.get(key);
    return param ? param.value : '';
  }
}

```