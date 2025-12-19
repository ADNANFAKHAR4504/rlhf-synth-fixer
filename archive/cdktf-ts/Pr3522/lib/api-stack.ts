import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import * as path from 'path';

interface ApiStackProps {
  vpc: Vpc;
  alb: Alb;
  region: string;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly websocketApi: Apigatewayv2Api;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `portfolio-ws-lambda-role-${props.environmentSuffix}`,
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
    });

    new IamRolePolicy(this, 'lambda-policy', {
      name: `portfolio-ws-lambda-policy-${props.environmentSuffix}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['execute-api:ManageConnections', 'execute-api:Invoke'],
            Resource: '*',
          },
        ],
      }),
    });

    // Create Lambda deployment package
    const lambdaAsset = new DataArchiveFile(this, 'websocket-lambda-archive', {
      type: 'zip',
      sourceDir: path.join(__dirname, 'lambda', 'websocket-handler'),
      outputPath: path.join(
        __dirname,
        '../.terraform',
        `websocket-handler-${props.environmentSuffix}.zip`
      ),
    });

    const websocketLambda = new LambdaFunction(this, 'websocket-handler', {
      functionName: `portfolio-ws-handler-${props.environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaAsset.outputPath,
      sourceCodeHash: lambdaAsset.outputBase64Sha256,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          ALB_DNS: props.alb.dnsName,
        },
      },
    });

    this.websocketApi = new Apigatewayv2Api(this, 'websocket-api', {
      name: `portfolio-ws-api-${props.environmentSuffix}`,
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
      description: 'WebSocket API for real-time portfolio updates',
    });

    const integration = new Apigatewayv2Integration(
      this,
      'websocket-integration',
      {
        apiId: this.websocketApi.id,
        integrationType: 'AWS_PROXY',
        integrationUri: websocketLambda.invokeArn,
        integrationMethod: 'POST',
        connectionType: 'INTERNET',
      }
    );

    new Apigatewayv2Route(this, 'connect-route', {
      apiId: this.websocketApi.id,
      routeKey: '$connect',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Route(this, 'disconnect-route', {
      apiId: this.websocketApi.id,
      routeKey: '$disconnect',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Route(this, 'default-route', {
      apiId: this.websocketApi.id,
      routeKey: '$default',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Stage(this, 'websocket-stage', {
      apiId: this.websocketApi.id,
      name: 'prod',
      autoDeploy: true,
    });

    new LambdaPermission(this, 'websocket-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: websocketLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.websocketApi.executionArn}/*/*`,
    });
  }
}
