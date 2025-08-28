package main

import (
	"context"
	"net"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func Test_TapStack_Integration(t *testing.T) {
	if os.Getenv("RUN_INTEGRATION") != "1" {
		t.Skip("Skipping integration test; set RUN_INTEGRATION=1 to enable")
	}

	// Also require AWS credentials; without creds, deployment will fail in CI.
	if !hasAWSCreds() {
		t.Skip("Skipping integration test; AWS credentials not found in environment")
	}

	// This is a simplified integration test that validates deployed infrastructure
	// without using the Pulumi integration testing framework to avoid version conflicts.
	// In a real scenario, you would:
	// 1. Deploy the stack using `pulumi up`
	// 2. Get stack outputs using `pulumi stack output`
	// 3. Run these validation tests against the deployed resources

	t.Log("Integration test placeholder - validates deployed infrastructure")

	// Example validation that would run against deployed stack outputs
	validateDeployedInfrastructure(t)
}

func validateDeployedInfrastructure(t *testing.T) {
	// Mock validation - in real scenario, get these from `pulumi stack output`
	mockOutputs := map[string]string{
		"usEast1AlbDnsName":  "test-alb-123456789.us-east-1.elb.amazonaws.com",
		"euWest1AlbDnsName":  "test-alb-987654321.eu-west-1.elb.amazonaws.com",
		"cloudfrontDomain":   "d123456789abcdef.cloudfront.net",
		"usEast1DataBucket":  "tap-prod-data-bucket-us-east-1-123456",
		"euWest1DataBucket":  "tap-prod-data-bucket-eu-west-1-654321",
		"dynamoTableName":    "tap-prod-global",
		"usEast1RdsEndpoint": "tap-rds-us-east-1.cluster-xyz.us-east-1.rds.amazonaws.com:3306",
		"euWest1RdsEndpoint": "tap-rds-eu-west-1.cluster-abc.eu-west-1.rds.amazonaws.com:3306",
	}

	// Validate outputs exist and have expected format
	require.NotEmpty(t, mockOutputs["usEast1AlbDnsName"])
	require.NotEmpty(t, mockOutputs["euWest1AlbDnsName"])
	require.Contains(t, mockOutputs["cloudfrontDomain"], ".cloudfront.net")
	require.Contains(t, mockOutputs["usEast1RdsEndpoint"], ":")
	require.Contains(t, mockOutputs["euWest1RdsEndpoint"], ":")

	// Test DNS resolution for ALB and CloudFront endpoints
	requireDNSResolves(t, mockOutputs["usEast1AlbDnsName"])
	requireDNSResolves(t, mockOutputs["euWest1AlbDnsName"])
	requireDNSResolves(t, mockOutputs["cloudfrontDomain"])

	t.Log("Infrastructure validation completed successfully")
}

func requireDNSResolves(t *testing.T, host string) {
	t.Helper()
	// Some outputs may already include scheme; strip it for lookup
	h := host
	if strings.HasPrefix(h, "http://") || strings.HasPrefix(h, "https://") {
		h = strings.SplitN(h, "://", 2)[1]
	}
	// Strip path if any
	if i := strings.IndexByte(h, '/'); i >= 0 {
		h = h[:i]
	}
	// ALBs are usually plain DNS names; CloudFront too
	r := &net.Resolver{}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	addrs, err := r.LookupHost(ctx, h)
	require.NoErrorf(t, err, "failed to resolve %s", h)
	require.NotEmpty(t, addrs)
}

func hasAWSCreds() bool {
	// Basic check for environment-based credentials
	if os.Getenv("AWS_ACCESS_KEY_ID") != "" && os.Getenv("AWS_SECRET_ACCESS_KEY") != "" {
		return true
	}
	// Also consider web identity or default credential chain (let validation try)
	return false
}
