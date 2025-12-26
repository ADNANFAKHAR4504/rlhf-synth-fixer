# Issues Identified and Recommendations

This document lists the issues found and the optimizations recommended for the CloudFormation `TapStack.yml` file based on the current implementation.

## **1. Hardcoded Availability Zones**
- **Issue**: The Availability Zones (`us-east-1a`, `us-east-1b`) for the subnets are hardcoded, which reduces template portability and reusability across regions.
- **Recommendation**: Use `!GetAZs` with `!Select` to dynamically obtain Availability Zones.

**Recommended Fix:**
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

## **2. Redundant Route Tables**
- **Issue** : Two identical private route tables are present, which is unnecessary and increases resource count.

- **Recommendation** : Use a single route table and associate it with both private subnets.

**Recommended Fix** :

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

## **3. Missing DeletionPolicy for S3 Bucket**
- **Issue** : The S3 bucket ProdEnvDataBucket does not have a DeletionPolicy, meaning the bucket and its data will be deleted along with the stack.

- **Recommendation** : Add DeletionPolicy: Retain (and optionally UpdateReplacePolicy: Retain) to preserve bucket data.

**Recommended Fix**:

```yaml
ProdEnvDataBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain
  UpdateReplacePolicy: Retain
  Properties:
    # bucket properties here...
```

## **4. Unnecessary Use of Fn::Sub in UserData**
- **Issue** : Lint warnings such as W1020 'Fn::Sub' isn't needed because there are no variables at lines like lib/TapStack.yml:220:9 and lib/TapStack.yml:244:9. Unnecessary use of Fn::Sub in UserData.

- **Recommendation** : Remove the Fn::Sub wrapper around static UserData content.

**Recommended Fix** :

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    echo "Launching instance in Production"
```

## **5. CAPABILITY_IAM Compatibility Issue**
- **Issue** : `InsufficientCapabilitiesException: Requires capabilities : [CAPABILITY_NAMED_IAM]`
- **Recommended Fix** : Removed `RoleName` and `GroupName` properties to use auto-generated names compatible with `CAPABILITY_IAM`

## **6. Replace Manual KeyPair Parameter with Auto-Created Key**
- **Issue** : The template currently requires a ProdEnvKeyPairName parameter, forcing the user to manually supply a key pair name at deployment time. This breaks full automation and causes errors like ProdEnvKeyPairName must have values.
- **Recommended** : Remove the manual KeyPair parameter and instead create a KeyPair in the template using AWS::EC2::KeyPair. Reference this dynamically created key in EC2 instances using KeyName: !Ref ProdEnvKeyPair.

**Recommended Fix** :

```yaml
# Delete this parameter block entirely:
# ProdEnvKeyPairName:
#   Type: AWS::EC2::KeyPair::KeyName
#   Description: EC2 Key Pair for SSH access to instances

# Add this CloudFormation resource:
ProdEnvKeyPair:
  Type: AWS::EC2::KeyPair
  Properties:
    KeyName: ProdEnv-KeyPair

# Then reference it inside each EC2 instance:
KeyName: !Ref ProdEnvKeyPair
```

## **7. Security Group Allows Unrestricted Egress**
- **Issue**: The security group uses `IpProtocol: -1` with `CidrIp: 10.0.0.0/16`, which allows all outbound traffic. This violates least-privilege and is overly permissive.
- **Recommended**: Restrict egress specifically to only the ports and services required (e.g., HTTPS 443 for S3 and CloudWatch VPC endpoints).

**Recommended Fix**:

```yaml
SecurityGroupEgress:
  - IpProtocol: tcp
    FromPort: 443
    ToPort: 443
    DestinationPrefixListId: !Ref S3VPCEndpointPrefix
  - IpProtocol: tcp
    FromPort: 443
    ToPort: 443
    DestinationPrefixListId: !Ref CloudWatchVPCEndpointPrefix
```

## **8. AMI Hardcoding**
- **Issue**: The template hardcodes the AMI ID (ami-0c02fb55956c7d316) in two places, which makes the stack less portable and requires manual updates when the image becomes outdated.
- **Recommended**: Replace the hardcoded AMI with a parameter or SSM Parameter Store reference, ensuring automation and future-proofing.

**Recommended Fix**:

```yaml
Parameters:
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64

# inside EC2:
ImageId: !Ref LatestAmiId
```

## **9. Missing VPC Endpoints for S3 / CloudWatch **

- **Issue**: The stack creates a private VPC but still relies on internet access for CloudWatch logs and S3 traffic, which breaks the goal of a fully private network.
- **Recommended**: Add VPC endpoints for S3 and CloudWatch so EC2 instances can communicate privately without an internet gateway or NAT.

**Recommended Fix**:

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

## **10. Default CloudWatch Agent Configuration **

- **Issue**: The UserData section for EC2 instances uses the default CloudWatch agent settings via -c default, which does not collect custom application or OS-level metrics.
- **Recommended**: Replace the default config with a custom CloudWatch agent JSON that collects logs or metrics such as /var/log/messages, CPU, memory, etc.

**Recommended Fix**:

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