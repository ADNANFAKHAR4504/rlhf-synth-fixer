import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretRotation } from '@cdktf/provider-aws/lib/secretsmanager-secret-rotation';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';

export interface RdsConstructProps {
  environmentSuffix: string;
  vpc: Vpc;
  privateSubnets: Subnet[];
  kmsKeyId: string;
  secretsManagerKmsKeyId: string;
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly dbSecret: SecretsmanagerSecret;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpc,
      privateSubnets,
      kmsKeyId,
      secretsManagerKmsKeyId,
    } = props;

    // Create DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `payment-db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `payment-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Security Group for RDS
    this.dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `payment-db-sg-${environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL database',
      vpcId: vpc.id,
      tags: {
        Name: `payment-db-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow PostgreSQL access from within VPC
    new SecurityGroupRule(this, 'db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: this.dbSecurityGroup.id,
      description: 'Allow PostgreSQL access from VPC',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.dbSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Generate initial database credentials
    const dbUsername = 'paymentadmin';
    const dbPassword = `Payment${environmentSuffix}Pass123!`;
    const dbName = 'paymentdb';

    // Create Secrets Manager secret for database credentials
    this.dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `payment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for payment processing RDS instance',
      kmsKeyId: secretsManagerKmsKeyId,
      tags: {
        Name: `payment-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      lifecycle: {
        ignoreChanges: ['kms_key_id'],
      },
    });

    // Store initial credentials in secret
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({
        username: dbUsername,
        password: dbPassword,
        engine: 'postgres',
        host: 'placeholder',
        port: 5432,
        dbname: dbName,
      }),
    });

    // Create RDS instance with Multi-AZ
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `payment-db-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '15',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: kmsKeyId,
      dbName: dbName,
      username: dbUsername,
      password: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      multiAz: true,
      publiclyAccessible: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'Mon:04:00-Mon:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      tags: {
        Name: `payment-db-${environmentSuffix}`,
        Environment: environmentSuffix,
        Compliance: 'PCI-DSS',
      },
      dependsOn: [dbSubnetGroup, this.dbSecurityGroup],
    });

    // Create IAM role for Lambda rotation function
    const rotationLambdaRole = new IamRole(this, 'rotation-lambda-role', {
      name: `payment-rotation-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `payment-rotation-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'rotation-lambda-basic-policy', {
      role: rotationLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Attach VPC execution policy
    new IamRolePolicyAttachment(this, 'rotation-lambda-vpc-policy', {
      role: rotationLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Create Lambda function for secret rotation (simplified placeholder)
    const lambdaZipPath = path.join(__dirname, 'rotation-lambda.zip');
    const rotationLambda = new LambdaFunction(this, 'rotation-lambda', {
      functionName: `payment-db-rotation-${environmentSuffix}`,
      handler: 'index.handler',
      runtime: 'python3.11',
      role: rotationLambdaRole.arn,
      timeout: 30,
      filename: lambdaZipPath,
      sourceCodeHash: Fn.filebase64sha256(lambdaZipPath),
      environment: {
        variables: {
          SECRETS_MANAGER_ENDPOINT: `https://secretsmanager.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com`,
        },
      },
      tags: {
        Name: `payment-db-rotation-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Grant Secrets Manager permission to invoke Lambda
    new LambdaPermission(this, 'rotation-lambda-permission', {
      statementId: 'AllowExecutionFromSecretsManager',
      action: 'lambda:InvokeFunction',
      functionName: rotationLambda.functionName,
      principal: 'secretsmanager.amazonaws.com',
    });

    // Configure automatic secret rotation (30 days)
    new SecretsmanagerSecretRotation(this, 'db-secret-rotation', {
      secretId: this.dbSecret.id,
      rotationLambdaArn: rotationLambda.arn,
      rotationRules: {
        automaticallyAfterDays: 30,
      },
      dependsOn: [rotationLambda],
    });
  }
}
