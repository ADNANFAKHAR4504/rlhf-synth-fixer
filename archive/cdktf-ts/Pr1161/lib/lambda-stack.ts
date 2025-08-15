// lib/lambda-stack.ts

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { Construct } from 'constructs';
import * as path from 'path';

interface LambdaStackProps {
  environmentSuffix?: string;
  vpcId?: string;
  subnetIds?: string[];
  securityGroupIds?: string[];
}

export class LambdaStack extends Construct {
  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

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
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole', // Add this
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole', // Add this for logging
      ],
      tags: {
        Name: `prod-lambda-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Function
    const lambdaFunction = new LambdaFunction(this, 'prodSecureLambda', {
      functionName: `prod-secure-lambda-${environmentSuffix}`,
      role: lambdaExecutionRole.arn,
      handler: 'index.handler',
      runtime: 'python3.9',
      timeout: 30,
      filename: path.resolve(__dirname, 'lambda/function.zip'), // <-- Reference the zip in lib/
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: props?.vpcId
        ? {
            subnetIds: props?.subnetIds || [],
            securityGroupIds: props?.securityGroupIds || [],
          }
        : undefined,
      tags: {
        Name: `prod-secure-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Permission
    new LambdaPermission(this, 'prodLambdaInvokePermission', {
      statementId: 'AllowExecutionFromSpecificRole',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: lambdaExecutionRole.arn, // Restrict to the Lambda execution role only
    });
  }
}
