
I'll create a comprehensive CloudFormation template that meets all your security and logging requirements. Here's the complete YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure serverless infrastructure for Lambda with comprehensive logging and least-privilege IAM'

Parameters:
  VpcId:
    Type: String
    Default: vpc-123abcde
    Description: Pre-existing VPC ID
  
  S3BucketName:
    Type: String
    Default: lambda-logs-bucket
    Description: Existing S3 bucket for log persistence
  
  LambdaFunctionName:
    Type: String
    Default: SecureLambdaFunction
    Description: Name of the Lambda function

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Infrastructure Configuration"
        Parameters:
          - VpcId
          - S3BucketName
          - LambdaFunctionName

Resources:
  # CloudWatch Log Group with 15-day retention
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunctionName}'
      RetentionInDays: 15 # Exactly 15 days as required
    DeletionPolicy: Delete

  # IAM Role for Lambda execution with minimal required permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${LambdaFunctionName}-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic VPC execution permissions (required for VPC deployment)
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        # Custom policy for CloudWatch Logs with least privilege
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt LambdaLogGroup.Arn
              - Effect: Allow
                Action:
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunctionName}*'

  # IAM Role for CloudWatch Logs to access S3 (for log forwarding)
  CloudWatchLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${LambdaFunctionName}-cloudwatch-logs-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action: sts:AssumeRole
      Policies:
        # Minimal S3 permissions for log delivery
        - PolicyName: S3LogDeliveryPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource:
                  - !Sub 'arn:aws:s3:::${S3BucketName}'
                  - !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs/*'

  # CloudWatch Logs Destination for S3 export
  LogDestination:
    Type: AWS::Logs::Destination
    Properties:
      DestinationName: !Sub '${LambdaFunctionName}-s3-destination'
      RoleArn: !GetAtt CloudWatchLogsRole.Arn
      TargetArn: !Sub 'arn:aws:s3:::${S3BucketName}/lambda-logs'
      DestinationPolicy: !Sub |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::${AWS::AccountId}:root"
              },
              "Action": "logs:PutSubscriptionFilter",
              "Resource": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:destination:${LambdaFunctionName}-s3-destination"
            }
          ]
        }

  # Subscription Filter to forward logs to S3
  LogSubscriptionFilter:
    Type: AWS::Logs::SubscriptionFilter
    Properties:
      LogGroupName: !Ref LambdaLogGroup
      FilterPattern: '' # Forward all logs
      DestinationArn: !GetAtt LogDestination.Arn

  # Security Group for Lambda (restrictive by default)
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda function with minimal access
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        # Allow HTTPS outbound for AWS API calls
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS for AWS API calls
        # Allow DNS resolution
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: DNS resolution
      Tags:
        - Key: Name
          Value: !Sub '${LambdaFunctionName}-security-group'

  # Get VPC subnets for Lambda deployment
  VpcInfo:
    Type: AWS::EC2::VPC
    Properties:
      VpcId: !Ref VpcId

  # Lambda Function with secure configuration
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      # VPC Configuration for secure deployment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: # You'll need to specify actual subnet IDs
          - subnet-12345678  # Replace with actual private subnet IDs
          - subnet-87654321  # Replace with actual private subnet IDs
      # Environment variables (if needed)
      Environment:
        Variables:
          LOG_LEVEL: INFO
          S3_BUCKET: !Ref S3BucketName
      # Dead Letter Queue for error handling
      DeadLetterConfig:
        TargetArn: !GetAtt DeadLetterQueue.Arn
      # Sample Lambda code for demonstration
      Code:
        ZipFile: |
          import json
          import logging
          import boto3
          import os
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          def lambda_handler(event, context):
              logger.info(f"Lambda invocation started - Request ID: {context.aws_request_id}")
              logger.info(f"Event received: {json.dumps(event)}")
              
              try:
                  # Your business logic here
                  result = {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Function executed successfully',
                          'requestId': context.aws_request_id
                      })
                  }
                  logger.info(f"Function completed successfully - Request ID: {context.aws_request_id}")
                  return result
                  
              except Exception as e:
                  logger.error(f"Error in lambda execution: {str(e)} - Request ID: {context.aws_request_id}")
                  raise
      Tags:
        - Key: Environment
          Value: Production
        - Key: Security
          Value: High

  # Dead Letter Queue for failed invocations
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${LambdaFunctionName}-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      VisibilityTimeoutSeconds: 60
      Tags:
        - Key: Purpose
          Value: Lambda-DLQ

  # CloudWatch Alarm for monitoring Lambda errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${LambdaFunctionName}-errors'
      AlarmDescription: Monitors Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      TreatMissingData: notBreaching

Outputs:
  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-arn'

  LambdaFunctionName:
    Description: Name of the Lambda function
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-lambda-name'

  LogGroupName:
    Description: CloudWatch Log Group name
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-log-group'

  SecurityGroupId:
    Description: Security Group ID for Lambda
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-security-group'

  DeadLetterQueueUrl:
    Description: Dead Letter Queue URL
    Value: !Ref DeadLetterQueue
    Export:
      Name: !Sub '${AWS::StackName}-dlq-url'
```

## Deployment Verification Steps

### 1. **Verify CloudWatch Logging**

```bash
# Test Lambda function invocation
aws lambda invoke \
  --function-name SecureLambdaFunction \
  --payload '{"test": "data"}' \
  response.json

# Check CloudWatch logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/SecureLambdaFunction"

# Verify log retention period
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/SecureLambdaFunction" \
  --query 'logGroups[0].retentionInDays'
```

### 2. **Verify S3 Log Persistence**

```bash
# Check if logs are being forwarded to S3
aws s3 ls s3://lambda-logs-bucket/lambda-logs/ --recursive

# Monitor log delivery (may take a few minutes)
aws logs describe-export-tasks \
  --status-code RUNNING
```

### 3. **Verify IAM Permissions (Least Privilege)**

```bash
# Check Lambda execution role permissions
aws iam get-role --role-name SecureLambdaFunction-execution-role

# List attached policies
aws iam list-attached-role-policies \
  --role-name SecureLambdaFunction-execution-role

# Review inline policies
aws iam list-role-policies \
  --role-name SecureLambdaFunction-execution-role

# Test permission boundaries (should fail for unauthorized actions)
aws lambda update-function-configuration \
  --function-name SecureLambdaFunction \
  --timeout 900  # This should work
```

### 4. **Security Verification**

```bash
# Verify VPC configuration
aws lambda get-function-configuration \
  --function-name SecureLambdaFunction \
  --query 'VpcConfig'

# Check security group rules
aws ec2 describe-security-groups \
  --group-names SecureLambdaFunction-security-group

# Verify no excessive permissions
aws iam simulate-principal-policy \
  --policy-source-arn $(aws iam get-role --role-name SecureLambdaFunction-execution-role --query 'Role.Arn' --output text) \
  --action-names s3:DeleteBucket \
  --resource-arns arn:aws:s3:::lambda-logs-bucket
```

### 5. **Monitoring and Alerting Verification**

```bash
# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names SecureLambdaFunction-errors

# Verify Dead Letter Queue
aws sqs get-queue-attributes \
  --queue-url $(aws sqs get-queue-url --queue-name SecureLambdaFunction-dlq --query 'QueueUrl' --output text) \
  --attribute-names All
```

## Key Security Features Implemented

1. **Least Privilege IAM**: Roles have only the minimum required permissions
2. **VPC Isolation**: Lambda runs in a dedicated VPC with restrictive security groups
3. **Comprehensive Logging**: All invocations logged to CloudWatch and persisted to S3
4. **Error Handling**: Dead Letter Queue for failed invocations
5. **Monitoring**: CloudWatch alarms for error detection
6. **Resource Constraints**: 15-day log retention as specified
7. **Network Security**: Restrictive egress rules allowing only necessary traffic

This template ensures a secure, well-monitored Lambda deployment that meets all your specified requirements while following AWS security best practices.
=======
# Production-Grade Serverless Infrastructure with Pulumi

I'll design a comprehensive serverless infrastructure solution that meets all your requirements. This solution includes a Lambda function connected to RDS through API Gateway, with proper security, testing, and documentation.

## Project Structure

```
serverless-infrastructure/
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── requirements.txt
├── __main__.py
├── infrastructure/
│   ├── __init__.py
│   ├── vpc.py
│   ├── rds.py
│   ├── lambda_function.py
│   ├── api_gateway.py
│   └── iam.py
├── lambda_src/
│   ├── handler.py
│   └── requirements.txt
├── tests/
│   ├── __init__.py
│   ├── test_infrastructure.py
│   └── test_api.py
├── scripts/
│   ├── deploy.sh
│   └── test.sh
└── README.md
```

## Core Infrastructure Code

### 1. Main Pulumi Program (`__main__.py`)

```python
"""
Main Pulumi program for serverless infrastructure deployment.
This orchestrates the creation of all AWS resources with proper dependencies.
"""

import pulumi
from infrastructure.vpc import create_vpc_infrastructure
from infrastructure.iam import create_lambda_role
from infrastructure.rds import create_rds_instance
from infrastructure.lambda_function import create_lambda_function
from infrastructure.api_gateway import create_api_gateway

# Get configuration values
config = pulumi.Config()
environment = config.get("environment") or "dev"
db_password = config.require_secret("db_password")
db_username = config.get("db_username") or "admin"

# Create VPC infrastructure first (foundational layer)
vpc_resources = create_vpc_infrastructure(environment)

# Create IAM role for Lambda execution
lambda_role = create_lambda_role(environment)

# Create RDS instance in private subnets
rds_instance = create_rds_instance(
    environment=environment,
    vpc_id=vpc_resources["vpc_id"],
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    db_security_group_id=vpc_resources["db_security_group_id"],
    username=db_username,
    password=db_password
)

# Create Lambda function with VPC configuration
lambda_function = create_lambda_function(
    environment=environment,
    role_arn=lambda_role.arn,
    vpc_id=vpc_resources["vpc_id"],
    private_subnet_ids=vpc_resources["private_subnet_ids"],
    lambda_security_group_id=vpc_resources["lambda_security_group_id"],
    rds_endpoint=rds_instance.endpoint,
    db_name=rds_instance.db_name,
    db_username=db_username,
    db_password=db_password
)

# Create API Gateway to trigger Lambda
api_gateway = create_api_gateway(
    environment=environment,
    lambda_function_arn=lambda_function.arn,
    lambda_function_name=lambda_function.name
)

# Export important values for reference
pulumi.export("api_gateway_url", api_gateway["api_url"])
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("vpc_id", vpc_resources["vpc_id"])
```

### 2. VPC Infrastructure (`infrastructure/vpc.py`)

```python
"""
VPC infrastructure module for secure networking.
Creates VPC, subnets, security groups, and NAT gateway for Lambda-RDS connectivity.
"""

import pulumi
import pulumi_aws as aws

def create_vpc_infrastructure(environment: str) -> dict:
    """
    Creates VPC infrastructure with public/private subnets and security groups.
    
    Args:
        environment: Environment name (dev, staging, prod)
        
    Returns:
        Dictionary containing VPC resource references
    """
    
    # Create VPC with DNS support for RDS connectivity
    vpc = aws.ec2.Vpc(
        f"vpc-{environment}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"vpc-{environment}",
            "Environment": environment
        }
    )
    
    # Create Internet Gateway for public subnet connectivity
    igw = aws.ec2.InternetGateway(
        f"igw-{environment}",
        vpc_id=vpc.id,
        tags={
            "Name": f"igw-{environment}",
            "Environment": environment
        }
    )
    
    # Get availability zones for multi-AZ deployment
    azs = aws.get_availability_zones(state="available")
    
    # Create public subnets (for NAT Gateway)
    public_subnets = []
    for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
        subnet = aws.ec2.Subnet(
            f"public-subnet-{environment}-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+1}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={
                "Name": f"public-subnet-{environment}-{i+1}",
                "Environment": environment,
                "Type": "Public"
            }
        )
        public_subnets.append(subnet)
    
    # Create private subnets (for Lambda and RDS)
    private_subnets = []
    for i, az in enumerate(azs.names[:2]):
        subnet = aws.ec2.Subnet(
            f"private-subnet-{environment}-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+10}.0/24",
            availability_zone=az,
            tags={
                "Name": f"private-subnet-{environment}-{i+1}",
                "Environment": environment,
                "Type": "Private"
            }
        )
        private_subnets.append(subnet)
    
    # Create Elastic IP for NAT Gateway
    nat_eip = aws.ec2.Eip(
        f"nat-eip-{environment}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-{environment}",
            "Environment": environment
        }
    )
    
    # Create NAT Gateway in first public subnet
    nat_gateway = aws.ec2.NatGateway(
        f"nat-gateway-{environment}",
        allocation_id=nat_eip.id,
        subnet_id=public_subnets[0].id,
        tags={
            "Name": f"nat-gateway-{environment}",
            "Environment": environment
        }
    )
    
    # Create route table for public subnets
    public_rt = aws.ec2.RouteTable(
        f"public-rt-{environment}",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )
        ],
        tags={
            "Name": f"public-rt-{environment}",
            "Environment": environment
        }
    )
    
    # Create route table for private subnets
    private_rt = aws.ec2.RouteTable(
        f"private-rt-{environment}",
        vpc_id=vpc.id,
        routes=[
            aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )
        ],
        tags={
            "Name": f"private-rt-{environment}",
            "Environment": environment
        }
    )
    
    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"public-rta-{environment}-{i+1}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )
    
    # Associate private subnets with private route table
    for i, subnet in enumerate(private_subnets):
        aws.ec2.RouteTableAssociation(
            f"private-rta-{environment}-{i+1}",
            subnet_id=subnet.id,
            route_table_id=private_rt.id
        )
    
    # Security group for Lambda function
    lambda_sg = aws.ec2.SecurityGroup(
        f"lambda-sg-{environment}",
        name=f"lambda-sg-{environment}",
        description="Security group for Lambda function",
        vpc_id=vpc.id,
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={
            "Name": f"lambda-sg-{environment}",
            "Environment": environment
        }
    )
    
    # Security group for RDS instance
    db_sg = aws.ec2.SecurityGroup(
        f"db-sg-{environment}",
        name=f"db-sg-{environment}",
        description="Security group for RDS database",
        vpc_id=vpc.id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,  # PostgreSQL port
                to_port=5432,
                security_groups=[lambda_sg.id]
            )
        ],
        tags={
            "Name": f"db-sg-{environment}",
            "Environment": environment
        }
    )
    
    return {
        "vpc_id": vpc.id,
        "public_subnet_ids": [subnet.id for subnet in public_subnets],
        "private_subnet_ids": [subnet.id for subnet in private_subnets],
        "lambda_security_group_id": lambda_sg.id,
        "db_security_group_id": db_sg.id,
        "nat_gateway_id": nat_gateway.id
    }
```

### 3. IAM Role (`infrastructure/iam.py`)

```python
"""
IAM module for Lambda execution role with least privilege permissions.
Creates role with necessary permissions for VPC, RDS, and CloudWatch access.
"""

import json
import pulumi_aws as aws

def create_lambda_role(environment: str) -> aws.iam.Role:
    """
    Creates IAM role for Lambda with least privilege permissions.
    
    Args:
        environment: Environment name (dev, staging, prod)
        
    Returns:
        IAM Role for Lambda execution
    """
    
    # Trust policy for Lambda service
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    })
    
    # Create Lambda execution role
    lambda_role = aws.iam.Role(
        f"lambda-role-{environment}",
        name=f"lambda-role-{environment}",
        assume_role_policy=assume_role_policy,
        tags={
            "Name": f"lambda-role-{environment}",
            "Environment": environment
        }
    )
    
    # Attach basic Lambda execution policy
    aws.iam.RolePolicyAttachment(
        f"lambda-basic-execution-{environment}",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )
    
    # Attach VPC access policy for Lambda
    aws.iam.RolePolicyAttachment(
        f"lambda-vpc-access-{environment}",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    )
    
    # Custom policy for RDS access (read-only for security)
    rds_policy = aws.iam.Policy(
        f"lambda-rds-policy-{environment}",
        name=f"lambda-rds-policy-{environment}",
        description="Policy for Lambda to access RDS",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "rds:DescribeDBInstances",
                        "rds:DescribeDBClusters"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:*:*:log-group:/aws/lambda/*"
                }
            ]
        })
    )
    
    # Attach custom RDS policy
    aws.iam.RolePolicyAttachment(
        f"lambda-rds-policy-attachment-{environment}",
        role=lambda_role.name,
        policy_arn=rds_policy.arn
    )
    
    return lambda_role
```

### 4. RDS Instance (`infrastructure/rds.py`)

```python
"""
RDS module for PostgreSQL database instance.
Creates RDS with encryption, backup, and proper subnet group configuration.
"""

import pulumi
import pulumi_aws as aws

def create_rds_instance(
    environment: str,
    vpc_id: pulumi.Output[str],
    private_subnet_ids: list,
    db_security_group_id: pulumi.Output[str],
    username: str,
    password: pulumi.Output[str]
) -> aws.rds.Instance:
    """
    Creates RDS PostgreSQL instance with security best practices.
    
    Args:
        environment: Environment name
        vpc_id: VPC ID where RDS will be created
        private_subnet_ids: List of private subnet IDs
        db_security_group_id: Security group ID for database
        username: Database username
        password: Database password (secret)
        
    Returns:
        RDS Instance
    """
    
    # Create DB subnet group for multi-AZ deployment
    db_subnet_group = aws.rds.SubnetGroup(
        f"db-subnet-group-{environment}",
        name=f"db-subnet-group-{environment}",
        subnet_ids=private_subnet_ids,
        tags={
            "Name": f"db-subnet-group-{environment}",
            "Environment": environment
        }
    )
    
    # Create RDS parameter group for PostgreSQL optimization
    db_parameter_group = aws.rds.ParameterGroup(
        f"db-params-{environment}",
        name=f"db-params-{environment}",
        family="postgres14",
        description=f"Parameter group for {environment} PostgreSQL",
        parameters=[
            aws.rds.ParameterGroupParameterArgs(
                name="shared_preload_libraries",
                value="pg_stat_statements"
            ),
            aws.rds.ParameterGroupParameterArgs(
                name="log_statement",
                value="all"
            )
        ],
        tags={
            "Name": f"db-params-{environment}",
            "Environment": environment
        }
    )
    
    # Determine instance class based on environment
    instance_class_map = {
        "dev": "db.t3.micro",
        "staging": "db.t3.small", 
        "prod": "db.t3.medium"
    }
    instance_class = instance_class_map.get(environment, "db.t3.micro")
    
    # Create RDS instance with encryption and backup
    rds_instance = aws.rds.Instance(
        f"postgres-{environment}",
        identifier=f"postgres-{environment}",
        engine="postgres",
        engine_version="14.9",
        instance_class=instance_class,
        allocated_storage=20,
        max_allocated_storage=100,  # Enable storage autoscaling
        storage_type="gp2",
        storage_encrypted=True,  # Encrypt storage at rest
        
        # Database configuration
        db_name="appdb",
        username=username,
        password=password,
        port=5432,
        
        # Network and security
        vpc_security_group_ids=[db_security_group_id],
        db_subnet_group_name=db_subnet_group.name,
        parameter_group_name=db_parameter_group.name,
        publicly_accessible=False,  # Keep in private subnet
        
        # Backup and maintenance
        backup_retention_period=7,
        backup_window="03:00-04:00",  # UTC
        maintenance_window="sun:04:00-sun:05:00",  # UTC
        auto_minor_version_upgrade=True,
        
        # Monitoring and performance
        monitoring_interval=60,
        performance_insights_enabled=True,
        performance_insights_retention_period=7,
        
        # Deletion protection for production
        deletion_protection=environment == "prod",
        skip_final_snapshot=environment != "prod",
        final_snapshot_identifier=f"postgres-{environment}-final-snapshot" if environment == "prod" else None,
        
        tags={
            "Name": f"postgres-{environment}",
            "Environment": environment,
            "Engine": "PostgreSQL"
        }
    )
    
    return rds_instance
```

### 5. Lambda Function (`infrastructure/lambda_function.py`)

```python
"""
Lambda function module with VPC configuration and environment variables.
Creates Lambda deployment package and configures networking.
"""

import base64
import json
import pulumi
import pulumi_aws as aws

def create_lambda_function(
    environment: str,
    role_arn: pulumi.Output[str],
    vpc_id: pulumi.Output[str],
    private_subnet_ids: list,
    lambda_security_group_id: pulumi.Output[str],
    rds_endpoint: pulumi.Output[str],
    db_name: pulumi.Output[str],
    db_username: str,
    db_password: pulumi.Output[str]
) -> aws.lambda_.Function:
    """
    Creates Lambda function with VPC configuration and RDS connectivity.
    
    Args:
        environment: Environment name
        role_arn: IAM role ARN for Lambda execution
        vpc_id: VPC ID for Lambda deployment
        private_subnet_ids: Private subnet IDs for Lambda
        lambda_security_group_id: Security group for Lambda
        rds_endpoint: RDS instance endpoint
        db_name: Database name
        db_username: Database username
        db_password: Database password (secret)
        
    Returns:
        Lambda Function
    """
    
    # Create Lambda deployment package
    lambda_code = """
import json
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    \"\"\"
    Lambda handler for API Gateway requests.
    Connects to RDS and executes database operations.
    \"\"\"
    
    # Log incoming request for debugging
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Database connection parameters from environment
        db_config = {
            'host': os.environ['DB_HOST'],
            'database': os.environ['DB_NAME'],
            'user': os.environ['DB_USER'],
            'password': os.environ['DB_PASSWORD'],
            'port': int(os.environ.get('DB_PORT', 5432)),
            'connect_timeout': 10,
            'sslmode': 'require'  # Enforce SSL connection
        }
        
        # Handle different API endpoints
        if path == '/health' and http_method == 'GET':
            return handle_health_check(db_config)
        elif path == '/users' and http_method == 'GET':
            return handle_get_users(db_config)
        elif path == '/users' and http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return handle_create_user(db_config, body)
        else:
            return create_response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Internal server error'})

def handle_health_check(db_config):
    \"\"\"Health check endpoint to verify database connectivity.\"\"\"
    try:
        with psycopg2.connect(**db_config) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                
        logger.info("Database health check successful")
        return create_response(200, {
            'status': 'healthy',
            'database': 'connected',
            'version': version
        })
        
    except psycopg2.Error as e:
        logger.error(f"Database connection error: {str(e)}")
        return create_response(503, {
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        })

def handle_get_users(db_config):
    \"\"\"Get all users from database.\"\"\"
    try:
        with psycopg2.connect(**db_config) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Create users table if it doesn't exist
                cursor.execute(\"\"\"
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                \"\"\")
                
                # Fetch all users
                cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY id;")
                users = cursor.fetchall()
                
        logger.info(f"Retrieved {len(users)} users")
        return create_response(200, {'users': [dict(user) for user in users]})
        
    except psycopg2.Error as e:
        logger.error(f"Database query error: {str(e)}")
        return create_response(500, {'error': 'Database query failed'})

def handle_create_user(db_config, user_data):
    \"\"\"Create a new user in database.\"\"\"
    try:
        # Validate input
        if not user_data.get('name') or not user_data.get('email'):
            return create_response(400, {'error': 'Name and email are required'})
            
        with psycopg2.connect(**db_config) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Create users table if it doesn't exist
                cursor.execute(\"\"\"
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                \"\"\")
                
                # Insert new user
                cursor.execute(
                    "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id, name, email, created_at;",
                    (user_data['name'], user_data['email'])
                )
                new_user = cursor.fetchone()
                conn.commit()
                
        logger.info(f"Created user: {new_user['email']}")
        return create_response(201, {'user': dict(new_user)})
        
    except psycopg2.IntegrityError as e:
        logger.error(f"User creation failed - integrity error: {str(e)}")
        return create_response(409, {'error': 'Email already exists'})
    except psycopg2.Error as e:
        logger.error(f"Database error during user creation: {str(e)}")
        return create_response(500, {'error': 'Failed to create user'})

def create_response(status_code, body):
    \"\"\"Create standardized API Gateway response.\"\"\"
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(body, default=str)  # Handle datetime serialization
    }
"""
    
    # Create Lambda function with VPC configuration
    lambda_function = aws.lambda_.Function(
        f"api-lambda-{environment}",
        name=f"api-lambda-{environment}",
        runtime="python3.9",
        code=pulumi.AssetArchive({
            "lambda_function.py": pulumi.StringAsset(lambda_code)
        }),
        handler="lambda_function.lambda_handler",
        role=role_arn,
        timeout=30,
        memory_size=256,
        
        # VPC Configuration for RDS access
        vpc_config=aws.lambda_.FunctionVpcConfigArgs(
            subnet_ids=private_subnet_ids,
            security_group_ids=[lambda_security_group_id]
        ),
        
        # Environment variables for database connection
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DB_HOST": rds_endpoint,
                "DB_NAME": db_name,
                "DB_USER": db_username,
                "DB_PASSWORD": db_password,
                "DB_PORT": "5432",
                "ENVIRONMENT": environment
            }
        ),
        
        # Enable detailed monitoring
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"
        ),
        
        tags={
            "Name": f"api-lambda-{environment}",
            "Environment": environment
        }
    )
    
    # Create CloudWatch Log Group with retention
    aws.cloudwatch.LogGroup(
        f"lambda-logs-{environment}",
        name=lambda_function.name.apply(lambda name: f"/aws/lambda/{name}"),
        retention_in_days=14,
        tags={
            "Environment": environment
        }
    )
    
    return lambda_function
```

### 6. API Gateway (`infrastructure/api_gateway.py`)

```python
"""
API Gateway module for Lambda function integration.
Creates REST API with proper CORS, throttling, and logging configuration.
"""

import json
import pulumi
import pulumi_aws as aws

def create_api_gateway(
    environment: str,
    lambda_function_arn: pulumi.Output[str],
    lambda_function_name: pulumi.Output[str]
) -> dict:
    """
    Creates API Gateway REST API with Lambda integration.
    
    Args:
        environment: Environment name
        lambda_function_arn: Lambda function ARN
        lambda_function_name: Lambda function name
        
    Returns:
        Dictionary with API Gateway resources
    """
    
    # Create REST API
    api = aws.apigateway.RestApi(
        f"api-{environment}",
        name=f"serverless-api-{environment}",
        description=f"Serverless API for {environment} environment",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types="REGIONAL"
        ),
        tags={
            "Name": f"api-{environment}",
            "Environment": environment
        }
    )
    
    # Create API Gateway resources and methods
    
    # Health check resource
    health_resource = aws.apigateway.Resource(
        f"health-resource-{environment}",
        rest_api=api.id,
        parent_id=api.root_resource_id,
        path_part="health"
    )
    
    # Users resource
    users_resource = aws.apigateway.Resource(
        f"users-resource-{environment}",
        rest_api=api.id,
        parent_id=api.root_resource_id,
        path_part="users"
    )
    
    # Create methods for health endpoint
    health_method = aws.apigateway.Method(
        f"health-method-{environment}",
        rest_api=api.id,
        resource_id=health_resource.id,
        http_method="GET",
        authorization="NONE"
    )
    
    # Create methods for users endpoint
    users_get_method = aws.apigateway.Method(
        f"users-get-method-{environment}",
        rest_api=api.id,
        resource_id=users_resource.id,
        http_method="GET",
        authorization="NONE"
    )
    
    users_post_method = aws.apigateway.Method(
        f"users-post-method-{environment}",
        rest_api=api.id,
        resource_id=users_resource.id,
        http_method="POST",
        authorization="NONE"
    )
    
    # CORS OPTIONS methods
    health_options_method = aws.apigateway.Method(
        f"health-options-method-{environment}",
        rest_api=api.id,
        resource_id=health_resource.id,
        http_method="OPTIONS",
        authorization="NONE"
    )
    
    users_options_method = aws.apigateway.Method(
        f"users-options-method-{environment}",
        rest_api=api.id,
        resource_id=users_resource.id,
        http_method="OPTIONS",
        authorization="NONE"
    )
    
    # Lambda integrations
    health_integration = aws.apigateway.Integration(
        f"health-integration-{environment}",
        rest_api=api.id,
        resource_id=health_resource.id,
        http_method=health_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
        )
    )
    
    users_get_integration = aws.apigateway.Integration(
        f"users-get-integration-{environment}",
        rest_api=api.id,
        resource_id=users_resource.id,
        http_method=users_get_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
        )
    )
    
    users_post_integration = aws.apigateway.Integration(
        f"users-post-integration-{environment}",
        rest_api=api.id,
        resource_id=users_resource.id,
        http_method=users_post_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function_arn.apply(
            lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path
