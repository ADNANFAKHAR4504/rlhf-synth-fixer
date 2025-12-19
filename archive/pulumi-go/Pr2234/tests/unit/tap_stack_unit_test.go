package main

import (
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib/stack"
	resource "github.com/pulumi/pulumi/sdk/v3/go/common/resource"
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
	mu        sync.Mutex
	resources []recordedResource
	invokes   []struct {
		Tok  string
		Args map[string]interface{}
	}
	cleanOnce sync.Once
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

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	// Ensure we have a stable ID and record the inputs
	id := args.Name + "-id"
	record(recordedResource{
		Type:   args.TypeToken,
		Name:   args.Name,
		Inputs: toMap(args.Inputs),
	})
	return id, args.Inputs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	// Record the invoke and respond with minimal viable data
	recordInvoke(args.Token, toMap(args.Args))

	switch args.Token {
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		// Provide two AZs to exercise subnet creation without hardcoding
		return resource.PropertyMap{
			resource.PropertyKey("names"): resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	case "aws:ssm/getParameter:getParameter":
		// Return a fake AMI from SSM parameter
		return resource.PropertyMap{
			resource.PropertyKey("value"): resource.NewStringProperty("ami-1234567890abcdef0"),
		}, nil
	case "aws:index/getCallerIdentity:getCallerIdentity":
		// Return a fake account ID
		return resource.PropertyMap{
			resource.PropertyKey("accountId"): resource.NewStringProperty("123456789012"),
		}, nil
	default:
		return resource.PropertyMap{}, nil
	}
}

// toMap converts a Pulumi PropertyMap into a shallow map[string]interface{}
func toMap(pm resource.PropertyMap) map[string]interface{} {
	out := make(map[string]interface{}, len(pm))
	for k, v := range pm {
		out[string(k)] = v.V
	}
	return out
}

func Test_TapStack_ResourcesAndPolicies(t *testing.T) {
	cleanOnce.Do(func() {
		t.Cleanup(func() { resetRecords() })
	})

	// Make config available as env so defaults from Pulumi.yaml are fine
	require.NoError(t, os.Setenv("PULUMI_CONFIG_PASSPHRASE", "test"))

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return stack.CreateTapStack(ctx)
	}, pulumi.WithMocks("unit", "test", mocks{}))
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

	// Debug: log all recorded resource types once
	{
		mu.Lock()
		seen := map[string]bool{}
		for _, r := range resources {
			if !seen[r.Type] {
				t.Logf("resource type: %s", r.Type)
				seen[r.Type] = true
			}
		}
		mu.Unlock()
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
	albs := find("aws:lb/loadBalancer:LoadBalancer")
	require.GreaterOrEqual(t, len(albs), 2)
	for _, a := range albs {
		assertHasTags(t, a)
	}
	listeners := find("aws:lb/listener:Listener")
	require.GreaterOrEqual(t, len(listeners), 2)
	for _, l := range listeners {
		// Accept either HTTPS:443 (non-PR envs) or HTTP:80 (PR envs)
		var port443, port80 bool
		switch v := l.Inputs["port"].(type) {
		case string:
			port443 = v == "443"
			port80 = v == "80"
		case float64:
			port443 = v == float64(443)
			port80 = v == float64(80)
		case int:
			port443 = v == 443
			port80 = v == 80
		default:
			t.Fatalf("unexpected port type %T", v)
		}
		proto, _ := l.Inputs["protocol"].(string)
		require.Truef(t, (port443 && proto == "HTTPS") || (port80 && proto == "HTTP"), "listener must be HTTPS:443 or HTTP:80, got port=%v protocol=%v", l.Inputs["port"], proto)
	}

	// AutoScaling Groups
	asgs := find("aws:autoscaling/group:Group")
	require.GreaterOrEqual(t, len(asgs), 2) // one per region
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

	// DynamoDB Global Table with replicas (primary region excluded from replicas)
	ddbTables := find("aws:dynamodb/table:Table")
	require.Equal(t, 1, len(ddbTables), "expect a single global table defined in primary region")
	if len(ddbTables) == 1 {
		// "replicas" should include only the remote region(s); primary is excluded
		switch replicas := ddbTables[0].Inputs["replicas"].(type) {
		case []interface{}:
			require.Len(t, replicas, 1)
		case []resource.PropertyValue:
			require.Len(t, replicas, 1)
		default:
			t.Fatalf("unexpected replicas type %T", replicas)
		}
		assertHasTags(t, ddbTables[0])
	}

	// CloudFront distribution
	cf := find("aws:cloudfront/distribution:Distribution")
	require.Equal(t, 1, len(cf))
	assertHasTags(t, cf[0])

	// Lambda function (Node.js 20 runtime)
	lambdas := find("aws:lambda/function:Function")
	require.GreaterOrEqual(t, len(lambdas), 2) // one per region
	for _, fn := range lambdas {
		assertHasTags(t, fn)
		require.Equal(t, "nodejs20.x", fn.Inputs["runtime"])
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
		"aws:lb/loadBalancer:LoadBalancer",
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
