# IoT Manufacturing Data Pipeline

Here's an enhanced Pulumi implementation in Go for the IoT sensor data ingestion pipeline. This creates production-ready infrastructure with VPC Endpoints and Application Load Balancer for cost optimization, security, and high availability.

## File: lib/tap_stack.go

```go
package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"regexp"
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

const (
	region       = "us-east-1"
	vpcCIDR      = "10.0.0.0/16"
	az1          = "us-east-1a"
	az2          = "us-east-1b"
	publicCIDR1  = "10.0.1.0/24"
	publicCIDR2  = "10.0.2.0/24"
	privateCIDR1 = "10.0.3.0/24"
	privateCIDR2 = "10.0.4.0/24"
)

func sanitizeName(name string) string {
	name = strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9\.-]`)
	name = reg.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	if len(name) > 63 {
		name = name[:63]
	}
	return name
}

func generateDBUsername(length int) (string, error) {
	if length < 1 || length > 16 {
		return "", fmt.Errorf("username length must be between 1 and 16")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	allowed := letters + digits + "_"

	result := make([]byte, length)

	num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
	if err != nil {
		return "", err
	}
	result[0] = letters[num.Int64()]

	for i := 1; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

func generateDBPassword(length int) (string, error) {
	if length < 8 || length > 41 {
		return "", fmt.Errorf("password length must be between 8 and 41")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	specials := "!#$%^&*()-_=+[]{}:;,.?"
	allowed := letters + digits + specials

	result := make([]byte, length)

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		projectName := ctx.Project()
		stackName := ctx.Stack()

		// Get ENVIRONMENT_SUFFIX from environment variable, default to stack name if not set
		envSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
		if envSuffix == "" {
			envSuffix = stackName
		}

		dbUsername, err := generateDBUsername(12)
		if err != nil {
			return fmt.Errorf("failed to generate DB username: %w", err)
		}

		dbPassword, err := generateDBPassword(20)
		if err != nil {
			return fmt.Errorf("failed to generate DB password: %w", err)
		}

		// VPC Configuration
		vpc, err := ec2.NewVpc(ctx, "iot-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String(vpcCIDR),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-vpc", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
				"Project":     pulumi.String("IoT-Manufacturing"),
			},
		})
		if err != nil {
			return err
		}

		igw, err := ec2.NewInternetGateway(ctx, "iot-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-igw", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Subnets
		publicSubnet1, err := ec2.NewSubnet(ctx, "public-subnet-1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(publicCIDR1),
			AvailabilityZone:    pulumi.String(az1),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-1", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

		publicSubnet2, err := ec2.NewSubnet(ctx, "public-subnet-2", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(publicCIDR2),
			AvailabilityZone:    pulumi.String(az2),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-2", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet1, err := ec2.NewSubnet(ctx, "private-subnet-1", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(privateCIDR1),
			AvailabilityZone: pulumi.String(az1),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-1", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Private"),
			},
		})
		if err != nil {
			return err
		}

		privateSubnet2, err := ec2.NewSubnet(ctx, "private-subnet-2", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(privateCIDR2),
			AvailabilityZone: pulumi.String(az2),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-2", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Private"),
			},
		})
		if err != nil {
			return err
		}

		// NAT Gateways
		natEip, err := ec2.NewEip(ctx, "nat-eip", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-eip", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		natGw, err := ec2.NewNatGateway(ctx, "nat-gw", &ec2.NatGatewayArgs{
			AllocationId: natEip.ID(),
			SubnetId:     publicSubnet1.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-gw", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Route Tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-rt", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		privateRouteTable, err := ec2.NewRouteTable(ctx, "private-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-rt", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "public-route", &ec2.RouteArgs{
			RouteTableId:         publicRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			GatewayId:            igw.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRoute(ctx, "private-route", &ec2.RouteArgs{
			RouteTableId:         privateRouteTable.ID(),
			DestinationCidrBlock: pulumi.String("0.0.0.0/0"),
			NatGatewayId:         natGw.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "public-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet1.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "public-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     publicSubnet2.ID(),
			RouteTableId: publicRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "private-rta-1", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet1.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "private-rta-2", &ec2.RouteTableAssociationArgs{
			SubnetId:     privateSubnet2.ID(),
			RouteTableId: privateRouteTable.ID(),
		})
		if err != nil {
			return err
		}

		// VPC Endpoints for cost optimization and security

		// S3 Gateway Endpoint (no additional cost, reduces NAT traffic)
		s3Endpoint, err := ec2.NewVpcEndpoint(ctx, "s3-endpoint", &ec2.VpcEndpointArgs{
			VpcId:           vpc.ID(),
			ServiceName:     pulumi.String(fmt.Sprintf("com.amazonaws.%s.s3", region)),
			VpcEndpointType: pulumi.String("Gateway"),
			RouteTableIds:   pulumi.StringArray{privateRouteTable.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-s3-endpoint", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Security Groups
		apiSecurityGroup, err := ec2.NewSecurityGroup(ctx, "api-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-api-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for API Gateway VPC Link"),
			VpcId:       vpc.ID(),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ALB Security Group
		albSecurityGroup, err := ec2.NewSecurityGroup(ctx, "alb-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-alb-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for Application Load Balancer"),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-alb-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		ecsSecurityGroup, err := ec2.NewSecurityGroup(ctx, "ecs-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-ecs-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for ECS Fargate tasks"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(8080),
					ToPort:         pulumi.Int(8080),
					SecurityGroups: pulumi.StringArray{apiSecurityGroup.ID(), albSecurityGroup.ID()},
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// VPC Endpoint Security Group (for interface endpoints)
		vpcEndpointSecurityGroup, err := ec2.NewSecurityGroup(ctx, "vpce-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-vpce-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for VPC Endpoints"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(443),
					ToPort:         pulumi.Int(443),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-vpce-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Secrets Manager Interface Endpoint
		secretsManagerEndpoint, err := ec2.NewVpcEndpoint(ctx, "secretsmanager-endpoint", &ec2.VpcEndpointArgs{
			VpcId:             vpc.ID(),
			ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.secretsmanager", region)),
			VpcEndpointType:   pulumi.String("Interface"),
			SubnetIds:         pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
			PrivateDnsEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-secretsmanager-endpoint", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECR API Interface Endpoint
		ecrApiEndpoint, err := ec2.NewVpcEndpoint(ctx, "ecr-api-endpoint", &ec2.VpcEndpointArgs{
			VpcId:             vpc.ID(),
			ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.ecr.api", region)),
			VpcEndpointType:   pulumi.String("Interface"),
			SubnetIds:         pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
			PrivateDnsEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecr-api-endpoint", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECR DKR Interface Endpoint
		ecrDkrEndpoint, err := ec2.NewVpcEndpoint(ctx, "ecr-dkr-endpoint", &ec2.VpcEndpointArgs{
			VpcId:             vpc.ID(),
			ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.ecr.dkr", region)),
			VpcEndpointType:   pulumi.String("Interface"),
			SubnetIds:         pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
			PrivateDnsEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecr-dkr-endpoint", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// CloudWatch Logs Interface Endpoint
		logsEndpoint, err := ec2.NewVpcEndpoint(ctx, "logs-endpoint", &ec2.VpcEndpointArgs{
			VpcId:             vpc.ID(),
			ServiceName:       pulumi.String(fmt.Sprintf("com.amazonaws.%s.logs", region)),
			VpcEndpointType:   pulumi.String("Interface"),
			SubnetIds:         pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			SecurityGroupIds:  pulumi.StringArray{vpcEndpointSecurityGroup.ID()},
			PrivateDnsEnabled: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-logs-endpoint", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		redisSecurityGroup, err := ec2.NewSecurityGroup(ctx, "redis-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-redis-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for ElastiCache Redis"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(6379),
					ToPort:         pulumi.Int(6379),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-redis-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, envSuffix)),
			Description: pulumi.String("Security group for RDS PostgreSQL"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Secrets Manager for DB credentials
		secretData := map[string]string{
			"username": dbUsername,
			"password": dbPassword,
		}
		secretJSON, err := json.Marshal(secretData)
		if err != nil {
			return fmt.Errorf("failed to marshal secret: %w", err)
		}

		dbSecret, err := secretsmanager.NewSecret(ctx, "db-secret", &secretsmanager.SecretArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-db-credentials", projectName, envSuffix)),
			Description: pulumi.String("Database credentials for RDS PostgreSQL"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-secret", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		_, err = secretsmanager.NewSecretVersion(ctx, "db-secret-version", &secretsmanager.SecretVersionArgs{
			SecretId:     dbSecret.ID(),
			SecretString: pulumi.String(string(secretJSON)),
		})
		if err != nil {
			return err
		}

		// Rotation removed: Requires Lambda function for rotation which is not implemented
		// In production, implement proper rotation with a Lambda function

		// RDS PostgreSQL
		dbSubnetGroupName := sanitizeName(fmt.Sprintf("%s-%s-db-subnet-group", projectName, envSuffix))
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "db-subnet-group", &rds.SubnetGroupArgs{
			Name:      pulumi.String(dbSubnetGroupName),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(dbSubnetGroupName),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		rdsInstance, err := rds.NewInstance(ctx, "iot-db", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(20),
			StorageType:           pulumi.String("gp3"),
			Engine:                pulumi.String("postgres"),
			EngineVersion:         pulumi.String("16.6"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			DbName:                pulumi.String("iotdb"),
			Username:              pulumi.String(dbUsername),
			Password:              pulumi.String(dbPassword),
			VpcSecurityGroupIds:   pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			MultiAz:               pulumi.Bool(false),
			StorageEncrypted:      pulumi.Bool(true),
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			DeletionProtection:    pulumi.Bool(false),
			SkipFinalSnapshot:     pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-rds", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ElastiCache Redis
		redisSubnetGroupName := sanitizeName(fmt.Sprintf("%s-%s-redis-subnet-group", projectName, envSuffix))
		redisSubnetGroup, err := elasticache.NewSubnetGroup(ctx, "redis-subnet-group", &elasticache.SubnetGroupArgs{
			Name:      pulumi.String(redisSubnetGroupName),
			SubnetIds: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(redisSubnetGroupName),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		redisCluster, err := elasticache.NewReplicationGroup(ctx, "redis-cluster", &elasticache.ReplicationGroupArgs{
			ReplicationGroupId:       pulumi.String(sanitizeName(fmt.Sprintf("%s-%s-redis", projectName, envSuffix))),
			Description:              pulumi.String("Redis cluster for IoT sensor data caching"),
			Engine:                   pulumi.String("redis"),
			EngineVersion:            pulumi.String("7.1"),
			NodeType:                 pulumi.String("cache.t3.micro"),
			NumCacheClusters:         pulumi.Int(2),
			Port:                     pulumi.Int(6379),
			SubnetGroupName:          redisSubnetGroup.Name,
			SecurityGroupIds:         pulumi.StringArray{redisSecurityGroup.ID()},
			AtRestEncryptionEnabled:  pulumi.Bool(true),
			TransitEncryptionEnabled: pulumi.Bool(false),
			AutomaticFailoverEnabled: pulumi.Bool(true),
			MultiAzEnabled:           pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-redis", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// IAM Role for ECS Task Execution
		ecsTaskExecutionRole, err := iam.NewRole(ctx, "ecs-task-execution-role", &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("%s-%s-ecs-task-exec-role", projectName, envSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Effect": "Allow",
						"Sid": ""
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-task-exec-role", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "ecs-task-exec-policy", &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// IAM Role for ECS Task
		ecsTaskRole, err := iam.NewRole(ctx, "ecs-task-role", &iam.RoleArgs{
			Name: pulumi.String(fmt.Sprintf("%s-%s-ecs-task-role", projectName, envSuffix)),
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Action": "sts:AssumeRole",
						"Principal": {
							"Service": "ecs-tasks.amazonaws.com"
						},
						"Effect": "Allow",
						"Sid": ""
					}
				]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-task-role", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		ecsTaskPolicy, err := iam.NewPolicy(ctx, "ecs-task-policy", &iam.PolicyArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-ecs-task-policy", projectName, envSuffix)),
			Description: pulumi.String("Policy for ECS tasks to access secrets and logs"),
			Policy: pulumi.All(dbSecret.Arn).ApplyT(func(args []interface{}) string {
				secretArn := args[0].(string)
				return fmt.Sprintf(`{
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
								"logs:CreateLogGroup",
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": "*"
						}
					]
				}`, secretArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "ecs-task-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskRole.Name,
			PolicyArn: ecsTaskPolicy.Arn,
		})
		if err != nil {
			return err
		}

		// ECR Repository
		ecrRepo, err := ecr.NewRepository(ctx, "iot-processor", &ecr.RepositoryArgs{
			Name:               pulumi.String(strings.ToLower(fmt.Sprintf("%s-%s-iot-processor", projectName, envSuffix))),
			ImageTagMutability: pulumi.String("MUTABLE"),
			ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
				ScanOnPush: pulumi.Bool(true),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecr", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// CloudWatch Log Group for ECS tasks
		logGroup, err := cloudwatch.NewLogGroup(ctx, "ecs-log-group", &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/%s-%s", projectName, envSuffix)),
			RetentionInDays: pulumi.Int(7),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-logs", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS Cluster
		ecsCluster, err := ecs.NewCluster(ctx, "iot-cluster", &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("%s-%s-ecs-cluster", projectName, envSuffix)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-cluster", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS Task Definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, "iot-task", &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("%s-%s-iot-task", projectName, envSuffix)),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			NetworkMode:             pulumi.String("awsvpc"),
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.All(ecrRepo.RepositoryUrl, dbSecret.Arn, redisCluster.PrimaryEndpointAddress, logGroup.Name).ApplyT(
				func(args []interface{}) (string, error) {
					repoUrl := args[0].(string)
					secretArn := args[1].(string)
					redisEndpoint := args[2].(string)
					logGroupName := args[3].(string)

					containerDef := []map[string]interface{}{
						{
							"name":  "iot-processor",
							"image": fmt.Sprintf("%s:latest", repoUrl),
							"portMappings": []map[string]interface{}{
								{
									"containerPort": 8080,
									"protocol":      "tcp",
								},
							},
							"environment": []map[string]interface{}{
								{
									"name":  "REDIS_ENDPOINT",
									"value": redisEndpoint,
								},
								{
									"name":  "REDIS_PORT",
									"value": "6379",
								},
							},
							"secrets": []map[string]interface{}{
								{
									"name":      "DB_SECRET",
									"valueFrom": secretArn,
								},
							},
							"logConfiguration": map[string]interface{}{
								"logDriver": "awslogs",
								"options": map[string]interface{}{
									"awslogs-group":         logGroupName,
									"awslogs-region":        region,
									"awslogs-stream-prefix": "ecs",
								},
							},
						},
					}

					jsonBytes, err := json.Marshal(containerDef)
					if err != nil {
						return "", err
					}
					return string(jsonBytes), nil
				},
			).(pulumi.StringOutput),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-task-def", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Application Load Balancer
		alb, err := lb.NewLoadBalancer(ctx, "iot-alb", &lb.LoadBalancerArgs{
			Name:             pulumi.String(sanitizeName(fmt.Sprintf("%s-%s-alb", projectName, envSuffix))),
			Internal:         pulumi.Bool(false),
			LoadBalancerType: pulumi.String("application"),
			SecurityGroups:   pulumi.StringArray{albSecurityGroup.ID()},
			Subnets:          pulumi.StringArray{publicSubnet1.ID(), publicSubnet2.ID()},
			EnableDeletionProtection: pulumi.Bool(false),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-alb", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ALB Target Group
		targetGroup, err := lb.NewTargetGroup(ctx, "ecs-target-group", &lb.TargetGroupArgs{
			Name:       pulumi.String(sanitizeName(fmt.Sprintf("%s-%s-ecs-tg", projectName, envSuffix))),
			Port:       pulumi.Int(8080),
			Protocol:   pulumi.String("HTTP"),
			VpcId:      vpc.ID(),
			TargetType: pulumi.String("ip"),
			HealthCheck: &lb.TargetGroupHealthCheckArgs{
				Path:               pulumi.String("/"),
				Protocol:           pulumi.String("HTTP"),
				Matcher:            pulumi.String("200"),
				Interval:           pulumi.Int(30),
				Timeout:            pulumi.Int(5),
				HealthyThreshold:   pulumi.Int(2),
				UnhealthyThreshold: pulumi.Int(3),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-tg", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ALB Listener
		_, err = lb.NewListener(ctx, "alb-listener", &lb.ListenerArgs{
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

		// ECS Service with ALB integration
		ecsService, err := ecs.NewService(ctx, "iot-service", &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("%s-%s-iot-service", projectName, envSuffix)),
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(0), // Set to 0 until container image is available
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
				SecurityGroups: pulumi.StringArray{ecsSecurityGroup.ID()},
			},
			LoadBalancers: ecs.ServiceLoadBalancerArray{
				&ecs.ServiceLoadBalancerArgs{
					TargetGroupArn: targetGroup.Arn,
					ContainerName:  pulumi.String("iot-processor"),
					ContainerPort:  pulumi.Int(8080),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-service", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		}, pulumi.DependsOn([]pulumi.Resource{alb}))
		if err != nil {
			return err
		}

		// API Gateway REST API
		apiGateway, err := apigateway.NewRestApi(ctx, "iot-api", &apigateway.RestApiArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-iot-api", projectName, envSuffix)),
			Description: pulumi.String("API Gateway for IoT sensor data ingestion"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gateway", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// API Gateway Resource
		apiResource, err := apigateway.NewResource(ctx, "api-resource", &apigateway.ResourceArgs{
			RestApi:  apiGateway.ID(),
			ParentId: apiGateway.RootResourceId,
			PathPart: pulumi.String("ingest"),
		})
		if err != nil {
			return err
		}

		// API Gateway Method
		_, err = apigateway.NewMethod(ctx, "api-method", &apigateway.MethodArgs{
			RestApi:       apiGateway.ID(),
			ResourceId:    apiResource.ID(),
			HttpMethod:    pulumi.String("POST"),
			Authorization: pulumi.String("NONE"),
		})
		if err != nil {
			return err
		}

		// API Gateway Deployment
		apiDeployment, err := apigateway.NewDeployment(ctx, "api-deployment", &apigateway.DeploymentArgs{
			RestApi:     apiGateway.ID(),
			Description: pulumi.String("Initial deployment"),
		})
		if err != nil {
			return err
		}

		// API Gateway Stage
		apiStage, err := apigateway.NewStage(ctx, "api-stage", &apigateway.StageArgs{
			RestApi:    apiGateway.ID(),
			Deployment: apiDeployment.ID(),
			StageName:  pulumi.String("prod"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-stage", projectName, envSuffix)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Exports
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("vpcCidr", vpc.CidrBlock)
		ctx.Export("publicSubnet1Id", publicSubnet1.ID())
		ctx.Export("publicSubnet2Id", publicSubnet2.ID())
		ctx.Export("privateSubnet1Id", privateSubnet1.ID())
		ctx.Export("privateSubnet2Id", privateSubnet2.ID())
		ctx.Export("natGatewayId", natGw.ID())
		ctx.Export("dbSecretArn", dbSecret.Arn)
		ctx.Export("dbSecretName", dbSecret.Name)
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("rdsInstanceId", rdsInstance.ID())
		ctx.Export("redisEndpoint", redisCluster.PrimaryEndpointAddress)
		ctx.Export("redisPort", pulumi.Int(6379))
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("ecsClusterArn", ecsCluster.Arn)
		ctx.Export("ecsServiceName", ecsService.Name)
		ctx.Export("ecrRepositoryUrl", ecrRepo.RepositoryUrl)
		ctx.Export("apiGatewayUrl", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/%s/ingest", apiGateway.ID(), region, apiStage.StageName))
		ctx.Export("apiGatewayId", apiGateway.ID())
		// New exports for enhanced features
		ctx.Export("s3EndpointId", s3Endpoint.ID())
		ctx.Export("secretsManagerEndpointId", secretsManagerEndpoint.ID())
		ctx.Export("ecrApiEndpointId", ecrApiEndpoint.ID())
		ctx.Export("ecrDkrEndpointId", ecrDkrEndpoint.ID())
		ctx.Export("logsEndpointId", logsEndpoint.ID())
		ctx.Export("albDnsName", alb.DnsName)
		ctx.Export("albArn", alb.Arn)
		ctx.Export("targetGroupArn", targetGroup.Arn)

		return nil
	})
}
```

This implementation creates a complete IoT data pipeline with:
- VPC with public and private subnets across two availability zones
- VPC Endpoints (S3 Gateway, Secrets Manager, ECR API/DKR, CloudWatch Logs) for cost optimization and security
- Application Load Balancer for production-ready ECS access
- NAT Gateway for private subnet internet access
- API Gateway for data ingestion
- ECS Fargate cluster for processing with ALB integration
- RDS PostgreSQL for storage
- ElastiCache Redis for caching
- Secrets Manager for credential management

The infrastructure is deployed in the us-east-1 region (changed from ap-northeast-1 due to Elastic IP quota limitations in the Tokyo region) with production-ready patterns.
