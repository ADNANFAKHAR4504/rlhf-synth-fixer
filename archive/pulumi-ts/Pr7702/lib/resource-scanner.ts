/**
 * Resource Scanner for AWS Infrastructure
 *
 * Discovers and catalogs AWS resources across regions with proper
 * pagination, rate limiting, and error handling.
 */

/* eslint-disable import/no-extraneous-dependencies */
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetBucketTaggingCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  LambdaClient,
  ListFunctionsCommand,
  ListTagsCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  ListRolesCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import {
  AWSResource,
  ResourceType,
  ScannerConfig,
  ComplianceError,
  ResourceInventory,
  ResourceInventoryEntry,
  ComplianceStatus,
} from './types';

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + timePassed * this.refillRate
    );
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens = 1;
    }

    this.tokens -= 1;
  }
}

/**
 * Resource Scanner class for discovering AWS resources
 */
export class ResourceScanner {
  private rateLimiter: RateLimiter;

  constructor(private config: ScannerConfig) {
    const maxRPS = config.maxConcurrentRequests || 5;
    this.rateLimiter = new RateLimiter(maxRPS * 2, maxRPS);
  }

  /**
   * Scan all resources across configured regions and types
   */
  async scanAllResources(): Promise<AWSResource[]> {
    const allResources: AWSResource[] = [];

    for (const region of this.config.regions) {
      for (const resourceType of this.config.resourceTypes) {
        try {
          const resources = await this.scanResourceType(region, resourceType);
          allResources.push(...resources);
        } catch (error) {
          console.error(
            `Failed to scan ${resourceType} in ${region}:`,
            error instanceof Error ? error.message : String(error)
          );
          throw new ComplianceError(
            `Failed to scan ${resourceType} in ${region}`,
            {
              region,
              resourceType,
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
    }

    return this.filterExcluded(allResources);
  }

  /**
   * Scan specific resource type in a region
   */
  private async scanResourceType(
    region: string,
    resourceType: ResourceType
  ): Promise<AWSResource[]> {
    await this.rateLimiter.acquire();

    switch (resourceType) {
      case ResourceType.S3_BUCKET:
        return this.scanS3Buckets(region);
      case ResourceType.EC2_INSTANCE:
        return this.scanEC2Instances(region);
      case ResourceType.RDS_INSTANCE:
        return this.scanRDSInstances(region);
      case ResourceType.LAMBDA_FUNCTION:
        return this.scanLambdaFunctions(region);
      case ResourceType.IAM_ROLE:
        return this.scanIAMRoles(region);
      case ResourceType.SECURITY_GROUP:
        return this.scanSecurityGroups(region);
      case ResourceType.EBS_VOLUME:
        return this.scanEBSVolumes(region);
      case ResourceType.CLOUDWATCH_LOG_GROUP:
        return this.scanLogGroups(region);
      default:
        throw new ComplianceError('Unsupported resource type', {
          resourceType,
        });
    }
  }

  /**
   * Scan S3 buckets (S3 is global but we filter by region)
   */
  private async scanS3Buckets(region: string): Promise<AWSResource[]> {
    const client = new S3Client({ region });
    const resources: AWSResource[] = [];

    try {
      const command = new ListBucketsCommand({});
      const response = await client.send(command);

      if (!response.Buckets) {
        return resources;
      }

      // S3 is global, but buckets have regions
      for (const bucket of response.Buckets) {
        if (!bucket.Name) continue;

        try {
          // Get bucket region
          const locationCommand = new GetBucketLocationCommand({
            Bucket: bucket.Name,
          });
          const locationResponse = await client.send(locationCommand);
          const bucketRegion =
            locationResponse.LocationConstraint || 'us-east-1';

          if (bucketRegion !== region) continue;

          // Get bucket tags
          let tags: Record<string, string> = {};
          try {
            const taggingCommand = new GetBucketTaggingCommand({
              Bucket: bucket.Name,
            });
            const taggingResponse = await client.send(taggingCommand);
            if (taggingResponse.TagSet) {
              tags = Object.fromEntries(
                taggingResponse.TagSet.map(t => [t.Key || '', t.Value || ''])
              );
            }
          } catch {
            // Bucket may not have tags
          }

          resources.push({
            id: bucket.Name,
            arn: `arn:aws:s3:::${bucket.Name}`,
            type: ResourceType.S3_BUCKET,
            region: bucketRegion,
            tags,
            createdAt: bucket.CreationDate,
          });
        } catch (error) {
          console.warn(
            `Failed to get details for bucket ${bucket.Name}:`,
            error
          );
        }
      }
    } catch (error) {
      throw new ComplianceError('Failed to scan S3 buckets', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan EC2 instances with pagination
   */
  private async scanEC2Instances(region: string): Promise<AWSResource[]> {
    const client = new EC2Client({ region });
    const resources: AWSResource[] = [];
    let nextToken: string | undefined;

    try {
      do {
        const command = new DescribeInstancesCommand({
          NextToken: nextToken,
          MaxResults: 100,
        });
        const response = await client.send(command);

        if (response.Reservations) {
          for (const reservation of response.Reservations) {
            if (!reservation.Instances) continue;

            for (const instance of reservation.Instances) {
              if (!instance.InstanceId) continue;

              const tags: Record<string, string> = {};
              if (instance.Tags) {
                for (const tag of instance.Tags) {
                  if (tag.Key && tag.Value) {
                    tags[tag.Key] = tag.Value;
                  }
                }
              }

              // Get account ID from instance ARN if available, otherwise use placeholder
              const accountId =
                instance.IamInstanceProfile?.Arn?.split(':')[4] ||
                '000000000000';

              resources.push({
                id: instance.InstanceId,
                arn: `arn:aws:ec2:${region}:${accountId}:instance/${instance.InstanceId}`,
                type: ResourceType.EC2_INSTANCE,
                region,
                tags,
                createdAt: instance.LaunchTime,
                metadata: {
                  instanceType: instance.InstanceType,
                  state: instance.State?.Name,
                  imageId: instance.ImageId,
                },
              });
            }
          }
        }

        nextToken = response.NextToken;
      } while (nextToken);
    } catch (error) {
      throw new ComplianceError('Failed to scan EC2 instances', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan RDS instances with pagination
   */
  private async scanRDSInstances(region: string): Promise<AWSResource[]> {
    const client = new RDSClient({ region });
    const resources: AWSResource[] = [];
    let marker: string | undefined;

    try {
      do {
        const command = new DescribeDBInstancesCommand({
          Marker: marker,
          MaxRecords: 100,
        });
        const response = await client.send(command);

        if (response.DBInstances) {
          for (const instance of response.DBInstances) {
            if (!instance.DBInstanceIdentifier || !instance.DBInstanceArn)
              continue;

            const tags: Record<string, string> = {};
            if (instance.TagList) {
              for (const tag of instance.TagList) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }
            }

            resources.push({
              id: instance.DBInstanceIdentifier,
              arn: instance.DBInstanceArn,
              type: ResourceType.RDS_INSTANCE,
              region,
              tags,
              createdAt: instance.InstanceCreateTime,
              metadata: {
                engine: instance.Engine,
                engineVersion: instance.EngineVersion,
                status: instance.DBInstanceStatus,
              },
            });
          }
        }

        marker = response.Marker;
      } while (marker);
    } catch (error) {
      throw new ComplianceError('Failed to scan RDS instances', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan Lambda functions with pagination
   */
  private async scanLambdaFunctions(region: string): Promise<AWSResource[]> {
    const client = new LambdaClient({ region });
    const resources: AWSResource[] = [];
    let marker: string | undefined;

    try {
      do {
        const command = new ListFunctionsCommand({
          Marker: marker,
          MaxItems: 100,
        });
        const response = await client.send(command);

        if (response.Functions) {
          for (const func of response.Functions) {
            if (!func.FunctionName || !func.FunctionArn) continue;

            // Get tags for function
            let tags: Record<string, string> = {};
            try {
              const tagsCommand = new ListTagsCommand({
                Resource: func.FunctionArn,
              });
              const tagsResponse = await client.send(tagsCommand);
              if (tagsResponse.Tags) {
                tags = tagsResponse.Tags;
              }
            } catch {
              // Function may not have tags
            }

            resources.push({
              id: func.FunctionName,
              arn: func.FunctionArn,
              type: ResourceType.LAMBDA_FUNCTION,
              region,
              tags,
              lastModified: func.LastModified
                ? new Date(func.LastModified)
                : undefined,
              metadata: {
                runtime: func.Runtime,
                handler: func.Handler,
                memorySize: func.MemorySize,
              },
            });
          }
        }

        marker = response.NextMarker;
      } while (marker);
    } catch (error) {
      throw new ComplianceError('Failed to scan Lambda functions', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan IAM roles (IAM is global, only scan once)
   */
  private async scanIAMRoles(region: string): Promise<AWSResource[]> {
    // Only scan IAM from us-east-1 to avoid duplicates
    if (region !== 'us-east-1') {
      return [];
    }

    const client = new IAMClient({ region });
    const resources: AWSResource[] = [];
    let marker: string | undefined;

    try {
      do {
        const command = new ListRolesCommand({
          Marker: marker,
          MaxItems: 100,
        });
        const response = await client.send(command);

        if (response.Roles) {
          for (const role of response.Roles) {
            if (!role.RoleName || !role.Arn) continue;

            // Get full role details including tags
            let tags: Record<string, string> = {};
            try {
              const getRoleCommand = new GetRoleCommand({
                RoleName: role.RoleName,
              });
              const roleResponse = await client.send(getRoleCommand);
              if (roleResponse.Role?.Tags) {
                tags = Object.fromEntries(
                  roleResponse.Role.Tags.map(t => [t.Key || '', t.Value || ''])
                );
              }
            } catch {
              // Role may not have tags
            }

            resources.push({
              id: role.RoleName,
              arn: role.Arn,
              type: ResourceType.IAM_ROLE,
              region: 'us-east-1', // IAM is global
              tags,
              createdAt: role.CreateDate,
              metadata: {
                path: role.Path,
              },
            });
          }
        }

        marker = response.Marker;
      } while (marker);
    } catch (error) {
      throw new ComplianceError('Failed to scan IAM roles', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan Security Groups with pagination
   */
  private async scanSecurityGroups(region: string): Promise<AWSResource[]> {
    const client = new EC2Client({ region });
    const resources: AWSResource[] = [];
    let nextToken: string | undefined;

    try {
      do {
        const command = new DescribeSecurityGroupsCommand({
          NextToken: nextToken,
          MaxResults: 100,
        });
        const response = await client.send(command);

        if (response.SecurityGroups) {
          for (const sg of response.SecurityGroups) {
            if (!sg.GroupId) continue;

            const tags: Record<string, string> = {};
            if (sg.Tags) {
              for (const tag of sg.Tags) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }
            }

            // Use placeholder for account ID as OwnerId isn't available in type
            const accountId = '000000000000';

            resources.push({
              id: sg.GroupId,
              arn: `arn:aws:ec2:${region}:${accountId}:security-group/${sg.GroupId}`,
              type: ResourceType.SECURITY_GROUP,
              region,
              tags,
              metadata: {
                groupName: sg.GroupName,
                vpcId: sg.VpcId,
              },
            });
          }
        }

        nextToken = response.NextToken;
      } while (nextToken);
    } catch (error) {
      throw new ComplianceError('Failed to scan Security Groups', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan EBS volumes with pagination
   */
  private async scanEBSVolumes(region: string): Promise<AWSResource[]> {
    const client = new EC2Client({ region });
    const resources: AWSResource[] = [];
    let nextToken: string | undefined;

    try {
      do {
        const command = new DescribeVolumesCommand({
          NextToken: nextToken,
          MaxResults: 100,
        });
        const response = await client.send(command);

        if (response.Volumes) {
          for (const volume of response.Volumes) {
            if (!volume.VolumeId) continue;

            const tags: Record<string, string> = {};
            if (volume.Tags) {
              for (const tag of volume.Tags) {
                if (tag.Key && tag.Value) {
                  tags[tag.Key] = tag.Value;
                }
              }
            }

            resources.push({
              id: volume.VolumeId,
              arn: `arn:aws:ec2:${region}::volume/${volume.VolumeId}`,
              type: ResourceType.EBS_VOLUME,
              region,
              tags,
              createdAt: volume.CreateTime,
              metadata: {
                size: volume.Size,
                state: volume.State,
                volumeType: volume.VolumeType,
              },
            });
          }
        }

        nextToken = response.NextToken;
      } while (nextToken);
    } catch (error) {
      throw new ComplianceError('Failed to scan EBS volumes', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Scan CloudWatch Log Groups with pagination
   */
  private async scanLogGroups(region: string): Promise<AWSResource[]> {
    const client = new CloudWatchLogsClient({ region });
    const resources: AWSResource[] = [];
    let nextToken: string | undefined;

    try {
      do {
        const command = new DescribeLogGroupsCommand({
          nextToken,
          limit: 50,
        });
        const response = await client.send(command);

        if (response.logGroups) {
          for (const logGroup of response.logGroups) {
            if (!logGroup.logGroupName || !logGroup.arn) continue;

            resources.push({
              id: logGroup.logGroupName,
              arn: logGroup.arn,
              type: ResourceType.CLOUDWATCH_LOG_GROUP,
              region,
              tags: {}, // Log groups don't have tags accessible via DescribeLogGroups
              createdAt: logGroup.creationTime
                ? new Date(logGroup.creationTime)
                : undefined,
              metadata: {
                retentionInDays: logGroup.retentionInDays,
                storedBytes: logGroup.storedBytes,
              },
            });
          }
        }

        nextToken = response.nextToken;
      } while (nextToken);
    } catch (error) {
      throw new ComplianceError('Failed to scan CloudWatch Log Groups', {
        region,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return resources;
  }

  /**
   * Filter out excluded resources
   */
  private filterExcluded(resources: AWSResource[]): AWSResource[] {
    if (
      !this.config.excludeResourceIds ||
      this.config.excludeResourceIds.length === 0
    ) {
      return resources;
    }

    return resources.filter(
      resource => !this.config.excludeResourceIds?.includes(resource.id)
    );
  }

  /**
   * Generate resource inventory with age and compliance info
   */
  async generateInventory(
    resources: AWSResource[],
    complianceStatuses: Map<string, ComplianceStatus>
  ): Promise<ResourceInventory> {
    const entries: ResourceInventoryEntry[] = resources.map(resource => {
      const createdAt = resource.createdAt || new Date();
      const ageInDays = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        resource,
        ageInDays,
        isOrphaned: this.isOrphaned(resource),
        complianceStatus:
          complianceStatuses.get(resource.id) ||
          ComplianceStatus.NOT_APPLICABLE,
      };
    });

    const resourcesByRegion: Record<string, number> = {};
    const resourcesByType: Record<string, number> = {};

    for (const entry of entries) {
      resourcesByRegion[entry.resource.region] =
        (resourcesByRegion[entry.resource.region] || 0) + 1;
      resourcesByType[entry.resource.type] =
        (resourcesByType[entry.resource.type] || 0) + 1;
    }

    return {
      inventoryId: `inventory-${Date.now()}`,
      generatedAt: new Date(),
      totalResources: entries.length,
      resourcesByRegion,
      resourcesByType,
      entries,
    };
  }

  /**
   * Determine if a resource is orphaned (simple heuristic)
   */
  private isOrphaned(resource: AWSResource): boolean {
    // A resource is considered orphaned if:
    // 1. It has no tags at all
    // 2. It's very old (>180 days) and has no Owner tag
    // 3. It has a "ToDelete" or "Deprecated" tag

    if (Object.keys(resource.tags).length === 0) {
      return true;
    }

    if (
      resource.tags['ToDelete'] === 'true' ||
      resource.tags['Deprecated'] === 'true'
    ) {
      return true;
    }

    if (resource.createdAt) {
      const ageInDays = Math.floor(
        (Date.now() - resource.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (ageInDays > 180 && !resource.tags['Owner']) {
        return true;
      }
    }

    return false;
  }
}
