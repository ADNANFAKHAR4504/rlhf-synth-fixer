import { Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

/**
 * Standard tagging utility for financial services compliance
 * Ensures consistent tagging across all resources for governance and cost allocation
 */
export class TaggingUtils {
  /**
   * Apply standard tags to a construct and all its children
   * @param construct - The construct to tag
   * @param environment - Environment (prod, staging, dev)
   * @param service - Service name (web, api, database)
   * @param owner - Team or individual responsible
   * @param project - Project identifier
   * @param additionalTags - Any additional custom tags
   */
  public static applyStandardTags(
    construct: IConstruct,
    environment: string,
    service: string,
    owner: string,
    project: string,
    additionalTags?: Record<string, string>
  ): void {
    // Standard tags required for financial services compliance
    const standardTags = {
      Environment: environment,
      Service: service,
      Owner: owner,
      Project: project,
      ManagedBy: 'CDK',
      ComplianceLevel: 'Financial-Services',
      DataClassification: 'Confidential',
      BackupRequired: 'true',
      MonitoringEnabled: 'true',
      ...additionalTags,
    };

    // Apply tags to the construct
    Object.entries(standardTags).forEach(([key, value]) => {
      Tags.of(construct).add(key, value);
    });
  }

  /**
   * Generate resource name following naming convention
   * @param environment - Environment identifier
   * @param service - Service identifier
   * @param resource - Resource type
   * @param suffix - Optional suffix
   */
  public static generateResourceName(
    environment: string,
    service: string,
    resource: string,
    suffix?: string
  ): string {
    const baseName = `${environment}-${service}-${resource}`;
    return suffix && suffix.trim() !== '' ? `${baseName}-${suffix}` : baseName;
  }
}
