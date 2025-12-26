You are a senior DevOps engineer tasked with creating a highly available and resilient infrastructure on AWS. Your goal is to design a single, well-documented YAML CloudFormation template that deploys a web application in the us-east-1 region. This template must meet the following specific requirements and best practices:

Core Task:

Develop a comprehensive CloudFormation template in YAML that provisions a complete, multi-Availability Zone architecture for a web application.

Detailed Infrastructure Requirements:

VPC and Subnets: The stack must be deployed into an existing VPC. Use parameters to allow the user to specify the VPC ID and at least two subnet IDs, one for each availability zone.

Web Application (High Availability):

Deploy a web application across multiple Availability Zones to ensure high availability.

Use an AWS::AutoScaling::LaunchConfiguration or AWS::EC2::LaunchTemplate to define the EC2 instance configuration.

The EC2 instances should be based on a standard Amazon Linux 2 AMI and have a simple shell script in their UserData to install a web server like Apache and a basic "Hello World" web page.

Load Balancing:

Provision an AWS::ElasticLoadBalancingV2::LoadBalancer of type application and an AWS::ElasticLoadBalancingV2::TargetGroup.

The load balancer must be configured to distribute incoming HTTP traffic on port 80 across the backend servers.

The target group should have health checks enabled and be associated with the Auto Scaling group.

Auto Scaling:

Create an AWS::AutoScaling::AutoScalingGroup that spans the specified subnets to distribute instances across multiple zones.

The group should be configured with a desired capacity of 2, a minimum of 2, and a maximum of 4 instances.

Database:

Provision a multi-AZ AWS::RDS::DBInstance with a DBSubnetGroup to provide database redundancy and failover support.

Configure the database with an appropriate engine such as mysql and a configurable master username and password using CloudFormation parameters. The storage should be gp2 with a minimum size of 10 GiB.

Monitoring and Alarms:

Configure at least two AWS::CloudWatch::Alarm resources that monitor key performance indicators for the Auto Scaling group.

One alarm should be an AWS::CloudWatch::Alarm for CPUUtilization that triggers a scale-out policy when utilization exceeds a specific threshold like 70% for a certain period.

Another alarm should be an AWS::CloudWatch::Alarm for CPUUtilization that triggers a scale-in policy when utilization drops below a certain threshold like 30%.

Scaling Policies:

Define AWS::AutoScaling::ScalingPolicy resources linked to the CloudWatch alarms.

One policy should increase the desired capacity by 1 instance, and the other should decrease it by 1 instance.

Naming and Tags:

All resources must follow the naming convention 'AppName-Environment-ResourceType', where AppName and Environment are provided via parameters.

All resources should be tagged with Project and Owner tags.

Expected Output:

A single, valid, and well-commented YAML CloudFormation template named ha-web-app.yaml. The template must pass all CloudFormation validation tests and be ready to launch a highly available and resilient web application stack without errors. The template should include a detailed Description and Outputs section that exports key resource identifiers like the Load Balancer DNS name and the RDS endpoint.
