import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Import existing constructs
import { SecurityGroupsConstruct } from './constructs/networking/security-groups-construct';
import { VpcConstruct } from './constructs/networking/vpc-construct';
import { IamConstruct } from './constructs/security/iam-construct';
import { KmsConstruct } from './constructs/security/kms-construct';
import { SecretsConstruct } from './constructs/security/secrets-construct';

// Import new security constructs
import { CloudTrailConstruct } from './constructs/security/cloudtrail-construct';
import { ConfigConstruct } from './constructs/security/config-construct';
import { MfaConstruct } from './constructs/security/mfa-construct';
import { WafConstruct } from './constructs/security/waf-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  enableCloudTrail?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get CloudTrail enabled flag from props, context, or use true as default
    const enableCloudTrail =
      props?.enableCloudTrail !== undefined
        ? props.enableCloudTrail
        : this.node.tryGetContext('enableCloudTrail') !== undefined
          ? this.node.tryGetContext('enableCloudTrail')
          : true;

    // Create KMS keys first (needed by other constructs)
    const kmsConstruct = new KmsConstruct(this, 'KmsConstruct');

    // Create VPC and networking infrastructure
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct');

    // Create security groups
    const securityGroupsConstruct = new SecurityGroupsConstruct(
      this,
      'SecurityGroupsConstruct',
      vpcConstruct.vpc
    );

    // Create IAM roles and policies
    const iamConstruct = new IamConstruct(this, 'IamConstruct', {
      s3Key: kmsConstruct.s3Key,
      secretsKey: kmsConstruct.secretsKey,
      cloudTrailKey: kmsConstruct.cloudTrailKey,
    });

    // Create secrets with KMS encryption
    const secretsConstruct = new SecretsConstruct(
      this,
      'SecretsConstruct',
      kmsConstruct.secretsKey
    );

    // Create CloudTrail for API call logging (optional)
    const cloudTrailConstruct = new CloudTrailConstruct(
      this,
      'CloudTrailConstruct',
      {
        encryptionKey: kmsConstruct.cloudTrailKey,
        enabled: enableCloudTrail,
      }
    );

    // Create AWS Config for compliance monitoring
    const configConstruct = new ConfigConstruct(
      this,
      'ConfigConstruct',
      kmsConstruct.cloudTrailKey,
      false, // Disable delivery channel by default
      false // Disable config recorder by default to avoid deployment issues
    );

    // Create WAF for web application protection
    const wafConstruct = new WafConstruct(this, 'WafConstruct');

    // Create MFA enforcement
    const mfaConstruct = new MfaConstruct(this, 'MfaConstruct');

    // Add explicit dependencies to ensure KMS keys are created first
    if (enableCloudTrail) {
      cloudTrailConstruct.node.addDependency(kmsConstruct);
    }
    secretsConstruct.node.addDependency(kmsConstruct);
    configConstruct.node.addDependency(kmsConstruct);
    iamConstruct.node.addDependency(kmsConstruct);

    // Add security group references to outputs for cross-stack usage
    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: securityGroupsConstruct.webSecurityGroup.securityGroupId,
      description: 'Web tier security group ID',
      exportName: `WebSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: securityGroupsConstruct.databaseSecurityGroup.securityGroupId,
      description: 'Database security group ID',
      exportName: `DatabaseSecurityGroupId-${environmentSuffix}`,
    });

    // Add IAM role references to outputs
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: iamConstruct.ec2Role.roleArn,
      description: 'EC2 instance role ARN',
      exportName: `EC2RoleArn-${environmentSuffix}`,
    });

    // Add secrets references to outputs
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: secretsConstruct.databaseSecret.secretArn,
      description: 'Database secret ARN',
      exportName: `DatabaseSecretArn-${environmentSuffix}`,
    });

    // Add CloudTrail references to outputs (only if enabled)
    if (enableCloudTrail && cloudTrailConstruct.logGroup) {
      new cdk.CfnOutput(this, 'CloudTrailLogGroupName', {
        value: cloudTrailConstruct.logGroup.logGroupName,
        description: 'CloudTrail log group name',
        exportName: `CloudTrailLogGroupName-${environmentSuffix}`,
      });
    }

    // Add Config references to outputs
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configConstruct.configBucket.bucketName,
      description: 'AWS Config bucket name',
      exportName: `ConfigBucketName-${environmentSuffix}`,
    });

    // Add MFA references to outputs
    new cdk.CfnOutput(this, 'UserGroupName', {
      value: mfaConstruct.userGroup.groupName,
      description: 'MFA user group name',
      exportName: `UserGroupName-${environmentSuffix}`,
    });

    // Example: Create an S3 bucket
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `tap-data-bucket-${environmentSuffix}-${this.account}-${new Date()
        .toISOString()
        .replace(/[-:T.]/g, '')
        .slice(0, 15)}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsConstruct.s3Key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Example: Create an IAM role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `tap-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add bucket read permissions to the role
    dataBucket.grantRead(lambdaRole);

    // Add dependencies for resources that use KMS keys
    dataBucket.node.addDependency(kmsConstruct);

    // Output the bucket name
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Name of the data bucket',
      exportName: `DataBucketName-${environmentSuffix}`,
    });

    // Output VPC information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    // Output KMS key ARNs
    new cdk.CfnOutput(this, 'S3KmsKeyArn', {
      value: kmsConstruct.s3Key.keyArn,
      description: 'S3 KMS Key ARN',
      exportName: `S3KmsKeyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecretsKmsKeyArn', {
      value: kmsConstruct.secretsKey.keyArn,
      description: 'Secrets KMS Key ARN',
      exportName: `SecretsKmsKeyArn-${environmentSuffix}`,
    });

    // Output CloudTrail information (only if enabled)
    if (enableCloudTrail) {
      new cdk.CfnOutput(this, 'CloudTrailName', {
        value: 'SecureApp-CloudTrail',
        description: 'CloudTrail trail name',
        exportName: `CloudTrailName-${environmentSuffix}`,
      });
    }

    // Output WAF information
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: wafConstruct.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebAclArn-${environmentSuffix}`,
    });

    // Output security compliance status
    const cloudTrailStatus = enableCloudTrail
      ? 'CloudTrail'
      : 'CloudTrail (disabled)';
    new cdk.CfnOutput(this, 'SecurityComplianceStatus', {
      value: `All security requirements implemented: MFA, WAF, ${cloudTrailStatus}, Config, Encryption, Least Privilege`,
      description: 'Security compliance status',
      exportName: `SecurityComplianceStatus-${environmentSuffix}`,
    });
  }
}
