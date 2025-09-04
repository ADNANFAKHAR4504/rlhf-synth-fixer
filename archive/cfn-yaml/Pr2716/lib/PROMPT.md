## AWS CloudFormation Prompt

You are an expert AWS CloudFormation engineer. Based on the following requirements, create a valid AWS CloudFormation YAML template that sets up a robust cloud environment. The template must implement a Virtual Private Cloud (VPC) with associated networking components, ensuring high availability and internet connectivity for deployed resources.

## Key Requirements
1. Define a new VPC with a custom CIDR block specified as a parameter.
2. Create at least two subnets, each located in different availability zones for failover capabilities.
3. Deploy an internet gateway and attach it to the VPC to allow internet access.
4. Configure route tables to ensure proper routing between the internet gateway, subnets, and NAT gateway.
5. Create a security group that permits SSH (port 22) and HTTP (port 80) access, and assign it to all instances.
6. Utilize CloudFormation intrinsic functions such as !Ref and !GetAtt for dynamic parameterization and output resources.
7. Deploy a NAT gateway in the public subnet with an Elastic IP for internet traffic from private subnets.
8. Assign specific IAM roles to EC2 instances to permit S3 access, ensuring instances do not have public IPs.
9. Activate DNS hostnames in the VPC configuration for AWS resource identification.
10. Ensure all resources are deployed within the 'us-west-2' region and are tagged appropriately.

## Environment
The infrastructure is to be deployed in the 'us-west-2' region. Use CloudFormation templates to define a virtual private cloud (VPC) with subnets, internet connectivity, routing, and necessary IAM roles. Ensure each resource is properly tagged for cost management and resource identification.

## Constraints
- Define a VPC with custom CIDR block.
- Include at least two subnets in different availability zones.
- Create an internet gateway and attach it to the VPC.
- Set up appropriate route tables for internet access and private networking.
- Ensure all instances launch with the provided security group allowing SSH and HTTP traffic.
- Utilize CloudFormation intrinsic functions for parameterization and outputs.
- Attach an Elastic IP to the NAT gateway for outbound internet traffic for private subnets.
- Implement proper IAM roles for EC2 instances to access S3.
- Enable DNS hostnames in the VPC configuration.
- Deploy resources within 'us-west-2' region only.

## Expected Output
Output only the complete, valid YAML template that adheres to all constraints and best practices for security and availability. The template should be launchable in AWS without errors. Do not include any additional explanations or code outside the YAML.