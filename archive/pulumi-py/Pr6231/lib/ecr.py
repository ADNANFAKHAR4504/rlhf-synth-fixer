"""
ECR Repository for Container Images
Creates ECR repository with scanning and lifecycle policies
"""

import pulumi
import pulumi_aws as aws
import json

def create_ecr_repository(environment_suffix: str):
    """
    Create ECR repository with image scanning and lifecycle policy
    """

    # Create ECR repository
    repository = aws.ecr.Repository(
        f"flask-app-{environment_suffix}",
        name=f"flask-app-{environment_suffix}",
        image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
            scan_on_push=True
        ),
        image_tag_mutability="MUTABLE",
        tags={
            "Name": f"flask-app-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create lifecycle policy to keep only 5 most recent images
    lifecycle_policy = aws.ecr.LifecyclePolicy(
        f"flask-app-lifecycle-{environment_suffix}",
        repository=repository.name,
        policy=json.dumps({
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep only 5 most recent images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        })
    )

    return repository
