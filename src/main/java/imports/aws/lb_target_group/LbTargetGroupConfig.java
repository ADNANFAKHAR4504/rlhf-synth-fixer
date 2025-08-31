package imports.aws.lb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.534Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroupConfig")
@software.amazon.jsii.Jsii.Proxy(LbTargetGroupConfig.Jsii$Proxy.class)
public interface LbTargetGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConnectionTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#deregistration_delay LbTargetGroup#deregistration_delay}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeregistrationDelay() {
        return null;
    }

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#health_check LbTargetGroup#health_check}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupHealthCheck getHealthCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#id LbTargetGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#ip_address_type LbTargetGroup#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambdaMultiValueHeadersEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_algorithm_type LbTargetGroup#load_balancing_algorithm_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingAlgorithmType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_anomaly_mitigation LbTargetGroup#load_balancing_anomaly_mitigation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingAnomalyMitigation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_cross_zone_enabled LbTargetGroup#load_balancing_cross_zone_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancingCrossZoneEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name LbTargetGroup#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name_prefix LbTargetGroup#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#port LbTargetGroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#preserve_client_ip LbTargetGroup#preserve_client_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreserveClientIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol LbTargetGroup#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol_version LbTargetGroup#protocol_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocolVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProxyProtocolV2() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#slow_start LbTargetGroup#slow_start}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSlowStart() {
        return null;
    }

    /**
     * stickiness block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#stickiness LbTargetGroup#stickiness}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupStickiness getStickiness() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags LbTargetGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags_all LbTargetGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * target_failover block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_failover LbTargetGroup#target_failover}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetFailover() {
        return null;
    }

    /**
     * target_group_health block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_group_health LbTargetGroup#target_group_health}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth getTargetGroupHealth() {
        return null;
    }

    /**
     * target_health_state block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_health_state LbTargetGroup#target_health_state}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetHealthState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_type LbTargetGroup#target_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#vpc_id LbTargetGroup#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbTargetGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbTargetGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbTargetGroupConfig> {
        java.lang.Object connectionTermination;
        java.lang.String deregistrationDelay;
        imports.aws.lb_target_group.LbTargetGroupHealthCheck healthCheck;
        java.lang.String id;
        java.lang.String ipAddressType;
        java.lang.Object lambdaMultiValueHeadersEnabled;
        java.lang.String loadBalancingAlgorithmType;
        java.lang.String loadBalancingAnomalyMitigation;
        java.lang.String loadBalancingCrossZoneEnabled;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Number port;
        java.lang.String preserveClientIp;
        java.lang.String protocol;
        java.lang.String protocolVersion;
        java.lang.Object proxyProtocolV2;
        java.lang.Number slowStart;
        imports.aws.lb_target_group.LbTargetGroupStickiness stickiness;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object targetFailover;
        imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth targetGroupHealth;
        java.lang.Object targetHealthState;
        java.lang.String targetType;
        java.lang.String vpcId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LbTargetGroupConfig#getConnectionTermination}
         * @param connectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}.
         * @return {@code this}
         */
        public Builder connectionTermination(java.lang.Boolean connectionTermination) {
            this.connectionTermination = connectionTermination;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getConnectionTermination}
         * @param connectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#connection_termination LbTargetGroup#connection_termination}.
         * @return {@code this}
         */
        public Builder connectionTermination(com.hashicorp.cdktf.IResolvable connectionTermination) {
            this.connectionTermination = connectionTermination;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getDeregistrationDelay}
         * @param deregistrationDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#deregistration_delay LbTargetGroup#deregistration_delay}.
         * @return {@code this}
         */
        public Builder deregistrationDelay(java.lang.String deregistrationDelay) {
            this.deregistrationDelay = deregistrationDelay;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getHealthCheck}
         * @param healthCheck health_check block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#health_check LbTargetGroup#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.lb_target_group.LbTargetGroupHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#id LbTargetGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#ip_address_type LbTargetGroup#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLambdaMultiValueHeadersEnabled}
         * @param lambdaMultiValueHeadersEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}.
         * @return {@code this}
         */
        public Builder lambdaMultiValueHeadersEnabled(java.lang.Boolean lambdaMultiValueHeadersEnabled) {
            this.lambdaMultiValueHeadersEnabled = lambdaMultiValueHeadersEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLambdaMultiValueHeadersEnabled}
         * @param lambdaMultiValueHeadersEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#lambda_multi_value_headers_enabled LbTargetGroup#lambda_multi_value_headers_enabled}.
         * @return {@code this}
         */
        public Builder lambdaMultiValueHeadersEnabled(com.hashicorp.cdktf.IResolvable lambdaMultiValueHeadersEnabled) {
            this.lambdaMultiValueHeadersEnabled = lambdaMultiValueHeadersEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLoadBalancingAlgorithmType}
         * @param loadBalancingAlgorithmType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_algorithm_type LbTargetGroup#load_balancing_algorithm_type}.
         * @return {@code this}
         */
        public Builder loadBalancingAlgorithmType(java.lang.String loadBalancingAlgorithmType) {
            this.loadBalancingAlgorithmType = loadBalancingAlgorithmType;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLoadBalancingAnomalyMitigation}
         * @param loadBalancingAnomalyMitigation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_anomaly_mitigation LbTargetGroup#load_balancing_anomaly_mitigation}.
         * @return {@code this}
         */
        public Builder loadBalancingAnomalyMitigation(java.lang.String loadBalancingAnomalyMitigation) {
            this.loadBalancingAnomalyMitigation = loadBalancingAnomalyMitigation;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLoadBalancingCrossZoneEnabled}
         * @param loadBalancingCrossZoneEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#load_balancing_cross_zone_enabled LbTargetGroup#load_balancing_cross_zone_enabled}.
         * @return {@code this}
         */
        public Builder loadBalancingCrossZoneEnabled(java.lang.String loadBalancingCrossZoneEnabled) {
            this.loadBalancingCrossZoneEnabled = loadBalancingCrossZoneEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name LbTargetGroup#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#name_prefix LbTargetGroup#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#port LbTargetGroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getPreserveClientIp}
         * @param preserveClientIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#preserve_client_ip LbTargetGroup#preserve_client_ip}.
         * @return {@code this}
         */
        public Builder preserveClientIp(java.lang.String preserveClientIp) {
            this.preserveClientIp = preserveClientIp;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol LbTargetGroup#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProtocolVersion}
         * @param protocolVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#protocol_version LbTargetGroup#protocol_version}.
         * @return {@code this}
         */
        public Builder protocolVersion(java.lang.String protocolVersion) {
            this.protocolVersion = protocolVersion;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProxyProtocolV2}
         * @param proxyProtocolV2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}.
         * @return {@code this}
         */
        public Builder proxyProtocolV2(java.lang.Boolean proxyProtocolV2) {
            this.proxyProtocolV2 = proxyProtocolV2;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProxyProtocolV2}
         * @param proxyProtocolV2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#proxy_protocol_v2 LbTargetGroup#proxy_protocol_v2}.
         * @return {@code this}
         */
        public Builder proxyProtocolV2(com.hashicorp.cdktf.IResolvable proxyProtocolV2) {
            this.proxyProtocolV2 = proxyProtocolV2;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getSlowStart}
         * @param slowStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#slow_start LbTargetGroup#slow_start}.
         * @return {@code this}
         */
        public Builder slowStart(java.lang.Number slowStart) {
            this.slowStart = slowStart;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getStickiness}
         * @param stickiness stickiness block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#stickiness LbTargetGroup#stickiness}
         * @return {@code this}
         */
        public Builder stickiness(imports.aws.lb_target_group.LbTargetGroupStickiness stickiness) {
            this.stickiness = stickiness;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags LbTargetGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#tags_all LbTargetGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetFailover}
         * @param targetFailover target_failover block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_failover LbTargetGroup#target_failover}
         * @return {@code this}
         */
        public Builder targetFailover(com.hashicorp.cdktf.IResolvable targetFailover) {
            this.targetFailover = targetFailover;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetFailover}
         * @param targetFailover target_failover block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_failover LbTargetGroup#target_failover}
         * @return {@code this}
         */
        public Builder targetFailover(java.util.List<? extends imports.aws.lb_target_group.LbTargetGroupTargetFailover> targetFailover) {
            this.targetFailover = targetFailover;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetGroupHealth}
         * @param targetGroupHealth target_group_health block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_group_health LbTargetGroup#target_group_health}
         * @return {@code this}
         */
        public Builder targetGroupHealth(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth targetGroupHealth) {
            this.targetGroupHealth = targetGroupHealth;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetHealthState}
         * @param targetHealthState target_health_state block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_health_state LbTargetGroup#target_health_state}
         * @return {@code this}
         */
        public Builder targetHealthState(com.hashicorp.cdktf.IResolvable targetHealthState) {
            this.targetHealthState = targetHealthState;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetHealthState}
         * @param targetHealthState target_health_state block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_health_state LbTargetGroup#target_health_state}
         * @return {@code this}
         */
        public Builder targetHealthState(java.util.List<? extends imports.aws.lb_target_group.LbTargetGroupTargetHealthState> targetHealthState) {
            this.targetHealthState = targetHealthState;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getTargetType}
         * @param targetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#target_type LbTargetGroup#target_type}.
         * @return {@code this}
         */
        public Builder targetType(java.lang.String targetType) {
            this.targetType = targetType;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#vpc_id LbTargetGroup#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbTargetGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbTargetGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbTargetGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbTargetGroupConfig {
        private final java.lang.Object connectionTermination;
        private final java.lang.String deregistrationDelay;
        private final imports.aws.lb_target_group.LbTargetGroupHealthCheck healthCheck;
        private final java.lang.String id;
        private final java.lang.String ipAddressType;
        private final java.lang.Object lambdaMultiValueHeadersEnabled;
        private final java.lang.String loadBalancingAlgorithmType;
        private final java.lang.String loadBalancingAnomalyMitigation;
        private final java.lang.String loadBalancingCrossZoneEnabled;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Number port;
        private final java.lang.String preserveClientIp;
        private final java.lang.String protocol;
        private final java.lang.String protocolVersion;
        private final java.lang.Object proxyProtocolV2;
        private final java.lang.Number slowStart;
        private final imports.aws.lb_target_group.LbTargetGroupStickiness stickiness;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object targetFailover;
        private final imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth targetGroupHealth;
        private final java.lang.Object targetHealthState;
        private final java.lang.String targetType;
        private final java.lang.String vpcId;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionTermination = software.amazon.jsii.Kernel.get(this, "connectionTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deregistrationDelay = software.amazon.jsii.Kernel.get(this, "deregistrationDelay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupHealthCheck.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaMultiValueHeadersEnabled = software.amazon.jsii.Kernel.get(this, "lambdaMultiValueHeadersEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.loadBalancingAlgorithmType = software.amazon.jsii.Kernel.get(this, "loadBalancingAlgorithmType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancingAnomalyMitigation = software.amazon.jsii.Kernel.get(this, "loadBalancingAnomalyMitigation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancingCrossZoneEnabled = software.amazon.jsii.Kernel.get(this, "loadBalancingCrossZoneEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.preserveClientIp = software.amazon.jsii.Kernel.get(this, "preserveClientIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocolVersion = software.amazon.jsii.Kernel.get(this, "protocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.proxyProtocolV2 = software.amazon.jsii.Kernel.get(this, "proxyProtocolV2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.slowStart = software.amazon.jsii.Kernel.get(this, "slowStart", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stickiness = software.amazon.jsii.Kernel.get(this, "stickiness", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupStickiness.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetFailover = software.amazon.jsii.Kernel.get(this, "targetFailover", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetGroupHealth = software.amazon.jsii.Kernel.get(this, "targetGroupHealth", software.amazon.jsii.NativeType.forClass(imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth.class));
            this.targetHealthState = software.amazon.jsii.Kernel.get(this, "targetHealthState", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetType = software.amazon.jsii.Kernel.get(this, "targetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionTermination = builder.connectionTermination;
            this.deregistrationDelay = builder.deregistrationDelay;
            this.healthCheck = builder.healthCheck;
            this.id = builder.id;
            this.ipAddressType = builder.ipAddressType;
            this.lambdaMultiValueHeadersEnabled = builder.lambdaMultiValueHeadersEnabled;
            this.loadBalancingAlgorithmType = builder.loadBalancingAlgorithmType;
            this.loadBalancingAnomalyMitigation = builder.loadBalancingAnomalyMitigation;
            this.loadBalancingCrossZoneEnabled = builder.loadBalancingCrossZoneEnabled;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.port = builder.port;
            this.preserveClientIp = builder.preserveClientIp;
            this.protocol = builder.protocol;
            this.protocolVersion = builder.protocolVersion;
            this.proxyProtocolV2 = builder.proxyProtocolV2;
            this.slowStart = builder.slowStart;
            this.stickiness = builder.stickiness;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.targetFailover = builder.targetFailover;
            this.targetGroupHealth = builder.targetGroupHealth;
            this.targetHealthState = builder.targetHealthState;
            this.targetType = builder.targetType;
            this.vpcId = builder.vpcId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getConnectionTermination() {
            return this.connectionTermination;
        }

        @Override
        public final java.lang.String getDeregistrationDelay() {
            return this.deregistrationDelay;
        }

        @Override
        public final imports.aws.lb_target_group.LbTargetGroupHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final java.lang.Object getLambdaMultiValueHeadersEnabled() {
            return this.lambdaMultiValueHeadersEnabled;
        }

        @Override
        public final java.lang.String getLoadBalancingAlgorithmType() {
            return this.loadBalancingAlgorithmType;
        }

        @Override
        public final java.lang.String getLoadBalancingAnomalyMitigation() {
            return this.loadBalancingAnomalyMitigation;
        }

        @Override
        public final java.lang.String getLoadBalancingCrossZoneEnabled() {
            return this.loadBalancingCrossZoneEnabled;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getPreserveClientIp() {
            return this.preserveClientIp;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getProtocolVersion() {
            return this.protocolVersion;
        }

        @Override
        public final java.lang.Object getProxyProtocolV2() {
            return this.proxyProtocolV2;
        }

        @Override
        public final java.lang.Number getSlowStart() {
            return this.slowStart;
        }

        @Override
        public final imports.aws.lb_target_group.LbTargetGroupStickiness getStickiness() {
            return this.stickiness;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getTargetFailover() {
            return this.targetFailover;
        }

        @Override
        public final imports.aws.lb_target_group.LbTargetGroupTargetGroupHealth getTargetGroupHealth() {
            return this.targetGroupHealth;
        }

        @Override
        public final java.lang.Object getTargetHealthState() {
            return this.targetHealthState;
        }

        @Override
        public final java.lang.String getTargetType() {
            return this.targetType;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConnectionTermination() != null) {
                data.set("connectionTermination", om.valueToTree(this.getConnectionTermination()));
            }
            if (this.getDeregistrationDelay() != null) {
                data.set("deregistrationDelay", om.valueToTree(this.getDeregistrationDelay()));
            }
            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getLambdaMultiValueHeadersEnabled() != null) {
                data.set("lambdaMultiValueHeadersEnabled", om.valueToTree(this.getLambdaMultiValueHeadersEnabled()));
            }
            if (this.getLoadBalancingAlgorithmType() != null) {
                data.set("loadBalancingAlgorithmType", om.valueToTree(this.getLoadBalancingAlgorithmType()));
            }
            if (this.getLoadBalancingAnomalyMitigation() != null) {
                data.set("loadBalancingAnomalyMitigation", om.valueToTree(this.getLoadBalancingAnomalyMitigation()));
            }
            if (this.getLoadBalancingCrossZoneEnabled() != null) {
                data.set("loadBalancingCrossZoneEnabled", om.valueToTree(this.getLoadBalancingCrossZoneEnabled()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPreserveClientIp() != null) {
                data.set("preserveClientIp", om.valueToTree(this.getPreserveClientIp()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getProtocolVersion() != null) {
                data.set("protocolVersion", om.valueToTree(this.getProtocolVersion()));
            }
            if (this.getProxyProtocolV2() != null) {
                data.set("proxyProtocolV2", om.valueToTree(this.getProxyProtocolV2()));
            }
            if (this.getSlowStart() != null) {
                data.set("slowStart", om.valueToTree(this.getSlowStart()));
            }
            if (this.getStickiness() != null) {
                data.set("stickiness", om.valueToTree(this.getStickiness()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTargetFailover() != null) {
                data.set("targetFailover", om.valueToTree(this.getTargetFailover()));
            }
            if (this.getTargetGroupHealth() != null) {
                data.set("targetGroupHealth", om.valueToTree(this.getTargetGroupHealth()));
            }
            if (this.getTargetHealthState() != null) {
                data.set("targetHealthState", om.valueToTree(this.getTargetHealthState()));
            }
            if (this.getTargetType() != null) {
                data.set("targetType", om.valueToTree(this.getTargetType()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbTargetGroup.LbTargetGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbTargetGroupConfig.Jsii$Proxy that = (LbTargetGroupConfig.Jsii$Proxy) o;

            if (this.connectionTermination != null ? !this.connectionTermination.equals(that.connectionTermination) : that.connectionTermination != null) return false;
            if (this.deregistrationDelay != null ? !this.deregistrationDelay.equals(that.deregistrationDelay) : that.deregistrationDelay != null) return false;
            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.lambdaMultiValueHeadersEnabled != null ? !this.lambdaMultiValueHeadersEnabled.equals(that.lambdaMultiValueHeadersEnabled) : that.lambdaMultiValueHeadersEnabled != null) return false;
            if (this.loadBalancingAlgorithmType != null ? !this.loadBalancingAlgorithmType.equals(that.loadBalancingAlgorithmType) : that.loadBalancingAlgorithmType != null) return false;
            if (this.loadBalancingAnomalyMitigation != null ? !this.loadBalancingAnomalyMitigation.equals(that.loadBalancingAnomalyMitigation) : that.loadBalancingAnomalyMitigation != null) return false;
            if (this.loadBalancingCrossZoneEnabled != null ? !this.loadBalancingCrossZoneEnabled.equals(that.loadBalancingCrossZoneEnabled) : that.loadBalancingCrossZoneEnabled != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.preserveClientIp != null ? !this.preserveClientIp.equals(that.preserveClientIp) : that.preserveClientIp != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.protocolVersion != null ? !this.protocolVersion.equals(that.protocolVersion) : that.protocolVersion != null) return false;
            if (this.proxyProtocolV2 != null ? !this.proxyProtocolV2.equals(that.proxyProtocolV2) : that.proxyProtocolV2 != null) return false;
            if (this.slowStart != null ? !this.slowStart.equals(that.slowStart) : that.slowStart != null) return false;
            if (this.stickiness != null ? !this.stickiness.equals(that.stickiness) : that.stickiness != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.targetFailover != null ? !this.targetFailover.equals(that.targetFailover) : that.targetFailover != null) return false;
            if (this.targetGroupHealth != null ? !this.targetGroupHealth.equals(that.targetGroupHealth) : that.targetGroupHealth != null) return false;
            if (this.targetHealthState != null ? !this.targetHealthState.equals(that.targetHealthState) : that.targetHealthState != null) return false;
            if (this.targetType != null ? !this.targetType.equals(that.targetType) : that.targetType != null) return false;
            if (this.vpcId != null ? !this.vpcId.equals(that.vpcId) : that.vpcId != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionTermination != null ? this.connectionTermination.hashCode() : 0;
            result = 31 * result + (this.deregistrationDelay != null ? this.deregistrationDelay.hashCode() : 0);
            result = 31 * result + (this.healthCheck != null ? this.healthCheck.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.lambdaMultiValueHeadersEnabled != null ? this.lambdaMultiValueHeadersEnabled.hashCode() : 0);
            result = 31 * result + (this.loadBalancingAlgorithmType != null ? this.loadBalancingAlgorithmType.hashCode() : 0);
            result = 31 * result + (this.loadBalancingAnomalyMitigation != null ? this.loadBalancingAnomalyMitigation.hashCode() : 0);
            result = 31 * result + (this.loadBalancingCrossZoneEnabled != null ? this.loadBalancingCrossZoneEnabled.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.preserveClientIp != null ? this.preserveClientIp.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.protocolVersion != null ? this.protocolVersion.hashCode() : 0);
            result = 31 * result + (this.proxyProtocolV2 != null ? this.proxyProtocolV2.hashCode() : 0);
            result = 31 * result + (this.slowStart != null ? this.slowStart.hashCode() : 0);
            result = 31 * result + (this.stickiness != null ? this.stickiness.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.targetFailover != null ? this.targetFailover.hashCode() : 0);
            result = 31 * result + (this.targetGroupHealth != null ? this.targetGroupHealth.hashCode() : 0);
            result = 31 * result + (this.targetHealthState != null ? this.targetHealthState.hashCode() : 0);
            result = 31 * result + (this.targetType != null ? this.targetType.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
