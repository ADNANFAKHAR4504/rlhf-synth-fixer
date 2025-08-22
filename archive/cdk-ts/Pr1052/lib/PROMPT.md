# Cloud Environment Setup - Dual VPC Infrastructure with Advanced Networking

## Task Requirements

Design a CDK TypeScript implementation to set up a dual-VPC environment that meets the following requirements:

1. **VPC Configuration**: Create two VPCs, each with distinct CIDR ranges:
   - VPC 1: 10.0.0.0/16 (us-east-1)
   - VPC 2: 192.168.0.0/16 (us-east-1)

2. **Subnet Setup**: Define a public and a private subnet in each VPC with appropriate subnet calculations from the given CIDR blocks.

3. **NAT Gateway**: Deploy a NAT Gateway in each VPC to allow private subnet traffic to reach the internet.

4. **EC2 Instance**: Launch an Amazon Linux 2 EC2 instance in the public subnet of the first VPC.

5. **Systems Manager (SSM)**: Utilize AWS Systems Manager to manage the EC2 instance without direct SSH access, ensuring the instance's IAM role includes necessary SSM permissions.

6. **Security Groups**: Implement security groups to allow HTTP access on port 80 to the EC2 instance.

7. **VPC Lattice Service Network**: Implement AWS VPC Lattice to enable secure service-to-service communication between the two VPCs. Create a service network that can connect services across VPCs with built-in access controls and monitoring.

8. **VPC Endpoints**: Add VPC endpoints for AWS Systems Manager to enable secure, private connectivity to AWS services without internet access. This should include endpoints for SSM, SSMMessages, and EC2Messages.

9. **Outputs**: Create CDK outputs for the IDs of the resources (such as VPCs, EC2 instances, VPC Lattice service network, and VPC endpoints) for further integration.

## Constraints

- Use AWS CDK with TypeScript
- Deploy in the us-east-1 region
- Implement a public and private subnet in each VPC
- Ensure one NAT Gateway is deployed in each VPC to enable internet access from private subnets
- Deploy an EC2 instance in the public subnet of the first VPC running Amazon Linux 2
- Set up SSM to allow EC2 instances with the necessary IAM role to be managed without SSH access
- Implement security groups to allow HTTP traffic on port 80 to the EC2 instances in public subnet
- Configure VPC Lattice service network to enable cross-VPC communication with proper service associations
- Deploy VPC endpoints in private subnets to provide secure access to AWS Systems Manager services
- Create proper CDK outputs that export the VPC IDs, EC2 instance IDs, VPC Lattice service network, and VPC endpoint IDs

## Expected Environment

The infrastructure should be deployed in the AWS us-east-1 region. Resources include two VPCs with public and private subnets, connected through VPC Lattice for service-to-service communication. VPC endpoints provide secure access to AWS services without internet connectivity. IAM roles and security groups should be configured following best security practices, with centralized logging and monitoring enabled.

## Technical Notes

CDK is an Infrastructure as Code service by AWS that allows users to define cloud resources through programming languages like TypeScript. It enables automation in deployment and scaling of cloud infrastructure while maintaining type safety and modern development practices. VPC Lattice is a recent AWS service that simplifies service-to-service networking across VPCs and accounts with built-in service discovery and access controls.

## Validation Requirements

The final CDK TypeScript implementation must:
- Pass CDK synth validation
- Follow AWS best practices for security group configurations
- Include proper resource naming and tagging
- Ensure all networking components are correctly configured for cross-AZ deployment
- Implement proper IAM roles with least privilege principles
- Configure VPC Lattice service network with appropriate service associations
- Deploy VPC endpoints with correct security group and subnet configurations
- Ensure proper integration between VPC Lattice, VPC endpoints, and existing infrastructure