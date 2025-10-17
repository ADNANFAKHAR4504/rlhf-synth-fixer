import { Construct } from 'constructs';
import { CodebuildProject } from '@cdktf/provider-aws/lib/codebuild-project';
import { Codepipeline } from '@cdktf/provider-aws/lib/codepipeline';
import { CodedeployApp } from '@cdktf/provider-aws/lib/codedeploy-app';
import { CodedeployDeploymentGroup } from '@cdktf/provider-aws/lib/codedeploy-deployment-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Object } from '@cdktf/provider-aws/lib/s3-object';
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
  public readonly repositoryName: string;
  public readonly codeBuildProject: CodebuildProject;
  public readonly codePipeline: Codepipeline;
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

    // Set repository name for reference (S3-based source)
    this.repositoryName = `edu-content-repo-${environmentSuffix}`;

    // Create a placeholder source file in S3
    new S3Object(this, 'source-placeholder', {
      bucket: artifactBucket.bucket,
      key: `source/${environmentSuffix}/source.zip`,
      content: 'Placeholder for source code',
      tags: {
        Name: `source-placeholder-${environmentSuffix}`,
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
            Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
            Resource: `${artifactBucket.arn}/*`,
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
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [artifactBucket.arn, `${artifactBucket.arn}/*`],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-codedeploy-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2CodeDeployPolicy.arn,
    });

    // Instance profile for EC2
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `ec2-instance-profile-${environmentSuffix}`,
        role: ec2Role.name,
      }
    );

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
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole',
    });

    // CodeDeploy Deployment Group
    this.deploymentGroup = new CodedeployDeploymentGroup(
      this,
      'deployment-group',
      {
        appName: this.codeDeployApp.name,
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
              's3:GetBucketVersioning',
            ],
            Resource: [`${artifactBucket.arn}`, `${artifactBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
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
            Action: ['sns:Publish'],
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
    this.codePipeline = new Codepipeline(this, 'pipeline', {
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
              provider: 'S3',
              version: '1',
              outputArtifacts: ['SourceOutput'],
              configuration: {
                S3Bucket: artifactBucket.bucket,
                S3ObjectKey: `source/${environmentSuffix}/source.zip`,
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
                ApplicationName: this.codeDeployApp.name,
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
