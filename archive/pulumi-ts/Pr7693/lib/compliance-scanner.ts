export interface ComplianceScanResult {
  timestamp: string;
  environmentSuffix: string;
  region: string;
  summary: ComplianceSummary;
  details: ComplianceDetails;
  groupedByService: Record<string, ResourceInfo[]>;
  recommendations: Recommendation[];
  reportLocation?: string;
  errors?: ServiceError[];
}

export interface ComplianceSummary {
  ec2: ServiceCompliance;
  rds: ServiceCompliance;
  s3: ServiceCompliance;
  overall: ServiceCompliance;
}

export interface ServiceCompliance {
  total: number;
  compliant: number;
  nonCompliant: number;
  compliancePercentage: string;
}

export interface ComplianceDetails {
  ec2: {
    compliant: ResourceInfo[];
    nonCompliant: ResourceInfo[];
  };
  rds: {
    compliant: ResourceInfo[];
    nonCompliant: ResourceInfo[];
  };
  s3: {
    compliant: ResourceInfo[];
    nonCompliant: ResourceInfo[];
  };
}

export interface ResourceInfo {
  resourceId: string;
  resourceType: string;
  createDate?: string;
  launchDate?: string;
  ageInDays: number;
  region: string;
  tags: Record<string, string>;
  missingTags: string[];
  flagged?: boolean;
  flagReason?: string;
  state?: string;
  engine?: string;
}

export interface Recommendation {
  service?: string;
  count?: number;
  action: string;
  resourceIds?: string[];
  moreCount?: number;
  priority?: string;
}

export interface ServiceError {
  service: string;
  error: string;
}

export class ComplianceScanner {
  // Type definitions for use in Lambda
}
