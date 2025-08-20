# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Deploys a highly available and scalable Node.js web application using AWS Elastic Beanstalk
  with a secure HTTPS endpoint. This template includes least-privilege IAM roles.

Parameters:
  ApplicationName:
    Type: String
    Description: The name of the Elastic Beanstalk application.
    Default: MyNodeJsApp
  
  InstanceType:
    Type: String
    Description: EC2 instance type for the web application servers.
    Default: t2.micro
    AllowedValues:
      - t2.micro
      - t3.micro
      - t3.small
      - m5.large
      
  KeyPairName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instances.
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: must be the name of an existing EC2 KeyPair.
    Default: iac-rlhf-aws-trainer-instance
  
  SSLCertificateArn:
    Type: String
    Description: The ARN of the ACM SSL certificate for the Application Load Balancer.
    Default: 'arn:aws:acm:us-east-1:718240086340:certificate/a77b0884-1bfb-4b61-b907-6d019495d01b'

Resources:
  # --- IAM Roles and Profiles (with improved security) ---
  AWSElasticBeanstalkServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticbeanstalk.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService

  AWSElasticBeanstalkEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier

  AWSElasticBeanstalkEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref AWSElasticBeanstalkEC2Role

  # --- Elastic Beanstalk Application ---
  WebAppApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: !Ref ApplicationName
      Description: AWS Elastic Beanstalk application for our Node.js app.

  # --- Elastic Beanstalk Environment ---
  WebAppEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref WebAppApplication
      Description: Environment for the Node.js web application
      SolutionStackName: "64bit Amazon Linux 2 v5.11.1 running Node.js 18"
      OptionSettings:
        # --- IAM and Instance Configuration ---
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: IamInstanceProfile
          Value: !Ref AWSElasticBeanstalkEC2InstanceProfile
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: InstanceType
          Value: !Ref InstanceType
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: EC2KeyName
          Value: !Ref KeyPairName
        # --- Service Role Configuration ---
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: ServiceRole
          Value: !Ref AWSElasticBeanstalkServiceRole
        # --- High Availability Configuration ---
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: EnvironmentType
          Value: LoadBalanced
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: LoadBalancerType
          Value: application
        # --- Auto Scaling Group Configuration ---
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: '2'
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: '10'
        - Namespace: aws:autoscaling:asg
          OptionName: Availability Zones
          Value: Any
        
        # --- Listener Configuration on the Application Load Balancer ---
        - Namespace: aws:elbv2:listener:443
          OptionName: Protocol
          Value: HTTPS
        - Namespace: aws:elbv2:listener:443
          OptionName: SSLCertificateArns
          Value: !Ref SSLCertificateArn
        
        - Namespace: aws:elbv2:listener:default
          OptionName: ListenerEnabled
          Value: 'false'

Outputs:
  EnvironmentURL:
    Description: The HTTPS URL of the new Elastic Beanstalk environment.
    Value: !Sub "https://${WebAppEnvironment.EndpointURL}"
```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
