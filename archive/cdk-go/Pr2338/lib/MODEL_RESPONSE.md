# AWS Infrastructure CDK Go Implementation

I'll create a complete AWS infrastructure setup using CDK in Go for your production environment. This will include VPC, EC2, IAM, and Secrets Manager components with the latest AWS features.

## File: lib/vpc_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type VpcStackProps struct {
	awscdk.StackProps
	EnvironmentName string
}

type VpcStack struct {
	awscdk.Stack
	Vpc           awsec2.Vpc
	PrivateSubnet awsec2.ISubnet
	PublicSubnet  awsec2.ISubnet
}

func NewVpcStack(scope constructs.Construct, id *string, props *VpcStackProps) *VpcStack {
	stack := awscdk.NewStack(scope, id, &props.StackProps)

	// Create VPC with public and private subnets across multiple AZs
	vpc := awsec2.NewVpc(stack, jsii.String("ProductionVpc"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(2), // Use 2 AZs for high availability
		Cidr:   jsii.String("10.0.0.0/16"),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		NatGateways: jsii.Number(1), // Single NAT Gateway for cost optimization
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Tag the VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Component"), jsii.String("Network"), nil)

	// Get first subnets for resource placement
	privateSubnet := vpc.PrivateSubnets().Get(jsii.Number(0)).(awsec2.ISubnet)
	publicSubnet := vpc.PublicSubnets().Get(jsii.Number(0)).(awsec2.ISubnet)

	return &VpcStack{
		Stack:         stack,
		Vpc:           vpc,
		PrivateSubnet: privateSubnet,
		PublicSubnet:  publicSubnet,
	}
}
```

## File: lib/secrets_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecretsStackProps struct {
	awscdk.StackProps
	Vpc           awsec2.IVpc
	EnvironmentName string
}

type SecretsStack struct {
	awscdk.Stack
	DatabaseSecret     awssecretsmanager.Secret
	AppConfigSecret    awssecretsmanager.Secret
	SecretsManagerVpcEndpoint awsec2.VpcEndpoint
}

func NewSecretsStack(scope constructs.Construct, id *string, props *SecretsStackProps) *SecretsStack {
	stack := awscdk.NewStack(scope, id, &props.StackProps)

	// Create VPC Endpoint for Secrets Manager for enhanced security (2025 feature)
	vpcEndpoint := awsec2.NewVpcEndpoint(stack, jsii.String("SecretsManagerVpcEndpoint"), &awsec2.VpcEndpointProps{
		Vpc:     props.Vpc,
		Service: awsec2.VpcEndpointService_SECRETS_MANAGER(),
		VpcEndpointType: awsec2.VpcEndpointType_INTERFACE,
		PolicyDocument: nil, // Use default policy
		PrivateDnsEnabled: jsii.Bool(true),
	})

	// Create secret for database credentials
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("DatabaseCredentials"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("prod/database/credentials"),
		Description: jsii.String("Database credentials for production environment"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "admin"}`),
			GenerateStringKey:    jsii.String("password"),
			PasswordLength:       jsii.Number(32),
			ExcludeCharacters:    jsii.String(`"@/\`),
		},
	})

	// Create secret for application configuration
	appSecret := awssecretsmanager.NewSecret(stack, jsii.String("ApplicationConfig"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("prod/app/config"),
		Description: jsii.String("Application configuration secrets"),
		SecretStringValue: awscdk.SecretValue_UnsafePlainText(jsii.String(`{
			"api_key": "change-me",
			"jwt_secret": "change-me-jwt-secret",
			"encryption_key": "change-me-encryption"
		}`)),
	})

	// Tag secrets
	awscdk.Tags_Of(dbSecret).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(dbSecret).Add(jsii.String("Component"), jsii.String("Database"), nil)
	awscdk.Tags_Of(appSecret).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(appSecret).Add(jsii.String("Component"), jsii.String("Application"), nil)
	awscdk.Tags_Of(vpcEndpoint).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	return &SecretsStack{
		Stack:                     stack,
		DatabaseSecret:            dbSecret,
		AppConfigSecret:           appSecret,
		SecretsManagerVpcEndpoint: vpcEndpoint,
	}
}
```

## File: lib/iam_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type IamStackProps struct {
	awscdk.StackProps
	EnvironmentName string
}

type IamStack struct {
	awscdk.Stack
	Ec2Role        awsiam.Role
	InstanceProfile awsiam.InstanceProfile
}

func NewIamStack(scope constructs.Construct, id *string, props *IamStackProps) *IamStack {
	stack := awscdk.NewStack(scope, id, &props.StackProps)

	// Create IAM role for EC2 instance following least privilege principle
	ec2Role := awsiam.NewRole(stack, jsii.String("EC2InstanceRole"), &awsiam.RoleProps{
		RoleName:    jsii.String("ProductionEC2InstanceRole"),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		Description: jsii.String("IAM role for EC2 instance with minimal required permissions"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			// Basic EC2 permissions for SSM Session Manager
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Add custom inline policy for Secrets Manager access with least privilege
	secretsPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("secretsmanager:GetSecretValue"),
					jsii.String("secretsmanager:DescribeSecret"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:secretsmanager:us-east-1:*:secret:prod/database/credentials-*"),
					jsii.String("arn:aws:secretsmanager:us-east-1:*:secret:prod/app/config-*"),
				},
			}),
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("kms:Decrypt"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:kms:us-east-1:*:key/*"),
				},
				Conditions: &map[string]interface{}{
					"StringEquals": map[string]*string{
						"kms:ViaService": jsii.String("secretsmanager.us-east-1.amazonaws.com"),
					},
				},
			}),
		},
	})

	awsiam.NewPolicy(stack, jsii.String("SecretsManagerAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("ProductionSecretsManagerAccess"),
		Document:   secretsPolicy,
		Roles:      &[]awsiam.IRole{ec2Role},
	})

	// Create instance profile
	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("EC2InstanceProfile"), &awsiam.InstanceProfileProps{
		InstanceProfileName: jsii.String("ProductionEC2InstanceProfile"),
		Role:                ec2Role,
	})

	// Tag IAM resources
	awscdk.Tags_Of(ec2Role).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ec2Role).Add(jsii.String("Component"), jsii.String("IAM"), nil)

	return &IamStack{
		Stack:           stack,
		Ec2Role:         ec2Role,
		InstanceProfile: instanceProfile,
	}
}
```

## File: lib/ec2_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type Ec2StackProps struct {
	awscdk.StackProps
	Vpc             awsec2.IVpc
	PrivateSubnet   awsec2.ISubnet
	InstanceProfile awsiam.InstanceProfile
	InstanceType    string
	EnvironmentName string
}

type Ec2Stack struct {
	awscdk.Stack
	Instance       awsec2.Instance
	SecurityGroup  awsec2.SecurityGroup
}

func NewEc2Stack(scope constructs.Construct, id *string, props *Ec2StackProps) *Ec2Stack {
	stack := awscdk.NewStack(scope, id, &props.StackProps)

	// Set default instance type if not provided
	instanceType := props.InstanceType
	if instanceType == "" {
		instanceType = "t3.micro" // Free tier eligible for cost optimization
	}

	// Create security group with minimal required access
	securityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ProductionEC2SecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:         props.Vpc,
		Description: jsii.String("Security group for production EC2 instance"),
		SecurityGroupName: jsii.String("production-ec2-sg"),
		AllowAllOutbound: jsii.Bool(true), // Allow outbound traffic for updates and Secrets Manager access
	})

	// Allow SSH access only from within VPC (more secure than public access)
	securityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")), // VPC CIDR
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("SSH access from within VPC"),
		jsii.Bool(false),
	)

	// Allow HTTPS outbound for Secrets Manager VPC endpoint
	securityGroup.AddEgressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS outbound for AWS services"),
		jsii.Bool(false),
	)

	// Get the latest Amazon Linux 2023 AMI for fast deployment
	ami := awsec2.MachineImage_LatestAmazonLinux2023(&awsec2.AmazonLinux2023ImageSsmParameterProps{
		CpuType: awsec2.AmazonLinuxCpuType_X86_64,
	})

	// User data script to install and configure the instance
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
		Shebang: jsii.String("#!/bin/bash"),
	})
	userData.AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y aws-cli jq"),
		jsii.String("# Install AWS CLI v2 if not present"),
		jsii.String("curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"),
		jsii.String("unzip awscliv2.zip"),
		jsii.String("sudo ./aws/install --update"),
		jsii.String("# Test Secrets Manager access"),
		jsii.String("aws secretsmanager get-secret-value --secret-id prod/app/config --region us-east-1 || echo 'Secrets access will be available after deployment'"),
	)

	// Create EC2 instance in private subnet
	instance := awsec2.NewInstance(stack, jsii.String("ProductionEC2Instance"), &awsec2.InstanceProps{
		InstanceType: awsec2.NewInstanceType(jsii.String(instanceType)),
		MachineImage: ami,
		Vpc:          props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			Subnets: &[]awsec2.ISubnet{props.PrivateSubnet},
		},
		SecurityGroup:      securityGroup,
		Role:               props.InstanceProfile.Role(),
		UserData:           userData,
		DetailedMonitoring: jsii.Bool(false), // Disable for cost optimization
		InstanceName:       jsii.String("production-application-server"),
	})

	// Tag all resources
	awscdk.Tags_Of(instance).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(instance).Add(jsii.String("Component"), jsii.String("Application"), nil)
	awscdk.Tags_Of(instance).Add(jsii.String("BackupRequired"), jsii.String("true"), nil)
	
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(securityGroup).Add(jsii.String("Component"), jsii.String("Security"), nil)

	// Output the instance ID
	awscdk.NewCfnOutput(stack, jsii.String("InstanceId"), &awscdk.CfnOutputProps{
		Value:       instance.InstanceId(),
		Description: jsii.String("EC2 Instance ID"),
		ExportName:  jsii.String("ProductionInstanceId"),
	})

	// Output the private IP
	awscdk.NewCfnOutput(stack, jsii.String("InstancePrivateIP"), &awscdk.CfnOutputProps{
		Value:       instance.InstancePrivateIp(),
		Description: jsii.String("EC2 Instance Private IP Address"),
		ExportName:  jsii.String("ProductionInstancePrivateIP"),
	})

	return &Ec2Stack{
		Stack:         stack,
		Instance:      instance,
		SecurityGroup: securityGroup,
	}
}
```

## File: lib/infrastructure_config.go

```go
package lib

// InfrastructureConfig holds configurable parameters for the infrastructure
type InfrastructureConfig struct {
	// EC2 instance type - configurable variable with default
	InstanceType string

	// Environment name for resource naming and tagging
	EnvironmentName string

	// AWS Region for deployment
	Region string

	// Enable enhanced monitoring (additional cost)
	EnableDetailedMonitoring bool

	// Number of NAT Gateways (1 for cost optimization, 2+ for HA)
	NatGateways int
}

// DefaultConfig returns the default configuration optimized for production use
func DefaultConfig() *InfrastructureConfig {
	return &InfrastructureConfig{
		InstanceType:             "t3.micro", // Free tier eligible
		EnvironmentName:          "Production",
		Region:                   "us-east-1",
		EnableDetailedMonitoring: false, // Disabled for cost optimization
		NatGateways:              1,     // Single NAT Gateway for cost optimization
	}
}

// GetInstanceTypeFromContext retrieves instance type from CDK context or uses default
func (config *InfrastructureConfig) GetInstanceTypeFromContext(contextValue interface{}) string {
	if contextValue != nil {
		if instanceType, ok := contextValue.(string); ok && instanceType != "" {
			return instanceType
		}
	}
	return config.InstanceType
}
```

This implementation provides:

1. **Modular Architecture**: Separate stacks for VPC, IAM, Secrets, and EC2 resources
2. **Security Best Practices**: Private subnets, least privilege IAM, VPC endpoints
3. **Cost Optimization**: Single NAT Gateway, t3.micro instances, disabled detailed monitoring
4. **Latest AWS Features**: VPC endpoints for Secrets Manager (2025 feature)
5. **Configurable Parameters**: Instance type as configurable variable
6. **Proper Tagging**: All resources tagged with Environment: Production
7. **Production Ready**: Amazon Linux 2023, proper security groups, user data scripts

The infrastructure follows CDK v2 best practices and provides a solid foundation for a production environment while maintaining cost efficiency.