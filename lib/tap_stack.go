package main

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	jsii "github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/apigatewaydeployment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/apigatewayintegration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/apigatewaymethod"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/apigatewayresource"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/apigatewayrestapi"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchmetricalarm"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dynamodbtable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lambdafunction"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lambdapermission"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketobject"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/ssmparameter"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpcendpoint"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackConfig struct {
	Region            string
	Environment       string
	AppName           string
	EnvironmentSuffix string
	StateBucket       string
	StateBucketRegion string
}

type TapStack struct {
	Stack      cdktf.TerraformStack
	Config     *TapStackConfig
	EnvPrefix  string
	Networking *NetworkingResources
	Security   *SecurityResources
	Lambda     *LambdaResources
	Monitoring *MonitoringResources
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) *TapStack {
	tfStack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = config.EnvironmentSuffix // Default from props
	}

	// Create environment prefix for resource naming
	envPrefix := fmt.Sprintf("%s-xk9f", environmentSuffix)

	stack := &TapStack{
		Stack:     tfStack,
		Config:    config,
		EnvPrefix: envPrefix,
	}

	// Get state bucket configuration from environment variables
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = config.StateBucket // Default from props
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = config.StateBucketRegion // Default from props
	}

	// Configure S3 backend for remote state
	cdktf.NewS3Backend(stack.Stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(fmt.Sprintf("%s/%s.tfstate", environmentSuffix, id)),
		Region: jsii.String(stateBucketRegion),
	})

	// AWS Provider
	provider.NewAwsProvider(stack.Stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(config.Region),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{{
			Tags: &map[string]*string{
				"Environment": jsii.String(config.Environment),
				"Application": jsii.String(config.AppName),
				"ManagedBy":   jsii.String("cdktf"),
			},
		}},
	})

	// Initialize components in order
	stack.Networking = NewNetworkingResources(stack)
	stack.Security = NewSecurityResources(stack)
	stack.Lambda = NewLambdaResources(stack)
	stack.Monitoring = NewMonitoringResources(stack)

	// Create outputs
	stack.createOutputs()

	return stack
}

func main() {
	app := cdktf.NewApp(nil)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr963"
	}

	config := &TapStackConfig{
		Region:            "us-east-1",
		Environment:       "production",
		AppName:           "trainr963-" + environmentSuffix,
		EnvironmentSuffix: environmentSuffix,
		StateBucket:       "terraform-state-bucket-" + environmentSuffix,
		StateBucketRegion: "us-east-1",
	}

	NewTapStack(app, "TapStack"+environmentSuffix, config)

	app.Synth()
}

func (stack *TapStack) createOutputs() {
	// VPC outputs
	cdktf.NewTerraformOutput(stack.Stack, str("vpc-id"), &cdktf.TerraformOutputConfig{
		Value: stack.Networking.VPC.Id(),
	})

	// API Gateway output
	if stack.Lambda != nil && stack.Lambda.APIGateway != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("api-gateway-url"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.APIGateway.Id(),
		})
	}

	// DynamoDB table output
	if stack.Lambda != nil && stack.Lambda.DynamoDBTable != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("dynamodb-table-name"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.DynamoDBTable.Name(),
		})
	}

	// S3 bucket output
	if stack.Lambda != nil && stack.Lambda.S3Bucket != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("s3-bucket-name"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.S3Bucket.Id(),
		})
	}
}

// NetworkingResources contains all networking-related AWS resources
type NetworkingResources struct {
	VPC               vpc.Vpc
	PublicSubnets     []subnet.Subnet
	PrivateSubnets    []subnet.Subnet
	InternetGateway   internetgateway.InternetGateway
	NatGateway        natgateway.NatGateway
	PublicRouteTable  routetable.RouteTable
	PrivateRouteTable routetable.RouteTable
	SecurityGroups    map[string]securitygroup.SecurityGroup
	VPCEndpoints      map[string]vpcendpoint.VpcEndpoint
}

// SecurityResources contains all security-related AWS resources
type SecurityResources struct {
	LambdaExecutionRole iamrole.IamRole
	SecurityGroups      map[string]securitygroup.SecurityGroup
}

// MonitoringResources contains all monitoring-related AWS resources
type MonitoringResources struct {
	LambdaErrorAlarms map[string]cloudwatchmetricalarm.CloudwatchMetricAlarm
}

// LambdaResources contains all Lambda-related AWS resources
type LambdaResources struct {
	Functions     map[string]lambdafunction.LambdaFunction
	APIGateway    apigatewayrestapi.ApiGatewayRestApi
	DynamoDBTable dynamodbtable.DynamodbTable
	S3Bucket      s3bucket.S3Bucket
	LogGroups     map[string]cloudwatchloggroup.CloudwatchLogGroup
	SSMParameters map[string]ssmparameter.SsmParameter
}

func NewNetworkingResources(stack *TapStack) *NetworkingResources {
	resources := &NetworkingResources{
		SecurityGroups: make(map[string]securitygroup.SecurityGroup),
		VPCEndpoints:   make(map[string]vpcendpoint.VpcEndpoint),
	}

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack.Stack, str("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: str("available"),
	})

	// Create VPC
	resources.VPC = vpc.NewVpc(stack.Stack, str("vpc"), &vpc.VpcConfig{
		CidrBlock:          str("10.0.0.0/16"),
		EnableDnsHostnames: boolPtr(true),
		EnableDnsSupport:   boolPtr(true),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-vpc"),
		},
	})

	// Create Internet Gateway
	resources.InternetGateway = internetgateway.NewInternetGateway(stack.Stack, str("igw"), &internetgateway.InternetGatewayConfig{
		VpcId: resources.VPC.Id(),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-igw"),
		},
	})

	// Create subnets across multiple AZs
	for i := 0; i < 2; i++ {
		// Public subnet
		publicCidr := fmt.Sprintf("10.0.%d.0/24", i*10+1)
		publicSubnet := subnet.NewSubnet(stack.Stack, str(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:               resources.VPC.Id(),
			CidrBlock:           str(publicCidr),
			AvailabilityZone:    getAvailabilityZone(azs, i),
			MapPublicIpOnLaunch: boolPtr(true),
			Tags: &map[string]*string{
				"Name": str(fmt.Sprintf("%s-public-subnet-%d", stack.EnvPrefix, i)),
				"Type": str("public"),
			},
		})
		resources.PublicSubnets = append(resources.PublicSubnets, publicSubnet)

		// Private subnet
		privateCidr := fmt.Sprintf("10.0.%d.0/24", i*10+100)
		privateSubnet := subnet.NewSubnet(stack.Stack, str(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            resources.VPC.Id(),
			CidrBlock:        str(privateCidr),
			AvailabilityZone: getAvailabilityZone(azs, i),
			Tags: &map[string]*string{
				"Name": str(fmt.Sprintf("%s-private-subnet-%d", stack.EnvPrefix, i)),
				"Type": str("private"),
			},
		})
		resources.PrivateSubnets = append(resources.PrivateSubnets, privateSubnet)
	}

	// Create Elastic IP for NAT Gateway
	natEip := eip.NewEip(stack.Stack, str("nat-eip"), &eip.EipConfig{
		Domain: str("vpc"),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-nat-eip"),
		},
	})

	// Create NAT Gateway (only one for cost optimization)
	resources.NatGateway = natgateway.NewNatGateway(stack.Stack, str("nat-gw"), &natgateway.NatGatewayConfig{
		AllocationId: natEip.Id(),
		SubnetId:     resources.PublicSubnets[0].Id(),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-nat-gw"),
		},
	})

	// Create route tables
	resources.PublicRouteTable = routetable.NewRouteTable(stack.Stack, str("public-rt"), &routetable.RouteTableConfig{
		VpcId: resources.VPC.Id(),
		Route: &[]*routetable.RouteTableRoute{{
			CidrBlock: str("0.0.0.0/0"),
			GatewayId: resources.InternetGateway.Id(),
		}},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-public-rt"),
		},
	})

	resources.PrivateRouteTable = routetable.NewRouteTable(stack.Stack, str("private-rt"), &routetable.RouteTableConfig{
		VpcId: resources.VPC.Id(),
		Route: &[]*routetable.RouteTableRoute{{
			CidrBlock:    str("0.0.0.0/0"),
			NatGatewayId: resources.NatGateway.Id(),
		}},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-private-rt"),
		},
	})

	// Associate subnets with route tables
	for i, subnet := range resources.PublicSubnets {
		routetableassociation.NewRouteTableAssociation(stack.Stack, str(fmt.Sprintf("public-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: resources.PublicRouteTable.Id(),
		})
	}

	for i, subnet := range resources.PrivateSubnets {
		routetableassociation.NewRouteTableAssociation(stack.Stack, str(fmt.Sprintf("private-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: resources.PrivateRouteTable.Id(),
		})
	}

	// Create VPC endpoints for AWS services
	resources.createVPCEndpoints(stack)

	return resources
}

func getAvailabilityZone(azs dataawsavailabilityzones.DataAwsAvailabilityZones, index int) *string {
	// Use Fn.element to safely access the list element
	// For now, use hardcoded AZ names
	azName := "us-east-1a"
	if index == 1 {
		azName = "us-east-1b"
	}
	return &azName
}

func (n *NetworkingResources) createVPCEndpoints(stack *TapStack) {
	// DynamoDB endpoint
	n.VPCEndpoints["dynamodb"] = vpcendpoint.NewVpcEndpoint(stack.Stack, str("dynamodb-endpoint"), &vpcendpoint.VpcEndpointConfig{
		VpcId:           n.VPC.Id(),
		ServiceName:     str("com.amazonaws." + stack.Config.Region + ".dynamodb"),
		VpcEndpointType: str("Gateway"),
		RouteTableIds: &[]*string{
			n.PublicRouteTable.Id(),
			n.PrivateRouteTable.Id(),
		},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-dynamodb-endpoint"),
		},
	})

	// S3 endpoint
	n.VPCEndpoints["s3"] = vpcendpoint.NewVpcEndpoint(stack.Stack, str("s3-endpoint"), &vpcendpoint.VpcEndpointConfig{
		VpcId:           n.VPC.Id(),
		ServiceName:     str("com.amazonaws." + stack.Config.Region + ".s3"),
		VpcEndpointType: str("Gateway"),
		RouteTableIds: &[]*string{
			n.PublicRouteTable.Id(),
			n.PrivateRouteTable.Id(),
		},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-s3-endpoint"),
		},
	})
}

func NewSecurityResources(stack *TapStack) *SecurityResources {
	resources := &SecurityResources{
		SecurityGroups: make(map[string]securitygroup.SecurityGroup),
	}

	// Lambda execution role
	resources.LambdaExecutionRole = iamrole.NewIamRole(stack.Stack, str("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: str(stack.EnvPrefix + "-lambda-execution-role"),
		AssumeRolePolicy: str(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-lambda-execution-role"),
		},
	})

	// Attach managed policies with minimal permissions
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-basic-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-vpc-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-xray-write"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
	})

	// Create custom inline policy for minimal DynamoDB and SSM access
	// Note: This would be implemented with a custom policy document for production use

	// Create security groups
	resources.createSecurityGroups(stack)

	return resources
}

func (s *SecurityResources) createSecurityGroups(stack *TapStack) {
	// Lambda security group
	s.SecurityGroups["lambda"] = securitygroup.NewSecurityGroup(stack.Stack, str("lambda-sg"), &securitygroup.SecurityGroupConfig{
		Name:        str(stack.EnvPrefix + "-lambda-sg"),
		Description: str("Security group for Lambda functions"),
		VpcId:       stack.Networking.VPC.Id(),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-lambda-sg"),
		},
	})

	// Egress rules for Lambda (HTTPS outbound)
	securitygrouprule.NewSecurityGroupRule(stack.Stack, str("lambda-egress-https"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            str("egress"),
		FromPort:        num(443),
		ToPort:          num(443),
		Protocol:        str("tcp"),
		CidrBlocks:      &[]*string{str("0.0.0.0/0")},
		SecurityGroupId: s.SecurityGroups["lambda"].Id(),
		Description:     str("HTTPS outbound access"),
	})

	securitygrouprule.NewSecurityGroupRule(stack.Stack, str("lambda-egress-http"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            str("egress"),
		FromPort:        num(80),
		ToPort:          num(80),
		Protocol:        str("tcp"),
		CidrBlocks:      &[]*string{str("0.0.0.0/0")},
		SecurityGroupId: s.SecurityGroups["lambda"].Id(),
		Description:     str("HTTP outbound access"),
	})
}

func NewMonitoringResources(stack *TapStack) *MonitoringResources {
	resources := &MonitoringResources{
		LambdaErrorAlarms: make(map[string]cloudwatchmetricalarm.CloudwatchMetricAlarm),
	}

	// Create CloudWatch alarms for Lambda functions
	for funcName, lambdaFunc := range stack.Lambda.Functions {
		resources.LambdaErrorAlarms[funcName] = cloudwatchmetricalarm.NewCloudwatchMetricAlarm(stack.Stack, str(funcName+"-error-alarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
			AlarmName:          str(stack.EnvPrefix + "-" + funcName + "-errors"),
			ComparisonOperator: str("GreaterThanOrEqualToThreshold"),
			EvaluationPeriods:  num(1),
			MetricName:         str("Errors"),
			Namespace:          str("AWS/Lambda"),
			Period:             num(300), // 5 minutes
			Statistic:          str("Sum"),
			Threshold:          num(5),
			AlarmDescription:   str("Lambda function " + funcName + " error alarm"),
			AlarmActions:       &[]*string{},
			Dimensions: &map[string]*string{
				"FunctionName": lambdaFunc.FunctionName(),
			},
			Tags: &map[string]*string{
				"Name": str(stack.EnvPrefix + "-" + funcName + "-error-alarm"),
			},
		})
	}

	return resources
}

func NewLambdaResources(stack *TapStack) *LambdaResources {
	resources := &LambdaResources{
		Functions:     make(map[string]lambdafunction.LambdaFunction),
		LogGroups:     make(map[string]cloudwatchloggroup.CloudwatchLogGroup),
		SSMParameters: make(map[string]ssmparameter.SsmParameter),
	}

	// Create S3 bucket for deployment packages
	resources.createS3Bucket(stack)

	// Create DynamoDB table
	resources.createDynamoDBTable(stack)

	// Create SSM parameters
	resources.createSSMParameters(stack)

	// Create Lambda functions
	resources.createLambdaFunctions(stack)

	// Create API Gateway
	resources.createAPIGateway(stack)

	return resources
}

func (l *LambdaResources) createS3Bucket(stack *TapStack) {
	// S3 bucket for Lambda deployment packages
	l.S3Bucket = s3bucket.NewS3Bucket(stack.Stack, str("lambda-deployment-bucket"), &s3bucket.S3BucketConfig{
		Bucket: str(stack.EnvPrefix + "-s3-lambda-deploy-" + stack.Config.Environment),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-s3-lambda-deploy-" + stack.Config.Environment),
		},
	})

	// Enable versioning
	s3bucketversioning.NewS3BucketVersioningA(stack.Stack, str("lambda-bucket-versioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: l.S3Bucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: str("Enabled"),
		},
	})

	// Enable encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfigurationA(stack.Stack, str("lambda-bucket-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: l.S3Bucket.Id(),
		Rule: &[]*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleA{{
			ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA{
				SseAlgorithm: str("AES256"),
			},
		}},
	})

	// HTTPS-only bucket policy
	policyDoc := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"` + *l.S3Bucket.Arn() + `",
					"` + *l.S3Bucket.Arn() + `/*"
				],
				"Condition": {
					"Bool": {
						"aws:SecureTransport": "false"
					}
				}
			}
		]
	}`

	s3bucketpolicy.NewS3BucketPolicy(stack.Stack, str("lambda-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: l.S3Bucket.Id(),
		Policy: str(policyDoc),
	})
}

func (l *LambdaResources) createDynamoDBTable(stack *TapStack) {
	l.DynamoDBTable = dynamodbtable.NewDynamodbTable(stack.Stack, str("sessions-table"), &dynamodbtable.DynamodbTableConfig{
		Name:        str(stack.EnvPrefix + "-dynamodb-sessions-" + stack.Config.Environment),
		BillingMode: str("PAY_PER_REQUEST"),
		HashKey:     str("session_id"),
		Attribute: &[]*dynamodbtable.DynamodbTableAttribute{{
			Name: str("session_id"),
			Type: str("S"),
		}},
		ServerSideEncryption: &dynamodbtable.DynamodbTableServerSideEncryption{
			Enabled: bool(true),
		},
		PointInTimeRecovery: &dynamodbtable.DynamodbTablePointInTimeRecovery{
			Enabled: bool(true),
		},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-dynamodb-sessions-" + stack.Config.Environment),
		},
	})
}

func (l *LambdaResources) createSSMParameters(stack *TapStack) {
	l.SSMParameters["api-key"] = ssmparameter.NewSsmParameter(stack.Stack, str("api-key-param"), &ssmparameter.SsmParameterConfig{
		Name:        str("/" + stack.EnvPrefix + "/api-key/" + stack.Config.Environment),
		Type:        str("SecureString"),
		Value:       str("your-api-key-here"),
		Description: str("API key for external services"),
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-ssm-api-key-" + stack.Config.Environment),
		},
	})
}

func (l *LambdaResources) createLambdaFunctions(stack *TapStack) {
	// Create Lambda function code
	lambdaCode := `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
	console.log('Event:', JSON.stringify(event));
	
	const response = {
		statusCode: 200,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
		},
		body: JSON.stringify({
			message: 'Hello from Lambda!',
			requestId: event.requestContext?.requestId || 'unknown'
		})
	};
	
	return response;
};`

	// Create ZIP file in memory
	var buf bytes.Buffer
	zipWriter := zip.NewWriter(&buf)

	file, err := zipWriter.Create("index.js")
	if err != nil {
		panic(err)
	}

	_, err = file.Write([]byte(lambdaCode))
	if err != nil {
		panic(err)
	}

	err = zipWriter.Close()
	if err != nil {
		panic(err)
	}

	// Upload Lambda code to S3
	// Use base64 encoding for binary content
	lambdaZip := s3bucketobject.NewS3BucketObject(stack.Stack, str("lambda-code"), &s3bucketobject.S3BucketObjectConfig{
		Bucket:        l.S3Bucket.Id(),
		Key:           str("lambda-functions/api-handler.zip"),
		ContentBase64: str(base64.StdEncoding.EncodeToString(buf.Bytes())),
		ContentType:   str("application/zip"),
	})

	functionNames := []string{"get-handler", "post-handler", "put-handler", "delete-handler"}

	for _, funcName := range functionNames {
		// Create CloudWatch Log Group
		l.LogGroups[funcName] = cloudwatchloggroup.NewCloudwatchLogGroup(stack.Stack, str(funcName+"-logs"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
			Name:            str("/aws/lambda/" + stack.EnvPrefix + "-lambda-" + funcName + "-" + stack.Config.Environment),
			RetentionInDays: num(30),
			Tags: &map[string]*string{
				"Name": str(stack.EnvPrefix + "-lambda-" + funcName + "-logs-" + stack.Config.Environment),
			},
		})

		// Create Lambda function
		l.Functions[funcName] = lambdafunction.NewLambdaFunction(stack.Stack, str(funcName), &lambdafunction.LambdaFunctionConfig{
			FunctionName: str(stack.EnvPrefix + "-lambda-" + funcName + "-" + stack.Config.Environment),
			Runtime:      str("nodejs18.x"),
			Handler:      str("index.handler"),
			Role:         stack.Security.LambdaExecutionRole.Arn(),
			S3Bucket:     l.S3Bucket.Id(),
			S3Key:        lambdaZip.Key(),
			Timeout:      num(30),
			Environment: &lambdafunction.LambdaFunctionEnvironment{
				Variables: &map[string]*string{
					"LOG_LEVEL":      str("INFO"),
					"DEBUG_ENABLED":  str("false"),
					"DYNAMODB_TABLE": l.DynamoDBTable.Name(),
					"REGION":         str(stack.Config.Region),
				},
			},
			VpcConfig: &lambdafunction.LambdaFunctionVpcConfig{
				SubnetIds:        convertSubnetIds(stack.Networking.PrivateSubnets),
				SecurityGroupIds: &[]*string{stack.Security.SecurityGroups["lambda"].Id()},
			},
			TracingConfig: &lambdafunction.LambdaFunctionTracingConfig{
				Mode: str("Active"),
			},
			DependsOn: &[]cdktf.ITerraformDependable{l.LogGroups[funcName]},
			Tags: &map[string]*string{
				"Name": str(stack.EnvPrefix + "-lambda-" + funcName + "-" + stack.Config.Environment),
			},
		})
	}
}

func (l *LambdaResources) createAPIGateway(stack *TapStack) {
	// Create API Gateway
	l.APIGateway = apigatewayrestapi.NewApiGatewayRestApi(stack.Stack, str("api-gateway"), &apigatewayrestapi.ApiGatewayRestApiConfig{
		Name:        str(stack.EnvPrefix + "-apigateway-api-" + stack.Config.Environment),
		Description: str("API Gateway for " + stack.EnvPrefix),
		EndpointConfiguration: &apigatewayrestapi.ApiGatewayRestApiEndpointConfiguration{
			Types: &[]*string{str("REGIONAL")},
		},
		Tags: &map[string]*string{
			"Name": str(stack.EnvPrefix + "-apigateway-api-" + stack.Config.Environment),
		},
	})

	// Create API resource
	apiResource := apigatewayresource.NewApiGatewayResource(stack.Stack, str("api-resource"), &apigatewayresource.ApiGatewayResourceConfig{
		RestApiId: l.APIGateway.Id(),
		ParentId:  l.APIGateway.RootResourceId(),
		PathPart:  str("tasks"),
	})

	// HTTP methods and their corresponding Lambda functions
	methods := map[string]string{
		"GET":    "get-handler",
		"POST":   "post-handler",
		"PUT":    "put-handler",
		"DELETE": "delete-handler",
	}

	for method, funcName := range methods {
		// Create method
		apiMethod := apigatewaymethod.NewApiGatewayMethod(stack.Stack, str("method-"+method), &apigatewaymethod.ApiGatewayMethodConfig{
			RestApiId:     l.APIGateway.Id(),
			ResourceId:    apiResource.Id(),
			HttpMethod:    str(method),
			Authorization: str("NONE"),
		})

		// Create integration
		apigatewayintegration.NewApiGatewayIntegration(stack.Stack, str("integration-"+method), &apigatewayintegration.ApiGatewayIntegrationConfig{
			RestApiId:             l.APIGateway.Id(),
			ResourceId:            apiResource.Id(),
			HttpMethod:            apiMethod.HttpMethod(),
			IntegrationHttpMethod: str("POST"),
			Type:                  str("AWS_PROXY"),
			Uri:                   l.Functions[funcName].InvokeArn(),
		})

		// Grant API Gateway permission to invoke Lambda
		lambdapermission.NewLambdaPermission(stack.Stack, str("api-lambda-permission-"+method), &lambdapermission.LambdaPermissionConfig{
			StatementId:  str("AllowExecutionFromAPIGateway-" + method),
			Action:       str("lambda:InvokeFunction"),
			FunctionName: l.Functions[funcName].FunctionName(),
			Principal:    str("apigateway.amazonaws.com"),
			SourceArn:    l.APIGateway.ExecutionArn(),
		})
	}

	// Deploy API Gateway - commented out as it needs to be deployed after methods
	// The deployment will be done manually after methods and integrations are created
	apigatewaydeployment.NewApiGatewayDeployment(stack.Stack, str("api-deployment"), &apigatewaydeployment.ApiGatewayDeploymentConfig{
		RestApiId:   l.APIGateway.Id(),
		StageName:   str("prod"),
		Description: str("Production deployment"),
	})

}

func convertSubnetIds(subnets []subnet.Subnet) *[]*string {
	var ids []*string
	for _, subnet := range subnets {
		ids = append(ids, subnet.Id())
	}
	return &ids
}

func str(v string) *string   { return &v }
func num(v float64) *float64 { return &v }
func boolPtr(v bool) *bool   { return &v }
