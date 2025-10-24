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
		// Add a key policy that explicitly allows CloudWatch Logs service to use the key in this region
		kmsKeyPolicy := pulumi.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "*"},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "AllowCloudWatchLogsUse",
					"Effect": "Allow",
					"Principal": {"Service": "logs.amazonaws.com"},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey",
						"kms:CreateGrant"
					],
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"kms:ViaService": "logs.%s.amazonaws.com"
						}
					}
				}
			]
		}`, region)

		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("transaction-kms-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String("KMS key for PCI-DSS compliant transaction data encryption"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(10),
			Policy:               kmsKeyPolicy,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-kms-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("PCI-DSS"),
			},
		})
		if err != nil {
			return err
		}

		_, err = kms.NewAlias(ctx, fmt.Sprintf("transaction-kms-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/transaction-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
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
				VpcId:               vpc.ID(),
				CidrBlock:           pulumi.String(fmt.Sprintf("10.0.%d.0/24", i)),
				AvailabilityZone:    pulumi.String(az),
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

		// Create NAT Gateways for private subnets
		var natGateways []*ec2.NatGateway
		for i, publicSubnet := range publicSubnets {
			eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%d-%s", i+1, environmentSuffix), &ec2.EipArgs{
				Domain: pulumi.String("vpc"),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("nat-eip-%d-%s", i+1, environmentSuffix)),
					"Environment": pulumi.String(environmentSuffix),
				},
			})
			if err != nil {
				return err
			}

			natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gateway-%d-%s", i+1, environmentSuffix), &ec2.NatGatewayArgs{
				SubnetId:     publicSubnet.ID(),
				AllocationId: eip.ID(),
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("nat-gateway-%d-%s", i+1, environmentSuffix)),
					"Environment": pulumi.String(environmentSuffix),
				},
			})
			if err != nil {
				return err
			}
			natGateways = append(natGateways, natGw)
		}

		// Create route tables for public subnets
		publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("public-rt-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Associate public subnets with public route table
		for i, subnet := range publicSubnets {
			_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d-%s", i+1, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: publicRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create route tables for private subnets
		for i, subnet := range privateSubnets {
			privateRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%d-%s", i+1, environmentSuffix), &ec2.RouteTableArgs{
				VpcId: vpc.ID(),
				Routes: ec2.RouteTableRouteArray{
					&ec2.RouteTableRouteArgs{
						CidrBlock:    pulumi.String("0.0.0.0/0"),
						NatGatewayId: natGateways[i].ID(),
					},
				},
				Tags: pulumi.StringMap{
					"Name":        pulumi.String(fmt.Sprintf("private-rt-%d-%s", i+1, environmentSuffix)),
					"Environment": pulumi.String(environmentSuffix),
				},
			})
			if err != nil {
				return err
			}

			_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-%d-%s", i+1, environmentSuffix), &ec2.RouteTableAssociationArgs{
				SubnetId:     subnet.ID(),
				RouteTableId: privateRouteTable.ID(),
			})
			if err != nil {
				return err
			}
		}

		// Create security groups
		albSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("alb-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("alb-sg-%s", environmentSuffix)),
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ALB"),
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
				"Name":        pulumi.String(fmt.Sprintf("alb-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		ecsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("ecs-sg-%s", environmentSuffix)),
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ECS tasks"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(8080),
					ToPort:         pulumi.Int(8080),
					SecurityGroups: pulumi.StringArray{albSg.ID()},
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

		rdsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("rds-sg-%s", environmentSuffix)),
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for RDS"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{ecsSg.ID()},
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

		redisSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("redis-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("redis-sg-%s", environmentSuffix)),
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for Redis"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(6379),
					ToPort:         pulumi.Int(6379),
					SecurityGroups: pulumi.StringArray{ecsSg.ID()},
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

		efsSg, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("efs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("efs-sg-%s", environmentSuffix)),
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for EFS"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(2049),
					ToPort:         pulumi.Int(2049),
					SecurityGroups: pulumi.StringArray{ecsSg.ID()},
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

		// Create Kinesis Stream
		kinesisStream, err := kinesis.NewStream(ctx, fmt.Sprintf("transaction-stream-%s", environmentSuffix), &kinesis.StreamArgs{
			Name:           pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
			ShardCount:     pulumi.Int(2),
			EncryptionType: pulumi.String("KMS"),
			KmsKeyId:       kmsKey.KeyId,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-stream-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create RDS subnet group
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("db-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("db-subnet-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create DB secret (make name unique per stack to avoid collisions with secrets pending deletion)
		dbSecretName := fmt.Sprintf("db-credentials-%s-%s", environmentSuffix, ctx.Stack())
		// Create DB secret
		dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("db-secret-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Name:        pulumi.String(dbSecretName),
			Description: pulumi.String("Database credentials for transaction processing"),
			KmsKeyId:    kmsKey.KeyId,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("db-secret-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Use a non-reserved DB username ("admin" is reserved by some engines)
		dbUsername := "dbuser"
		dbPassword := "ChangeMe123!"

		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("db-secret-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId:     dbSecret.ID(),
			SecretString: pulumi.String(fmt.Sprintf(`{"username":"%s","password":"%s"}`, dbUsername, dbPassword)),
		})
		if err != nil {
			return err
		}

		// Create RDS instance
		rdsInstance, err := rds.NewInstance(ctx, fmt.Sprintf("transaction-db-%s", environmentSuffix), &rds.InstanceArgs{
			Identifier:            pulumi.String(fmt.Sprintf("transaction-db-%s", environmentSuffix)),
			Engine:                pulumi.String("postgres"),
			EngineVersion:         pulumi.String("15.8"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			AllocatedStorage:      pulumi.Int(20),
			StorageType:           pulumi.String("gp2"),
			StorageEncrypted:      pulumi.Bool(true),
			KmsKeyId:              kmsKey.Arn,
			DbName:                pulumi.String("transactions"),
			Username:              pulumi.String(dbUsername),
			Password:              pulumi.String(dbPassword),
			VpcSecurityGroupIds:   pulumi.StringArray{rdsSg.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("mon:04:00-mon:05:00"),
			MultiAz:               pulumi.Bool(true),
			PubliclyAccessible:    pulumi.Bool(false),
			SkipFinalSnapshot:     pulumi.Bool(true),
			DeletionProtection:    pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-db-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Redis subnet group
		redisSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("redis-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("redis-subnet-group-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
		})
		if err != nil {
			return err
		}

		// Create Redis cluster
		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("transaction-cache-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("transaction-cache-%s", environmentSuffix)),
			Description:              pulumi.String("Redis cluster for transaction caching"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			ParameterGroupName:       pulumi.String("default.redis7"),
			Port:                     pulumi.Int(6379),
			SubnetGroupName:          redisSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{redisSg.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			KmsKeyId:                 kmsKey.KeyId,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-cache-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create EFS
		efsFileSystem, err := efs.NewFileSystem(ctx, fmt.Sprintf("transaction-efs-%s", environmentSuffix), &efs.FileSystemArgs{
			CreationToken:                pulumi.String(fmt.Sprintf("transaction-efs-%s", environmentSuffix)),
			Encrypted:                    pulumi.Bool(true),
			KmsKeyId:                     kmsKey.Arn,
			PerformanceMode:              pulumi.String("generalPurpose"),
			ThroughputMode:               pulumi.String("provisioned"),
			ProvisionedThroughputInMibps: pulumi.Float64(100),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-efs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create EFS mount targets
		for i, subnet := range privateSubnets {
			_, err := efs.NewMountTarget(ctx, fmt.Sprintf("efs-mount-%d-%s", i+1, environmentSuffix), &efs.MountTargetArgs{
				FileSystemId:   efsFileSystem.ID(),
				SubnetId:       subnet.ID(),
				SecurityGroups: pulumi.StringArray{efsSg.ID()},
			})
			if err != nil {
				return err
			}
		}

		// Create ECR repository
		ecrRepo, err := ecr.NewRepository(ctx, fmt.Sprintf("transaction-app-%s", environmentSuffix), &ecr.RepositoryArgs{
			Name:               pulumi.String(fmt.Sprintf("transaction-app-%s", environmentSuffix)),
			ImageTagMutability: pulumi.String("MUTABLE"),
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
				"Name":        pulumi.String(fmt.Sprintf("transaction-app-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
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

		// Create IAM role for ECS tasks
		ecsTaskRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-task-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						}
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-task-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create IAM role for ECS task execution
		ecsExecutionRole, err := iam.NewRole(ctx, fmt.Sprintf("ecs-execution-role-%s", environmentSuffix), &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-execution-role-%s", environmentSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Effect": "Allow",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						}
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-execution-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Attach AWS managed policy to execution role
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ecs-execution-role-policy-%s", environmentSuffix), &iam.RolePolicyAttachmentArgs{
			Role:      ecsExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// Create custom policy for task role
		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ecs-task-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Name: pulumi.String(fmt.Sprintf("ecs-task-policy-%s", environmentSuffix)),
			Role: ecsTaskRole.ID(),
			Policy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Effect": "Allow",
						"Action": [
							"kinesis:PutRecord",
							"kinesis:PutRecords",
							"kinesis:GetRecords",
							"kinesis:GetShardIterator",
							"kinesis:DescribeStream",
							"kinesis:ListStreams"
						],
						"Resource": "*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"secretsmanager:GetSecretValue"
						],
						"Resource": "*"
					},
					{
						"Effect": "Allow",
						"Action": [
							"kms:Decrypt",
							"kms:GenerateDataKey"
						],
						"Resource": "*"
					}
				]
			}`),
		})
		if err != nil {
			return err
		}

		// Create ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("transaction-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("transaction-task-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			TaskRoleArn:             ecsTaskRole.Arn,
			ExecutionRoleArn:        ecsExecutionRole.Arn,
			ContainerDefinitions: pulumi.String(fmt.Sprintf(`[
				{
					"name": "transaction-processor",
					"image": "%s.dkr.ecr.%s.amazonaws.com/transaction-app-%s:latest",
					"portMappings": [
						{
							"containerPort": 8080,
							"protocol": "tcp"
						}
					],
					"environment": [
						{
							"name": "DB_HOST",
							"value": "DB_ENDPOINT_PLACEHOLDER"
						},
						{
							"name": "REDIS_HOST", 
							"value": "REDIS_ENDPOINT_PLACEHOLDER"
						},
						{
							"name": "KINESIS_STREAM",
							"value": "transaction-stream-%s"
						}
					],
					"logConfiguration": {
						"logDriver": "awslogs",
						"options": {
							"awslogs-group": "/ecs/transaction-processor-%s",
							"awslogs-region": "%s",
							"awslogs-stream-prefix": "ecs"
						}
					}
				}
			]`, "123456789012", region, environmentSuffix, environmentSuffix, environmentSuffix, region)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-task-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ALB
		alb, err := lb.NewLoadBalancer(ctx, fmt.Sprintf("transaction-alb-%s", environmentSuffix), &lb.LoadBalancerArgs{
			Name:             pulumi.String(fmt.Sprintf("transaction-alb-%s", environmentSuffix)),
			LoadBalancerType: pulumi.String("application"),
			Subnets:          pulumi.StringArray{publicSubnets[0].ID(), publicSubnets[1].ID()},
			SecurityGroups:   pulumi.StringArray{albSg.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-alb-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create target group
		targetGroup, err := lb.NewTargetGroup(ctx, fmt.Sprintf("transaction-tg-%s", environmentSuffix), &lb.TargetGroupArgs{
			Name:       pulumi.String(fmt.Sprintf("transaction-tg-%s", environmentSuffix)),
			Port:       pulumi.Int(8080),
			Protocol:   pulumi.String("HTTP"),
			VpcId:      vpc.ID(),
			TargetType: pulumi.String("ip"),
			HealthCheck: &lb.TargetGroupHealthCheckArgs{
				Enabled:            pulumi.Bool(true),
				HealthyThreshold:   pulumi.Int(2),
				Interval:           pulumi.Int(30),
				Matcher:            pulumi.String("200"),
				Path:               pulumi.String("/health"),
				Port:               pulumi.String("traffic-port"),
				Protocol:           pulumi.String("HTTP"),
				Timeout:            pulumi.Int(5),
				UnhealthyThreshold: pulumi.Int(2),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-tg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create ALB listener (specify port so listener is created and associates TG with ALB)
		_, err = lb.NewListener(ctx, fmt.Sprintf("transaction-listener-%s", environmentSuffix), &lb.ListenerArgs{
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

		// Create ECS service
		_, err = ecs.NewService(ctx, fmt.Sprintf("transaction-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("transaction-service-%s", environmentSuffix)),
			Cluster:        ecsCluster.ID(),
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(2),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets:        pulumi.StringArray{privateSubnets[0].ID(), privateSubnets[1].ID()},
				SecurityGroups: pulumi.StringArray{ecsSg.ID()},
			},
			LoadBalancers: ecs.ServiceLoadBalancerArray{
				&ecs.ServiceLoadBalancerArgs{
					TargetGroupArn: targetGroup.Arn,
					ContainerName:  pulumi.String("transaction-processor"),
					ContainerPort:  pulumi.Int(8080),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("transaction-service-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create API Gateway
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

		// Create CloudWatch Log Group
		_, err = cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-log-group-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/transaction-processor-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(14),
			KmsKeyId:        kmsKey.Arn,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-log-group-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create CloudWatch Alarms
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("kinesis-iterator-age-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("kinesis-iterator-age-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("IncomingRecords"),
			Namespace:          pulumi.String("AWS/Kinesis"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Sum"),
			Threshold:          pulumi.Float64(1000),
			AlarmDescription:   pulumi.String("Alert when Kinesis has high record count"),
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
			Name:               pulumi.String(fmt.Sprintf("rds-cpu-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80),
			AlarmDescription:   pulumi.String("Alert when RDS CPU is high"),
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
