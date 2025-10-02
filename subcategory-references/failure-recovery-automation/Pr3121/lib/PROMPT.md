# AWS CDK Disaster Recovery Requirements

## Task Overview

A SaaS provider requires disaster recovery across `us-east-1` and `us-west-2`.

You are tasked with creating Java CDK with AWS.

## Requirements

### 1. Variable Primary Region
- Use variable `primary_region` to switch deployment target

### 2. Infrastructure Deployment
- Deploy the same VPC + app infrastructure in either region

### 3. Route53 Configuration
- Configure Route53 failover records

### 4. S3 Cross-Region Replication
- Enable S3 cross-region replication

## Expected Output

Java CDK output shows resources shifting regions when variable is toggled. Failover validated by Route53 health checks.

## Implementation Notes

### Primary Region Variable
```java
// Context variable or parameter
String primaryRegion = (String) node.tryGetContext("primary_region");
// Default to us-east-1 if not specified
if (primaryRegion == null) {
    primaryRegion = "us-east-1";
}
```

### Region Configuration
```java
// Define both regions
String primaryRegion = "us-east-1";
String secondaryRegion = "us-west-2";
```

### VPC Setup
```java
// VPC should be created in both regions with identical configuration
Vpc vpc = Vpc.Builder.create(this, "VPC")
    .maxAzs(2)
    .natGateways(1)
    .build();
```

### Route53 Failover
```java
// Primary record
ARecord primaryRecord = ARecord.Builder.create(this, "PrimaryRecord")
    .zone(hostedZone)
    .recordName("app")
    .target(RecordTarget.fromAlias(new LoadBalancerTarget(primaryLb)))
    .failover(Failover.PRIMARY)
    .setIdentifier("primary")
    .build();

// Secondary record
ARecord secondaryRecord = ARecord.Builder.create(this, "SecondaryRecord")
    .zone(hostedZone)
    .recordName("app")
    .target(RecordTarget.fromAlias(new LoadBalancerTarget(secondaryLb)))
    .failover(Failover.SECONDARY)
    .setIdentifier("secondary")
    .build();
```

### S3 Cross-Region Replication
```java
// Source bucket in primary region
Bucket sourceBucket = Bucket.Builder.create(this, "SourceBucket")
    .versioned(true)
    .build();

// Destination bucket in secondary region
Bucket destinationBucket = Bucket.Builder.create(this, "DestinationBucket")
    .versioned(true)
    .build();

// Add replication configuration
CfnBucket cfnBucket = (CfnBucket) sourceBucket.getNode().getDefaultChild();
cfnBucket.setReplicationConfiguration(
    CfnBucket.ReplicationConfigurationProperty.builder()
        .role(replicationRole.getRoleArn())
        .rules(List.of(
            CfnBucket.ReplicationRuleProperty.builder()
                .status("Enabled")
                .priority(1)
                .destination(CfnBucket.ReplicationDestinationProperty.builder()
                    .bucket(destinationBucket.getBucketArn())
                    .build())
                .build()
        ))
        .build()
);
```

## Testing

### Toggle Primary Region
```bash
# Deploy to us-east-1
cdk deploy --context primary_region=us-east-1

# Deploy to us-west-2
cdk deploy --context primary_region=us-west-2
```

### Validate Failover
- Route53 health checks should automatically detect failures
- Traffic should route to secondary region when primary is unhealthy
- Monitor Route53 query logs to verify failover behavior