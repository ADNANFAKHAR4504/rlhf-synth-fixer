```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  This CloudFormation template sets up a basic cloud environment in the us-west-2 region
  for a development workload. It includes an S3 bucket with versioning, an EC2 instance
  in a public subnet, an Elastic IP, and a Security Group with SSH and HTTP access.

Resources:
  # S3 Bucket with versioning enabled
  SampleBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: sample-bucket-dev
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: dev
        - Key: Project
          Value: SampleProject

  # Security Group allowing inbound SSH and HTTP traffic
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH and HTTP access
      VpcId: !Ref DefaultVPC
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
          Value: dev
        - Key: Project
          Value: SampleProject

  # EC2 Instance in a public subnet
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Ref LatestAmiId
      KeyName: !Ref KeyPairName
      NetworkInterfaces:
        - DeviceIndex: 0
          AssociatePublicIpAddress: true
          SubnetId: !Ref PublicSubnet
          GroupSet:
            - !Ref WebSecurityGroup
      Tags:
        - Key: Environment
          Value: dev
        - Key: Project
          Value: SampleProject

  # Elastic IP allocation and association
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      InstanceId: !Ref WebServerInstance

  # Lookup latest Amazon Linux 2 AMI
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Properties:
      Name: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID where the instance will be launched
  
  PublicSubnet:
    Type: AWS::EC2::Subnet::Id
    Description: Public subnet ID where the instance will be launched

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance

Outputs:
  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref SampleBucket

  EC2InstancePublicIP:
    Description: The public IP address of the EC2 instance
    Value: !GetAtt ElasticIP.PublicIp
```

### Explanation:

1. **S3 Bucket**:
   - Created with versioning enabled.
   - Tagged with `Environment: dev` and `Project: SampleProject`.

2. **Security Group**:
   - Allows inbound SSH (port 22) and HTTP (port 80) traffic from any IP address.
   - Tagged appropriately.

3. **EC2 Instance**:
   - Uses the latest Amazon Linux 2 AMI.
   - Launched in a public subnet with a public IP.
   - Associated with the created security group.
   - Tagged appropriately.

4. **Elastic IP**:
   - Allocated and associated with the EC2 instance.

5. **Parameters**:
   - `VpcId`, `PublicSubnet`, and `KeyPairName` are parameters to make the template reusable.

6. **Outputs**:
   - Outputs the S3 bucket name and the EC2 instance's public IP address.

This template adheres to AWS best practices by using parameters for reusability, tagging for resource management, and leveraging AWS-specific resource types for clarity and efficiency.