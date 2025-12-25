Create an AWS CloudFormation template in JSON format for a multi-AZ networking and compute environment in us-east-1. This needs to be production-grade with proper parameterization.

**Parameters needed:**

- ProjectName: String prefix for naming all resources, default to MyWebApp
- SshCidrBlock: CIDR block for SSH access, default to 203.0.113.0/24
- InstanceType: EC2 instance type to use, default to t3.micro

**Networking Setup:**

The VPC should use CIDR 10.0.0.0/16 and connect to the internet through an Internet Gateway.

Create three subnets spread across different Availability Zones using Fn::GetAZs:
- Public Subnet at 10.0.1.0/24 that auto-assigns public IPs to launched instances
- Private Subnet A at 10.0.2.0/24
- Private Subnet B at 10.0.3.0/24

Deploy a NAT Gateway with an Elastic IP in the public subnet. The private subnets connect to the internet through this NAT Gateway.

Route tables:
- Public route table attached to the public subnet with default route pointing to the Internet Gateway
- Private route table associated with both private subnets with default route directed to the NAT Gateway

**Compute:**

Launch one EC2 instance in each subnet. Use the Amazon Linux 2 AMI retrieved from SSM Parameter Store at /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2.

**Security:**

Create a single security group applied to all three EC2 instances:
- Allow SSH on port 22 only from the SshCidrBlock parameter
- Enable self-referencing rules so instances in the same security group can communicate with each other

**Monitoring:**

Enable VPC Flow Logs that capture ALL traffic types and publish to a CloudWatch Logs log group.

**Tagging:**

Apply Name tags to all resources using the ProjectName parameter combined with a resource identifier, like MyWebApp-VPC or MyWebApp-Public-Subnet.

**Outputs:**

Export VPCId, PublicInstanceId, and NATGatewayEIP.

Use CloudFormation intrinsic functions like Ref, GetAtt, and Sub to wire up the dependencies between resources.
