# Common CloudFormation Template Failures

This document outlines typical failures and issues when implementing the development environment CloudFormation template.

## 🚨 Critical Failures

### 1. **Missing DependsOn Dependencies**
**Issue**: Route creation fails because Internet Gateway attachment isn't complete
```yaml
# ❌ WRONG - Route may fail to create
PublicRoute:
  Type: AWS::EC2::Route
  Properties:
    RouteTableId: !Ref PublicRouteTable
    DestinationCidrBlock: 0.0.0.0/0
    GatewayId: !Ref InternetGateway

# ✅ CORRECT - Explicit dependency
PublicRoute:
  Type: AWS::EC2::Route
  DependsOn: AttachGateway
  Properties:
    RouteTableId: !Ref PublicRouteTable
    DestinationCidrBlock: 0.0.0.0/0
    GatewayId: !Ref InternetGateway
```

### 2. **Hardcoded Availability Zones**
**Issue**: Template fails in regions with different AZ names
```yaml
# ❌ WRONG - Hardcoded AZ
AvailabilityZone: us-east-1a

# ✅ CORRECT - Dynamic AZ selection
AvailabilityZone: !Select [0, !GetAZs '']
```

### 3. **Missing VPC Reference in Security Groups**
**Issue**: Security group created in default VPC instead of custom VPC
```yaml
# ❌ WRONG - Missing VpcId
InstanceSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Enable SSH and HTTP access

# ✅ CORRECT - Explicit VPC reference
InstanceSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Enable SSH and HTTP access
    VpcId: !Ref VPC
```

## ⚠️ Common Issues

### 4. **Subnet Auto-Assign Public IP**
**Issue**: Instances don't get public IPs automatically
```yaml
# ❌ WRONG - Missing MapPublicIpOnLaunch
PublicSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.1.0/24

# ✅ CORRECT - Auto-assign public IPs
PublicSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.1.0/24
    MapPublicIpOnLaunch: true
```

### 5. **Incorrect EC2 Instance Configuration**
**Issue**: Instance doesn't get public IP or security group
```yaml
# ❌ WRONG - Using deprecated properties
EC2Instance1:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: ami-12345678
    InstanceType: t2.micro
    SubnetId: !Ref PublicSubnet1
    SecurityGroupIds:
      - !Ref InstanceSecurityGroup

# ✅ CORRECT - Using NetworkInterfaces
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

### 6. **Missing DNS Configuration**
**Issue**: DNS resolution doesn't work properly
```yaml
# ❌ WRONG - Missing DNS configuration
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16

# ✅ CORRECT - Enable DNS support
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsSupport: true
    EnableDnsHostnames: true
```

## 🔧 Parameter & Mapping Issues

### 7. **Invalid Parameter Constraints**
**Issue**: Parameter validation fails
```yaml
# ❌ WRONG - No validation
KeyName:
  Type: String
  Description: KeyPair name

# ✅ CORRECT - Proper validation
KeyName:
  Type: AWS::EC2::KeyPair::KeyName
  Description: Name of an existing EC2 KeyPair to enable SSH access to the instances.
```

### 8. **Outdated AMI Mappings**
**Issue**: AMI no longer exists or deprecated
```yaml
# ❌ WRONG - Old or non-existent AMI
AWSRegionToAMI:
  us-east-1:
    AMI: ami-12345678  # Old AMI ID

# ✅ CORRECT - Current Amazon Linux 2 AMI
AWSRegionToAMI:
  us-east-1:
    AMI: ami-0c02fb55956c7d316  # Current Amazon Linux 2
```

## 🏷️ Tagging Issues

### 9. **Inconsistent Tagging**
**Issue**: Not all resources are tagged
```yaml
# ❌ WRONG - Missing tags on some resources
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    # Missing tags

# ✅ CORRECT - Consistent tagging
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    Tags:
      - Key: Environment
        Value: Development
```

## 📤 Output Issues

### 10. **Missing or Incorrect Outputs**
**Issue**: Outputs don't provide useful information
```yaml
# ❌ WRONG - Missing outputs or wrong attributes
Outputs:
  InstanceId:
    Value: !Ref EC2Instance1

# ✅ CORRECT - Useful public DNS outputs
Outputs:
  Instance1PublicDNS:
    Description: Public DNS of EC2 Instance 1
    Value: !GetAtt EC2Instance1.PublicDnsName
  Instance2PublicDNS:
    Description: Public DNS of EC2 Instance 2
    Value: !GetAtt EC2Instance2.PublicDnsName
```

## 🚀 Deployment Failures

### 11. **Stack Creation Failures**
Common deployment error messages:
- `"Route table 'rtb-xxx' and network gateway 'igw-xxx' have mismatched owners"`
- `"The specified subnet does not exist"`
- `"InvalidGroup.NotFound"`
- `"No default VPC for this user"`

### 12. **Permission Issues**
Required IAM permissions for deployment:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "cloudformation:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🔍 Debugging Tips

1. **Always validate template first**: `aws cloudformation validate-template`
2. **Check stack events**: Monitor CloudFormation events during deployment
3. **Use drift detection**: Verify deployed resources match template
4. **Test in multiple regions**: Ensure template works across regions
5. **Use stack policies**: Protect critical resources during updates