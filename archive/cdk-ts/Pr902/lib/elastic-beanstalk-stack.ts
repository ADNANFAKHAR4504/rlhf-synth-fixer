import * as cdk from 'aws-cdk-lib';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ElasticBeanstalkStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  instanceType?: string;
  keyPairName?: string;
  domainName?: string;
  certificateArn?: string;
}

export class ElasticBeanstalkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: ElasticBeanstalkStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const instanceType = props?.instanceType || 't3.micro';

    // Create Secrets Manager secret for application configuration
    const appSecret = new secretsmanager.Secret(this, 'ApplicationSecret', {
      secretName: `eb-app-secrets-${environmentSuffix}`,
      description: 'Application secrets for Elastic Beanstalk environment',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for EC2 instances
    const instanceRole = new iam.Role(this, 'ElasticBeanstalkInstanceRole', {
      roleName: `eb-instance-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkWebTier'
        ),
      ],
      inlinePolicies: {
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [appSecret.secretArn],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'ElasticBeanstalkInstanceProfile',
      {
        roles: [instanceRole.roleName],
        instanceProfileName: `eb-instance-profile-${environmentSuffix}`,
      }
    );

    // IAM role for Elastic Beanstalk service
    const serviceRole = new iam.Role(this, 'ElasticBeanstalkServiceRole', {
      roleName: `eb-service-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSElasticBeanstalkEnhancedHealth'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSElasticBeanstalkService'
        ),
      ],
    });

    // Create Elastic Beanstalk application
    const application = new elasticbeanstalk.CfnApplication(
      this,
      'ElasticBeanstalkApplication',
      {
        applicationName: `web-app-${environmentSuffix}`,
        description: `Web application deployed via Elastic Beanstalk - ${environmentSuffix} environment`,
      }
    );

    // Create a simple Node.js application
    const appZip = new s3assets.Asset(this, 'ApplicationZip', {
      path: path.join(__dirname, '..', 'sample-app'),
    });

    // Create application version
    const applicationVersion = new elasticbeanstalk.CfnApplicationVersion(
      this,
      'ApplicationVersion',
      {
        applicationName: application.applicationName!,
        description: 'Initial application version',
        sourceBundle: {
          s3Bucket: appZip.s3BucketName,
          s3Key: appZip.s3ObjectKey,
        },
      }
    );

    applicationVersion.addDependency(application);

    // Create Elastic Beanstalk environment with simplified configuration
    const environment = new elasticbeanstalk.CfnEnvironment(
      this,
      'ElasticBeanstalkEnvironment',
      {
        applicationName: application.applicationName!,
        environmentName: `web-app-env-${environmentSuffix}`,
        description: `High availability web application environment - ${environmentSuffix}`,
        solutionStackName: '64bit Amazon Linux 2023 v6.6.3 running Node.js 20',
        versionLabel: applicationVersion.ref,
        optionSettings: [
          // Auto Scaling Configuration
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MinSize',
            value: '2',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MaxSize',
            value: '10',
          },
          // Launch Configuration
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'InstanceType',
            value: instanceType,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: instanceProfile.instanceProfileName!,
          },
          // Load Balancer Configuration
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'LoadBalancerType',
            value: 'application',
          },
          // Health Check Configuration
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            optionName: 'SystemType',
            value: 'enhanced',
          },
          // Auto Scaling Trigger Configuration
          {
            namespace: 'aws:autoscaling:trigger',
            optionName: 'MeasureName',
            value: 'CPUUtilization',
          },
          {
            namespace: 'aws:autoscaling:trigger',
            optionName: 'Statistic',
            value: 'Average',
          },
          {
            namespace: 'aws:autoscaling:trigger',
            optionName: 'Unit',
            value: 'Percent',
          },
          {
            namespace: 'aws:autoscaling:trigger',
            optionName: 'LowerThreshold',
            value: '20',
          },
          {
            namespace: 'aws:autoscaling:trigger',
            optionName: 'UpperThreshold',
            value: '70',
          },
          // Environment Variables with Secrets Manager integration
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'NODE_ENV',
            value: 'production',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'APP_SECRET_ARN',
            value: appSecret.secretArn,
          },
          // Service Role
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'ServiceRole',
            value: serviceRole.roleArn,
          },
        ],
      }
    );

    environment.addDependency(applicationVersion);

    // Outputs
    new cdk.CfnOutput(this, 'ApplicationName', {
      value: application.applicationName!,
      description: 'Elastic Beanstalk Application Name',
    });

    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: environment.environmentName!,
      description: 'Elastic Beanstalk Environment Name',
    });

    new cdk.CfnOutput(this, 'EnvironmentURL', {
      value: `http://${environment.attrEndpointUrl}`,
      description: 'Application URL',
    });

    if (props?.certificateArn) {
      new cdk.CfnOutput(this, 'HTTPSUrl', {
        value: `https://${environment.attrEndpointUrl}`,
        description: 'Secure Application URL',
      });
    }

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: appSecret.secretArn,
      description: 'Secrets Manager ARN for application secrets',
    });
  }
}
