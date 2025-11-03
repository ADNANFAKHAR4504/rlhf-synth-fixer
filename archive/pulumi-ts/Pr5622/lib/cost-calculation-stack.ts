/**
 * cost-calculation-stack.ts
 *
 * Component for calculating estimated cost savings from EC2 instance scheduling.
 * Uses EC2 pricing data to estimate monthly savings based on 13 hours of daily shutdown.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CostCalculationStackArgs {
  environmentSuffix: string;
  instanceIds: pulumi.Input<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CostCalculationStack extends pulumi.ComponentResource {
  public readonly estimatedMonthlySavings: pulumi.Output<number>;
  public readonly outputs: pulumi.Output<{
    estimatedMonthlySavings: number;
    instanceCount: number;
  }>;

  constructor(
    name: string,
    args: CostCalculationStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:cost:CostCalculationStack', name, args, opts);

    const { instanceIds } = args;

    // EC2 pricing per hour for ap-southeast-1 (Singapore)
    // These are approximate on-demand prices as of January 2025
    // Prices may vary - verify current pricing at https://aws.amazon.com/ec2/pricing/on-demand/
    const pricingMap: { [key: string]: number } = {
      't3.micro': 0.0132,
      't3.small': 0.0264,
      't3.medium': 0.0528,
      't3.large': 0.1056,
      't3.xlarge': 0.2112,
      't3.2xlarge': 0.4224,
      't2.micro': 0.0146,
      't2.small': 0.0292,
      't2.medium': 0.0584,
      't2.large': 0.1168,
      'm5.large': 0.12,
      'm5.xlarge': 0.24,
      'm5.2xlarge': 0.48,
    };

    // Calculate savings based on instance types
    this.estimatedMonthlySavings = pulumi
      .output(instanceIds)
      .apply(async ids => {
        if (ids.length === 0) {
          return 0;
        }

        let totalHourlyCost = 0;

        // Fetch instance details
        for (const instanceId of ids) {
          try {
            const instance = await aws.ec2.getInstance({
              instanceId: instanceId,
            });

            const instanceType = instance.instanceType;
            const hourlyRate = pricingMap[instanceType] || 0.05; // Default rate

            totalHourlyCost += hourlyRate;
          } catch (error) {
            console.warn(`Could not fetch details for instance ${instanceId}`);
          }
        }

        // Calculate monthly savings
        // 13 hours per day * 22 working days per month = 286 hours per month
        const monthlyShutdownHours = 13 * 22;
        const monthlySavings = totalHourlyCost * monthlyShutdownHours;

        return Math.round(monthlySavings * 100) / 100;
      });

    this.outputs = pulumi.output({
      estimatedMonthlySavings: this.estimatedMonthlySavings,
      instanceCount: pulumi.output(instanceIds).apply(ids => ids.length),
    });

    this.registerOutputs({});
  }
}
