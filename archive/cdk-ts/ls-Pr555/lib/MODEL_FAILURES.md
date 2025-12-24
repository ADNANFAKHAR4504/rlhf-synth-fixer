# Model Failures and Common Issues

## Deployment Failures

### 1. ECS Service Deployment Timeout
**Issue**: ECS service taking over 1 hour to deploy
**Root Cause**: 
- Default Fargate task definition with large resource allocations
- No explicit port mappings or logging configuration
- Missing health check configurations
- Complex auto-scaling without proper cooldown periods

**Solution**:
```typescript
// Optimized ECS configuration
const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
  memoryLimitMiB: 512,
  cpu: 256,
});

taskDefinition.addContainer('web', {
  image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
  portMappings: [{ containerPort: 80 }],
  logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'SecureECSService' }),
});

const ecsService = new ecs.FargateService(this, 'SecureECSService', {
  cluster: ecsCluster,
  taskDefinition,
  desiredCount: 1,
  assignPublicIp: false,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  enableExecuteCommand: false,
  minHealthyPercent: 100,
  maxHealthyPercent: 200,
});
```

### 2. RDS Subnet Group AZ Coverage Error
**Issue**: "The DB subnet group doesn't meet Availability Zone (AZ) coverage requirement"
**Root Cause**: RDS requires subnets in at least 2 AZs, but VPC was configured with only 1 AZ
**Solution**:
```typescript
const vpc = new ec2.Vpc(this, 'SecureVPC', {
  maxAzs: 2, // Required for RDS
  natGateways: 1,
  subnetConfiguration: [
    { name: 'PublicSubnet', subnetType: ec2.SubnetType.PUBLIC },
    { name: 'PrivateSubnet', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  ],
});
```

### 3. Deprecation Warnings
**Issue**: Multiple deprecation warnings during deployment
**Root Cause**: Using deprecated CDK APIs
**Solutions**:
```typescript
// Replace deprecated subnet types
subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS // instead of PRIVATE_WITH_NAT

// Add proper health percentages
minHealthyPercent: 100,
maxHealthyPercent: 200,
```

## Code Quality Issues

### 1. Missing RDS Instance Type Validation
**Issue**: No programmatic enforcement of RDS instance type restrictions
**Solution**: Implement custom CDK Aspect
```typescript
class RdsInstanceTypeValidator implements cdk.IAspect {
  public visit(node: Construct): void {
    if (node instanceof rds.DatabaseInstance) {
      const allowedTypes = ['db.m5.large', 'db.m5.xlarge'];
      const currentType = 'db.m5.large';
      
      if (!allowedTypes.includes(currentType)) {
        throw new Error(
          `RDS instance type ${currentType} is not allowed. ` +
          `Only ${allowedTypes.join(' or ')} are permitted.`
        );
      }
    }
  }
}
```

### 2. Incomplete Security Group Configuration
**Issue**: Missing proper security group rules between services
**Solution**:
```typescript
// Create specific security groups
const dbSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
  vpc,
  allowAllOutbound: false,
  description: 'Security group for RDS database access',
});

const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
  vpc,
  allowAllOutbound: true,
  description: 'Security group for ECS service',
});

// Allow specific communication
dbSecurityGroup.addIngressRule(
  ecsSecurityGroup,
  ec2.Port.tcp(3306),
  'Allow ECS to access RDS MySQL'
);
```

### 3. Missing CloudTrail S3 Data Events
**Issue**: CloudTrail not configured to capture S3 data events
**Solution**:
```typescript
const trail = new cloudtrail.Trail(this, 'MultiRegionTrail', {
  isMultiRegionTrail: true,
  managementEvents: cloudtrail.ReadWriteType.ALL,
  includeGlobalServiceEvents: true,
  sendToCloudWatchLogs: true,
});

// Add S3 data events
trail.addS3EventSelector([{
  bucket: secureBucket,
  objectPrefix: '',
}], {
  readWriteType: cloudtrail.ReadWriteType.ALL,
});
```

## Security Issues

### 1. ECS Task Role Trust Relationship Error
**Issue**: ECS service failed to launch tasks with error "ECS was unable to assume the role"
**Root Cause**: Using EC2 instance role (`ec2.amazonaws.com` trust) for ECS tasks instead of ECS task role (`ecs-tasks.amazonaws.com` trust)
**Solution**:
```typescript
// Create proper ECS task role with correct trust relationship
const ecsTaskRole = new iam.Role(this, 'ECSTaskRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  description: 'IAM role for ECS tasks with least privilege access',
});

const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
  memoryLimitMiB: 512,
  cpu: 256,
  taskRole: ecsTaskRole, // Assign proper ECS task role to tasks
});
```

### 2. Missing IAM Role Assignment
**Issue**: ECS tasks not assigned IAM roles
**Solution**:
```typescript
const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
  memoryLimitMiB: 512,
  cpu: 256,
  taskRole: ecsTaskRole, // Assign IAM role to tasks
});
```

### 2. Incomplete Monitoring
**Issue**: Missing comprehensive CloudWatch alarms
**Solution**:
```typescript
// RDS Alarms
new cloudwatch.Alarm(this, 'RDS-CPUUtilizationAlarm', {
  metric: rdsInstance.metricCPUUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  alarmDescription: 'RDS CPU utilization is high',
});

// ECS Alarms
new cloudwatch.Alarm(this, 'ECS-CPUUtilizationAlarm', {
  metric: ecsService.metricCpuUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  alarmDescription: 'ECS CPU utilization is high',
});
```

## Best Practices Violations

### 1. Missing Resource Descriptions
**Issue**: Resources lack proper descriptions
**Solution**:
```typescript
const cmk = new kms.Key(this, 'CustomerManagedKey', {
  enableKeyRotation: true,
  description: 'Customer managed key for data encryption',
});
```

### 2. No Output Values
**Issue**: Missing important resource outputs
**Solution**:
```typescript
new cdk.CfnOutput(this, 'VPCId', {
  value: vpc.vpcId,
  description: 'VPC ID',
});

new cdk.CfnOutput(this, 'RDSInstanceId', {
  value: rdsInstance.instanceIdentifier,
  description: 'RDS Instance ID',
});
```

## Lessons Learned

1. **Always validate infrastructure requirements** before deployment
2. **Implement comprehensive monitoring** from the start
3. **Follow security best practices** consistently
4. **Test deployment configurations** in stages
5. **Document all architectural decisions** with clear comments
6. **Use CDK Aspects** for cross-cutting concerns like validation
7. **Implement proper error handling** and validation
8. **Ensure proper resource sizing** for production environments
9. **Use correct IAM trust relationships** - EC2 roles for EC2 instances, ECS task roles for ECS tasks
10. **Validate IAM role assignments** match the service that will assume them