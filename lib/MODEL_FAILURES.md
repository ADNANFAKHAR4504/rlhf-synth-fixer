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

