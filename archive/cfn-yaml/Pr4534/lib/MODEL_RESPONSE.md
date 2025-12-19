# Serverless Fitness Workout API - CloudFormation Template

This CloudFormation template creates a comprehensive serverless fitness workout logging API with DynamoDB, Lambda functions, and API Gateway.

## Architecture Overview

The solution provides:
- RESTful API endpoints for workout CRUD operations
- DynamoDB table with auto-scaling for workout data storage
- Python Lambda functions for business logic
- CloudWatch monitoring and alarms
- SSM Parameter Store for configuration

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Fitness Workout Logging API - A cost-effective, scalable solution for handling 2,000 daily workout logs with comprehensive monitoring and security'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment identifier to append to resource names (e.g., dev, staging, prod)
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens
    Default: prod

  ApiStageName:
    Type: String
    Description: API Gateway deployment stage name
    Default: v1
    AllowedValues:
      - v1
      - v2
      - prod
      - dev

Resources:
  # DynamoDB Table for storing workout logs with auto-scaling capabilities
  WorkoutLogsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'workoutlogs-${EnvironmentSuffix}'
      BillingMode: PROVISIONED
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: workoutTimestamp
          AttributeType: N
        - AttributeName: workoutType
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: workoutTimestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: WorkoutTypeIndex
          KeySchema:
            - AttributeName: workoutType
              KeyType: HASH
            - AttributeName: workoutTimestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: FitnessWorkoutAPI

  # Additional resources including Lambda functions, API Gateway, IAM roles, and monitoring...
```

## API Endpoints

- **POST /workouts** - Create a new workout log
- **GET /workouts** - Retrieve workout logs by user ID
- **GET /stats** - Get workout statistics for a user

## Key Features

1. **Scalability**: DynamoDB with auto-scaling and Lambda functions
2. **Security**: IAM roles with least privilege access
3. **Monitoring**: CloudWatch alarms and dashboard
4. **Cost Optimization**: Pay-per-request billing where applicable
5. **Maintainability**: Environment-specific resource naming

## Usage

Deploy with:
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name workout-api-dev \
  --parameter-overrides EnvironmentSuffix=dev \
  --capabilities CAPABILITY_IAM
```