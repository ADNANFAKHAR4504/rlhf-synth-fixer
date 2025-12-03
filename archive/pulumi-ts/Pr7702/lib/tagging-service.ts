/**
 * Tagging Service for AWS Resources
 *
 * Automatically applies tags to resources and manages tag compliance.
 */

/* eslint-disable import/no-extraneous-dependencies */
import {
  ResourceGroupsTaggingAPIClient,
  TagResourcesCommand,
  UntagResourcesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api';

import {
  AWSResource,
  TaggingResult,
  RequiredTags,
  ComplianceError,
} from './types';

/**
 * Tagging Service class
 */
export class TaggingService {
  private client: ResourceGroupsTaggingAPIClient;

  constructor(region: string = 'us-east-1') {
    this.client = new ResourceGroupsTaggingAPIClient({ region });
  }

  /**
   * Apply tags to a resource
   */
  async tagResource(
    resourceArn: string,
    tags: Record<string, string>
  ): Promise<TaggingResult> {
    try {
      const command = new TagResourcesCommand({
        ResourceARNList: [resourceArn],
        Tags: tags,
      });

      const response = await this.client.send(command);

      if (
        response.FailedResourcesMap &&
        Object.keys(response.FailedResourcesMap).length > 0
      ) {
        const errorInfo = response.FailedResourcesMap[resourceArn];
        throw new ComplianceError('Failed to tag resource', {
          resourceArn,
          errorCode: errorInfo?.ErrorCode,
          errorMessage: errorInfo?.ErrorMessage,
        });
      }

      return {
        resourceId: resourceArn,
        resourceArn,
        success: true,
        tagsApplied: tags,
      };
    } catch (error) {
      return {
        resourceId: resourceArn,
        resourceArn,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Remove tags from a resource
   */
  async untagResource(
    resourceArn: string,
    tagKeys: string[]
  ): Promise<TaggingResult> {
    try {
      const command = new UntagResourcesCommand({
        ResourceARNList: [resourceArn],
        TagKeys: tagKeys,
      });

      const response = await this.client.send(command);

      if (
        response.FailedResourcesMap &&
        Object.keys(response.FailedResourcesMap).length > 0
      ) {
        const errorInfo = response.FailedResourcesMap[resourceArn];
        throw new ComplianceError('Failed to untag resource', {
          resourceArn,
          errorCode: errorInfo?.ErrorCode,
          errorMessage: errorInfo?.ErrorMessage,
        });
      }

      return {
        resourceId: resourceArn,
        resourceArn,
        success: true,
      };
    } catch (error) {
      return {
        resourceId: resourceArn,
        resourceArn,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Apply required tags to resources missing them
   */
  async applyRequiredTags(
    resources: AWSResource[],
    defaultTags: Partial<RequiredTags>
  ): Promise<TaggingResult[]> {
    const results: TaggingResult[] = [];

    for (const resource of resources) {
      const missingTags = this.getMissingRequiredTags(resource);

      if (missingTags.length === 0) {
        // Resource already has all required tags
        continue;
      }

      const tagsToApply: Record<string, string> = {};
      for (const tagKey of missingTags) {
        if (defaultTags[tagKey as keyof RequiredTags]) {
          tagsToApply[tagKey] = defaultTags[
            tagKey as keyof RequiredTags
          ] as string;
        } else if (tagKey === 'CreatedAt') {
          tagsToApply[tagKey] = new Date().toISOString();
        }
      }

      if (Object.keys(tagsToApply).length > 0) {
        const result = await this.tagResource(resource.arn, tagsToApply);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get list of missing required tags for a resource
   */
  private getMissingRequiredTags(resource: AWSResource): string[] {
    const requiredTags: (keyof RequiredTags)[] = [
      'Environment',
      'Owner',
      'Team',
      'Project',
      'CreatedAt',
    ];

    const missingTags: string[] = [];
    for (const tag of requiredTags) {
      if (!resource.tags[tag]) {
        missingTags.push(tag);
      }
    }

    return missingTags;
  }

  /**
   * Standardize tag values (e.g., lowercase environment names)
   */
  async standardizeTags(resources: AWSResource[]): Promise<TaggingResult[]> {
    const results: TaggingResult[] = [];

    for (const resource of resources) {
      const tagsToUpdate: Record<string, string> = {};

      // Standardize Environment tag
      if (resource.tags['Environment']) {
        const standardEnv = resource.tags['Environment'].toLowerCase();
        if (standardEnv !== resource.tags['Environment']) {
          tagsToUpdate['Environment'] = standardEnv;
        }
      }

      // Standardize boolean tags
      for (const [key, value] of Object.entries(resource.tags)) {
        if (value === 'True' || value === 'TRUE') {
          tagsToUpdate[key] = 'true';
        } else if (value === 'False' || value === 'FALSE') {
          tagsToUpdate[key] = 'false';
        }
      }

      if (Object.keys(tagsToUpdate).length > 0) {
        const result = await this.tagResource(resource.arn, tagsToUpdate);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Bulk tag resources with the same tags
   */
  async bulkTagResources(
    resourceArns: string[],
    tags: Record<string, string>
  ): Promise<TaggingResult[]> {
    const results: TaggingResult[] = [];
    const batchSize = 20; // AWS limit for TagResources API

    for (let i = 0; i < resourceArns.length; i += batchSize) {
      const batch = resourceArns.slice(i, i + batchSize);

      try {
        const command = new TagResourcesCommand({
          ResourceARNList: batch,
          Tags: tags,
        });

        const response = await this.client.send(command);

        for (const arn of batch) {
          if (response.FailedResourcesMap?.[arn]) {
            const errorInfo = response.FailedResourcesMap[arn];
            results.push({
              resourceId: arn,
              resourceArn: arn,
              success: false,
              error: new ComplianceError('Failed to tag resource', {
                errorCode: errorInfo.ErrorCode,
                errorMessage: errorInfo.ErrorMessage,
              }),
            });
          } else {
            results.push({
              resourceId: arn,
              resourceArn: arn,
              success: true,
              tagsApplied: tags,
            });
          }
        }
      } catch (error) {
        for (const arn of batch) {
          results.push({
            resourceId: arn,
            resourceArn: arn,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    return results;
  }
}
