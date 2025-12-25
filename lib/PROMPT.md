Need to build secure AWS infrastructure using CDK TypeScript with network security monitoring and threat protection.

Set up a VPC with the following components that work together:

1. VPC with CIDR 10.0.0.0/16 containing public and private subnets across 2 AZs
2. Internet Gateway connects to public subnets for outbound traffic
3. NAT Gateway in public subnets routes private subnet traffic to internet
4. VPC Flow Logs stream network traffic to CloudWatch Logs using an IAM role for write access
5. AWS Network Firewall deployed in public subnets inspects all traffic flowing through the VPC
6. VPC Lattice service network connects to the VPC for secure service-to-service communication
7. Security groups control traffic between web tier and application tier using least-privilege rules

The architecture needs proper connectivity:
- Network Firewall intercepts traffic at the VPC level before it reaches resources
- VPC Flow Logs capture all traffic for security monitoring via CloudWatch
- Security groups enforce segmentation between web tier and app tier
- VPC Lattice enables service mesh connectivity across the VPC

Use proper IAM roles with minimal permissions - no wildcards. Tag everything with Environment: Production.