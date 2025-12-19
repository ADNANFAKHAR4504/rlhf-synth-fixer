You are tasked with designing and implementing a high-performance serverless event processing pipeline using AWS CDK (TypeScript, CDK v2). The goal is to build a fully orchestrated, fault-tolerant, and scalable event-driven architecture for a financial analytics firm that processes real-time market data feeds.

The system must handle millions of incoming events per day with sub-second latency, while maintaining strict data consistency, auditability, and resilience under heavy load.

Core Requirements:

    1.	Event Processing Functions:
    •	Build Lambda functions (written in TypeScript) for event ingestion, validation, enrichment, and storage.
    •	All functions should run on ARM-based Graviton2 processors for optimal performance and cost-efficiency.
    •	Deploy them inside a VPC with NAT Gateway to allow secure external API calls when necessary.
    2.	Data Storage:
    •	Use DynamoDB with on-demand billing mode and point-in-time recovery (PITR) enabled.
    •	Implement a single-table design pattern using composite keys for modeling multiple entity types.
    •	Add Global Secondary Indexes (GSIs) to support time-series queries and analytical lookups.
    •	Enable cross-region replication for disaster recovery and business continuity.
    3.	Event Routing & Orchestration:
    •	Create an EventBridge custom event bus for internal routing.
    •	Configure content-based filtering rules to route events dynamically to the appropriate workflows.
    •	Implement EventBridge archive and replay capabilities to support event recovery scenarios.
    •	Orchestrate multi-step processing using AWS Step Functions, featuring:
    •	Parallel execution branches for high-throughput workflows
    •	Error handling and retry mechanisms
    •	Compensation logic for rollback scenarios
    •	Dynamic fan-out processing for large event sets
    4.	External Interfaces:
    •	Set up API Gateway HTTP APIs with JWT-based authorizers for authenticated external submissions.
    •	Integrate asynchronous error handling with Lambda Destinations and DLQ (Dead Letter Queue) mechanisms.
    5.	Observability & Monitoring:
    •	Enable AWS X-Ray for distributed tracing with custom segments for performance insights.
    •	Deploy CloudWatch dashboards with key custom metrics for real-time visibility into system health, throughput, and latency.
    •	Configure SNS topics for alerting — sending critical notifications via email and SMS.
    6.	Scalability & Resilience:
    •	Implement auto-scaling policies for DynamoDB based on consumed capacity metrics.
    •	Design the system for multi-AZ redundancy within us-east-1, ensuring high availability.
    •	Include circuit breakers and retry logic for all service integrations to maintain resilience under failure conditions.
