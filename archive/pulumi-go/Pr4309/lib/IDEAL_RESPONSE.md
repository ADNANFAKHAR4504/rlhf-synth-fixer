helpers.go
```go
package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"regexp"
	"strings"
)

// SanitizeBucketName ensures resource names are compliant with AWS naming requirements
func SanitizeBucketName(name string) string {
	name = strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9\.-]`)
	name = reg.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	return name
}

// GenerateDBUsername generates an RDS-compliant username
func GenerateDBUsername(length int) (string, error) {
	if length < 1 || length > 16 {
		return "", fmt.Errorf("username length must be between 1 and 16")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	allowed := letters + digits + "_"

	result := make([]byte, length)

	// First character must be a letter
	num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
	if err != nil {
		return "", err
	}
	result[0] = letters[num.Int64()]

	// Remaining characters can be letters, digits, underscore
	for i := 1; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

// GenerateDBPassword generates an RDS-compliant password
func GenerateDBPassword(length int) (string, error) {
	if length < 8 || length > 41 {
		return "", fmt.Errorf("password length must be between 8 and 41")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	// Safe specials (removed /, @, ", space for RDS compatibility)
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
```

tap_stack.go
```go
package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"regexp"
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigateway"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kinesis"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/secretsmanager"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

const (
	vpcCIDR      = "10.0.0.0/16"
	stageName    = "prod"
	publicCIDR1  = "10.0.1.0/24"
	publicCIDR2  = "10.0.2.0/24"
	privateCIDR1 = "10.0.3.0/24"
	privateCIDR2 = "10.0.4.0/24"
)

// sanitizeBucketName ensures resource names are compliant with AWS naming requirements
func sanitizeBucketName(name string) string {
	name = strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9\.-]`)
	name = reg.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	return name
}

// generateDBUsername generates an RDS-compliant username
func generateDBUsername(length int) (string, error) {
	if length < 1 || length > 16 {
		return "", fmt.Errorf("username length must be between 1 and 16")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	allowed := letters + digits + "_"

	result := make([]byte, length)

	// First character must be a letter
	num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
	if err != nil {
		return "", err
	}
	result[0] = letters[num.Int64()]

	// Remaining characters can be letters, digits, underscore
	for i := 1; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

// generateDBPassword generates an RDS-compliant password
func generateDBPassword(length int) (string, error) {
	if length < 8 || length > 41 {
		return "", fmt.Errorf("password length must be between 8 and 41")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	// Safe specials (removed /, @, ", space for RDS compatibility)
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

		awsRegion := os.Getenv("AWS_REGION")
		if awsRegion == "" {
			awsRegion = os.Getenv("AWS_DEFAULT_REGION")
		}
		if awsRegion == "" {
			awsRegion = "us-east-1"
		}

		azResult, err := aws.GetAvailabilityZones(ctx, &aws.GetAvailabilityZonesArgs{}, nil)
		if err != nil {
			return fmt.Errorf("failed to look up availability zones: %w", err)
		}
		if len(azResult.Names) < 2 {
			return fmt.Errorf("expected at least two availability zones, got %d", len(azResult.Names))
		}
		az1 := azResult.Names[0]
		az2 := azResult.Names[1]

		// Generate database credentials
		dbUsername, err := generateDBUsername(12)
		if err != nil {
			return fmt.Errorf("failed to generate DB username: %w", err)
		}

		dbPassword, err := generateDBPassword(20)
		if err != nil {
			return fmt.Errorf("failed to generate DB password: %w", err)
		}

		// ===================================================================
		// 1. KMS Key - For encryption at rest and in transit
		// ===================================================================
		// Get current AWS account ID for KMS policy
		currentCaller, err := aws.GetCallerIdentity(ctx, nil, nil)
		if err != nil {
			return err
		}
		accountId := currentCaller.AccountId

		kmsKey, err := kms.NewKey(ctx, "data-encryption-key", &kms.KeyArgs{
			Description:          pulumi.String("KMS key for encrypting data processing pipeline resources"),
			EnableKeyRotation:    pulumi.Bool(true),
			DeletionWindowInDays: pulumi.Int(7),
			Policy: pulumi.String(fmt.Sprintf(`{
				"Version": "2012-10-17",
				"Statement": [
					{
						"Sid": "Enable IAM User Permissions",
						"Effect": "Allow",
						"Principal": {
							"AWS": "arn:aws:iam::%s:root"
						},
						"Action": "kms:*",
						"Resource": "*"
					},
					{
						"Sid": "Allow CloudWatch Logs",
						"Effect": "Allow",
						"Principal": {
							"Service": "logs.%s.amazonaws.com"
						},
						"Action": [
							"kms:Encrypt",
							"kms:Decrypt",
							"kms:ReEncrypt*",
							"kms:GenerateDataKey*",
							"kms:CreateGrant",
							"kms:DescribeKey"
						],
						"Resource": "*",
						"Condition": {
							"ArnLike": {
								"kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:%s:%s:log-group:*"
							}
						}
					}
				]
			}`, accountId, awsRegion, awsRegion, accountId)),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-kms-key", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		_, err = kms.NewAlias(ctx, "data-encryption-key-alias", &kms.AliasArgs{
			Name:        pulumi.String(fmt.Sprintf("alias/%s-%s-data-key", projectName, stackName)),
			TargetKeyId: kmsKey.KeyId,
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 2. VPC and Networking - Private subnets for security
		// ===================================================================
		vpc, err := ec2.NewVpc(ctx, "fedramp-vpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String(vpcCIDR),
			EnableDnsHostnames: pulumi.Bool(true),
			EnableDnsSupport:   pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-vpc", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// Internet Gateway for public subnets
		igw, err := ec2.NewInternetGateway(ctx, "fedramp-igw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-igw", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Public subnets for NAT Gateway and API Gateway
		publicSubnet1, err := ec2.NewSubnet(ctx, "public-subnet-1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String(publicCIDR1),
			AvailabilityZone:    pulumi.String(az1),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-1", projectName, stackName)),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-subnet-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Public"),
			},
		})
		if err != nil {
			return err
		}

		// Private subnets for ECS and RDS (no public access)
		privateSubnet1, err := ec2.NewSubnet(ctx, "private-subnet-1", &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.String(privateCIDR1),
			AvailabilityZone: pulumi.String(az1),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-1", projectName, stackName)),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-subnet-2", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Type":        pulumi.String("Private"),
			},
		})
		if err != nil {
			return err
		}

		// NAT Gateway for private subnets to access AWS services
		natEip, err := ec2.NewEip(ctx, "nat-eip", &ec2.EipArgs{
			Domain: pulumi.String("vpc"),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-eip", projectName, stackName)),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-nat-gw", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Route tables
		publicRouteTable, err := ec2.NewRouteTable(ctx, "public-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-public-rt", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		privateRouteTable, err := ec2.NewRouteTable(ctx, "private-rt", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-private-rt", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Routes
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

		// Route table associations
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

		// ===================================================================
		// 3. Security Groups - Least privilege access
		// ===================================================================

		// API Gateway security group (not directly applicable, but VPC endpoint SG)
		apiGatewaySG, err := ec2.NewSecurityGroup(ctx, "api-gateway-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-api-gw-sg", projectName, stackName)),
			Description: pulumi.String("Security group for API Gateway VPC endpoint"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:    pulumi.String("tcp"),
					FromPort:    pulumi.Int(443),
					ToPort:      pulumi.Int(443),
					CidrBlocks:  pulumi.StringArray{pulumi.String("0.0.0.0/0")},
					Description: pulumi.String("HTTPS for API Gateway"),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gw-sg", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS tasks security group
		ecsTasksSG, err := ec2.NewSecurityGroup(ctx, "ecs-tasks-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-ecs-tasks-sg", projectName, stackName)),
			Description: pulumi.String("Security group for ECS tasks"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(8080),
					ToPort:         pulumi.Int(8080),
					SecurityGroups: pulumi.StringArray{apiGatewaySG.ID()},
					Description:    pulumi.String("Allow traffic from API Gateway"),
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
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-tasks-sg", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// RDS security group - only accessible from ECS tasks
		dbSecurityGroup, err := ec2.NewSecurityGroup(ctx, "db-sg", &ec2.SecurityGroupArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, stackName)),
			Description: pulumi.String("Security group for RDS database - private access only"),
			VpcId:       vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:       pulumi.String("tcp"),
					FromPort:       pulumi.Int(5432),
					ToPort:         pulumi.Int(5432),
					SecurityGroups: pulumi.StringArray{ecsTasksSG.ID()},
					Description:    pulumi.String("PostgreSQL access from ECS tasks only"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-sg", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 4. Kinesis Data Stream - For data streaming between API Gateway and ECS
		// ===================================================================
		kinesisStream, err := kinesis.NewStream(ctx, "data-stream", &kinesis.StreamArgs{
			Name:            pulumi.String(fmt.Sprintf("%s-%s-data-stream", projectName, stackName)),
			ShardCount:      pulumi.Int(1),
			RetentionPeriod: pulumi.Int(24),
			EncryptionType:  pulumi.String("KMS"),
			KmsKeyId:        kmsKey.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-kinesis-stream", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 5. RDS PostgreSQL - In private subnet with encryption
		// ===================================================================
		dbSubnetGroupName := sanitizeBucketName(fmt.Sprintf("%s-%s-db-subnet-group", projectName, stackName))
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

		// RDS instance with encryption and FedRAMP compliance
		rdsInstance, err := rds.NewInstance(ctx, "citizen-data-db", &rds.InstanceArgs{
			AllocatedStorage:      pulumi.Int(20),
			StorageType:           pulumi.String("gp3"),
			Engine:                pulumi.String("postgres"),
			EngineVersion:         pulumi.String("16.3"),
			InstanceClass:         pulumi.String("db.t3.micro"),
			DbName:                pulumi.String("citizendata"),
			Username:              pulumi.String(dbUsername),
			Password:              pulumi.String(dbPassword),
			VpcSecurityGroupIds:   pulumi.StringArray{dbSecurityGroup.ID()},
			DbSubnetGroupName:     dbSubnetGroup.Name,
			PubliclyAccessible:    pulumi.Bool(false), // Critical: No public access
			StorageEncrypted:      pulumi.Bool(true),
			KmsKeyId:              kmsKey.Arn,
			BackupRetentionPeriod: pulumi.Int(7),
			BackupWindow:          pulumi.String("03:00-04:00"),
			MaintenanceWindow:     pulumi.String("sun:04:00-sun:05:00"),
			DeletionProtection:    pulumi.Bool(false),
			SkipFinalSnapshot:     pulumi.Bool(true),
			EnabledCloudwatchLogsExports: pulumi.StringArray{
				pulumi.String("postgresql"),
				pulumi.String("upgrade"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-rds", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 6. Secrets Manager - For credential management (fetch existing)
		// Note: This assumes secrets already exist. We just reference them.
		// ===================================================================
		// In production, we'd fetch existing secrets like this:
		// existingSecret, err := secretsmanager.LookupSecret(ctx, &secretsmanager.LookupSecretArgs{
		//     Name: pulumi.StringRef("existing-secret-name"),
		// })

		// For this implementation, we'll create a secret for the DB credentials
		// that can be used by ECS tasks (demonstrating Secrets Manager usage)
		dbSecret, err := secretsmanager.NewSecret(ctx, "db-credentials", &secretsmanager.SecretArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-db-credentials", projectName, stackName)),
			Description: pulumi.String("Database credentials for citizen data processing"),
			KmsKeyId:    kmsKey.ID(),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-db-secret", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// Store the credentials in Secrets Manager
		_, err = secretsmanager.NewSecretVersion(ctx, "db-credentials-version", &secretsmanager.SecretVersionArgs{
			SecretId: dbSecret.ID(),
			SecretString: pulumi.Sprintf(`{"username":"%s","password":"%s","engine":"postgres","host":"%s","port":"5432","dbname":"citizendata"}`,
				pulumi.String(dbUsername),
				pulumi.String(dbPassword),
				rdsInstance.Address,
			),
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 7. IAM Roles and Policies - Least privilege
		// ===================================================================

		// API Gateway role for Kinesis access
		apiGatewayRole, err := iam.NewRole(ctx, "api-gateway-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "apigateway.amazonaws.com"
					},
					"Effect": "Allow",
					"Sid": ""
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gw-role", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// API Gateway policy - write to Kinesis
		apiGatewayPolicy, err := iam.NewPolicy(ctx, "api-gateway-policy", &iam.PolicyArgs{
			Description: pulumi.String("Allow API Gateway to write to Kinesis"),
			Policy: pulumi.All(kinesisStream.Arn).ApplyT(func(args []interface{}) string {
				streamArn := args[0].(string)
				return fmt.Sprintf(`{
					"Version": "2012-10-17",
					"Statement": [{
						"Effect": "Allow",
						"Action": [
							"kinesis:PutRecord",
							"kinesis:PutRecords"
						],
						"Resource": "%s"
					}]
				}`, streamArn)
			}).(pulumi.StringOutput),
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "api-gateway-policy-attachment", &iam.RolePolicyAttachmentArgs{
			Role:      apiGatewayRole.Name,
			PolicyArn: apiGatewayPolicy.Arn,
		})
		if err != nil {
			return err
		}

		// ECS task execution role
		ecsTaskExecutionRole, err := iam.NewRole(ctx, "ecs-task-execution-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Effect": "Allow",
					"Sid": ""
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-exec-role", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// Attach AWS managed policy for ECS task execution
		_, err = iam.NewRolePolicyAttachment(ctx, "ecs-task-execution-policy", &iam.RolePolicyAttachmentArgs{
			Role:      ecsTaskExecutionRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		})
		if err != nil {
			return err
		}

		// ECS task role (for application code)
		ecsTaskRole, err := iam.NewRole(ctx, "ecs-task-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Effect": "Allow",
					"Sid": ""
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-task-role", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS task policy - read from Kinesis and Secrets Manager
		ecsTaskPolicy, err := iam.NewPolicy(ctx, "ecs-task-policy", &iam.PolicyArgs{
			Description: pulumi.String("Allow ECS tasks to read from Kinesis and Secrets Manager"),
			Policy: pulumi.All(kinesisStream.Arn, dbSecret.Arn).ApplyT(func(args []interface{}) string {
				streamArn := args[0].(string)
				secretArn := args[1].(string)
				return fmt.Sprintf(`{
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
							"Resource": "%s"
						},
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
							"Resource": "*"
						}
					]
				}`, streamArn, secretArn)
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

		// ===================================================================
		// 8. ECS Cluster and Task Definition
		// ===================================================================
		ecsCluster, err := ecs.NewCluster(ctx, "data-processing-cluster", &ecs.ClusterArgs{
			Name: pulumi.String(fmt.Sprintf("%s-%s-ecs-cluster", projectName, stackName)),
			Settings: ecs.ClusterSettingArray{
				&ecs.ClusterSettingArgs{
					Name:  pulumi.String("containerInsights"),
					Value: pulumi.String("enabled"),
				},
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-cluster", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// CloudWatch log group for ECS tasks
		ecsLogGroup, err := cloudwatch.NewLogGroup(ctx, "ecs-log-group", &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/ecs/%s-%s", projectName, stackName)),
			RetentionInDays: pulumi.Int(7),
			KmsKeyId:        kmsKey.Arn,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-logs", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS task definition
		taskDefinition, err := ecs.NewTaskDefinition(ctx, "data-processor-task", &ecs.TaskDefinitionArgs{
			Family:                  pulumi.String(fmt.Sprintf("%s-%s-data-processor", projectName, stackName)),
			NetworkMode:             pulumi.String("awsvpc"),
			RequiresCompatibilities: pulumi.StringArray{pulumi.String("FARGATE")},
			Cpu:                     pulumi.String("256"),
			Memory:                  pulumi.String("512"),
			ExecutionRoleArn:        ecsTaskExecutionRole.Arn,
			TaskRoleArn:             ecsTaskRole.Arn,
			ContainerDefinitions: pulumi.Sprintf(`[{
				"name": "data-processor",
				"image": "amazon/amazon-ecs-sample",
				"cpu": 256,
				"memory": 512,
				"essential": true,
				"portMappings": [{
					"containerPort": 8080,
					"protocol": "tcp"
				}],
				"logConfiguration": {
					"logDriver": "awslogs",
					"options": {
						"awslogs-group": "%s",
						"awslogs-region": "%s",
						"awslogs-stream-prefix": "ecs"
					}
				},
				"environment": [
					{"name": "KINESIS_STREAM", "value": "%s"},
					{"name": "DB_SECRET_ARN", "value": "%s"}
				]
			}]`, ecsLogGroup.Name, awsRegion, kinesisStream.Name, dbSecret.Arn),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-task-def", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ECS service
		_, err = ecs.NewService(ctx, "data-processor-service", &ecs.ServiceArgs{
			Name:           pulumi.String(fmt.Sprintf("%s-%s-data-processor-svc", projectName, stackName)),
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(1),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				Subnets:        pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID()},
				SecurityGroups: pulumi.StringArray{ecsTasksSG.ID()},
				AssignPublicIp: pulumi.Bool(false),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-ecs-service", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// ===================================================================
		// 9. API Gateway - For secure data ingestion
		// ===================================================================
		restApi, err := apigateway.NewRestApi(ctx, "data-ingestion-api", &apigateway.RestApiArgs{
			Name:        pulumi.String(fmt.Sprintf("%s-%s-data-api", projectName, stackName)),
			Description: pulumi.String("API for secure citizen data ingestion"),
			EndpointConfiguration: &apigateway.RestApiEndpointConfigurationArgs{
				Types: pulumi.String("REGIONAL"),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gateway", projectName, stackName)),
				"Environment": pulumi.String(stackName),
				"Compliance":  pulumi.String("FedRAMP-Moderate"),
			},
		})
		if err != nil {
			return err
		}

		// API Gateway resource (/ingest)
		ingestResource, err := apigateway.NewResource(ctx, "ingest-resource", &apigateway.ResourceArgs{
			RestApi:  restApi.ID(),
			ParentId: restApi.RootResourceId,
			PathPart: pulumi.String("ingest"),
		})
		if err != nil {
			return err
		}

		// POST method with API key authentication
		ingestMethod, err := apigateway.NewMethod(ctx, "ingest-method", &apigateway.MethodArgs{
			RestApi:       restApi.ID(),
			ResourceId:    ingestResource.ID(),
			HttpMethod:    pulumi.String("POST"),
			Authorization: pulumi.String("AWS_IAM"),
		})
		if err != nil {
			return err
		}

		// Integration with Kinesis
		integration, err := apigateway.NewIntegration(ctx, "kinesis-integration", &apigateway.IntegrationArgs{
			RestApi:               restApi.ID(),
			ResourceId:            ingestResource.ID(),
			HttpMethod:            ingestMethod.HttpMethod,
			IntegrationHttpMethod: pulumi.String("POST"),
			Type:                  pulumi.String("AWS"),
			Uri:                   pulumi.Sprintf("arn:aws:apigateway:%s:kinesis:action/PutRecord", awsRegion),
			Credentials:           apiGatewayRole.Arn,
			RequestTemplates: pulumi.StringMap{
				"application/json": pulumi.Sprintf(`{
					"StreamName": "%s",
					"Data": "$util.base64Encode($input.json('$'))",
					"PartitionKey": "$context.requestId"
				}`, kinesisStream.Name),
			},
		})
		if err != nil {
			return err
		}

		// Deploy API
		deployment, err := apigateway.NewDeployment(ctx, "api-deployment", &apigateway.DeploymentArgs{
			RestApi:   restApi.ID(),
			StageName: pulumi.String(stageName),
		}, pulumi.DependsOn([]pulumi.Resource{ingestMethod, integration}))
		if err != nil {
			return err
		}

		// CloudWatch log group for API Gateway access logs
		apiGatewayLogGroup, err := cloudwatch.NewLogGroup(ctx, "api-gateway-log-group", &cloudwatch.LogGroupArgs{
			Name:            pulumi.String(fmt.Sprintf("/aws/apigateway/%s-%s", projectName, stackName)),
			RetentionInDays: pulumi.Int(14),
			KmsKeyId:        kmsKey.Arn,
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gw-logs", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		// IAM role for API Gateway to push logs to CloudWatch
		apiGatewayLogRole, err := iam.NewRole(ctx, "api-gateway-cloudwatch-role", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": { "Service": "apigateway.amazonaws.com" },
					"Action": "sts:AssumeRole"
				}]
			}`),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-gw-cloudwatch-role", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		})
		if err != nil {
			return err
		}

		_, err = iam.NewRolePolicyAttachment(ctx, "api-gateway-cloudwatch-policy", &iam.RolePolicyAttachmentArgs{
			Role:      apiGatewayLogRole.Name,
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"),
		})
		if err != nil {
			return err
		}

		apiGatewayAccount, err := apigateway.NewAccount(ctx, "api-gateway-account", &apigateway.AccountArgs{
			CloudwatchRoleArn: apiGatewayLogRole.Arn,
		})
		if err != nil {
			return err
		}

		// Explicit stage with access logging
		stage, err := apigateway.NewStage(ctx, "api-stage", &apigateway.StageArgs{
			RestApi:    restApi.ID(),
			Deployment: deployment.ID(),
			StageName:  pulumi.String(stageName),
			AccessLogSettings: &apigateway.StageAccessLogSettingsArgs{
				DestinationArn: apiGatewayLogGroup.Arn,
				Format:         pulumi.String(`{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","routeKey":"$context.routeKey","status":"$context.status","integrationStatus":"$context.integration.status","responseLength":"$context.responseLength"}`),
			},
			Tags: pulumi.StringMap{
				"Name":        pulumi.String(fmt.Sprintf("%s-%s-api-stage", projectName, stackName)),
				"Environment": pulumi.String(stackName),
			},
		}, pulumi.DependsOn([]pulumi.Resource{deployment, apiGatewayAccount, apiGatewayLogGroup}))
		if err != nil {
			return err
		}

		// CloudWatch logging for API Gateway
		_, err = apigateway.NewMethodSettings(ctx, "api-method-settings", &apigateway.MethodSettingsArgs{
			RestApi:    restApi.ID(),
			StageName:  pulumi.String(stageName),
			MethodPath: pulumi.String("*/*"),
			Settings: &apigateway.MethodSettingsSettingsArgs{
				LoggingLevel:     pulumi.String("INFO"),
				DataTraceEnabled: pulumi.Bool(true),
				MetricsEnabled:   pulumi.Bool(true),
			},
		}, pulumi.DependsOn([]pulumi.Resource{stage}))
		if err != nil {
			return err
		}

		// ===================================================================
		// Exports - Stack outputs
		// ===================================================================
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("vpcCidr", vpc.CidrBlock)
		ctx.Export("publicSubnet1Id", publicSubnet1.ID())
		ctx.Export("publicSubnet2Id", publicSubnet2.ID())
		ctx.Export("privateSubnet1Id", privateSubnet1.ID())
		ctx.Export("privateSubnet2Id", privateSubnet2.ID())
		ctx.Export("kmsKeyId", kmsKey.ID())
		ctx.Export("kmsKeyArn", kmsKey.Arn)
		ctx.Export("kinesisStreamName", kinesisStream.Name)
		ctx.Export("kinesisStreamArn", kinesisStream.Arn)
		ctx.Export("rdsEndpoint", rdsInstance.Endpoint)
		ctx.Export("rdsInstanceId", rdsInstance.ID())
		ctx.Export("rdsInstanceArn", rdsInstance.Arn)
		ctx.Export("dbSecretArn", dbSecret.Arn)
		ctx.Export("ecsClusterName", ecsCluster.Name)
		ctx.Export("ecsClusterArn", ecsCluster.Arn)
		ctx.Export("ecsTaskDefinitionArn", taskDefinition.Arn)
		ctx.Export("apiGatewayId", restApi.ID())
		ctx.Export("apiGatewayUrl", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/%s/ingest", restApi.ID(), awsRegion, stageName))
		ctx.Export("apiGatewayEndpoint", pulumi.Sprintf("https://%s.execute-api.%s.amazonaws.com/%s/ingest", restApi.ID(), awsRegion, stageName))

		return nil
	})
}
```
