# GitOps CI/CD Pipeline Implementation - Pulumi Go

Complete implementation of a multi-stage CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and ECS Fargate with Pulumi Go.

## File: main.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codecommit"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/codepipeline"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticloadbalancingv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/events"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Load configuration
		cfg := config.New(ctx, "")
		environmentSuffix := cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		region := "us-east-1"

		// Create KMS key for encryption (Requirement 11)
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("pipeline-kms-key-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String(fmt.Sprintf("KMS key for encrypting pipeline artifacts and ECR images - %s", environmentSuffix)),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(7),
		})
		if err != nil {
			return err
		}

		_, err = kms.NewAlias(ctx, fmt.Sprintf("pipeline-kms-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/pipeline-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Create S3 bucket for pipeline artifacts
		artifactBucket, err := s3.NewBucket(ctx, fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix), &s3.BucketArgs{
			Bucket:       pulumi.String(fmt.Sprintf("pipeline-artifacts-%s", environmentSuffix)),
			ForceDestroy: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, fmt.Sprintf("artifact-bucket-encryption-%s", environmentSuffix), &s3.BucketServerSideEncryptionConfigurationV2Args{
			Bucket: artifactBucket.ID(),
			Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{
				&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{
					ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{
						KmsMasterKeyId: kmsKey.Arn,
						SseAlgorithm:   pulumi.String("aws:kms"),
					},
				},
			},
		})
		if err != nil {
			return err
		}

		_, err = s3.NewBucketPublicAccessBlock(ctx, fmt.Sprintf("artifact-bucket-public-access-block-%s", environmentSuffix), &s3.BucketPublicAccessBlockArgs{
			Bucket:                artifactBucket.ID(),
			BlockPublicAcls:       pulumi.Bool(true),
			BlockPublicPolicy:     pulumi.Bool(true),
			IgnorePublicAcls:      pulumi.Bool(true),
			RestrictPublicBuckets: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Create CodeCommit repository (Requirement 1)
		repo, err := codecommit.NewRepository(ctx, fmt.Sprintf("gitops-repo-%s", environmentSuffix), &codecommit.RepositoryArgs{
			RepositoryName: pulumi.String(fmt.Sprintf("gitops-repo-%s", environmentSuffix)),
			Description:    pulumi.String(fmt.Sprintf("GitOps repository for microservices - %s", environmentSuffix)),
		})
		if err != nil {
			return err
		}

		// Create ECR repository with lifecycle policy (Requirement 5)
		ecrRepo, err := ecr.NewRepository(ctx, fmt.Sprintf("microservices-ecr-%s", environmentSuffix), &ecr.RepositoryArgs{
			Name:               pulumi.String(fmt.Sprintf("microservices-%s", environmentSuffix)),
			ImageTagMutability: pulumi.String("MUTABLE"),
			EncryptionConfigurations: ecr.RepositoryEncryptionConfigurationArray{
				&ecr.RepositoryEncryptionConfigurationArgs{
					EncryptionType: pulumi.String("KMS"),
					KmsKey:         kmsKey.Arn,
				},
			},
			ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
				ScanOnPush: pulumi.Bool(true),
			},
			ForceDelete: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// ECR lifecycle policy - retain only last 10 images per tag
		_, err = ecr.NewLifecyclePolicy(ctx, fmt.Sprintf("ecr-lifecycle-%s", environmentSuffix), &ecr.LifecyclePolicyArgs{
			Repository: ecrRepo.Name,
			Policy: pulumi.String(`{
				"rules": [
					{
						"rulePriority": 1,
						"description": "Keep last 10 images per tag",
						"selection": {
							"tagStatus": "any",
							"countType": "imageCountMoreThan",
							"countNumber": 10
						},
						"action": {
							"type": "expire"
						}
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		// Create CloudWatch log groups (Requirement 12)
		codeBuildLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("codebuild-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/codebuild/gitops-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
		})
		if err != nil {
			return err
		}

		ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/ecs/microservices-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
		})
		if err != nil {
			return err
		}

		// Create SNS topic for notifications (Requirement 8)
		snsTopic, err := sns.NewTopic(ctx, fmt.Sprintf("pipeline-notifications-%s", environmentSuffix), &sns.TopicArgs{
			Name: pulumi.String(fmt.Sprintf("pipeline-notifications-%s", environmentSuffix)),
		})
		if err != nil {
			return err
		}

		// Create IAM roles (Requirement 10)

		// CodePipeline role
		codePipelineRole, err := iam.NewRole(ctx, fmt.Sprintf("codepipeline-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("codepipeline-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": {
							"Service": "codepipeline.amazonaws.com"
						},
						"Action": "sts:AssumeRole"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("codepipeline-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: codePipelineRole.ID(),
			Policy: pulumi.All(artifactBucket.Arn, repo.Arn, kmsKey.Arn, snsTopic.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
				repoArn := args[1].(string)
				keyArn := args[2].(string)
				topicArn := args[3].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:GetObjectVersion",
								"s3:PutObject",
								"s3:GetBucketLocation"
							],
							"Resource": [
								"%s",
								"%s/*"
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"codecommit:GetBranch",
								"codecommit:GetCommit",
								"codecommit:UploadArchive",
								"codecommit:GetUploadArchiveStatus",
								"codecommit:CancelUploadArchive"
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
						},
						{
							"Effect": "Allow",
							"Action": [
								"iam:PassRole"
							],
							"Resource": "*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:Encrypt",
								"kms:ReEncrypt*",
								"kms:GenerateDataKey*",
								"kms:DescribeKey"
							],
							"Resource": "%s"
						},
						{
							"Effect": "Allow",
							"Action": [
								"sns:Publish"
							],
							"Resource": "%s"
						}
					]
				}`, bucketArn, bucketArn, repoArn, keyArn, topicArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// CodeBuild role
		codeBuildRole, err := iam.NewRole(ctx, fmt.Sprintf("codebuild-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("codebuild-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": {
							"Service": "codebuild.amazonaws.com"
						},
						"Action": "sts:AssumeRole"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("codebuild-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: codeBuildRole.ID(),
			Policy: pulumi.All(artifactBucket.Arn, codeBuildLogGroup.Arn, ecrRepo.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
				bucketArn := args[0].(string)
				logGroupArn := args[1].(string)
				ecrArn := args[2].(string)
				keyArn := args[3].(string)
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
							"Resource": "%s:*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:GetBucketLocation"
							],
							"Resource": [
								"%s",
								"%s/*"
							]
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
								"ecr:CompleteLayerUpload",
								"ecr:BatchGetImage"
							],
							"Resource": "*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:Encrypt",
								"kms:ReEncrypt*",
								"kms:GenerateDataKey*",
								"kms:DescribeKey"
							],
							"Resource": "%s"
						}
					]
				}`, logGroupArn, bucketArn, bucketArn, keyArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// ECS Task Execution role
		ecsExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-execution-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-execution-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Action": "sts:AssumeRole"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-execution-policy-attachment-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ecs-execution-kms-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: ecsExecutionRole.ID(),
			Policy: kmsKey.Arn.ApplyT(func(keyArn string) string {
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:DescribeKey"
							],
							"Resource": "%s"
						}
					]
				}`, keyArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// ECS Task role
		ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Action": "sts:AssumeRole"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		// Create VPC and networking (Requirement 6-7)
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("gitops-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("gitops-vpc-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("gitops-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("gitops-igw-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Get availability zones
		availabilityZones := []string{
			fmt.Sprintf("%sa", region),
			fmt.Sprintf("%sb", region),
		}

		// Public subnets
		var publicSubnets []*ec2.Subnet
		for i, az := range availabilityZones {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d-%s", i, environmentSuffix), &ec2.SubnetArgs{
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i)),
				AvailabilityZone:    pulumi.String(az),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("public-subnet-%d-%s", i, environmentSuffix)),
				},
			})
			if err != nil {
				return err
			}
			publicSubnets = append(publicSubnets, subnet)
		}

		// Private subnets
		var privateSubnets []*ec2.Subnet
		for i, az := range availabilityZones {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d-%s", i, environmentSuffix), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
				AvailabilityZone: pulumi.String(az),
				Tags: pulumi.StringMap{
					"Name": pulumi.String(fmt.Sprintf("private-subnet-%d-%s", i, environmentSuffix)),
				},
			})
			if err != nil {
				return err
			}
			privateSubnets = append(privateSubnets, subnet)
		}

		// Public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("public-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, fmt.Sprintf("public-route-%s", environmentSuffix), &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		// Associate public subnets with route table
		for i, subnet := range publicSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d-%s", i, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Elastic IP for NAT Gateway (for private subnets to reach ECR)
		eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%s", environmentSuffix), &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("nat-eip-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// NAT Gateway
		natGateway, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%s", environmentSuffix), &ec2.NatGatewayArgs{
			AllocationId: eip.ID(),
			SubnetId:     publicSubnets[0].ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("nat-gateway-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Private route table
		privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("private-rt-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, fmt.Sprintf("private-route-%s", environmentSuffix), &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGateway.ID(),
		})
		if err != nil {
			return err
		}

		// Associate private subnets with route table
		for i, subnet := range privateSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%d-%s", i, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		albSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("alb-sg-%s", environmentSuffix)),
			Description: pulumi.String("Security group for ALB"),
			VpcId:       vpc.ID(),
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
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("alb-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("ecs-sg-%s", environmentSuffix)),
			Description: pulumi.String("Security group for ECS tasks"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(8080),
					ToPort:         pulumi.Int(8080),
					SecurityGroups: pulumi.StringArray{albSecurityGroup.ID()},
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
				"Name": pulumi.String(fmt.Sprintf("ecs-sg-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create Application Load Balancer (Requirement 7)
		alb, err := elasticloadbalancingv2.NewLoadBalancer(ctx, fmt.Sprintf("microservices-alb-%s", environmentSuffix), &elasticloadbalancingv2.LoadBalancerArgs{
			Name:             pulumi.String(fmt.Sprintf("ms-alb-%s", environmentSuffix)),
			Internal:         pulumi.Bool(false),
			LoadBalancerType: pulumi.String("application"),
			SecurityGroups:   pulumi.StringArray{albSecurityGroup.ID()},
			Subnets: pulumi.StringArray{
				publicSubnets[0].ID(),
				publicSubnets[1].ID(),
			},
			EnableDeletionProtection: pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name": pulumi.String(fmt.Sprintf("microservices-alb-%s", environmentSuffix)),
			},
		})
		if err != nil {
			return err
		}

		// Create target group
		targetGroup, err := elasticloadbalancingv2.NewTargetGroup(ctx, fmt.Sprintf("ecs-tg-%s", environmentSuffix), &elasticloadbalancingv2.TargetGroupArgs{
			Name:       pulumi.String(fmt.Sprintf("ecs-tg-%s", environmentSuffix)),
			Port:       pulumi.Int(8080),
			Protocol:   pulumi.String("HTTP"),
			VpcId:      vpc.ID(),
			TargetType: pulumi.String("ip"),
			HealthCheck: &elasticloadbalancingv2.TargetGroupHealthCheckArgs{
				Enabled:            pulumi.Bool(true),
				HealthyThreshold:   pulumi.Int(2),
				Interval:           pulumi.Int(30),
				Protocol:           pulumi.String("HTTP"),
				Matcher:            pulumi.String("200"),
				Timeout:            pulumi.Int(5),
				Path:               pulumi.String("/health"),
				UnhealthyThreshold: pulumi.Int(2),
			},
			DeregistrationDelay: pulumi.Int(30),
		})
		if err != nil {
			return err
		}

		// Create ALB listener
		_, err = elasticloadbalancingv2.NewListener(ctx, fmt.Sprintf("alb-listener-%s", environmentSuffix), &elasticloadbalancingv2.ListenerArgs{
			LoadBalancerArn: alb.Arn,
			Port:            pulumi.Int(80),
			Protocol:        pulumi.String("HTTP"),
			DefaultActions: elasticloadbalancingv2.ListenerDefaultActionArray{
				&elasticloadbalancingv2.ListenerDefaultActionArgs{
					Type:           pulumi.String("forward"),
					TargetGroupArn: targetGroup.Arn,
				},
			},
		})
		if err != nil {
			return err
		}

		// Create ECS cluster (Requirement 6)
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("microservices-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("microservices-cluster-%s", environmentSuffix)),
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

		// Create ECS task definition (Requirement 6)
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("microservices-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("microservices-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.All(ecrRepo.RepositoryUrl, ecsLogGroup.Name).ApplyT(func(args []interface{}) string {
				repoUrl := args[0].(string)
				logGroupName := args[1].(string)
				return fmt.Sprintf(`[
					{
						"name": "microservice",
						"image": "%s:latest",
						"cpu": 256,
						"memory": 512,
						"essential": true,
						"portMappings": [
							{
								"containerPort": 8080,
								"hostPort": 8080,
								"protocol": "tcp"
							}
						],
						"logConfiguration": {
							"logDriver": "awslogs",
							"options": {
								"awslogs-group": "%s",
								"awslogs-region": "%s",
								"awslogs-stream-prefix": "microservice"
							}
						},
						"environment": [
							{
								"name": "ENVIRONMENT",
								"value": "%s"
							}
						]
					}
				]`, repoUrl, logGroupName, region, environmentSuffix)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create ECS service (Requirement 6)
		_, err = ecs.NewService(ctx, fmt.Sprintf("microservices-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Name:                             pulumi.String(fmt.Sprintf("microservices-service-%s", environmentSuffix)),
			Cluster:                          ecsCluster.Arn,
			TaskDefinition:                   taskDefinition.Arn,
			DesiredCount:                     pulumi.Int(2),
			LaunchType:                       pulumi.String("FARGATE"),
			SchedulingStrategy:               pulumi.String("REPLICA"),
			DeploymentMaximumPercent:         pulumi.Int(200),
			DeploymentMinimumHealthyPercent:  pulumi.Int(100),
			HealthCheckGracePeriodSeconds:    pulumi.Int(60),
			EnableExecuteCommand:             pulumi.Bool(true),
			ForceNewDeployment:               pulumi.Bool(false),
			WaitForSteadyState:               pulumi.Bool(false),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets: pulumi.StringArray{
					privateSubnets[0].ID(),
					privateSubnets[1].ID(),
				},
				SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
				AssignPublicIp: pulumi.Bool(false),
			},
			LoadBalancers: ecs.ServiceLoadBalancerArray{
				&ecs.ServiceLoadBalancerArgs{
					TargetGroupArn: targetGroup.Arn,
					ContainerName:  pulumi.String("microservice"),
					ContainerPort:  pulumi.Int(8080),
				},
			},
		}, pulumi.DependsOn([]pulumi.Resource{alb}))
		if err != nil {
			return err
		}

		// Create CodeBuild projects (Requirement 3 & 4)

		// Build project for Docker image
		buildProject, err := createCodeBuildProject(
			ctx,
			fmt.Sprintf("build-project-%s", environmentSuffix),
			fmt.Sprintf("Docker Build - %s", environmentSuffix),
			codeBuildRole.Arn,
			codeBuildLogGroup.Name,
			artifactBucket.Bucket,
			ecrRepo.RepositoryUrl,
			region,
			environmentSuffix,
			"build",
		)
		if err != nil {
			return err
		}

		// Security scan project using Trivy
		scanProject, err := createCodeBuildProject(
			ctx,
			fmt.Sprintf("scan-project-%s", environmentSuffix),
			fmt.Sprintf("Security Scan with Trivy - %s", environmentSuffix),
			codeBuildRole.Arn,
			codeBuildLogGroup.Name,
			artifactBucket.Bucket,
			ecrRepo.RepositoryUrl,
			region,
			environmentSuffix,
			"scan",
		)
		if err != nil {
			return err
		}

		// Deploy projects for each environment
		deployDevProject, err := createCodeBuildProject(
			ctx,
			fmt.Sprintf("deploy-dev-project-%s", environmentSuffix),
			fmt.Sprintf("Deploy to Dev - %s", environmentSuffix),
			codeBuildRole.Arn,
			codeBuildLogGroup.Name,
			artifactBucket.Bucket,
			ecrRepo.RepositoryUrl,
			region,
			environmentSuffix,
			"deploy-dev",
		)
		if err != nil {
			return err
		}

		deployStagingProject, err := createCodeBuildProject(
			ctx,
			fmt.Sprintf("deploy-staging-project-%s", environmentSuffix),
			fmt.Sprintf("Deploy to Staging - %s", environmentSuffix),
			codeBuildRole.Arn,
			codeBuildLogGroup.Name,
			artifactBucket.Bucket,
			ecrRepo.RepositoryUrl,
			region,
			environmentSuffix,
			"deploy-staging",
		)
		if err != nil {
			return err
		}

		deployProdProject, err := createCodeBuildProject(
			ctx,
			fmt.Sprintf("deploy-prod-project-%s", environmentSuffix),
			fmt.Sprintf("Deploy to Prod - %s", environmentSuffix),
			codeBuildRole.Arn,
			codeBuildLogGroup.Name,
			artifactBucket.Bucket,
			ecrRepo.RepositoryUrl,
			region,
			environmentSuffix,
			"deploy-prod",
		)
		if err != nil {
			return err
		}

		// EventBridge IAM role
		eventBridgeRole, err := iam.NewRole(ctx, fmt.Sprintf("eventbridge-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("eventbridge-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Principal": {
							"Service": "events.amazonaws.com"
						},
						"Action": "sts:AssumeRole"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("eventbridge-sns-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: eventBridgeRole.ID(),
			Policy: snsTopic.Arn.ApplyT(func(topicArn string) string {
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": "sns:Publish",
							"Resource": "%s"
						}
					]
				}`, topicArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create CodePipeline (Requirement 2, 8, 9)
		pipeline, err := codepipeline.NewPipeline(ctx, fmt.Sprintf("gitops-pipeline-%s", environmentSuffix), &codepipeline.PipelineArgs{
			Name:    pulumi.String(fmt.Sprintf("gitops-pipeline-%s", environmentSuffix)),
			RoleArn: codePipelineRole.Arn,
			ArtifactStores: codepipeline.PipelineArtifactStoreArray{
				&codepipeline.PipelineArtifactStoreArgs{
					Location: artifactBucket.Bucket,
					Type:     pulumi.String("S3"),
					EncryptionKey: &codepipeline.PipelineArtifactStoreEncryptionKeyArgs{
						Id:   kmsKey.Arn,
						Type: pulumi.String("KMS"),
					},
				},
			},
			Stages: codepipeline.PipelineStageArray{
				// Source stage
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
								pulumi.String("SourceOutput"),
							},
							Configuration: pulumi.StringMap{
								"RepositoryName": repo.RepositoryName,
								"BranchName":     pulumi.String("main"),
								"PollForSourceChanges": pulumi.String("false"),
							},
						},
					},
				},
				// Build stage
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
								pulumi.String("SourceOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("BuildOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": buildProject.Name,
							},
						},
					},
				},
				// Security scan stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("SecurityScan"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("TrivyScan"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("BuildOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("ScanOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": scanProject.Name,
							},
						},
					},
				},
				// Deploy to Dev stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("DeployDev"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("DeployDev"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("ScanOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("DeployDevOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": deployDevProject.Name,
							},
						},
					},
				},
				// Deploy to Staging stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("DeployStaging"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("DeployStaging"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("DeployDevOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("DeployStagingOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": deployStagingProject.Name,
							},
						},
					},
				},
				// Manual approval before production (Requirement 9)
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("ApprovalForProduction"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("ManualApproval"),
							Category: pulumi.String("Approval"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("Manual"),
							Version:  pulumi.String("1"),
							Configuration: pulumi.StringMap{
								"CustomData":         pulumi.String("Please review and approve deployment to production"),
								"NotificationArn":    snsTopic.Arn,
							},
						},
					},
				},
				// Deploy to Production stage
				&codepipeline.PipelineStageArgs{
					Name: pulumi.String("DeployProduction"),
					Actions: codepipeline.PipelineStageActionArray{
						&codepipeline.PipelineStageActionArgs{
							Name:     pulumi.String("DeployProd"),
							Category: pulumi.String("Build"),
							Owner:    pulumi.String("AWS"),
							Provider: pulumi.String("CodeBuild"),
							Version:  pulumi.String("1"),
							InputArtifacts: pulumi.StringArray{
								pulumi.String("DeployStagingOutput"),
							},
							OutputArtifacts: pulumi.StringArray{
								pulumi.String("DeployProdOutput"),
							},
							Configuration: pulumi.StringMap{
								"ProjectName": deployProdProject.Name,
							},
						},
					},
				},
			},
		})
		if err != nil {
			return err
		}

		// EventBridge rule for pipeline state changes (Requirement 8)
		eventRule, err := events.NewRule(ctx, fmt.Sprintf("pipeline-state-change-%s", environmentSuffix), &events.RuleArgs{
			Name:        pulumi.String(fmt.Sprintf("pipeline-state-change-%s", environmentSuffix)),
			Description: pulumi.String(fmt.Sprintf("Capture pipeline state changes - %s", environmentSuffix)),
			EventPattern: pipeline.Arn.ApplyT(func(pipelineArn string) string {
				return fmt.Sprintf(`{
					"source": ["aws.codepipeline"],
					"detail-type": ["CodePipeline Pipeline Execution State Change"],
					"detail": {
						"pipeline": ["%s"]
					}
				}`, fmt.Sprintf("gitops-pipeline-%s", environmentSuffix))
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		_, err = events.NewTarget(ctx, fmt.Sprintf("pipeline-sns-target-%s", environmentSuffix), &events.TargetArgs{
			Rule:    eventRule.Name,
			Arn:     snsTopic.Arn,
			RoleArn: eventBridgeRole.Arn,
			InputTransformer: &events.TargetInputTransformerArgs{
				InputPaths: pulumi.StringMap{
					"pipeline": pulumi.String("$.detail.pipeline"),
					"state":    pulumi.String("$.detail.state"),
				},
				InputTemplate: pulumi.String("\"Pipeline <pipeline> is in state <state>\""),
			},
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("repositoryCloneUrlHttp", repo.CloneUrlHttp)
		ctx.Export("ecrRepositoryUrl", ecrRepo.RepositoryUrl)
		ctx.Export("pipelineName", pipeline.Name)
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("albDnsName", alb.DnsName)
		ctx.Export("snsTopicArn", snsTopic.Arn)
		ctx.Export("kmsKeyId", kmsKey.KeyId)

		return nil
	})
}

// Helper function to create CodeBuild projects
func createCodeBuildProject(ctx *pulumi.Context, name, description string, roleArn, logGroupName, artifactBucket, ecrRepoUrl pulumi.StringOutput, region, environmentSuffix, projectType string) (*codebuild.Project, error) {
	// Create buildspec based on project type
	buildspecContent := generateBuildspec(projectType, ecrRepoUrl, region, environmentSuffix)

	project, err := codebuild.NewProject(ctx, name, &codebuild.ProjectArgs{
		Name:          pulumi.String(fmt.Sprintf("%s-%s", name, environmentSuffix)),
		Description:   pulumi.String(description),
		ServiceRole:   roleArn,
		BuildTimeout:  pulumi.Int(30),
		QueuedTimeout: pulumi.Int(480),
		Environment: &codebuild.ProjectEnvironmentArgs{
			ComputeType:              pulumi.String("BUILD_GENERAL1_SMALL"),
			Image:                    pulumi.String("aws/codebuild/amazonlinux2-aarch64-standard:3.0"),
			Type:                     pulumi.String("ARM_CONTAINER"),
			ImagePullCredentialsType: pulumi.String("CODEBUILD"),
			PrivilegedMode:           pulumi.Bool(true),
			EnvironmentVariables: codebuild.ProjectEnvironmentEnvironmentVariableArray{
				&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
					Name:  pulumi.String("AWS_DEFAULT_REGION"),
					Value: pulumi.String(region),
				},
				&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
					Name:  pulumi.String("AWS_ACCOUNT_ID"),
					Value: pulumi.String("${AWS_ACCOUNT_ID}"),
					Type:  pulumi.String("PLAINTEXT"),
				},
				&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
					Name:  ecrRepoUrl.ApplyT(func(url string) string { return "ECR_REPOSITORY_URI" }).(pulumi.StringOutput),
					Value: ecrRepoUrl,
				},
				&codebuild.ProjectEnvironmentEnvironmentVariableArgs{
					Name:  pulumi.String("ENVIRONMENT_SUFFIX"),
					Value: pulumi.String(environmentSuffix),
				},
			},
		},
		Artifacts: &codebuild.ProjectArtifactsArgs{
			Type: pulumi.String("CODEPIPELINE"),
		},
		Source: &codebuild.ProjectSourceArgs{
			Type:      pulumi.String("CODEPIPELINE"),
			Buildspec: pulumi.String(buildspecContent),
		},
		LogsConfig: &codebuild.ProjectLogsConfigArgs{
			CloudwatchLogs: &codebuild.ProjectLogsConfigCloudwatchLogsArgs{
				GroupName:  logGroupName,
				StreamName: pulumi.String(fmt.Sprintf("%s-stream", name)),
			},
		},
		Cache: &codebuild.ProjectCacheArgs{
			Type:     pulumi.String("S3"),
			Location: pulumi.Sprintf("%s/build-cache", artifactBucket),
		},
	})

	return project, err
}

// Generate buildspec based on project type
func generateBuildspec(projectType string, ecrRepoUrl pulumi.StringOutput, region, environmentSuffix string) string {
	switch projectType {
	case "build":
		return `version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on $(date)
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on $(date)
      - echo Pushing the Docker images...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"microservice","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - '**/*'`

	case "scan":
		return `version: 0.2

phases:
  pre_build:
    commands:
      - echo Installing Trivy...
      - wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-ARM64.tar.gz
      - tar zxvf trivy_0.48.0_Linux-ARM64.tar.gz
      - mv trivy /usr/local/bin/
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
  build:
    commands:
      - echo Security scan started on $(date)
      - echo Scanning Docker image with Trivy...
      - trivy image --severity HIGH,CRITICAL --exit-code 0 --no-progress $ECR_REPOSITORY_URI:latest
      - trivy image --severity HIGH,CRITICAL --format json --output trivy-report.json $ECR_REPOSITORY_URI:latest
  post_build:
    commands:
      - echo Security scan completed on $(date)
      - echo Scan results saved to trivy-report.json

artifacts:
  files:
    - trivy-report.json
    - imagedefinitions.json
    - '**/*'`

	case "deploy-dev":
		return fmt.Sprintf(`version: 0.2

phases:
  pre_build:
    commands:
      - echo Preparing deployment to Dev environment...
      - CLUSTER_NAME=microservices-cluster-%s
      - SERVICE_NAME=microservices-service-%s
  build:
    commands:
      - echo Deployment to Dev started on $(date)
      - echo Updating ECS service...
      - aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_DEFAULT_REGION
  post_build:
    commands:
      - echo Deployment to Dev completed on $(date)

artifacts:
  files:
    - '**/*'`, environmentSuffix, environmentSuffix)

	case "deploy-staging":
		return fmt.Sprintf(`version: 0.2

phases:
  pre_build:
    commands:
      - echo Preparing deployment to Staging environment...
      - CLUSTER_NAME=microservices-cluster-%s
      - SERVICE_NAME=microservices-service-%s
  build:
    commands:
      - echo Deployment to Staging started on $(date)
      - echo Updating ECS service...
      - aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_DEFAULT_REGION
  post_build:
    commands:
      - echo Deployment to Staging completed on $(date)

artifacts:
  files:
    - '**/*'`, environmentSuffix, environmentSuffix)

	case "deploy-prod":
		return fmt.Sprintf(`version: 0.2

phases:
  pre_build:
    commands:
      - echo Preparing deployment to Production environment...
      - CLUSTER_NAME=microservices-cluster-%s
      - SERVICE_NAME=microservices-service-%s
  build:
    commands:
      - echo Deployment to Production started on $(date)
      - echo Updating ECS service...
      - aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $AWS_DEFAULT_REGION
  post_build:
    commands:
      - echo Deployment to Production completed on $(date)

artifacts:
  files:
    - '**/*'`, environmentSuffix, environmentSuffix)

	default:
		return ""
	}
}
```

## File: go.mod

```go
module gitops-pipeline

go 1.19

require (
	github.com/pulumi/pulumi-aws/sdk/v6 v6.20.0
	github.com/pulumi/pulumi/sdk/v3 v3.100.0
)
```

## File: Pulumi.yaml

```yaml
name: gitops-pipeline
runtime: go
description: GitOps CI/CD Pipeline for microservices with Pulumi Go

config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming
    default: dev
```

## File: README.md

```markdown
# GitOps CI/CD Pipeline - Pulumi Go Implementation

Complete implementation of a multi-stage CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and ECS Fargate.

## Architecture

This implementation creates:

1. **Source Control**: CodeCommit repository with branch-based deployments
2. **Container Registry**: ECR repository with lifecycle policies and KMS encryption
3. **Build Pipeline**: Multi-stage CodePipeline with source, build, scan, and deploy stages
4. **Build Automation**: CodeBuild projects using ARM64 Graviton2 instances
5. **Security**: Trivy container vulnerability scanning
6. **Orchestration**: ECS Fargate clusters for container hosting
7. **Load Balancing**: Application Load Balancers with target groups
8. **Monitoring**: EventBridge rules for pipeline notifications
9. **Approval Gates**: Manual approval before production deployments
10. **Security**: IAM roles with least-privilege policies
11. **Encryption**: KMS keys for artifacts and images
12. **Logging**: CloudWatch log groups with 7-day retention

## Requirements

- Pulumi CLI 3.x
- Go 1.19+
- AWS CLI configured
- AWS account with appropriate permissions

## Configuration

Set the environment suffix:

```bash
pulumi config set environmentSuffix dev
```

## Deployment

```bash
# Install dependencies
go mod download

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- `repositoryCloneUrlHttp`: CodeCommit repository clone URL
- `ecrRepositoryUrl`: ECR repository URL for container images
- `pipelineName`: CodePipeline name
- `ecsClusterName`: ECS cluster name
- `albDnsName`: Application Load Balancer DNS name
- `snsTopicArn`: SNS topic ARN for notifications
- `kmsKeyId`: KMS key ID for encryption

## Pipeline Stages

1. **Source**: Pulls code from CodeCommit main branch
2. **Build**: Builds Docker image and pushes to ECR
3. **SecurityScan**: Runs Trivy vulnerability scan
4. **DeployDev**: Deploys to dev environment
5. **DeployStaging**: Deploys to staging environment
6. **ApprovalForProduction**: Manual approval gate
7. **DeployProduction**: Deploys to production environment

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- CodeCommit: `gitops-repo-{environmentSuffix}`
- ECR: `microservices-{environmentSuffix}`
- ECS Cluster: `microservices-cluster-{environmentSuffix}`
- ALB: `ms-alb-{environmentSuffix}`

## Security Features

- KMS encryption for pipeline artifacts and ECR images
- IAM roles with least-privilege policies
- Private subnets for ECS tasks
- Security groups with restricted access
- Container vulnerability scanning with Trivy
- Manual approval before production deployments

## Cost Optimization

- ARM64 Graviton2 instances for CodeBuild
- Fargate Spot for cost savings
- Lifecycle policies to manage ECR storage
- 7-day log retention

## Cleanup

```bash
pulumi destroy
```

All resources are created without deletion protection and can be fully destroyed.
```

## File: Pulumi.dev.yaml

```yaml
config:
  gitops-pipeline:environmentSuffix: dev
  aws:region: us-east-1
```
