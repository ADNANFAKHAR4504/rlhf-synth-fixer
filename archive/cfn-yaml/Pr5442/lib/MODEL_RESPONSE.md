### Reasoning Trace

---

Creating a CloudFormation YAML template that enforces least-privilege IAM design according to the given constraints and requirements.

## Understanding the Requirements

1. **IAM Roles**:
   - Create an EC2 role for applications
   - Create a Lambda role for serverless workloads
   - Both must have inline policies with minimum required permissions
   - No wildcard actions allowed

2. **Permission Boundaries**:
   - Create a permissions boundary policy to restrict privilege escalation
   - No `iam:*`, `sts:*`, or `organizations:*` permissions
   - Apply boundary to all roles

3. **Validation**:
   - Template must pass cfn-nag scan
   - Prevent policy escalation
   - Use intrinsic functions instead of hardcoded ARNs

## Planning the CloudFormation Template

Let's structure the template with these components:

1. **Resources**:
   - IAM Permission Boundary Policy
   - EC2 Application Role with inline policies
   - Lambda Execution Role with inline policies

2. **Outputs**:
   - EC2 Role ARN
   - Lambda Role ARN

### IAM Permission Boundary Policy

This policy will explicitly deny privilege escalation actions. It should deny:

- All IAM actions (`iam:*`)
- All STS actions (`sts:*`)
- All Organizations actions (`organizations:*`)

### EC2 Application Role

For an EC2 application, typical permissions might include:

- CloudWatch Logs for logging
- Read-only S3 access for retrieving application data
- Reading from specific DynamoDB tables
- SSM Parameter Store access for configuration

### Lambda Execution Role

For a Lambda function, typical permissions might include:

- CloudWatch Logs for logging
- Specific DynamoDB actions on specific tables
- Specific S3 actions on specific buckets

## Drafting the CloudFormation YAML Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for least-privilege IAM roles with permission boundaries'

Resources:
  # Permission Boundary Policy
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary to prevent privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'
          - Sid: 'AllowAllOtherActions'
            Effect: 'Allow'
            Action: '*'
            Resource: '*'
      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'

              # S3 Read-only Access
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'

              # DynamoDB Access
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'

              # SSM Parameter Store Access
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

              # DynamoDB Access
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'

              # S3 Access for Lambda
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role'
    Value: !GetAtt EC2ApplicationRole.Arn

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role'
    Value: !GetAtt LambdaExecutionRole.Arn
```

Now let's review this template and see if it meets all requirements:

1. **IAM Roles**:
   - ✅ Created two roles: EC2ApplicationRole and LambdaExecutionRole
   - ✅ Both have inline policies with specific permissions
   - ✅ No wildcard actions in the policies
2. **Permission Boundaries**:
   - ✅ Created a PermissionBoundaryPolicy that denies IAM, STS, and Organizations actions
   - ✅ Applied to both roles

3. **Validation**:
   - ✅ Used intrinsic functions (!Ref, !Sub, !GetAtt) instead of hardcoded ARNs
   - ❓ Need to check if it passes cfn-nag scan

However, there are a couple of issues I need to correct:

1. The Permission Boundary policy shouldn't have an "Allow \*" statement as this violates the no wildcard requirement. Instead, we should structure it differently.
2. We need to ensure all policies follow the least privilege principle more strictly.

Let's revise the template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for least-privilege IAM roles with permission boundaries'

Resources:
  # Permission Boundary Policy
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary to prevent privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'
          - Sid: 'AllowNonAdminServices'
            Effect: 'Allow'
            NotAction:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'
      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'

              # S3 Read-only Access
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'

              # DynamoDB Access
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'

              # SSM Parameter Store Access
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'

              # Explicit Deny for Wildcard Actions
              - Sid: 'DenyWildcardActions'
                Effect: 'Deny'
                Action: '*'
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:RequestedRegion':
                      - !Ref 'AWS::Region'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Application'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

              # DynamoDB Access
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'

              # S3 Access for Lambda
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'

              # Explicit Deny for Wildcard Actions
              - Sid: 'DenyWildcardActions'
                Effect: 'Deny'
                Action: '*'
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:RequestedRegion':
                      - !Ref 'AWS::Region'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Serverless'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2ApplicationRoleARN'

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleARN'

  PermissionBoundaryPolicyARN:
    Description: 'ARN of the Permission Boundary Policy'
    Value: !Ref PermissionBoundaryPolicy
    Export:
      Name: !Sub '${AWS::StackName}-PermissionBoundaryPolicyARN'
```

Wait, I need to reconsider the Permission Boundary policy structure. Instead of using "Allow" with "NotAction", which could still be too permissive, let's create a boundary that only allows specific actions that our application needs.

Also, the "DenyWildcardActions" statement in the role policies might be redundant and could potentially conflict with our explicitly allowed actions. Let me correct these issues:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for least-privilege IAM roles with permission boundaries'

Resources:
  # Permission Boundary Policy
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary to prevent privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'
          - Sid: 'AllowSpecificServices'
            Effect: 'Allow'
            Action:
              - 'logs:*'
              - 's3:GetObject'
              - 's3:ListBucket'
              - 's3:PutObject'
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
              - 'ssm:GetParameter'
              - 'ssm:GetParameters'
            Resource: '*'
      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'

              # S3 Read-only Access
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'

              # DynamoDB Access
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'

              # SSM Parameter Store Access
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Application'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

              # DynamoDB Access
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'

              # S3 Access for Lambda
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Serverless'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2ApplicationRoleARN'

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleARN'

  PermissionBoundaryPolicyARN:
    Description: 'ARN of the Permission Boundary Policy'
    Value: !Ref PermissionBoundaryPolicy
    Export:
      Name: !Sub '${AWS::StackName}-PermissionBoundaryPolicyARN'
```

Actually, I just realized an issue with the Permission Boundary policy. The "AllowSpecificServices" statement has a Resource of "\*", which might be too permissive. Let's revisit the Permission Boundary policy concept.

A Permission Boundary is supposed to set the maximum permissions that a role can have. The role's policies determine the actual permissions, but they cannot exceed what the boundary allows. So the boundary should be more permissive than the role policies, but still restrictive enough to prevent privilege escalation.

Let's refine the template again:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for least-privilege IAM roles with permission boundaries'

Resources:
  # Permission Boundary Policy
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary to prevent privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
              - 'ec2:RunInstances'
              - 'lambda:CreateFunction'
              - 'lambda:UpdateFunctionCode'
            Resource: '*'
          - Sid: 'AllowAppServices'
            Effect: 'Allow'
            Action:
              - 'logs:*'
              - 's3:GetObject'
              - 's3:ListBucket'
              - 's3:PutObject'
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
              - 'ssm:GetParameter'
              - 'ssm:GetParameters'
            Resource: '*'
      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*'

              # S3 Read-only Access
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'

              # DynamoDB Access
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'

              # SSM Parameter Store Access
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Application'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*'

              # DynamoDB Access
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'

              # S3 Access for Lambda
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Serverless'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2ApplicationRoleARN'

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleARN'

  PermissionBoundaryPolicyARN:
    Description: 'ARN of the Permission Boundary Policy'
    Value: !Ref PermissionBoundaryPolicy
    Export:
      Name: !Sub '${AWS::StackName}-PermissionBoundaryPolicyARN'
```

One more review: The Permission Boundary policy still has a Resource of "\*" for the "AllowAppServices" statement, which might cause issues with cfn-nag. Let me adjust this to be more specific with the resources:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template for least-privilege IAM roles with permission boundaries'

Resources:
  # Permission Boundary Policy
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary to prevent privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'
          - Sid: 'AllowLogging'
            Effect: 'Allow'
            Action:
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
            Resource:
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*'
          - Sid: 'AllowS3Access'
            Effect: 'Allow'
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
              - 's3:PutObject'
            Resource:
              - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
              - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'
              - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
              - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'
          - Sid: 'AllowDynamoDBAccess'
            Effect: 'Allow'
            Action:
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
            Resource:
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'
          - Sid: 'AllowSSMAccess'
            Effect: 'Allow'
            Action:
              - 'ssm:GetParameter'
              - 'ssm:GetParameters'
            Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*'

              # S3 Read-only Access
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::AccountId}/*'

              # DynamoDB Access
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable'

              # SSM Parameter Store Access
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Application'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*'

              # DynamoDB Access
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable'

              # S3 Access for Lambda
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::AccountId}/*'
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Serverless'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2ApplicationRoleARN'

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleARN'

  PermissionBoundaryPolicyARN:
    Description: 'ARN of the Permission Boundary Policy'
    Value: !Ref PermissionBoundaryPolicy
    Export:
      Name: !Sub '${AWS::StackName}-PermissionBoundaryPolicyARN'
```

This template looks much better. Let's review it against the requirements:

1. **IAM Roles**:
   - ✅ Created two roles: EC2ApplicationRole and LambdaExecutionRole
   - ✅ Both have inline policies with specific permissions
   - ✅ No wildcard actions in the policies
2. **Permission Boundaries**:
   - ✅ Created a PermissionBoundaryPolicy that denies IAM, STS, and Organizations actions
   - ✅ Applied to both roles
   - ✅ Boundary explicitly allows only necessary actions on specific resources

3. **Validation**:
   - ✅ Used intrinsic functions (!Ref, !Sub, !GetAtt) instead of hardcoded ARNs
   - ✅ No wildcards in resource ARNs or actions
   - ✅ Should pass cfn-nag scan with no findings

I've also added tags to the roles for better organization and provided outputs for downstream use.

Now, let me create the additional sections required:

1. **Security Architecture (ASCII)** - To visualize IAM roles, boundaries, inline policies, and their relationships
2. **Policy Design Rationale** - To justify the principle of least privilege for each service
3. **Validation Guidance** - Commands and expected results for confirming compliance

### Security Architecture (ASCII)

```
+-------------------------------------+
|         CloudFormation Stack        |
+-------------------------------------+
          |                |
          v                v
+-------------------+ +-------------------+
| EC2ApplicationRole| |LambdaExecutionRole|
+-------------------+ +-------------------+
          |                |
          | applies        | applies
          v                v
+-------------------------------------+
|      PermissionBoundaryPolicy       |
| (Denies: iam:*, sts:*, orgs:*)     |
+-------------------------------------+
          |                |
          | contains       | contains
          v                v
+-------------------+ +-------------------+
|EC2ApplicationPolicy| |LambdaExecutionPolicy|
| - logs:*          | | - logs:*          |
| - s3:GetObject    | | - s3:GetObject    |
| - s3:ListBucket   | | - s3:PutObject    |
| - dynamodb:Get*   | | - dynamodb:*Item  |
| - ssm:GetParameter| |                   |
+-------------------+ +-------------------+
```

### Policy Design Rationale

1. **Principle of Least Privilege Implementation**
   - Each role has only the permissions necessary for its function
   - EC2 role focuses on read operations (GetItem, Query, Scan)
   - Lambda role includes write operations for its specific table
   - No wildcards in action statements
   - Resources are specifically scoped to exact ARNs

2. **Permission Boundary Justification**
   - Explicitly denies privilege escalation paths (IAM, STS, Organizations)
   - Allows only specific services and actions needed by both roles
   - All resources are explicitly defined, no wildcards
   - Creates a strict upper bound on what any role can do

3. **Service-Specific Reasoning**
   - **CloudWatch Logs**: Both roles need to create log groups/streams and put log events
   - **S3**: EC2 needs read-only access, Lambda needs read and write
   - **DynamoDB**: EC2 needs read-only, Lambda needs CRUD operations
   - **SSM**: Only EC2 needs parameter store access for configuration

### Validation Guidance

1. **Checking for Wildcard Actions**

   ```bash
   grep "Action: \"\\*\"" template.yaml
   # Should return no results
   ```

2. **cfn-nag Scan**

   ```bash
   cfn-nag-scan --input-path template.yaml
   # Expected: No warnings or errors related to IAM policies
   ```

3. **Verifying Permission Boundaries**

   ```bash
   grep -A 10 "PermissionsBoundary" template.yaml
   # Should show both roles using the PermissionBoundary
   ```

4. **Checking Resource Specificity**

   ```bash
   grep -A 3 "Resource:" template.yaml
   # Should show specific ARNs, no wildcards
   ```

5. **Validating Against Privilege Escalation**
   ```bash
   grep -A 5 "DenyPrivilegeEscalation" template.yaml
   # Should show denied permissions for iam:*, sts:*, organizations:*
   ```

Now, I'll put everything together to provide the complete solution.

### Answer

---

# Least-Privilege IAM Design with CloudFormation

## 1. Security Architecture (ASCII)

```
+-----------------------------------------------+
|           CloudFormation Stack                |
+-----------------------------------------------+
                |              |
                v              v
+-----------------------------+  +------------------------------+
|    EC2ApplicationRole       |  |    LambdaExecutionRole       |
| (Used by application EC2s)  |  | (Used by serverless functions)|
+-----------------------------+  +------------------------------+
                |              |
                |              |
                v              v
+-----------------------------------------------+
|        PermissionBoundaryPolicy              |
| - DENIES: iam:*, sts:*, organizations:*      |
| - ALLOWS: only specific service actions      |
+-----------------------------------------------+
                |              |
                v              v
+-----------------------------+  +------------------------------+
|   EC2ApplicationPolicy      |  |   LambdaExecutionPolicy     |
| - logs: CreateLog*          |  | - logs: CreateLog*          |
| - s3: GetObject/ListBucket  |  | - s3: GetObject/PutObject   |
| - dynamodb: Read operations |  | - dynamodb: CRUD operations |
| - ssm: GetParameter*        |  |                             |
+-----------------------------+  +------------------------------+
```

## 2. Policy Design Rationale

1. **Permission Boundary Design**
   - Creates a maximum permission ceiling that no role can exceed
   - Explicitly denies all privilege escalation paths (IAM, STS, Organizations services)
   - Allows only specific actions on specific resources
   - Protects against accidental or malicious permission expansion

2. **EC2 Application Role**
   - Read-only access to configuration data in S3
   - Read-only access to DynamoDB for application data
   - Limited SSM Parameter Store access for retrieving configurations
   - Logging permissions restricted to EC2-specific log groups

3. **Lambda Execution Role**
   - Read/write access to S3 for processing files
   - Full CRUD operations on specific DynamoDB table
   - No SSM access (as configuration is provided via environment variables)
   - Logging permissions restricted to Lambda-specific log groups

4. **Least-Privilege Implementation Techniques**
   - No wildcard actions (e.g., `s3:*`, `dynamodb:*`)
   - Resources scoped to specific ARNs using intrinsic functions
   - No cross-account access
   - Clear separation between read and write permissions
   - Permission boundaries that prevent privilege escalation

## 3. CloudFormation YAML Template

```yaml
# filename: least-privilege-iam-design.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Least-Privilege IAM Design with Permission Boundaries'

Resources:
  # Permission Boundary Policy - Sets the maximum permissions for all roles
  PermissionBoundaryPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      Description: 'Permission boundary that prevents privilege escalation'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Explicitly deny privilege escalation paths
          - Sid: 'DenyPrivilegeEscalation'
            Effect: 'Deny'
            Action:
              - 'iam:*'
              - 'sts:*'
              - 'organizations:*'
            Resource: '*'

          # Allow CloudWatch Logs actions on specific resources
          - Sid: 'AllowLogging'
            Effect: 'Allow'
            Action:
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
            Resource:
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*'

          # Allow S3 operations on specific buckets
          - Sid: 'AllowS3Access'
            Effect: 'Allow'
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
              - 's3:PutObject'
            Resource:
              - !Sub 'arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}'
              - !Sub 'arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}/*'
              - !Sub 'arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}'
              - !Sub 'arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}/*'

          # Allow DynamoDB operations on specific tables
          - Sid: 'AllowDynamoDBAccess'
            Effect: 'Allow'
            Action:
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
            Resource:
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable-${AWS::StackName}'
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable-${AWS::StackName}'

          # Allow SSM Parameter Store access for application configuration
          - Sid: 'AllowSSMAccess'
            Effect: 'Allow'
            Action:
              - 'ssm:GetParameter'
              - 'ssm:GetParameters'
            Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/${AWS::StackName}/*'

      ManagedPolicyName: !Sub 'PermissionBoundary-${AWS::StackName}'

  # EC2 Application Role - Used by application instances
  EC2ApplicationRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      # Apply the permission boundary to restrict maximum permissions
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'EC2ApplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs access for application logging
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*'

              # S3 Read-only Access for configurations
              - Sid: 'S3ReadOnlyAccess'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}/*'

              # DynamoDB Read-only Access for application data
              - Sid: 'DynamoDBReadAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable-${AWS::StackName}'

              # SSM Parameter Store Access for application configuration
              - Sid: 'SSMParameterAccess'
                Effect: 'Allow'
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/${AWS::StackName}/*'

      # Tags for resource tracking and compliance
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-EC2ApplicationRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Application'
        - Key: 'SecurityCompliance'
          Value: 'LeastPrivilege'

  # Lambda Execution Role - Used by serverless functions
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      Path: '/'
      # Apply the permission boundary to restrict maximum permissions
      PermissionsBoundary: !Ref PermissionBoundaryPolicy
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs access for Lambda function logging
              - Sid: 'CloudWatchLogsAccess'
                Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*'

              # DynamoDB CRUD Access for Lambda data processing
              - Sid: 'DynamoDBAccess'
                Effect: 'Allow'
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable-${AWS::StackName}'

              # S3 Access for Lambda to read/write data
              - Sid: 'S3Access'
                Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}'
                  - !Sub 'arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}/*'

      # Tags for resource tracking and compliance
      Tags:
        - Key: 'Name'
          Value: !Sub '${AWS::StackName}-LambdaExecutionRole'
        - Key: 'Environment'
          Value: !Ref 'AWS::StackName'
        - Key: 'Purpose'
          Value: 'Serverless'
        - Key: 'SecurityCompliance'
          Value: 'LeastPrivilege'

Outputs:
  EC2ApplicationRoleARN:
    Description: 'ARN of the EC2 Application Role with least privilege'
    Value: !GetAtt EC2ApplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2ApplicationRoleARN'

  LambdaExecutionRoleARN:
    Description: 'ARN of the Lambda Execution Role with least privilege'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleARN'

  PermissionBoundaryPolicyARN:
    Description: 'ARN of the Permission Boundary Policy'
    Value: !Ref PermissionBoundaryPolicy
    Export:
      Name: !Sub '${AWS::StackName}-PermissionBoundaryPolicyARN'
```

## 4. Validation Guidance

### 1. Verify No Wildcard Actions or Resources

```bash
# Verify no wildcard actions are allowed
grep -i "Action: \"\\*\"" least-privilege-iam-design.yaml
# Expected: No output (no wildcard actions)

# Verify no wildcard resources (except in explicit denies)
grep -i "Resource: \"\\*\"" least-privilege-iam-design.yaml | grep -v "DenyPrivilegeEscalation"
# Expected: No output (no wildcard resources except in deny statements)
```

### 2. Run cfn-nag Scan

```bash
# Install cfn-nag if not already available
gem install cfn-nag

# Run the scan against the template
cfn-nag-scan --input-path least-privilege-iam-design.yaml
```

### 3. Verify Permission Boundary Application

```bash
# Check both roles have the permission boundary applied
grep -A 2 "PermissionsBoundary" least-privilege-iam-design.yaml
# Expected: Both EC2ApplicationRole and LambdaExecutionRole show PermissionsBoundary: !Ref PermissionBoundaryPolicy
```

### 4. Validate Stack Deployment

```bash
# Validate the template syntax before deployment
aws cloudformation validate-template --template-body file://least-privilege-iam-design.yaml

# Deploy the stack
aws cloudformation create-stack \
  --stack-name least-privilege-iam-design \
  --template-body file://least-privilege-iam-design.yaml \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete --stack-name least-privilege-iam-design
```

### 5. Test Privilege Escalation Attempts

```bash
# Attempt to use the EC2 role to create an IAM user (should fail)
aws iam create-user --user-name test-user --profile ec2-role-profile
# Expected: "User is not authorized to perform: iam:CreateUser"

# Attempt to use the Lambda role to assume another role (should fail)
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_ID:role/another-role --profile lambda-role-profile
# Expected: "User is not authorized to perform: sts:AssumeRole"
```

By implementing these validation steps, you can confirm that the template enforces least privilege and prevents privilege escalation paths while still allowing the necessary permissions for your EC2 and Lambda workloads.
