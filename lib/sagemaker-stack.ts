import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import { Construct } from 'constructs';

interface SageMakerStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  datasetBucket: s3.Bucket;
  modelBucket: s3.Bucket;
  ecrRepository: ecr.Repository;
  logGroup: logs.LogGroup;
}

export class SageMakerStack extends cdk.NestedStack {
  public readonly notebookRole: iam.Role;
  public readonly trainingRole: iam.Role;

  constructor(scope: Construct, id: string, props: SageMakerStackProps) {
    super(scope, id);

    const securityGroup = new ec2.SecurityGroup(
      this,
      'SageMakerSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for SageMaker resources',
        allowAllOutbound: true,
      }
    );

    // IAM Role for Notebook Instance
    this.notebookRole = new iam.Role(this, 'NotebookExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    props.datasetBucket.grantReadWrite(this.notebookRole);
    props.modelBucket.grantReadWrite(this.notebookRole);
    props.ecrRepository.grantPullPush(this.notebookRole);

    // IAM Role for Training Jobs
    this.trainingRole = new iam.Role(this, 'TrainingJobRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      inlinePolicies: {
        TrainingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'sagemaker:*',
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'cloudwatch:PutMetricData',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    props.datasetBucket.grantRead(this.trainingRole);
    props.modelBucket.grantWrite(this.trainingRole);
    props.ecrRepository.grantPull(this.trainingRole);

    // SageMaker Notebook Instance
    const notebookInstance = new sagemaker.CfnNotebookInstance(
      this,
      'NotebookInstance',
      {
        instanceType: 'ml.t3.medium',
        roleArn: this.notebookRole.roleArn,
        notebookInstanceName: `training-notebook-${props.environmentSuffix}`,
        // Use public subnet for internet access (required for SageMaker notebook initialization)
        subnetId: props.vpc.publicSubnets[0].subnetId,
        securityGroupIds: [securityGroup.securityGroupId],
        defaultCodeRepository:
          'https://github.com/aws/amazon-sagemaker-examples.git',
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'NotebookInstanceName', {
      value: notebookInstance.attrNotebookInstanceName,
      description: 'SageMaker notebook instance name',
    });

    new cdk.CfnOutput(this, 'TrainingRoleArn', {
      value: this.trainingRole.roleArn,
      description: 'ARN of the IAM role for SageMaker training jobs',
    });

    new cdk.CfnOutput(this, 'TrainingJobConfig', {
      value: JSON.stringify({
        RoleArn: this.trainingRole.roleArn,
        EnableManagedSpotTraining: true,
        MaxRuntimeInSeconds: 86400,
        MaxWaitTimeInSeconds: 172800,
        VpcConfig: {
          SecurityGroupIds: [securityGroup.securityGroupId],
          Subnets: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        },
      }),
      description:
        'Configuration for SageMaker training jobs with spot instances',
    });
  }
}
