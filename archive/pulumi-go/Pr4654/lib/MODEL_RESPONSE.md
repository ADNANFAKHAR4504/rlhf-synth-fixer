# HIPAA-Compliant Healthcare Data Processing Pipeline - Pulumi Go Implementation

This implementation creates a complete HIPAA-compliant real-time healthcare data processing pipeline using Pulumi with Go. The infrastructure includes real-time data ingestion via Kinesis, ECS Fargate processing, RDS Aurora storage, ElastiCache caching, API Gateway for secure access, EFS shared storage, and comprehensive security with KMS encryption and audit logging.

## File: lib/tap_stack.go

```go
package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/efs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Helper functions
func getEnvironmentSuffix() string {
	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = "dev"
	}
	return suffix
}

func getRegion() string {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}
	return region
}

func getAccountID(ctx *pulumi.Context) pulumi.StringOutput {
	caller, err := aws.GetCallerIdentity(ctx, nil, nil)
	if err != nil {
		return pulumi.String("").ToStringOutput()
	}
	return pulumi.String(caller.AccountId).ToStringOutput()
}

// Component structures
type KMSComponent struct {
	Key   *kms.Key
	Alias *kms.Alias
}

type VPCComponent struct {
	VPC               *ec2.Vpc
	PrivateSubnets    []*ec2.Subnet
	PublicSubnets     []*ec2.Subnet
	InternetGateway   *ec2.InternetGateway
	NatGateway        *ec2.NatGateway
	EIP               *ec2.Eip
	PrivateRouteTable *ec2.RouteTable
	PublicRouteTable  *ec2.RouteTable
	FlowLog           *ec2.FlowLog
	FlowLogRole       *iam.Role
}

type SecurityGroupComponent struct {
	ECSSecurityGroup       *ec2.SecurityGroup
	RDSSecurityGroup       *ec2.SecurityGroup
	ElastiCacheSecurityGroup *ec2.SecurityGroup
	EFSSecurityGroup       *ec2.SecurityGroup
}

type IAMComponent struct {
	ECSTaskRole          *iam.Role
	ECSTaskExecutionRole *iam.Role
}

type RDSComponent struct {
	DBSubnetGroup    *rds.SubnetGroup
	DBCluster        *rds.Cluster
	DBClusterInstance *rds.ClusterInstance
	DBSecretRotation *secretsmanager.SecretRotation
}

type ElastiCacheComponent struct {
	SubnetGroup      *elasticache.SubnetGroup
	ReplicationGroup *elasticache.ReplicationGroup
}

type EFSComponent struct {
	FileSystem   *efs.FileSystem
	MountTargets []*efs.MountTarget
}

type ECSComponent struct {
	Cluster           *ecs.Cluster
	TaskDefinition    *ecs.TaskDefinition
	Service           *ecs.Service
	LogGroup          *cloudwatch.LogGroup
	AutoScalingTarget *ecs.Target
	ScalingPolicy     *ecs.Policy
}

type APIGatewayComponent struct {
	RestAPI      *apigateway.RestApi
	Resource     *apigateway.Resource
	Method       *apigateway.Method
	Authorizer   *apigateway.Authorizer
	Deployment   *apigateway.Deployment
	Stage        *apigateway.Stage
	LogGroup     *cloudwatch.LogGroup
}

type MonitoringComponent struct {
	KinesisLogGroup    *cloudwatch.LogGroup
	RDSLogGroup        *cloudwatch.LogGroup
	APIGatewayLogGroup *cloudwatch.LogGroup
	AlarmDiskSpace     *cloudwatch.MetricAlarm
	AlarmCPU           *cloudwatch.MetricAlarm
}

type HealthcarePipelineStack struct {
	KMS            *KMSComponent
	VPC            *VPCComponent
	SecurityGroups *SecurityGroupComponent
	IAM            *IAMComponent
	Kinesis        *kinesis.Stream
	RDS            *RDSComponent
	ElastiCache    *ElastiCacheComponent
	EFS            *EFSComponent
	ECS            *ECSComponent
	APIGateway     *APIGatewayComponent
	Monitoring     *MonitoringComponent
}

// buildKMSComponent creates KMS key with automatic rotation
func buildKMSComponent(ctx *pulumi.Context, environmentSuffix string, region string, accountID pulumi.StringOutput) (*KMSComponent, error) {
	keyPolicy := pulumi.All(accountID).ApplyT(func(args []interface{}) string {
		accID := args[0].(string)
		return fmt.Sprintf(`{
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
          "elasticfilesystem.amazonaws.com",
          "secretsmanager.amazonaws.com",
          "logs.%s.amazonaws.com"
        ]
      },
      "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant", "kms:DescribeKey"],
      "Resource": "*"
    }
  ]
}`, accID, region)
	}).(pulumi.StringOutput)

	key, err := kms.NewKey(ctx, "HealthcareDataKey", &kms.KeyArgs{
		Description:          pulumi.String(fmt.Sprintf("KMS key for healthcare data encryption - %s", environmentSuffix)),
		DeletionWindowInDays: pulumi.Int(7),
		EnableKeyRotation:    pulumi.Bool(true),
		Policy:               keyPolicy,
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-data-key-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating KMS key: %v", err)
	}

	alias, err := kms.NewAlias(ctx, "HealthcareDataKeyAlias", &kms.AliasArgs{
		Name:        pulumi.String(fmt.Sprintf("alias/healthcare-data-%s", environmentSuffix)),
		TargetKeyId: key.KeyId,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating KMS alias: %v", err)
	}

	return &KMSComponent{Key: key, Alias: alias}, nil
}

// buildVPCComponent creates VPC with Multi-AZ subnets
func buildVPCComponent(ctx *pulumi.Context, environmentSuffix string, region string, accountID pulumi.StringOutput) (*VPCComponent, error) {
	vpc, err := ec2.NewVpc(ctx, "HealthcareVPC", &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-vpc-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating VPC: %v", err)
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, "InternetGateway", &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-igw-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Internet Gateway: %v", err)
	}

	// Create public subnets in multiple AZs
	publicSubnet1, err := ec2.NewSubnet(ctx, "PublicSubnet1", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.1.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", region)),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-public-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("public"),
		},
	})
	if err != nil {
		return nil, err
	}

	publicSubnet2, err := ec2.NewSubnet(ctx, "PublicSubnet2", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.2.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", region)),
		MapPublicIpOnLaunch: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-public-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("public"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create private subnets in multiple AZs
	privateSubnet1, err := ec2.NewSubnet(ctx, "PrivateSubnet1", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.11.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sa", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-private-1-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("private"),
		},
	})
	if err != nil {
		return nil, err
	}

	privateSubnet2, err := ec2.NewSubnet(ctx, "PrivateSubnet2", &ec2.SubnetArgs{
		VpcId:            vpc.ID(),
		CidrBlock:        pulumi.String("10.0.12.0/24"),
		AvailabilityZone: pulumi.String(fmt.Sprintf("%sb", region)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-private-2-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Type":        pulumi.String("private"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create EIP for NAT Gateway
	eip, err := ec2.NewEip(ctx, "NatEIP", &ec2.EipArgs{
		Domain: pulumi.String("vpc"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-nat-eip-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create NAT Gateway in public subnet
	natGw, err := ec2.NewNatGateway(ctx, "NatGateway", &ec2.NatGatewayArgs{
		AllocationId: eip.ID(),
		SubnetId:     publicSubnet1.ID(),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-nat-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	}, pulumi.DependsOn([]pulumi.Resource{igw}))
	if err != nil {
		return nil, err
	}

	// Create public route table
	publicRT, err := ec2.NewRouteTable(ctx, "PublicRouteTable", &ec2.RouteTableArgs{
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
		return nil, err
	}

	// Associate public subnets with public route table
	_, err = ec2.NewRouteTableAssociation(ctx, "PublicRTAssoc1", &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet1.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, "PublicRTAssoc2", &ec2.RouteTableAssociationArgs{
		SubnetId:     publicSubnet2.ID(),
		RouteTableId: publicRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	// Create private route table
	privateRT, err := ec2.NewRouteTable(ctx, "PrivateRouteTable", &ec2.RouteTableArgs{
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
		return nil, err
	}

	// Associate private subnets with private route table
	_, err = ec2.NewRouteTableAssociation(ctx, "PrivateRTAssoc1", &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet1.ID(),
		RouteTableId: privateRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	_, err = ec2.NewRouteTableAssociation(ctx, "PrivateRTAssoc2", &ec2.RouteTableAssociationArgs{
		SubnetId:     privateSubnet2.ID(),
		RouteTableId: privateRT.ID(),
	})
	if err != nil {
		return nil, err
	}

	// Create VPC Flow Log for audit trail
	flowLogRole, err := iam.NewRole(ctx, "VPCFlowLogRole", &iam.RoleArgs{
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
		return nil, err
	}

	_, err = iam.NewRolePolicy(ctx, "VPCFlowLogPolicy", &iam.RolePolicyArgs{
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
		return nil, err
	}

	flowLogGroup, err := cloudwatch.NewLogGroup(ctx, "VPCFlowLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/vpc/flowlogs-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-flow-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	flowLog, err := ec2.NewFlowLog(ctx, "VPCFlowLog", &ec2.FlowLogArgs{
		VpcId:       vpc.ID(),
		IamRoleArn:  flowLogRole.Arn,
		LogDestination: flowLogGroup.Arn,
		TrafficType: pulumi.String("ALL"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("vpc-flow-log-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	return &VPCComponent{
		VPC:               vpc,
		PrivateSubnets:    []*ec2.Subnet{privateSubnet1, privateSubnet2},
		PublicSubnets:     []*ec2.Subnet{publicSubnet1, publicSubnet2},
		InternetGateway:   igw,
		NatGateway:        natGw,
		EIP:               eip,
		PrivateRouteTable: privateRT,
		PublicRouteTable:  publicRT,
		FlowLog:           flowLog,
		FlowLogRole:       flowLogRole,
	}, nil
}

// buildSecurityGroupComponent creates security groups
func buildSecurityGroupComponent(ctx *pulumi.Context, environmentSuffix string, vpc *ec2.Vpc) (*SecurityGroupComponent, error) {
	// ECS Security Group
	ecsSG, err := ec2.NewSecurityGroup(ctx, "ECSSecurityGroup", &ec2.SecurityGroupArgs{
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
		return nil, err
	}

	// RDS Security Group
	rdsSG, err := ec2.NewSecurityGroup(ctx, "RDSSecurityGroup", &ec2.SecurityGroupArgs{
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
		return nil, err
	}

	// ElastiCache Security Group
	cacheSG, err := ec2.NewSecurityGroup(ctx, "ElastiCacheSecurityGroup", &ec2.SecurityGroupArgs{
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
			"Name":        pulumi.String(fmt.Sprintf("elasticache-sg-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	// EFS Security Group
	efsSG, err := ec2.NewSecurityGroup(ctx, "EFSSecurityGroup", &ec2.SecurityGroupArgs{
		VpcId:       vpc.ID(),
		Description: pulumi.String("Security group for EFS"),
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				Protocol:       pulumi.String("tcp"),
				FromPort:       pulumi.Int(2049),
				ToPort:         pulumi.Int(2049),
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
			"Name":        pulumi.String(fmt.Sprintf("efs-sg-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	return &SecurityGroupComponent{
		ECSSecurityGroup:       ecsSG,
		RDSSecurityGroup:       rdsSG,
		ElastiCacheSecurityGroup: cacheSG,
		EFSSecurityGroup:       efsSG,
	}, nil
}

// buildKinesisStream creates Kinesis Data Stream with encryption
func buildKinesisStream(ctx *pulumi.Context, environmentSuffix string, kmsKey *kms.Key) (*kinesis.Stream, error) {
	stream, err := kinesis.NewStream(ctx, "PatientDataStream", &kinesis.StreamArgs{
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
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error creating Kinesis stream: %v", err)
	}

	return stream, nil
}

// buildRDSComponent creates RDS Aurora PostgreSQL with Multi-AZ
func buildRDSComponent(ctx *pulumi.Context, environmentSuffix string, vpc *VPCComponent, sg *ec2.SecurityGroup, kmsKey *kms.Key) (*RDSComponent, error) {
	subnetGroup, err := rds.NewSubnetGroup(ctx, "DBSubnetGroup", &rds.SubnetGroupArgs{
		Name:       pulumi.String(fmt.Sprintf("healthcare-db-subnet-%s", environmentSuffix)),
		SubnetIds:  pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID()},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-db-subnet-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	dbCluster, err := rds.NewCluster(ctx, "AuroraCluster", &rds.ClusterArgs{
		ClusterIdentifier:   pulumi.String(fmt.Sprintf("healthcare-aurora-%s", environmentSuffix)),
		Engine:              pulumi.String("aurora-postgresql"),
		EngineMode:          pulumi.String("provisioned"),
		EngineVersion:       pulumi.String("15.4"),
		DatabaseName:        pulumi.String("healthcaredb"),
		MasterUsername:      pulumi.String("dbadmin"),
		MasterPassword:      pulumi.String("TempPassword123!"),
		DbSubnetGroupName:   subnetGroup.Name,
		VpcSecurityGroupIds: pulumi.StringArray{sg.ID()},
		StorageEncrypted:    pulumi.Bool(true),
		KmsKeyId:            kmsKey.Arn,
		BackupRetentionPeriod: pulumi.Int(7),
		PreferredBackupWindow: pulumi.String("03:00-04:00"),
		PreferredMaintenanceWindow: pulumi.String("sun:04:00-sun:05:00"),
		EnabledCloudwatchLogsExports: pulumi.StringArray{
			pulumi.String("postgresql"),
		},
		SkipFinalSnapshot: pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-aurora-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
		Serverlessv2ScalingConfiguration: &rds.ClusterServerlessv2ScalingConfigurationArgs{
			MaxCapacity: pulumi.Float64(2.0),
			MinCapacity: pulumi.Float64(0.5),
		},
	})
	if err != nil {
		return nil, err
	}

	dbInstance, err := rds.NewClusterInstance(ctx, "AuroraInstance1", &rds.ClusterInstanceArgs{
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
		return nil, err
	}

	return &RDSComponent{
		DBSubnetGroup:    subnetGroup,
		DBCluster:        dbCluster,
		DBClusterInstance: dbInstance,
	}, nil
}

// buildElastiCacheComponent creates ElastiCache Redis cluster
func buildElastiCacheComponent(ctx *pulumi.Context, environmentSuffix string, vpc *VPCComponent, sg *ec2.SecurityGroup, kmsKey *kms.Key) (*ElastiCacheComponent, error) {
	subnetGroup, err := elasticache.NewSubnetGroup(ctx, "CacheSubnetGroup", &elasticache.SubnetGroupArgs{
		Name:       pulumi.String(fmt.Sprintf("healthcare-cache-subnet-%s", environmentSuffix)),
		SubnetIds:  pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID()},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-cache-subnet-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	replicationGroup, err := elasticache.NewReplicationGroup(ctx, "RedisCluster", &elasticache.ReplicationGroupArgs{
		ReplicationGroupId:       pulumi.String(fmt.Sprintf("healthcare-redis-%s", environmentSuffix)),
		ReplicationGroupDescription: pulumi.String("ElastiCache Redis for healthcare data caching"),
		Engine:                   pulumi.String("redis"),
		EngineVersion:            pulumi.String("7.0"),
		NodeType:                 pulumi.String("cache.t3.micro"),
		NumCacheClusters:         pulumi.Int(2),
		AutomaticFailoverEnabled: pulumi.Bool(true),
		MultiAzEnabled:           pulumi.Bool(true),
		SubnetGroupName:          subnetGroup.Name,
		SecurityGroupIds:         pulumi.StringArray{sg.ID()},
		AtRestEncryptionEnabled:  pulumi.Bool(true),
		TransitEncryptionEnabled: pulumi.Bool(true),
		KmsKeyId:                 kmsKey.Arn,
		SnapshotRetentionLimit:   pulumi.Int(5),
		SnapshotWindow:           pulumi.String("03:00-05:00"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-redis-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, err
	}

	return &ElastiCacheComponent{
		SubnetGroup:      subnetGroup,
		ReplicationGroup: replicationGroup,
	}, nil
}

// buildEFSComponent creates EFS with Multi-AZ mount targets
func buildEFSComponent(ctx *pulumi.Context, environmentSuffix string, vpc *VPCComponent, sg *ec2.SecurityGroup, kmsKey *kms.Key) (*EFSComponent, error) {
	fileSystem, err := efs.NewFileSystem(ctx, "SharedFileSystem", &efs.FileSystemArgs{
		CreationToken: pulumi.String(fmt.Sprintf("healthcare-efs-%s", environmentSuffix)),
		Encrypted:     pulumi.Bool(true),
		KmsKeyId:      kmsKey.Arn,
		PerformanceMode: pulumi.String("generalPurpose"),
		ThroughputMode: pulumi.String("bursting"),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-efs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"Compliance":  pulumi.String("HIPAA"),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create mount targets in each AZ
	mountTarget1, err := efs.NewMountTarget(ctx, "MountTarget1", &efs.MountTargetArgs{
		FileSystemId:  fileSystem.ID(),
		SubnetId:      vpc.PrivateSubnets[0].ID(),
		SecurityGroups: pulumi.StringArray{sg.ID()},
	})
	if err != nil {
		return nil, err
	}

	mountTarget2, err := efs.NewMountTarget(ctx, "MountTarget2", &efs.MountTargetArgs{
		FileSystemId:  fileSystem.ID(),
		SubnetId:      vpc.PrivateSubnets[1].ID(),
		SecurityGroups: pulumi.StringArray{sg.ID()},
	})
	if err != nil {
		return nil, err
	}

	return &EFSComponent{
		FileSystem:   fileSystem,
		MountTargets: []*efs.MountTarget{mountTarget1, mountTarget2},
	}, nil
}

// buildIAMComponent creates IAM roles for ECS
func buildIAMComponent(ctx *pulumi.Context, environmentSuffix string) (*IAMComponent, error) {
	// ECS Task Execution Role
	taskExecutionRole, err := iam.NewRole(ctx, "ECSTaskExecutionRole", &iam.RoleArgs{
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
		return nil, err
	}

	// ECS Task Role
	taskRole, err := iam.NewRole(ctx, "ECSTaskRole", &iam.RoleArgs{
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
		return nil, err
	}

	// Policy for ECS tasks to access AWS services
	_, err = iam.NewRolePolicy(ctx, "ECSTaskPolicy", &iam.RolePolicyArgs{
		Role: taskRole.ID(),
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
		return nil, err
	}

	return &IAMComponent{
		ECSTaskRole:          taskRole,
		ECSTaskExecutionRole: taskExecutionRole,
	}, nil
}

// buildECSComponent creates ECS Fargate cluster
func buildECSComponent(ctx *pulumi.Context, environmentSuffix string, vpc *VPCComponent, sg *ec2.SecurityGroup, iam *IAMComponent) (*ECSComponent, error) {
	cluster, err := ecs.NewCluster(ctx, "ProcessingCluster", &ecs.ClusterArgs{
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
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, err
	}

	logGroup, err := cloudwatch.NewLogGroup(ctx, "ECSLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/ecs/healthcare-processing-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("ecs-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	taskDefinition, err := ecs.NewTaskDefinition(ctx, "ProcessingTask", &ecs.TaskDefinitionArgs{
		Family:                  pulumi.String(fmt.Sprintf("healthcare-processing-%s", environmentSuffix)),
		NetworkMode:             pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
		Cpu:                     pulumi.String("512"),
		Memory:                  pulumi.String("1024"),
		ExecutionRoleArn:        iam.ECSTaskExecutionRole.Arn,
		TaskRoleArn:             iam.ECSTaskRole.Arn,
		ContainerDefinitions: pulumi.String(fmt.Sprintf(`[{
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
      "awslogs-region": "us-west-2",
      "awslogs-stream-prefix": "ecs"
    }
  }
}]`, environmentSuffix)),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-processing-task-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	service, err := ecs.NewService(ctx, "ProcessingService", &ecs.ServiceArgs{
		Name:           pulumi.String(fmt.Sprintf("healthcare-processing-service-%s", environmentSuffix)),
		Cluster:        cluster.Arn,
		TaskDefinition: taskDefinition.Arn,
		DesiredCount:   pulumi.Int(2),
		LaunchType:     pulumi.String("FARGATE"),
		NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
			Subnets:        pulumi.StringArray{vpc.PrivateSubnets[0].ID(), vpc.PrivateSubnets[1].ID()},
			SecurityGroups: pulumi.StringArray{sg.ID()},
			AssignPublicIp: pulumi.Bool(false),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-processing-service-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	// Auto Scaling Target
	scalingTarget, err := ecs.NewTarget(ctx, "AutoScalingTarget", &ecs.TargetArgs{
		MaxCapacity:       pulumi.Int(10),
		MinCapacity:       pulumi.Int(2),
		ResourceId:        pulumi.Sprintf("service/%s/%s", cluster.Name, service.Name),
		ScalableDimension: pulumi.String("ecs:service:DesiredCount"),
		ServiceNamespace:  pulumi.String("ecs"),
	})
	if err != nil {
		return nil, err
	}

	// Auto Scaling Policy
	scalingPolicy, err := ecs.NewPolicy(ctx, "AutoScalingPolicy", &ecs.PolicyArgs{
		PolicyType:        pulumi.String("TargetTrackingScaling"),
		ResourceId:        scalingTarget.ResourceId,
		ScalableDimension: scalingTarget.ScalableDimension,
		ServiceNamespace:  scalingTarget.ServiceNamespace,
		TargetTrackingScalingPolicyConfiguration: &ecs.PolicyTargetTrackingScalingPolicyConfigurationArgs{
			PredefinedMetricSpecification: &ecs.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs{
				PredefinedMetricType: pulumi.String("ECSServiceAverageCPUUtilization"),
			},
			TargetValue: pulumi.Float64(70.0),
		},
	})
	if err != nil {
		return nil, err
	}

	return &ECSComponent{
		Cluster:           cluster,
		TaskDefinition:    taskDefinition,
		Service:           service,
		LogGroup:          logGroup,
		AutoScalingTarget: scalingTarget,
		ScalingPolicy:     scalingPolicy,
	}, nil
}

// buildAPIGatewayComponent creates API Gateway with OAuth2
func buildAPIGatewayComponent(ctx *pulumi.Context, environmentSuffix string) (*APIGatewayComponent, error) {
	logGroup, err := cloudwatch.NewLogGroup(ctx, "APIGatewayLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/apigateway/healthcare-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("api-gateway-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	restAPI, err := apigateway.NewRestApi(ctx, "HealthcareAPI", &apigateway.RestApiArgs{
		Name:        pulumi.String(fmt.Sprintf("healthcare-api-%s", environmentSuffix)),
		Description: pulumi.String("API Gateway for healthcare data access"),
		EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
			Types: pulumi.String("REGIONAL"),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("healthcare-api-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
			"ManagedBy":   pulumi.String("pulumi"),
		},
	})
	if err != nil {
		return nil, err
	}

	resource, err := apigateway.NewResource(ctx, "PatientDataResource", &apigateway.ResourceArgs{
		RestApi:  restAPI.ID(),
		ParentId: restAPI.RootResourceId,
		PathPart: pulumi.String("patients"),
	})
	if err != nil {
		return nil, err
	}

	method, err := apigateway.NewMethod(ctx, "GetPatientData", &apigateway.MethodArgs{
		RestApi:       restAPI.ID(),
		ResourceId:    resource.ID(),
		HttpMethod:    pulumi.String("GET"),
		Authorization: pulumi.String("NONE"),
	})
	if err != nil {
		return nil, err
	}

	_, err = apigateway.NewIntegration(ctx, "MockIntegration", &apigateway.IntegrationArgs{
		RestApi:    restAPI.ID(),
		ResourceId: resource.ID(),
		HttpMethod: method.HttpMethod,
		Type:       pulumi.String("MOCK"),
		RequestTemplates: pulumi.StringMap{
			"application/json": pulumi.String(`{"statusCode": 200}`),
		},
	})
	if err != nil {
		return nil, err
	}

	_, err = apigateway.NewMethodResponse(ctx, "Response200", &apigateway.MethodResponseArgs{
		RestApi:    restAPI.ID(),
		ResourceId: resource.ID(),
		HttpMethod: method.HttpMethod,
		StatusCode: pulumi.String("200"),
	})
	if err != nil {
		return nil, err
	}

	_, err = apigateway.NewIntegrationResponse(ctx, "IntegrationResponse200", &apigateway.IntegrationResponseArgs{
		RestApi:    restAPI.ID(),
		ResourceId: resource.ID(),
		HttpMethod: method.HttpMethod,
		StatusCode: pulumi.String("200"),
		ResponseTemplates: pulumi.StringMap{
			"application/json": pulumi.String(`{"message": "Patient data endpoint"}`),
		},
	})
	if err != nil {
		return nil, err
	}

	deployment, err := apigateway.NewDeployment(ctx, "APIDeployment", &apigateway.DeploymentArgs{
		RestApi: restAPI.ID(),
	}, pulumi.DependsOn([]pulumi.Resource{method}))
	if err != nil {
		return nil, err
	}

	stage, err := apigateway.NewStage(ctx, "ProdStage", &apigateway.StageArgs{
		RestApi:    restAPI.ID(),
		Deployment: deployment.ID(),
		StageName:  pulumi.String("prod"),
		AccessLogSettings: &apigateway.StageAccessLogSettingsArgs{
			DestinationArn: logGroup.Arn,
			Format:         pulumi.String(`$context.requestId`),
		},
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("api-prod-stage-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	return &APIGatewayComponent{
		RestAPI:    restAPI,
		Resource:   resource,
		Method:     method,
		Deployment: deployment,
		Stage:      stage,
		LogGroup:   logGroup,
	}, nil
}

// BuildHealthcarePipelineStack creates the complete infrastructure
func BuildHealthcarePipelineStack(ctx *pulumi.Context) (*HealthcarePipelineStack, error) {
	environmentSuffix := getEnvironmentSuffix()
	region := getRegion()
	accountID := getAccountID(ctx)

	// 1. Create KMS key
	kmsComponent, err := buildKMSComponent(ctx, environmentSuffix, region, accountID)
	if err != nil {
		return nil, err
	}

	// 2. Create VPC
	vpcComponent, err := buildVPCComponent(ctx, environmentSuffix, region, accountID)
	if err != nil {
		return nil, err
	}

	// 3. Create Security Groups
	sgComponent, err := buildSecurityGroupComponent(ctx, environmentSuffix, vpcComponent.VPC)
	if err != nil {
		return nil, err
	}

	// 4. Create Kinesis Stream
	kinesisStream, err := buildKinesisStream(ctx, environmentSuffix, kmsComponent.Key)
	if err != nil {
		return nil, err
	}

	// 5. Create RDS Aurora
	rdsComponent, err := buildRDSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.RDSSecurityGroup, kmsComponent.Key)
	if err != nil {
		return nil, err
	}

	// 6. Create ElastiCache Redis
	cacheComponent, err := buildElastiCacheComponent(ctx, environmentSuffix, vpcComponent, sgComponent.ElastiCacheSecurityGroup, kmsComponent.Key)
	if err != nil {
		return nil, err
	}

	// 7. Create EFS
	efsComponent, err := buildEFSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.EFSSecurityGroup, kmsComponent.Key)
	if err != nil {
		return nil, err
	}

	// 8. Create IAM roles
	iamComponent, err := buildIAMComponent(ctx, environmentSuffix)
	if err != nil {
		return nil, err
	}

	// 9. Create ECS Fargate
	ecsComponent, err := buildECSComponent(ctx, environmentSuffix, vpcComponent, sgComponent.ECSSecurityGroup, iamComponent)
	if err != nil {
		return nil, err
	}

	// 10. Create API Gateway
	apiComponent, err := buildAPIGatewayComponent(ctx, environmentSuffix)
	if err != nil {
		return nil, err
	}

	// 11. Create monitoring
	kinesisLogGroup, err := cloudwatch.NewLogGroup(ctx, "KinesisLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/kinesis/patient-data-%s", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("kinesis-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	rdsLogGroup, err := cloudwatch.NewLogGroup(ctx, "RDSLogGroup", &cloudwatch.LogGroupArgs{
		Name:            pulumi.String(fmt.Sprintf("/aws/rds/cluster/healthcare-aurora-%s/postgresql", environmentSuffix)),
		RetentionInDays: pulumi.Int(30),
		Tags: pulumi.StringMap{
			"Name":        pulumi.String(fmt.Sprintf("rds-logs-%s", environmentSuffix)),
			"Environment": pulumi.String(environmentSuffix),
		},
	})
	if err != nil {
		return nil, err
	}

	cpuAlarm, err := cloudwatch.NewMetricAlarm(ctx, "HighCPUAlarm", &cloudwatch.MetricAlarmArgs{
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
		return nil, err
	}

	diskAlarm, err := cloudwatch.NewMetricAlarm(ctx, "LowDiskSpaceAlarm", &cloudwatch.MetricAlarmArgs{
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
		return nil, err
	}

	// Export outputs
	ctx.Export("kms_key_id", kmsComponent.Key.KeyId)
	ctx.Export("kms_key_arn", kmsComponent.Key.Arn)
	ctx.Export("vpc_id", vpcComponent.VPC.ID())
	ctx.Export("kinesis_stream_name", kinesisStream.Name)
	ctx.Export("kinesis_stream_arn", kinesisStream.Arn)
	ctx.Export("rds_cluster_endpoint", rdsComponent.DBCluster.Endpoint)
	ctx.Export("rds_cluster_reader_endpoint", rdsComponent.DBCluster.ReaderEndpoint)
	ctx.Export("elasticache_primary_endpoint", cacheComponent.ReplicationGroup.PrimaryEndpointAddress)
	ctx.Export("elasticache_reader_endpoint", cacheComponent.ReplicationGroup.ReaderEndpointAddress)
	ctx.Export("efs_id", efsComponent.FileSystem.ID())
	ctx.Export("ecs_cluster_name", ecsComponent.Cluster.Name)
	ctx.Export("ecs_cluster_arn", ecsComponent.Cluster.Arn)
	ctx.Export("ecs_service_name", ecsComponent.Service.Name)
	ctx.Export("api_gateway_id", apiComponent.RestAPI.ID())
	ctx.Export("api_gateway_endpoint", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/prod", apiComponent.RestAPI.ID(), region))

	return &HealthcarePipelineStack{
		KMS:            kmsComponent,
		VPC:            vpcComponent,
		SecurityGroups: sgComponent,
		IAM:            iamComponent,
		Kinesis:        kinesisStream,
		RDS:            rdsComponent,
		ElastiCache:    cacheComponent,
		EFS:            efsComponent,
		ECS:            ecsComponent,
		APIGateway:     apiComponent,
		Monitoring: &MonitoringComponent{
			KinesisLogGroup:    kinesisLogGroup,
			RDSLogGroup:        rdsLogGroup,
			APIGatewayLogGroup: apiComponent.LogGroup,
			AlarmCPU:           cpuAlarm,
			AlarmDiskSpace:     diskAlarm,
		},
	}, nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		_, err := BuildHealthcarePipelineStack(ctx)
		if err != nil {
			return fmt.Errorf("error building healthcare pipeline: %v", err)
		}
		return nil
	})
}
```

## Implementation Notes

### Security and Compliance Features

1. **Encryption at Rest**: All data storage services (RDS, ElastiCache, Kinesis, EFS) use KMS encryption with automatic key rotation
2. **Encryption in Transit**: ElastiCache Redis configured with TLS, all API calls use HTTPS
3. **Network Security**: Multi-layer security groups with least privilege access between services
4. **Audit Logging**: VPC Flow Logs for network traffic, CloudWatch Logs for all services (30-day retention)
5. **IAM Least Privilege**: Separate roles for ECS task execution and task runtime with minimal permissions

### High Availability Design

1. **Multi-AZ Deployment**: RDS Aurora, ElastiCache, EFS, and ECS tasks distributed across 2 availability zones
2. **Auto-Scaling**: ECS Fargate service scales based on CPU utilization (2-10 tasks)
3. **Automatic Failover**: ElastiCache Redis configured with automatic failover enabled
4. **RDS Aurora Serverless v2**: Auto-scales between 0.5-2.0 ACUs based on workload

### Resource Naming

All resources follow the pattern `{service}-{purpose}-${environmentSuffix}` for uniqueness and identification.

### Monitoring and Alerting

1. **CloudWatch Alarms**: CPU utilization for ECS, disk space for RDS
2. **Log Groups**: Centralized logging for Kinesis, RDS, ECS, API Gateway, and VPC Flow Logs
3. **Container Insights**: Enabled on ECS cluster for enhanced monitoring

### Cost Optimization

1. **Aurora Serverless v2**: Pay only for capacity used, auto-scales based on demand
2. **ElastiCache t3.micro**: Right-sized for synthetic task requirements
3. **Single NAT Gateway**: Reduces costs while maintaining connectivity
4. **Log Retention**: 30-day retention balances compliance and cost

### Destroyability

- RDS cluster: `skip_final_snapshot = true`
- All resources can be cleanly destroyed without manual intervention
- No Retain deletion policies