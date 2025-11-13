package main

import (
	"os"
	"time"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
)

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get environment variables
		environmentSuffix := getEnv("ENVIRONMENT_SUFFIX", "dev")
		repositoryName := getEnv("REPOSITORY", "unknown")
		commitAuthor := getEnv("COMMIT_AUTHOR", "unknown")
		prNumber := getEnv("PR_NUMBER", "unknown")
		team := getEnv("TEAM", "unknown")
		createdAt := time.Now().UTC().Format(time.RFC3339)
		awsRegion := getEnv("AWS_REGION", "us-east-1")

		// Create default tags
		defaultTags := pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Repository":  pulumi.String(repositoryName),
			"Author":      pulumi.String(commitAuthor),
			"PRNumber":    pulumi.String(prNumber),
			"Team":        pulumi.String(team),
			"CreatedAt":   pulumi.String(createdAt),
		}

		// Configure AWS provider with default tags
		_, err := aws.NewProvider(ctx, "aws", &aws.ProviderArgs{
			Region: pulumi.String(awsRegion),
			DefaultTags: &aws.ProviderDefaultTagsArgs{
				Tags: defaultTags,
			},
		})
		if err != nil {
			return err
		}

		// Create a simple S3 bucket with sample tags
		_, err = s3.NewBucket(ctx, "simple-bucket", &s3.BucketArgs{
			Bucket: pulumi.String("simple-bucket-for-go" + environmentSuffix),
			Tags: pulumi.StringMap{
				"Purpose":    pulumi.String("demo"),
				"ManagedBy":  pulumi.String("pulumi"),
				"CostCenter": pulumi.String("engineering"),
			},
		})
		if err != nil {
			return err
		}

		return nil
	})
}

func str(v string) *string { return &v }
