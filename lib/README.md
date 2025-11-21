# ECS Fargate Cost-Optimized Infrastructure

This Pulumi Python infrastructure implements a production-ready, cost-optimized ECS Fargate deployment for payment processing workloads. The solution achieves 40%+ cost reduction while maintaining sub-200ms response time SLAs.

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet Gateway                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Application Load Balancer (ALB)                 │
│                 (Public Subnets - 2 AZs)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              ECS Fargate Tasks (2-10 instances)              │
│            (Private Subnets - 2 AZs, Spot capacity)          │
│                  256 CPU / 512 MB Memory                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│         CloudWatch Container Insights & Monitoring           │
│            (7-day log retention, alarms, dashboard)          │
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure Components

1. **VPC Stack** (`vpc_stack.py`)
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets (for ALB) across 2 AZs
   - 2 private subnets (for ECS tasks) across 2 AZs
   - Internet Gateway for public subnet routing
   - Single NAT Gateway for private subnet internet access
   - Route tables for public and private subnets

2. **ALB Stack** (`alb_stack.py`)
   - Application Load Balancer (internet-facing)
   - Target group with IP targets for ECS
   - Health checks every 10 seconds
   - Connection draining (30 seconds)
   - Security group allowing HTTP/HTTPS ingress

3. **ECS Stack** (`ecs_stack.py`)
   - ECS Cluster with Container Insights enabled
   - Fargate Spot capacity provider (70% cost savings)
   - Right-sized task definition (256 CPU / 512 MB)
   - ECS Service with 2-10 task auto-scaling
   - IAM roles (execution and task roles)
   - Security group for task-to-ALB communication
   - CloudWatch log group (7-day retention)

4. **Monitoring Stack** (`monitoring_stack.py`)
   - CloudWatch dashboard for metrics visualization
   - CPU and memory utilization alarms (85% and 90%)
   - Response time alarm (200ms SLA threshold)
   - Unhealthy target alarm
   - SNS topic for alarm notifications

5. **Main Stack** (`tap_stack.py`)
   - Orchestrates all sub-stacks
   - Manages environment suffix for resource naming
   - Exports stack outputs

## Cost Optimization Features

### 1. Right-Sized Tasks (40-50% savings)
- CPU: 256 units (vs typical 512)
- Memory: 512 MB (vs typical 1024 MB)
- Optimized for payment processing workload

### 2. Fargate Spot (70% savings)
- Uses Fargate Spot capacity provider
- Automatic fallback to Fargate on-demand if needed
- Suitable for stateless payment processing

### 3. Aggressive Auto-Scaling
- Min: 2 tasks (vs typical 4+)
- Max: 10 tasks
- Target tracking: 70% CPU, 80% memory
- Scale-out cooldown: 30 seconds
- Scale-in cooldown: 60 seconds

### 4. Optimized Logging (storage cost reduction)
- CloudWatch log retention: 7 days (vs 30+ days)
- Structured logging for cost tracking
- Container Insights for detailed metrics

### 5. Infrastructure Efficiency
- 2 AZs (vs 3) - 33% cost reduction while maintaining HA
- Single NAT Gateway - $0.045/hour savings
- Minimal CIDR ranges - reduced IP waste

### 6. Monitoring & Optimization
- Container Insights for ongoing optimization
- Cost allocation tags on all resources
- Performance vs cost dashboards

## Performance Features

### Sub-200ms Response Time SLA

1. **Fast Scale-Out**: 30-second cooldown for traffic spikes
2. **Health Checks**: 10-second intervals for quick failure detection
3. **Connection Draining**: 30-second deregistration delay
4. **Target Tracking**: Proactive scaling at 70% CPU / 80% memory
5. **ALB Optimization**: 60-second idle timeout

### High Availability

- Multi-AZ deployment (2 availability zones)
- Minimum 2 tasks running at all times
- Automatic task replacement on failure
- Zero-downtime deployments (100% min healthy, 200% max)

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Pulumi CLI installed
3. Python 3.8+ installed
4. Pipenv for dependency management

### Environment Variables

Set the following environment variable before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"  # or prod, staging, etc.
export AWS_REGION="us-east-1"
```

### Installation

1. Install dependencies:
```bash
pipenv install
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Configure AWS region:
```bash
pulumi config set aws:region us-east-1
```

### Deploy Infrastructure

```bash
pulumi up
```

Review the preview and confirm to deploy.

### Access Outputs

```bash
# Get ALB URL
pulumi stack output alb_url

# Get ECS cluster name
pulumi stack output cluster_name

# Get CloudWatch dashboard
pulumi stack output dashboard_name
```

### Destroy Infrastructure

```bash
pulumi destroy
```

All resources are configured without retention policies and will be cleanly destroyed.

## Stack Outputs

- `vpc_id` - VPC ID for reference
- `cluster_name` - ECS cluster name
- `cluster_arn` - ECS cluster ARN
- `service_name` - ECS service name
- `alb_dns` - ALB DNS name
- `alb_url` - Complete ALB URL (http://)
- `target_group_arn` - Target group ARN
- `log_group_name` - CloudWatch log group name
- `dashboard_name` - CloudWatch dashboard name

## Monitoring & Observability

### CloudWatch Dashboard

Access the dashboard at:
- AWS Console → CloudWatch → Dashboards → ECS-Payment-{environment_suffix}

Widgets include:
- ECS resource utilization (CPU, memory)
- ALB response time with SLA threshold
- Request count and error rates
- Task count (auto-scaling visualization)
- Target health status
- Connection metrics

### Alarms

Four CloudWatch alarms are configured:

1. **High CPU**: Triggers when ECS CPU > 85% for 2 minutes
2. **High Memory**: Triggers when ECS memory > 90% for 2 minutes
3. **High Response Time**: Triggers when ALB response time > 200ms for 2 minutes
4. **Unhealthy Targets**: Triggers immediately when any target is unhealthy

All alarms publish to SNS topic: `ecs-alarms-{environment_suffix}`

### Container Insights

Enabled on the ECS cluster for detailed metrics:
- Task-level CPU and memory
- Network I/O
- Storage I/O
- Container startup/shutdown patterns

## Cost Monitoring

### Estimated Monthly Costs (us-east-1)

**Baseline (unoptimized):**
- ECS Fargate (512 CPU / 1024 MB, 4 tasks, on-demand): ~$105/month
- NAT Gateway (3 AZs): ~$97/month
- ALB: ~$16/month
- CloudWatch Logs (30-day retention): ~$15/month
- **Total: ~$233/month**

**Optimized (this implementation):**
- ECS Fargate (256 CPU / 512 MB, 2-4 avg tasks, Spot): ~$32/month
- NAT Gateway (1 AZ): ~$32/month
- ALB: ~$16/month
- CloudWatch Logs (7-day retention): ~$4/month
- Container Insights: ~$3/month
- **Total: ~$87/month**

**Savings: $146/month (63% reduction)**

Note: Actual costs vary based on traffic patterns, scaling behavior, and data transfer.

### Cost Allocation Tags

All resources are tagged with:
- `Environment`: {environment_suffix}
- `CostCenter`: payment-processing
- `Repository`: (from CI/CD)
- `Team`: (from CI/CD)

Use AWS Cost Explorer with these tags to track costs.

## Security

### Network Security

- ECS tasks in private subnets (no direct internet access)
- Security groups with least-privilege rules
- ALB in public subnets with restricted ingress (HTTP/HTTPS only)
- Network ACLs for additional protection

### IAM Security

- Task execution role: Only permissions for ECS task lifecycle
- Task role: Application-specific permissions (customize as needed)
- No hardcoded credentials
- Service-linked roles for ECS and ALB

### Data Security

- Encryption in transit: ALB to ECS tasks over private network
- CloudWatch Logs encrypted at rest (AWS managed keys)
- VPC flow logs can be enabled for network monitoring

## Troubleshooting

### Tasks Not Starting

1. Check ECS service events:
```bash
aws ecs describe-services --cluster $(pulumi stack output cluster_name) --services $(pulumi stack output service_name)
```

2. Check task execution role permissions
3. Check container image availability
4. Check CloudWatch Logs for container errors

### High Response Times

1. Check CloudWatch dashboard for CPU/memory utilization
2. Verify auto-scaling policies are triggering
3. Check ALB target health
4. Review Container Insights for bottlenecks

### Cost Overruns

1. Check task count: `aws ecs describe-services`
2. Review auto-scaling history
3. Check CloudWatch Logs retention
4. Verify Fargate Spot is being used

## Customization

### Change Task Size

Edit `tap.py` and modify `TapStackArgs`:

```python
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        task_cpu=512,  # Change here
        task_memory=1024  # Change here
    ),
    opts=ResourceOptions(provider=provider)
)
```

### Change Auto-Scaling Limits

Edit `lib/ecs_stack.py`, line ~260:

```python
self.scaling_target = aws.appautoscaling.Target(
    f"ecs-scaling-target-{environment_suffix}",
    max_capacity=20,  # Change here
    min_capacity=4,   # Change here
    ...
)
```

### Add Application Permissions

Edit `lib/ecs_stack.py` and attach policies to `self.task_role`:

```python
aws.iam.RolePolicyAttachment(
    f"ecs-task-custom-policy-{environment_suffix}",
    role=self.task_role.name,
    policy_arn="arn:aws:iam::aws:policy/YourCustomPolicy",
    opts=ResourceOptions(parent=self)
)
```

## Maintenance

### Update Container Image

1. Build and push new image to ECR
2. Update task definition in `lib/ecs_stack.py`:
```python
"image": "your-ecr-repo:new-tag",
```
3. Run `pulumi up`

### Scale Tasks Manually

```bash
aws ecs update-service \
  --cluster $(pulumi stack output cluster_name) \
  --service $(pulumi stack output service_name) \
  --desired-count 5
```

### View Logs

```bash
aws logs tail $(pulumi stack output log_group_name) --follow
```

## Contributing

When modifying this infrastructure:

1. Maintain environment_suffix in all resource names
2. Keep cost optimization features intact
3. Update this README with changes
4. Test in dev environment before production
5. Monitor costs after changes

## Support

For issues or questions:
1. Check CloudWatch Logs and metrics
2. Review ECS service events
3. Consult AWS documentation
4. Contact DevOps team

## License

Internal use only - Fintech payment processing infrastructure
