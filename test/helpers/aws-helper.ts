import * as AWS from 'aws-sdk';
import { CloudFormationStack } from './types';

// Configure AWS SDK
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
AWS.config.update({ region });

export class AWSTestHelper {
  private cloudFormation: AWS.CloudFormation;
  private s3: AWS.S3;
  private cloudFront: AWS.CloudFront;
  private wafv2: AWS.WAFV2;
  private guardDuty: AWS.GuardDuty;
  private ec2: AWS.EC2;
  private rds: AWS.RDS;
  private secretsManager: AWS.SecretsManager;

  constructor() {
    this.cloudFormation = new AWS.CloudFormation();
    this.s3 = new AWS.S3();
    this.cloudFront = new AWS.CloudFront();
    this.wafv2 = new AWS.WAFV2();
    this.guardDuty = new AWS.GuardDuty();
    this.ec2 = new AWS.EC2();
    this.rds = new AWS.RDS();
    this.secretsManager = new AWS.SecretsManager();
  }

  /**
   * Get CloudFormation stack information
   */
  async getStack(stackName: string): Promise<CloudFormationStack | null> {
    try {
      const response = await this.cloudFormation.describeStacks({
        StackName: stackName
      }).promise();

      if (!response.Stacks || response.Stacks.length === 0) {
        return null;
      }

      const stack = response.Stacks[0];
      const outputs: { [key: string]: string } = {};

      if (stack.Outputs) {
        stack.Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            outputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      return {
        StackName: stack.StackName!,
        StackStatus: stack.StackStatus!,
        CreationTime: stack.CreationTime!,
        Outputs: outputs,
        Tags: stack.Tags || []
      };
    } catch (error) {
      console.error('Error getting stack:', error);
      return null;
    }
  }

  /**
   * Wait for stack to reach a specific status
   */
  async waitForStackStatus(
    stackName: string, 
    desiredStatus: string[], 
    timeoutMs: number = 600000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const stack = await this.getStack(stackName);
      
      if (!stack) {
        return false;
      }

      if (desiredStatus.includes(stack.StackStatus)) {
        return true;
      }

      // Check if stack is in a failed state
      if (stack.StackStatus.includes('FAILED') || stack.StackStatus.includes('ROLLBACK')) {
        throw new Error(`Stack ${stackName} reached failed state: ${stack.StackStatus}`);
      }

      await this.sleep(10000); // Wait 10 seconds
    }

    throw new Error(`Timeout waiting for stack ${stackName} to reach status ${desiredStatus}`);
  }

  /**
   * Test S3 bucket encryption
   */
  async testS3Encryption(bucketName: string, objectKey: string): Promise<{
    encrypted: boolean;
    algorithm: string | undefined;
    keyId: string | undefined;
  }> {
    try {
      const response = await this.s3.headObject({
        Bucket: bucketName,
        Key: objectKey
      }).promise();

      return {
        encrypted: !!response.ServerSideEncryption,
        algorithm: response.ServerSideEncryption,
        keyId: response.SSEKMSKeyId
      };
    } catch (error) {
      throw new Error(`Failed to check S3 encryption: ${error}`);
    }
  }

  /**
   * Test S3 public access blocking
   */
  async testS3PublicAccess(bucketName: string): Promise<{
    blockPublicAcls: boolean;
    blockPublicPolicy: boolean;
    ignorePublicAcls: boolean;
    restrictPublicBuckets: boolean;
  }> {
    try {
      const response = await this.s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();

      const config = response.PublicAccessBlockConfiguration!;
      return {
        blockPublicAcls: config.BlockPublicAcls || false,
        blockPublicPolicy: config.BlockPublicPolicy || false,
        ignorePublicAcls: config.IgnorePublicAcls || false,
        restrictPublicBuckets: config.RestrictPublicBuckets || false
      };
    } catch (error) {
      throw new Error(`Failed to check S3 public access: ${error}`);
    }
  }

  /**
   * Test WAF configuration
   */
  async testWAFConfiguration(webACLId: string, scope: 'CLOUDFRONT' | 'REGIONAL' = 'CLOUDFRONT'): Promise<{
    rulesCount: number;
    managedRules: string[];
    defaultAction: string;
  }> {
    try {
      // First get the WebACL name by listing WebACLs
      const webACLs = await this.wafv2.listWebACLs({ Scope: scope }).promise();
      const webACL = webACLs.WebACLs?.find(acl => acl.Id === webACLId);
      
      if (!webACL) {
        throw new Error(`WebACL with ID ${webACLId} not found`);
      }

      const response = await this.wafv2.getWebACL({
        Scope: scope,
        Id: webACLId,
        Name: webACL.Name!
      }).promise();

      const rules = response.WebACL?.Rules || [];
      const managedRules = rules
        .filter(rule => rule.Statement?.ManagedRuleGroupStatement)
        .map(rule => rule.Statement!.ManagedRuleGroupStatement!.Name!);

      return {
        rulesCount: rules.length,
        managedRules,
        defaultAction: response.WebACL?.DefaultAction?.Allow ? 'ALLOW' : 'BLOCK'
      };
    } catch (error) {
      throw new Error(`Failed to check WAF configuration: ${error}`);
    }
  }

  /**
   * Test RDS security configuration
   */
  async testRDSConfiguration(instanceId: string): Promise<{
    encrypted: boolean;
    publiclyAccessible: boolean;
    deletionProtection: boolean;
    backupRetentionPeriod: number;
    enhancedMonitoring: boolean;
  }> {
    try {
      const response = await this.rds.describeDBInstances({
        DBInstanceIdentifier: instanceId
      }).promise();

      const instance = response.DBInstances?.[0];
      if (!instance) {
        throw new Error(`RDS instance ${instanceId} not found`);
      }

      return {
        encrypted: instance.StorageEncrypted || false,
        publiclyAccessible: instance.PubliclyAccessible || false,
        deletionProtection: instance.DeletionProtection || false,
        backupRetentionPeriod: instance.BackupRetentionPeriod || 0,
        enhancedMonitoring: (instance.MonitoringInterval || 0) > 0
      };
    } catch (error) {
      throw new Error(`Failed to check RDS configuration: ${error}`);
    }
  }

  /**
   * Test VPC configuration
   */
  async testVPCConfiguration(vpcId: string): Promise<{
    cidrBlock: string;
    dnsHostnames: boolean;
    dnsSupport: boolean;
    state: string;
  }> {
    try {
      const [vpcResponse, dnsHostnamesResponse, dnsSupportResponse] = await Promise.all([
        this.ec2.describeVpcs({ VpcIds: [vpcId] }).promise(),
        this.ec2.describeVpcAttribute({ VpcId: vpcId, Attribute: 'enableDnsHostnames' }).promise(),
        this.ec2.describeVpcAttribute({ VpcId: vpcId, Attribute: 'enableDnsSupport' }).promise()
      ]);

      const vpc = vpcResponse.Vpcs?.[0];
      if (!vpc) {
        throw new Error(`VPC ${vpcId} not found`);
      }

      return {
        cidrBlock: vpc.CidrBlock!,
        dnsHostnames: dnsHostnamesResponse.EnableDnsHostnames?.Value || false,
        dnsSupport: dnsSupportResponse.EnableDnsSupport?.Value || false,
        state: vpc.State!
      };
    } catch (error) {
      throw new Error(`Failed to check VPC configuration: ${error}`);
    }
  }

  /**
   * Test GuardDuty configuration
   */
  async testGuardDutyConfiguration(detectorId: string): Promise<{
    status: string;
    findingPublishingFrequency: string;
    s3LogsEnabled: boolean;
    malwareProtectionEnabled: boolean;
  }> {
    try {
      const response = await this.guardDuty.getDetector({
        DetectorId: detectorId
      }).promise();

      return {
        status: response.Status!,
        findingPublishingFrequency: response.FindingPublishingFrequency!,
        s3LogsEnabled: response.DataSources?.S3Logs?.Status === 'ENABLED',
        malwareProtectionEnabled: response.DataSources?.MalwareProtection?.ScanEc2InstanceWithFindings?.EbsVolumes?.Status === 'ENABLED'
      };
    } catch (error) {
      throw new Error(`Failed to check GuardDuty configuration: ${error}`);
    }
  }

  /**
   * Test network connectivity (simplified)
   */
  async testNetworkConnectivity(url: string, expectedStatus?: number): Promise<{
    status: number;
    responseTime: number;
    success: boolean;
  }> {
    const start = Date.now();
    
    try {
      const response = await fetch(url);
      const responseTime = Date.now() - start;
      const success = expectedStatus ? response.status === expectedStatus : response.ok;

      return {
        status: response.status,
        responseTime,
        success
      };
    } catch (error) {
      return {
        status: 0,
        responseTime: Date.now() - start,
        success: false
      };
    }
  }

  /**
   * Clean up test resources
   */
  async cleanupTestResources(bucketName: string, testObjects: string[]): Promise<void> {
    try {
      const deletePromises = testObjects.map(key =>
        this.s3.deleteObject({ Bucket: bucketName, Key: key }).promise()
      );

      await Promise.allSettled(deletePromises);
      console.log(`Cleaned up ${testObjects.length} test objects from ${bucketName}`);
    } catch (error) {
      console.warn('Error cleaning up test resources:', error);
    }
  }

  /**
   * Get CloudFormation stack events for debugging
   */
  async getStackEvents(stackName: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.cloudFormation.describeStackEvents({
        StackName: stackName
      }).promise();

      return (response.StackEvents || [])
        .slice(0, limit)
        .map(event => ({
          Timestamp: event.Timestamp,
          ResourceStatus: event.ResourceStatus,
          ResourceType: event.ResourceType,
          LogicalResourceId: event.LogicalResourceId,
          ResourceStatusReason: event.ResourceStatusReason
        }));
    } catch (error) {
      console.error('Error getting stack events:', error);
      return [];
    }
  }

  /**
   * Utility method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  generateTestData(): {
    testId: string;
    timestamp: string;
    content: string;
  } {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();
    const content = `Test data generated at ${timestamp} with ID: ${testId}`;

    return { testId, timestamp, content };
  }

  /**
   * Validate resource tags
   */
  validateResourceTags(tags: AWS.CloudFormation.Tag[], requiredTags: string[]): {
    valid: boolean;
    missingTags: string[];
    presentTags: { [key: string]: string };
  } {
    const presentTags: { [key: string]: string } = {};
    const tagKeys: string[] = [];

    tags.forEach(tag => {
      if (tag.Key && tag.Value) {
        presentTags[tag.Key] = tag.Value;
        tagKeys.push(tag.Key);
      }
    });

    const missingTags = requiredTags.filter(tag => !tagKeys.includes(tag));
    const valid = missingTags.length === 0;

    return { valid, missingTags, presentTags };
  }
}