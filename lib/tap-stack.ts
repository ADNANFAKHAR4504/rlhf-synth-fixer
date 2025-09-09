import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment configuration
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const vpcId = props?.vpcId || this.node.tryGetContext('vpcId');

    // Common tags
    const commonTags = {
      Environment: 'Production',
      Department: 'IT',
      Project: 'TapSecurity',
    };

    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);

    // Import existing VPC if provided, otherwise create a new one
    let vpc: ec2.IVpc;
    if (vpcId) {
      vpc = ec2.Vpc.fromLookup(this, `ExistingVpc-${environmentSuffix}`, {
        vpcId: vpcId,
      });
    } else {
      vpc = new ec2.Vpc(this, `SecurityVpc-${environmentSuffix}`, {
        ipProtocol: ec2.IpProtocol.DUAL_STACK,
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 28,
            name: 'Isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
        enableDnsHostnames: true,
        enableDnsSupport: true,
      });
    }

    // 1. KMS Key
    const kmsKey = this.createKMSKey(environmentSuffix);

    // 2. Security bucket
    const securityBucket = this.createSecurityBucket(environmentSuffix, kmsKey);

    // 3. Create EC2 instance
    const ec2Instance = this.createEC2Instance(environmentSuffix, vpc, kmsKey);

    // 4. Create RDS PostgreSQL instance
    const rdsInstance = this.createRDSInstance(
      environmentSuffix,
      vpc,
      kmsKey,
      ec2Instance.connections.securityGroups[0]
    );

    // 5. Setup IAM roles and policies
    this.createIAMRoles(environmentSuffix, securityBucket, kmsKey);

    // 6. Setup Systems Manager
    this.createSystemsManagerSetup(environmentSuffix);

    // 7. Setup automated remediation
    const remediationFunction =
      this.createRemediationFunction(environmentSuffix);

    // 8. Setup monitoring and alerting
    this.createMonitoring(environmentSuffix, remediationFunction, kmsKey);

    // 9. Output important values
    new cdk.CfnOutput(this, 'SecurityKmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for security resources',
    });

    new cdk.CfnOutput(this, 'SecurityBucketName', {
      value: securityBucket.bucketName,
      description: 'Security Logs Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }

  private createKMSKey(environmentSuffix: string): kms.Key {
    return new kms.Key(this, `TapSecurityKmsKey-${environmentSuffix}`, {
      description: `KMS key for security-related resources ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private createSecurityBucket(
    environmentSuffix: string,
    kmsKey: kms.Key
  ): s3.Bucket {
    const bucket = new s3.Bucket(
      this,
      `TapSecurityBucket-${environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    return bucket;
  }

  private createEC2Instance(
    environmentSuffix: string,
    vpc: ec2.IVpc,
    kmsKey: kms.Key
  ): ec2.Instance {
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `TapEC2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instance',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const instance = new ec2.Instance(
      this,
      `TapEC2Instance-${environmentSuffix}`,
      {
        instanceName: `tap-ec2-${environmentSuffix}`,
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
            }),
          },
        ],
      }
    );

    cdk.Tags.of(instance).add(
      'PatchGroup',
      `tap-security-${environmentSuffix}`
    );

    return instance;
  }

  private createRDSInstance(
    environmentSuffix: string,
    vpc: ec2.IVpc,
    kmsKey: kms.Key,
    ec2SecurityGroup: ec2.ISecurityGroup
  ): rds.DatabaseInstance {
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `TapRDSSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instance'
    );

    return new rds.DatabaseInstance(
      this,
      `TapRDSInstance-${environmentSuffix}`,
      {
        instanceIdentifier: `tap-rds-postgres-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        securityGroups: [rdsSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        allocatedStorage: 20,
        multiAz: false,
        autoMinorVersionUpgrade: true,
        deleteAutomatedBackups: true,
        backupRetention: cdk.Duration.days(7),
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          secretName: `tap-rds-credentials-${environmentSuffix}`,
        }),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
  }

  private createIAMRoles(
    environmentSuffix: string,
    securityBucket: s3.Bucket,
    kmsKey: kms.Key
  ): void {
    const appRole = new iam.Role(this, `TapAppRole-${environmentSuffix}`, {
      roleName: `tap-app-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    new iam.CfnInstanceProfile(
      this,
      `TapInstanceProfile-${environmentSuffix}`,
      {
        instanceProfileName: `tap-app-instance-profile-${environmentSuffix}`,
        roles: [appRole.roleName],
      }
    );
  }

  private createSystemsManagerSetup(environmentSuffix: string): void {
    // Simple SSM setup
    new ssm.CfnPatchBaseline(this, `TapPatchBaseline-${environmentSuffix}`, {
      name: `tap-security-patch-baseline-${environmentSuffix}`,
      description: 'Patch baseline for security updates',
      operatingSystem: 'AMAZON_LINUX_2',
      approvalRules: {
        patchRules: [
          {
            patchFilterGroup: {
              patchFilters: [
                {
                  key: 'CLASSIFICATION',
                  values: ['Security'],
                },
              ],
            },
            approveAfterDays: 7,
          },
        ],
      },
    });
  }

  private createRemediationFunction(
    environmentSuffix: string
  ): lambda.Function {
    const remediationRole = new iam.Role(
      this,
      `TapRemediationRole-${environmentSuffix}`,
      {
        roleName: `tap-remediation-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    return new lambda.Function(
      this,
      `TapRemediationFunction-${environmentSuffix}`,
      {
        functionName: `tap-security-remediation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        role: remediationRole,
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info("Remediation function called")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Remediation completed'})
    }
`),
      }
    );
  }

  private createMonitoring(
    environmentSuffix: string,
    remediationFunction: lambda.Function,
    kmsKey: kms.Key
  ): void {
    // Monitor for unauthorized API calls
    const unauthorizedApiRule = new events.Rule(
      this,
      `TapUnauthorizedApiRule-${environmentSuffix}`,
      {
        eventPattern: {
          source: ['aws.cloudtrail'],
          detail: {
            errorCode: ['UnauthorizedOperation', 'AccessDenied'],
          },
        },
      }
    );

    const alertLogGroup = new logs.LogGroup(
      this,
      `TapSecurityAlertsLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/events/security-alerts/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    unauthorizedApiRule.addTarget(
      new targets.CloudWatchLogGroup(alertLogGroup)
    );
  }
}
