import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface SESConfigurationStackProps extends cdk.StackProps {
  environmentSuffix: string;
  verifiedDomain: string;
  bounceTopicArn?: string;
  complaintTopicArn?: string;
  deliveryTopicArn?: string;
}

export class SESConfigurationStack extends cdk.Stack {
  public readonly configurationSet: ses.ConfigurationSet;

  constructor(scope: Construct, id: string, props: SESConfigurationStackProps) {
    super(scope, id, props);

    const { environmentSuffix, verifiedDomain } = props;

    // Apply standard tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Project', 'SESConfiguration');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // SES Configuration Set for tracking
    this.configurationSet = new ses.ConfigurationSet(
      this,
      'EmailConfigurationSet',
      {
        configurationSetName: `email-config-set-${environmentSuffix}`,
      }
    );

    // Event destinations for SES feedback
    if (props.bounceTopicArn) {
      this.configurationSet.addEventDestination('BounceEventDestination', {
        destination: ses.EventDestination.snsTopic(
          sns.Topic.fromTopicArn(this, 'BounceTopic', props.bounceTopicArn)
        ),
        events: [ses.EmailSendingEvent.BOUNCE],
        enabled: true,
      });
    }

    if (props.complaintTopicArn) {
      this.configurationSet.addEventDestination('ComplaintEventDestination', {
        destination: ses.EventDestination.snsTopic(
          sns.Topic.fromTopicArn(
            this,
            'ComplaintTopic',
            props.complaintTopicArn
          )
        ),
        events: [ses.EmailSendingEvent.COMPLAINT],
        enabled: true,
      });
    }

    if (props.deliveryTopicArn) {
      this.configurationSet.addEventDestination('DeliveryEventDestination', {
        destination: ses.EventDestination.snsTopic(
          sns.Topic.fromTopicArn(this, 'DeliveryTopic', props.deliveryTopicArn)
        ),
        events: [ses.EmailSendingEvent.DELIVERY],
        enabled: true,
      });
    }

    // Create email identity for the verified domain
    const emailIdentity = new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.domain(verifiedDomain.split('@')[1]), // Extract domain part
      configurationSet: this.configurationSet,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ConfigurationSetName', {
      value: this.configurationSet.configurationSetName,
      description: 'SES Configuration Set name for email tracking',
      exportName: `ses-config-set-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EmailIdentityArn', {
      value: emailIdentity.emailIdentityArn,
      description: 'SES Email Identity ARN',
      exportName: `ses-email-identity-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SetupInstructions', {
      value: JSON.stringify(
        {
          message: 'SES Configuration Setup Instructions',
          steps: [
            '1. Verify your domain in the SES console if not already verified',
            '2. Request production access (move out of sandbox) in SES console',
            '3. Configure DKIM authentication for your domain',
            '4. Set up SPF and DMARC records in your DNS',
            '5. Monitor reputation metrics in the SES console',
          ],
          domain: verifiedDomain.split('@')[1],
          configurationSet: this.configurationSet.configurationSetName,
        },
        null,
        2
      ),
      description: 'Instructions for completing SES setup',
    });
  }
}
