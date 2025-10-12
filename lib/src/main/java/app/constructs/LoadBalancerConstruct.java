package app.constructs;

import app.config.AppConfig;
import app.config.ServiceConfig;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificate;
import com.hashicorp.cdktf.providers.aws.acm_certificate.AcmCertificateConfig;
import com.hashicorp.cdktf.providers.aws.alb.Alb;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListener;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionFixedResponse;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionRedirect;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRule;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleAction;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleCondition;
import com.hashicorp.cdktf.providers.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroup;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupIngress;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKey;
import com.hashicorp.cdktf.providers.tls.private_key.PrivateKeyConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCert;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertConfig;
import com.hashicorp.cdktf.providers.tls.self_signed_cert.SelfSignedCertSubject;
import software.constructs.Construct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LoadBalancerConstruct extends BaseConstruct {

    private final Alb alb;

    private final Map<String, AlbTargetGroup> targetGroups = new HashMap<>();

    private final List<ServiceConfig> services;

    public LoadBalancerConstruct(final Construct scope, final String id, final String vpcId,
                                 final List<String> subnetIds, final List<ServiceConfig> serviceConfigs) {
        super(scope, id);

        this.services = serviceConfigs;

        AppConfig appConfig = getAppConfig();

        // Create ALB security group
        SecurityGroup albSg = SecurityGroup.Builder.create(this, "alb-sg")
                .vpcId(vpcId)
                .name(String.format("%s-alb-sg", appConfig.appName()))
                .description("Security group for Application Load Balancer")
                .ingress(List.of(
                        SecurityGroupIngress.builder()
                                .fromPort(80)
                                .toPort(80)
                                .protocol("tcp")
                                .cidrBlocks(List.of("0.0.0.0/0"))
                                .description("Allow HTTP from anywhere")
                                .build(),
                        SecurityGroupIngress.builder()
                                .fromPort(443)
                                .toPort(443)
                                .protocol("tcp")
                                .cidrBlocks(List.of("0.0.0.0/0"))
                                .description("Allow HTTPS from anywhere")
                                .build()
                ))
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("Allow all outbound traffic")
                        .build()))
                .tags(appConfig.tags())
                .build();

        // Create Application Load Balancer
        this.alb = Alb.Builder.create(this, "alb")
                .name(String.format("%s-alb-%s", appConfig.appName(), appConfig.environment()))
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(albSg.getId()))
                .subnets(subnetIds)
                .enableDeletionProtection(appConfig.environment().equals("prod"))
                .enableHttp2(true)
                .tags(appConfig.tags())
                .build();

        // Create target groups for each service
        for (ServiceConfig service : services) {
            AlbTargetGroup tg = createTargetGroup(appConfig, service, vpcId);
            targetGroups.put(service.serviceName(), tg);
        }

        // Create listeners
        createListeners();
    }

    private AlbTargetGroup createTargetGroup(final AppConfig appConfig, final ServiceConfig service,
                                             final String vpcId) {
        String name = String.format("%s-%s-tg", appConfig.appName(), service.serviceName());

        if (name.length() > 32) {
            name = name.substring(0, 32);
            while (name.endsWith("-")) {
                name = name.substring(0, name.length() - 1);
            }
        }

        return AlbTargetGroup.Builder.create(this, service.serviceName() + "-tg")
                .name(name)
                .port(service.containerPort())
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("ip")
                .healthCheck(AlbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .path("/")
                        .protocol("HTTP")
                        .healthyThreshold(2)
                        .unhealthyThreshold(3)
                        .timeout(5)
                        .interval(30)
                        .matcher("200-299")
                        .build())
                .deregistrationDelay("30")
                .tags(appConfig.tags())
                .build();
    }

    private void createListeners() {
        AcmCertificate sslCert = createSSLCertificate();

        // Create HTTP Listener (redirects to HTTPS)
        AlbListener.Builder.create(this, "alb-http-listener")
                .loadBalancerArn(alb.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("redirect")
                        .redirect(AlbListenerDefaultActionRedirect.builder()
                                .port("443")
                                .protocol("HTTPS")
                                .statusCode("HTTP_301")
                                .build())
                        .build()))
                .build();

        if (!targetGroups.isEmpty()) {
            // Create HTTPS Listener with fixed response as default
            AlbListener httpsListener = AlbListener.Builder.create(this, "alb-https-listener")
                    .loadBalancerArn(alb.getArn())
                    .port(443)
                    .protocol("HTTPS")
                    .sslPolicy("ELBSecurityPolicy-TLS-1-2-2017-01")
                    .certificateArn(sslCert.getArn())
                    .defaultAction(List.of(AlbListenerDefaultAction.builder()
                            .type("fixed-response")
                            .fixedResponse(AlbListenerDefaultActionFixedResponse.builder()
                                    .contentType("text/plain")
                                    .messageBody("Service not found")
                                    .statusCode("404")
                                    .build())
                            .build()))
                    .build();

            // Create listener rules for each service
            int priority = 1;
            for (ServiceConfig service : services) {
                AlbTargetGroup targetGroup = targetGroups.get(service.serviceName());
                if (targetGroup != null) {
                    AlbListenerRule.Builder.create(this, service.serviceName() + "-rule")
                            .listenerArn(httpsListener.getArn())
                            .priority(priority++)
                            .action(List.of(AlbListenerRuleAction.builder()
                                    .type("forward")
                                    .targetGroupArn(targetGroup.getArn())
                                    .build()))
                            .condition(List.of(AlbListenerRuleCondition.builder()
                                    .pathPattern(AlbListenerRuleConditionPathPattern.builder()
                                            .values(List.of("/" + service.serviceName() + "/*", "/" + service.serviceName()))
                                            .build())
                                    .build()))
                            .dependsOn(List.of(targetGroup))
                            .build();
                }
            }
        }
    }

    private AcmCertificate createSSLCertificate() {
        // Generate private key
        PrivateKey privateKey = new PrivateKey(this, "ssl-cert-key",
                PrivateKeyConfig.builder()
                        .algorithm("RSA")
                        .rsaBits(2048)
                        .build());

        // Create self-signed certificate
        SelfSignedCert selfSignedCert = new SelfSignedCert(this, "ssl-self-signed",
                SelfSignedCertConfig.builder()
                        .privateKeyPem(privateKey.getPrivateKeyPem())
                        .validityPeriodHours(365 * 24)
                        .subject(List.of(
                                SelfSignedCertSubject.builder()
                                        .commonName("turing.com")
                                        .organization("My Organization")
                                        .country("US")
                                        .province("CA")
                                        .locality("San Francisco")
                                        .build()
                        ))
                        .dnsNames(List.of("turing.com", "*." + "turing.com"))
                        .allowedUses(List.of("key_encipherment", "data_encipherment", "server_auth"))
                        .build());

        // Import to ACM
        return new AcmCertificate(this, "acm-cert", AcmCertificateConfig.builder()
                .privateKey(privateKey.getPrivateKeyPem())
                .certificateBody(selfSignedCert.getCertPem())
                .tags(Map.of(
                        "Name", String.format("%s-%s-cert", "Web App Certificate", "Production"),
                        "Environment", "Production"
                ))
                .build());
    }

    // Getters
    public Alb getAlb() {
        return alb;
    }

    public Map<String, AlbTargetGroup> getTargetGroups() {
        return targetGroups;
    }
}
