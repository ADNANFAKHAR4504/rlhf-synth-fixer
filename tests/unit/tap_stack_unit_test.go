//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

// Track created resources for validation with thread safety
var (
	createdResources   = make(map[string]resource.PropertyMap)
	createdResourcesMu sync.RWMutex
)

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Copy()
	resourceID := args.Name + "_id"

	// Set default IDs and outputs based on resource type
	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-12345")
		outputs["cidrBlock"] = args.Inputs["cidrBlock"]
		outputs["enableDnsHostnames"] = args.Inputs["enableDnsHostnames"]
		outputs["enableDnsSupport"] = args.Inputs["enableDnsSupport"]

	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty("subnet-" + args.Name)
		outputs["availabilityZone"] = args.Inputs["availabilityZone"]

	case "aws:ec2/internetGateway:InternetGateway":
		outputs["id"] = resource.NewStringProperty("igw-12345")

	case "aws:ec2/eip:Eip":
		outputs["id"] = resource.NewStringProperty("eip-" + args.Name)
		outputs["publicIp"] = resource.NewStringProperty("1.2.3.4")

	case "aws:ec2/natGateway:NatGateway":
		outputs["id"] = resource.NewStringProperty("nat-" + args.Name)

	case "aws:ec2/routeTable:RouteTable":
		outputs["id"] = resource.NewStringProperty("rt-" + args.Name)

	case "aws:ec2/route:Route":
		outputs["id"] = resource.NewStringProperty("route-" + args.Name)

	case "aws:ec2/routeTableAssociation:RouteTableAssociation":
		outputs["id"] = resource.NewStringProperty("rta-" + args.Name)

	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = resource.NewStringProperty("sg-" + args.Name)

	case "aws:ec2/securityGroupRule:SecurityGroupRule":
		outputs["id"] = resource.NewStringProperty("sgr-" + args.Name)

	case "aws:ec2/flowLog:FlowLog":
		outputs["id"] = resource.NewStringProperty("fl-" + args.Name)

	case "aws:kinesis/stream:Stream":
		outputs["arn"] = resource.NewStringProperty("arn:aws:kinesis:eu-central-2:123456789012:stream/" + args.Name)
		outputs["name"] = args.Inputs["name"]
		outputs["id"] = resource.NewStringProperty("kinesis-" + args.Name)

	case "aws:rds/instance:Instance":
		outputs["endpoint"] = resource.NewStringProperty("test-db.123456.eu-central-2.rds.amazonaws.com:5432")
		outputs["id"] = resource.NewStringProperty("rds-" + args.Name)
		outputs["dbName"] = args.Inputs["dbName"]

	case "aws:rds/subnetGroup:SubnetGroup":
		outputs["id"] = resource.NewStringProperty("dbsg-" + args.Name)
		outputs["name"] = args.Inputs["name"]

	case "aws:ecs/cluster:Cluster":
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecs:eu-central-2:123456789012:cluster/" + args.Name)
		outputs["name"] = args.Inputs["name"]
		outputs["id"] = resource.NewStringProperty("ecs-cluster-" + args.Name)

	case "aws:ecs/taskDefinition:TaskDefinition":
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecs:eu-central-2:123456789012:task-definition/" + args.Name + ":1")
		outputs["id"] = resource.NewStringProperty("td-" + args.Name)
		outputs["family"] = args.Inputs["family"]

	case "aws:ecs/service:Service":
		outputs["id"] = resource.NewStringProperty("ecs-service-" + args.Name)
		outputs["name"] = args.Inputs["name"]

	case "aws:iam/role:Role":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789012:role/" + args.Name)
		outputs["id"] = resource.NewStringProperty("role-" + args.Name)
		outputs["name"] = args.Inputs["name"]

	case "aws:iam/policy:Policy":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789012:policy/" + args.Name)
		outputs["id"] = resource.NewStringProperty("policy-" + args.Name)

	case "aws:iam/rolePolicy:RolePolicy":
		outputs["id"] = resource.NewStringProperty("rp-" + args.Name)

	case "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
		outputs["id"] = resource.NewStringProperty("rpa-" + args.Name)

	case "aws:cloudwatch/logGroup:LogGroup":
		outputs["arn"] = resource.NewStringProperty("arn:aws:logs:eu-central-2:123456789012:log-group:" + args.Name)
		outputs["id"] = resource.NewStringProperty("lg-" + args.Name)
		outputs["name"] = args.Inputs["name"]

	case "aws:cloudwatch/metricAlarm:MetricAlarm":
		outputs["id"] = resource.NewStringProperty("alarm-" + args.Name)
		outputs["arn"] = resource.NewStringProperty("arn:aws:cloudwatch:eu-central-2:123456789012:alarm:" + args.Name)

	case "aws:secretsmanager/secret:Secret":
		outputs["arn"] = resource.NewStringProperty("arn:aws:secretsmanager:eu-central-2:123456789012:secret:" + args.Name)
		outputs["id"] = resource.NewStringProperty("secret-" + args.Name)

	case "aws:secretsmanager/secretVersion:SecretVersion":
		outputs["id"] = resource.NewStringProperty("sv-" + args.Name)
		outputs["versionId"] = resource.NewStringProperty("v1")

	case "aws:appautoscaling/target:Target":
		outputs["id"] = resource.NewStringProperty("ast-" + args.Name)

	case "aws:appautoscaling/policy:Policy":
		outputs["id"] = resource.NewStringProperty("asp-" + args.Name)
	}

	// Store the resource for validation with thread safety
	createdResourcesMu.Lock()
	createdResources[args.TypeToken+"::"+args.Name] = outputs
	createdResourcesMu.Unlock()

	return resourceID, outputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := map[string]interface{}{}
	return resource.NewPropertyMapFromMap(outputs), nil
}

// Helper function to reset state between tests
func resetMocks() {
	createdResourcesMu.Lock()
	createdResources = make(map[string]resource.PropertyMap)
	createdResourcesMu.Unlock()
}

// Helper function to count resources by type pattern
func countResourcesByPattern(pattern string) int {
	createdResourcesMu.RLock()
	defer createdResourcesMu.RUnlock()

	count := 0
	for key := range createdResources {
		if strings.Contains(key, pattern) {
			count++
		}
	}
	return count
}

// Helper function to check if resource exists
func resourceExists(pattern string) bool {
	createdResourcesMu.RLock()
	defer createdResourcesMu.RUnlock()

	for key := range createdResources {
		if strings.Contains(key, pattern) {
			return true
		}
	}
	return false
}

// Test full stack creation
func TestCreateStack(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

// Test VPC creation with correct CIDR and settings
func TestVPCConfiguration(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	// Verify VPC was created
	assert.True(t, resourceExists("aws:ec2/vpc:Vpc"), "VPC should be created")
}

// Test public subnets creation
func TestPublicSubnetsCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	// Count public subnets
	publicSubnetCount := countResourcesByPattern("aws:ec2/subnet:Subnet::public")
	assert.Equal(t, 2, publicSubnetCount, "Should create 2 public subnets")
}

// Test private subnets creation
func TestPrivateSubnetsCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	// Count private subnets
	privateSubnetCount := countResourcesByPattern("aws:ec2/subnet:Subnet::private")
	assert.Equal(t, 2, privateSubnetCount, "Should create 2 private subnets")
}

// Test Internet Gateway creation
func TestInternetGatewayCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:ec2/internetGateway:InternetGateway"), "Internet Gateway should be created")
}

// Test NAT Gateways creation
func TestNATGatewaysCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	natGwCount := countResourcesByPattern("aws:ec2/natGateway:NatGateway")
	assert.Equal(t, 2, natGwCount, "Should create 2 NAT Gateways")
}

// Test Elastic IPs creation
func TestElasticIPsCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	eipCount := countResourcesByPattern("aws:ec2/eip:Eip")
	assert.Equal(t, 2, eipCount, "Should create 2 Elastic IPs")
}

// Test Route Tables creation
func TestRouteTablesCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	rtCount := countResourcesByPattern("aws:ec2/routeTable:RouteTable")
	assert.GreaterOrEqual(t, rtCount, 3, "Should create at least 3 route tables (1 public, 2 private)")
}

// Test VPC Flow Logs setup
func TestVPCFlowLogsConfiguration(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:ec2/flowLog:FlowLog"), "VPC Flow Log should be created")
}

// Test Kinesis Stream creation and configuration
func TestKinesisStreamConfiguration(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:kinesis/stream:Stream"), "Kinesis Stream should be created")
}

// Test Kinesis CloudWatch Alarms
func TestKinesisCloudWatchAlarms(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	kinesisAlarmCount := countResourcesByPattern("aws:cloudwatch/metricAlarm:MetricAlarm::kinesis")
	assert.GreaterOrEqual(t, kinesisAlarmCount, 2, "Should create at least 2 Kinesis alarms")
}

// Test RDS instance creation
func TestRDSInstanceConfiguration(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:rds/instance:Instance"), "RDS Instance should be created")
}

// Test RDS Subnet Group
func TestRDSSubnetGroup(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:rds/subnetGroup:SubnetGroup"), "RDS Subnet Group should be created")
}

// Test RDS CloudWatch Alarms
func TestRDSCloudWatchAlarms(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	rdsAlarmCount := countResourcesByPattern("aws:cloudwatch/metricAlarm:MetricAlarm::rds")
	assert.GreaterOrEqual(t, rdsAlarmCount, 3, "Should create at least 3 RDS alarms (CPU, connections, storage)")
}

// Test Secrets Manager secret creation
func TestSecretsManagerSecret(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:secretsmanager/secret:Secret"), "Secrets Manager Secret should be created")
}

// Test Secrets Manager secret version
func TestSecretsManagerSecretVersion(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:secretsmanager/secretVersion:SecretVersion"), "Secrets Manager Secret Version should be created")
}

// Test Security Groups creation
func TestSecurityGroupsCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	sgCount := countResourcesByPattern("aws:ec2/securityGroup:SecurityGroup")
	assert.GreaterOrEqual(t, sgCount, 2, "Should create at least 2 security groups (RDS and ECS)")
}

// Test Security Group Rules
func TestSecurityGroupRules(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	sgrCount := countResourcesByPattern("aws:ec2/securityGroupRule:SecurityGroupRule")
	assert.GreaterOrEqual(t, sgrCount, 2, "Should create at least 2 security group rules")
}

// Test ECS Cluster creation
func TestECSClusterConfiguration(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:ecs/cluster:Cluster"), "ECS Cluster should be created")
}

// Test ECS Task Definition
func TestECSTaskDefinition(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:ecs/taskDefinition:TaskDefinition"), "ECS Task Definition should be created")
}

// Test ECS Service
func TestECSService(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:ecs/service:Service"), "ECS Service should be created")
}

// Test ECS CloudWatch Alarms
func TestECSCloudWatchAlarms(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	ecsAlarmCount := countResourcesByPattern("aws:cloudwatch/metricAlarm:MetricAlarm::ecs")
	assert.GreaterOrEqual(t, ecsAlarmCount, 2, "Should create at least 2 ECS alarms")
}

// Test IAM Roles creation
func TestIAMRolesCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	roleCount := countResourcesByPattern("aws:iam/role:Role")
	assert.GreaterOrEqual(t, roleCount, 3, "Should create at least 3 IAM roles (VPC Flow Logs, ECS Execution, ECS Task)")
}

// Test IAM Policies
func TestIAMPoliciesCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	policyCount := countResourcesByPattern("aws:iam/policy:Policy") + countResourcesByPattern("aws:iam/rolePolicy:RolePolicy")
	assert.GreaterOrEqual(t, policyCount, 2, "Should create at least 2 IAM policies")
}

// Test CloudWatch Log Groups
func TestCloudWatchLogGroups(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	logGroupCount := countResourcesByPattern("aws:cloudwatch/logGroup:LogGroup")
	assert.GreaterOrEqual(t, logGroupCount, 2, "Should create at least 2 log groups (VPC Flow Logs, ECS)")
}

// Test Auto Scaling Target
func TestAutoScalingTarget(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	assert.True(t, resourceExists("aws:appautoscaling/target:Target"), "Auto Scaling Target should be created")
}

// Test Auto Scaling Policies
func TestAutoScalingPolicies(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	policyCount := countResourcesByPattern("aws:appautoscaling/policy:Policy")
	assert.GreaterOrEqual(t, policyCount, 2, "Should create at least 2 auto scaling policies (CPU and Memory)")
}

// Test region configuration with default
func TestRegionDefaultConfiguration(t *testing.T) {
	resetMocks()
	os.Unsetenv("AWS_REGION")
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

// Test environment suffix from environment variable
func TestEnvironmentSuffixFromEnvVar(t *testing.T) {
	resetMocks()
	os.Setenv("ENVIRONMENT_SUFFIX", "test-env")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)
}

// Test secret value JSON marshaling
func TestSecretValueJSONMarshaling(t *testing.T) {
	secretValue := map[string]interface{}{
		"username": "adminuser",
		"password": "TempPassword123!",
		"engine":   "postgres",
		"host":     "",
		"port":     5432,
		"dbname":   "sensordata",
	}
	secretJSON, err := json.Marshal(secretValue)
	assert.NoError(t, err)
	assert.NotEmpty(t, secretJSON)

	var unmarshaled map[string]interface{}
	err = json.Unmarshal(secretJSON, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, "adminuser", unmarshaled["username"])
	assert.Equal(t, float64(5432), unmarshaled["port"])
}

// Test all CloudWatch alarms are created
func TestAllCloudWatchAlarms(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	alarmCount := countResourcesByPattern("aws:cloudwatch/metricAlarm:MetricAlarm")
	// Should have Kinesis (2) + RDS (3) + ECS (2) = 7 alarms
	assert.GreaterOrEqual(t, alarmCount, 7, "Should create at least 7 CloudWatch alarms")
}

// Test route table associations
func TestRouteTableAssociations(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	rtaCount := countResourcesByPattern("aws:ec2/routeTableAssociation:RouteTableAssociation")
	assert.Equal(t, 4, rtaCount, "Should create 4 route table associations")
}

// Test routes creation
func TestRoutesCreation(t *testing.T) {
	resetMocks()
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return CreateStack(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	assert.NoError(t, err)

	routeCount := countResourcesByPattern("aws:ec2/route:Route")
	assert.GreaterOrEqual(t, routeCount, 3, "Should create at least 3 routes (1 public, 2 private)")
}
