import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface DeployStageProps {
  config: any;
  ecrRepository: ecr.Repository;
  removalPolicy: cdk.RemovalPolicy;
}

export class DeployStage extends Construct {
  public readonly application: elasticbeanstalk.CfnApplication;
  public readonly environment: elasticbeanstalk.CfnEnvironment;
  public readonly approvalTopic: sns.Topic;
  public readonly instanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: DeployStageProps) {
    super(scope, id);

    const { config, ecrRepository, removalPolicy } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create SNS topic for manual approval notifications
    this.approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
      topicName: resourceName('approval-topic'),
      displayName: 'Pipeline Approval Notifications',
    });

    // Create Elastic Beanstalk service role
    const ebServiceRole = new iam.Role(this, 'EBServiceRole', {
      roleName: resourceName('eb-service-role'),
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSElasticBeanstalkEnhancedHealth'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy'
        ),
      ],
    });

    // Create EC2 instance profile for Elastic Beanstalk
    this.instanceRole = new iam.Role(this, 'EBInstanceRole', {
      roleName: resourceName('eb-instance-role'),
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkWebTier'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkMulticontainerDocker'
        ),
      ],
      inlinePolicies: {
        CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ecr:GetAuthorizationToken'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              resources: [ecrRepository.repositoryArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:CreateGrant',
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKeyWithoutPlainText',
                'kms:ReEncrypt*',
              ],
              resources: [`arn:aws:kms:*:${cdk.Stack.of(this).account}:key/*`],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'InstanceProfile',
      {
        instanceProfileName: resourceName('eb-instance-profile'),
        roles: [this.instanceRole.roleName],
      }
    );

    // Grant ECR pull permissions to the instance role
    ecrRepository.grantPull(this.instanceRole);

    // Create Elastic Beanstalk application
    this.application = new elasticbeanstalk.CfnApplication(
      this,
      'Application',
      {
        applicationName: resourceName('app'),
        description: `${config.company} ${config.division} TypeScript Application`,
      }
    );

    if (removalPolicy === cdk.RemovalPolicy.DESTROY) {
      this.application.applyRemovalPolicy(removalPolicy);
    }

    // Create Elastic Beanstalk environment
    this.environment = new elasticbeanstalk.CfnEnvironment(
      this,
      'Environment',
      {
        applicationName: this.application.applicationName!,
        environmentName: resourceName('env'),
        solutionStackName: '64bit Amazon Linux 2023 v4.7.3 running Docker',
        optionSettings: [
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'ServiceRole',
            value: ebServiceRole.roleArn,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: instanceProfile.ref,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'InstanceType',
            value: config.environmentSuffix.includes('prod')
              ? 't3.medium'
              : 't3.small',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MinSize',
            value: config.environmentSuffix.includes('prod') ? '2' : '1',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MaxSize',
            value: config.environmentSuffix.includes('prod') ? '10' : '3',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'NODE_ENV',
            value: config.environmentSuffix,
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'PORT',
            value: '3000',
          },
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            optionName: 'SystemType',
            value: 'enhanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:managedactions',
            optionName: 'ManagedActionsEnabled',
            value: 'true',
          },
          {
            namespace: 'aws:elasticbeanstalk:managedactions',
            optionName: 'PreferredStartTime',
            value: 'Sun:10:00',
          },
          {
            namespace: 'aws:elasticbeanstalk:managedactions:platformupdate',
            optionName: 'UpdateLevel',
            value: 'minor',
          },
        ],
        tags: [
          {
            key: 'Company',
            value: config.company,
          },
          {
            key: 'Division',
            value: config.division,
          },
          {
            key: 'Environment',
            value: config.environmentSuffix,
          },
        ],
      }
    );

    this.environment.addDependency(this.application);

    // Add construct outputs
    new cdk.CfnOutput(this, 'ApplicationName', {
      value: this.application.applicationName!,
      description: 'Name of the Elastic Beanstalk application',
      exportName: `${resourceName('eb-application-name')}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: this.environment.environmentName!,
      description: 'Name of the Elastic Beanstalk environment',
      exportName: `${resourceName('eb-environment-name')}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentUrl', {
      value: this.environment.attrEndpointUrl,
      description: 'URL of the Elastic Beanstalk environment',
      exportName: `${resourceName('eb-environment-url')}`,
    });

    new cdk.CfnOutput(this, 'ApprovalTopicArn', {
      value: this.approvalTopic.topicArn,
      description: 'ARN of the SNS approval topic',
      exportName: `${resourceName('approval-topic-arn')}`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'URI of the ECR repository for Docker images',
      exportName: `${resourceName('deploy-ecr-repository-uri')}`,
    });
  }
}
