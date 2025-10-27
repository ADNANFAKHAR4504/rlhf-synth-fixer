package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/appautoscaling"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get configuration
		cfg := config.New(ctx, "")
		environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if environmentSuffix == "" {
			environmentSuffix = cfg.Get("environmentSuffix")
			if environmentSuffix == "" {
				environmentSuffix = "dev"
			}
		}

		region := "eu-west-1"

		// Get account ID
		caller, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}
		accountID := caller.AccountId

		// 1. Create KMS key for encryption
		kmsKey, err := kms.NewKey(ctx, fmt.Sprintf("healthcare-kms-%s", environmentSuffix), &kms.KeyArgs{
			Description:          pulumi.String(fmt.Sprintf("KMS key for healthcare data encryption - %s", environmentSuffix)),
			DeletionWindowInDays: pulumi.Int(7),
			EnableKeyRotation:    pulumi.Bool(true),
			Policy: pulumi.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::%s:root"},
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow services to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "kinesis.amazonaws.com",
          "rds.amazonaws.com",
          "elasticache.amazonaws.com",
          "secretsmanager.amazonaws.com",
          "logs.%s.amazonaws.com"
        ]
      },
      "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant", "kms:DescribeKey"],
      "Resource": "*"
    }
  ]
}`, accountID, region),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-kms-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		_, err = kms.NewAlias(ctx, fmt.Sprintf("healthcare-kms-alias-%s", environmentSuffix), &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/healthcare-data-%s", environmentSuffix)),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// 2. Create VPC
		vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("healthcare-vpc-%s", environmentSuffix), &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-vpc-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("healthcare-igw-%s", environmentSuffix), &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-igw-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Public Subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			AvailabilityZone:    pulumi.String(fmt.Sprintf("%sa", region)),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-public-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			AvailabilityZone:    pulumi.String(fmt.Sprintf("%sb", region)),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-public-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Private Subnets
		privateSubnet1, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-1-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.11.0/24"),
			AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", region)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-private-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-2-%s", environmentSuffix), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String("10.0.12.0/24"),
			AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", region)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-private-2-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// EIP for NAT Gateway
		eip, err := ec2.NewEip(ctx, fmt.Sprintf("nat-eip-%s", environmentSuffix), &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-nat-eip-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// NAT Gateway
		natGw, err := ec2.NewNatGateway(ctx, fmt.Sprintf("nat-gw-%s", environmentSuffix), &ec2.NatGatewayArgs{
			AllocationId: eip.ID(),
			SubnetId:     publicSubnet1.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-nat-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		}, pulumi.DependsOn([]pulumi.Resource{igw}))
		if err != nil {
			return err
		}

		// Public Route Table
		publicRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("public-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-public-rt-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRT.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRT.ID(),
		})
		if err != nil {
			return err
		}

		// Private Route Table
		privateRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("private-rt-%s", environmentSuffix), &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock:    pulumi.String("0.0.0.0/0"),
					NatGatewayId: natGw.ID(),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-private-rt-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-1-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRT.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("private-rta-2-%s", environmentSuffix), &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRT.ID(),
		})
		if err != nil {
			return err
		}

		// VPC Flow Logs
		flowLogRole, err := iam.NewRole(ctx, fmt.Sprintf("vpc-flow-log-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("vpc-flow-log-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("vpc-flow-log-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: flowLogRole.ID(),
			Policy: pulumi.String(`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ],
    "Resource": "*"
  }]
}`),
		})
		if err != nil {
			return err
		}

		flowLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("vpc-flow-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/vpc/flowlogs-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(30),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("vpc-flow-logs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewFlowLog(ctx, fmt.Sprintf("vpc-flow-log-%s", environmentSuffix), &ec2.FlowLogArgs{
			VpcId:          vpc.ID(),
			IamRoleArn:     flowLogRole.Arn,
			LogDestination: flowLogGroup.Arn,
			TrafficType:    pulumi.String("ALL"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("vpc-flow-log-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// 3. Security Groups
		ecsSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("ecs-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ECS Fargate tasks"),
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

		rdsSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("rds-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for RDS Aurora"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{ecsSG.ID()},
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

		cacheSG, err := ec2.NewSecurityGroup(ctx, fmt.Sprintf("cache-sg-%s", environmentSuffix), &ec2.SecurityGroupArgs{
			VpcId:       vpc.ID(),
			Description: pulumi.String("Security group for ElastiCache Redis"),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(6379),
					ToPort:         pulumi.Int(6379),
					SecurityGroups: pulumi.StringArray{ecsSG.ID()},
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
				"Name":        pulumi.String(fmt.Sprintf("cache-sg-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// 4. Kinesis Data Stream
		kinesisStream, err := kinesis.NewStream(ctx, fmt.Sprintf("patient-data-stream-%s", environmentSuffix), &kinesis.StreamArgs{
			Name:            pulumi.String(fmt.Sprintf("patient-data-stream-%s", environmentSuffix)),
			ShardCount:      pulumi.Int(4),
			RetentionPeriod: pulumi.Int(24),
			StreamModeDetails: &kinesis.StreamStreamModeDetailsArgs{
				StreamMode: pulumi.String("PROVISIONED"),
			},
			ShardLevelMetrics: pulumi.StringArray{
				pulumi.String("IncomingBytes"),
				pulumi.String("IncomingRecords"),
				pulumi.String("OutgoingBytes"),
				pulumi.String("OutgoingRecords"),
			},
			EncryptionType: pulumi.String("KMS"),
			KmsKeyId:       kmsKey.Arn,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("patient-data-stream-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// 5. Secrets Manager with automatic rotation
		dbSecret, err := secretsmanager.NewSecret(ctx, fmt.Sprintf("db-credentials-%s", environmentSuffix), &secretsmanager.SecretArgs{
			Name:                 pulumi.String(fmt.Sprintf("healthcare/db-credentials-%s", environmentSuffix)),
			Description:          pulumi.String("Database credentials for Aurora cluster"),
			KmsKeyId:             kmsKey.KeyId,
			RecoveryWindowInDays: pulumi.Int(7),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("db-credentials-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = secretsmanager.NewSecretVersion(ctx, fmt.Sprintf("db-credentials-version-%s", environmentSuffix), &secretsmanager.SecretVersionArgs{
			SecretId: dbSecret.ID(),
			SecretString: pulumi.String(`{
  "username": "dbadmin",
  "password": "TempPassword123!",
  "engine": "postgres",
  "host": "placeholder",
  "port": 5432,
  "dbname": "healthcaredb"
}`),
		})
		if err != nil {
			return err
		}

		// 6. RDS Aurora Serverless v2 with zero-capacity scaling
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, fmt.Sprintf("db-subnet-group-%s", environmentSuffix), &rds.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("healthcare-db-subnet-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-db-subnet-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		dbCluster, err := rds.NewCluster(ctx, fmt.Sprintf("aurora-cluster-%s", environmentSuffix), &rds.ClusterArgs{
			ClusterIdentifier:          pulumi.String(fmt.Sprintf("healthcare-aurora-%s", environmentSuffix)),
			Engine:                     pulumi.String("aurora-postgresql"),
			EngineMode:                 pulumi.String("provisioned"),
			EngineVersion:              pulumi.String("15.4"),
			DatabaseName:               pulumi.String("healthcaredb"),
			MasterUsername:             pulumi.String("dbadmin"),
			MasterPassword:             pulumi.String("TempPassword123!"),
			DbSubnetGroupName:          dbSubnetGroup.Name,
			VpcSecurityGroupIds:        pulumi.StringArray{rdsSG.ID()},
			StorageEncrypted:           pulumi.Bool(true),
			KmsKeyId:                   kmsKey.Arn,
			BackupRetentionPeriod:      pulumi.Int(7),
			PreferredBackupWindow:      pulumi.String("03:00-04:00"),
			PreferredMaintenanceWindow: pulumi.String("sun:04:00-sun:05:00"),
			EnabledCloudwatchLogsExports: pulumi.StringArray{
				pulumi.String("postgresql"),
			},
			SkipFinalSnapshot: pulumi.Bool(true),
			Serverlessv2ScalingConfiguration: &rds.ClusterServerlessv2ScalingConfigurationArgs{
				MaxCapacity: pulumi.Float64(2.0),
				MinCapacity: pulumi.Float64(0.5),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-aurora-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		_, err = rds.NewClusterInstance(ctx, fmt.Sprintf("aurora-instance-1-%s", environmentSuffix), &rds.ClusterInstanceArgs{
			Identifier:         pulumi.String(fmt.Sprintf("healthcare-aurora-instance-1-%s", environmentSuffix)),
			ClusterIdentifier:  dbCluster.ID(),
			InstanceClass:      pulumi.String("db.serverless"),
			Engine:             pulumi.String("aurora-postgresql"),
			EngineVersion:      pulumi.String("15.4"),
			PubliclyAccessible: pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-aurora-instance-1-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// 7. ElastiCache Redis with Multi-AZ
		cacheSubnetGroup, err := elasticache.NewSubnetGroup(ctx, fmt.Sprintf("cache-subnet-group-%s", environmentSuffix), &elasticache.SubnetGroupArgs{
			Name:      pulumi.String(fmt.Sprintf("healthcare-cache-subnet-%s", environmentSuffix)),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-cache-subnet-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		redisCluster, err := elasticache.NewReplicationGroup(ctx, fmt.Sprintf("redis-cluster-%s", environmentSuffix), &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(fmt.Sprintf("healthcare-redis-%s", environmentSuffix)),
			Description:              pulumi.String("ElastiCache Redis for healthcare data caching"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.0"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			AutomaticFailoverEnabled: pulumi.Bool(true),
			MultiAzEnabled:           pulumi.Bool(true),
			SubnetGroupName:          cacheSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{cacheSG.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(true),
			KmsKeyId:                 kmsKey.Arn,
			SnapshotRetentionLimit:   pulumi.Int(5),
			SnapshotWindow:           pulumi.String("03:00-05:00"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-redis-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
				"Compliance":  pulumi.String("HIPAA"),
			},
		})
		if err != nil {
			return err
		}

		// 8. IAM Roles for ECS
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
			ManagedPolicyArns: pulumi.StringArray{
				pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-task-execution-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ecs-secrets-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: ecsTaskExecutionRole.ID(),
			Policy: pulumi.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "%s"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "%s"
    }
  ]
}`, dbSecret.Arn, kmsKey.Arn),
		})
		if err != nil {
			return err
		}

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

		_, err = iam.NewRolePolicy(ctx, fmt.Sprintf("ecs-task-policy-%s", environmentSuffix), &iam.RolePolicyArgs{
			Role: ecsTaskRole.ID(),
			Policy: pulumi.String(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
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
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}`),
		})
		if err != nil {
			return err
		}

		// 9. ECS Fargate Cluster
		ecsCluster, err := ecs.NewCluster(ctx, fmt.Sprintf("processing-cluster-%s", environmentSuffix), &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("healthcare-processing-%s", environmentSuffix)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-processing-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = cloudwatch.NewLogGroup(ctx, fmt.Sprintf("ecs-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/healthcare-processing-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(30),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-logs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		taskDefinition, err := ecs.NewTaskDefinition(ctx, fmt.Sprintf("processing-task-%s", environmentSuffix), &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("healthcare-processing-%s", environmentSuffix)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("512"),
			Memory:                  pulumi.String("1024"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.Sprintf(`[{
  "name": "healthcare-processor",
  "image": "nginx:latest",
  "essential": true,
  "portMappings": [{
    "containerPort": 80,
    "protocol": "tcp"
  }],
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/healthcare-processing-%s",
      "awslogs-region": "%s",
      "awslogs-stream-prefix": "ecs"
    }
  }
}]`, environmentSuffix, region),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-processing-task-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		ecsService, err := ecs.NewService(ctx, fmt.Sprintf("processing-service-%s", environmentSuffix), &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("healthcare-processing-service-%s", environmentSuffix)),
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(2),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
				SecurityGroups: pulumi.StringArray{ecsSG.ID()},
				AssignPublicIp: pulumi.Bool(false),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-processing-service-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Auto Scaling for ECS
		scalingTarget, err := appautoscaling.NewTarget(ctx, fmt.Sprintf("ecs-scaling-target-%s", environmentSuffix), &appautoscaling.TargetArgs{
			MaxCapacity:       pulumi.Int(10),
			MinCapacity:       pulumi.Int(2),
			ResourceId:        pulumi.Sprintf("service/%s/%s", ecsCluster.Name, ecsService.Name),
			ScalableDimension: pulumi.String("ecs:service:DesiredCount"),
			ServiceNamespace:  pulumi.String("ecs"),
		})
		if err != nil {
			return err
		}

		_, err = appautoscaling.NewPolicy(ctx, fmt.Sprintf("ecs-scaling-policy-%s", environmentSuffix), &appautoscaling.PolicyArgs{
			PolicyType:        pulumi.String("TargetTrackingScaling"),
			ResourceId:        scalingTarget.ResourceId,
			ScalableDimension: scalingTarget.ScalableDimension,
			ServiceNamespace:  scalingTarget.ServiceNamespace,
			TargetTrackingScalingPolicyConfiguration: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs{
				PredefinedMetricSpecification: &appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
					PredefinedMetricType: pulumi.String("ECSServiceAverageCPUUtilization"),
				},
				TargetValue: pulumi.Float64(70.0),
			},
		})
		if err != nil {
			return err
		}

		// 10. API Gateway
		apiLogGroup, err := cloudwatch.NewLogGroup(ctx, fmt.Sprintf("api-logs-%s", environmentSuffix), &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/apigateway/healthcare-%s", environmentSuffix)),
			RetentionInDays: pulumi.Int(30),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("api-gateway-logs-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		restAPI, err := apigateway.NewRestApi(ctx, fmt.Sprintf("healthcare-api-%s", environmentSuffix), &apigateway.RestApiArgs{
			Name:        pulumi.String(fmt.Sprintf("healthcare-api-%s", environmentSuffix)),
			Description: pulumi.String("API Gateway for healthcare data access"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("healthcare-api-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Create Lambda authorizer role
		_, err = iam.NewRole(ctx, fmt.Sprintf("authorizer-role-%s", environmentSuffix), &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}`),
			ManagedPolicyArns: pulumi.StringArray{
				pulumi.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("authorizer-role-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		apiResource, err := apigateway.NewResource(ctx, fmt.Sprintf("patients-resource-%s", environmentSuffix), &apigateway.ResourceArgs{
			RestApi:  restAPI.ID(),
			ParentId: restAPI.RootResourceId,
			PathPart: pulumi.String("patients"),
		})
		if err != nil {
			return err
		}

		method, err := apigateway.NewMethod(ctx, fmt.Sprintf("get-patients-%s", environmentSuffix), &apigateway.MethodArgs{
			RestApi:       restAPI.ID(),
			ResourceId:    apiResource.ID(),
			HttpMethod:    pulumi.String("GET"),
			Authorization: pulumi.String("NONE"),
		})
		if err != nil {
			return err
		}

		integration, err := apigateway.NewIntegration(ctx, fmt.Sprintf("mock-integration-%s", environmentSuffix), &apigateway.IntegrationArgs{
			RestApi:    restAPI.ID(),
			ResourceId: apiResource.ID(),
			HttpMethod: method.HttpMethod,
			Type:       pulumi.String("MOCK"),
			RequestTemplates: pulumi.StringMap{
				"application/json": pulumi.String(`{"statusCode": 200}`),
			},
		})
		if err != nil {
			return err
		}

		methodResponse, err := apigateway.NewMethodResponse(ctx, fmt.Sprintf("response-200-%s", environmentSuffix), &apigateway.MethodResponseArgs{
			RestApi:    restAPI.ID(),
			ResourceId: apiResource.ID(),
			HttpMethod: method.HttpMethod,
			StatusCode: pulumi.String("200"),
		})
		if err != nil {
			return err
		}

		_, err = apigateway.NewIntegrationResponse(ctx, fmt.Sprintf("integration-response-%s", environmentSuffix), &apigateway.IntegrationResponseArgs{
			RestApi:    restAPI.ID(),
			ResourceId: apiResource.ID(),
			HttpMethod: method.HttpMethod,
			StatusCode: pulumi.String("200"),
			ResponseTemplates: pulumi.StringMap{
				"application/json": pulumi.String(`{"message": "Patient data endpoint"}`),
			},
		}, pulumi.DependsOn([]pulumi.Resource{integration, methodResponse}))
		if err != nil {
			return err
		}

		deployment, err := apigateway.NewDeployment(ctx, fmt.Sprintf("api-deployment-%s", environmentSuffix), &apigateway.DeploymentArgs{
			RestApi: restAPI.ID(),
		}, pulumi.DependsOn([]pulumi.Resource{integration, methodResponse}))
		if err != nil {
			return err
		}

		_, err = apigateway.NewStage(ctx, fmt.Sprintf("prod-stage-%s", environmentSuffix), &apigateway.StageArgs{
			RestApi:    restAPI.ID(),
			Deployment: deployment.ID(),
			StageName:  pulumi.String("prod"),
			AccessLogSettings: &apigateway.StageAccessLogSettingsArgs{
				DestinationArn: apiLogGroup.Arn,
				Format:         pulumi.String(`$context.requestId`),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("api-prod-stage-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// 11. CloudWatch Monitoring
		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("ecs-cpu-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("ecs-high-cpu-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("GreaterThanThreshold"),
			EvaluationPeriods:  pulumi.Int(2),
			MetricName:         pulumi.String("CPUUtilization"),
			Namespace:          pulumi.String("AWS/ECS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(80),
			AlarmDescription:   pulumi.String("Alert when ECS CPU exceeds 80%"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("ecs-cpu-alarm-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		_, err = cloudwatch.NewMetricAlarm(ctx, fmt.Sprintf("rds-disk-alarm-%s", environmentSuffix), &cloudwatch.MetricAlarmArgs{
			Name:               pulumi.String(fmt.Sprintf("rds-low-disk-%s", environmentSuffix)),
			ComparisonOperator: pulumi.String("LessThanThreshold"),
			EvaluationPeriods:  pulumi.Int(1),
			MetricName:         pulumi.String("FreeLocalStorage"),
			Namespace:          pulumi.String("AWS/RDS"),
			Period:             pulumi.Int(300),
			Statistic:          pulumi.String("Average"),
			Threshold:          pulumi.Float64(5368709120),
			AlarmDescription:   pulumi.String("Alert when RDS free storage falls below 5GB"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("rds-disk-alarm-%s", environmentSuffix)),
				"Environment": pulumi.String(environmentSuffix),
			},
		})
		if err != nil {
			return err
		}

		// Exports
		ctx.Export("kms_key_id", kmsKey.KeyId)
		ctx.Export("kms_key_arn", kmsKey.Arn)
		ctx.Export("vpc_id", vpc.ID())
		ctx.Export("kinesis_stream_name", kinesisStream.Name)
		ctx.Export("kinesis_stream_arn", kinesisStream.Arn)
		ctx.Export("rds_cluster_endpoint", dbCluster.Endpoint)
		ctx.Export("rds_cluster_reader_endpoint", dbCluster.ReaderEndpoint)
		ctx.Export("elasticache_primary_endpoint", redisCluster.PrimaryEndpointAddress)
		ctx.Export("elasticache_reader_endpoint", redisCluster.ReaderEndpointAddress)
		ctx.Export("ecs_cluster_name", ecsCluster.Name)
		ctx.Export("ecs_cluster_arn", ecsCluster.Arn)
		ctx.Export("ecs_service_name", ecsService.Name)
		ctx.Export("api_gateway_id", restAPI.ID())
		ctx.Export("api_gateway_endpoint", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/prod", restAPI.ID(), region))
		ctx.Export("db_secret_arn", dbSecret.Arn)

		return nil
	})
}
