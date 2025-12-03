/**
 * Type definitions for the Infrastructure QA and Management System
 */

/**
 * Represents compliance status of a resource
 */
export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  ERROR = 'ERROR',
}

/**
 * Severity level for compliance violations
 */
export enum ViolationSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

/**
 * Supported AWS resource types for scanning
 */
export enum ResourceType {
  S3_BUCKET = 'AWS::S3::Bucket',
  EC2_INSTANCE = 'AWS::EC2::Instance',
  RDS_INSTANCE = 'AWS::RDS::DBInstance',
  LAMBDA_FUNCTION = 'AWS::Lambda::Function',
  IAM_ROLE = 'AWS::IAM::Role',
  SECURITY_GROUP = 'AWS::EC2::SecurityGroup',
  EBS_VOLUME = 'AWS::EC2::Volume',
  CLOUDWATCH_LOG_GROUP = 'AWS::Logs::LogGroup',
}

/**
 * Required tags for all resources
 */
export interface RequiredTags {
  Environment: string;
  Owner: string;
  Team: string;
  CostCenter?: string;
  Project: string;
  CreatedAt: string;
}

/**
 * Represents an AWS resource for inventory and compliance checking
 */
export interface AWSResource {
  id: string;
  arn: string;
  type: ResourceType;
  region: string;
  tags: Record<string, string>;
  createdAt?: Date;
  lastModified?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Compliance violation details
 */
export interface ComplianceViolation {
  resourceId: string;
  resourceArn: string;
  resourceType: ResourceType;
  rule: string;
  severity: ViolationSeverity;
  description: string;
  recommendation: string;
  detectedAt: Date;
}

/**
 * Compliance check result for a single resource
 */
export interface ComplianceCheckResult {
  resourceId: string;
  resourceArn: string;
  resourceType: ResourceType;
  status: ComplianceStatus;
  violations: ComplianceViolation[];
  checkedAt: Date;
}

/**
 * Overall compliance report
 */
export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  totalResources: number;
  compliantResources: number;
  nonCompliantResources: number;
  complianceScore: number; // Percentage 0-100
  resourcesByType: Record<string, number>;
  violationsBySeverity: Record<ViolationSeverity, number>;
  results: ComplianceCheckResult[];
  summary: {
    criticalViolations: number;
    highViolations: number;
    mediumViolations: number;
    lowViolations: number;
  };
}

/**
 * Resource inventory entry
 */
export interface ResourceInventoryEntry {
  resource: AWSResource;
  ageInDays: number;
  isOrphaned: boolean;
  estimatedMonthlyCost?: number;
  complianceStatus: ComplianceStatus;
}

/**
 * Complete resource inventory
 */
export interface ResourceInventory {
  inventoryId: string;
  generatedAt: Date;
  totalResources: number;
  resourcesByRegion: Record<string, number>;
  resourcesByType: Record<string, number>;
  entries: ResourceInventoryEntry[];
}

/**
 * Tagging operation result
 */
export interface TaggingResult {
  resourceId: string;
  resourceArn: string;
  success: boolean;
  tagsApplied?: Record<string, string>;
  error?: Error;
}

/**
 * Scanner configuration
 */
export interface ScannerConfig {
  regions: string[];
  resourceTypes: ResourceType[];
  excludeResourceIds?: string[];
  maxConcurrentRequests?: number;
  timeout?: number;
}

/**
 * Error with context for better debugging
 */
export class ComplianceError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ComplianceError';
    Object.setPrototypeOf(this, ComplianceError.prototype);
  }
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequestsPerSecond: number;
  burstSize?: number;
}

/**
 * Pagination token for AWS API calls
 */
export interface PaginationToken {
  nextToken?: string;
  hasMore: boolean;
}
