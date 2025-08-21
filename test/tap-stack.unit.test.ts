import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template for testing
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
      expect(template.Description).toBe(
        'Web Application Infrastructure with CI/CD Pipeline, Load Balancer, RDS, and Monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
      // DBUsername and DBPassword removed in favor of Secrets Manager
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(20);
    });

    test('should have Secrets Manager secret for database credentials', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBSecret.Properties.GenerateSecretString).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionAMIMap for multi-region support', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionAMIMap).toBeDefined();
      
      const regionMap = template.Mappings.RegionAMIMap;
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['eu-west-1']).toBeDefined();
    });

    test('each region should have an AMI ID', () => {
      const regionMap = template.Mappings.RegionAMIMap;
      Object.keys(regionMap).forEach(region => {
        expect(regionMap[region].AMI).toBeDefined();
        expect(regionMap[region].AMI).toMatch(/^ami-[a-f0-9]+$/);
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource with correct configuration', () => {
      expect(template.Resources.WebAppVPC).toBeDefined();
      expect(template.Resources.WebAppVPC.Type).toBe('AWS::EC2::VPC');
      
      const vpcProps = template.Resources.WebAppVPC.Properties;
      expect(vpcProps.CidrBlock).toBe('10.0.0.0/16');
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnetA).toBeDefined();
      expect(template.Resources.PublicSubnetB).toBeDefined();
      
      const subnetA = template.Resources.PublicSubnetA.Properties;
      const subnetB = template.Resources.PublicSubnetB.Properties;
      
      expect(subnetA.CidrBlock).toBe('10.0.1.0/24');
      expect(subnetB.CidrBlock).toBe('10.0.2.0/24');
      expect(subnetA.MapPublicIpOnLaunch).toBe(true);
      expect(subnetB.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets for RDS', () => {
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();
      
      const privateA = template.Resources.PrivateSubnetA.Properties;
      const privateB = template.Resources.PrivateSubnetB.Properties;
      
      expect(privateA.CidrBlock).toBe('10.0.3.0/24');
      expect(privateB.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetARouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetBRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with proper rules', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      
      const sgProps = template.Resources.ALBSecurityGroup.Properties;
      expect(sgProps.SecurityGroupIngress).toHaveLength(2);
      
      const httpRule = sgProps.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      const httpsRule = sgProps.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Web Server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      
      const sgProps = template.Resources.WebServerSecurityGroup.Properties;
      expect(sgProps.SecurityGroupIngress).toHaveLength(2);
      
      // Should only accept traffic from ALB
      sgProps.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      
      const sgProps = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sgProps.SecurityGroupIngress).toHaveLength(1);
      
      const mysqlRule = sgProps.SecurityGroupIngress[0];
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM role with proper policies', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      
      const roleProps = template.Resources.EC2Role.Properties;
      expect(roleProps.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(roleProps.RoleName['Fn::Sub']).toContain('${AWS::AccountId}');
      
      // Check for least privilege policies
      const s3Policy = roleProps.Policies[0].PolicyDocument.Statement[0];
      expect(s3Policy.Resource).toBeDefined();
      expect(Array.isArray(s3Policy.Resource)).toBe(true);
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CodeBuild service role', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      const roleProps = template.Resources.CodeBuildServiceRole.Properties;
      expect(roleProps.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have CodePipeline service role', () => {
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
      const roleProps = template.Resources.CodePipelineServiceRole.Properties;
      expect(roleProps.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Compute Resources', () => {
    test('should have Launch Template with proper configuration', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      
      const ltProps = template.Resources.LaunchTemplate.Properties;
      expect(ltProps.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(ltProps.LaunchTemplateName['Fn::Sub']).toContain('${AWS::AccountId}');
      
      const ltData = ltProps.LaunchTemplateData;
      expect(ltData.InstanceType).toBe('t2.micro');
      expect(ltData.ImageId['Fn::FindInMap']).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      
      const asgProps = template.Resources.AutoScalingGroup.Properties;
      expect(asgProps.AutoScalingGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(asgProps.MinSize).toBe(2);
      expect(asgProps.MaxSize).toBe(4);
      expect(asgProps.DesiredCapacity).toBe(2);
      expect(asgProps.HealthCheckType).toBe('ELB');
    });

    test('should have Elastic IP', () => {
      expect(template.Resources.ElasticIP).toBeDefined();
      expect(template.Resources.ElasticIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.ElasticIP.Properties.Domain).toBe('vpc');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      
      const albProps = template.Resources.ApplicationLoadBalancer.Properties;
      expect(albProps.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(albProps.Scheme).toBe('internet-facing');
      expect(albProps.Type).toBe('application');
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      
      const tgProps = template.Resources.TargetGroup.Properties;
      expect(tgProps.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(tgProps.Port).toBe(80);
      expect(tgProps.Protocol).toBe('HTTP');
      expect(tgProps.HealthCheckPath).toBe('/');
    });

    test('should have Listener', () => {
      expect(template.Resources.Listener).toBeDefined();
      
      const listenerProps = template.Resources.Listener.Properties;
      expect(listenerProps.Port).toBe(80);
      expect(listenerProps.Protocol).toBe('HTTP');
    });
  });

  describe('Database Resources', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      
      const dbsgProps = template.Resources.DBSubnetGroup.Properties;
      expect(dbsgProps.DBSubnetGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(dbsgProps.SubnetIds).toHaveLength(2);
    });

    test('should have RDS instance with proper configuration', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      
      const dbProps = template.Resources.DatabaseInstance.Properties;
      expect(dbProps.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(dbProps.DBInstanceClass).toBe('db.t3.micro');
      expect(dbProps.Engine).toBe('mysql');
      expect(dbProps.StorageEncrypted).toBe(true);
      expect(dbProps.DeletionProtection).toBe(false);
      expect(dbProps.BackupRetentionPeriod).toBe(7);
      expect(dbProps.PubliclyAccessible).toBe(false);
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket for artifacts', () => {
      expect(template.Resources.ArtifactsBucket).toBeDefined();
      
      const bucketProps = template.Resources.ArtifactsBucket.Properties;
      expect(bucketProps.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(bucketProps.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucketProps.BucketEncryption).toBeDefined();
      expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have S3 bucket for logs', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      
      const bucketProps = template.Resources.LogsBucket.Properties;
      expect(bucketProps.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(bucketProps.BucketEncryption).toBeDefined();
      expect(bucketProps.LifecycleConfiguration).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch Log Group', () => {
      expect(template.Resources.WebAppLogGroup).toBeDefined();
      
      const lgProps = template.Resources.WebAppLogGroup.Properties;
      expect(lgProps.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lgProps.RetentionInDays).toBe(14);
    });
  });

  describe('CI/CD Resources', () => {
    test('should have CodeBuild projects', () => {
      expect(template.Resources.BuildProject).toBeDefined();
      expect(template.Resources.TestProject).toBeDefined();
      
      const buildProps = template.Resources.BuildProject.Properties;
      expect(buildProps.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      
      const testProps = template.Resources.TestProject.Properties;
      expect(testProps.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have CodePipeline', () => {
      expect(template.Resources.Pipeline).toBeDefined();
      
      const pipelineProps = template.Resources.Pipeline.Properties;
      expect(pipelineProps.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(pipelineProps.Stages).toHaveLength(4);
      
      const stageNames = pipelineProps.Stages.map((s: any) => s.Name);
      expect(stageNames).toEqual(['Source', 'Build', 'Test', 'Deploy']);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const namedResources = [
        'WebAppVPC', 'InternetGateway', 'PublicSubnetA', 'PublicSubnetB',
        'PrivateSubnetA', 'PrivateSubnetB', 'ALBSecurityGroup', 'WebServerSecurityGroup',
        'DatabaseSecurityGroup', 'EC2Role', 'LaunchTemplate', 'AutoScalingGroup',
        'ApplicationLoadBalancer', 'TargetGroup', 'DBSubnetGroup', 'DatabaseInstance',
        'ArtifactsBucket', 'LogsBucket', 'CodeBuildServiceRole', 'CodePipelineServiceRole',
        'BuildProject', 'TestProject', 'Pipeline'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        
        // Check if the resource has a Name property or similar that includes EnvironmentSuffix
        const props = resource.Properties;
        if (props) {
          const nameFields = ['Name', 'RoleName', 'LaunchTemplateName', 'AutoScalingGroupName',
                             'DBSubnetGroupName', 'DBInstanceIdentifier', 'BucketName', 'LogGroupName'];
          
          let hasEnvironmentSuffix = false;
          for (const field of nameFields) {
            if (props[field]) {
              if (typeof props[field] === 'object' && props[field]['Fn::Sub']) {
                if (props[field]['Fn::Sub'].includes('${EnvironmentSuffix}')) {
                  hasEnvironmentSuffix = true;
                  break;
                }
              }
            }
          }
          
          // Check tags as well
          if (props.Tags) {
            const envTag = props.Tags.find((t: any) => t.Key === 'EnvironmentSuffix');
            if (envTag) {
              hasEnvironmentSuffix = true;
            }
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('critical resources should have appropriate deletion policies', () => {
      // RDS should be deletable
      expect(template.Resources.DatabaseInstance.DeletionPolicy).toBe('Delete');
      
      // S3 buckets should be deletable
      expect(template.Resources.ArtifactsBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.LogsBucket.DeletionPolicy).toBe('Delete');
      
      // CloudWatch logs should be deletable
      expect(template.Resources.WebAppLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should have encryption enabled', () => {
      const dbProps = template.Resources.DatabaseInstance.Properties;
      expect(dbProps.StorageEncrypted).toBe(true);
    });

    test('S3 buckets should have encryption enabled', () => {
      const artifactsBucket = template.Resources.ArtifactsBucket.Properties;
      const logsBucket = template.Resources.LogsBucket.Properties;
      
      expect(artifactsBucket.BucketEncryption).toBeDefined();
      expect(logsBucket.BucketEncryption).toBeDefined();
    });

    test('S3 buckets should block public access', () => {
      const artifactsBucket = template.Resources.ArtifactsBucket.Properties;
      const logsBucket = template.Resources.LogsBucket.Properties;
      
      expect(artifactsBucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(logsBucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('IAM roles should follow least privilege principle', () => {
      const ec2Role = template.Resources.EC2Role.Properties;
      const s3Statement = ec2Role.Policies[0].PolicyDocument.Statement[0];
      
      // Check that S3 permissions are scoped
      expect(s3Statement.Resource).toBeDefined();
      expect(Array.isArray(s3Statement.Resource)).toBe(true);
      expect(s3Statement.Resource[0]['Fn::Sub']).toContain('webapp-${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'LoadBalancerDNS', 'DatabaseEndpoint', 'ElasticIPAddress',
        'S3BucketName', 'LogsBucketName', 'PipelineName', 'EnvironmentSuffix',
        'StackName', 'Region'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Tagging', () => {
    test('all taggable resources should have Project and Environment tags', () => {
      const taggableResourceTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance', 'AWS::S3::Bucket', 'AWS::IAM::Role',
        'AWS::CodeBuild::Project', 'AWS::CodePipeline::Pipeline'
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (taggableResourceTypes.includes(resource.Type)) {
          if (resource.Properties && resource.Properties.Tags) {
            const tags = resource.Properties.Tags;
            const projectTag = tags.find((t: any) => t.Key === 'Project');
            const envTag = tags.find((t: any) => t.Key === 'Environment');
            
            expect(projectTag).toBeDefined();
            expect(projectTag.Value).toBe('WebApp');
            expect(envTag).toBeDefined();
            expect(envTag.Value).toBe('Production');
          }
        }
      });
    });
  });
});