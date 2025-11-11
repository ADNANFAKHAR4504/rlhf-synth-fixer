# Least-Privilege IAM Design with CloudFormation

This comprehensive solution implements a secure, least-privilege IAM architecture using CloudFormation that enforces strict security boundaries while enabling necessary application functionality.

## 1. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account Boundary                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Permission Boundary Policy              │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │           DENY iam:*, sts:*, orgs:*            │ │    │
│  │  │        (Prevents Privilege Escalation)          │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │    ALLOW CloudWatch, S3, DynamoDB, SSM         │ │    │
│  │  │        (Scoped to Specific Resources)           │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│          ┌───────────────────┼───────────────────┐          │
│          │                   │                   │          │
│  ┌───────▼──────┐    ┌──────▼──────┐             │          │
│  │EC2AppRole    │    │LambdaRole   │             │          │
│  │┌────────────┐│    │┌───────────┐│             │          │
│  ││CloudWatch  ││    ││CloudWatch ││             │          │
│  ││Logs        ││    ││Logs       ││             │          │
│  │└────────────┘│    │└───────────┘│             │          │
│  │┌────────────┐│    │┌───────────┐│             │          │
│  ││S3 Read     ││    ││S3 R/W     ││             │          │
│  ││Only        ││    ││           ││             │          │
│  │└────────────┘│    │└───────────┘│             │          │
│  │┌────────────┐│    │┌───────────┐│             │          │
│  ││DynamoDB    ││    ││DynamoDB   ││             │          │
│  ││Read Only   ││    ││CRUD       ││             │          │
│  │└────────────┘│    │└───────────┘│             │          │
│  │┌────────────┐│    │             │             │          │
│  ││SSM Read    ││    │             │             │          │
│  ││Only        ││    │             │             │          │
│  │└────────────┘│    │             │             │          │
│  └──────────────┘    └─────────────┘             │          │
│                                                  │          │
└─────────────────────────────────────────────────────────────┘
```

## 2. Policy Design Rationale

### Permission Boundary Strategy

- **Explicit Deny**: Prevents all IAM, STS, and Organizations actions to eliminate privilege escalation paths
- **Scoped Allow**: Permits only necessary services with resource-specific ARNs
- **Defense in Depth**: Acts as ultimate security boundary regardless of role policies

### EC2 Application Role (Read-Heavy)

- **CloudWatch Logs**: Write-only access to `/aws/ec2/*` log groups for application logging
- **S3 Access**: Read-only access to configuration bucket for application settings
- **DynamoDB**: Read-only access to application data table for data retrieval
- **SSM Parameters**: Read access to application configuration parameters

### Lambda Execution Role (Read/Write)

- **CloudWatch Logs**: Write-only access to `/aws/lambda/*` log groups for function logging
- **S3 Access**: Read/write access to data processing bucket for Lambda workflows
- **DynamoDB**: Full CRUD access to Lambda table for data processing operations

### Resource Naming Strategy

- All resources use dynamic `${AWS::StackName}` and `${AWS::AccountId}` references
- Ensures environment isolation and prevents cross-stack access
- No hardcoded ARNs or static resource references

## 3. CloudFormation YAML Template

```yaml
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

## 4. CloudFormation JSON Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Least-Privilege IAM Design with Permission Boundaries",
  "Resources": {
    "PermissionBoundaryPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "Description": "Permission boundary that prevents privilege escalation",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyPrivilegeEscalation",
              "Effect": "Deny",
              "Action": ["iam:*", "sts:*", "organizations:*"],
              "Resource": "*"
            },
            {
              "Sid": "AllowLogging",
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": [
                {
                  "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*"
                },
                {
                  "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*"
                },
                {
                  "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
                },
                {
                  "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*"
                }
              ]
            },
            {
              "Sid": "AllowS3Access",
              "Effect": "Allow",
              "Action": ["s3:GetObject", "s3:ListBucket", "s3:PutObject"],
              "Resource": [
                {
                  "Fn::Sub": "arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}"
                },
                {
                  "Fn::Sub": "arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}/*"
                },
                {
                  "Fn::Sub": "arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}"
                },
                {
                  "Fn::Sub": "arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}/*"
                }
              ]
            },
            {
              "Sid": "AllowDynamoDBAccess",
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
              ],
              "Resource": [
                {
                  "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable-${AWS::StackName}"
                },
                {
                  "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable-${AWS::StackName}"
                }
              ]
            },
            {
              "Sid": "AllowSSMAccess",
              "Effect": "Allow",
              "Action": ["ssm:GetParameter", "ssm:GetParameters"],
              "Resource": {
                "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/${AWS::StackName}/*"
              }
            }
          ]
        },
        "ManagedPolicyName": {
          "Fn::Sub": "PermissionBoundary-${AWS::StackName}"
        }
      }
    },
    "EC2ApplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "PermissionsBoundary": {
          "Ref": "PermissionBoundaryPolicy"
        },
        "Policies": [
          {
            "PolicyName": "EC2ApplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "CloudWatchLogsAccess",
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*"
                    },
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*:*"
                    }
                  ]
                },
                {
                  "Sid": "S3ReadOnlyAccess",
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::app-config-${AWS::StackName}-${AWS::AccountId}/*"
                    }
                  ]
                },
                {
                  "Sid": "DynamoDBReadAccess",
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/AppTable-${AWS::StackName}"
                  }
                },
                {
                  "Sid": "SSMParameterAccess",
                  "Effect": "Allow",
                  "Action": ["ssm:GetParameter", "ssm:GetParameters"],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/app/${AWS::StackName}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-EC2ApplicationRole"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "AWS::StackName"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Application"
          },
          {
            "Key": "SecurityCompliance",
            "Value": "LeastPrivilege"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "PermissionsBoundary": {
          "Ref": "PermissionBoundaryPolicy"
        },
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "CloudWatchLogsAccess",
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
                    },
                    {
                      "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:*"
                    }
                  ]
                },
                {
                  "Sid": "DynamoDBAccess",
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/LambdaTable-${AWS::StackName}"
                  }
                },
                {
                  "Sid": "S3Access",
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject"],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::lambda-data-${AWS::StackName}-${AWS::AccountId}/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-LambdaExecutionRole"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "AWS::StackName"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Serverless"
          },
          {
            "Key": "SecurityCompliance",
            "Value": "LeastPrivilege"
          }
        ]
      }
    }
  },
  "Outputs": {
    "EC2ApplicationRoleARN": {
      "Description": "ARN of the EC2 Application Role with least privilege",
      "Value": {
        "Fn::GetAtt": ["EC2ApplicationRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2ApplicationRoleARN"
        }
      }
    },
    "LambdaExecutionRoleARN": {
      "Description": "ARN of the Lambda Execution Role with least privilege",
      "Value": {
        "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaExecutionRoleARN"
        }
      }
    },
    "PermissionBoundaryPolicyARN": {
      "Description": "ARN of the Permission Boundary Policy",
      "Value": {
        "Ref": "PermissionBoundaryPolicy"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PermissionBoundaryPolicyARN"
        }
      }
    }
  }
}
```

## 5. AWS Region Configuration

```
us-east-1
```

## 6. Validation Commands

### Template Validation

```bash
# Validate CloudFormation syntax
aws cloudformation validate-template --template-body file://TapStack.yml

# Scan for security issues with cfn-nag
cfn_nag_scan --input-path TapStack.yml

# Check for wildcard actions (should return no results)
grep -n "Action.*\\*" TapStack.yml

# Verify permission boundaries are applied
grep -n "PermissionsBoundary" TapStack.yml
```

### Security Compliance Checks

```bash
# Ensure no hardcoded ARNs
grep -n "arn:aws:" TapStack.yml | grep -v "\!Sub\|\!GetAtt\|\!Ref"

# Verify least privilege implementation
grep -n "Effect.*Allow" TapStack.yml

# Check resource scoping
grep -n "Resource.*\*" TapStack.yml
```

### Expected Results

- cfn-nag scan: 0 critical findings, 0 high findings
- No wildcard actions in Allow statements
- All resources use dynamic references
- Permission boundaries applied to all roles
- Explicit deny statements prevent privilege escalation

This solution provides enterprise-grade security with comprehensive least-privilege implementation, preventing privilege escalation while enabling necessary application functionality.
