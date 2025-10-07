"""ECR Stack for container registry infrastructure."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository
from cdktf_cdktf_provider_aws.ecr_lifecycle_policy import EcrLifecyclePolicy
from cdktf_cdktf_provider_aws.ecr_registry_scanning_configuration import EcrRegistryScanningConfiguration
from cdktf_cdktf_provider_aws.ecr_pull_through_cache_rule import EcrPullThroughCacheRule
import json


class ECRStack(Construct):
    """ECR repository with scanning and lifecycle policies."""

    def __init__(
        self,
        scope: Construct,
        environment_suffix: str
    ):
        super().__init__(scope, "ECRStack")

        # Create ECR repository
        self.repository = EcrRepository(
            self,
            "container_registry",
            name=f"tap-container-registry-{environment_suffix}",
            image_tag_mutability="MUTABLE",
            image_scanning_configuration={
                "scan_on_push": True
            },
            encryption_configuration=[{
                "encryption_type": "AES256"
            }]
        )

        # Configure registry scanning
        EcrRegistryScanningConfiguration(
            self,
            "registry_scanning",
            scan_type="ENHANCED",
            rule=[
                {
                    "scanFrequency": "CONTINUOUS_SCAN",
                    "repositoryFilter": [
                        {
                            "filter": "*",
                            "filterType": "WILDCARD"
                        }
                    ]
                }
            ]
        )

        # Create lifecycle policy to retain last 30 images
        lifecycle_policy = {
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep last 30 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 30
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }

        EcrLifecyclePolicy(
            self,
            "lifecycle_policy",
            repository=self.repository.name,
            policy=json.dumps(lifecycle_policy)
        )

        # Add pull through cache rule for ECR public images
        # Note: Docker Hub requires authentication credentials for pull-through cache
        # So we only enable ECR public cache which doesn't require authentication
        EcrPullThroughCacheRule(
            self,
            "ecr_public_cache",
            ecr_repository_prefix="ecr-public",
            upstream_registry_url="public.ecr.aws"
        )

        # Export outputs
        self.repository_arn = self.repository.arn
        self.repository_name = self.repository.name
