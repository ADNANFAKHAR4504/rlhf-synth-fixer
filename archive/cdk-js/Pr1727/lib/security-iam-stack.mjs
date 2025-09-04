import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityIamStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const encryptionKeyArn = props.encryptionKeyArn;
    // Get region from AWS_REGION environment variable set by CICD or use us-west-2 as default
    const region = process.env.AWS_REGION || 'us-west-2';
    const stackSuffix = `${environmentSuffix}-${region}`;

    // Security Audit Role with least privilege
    this.securityAuditRole = new iam.Role(this, `SecurityAuditRole${environmentSuffix}`, {
      roleName: `SecurityAuditRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('config.amazonaws.com'),
        new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      ),
      description: 'Role for security auditing and compliance monitoring',
      maxSessionDuration: cdk.Duration.hours(4),
      inlinePolicies: {
        SecurityAuditPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'ConfigServicePermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'config:Put*',
                'config:Get*',
                'config:List*',
                'config:Describe*',
                'config:BatchGet*',
                'config:Select*',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'CloudTrailPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudtrail:CreateTrail',
                'cloudtrail:PutEventSelectors',
                'cloudtrail:PutInsightSelectors',
                'cloudtrail:StartLogging',
                'cloudtrail:StopLogging',
                'cloudtrail:DescribeTrails',
                'cloudtrail:GetTrailStatus',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'KMSPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [encryptionKeyArn],
            }),
          ],
        }),
      },
    });

    // Security Monitoring Role
    this.securityMonitoringRole = new iam.Role(this, `SecurityMonitoringRole${environmentSuffix}`, {
      roleName: `SecurityMonitoringRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('events.amazonaws.com'),
      ),
      description: 'Role for security monitoring and alerting',
      maxSessionDuration: cdk.Duration.hours(2),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        SecurityMonitoringPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'CloudWatchPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': 'us-west-2',
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'SNSPublishPermissions',
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [`arn:aws:sns:us-west-2:${this.account}:security-alerts-*`],
            }),
          ],
        }),
      },
    });

    // Data Access Role with strict conditions
    this.dataAccessRole = new iam.Role(this, `DataAccessRole${environmentSuffix}`, {
      roleName: `DataAccessRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for accessing encrypted data with strict security conditions',
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        DataAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'S3DataAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
              ],
              resources: [`arn:aws:s3:::security-data-${environmentSuffix}/*`],
              conditions: {
                StringEquals: {
                  's3:ExistingObjectTag/Owner': 'SecurityTeam',
                  's3:ExistingObjectTag/Environment': environmentSuffix,
                },
                Bool: {
                  'aws:SecureTransport': 'true',
                },
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8', '172.16.0.0/12'],
                },
              },
            }),
            new iam.PolicyStatement({
              sid: 'KMSDecryptPermissions',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              resources: [encryptionKeyArn],
              conditions: {
                StringEquals: {
                  'kms:ViaService': `s3.us-west-2.amazonaws.com`,
                },
              },
            }),
          ],
        }),
      },
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'IAMSecurityRoles');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `SecurityAuditRoleArn${stackSuffix}`, {
      value: this.securityAuditRole.roleArn,
      description: 'Security Audit Role ARN',
      exportName: `SecurityStack-AuditRoleArn-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `SecurityMonitoringRoleArn${stackSuffix}`, {
      value: this.securityMonitoringRole.roleArn,
      description: 'Security Monitoring Role ARN',
      exportName: `SecurityStack-MonitoringRoleArn-${stackSuffix}`,
    });
  }
}