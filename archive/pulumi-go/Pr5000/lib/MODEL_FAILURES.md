# Model Failures Documentation

This document identifies all issues present in the MODEL_RESPONSE.md that deviate from the IDEAL_RESPONSE.md.

## Issue Summary

Total Issues Found: 12

## Detailed Issues

### 1. VPC Resource Name Missing Environment Suffix
**Severity:** Medium
**Category:** Resource Naming Convention
**Location:** Line 27, VPC creation

**Issue:**
```go
vpc, err := ec2.NewVpc(ctx, "iot-vpc", &ec2.VpcArgs{
```

**Expected:**
```go
vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("iot-vpc-%s", environmentSuffix), &ec2.VpcArgs{
```

**Impact:** The Pulumi resource name doesn't include environment suffix, which can cause naming conflicts when deploying multiple environments and reduces environmentSuffix coverage below required 80%.

---

### 2. Internet Gateway Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 41-52, Internet Gateway creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-igw-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-igw-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging and makes resource filtering more difficult.

---

### 3. EIP Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 108-120, Elastic IP creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-nat-eip-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-nat-eip-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 4. NAT Gateway Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 119-132, NAT Gateway creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-nat-gateway-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-nat-gateway-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 5. Public Route Table Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 131-143, Public Route Table creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-public-rt-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-public-rt-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 6. Private Route Table Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 169-181, Private Route Table creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-private-rt-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-private-rt-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 7. Secrets Manager Secret Missing Environment Suffix and Tags
**Severity:** High
**Category:** Resource Naming Convention & Missing Tags
**Location:** Line 216-226, Secrets Manager Secret creation

**Issue:**
```go
dbSecret, err := secretsmanager.NewSecret(ctx, "iot-db-secret", &secretsmanager.SecretArgs{
	Name:        pulumi.String("iot-db-secret"),
	Description: pulumi.String("Database credentials for IoT manufacturing system"),
})
```

**Expected:**
```go
dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("iot-db-secret-%s", environmentSuffix), &secretsmanager.SecretArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-db-secret-%s", environmentSuffix)),
	Description: pulumi.String("Database credentials for IoT manufacturing system"),
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Hardcoded secret name will cause conflicts in multi-environment deployments. Missing tags and missing environment suffix in Pulumi resource name reduce environmentSuffix coverage.

---

### 8. RDS Security Group Missing Egress Rules and Environment Tag
**Severity:** Medium
**Category:** Missing Security Configuration & Tag
**Location:** Line 233-255, RDS Security Group creation

**Issue:**
```go
rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for RDS PostgreSQL instance"),
	VpcId:       vpc.ID(),
	Ingress: ec2.SecurityGroupIngressArray{
		&ec2.SecurityGroupIngressArgs{
			Protocol:   pulumi.String("tcp"),
			FromPort:   pulumi.Int(5432),
			ToPort:     pulumi.Int(5432),
			CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
		},
	},
	Tags: pulumi.StringMap{
		"Name": pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
	},
})
```

**Expected:**
```go
rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for RDS PostgreSQL instance"),
	VpcId:       vpc.ID(),
	Ingress: ec2.SecurityGroupIngressArray{
		&ec2.SecurityGroupIngressArgs{
			Protocol:   pulumi.String("tcp"),
			FromPort:   pulumi.Int(5432),
			ToPort:     pulumi.Int(5432),
			CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
		},
	},
	Egress: ec2.SecurityGroupEgressArray{
		&ec2.SecurityGroupEgressArgs{
			Protocol:   pulumi.String("-1"),
			FromPort:   pulumi.Int(0),
			ToPort:     pulumi.Int(0),
			CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
		},
	},
	Tags: pulumi.StringMap{
		"Name":        pulumi.String(fmt.Sprintf("iot-rds-sg-%s", environmentSuffix)),
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing egress rules may cause connectivity issues. Missing Environment tag reduces tagging consistency.

---

### 9. RDS DB Subnet Group Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 254-267, DB Subnet Group creation

**Issue:**
```go
Tags: pulumi.StringMap{
	"Name": pulumi.String(fmt.Sprintf("iot-db-subnet-group-%s", environmentSuffix)),
}
```

**Expected:**
```go
Tags: pulumi.StringMap{
	"Name":        pulumi.String(fmt.Sprintf("iot-db-subnet-group-%s", environmentSuffix)),
	"Environment": pulumi.String(environmentSuffix),
}
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 10. RDS Instance Missing Required Properties and Tags
**Severity:** High
**Category:** Missing Configuration & Tags
**Location:** Line 266-289, RDS Instance creation

**Issue:**
```go
rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("iot-postgres-%s", environmentSuffix), &rds.InstanceArgs{
	Identifier:          pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
	Engine:              pulumi.String("postgres"),
	EngineVersion:       pulumi.String("16.3"),
	InstanceClass:       pulumi.String("db.t3.micro"),
	AllocatedStorage:    pulumi.Int(20),
	StorageEncrypted:    pulumi.Bool(true),
	DbName:              pulumi.String("iotmanufacturing"),
	Username:            pulumi.String("iotadmin"),
	Password:            pulumi.String("ChangeMe12345!"),
	DbSubnetGroupName:   dbSubnetGroup.Name,
	VpcSecurityGroupIds: pulumi.StringArray{rdsSecurityGroup.ID()},
	SkipFinalSnapshot:   pulumi.Bool(true),
	Tags: pulumi.StringMap{
		"Name": pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
	},
})
```

**Expected:**
```go
rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("iot-postgres-%s", environmentSuffix), &rds.InstanceArgs{
	Identifier:            pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
	Engine:                pulumi.String("postgres"),
	EngineVersion:         pulumi.String("16.3"),
	InstanceClass:         pulumi.String("db.t3.micro"),
	AllocatedStorage:      pulumi.Int(20),
	StorageType:           pulumi.String("gp3"),
	StorageEncrypted:      pulumi.Bool(true),
	DbName:                pulumi.String("iotmanufacturing"),
	Username:              pulumi.String("iotadmin"),
	Password:              pulumi.String("ChangeMe12345!"),
	DbSubnetGroupName:     dbSubnetGroup.Name,
	VpcSecurityGroupIds:   pulumi.StringArray{rdsSecurityGroup.ID()},
	PubliclyAccessible:    pulumi.Bool(false),
	SkipFinalSnapshot:     pulumi.Bool(true),
	BackupRetentionPeriod: pulumi.Int(7),
	MultiAz:               pulumi.Bool(false),
	Tags: pulumi.StringMap{
		"Name":        pulumi.String(fmt.Sprintf("iot-postgres-%s", environmentSuffix)),
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing StorageType, PubliclyAccessible, BackupRetentionPeriod, and MultiAz properties reduce production-readiness. Missing Environment tag reduces tagging consistency.

---

### 11. ElastiCache Security Group Missing Egress Rules and Environment Tag
**Severity:** Medium
**Category:** Missing Security Configuration & Tag
**Location:** Line 288-310, ElastiCache Security Group creation

**Issue:**
```go
elasticacheSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for ElastiCache Redis cluster"),
	VpcId:       vpc.ID(),
	Ingress: ec2.SecurityGroupIngressArray{
		&ec2.SecurityGroupIngressArgs{
			Protocol:   pulumi.String("tcp"),
			FromPort:   pulumi.Int(6379),
			ToPort:     pulumi.Int(6379),
			CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
		},
	},
	Tags: pulumi.StringMap{
		"Name": pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
	},
})
```

**Expected:**
```go
elasticacheSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for ElastiCache Redis cluster"),
	VpcId:       vpc.ID(),
	Ingress: ec2.SecurityGroupIngressArray{
		&ec2.SecurityGroupIngressArgs{
			Protocol:   pulumi.String("tcp"),
			FromPort:   pulumi.Int(6379),
			ToPort:     pulumi.Int(6379),
			CidrBlocks: pulumi.StringArray{pulumi.String("10.0.0.0/16")},
		},
	},
	Egress: ec2.SecurityGroupEgressArray{
		&ec2.SecurityGroupEgressArgs{
			Protocol:   pulumi.String("-1"),
			FromPort:   pulumi.Int(0),
			ToPort:     pulumi.Int(0),
			CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
		},
	},
	Tags: pulumi.StringMap{
		"Name":        pulumi.String(fmt.Sprintf("iot-elasticache-sg-%s", environmentSuffix)),
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing egress rules may cause connectivity issues. Missing Environment tag reduces tagging consistency.

---

### 12. ElastiCache Subnet Group and Redis Cluster Missing Tags and Configuration
**Severity:** High
**Category:** Missing Configuration & Tags
**Location:** Lines 309-344, ElastiCache Resources

**Issue (Subnet Group):**
```go
elasticacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
	Name:      pulumi.String(fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix)),
	SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
})
```

**Expected (Subnet Group):**
```go
elasticacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
	Name:      pulumi.String(fmt.Sprintf("iot-cache-subnet-group-%s", environmentSuffix)),
	SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Issue (Redis Cluster):**
```go
redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("iot-redis-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
	ReplicationGroupId:       pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
	Description:              pulumi.String("Redis cluster for IoT manufacturing metrics"),
	Engine:                   pulumi.String("redis"),
	EngineVersion:            pulumi.String("7.1"),
	NodeType:                 pulumi.String("cache.t3.micro"),
	NumCacheClusters:         pulumi.Int(2),
	Port:                     pulumi.Int(6379),
	SubnetGroupName:          elasticacheSubnetGroup.Name,
	SecurityGroupIds:         pulumi.StringArray{elasticacheSecurityGroup.ID()},
	AtRestEncryptionEnabled:  pulumi.Bool(true),
	TransitEncryptionEnabled: pulumi.Bool(true),
	AuthToken:                pulumi.String("ChangeMe12345678901234567890123!"),
	Tags: pulumi.StringMap{
		"Name": pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
	},
})
```

**Expected (Redis Cluster):**
```go
redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("iot-redis-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
	ReplicationGroupId:       pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
	Description:              pulumi.String("Redis cluster for IoT manufacturing metrics"),
	Engine:                   pulumi.String("redis"),
	EngineVersion:            pulumi.String("7.1"),
	NodeType:                 pulumi.String("cache.t3.micro"),
	NumCacheClusters:         pulumi.Int(2),
	ParameterGroupName:       pulumi.String("default.redis7"),
	Port:                     pulumi.Int(6379),
	SubnetGroupName:          elasticacheSubnetGroup.Name,
	SecurityGroupIds:         pulumi.StringArray{elasticacheSecurityGroup.ID()},
	AtRestEncryptionEnabled:  pulumi.Bool(true),
	TransitEncryptionEnabled: pulumi.Bool(true),
	AutomaticFailoverEnabled: pulumi.Bool(true),
	MultiAzEnabled:           pulumi.Bool(true),
	AuthToken:                pulumi.String("ChangeMe12345678901234567890123!"),
	Tags: pulumi.StringMap{
		"Name":        pulumi.String(fmt.Sprintf("iot-redis-%s", environmentSuffix)),
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing tags on subnet group, missing ParameterGroupName, AutomaticFailoverEnabled, MultiAzEnabled on Redis cluster reduces production-readiness and high availability. Missing Environment tag on Redis cluster reduces tagging consistency.

---

### 13. ECS Cluster Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 340-355, ECS Cluster creation

**Issue:**
```go
ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
	Name: pulumi.String(fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix)),
	Settings: ecs.ClusterSettingArray{
		&ecs.ClusterSettingArgs{
			Name:  pulumi.String("containerInsights"),
			Value: pulumi.String("enabled"),
		},
	},
})
```

**Expected:**
```go
ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
	Name: pulumi.String(fmt.Sprintf("iot-ecs-cluster-%s", environmentSuffix)),
	Settings: ecs.ClusterSettingArray{
		&ecs.ClusterSettingArgs{
			Name:  pulumi.String("containerInsights"),
			Value: pulumi.String("enabled"),
		},
	},
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 14. IAM Roles Missing Environment Suffix and Tags
**Severity:** High
**Category:** Resource Naming Convention & Missing Tags
**Location:** Lines 354-403, IAM Role creation

**Issue (Task Execution Role):**
```go
ecsTaskExecutionRole, err := iam.NewRole(ctx, "iot-task-execution-role", &iam.RoleArgs{
	Name: pulumi.String("iot-task-execution-role"),
	AssumeRolePolicy: pulumi.String(`{...}`),
})
```

**Expected (Task Execution Role):**
```go
ecsTaskExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("iot-ecs-task-execution-role-%s", environmentSuffix), &iam.RoleArgs{
	Name: pulumi.String(fmt.Sprintf("iot-ecs-task-execution-role-%s", environmentSuffix)),
	AssumeRolePolicy: pulumi.String(`{...}`),
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Issue (Task Role):**
```go
ecsTaskRole, err := iam.NewRole(ctx, "iot-task-role", &iam.RoleArgs{
	Name: pulumi.String("iot-task-role"),
	AssumeRolePolicy: pulumi.String(`{...}`),
})
```

**Expected (Task Role):**
```go
ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("iot-ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
	Name: pulumi.String(fmt.Sprintf("iot-ecs-task-role-%s", environmentSuffix)),
	AssumeRolePolicy: pulumi.String(`{...}`),
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Hardcoded role names will cause conflicts in multi-environment deployments. Missing environment suffix in Pulumi resource names reduces environmentSuffix coverage significantly. Missing tags reduce consistency.

---

### 15. IAM Role Policy Using Wildcard Resource
**Severity:** Medium
**Category:** Security Best Practice
**Location:** Line 399-418, IAM Role Policy creation

**Issue:**
```go
_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("iot-ecs-task-secrets-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
	Role: ecsTaskRole.Name,
	Policy: pulumi.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [{
			"Effect": "Allow",
			"Action": [
				"secretsmanager:GetSecretValue"
			],
			"Resource": "*"
		}]
	}`)),
})
```

**Expected:**
```go
_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("iot-ecs-task-secrets-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
	Role: ecsTaskRole.Name,
	Policy: dbSecret.Arn.ApplyT(func(arn string) (string, error) {
		return fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Action": [
					"secretsmanager:GetSecretValue"
				],
				"Resource": "%s"
			}]
		}`, arn), nil
	}).(pulumi.StringOutput),
})
```

**Impact:** Using wildcard "*" for Resource violates principle of least privilege. The policy should be scoped to the specific secret ARN. This is a security best practice violation.

---

### 16. ECS Task Security Group Missing Egress Rules and Environment Tag
**Severity:** Medium
**Category:** Missing Security Configuration & Tag
**Location:** Line 417-430, ECS Task Security Group creation

**Issue:**
```go
ecsTaskSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for ECS tasks"),
	VpcId:       vpc.ID(),
	Tags: pulumi.StringMap{
		"Name": pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
	},
})
```

**Expected:**
```go
ecsTaskSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
	Name:        pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
	Description: pulumi.String("Security group for ECS tasks"),
	VpcId:       vpc.ID(),
	Egress: ec2.SecurityGroupEgressArray{
		&ec2.SecurityGroupEgressArgs{
			Protocol:   pulumi.String("-1"),
			FromPort:   pulumi.Int(0),
			ToPort:     pulumi.Int(0),
			CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
		},
	},
	Tags: pulumi.StringMap{
		"Name":        pulumi.String(fmt.Sprintf("iot-ecs-task-sg-%s", environmentSuffix)),
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing egress rules will prevent ECS tasks from making outbound connections. Missing Environment tag reduces tagging consistency.

---

### 17. Task Definition Missing Environment Tag
**Severity:** Low
**Category:** Missing Tag
**Location:** Line 430-491, ECS Task Definition creation

**Issue:**
```go
taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("iot-data-processor-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
	Family:                  pulumi.String(fmt.Sprintf("iot-data-processor-%s", environmentSuffix)),
	NetworkMode:             pulumi.String("awsvpc"),
	RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
	Cpu:                     pulumi.String("256"),
	Memory:                  pulumi.String("512"),
	ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
	TaskRoleArn:             ecsTaskRole.Arn,
	ContainerDefinitions:    ...,
})
```

**Expected:**
```go
taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("iot-data-processor-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
	Family:                  pulumi.String(fmt.Sprintf("iot-data-processor-%s", environmentSuffix)),
	NetworkMode:             pulumi.String("awsvpc"),
	RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
	Cpu:                     pulumi.String("256"),
	Memory:                  pulumi.String("512"),
	ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
	TaskRoleArn:             ecsTaskRole.Arn,
	ContainerDefinitions:    ...,
	Tags: pulumi.StringMap{
		"Environment": pulumi.String(environmentSuffix),
	},
})
```

**Impact:** Missing Environment tag reduces consistency in resource tagging.

---

### 18. Missing Exported Outputs
**Severity:** Medium
**Category:** Missing Outputs
**Location:** Lines 487-498, Export statements

**Issue:**
```go
ctx.Export("vpcId", vpc.ID())
ctx.Export("ecsClusterName", ecsCluster.Name)
ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
ctx.Export("redisEndpoint", redisCluster.PrimaryEndpointAddress)
ctx.Export("taskDefinitionArn", taskDefinition.Arn)
```

**Expected:**
```go
ctx.Export("vpcId", vpc.ID())
ctx.Export("ecsClusterName", ecsCluster.Name)
ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
ctx.Export("redisEndpoint", redisCluster.PrimaryEndpointAddress)
ctx.Export("taskDefinitionArn", taskDefinition.Arn)
ctx.Export("privateSubnet1Id", privateSubnet1.ID())
ctx.Export("privateSubnet2Id", privateSubnet2.ID())
ctx.Export("ecsTaskSecurityGroupId", ecsTaskSecurityGroup.ID())
```

**Impact:** Missing outputs for private subnets and ECS task security group which are needed for deploying ECS services. Users would need to manually look up these values.

---

## Summary by Category

1. **Resource Naming Convention Issues:** 4 (VPC, Secret, 2 IAM Roles)
2. **Missing Tags:** 13 instances across multiple resources
3. **Missing Security Configurations:** 4 (3 Security Groups missing egress, 1 IAM policy with wildcard)
4. **Missing Resource Properties:** 3 (RDS, ElastiCache Redis, outputs)
5. **EnvironmentSuffix Coverage:** Approximately 65% (below required 80%)

## Recommended Fixes Priority

1. **High Priority:**
   - Fix IAM role names to include environment suffix
   - Fix Secrets Manager name to include environment suffix
   - Add missing security group egress rules
   - Fix IAM policy to use specific secret ARN instead of wildcard
   - Add missing RDS and Redis configuration properties

2. **Medium Priority:**
   - Fix VPC resource name to include environment suffix
   - Add missing exported outputs
   - Add Environment tags to all resources

3. **Low Priority:**
   - Ensure consistent tag formatting (Name vs Environment)
