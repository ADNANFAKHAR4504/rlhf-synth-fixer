# Infrastructure Requirements for GlobeCart E-Commerce Platform

I need help setting up a high availability database infrastructure for our e-commerce platform using Pulumi with Python in the ca-central-1 region

## Background

We're building infrastructure for GlobeCart, an e-commerce platform that needs to handle increasing transaction loads while maintaining PCI DSS compliance. The system needs to provide fast access to product catalogs and user sessions across multiple availability zones.

## Core Requirements

Create infrastructure code that includes:

1. A VPC with public and private subnets spread across at least 2 availability zones
2. An RDS Aurora PostgreSQL cluster with automatic failover and read replicas for scaling
3. ElastiCache Redis cluster for session management that can scale horizontally
4. ECS Fargate cluster to run our application containers with EBS volume support
5. EFS for persistent storage that the ECS tasks can mount
6. Secrets Manager to store database credentials with automatic rotation every 30 days

## Critical Constraints

The database credentials must rotate automatically every 30 days. This means I need a Lambda function that handles the rotation logic and connects it to Secrets Manager.

The solution must have separate read and write endpoints for the database with automatic failover. If the primary database fails, it should automatically failover to a replica without losing any data.

## Technical Specifications

For the Aurora cluster, use Aurora Serverless v2 with the ability to scale based on load. Make sure it supports PostgreSQL version 15 or higher.

The ElastiCache Redis cluster should be configured in cluster mode to support horizontal scaling and should be spread across multiple availability zones.

For ECS, use Fargate as the launch type with autoscaling configured based on CPU utilization. The tasks should be able to connect to both the RDS cluster and ElastiCache.

All resources need proper security groups to ensure the ECS tasks can communicate with RDS and ElastiCache, but external access should be restricted.

## Outputs

The infrastructure code should export the following:
- RDS cluster endpoint (writer)
- RDS cluster reader endpoint
- ElastiCache cluster configuration endpoint
- ECS cluster name
- EFS file system ID
- Secret ARN for database credentials

Please provide the complete Pulumi Python code with proper resource organization. Include one code block per file so I can easily copy and use them.
