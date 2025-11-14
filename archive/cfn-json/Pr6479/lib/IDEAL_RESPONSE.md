# Ideal Response - CloudFormation JSON Implementation

This document describes the ideal implementation for the highly available web application infrastructure for financial services.

## Implementation Summary

The CloudFormation JSON template in `lib/template.json` provides a complete, production-grade infrastructure solution that satisfies all 8 mandatory requirements and all 8 security constraints.

## Architecture Highlights

### 1. Multi-AZ High Availability (3 Availability Zones)

**Network Design**:
- VPC with dynamically calculated CIDR blocks using `Fn::Cidr` function
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
- 3 private subnets (10.0.3.0/24, 10.0.4.0/24, 10.0.5.0/24)
- Each subnet automatically placed in different AZ using `Fn::GetAZs`

**Redundancy**:
- 3 NAT Gateways (one per AZ) with dedicated Elastic IPs
- 3 private route tables (one per private subnet)
- Auto Scaling Group distributes instances across all 3 AZs
- RDS Aurora reader instance provides read redundancy

### 2. Database Layer - RDS Aurora MySQL

**Configuration**:
- Engine: `aurora-mysql` version 8.0.mysql_aurora.3.04.0
- 1 Writer instance: `db.t3.medium`
- 1 Reader instance: `db.t3.medium`
- Storage encryption: Customer-managed KMS key
- Backup retention: 7 days
- CloudWatch Logs exports: error, general, slowquery

**Security**:
- Deployed in DB subnet group (private subnets)
- Master credentials generated and stored in Secrets Manager
- Automatic credential rotation every 30 days via Lambda
- Security group allows only EC2 and Lambda security groups on port 3306

### 3. Application Layer - Auto Scaling EC2

**Configuration**:
- Launch Template with Amazon Linux 2023 (latest AMI via SSM parameter)
- Instance type: t3.medium (configurable)
- Min: 2, Max: 6, Desired: 2
- Health check type: ELB with 300-second grace period
- Distributed across 3 private subnets

**Security**:
- IMDSv2 enforced via MetadataOptions (HttpTokens: required)
- IAM instance profile with permissions for:
  - CloudWatch agent (metrics and logs)
  - Secrets Manager (read RDS credentials)
  - SSM Session Manager (no SSH keys needed)
  - KMS (decrypt secrets)

**User Data**:
- Installs and configures CloudWatch agent
- Sets up Apache httpd web server
- Creates health check endpoint at `/health`
- Configures application with database connection

### 4. Load Balancing - Application Load Balancer

**Configuration**:
- Scheme: internet-facing
- Deployed across 3 public subnets
- Target group health checks on `/health` endpoint
- Health check: 30s interval, 2 healthy threshold, 3 unhealthy threshold

**HTTPS Support**:
- Conditional HTTPS listener (requires SSL certificate parameter)
- TLS policy: ELBSecurityPolicy-TLS-1-2-2017-01
- HTTP listener redirects to HTTPS (if certificate provided)
- HTTP listener forwards to target group (if no certificate)

### 5. Security Architecture

**KMS Encryption**:
- Customer-managed KMS key for RDS encryption
- Key policy allows RDS service and root account access
- Key alias: `alias/rds-${EnvironmentSuffix}`

**Secrets Manager**:
- Secret: RDS master username and auto-generated password
- Password: 32 characters, excludes problematic characters
- Rotation: Lambda function with 30-day automatic schedule
- Secret name: `rds-credentials-${EnvironmentSuffix}`

**Lambda Rotation Function**:
- Runtime: Python 3.11
- Deployed in VPC (private subnets)
- Implements 4-step rotation: createSecret, setSecret, testSecret, finishSecret
- Timeout: 300 seconds (5 minutes)
- Security group allows outbound to RDS and AWS API endpoints

**Security Groups**:
1. **ALB Security Group**:
   - Inbound: 443 from 0.0.0.0/0 (HTTPS), 80 from 0.0.0.0/0 (HTTP redirect)
   - Outbound: 80 to EC2 security group

2. **EC2 Security Group**:
   - Inbound: 80 from ALB security group
   - Outbound: 443/80 for updates, 3306 to DB security group

3. **Database Security Group**:
   - Inbound: 3306 from EC2 and Lambda security groups
   - Outbound: 127.0.0.1/32 (deny all)

4. **Lambda Security Group**:
   - Inbound: None
   - Outbound: 3306 to DB security group, 443 for AWS API calls

### 6. Monitoring and Logging

**VPC Flow Logs**:
- Destination: CloudWatch Logs
- Log group: `/aws/vpc/flowlogs-${EnvironmentSuffix}`
- Retention: 30 days
- Traffic type: ALL
- IAM role: Dedicated VPC Flow Logs role with CloudWatch permissions

**CloudWatch Alarms**:
- **CPUAlarmHigh**: Triggers scale-up when CPU > 70% for 10 minutes
- **CPUAlarmLow**: Triggers scale-down when CPU < 30% for 10 minutes

**CloudWatch Agent** (on EC2):
- Collects httpd access and error logs
- Sends to `/aws/ec2/${EnvironmentSuffix}/httpd` log group
- Collects memory and disk metrics
- Custom namespace: `FinancialApp/${EnvironmentSuffix}`

### 7. Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- VPC: `vpc-prod`
- Subnets: `public-subnet-1-prod`, `private-subnet-1-prod`
- ALB: `alb-prod`
- RDS: `aurora-cluster-prod`, `aurora-writer-prod`
- Security Groups: `alb-sg-prod`, `ec2-sg-prod`
- Lambda: `secret-rotation-prod`

### 8. Tagging Strategy

All resources include 4 required tags:
- **Name**: Resource-specific name with environmentSuffix
- **Environment**: Environment type (development/staging/production)
- **Project**: Project name (financial-transactions)
- **CostCenter**: Cost allocation (engineering)

## Mandatory Requirements - Implementation Details

### Requirement 1: VPC with 3 Public and 3 Private Subnets

**Implementation**:
- `VPC` resource with configurable CIDR (default: 10.0.0.0/16)
- `PublicSubnet1`, `PublicSubnet2`, `PublicSubnet3` with `MapPublicIpOnLaunch: true`
- `PrivateSubnet1`, `PrivateSubnet2`, `PrivateSubnet3` without public IPs
- CIDR blocks calculated using `Fn::Cidr` function for consistency
- AZs selected using `Fn::GetAZs` and `Fn::Select` for dynamic placement

**Verification**:
```bash
# Count subnets in stack
aws ec2 describe-subnets --filters "Name=tag:aws:cloudformation:stack-name,Values=financial-app-prod" --query 'Subnets[].Tags[?Key==`Name`].Value' --output table
```

### Requirement 2: RDS Aurora MySQL Cluster (1 Writer, 1 Reader)

**Implementation**:
- `DBCluster` resource: Aurora MySQL 8.0
- `DBInstanceWriter` resource: db.t3.medium, clustered
- `DBInstanceReader` resource: db.t3.medium, read replica
- `DBSubnetGroup`: Spans all 3 private subnets
- Storage encrypted with `KMSKey` reference

**Verification**:
```bash
# Verify cluster and instances
aws rds describe-db-clusters --db-cluster-identifier aurora-cluster-prod
aws rds describe-db-instances --filters "Name=db-cluster-id,Values=aurora-cluster-prod"
```

### Requirement 3: Application Load Balancer with Target Group

**Implementation**:
- `ApplicationLoadBalancer` resource: Type=application, Scheme=internet-facing
- `ALBTargetGroup` resource: Port 80, Protocol HTTP
- Health check: Path=/health, Interval=30s, Timeout=5s
- `ALBListenerHTTPS` and `ALBListenerHTTP` for traffic routing
- ALB deployed across all 3 public subnets

**Verification**:
```bash
# Check ALB and target health
aws elbv2 describe-load-balancers --names alb-prod
aws elbv2 describe-target-health --target-group-arn <arn>
```

### Requirement 4: Auto Scaling Group (Min 2, Max 6, t3.medium)

**Implementation**:
- `LaunchTemplate` resource: Latest Amazon Linux 2023, t3.medium
- `AutoScalingGroup` resource: MinSize=2, MaxSize=6, DesiredCapacity=2
- `VPCZoneIdentifier`: All 3 private subnets
- `HealthCheckType`: ELB (considers target group health)
- `HealthCheckGracePeriod`: 300 seconds

**Verification**:
```bash
# Check ASG configuration and instances
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-prod
aws ec2 describe-instances --filters "Name=tag:aws:autoscaling:groupName,Values=asg-prod"
```

### Requirement 5: NAT Gateways in Each AZ

**Implementation**:
- `NatGateway1`, `NatGateway2`, `NatGateway3` resources
- Each NAT Gateway in different public subnet (different AZ)
- `EIP1`, `EIP2`, `EIP3`: Dedicated Elastic IPs
- `PrivateRouteTable1/2/3`: Each private subnet routes to its AZ's NAT Gateway
- `PrivateRoute1/2/3`: 0.0.0.0/0 -> NatGateway

**Verification**:
```bash
# List NAT Gateways and their AZs
aws ec2 describe-nat-gateways --filter "Name=tag:aws:cloudformation:stack-name,Values=financial-app-prod"
```

### Requirement 6: Security Groups with Explicit Rules

**Implementation**:
- `ALBSecurityGroup`: Explicit inbound (443, 80) and outbound (80 to EC2)
- `EC2SecurityGroup`: Explicit inbound (80 from ALB) and outbound (443, 80, 3306)
- `DBSecurityGroup`: Explicit inbound (3306 from EC2 and Lambda) and restricted outbound
- `LambdaSecurityGroup`: Explicit outbound (3306 to DB, 443 for AWS APIs)
- All rules use security group references (no broad CIDR ranges except ALB)

**Verification**:
```bash
# Review security group rules
aws ec2 describe-security-groups --filters "Name=tag:aws:cloudformation:stack-name,Values=financial-app-prod" --query 'SecurityGroups[].{Name:GroupName,Ingress:IpPermissions,Egress:IpPermissionsEgress}'
```

### Requirement 7: CloudWatch Logs for VPC Flow Logs (30-day retention)

**Implementation**:
- `VPCFlowLogsLogGroup` resource: LogGroupName=/aws/vpc/flowlogs-${EnvironmentSuffix}
- `RetentionInDays`: 30
- `VPCFlowLogs` resource: ResourceType=VPC, TrafficType=ALL
- `VPCFlowLogsRole`: IAM role with CloudWatch Logs permissions
- Log destination: cloud-watch-logs

**Verification**:
```bash
# Check VPC Flow Logs configuration
aws ec2 describe-flow-logs --filter "Name=resource-id,Values=<vpc-id>"
aws logs describe-log-groups --log-group-name-prefix /aws/vpc/flowlogs
```

### Requirement 8: Secrets Manager with Lambda Rotation

**Implementation**:
- `DBSecret` resource: GenerateSecretString with username template
- Password: 32 characters, excludes problematic characters
- `SecretRotationLambda` resource: Python 3.11 rotation function
- Lambda implements 4-step rotation process
- `SecretRotationSchedule` resource: AutomaticallyAfterDays=30
- `SecretRotationLambdaRole`: Permissions for Secrets Manager and RDS access

**Verification**:
```bash
# Check secret and rotation schedule
aws secretsmanager describe-secret --secret-id rds-credentials-prod
aws secretsmanager get-secret-value --secret-id rds-credentials-prod
```

## Security Constraints - Implementation Details

### Constraint 1: Database Credentials in Secrets Manager with Rotation

**Implementation**:
- Secrets Manager generates secure password (32 chars)
- Lambda function rotates credentials every 30 days
- Rotation function updates both secret and database password
- EC2 instances retrieve credentials at runtime via IAM role

### Constraint 2: RDS Encrypted Storage with Customer-Managed KMS

**Implementation**:
- `KMSKey` resource with appropriate key policy
- `DBCluster.StorageEncrypted: true`
- `DBCluster.KmsKeyId: Ref(KMSKey)`
- Key policy allows RDS service to use key

### Constraint 3: ALB HTTPS-Only with SSL Termination

**Implementation**:
- `ALBListenerHTTPS` on port 443 with TLS 1.2 policy
- `ALBListenerHTTP` redirects to HTTPS (if certificate provided)
- Conditional resource creation using `HasSSLCertificate` condition
- SSL certificate ARN passed as parameter

### Constraint 4: EC2 IMDSv2 Exclusively

**Implementation**:
- `LaunchTemplate.MetadataOptions.HttpTokens: required`
- `HttpPutResponseHopLimit: 1`
- `HttpEndpoint: enabled`
- Prevents IMDSv1 access completely

### Constraint 5: All Resources Tagged (Environment, Project, CostCenter)

**Implementation**:
- All resources include Tags array with 4 tags
- Tags use `Ref` function to reference parameters
- Consistent tagging across all resource types
- Auto Scaling Group tags have `PropagateAtLaunch: true`

### Constraint 6: VPC Flow Logs to CloudWatch (30-day retention)

**Implementation**:
- See Requirement 7 implementation above
- 30-day retention enforced via `RetentionInDays: 30`

### Constraint 7: Security Groups Follow Least-Privilege

**Implementation**:
- No 0.0.0.0/0 inbound rules except ALB (public-facing)
- All rules use security group references for internal traffic
- Database security group has minimal outbound (127.0.0.1/32)
- Each security group follows principle of least privilege

### Constraint 8: Blue-Green Deployment Support

**Implementation**:
- `EnvironmentSuffix` parameter allows parallel stacks
- Launch template versioning supports rolling updates
- Parameters can be updated to change configuration
- No DeletionPolicy=Retain (allows clean removal)

## CloudFormation Best Practices Implemented

1. **Parameters**: Flexible configuration without template changes
2. **Conditions**: Conditional HTTPS listener based on SSL certificate
3. **Intrinsic Functions**: Dynamic resource configuration (Fn::GetAZs, Fn::Cidr, Fn::Sub)
4. **DependsOn**: Explicit dependencies for proper ordering
5. **Outputs**: Export key resource identifiers for cross-stack references
6. **NoEcho**: Sensitive parameters (DBMasterUsername) hidden in console
7. **Tags**: Comprehensive tagging for cost allocation and management
8. **DeletionPolicy**: Not set (default Delete) for clean stack removal

## Testing Strategy

### Unit Tests

Test individual resource configurations:
- Parameter validation (regex patterns, allowed values)
- Resource naming conventions
- Security group rule completeness
- Tag presence on all resources

### Integration Tests

Test deployed stack:
- VPC connectivity (public/private subnet routing)
- ALB health checks passing
- RDS connectivity from EC2
- Auto scaling triggers
- Secrets rotation execution
- VPC Flow Logs generation

### Security Tests

Validate security constraints:
- IMDSv2 enforcement on EC2
- RDS encryption enabled
- Secrets Manager rotation configured
- Security group least-privilege rules
- VPC Flow Logs enabled with correct retention

## Deployment Validation Checklist

After deployment, verify:

- [ ] Stack status is `CREATE_COMPLETE`
- [ ] All 11 stack outputs are populated
- [ ] ALB DNS name resolves and responds
- [ ] Auto Scaling Group has 2 healthy instances
- [ ] RDS cluster has 1 writer and 1 reader instance
- [ ] All target group targets are healthy
- [ ] VPC Flow Logs are being generated
- [ ] Secrets Manager secret has rotation schedule
- [ ] CloudWatch alarms are in `OK` or `INSUFFICIENT_DATA` state
- [ ] All resources have required tags

## Performance Characteristics

### Expected Performance

- **Application Response Time**: < 200ms (depends on application code)
- **RDS Query Performance**: < 50ms for simple queries
- **Auto Scaling Response**: 3-5 minutes to add new instances
- **ALB Health Check**: 30-second intervals
- **Failover Time**: < 2 minutes (if one AZ fails)

### Scaling Behavior

- **Scale Up**: CPU > 70% for 10 minutes → +1 instance
- **Scale Down**: CPU < 30% for 10 minutes → -1 instance
- **Cooldown**: 5 minutes between scaling actions
- **Maximum Capacity**: 6 instances across 3 AZs

## Disaster Recovery

### Backup Strategy

- **RDS**: Automated daily backups (7-day retention)
- **RDS**: Aurora continuous backup to S3
- **Configuration**: CloudFormation template in version control

### Recovery Procedures

1. **AZ Failure**:
   - Auto Scaling launches instances in healthy AZs
   - RDS reader promotes to writer if needed
   - NAT Gateways in other AZs handle traffic

2. **Complete Stack Loss**:
   - Restore from CloudFormation template
   - RDS restores from latest snapshot
   - Secrets Manager recreates from backup

3. **Data Corruption**:
   - Point-in-time restore from RDS backups
   - Choose specific timestamp within 7-day window

## Compliance Considerations

This implementation helps meet common compliance requirements:

- **PCI DSS**: Encryption at rest and in transit, network segmentation
- **SOC 2**: Logging and monitoring (VPC Flow Logs, CloudWatch)
- **HIPAA**: Encryption, access controls, audit logging
- **GDPR**: Data encryption, access logging, secure deletion

**Note**: Full compliance requires additional application-level controls and policies beyond infrastructure.

## Conclusion

This CloudFormation template provides a complete, production-ready implementation that:

- Satisfies all 8 mandatory requirements
- Meets all 8 security constraints
- Follows AWS Well-Architected Framework principles
- Implements CloudFormation best practices
- Supports operational excellence through monitoring and logging
- Enables cost optimization through right-sized resources
- Provides foundation for compliance requirements

The implementation is ready for production deployment and can be customized via parameters without template modifications.
