# Database Migration Infrastructure

This AWS CDK TypeScript project provisions infrastructure for migrating an on-premises PostgreSQL database to AWS RDS Aurora using AWS Database Migration Service (DMS).

## Architecture

The solution creates:

1. **Network Infrastructure**
   - VPC with public, private, and isolated subnets across 3 availability zones
   - Security groups for application and database tiers
   - Only port 5432 allowed from application to database

2. **Aurora PostgreSQL Database**
   - PostgreSQL version 14.7 compatibility
   - 1 writer instance and 2 reader instances
   - Custom parameter group with max_connections=1000
   - 7-day automated backup retention
   - CloudWatch logging enabled
   - Storage encryption enabled

3. **AWS Secrets Manager**
   - Secure storage of database credentials
   - Automatic rotation disabled as required

4. **AWS DMS**
   - r5.large replication instance
   - Source endpoint for on-premises PostgreSQL
   - Target endpoint for Aurora PostgreSQL
   - Migration task with full load + CDC

5. **Tagging**
   - Environment=production
   - MigrationProject=2024Q1

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 16+ installed
- AWS credentials configured
- VPN or Direct Connect to on-premises database

## Configuration

Before deploying, configure the source database connection in `cdk.context.json`:

```json
{
  "sourceHost": "your-onprem-db.example.com",
  "sourcePort": 5432,
  "sourceDatabase": "postgres",
  "sourceUsername": "postgres",
  "sourcePassword": "your-password-here"
}
```

Alternatively, pass these as context parameters during deployment:

```bash
cdk deploy \
  -c sourceHost=onprem-db.example.com \
  -c sourcePort=5432 \
  -c sourceDatabase=postgres \
  -c sourceUsername=postgres \
  -c sourcePassword=changeme \
  -c environmentSuffix=prod
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/ap-southeast-1
```

3. Synthesize CloudFormation template:
```bash
cdk synth
```

4. Deploy the stack:
```bash
cdk deploy -c environmentSuffix=prod
```

## Outputs

After deployment, the stack outputs:

- `AuroraClusterEndpoint`: Connection endpoint for write operations
- `AuroraReaderEndpoint`: Connection endpoint for read operations
- `DatabaseSecretArn`: ARN of the credentials secret
- `DMSTaskArn`: ARN of the migration task for monitoring
- `VPCId`: ID of the created VPC
- `DatabaseSecurityGroupId`: ID of the database security group

## Migration Process

1. **Deploy Infrastructure**: Run `cdk deploy` to create all resources
2. **Verify Connectivity**: Test connection from replication instance to source database
3. **Start Migration Task**: Manually start the DMS task via AWS Console or CLI
4. **Monitor Progress**: Use CloudWatch Logs and DMS console to monitor
5. **Cutover**: Once initial load completes, CDC will keep databases in sync
6. **Application Cutover**: Update application to use Aurora endpoint
7. **Cleanup**: After verification, stop the DMS task

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests (requires deployment):
```bash
npm run test:integration
```

## Resource Naming

All resources include the `environmentSuffix` parameter in their names for multi-environment support:
- `migration-vpc-{environmentSuffix}`
- `aurora-cluster-{environmentSuffix}`
- `dms-instance-{environmentSuffix}`
- etc.

## Security

- Database instances are in isolated subnets (no internet access)
- Security groups restrict access to port 5432 only
- Credentials stored in AWS Secrets Manager
- All storage encrypted at rest
- IAM roles follow least-privilege principle

## Cost Optimization

- NAT Gateway required for DMS (1 instance only)
- Consider Aurora Serverless v2 for non-production environments
- Stop DMS replication instance when not in use
- Use Reserved Instances for production workloads

## Cleanup

To destroy all resources:

```bash
cdk destroy -c environmentSuffix=prod
```

Note: This will delete the Aurora cluster. Ensure you have backups before destroying.

## Troubleshooting

### DMS Task Fails to Start

- Verify source database connectivity
- Check security group rules
- Verify source database credentials
- Check CloudWatch Logs for detailed errors

### Aurora Connection Issues

- Verify security group allows traffic from application
- Check subnet routing
- Verify credentials in Secrets Manager

### High Migration Latency

- Check DMS replication instance metrics
- Consider larger instance type (r5.xlarge or r5.2xlarge)
- Verify network bandwidth to source database

## Support

For issues or questions, contact the cloud infrastructure team.
