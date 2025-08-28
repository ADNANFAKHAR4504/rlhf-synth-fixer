# Cloud Environment Setup Task

I need to create a cloud infrastructure setup using AWS CDK with Java for a development environment in the us-west-2 region. The goal is to establish a solid networking foundation with secure connectivity patterns.

## Requirements

Create a VPC-based infrastructure with the following components:

1. **VPC Configuration**
   - CIDR block: 10.0.0.0/16
   - Deploy in us-west-2 region
   - Two public subnets across different availability zones
   - Two private subnets across different availability zones
   - Each subnet should have unique CIDR blocks

2. **Internet Connectivity**
   - Internet Gateway for public subnet internet access
   - NAT Gateway in one of the public subnets for private subnet outbound connectivity
   - Proper routing tables to direct traffic appropriately

3. **Storage**
   - S3 bucket for storing application logs
   - Enable versioning on the bucket for data protection

4. **Tagging and Organization**
   - Tag all resources with "Environment: Development"
   - Use clean, nested stack architecture for better resource organization

5. **Modern AWS Features**
   - Utilize Amazon EventBridge Scheduler for future event scheduling capabilities
   - Consider VPC endpoints with ServiceRegion configuration for enhanced security

## Architecture Goals

The infrastructure should follow AWS Well-Architected principles with cost optimization in mind. Use a single NAT Gateway to minimize costs while maintaining proper network isolation between public and private subnets.

Please provide complete CDK Java infrastructure code with proper class structure, including a main TapStack that orchestrates nested stacks for VPC and S3 resources. Each file should be production-ready with appropriate documentation and error handling.