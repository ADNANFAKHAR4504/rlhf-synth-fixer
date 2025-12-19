error TS2353: Object literal may only specify known properties, and 'policy' does not exist in type 'InterfaceVpcEndpointOptions'.

        policy: new iam.PolicyDocument({

error TS2561: Object literal may only specify known properties, but 'cloudWatchLogsRole' does not exist in type 'TrailProps'. Did you mean to write 'cloudWatchLogGroup'?

      cloudWatchLogsRole: cloudTrailLogRole,

error TS2339: Property 'SnsAction' does not exist on type 'typeof import(".../node_modules/aws-cdk-lib/aws-cloudwatch/index")'.

      alarm.addAlarmAction(new cloudwatch.SnsAction(securityAlertsTopic));

error TS2339: Property 'SnsAction' does not exist on type 'typeof import(".../node_modules/aws-cdk-lib/aws-cloudwatch/index")'.

    }).addAlarmAction(new cloudwatch.SnsAction(securityAlertsTopic));
