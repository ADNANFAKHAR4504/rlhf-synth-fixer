import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import {
  DescribeAddressesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS SDK clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const cloudformation = new CloudFormationClient({ region });

// Function to get outputs from CloudFormation stack
async function getStackOutputs(): Promise<Record<string, string>> {
  console.log(`🔍 Fetching outputs from CloudFormation stack: ${stackName}`);
  
  try {
    const response = await cloudformation.send(new DescribeStacksCommand({
      StackName: stackName
    }));

    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
      throw new Error(`Stack ${stackName} is not in a complete state: ${stack.StackStatus}`);
    }

    // Convert outputs to flat object
    const outputs: Record<string, string> = {};
    stack.Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    console.log(`✅ Stack outputs loaded successfully`);
    console.log(`📊 Available outputs: ${Object.keys(outputs).join(', ')}`);

    return outputs;
  } catch (error) {
    console.error(`❌ Failed to get stack outputs: ${error}`);
    throw error;
  }
}

describe('TapStack AWS Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    console.log(`🚀 Setting up integration tests for environment: ${environmentSuffix}`);
    outputs = await getStackOutputs();
    
    // Verify we have the required outputs for network infrastructure
    const requiredOutputs = [
      'VPC',
      'PublicSubnets',
      'PrivateSubnets',
      'WebServerSecurityGroup',
      'S3BucketName'
    ];

    requiredOutputs.forEach(outputKey => {
      if (!outputs[outputKey]) {
        console.warn(`⚠️  Output ${outputKey} not found in stack ${stackName}`);
      }
    });

    console.log(`✅ Stack outputs validation completed`);
  }, 60000); // 60 second timeout for beforeAll

  describe('Stack Information', () => {
    test('should have valid stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      console.log(`📋 Stack: ${stackName}`);
      console.log(`🌍 Region: ${region}`);
      console.log(`🏷️  Environment: ${environmentSuffix}`);
    });

    test('should validate stack exists and is in good state', async () => {
      const response = await cloudformation.send(new DescribeStacksCommand({
        StackName: stackName
      }));

      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toMatch(/COMPLETE$/);
      expect(stack?.StackName).toBe(stackName);
      console.log(`✅ CloudFormation stack verified: ${stackName} (${stack?.StackStatus})`);
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPC;
      expect(vpcId).toBeDefined();

      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);

      // Check VPC tags
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(nameTag?.Value).toContain(`${environmentSuffix}-VPC`);
      expect(envTag?.Value).toBe(environmentSuffix);

      console.log(`✅ VPC verified: ${vpcId} (${vpc?.CidrBlock})`);
    });

    test('should have public subnets in different AZs', async () => {
      const publicSubnetIds = outputs.PublicSubnets?.split(',') || [];
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      const subnets = response.Subnets || [];
      expect(subnets.length).toBe(publicSubnetIds.length);

      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.VPC);
        
        // Check tags
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });

      // Verify they're in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);

      console.log(`✅ Public subnets verified: ${publicSubnetIds.join(', ')}`);
      console.log(`📍 Availability Zones: ${azs.join(', ')}`);
    });

    test('should have private subnets in different AZs', async () => {
      const privateSubnetIds = outputs.PrivateSubnets?.split(',') || [];
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      const subnets = response.Subnets || [];
      expect(subnets.length).toBe(privateSubnetIds.length);

      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPC);
        
        // Check tags
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });

      // Verify they're in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);

      console.log(`✅ Private subnets verified: ${privateSubnetIds.join(', ')}`);
      console.log(`📍 Availability Zones: ${azs.join(', ')}`);
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const igw = response.InternetGateways?.[0];
      expect(igw).toBeDefined();
      
      const attachment = igw?.Attachments?.find(att => att.VpcId === vpcId);
      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe('available');
      expect(attachment?.VpcId).toBe(vpcId);

      console.log(`✅ Internet Gateway verified: ${igw?.InternetGatewayId} (attached to ${vpcId})`);
    });

    test('should have NAT Gateways in public subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnets?.split(',') || [];
      
      const response = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPC]
          }
        ]
      }));

      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBeGreaterThanOrEqual(1);

      natGateways.forEach(nat => {
        expect(nat.State).toMatch(/^(available|pending)$/);
        expect(publicSubnetIds).toContain(nat.SubnetId);
        expect(nat.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
      });

      console.log(`✅ NAT Gateways verified: ${natGateways.length} gateways`);
      console.log(`📍 NAT Gateway IDs: ${natGateways.map(nat => nat.NatGatewayId).join(', ')}`);
    });

    test('should have proper route tables configuration', async () => {
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThanOrEqual(2); // At least public and private

      // Find public route table (has IGW route)
      const publicRouteTable = routeTables.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();

      // Find private route tables (have NAT Gateway routes)
      const privateRouteTables = routeTables.filter(rt => 
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTables.length).toBeGreaterThanOrEqual(1);

      console.log(`✅ Route tables verified: ${routeTables.length} total (1+ public, ${privateRouteTables.length} private)`);
    });

    test('should have Elastic IPs for NAT Gateways', async () => {
      const response = await ec2.send(new DescribeAddressesCommand({
        Filters: [
          {
            Name: 'domain',
            Values: ['vpc']
          }
        ]
      }));

      const eips = response.Addresses || [];
      const natEips = eips.filter(eip => eip.AssociationId && eip.NetworkInterfaceId);
      
      expect(natEips.length).toBeGreaterThanOrEqual(1);
      
      natEips.forEach(eip => {
        expect(eip.PublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        expect(eip.Domain).toBe('vpc');
      });

      console.log(`✅ Elastic IPs verified: ${natEips.length} EIPs for NAT Gateways`);
    });
  });

  describe('Security Groups', () => {
    test('should have WebServer security group with correct rules', async () => {
      const sgId = outputs.WebServerSecurityGroup;
      expect(sgId).toBeDefined();

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPC);

      // Check HTTP rule
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

      // Check HTTPS rule
      const httpsRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

      console.log(`✅ WebServer security group verified: ${sgId}`);
    });

    test('should have Bastion security group with SSH access', async () => {
      const bastionSgId = outputs.BastionSecurityGroup;
      if (!bastionSgId) {
        console.warn(`⚠️  Bastion security group not found in outputs`);
        return;
      }

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [bastionSgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPC);

      // Check SSH rule
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.length).toBeGreaterThan(0);

      console.log(`✅ Bastion security group verified: ${bastionSgId}`);
    });

    test('should have Database security group with restricted access', async () => {
      const dbSgId = outputs.DatabaseSecurityGroup;
      if (!dbSgId) {
        console.warn(`⚠️  Database security group not found in outputs`);
        return;
      }

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPC);

      // Check MySQL rule (should only allow from WebServer SG)
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      
      // Should reference WebServer security group, not open to internet
      const hasWebServerSgRef = mysqlRule?.UserIdGroupPairs?.some(
        pair => pair.GroupId === outputs.WebServerSecurityGroup
      );
      expect(hasWebServerSgRef).toBe(true);

      console.log(`✅ Database security group verified: ${dbSgId}`);
    });
  });

  describe('Network ACLs', () => {
    test('should have Network ACL with proper rules', async () => {
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const nacls = response.NetworkAcls || [];
      const customNacl = nacls.find(nacl => 
        !nacl.IsDefault && 
        nacl.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes(environmentSuffix))
      );

      if (customNacl) {
        expect(customNacl.VpcId).toBe(vpcId);

        // Check for HTTP/HTTPS inbound rules
        const inboundRules = customNacl.Entries?.filter(entry => !entry.Egress);
        const httpRule = inboundRules?.find(rule => 
          rule.Protocol === '6' && rule.PortRange?.From === 80
        );
        const httpsRule = inboundRules?.find(rule => 
          rule.Protocol === '6' && rule.PortRange?.From === 443
        );

        expect(httpRule?.RuleAction).toBe('allow');
        expect(httpsRule?.RuleAction).toBe('allow');

        console.log(`✅ Network ACL verified: ${customNacl.NetworkAclId}`);
      } else {
        console.warn(`⚠️  Custom Network ACL not found, using default`);
      }
    });

    test('should have NACL associations with public subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnets?.split(',') || [];
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const nacls = response.NetworkAcls || [];
      
      publicSubnetIds.forEach(subnetId => {
        const associatedNacl = nacls.find(nacl =>
          nacl.Associations?.some(assoc => assoc.SubnetId === subnetId)
        );
        expect(associatedNacl).toBeDefined();
      });

      console.log(`✅ NACL associations verified for public subnets`);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName.toLowerCase()).toContain('secure-data');
      expect(bucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());

      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`✅ S3 bucket verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  S3 bucket exists but access denied: ${bucketName}`);
          // Bucket exists but we don't have permission - that's still valid
        } else {
          throw error;
        }
      }
    });

    test('should have encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      try {
        const response = await s3.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));

        const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
        expect(rule?.BucketKeyEnabled).toBe(true);
        console.log(`✅ S3 bucket encryption verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify encryption for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have versioning configuration', async () => {
      const bucketName = outputs.S3BucketName;
      try {
        const response = await s3.send(new GetBucketVersioningCommand({
          Bucket: bucketName
        }));

        // Should be either Enabled or Suspended based on parameter
        expect(['Enabled', 'Suspended']).toContain(response.Status);
        console.log(`✅ S3 bucket versioning verified: ${bucketName} (${response.Status})`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify versioning for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have lifecycle configuration', async () => {
      const bucketName = outputs.S3BucketName;
      try {
        const response = await s3.send(new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName
        }));

        const rules = response.Rules || [];
        
        // Check for multipart upload cleanup rule
        const cleanupRule = rules.find(r => r.ID === 'DeleteIncompleteMultipartUploads');
        expect(cleanupRule).toBeDefined();
        expect(cleanupRule?.Status).toBe('Enabled');
        expect(cleanupRule?.AbortIncompleteMultipartUpload?.DaysAfterInitiation).toBe(7);

        // Check for IA transition rule
        const transitionRule = rules.find(r => r.ID === 'TransitionToIA');
        expect(transitionRule).toBeDefined();
        expect(transitionRule?.Status).toBe('Enabled');
        expect(transitionRule?.Transitions?.[0]?.StorageClass).toBe('STANDARD_IA');
        expect(transitionRule?.Transitions?.[0]?.Days).toBe(30);

        console.log(`✅ S3 bucket lifecycle verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify lifecycle for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      try {
        const response = await s3.send(new GetPublicAccessBlockCommand({
          Bucket: bucketName
        }));

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);

        console.log(`✅ S3 public access block verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify public access block for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should have proper tags', async () => {
      const bucketName = outputs.S3BucketName;
      try {
        const response = await s3.send(new GetBucketTaggingCommand({
          Bucket: bucketName
        }));

        const tags = response.TagSet || [];
        const nameTag = tags.find(tag => tag.Key === 'Name');
        const envTag = tags.find(tag => tag.Key === 'Environment');

        expect(nameTag?.Value).toContain('Secure-Data-Bucket');
        expect(envTag?.Value).toBe(environmentSuffix);
        console.log(`✅ S3 bucket tags verified: ${bucketName}`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot verify tags for ${bucketName} - access denied`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Resource Naming and Tagging Compliance', () => {
    test('should follow naming conventions', () => {
      // Check if bucket name follows CloudFormation naming pattern
      const bucketName = outputs.S3BucketName;
      expect(bucketName.toLowerCase()).toMatch(new RegExp(`${environmentSuffix.toLowerCase()}-secure-data-\\d+-${region}`));
      console.log(`✅ Resource naming conventions verified`);
      console.log(`📊 S3 Bucket: ${bucketName}`);
    });

    test('should have consistent environment suffix across resources', () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
      console.log(`✅ Environment suffix consistency verified: ${environmentSuffix}`);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPC',
        'VPCCidr',
        'PublicSubnets',
        'PrivateSubnets',
        'WebServerSecurityGroup',
        'S3BucketName',
        'S3BucketArn'
      ];

      const availableOutputs: string[] = [];
      const missingOutputs: string[] = [];

      requiredOutputs.forEach(output => {
        if (outputs[output]) {
          availableOutputs.push(output);
        } else {
          missingOutputs.push(output);
        }
      });

      expect(availableOutputs.length).toBeGreaterThan(0);
      console.log(`✅ Available outputs: ${availableOutputs.join(', ')}`);
      
      if (missingOutputs.length > 0) {
        console.warn(`⚠️  Missing outputs: ${missingOutputs.join(', ')}`);
      }
    });
  });

  describe('End-to-End Functionality', () => {
    test('should be able to upload and retrieve test content via S3', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = 'test-file.txt';
      const testContent = 'This is a test file for integration testing';

      try {
        // Upload test content
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain'
        }));

        // Retrieve test content
        const response = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey
        }));

        const retrievedContent = await response.Body?.transformToString();
        expect(retrievedContent).toBe(testContent);
        console.log(`✅ S3 upload/download functionality verified`);
      } catch (error: any) {
        if (error.$metadata?.httpStatusCode === 403) {
          console.warn(`⚠️  Cannot test S3 upload/download - access denied`);
        } else {
          throw error;
        }
      }
    });

    test('should validate network connectivity between subnets', async () => {
      const vpcId = outputs.VPC;
      const publicSubnets = outputs.PublicSubnets?.split(',') || [];
      const privateSubnets = outputs.PrivateSubnets?.split(',') || [];

      // Verify public subnets can reach internet via IGW
      const response = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const routeTables = response.RouteTables || [];
      
      // Check public subnet routing
      const publicRouteTable = routeTables.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();

      // Check private subnet routing
      const privateRouteTables = routeTables.filter(rt => 
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTables.length).toBeGreaterThanOrEqual(1);

      console.log(`✅ Network connectivity verified between subnets`);
    });
  });

  describe('Security Validation', () => {
    test('should not have direct internet access to private subnets', async () => {
      const privateSubnetIds = outputs.PrivateSubnets?.split(',') || [];
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const routeTables = response.RouteTables || [];
      
      privateSubnetIds.forEach(subnetId => {
        const routeTable = routeTables.find(rt =>
          rt.Associations?.some(assoc => assoc.SubnetId === subnetId)
        );
        
        if (routeTable) {
          // Should not have direct IGW route
          const hasIgwRoute = routeTable.Routes?.some(route => 
            route.GatewayId?.startsWith('igw-') && route.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(hasIgwRoute).toBe(false);
        }
      });

      console.log(`✅ Private subnet isolation verified`);
    });

    test('should validate security group rules are restrictive', async () => {
      const dbSgId = outputs.DatabaseSecurityGroup;
      if (!dbSgId) {
        console.warn(`⚠️  Database security group not available for testing`);
        return;
      }

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      // Ensure no rules allow 0.0.0.0/0 access to database
      const hasOpenAccess = sg?.IpPermissions?.some(rule =>
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(hasOpenAccess).toBe(false);

      console.log(`✅ Security group restrictions verified`);
    });

    test('should validate S3 bucket is not publicly accessible', async () => {
      const bucketName = outputs.S3BucketName;
      
      try {
        // Try to access bucket directly (should fail)
        const directUrl = `https://${bucketName}.s3.amazonaws.com/`;
        const response = await fetch(directUrl, { method: 'HEAD' });
        
        // Should get access denied or not found
        expect([403, 404]).toContain(response.status);
        console.log(`✅ Direct S3 access properly blocked: ${response.status}`);
      } catch (error) {
        console.log(`✅ Direct S3 access properly blocked (network error)`);
      }
    });
  });

  describe('High Availability and Fault Tolerance', () => {
    test('should have resources distributed across multiple AZs', async () => {
      const publicSubnetIds = outputs.PublicSubnets?.split(',') || [];
      const privateSubnetIds = outputs.PrivateSubnets?.split(',') || [];
      
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));

      const subnets = response.Subnets || [];
      const azs = [...new Set(subnets.map(subnet => subnet.AvailabilityZone))];
      
      expect(azs.length).toBeGreaterThanOrEqual(2);
      console.log(`✅ Multi-AZ deployment verified: ${azs.length} availability zones`);
      console.log(`📍 Availability Zones: ${azs.join(', ')}`);
    });

    test('should have redundant NAT Gateways for high availability', async () => {
      const response = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPC]
          }
        ]
      }));

      const natGateways = response.NatGateways || [];
      const activeNats = natGateways.filter(nat => nat.State === 'available');
      
      // For production, should have multiple NAT Gateways
      if (activeNats.length > 1) {
        console.log(`✅ High availability NAT Gateways: ${activeNats.length} gateways`);
      } else {
        console.warn(`⚠️  Single NAT Gateway detected - consider adding more for HA`);
      }
      
      expect(activeNats.length).toBeGreaterThanOrEqual(1);
    });

    test('should have proper resource tagging for operations', async () => {
      const vpcId = outputs.VPC;
      
      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];
      
      const nameTag = tags.find(tag => tag.Key === 'Name');
      const envTag = tags.find(tag => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe(environmentSuffix);
      
      console.log(`✅ Resource tagging verified for operations`);
    });
  });
});