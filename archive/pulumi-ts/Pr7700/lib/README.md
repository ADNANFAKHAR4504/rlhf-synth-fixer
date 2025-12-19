# RDS PostgreSQL Optimization

This project demonstrates infrastructure optimization using Pulumi TypeScript. It includes:

- Optimized RDS PostgreSQL instance (db.t3.large)
- Read replica for offloading read-heavy queries
- Custom parameter group with memory optimizations
- CloudWatch alarms for monitoring
- Performance Insights for query analysis
- Python optimization script for runtime cost reduction

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- Python 3.9+ (for optimization script)

## Configuration

1. Set the environment suffix:
   ```bash
   pulumi config set environmentSuffix <your-suffix>
   ```

2. Set the database password (secret):
   ```bash
   pulumi config set --secret dbPassword <your-password>
   ```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Preview the infrastructure:
   ```bash
   pulumi preview
   ```

3. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

## Infrastructure Components

### RDS Primary Instance
- **Instance Class**: db.t3.large (cost-optimized from db.r5.4xlarge)
- **Engine**: PostgreSQL 15.4
- **Storage**: 100GB gp3 (encrypted)
- **Backup Retention**: 7 days (baseline)
- **Performance Insights**: Enabled (7-day retention)
- **Deletion Protection**: Enabled

### Read Replica
- **Instance Class**: db.t3.large
- **Purpose**: Offload read-heavy reporting queries
- **Location**: Same AZ as primary for lower latency

### Parameter Group Optimizations
- **shared_buffers**: 25% of memory (512MB for 2GB RAM)
- **effective_cache_size**: 75% of memory (1.5GB)
- **Random page cost**: 1.1 (optimized for SSD)

### Monitoring
- **CPU Alarm**: Alert when CPU > 80%
- **Storage Alarm**: Alert when free storage < 15%
- **Replica Lag Alarm**: Alert when lag > 5 minutes
- **SNS Topic**: For alarm notifications

## Optimization Script

The `optimize.py` script provides runtime cost optimization:

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=<your-suffix>
export AWS_REGION=us-east-1

# Run optimization (dry-run mode)
python lib/optimize.py --dry-run

# Run actual optimization
python lib/optimize.py
```

The script:
- Reduces backup retention from 7 days to 1 day
- Validates instance sizing
- Calculates monthly cost savings
- Includes error handling and waiter logic

## Cost Optimization

This solution demonstrates significant cost savings:

1. **Instance Downsizing**: db.r5.4xlarge → db.t3.large
   - Estimated savings: ~$600/month per instance

2. **Backup Retention**: 35 days → 7 days (then 1 day via script)
   - Estimated savings: ~$50/month

3. **Single AZ**: No Multi-AZ for development/staging
   - Estimated savings: ~$300/month

4. **Performance Insights**: 7-day retention (minimal cost)
   - Cost: ~$3/month per instance

**Total estimated monthly savings**: ~$900-1000

## Testing

Run unit tests:
```bash
npm test
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

Note: Deletion protection is enabled on the primary instance. You may need to disable it first in the AWS console or update the code to set `deletionProtection: false` before destroying.

## Architecture

```
┌─────────────────────────────────────────────┐
│                   VPC                       │
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   Subnet 1   │      │   Subnet 2   │   │
│  │  (us-east-1a)│      │ (us-east-1b) │   │
│  │              │      │              │   │
│  │  ┌────────┐  │      │              │   │
│  │  │  RDS   │  │      │              │   │
│  │  │Primary │  │      │              │   │
│  │  └────────┘  │      │              │   │
│  │      │       │      │              │   │
│  │  ┌────────┐  │      │              │   │
│  │  │  Read  │  │      │              │   │
│  │  │Replica │  │      │              │   │
│  │  └────────┘  │      │              │   │
│  └──────────────┘      └──────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐      ┌──────────┐
    │ CloudWatch  │      │   SNS    │
    │   Alarms    │─────>│  Topic   │
    └─────────────┘      └──────────┘
```

## Security Considerations

- All network traffic restricted to VPC CIDR
- Database not publicly accessible
- Storage encryption enabled
- Credentials managed via Pulumi secrets
- Parameter group hardened with security best practices

## Maintenance

- **Backup Window**: 3:00-4:00 AM UTC (low traffic)
- **Maintenance Window**: Sunday 4:00-6:00 AM UTC
- **Performance Insights**: Monitor slow queries weekly
- **CloudWatch Alarms**: Review and adjust thresholds as needed
