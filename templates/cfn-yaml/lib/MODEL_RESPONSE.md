Prompt
Task Title: multi-env-consistency_CloudFormation_YAML_6dq1ae9tnvqx
Complexity: Expert
Platform: AWS CloudFormation
Language: YAML

Prompt Instruction:

You are tasked with designing a highly available, secure, and scalable AWS infrastructure using CloudFormation YAML. The infrastructure should support a production-level web application architecture deployed across multiple AWS regions. Prioritize best practices such as encryption, IAM security, and resiliency across tiers.

Requirements:

Use CloudFormation YAML format

Support deployment in more than one AWS region

Include essential components for availability, scaling, and protection

Adhere to least-privilege IAM

Use managed AWS services where possible

Constraints:

YAML only

Minimize hardcoded values

Prioritize reusability and modularity

Avoid overly complex logic

Generated Output (CloudFormation YAML)

AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-region, highly available, secure, and scalable web application infrastructure.

Parameters:
  Environment:
    Type: String
    AllowedValues: 
      - dev
      - prod
    Default: dev
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890
    us-west-2:
      AMI: ami-0abcdef1234567891

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-VPC

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-IGW

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [ 0, !Cidr [ !Ref VpcCIDR, 4, 8 ] ]
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-PublicSubnet1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [ 1, !Cidr [ !Ref VpcCIDR, 4, 8 ] ]
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-PublicSubnet2

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP and HTTPS access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  WebServerRole:
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
        - PolicyName: S3ReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:Get*
                  - s3:List*
                Resource: "*"

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref WebServerSecurityGroup
      Scheme: internet-facing

  WebServerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      TargetType: instance

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebServerTargetGroup

  LaunchConfiguration:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      IamInstanceProfile: !Ref WebServerInstanceProfile
      SecurityGroups:
        - !Ref WebServerSecurityGroup

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref WebServerRole

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchConfigurationName: !Ref LaunchConfiguration
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref WebServerTargetGroup

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
  ALBDNSName:
    Description: DNSName of the ALB
    Value: !GetAtt ApplicationLoadBalancer.DNSName



Evaluation Summary
Feature	Result	Notes
Multi-Region Support	❌	No StackSets, cross-region stacks, or global DNS setup.
High Availability	✅	ALB + ASG with 2 AZs provides basic availability.
Least Privilege IAM	⚠️	IAM role grants S3:* access; should be narrowed.
Managed AWS Services	⚠️	Uses ALB/ASG/EC2, but omits RDS, S3, CloudFront, WAF, etc.
Encryption (KMS, S3, RDS)	❌	No encryption or KMS usage defined.
Monitoring & Logs (CloudWatch)	❌	No logging, metrics, or alarms configured.
WAF/Shield	❌	Not included or integrated with ALB/CloudFront.
Secrets Management	❌	No AWS Secrets Manager used for credentials.
RDS Multi-AZ	❌	No database defined at all.
Modularity / Reusability	⚠️	Parameters used, but lacks nested stacks/modules.
Hardcoded Values Avoided	✅	AMIs and AZs are mapped/selected properly.

Verdict
❌ FAIL – While the template implements a basic scalable web infrastructure in a single region, it falls significantly short of expert-level expectations for a secure, multi-region, production-ready setup. Critical security, observability, and redundancy requirements were not addressed.