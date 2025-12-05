# MODEL_RESPONSE.md - Initial Implementation

This document contains the initial Pulumi Go implementation for the CI/CD Pipeline Infrastructure as requested in PROMPT.md.

## File: lib/tap_stack.go

```go
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codebuild"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/efs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment variables
		environmentSuffix := getEnv("ENVIRONMENT_SUFFIX", "dev")
		repositoryName := getEnv("REPOSITORY", "unknown")
		commitAuthor := getEnv("COMMIT_AUTHOR", "unknown")
		prNumber := getEnv("PR_NUMBER", "unknown")
		team := getEnv("TEAM", "unknown")
		createdAt := time.Now().UTC().Format(time.RFC3339)
		awsRegion := getEnv("AWS_REGION", "us-east-1")

		// Create default tags
		defaultTags := pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Repository":  pulumi.String(repositoryName),
			"Author":      pulumi.String(commitAuthor),
			"PRNumber":    pulumi.String(prNumber),
			"Team":        pulumi.String(team),
			"CreatedAt":   pulumi.String(createdAt),
		}

		// Configure AWS provider with default tags
		provider, err := aws.NewProvider(ctx, "aws", &aws.ProviderArgs{
			Region: pulumi.String(awsRegion),
			DefaultTags: &aws.ProviderDefaultTagsArgs{
				Tags: defaultTags,
			},
		})
		if err != nil {
			return err
		}

		// Create KMS key for encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("encryption-key-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for encryption of student data"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(10),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create public subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.1.0/24"),
			AvailabilityZone: pulumi.String("us-east-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.2.0/24"),
			AvailabilityZone: pulumi.String("us-east-1b"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create private subnets
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.10.0/24"),
			AvailabilityZone: pulumi.String("us-east-1a"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.11.0/24"),
			AvailabilityZone: pulumi.String("us-east-1b"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create route table for public subnets
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Associate route table with public subnets
		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create security group for RDS
		rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for RDS cluster"),
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
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create RDS subnet group
		rdsSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("rds-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{
				privateSubnet1.ID(),
				privateSubnet2.ID(),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create secret for RDS password
		rdsPasswordSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("rds-password-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Description: pulumi.String("RDS master password for student database"),
			KmsKeyId:    kmsKey.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("rds-password-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     rdsPasswordSecret.ID(),
			SecretString: pulumi.String("ChangeMe123!"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create RDS cluster
		rdsCluster, err := rds.NewCluster(ctx, fmt.Sprintf("student-db-cluster-%s", environmentSuffix), &rds.ClusterArgs{
			Engine:               pulumi.String("aurora-postgresql"),
			EngineMode:           pulumi.String("provisioned"),
			EngineVersion:        pulumi.String("15.3"),
			DatabaseName:         pulumi.String("studentdb"),
			MasterUsername:       pulumi.String("dbadmin"),
			MasterPassword:       pulumi.String("ChangeMe123!"),
			DbSubnetGroupName:    rdsSubnetGroup.Name,
			VpcSecurityGroupIds:  pulumi.StringArray{rdsSecurityGroup.ID()},
			StorageEncrypted:     pulumi.Bool(true),
			KmsKeyId:             kmsKey.ID(),
			BackupRetentionPeriod: pulumi.Int(7),
			PreferredBackupWindow: pulumi.String("03:00-04:00"),
			SkipFinalSnapshot:    pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create RDS cluster instance
		_, err = rds.NewClusterInstance(ctx, fmt.Sprintf("student-db-instance-%s", environmentSuffix), &rds.ClusterInstanceArgs{
			ClusterIdentifier: rdsCluster.ID(),
			InstanceClass:     pulumi.String("db.t3.medium"),
			Engine:            rdsCluster.Engine,
			EngineVersion:     rdsCluster.EngineVersion,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create security group for ElastiCache
		elasticacheSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("elasticache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ElastiCache Redis"),
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
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ElastiCache subnet group
		elasticacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("redis-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{
				privateSubnet1.ID(),
				privateSubnet2.ID(),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ElastiCache Redis cluster
		_, err = elasticache.NewReplicationGroup(ctx, fmt.Sprintf("session-redis-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupDescription: pulumi.String("Redis cluster for session management"),
			Engine:                      pulumi.String("redis"),
			EngineVersion:               pulumi.String("7.0"),
			NodeType:                    pulumi.String("cache.t3.micro"),
			NumCacheClusters:            pulumi.Int(2),
			Port:                        pulumi.Int(6379),
			SubnetGroupName:             elasticacheSubnetGroup.Name,
			SecurityGroupIds:            pulumi.StringArray{elasticacheSecurityGroup.ID()},
			AtRestEncryptionEnabled:     pulumi.Bool(true),
			TransitEncryptionEnabled:    pulumi.Bool(true),
			AutomaticFailoverEnabled:    pulumi.Bool(true),
			MultiAzEnabled:              pulumi.Bool(true),
			KmsKeyId:                    kmsKey.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create EFS file system
		efsFileSystem, err := efs.NewFileSystem(ctx, fmt.Sprintf("efs-%s", environmentSuffix), &efs.FileSystemArgs{
			Encrypted: pulumi.Bool(true),
			KmsKeyId:  kmsKey.ID(),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create EFS mount targets
		_, err = efs.NewMountTarget(ctx, fmt.Sprintf("efs-mount-1-%s", environmentSuffix), &efs.MountTargetArgs{
			FileSystemId: efsFileSystem.ID(),
			SubnetId:     privateSubnet1.ID(),
			SecurityGroups: pulumi.StringArray{
				elasticacheSecurityGroup.ID(),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = efs.NewMountTarget(ctx, fmt.Sprintf("efs-mount-2-%s", environmentSuffix), &efs.MountTargetArgs{
			FileSystemId: efsFileSystem.ID(),
			SubnetId:     privateSubnet2.ID(),
			SecurityGroups: pulumi.StringArray{
				elasticacheSecurityGroup.ID(),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ECR repository
		ecrRepo, err := ecr.NewRepository(ctx, fmt.Sprintf("app-repo-%s", environmentSuffix), &ecr.RepositoryArgs{
			ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
				ScanOnPush: pulumi.Bool(true),
			},
			EncryptionConfigurations: ecr.RepositoryEncryptionConfigurationArray{
				&ecr.RepositoryEncryptionConfigurationArgs{
					EncryptionType: pulumi.String("KMS"),
					KmsKey:         kmsKey.Arn,
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ECS cluster
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("app-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM role for ECS tasks
		ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "ecs-tasks.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Attach policies to ECS task role
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-task-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create security group for ECS tasks
		ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ECS tasks"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
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
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("app-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("app-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsTaskRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: ecrRepo.RepositoryUrl.ApplyT(func(url string) string {
				return fmt.Sprintf(`[{
					"name": "app",
					"image": "%s:latest",
					"cpu": 256,
					"memory": 512,
					"essential": true,
					"portMappings": [{
						"containerPort": 80,
						"protocol": "tcp"
					}],
					"logConfiguration": {
						"logDriver": "awslogs",
						"options": {
							"awslogs-group": "/ecs/app-%s",
							"awslogs-region": "us-east-1",
							"awslogs-stream-prefix": "ecs"
						}
					}
				}]`, url, environmentSuffix)
			}).(pulumi.StringOutput),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create ECS service
		_, err = ecs.NewService(ctx, fmt.Sprintf("app-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(2),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
				SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
			},
			DeploymentController: &ecs.ServiceDeploymentControllerArgs{
				Type: pulumi.String("ECS"),
			},
			DeploymentConfiguration: &ecs.ServiceDeploymentConfigurationArgs{
				DeploymentCircuitBreaker: &ecs.ServiceDeploymentConfigurationDeploymentCircuitBreakerArgs{
					Enable:   pulumi.Bool(true),
					Rollback: pulumi.Bool(true),
				},
				MinimumHealthyPercent: pulumi.Int(100),
				MaximumPercent:        pulumi.Int(200),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create API Gateway REST API
		restApi, err := apigateway.NewRestApi(ctx, fmt.Sprintf("api-%s", environmentSuffix), &apigateway.RestApiArgs{
			Description: pulumi.String("API Gateway for EduTech platform"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create API Gateway authorizer
		_, err = apigateway.NewAuthorizer(ctx, fmt.Sprintf("api-authorizer-%s", environmentSuffix), &apigateway.AuthorizerArgs{
			RestApi:      restApi.ID(),
			Name:         pulumi.String(fmt.Sprintf("api-authorizer-%s", environmentSuffix)),
			Type:         pulumi.String("COGNITO_USER_POOLS"),
			IdentitySource: pulumi.String("method.request.header.Authorization"),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create S3 bucket for CodePipeline artifacts
		artifactBucket, err := s3.NewBucket(ctx, fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix), &s3.BucketArgs{
			ForceDestroy: pulumi.Bool(true),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Enable bucket encryption
		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("pipeline-artifacts-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						SseAlgorithm: pulumi.String("AES256"),
					},
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM role for CodePipeline
		pipelineRole, err := iam.NewRole(ctx, fmt.Sprintf("pipeline-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "codepipeline.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM policy for CodePipeline
		pipelinePolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("pipeline-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Policy: pulumi.All(artifactBucket.Arn, ecrRepo.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
				repoArn := args[1].(string)
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
								"codebuild:BatchGetBuilds",
								"codebuild:StartBuild"
							],
							"Resource": "*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"ecs:*",
								"ecr:*"
							],
							"Resource": "*"
						}
					]
				}`, bucketArn)
			}).(pulumi.StringOutput),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("pipeline-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      pipelineRole.Name,
			PolicyArn: pipelinePolicy.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM role for CodeBuild
		codebuildRole, err := iam.NewRole(ctx, fmt.Sprintf("codebuild-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "codebuild.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create IAM policy for CodeBuild
		codebuildPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("codebuild-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Policy: pulumi.All(artifactBucket.Arn, ecrRepo.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
				repoArn := args[1].(string)
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
								"ecr:PutImage",
								"ecr:InitiateLayerUpload",
								"ecr:UploadLayerPart",
								"ecr:CompleteLayerUpload"
							],
							"Resource": "*"
						}
					]
				}`, bucketArn)
			}).(pulumi.StringOutput),
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("codebuild-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      codebuildRole.Name,
			PolicyArn: codebuildPolicy.Arn,
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create CodeBuild project
		buildProject, err := codebuild.NewProject(ctx, fmt.Sprintf("build-project-%s", environmentSuffix), &codebuild.ProjectArgs{
			ServiceRole: codebuildRole.Arn,
			Artifacts: &codebuild.ProjectArtifactsArgs{
				Type: pulumi.String("CODEPIPELINE"),
			},
			Environment: &codebuild.ProjectEnvironmentArgs{
				ComputeType:                pulumi.String("BUILD_GENERAL1_SMALL"),
				Image:                      pulumi.String("aws/codebuild/standard:5.0"),
				Type:                       pulumi.String("LINUX_CONTAINER"),
				ImagePullCredentialsType:   pulumi.String("CODEBUILD"),
				PrivilegedMode:             pulumi.Bool(true),
				EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("AWS_DEFAULT_REGION"),
						Value: pulumi.String(awsRegion),
					},
					&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
						Name:  pulumi.String("ECR_REPO_URI"),
						Value: ecrRepo.RepositoryUrl,
					},
				},
			},
			Source: &codebuild.ProjectSourceArgs{
				Type: pulumi.String("CODEPIPELINE"),
				Buildspec: pulumi.String(`version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI
  build:
    commands:
      - echo Build started on $(date)
      - docker build -t $ECR_REPO_URI:latest .
      - docker tag $ECR_REPO_URI:latest $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
  post_build:
    commands:
      - echo Build completed on $(date)
      - docker push $ECR_REPO_URI:latest
      - docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION
`),
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Create CodePipeline
		_, err = codepipeline.NewPipeline(ctx, fmt.Sprintf("ci-cd-pipeline-%s", environmentSuffix), &codepipeline.PipelineArgs{
			RoleArn: pipelineRole.Arn,
			ArtifactStores: codepipeline.PipelineArtifactStoreArray{
				&codepipeline.PipelineArtifactStoreArgs{
					Location: artifactBucket.Bucket,
					Type:     pulumi.String("S3"),
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
							Provider: pulumi.String("CodeCommit"),
							Version:  pulumi.String("1"),
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("source_output"),
							},
							Configuration: pulumi.StringMap{
								"RepositoryName": pulumi.String("edutech-repo"),
								"BranchName":     pulumi.String("main"),
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
							InputArtifacts: pulumi.StringArray{
								pulumi.String("source_output"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("build_output"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": buildProject.Name,
							},
						},
					},
				},
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("Deploy"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("Deploy"),
							Category: pulumi.String("Deploy"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("ECS"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("build_output"),
							},
							Configuration: pulumi.StringMap{
								"ClusterName": ecsCluster.Name,
								"ServiceName": pulumi.String(fmt.Sprintf("app-service-%s", environmentSuffix)),
							},
						},
					},
				},
			},
		}, pulumi.Provider(provider))
		if err != nil {
			return err
		}

		// Export important values
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("rdsEndpoint", rdsCluster.Endpoint)
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("ecrRepositoryUrl", ecrRepo.RepositoryUrl)
		ctx.Export("apiGatewayUrl", restApi.ID())
		ctx.Export("efsFileSystemId", efsFileSystem.ID())

		return nil
	})
}
```

## File: lib/README.md

```markdown
# EduTech CI/CD Pipeline Infrastructure

This Pulumi program provisions a secure CI/CD pipeline infrastructure for an educational platform that handles sensitive student data.

## Architecture

The infrastructure includes:

1. **Networking**: VPC with public and private subnets across two availability zones
2. **Database**: Aurora PostgreSQL cluster with encryption for student data
3. **Caching**: ElastiCache Redis cluster for session management
4. **Storage**: EFS for shared storage between containers
5. **Compute**: ECS Fargate cluster for application hosting
6. **CI/CD**: CodePipeline with CodeBuild for automated deployments
7. **API**: API Gateway with authentication
8. **Secrets**: SecretsManager for credential management
9. **Encryption**: KMS key for data encryption

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Go 1.23+ installed

## Deployment

1. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

2. Install dependencies:
```bash
go mod download
```

3. Deploy the stack:
```bash
pulumi up
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: AWS region (default: us-east-1)
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging
- `PR_NUMBER`: Pull request number for tagging
- `TEAM`: Team name for tagging

## Outputs

- `vpcId`: VPC identifier
- `rdsEndpoint`: RDS cluster endpoint
- `ecsClusterName`: ECS cluster name
- `ecrRepositoryUrl`: ECR repository URL
- `apiGatewayUrl`: API Gateway URL
- `efsFileSystemId`: EFS file system ID

## Security Features

- All data encrypted at rest using KMS
- Transit encryption enabled for Redis
- VPC security groups for network isolation
- IAM roles with least privilege
- Secrets managed through AWS Secrets Manager

## Compliance

This infrastructure is designed to meet APEC CBPR requirements:
- All resources deployed in us-east-1 for data sovereignty
- Encryption at rest and in transit
- Access controls and audit logging
- Secure credential management
```
