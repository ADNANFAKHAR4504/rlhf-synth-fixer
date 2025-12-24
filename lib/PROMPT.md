# CI/CD Pipeline with AWS Fargate Infrastructure

I need to set up a complete CI/CD pipeline for deploying a web application to AWS Fargate using Pulumi JavaScript. The solution should be production-ready and include automated deployment, scaling, and monitoring capabilities.

## Core Requirements

The infrastructure must include these essential components:

1. **ECS Fargate Deployment**: Deploy the application on AWS Fargate without managing servers directly. The setup should include an ECS cluster, service, and task definitions optimized for containerized applications.

2. **Automated CI/CD Workflow**: Implement automated deployment pipeline using GitHub CI/CD that triggers when code is pushed to the main branch. This should handle building, testing, and deploying the application seamlessly.

3. **Auto Scaling Configuration**: Use AWS Auto Scaling to handle varying load patterns. Configure scaling policies based on CPU and memory metrics to ensure optimal performance during traffic spikes.

4. **Environment Variables Management**: Implement secure handling of sensitive data like API keys and database credentials using AWS Systems Manager Parameter Store or AWS Secrets Manager.

5. **Infrastructure Testing**: Include automated tests to validate that the infrastructure components are properly configured and that scaling policies work correctly.

6. **Networking and Security**: Set up proper VPC configuration with public and private subnets, security groups, and load balancing for production traffic distribution.

## Technical Specifications

- **Target Region**: us-west-2  
- **Naming Convention**: Use 'ci-cd-pipeline-*' prefix for all resources
- **Container Platform**: AWS Fargate (serverless containers)
- **Load Balancer**: Application Load Balancer for HTTP/HTTPS traffic
- **Monitoring**: CloudWatch Container Insights with Enhanced Observability for detailed container metrics
- **Service Discovery**: ECS Service Connect for service-to-service communication

## Latest AWS Features Integration

Please incorporate these recent AWS capabilities:

- **CloudWatch Container Insights Enhanced Observability**: Enable the new enhanced monitoring features launched in December 2024 for detailed task and container-level metrics with automatic anomaly detection
- **ECS Service Connect**: Implement service discovery and load balancing between services using the latest ECS Service Connect features

## Infrastructure Code Requirements

Generate infrastructure code using Pulumi with JavaScript that creates all necessary AWS resources. The code should be organized with clear separation of concerns - VPC components, ECS resources, monitoring setup, and CI/CD integration should be in separate logical modules.

Provide complete working code that can be deployed immediately, including GitHub CI/CD workflow files for the deployment pipeline. Make sure all resource names follow the specified naming conventions and that the infrastructure is optimized for the us-west-2 region.