```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [{"Key": "Environment", "Value": "Production"}]
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [{"Key": "Environment", "Value": "Production"}]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [{"Key": "Environment", "Value": "Production"}]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.101.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [{"Key": "Environment", "Value": "Production"}]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.102.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [{"Key": "Environment", "Value": "Production"}]
      }
    }
  }
}
```