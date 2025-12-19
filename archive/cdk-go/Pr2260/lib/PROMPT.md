Write an AWS **CDK v2** app in **Go** that deploys two identical stacks: one in **us-east-1** and one in **us-west-2**.

1. **Project**: Go 1.20+, Go modules, entry file `main.go`.
2. **Stacks**: Create a reusable `NewWebStack(scope constructs.Construct, id string, props *WebStackProps) awscdk.Stack`. Instantiate it twice as `WebStackUSEast1` and `WebStackUSWest2`. Use `CDK_DEFAULT_ACCOUNT` and explicit regions (`us-east-1`, `us-west-2`).
3. **VPC**: Per stack, create a VPC with **MaxAzs = 3**, at least **3 public** and **3 private** subnets.
4. **Load Balancer**: Public **ALB** on port **80**. Health checks so traffic only reaches **healthy** targets.
5. **Auto Scaling**: **ASG** with **t3.medium** instances. **Min=2, Desired=2, Max=6**. Register the ASG with the ALB target group.
6. **Security**: Security groups allow inbound **HTTP (80)** and **HTTPS (443)** from anywhere (`0.0.0.0/0`, `::/0`). Keep reasonable egress.
7. **Tags**: Apply at stack level so all resources inherit: `Environment=Production`, `Team=DevOps`.
8. **Monitoring**: CloudWatch scaling based on CPU. **Scale out** when average CPU **> 70%** (target tracking or alarm + policy).
9. **Outputs**: Export VPC ID, ALB DNS name, and ASG name for each stack.
(`awsec2`, `awsautoscaling`, `awselasticloadbalancingv2`, `awscloudwatch`). Ensure `cdk synth` `cdk deploy` works cleanly.
