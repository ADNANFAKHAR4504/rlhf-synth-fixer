Act as a Senior Cloud Architect with expert-level knowledge of AWS and CDK JAVA. Your mission is to create a complete and validated CDK JAVA template that automates the deployment of a highly available web application. The template must be production-ready and adhere strictly to the following detailed requirements.

**Project Name:** IaC - AWS Nova Model Breaking
**Target Region:** `us-east-1`
**Output Format:** A complete CDK JAVA template.

**Infrastructure Requirements:**

1.  **VPC and Networking:**
    * Create a `AWS::EC2::VPC` with the CIDR block `10.0.0.0/16`.
    * The VPC must have four subnets in total, distributed across two Availability Zones (`us-east-1a` and `us-east-1b`).
        * Create two public subnets, one in each Availability Zone.
        * Create two private subnets, one in each Availability Zone.
    * Create an `AWS::EC2::InternetGateway` and attach it to the VPC.
    * Create a public route table (`AWS::EC2::RouteTable`).
    * Create a route (`AWS::EC2::Route`) within the public route table that routes all outbound traffic (`0.0.0.0/0`) to the Internet Gateway.
    * Associate the public route table with both public subnets.

2.  **EC2 and Auto Scaling:**
    * Deploy an `AWS::AutoScaling::AutoScalingGroup` that launches EC2 instances.
    * The Auto Scaling Group must be configured to place instances in the two public subnets.
    * The group's desired capacity should be 2, with a minimum size of 2 and a maximum size of 4.
    * The instances should be launched using the latest Amazon Linux 2 AMI (`ami-04505e74c0741db8f` as a common example).
    * The instances should have a UserData script that installs and starts a simple web server (e.g., `yum update -y && yum install -y httpd && systemctl start httpd`).
    * **Note:** Use a `AWS::AutoScaling::LaunchConfiguration` to define the instance properties.

3.  **Security:**
    * Create an `AWS::EC2::SecurityGroup` for the EC2 instances.
    * The Security Group must have two inbound rules:
        * Allow HTTP traffic (`TCP` on port `80`) from any IPv4 address (`0.0.0.0/0`).
        * Allow SSH traffic (`TCP` on port `22`) from any IPv4 address (`0.0.0.0/0`).
    * The Security Group must be associated with the EC2 instances.

4.  **Load Balancing:**
    * Create an `AWS::ElasticLoadBalancingV2::LoadBalancer` of type 'application'.
    * The ALB must be deployed to the two public subnets.
    * Create a `AWS::ElasticLoadBalancingV2::TargetGroup` and register the Auto Scaling Group with it. The health check must be enabled.
    * Create a `AWS::ElasticLoadBalancingV2::Listener` on port `80` that forwards traffic to the Target Group.

5.  **Outputs and Best Practices:**
    * The template must include an `Outputs` section.
    * The `Outputs` section must export the DNS name of the Application Load Balancer.
    * All resources must have a `Tags` property, with a tag `Key: Project` and `Value: IaC - AWS Nova Model Breaking`.
    * The entire template must be a single, valid JSON file.

Please provide only the CDK JAVA template, without any preceding or following text, ready for direct use with the AWS.