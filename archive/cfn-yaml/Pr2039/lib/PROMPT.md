# Cloud Environment Setup Task

Task ID: trainr946
Platform: CloudFormation
Language: YAML
Difficulty: hard

## Problem Description

You are tasked with creating a comprehensive CloudFormation script to set up a robust AWS cloud environment. This environment will support a distributed web application across two regions with the following specifications:

1. Deploy a VPC with public and private subnets in the us-east-1 and us-west-2 regions.
2. Utilize an Auto Scaling Group with dynamic scaling policies in both regions.
3. Distribute incoming traffic using an Elastic Load Balancer across both regions.
4. Provision t3.medium EC2 instances capable of handling the projected workload.
5. Implement security groups to permit internet traffic on HTTP(S) ports.
6. Monitor performance metrics using CloudWatch and trigger automatic scaling.

Expected output: Create a CloudFormation YAML or JSON template file that defines the infrastructure as specified. Ensure the template passes the AWS CloudFormation Linter and can be deployed without errors in the AWS Management Console to create the described setup.

## Environment Details

The target environment involves deploying infrastructure that spans multiple AWS regions, specifically us-east-1 and us-west-2. Each region should leverage multiple Availability Zones for high availability, with resources appropriately tagged for management and monitoring integrations.

## Background

This task involves setting up an AWS cloud environment using Infrastructure as Code (IaC) principles with CloudFormation. CloudFormation templates allow defining resources, configurations, and dependencies declaratively.

## Constraints

The CloudFormation stack must deploy resources across two AWS regions: us-east-1 and us-west-2.
Use at least three Availability Zones in each region.
Ensure all EC2 instances have a minimum of t3.medium instance type.
Include an Auto Scaling Group with a minimum of 2 instances and a maximum of 6 instances in each region.
The stack must include an Elastic Load Balancer that distributes traffic only between healthy instances.
A VPC with at least three public subnets and three private subnets should be created in each region.
Ensure that all resources are tagged with 'Environment: Production' and 'Team: DevOps'.
Implement a security group to allow HTTP and HTTPS traffic from anywhere in the world.
Include CloudWatch Alarms to monitor CPU utilization and trigger scale-out events if CPU exceeds 70%.

## Output File

cloudformation_template.yaml