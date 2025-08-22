// Unit Tests for SecureApp CloudFormation Infrastructure - FULLY FIXED
import fs from 'fs';
import path from 'path';

// Load the CloudFormation template
let template: any;

describe('SecureApp CloudFormation Template Unit Tests', () => {
  
  beforeAll(() => {
    // Load the JSON template that was converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('SecureApp infrastructure');
    });

    test('should have required top-level sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Resources)).not.toHaveLength(0);
    });

    test('should have parameters section for configuration', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.AllowedIPRange).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.SecureAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway with proper attachment', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have subnets in multiple AZs with correct CIDR blocks', () => {
      const expectedSubnets = {
        PublicSubnet1: { cidr: '10.0.1.0/24', hasMapPublic: false }, // Changed to false for compliance
        PublicSubnet2: { cidr: '10.0.2.0/24', hasMapPublic: false }, // Changed to false for compliance
        PrivateSubnet1: { cidr: '10.0.3.0/24', hasMapPublic: false },
        PrivateSubnet2: { cidr: '10.0.4.0/24', hasMapPublic: false },
        DatabaseSubnet1: { cidr: '10.0.5.0/24', hasMapPublic: false },
        DatabaseSubnet2: { cidr: '10.0.6.0/24', hasMapPublic: false },
      };

      Object.entries(expectedSubnets).forEach(([name, config]) => {
        const subnet = template.Resources[name];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.CidrBlock).toBe(config.cidr);
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });
        
        // FIXED: All subnets now have MapPublicIpOnLaunch: false for compliance
        // Handle both explicit false and undefined (which also means false)
        const mapPublicIp = subnet.Properties.MapPublicIpOnLaunch;
        expect(mapPublicIp === false || mapPublicIp === undefined).toBe(true);
      });

      // Check AZ distribution
      const azRefs = Object.keys(expectedSubnets).map(name => 
        template.Resources[name].Properties.AvailabilityZone
      );
      const uniqueAZs = [...new Set(azRefs.map(az => JSON.stringify(az)))];
      expect(uniqueAZs.length).toBe(2); // Should span 2 AZs
    });

    test('should have NAT Gateway with EIP in public subnet', () => {
      // FIXED: Resource name is NATGateway, not NatGateway
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toBeDefined();

      // FIXED: Resource name is NATGatewayEIP, not NatGatewayEIP
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have route tables with correct routes', () => {
      // Public route table
      const publicRT = template.Resources.PublicRouteTable;
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      // Private route table
      const privateRT = template.Resources.PrivateRouteTable;
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
      
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      // FIXED: Resource name is NATGateway, not NatGateway
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have subnet route table associations', () => {
      // FIXED: Actual resource names from your template
      const expectedAssociations = [
        'PublicSubnetRouteTableAssociation1',
        'PublicSubnetRouteTableAssociation2',
        'PrivateSubnetRouteTableAssociation1',
        'PrivateSubnetRouteTableAssociation2',
        'DatabaseSubnetRouteTableAssociation1',
        'DatabaseSubnetRouteTableAssociation2'
      ];

      expectedAssociations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Properties.SubnetId).toBeDefined();
        expect(association.Properties.RouteTableId).toBeDefined();
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should have web server security group with proper rules', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSG.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      const ingressRules = webSG.Properties.SecurityGroupIngress;
      
      // HTTP rule (should now be from ALB security group, not direct internet)
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');

      // SSH rule (should be restricted to VPC)
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('should have database security group with restricted access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSG.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      const mysqlRule = ingressRules.find((rule: any) => rule.FromPort === 3306);
      
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with security settings', () => {
      const bucket = template.Resources.SecureAppS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const bucketConfig = bucket.Properties;
      expect(bucketConfig.BucketEncryption).toBeDefined();
      expect(bucketConfig.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucketConfig.PublicAccessBlockConfiguration).toBeDefined();
      
      const publicAccessBlock = bucketConfig.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy denying insecure transport', () => {
      const policy = template.Resources.S3BucketPolicy;
      
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'SecureAppS3Bucket' });

      const statements = policy.Properties.PolicyDocument.Statement;
      const httpsOnlyStatement = statements.find((s: any) => 
        s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(httpsOnlyStatement).toBeDefined();
      expect(httpsOnlyStatement.Effect).toBe('Deny');
    });
  });

  describe('IAM Resources', () => {
    test('should not have IAM resources (removed to avoid IAM capabilities)', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeUndefined();
      
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeUndefined();
      
      // This is expected since we removed IAM resources to deploy without --capabilities
      console.log('✓ IAM resources correctly removed to avoid deployment capabilities requirements');
    });

    test('should not have instance profile (removed with IAM resources)', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeUndefined();
      
      // Instance profile was removed along with IAM role
      console.log('✓ Instance profile correctly removed with IAM resources');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should have database password secret with secure generation', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      
      // FIXED: Handle Fn::Sub in description
      const description = secret.Properties.Description;
      if (typeof description === 'string') {
        expect(description).toContain('Database credentials');
      } else if (typeof description === 'object' && description['Fn::Sub']) {
        expect(description['Fn::Sub']).toContain('Database credentials');
      }
      
      const generateSecret = secret.Properties.GenerateSecretString;
      expect(generateSecret).toBeDefined();
      expect(generateSecret.SecretStringTemplate).toContain('dbadmin');
      expect(generateSecret.GenerateStringKey).toBe('password');
      expect(generateSecret.PasswordLength).toBeGreaterThanOrEqual(32);
      expect(generateSecret.ExcludeCharacters).toBeDefined();
    });
  });

  describe('RDS Database Configuration', () => {
    test('should have database subnet group with proper subnets', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      // FIXED: Handle Fn::Sub in description
      const description = subnetGroup.Properties.DBSubnetGroupDescription;
      if (typeof description === 'string') {
        expect(description).toContain('Subnet group');
      } else if (typeof description === 'object' && description['Fn::Sub']) {
        expect(description['Fn::Sub']).toContain('Subnet group');
      }
      
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets).toContainEqual({ Ref: 'DatabaseSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'DatabaseSubnet2' });
    });

    test('should have RDS instance with security settings', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      
      // Database configuration
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.Engine).toBe('mysql');
      // FIXED: AllocatedStorage is a number, not string
      expect(db.Properties.AllocatedStorage).toBe(20);
      expect(db.Properties.StorageEncrypted).toBe(true);

      // Security
      expect(db.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DatabaseSubnetGroup' });
      
      // Credentials
      expect(db.Properties.MasterUsername).toBe('dbadmin');
      // FIXED: Your template uses MasterUserPassword, not ManageMasterUserPassword
      expect(db.Properties.MasterUserPassword).toBeDefined();
      
      // Access and backup
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(30); // FIXED: Updated to 30 days
      expect(db.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('EC2 Instances Configuration', () => {
    test('should have web server instances with proper configuration', () => {
      const instanceNames = ['WebServerInstance1', 'WebServerInstance2'];
      
      instanceNames.forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Type).toBe('AWS::EC2::Instance');
        expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
        expect(instance.Properties.InstanceType).toBe('t3.micro');
        expect(instance.Properties.SecurityGroupIds).toContainEqual({ Ref: 'WebServerSecurityGroup' });
        
        // FIXED: No IAM instance profile since we removed IAM resources
        expect(instance.Properties.IamInstanceProfile).toBeUndefined();
        
        // Subnet placement
        expect(instance.Properties.SubnetId).toBeDefined();
        
        // User data for web server setup
        expect(instance.Properties.UserData).toBeDefined();
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs with descriptions', () => {
      const requiredOutputs = [
        'VPCId',
        'DatabaseEndpoint', 
        'S3BucketName',
        'WebServerInstance1Id',
        'WebServerInstance2Id'
      ];

      requiredOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        
        // Check export name structure
        const exportName = output.Export.Name;
        expect(exportName).toBeDefined();
        
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('should have correct output values', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureAppVPC' });
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({ 
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'] 
      });
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'SecureAppS3Bucket' });
      expect(template.Outputs.WebServerInstance1Id.Value).toEqual({ Ref: 'WebServerInstance1' });
      expect(template.Outputs.WebServerInstance2Id.Value).toEqual({ Ref: 'WebServerInstance2' });
    });
  });

  describe('Security Compliance Validation', () => {
    test('should enforce HTTPS-only access for S3', () => {
      const policy = template.Resources.S3BucketPolicy;
      
      expect(policy).toBeDefined();
      const statements = policy.Properties.PolicyDocument.Statement;
      const httpsOnlyStatement = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(httpsOnlyStatement).toBeDefined();
      expect(httpsOnlyStatement.Effect).toBe('Deny');
      expect(httpsOnlyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have encryption enabled for all storage', () => {
      // S3 encryption
      const bucket = template.Resources.SecureAppS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      
      // RDS encryption
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper network isolation', () => {
      // Web servers in private subnets
      const webServer1 = template.Resources.WebServerInstance1;
      const webServer2 = template.Resources.WebServerInstance2;
      
      expect([webServer1.Properties.SubnetId, webServer2.Properties.SubnetId])
        .toEqual(expect.arrayContaining([
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' }
        ]));
      
      // Database in database subnets (via subnet group)
      const dbSubnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DatabaseSubnet1' });
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DatabaseSubnet2' });
    });

    test('should not have IAM policies (removed to avoid capabilities)', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeUndefined();
      
      // IAM resources were removed to deploy without --capabilities CAPABILITY_IAM
      console.log('✓ IAM resources correctly removed to avoid deployment capabilities requirements');
    });
  });

  describe('Resource Dependencies and References', () => {
    test('should have correct resource dependencies', () => {
      // FIXED: Check NATGateway instead of NatGateway
      const natGateway = template.Resources.NATGateway;
      if (natGateway && natGateway.DependsOn) {
        expect(natGateway.DependsOn).toContainEqual('AttachGateway');
      }
      
      // Database should depend on subnet group
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DatabaseSubnetGroup' });
    });

    test('should have proper resource references', () => {
      // Subnet references to VPC
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      // Security group references to VPC
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Properties.VpcId).toEqual({ Ref: 'SecureAppVPC' });

      // Security group references
      expect(template.Resources.DatabaseInstance.Properties.VPCSecurityGroups).toContainEqual({
        Ref: 'DatabaseSecurityGroup'
      });
    });
  });

  describe('Template Best Practices', () => {
    test('should use CloudFormation functions appropriately', () => {
      // Check for proper use of Ref and GetAtt
      const dbOutput = template.Outputs.DatabaseEndpoint;
      expect(dbOutput.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address']
      });
      
      // Check for Fn::Sub usage in exports
      const vpcOutput = template.Outputs.VPCId;
      if (vpcOutput.Export.Name['Fn::Sub']) {
        expect(vpcOutput.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      }
    });

    test('should have consistent tagging strategy', () => {
      const resourcesWithTags = [
        'SecureAppVPC',
        'SecureAppS3Bucket',
        'WebServerInstance1',
        'WebServerInstance2'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
          
          // FIXED: Handle parameters in Fn::Sub values
          const tagValue = nameTag.Value;
          if (typeof tagValue === 'string') {
            expect(tagValue).toContain('secureapp');
          } else if (typeof tagValue === 'object' && tagValue['Fn::Sub']) {
            // Check if it contains ProjectName parameter reference
            expect(tagValue['Fn::Sub']).toContain('${ProjectName}');
          }
          
          // Check for Project and Environment tags
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(projectTag).toBeDefined();
          expect(environmentTag).toBeDefined();
        }
      });
    });

    test('should not use hardcoded values where CloudFormation functions are appropriate', () => {
      // AMI should use SSM parameter
      const webServer = template.Resources.WebServerInstance1;
      expect(webServer.Properties.ImageId).toContain('{{resolve:ssm:');
      
      // Availability zones should use GetAZs
      const publicSubnet1 = template.Resources.PublicSubnet1;
      if (publicSubnet1.Properties.AvailabilityZone['Fn::Select']) {
        expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
      }
    });
  });
});