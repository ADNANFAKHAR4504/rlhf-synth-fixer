Below is the code that failed
```AWSTemplateFormatVersion: '2010-09-09'
Description: Deploys a scalable Node.js web app on Elastic Beanstalk with HTTPS

Parameters:
  InstanceType:
    Type: String
    Description: EC2 instance type (e.g., t3.micro)
    Default: t3.micro

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 key pair for SSH access

  SSLCertificateArn:
    Type: String
    Description: ARN of ACM SSL certificate in us-east-1

Resources:
  WebAppEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: my-nodejs-app
      EnvironmentName: my-nodejs-env
      SolutionStackName: 64bit Amazon Linux 2 v3.4.3 running Node.js 16
      OptionSettings:
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: EnvironmentType
          Value: LoadBalanced
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: LoadBalancerType
          Value: application
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: '2'
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: '10'
        - Namespace: aws:ec2:vpc
          OptionName: AssociatePublicIpAddress
          Value: 'true'
        - Namespace: aws:elasticbeanstalk:environment:process:default
          OptionName: HealthCheckPath
          Value: /health
        - Namespace: aws:elbv2:listener:443
          OptionName: ListenerEnabled
          Value: 'true'
        - Namespace: aws:elbv2:listener:443
          OptionName: SSLCertificateArns
          Value: !Ref SSLCertificateArn

  WebAppConfigurationTemplate:
    Type: AWS::ElasticBeanstalk::ConfigurationTemplate
    Properties:
      ApplicationName: my-nodejs-app
      SolutionStackName: 64bit Amazon Linux 2 v3.4.3 running Node.js 16
      OptionSettings:
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: EC2KeyName
          Value: !Ref KeyPairName
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: InstanceType
          Value: !Ref InstanceType

Outputs:
  EnvironmentURL:
    Description: URL of the deployed Elastic Beanstalk environment
    Value: !Sub "http://${WebAppEnvironment.EndpointURL}"
```