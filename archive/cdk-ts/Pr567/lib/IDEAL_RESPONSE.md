```typescript
// multi-region-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

export interface MultiRegionStackProps extends cdk.StackProps {
  region: string;
  isMainRegion?: boolean;
}

export class MultiRegionStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2Role: iam.Role;
  public readonly applicationBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: MultiRegionStackProps) {
    super(scope, id, props);

    // Create VPC for the region
    this.vpc = new ec2.Vpc(this, 'ApplicationVpc', {
      maxAzs: 2,
      natGateways: 1,
      ipAddresses: ec2.IpAddresses.cidr(
        props.region === 'us-east-1' ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
    });

    // Create IAM role for EC2 instances with tag-based S3 access
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with restricted S3 access',
    });

    // Add tag-based S3 access policy for objects
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: ['arn:aws:s3:::*/*'],
        conditions: {
          StringEquals: {
            's3:ExistingObjectTag/Accessible': 'true',
          },
        },
      })
    );

    // Add tag-based S3 access policy for buckets
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: ['arn:aws:s3:::*'],
        conditions: {
          StringEquals: {
            'aws:ResourceTag/Accessible': 'true',
          },
        },
      })
    );

    // Add policy to list buckets and get bucket tags
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListAllMyBuckets', 's3:GetBucketTagging'],
        resources: ['*'],
      })
    );

    // Create S3 bucket with proper tags
    this.applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `globalapp-${props.region}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Tag S3 bucket as accessible
    cdk.Tags.of(this.applicationBucket).add('Accessible', 'true');
    cdk.Tags.of(this.applicationBucket).add('Environment', 'Production');
    cdk.Tags.of(this.applicationBucket).add('Project', 'GlobalApp');

    // Create EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y aws-cli',
      'echo "Region: ' + props.region + '" > /tmp/region-info.txt'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      role: this.ec2Role,
      userData: userData,
      securityGroup: new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
        vpc: this.vpc,
        description: 'Security group for application instances',
        allowAllOutbound: true,
      }),
    });

    // Create Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ApplicationASG', {
      vpc: this.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      maxCapacity: 3,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Add removal policy to allow deletion
    asg.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create Step Functions state machine for cross-region orchestration (only in main region)
    if (props.isMainRegion) {
      this.createStepFunction();
    }

    // Apply tags to all resources in the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'GlobalApp');
    cdk.Tags.of(this).add('Region', props.region);
  }

  private createStepFunction() {
    // Define the Step Functions workflow
    const definition = new stepfunctions.Pass(this, 'StartWorkflow', {
      comment: 'Start multi-region workflow',
      result: stepfunctions.Result.fromObject({ status: 'started' }),
    })
      .next(
        new stepfunctions.Parallel(this, 'ParallelRegionTasks', {
          comment: 'Execute tasks in parallel across regions',
        })
          .branch(
            new stepfunctions.Pass(this, 'USEast1Task', {
              comment: 'Task for us-east-1',
              result: stepfunctions.Result.fromObject({
                region: 'us-east-1',
                status: 'completed',
              }),
            })
          )
          .branch(
            new stepfunctions.Pass(this, 'EUWest1Task', {
              comment: 'Task for eu-west-1',
              result: stepfunctions.Result.fromObject({
                region: 'eu-west-1',
                status: 'completed',
              }),
            })
          )
      )
      .next(
        new stepfunctions.Pass(this, 'CompleteWorkflow', {
          comment: 'Complete multi-region workflow',
          result: stepfunctions.Result.fromObject({ status: 'completed' }),
        })
      );

    // Create the state machine
    new stepfunctions.StateMachine(this, 'MultiRegionStateMachine', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
      stateMachineName: 'GlobalApp-MultiRegion-Orchestrator',
      comment: 'Orchestrates workflows across multiple regions',
    });
  }
}

```

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiRegionStack } from './multi-region-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Deploy to us-east-1 (main region)
    new MultiRegionStack(scope, `GlobalApp-USEast1-${environmentSuffix}`, {
      region: 'us-east-1',
      isMainRegion: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      },
    });

    // Deploy to eu-west-1
    new MultiRegionStack(scope, `GlobalApp-EUWest1-${environmentSuffix}`, {
      region: 'eu-west-1',
      isMainRegion: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'eu-west-1',
      },
    });
  }
}

```