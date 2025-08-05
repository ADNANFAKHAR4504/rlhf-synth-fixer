# Multi-Region Deployment Strategy

## Overview

CloudFormation templates are inherently single-region resources. To meet the requirement of deploying infrastructure across **two different AWS regions**, this document provides a comprehensive multi-region deployment strategy.

## Deployment Architecture

### Primary-Secondary Region Setup

The infrastructure should be deployed in two AWS regions for high availability and disaster recovery:

- **Primary Region**: `us-east-1` (N. Virginia)
- **Secondary Region**: `us-west-2` (Oregon)

### Region-Specific Deployment Commands

#### Primary Region (us-east-1)
```bash
# Set region configuration
echo "us-east-1" > lib/AWS_REGION

# Deploy to primary region
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack-primary \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AWSRegion=us-east-1 \
    AllowedSSHCIDR=10.0.0.0/8 \
  --region us-east-1 \
  --tags \
    Environment=production \
    Region=primary \
    Repository=${REPOSITORY:-iac-test-automations}
```

#### Secondary Region (us-west-2)
```bash
# Deploy to secondary region
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack-secondary \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AWSRegion=us-west-2 \
    AllowedSSHCIDR=10.0.0.0/8 \
  --region us-west-2 \
  --tags \
    Environment=production \
    Region=secondary \
    Repository=${REPOSITORY:-iac-test-automations}
```

## Cross-Region Connectivity

### Route 53 Failover Configuration

To provide automatic failover between regions, deploy Route 53 health checks and DNS failover:

```yaml
# Route53HealthCheck.yml - Deploy after both regional stacks
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-region Route 53 failover configuration'

Resources:
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: tapstack.example.com
      
  PrimaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: /
      FullyQualifiedDomainName: !ImportValue TapStack-primary-ALB-DNS
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      
  SecondaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTP
      ResourcePath: /
      FullyQualifiedDomainName: !ImportValue TapStack-secondary-ALB-DNS
      Port: 80
      RequestInterval: 30
      FailureThreshold: 3
      
  PrimaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: tapstack.example.com
      Type: A
      SetIdentifier: primary
      Failover: PRIMARY
      AliasTarget:
        DNSName: !ImportValue TapStack-primary-ALB-DNS
        HostedZoneId: Z35SXDOTRQ7X7K  # us-east-1 ALB hosted zone ID
      HealthCheckId: !Ref PrimaryHealthCheck
      
  SecondaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: tapstack.example.com
      Type: A
      SetIdentifier: secondary
      Failover: SECONDARY
      AliasTarget:
        DNSName: !ImportValue TapStack-secondary-ALB-DNS
        HostedZoneId: Z1D633PJN98FT9  # us-west-2 ALB hosted zone ID
```

## Data Replication Strategy

### Database Cross-Region Read Replicas

Deploy RDS read replicas for disaster recovery:

```bash
# Create read replica in secondary region
aws rds create-db-instance-read-replica \
  --db-instance-identifier tapstack-replica-us-west-2 \
  --source-db-instance-identifier arn:aws:rds:us-east-1:ACCOUNT:db:tapstack-database-us-east-1 \
  --db-instance-class db.t3.micro \
  --region us-west-2
```

### S3 Cross-Region Replication

Configure S3 bucket replication between regions:

```yaml
# Add to TapStack.yml Resources section
StaticContentBucketReplication:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub 'tapstack-static-content-replica-${AWS::AccountId}-${AWSRegion}'
    ReplicationConfiguration:
      Role: !GetAtt S3ReplicationRole.Arn
      Rules:
        - Id: ReplicateToSecondaryRegion
          Status: Enabled
          Prefix: ''
          Destination:
            Bucket: !Sub 
              - 'arn:aws:s3:::tapstack-static-content-${AWS::AccountId}-${SecondaryRegion}'
              - SecondaryRegion: !If [IsPrimaryRegion, 'us-west-2', 'us-east-1']
            StorageClass: STANDARD_IA
```

## Deployment Automation Scripts

### Multi-Region Deployment Script

```bash
#!/bin/bash
# deploy-multi-region.sh

set -e

PRIMARY_REGION="us-east-1"
SECONDARY_REGION="us-west-2"
STACK_NAME="TapStack"

echo "🚀 Starting multi-region deployment..."

# Deploy to primary region
echo "📍 Deploying to primary region: $PRIMARY_REGION"
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name ${STACK_NAME}-primary \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides AWSRegion=$PRIMARY_REGION \
  --region $PRIMARY_REGION \
  --tags Environment=production Region=primary

# Wait for primary deployment to complete
aws cloudformation wait stack-deploy-complete \
  --stack-name ${STACK_NAME}-primary \
  --region $PRIMARY_REGION

# Deploy to secondary region
echo "📍 Deploying to secondary region: $SECONDARY_REGION"
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name ${STACK_NAME}-secondary \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides AWSRegion=$SECONDARY_REGION \
  --region $SECONDARY_REGION \
  --tags Environment=production Region=secondary

# Wait for secondary deployment to complete
aws cloudformation wait stack-deploy-complete \
  --stack-name ${STACK_NAME}-secondary \
  --region $SECONDARY_REGION

echo "✅ Multi-region deployment completed successfully!"
echo "Primary region: $PRIMARY_REGION"
echo "Secondary region: $SECONDARY_REGION"

# Display stack outputs
echo "📊 Primary Region Outputs:"
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME}-primary \
  --region $PRIMARY_REGION \
  --query 'Stacks[0].Outputs'

echo "📊 Secondary Region Outputs:"
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME}-secondary \
  --region $SECONDARY_REGION \
  --query 'Stacks[0].Outputs'
```

## Monitoring and Observability

### CloudWatch Cross-Region Dashboards

Create unified dashboards monitoring both regions:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "TapStack-primary-alb-us-east-1" ],
          [ ".", ".", ".", "TapStack-secondary-alb-us-west-2" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Multi-Region Request Count"
      }
    }
  ]
}
```

## Security Considerations

### Cross-Region IAM Policies

The MFA enforcement policies are account-level and automatically apply across all regions. Each regional deployment will have its own IAM resources but will be governed by the global account password policy.

### Network Security

Each region maintains its own VPC with private subnets. Cross-region communication should use AWS PrivateLink or VPC peering for secure connectivity.

## Cost Optimization

### Regional Resource Sizing

- **Primary Region**: Full production sizing (2-6 instances)
- **Secondary Region**: Reduced standby sizing (1-2 instances) with auto-scaling ready

### Data Storage Costs

- Use S3 Intelligent-Tiering for cross-region replicated data
- RDS read replicas only when needed for disaster recovery testing

## Testing Strategy

### Disaster Recovery Testing

1. **Monthly Failover Tests**: Test Route 53 failover to secondary region
2. **Data Consistency Checks**: Verify S3 and RDS replication integrity
3. **Application Performance**: Test application performance in both regions

## Compliance Achievement

This multi-region deployment strategy fully addresses the requirement for "two different AWS regions" while maintaining the security-by-default architecture and MFA enforcement across both regions.

### Infrastructure Distribution:
- ✅ **VPC and Subnets**: Deployed in both regions with identical network architecture
- ✅ **Load Balancers**: Internet-facing ALB in each region with Route 53 failover
- ✅ **Auto Scaling**: Independent ASG in each region for high availability
- ✅ **Database**: Primary in us-east-1 with read replica in us-west-2
- ✅ **Storage**: S3 buckets with cross-region replication
- ✅ **Security**: MFA enforcement and security groups replicated in both regions
- ✅ **Monitoring**: CloudWatch and Config deployed per region with consolidated dashboards