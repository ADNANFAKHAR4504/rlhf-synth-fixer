# Task y2j4u0: Payment Processing Infrastructure Optimization

## Task Description
Create a CDK Python program to optimize an existing payment processing infrastructure by refactoring inefficient resource allocations.

## Requirements

The configuration must implement the following 10 optimizations:

1. **Lambda Memory Optimization**: Analyze and resize Lambda functions from 3008MB to appropriate memory based on CloudWatch metrics (target: 512MB-1024MB)

2. **DynamoDB Billing Mode**: Convert DynamoDB tables from provisioned to on-demand billing mode

3. **API Gateway Consolidation**: Consolidate duplicate API Gateway REST APIs into a single deployment

4. **Lambda Concurrency Limits**: Implement Lambda reserved concurrency limits to prevent throttling spikes

5. **S3 Lifecycle Policies**: Add lifecycle policies to S3 buckets to transition logs to Glacier after 30 days

6. **CloudWatch Log Retention**: Configure CloudWatch Log Groups with 7-day retention instead of never-expire

7. **NAT Gateway Replacement**: Replace NAT Gateways with NAT Instances for development environment

8. **ECS Auto Scaling**: Implement automatic scaling policies for ECS services based on CPU/memory metrics

9. **CloudWatch Dashboards**: Add CloudWatch dashboards to monitor cost optimization metrics

10. **Cost Comparison Report**: Generate cost comparison report showing before/after monthly estimates

## User Story
A fintech startup's payment processing infrastructure was hastily built during rapid growth, resulting in excessive costs and performance bottlenecks. The existing CDK code deploys redundant resources, uses oversized compute instances, and lacks proper resource tagging for cost allocation.

## Technical Context
- Production payment processing infrastructure in us-east-1 region across 2 availability zones
- Current setup includes oversized Lambda functions (3008MB memory)
- Underutilized DynamoDB tables with provisioned capacity
- Redundant API Gateway deployments
- Environment requires Python 3.9+, AWS CDK 2.100.0+, and boto3
- VPC spans 10.0.0.0/16 with public/private subnets
- AWS Organizations with consolidated billing enabled
- Cost Explorer API access required for validation

## Constraints
1. Must maintain zero-downtime during the optimization deployment
2. Total monthly AWS costs must be reduced by at least 40%
3. All Lambda functions must use ARM-based Graviton2 processors
4. Resource naming must follow pattern: {env}-{service}-{resource-type}-{identifier}
5. Must implement cost allocation tags: Environment, Team, CostCenter, Project

## Expected Output
Optimized CDK Python code that reduces infrastructure costs by 40% while maintaining performance SLAs, with automated cost tracking and monitoring dashboards.