// lib/lambda-stack.ts

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface LambdaStackProps {
  environmentSuffix?: string;
  vpcId: string;
}

export class LambdaStack extends TerraformStack {
  public readonly lambdaExecutionRole: IamRole;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or use a region from props
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new IamRole(this, 'prodLambdaExecutionRole', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `prod-lambda-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.lambdaExecutionRole = lambdaExecutionRole;

    // Lambda Function
    new LambdaFunction(this, 'prodSecureLambda', {
      functionName: `prod-secure-lambda-${environmentSuffix}`,
      role: lambdaExecutionRole.arn,
      handler: 'index.handler',
      runtime: 'python3.9',
      timeout: 30,
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: {
        subnetIds: [props.vpcId],
        securityGroupIds: [],
      },
      tags: {
        Name: `prod-secure-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
