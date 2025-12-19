# Infrastructure Requirements for Web Application Deployment

We need a CloudFormation template to deploy a secure, highly available web application environment in AWS us-east-1.  
The stack should include:

- A VPC with CIDR 10.0.0.0/16.
- Two public subnets (10.0.0.0/24, 10.0.1.0/24) and two private subnets (10.0.10.0/24, 10.0.11.0/24), each in different AZs.
- An Internet Gateway attached to the VPC.
- Two NAT Gateways (one per public subnet) with Elastic IPs.
- Route tables so public subnets route 0.0.0.0/0 to the IGW, and private subnets route 0.0.0.0/0 to their NAT Gateway.
- EC2 instances launched via an Auto Scaling Group in the private subnets, using the latest Amazon Linux 2 AMI (via SSM). User data should start a simple HTTP server on port 80.
- The ASG should have min 2, desired 2, max 4 instances.
- Security groups:
  - EC2 SG: allow inbound 80 from the public subnets, egress to the DB port.
  - RDS SG: allow inbound on the DB port only from the EC2 SG.
- An RDS MySQL instance in the private subnets, with Multi-AZ enabled for high availability. Use a DBSubnetGroup for the private subnets. Username can be a dummy default; password should reference a secret.
- All resources must be tagged with Environment: Production.
- Outputs: VPC ID, PublicSubnet IDs, PrivateSubnet IDs, and RDS Endpoint.
- Add an HTTPS listener to the EC2 instances using a self-signed certificate or ACM if possible.

Please ensure all resource associations and dependencies are correct and use AWS best practices.
