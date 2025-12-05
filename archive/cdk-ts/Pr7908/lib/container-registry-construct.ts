import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';

export interface ContainerRegistryConstructProps {
  environmentSuffix: string;
}

export class ContainerRegistryConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(
    scope: Construct,
    id: string,
    props: ContainerRegistryConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // ECR repository for Docker images
    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: `cicd-app-${environmentSuffix}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          description: 'Remove untagged images after 1 day',
          maxImageAge: Duration.days(1),
          rulePriority: 1,
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
          rulePriority: 2,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });
  }
}
