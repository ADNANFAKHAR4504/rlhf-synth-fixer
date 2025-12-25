# AWS Production Environment CloudFormation Template

## Overview

Create a CloudFormation YAML template that deploys a secure production application environment in AWS. The template provisions an EC2 instance that connects to an S3 bucket for asset storage, with a Security Group that controls network access to the instance.

## Architecture

The infrastructure includes:
- An EC2 instance running Amazon Linux 2 that is protected by a Security Group
- A Security Group attached to the VPC that filters inbound traffic to the EC2 instance
- An S3 bucket integrated with server-side encryption for secure storage
- All resources deployed within an existing VPC infrastructure

## Requirements

### Region and VPC Configuration
- Deploy all resources in the us-east-1 region
- Use the existing VPC with ID vpc-12345abcde
- Create a subnet within the VPC for the EC2 instance

### EC2 Instance
- Launch on the latest Amazon Linux 2 AMI resolved through SSM parameter lookup
- The instance connects to the Security Group for network protection
- Use t3.micro as the default instance type
- Tag with Environment set to Production

### Security Group
- Create within the existing VPC vpc-12345abcde
- The Security Group filters traffic to the EC2 instance allowing only SSH on port 22 and HTTPS on port 443
- Egress rules permit outbound connections for instance updates and application communication
- Tag with Environment set to Production

### S3 Bucket
- Enable AES256 server-side encryption for data at rest
- Block all public access to the bucket
- The bucket stores application assets and logs
- Tag with Environment set to Production

## Template Structure

The CloudFormation template should include:
- AWSTemplateFormatVersion and Description
- Parameters for VpcId, SubnetId, InstanceType, and ingress CIDRs
- SSM parameter reference for the latest Amazon Linux 2 AMI
- Resources for Security Group, EC2 Instance, and S3 Bucket
- Outputs for SecurityGroupId, InstanceId, InstancePublicIp, and BucketName

## Outputs

- SecurityGroupId: The ID of the created security group
- InstanceId: The ID of the EC2 instance
- InstancePublicIp: The public IP address of the instance if assigned
- BucketName: The name of the S3 bucket with encryption enabled
