import { Construct } from 'constructs';
import { CodeartifactDomain } from '@cdktf/provider-aws/lib/codeartifact-domain';
import { CodeartifactRepository } from '@cdktf/provider-aws/lib/codeartifact-repository';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface PackageManagementStackProps {
  environmentSuffix: string;
  buildSystemRole: IamRole;
}

export class PackageManagementStack extends Construct {
  public readonly domain: CodeartifactDomain;
  public readonly repository: CodeartifactRepository;

  constructor(
    scope: Construct,
    id: string,
    props: PackageManagementStackProps
  ) {
    super(scope, id);

    const { environmentSuffix, buildSystemRole } = props;

    this.domain = new CodeartifactDomain(this, 'artifact-domain', {
      domain: `cicd-domain-${environmentSuffix}`,
      tags: {
        Name: `cicd-domain-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Package Management Domain',
      },
    });

    // Create upstream repositories first
    const npmStoreRepo = new CodeartifactRepository(this, 'npm-store-repo', {
      repository: 'npm-store',
      domain: this.domain.domain,
      externalConnections: {
        externalConnectionName: 'public:npmjs',
      },
      tags: {
        Name: `npm-store-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'NPM Upstream Repository',
      },
    });

    const pypiStoreRepo = new CodeartifactRepository(this, 'pypi-store-repo', {
      repository: 'pypi-store',
      domain: this.domain.domain,
      externalConnections: {
        externalConnectionName: 'public:pypi',
      },
      tags: {
        Name: `pypi-store-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'PyPI Upstream Repository',
      },
    });

    this.repository = new CodeartifactRepository(this, 'artifact-repository', {
      repository: `cicd-repo-${environmentSuffix}`,
      domain: this.domain.domain,
      upstream: [
        {
          repositoryName: npmStoreRepo.repository,
        },
        {
          repositoryName: pypiStoreRepo.repository,
        },
      ],
      tags: {
        Name: `cicd-repo-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Package Repository',
      },
      dependsOn: [npmStoreRepo, pypiStoreRepo],
    });

    const codeArtifactPolicy = new DataAwsIamPolicyDocument(
      this,
      'codeartifact-policy',
      {
        statement: [
          {
            actions: [
              'codeartifact:GetAuthorizationToken',
              'codeartifact:GetRepositoryEndpoint',
              'codeartifact:ReadFromRepository',
              'codeartifact:PublishPackageVersion',
              'codeartifact:PutPackageMetadata',
              'codeartifact:DescribePackageVersion',
              'codeartifact:DescribeRepository',
              'codeartifact:ListPackages',
              'codeartifact:ListPackageVersions',
            ],
            resources: [
              this.domain.arn,
              this.repository.arn,
              `${this.repository.arn}/*`,
            ],
          },
        ],
      }
    );

    new IamRolePolicy(this, 'codeartifact-build-policy', {
      name: `codeartifact-access-${environmentSuffix}`,
      role: buildSystemRole.id,
      policy: codeArtifactPolicy.json,
    });
  }
}
