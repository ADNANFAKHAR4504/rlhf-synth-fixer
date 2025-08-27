Build (compile-time) failures

Wrong package

LLM: package com.example;

Ideal: package app;
→ Fails when project structure expects app (or causes duplicate mains / classpath issues).

Nonexistent / wrong CDK v2 constructs

LLM tries to use high-level classes that don’t exist in v2 (or exist only as Cfn* L1s):
InternetGateway, VpcGatewayAttachment, PublicSubnet, PrivateSubnet, RouteTable, Route, SubnetRouteTableAssociation, and their *Props.

In CDK v2 you either rely on Vpc L2 to create/attach IGW, route tables, subnets, etc., or use Cfn* L1s. Mixing “nice” non-existent L2s will not compile.

Deprecated/removed Auto Scaling API

LLM uses LaunchConfiguration/LaunchConfigurationProps and sets AutoScalingGroupProps.launchConfiguration(...).

In CDK v2 Java, LaunchConfiguration L2 isn’t supported the way it’s used; ASG expects a machineImage(...), or a launchTemplate(...). The launchConfiguration prop doesn’t exist → compile error.

Wrong property types on ASG

LLM passes securityGroups(Arrays.asList(webSecurityGroup.getSecurityGroupId())) into the (non-existent) launch configuration. Even if it compiled, types don’t match typical L2 expectations (objects vs IDs).

Using .getRef() on non-Cfn constructs

internetGateway.getRef() implies a Cfn* construct. The LLM used a non-Cfn “InternetGateway” symbol, so .getRef() doesn’t exist → compile error.

Hard-coding AZs into PublicSubnetProps/PrivateSubnetProps

Those specific props/classes don’t exist as L2s in v2; if converted to L1s you’d need CfnSubnet (and different prop names). As written, it won’t compile.

Listener/Target wiring API mismatch

LLM manually constructs ApplicationListener with a props object including defaultAction(ListenerAction.forward(...)). CDK v2 pattern uses alb.addListener(...) + addTargets(...). The constructor signature the LLM used is not valid in v2 Java as written → compile error.

Image selection API misuse

LLM sets imageId("ami-...") inside a launch configuration props block. Correct v2 is MachineImage.latestAmazonLinux2023() or MachineImage.genericLinux(...) tied to the ASG. As written triggers type/prop errors.

Subnet selection type mismatch

LLM passes Arrays.asList(publicSubnet1, publicSubnet2) to SubnetSelection.builder().subnets(...) using PublicSubnet objects that (as used) don’t exist; v2 wants ISubnet/Subnet from the VPC or a subnetGroupName.

Output name collisions (not compile, but synth may fail fast)

exportName("LoadBalancerDNS") without env suffix can cause CloudFormation export collisions across envs/stacks. Your ideal code fixes this with AlbDns-<env>.

Linting / static-analysis issues (after fixing build blockers)

Dead code / unused variables & imports

Map<String, String> projectTags never used.

Multiple imports (AmazonLinuxImage, etc.) unused.

Hard-coded region & AZs

LLM hard-codes "us-east-1" and "us-east-1a/b". Violates portability and your env/context design.

Security group rule (over-permissive SSH)

LLM opens SSH to the world; your ideal removes SSH (use SSM). This would be flagged by security linters/policies.

Public-subnet instances

LLM places the ASG in public subnets; your ideal keeps instances private (PRIVATE_WITH_EGRESS) behind an internet-facing ALB. Many org linters flag public compute by default.

Health check configuration gaps

LLM omits explicit health-check intervals/timeouts and grace; your ideal sets them with Duration and HealthCheck.elb(...). Linters often require explicit values.

Tagging consistency

LLM tags are ad-hoc and inconsistent (e.g., some resources tagged, some not; no Environment, Owner, CostCenter). Your ideal stack applies consistent tags at stack level + resource level.

Output naming & surfacing

LLM’s output is generic; your ideal provides both DNS and full URL, namespaced per env. Linters commonly enforce unique export naming conventions.

Pattern & layering

LLM puts everything in one stack and bypasses your orchestrator pattern; your ideal uses TapStack → NetworkStack + WebTierStack. Architectural linters/policies (and reviewers) will flag this.

User-data robustness

LLM’s user-data lacks idempotence and service enablement best practices (you fix with enable --now and env banner). Not a hard error, but often flagged as a style issue.

ALB/TG wiring style

LLM uses constructor-heavy wiring; your ideal uses the idiomatic alb.addListener(...) with a default forward(List.of(tg)). Style/idiom linting will prefer the latter.