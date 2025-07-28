Overview

This document provides guidance for resolving common issues when deploying the web-app-deployment.yaml CloudFormation template. This template provisions a highly available web application infrastructure including VPC, EC2 instances, ALB, and RDS.
✅ Before You Begin

Please verify the following before retrying the stack deployment:

    Your AWS account has necessary IAM permissions to create networking, compute, and database resources.

    The selected region supports all required services (especially Multi-AZ RDS and multiple Availability Zones).

    You’ve provided valid parameter values for instance types, database class, and application port.

🛠️ Common Failure Scenarios and Fixes
1. Invalid EC2 Instance Type or RDS Instance Class

Error Example:

Value 't2.invalid' at 'instanceType' failed to satisfy constraint

Fix:

    Ensure the provided EC2 instance type and RDS class are valid in the selected AWS region.

    Refer to:

        EC2 Instance Types

        RDS Instance Classes

2. Insufficient Subnet Configuration / Availability Zones

Error Example:

Auto Scaling group requires at least two Availability Zones

Fix:

    Ensure your VPC has at least two private subnets in distinct Availability Zones.

    Verify the public subnets (used for ALB) are also in separate AZs.

3. RDS Multi-AZ Creation Failed

Error Example:

DB instance class does not support Multi-AZ deployments in this region

Fix:

    Select a supported instance class for Multi-AZ (e.g., db.t3.medium or higher).

    Confirm Multi-AZ support in your chosen region.