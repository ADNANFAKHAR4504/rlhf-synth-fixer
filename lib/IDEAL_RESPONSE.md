# Migration Infrastructure - Ideal CloudFormation Solution

This CloudFormation template provides a comprehensive migration infrastructure for moving an on-premises application to AWS with minimal downtime using DMS, VPN, Aurora MySQL, and Application Load Balancer.

## Architecture Overview

The solution creates a complete migration infrastructure with:

1. **VPC Network Infrastructure** (10.0.0.0/16)
   - 2 Public Subnets across 2 AZs for internet-facing resources
   - 2 Private Subnets across 2 AZs for database and DMS
   - Internet Gateway for public subnet internet access
   - NAT Gateway for private subnet outbound connectivity

2. **VPN Connectivity**
   - VPN Gateway attached to VPC
   - Customer Gateway representing on-premises VPN endpoint
   - Site-to-Site VPN Connection with static routes
   - VPN route propagation to private route table

3. **Aurora MySQL Database**
   - Aurora Serverless V2 cluster (0.5-1 ACU) for cost optimization
   - Multi-AZ deployment with read endpoint
   - Backup retention: 7 days
   - Database credentials stored in Secrets Manager
   - Security group allowing access from web tier, DMS, and on-premises

4. **DMS Replication**
   - DMS replication instance (dms.t3.medium) in private subnets
   - Source endpoint for on-premises MySQL
   - Target endpoint for Aurora MySQL
   - Replication task with full-load-and-cdc migration type
   - Comprehensive logging configuration
   - On-premises DB credentials stored in Secrets Manager

5. **Application Load Balancer**
   - Internet-facing ALB in public subnets
   - HTTP listener on port 80
   - Target group with health checks
   - Security group allowing HTTP/HTTPS from internet

6. **Security**
   - 4 security groups (ALB, Web Tier, Database, DMS)
   - Least-privilege access controls
   - Database accessible only from web tier, DMS, and on-premises
   - All credentials stored in AWS Secrets Manager

7. **Monitoring**
   - CloudWatch alarm for DMS replication lag (300s threshold)
   - CloudWatch alarm for DMS task failures
   - CloudWatch alarm for Aurora database connections (80 threshold)
   - CloudWatch alarm for Aurora CPU utilization (80% threshold)
   - CloudWatch dashboard URL output for easy access

## Key Features

### Resource Naming
All resources include `${EnvironmentSuffix}` for multi-environment deployments:
- VPC: `migration-vpc-${EnvironmentSuffix}`
- Aurora Cluster: `migration-aurora-cluster-${EnvironmentSuffix}`
- DMS Instance: `migration-dms-instance-${EnvironmentSuffix}`
- ALB: `migration-alb-${EnvironmentSuffix}`

### Destroyability
All critical resources configured with:
- `DeletionPolicy: Delete` on Aurora cluster and instance
- No deletion protection enabled
- Allows complete stack cleanup

### Cost Optimization
- Aurora Serverless V2 (0.5-1 ACU) instead of provisioned instances
- Single NAT Gateway (not one per AZ)
- Single-AZ DMS replication instance
- Minimal backup retention (7 days)

### High Availability
- Multi-AZ VPC design
- Aurora read endpoint for read scalability
- ALB across two availability zones
- DMS supports continuous data replication (CDC)

## Parameters

The template accepts these parameters for environment-specific configuration:

1. **EnvironmentSuffix**: Environment identifier (dev/staging/prod)
2. **OnPremisesCIDR**: On-premises network CIDR
3. **CustomerGatewayIP**: Public IP of on-premises VPN device
4. **DBMasterUsername**: Aurora master username
5. **DBMasterPassword**: Aurora master password (NoEcho)
6. **OnPremisesDBEndpoint**: On-premises database endpoint
7. **OnPremisesDBPort**: On-premises database port
8. **OnPremisesDBName**: On-premises database name
9. **OnPremisesDBUsername**: On-premises database username
10. **OnPremisesDBPassword**: On-premises database password (NoEcho)

## Outputs

The stack provides 23 comprehensive outputs:

### Network Outputs
- VPCId, PublicSubnet1Id, PublicSubnet2Id, PrivateSubnet1Id, PrivateSubnet2Id

### VPN Outputs
- VPNGatewayId, CustomerGatewayId, VPNConnectionId

### Database Outputs
- AuroraClusterEndpoint, AuroraClusterReadEndpoint, AuroraClusterPort
- AuroraDBSecretArn

### DMS Outputs
- DMSReplicationInstanceArn, DMSReplicationTaskArn
- OnPremisesDBSecretArn

### Application Outputs
- ApplicationLoadBalancerDNS, ApplicationLoadBalancerArn
- ALBTargetGroupArn

### Security Outputs
- WebTierSecurityGroupId, DatabaseSecurityGroupId

### Monitoring Outputs
- CloudWatchDashboardURL

### Stack Metadata
- EnvironmentSuffix, StackName

All outputs include export names for cross-stack references.

## Deployment Instructions

1. Prepare parameters:
   ```bash
   export ENV_SUFFIX="dev"
   export CUSTOMER_GATEWAY_IP="203.0.113.1"
   export ONPREM_DB_ENDPOINT="mysql.onprem.local"
   export ONPREM_DB_USER="app_user"
   export ONPREM_DB_PASS="SecurePassword123!"
   export AURORA_MASTER_PASS="AuroraSecure456!"
   ```

2. Deploy stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name tap-stack-${ENV_SUFFIX} \
     --template-body file://lib/TapStack.yml \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=${ENV_SUFFIX} \
       ParameterKey=CustomerGatewayIP,ParameterValue=${CUSTOMER_GATEWAY_IP} \
       ParameterKey=OnPremisesDBEndpoint,ParameterValue=${ONPREM_DB_ENDPOINT} \
       ParameterKey=OnPremisesDBUsername,ParameterValue=${ONPREM_DB_USER} \
       ParameterKey=OnPremisesDBPassword,ParameterValue=${ONPREM_DB_PASS} \
       ParameterKey=DBMasterPassword,ParameterValue=${AURORA_MASTER_PASS}
   ```

3. Monitor stack creation:
   ```bash
   aws cloudformation wait stack-create-complete \
     --stack-name tap-stack-${ENV_SUFFIX}
   ```

4. Retrieve outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name tap-stack-${ENV_SUFFIX} \
     --query 'Stacks[0].Outputs'
   ```

## Migration Workflow

1. **VPN Setup**: Configure on-premises VPN device with VPN connection details
2. **Network Validation**: Verify connectivity from on-premises to AWS VPC
3. **Database Preparation**: Create Aurora database schema matching on-premises
4. **DMS Configuration**: Start DMS replication task for full load + CDC
5. **Monitor Replication**: Watch CloudWatch alarms for replication lag
6. **Application Migration**: Deploy web tier instances to private subnets
7. **ALB Configuration**: Register web tier instances with ALB target group
8. **DNS Cutover**: Update DNS to point to ALB DNS name
9. **Validation**: Verify application functionality through ALB
10. **Cleanup**: Stop on-premises application after successful migration

## Security Considerations

- All database passwords use NoEcho parameter
- Credentials stored in AWS Secrets Manager
- Security groups follow least-privilege principle
- Database not publicly accessible
- VPN provides encrypted communication to on-premises
- CloudWatch alarms for anomaly detection

## Best Practices Implemented

1. **Infrastructure as Code**: Complete stack defined in CloudFormation
2. **Parameterization**: Environment-specific values as parameters
3. **Resource Tagging**: All resources tagged with Name including EnvironmentSuffix
4. **Monitoring**: CloudWatch alarms for critical metrics
5. **High Availability**: Multi-AZ design
6. **Cost Optimization**: Serverless Aurora, minimal resource sizing
7. **Security**: Secrets Manager, security groups, private subnets
8. **Destroyability**: No retain policies for complete cleanup

## Cost Estimate (us-east-1)

Approximate monthly costs:
- VPC (NAT Gateway): $32.85
- Aurora Serverless V2 (0.5 ACU average): $43.80
- DMS Replication Instance (t3.medium): $66.00
- Application Load Balancer: $16.20
- VPN Connection: $36.00
- Secrets Manager: $0.80
- **Total**: ~$195.65/month

Actual costs vary based on:
- Aurora scaling (0.5-1 ACU range)
- Data transfer volumes
- DMS replication duration
- ALB data processing

## Resource Count

The template creates 47 AWS resources:
- 1 VPC
- 4 Subnets
- 2 Route Tables
- 1 Internet Gateway
- 1 NAT Gateway
- 1 EIP
- 1 VPN Gateway
- 1 Customer Gateway
- 1 VPN Connection
- 4 Security Groups
- 2 Secrets Manager Secrets
- 1 RDS Subnet Group
- 1 Aurora Cluster
- 1 Aurora Instance
- 1 DMS Subnet Group
- 1 DMS Replication Instance
- 2 DMS Endpoints
- 1 DMS Replication Task
- 1 Application Load Balancer
- 1 ALB Target Group
- 1 ALB Listener
- 4 CloudWatch Alarms
- Plus route table associations and VPC attachments

This comprehensive infrastructure provides a production-ready migration platform with all necessary components for a phased on-premises to AWS migration.
