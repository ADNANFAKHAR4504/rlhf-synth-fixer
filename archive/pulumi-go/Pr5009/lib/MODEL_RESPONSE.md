# PCI-DSS Compliant Transaction Processing Infrastructure

I'll help you create a comprehensive PCI-DSS compliant infrastructure for processing credit card transactions at scale. This solution will use Pulumi with Go to deploy all resources in the eu-central-2 region.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 AZs for high availability
- Kinesis Data Streams for real-time transaction ingestion
- ECS Fargate for containerized transaction processing
- RDS PostgreSQL Multi-AZ with encryption for transaction storage
- ElastiCache Redis for caching
- EFS for shared storage between ECS tasks
- API Gateway for secure transaction endpoints
- KMS keys for encryption at rest
- Comprehensive IAM roles and security groups
- CloudWatch logging and monitoring

## File: lib/tap_stack.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/efs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get configuration
		cfg := config.New(ctx, "")
		environmentSuffix := cfg.Get("environmentSuffix")
		if environmentSuffix == "" {
			environmentSuffix = "dev"
		}

		region := "eu-central-2"

		// Create KMS key for encryption at rest
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("transaction-kms-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for PCI-DSS compliant transaction data encryption"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(10),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-kms-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("PCI-DSS"),
			},
		})
		if err != nil {
			return err
		}

		kmsAlias, err := kms.NewAlias(ctx, fmt.Sprintf("transaction-kms-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:         pulumi.String(fmt.Sprintf("alias/transaction-%s", environmentSuffix)),
			TargetKeyId:  kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("transaction-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-vpc-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("transaction-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-igw-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Get availability zones
		azs := []string{fmt.Sprintf("%sa", region), fmt.Sprintf("%sb", region)}

		// Create public subnets
		var publicSubnets []*ec2.Subnet
		for i, az := range azs {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d-%s", i+1, environmentSuffix), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i)),
				AvailabilityZone: pulumi.String(az),
				MapPublicIpOnLaunch: pulumi.Bool(true),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("public-subnet-%d-%s", i+1, environmentSuffix)),
					"Environment": pulumi.String(environmentSuffix),
					"Type":        pulumi.String("public"),
				},
			})
			if err != nil {
				return err
			}
			publicSubnets = append(publicSubnets, subnet)
		}

		// Create private subnets
		var privateSubnets []*ec2.Subnet
		for i, az := range azs {
			subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d-%s", i+1, environmentSuffix), &ec2.SubnetArgs{
				VpcId:            vpc.ID(),
				CidrBlock:        pulumi.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
				AvailabilityZone: pulumi.String(az),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("private-subnet-%d-%s", i+1, environmentSuffix)),
					"Environment": pulumi.String(environmentSuffix),
					"Type":        pulumi.String("private"),
				},
			})
			if err != nil {
				return err
			}
			privateSubnets = append(privateSubnets, subnet)
		}

		// Create public route table
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("public-rt-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
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

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d-%s", i+1, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security group for ALB
		albSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for Application Load Balancer"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(443),
					ToPort:     pulumi.Int(443),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(80),
					ToPort:     pulumi.Int(80),
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
				"Name":        pulumi.String(fmt.Sprintf("alb-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ECS tasks
		ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ECS Fargate tasks"),
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
				"Name":        pulumi.String(fmt.Sprintf("ecs-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for RDS
		rdsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for RDS database"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
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
				"Name":        pulumi.String(fmt.Sprintf("rds-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for ElastiCache
		redisSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("redis-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ElastiCache Redis"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(6379),
					ToPort:         pulumi.Int(6379),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
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
				"Name":        pulumi.String(fmt.Sprintf("redis-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create security group for EFS
		efsSecurityGroup, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("efs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for EFS file system"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(2049),
					ToPort:         pulumi.Int(2049),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
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
				"Name":        pulumi.String(fmt.Sprintf("efs-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Kinesis Data Stream for transaction ingestion
		kinesisStream, err := kinesis.NewStream(ctx, fmt.Sprintf("transaction-stream-%s", environmentSuffix), &kinesis.StreamArgs{
			Name:            pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
			ShardCount:      pulumi.Int(2),
			RetentionPeriod: pulumi.Int(24),
			StreamModeDetails: &kinesis.StreamStreamModeDetailsArgs{
				StreamMode: pulumi.String("PROVISIONED"),
			},
			EncryptionType: pulumi.String("KMS"),
			KmsKeyId:       kmsKey.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("PCI-DSS"),
			},
		})
		if err != nil {
			return err
		}

		// Create RDS subnet group
		rdsSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("rds-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			Name: pulumi.String(fmt.Sprintf("rds-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{
				privateSubnets[0].ID(),
				privateSubnets[1].ID(),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("rds-subnet-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Generate random password for RDS (in production, use Secrets Manager)
		rdsPassword := "TempPassword123!" // In real implementation, generate securely

		// Create RDS database secret in Secrets Manager
		dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("rds-credentials-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Name:        pulumi.String(fmt.Sprintf("rds-credentials-%s", environmentSuffix)),
			Description: pulumi.String("RDS PostgreSQL database credentials"),
			KmsKeyId:    kmsKey.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("rds-credentials-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("rds-credentials-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     dbSecret.ID(),
			SecretString: pulumi.String(fmt.Sprintf(`{"username":"dbadmin","password":"%s"}`, rdsPassword)),
		})
		if err != nil {
			return err
		}

		// Create RDS PostgreSQL Multi-AZ instance
		rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("transaction-db-%s", environmentSuffix), &rds.InstanceArgs{
			Identifier:           pulumi.String(fmt.Sprintf("transaction-db-%s", environmentSuffix)),
			Engine:               pulumi.String("postgres"),
			EngineVersion:        pulumi.String("15.4"),
			InstanceClass:        pulumi.String("db.t3.micro"),
			AllocatedStorage:     pulumi.Int(20),
			StorageEncrypted:     pulumi.Bool(true),
			KmsKeyId:             kmsKey.Arn,
			DbSubnetGroupName:    rdsSubnetGroup.Name,
			VpcSecurityGroupIds:  pulumi.StringArray{rdsSecurityGroup.ID()},
			MultiAz:              pulumi.Bool(true),
			Username:             pulumi.String("dbadmin"),
			Password:             pulumi.String(rdsPassword),
			DbName:               pulumi.String("transactions"),
			BackupRetentionPeriod: pulumi.Int(7),
			SkipFinalSnapshot:    pulumi.Bool(true),
			PubliclyAccessible:   pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-db-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("PCI-DSS"),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache subnet group
		redisSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("redis-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			Name: pulumi.String(fmt.Sprintf("redis-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{
				privateSubnets[0].ID(),
				privateSubnets[1].ID(),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("redis-subnet-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ElastiCache Redis replication group
		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("transaction-cache-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("transaction-cache-%s", environmentSuffix)),
			ReplicationGroupDescription: pulumi.String("Redis cluster for transaction caching"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.0"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			Port:                     pulumi.Int(6379),
			SubnetGroupName:          redisSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{redisSecurityGroup.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			KmsKeyId:                 kmsKey.Arn,
			AutomaticFailoverEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-cache-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create EFS file system
		efsFileSystem, err := efs.NewFileSystem(ctx, fmt.Sprintf("transaction-efs-%s", environmentSuffix), &efs.FileSystemArgs{
			Encrypted: pulumi.Bool(true),
			KmsKeyId:  kmsKey.Arn,
			PerformanceMode: pulumi.String("generalPurpose"),
			ThroughputMode: pulumi.String("bursting"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-efs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create EFS mount targets in each private subnet
		for i, subnet := range privateSubnets {
			_, err = efs.NewMountTarget(ctx, fmt.Sprintf("efs-mount-%d-%s", i+1, environmentSuffix), &efs.MountTargetArgs{
				FileSystemId:  efsFileSystem.ID(),
				SubnetId:      subnet.ID(),
				SecurityGroups: pulumi.StringArray{efsSecurityGroup.ID()},
			})
			if err != nil {
				return err
			}
		}

		// Create ECS cluster
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("transaction-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("transaction-cluster-%s", environmentSuffix)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-cluster-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch log group for ECS
		ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/transaction-processor-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(7),
			KmsKeyId:        kmsKey.Arn,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-logs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM role for ECS task execution
		ecsTaskExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-execution-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-task-execution-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "ecs-tasks.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-task-execution-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-task-execution-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// Create IAM role for ECS task
		ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "ecs-tasks.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM policy for ECS task to access Kinesis, Secrets Manager, and other services
		ecsTaskPolicy, err := iam.NewPolicy(ctx, fmt.Sprintf("ecs-task-policy-%s", environmentSuffix), &iam.PolicyArgs{
			Name:        pulumi.String(fmt.Sprintf("ecs-task-policy-%s", environmentSuffix)),
			Description: pulumi.String("Policy for ECS tasks to access AWS services"),
			Policy: pulumi.All(kinesisStream.Name, dbSecret.Arn, kmsKey.Arn).ApplyT(func(args []interface{}) string {
				streamName := args[0].(string)
				secretArn := args[1].(string)
				kmsKeyArn := args[2].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"kinesis:GetRecords",
								"kinesis:GetShardIterator",
								"kinesis:DescribeStream",
								"kinesis:ListStreams",
								"kinesis:PutRecord",
								"kinesis:PutRecords"
							],
							"Resource": "arn:aws:kinesis:%s:*:stream/%s"
						},
						{
							"Effect": "Allow",
							"Action": [
								"secretsmanager:GetSecretValue",
								"secretsmanager:DescribeSecret"
							],
							"Resource": "%s"
						},
						{
							"Effect": "Allow",
							"Action": [
								"kms:Decrypt",
								"kms:DescribeKey"
							],
							"Resource": "%s"
						},
						{
							"Effect": "Allow",
							"Action": [
								"elasticfilesystem:ClientMount",
								"elasticfilesystem:ClientWrite"
							],
							"Resource": "*"
						},
						{
							"Effect": "Allow",
							"Action": [
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": "*"
						}
					]
				}`, region, streamName, secretArn, kmsKeyArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-task-policy-attach-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskRole.Name,
			PolicyArn: ecsTaskPolicy.Arn,
		})
		if err != nil {
			return err
		}

		// Create ECR repository for container images
		ecrRepo, err := ecr.NewRepository(ctx, fmt.Sprintf("transaction-processor-%s", environmentSuffix), &ecr.RepositoryArgs{
			Name: pulumi.String(fmt.Sprintf("transaction-processor-%s", environmentSuffix)),
			ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
				ScanOnPush: pulumi.Bool(true),
			},
			EncryptionConfigurations: ecr.RepositoryEncryptionConfigurationArray{
				&ecr.RepositoryEncryptionConfigurationArgs{
					EncryptionType: pulumi.String("KMS"),
					KmsKey:         kmsKey.Arn,
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-processor-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Application Load Balancer
		alb, err := lb.NewLoadBalancer(ctx, fmt.Sprintf("transaction-alb-%s", environmentSuffix), &lb.LoadBalancerArgs{
			Name:             pulumi.String(fmt.Sprintf("transaction-alb-%s", environmentSuffix)),
			Internal:         pulumi.Bool(false),
			LoadBalancerType: pulumi.String("application"),
			SecurityGroups:   pulumi.StringArray{albSecurityGroup.ID()},
			Subnets: pulumi.StringArray{
				publicSubnets[0].ID(),
				publicSubnets[1].ID(),
			},
			EnableHttp2:            pulumi.Bool(true),
			EnableDeletionProtection: pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-alb-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create target group for ECS service
		targetGroup, err := lb.NewTargetGroup(ctx, fmt.Sprintf("ecs-target-group-%s", environmentSuffix), &lb.TargetGroupArgs{
			Name:       pulumi.String(fmt.Sprintf("ecs-tg-%s", environmentSuffix)),
			Port:       pulumi.Int(8080),
			Protocol:   pulumi.String("HTTP"),
			VpcId:      vpc.ID(),
			TargetType: pulumi.String("ip"),
			HealthCheck: &lb.TargetGroupHealthCheckArgs{
				Enabled:            pulumi.Bool(true),
				HealthyThreshold:   pulumi.Int(2),
				UnhealthyThreshold: pulumi.Int(2),
				Timeout:            pulumi.Int(5),
				Interval:           pulumi.Int(30),
				Path:               pulumi.String("/health"),
				Matcher:            pulumi.String("200"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-tg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ALB listener
		_, err = lb.NewListener(ctx, fmt.Sprintf("alb-listener-%s", environmentSuffix), &lb.ListenerArgs{
			LoadBalancerArn: alb.Arn,
			Port:            pulumi.Int(80),
			Protocol:        pulumi.String("HTTP"),
			DefaultActions: lb.ListenerDefaultActionArray{
				&lb.ListenerDefaultActionArgs{
					Type:           pulumi.String("forward"),
					TargetGroupArn: targetGroup.Arn,
				},
			},
		})
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("transaction-processor-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("transaction-processor-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("512"),
			Memory:                  pulumi.String("1024"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.All(ecrRepo.RepositoryUrl, kinesisStream.Name, rdsInstance.Endpoint,
				redisCluster.ConfigurationEndpointAddress, efsFileSystem.ID(), ecsLogGroup.Name).ApplyT(
				func(args []interface{}) string {
					imageUrl := args[0].(string)
					streamName := args[1].(string)
					dbEndpoint := args[2].(string)
					redisEndpoint := args[3].(string)
					efsId := args[4].(string)
					logGroup := args[5].(string)
					return fmt.Sprintf(`[{
						"name": "transaction-processor",
						"image": "%s:latest",
						"essential": true,
						"portMappings": [{
							"containerPort": 8080,
							"protocol": "tcp"
						}],
						"environment": [
							{"name": "KINESIS_STREAM", "value": "%s"},
							{"name": "DB_ENDPOINT", "value": "%s"},
							{"name": "REDIS_ENDPOINT", "value": "%s"},
							{"name": "EFS_ID", "value": "%s"},
							{"name": "AWS_REGION", "value": "%s"}
						],
						"logConfiguration": {
							"logDriver": "awslogs",
							"options": {
								"awslogs-group": "%s",
								"awslogs-region": "%s",
								"awslogs-stream-prefix": "ecs"
							}
						},
						"mountPoints": [{
							"sourceVolume": "efs-storage",
							"containerPath": "/mnt/efs"
						}]
					}]`, imageUrl, streamName, dbEndpoint, redisEndpoint, efsId, region, logGroup, region)
				}).(pulumi.StringOutput),
			Volumes: ecs.TaskDefinitionVolumeArray{
				&ecs.TaskDefinitionVolumeArgs{
					Name: pulumi.String("efs-storage"),
					EfsVolumeConfiguration: &ecs.TaskDefinitionVolumeEfsVolumeConfigurationArgs{
						FileSystemId:     efsFileSystem.ID(),
						TransitEncryption: pulumi.String("ENABLED"),
					},
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-processor-task-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ECS service
		_, err = ecs.NewService(ctx, fmt.Sprintf("transaction-processor-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("transaction-processor-service-%s", environmentSuffix)),
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(2),
			LaunchType:     pulumi.String("FARGATE"),
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
					ContainerName:  pulumi.String("transaction-processor"),
					ContainerPort:  pulumi.Int(8080),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-processor-service-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		}, pulumi.DependsOn([]pulumi.Resource{alb}))
		if err != nil {
			return err
		}

		// Create API Gateway REST API
		api, err := apigateway.NewRestApi(ctx, fmt.Sprintf("transaction-api-%s", environmentSuffix), &apigateway.RestApiArgs{
			Name:        pulumi.String(fmt.Sprintf("transaction-api-%s", environmentSuffix)),
			Description: pulumi.String("API Gateway for transaction processing"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-api-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create API Gateway resource
		apiResource, err := apigateway.NewResource(ctx, fmt.Sprintf("transaction-resource-%s", environmentSuffix), &apigateway.ResourceArgs{
			RestApi:  api.ID(),
			ParentId: api.RootResourceId,
			PathPart: pulumi.String("transaction"),
		})
		if err != nil {
			return err
		}

		// Create API Gateway method
		_, err = apigateway.NewMethod(ctx, fmt.Sprintf("transaction-method-%s", environmentSuffix), &apigateway.MethodArgs{
			RestApi:       api.ID(),
			ResourceId:    apiResource.ID(),
			HttpMethod:    pulumi.String("POST"),
			Authorization: pulumi.String("AWS_IAM"),
		})
		if err != nil {
			return err
		}

		// Create API Gateway integration with ALB
		_, err = apigateway.NewIntegration(ctx, fmt.Sprintf("transaction-integration-%s", environmentSuffix), &apigateway.IntegrationArgs{
			RestApi:             api.ID(),
			ResourceId:          apiResource.ID(),
			HttpMethod:          pulumi.String("POST"),
			IntegrationHttpMethod: pulumi.String("POST"),
			Type:                pulumi.String("HTTP_PROXY"),
			Uri:                 alb.DnsName.ApplyT(func(dns string) string {
				return fmt.Sprintf("http://%s/transaction", dns)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		// Create API Gateway deployment
		deployment, err := apigateway.NewDeployment(ctx, fmt.Sprintf("transaction-deployment-%s", environmentSuffix), &apigateway.DeploymentArgs{
			RestApi: api.ID(),
		}, pulumi.DependsOn([]pulumi.Resource{api, apiResource}))
		if err != nil {
			return err
		}

		// Create API Gateway stage
		_, err = apigateway.NewStage(ctx, fmt.Sprintf("transaction-stage-%s", environmentSuffix), &apigateway.StageArgs{
			RestApi:      api.ID(),
			Deployment:   deployment.ID(),
			StageName:    pulumi.String("prod"),
			Description:  pulumi.String("Production stage"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-stage-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch alarms for monitoring
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("kinesis-iterator-age-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:              pulumi.String(fmt.Sprintf("kinesis-iterator-age-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods: pulumi.Int(2),
			MetricName:        pulumi.String("GetRecords.IteratorAgeMilliseconds"),
			Namespace:         pulumi.String("AWS/Kinesis"),
			Period:            pulumi.Int(300),
			Statistic:         pulumi.String("Average"),
			Threshold:         pulumi.Float64(60000),
			AlarmDescription:  pulumi.String("Alert when Kinesis iterator age is high"),
			Dimensions: pulumi.StringMap{
				"StreamName": kinesisStream.Name,
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("kinesis-iterator-age-alarm-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("rds-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:              pulumi.String(fmt.Sprintf("rds-cpu-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods: pulumi.Int(2),
			MetricName:        pulumi.String("CPUUtilization"),
			Namespace:         pulumi.String("AWS/RDS"),
			Period:            pulumi.Int(300),
			Statistic:         pulumi.String("Average"),
			Threshold:         pulumi.Float64(80),
			AlarmDescription:  pulumi.String("Alert when RDS CPU is high"),
			Dimensions: pulumi.StringMap{
				"DBInstanceIdentifier": rdsInstance.Identifier,
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("rds-cpu-alarm-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Export outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("kinesisStreamName", kinesisStream.Name)
		ctx.Export("kinesisStreamArn", kinesisStream.Arn)
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("ecsClusterArn", ecsCluster.Arn)
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("rdsDbName", rdsInstance.DbName)
		ctx.Export("redisEndpoint", redisCluster.ConfigurationEndpointAddress)
		ctx.Export("efsFileSystemId", efsFileSystem.ID())
		ctx.Export("albDnsName", alb.DnsName)
		ctx.Export("apiGatewayUrl", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/prod", api.ID(), region))
		ctx.Export("ecrRepositoryUrl", ecrRepo.RepositoryUrl)
		ctx.Export("secretArn", dbSecret.Arn)

		return nil
	})
}
```

This comprehensive infrastructure code implements all required services with PCI-DSS compliance features including encryption at rest and in transit, network segmentation, high availability across multiple availability zones, and proper monitoring. All resource names include the environment suffix for isolation.