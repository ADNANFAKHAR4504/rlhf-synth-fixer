# Task: Application Deployment

## Background

SmartFactory Inc. needs to modernize their manufacturing monitoring system. They collect telemetry data from industrial equipment across multiple facilities. The data must be processed in real-time for predictive maintenance and quality control, with strict requirements for data retention and processing latency.

## Problem Statement

Design and implement a high-availability containerized architecture for a manufacturing company's IoT sensor data processing platform using Pulumi. The system must handle real-time sensor data from 10,000+ industrial machines, process it for anomaly detection, and store it in compliance with manufacturing regulatory requirements.

## Requirements

### Setup
Create a production-grade environment with:

### Components
- ECS Fargate cluster for containerized workloads
- Kinesis Data Streams for real-time data ingestion
- ElastiCache Redis cluster for temporary storage and caching
- RDS Aurora PostgreSQL cluster for persistent storage
- EFS for shared storage between containers
- API Gateway for external system integration
- SecretsManager for credential management

## Constraints

Data processing latency must not exceed 2 seconds from ingestion to storage; System must maintain 99.99% uptime with automated failover; All data must be encrypted at rest and in transit with audit logging for compliance

## Subject Labels

- Infrastructure Analysis/Monitoring
- Security Configuration as Code
