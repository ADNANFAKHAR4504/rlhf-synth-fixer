import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have ProjectName parameter', () => {
      const projectName = template.Parameters.ProjectName;
      expect(projectName).toBeDefined();
      expect(projectName.Type).toBe('String');
      expect(projectName.Default).toBe('webapp');
    });

    test('should have DBUsername parameter', () => {
      const dbUsername = template.Parameters.DBUsername;
      expect(dbUsername).toBeDefined();
      expect(dbUsername.Type).toBe('String');
      expect(dbUsername.MinLength).toBe(1);
      expect(dbUsername.MaxLength).toBe(16);
    });

    test('GitHubToken should have NoEcho enabled', () => {
      const githubToken = template.Parameters.GitHubToken;
      expect(githubToken).toBeDefined();
      expect(githubToken.NoEcho).toBe(true);
    });
  });

  describe('Multi-Region Support', () => {
    test('RegionMap should exist', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should have multiple regions', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(Object.keys(regionMap).length).toBeGreaterThanOrEqual(10);
    });

    test('all regions should have AMI defined', () => {
      const regionMap = template.Mappings.RegionMap;
      Object.keys(regionMap).forEach(region => {
        expect(regionMap[region].AMI).toBeDefined();
        expect(regionMap[region].AMI).toMatch(/^ami-/);
      });
    });

    test('should include major AWS regions', () => {
      const regionMap = template.Mappings.RegionMap;
      const expectedRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      expectedRegions.forEach(region => {
        expect(regionMap[region]).toBeDefined();
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have proper CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnetA).toBeDefined();
      expect(template.Resources.PublicSubnetB).toBeDefined();
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP', () => {
      const alb_sg = template.Resources.ALBSecurityGroup.Properties;
      const httpRule = alb_sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow MySQL port', () => {
      const rds_sg = template.Resources.RDSSecurityGroup.Properties;
      const mysqlRule = rds_sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS Key', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
    });

    test('KMS Key should have key policy', () => {
      const kmsKey = template.Resources.KMSKey.Properties;
      expect(kmsKey.KeyPolicy).toBeDefined();
      expect(kmsKey.KeyPolicy.Statement).toBeDefined();
    });

    test('KMS Alias should exist', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 Role should have trust policy for EC2', () => {
      const role = template.Resources.EC2Role.Properties;
      const trustPolicy = role.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement).toBeDefined();
      const ec2Trust = trustPolicy.Statement.find((stmt: any) =>
        JSON.stringify(stmt.Principal).includes('ec2.amazonaws.com')
      );
      expect(ec2Trust).toBeDefined();
    });

    test('EC2 Role should have SSM managed policy', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.ManagedPolicyArns).toBeDefined();
      const ssmPolicy = role.ManagedPolicyArns.find((arn: string) =>
        arn.includes('AmazonSSMManagedInstanceCore')
      );
      expect(ssmPolicy).toBeDefined();
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CodePipeline Role', () => {
      expect(template.Resources.CodePipelineRole).toBeDefined();
    });

    test('should have CodeBuild Role', () => {
      expect(template.Resources.CodeBuildRole).toBeDefined();
    });
  });

  describe('Auto Scaling', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should have EBS encryption enabled', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const ebs = lt.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('Launch Template should use KMS key for encryption', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const ebs = lt.BlockDeviceMappings[0].Ebs;
      expect(ebs.KmsKeyId).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('ASG should have health check grace period', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should have metrics collection', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MetricsCollection).toBeDefined();
      expect(asg.MetricsCollection.length).toBeGreaterThan(0);
    });

    test('ASG should have rolling update policy', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.UpdatePolicy).toBeDefined();
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be application type', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Type).toBe('application');
    });

    test('should have Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
    });

    test('Target Group should have stickiness enabled', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      const stickinessAttr = tg.TargetGroupAttributes.find((attr: any) =>
        attr.Key === 'stickiness.enabled'
      );
      expect(stickinessAttr).toBeDefined();
      expect(stickinessAttr.Value).toBe('true');
    });

    test('should have HTTP listener', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      expect(template.Resources.ALBListenerHTTP.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTP listener should use port 80', () => {
      const listener = template.Resources.ALBListenerHTTP.Properties;
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS Instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should use MySQL engine', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.Engine).toBe('mysql');
    });

    test('RDS should have valid MySQL version', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.EngineVersion).toBeDefined();
      expect(rds.EngineVersion).toMatch(/^8\.0/);
    });

    test('RDS deletion protection should be disabled', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.DeletionProtection).toBe(false);
    });

    test('RDS should have Delete deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('RDS should be Multi-AZ', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.MultiAZ).toBe(true);
    });

    test('RDS storage should be encrypted', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.StorageEncrypted).toBe(true);
    });

    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have DB Password Secret', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('S3 and CloudFront', () => {
    test('should have S3 Bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      expect(bucket.VersioningConfiguration).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have CloudFront Distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should have origins configured', () => {
      const cf = template.Resources.CloudFrontDistribution.Properties;
      expect(cf.DistributionConfig.Origins).toBeDefined();
      expect(cf.DistributionConfig.Origins.length).toBeGreaterThan(0);
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should have CodePipeline', () => {
      expect(template.Resources.Pipeline).toBeDefined();
      expect(template.Resources.Pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('CodePipeline should have required stages', () => {
      const pipeline = template.Resources.Pipeline.Properties;
      const stages = pipeline.Stages;
      const stageNames = stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    test('should have CodeBuild Project', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeBuildProject.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should have Artifact Bucket', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('Resource Tagging', () => {
    const requiredTags = {
      'project': 'iac-rlhf-amazon',
      'team-number': 2
    };

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC.Properties;
      const tags = vpc.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('Subnets should have required tags', () => {
      const subnet = template.Resources.PublicSubnetA.Properties;
      const tags = subnet.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('Security Groups should have required tags', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      const tags = sg.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('ALB should have required tags', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      const tags = alb.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('RDS should have required tags', () => {
      const rds = template.Resources.RDSInstance.Properties;
      const tags = rds.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('S3 Bucket should have required tags', () => {
      const bucket = template.Resources.S3Bucket.Properties;
      const tags = bucket.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('KMS Key should have required tags', () => {
      const kms = template.Resources.KMSKey.Properties;
      const tags = kms.Tags;
      const tagDict = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
      expect(tagDict['project']).toBe(requiredTags.project);
      expect(tagDict['team-number']).toBe(requiredTags['team-number']);
    });

    test('ASG should propagate tags to instances', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      const tags = asg.Tags;
      const projectTag = tags.find((tag: any) => tag.Key === 'project');
      const teamTag = tags.find((tag: any) => tag.Key === 'team-number');
      expect(projectTag.PropagateAtLaunch).toBe(true);
      expect(teamTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('should have ALB DNS/URL output', () => {
      const outputs = Object.keys(template.Outputs);
      const albOutputs = outputs.filter(key =>
        key.includes('ALB') && (key.includes('URL') || key.includes('DNS') || key.includes('Domain'))
      );
      expect(albOutputs.length).toBeGreaterThan(0);
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(20);
      expect(resourceCount).toBeLessThanOrEqual(100);
    });

    test('should not have duplicate resource names', () => {
      const resourceNames = Object.keys(template.Resources);
      const uniqueNames = new Set(resourceNames);
      expect(resourceNames.length).toBe(uniqueNames.size);
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
      });
    });
  });

  describe('EnvironmentSuffix Usage', () => {
    test('EnvironmentSuffix should be used in resource names', () => {
      const templateStr = JSON.stringify(template.Resources);
      expect(templateStr).toContain('EnvironmentSuffix');
    });

    test('EnvironmentSuffix should be used in outputs', () => {
      const templateStr = JSON.stringify(template.Outputs);
      expect(templateStr).toContain('EnvironmentSuffix');
    });
  });
});
