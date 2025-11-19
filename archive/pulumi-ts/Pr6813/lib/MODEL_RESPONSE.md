# ECS Fargate Multi-Service Platform - Pulumi TypeScript Implementation

This implementation provides a complete containerized microservices platform on AWS ECS Fargate with production-grade features including multi-AZ high availability, auto-scaling, service discovery, comprehensive security controls, and observability.

## Architecture Overview

The infrastructure creates a three-service architecture (frontend, api-gateway, processing-service) deployed on ECS Fargate with:
- VPC spanning 3 availability zones with public and private subnets
- Application Load Balancer for HTTP/HTTPS traffic distribution
- ECR repositories for container images with lifecycle policies
- AWS Cloud Map for service discovery
- Secrets Manager for sensitive configuration
- CloudWatch Logs for comprehensive logging
- Auto-scaling based on CPU utilization
- IAM roles following least-privilege principles

