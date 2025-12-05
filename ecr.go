package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecr"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createECRRepositories(ctx *pulumi.Context, environmentSuffix string) ([]pulumi.StringOutput, error) {
	var repositories []pulumi.StringOutput

	// Sample microservices (can be extended for all 12)
	services := []string{"auth", "payments", "orders", "notifications"}

	for _, service := range services {
		repo, err := ecr.NewRepository(ctx, fmt.Sprintf("ecr-%s-%s", service, environmentSuffix), &ecr.RepositoryArgs{
			Name:               pulumi.Sprintf("%s-service-%s", service, environmentSuffix),
			ImageTagMutability: pulumi.String("MUTABLE"),
			ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
				ScanOnPush: pulumi.Bool(true),
			},
			ForceDelete: pulumi.Bool(true), // Enable cleanup for testing
			Tags: pulumi.StringMap{
				"Name":        pulumi.Sprintf("%s-service-%s", service, environmentSuffix),
				"Environment": pulumi.String(environmentSuffix),
				"Service":     pulumi.String(service),
				"Team":        pulumi.String("platform"),
			},
		})
		if err != nil {
			return nil, err
		}

		// Lifecycle policy to keep only last 10 images
		lifecyclePolicy := map[string]interface{}{
			"rules": []map[string]interface{}{
				{
					"rulePriority": 1,
					"description":  "Keep only last 10 images",
					"selection": map[string]interface{}{
						"tagStatus":   "any",
						"countType":   "imageCountMoreThan",
						"countNumber": 10,
					},
					"action": map[string]interface{}{
						"type": "expire",
					},
				},
			},
		}

		lifecyclePolicyJSON, err := json.Marshal(lifecyclePolicy)
		if err != nil {
			return nil, err
		}

		_, err = ecr.NewLifecyclePolicy(ctx, fmt.Sprintf("ecr-lifecycle-%s-%s", service, environmentSuffix), &ecr.LifecyclePolicyArgs{
			Repository: repo.Name,
			Policy:     pulumi.String(string(lifecyclePolicyJSON)),
		})
		if err != nil {
			return nil, err
		}

		repositories = append(repositories, repo.RepositoryUrl)
	}

	return repositories, nil
}
