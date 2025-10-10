import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { ICognitoConfig } from '../config/environment-config';

export interface CognitoConstructProps {
  environment: string;
  config: ICognitoConfig;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.environment}-user-pool`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email',
        emailBody: 'Please verify your email by clicking {##Verify Email##}',
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
      signInAliases: {
        email: true,
        username: false,
      },
      passwordPolicy: {
        minLength: props.config.passwordPolicy.minLength,
        requireUppercase: props.config.passwordPolicy.requireUppercase,
        requireLowercase: props.config.passwordPolicy.requireLowercase,
        requireDigits: props.config.passwordPolicy.requireDigits,
        requireSymbols: props.config.passwordPolicy.requireSymbols,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.environment === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    cdk.Tags.of(this.userPool).add('Name', `${props.environment}-cognito`);
  }
}
