import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  usersTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly createUserFunction: lambda.Function;
  public readonly getUserFunction: lambda.Function;
  public readonly deleteUserFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const commonEnvironment = {
      TABLE_NAME: props.usersTable.tableName,
      REGION: this.region,
    };

    // Create User Lambda
    this.createUserFunction = new lambda.Function(this, 'CreateUserFunction', {
      functionName: `CreateUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import uuid
import os
from datetime import datetime

# LocalStack endpoint configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
if endpoint_url:
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
else:
    dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        user_id = str(uuid.uuid4())
        user_data = {
            'UserId': user_id,
            'Name': body.get('name', ''),
            'Email': body.get('email', ''),
            'CreatedAt': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=user_data)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'User created successfully',
                'userId': user_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Get User Lambda
    this.getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      functionName: `GetUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os
from boto3.dynamodb.conditions import Key

# LocalStack endpoint configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
if endpoint_url:
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
else:
    dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        user_id = event['pathParameters']['userId']
        
        response = table.get_item(
            Key={'UserId': user_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'User not found'
                })
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Item'], default=str)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Delete User Lambda
    this.deleteUserFunction = new lambda.Function(this, 'DeleteUserFunction', {
      functionName: `DeleteUser-${props.environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os

# LocalStack endpoint configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
if endpoint_url:
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
else:
    dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${props.usersTable.tableName}')

def lambda_handler(event, context):
    try:
        user_id = event['pathParameters']['userId']
        
        # Check if user exists first
        response = table.get_item(
            Key={'UserId': user_id}
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'User not found'
                })
            }
        
        # Delete the user
        table.delete_item(
            Key={'UserId': user_id}
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'User deleted successfully'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      environment: commonEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions to Lambda functions
    props.usersTable.grantReadWriteData(this.createUserFunction);
    props.usersTable.grantReadData(this.getUserFunction);
    props.usersTable.grantReadWriteData(this.deleteUserFunction);

    // Outputs
    new cdk.CfnOutput(this, 'CreateUserFunctionArn', {
      value: this.createUserFunction.functionArn,
      exportName: `CreateUserFunctionArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'GetUserFunctionArn', {
      value: this.getUserFunction.functionArn,
      exportName: `GetUserFunctionArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeleteUserFunctionArn', {
      value: this.deleteUserFunction.functionArn,
      exportName: `DeleteUserFunctionArn-${props.environmentSuffix}`,
    });
  }
}
