# Common Model Failures in CloudFormation Template Generation

## Overview

This document catalogs common failure patterns, mistakes, and anti-patterns that AI models make when generating CloudFormation templates. Understanding these failures helps improve model training and provides guidance for manual review.

## Critical Failures

### 1. Hardcoded Values

**Problem:** Models frequently hardcode values that should be dynamic or parameterized.

**Examples:**

```yaml
# WRONG - Hardcoded AMI ID
ImageId: ami-0c55b159cbfafe1f0

# WRONG - Hardcoded account ID
RoleArn: arn:aws:iam::123456789012:role/MyRole

# WRONG - Hardcoded region
S3Bucket: my-bucket-us-east-1

# CORRECT - Use parameters or dynamic references
ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
RoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/MyRole'
S3Bucket: !Sub 'my-bucket-${AWS::Region}'
```

**Impact:** Templates fail when deployed to different accounts/regions.

### 2. Circular Dependencies

**Problem:** Models create circular dependencies between resources, especially with Auto Scaling Groups and Target Groups.

**Examples:**

```yaml
# WRONG - Circular dependency
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Targets:
      - Id: !Ref AutoScalingGroup  # References ASG

AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    TargetGroupARNs:
      - !Ref TargetGroup  # References TG - CIRCULAR!

# CORRECT - Use DependsOn
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  DependsOn: TargetGroup
  Properties:
    TargetGroupARNs:
      - !Ref TargetGroup
```

**Impact:** Stack creation fails with circular dependency error.

### 3. Missing Required Properties

**Problem:** Models omit required properties or use incorrect property names.

**Examples:**

```yaml
# WRONG - Missing VpcId in TargetGroup
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Port: 80
    Protocol: HTTP
    # Missing VpcId!

# WRONG - Incorrect property name
LaunchTemplate:
  Properties:
    AMI: ami-12345  # Should be ImageId

# CORRECT
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Port: 80
    Protocol: HTTP
    VpcId: !Ref VpcId
```

**Impact:** Stack creation fails with validation errors.

## Major Failures

### 4. Improper Use of Intrinsic Functions

**Problem:** Models misuse or nest intrinsic functions incorrectly.

**Examples:**

```yaml
# WRONG - Incorrect Fn::Sub syntax
Name: !Sub '${ProjectName}-${!Ref Environment}'  # Can't use !Ref inside !Sub

# WRONG - Unnecessary Fn::Join
Name: !Join ['-', [!Ref ProjectName, !Ref Environment]]

# WRONG - Invalid nesting
Value: !Ref !GetAtt MyResource.Arn

# CORRECT
Name: !Sub '${ProjectName}-${Environment}'  # Fn::Sub handles both Refs and GetAtts
Value: !GetAtt MyResource.Arn
```

**Impact:** Template syntax errors or unexpected behavior.

### 5. Security Group Configuration Errors

**Problem:** Models create overly permissive or redundant security groups.

**Examples:**

```yaml
# WRONG - Too permissive
SecurityGroupIngress:
  - IpProtocol: -1
    CidrIp: 0.0.0.0/0 # Allows all traffic from anywhere

# WRONG - Redundant security groups
WebServerSG1:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0

WebServerSG2: # Duplicate functionality
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0

# CORRECT - Consolidated and specific
ApplicationSG:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS from internet
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref ALBSG
        Description: HTTP from ALB only
```

**Impact:** Security vulnerabilities or unnecessary resource proliferation.

### 6. Missing Deletion and Update Policies

**Problem:** Models forget to add DeletionPolicy and UpdateReplacePolicy for stateful resources.

**Examples:**

```yaml
# WRONG - No protection for database
Database:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: postgres
  # Missing DeletionPolicy and UpdateReplacePolicy!

# CORRECT
Database:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: postgres
  DeletionPolicy: Snapshot
  UpdateReplacePolicy: Snapshot
```

**Impact:** Accidental data loss during stack updates or deletions.

### 7. Inadequate Tagging

**Problem:** Models apply inconsistent or incomplete tagging.

**Examples:**

```yaml
# WRONG - No tags or inconsistent tags
Resource1:
  Type: AWS::EC2::Instance
  Properties:
    Tags:
      - Key: Name
        Value: MyInstance
  # Missing Environment, Project, Owner, iac-rlhf-amazon tags

Resource2:
  Type: AWS::S3::Bucket
  # No tags at all!

# CORRECT - Consistent tagging
Resource:
  Type: AWS::EC2::Instance
  Properties:
    Tags:
      - Key: Name
        Value: !Sub '${ProjectName}-${Environment}-instance'
      - Key: Environment
        Value: !Ref Environment
      - Key: Project
        Value: !Ref ProjectName
      - Key: Owner
        Value: !Ref Owner
      - Key: iac-rlhf-amazon
        Value: 'true'
```

**Impact:** Poor cost tracking, governance, and resource management.

## Moderate Failures

### 8. Inefficient UserData Scripts

**Problem:** Models use nested Fn::Join instead of clean Fn::Sub.

**Examples:**

```yaml
# WRONG - Nested Fn::Join (hard to read)
UserData:
  Fn::Base64:
    Fn::Join:
      - ''
      - - '#!/bin/bash\n'
        - 'echo "Environment: '
        - !Ref Environment
        - '"\n'
        - 'echo "Region: '
        - !Ref 'AWS::Region'
        - '"\n'

# CORRECT - Clean Fn::Sub
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    echo "Environment: ${Environment}"
    echo "Region: ${AWS::Region}"
```

**Impact:** Poor readability and maintainability.

### 9. Missing Conditions for Optional Resources

**Problem:** Models create resources unconditionally when they should be optional.

**Examples:**

```yaml
# WRONG - CloudWatch alarms always created
HighCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: high-cpu
    # Always created even if monitoring is disabled

# CORRECT - Use conditions
Conditions:
  CreateAlarms: !Equals [!Ref EnableMonitoring, 'Yes']

HighCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Condition: CreateAlarms
  Properties:
    AlarmName: high-cpu
```

**Impact:** Unwanted resources created, increased costs.

### 10. Poor Parameter Validation

**Problem:** Models don't add constraints to parameters.

**Examples:**

```yaml
# WRONG - No validation
Parameters:
  InstanceType:
    Type: String
    # Any value accepted!

  Environment:
    Type: String
    # No allowed values or pattern

# CORRECT - With validation
Parameters:
  InstanceType:
    Type: String
    AllowedValues:
      - t3.small
      - t3.medium
      - t3.large
    Default: t3.medium

  Environment:
    Type: String
    AllowedPattern: '^(dev|staging|prod)$'
    ConstraintDescription: Must be dev, staging, or prod
```

**Impact:** Invalid values can break deployments.

### 11. Incorrect Health Check Configuration

**Problem:** Models set unrealistic health check thresholds.

**Examples:**

```yaml
# WRONG - Too aggressive (will mark instances unhealthy too quickly)
HealthCheckIntervalSeconds: 5
HealthCheckTimeoutSeconds: 2
HealthyThresholdCount: 1
UnhealthyThresholdCount: 1

# WRONG - Too lenient (won't detect failures quickly)
HealthCheckIntervalSeconds: 300
UnhealthyThresholdCount: 10

# CORRECT - Balanced settings
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
```

**Impact:** Instance flapping or slow failure detection.

### 12. Missing Metadata Organization

**Problem:** Models don't use AWS::CloudFormation::Interface metadata.

**Examples:**

```yaml
# WRONG - Parameters in random order, no grouping
Parameters:
  VpcId: ...
  InstanceType: ...
  Environment: ...
  KeyPair: ...

# CORRECT - Organized with metadata
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcId
          - SubnetId
      - Label:
          default: 'Instance Configuration'
        Parameters:
          - InstanceType
          - KeyPair
```

**Impact:** Poor user experience in console.

## Minor Failures

### 13. Inconsistent Naming Conventions

**Problem:** Models use different naming patterns for resources.

**Examples:**

```yaml
# WRONG - Inconsistent
MyVPC: # PascalCase resource name
MySecurityGroup: # Different pattern
  Properties:
    GroupName: my-app-sg # kebab-case
my_bucket: # snake_case
  Properties:
    BucketName: MyAppBucket123 # PascalCase + number

# CORRECT - Consistent
ApplicationVPC:
  Properties:
    Tags:
      - Key: Name
        Value: !Sub '${ProjectName}-${Environment}-vpc'

ApplicationSecurityGroup:
  Properties:
    GroupName: !Sub '${ProjectName}-${Environment}-sg'

ApplicationBucket:
  Properties:
    BucketName: !Sub '${ProjectName}-${Environment}-bucket-${AWS::AccountId}'
```

**Impact:** Confusion and maintenance difficulties.

### 14. Missing or Incorrect Outputs

**Problem:** Models don't export useful outputs or use wrong export names.

**Examples:**

```yaml
# WRONG - No exports
Outputs:
  ALBDNS:
    Value: !GetAtt ALB.DNSName
  # No Export!

# WRONG - Non-unique export names
Outputs:
  VPCId:
    Value: !Ref VPC
    Export:
      Name: VPCId  # Will conflict across stacks

# CORRECT - Proper exports with unique names
Outputs:
  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
```

**Impact:** Difficulty with cross-stack references.

### 15. Incorrect Auto Scaling Configuration

**Problem:** Models misconfigure Auto Scaling policies or update strategies.

**Examples:**

```yaml
# WRONG - No update policy
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    MinSize: 2
    MaxSize: 4
  # Missing UpdatePolicy!

# WRONG - No creation policy for resource signals
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  # UserData sends cfn-signal but no CreationPolicy!

# CORRECT
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    MinSize: 2
    MaxSize: 4
  CreationPolicy:
    ResourceSignal:
      Count: 2
      Timeout: PT15M
  UpdatePolicy:
    AutoScalingRollingUpdate:
      MinInstancesInService: 1
      MaxBatchSize: 2
      PauseTime: PT5M
      WaitOnResourceSignals: true
```

**Impact:** Failed updates or incomplete deployments.

## Training Recommendations

### For Model Improvement:

1. **Penalize Hardcoding:** Strong negative signal for any hardcoded account IDs, regions, or AMI IDs
2. **Reward Parameterization:** Positive reinforcement for proper use of parameters and intrinsic functions
3. **Enforce Security:** Require least-privilege security groups and proper IAM roles
4. **Mandate Tagging:** All resources must have consistent, comprehensive tags
5. **Check Dependencies:** Validate no circular dependencies in resource graph
6. **Require Validation:** All parameters should have constraints
7. **Test Cross-Account:** Templates must work across different AWS accounts
8. **Verify Readability:** Prefer Fn::Sub over nested Fn::Join
9. **Include Metadata:** AWS::CloudFormation::Interface should organize parameters
10. **Add Protection:** Stateful resources need deletion/update policies

### Red Flags for Review:

- Any `ami-*` string literal
- Any 12-digit number (potential account ID)
- Security groups allowing 0.0.0.0/0 on non-standard ports
- Resources without tags
- Missing DeletionPolicy on databases/storage
- Fn::Join with more than 2 levels of nesting
- Parameters without constraints
- Outputs without exports
- Auto Scaling without update policies
- UserData without error handling
