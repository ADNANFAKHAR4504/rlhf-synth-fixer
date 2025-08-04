You are an expert AWS Cloud Solutions Architect specializing in Infrastructure as Code (IaC). Your task is to generate a complete and valid AWS CloudFormation template in YAML format to deploy a highly available and scalable web application.

The output must be a single YAML code block for a file named eb_deployment.yaml. Do not provide any text or explanation before or after the code block.

Project Requirements
1. Primary Service:

Use AWS Elastic Beanstalk to define and manage the application environment. The primary resource must be AWS::ElasticBeanstalk::Environment.

2. Application Platform:

Assume the application is a Node.js web application.

The solution stack should use 64bit Amazon Linux 2 with a compatible Node.js version.

3. High Availability and Scalability:

Region: The stack must be deployed in us-east-1.

Load Balancer: The environment must use an Application Load Balancer (LoadBalancerType: application).

Auto Scaling: Configure the environment's Auto Scaling group with a minimum of 2 instances and a maximum of 10 instances.

Multi-AZ: The environment should be configured to launch instances across multiple Availability Zones for resilience.

4. Security:

HTTPS: Enable secure traffic by configuring a listener on port 443 for the load balancer.

SSL Certificate: The HTTPS listener must use an SSL certificate. The ARN for the certificate will be provided via a CloudFormation parameter.

5. Configuration and Best Practices:

The template must use a Parameters section for user-provided inputs.

Required Parameters:

InstanceType: For specifying the EC2 instance type (e.g., t3.micro).

KeyPairName: For specifying the EC2 key pair for SSH access.

SSLCertificateArn: For providing the ARN of the ACM SSL certificate in us-east-1.

6. Output Specifications:

Format: A single, valid YAML file.

Filename: eb_deployment.yaml.

Content: The template must be complete and ready for deployment. Include comments where appropriate to explain key configuration sections. Only the YAML code should be in your response.