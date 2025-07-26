# Model Generated CloudFormation Template

This is a **model-generated response** to the CloudFormation template prompt. This example shows a typical AI model output with some issues that need to be addressed.

## Template Analysis
- **Quality**: Good structure but has some issues
- **Completeness**: Missing some required elements
- **Best Practices**: Some violations of CloudFormation best practices

## Issues Identified

### ❌ **Critical Issues**
1. **Hardcoded Availability Zones**: Uses `us-east-1a` and `us-east-1b` instead of dynamic selection
2. **Missing AMI Mappings**: No mappings section for regional AMI IDs
3. **Missing DependsOn**: Route creation might fail without proper dependencies
4. **Incomplete Template**: Template appears to be cut off

### ⚠️ **Minor Issues**
1. **Inconsistent Quotes**: Mix of single and no quotes in YAML
2. **Missing Route Table Associations**: Subnets not properly associated with route table
3. **Security Group Configuration**: May need more specific configuration

## Model Generated Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Basic development environment setup with VPC, subnets, EC2 instances, and security groups.

Parameters:
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access
    Type: 'AWS::EC2::KeyPair::KeyName'
    ConstraintDescription: Must be the name of an existing EC2 KeyPair.

Resources:
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: Development

  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-east-1a  # ❌ HARDCODED AZ
      Tags:
        - Key: Environment
          Value: Development

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: us-east-1b  # ❌ HARDCODED AZ
      Tags:
        - Key: Environment
          Value: Development

  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Environment
          Value: Development

  VPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  PublicRoute:
    Type: 'AWS::EC2::Route'
    # ❌ MISSING: DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # ❌ MISSING: Route table associations for subnets

  InstanceSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance1:
    Type: 'AWS::EC2::Instance'
    Properties:
      # ❌ MISSING: ImageId needs mapping or hardcoded value
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance2:
    Type: 'AWS::EC2::Instance'
    Properties:
      # ❌ MISSING: ImageId needs mapping or hardcoded value
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      SubnetId: !Ref PublicSubnet2
      SecurityGroupIds:
        - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

# ❌ MISSING: Outputs section
```

## Required Fixes

### 1. **Add AMI Mappings**
```yaml
Mappings:
  AWSRegionToAMI:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
```

### 2. **Fix Availability Zones**
```yaml
AvailabilityZone: !Select [0, !GetAZs '']
```

### 3. **Add Route Table Associations**
```yaml
PublicSubnet1RouteTableAssociation:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref PublicSubnet1
    RouteTableId: !Ref PublicRouteTable
```

### 4. **Add DependsOn**
```yaml
PublicRoute:
  Type: AWS::EC2::Route
  DependsOn: VPCGatewayAttachment
```

### 5. **Add Outputs**
```yaml
Outputs:
  Instance1PublicDNS:
    Description: Public DNS of EC2 Instance 1
    Value: !GetAtt EC2Instance1.PublicDnsName
```

### 6. **Fix EC2 Configuration**
```yaml
EC2Instance1:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: !FindInMap [AWSRegionToAMI, !Ref "AWS::Region", AMI]
    InstanceType: t2.micro
    KeyName: !Ref KeyName
    NetworkInterfaces:
      - AssociatePublicIpAddress: true
        SubnetId: !Ref PublicSubnet1
        DeviceIndex: 0
        GroupSet:
          - !Ref InstanceSecurityGroup
```

## Comparison with Ideal Response

| Feature | Model Response | Ideal Response | Status |
|---------|---------------|----------------|---------|
| VPC Configuration | ✅ Correct | ✅ Correct | ✅ Match |
| Subnet Configuration | ⚠️ Hardcoded AZs | ✅ Dynamic AZs | ❌ Needs Fix |
| AMI Mappings | ❌ Missing | ✅ Present | ❌ Missing |
| Route Table Associations | ❌ Missing | ✅ Present | ❌ Missing |
| DependsOn | ❌ Missing | ✅ Present | ❌ Missing |
| Outputs | ❌ Missing | ✅ Present | ❌ Missing |
| EC2 Config | ⚠️ Partial | ✅ Complete | ❌ Needs Fix |

## Model Performance Score: 6/10
- **Strengths**: Good basic structure, proper resource types, consistent tagging
- **Weaknesses**: Missing critical components, hardcoded values, incomplete template
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Development

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  InstanceSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance1:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      NetworkInterfaces:
        - DeviceIndex: '0'
          SubnetId: !Ref PublicSubnet1
          AssociatePublicIpAddress: true
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

  EC2Instance2:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      KeyName: !Ref KeyName
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      NetworkInterfaces:
        - DeviceIndex: '0'
          SubnetId: !Ref PublicSubnet2
          AssociatePublicIpAddress: true
          GroupSet:
            - !Ref InstanceSecurityGroup
      Tags:
        - Key: Environment
          Value: Development

Outputs:
  EC2Instance1PublicDNS:
    Description: Public DNS name of the first EC2 instance
    Value: !GetAtt EC2Instance1.PublicDnsName

  EC2Instance2PublicDNS:
    Description: Public DNS name of the second EC2 instance
    Value: !GetAtt EC2Instance2.PublicDnsName