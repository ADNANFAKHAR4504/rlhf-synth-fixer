package lib

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi-random/sdk/v4/go/random"
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

	// Use hardcoded availability zones for us-east-1
	availableAZs := []string{"us-east-1a", "us-east-1b"}

	// Create private subnets
	var privateSubnetIds pulumi.StringArray
	for i := 0; i < 2; i++ {
		subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d", i), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone: pulumi.String(availableAZs[i]),
			Tags: pulumi.StringMap{
				"Name": pulumi.Sprintf("private-subnet-%d-%s", i, environmentSuffix),
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

	// Generate secure random password for database
	dbPassword, err := random.NewRandomPassword(ctx, "db-password", &random.RandomPasswordArgs{
		Length:          pulumi.Int(32),
		Special:         pulumi.Bool(true),
		OverrideSpecial: pulumi.String("!#$%&*()-_=+[]{}<>:?"),
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

	// Store initial secret value with proper structure using dynamic password
	dbUsername := "dbadmin"
	dbSecretVersion, err := secretsmanager.NewSecretVersion(ctx, "db-credentials-version", &secretsmanager.SecretVersionArgs{
		SecretId: dbSecret.ID(),
		SecretString: dbPassword.Result.ApplyT(func(password string) (string, error) {
			credentials := map[string]string{
				"username": dbUsername,
				"password": password,
				"engine":   "postgres",
				"host":     "", // Will be updated after RDS creation
				"port":     "5432",
				"dbname":   "paymentdb",
			}
			jsonBytes, err := json.Marshal(credentials)
			if err != nil {
				return "", err
			}
			return string(jsonBytes), nil
		}).(pulumi.StringOutput),
	})
	if err != nil {
		return err
	}

	// Create RDS instance with proper security configuration
	dbInstance, err := rds.NewInstance(ctx, "payment-db", &rds.InstanceArgs{
		Identifier:            pulumi.Sprintf("payment-db-%s", environmentSuffix),
		Engine:                pulumi.String("postgres"),
		EngineVersion:         pulumi.String("14.7"),
		InstanceClass:         pulumi.String("db.t3.micro"),
		AllocatedStorage:      pulumi.Int(20),
		StorageEncrypted:      pulumi.Bool(true),
		DbName:                pulumi.String("paymentdb"),
		Username:              pulumi.String(dbUsername),
		Password:              dbPassword.Result,
		DbSubnetGroupName:     dbSubnetGroup.Name,
		VpcSecurityGroupIds:   pulumi.StringArray{dbSecurityGroup.ID()},
		MultiAz:               pulumi.Bool(true),
		PubliclyAccessible:    pulumi.Bool(false),
		SkipFinalSnapshot:     pulumi.Bool(true),
		BackupRetentionPeriod: pulumi.Int(7),
		DeletionProtection:    pulumi.Bool(false),
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("payment-db-%s", environmentSuffix),
		},
	})
	if err != nil {
		return err
	}

	// Configure secret rotation for database credentials
	// Note: Rotation requires custom Lambda function or AWS managed rotation Lambda
	_, err = secretsmanager.NewSecretRotation(ctx, "db-credentials-rotation", &secretsmanager.SecretRotationArgs{
		SecretId:          dbSecret.ID(),
		RotationLambdaArn: pulumi.String("arn:aws:serverlessrepo:us-east-1:297356227924:applications/SecretsManagerRDSPostgreSQLRotationSingleUser"),
		RotationRules: &secretsmanager.SecretRotationRotationRulesArgs{
			AutomaticallyAfterDays: pulumi.Int(30),
		},
	}, pulumi.DependsOn([]pulumi.Resource{dbSecretVersion, dbInstance}))
	if err != nil {
		return err
	}

	// Create ECS security group
	_, err = ec2.NewSecurityGroup(ctx, "ecs-security-group", &ec2.SecurityGroupArgs{
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
	ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, "ecs-log-group", &cloudwatch.LogGroupArgs{
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

	// Create IAM policy for accessing secrets with least privilege
	secretsPolicy, err := iam.NewPolicy(ctx, "secrets-access-policy", &iam.PolicyArgs{
		Policy: dbSecret.Arn.ApplyT(func(arn string) string {
			return fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Action": [
						"secretsmanager:GetSecretValue",
						"secretsmanager:DescribeSecret"
					],
					"Resource": "%s"
				}]
			}`, arn)
		}).(pulumi.StringOutput),
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
	containerDefinitions := pulumi.All(dbSecret.Arn, ecsLogGroup.Name).ApplyT(func(args []interface{}) string {
		secretArn := args[0].(string)
		logGroupName := args[1].(string)
		return fmt.Sprintf(`[{
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
		}]`, secretArn, logGroupName)
	}).(pulumi.StringOutput)

	taskDefinition, err := ecs.NewTaskDefinition(ctx, "payment-task", &ecs.TaskDefinitionArgs{
		Family:                  pulumi.Sprintf("payment-service-%s", environmentSuffix),
		NetworkMode:             pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
		Cpu:                     pulumi.String("256"),
		Memory:                  pulumi.String("512"),
		ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
		ContainerDefinitions:    containerDefinitions,
	})
	if err != nil {
		return err
	}

	// Create S3 bucket for pipeline artifacts
	artifactBucket, err := s3.NewBucket(ctx, "pipeline-artifacts", &s3.BucketArgs{
		Bucket:       pulumi.Sprintf("payment-pipeline-artifacts-%s", environmentSuffix),
		ForceDestroy: pulumi.Bool(true),
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

	// Create IAM policy for CodeBuild with ECR permissions
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
					},
					{
						"Effect": "Allow",
						"Action": [
							"ecr:GetAuthorizationToken",
							"ecr:BatchCheckLayerAvailability",
							"ecr:GetDownloadUrlForLayer",
							"ecr:BatchGetImage",
							"ecr:PutImage",
							"ecr:InitiateLayerUpload",
							"ecr:UploadLayerPart",
							"ecr:CompleteLayerUpload"
						],
						"Resource": "*"
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
			ComputeType:              pulumi.String("BUILD_GENERAL1_SMALL"),
			Image:                    pulumi.String("aws/codebuild/standard:5.0"),
			Type:                     pulumi.String("LINUX_CONTAINER"),
			PrivilegedMode:           pulumi.Bool(true),
			ImagePullCredentialsType: pulumi.String("CODEBUILD"),
		},
		Source: &codebuild.ProjectSourceArgs{
			Type: pulumi.String("CODEPIPELINE"),
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

	// Create CodePipeline with proper Source and Build stages
	pipeline, err := codepipeline.NewPipeline(ctx, "payment-pipeline", &codepipeline.PipelineArgs{
		Name:    pulumi.Sprintf("payment-pipeline-%s", environmentSuffix),
		RoleArn: pipelineRole.Arn,
		ArtifactStores: codepipeline.PipelineArtifactStoreArray{
			&codepipeline.PipelineArtifactStoreArgs{
				Location: artifactBucket.Bucket,
				Type:     pulumi.String("S3"),
				Region:   pulumi.String("us-east-1"),
			},
		},
		Stages: codepipeline.PipelineStageArray{
			&codepipeline.PipelineStageArgs{
				Name: pulumi.String("Source"),
				Actions: codepipeline.PipelineStageActionArray{
					&codepipeline.PipelineStageActionArgs{
						Name:     pulumi.String("Source"),
						Category: pulumi.String("Source"),
						Owner:    pulumi.String("AWS"),
						Provider: pulumi.String("S3"),
						Version:  pulumi.String("1"),
						Configuration: pulumi.StringMap{
							"S3Bucket":             artifactBucket.Bucket,
							"S3ObjectKey":          pulumi.String("source.zip"),
							"PollForSourceChanges": pulumi.String("false"),
						},
						OutputArtifacts: pulumi.StringArray{
							pulumi.String("source_output"),
						},
					},
				},
			},
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
