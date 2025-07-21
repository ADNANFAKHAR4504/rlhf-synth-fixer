To achieve the objective of migrating an existing cloud infrastructure to AWS CloudFormation using YAML format, we need to follow a structured approach. Below is a step-by-step guide and example templates to meet the specified requirements.

### Step-by-Step Guide

1. **Identify Logical Components**: Break down the infrastructure into logical components such as networking, compute, database, and IAM.

2. **Create Separate YAML Files**: Each logical component will have its own CloudFormation stack defined in a separate YAML file.

3. **Define Parameters and Outputs**: Use parameters for configurable values and outputs to export values needed by other stacks.

4. **Establish Dependencies**: Use `Export`/`ImportValue` and `DependsOn` to manage stack dependencies.

### Example Templates

#### 1. Networking Stack (`networking.yaml`)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Networking stack for VPC, subnets, and internet gateway

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix (e.g., dev, prod)

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: !Sub VPC-${EnvironmentSuffix}

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

Outputs:
  VPCId:
    Description: The ID of the VPC
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPCId
```

#### 2. Compute Stack (`compute.yaml`)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Compute stack for EC2 instances

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix (e.g., dev, prod)
  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair

Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: ami-0abcdef1234567890 # Example AMI ID
      SubnetId: 
        Fn::ImportValue: 
          !Sub "networking-${EnvironmentSuffix}-VPCId"
      Tags:
        - Key: Name
          Value: !Sub EC2-Instance-${EnvironmentSuffix}

Outputs:
  InstanceId:
    Description: The ID of the EC2 instance
    Value: !Ref EC2Instance
```

#### 3. IAM Stack (`iam.yaml`)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: IAM stack for roles and policies

Resources:
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EC2S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: "*"

Outputs:
  EC2InstanceRoleArn:
    Description: ARN of the EC2 instance role
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub ${AWS::StackName}-EC2InstanceRoleArn
```

#### 4. S3 Logging Stack (`logging.yaml`)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: S3 bucket for CloudFormation logging

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix (e.g., dev, prod)

Resources:
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub cfn-logs-${EnvironmentSuffix}
      VersioningConfiguration:
        Status: Enabled

Outputs:
  LoggingBucketName:
    Description: Name of the S3 bucket for logging
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub ${AWS::StackName}-LoggingBucketName
```

### Deployment Steps

1. **Deploy Networking Stack**:
   ```bash
   aws cloudformation deploy --template-file networking.yaml --stack-name networking-dev --parameter-overrides EnvironmentSuffix=dev --region us-east-1
   ```

2. **Deploy IAM Stack**:
   ```bash
   aws cloudformation deploy --template-file iam.yaml --stack-name iam-dev --region us-east-1
   ```

3. **Deploy Logging Stack**:
   ```bash
   aws cloudformation deploy --template-file logging.yaml --stack-name logging-dev --parameter-overrides EnvironmentSuffix=dev --region us-east-1
   ```

4. **Deploy Compute Stack**:
   ```bash
   aws cloudformation deploy --template-file compute.yaml --stack-name compute-dev --parameter-overrides EnvironmentSuffix=dev InstanceType=t3.micro KeyName=my-key-pair --region us-east-1
   ```

### Conclusion

By following this modular approach, you can effectively migrate your infrastructure to AWS CloudFormation, ensuring logical separation, maintainability, and adherence to best practices for security and cost-efficiency. Each stack is parameterized to allow flexibility and reusability, and dependencies are managed using CloudFormation's intrinsic functions.