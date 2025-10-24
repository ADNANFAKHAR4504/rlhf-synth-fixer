# Task: IoT Manufacturing Data Processing Pipeline

## Background
A manufacturing company is modernizing their factory monitoring system. They collect real-time data from various sensors on manufacturing equipment and need to process this data for real-time monitoring and historical analysis. The system must handle high throughput and provide quick access to recent metrics.

## Problem Statement
Create a containerized data processing pipeline for an IoT manufacturing system using Pulumi. The system needs to process sensor data from manufacturing equipment, cache frequently accessed metrics, and maintain data persistence.

## Infrastructure Requirements

Design and implement an infrastructure that includes:

1. **ECS Cluster** with Fargate launch type for data processing containers
2. **ElastiCache Redis cluster** for real-time metrics caching
3. **RDS PostgreSQL instance** for historical data storage
4. **Required networking components** in eu-west-1 region

## Constraints

- All database credentials must be stored in AWS Secrets Manager
- ElastiCache must be configured with encryption at rest and in-transit
- ECS Tasks must run in private subnets with outbound internet access through NAT Gateway

## Subject Areas
- CI/CD Pipeline
- Cloud Environment Setup
- Infrastructure Analysis/Monitoring
