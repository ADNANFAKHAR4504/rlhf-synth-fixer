# Automated Compliance Analysis System

A comprehensive CloudFormation-based infrastructure for continuous compliance monitoring of AWS resources.

## Overview

This system automatically scans EC2 instances and security groups for compliance violations every 6 hours, storing results in RDS MySQL and sending SNS notifications when issues are detected.

## Architecture

- **Lambda Functions**: Two scanning functions (EBS encryption, Security Group rules)
- **RDS MySQL**: Persistent storage for compliance scan results
- **CloudWatch Events**: Scheduled triggers every 6 hours
- **SNS**: Notification system for compliance violations
- **CloudWatch Dashboard**: Real-time monitoring and metrics
- **Custom Resource**: Validates 10+ compliance rules during deployment

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- IAM permissions to create Lambda, RDS, VPC, CloudWatch, SNS resources

### Deploy the Stack