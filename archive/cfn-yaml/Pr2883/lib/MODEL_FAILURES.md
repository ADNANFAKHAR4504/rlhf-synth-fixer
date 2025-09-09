# Fixes Implemented in TapStack.yml

This document highlights the fixes applied to the CloudFormation `TapStack.yml` file, detailing the differences between the original and updated implementations.

## **1. Removal of Hardcoded Availability Zones**
- **Before**: Subnets had hardcoded Availability Zones (`us-east-1a`, `us-east-1b`), reducing portability across regions.
- **After**: Replaced with dynamic references using `!GetAZs` for better reusability.

**Implemented Fix:**
```yaml
Resources:
  ProdEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      # other properties...

  ProdEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      # other properties...
```

## **2. Consolidated Private Route Tables**
- **Before**: Two separate private route tables were used, increasing resource count unnecessarily.
- **After**: Consolidated into a single private route table associated with both private subnets.

**Implemented Fix:**
```yaml
# Route Table
ProdEnvPrivateRouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId: !Ref ProdEnvVPC
    Tags:
      - Key: Name
        Value: ProdEnvPrivateRouteTable

# Route Table Associations
ProdEnvPrivateSubnetRouteTableAssociation1:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref ProdEnvPrivateSubnet1
    RouteTableId: !Ref ProdEnvPrivateRouteTable

ProdEnvPrivateSubnetRouteTableAssociation2:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref ProdEnvPrivateSubnet2
    RouteTableId: !Ref ProdEnvPrivateRouteTable
```

## **3. Added DeletionPolicy to S3 Bucket**
- **Before**: The S3 bucket `ProdEnvDataBucket` lacked a `DeletionPolicy`, risking data loss on stack deletion.
- **After**: Added retention policies to preserve bucket data.

**Implemented Fix:**
```yaml
ProdEnvDataBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    # bucket properties here...
```

## **4. Cleaned Up UserData Fn::Sub**
- **Before**: `Fn::Sub` was unnecessarily used in static `UserData`, triggering lint warnings.
- **After**: Simplified by removing `Fn::Sub` for static content.

**Implemented Fix:**
```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    echo "Launching instance in Production"
```

## **5. CAPABILITY_IAM Fix**
- **Before**: IAM roles and groups used `RoleName` and `GroupName`, requiring `CAPABILITY_NAMED_IAM`.
- **After**: Removed explicit names to ensure compatibility with `CAPABILITY_IAM`.

**Implemented Fix:**
```yaml
# Removed RoleName and GroupName properties from IAM roles and groups
# No explicit code change required; auto-generated names are used
```

## **6. Automated Key Pair Creation**
- **Before**: Required manual `ProdEnvKeyPairName` parameter, breaking automation.
- **After**: Automatically creates and references a key pair within the template.

**Implemented Fix:**
```yaml
ProdEnvKeyPair:
  Type: AWS::EC2::KeyPair
  Properties:
    KeyName: ProdEnv-KeyPair

# Reference in EC2 instances
KeyName: !Ref ProdEnvKeyPair
```

## **7. Restricted Security Group Egress**
- **Before**: Security group allowed all outbound traffic with `IpProtocol: -1`.
- **After**: Restricted egress to specific services using prefix lists.

**Implemented Fix:**
```yaml
SecurityGroupEgress:
  - IpProtocol: tcp
    FromPort: 443
    ToPort: 443
    DestinationPrefixListId: !Ref S3VPCEndpointPrefix
```

## **8. Replaced Hardcoded AMI with SSM Parameter**
- **Before**: Hardcoded AMI ID (`ami-0c02fb55956c7d316`), reducing portability.
- **After**: Uses SSM Parameter Store for dynamic AMI retrieval.

**Implemented Fix:**
```yaml
Parameters:
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64

# Inside EC2
ImageId: !Ref LatestAmiId
```

## **9. Added VPC Endpoints**
- **Before**: No private endpoints, requiring internet access for S3 and CloudWatch.
- **After**: Added S3 and CloudWatch VPC endpoints for private communication.

**Implemented Fix:**
```yaml
S3VPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
    VpcId: !Ref ProdEnvVPC
    RouteTableIds:
      - !Ref ProdEnvPrivateRouteTable

CloudWatchVPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.logs"
    VpcId: !Ref ProdEnvVPC
    VpcEndpointType: Interface
    SubnetIds:
      - !Ref ProdEnvPrivateSubnet1
      - !Ref ProdEnvPrivateSubnet2
    SecurityGroupIds:
      - !Ref ProdEnvSecurityGroup
```

## **10. Custom CloudWatch Agent Configuration**
- **Before**: Used default CloudWatch agent configuration (`-c default`).
- **After**: Implemented custom JSON configuration for logs and metrics.

**Implemented Fix:**
```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    yum install -y amazon-cloudwatch-agent
    cat > /opt/aws/amazon-cloudwatch-agent/bin/config.json <<EOF
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "/prod/app/messages",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      }
    }
    EOF
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a start -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
```