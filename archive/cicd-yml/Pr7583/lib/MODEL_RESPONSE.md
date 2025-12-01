# CI/CD Pipeline Infrastructure for Payment Processing

This implementation provides a complete CI/CD pipeline infrastructure for an e-commerce payment processing service using Pulumi with Go.

## Architecture Overview

The infrastructure includes:
- VPC with private subnets across two availability zones
- ECS Cluster for containerized payment services
- RDS PostgreSQL Multi-AZ instance with encryption
- CodePipeline with CodeBuild for automated deployments
- AWS Secrets Manager for secure credential management
- Security groups and IAM roles following least privilege
- CloudWatch logging for monitoring

## File: lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/logs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

type TapStackArgs struct {
	EnvironmentSuffix string
}

func NewTapStack(ctx *pulumi.Context, args *TapStackArgs) error {
	// Get configuration
	cfg := config.New(ctx, "")
	environmentSuffix := args.EnvironmentSuffix
	if environmentSuffix == "" {
		environmentSuffix = cfg.Get("environmentSuffix")
	}
	if environmentSuffix == "" {
		return fmt.Errorf("environmentSuffix is required")
	}

	// Create VPC
	vpc, err := ec2.NewVpc(ctx, "payment-vpc", &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("payment-vpc-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Get availability zones
	availableAZs, err := ec2.GetAvailabilityZones(ctx, &ec2.GetAvailabilityZonesArgs{
		State: pulumi.StringRef("available"),
	})
	if err != nil {
		return err
	}

	// Create private subnets (intentional error: not using environmentSuffix in name)
	var privateSubnetIds pulumi.StringArray
	for i := 0; i < 2; i++ {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d", i), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone: pulumi.String(availableAZs.Names[i]),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("private-subnet-%d", i)),
			},
		})
		if err != nil {
			return err
		}
		privateSubnetIds = append(privateSubnetIds, subnet.ID())
	}

	// Create security group for RDS
	dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "db-security-group", &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for RDS database"),
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
			"Name": pulumi.Sprintf("db-sg-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create DB subnet group
	dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "db-subnet-group", &rds.SubnetGroupArgs{
		SubnetIds: privateSubnetIds,
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("db-subnet-group-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create Secrets Manager secret for DB credentials
	dbSecret, err := secretsmanager.NewSecret(ctx, "db-credentials", &secretsmanager.SecretArgs{
		Name:        pulumi.Sprintf("payment-db-credentials-%s", environmentSuffix),
		Description: pulumi.String("Database credentials for payment processing"),
	})
	if err != nil {
		return err
	}

	// Store initial secret value (intentional error: storing in plain JSON without proper structure)
	dbSecretVersion, err := secretsmanager.NewSecretVersion(ctx, "db-credentials-version", &secretsmanager.SecretVersionArgs{
		SecretId:     dbSecret.ID(),
		SecretString: pulumi.String(`{"username":"dbadmin","password":"ChangeMe123!"}`),
	})
	if err != nil {
		return err
	}

	// Create RDS instance (intentional error: missing DeletionProtection: false)
	dbInstance, err := rds.NewInstance(ctx, "payment-db", &rds.InstanceArgs{
		Identifier:           pulumi.Sprintf("payment-db-%s", environmentSuffix),
		Engine:               pulumi.String("postgres"),
		EngineVersion:        pulumi.String("14.7"),
		InstanceClass:        pulumi.String("db.t3.micro"),
		AllocatedStorage:     pulumi.Int(20),
		StorageEncrypted:     pulumi.Bool(true),
		DbName:               pulumi.String("paymentdb"),
		Username:             pulumi.String("dbadmin"),
		Password:             pulumi.String("ChangeMe123!"),
		DbSubnetGroupName:    dbSubnetGroup.Name,
		VpcSecurityGroupIds:  pulumi.StringArray{dbSecurityGroup.ID()},
		MultiAz:              pulumi.Bool(true),
		PubliclyAccessible:   pulumi.Bool(false),
		SkipFinalSnapshot:    pulumi.Bool(true),
		BackupRetentionPeriod: pulumi.Int(7),
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("payment-db-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create ECS security group
	ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, "ecs-security-group", &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for ECS tasks"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:   pulumi.String("tcp"),
				FromPort:   pulumi.Int(8080),
				ToPort:     pulumi.Int(8080),
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
			"Name": pulumi.Sprintf("ecs-sg-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Create CloudWatch log group for ECS
	ecsLogGroup, err := logs.NewLogGroup(ctx, "ecs-log-group", &logs.LogGroupArgs{
		Name:            pulumi.Sprintf("/ecs/payment-service-%s", environmentSuffix),
		RetentionInDays: pulumi.Int(7),
	})
	if err != nil {
		return err
	}

	// Create ECS cluster
	ecsCluster, err := ecs.NewCluster(ctx, "payment-cluster", &ecs.ClusterArgs{
		Name: pulumi.Sprintf("payment-cluster-%s", environmentSuffix),
		Settings: ecs.ClusterSettingArray{
			&ecs.ClusterSettingArgs{
				Name:  pulumi.String("containerInsights"),
				Value: pulumi.String("enabled"),
			},
		},
	})
	if err != nil {
		return err
	}

	// Create IAM role for ECS task execution
	ecsTaskExecutionRole, err := iam.NewRole(ctx, "ecs-task-execution-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ecs-tasks.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})
	if err != nil {
		return err
	}

	// Attach ECS task execution policy
	_, err = iam.NewRolePolicyAttachment(ctx, "ecs-task-execution-policy", &iam.RolePolicyAttachmentArgs{
		Role:      ecsTaskExecutionRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
	})
	if err != nil {
		return err
	}

	// Create IAM policy for accessing secrets (intentional error: overly broad permissions)
	secretsPolicy, err := iam.NewPolicy(ctx, "secrets-access-policy", &iam.PolicyArgs{
		Policy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Action": "secretsmanager:*",
				"Resource": "*"
			}]
		}`),
	})
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicyAttachment(ctx, "ecs-secrets-policy-attachment", &iam.RolePolicyAttachmentArgs{
		Role:      ecsTaskExecutionRole.Name,
		PolicyArn: secretsPolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create ECS task definition (intentional error: missing memory/CPU limits)
	taskDefinition, err := ecs.NewTaskDefinition(ctx, "payment-task", &ecs.TaskDefinitionArgs{
		Family:                  pulumi.Sprintf("payment-service-%s", environmentSuffix),
		NetworkMode:             pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
		Cpu:                     pulumi.String("256"),
		Memory:                  pulumi.String("512"),
		ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
		ContainerDefinitions: pulumi.String(fmt.Sprintf(`[{
			"name": "payment-service",
			"image": "nginx:latest",
			"essential": true,
			"portMappings": [{
				"containerPort": 8080,
				"protocol": "tcp"
			}],
			"secrets": [{
				"name": "DB_CREDENTIALS",
				"valueFrom": "%s"
			}],
			"logConfiguration": {
				"logDriver": "awslogs",
				"options": {
					"awslogs-group": "%s",
					"awslogs-region": "us-east-1",
					"awslogs-stream-prefix": "payment"
				}
			}
		}]`, dbSecret.Arn.ToStringOutput(), ecsLogGroup.Name.ToStringOutput())),
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for pipeline artifacts
	artifactBucket, err := s3.NewBucket(ctx, "pipeline-artifacts", &s3.BucketArgs{
		Bucket: pulumi.Sprintf("payment-pipeline-artifacts-%s", environmentSuffix),
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("pipeline-artifacts-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Enable bucket versioning
	_, err = s3.NewBucketVersioningV2(ctx, "artifact-bucket-versioning", &s3.BucketVersioningV2Args{
		Bucket: artifactBucket.ID(),
		VersioningConfiguration: &s3.BucketVersioningV2VersioningConfigurationArgs{
			Status: pulumi.String("Enabled"),
		},
	})
	if err != nil {
		return err
	}

	// Create IAM role for CodePipeline
	pipelineRole, err := iam.NewRole(ctx, "pipeline-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "codepipeline.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})
	if err != nil {
		return err
	}

	// Create IAM policy for CodePipeline
	pipelinePolicy, err := iam.NewPolicy(ctx, "pipeline-policy", &iam.PolicyArgs{
		Policy: artifactBucket.Arn.ApplyT(func(arn string) string {
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"s3:GetObject",
							"s3:PutObject",
							"s3:GetObjectVersion"
						],
						"Resource": "%s/*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:ListBucket"
						],
						"Resource": "%s"
					},
					{
						"Effect": "Allow",
						"Action": [
							"codebuild:BatchGetBuilds",
							"codebuild:StartBuild"
						],
						"Resource": "*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"ecs:*"
						],
						"Resource": "*"
					}
				]
			}`, arn, arn)
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicyAttachment(ctx, "pipeline-policy-attachment", &iam.RolePolicyAttachmentArgs{
		Role:      pipelineRole.Name,
		PolicyArn: pipelinePolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create IAM role for CodeBuild
	buildRole, err := iam.NewRole(ctx, "build-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "codebuild.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})
	if err != nil {
		return err
	}

	// Create IAM policy for CodeBuild (intentional error: missing ECR permissions)
	buildPolicy, err := iam.NewPolicy(ctx, "build-policy", &iam.PolicyArgs{
		Policy: artifactBucket.Arn.ApplyT(func(arn string) string {
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"logs:CreateLogGroup",
							"logs:CreateLogStream",
							"logs:PutLogEvents"
						],
						"Resource": "*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"s3:GetObject",
							"s3:PutObject"
						],
						"Resource": "%s/*"
					}
				]
			}`, arn)
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	_, err = iam.NewRolePolicyAttachment(ctx, "build-policy-attachment", &iam.RolePolicyAttachmentArgs{
		Role:      buildRole.Name,
		PolicyArn: buildPolicy.Arn,
	})
	if err != nil {
		return err
	}

	// Create CodeBuild project
	buildProject, err := codebuild.NewProject(ctx, "payment-build", &codebuild.ProjectArgs{
		Name:        pulumi.Sprintf("payment-build-%s", environmentSuffix),
		ServiceRole: buildRole.Arn,
		Artifacts: &codebuild.ProjectArtifactsArgs{
			Type: pulumi.String("CODEPIPELINE"),
		},
		Environment: &codebuild.ProjectEnvironmentArgs{
			ComputeType:            pulumi.String("BUILD_GENERAL1_SMALL"),
			Image:                  pulumi.String("aws/codebuild/standard:5.0"),
			Type:                   pulumi.String("LINUX_CONTAINER"),
			PrivilegedMode:         pulumi.Bool(true),
			ImagePullCredentialsType: pulumi.String("CODEBUILD"),
		},
		Source: &codebuild.ProjectSourceArgs{
			Type:      pulumi.String("CODEPIPELINE"),
			Buildspec: pulumi.String(`version: 0.2
phases:
  pre_build:
    commands:
      - echo Build started on $(date)
  build:
    commands:
      - echo Building Docker image
  post_build:
    commands:
      - echo Build completed on $(date)
artifacts:
  files:
    - '**/*'`),
		},
	})
	if err != nil {
		return err
	}

	// Create CodePipeline (intentional error: missing Source stage)
	pipeline, err := codepipeline.NewPipeline(ctx, "payment-pipeline", &codepipeline.PipelineArgs{
		Name:    pulumi.Sprintf("payment-pipeline-%s", environmentSuffix),
		RoleArn: pipelineRole.Arn,
		ArtifactStore: &codepipeline.PipelineArtifactStoreArgs{
			Location: artifactBucket.Bucket,
			Type:     pulumi.String("S3"),
		},
		Stages: codepipeline.PipelineStageArray{
			&codepipeline.PipelineStageArgs{
				Name: pulumi.String("Build"),
				Actions: codepipeline.PipelineStageActionArray{
					&codepipeline.PipelineStageActionArgs{
						Name:     pulumi.String("Build"),
						Category: pulumi.String("Build"),
						Owner:    pulumi.String("AWS"),
						Provider: pulumi.String("CodeBuild"),
						Version:  pulumi.String("1"),
						Configuration: pulumi.StringMap{
							"ProjectName": buildProject.Name,
						},
						InputArtifacts: pulumi.StringArray{
							pulumi.String("source_output"),
						},
						OutputArtifacts: pulumi.StringArray{
							pulumi.String("build_output"),
						},
					},
				},
			},
		},
	})
	if err != nil {
		return err
	}

	// Export outputs
	ctx.Export("vpcId", vpc.ID())
	ctx.Export("ecsClusterName", ecsCluster.Name)
	ctx.Export("dbInstanceEndpoint", dbInstance.Endpoint)
	ctx.Export("dbSecretArn", dbSecret.Arn)
	ctx.Export("pipelineName", pipeline.Name)
	ctx.Export("artifactBucketName", artifactBucket.Bucket)
	ctx.Export("taskDefinitionArn", taskDefinition.Arn)

	return nil
}
```

## File: main.go

```go
package main

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
	"tap/lib"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		cfg := config.New(ctx, "")
		environmentSuffix := cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		return lib.NewTapStack(ctx, &lib.TapStackArgs{
			EnvironmentSuffix: environmentSuffix,
		})
	})
}
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: go
description: CI/CD Pipeline Infrastructure for Payment Processing

config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming
    default: dev
```

## File: lib/README.md

```markdown
# Payment Processing CI/CD Infrastructure

This Pulumi program creates a complete CI/CD pipeline infrastructure for a payment processing service.

## Architecture

- **VPC**: Custom VPC with private subnets across 2 availability zones
- **ECS**: Fargate-based container orchestration for payment services
- **RDS**: Multi-AZ PostgreSQL database with encryption
- **CodePipeline**: Automated CI/CD pipeline with CodeBuild
- **Secrets Manager**: Secure storage for database credentials
- **Security**: Security groups, IAM roles with least privilege

## Prerequisites

- Go 1.19 or later
- Pulumi CLI installed
- AWS credentials configured

## Deployment

1. Install dependencies:
   ```bash
   go mod tidy
   ```

2. Configure environment:
   ```bash
   pulumi config set environmentSuffix <your-suffix>
   pulumi config set aws:region us-east-1
   ```

3. Deploy:
   ```bash
   pulumi up
   ```

## Testing

Run unit tests:
```bash
go test ./tests/unit/...
```

Run integration tests (requires deployment):
```bash
go test ./tests/integration/...
```

## Outputs

- `vpcId`: VPC ID
- `ecsClusterName`: ECS cluster name
- `dbInstanceEndpoint`: RDS database endpoint
- `dbSecretArn`: ARN of database credentials secret
- `pipelineName`: CodePipeline name
- `artifactBucketName`: S3 bucket for artifacts
- `taskDefinitionArn`: ECS task definition ARN
```
