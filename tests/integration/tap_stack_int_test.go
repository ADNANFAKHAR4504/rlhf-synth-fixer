// tests/integration/tap_stack_int_test.go
package main

import (
	"context"
	"net"
	"os"
	"strings"
	"testing"
	"time"

	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	ddb "github.com/aws/aws-sdk-go-v2/service/dynamodb"
	s3svc "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/pulumi/pulumi/pkg/v3/testing/integration"
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

	// Ensure passphrase is set for ephemeral stacks
	_ = os.Setenv("PULUMI_CONFIG_PASSPHRASE", "test")

	opts := &integration.ProgramTestOptions{
		Dir:                  "../..",
		Quick:                true,
		ExpectRefreshChanges: false,
		Config: map[string]string{
			"projectName":       "tap",
			"environment":       "prod",
			"notificationEmail": "admin@example.com",
			"vpcCidr":           "10.0.0.0/16",
			"asgMinSize":        "2",
			"asgMaxSize":        "2",
			"dbInstanceClass":   "db.t3.micro",
		},
		ExtraRuntimeValidation: func(t *testing.T, stackInfo integration.RuntimeValidationStackInfo) {
			outs := stackInfo.Outputs

			// Core outputs exist
			usAlb, ok := outs["usEast1AlbDnsName"].(string)
			require.True(t, ok)
			require.NotEmpty(t, usAlb)

			euAlb, ok := outs["euWest1AlbDnsName"].(string)
			require.True(t, ok)
			require.NotEmpty(t, euAlb)

			cfDomain, ok := outs["cloudfrontDomain"].(string)
			require.True(t, ok)
			require.NotEmpty(t, cfDomain)
			require.Contains(t, cfDomain, ".cloudfront.net")

			usBucket, ok := outs["usEast1DataBucket"].(string)
			require.True(t, ok)
			require.NotEmpty(t, usBucket)

			euBucket, ok := outs["euWest1DataBucket"].(string)
			require.True(t, ok)
			require.NotEmpty(t, euBucket)

			tableName, ok := outs["dynamoTableName"].(string)
			require.True(t, ok)
			require.NotEmpty(t, tableName)

			usRds, ok := outs["usEast1RdsEndpoint"].(string)
			require.True(t, ok)
			require.NotEmpty(t, usRds)
			require.Contains(t, usRds, ":")

			euRds, ok := outs["euWest1RdsEndpoint"].(string)
			require.True(t, ok)
			require.NotEmpty(t, euRds)
			require.Contains(t, euRds, ":")

			// Minimal reachability: DNS should resolve
			requireDNSResolves(t, usAlb)
			requireDNSResolves(t, euAlb)
			requireDNSResolves(t, cfDomain)

			// If AWS credentials are available, do a light validation against AWS APIs
			if hasAWSCreds() {
				cfgUS, err := awsConfig.LoadDefaultConfig(context.Background(), awsConfig.WithRegion("us-east-1"))
				require.NoError(t, err)

				cfgEU, err := awsConfig.LoadDefaultConfig(context.Background(), awsConfig.WithRegion("eu-west-1"))
				require.NoError(t, err)

				// DynamoDB: global table with replicas >= 2 (describe from us-east-1)
				ddbCli := ddb.NewFromConfig(cfgUS)
				td, err := ddbCli.DescribeTable(context.Background(), &ddb.DescribeTableInput{TableName: &tableName})
				require.NoError(t, err)
				if td.Table.Replicas != nil {
					require.GreaterOrEqual(t, len(td.Table.Replicas), 2)
				}

				// S3: buckets have encryption configured
				s3us := s3svc.NewFromConfig(cfgUS)
				_, err = s3us.GetBucketEncryption(context.Background(), &s3svc.GetBucketEncryptionInput{Bucket: &usBucket})
				require.NoError(t, err)

				s3eu := s3svc.NewFromConfig(cfgEU)
				_, err = s3eu.GetBucketEncryption(context.Background(), &s3svc.GetBucketEncryptionInput{Bucket: &euBucket})
				require.NoError(t, err)
			}
		},
	}

	integration.ProgramTest(t, opts)
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
