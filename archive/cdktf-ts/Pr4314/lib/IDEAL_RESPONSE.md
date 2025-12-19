# CI/CD Pipeline Infrastructure Solution

This solution implements a complete CI/CD pipeline infrastructure for educational content delivery using CDKTF with TypeScript.

## Architecture Overview

The infrastructure consists of three main modules:
1. **Pipeline Module**: CodeCommit, CodePipeline, CodeBuild, CodeDeploy
2. **Content Delivery Module**: S3, CloudFront with Origin Access Control
3. **Monitoring Module**: CloudWatch Logs, CloudWatch Alarms, SNS notifications

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ContentDeliveryModule } from './content-delivery-module';
import { MonitoringModule } from './monitoring-module';
import { PipelineModule } from './pipeline-module';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with state locking
    // Note: DynamoDB table for state locking must be created externally before running this stack
    // Table name: terraform-state-lock-${environmentSuffix}
    // Hash key: LockID (String)
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      dynamodbTable: `terraform-state-lock-${environmentSuffix}`,
    });

    // Create Content Delivery Module (S3 + CloudFront)
    const contentDelivery = new ContentDeliveryModule(
      this,
      'content-delivery',
      { environmentSuffix }
    );

    // Create Monitoring Module (CloudWatch + SNS)
    const monitoring = new MonitoringModule(this, 'monitoring', {
      environmentSuffix,
    });

    // Create Pipeline Module (CodeCommit + CodePipeline + CodeBuild + CodeDeploy)
    const pipeline = new PipelineModule(this, 'pipeline', {
      environmentSuffix,
      artifactBucket: contentDelivery.artifactBucket,
      snsTopicArn: monitoring.snsTopic.arn,
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'source-bucket', {
      value: contentDelivery.artifactBucket.bucket,
      description: 'S3 bucket for source code',
    });

    new TerraformOutput(this, 'source-object-key', {
      value: `source/${environmentSuffix}/source.zip`,
      description: 'S3 object key for source code',
    });

    new TerraformOutput(this, 'codepipeline-name', {
      value: pipeline.codePipeline.name,
      description: 'CodePipeline name',
    });

    new TerraformOutput(this, 'codebuild-project-name', {
      value: pipeline.codeBuildProject.name,
      description: 'CodeBuild project name',
    });

    new TerraformOutput(this, 'codedeploy-application-name', {
      value: pipeline.codeDeployApp.name,
      description: 'CodeDeploy application name',
    });

    new TerraformOutput(this, 'codedeploy-deployment-group-name', {
      value: pipeline.deploymentGroup.deploymentGroupName,
      description: 'CodeDeploy deployment group name',
    });

    new TerraformOutput(this, 'artifact-bucket-name', {
      value: contentDelivery.artifactBucket.bucket,
      description: 'S3 bucket for pipeline artifacts',
    });

    new TerraformOutput(this, 'content-bucket-name', {
      value: contentDelivery.contentBucket.bucket,
      description: 'S3 bucket for educational content',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: contentDelivery.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: contentDelivery.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoring.snsTopic.arn,
      description: 'SNS topic ARN for notifications',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: pipeline.ec2Instance.id,
      description: 'EC2 instance ID for deployment',
    });

    new TerraformOutput(this, 'state-lock-table-name', {
      value: `terraform-state-lock-${environmentSuffix}`,
      description: 'DynamoDB table name for Terraform state locking (must be created externally)',
    });
  }
}
```

## File: lib/content-delivery-module.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface ContentDeliveryModuleProps {
  environmentSuffix: string;
}

export class ContentDeliveryModule extends Construct {
  public readonly contentBucket: S3Bucket;
  public readonly artifactBucket: S3Bucket;
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, props: ContentDeliveryModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for educational content
    this.contentBucket = new S3Bucket(this, 'content-bucket', {
      bucket: `edu-content-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `edu-content-${environmentSuffix}`,
        Purpose: 'Educational Content Storage',
      },
    });

    // Enable versioning for content bucket
    new S3BucketVersioningA(this, 'content-bucket-versioning', {
      bucket: this.contentBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption for content bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'content-bucket-encryption',
      {
        bucket: this.contentBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access to content bucket
    new S3BucketPublicAccessBlock(this, 'content-bucket-public-access-block', {
      bucket: this.contentBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy for content bucket
    new S3BucketLifecycleConfiguration(this, 'content-bucket-lifecycle', {
      bucket: this.contentBucket.id,
      rule: [
        {
          id: 'archive-old-versions',
          status: 'Enabled',
          noncurrentVersionTransition: [
            {
              noncurrentDays: 30,
              storageClass: 'GLACIER',
            },
          ],
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
        },
      ],
    });

    // Create S3 bucket for pipeline artifacts
    this.artifactBucket = new S3Bucket(this, 'artifact-bucket', {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `pipeline-artifacts-${environmentSuffix}`,
        Purpose: 'Pipeline Artifacts',
      },
    });

    // Enable versioning for artifact bucket
    new S3BucketVersioningA(this, 'artifact-bucket-versioning', {
      bucket: this.artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption for artifact bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'artifact-bucket-encryption',
      {
        bucket: this.artifactBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access to artifact bucket
    new S3BucketPublicAccessBlock(
      this,
      'artifact-bucket-public-access-block',
      {
        bucket: this.artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Lifecycle policy for artifact bucket
    new S3BucketLifecycleConfiguration(this, 'artifact-bucket-lifecycle', {
      bucket: this.artifactBucket.id,
      rule: [
        {
          id: 'archive-old-artifacts',
          status: 'Enabled',
          transition: [
            {
              days: 30,
              storageClass: 'GLACIER',
            },
          ],
          expiration: {
            days: 90,
          },
        },
      ],
    });

    // Create CloudFront Origin Access Control
    const oac = new CloudfrontOriginAccessControl(this, 'oac', {
      name: `edu-content-oac-${environmentSuffix}`,
      description: 'Origin Access Control for educational content',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // Create CloudFront distribution
    this.distribution = new CloudfrontDistribution(this, 'distribution', {
      enabled: true,
      comment: `Educational content distribution - ${environmentSuffix}`,
      priceClass: 'PriceClass_100',
      defaultRootObject: 'index.html',

      origin: [
        {
          domainName: this.contentBucket.bucketRegionalDomainName,
          originId: 'S3-edu-content',
          originAccessControlId: oac.id,
        },
      ],

      defaultCacheBehavior: {
        targetOriginId: 'S3-edu-content',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
      },

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      tags: {
        Name: `edu-content-cdn-${environmentSuffix}`,
        Purpose: 'Content Delivery Network',
      },
    });

    // S3 bucket policy to allow CloudFront OAC access
    const bucketPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'content-bucket-policy-doc',
      {
        statement: [
          {
            sid: 'AllowCloudFrontServicePrincipal',
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudfront.amazonaws.com'],
              },
            ],
            actions: ['s3:GetObject'],
            resources: [`${this.contentBucket.arn}/*`],
            condition: [
              {
                test: 'StringEquals',
                variable: 'AWS:SourceArn',
                values: [this.distribution.arn],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'content-bucket-policy', {
      bucket: this.contentBucket.id,
      policy: bucketPolicyDoc.json,
    });
  }
}
```

## File: lib/pipeline-module.ts

```typescript
import { Construct } from 'constructs';
import { CodecommitRepository } from '@cdktf/provider-aws/lib/codecommit-repository';
import { CodebuildProject } from '@cdktf/provider-aws/lib/codebuild-project';
import { CodepipelineCodepipeline } from '@cdktf/provider-aws/lib/codepipeline-codepipeline';
import { CodedeployApp } from '@cdktf/provider-aws/lib/codedeploy-app';
import { CodedeployDeploymentGroup } from '@cdktf/provider-aws/lib/codedeploy-deployment-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

export interface PipelineModuleProps {
  environmentSuffix: string;
  artifactBucket: S3Bucket;
  snsTopicArn: string;
  region: string;
}

export class PipelineModule extends Construct {
  public readonly repository: CodecommitRepository;
  public readonly codeBuildProject: CodebuildProject;
  public readonly codePipeline: CodepipelineCodepipeline;
  public readonly codeDeployApp: CodedeployApp;
  public readonly deploymentGroup: CodedeployDeploymentGroup;
  public readonly ec2Instance: Instance;

  constructor(scope: Construct, id: string, props: PipelineModuleProps) {
    super(scope, id);

    const { environmentSuffix, artifactBucket, snsTopicArn, region } = props;

    // Create VPC for EC2 instance
    const vpc = new Vpc(this, 'pipeline-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `pipeline-vpc-${environmentSuffix}`,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'pipeline-igw', {
      vpcId: vpc.id,
      tags: {
        Name: `pipeline-igw-${environmentSuffix}`,
      },
    });

    // Create public subnet
    const publicSubnet = new Subnet(this, 'pipeline-public-subnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `pipeline-public-subnet-${environmentSuffix}`,
      },
    });

    // Create route table
    const routeTable = new RouteTable(this, 'pipeline-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `pipeline-route-table-${environmentSuffix}`,
      },
    });

    // Create route to internet gateway
    new Route(this, 'pipeline-route', {
      routeTableId: routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate route table with subnet
    new RouteTableAssociation(this, 'pipeline-route-table-association', {
      subnetId: publicSubnet.id,
      routeTableId: routeTable.id,
    });

    // Create security group for EC2
    const securityGroup = new SecurityGroup(this, 'ec2-security-group', {
      name: `ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instance',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'HTTP',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          description: 'HTTPS',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          description: 'All outbound',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `ec2-sg-${environmentSuffix}`,
      },
    });

    // CodeCommit Repository
    this.repository = new CodecommitRepository(this, 'repository', {
      repositoryName: `edu-content-repo-${environmentSuffix}`,
      description: 'Repository for educational content and application code',
      defaultBranch: 'main',
      tags: {
        Name: `edu-content-repo-${environmentSuffix}`,
      },
    });

    // IAM role for CodeBuild
    const codeBuildRole = new IamRole(this, 'codebuild-role', {
      name: `codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `codebuild-role-${environmentSuffix}`,
      },
    });

    // IAM policy for CodeBuild
    const codeBuildPolicy = new IamPolicy(this, 'codebuild-policy', {
      name: `codebuild-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
            ],
            Resource: `${artifactBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'codecommit:GitPull',
            ],
            Resource: this.repository.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'codebuild-policy-attachment', {
      role: codeBuildRole.name,
      policyArn: codeBuildPolicy.arn,
    });

    // CodeBuild Project
    this.codeBuildProject = new CodebuildProject(this, 'codebuild-project', {
      name: `edu-content-build-${environmentSuffix}`,
      description: 'Build project for educational content',
      serviceRole: codeBuildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:7.0',
        type: 'LINUX_CONTAINER',
        environmentVariable: [
          {
            name: 'ENVIRONMENT',
            value: environmentSuffix,
          },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Build started on \`date\`
      - npm run build
      - echo Build completed on \`date\`
  post_build:
    commands:
      - echo Creating deployment package...
artifacts:
  files:
    - '**/*'
  name: BuildArtifact`,
      },
      logsConfig: {
        cloudwatchLogs: {
          status: 'ENABLED',
          groupName: `/aws/codebuild/edu-content-${environmentSuffix}`,
        },
      },
      tags: {
        Name: `edu-content-build-${environmentSuffix}`,
      },
    });

    // IAM role for EC2 instance
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `ec2-codedeploy-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ec2-codedeploy-role-${environmentSuffix}`,
      },
    });

    // Attach AWS managed policies to EC2 role
    new IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-policy-attachment', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Custom policy for CodeDeploy agent
    const ec2CodeDeployPolicy = new IamPolicy(this, 'ec2-codedeploy-policy', {
      name: `ec2-codedeploy-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:ListBucket',
            ],
            Resource: [
              artifactBucket.arn,
              `${artifactBucket.arn}/*`,
            ],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-codedeploy-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2CodeDeployPolicy.arn,
    });

    // Instance profile for EC2
    const instanceProfile = new IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `ec2-instance-profile-${environmentSuffix}`,
      role: ec2Role.name,
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });


    // EC2 instance for deployment
    this.ec2Instance = new Instance(this, 'ec2-instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-${region}.s3.${region}.amazonaws.com/latest/install
chmod +x ./install
./install auto
service codedeploy-agent start
systemctl enable codedeploy-agent

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /var/www/html
chown ec2-user:ec2-user /var/www/html`,
      tags: {
        Name: `edu-content-server-${environmentSuffix}`,
        Application: 'educational-content',
      },
    });

    // CodeDeploy Application
    this.codeDeployApp = new CodedeployApp(this, 'codedeploy-app', {
      name: `edu-content-app-${environmentSuffix}`,
      computePlatform: 'Server',
      tags: {
        Name: `edu-content-app-${environmentSuffix}`,
      },
    });

    // IAM role for CodeDeploy
    const codeDeployRole = new IamRole(this, 'codedeploy-role', {
      name: `codedeploy-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codedeploy.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `codedeploy-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'codedeploy-policy-attachment', {
      role: codeDeployRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSCodeDeployRole',
    });

    // CodeDeploy Deployment Group
    this.deploymentGroup = new CodedeployDeploymentGroup(
      this,
      'deployment-group',
      {
        applicationName: this.codeDeployApp.name,
        deploymentGroupName: `edu-content-dg-${environmentSuffix}`,
        serviceRoleArn: codeDeployRole.arn,
        deploymentConfigName: 'CodeDeployDefault.OneAtATime',
        ec2TagFilter: [
          {
            type: 'KEY_AND_VALUE',
            key: 'Application',
            value: 'educational-content',
          },
        ],
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE'],
        },
        deploymentStyle: {
          deploymentType: 'IN_PLACE',
          deploymentOption: 'WITHOUT_TRAFFIC_CONTROL',
        },
      }
    );

    // IAM role for CodePipeline
    const pipelineRole = new IamRole(this, 'pipeline-role', {
      name: `pipeline-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'codepipeline.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `pipeline-role-${environmentSuffix}`,
      },
    });

    // IAM policy for CodePipeline
    const pipelinePolicy = new IamPolicy(this, 'pipeline-policy', {
      name: `pipeline-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
            ],
            Resource: `${artifactBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'codecommit:GetBranch',
              'codecommit:GetCommit',
              'codecommit:UploadArchive',
              'codecommit:GetUploadArchiveStatus',
            ],
            Resource: this.repository.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'codebuild:BatchGetBuilds',
              'codebuild:StartBuild',
            ],
            Resource: this.codeBuildProject.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'codedeploy:CreateDeployment',
              'codedeploy:GetApplication',
              'codedeploy:GetApplicationRevision',
              'codedeploy:GetDeployment',
              'codedeploy:GetDeploymentConfig',
              'codedeploy:RegisterApplicationRevision',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'sns:Publish',
            ],
            Resource: snsTopicArn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'pipeline-policy-attachment', {
      role: pipelineRole.name,
      policyArn: pipelinePolicy.arn,
    });

    // CodePipeline
    this.codePipeline = new CodepipelineCodepipeline(this, 'pipeline', {
      name: `edu-content-pipeline-${environmentSuffix}`,
      roleArn: pipelineRole.arn,
      artifactStore: [
        {
          location: artifactBucket.bucket,
          type: 'S3',
        },
      ],
      stage: [
        {
          name: 'Source',
          action: [
            {
              name: 'Source',
              category: 'Source',
              owner: 'AWS',
              provider: 'CodeCommit',
              version: '1',
              outputArtifacts: ['SourceOutput'],
              configuration: {
                RepositoryName: this.repository.repositoryName,
                BranchName: 'main',
                PollForSourceChanges: 'false',
              },
            },
          ],
        },
        {
          name: 'Build',
          action: [
            {
              name: 'Build',
              category: 'Build',
              owner: 'AWS',
              provider: 'CodeBuild',
              version: '1',
              inputArtifacts: ['SourceOutput'],
              outputArtifacts: ['BuildOutput'],
              configuration: {
                ProjectName: this.codeBuildProject.name,
              },
            },
          ],
        },
        {
          name: 'Deploy',
          action: [
            {
              name: 'Deploy',
              category: 'Deploy',
              owner: 'AWS',
              provider: 'CodeDeploy',
              version: '1',
              inputArtifacts: ['BuildOutput'],
              configuration: {
                ApplicationName: this.codeDeployApp.applicationName,
                DeploymentGroupName: this.deploymentGroup.deploymentGroupName,
              },
            },
          ],
        },
      ],
      tags: {
        Name: `edu-content-pipeline-${environmentSuffix}`,
      },
    });
  }
}
```

## File: lib/monitoring-module.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

export interface MonitoringModuleProps {
  environmentSuffix: string;
}

export class MonitoringModule extends Construct {
  public readonly snsTopic: SnsTopic;

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // CloudWatch Log Group for pipeline logs
    new CloudwatchLogGroup(this, 'pipeline-log-group', {
      name: `/aws/pipeline/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `pipeline-logs-${environmentSuffix}`,
        Purpose: 'Pipeline Logging',
      },
    });

    // CloudWatch Log Group for CodeBuild
    new CloudwatchLogGroup(this, 'codebuild-log-group', {
      name: `/aws/codebuild/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `codebuild-logs-${environmentSuffix}`,
        Purpose: 'Build Logging',
      },
    });

    // CloudWatch Log Group for CodeDeploy
    new CloudwatchLogGroup(this, 'codedeploy-log-group', {
      name: `/aws/codedeploy/edu-content-${environmentSuffix}`,
      retentionInDays: 14,
      tags: {
        Name: `codedeploy-logs-${environmentSuffix}`,
        Purpose: 'Deployment Logging',
      },
    });

    // SNS Topic for notifications
    this.snsTopic = new SnsTopic(this, 'notification-topic', {
      name: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline Notifications',
      tags: {
        Name: `pipeline-notifications-${environmentSuffix}`,
        Purpose: 'Pipeline Notifications',
      },
    });

    // SNS Topic Subscription (email - will need manual confirmation)
    new SnsTopicSubscription(this, 'email-subscription', {
      topicArn: this.snsTopic.arn,
      protocol: 'email',
      endpoint: `devops-${environmentSuffix}@example.com`,
    });

    // CloudWatch Alarm for pipeline failures
    new CloudwatchMetricAlarm(this, 'pipeline-failure-alarm', {
      alarmName: `pipeline-failure-${environmentSuffix}`,
      alarmDescription: 'Alert when pipeline fails',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'PipelineExecutionFailure',
      namespace: 'AWS/CodePipeline',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      actionsEnabled: true,
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `pipeline-failure-alarm-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarm for build failures
    new CloudwatchMetricAlarm(this, 'build-failure-alarm', {
      alarmName: `build-failure-${environmentSuffix}`,
      alarmDescription: 'Alert when build fails',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FailedBuilds',
      namespace: 'AWS/CodeBuild',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      actionsEnabled: true,
      alarmActions: [this.snsTopic.arn],
      tags: {
        Name: `build-failure-alarm-${environmentSuffix}`,
      },
    });
  }
}
```

## Summary

This solution provides a complete CI/CD pipeline infrastructure with:

1. **Source Control**: CodeCommit repository for version control
2. **Build System**: CodeBuild with Node.js 18 runtime
3. **Deployment**: CodeDeploy with EC2 instance deployment target
4. **Content Delivery**: S3 + CloudFront with Origin Access Control for secure content delivery
5. **Security**: Encryption at rest and in transit, least-privilege IAM roles, private S3 buckets
6. **Monitoring**: CloudWatch Logs with 14-day retention, CloudWatch Alarms, SNS notifications
7. **Cost Optimization**: S3 lifecycle policies to transition old objects to Glacier
8. **Compliance**: All resources properly tagged and configured for educational data protection

The infrastructure follows CDKTF best practices with modular design, proper resource naming with environment suffixes, and comprehensive outputs for testing and integration.