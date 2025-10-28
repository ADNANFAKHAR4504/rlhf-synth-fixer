TapStackpr5192  ╷
                │ Error: creating ECS Service (multi-tier-service): operation error ECS: CreateService, https response error StatusCode: 400, RequestID: 562acfb1-365a-47f1-b563-bab6e888064c, InvalidParameterException: The target group with targetGroupArn arn:aws:elasticloadbalancing:us-west-2:***:targetgroup/multi-tier-tg/90888d25cdd06b6c does not have an associated load balancer.
                │ 
                │   with aws_ecs_service.ecs_service_A3298475 (ecs/service),
                │   on cdk.tf.json line 755, in resource.aws_ecs_service.ecs_service_A3298475 (ecs/service):
                │  755:       }
                │ 
                ╵
TapStackpr5192  ╷
                │ Error: modifying ELBv2 Load Balancer (arn:aws:elasticloadbalancing:us-west-2:***:loadbalancer/app/multi-tier-alb/72d701a967e7e10d) attributes: operation error Elastic Load Balancing v2: ModifyLoadBalancerAttributes, https response error StatusCode: 400, RequestID: ca5a865d-4464-4fc0-ba7c-c593e2d3d107, InvalidConfigurationRequest: Access Denied for bucket: multi-tier-assets-1761637992083. Please check S3bucket permission
                │ 
                │   with aws_lb.alb_88D76693 (alb/alb),
                │   on cdk.tf.json line 1004, in resource.aws_lb.alb_88D76693 (alb/alb):
                │ 1004:       }
                │ 
                ╵
TapStackpr5192  ::error::Terraform exited with code 1.
0 Stacks deploying     1 Stack done     0 Stacks waiting
TapStackpr5192  ╷
                │ Error: modifying ELBv2 Load Balancer (arn:aws:elasticloadbalancing:us-west-2:***:loadbalancer/app/multi-tier-alb/9efef48d2db16379) attributes: operation error Elastic Load Balancing v2: ModifyLoadBalancerAttributes, https response error StatusCode: 400, RequestID: 5cb9821c-a99e-4538-9c9e-80bcf928c693, InvalidConfigurationRequest: Access Denied for bucket: multi-tier-assets-1761640840475. Please check S3bucket permission
                │ 
                │   with aws_lb.alb_88D76693 (alb/alb),
                │   on cdk.tf.json line 1017, in resource.aws_lb.alb_88D76693 (alb/alb):
                │ 1017:       }
                │ 
                ╵
TapStackpr5192  ╷
                │ Error: putting S3 Bucket (multi-tier-assets-1761640840475) Policy: operation error S3: PutBucketPolicy, https response error StatusCode: 400, RequestID: AB8QPAFDNXAWQDW5, HostID: L2EY12L9m6ERqfz0DCgKk3fpLTq5MuM1xNLf/sKK7UnCVl0INAYtVuFPYi8aWHsJJQoktY3tjN05hc76QWa0gg==, api error MalformedPolicy: Policy has an invalid condition key
                │ 
                │   with aws_s3_bucket_policy.s3_bucket-policy_252336C9 (s3/bucket-policy),
                │   on cdk.tf.json line 1214, in resource.aws_s3_bucket_policy.s3_bucket-policy_252336C9 (s3/bucket-policy):
                │ 1214:       }
                │ 
                ╵
TapStackpr5192  ::error::Terraform exited with code 1.
Invoking Terraform CLI failed with exit code 1
0 Stacks deploying     1 Stack done     0 Stacks waiting
