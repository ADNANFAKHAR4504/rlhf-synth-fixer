package app.constructs;

import com.hashicorp.cdktf.providers.aws.lb.Lb;
import com.hashicorp.cdktf.providers.aws.lb_listener.LbListener;
import com.hashicorp.cdktf.providers.aws.lb_listener.LbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroup;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.lb_target_group.LbTargetGroupStickiness;
import com.hashicorp.cdktf.providers.aws.lb_target_group_attachment.LbTargetGroupAttachment;
import com.hashicorp.cdktf.providers.aws.lb_target_group_attachment.LbTargetGroupAttachmentConfig;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class LoadBalancerConstruct extends BaseConstruct {

    private final Lb applicationLoadBalancer;

    private final LbTargetGroup targetGroup;

    private final LbListener httpListener;

    public LoadBalancerConstruct(final Construct scope, final String id, final List<String> subnetIds,
                                 final String securityGroupId, final String vpcId) {
        super(scope, id);

        // Create Application Load Balancer
        String albName = (id + "-alb").substring(0, Math.min(32, (id + "-alb").length()));
        this.applicationLoadBalancer = Lb.Builder.create(this, "alb")
                .name(albName)
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(securityGroupId))
                .subnets(subnetIds)
                .enableDeletionProtection(false)
                .enableHttp2(true)
                .tags(mergeTags(Map.of("Name", id + "-alb")))
                .build();

        // Create Target Group
        String tgName = (id + "-tg").substring(0, Math.min(32, (id + "-tg").length()));
        this.targetGroup = LbTargetGroup.Builder.create(this, "tg")
                .name(tgName)
                .port(80)
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("instance")
                .healthCheck(LbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .interval(30)
                        .path("/health")
                        .protocol("HTTP")
                        .timeout(5)
                        .healthyThreshold(2)
                        .unhealthyThreshold(2)
                        .matcher("200-299")
                        .build())
                .deregistrationDelay("300")
                .stickiness(LbTargetGroupStickiness.builder()
                        .enabled(true)
                        .type("lb_cookie")
                        .cookieDuration(86400)
                        .build())
                .tags(mergeTags(Map.of("Name", id + "-tg")))
                .build();

        // Create HTTP Listener
        this.httpListener = LbListener.Builder.create(this, "http-listener")
                .loadBalancerArn(applicationLoadBalancer.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(LbListenerDefaultAction.builder()
                        .type("forward")
                        .targetGroupArn(targetGroup.getArn())
                        .build()))
                .tags(getTags())
                .build();

        // Attach existing instances to target group if provided
        attachInstances(getExistingInstanceIds());
    }

    private void attachInstances(final List<String> instanceIds) {
        if (instanceIds != null && !instanceIds.isEmpty()) {
            for (int i = 0; i < instanceIds.size(); i++) {
                LbTargetGroupAttachment.Builder.create(this, "tg-attachment-" + i)
                        .targetGroupArn(targetGroup.getArn())
                        .targetId(instanceIds.get(i))
                        .port(80)
                        .build();
            }
        }
    }

    public void attachInstance(final String instanceId, final int port) {
        new LbTargetGroupAttachment(this, "tg-attachment-" + instanceId,
                LbTargetGroupAttachmentConfig.builder()
                        .targetGroupArn(targetGroup.getArn())
                        .targetId(instanceId)
                        .port(port)
                        .build());
    }

    // Getters
    public Lb getAlb() {
        return applicationLoadBalancer;
    }

    public LbTargetGroup getTargetGroup() {
        return targetGroup;
    }

    public LbListener getHttpListener() {
        return httpListener;
    }
}
