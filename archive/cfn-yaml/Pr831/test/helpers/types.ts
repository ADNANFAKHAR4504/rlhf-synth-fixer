export interface CloudFormationStack {
  StackName: string;
  StackStatus: string;
  CreationTime: Date;
  Outputs: { [key: string]: string };
  Tags: CloudFormationTag[];
}

export interface CloudFormationTag {
  Key?: string;
  Value?: string;
}

export interface TestConfiguration {
  stackName: string;
  region: string;
  environmentSuffix: string;
  timeouts: {
    unit: number;
    integration: number;
    deployment: number;
  };
}

export interface SecurityTestResults {
  s3Encryption: {
    encrypted: boolean;
    algorithm: string | undefined;
    keyId: string | undefined;
  };
  s3PublicAccess: {
    blockPublicAcls: boolean;
    blockPublicPolicy: boolean;
    ignorePublicAcls: boolean;
    restrictPublicBuckets: boolean;
  };
  wafConfiguration: {
    rulesCount: number;
    managedRules: string[];
    defaultAction: string;
  };
  rdsConfiguration: {
    encrypted: boolean;
    publiclyAccessible: boolean;
    deletionProtection: boolean;
    backupRetentionPeriod: number;
    enhancedMonitoring: boolean;
  };
  vpcConfiguration: {
    cidrBlock: string;
    dnsHostnames: boolean;
    dnsSupport: boolean;
    state: string;
  };
  guardDutyConfiguration: {
    status: string;
    findingPublishingFrequency: string;
    s3LogsEnabled: boolean;
    malwareProtectionEnabled: boolean;
  };
}

export interface NetworkTestResult {
  status: number;
  responseTime: number;
  success: boolean;
  url?: string;
  error?: string;
}

export interface TestResource {
  type: string;
  id: string;
  name: string;
  properties: { [key: string]: any };
  tags: { [key: string]: string };
}

export interface IntegrationTestContext {
  stackOutputs: { [key: string]: string };
  testResources: TestResource[];
  cleanup: (() => Promise<void>)[];
}

export interface TestMetrics {
  testName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  assertions: number;
  errors: string[];
}

export interface DeploymentTestResult {
  stackName: string;
  deploymentTime: number;
  resourceCount: number;
  outputCount: number;
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface PerformanceTestResult {
  operation: string;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  requestCount: number;
  concurrentRequests?: number;
}

export interface SecurityScanResult {
  resourceType: string;
  resourceId: string;
  checks: {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  overallStatus: 'SECURE' | 'VULNERABLE' | 'NEEDS_REVIEW';
}

export interface ComplianceCheckResult {
  standard: string; // e.g., 'AWS_FOUNDATIONAL_SECURITY_STANDARD', 'PCI_DSS', 'HIPAA'
  controls: {
    controlId: string;
    title: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
    findings: string[];
    recommendations: string[];
  }[];
  overallCompliance: number; // percentage
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  metrics: TestMetrics[];
}

export interface InfrastructureTestConfig {
  testTypes: {
    unit: boolean;
    integration: boolean;
    security: boolean;
    performance: boolean;
    compliance: boolean;
  };
  thresholds: {
    securityScore: number;
    performanceLatency: number;
    complianceRate: number;
    testCoverage: number;
  };
  environments: string[];
  notifications: {
    slack?: string;
    email?: string[];
    webhooks?: string[];
  };
}

export type AWS_RESOURCE_TYPE = 
  | 'AWS::S3::Bucket'
  | 'AWS::S3::BucketPolicy'
  | 'AWS::CloudFront::Distribution'
  | 'AWS::CloudFront::OriginAccessControl'
  | 'AWS::WAFv2::WebACL'
  | 'AWS::GuardDuty::Detector'
  | 'AWS::EC2::VPC'
  | 'AWS::EC2::Subnet'
  | 'AWS::EC2::SecurityGroup'
  | 'AWS::EC2::NetworkAcl'
  | 'AWS::EC2::NetworkAclEntry'
  | 'AWS::RDS::DBInstance'
  | 'AWS::RDS::DBSubnetGroup'
  | 'AWS::KMS::Key'
  | 'AWS::KMS::Alias'
  | 'AWS::SecretsManager::Secret'
  | 'AWS::IAM::Role'
  | 'AWS::IAM::ManagedPolicy';

export interface ResourceTestCase {
  resourceType: AWS_RESOURCE_TYPE;
  logicalId: string;
  testCases: {
    name: string;
    description: string;
    assertions: Array<{
      property: string;
      expectedValue: any;
      condition: 'equals' | 'contains' | 'exists' | 'matches' | 'greaterThan' | 'lessThan';
    }>;
  }[];
}