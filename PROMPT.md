# Task: ECS Fargate Service Optimization

Create a CDK TypeScript program to refactor and optimize an existing ECS Fargate service deployment.

## Requirements

The configuration must address the following 10 optimization requirements:

1. **Fix improper CPU/memory allocation** causing container crashes (current: 256 CPU, 512 MiB memory for a Node.js API)

2. **Implement auto-scaling** based on CPU utilization with min 1, max 5 tasks

3. **Add proper health checks** with 30-second intervals and 3 retries

4. **Configure CloudWatch Container Insights** for monitoring

5. **Set up log retention** to 7 days instead of indefinite retention

6. **Use Fargate Spot** for development environment tasks

7. **Fix missing task execution role permissions** for ECR access

8. **Implement proper tagging strategy** for cost allocation

9. **Add circuit breaker deployment configuration**

10. **Configure proper networking** with service discovery

## Platform Details

- Platform: CDK
- Language: TypeScript
- Complexity: Hard
- Task Type: IaC Program Optimization
- Subject Labels: IaC Optimization

## Deliverables

Provide a complete, production-ready CDK TypeScript implementation that addresses all 10 optimization requirements listed above. The solution should follow AWS best practices and CDK conventions.
