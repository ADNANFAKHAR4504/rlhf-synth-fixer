//go:build !integration
// +build !integration

package main

import (
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

var resourceIDCounter int
var mu sync.Mutex

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	mu.Lock()
	resourceIDCounter++
	_ = resourceIDCounter
	mu.Unlock()

	outputs := args.Inputs.Copy()

	// Add resource-specific outputs
	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["cidrBlock"] = args.Inputs["cidrBlock"]
		outputs["enableDnsHostnames"] = args.Inputs["enableDnsHostnames"]
		outputs["enableDnsSupport"] = args.Inputs["enableDnsSupport"]
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["vpcId"] = args.Inputs["vpcId"]
		outputs["cidrBlock"] = args.Inputs["cidrBlock"]
		outputs["availabilityZone"] = args.Inputs["availabilityZone"]
	case "aws:ec2/internetGateway:InternetGateway":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["vpcId"] = args.Inputs["vpcId"]
	case "aws:ec2/eip:Eip":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["allocationId"] = resource.NewPropertyValue(args.Name + "_allocation_id")
		outputs["publicIp"] = resource.NewPropertyValue("1.2.3.4")
	case "aws:ec2/natGateway:NatGateway":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["subnetId"] = args.Inputs["subnetId"]
		outputs["allocationId"] = args.Inputs["allocationId"]
	case "aws:ec2/routeTable:RouteTable":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["vpcId"] = args.Inputs["vpcId"]
	case "aws:ec2/route:Route":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["routeTableId"] = args.Inputs["routeTableId"]
	case "aws:ec2/routeTableAssociation:RouteTableAssociation":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["subnetId"] = args.Inputs["subnetId"]
		outputs["routeTableId"] = args.Inputs["routeTableId"]
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["vpcId"] = args.Inputs["vpcId"]
	case "aws:rds/subnetGroup:SubnetGroup":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["name"] = resource.NewPropertyValue(args.Name)
		outputs["subnetIds"] = args.Inputs["subnetIds"]
	case "random:index/randomPassword:RandomPassword":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["result"] = resource.NewPropertyValue("mock-password-32-chars-long-test")
	case "aws:rds/cluster:Cluster":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:rds:us-east-1:123456789012:cluster:" + args.Name)
		outputs["endpoint"] = resource.NewPropertyValue(args.Name + ".cluster-abc123.us-east-1.rds.amazonaws.com")
		outputs["engine"] = args.Inputs["engine"]
		outputs["engineVersion"] = args.Inputs["engineVersion"]
	case "aws:rds/clusterInstance:ClusterInstance":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:rds:us-east-1:123456789012:db:" + args.Name)
		outputs["clusterIdentifier"] = args.Inputs["clusterIdentifier"]
	case "aws:secretsmanager/secret:Secret":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:secretsmanager:us-east-1:123456789012:secret:" + args.Name)
	case "aws:secretsmanager/secretVersion:SecretVersion":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["secretId"] = args.Inputs["secretId"]
		outputs["secretString"] = args.Inputs["secretString"]
	case "aws:sqs/queue:Queue":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:sqs:us-east-1:123456789012:" + args.Name)
		outputs["url"] = resource.NewPropertyValue("https://sqs.us-east-1.amazonaws.com/123456789012/" + args.Name)
	case "aws:sns/topic:Topic":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:sns:us-east-1:123456789012:" + args.Name)
	case "aws:sns/topicSubscription:TopicSubscription":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["topic"] = args.Inputs["topic"]
	case "aws:cloudwatch/logGroup:LogGroup":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["name"] = resource.NewPropertyValue("/aws/ecs/" + args.Name)
		outputs["arn"] = resource.NewPropertyValue("arn:aws:logs:us-east-1:123456789012:log-group:" + args.Name)
	case "aws:ssm/parameter:Parameter":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["name"] = resource.NewPropertyValue("/config/" + args.Name)
		outputs["arn"] = resource.NewPropertyValue("arn:aws:ssm:us-east-1:123456789012:parameter/" + args.Name)
	case "aws:ecs/cluster:Cluster":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:ecs:us-east-1:123456789012:cluster/" + args.Name)
	case "aws:iam/role:Role":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:iam::123456789012:role/" + args.Name)
	case "aws:iam/rolePolicy:RolePolicy":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["role"] = args.Inputs["role"]
	case "aws:lb/loadBalancer:LoadBalancer":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/" + args.Name)
		outputs["dnsName"] = resource.NewPropertyValue(args.Name + ".us-east-1.elb.amazonaws.com")
	case "aws:lb/targetGroup:TargetGroup":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/" + args.Name)
	case "aws:lb/listener:Listener":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/" + args.Name)
	case "aws:lb/listenerRule:ListenerRule":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:elasticloadbalancing:us-east-1:123456789012:listener-rule/" + args.Name)
	case "aws:ecs/taskDefinition:TaskDefinition":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["arn"] = resource.NewPropertyValue("arn:aws:ecs:us-east-1:123456789012:task-definition/" + args.Name)
	case "aws:ecs/service:Service":
		outputs["id"] = resource.NewPropertyValue(args.Name + "_id")
		outputs["cluster"] = args.Inputs["cluster"]
	}

	return args.Name + "_id", outputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	outputs := resource.PropertyMap{}

	switch args.Token {
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		outputs["names"] = resource.NewPropertyValue([]interface{}{"us-east-1a", "us-east-1b", "us-east-1c"})
	}

	return outputs, nil
}

func TestCreateInfrastructure(t *testing.T) {
	resourceIDCounter = 0

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)), func(ri *pulumi.RunInfo) {
		ri.Config = map[string]string{
			"environmentSuffix": "test123",
		}
	})

	assert.NoError(t, err)
}

func TestCreateInfrastructureWithEnvironmentSuffix(t *testing.T) {
	resourceIDCounter = 0

	// Test with explicit environment suffix in config
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)), func(ri *pulumi.RunInfo) {
		ri.Config = map[string]string{
			"environmentSuffix": "prod123",
		}
	})

	assert.NoError(t, err)
}

func TestCreateInfrastructureWithoutEnvironmentSuffix(t *testing.T) {
	resourceIDCounter = 0

	// Test without environment suffix (should default to "test")
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return createInfrastructure(ctx)
	}, pulumi.WithMocks("project", "stack", mocks(0)))

	assert.NoError(t, err)
}
