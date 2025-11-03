/**
 * security-stack.ts
 *
 * Security infrastructure: KMS, Secrets Manager, Cognito, WAF, ACM
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  enablePciCompliance: boolean;
  regions: {
    primary: string;
    replicas: string[];
  };
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly secretsManagerArns: pulumi.Output<{
    database: string;
    api: string;
  }>;
  public readonly dbSecretArn: pulumi.Output<string>;
  public readonly cognitoUserPoolId: pulumi.Output<string>;
  public readonly cognitoUserPoolArn: pulumi.Output<string>;
  public readonly cognitoIdentityPoolId: pulumi.Output<string>;
  public readonly wafWebAclArn: pulumi.Output<string>;
  public readonly certificateArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get AWS Account ID
    const accountId = aws.getCallerIdentityOutput().accountId;

    //  KMS Multi-Region Key
    const kmsKey = new aws.kms.Key(
      `banking-kms-${environmentSuffix}`,
      {
        description: 'Multi-region KMS key for banking platform encryption',
        multiRegion: true,
        enableKeyRotation: true,
        deletionWindowInDays: 30,
        policy: accountId.apply(id =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${id}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'logs.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow AWS Services',
                Effect: 'Allow',
                Principal: {
                  Service: [
                    's3.amazonaws.com',
                    'dynamodb.amazonaws.com',
                    'rds.amazonaws.com',
                    'secretsmanager.amazonaws.com',
                    'sns.amazonaws.com',
                    'sqs.amazonaws.com',
                    'kinesis.amazonaws.com',
                    'cloudtrail.amazonaws.com',
                  ],
                },
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `banking-kms-alias-${environmentSuffix}`,
      {
        name: `alias/banking-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    //  Secrets Manager - Database Credentials
    const dbSecret = new aws.secretsmanager.Secret(
      `banking-db-secret-${environmentSuffix}`,
      {
        description: 'Aurora database master credentials',
        kmsKeyId: kmsKey.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-db-secret-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `banking-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'banking_admin',
          password: pulumi.secret('ChangeMeInProduction123!'),
          engine: 'postgres',
          port: 5432,
        }),
      },
      { parent: this }
    );

    //  Secrets Manager - API Keys
    const apiSecret = new aws.secretsmanager.Secret(
      `banking-api-secret-${environmentSuffix}`,
      {
        description: 'API keys and secrets',
        kmsKeyId: kmsKey.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-api-secret-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `banking-api-secret-version-${environmentSuffix}`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          jwt_secret: pulumi.secret('your-jwt-secret-key'),
          encryption_key: pulumi.secret('your-encryption-key'),
          fraud_detector_api_key: pulumi.secret('fraud-api-key'),
        }),
      },
      { parent: this }
    );

    //  Cognito User Pool
    const userPool = new aws.cognito.UserPool(
      `banking-user-pool-${environmentSuffix}`,
      {
        name: `banking-users-${environmentSuffix}`,
        aliasAttributes: ['email', 'preferred_username'],
        autoVerifiedAttributes: ['email'],
        mfaConfiguration: 'OPTIONAL',

        //  Added software token MFA configuration
        softwareTokenMfaConfiguration: {
          enabled: true,
        },

        passwordPolicy: {
          minimumLength: 12,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: true,
          temporaryPasswordValidityDays: 7,
        },

        schemas: [
          {
            attributeDataType: 'String',
            name: 'email',
            required: true,
            mutable: true,
          },
          {
            attributeDataType: 'String',
            name: 'name',
            required: true,
            mutable: true,
          },
        ],

        accountRecoverySetting: {
          recoveryMechanisms: [
            {
              name: 'verified_email',
              priority: 1,
            },
          ],
        },

        userPoolAddOns: {
          advancedSecurityMode: 'ENFORCED',
        },

        deviceConfiguration: {
          challengeRequiredOnNewDevice: true,
          deviceOnlyRememberedOnUserPrompt: true,
        },

        emailConfiguration: {
          emailSendingAccount: 'COGNITO_DEFAULT',
        },

        verificationMessageTemplate: {
          defaultEmailOption: 'CONFIRM_WITH_CODE',
        },

        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-user-pool-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    //  Cognito User Pool Client
    const userPoolClient = new aws.cognito.UserPoolClient(
      `banking-user-pool-client-${environmentSuffix}`,
      {
        name: `banking-client-${environmentSuffix}`,
        userPoolId: userPool.id,
        generateSecret: true,
        explicitAuthFlows: [
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
          'ALLOW_USER_PASSWORD_AUTH',
        ],
        preventUserExistenceErrors: 'ENABLED',
        refreshTokenValidity: 30,
        accessTokenValidity: 60,
        idTokenValidity: 60,
        tokenValidityUnits: {
          refreshToken: 'days',
          accessToken: 'minutes',
          idToken: 'minutes',
        },
      },
      { parent: this }
    );

    // Cognito Identity Pool
    const identityPool = new aws.cognito.IdentityPool(
      `banking-identity-pool-${environmentSuffix}`,
      {
        identityPoolName: `banking_identity_${environmentSuffix}`,
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.id,
            providerName: userPool.endpoint,
            serverSideTokenCheck: true,
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for Authenticated Users
    const authenticatedRole = new aws.iam.Role(
      `banking-cognito-auth-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi.all([identityPool.id]).apply(([poolId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Federated: 'cognito-identity.amazonaws.com',
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'cognito-identity.amazonaws.com:aud': poolId,
                  },
                  'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated',
                  },
                },
              },
            ],
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `banking-cognito-auth-policy-${environmentSuffix}`,
      {
        role: authenticatedRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['execute-api:Invoke'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.cognito.IdentityPoolRoleAttachment(
      `banking-identity-pool-roles-${environmentSuffix}`,
      {
        identityPoolId: identityPool.id,
        roles: {
          authenticated: authenticatedRole.arn,
        },
      },
      { parent: this }
    );

    // WAF Web ACL
    const wafWebAcl = new aws.wafv2.WebAcl(
      `banking-waf-${environmentSuffix}`,
      {
        name: `banking-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        description: 'WAF rules for banking platform',
        defaultAction: {
          allow: {},
        },

        rules: [
          // Rate limiting rule
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          // AWS Managed Rules - Core Rule Set
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
          // Known Bad Inputs
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 3,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          // SQL Injection Protection
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 4,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          // IP Reputation List
          {
            name: 'AWSManagedRulesAmazonIpReputationList',
            priority: 5,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
        ],

        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `banking-waf-${environmentSuffix}`,
        },

        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-waf-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ACM Certificate
    // Skip certificate validation for example.com domains
    const certificate = new aws.acm.Certificate(
      `banking-cert-${environmentSuffix}`,
      {
        domainName: `*.banking-${environmentSuffix}.example.com`,
        validationMethod: 'DNS',
        subjectAlternativeNames: [
          `banking-${environmentSuffix}.example.com`,
          `api.banking-${environmentSuffix}.example.com`,
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-cert-${environmentSuffix}`,
        })),
      },
      {
        parent: this,
        ignoreChanges: ['validationMethod'],
      }
    );

    //  Outputs
    this.kmsKeyId = kmsKey.id;
    this.kmsKeyArn = kmsKey.arn;
    this.dbSecretArn = dbSecret.arn;
    this.secretsManagerArns = pulumi
      .all([dbSecret.arn, apiSecret.arn])
      .apply(([dbArn, apiArn]) => ({
        database: dbArn,
        api: apiArn,
      }));
    this.cognitoUserPoolId = userPool.id;
    this.cognitoUserPoolArn = userPool.arn;
    this.cognitoIdentityPoolId = identityPool.id;
    this.wafWebAclArn = wafWebAcl.arn;
    this.certificateArn = certificate.arn;

    this.registerOutputs({
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      dbSecretArn: this.dbSecretArn,
      secretsManagerArns: this.secretsManagerArns,
      cognitoUserPoolId: this.cognitoUserPoolId,
      cognitoUserPoolArn: this.cognitoUserPoolArn,
      cognitoIdentityPoolId: this.cognitoIdentityPoolId,
      wafWebAclArn: this.wafWebAclArn,
      certificateArn: this.certificateArn,
    });
  }
}
