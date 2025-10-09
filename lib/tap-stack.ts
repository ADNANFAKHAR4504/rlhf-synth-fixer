import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PodcastStorageStack } from './podcast-storage-stack';
import { PodcastSubscriberStack } from './podcast-subscriber-stack';
import { PodcastCdnStack } from './podcast-cdn-stack';
import { PodcastTranscodingStack } from './podcast-transcoding-stack';
import { PodcastMonitoringStack } from './podcast-monitoring-stack';
import { PodcastDnsStack } from './podcast-dns-stack';
import { PodcastSchedulerStack } from './podcast-scheduler-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Storage stack for S3 audio files
    const storageStack = new PodcastStorageStack(this, 'PodcastStorage', {
      environmentSuffix,
    });

    // Subscriber data stack with DynamoDB and Streams
    const subscriberStack = new PodcastSubscriberStack(
      this,
      'PodcastSubscriber',
      {
        environmentSuffix,
      }
    );

    // Transcoding stack with MediaConvert
    const transcodingStack = new PodcastTranscodingStack(
      this,
      'PodcastTranscoding',
      {
        environmentSuffix,
        audioBucket: storageStack.audioBucket,
      }
    );

    // CDN stack with CloudFront, KeyValueStore, and Lambda@Edge
    const cdnStack = new PodcastCdnStack(this, 'PodcastCdn', {
      environmentSuffix,
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
    });

    // DNS stack with Route 53
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dnsStack = new PodcastDnsStack(this, 'PodcastDns', {
      environmentSuffix,
      distribution: cdnStack.distribution,
    });

    // EventBridge Scheduler stack for automated workflows
    new PodcastSchedulerStack(this, 'PodcastScheduler', {
      environmentSuffix,
      subscriberTable: subscriberStack.subscriberTable,
      audioBucket: storageStack.audioBucket,
      mediaConvertRole: transcodingStack.mediaConvertRole,
      jobTemplateName: transcodingStack.jobTemplateName,
      keyValueStore: cdnStack.keyValueStore,
    });

    // Monitoring stack with CloudWatch
    new PodcastMonitoringStack(this, 'PodcastMonitoring', {
      environmentSuffix,
      distribution: cdnStack.distribution,
      subscriberTable: subscriberStack.subscriberTable,
      audioBucket: storageStack.audioBucket,
    });
  }
}
