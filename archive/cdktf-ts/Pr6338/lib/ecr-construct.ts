import { Construct } from 'constructs';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcrLifecyclePolicy } from '@cdktf/provider-aws/lib/ecr-lifecycle-policy';

export interface EcrConstructProps {
  environmentName: string;
  environmentSuffix: string;
}

export class EcrConstruct extends Construct {
  public readonly repositoryUrl: string;

  public readonly repositoryName: string;

  constructor(scope: Construct, id: string, props: EcrConstructProps) {
    super(scope, id);

    const repo = new EcrRepository(this, 'repo', {
      name: `app-repo-${props.environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `app-repo-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new EcrLifecyclePolicy(this, 'lifecycle', {
      repository: repo.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: 'Keep last 10 images',
            selection: {
              tagStatus: 'any',
              countType: 'imageCountMoreThan',
              countNumber: 10,
            },
            action: {
              type: 'expire',
            },
          },
        ],
      }),
    });

    this.repositoryUrl = repo.repositoryUrl;
    this.repositoryName = repo.name;
  }
}
