Using AWS CDK code with Java, provision a dual-VPC environment across two AWS regions that meets the following requirements.

1. VPCs
    - Create two VPCs across different AWS regions.
    - CIDR blocks:
        - VPC1: 10.0.0.0/16
        - VPC2: 192.168.0.0/16

2. Subnets
    - Each VPC must contain one public and one private subnet and subnets must be logically derived from the VPC CIDR block.

3. NAT Gateways
    - Deploy one NAT Gateway per VPC.
    - Ensure that private subnets route outbound internet traffic via the NAT Gateway.

4. EC2 Instance
    - Launch an Amazon Linux 2 EC2 instance in the public subnet of the first VPC.
    - Use AWS Systems Manager (SSM) for management (no direct SSH).
    - Attach an IAM role with SSM permissions.

5. Security Groups
    - Create a security group allowing HTTP (port 80) traffic to the EC2 instance in the public subnet.

6. Design:
    - Place Resource definitions into separate component classes inside a `components` package.
