// tests/unit/tap_stack_unit_test.go
package lib

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/require"
)

// Recorded resource for assertions
type recordedResource struct {
	Type   string
	Name   string
	Inputs map[string]interface{}
}

var (
	mu         sync.Mutex
	resources  []recordedResource
	invokes    []struct{ Tok string; Args map[string]interface{} }
	cleanOnce  sync.Once
)

func record(r recordedResource) {
	mu.Lock()
	defer mu.Unlock()
	resources = append(resources, r)
}

func recordInvoke(tok string, args map[string]interface{}) {
	mu.Lock()
	defer mu.Unlock()
	invokes = append(invokes, struct {
		Tok  string
		Args map[string]interface{}
	}{Tok: tok, Args: args})
}

func resetRecords() {
	mu.Lock()
	defer mu.Unlock()
	resources = nil
	invokes = nil
}

type mocks struct{}

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, map[string]interface{}, error) {
	// Ensure we have a stable ID and record the inputs
	id := args.Name + "-id"
	record(recordedResource{
		Type:   args.TypeToken,
		Name:   args.Name,
		Inputs: cloneMap(args.Inputs),
	})
	return id, args.Inputs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (map[string]interface{}, error) {
	// Record the invoke and respond with minimal viable data
	recordInvoke(args.Token, cloneMap(args.Args))

	switch args.Token {
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		// Provide two AZs to exercise subnet creation without hardcoding
		return map[string]interface{}{
			"names": []interface{}{"us-east-1a", "us-east-1b"},
		}, nil
	case "aws:ssm/getParameter:getParameter":
		// Return a fake AMI from SSM parameter
		return map[string]interface{}{
			"value": "ami-1234567890abcdef0",
		}, nil
	default:
		return map[string]interface{}{}, nil
	}
}

func cloneMap(src map[string]interface{}) map[string]interface{} {
	dst := make(map[string]interface{}, len(src))
	for k, v := range src {
		dst[k] = v
	}
	return dst
}

func Test_TapStack_ResourcesAndPolicies(t *testing.T) {
	cleanOnce.Do(func() {
		t.Cleanup(func() { resetRecords() })
	})

	// Make config available as env so defaults from Pulumi.yaml are fine
	require.NoError(t, os.Setenv("PULUMI_CONFIG_PASSPHRASE", "test"))

	err := pulumi.RunWithMocks(context.Background(), "unit", mocks{}, func(ctx *pulumi.Context) error {
		return CreateTapStack(ctx)
	})
	require.NoError(t, err)

	// Helper finders
	find := func(typeTok string) []recordedResource {
		mu.Lock()
		defer mu.Unlock()
		var out []recordedResource
		for _, r := range resources {
			if r.Type == typeTok {
				out = append(out, r)
			}
		}
		return out
	}
	findPrefix := func(prefix string) []recordedResource {
		mu.Lock()
		defer mu.Unlock()
		var out []recordedResource
		for _, r := range resources {
			if strings.HasPrefix(r.Type, prefix) {
				out = append(out, r)
			}
		}
		return out
	}
	assertHasTags := func(t *testing.T, r recordedResource) {
		// Many AWS resources use "tags" or "tagsAll"; we check "tags"
		_, ok := r.Inputs["tags"]
		require.Truef(t, ok, "resource %s (%s) missing tags", r.Name, r.Type)
	}

	// VPCs
	vpcs := find("aws:ec2/vpc:Vpc")
	require.GreaterOrEqual(t, len(vpcs), 2, "should create a VPC in each region")
	for _, v := range vpcs {
		assertHasTags(t, v)
		require.Equal(t, "10.0.0.0/16", v.Inputs["cidrBlock"])
	}

	// Subnets (2 public + 2 private per region)
	publicSubnets := find("aws:ec2/subnet:Subnet")
	require.GreaterOrEqual(t, len(publicSubnets), 4)
	for _, s := range publicSubnets {
		assertHasTags(t, s)
		// AZ should be present (deriving from data source, not hardcoded in code)
		require.NotEmpty(t, s.Inputs["availabilityZone"])
	}

	// Internet gateway, NAT gateway, route tables exist
	require.GreaterOrEqual(t, len(find("aws:ec2/internetGateway:InternetGateway")), 2)
	require.GreaterOrEqual(t, len(find("aws:ec2/natGateway:NatGateway")), 2)
	require.GreaterOrEqual(t, len(find("aws:ec2/routeTable:RouteTable")), 4)

	// ALB and Listener
	albs := find("aws:elbv2/loadBalancer:LoadBalancer")
	require.GreaterOrEqual(t, len(albs), 2)
	for _, a := range albs {
		assertHasTags(t, a)
	}
	listeners := find("aws:elbv2/listener:Listener")
	require.GreaterOrEqual(t, len(listeners), 2)
	for _, l := range listeners {
		require.Equal(t, "443", l.Inputs["port"])
		require.Equal(t, "HTTPS", l.Inputs["protocol"])
	}

	// AutoScaling Groups
	asgs := find("aws:autoscaling/group:Group")
	require.GreaterOrEqual(t, len(asgs), 2)
	for _, g := range asgs {
		require.Equal(t, float64(2), g.Inputs["minSize"])
		require.Equal(t, float64(10), g.Inputs["maxSize"])
	}

	// RDS instances
	rds := find("aws:rds/instance:Instance")
	require.GreaterOrEqual(t, len(rds), 2)
	for _, db := range rds {
		assertHasTags(t, db)
		require.Equal(t, true, db.Inputs["storageEncrypted"])
	}

	// S3 data buckets and encryption config
	dataBuckets := filterByName(find("aws:s3/bucketV2:BucketV2"), func(n string) bool { return strings.HasPrefix(n, "data-bucket-") })
	require.GreaterOrEqual(t, len(dataBuckets), 2)
	for _, b := range dataBuckets {
		assertHasTags(t, b)
	}
	sseConfigs := filterByName(find("aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2"), func(n string) bool {
		return strings.HasPrefix(n, "data-bucket-encryption-")
	})
	require.GreaterOrEqual(t, len(sseConfigs), 2)

	// Replication config for S3 present
	repl := find("aws:s3/bucketReplicationConfig:BucketReplicationConfig")
	require.GreaterOrEqual(t, len(repl), 1)

	// DynamoDB Global Table with replicas
	ddbTables := find("aws:dynamodb/table:Table")
	require.Equal(t, 1, len(ddbTables), "expect a single global table defined in primary region")
	if len(ddbTables) == 1 {
		// "replicas" should include two entries
		replicas, ok := ddbTables[0].Inputs["replicas"].([]interface{})
		require.True(t, ok)
		require.Len(t, replicas, 2)
		assertHasTags(t, ddbTables[0])
	}

	// CloudFront distribution
	cf := find("aws:cloudfront/distribution:Distribution")
	require.Equal(t, 1, len(cf))
	assertHasTags(t, cf[0])

	// Lambda function
	lambdas := find("aws:lambda/function:Function")
	require.GreaterOrEqual(t, len(lambdas), 2) // one per region
	for _, fn := range lambdas {
		assertHasTags(t, fn)
		require.Equal(t, "python3.9", fn.Inputs["runtime"])
	}

	// CloudTrail: bucket, trail, log group, IAM role/policy
	ctBuckets := filterByName(find("aws:s3/bucketV2:BucketV2"), func(n string) bool { return n == "cloudtrail-bucket" })
	require.Equal(t, 1, len(ctBuckets))
	ctTrail := find("aws:cloudtrail/trail:Trail")
	require.Equal(t, 1, len(ctTrail))
	require.Equal(t, true, ctTrail[0].Inputs["isMultiRegionTrail"])

	// SNS topic for alerts
	snsTopics := find("aws:sns/topic:Topic")
	require.Equal(t, 1, len(snsTopics))

	// Tags on commonly taggable resources
	for _, typ := range []string{
		"aws:ec2/vpc:Vpc",
		"aws:ec2/subnet:Subnet",
		"aws:elbv2/loadBalancer:LoadBalancer",
		"aws:rds/instance:Instance",
		"aws:s3/bucketV2:BucketV2",
		"aws:cloudfront/distribution:Distribution",
	} {
		for _, r := range find(typ) {
			assertHasTags(t, r)
		}
	}

	// IAM policies: ensure least-privilege (no wildcard-only Action or Resource)
	rolePolicies := find("aws:iam/rolePolicy:RolePolicy")
	require.GreaterOrEqual(t, len(rolePolicies), 3)
	for _, p := range rolePolicies {
		polStr, ok := p.Inputs["policy"].(string)
		require.Truef(t, ok, "policy should be a JSON string on %s", p.Name)
		require.NotContains(t, polStr, `"Resource":"*"`, "Resource must not be wildcard")
		require.NotContains(t, polStr, `"Action":"*"`, "Action must not be wildcard")
	}

	// Launch template image should come from SSM (value we returned)
	lt := find("aws:ec2/launchTemplate:LaunchTemplate")
	require.GreaterOrEqual(t, len(lt), 2)
	for _, l := range lt {
		require.Equal(t, "ami-1234567890abcdef0", l.Inputs["imageId"])
	}
}

// helper to filter by logical name
func filterByName(in []recordedResource, pred func(string) bool) []recordedResource {
	out := make([]recordedResource, 0, len(in))
	for _, r := range in {
		if pred(r.Name) {
			out = append(out, r)
		}
	}
	return out
}