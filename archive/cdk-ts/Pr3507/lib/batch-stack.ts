import * as cdk from 'aws-cdk-lib';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

interface BatchStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  modelBucket: s3.Bucket;
  ecrRepository: ecr.Repository;
}

export class BatchStack extends cdk.NestedStack {
  public readonly computeEnvironment: batch.ManagedEc2EcsComputeEnvironment;
  public readonly jobQueue: batch.JobQueue;
  public readonly jobDefinition: batch.EcsJobDefinition;

  constructor(scope: Construct, id: string, props: BatchStackProps) {
    super(scope, id);

    // Security group for Batch compute environment
    const securityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Batch compute environment',
      allowAllOutbound: true,
    });

    // Create compute environment with Spot instances
    this.computeEnvironment = new batch.ManagedEc2EcsComputeEnvironment(
      this,
      'ComputeEnvironment',
      {
        computeEnvironmentName: `batch-inference-${props.environmentSuffix}`,
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.vpc.publicSubnets, // Use public subnets for internet access
        },
        securityGroups: [securityGroup],
        spot: true,
        spotBidPercentage: 80,
        maxvCpus: 256,
        minvCpus: 0,
        instanceTypes: [
          ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        ],
        enabled: true,
        replaceComputeEnvironment: false,
      }
    );

    // Create job queue
    this.jobQueue = new batch.JobQueue(this, 'JobQueue', {
      jobQueueName: `inference-queue-${props.environmentSuffix}`,
      priority: 1,
      enabled: true,
      computeEnvironments: [
        {
          computeEnvironment: this.computeEnvironment,
          order: 1,
        },
      ],
    });

    // Create IAM role for job execution
    const jobRole = new iam.Role(this, 'JobExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant permissions to access S3 bucket and ECR
    props.modelBucket.grantReadWrite(jobRole);
    props.ecrRepository.grantPull(jobRole);

    // Create container definition
    const container = new batch.EcsEc2ContainerDefinition(
      this,
      'ContainerDef',
      {
        image: ecs.ContainerImage.fromEcrRepository(
          props.ecrRepository,
          'latest'
        ),
        memory: cdk.Size.mebibytes(8192),
        cpu: 4,
        jobRole: jobRole,
      }
    );

    // Create job definition
    this.jobDefinition = new batch.EcsJobDefinition(this, 'JobDefinition', {
      jobDefinitionName: `inference-job-${props.environmentSuffix}`,
      container: container,
      retryAttempts: 3,
      timeout: cdk.Duration.hours(1),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ComputeEnvironmentArn', {
      value: this.computeEnvironment.computeEnvironmentArn,
      description: 'Batch compute environment ARN',
    });

    new cdk.CfnOutput(this, 'JobQueueArn', {
      value: this.jobQueue.jobQueueArn,
      description: 'Batch job queue ARN',
    });

    new cdk.CfnOutput(this, 'JobDefinitionArn', {
      value: this.jobDefinition.jobDefinitionArn,
      description: 'Batch job definition ARN',
    });
  }
}
