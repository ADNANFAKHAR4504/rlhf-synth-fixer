import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

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

    const companyNameParam = new cdk.CfnParameter(this, 'CompanyName', {
      type: 'String',
      default: 'companyname',
      description:
        'Company name for resource naming (companyname-env-component)',
      allowedPattern: '^[a-z0-9-]+$',
    });

    // Up to 5 parameterized CIDR ranges for HTTPS ingress (CIDR #1 required, others optional)
    const allowedIngressCidr1Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr1',
      {
        type: 'String',
        default: '10.0.0.0/8',
        description:
          'Required CIDR allowed for HTTPS (port 443) ingress (range 1)',
        allowedPattern:
          '^(?:\\d{1,3}\\.){3}\\d{1,3}/([0-9]|[1-2][0-9]|3[0-2])$',
      }
    );

    const cidrAllowedPatternOptional =
      '(^$)|((?:\\d{1,3}\\.){3}\\d{1,3}/([0-9]|[1-2][0-9]|3[0-2]))';
    const allowedIngressCidr2Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr2',
      {
        type: 'String',
        default: '',
        description: 'Optional additional CIDR range (2) for HTTPS ingress',
        allowedPattern: cidrAllowedPatternOptional,
      }
    );
    const allowedIngressCidr3Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr3',
      {
        type: 'String',
        default: '',
        description: 'Optional additional CIDR range (3) for HTTPS ingress',
        allowedPattern: cidrAllowedPatternOptional,
      }
    );
    const allowedIngressCidr4Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr4',
      {
        type: 'String',
        default: '',
        description: 'Optional additional CIDR range (4) for HTTPS ingress',
        allowedPattern: cidrAllowedPatternOptional,
      }
    );
    const allowedIngressCidr5Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr5',
      {
        type: 'String',
        default: '',
        description: 'Optional additional CIDR range (5) for HTTPS ingress',
        allowedPattern: cidrAllowedPatternOptional,
      }
    );

    const iamUsersToEnforceMfaCsvParam = new cdk.CfnParameter(
      this,
      'IamUsersToEnforceMfaCsv',
      {
        type: 'String',
        default: '',
        description:
          'Optional comma-separated list of IAM user names to add to the MFA-enforced group',
        allowedPattern: '(^$)|([A-Za-z0-9+,@_.-]+(,[A-Za-z0-9+,@_.-]+)*)',
      }
    );

    const companyName = companyNameParam.valueAsString;

    const nameFor = (component: string) =>
      `${companyName}-${environmentSuffix}-${component}`;

    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: nameFor('vpc'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    const httpsSg = new ec2.SecurityGroup(this, 'HttpsSecurityGroup', {
      vpc,
      description: 'Allow ingress only on 443 from allowed CIDR',
      allowAllOutbound: true,
      securityGroupName: nameFor('sg-https'),
    });
    // Ingress for required CIDR #1
    new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress1', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr1Param.valueAsString,
      description: 'HTTPS from allowed range 1',
    });
    // Conditional ingress for optional CIDR #2..#5
    const hasIngress2 = new cdk.CfnCondition(
      this,
      'HasAllowedHttpsIngressCidr2',
      {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(allowedIngressCidr2Param.valueAsString, '')
        ),
      }
    );
    const ingress2 = new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress2', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr2Param.valueAsString,
      description: 'HTTPS from allowed range 2',
    });
    ingress2.cfnOptions.condition = hasIngress2;
    const hasIngress3 = new cdk.CfnCondition(
      this,
      'HasAllowedHttpsIngressCidr3',
      {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(allowedIngressCidr3Param.valueAsString, '')
        ),
      }
    );
    const ingress3 = new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress3', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr3Param.valueAsString,
      description: 'HTTPS from allowed range 3',
    });
    ingress3.cfnOptions.condition = hasIngress3;
    const hasIngress4 = new cdk.CfnCondition(
      this,
      'HasAllowedHttpsIngressCidr4',
      {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(allowedIngressCidr4Param.valueAsString, '')
        ),
      }
    );
    const ingress4 = new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress4', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr4Param.valueAsString,
      description: 'HTTPS from allowed range 4',
    });
    ingress4.cfnOptions.condition = hasIngress4;
    const hasIngress5 = new cdk.CfnCondition(
      this,
      'HasAllowedHttpsIngressCidr5',
      {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(allowedIngressCidr5Param.valueAsString, '')
        ),
      }
    );
    const ingress5 = new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress5', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr5Param.valueAsString,
      description: 'HTTPS from allowed range 5',
    });
    ingress5.cfnOptions.condition = hasIngress5;

    // Enable EBS encryption by default using SDK call (broadly supported)
    new cr.AwsCustomResource(this, 'EnableEbsEncryptionByDefault', {
      onCreate: {
        service: 'EC2',
        action: 'enableEbsEncryptionByDefault',
        parameters: {},
        physicalResourceId: cr.PhysicalResourceId.of(
          'EnableEbsEncryptionByDefault'
        ),
      },
      onUpdate: {
        service: 'EC2',
        action: 'enableEbsEncryptionByDefault',
        parameters: {},
        physicalResourceId: cr.PhysicalResourceId.of(
          'EnableEbsEncryptionByDefault'
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const s3Bucket = new s3.CfnBucket(this, 'DataBucket', {
      bucketName: cdk.Fn.join('-', [
        nameFor('data-bucket'),
        cdk.Stack.of(this).account,
      ]),
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      versioningConfiguration: { status: 'Enabled' },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      },
    });
    s3Bucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Enforce TLS and encryption for S3 access (equivalent to L2 enforceSSL + deny unencrypted puts)
    new s3.CfnBucketPolicy(this, 'DataBucketPolicy', {
      bucket: s3Bucket.ref,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              cdk.Fn.join('', [
                'arn:',
                cdk.Aws.PARTITION,
                ':s3:::',
                s3Bucket.ref,
              ]),
              cdk.Fn.join('', [
                'arn:',
                cdk.Aws.PARTITION,
                ':s3:::',
                s3Bucket.ref,
                '/*',
              ]),
            ],
            Condition: {
              Bool: { 'aws:SecureTransport': 'false' },
            },
          },
          {
            Sid: 'DenyUnEncryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: cdk.Fn.join('', [
              'arn:',
              cdk.Aws.PARTITION,
              ':s3:::',
              s3Bucket.ref,
              '/*',
            ]),
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
        ],
      },
    });

    const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: nameFor('vpc-flow-logs'),
      retention: logs.RetentionDays.ONE_YEAR,
    });
    flowLogsLogGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      roleName: nameFor('vpc-flow-logs-role'),
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });
    flowLogsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [
          flowLogsLogGroup.logGroupArn,
          `${flowLogsLogGroup.logGroupArn}:*`,
        ],
      })
    );

    new ec2.FlowLog(this, 'VpcFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
    });

    const rdsSubnetGroup = new rds.SubnetGroup(this, 'RdsSubnetGroup', {
      description: 'Subnet group for RDS in private subnets',
      subnetGroupName: nameFor('rds-subnets'),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    rdsSubnetGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'RDS security group with no public ingress',
      allowAllOutbound: true,
      securityGroupName: nameFor('sg-rds'),
    });

    // RDS engine and parameter group (enforce SSL per CIS)
    const dbEngine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.of('14', '14.11'),
    });
    const rdsParameterGroupCfn = new rds.CfnDBParameterGroup(
      this,
      'RdsParameterGroup',
      {
        description: 'Parameter group enforcing SSL for PostgreSQL',
        family: 'postgres14',
        parameters: { 'rds.force_ssl': '1' },
      }
    );
    const rdsParameterGroup = rds.ParameterGroup.fromParameterGroupName(
      this,
      'RdsParameterGroupImported',
      rdsParameterGroupCfn.ref
    );

    const rdsInstance = new rds.DatabaseInstance(this, 'RdsInstance', {
      instanceIdentifier: nameFor('rds'),
      engine: dbEngine,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroup: rdsSubnetGroup,
      parameterGroup: rdsParameterGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      multiAz: false,
      allocatedStorage: 20,
      storageEncrypted: true,
      securityGroups: [rdsSg],
      publiclyAccessible: false,
      deletionProtection: false,
      cloudwatchLogsExports: ['postgresql'],
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
    });

    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: nameFor('waf'),
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: nameFor('waf-metrics'),
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: nameFor('waf-common'),
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesAmazonIpReputationList',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesAmazonIpReputationList',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: nameFor('waf-ip-rep'),
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: nameFor('waf-bad-inputs'),
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    const wafAssociationArnParam = new cdk.CfnParameter(
      this,
      'WafAssociationResourceArn',
      {
        type: 'String',
        default: '',
        description:
          'Optional resource ARN (e.g., ALB, API Gateway) to associate with the WebACL. Leave empty to skip.',
      }
    );
    const hasWafAssociationArn = new cdk.CfnCondition(
      this,
      'HasWafAssociationArn',
      {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(wafAssociationArnParam.valueAsString, '')
        ),
      }
    );
    const webAclAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WebAclAssociation',
      {
        resourceArn: wafAssociationArnParam.valueAsString,
        webAclArn: webAcl.attrArn,
      }
    );
    webAclAssociation.cfnOptions.condition = hasWafAssociationArn;

    // CloudTrail (CIS): Multi-Region trail with S3 and CloudWatch Logs integration
    const ctBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });
    ctBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [ctBucket.bucketArn],
      })
    );
    ctBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${ctBucket.bucketArn}/AWSLogs/${cdk.Aws.ACCOUNT_ID}/*`],
        conditions: {
          StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
        },
      })
    );

    const ctLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
    });

    const ctLogsRole = new iam.Role(this, 'CloudTrailLogsRole', {
      roleName: nameFor('cloudtrail-logs-role'),
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
    });
    ctLogsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [ctLogGroup.logGroupArn, `${ctLogGroup.logGroupArn}:*`],
      })
    );

    new cloudtrail.CfnTrail(this, 'CloudTrail', {
      trailName: nameFor('cloudtrail'),
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      isLogging: true,
      s3BucketName: ctBucket.bucketName,
      cloudWatchLogsLogGroupArn: ctLogGroup.logGroupArn,
      cloudWatchLogsRoleArn: ctLogsRole.roleArn,
      eventSelectors: [
        {
          includeManagementEvents: true,
          readWriteType: 'All',
        },
      ],
    });

    // Stack Outputs for CI/CD and live integration tests
    new cdk.CfnOutput(this, 'DataBucketName', { value: s3Bucket.ref });
    new cdk.CfnOutput(this, 'WebAclArn', { value: webAcl.attrArn });
    new cdk.CfnOutput(this, 'WafAssociationArnOutput', {
      value: wafAssociationArnParam.valueAsString,
    });
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'VpcFlowLogsLogGroupName', {
      value: flowLogsLogGroup.logGroupName,
    });
    new cdk.CfnOutput(this, 'RdsEndpointAddress', {
      value: rdsInstance.instanceEndpoint.hostname,
    });
    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: ctBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'CloudTrailLogGroupName', {
      value: ctLogGroup.logGroupName,
    });

    // Update IAM account password policy using SDK call (avoids unrecognized CFN type)
    new cr.AwsCustomResource(this, 'AccountPasswordPolicy', {
      onCreate: {
        service: 'IAM',
        action: 'updateAccountPasswordPolicy',
        parameters: {
          MinimumPasswordLength: 14,
          RequireLowercaseCharacters: true,
          RequireUppercaseCharacters: true,
          RequireNumbers: true,
          RequireSymbols: true,
          PasswordReusePrevention: 12,
          MaxPasswordAge: 90,
          AllowUsersToChangePassword: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of('AccountPasswordPolicy'),
      },
      onUpdate: {
        service: 'IAM',
        action: 'updateAccountPasswordPolicy',
        parameters: {
          MinimumPasswordLength: 14,
          RequireLowercaseCharacters: true,
          RequireUppercaseCharacters: true,
          RequireNumbers: true,
          RequireSymbols: true,
          PasswordReusePrevention: 12,
          MaxPasswordAge: 90,
          AllowUsersToChangePassword: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of('AccountPasswordPolicy'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const mfaDenyPolicy = new iam.ManagedPolicy(this, 'MfaEnforcementPolicy', {
      managedPolicyName: nameFor('mfa-enforce'),
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:GetUser',
            'iam:ListUsers',
            'iam:ChangePassword',
            'iam:GetAccountPasswordPolicy',
            'iam:ListAccountAliases',
            'sts:GetCallerIdentity',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    const mfaGroup = new iam.Group(this, 'MfaEnforcedGroup', {
      groupName: nameFor('mfa-enforced'),
    });
    mfaGroup.addManagedPolicy(mfaDenyPolicy);

    // Conditionally add users (from CSV) to MFA-enforced group if provided
    const hasMfaUsers = new cdk.CfnCondition(this, 'HasMfaUsersCsv', {
      expression: cdk.Fn.conditionNot(
        cdk.Fn.conditionEquals(iamUsersToEnforceMfaCsvParam.valueAsString, '')
      ),
    });
    const addUsersToMfaGroup = new iam.CfnUserToGroupAddition(
      this,
      'AddUsersToMfaGroup',
      {
        groupName: mfaGroup.groupName,
        users: cdk.Fn.split(',', iamUsersToEnforceMfaCsvParam.valueAsString),
      }
    );
    addUsersToMfaGroup.cfnOptions.condition = hasMfaUsers;
  }
}
