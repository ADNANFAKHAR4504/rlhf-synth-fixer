package imports.aws.route53_health_check;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53HealthCheck.Route53HealthCheckConfig")
@software.amazon.jsii.Jsii.Proxy(Route53HealthCheckConfig.Jsii$Proxy.class)
public interface Route53HealthCheckConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#type Route53HealthCheck#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_healthchecks Route53HealthCheck#child_healthchecks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getChildHealthchecks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_health_threshold Route53HealthCheck#child_health_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getChildHealthThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_name Route53HealthCheck#cloudwatch_alarm_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchAlarmName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_region Route53HealthCheck#cloudwatch_alarm_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchAlarmRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableSni() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#failure_threshold Route53HealthCheck#failure_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFailureThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#fqdn Route53HealthCheck#fqdn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFqdn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#id Route53HealthCheck#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#insufficient_data_health_status Route53HealthCheck#insufficient_data_health_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInsufficientDataHealthStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInvertHealthcheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#ip_address Route53HealthCheck#ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMeasureLatency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#port Route53HealthCheck#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#reference_name Route53HealthCheck#reference_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReferenceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#regions Route53HealthCheck#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#request_interval Route53HealthCheck#request_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRequestInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#resource_path Route53HealthCheck#resource_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourcePath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#routing_control_arn Route53HealthCheck#routing_control_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoutingControlArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#search_string Route53HealthCheck#search_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSearchString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags Route53HealthCheck#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags_all Route53HealthCheck#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#triggers Route53HealthCheck#triggers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTriggers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53HealthCheckConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53HealthCheckConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53HealthCheckConfig> {
        java.lang.String type;
        java.util.List<java.lang.String> childHealthchecks;
        java.lang.Number childHealthThreshold;
        java.lang.String cloudwatchAlarmName;
        java.lang.String cloudwatchAlarmRegion;
        java.lang.Object disabled;
        java.lang.Object enableSni;
        java.lang.Number failureThreshold;
        java.lang.String fqdn;
        java.lang.String id;
        java.lang.String insufficientDataHealthStatus;
        java.lang.Object invertHealthcheck;
        java.lang.String ipAddress;
        java.lang.Object measureLatency;
        java.lang.Number port;
        java.lang.String referenceName;
        java.util.List<java.lang.String> regions;
        java.lang.Number requestInterval;
        java.lang.String resourcePath;
        java.lang.String routingControlArn;
        java.lang.String searchString;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.util.Map<java.lang.String, java.lang.String> triggers;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#type Route53HealthCheck#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getChildHealthchecks}
         * @param childHealthchecks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_healthchecks Route53HealthCheck#child_healthchecks}.
         * @return {@code this}
         */
        public Builder childHealthchecks(java.util.List<java.lang.String> childHealthchecks) {
            this.childHealthchecks = childHealthchecks;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getChildHealthThreshold}
         * @param childHealthThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#child_health_threshold Route53HealthCheck#child_health_threshold}.
         * @return {@code this}
         */
        public Builder childHealthThreshold(java.lang.Number childHealthThreshold) {
            this.childHealthThreshold = childHealthThreshold;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getCloudwatchAlarmName}
         * @param cloudwatchAlarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_name Route53HealthCheck#cloudwatch_alarm_name}.
         * @return {@code this}
         */
        public Builder cloudwatchAlarmName(java.lang.String cloudwatchAlarmName) {
            this.cloudwatchAlarmName = cloudwatchAlarmName;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getCloudwatchAlarmRegion}
         * @param cloudwatchAlarmRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#cloudwatch_alarm_region Route53HealthCheck#cloudwatch_alarm_region}.
         * @return {@code this}
         */
        public Builder cloudwatchAlarmRegion(java.lang.String cloudwatchAlarmRegion) {
            this.cloudwatchAlarmRegion = cloudwatchAlarmRegion;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}.
         * @return {@code this}
         */
        public Builder disabled(java.lang.Boolean disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#disabled Route53HealthCheck#disabled}.
         * @return {@code this}
         */
        public Builder disabled(com.hashicorp.cdktf.IResolvable disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getEnableSni}
         * @param enableSni Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}.
         * @return {@code this}
         */
        public Builder enableSni(java.lang.Boolean enableSni) {
            this.enableSni = enableSni;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getEnableSni}
         * @param enableSni Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#enable_sni Route53HealthCheck#enable_sni}.
         * @return {@code this}
         */
        public Builder enableSni(com.hashicorp.cdktf.IResolvable enableSni) {
            this.enableSni = enableSni;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getFailureThreshold}
         * @param failureThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#failure_threshold Route53HealthCheck#failure_threshold}.
         * @return {@code this}
         */
        public Builder failureThreshold(java.lang.Number failureThreshold) {
            this.failureThreshold = failureThreshold;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getFqdn}
         * @param fqdn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#fqdn Route53HealthCheck#fqdn}.
         * @return {@code this}
         */
        public Builder fqdn(java.lang.String fqdn) {
            this.fqdn = fqdn;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#id Route53HealthCheck#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getInsufficientDataHealthStatus}
         * @param insufficientDataHealthStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#insufficient_data_health_status Route53HealthCheck#insufficient_data_health_status}.
         * @return {@code this}
         */
        public Builder insufficientDataHealthStatus(java.lang.String insufficientDataHealthStatus) {
            this.insufficientDataHealthStatus = insufficientDataHealthStatus;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getInvertHealthcheck}
         * @param invertHealthcheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}.
         * @return {@code this}
         */
        public Builder invertHealthcheck(java.lang.Boolean invertHealthcheck) {
            this.invertHealthcheck = invertHealthcheck;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getInvertHealthcheck}
         * @param invertHealthcheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#invert_healthcheck Route53HealthCheck#invert_healthcheck}.
         * @return {@code this}
         */
        public Builder invertHealthcheck(com.hashicorp.cdktf.IResolvable invertHealthcheck) {
            this.invertHealthcheck = invertHealthcheck;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getIpAddress}
         * @param ipAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#ip_address Route53HealthCheck#ip_address}.
         * @return {@code this}
         */
        public Builder ipAddress(java.lang.String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getMeasureLatency}
         * @param measureLatency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}.
         * @return {@code this}
         */
        public Builder measureLatency(java.lang.Boolean measureLatency) {
            this.measureLatency = measureLatency;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getMeasureLatency}
         * @param measureLatency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#measure_latency Route53HealthCheck#measure_latency}.
         * @return {@code this}
         */
        public Builder measureLatency(com.hashicorp.cdktf.IResolvable measureLatency) {
            this.measureLatency = measureLatency;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#port Route53HealthCheck#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getReferenceName}
         * @param referenceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#reference_name Route53HealthCheck#reference_name}.
         * @return {@code this}
         */
        public Builder referenceName(java.lang.String referenceName) {
            this.referenceName = referenceName;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#regions Route53HealthCheck#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getRequestInterval}
         * @param requestInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#request_interval Route53HealthCheck#request_interval}.
         * @return {@code this}
         */
        public Builder requestInterval(java.lang.Number requestInterval) {
            this.requestInterval = requestInterval;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getResourcePath}
         * @param resourcePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#resource_path Route53HealthCheck#resource_path}.
         * @return {@code this}
         */
        public Builder resourcePath(java.lang.String resourcePath) {
            this.resourcePath = resourcePath;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getRoutingControlArn}
         * @param routingControlArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#routing_control_arn Route53HealthCheck#routing_control_arn}.
         * @return {@code this}
         */
        public Builder routingControlArn(java.lang.String routingControlArn) {
            this.routingControlArn = routingControlArn;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getSearchString}
         * @param searchString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#search_string Route53HealthCheck#search_string}.
         * @return {@code this}
         */
        public Builder searchString(java.lang.String searchString) {
            this.searchString = searchString;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags Route53HealthCheck#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#tags_all Route53HealthCheck#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getTriggers}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_health_check#triggers Route53HealthCheck#triggers}.
         * @return {@code this}
         */
        public Builder triggers(java.util.Map<java.lang.String, java.lang.String> triggers) {
            this.triggers = triggers;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getDependsOn}
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
         * Sets the value of {@link Route53HealthCheckConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Route53HealthCheckConfig#getProvisioners}
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
         * @return a new instance of {@link Route53HealthCheckConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53HealthCheckConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53HealthCheckConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53HealthCheckConfig {
        private final java.lang.String type;
        private final java.util.List<java.lang.String> childHealthchecks;
        private final java.lang.Number childHealthThreshold;
        private final java.lang.String cloudwatchAlarmName;
        private final java.lang.String cloudwatchAlarmRegion;
        private final java.lang.Object disabled;
        private final java.lang.Object enableSni;
        private final java.lang.Number failureThreshold;
        private final java.lang.String fqdn;
        private final java.lang.String id;
        private final java.lang.String insufficientDataHealthStatus;
        private final java.lang.Object invertHealthcheck;
        private final java.lang.String ipAddress;
        private final java.lang.Object measureLatency;
        private final java.lang.Number port;
        private final java.lang.String referenceName;
        private final java.util.List<java.lang.String> regions;
        private final java.lang.Number requestInterval;
        private final java.lang.String resourcePath;
        private final java.lang.String routingControlArn;
        private final java.lang.String searchString;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.util.Map<java.lang.String, java.lang.String> triggers;
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
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.childHealthchecks = software.amazon.jsii.Kernel.get(this, "childHealthchecks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.childHealthThreshold = software.amazon.jsii.Kernel.get(this, "childHealthThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchAlarmName = software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudwatchAlarmRegion = software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disabled = software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableSni = software.amazon.jsii.Kernel.get(this, "enableSni", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureThreshold = software.amazon.jsii.Kernel.get(this, "failureThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.fqdn = software.amazon.jsii.Kernel.get(this, "fqdn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.insufficientDataHealthStatus = software.amazon.jsii.Kernel.get(this, "insufficientDataHealthStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.invertHealthcheck = software.amazon.jsii.Kernel.get(this, "invertHealthcheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipAddress = software.amazon.jsii.Kernel.get(this, "ipAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.measureLatency = software.amazon.jsii.Kernel.get(this, "measureLatency", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.referenceName = software.amazon.jsii.Kernel.get(this, "referenceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requestInterval = software.amazon.jsii.Kernel.get(this, "requestInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resourcePath = software.amazon.jsii.Kernel.get(this, "resourcePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routingControlArn = software.amazon.jsii.Kernel.get(this, "routingControlArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.searchString = software.amazon.jsii.Kernel.get(this, "searchString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.triggers = software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.childHealthchecks = builder.childHealthchecks;
            this.childHealthThreshold = builder.childHealthThreshold;
            this.cloudwatchAlarmName = builder.cloudwatchAlarmName;
            this.cloudwatchAlarmRegion = builder.cloudwatchAlarmRegion;
            this.disabled = builder.disabled;
            this.enableSni = builder.enableSni;
            this.failureThreshold = builder.failureThreshold;
            this.fqdn = builder.fqdn;
            this.id = builder.id;
            this.insufficientDataHealthStatus = builder.insufficientDataHealthStatus;
            this.invertHealthcheck = builder.invertHealthcheck;
            this.ipAddress = builder.ipAddress;
            this.measureLatency = builder.measureLatency;
            this.port = builder.port;
            this.referenceName = builder.referenceName;
            this.regions = builder.regions;
            this.requestInterval = builder.requestInterval;
            this.resourcePath = builder.resourcePath;
            this.routingControlArn = builder.routingControlArn;
            this.searchString = builder.searchString;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.triggers = builder.triggers;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getChildHealthchecks() {
            return this.childHealthchecks;
        }

        @Override
        public final java.lang.Number getChildHealthThreshold() {
            return this.childHealthThreshold;
        }

        @Override
        public final java.lang.String getCloudwatchAlarmName() {
            return this.cloudwatchAlarmName;
        }

        @Override
        public final java.lang.String getCloudwatchAlarmRegion() {
            return this.cloudwatchAlarmRegion;
        }

        @Override
        public final java.lang.Object getDisabled() {
            return this.disabled;
        }

        @Override
        public final java.lang.Object getEnableSni() {
            return this.enableSni;
        }

        @Override
        public final java.lang.Number getFailureThreshold() {
            return this.failureThreshold;
        }

        @Override
        public final java.lang.String getFqdn() {
            return this.fqdn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInsufficientDataHealthStatus() {
            return this.insufficientDataHealthStatus;
        }

        @Override
        public final java.lang.Object getInvertHealthcheck() {
            return this.invertHealthcheck;
        }

        @Override
        public final java.lang.String getIpAddress() {
            return this.ipAddress;
        }

        @Override
        public final java.lang.Object getMeasureLatency() {
            return this.measureLatency;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getReferenceName() {
            return this.referenceName;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        public final java.lang.Number getRequestInterval() {
            return this.requestInterval;
        }

        @Override
        public final java.lang.String getResourcePath() {
            return this.resourcePath;
        }

        @Override
        public final java.lang.String getRoutingControlArn() {
            return this.routingControlArn;
        }

        @Override
        public final java.lang.String getSearchString() {
            return this.searchString;
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
        public final java.util.Map<java.lang.String, java.lang.String> getTriggers() {
            return this.triggers;
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

            data.set("type", om.valueToTree(this.getType()));
            if (this.getChildHealthchecks() != null) {
                data.set("childHealthchecks", om.valueToTree(this.getChildHealthchecks()));
            }
            if (this.getChildHealthThreshold() != null) {
                data.set("childHealthThreshold", om.valueToTree(this.getChildHealthThreshold()));
            }
            if (this.getCloudwatchAlarmName() != null) {
                data.set("cloudwatchAlarmName", om.valueToTree(this.getCloudwatchAlarmName()));
            }
            if (this.getCloudwatchAlarmRegion() != null) {
                data.set("cloudwatchAlarmRegion", om.valueToTree(this.getCloudwatchAlarmRegion()));
            }
            if (this.getDisabled() != null) {
                data.set("disabled", om.valueToTree(this.getDisabled()));
            }
            if (this.getEnableSni() != null) {
                data.set("enableSni", om.valueToTree(this.getEnableSni()));
            }
            if (this.getFailureThreshold() != null) {
                data.set("failureThreshold", om.valueToTree(this.getFailureThreshold()));
            }
            if (this.getFqdn() != null) {
                data.set("fqdn", om.valueToTree(this.getFqdn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInsufficientDataHealthStatus() != null) {
                data.set("insufficientDataHealthStatus", om.valueToTree(this.getInsufficientDataHealthStatus()));
            }
            if (this.getInvertHealthcheck() != null) {
                data.set("invertHealthcheck", om.valueToTree(this.getInvertHealthcheck()));
            }
            if (this.getIpAddress() != null) {
                data.set("ipAddress", om.valueToTree(this.getIpAddress()));
            }
            if (this.getMeasureLatency() != null) {
                data.set("measureLatency", om.valueToTree(this.getMeasureLatency()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getReferenceName() != null) {
                data.set("referenceName", om.valueToTree(this.getReferenceName()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }
            if (this.getRequestInterval() != null) {
                data.set("requestInterval", om.valueToTree(this.getRequestInterval()));
            }
            if (this.getResourcePath() != null) {
                data.set("resourcePath", om.valueToTree(this.getResourcePath()));
            }
            if (this.getRoutingControlArn() != null) {
                data.set("routingControlArn", om.valueToTree(this.getRoutingControlArn()));
            }
            if (this.getSearchString() != null) {
                data.set("searchString", om.valueToTree(this.getSearchString()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTriggers() != null) {
                data.set("triggers", om.valueToTree(this.getTriggers()));
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
            struct.set("fqn", om.valueToTree("aws.route53HealthCheck.Route53HealthCheckConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53HealthCheckConfig.Jsii$Proxy that = (Route53HealthCheckConfig.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.childHealthchecks != null ? !this.childHealthchecks.equals(that.childHealthchecks) : that.childHealthchecks != null) return false;
            if (this.childHealthThreshold != null ? !this.childHealthThreshold.equals(that.childHealthThreshold) : that.childHealthThreshold != null) return false;
            if (this.cloudwatchAlarmName != null ? !this.cloudwatchAlarmName.equals(that.cloudwatchAlarmName) : that.cloudwatchAlarmName != null) return false;
            if (this.cloudwatchAlarmRegion != null ? !this.cloudwatchAlarmRegion.equals(that.cloudwatchAlarmRegion) : that.cloudwatchAlarmRegion != null) return false;
            if (this.disabled != null ? !this.disabled.equals(that.disabled) : that.disabled != null) return false;
            if (this.enableSni != null ? !this.enableSni.equals(that.enableSni) : that.enableSni != null) return false;
            if (this.failureThreshold != null ? !this.failureThreshold.equals(that.failureThreshold) : that.failureThreshold != null) return false;
            if (this.fqdn != null ? !this.fqdn.equals(that.fqdn) : that.fqdn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.insufficientDataHealthStatus != null ? !this.insufficientDataHealthStatus.equals(that.insufficientDataHealthStatus) : that.insufficientDataHealthStatus != null) return false;
            if (this.invertHealthcheck != null ? !this.invertHealthcheck.equals(that.invertHealthcheck) : that.invertHealthcheck != null) return false;
            if (this.ipAddress != null ? !this.ipAddress.equals(that.ipAddress) : that.ipAddress != null) return false;
            if (this.measureLatency != null ? !this.measureLatency.equals(that.measureLatency) : that.measureLatency != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.referenceName != null ? !this.referenceName.equals(that.referenceName) : that.referenceName != null) return false;
            if (this.regions != null ? !this.regions.equals(that.regions) : that.regions != null) return false;
            if (this.requestInterval != null ? !this.requestInterval.equals(that.requestInterval) : that.requestInterval != null) return false;
            if (this.resourcePath != null ? !this.resourcePath.equals(that.resourcePath) : that.resourcePath != null) return false;
            if (this.routingControlArn != null ? !this.routingControlArn.equals(that.routingControlArn) : that.routingControlArn != null) return false;
            if (this.searchString != null ? !this.searchString.equals(that.searchString) : that.searchString != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.triggers != null ? !this.triggers.equals(that.triggers) : that.triggers != null) return false;
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
            int result = this.type.hashCode();
            result = 31 * result + (this.childHealthchecks != null ? this.childHealthchecks.hashCode() : 0);
            result = 31 * result + (this.childHealthThreshold != null ? this.childHealthThreshold.hashCode() : 0);
            result = 31 * result + (this.cloudwatchAlarmName != null ? this.cloudwatchAlarmName.hashCode() : 0);
            result = 31 * result + (this.cloudwatchAlarmRegion != null ? this.cloudwatchAlarmRegion.hashCode() : 0);
            result = 31 * result + (this.disabled != null ? this.disabled.hashCode() : 0);
            result = 31 * result + (this.enableSni != null ? this.enableSni.hashCode() : 0);
            result = 31 * result + (this.failureThreshold != null ? this.failureThreshold.hashCode() : 0);
            result = 31 * result + (this.fqdn != null ? this.fqdn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.insufficientDataHealthStatus != null ? this.insufficientDataHealthStatus.hashCode() : 0);
            result = 31 * result + (this.invertHealthcheck != null ? this.invertHealthcheck.hashCode() : 0);
            result = 31 * result + (this.ipAddress != null ? this.ipAddress.hashCode() : 0);
            result = 31 * result + (this.measureLatency != null ? this.measureLatency.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.referenceName != null ? this.referenceName.hashCode() : 0);
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            result = 31 * result + (this.requestInterval != null ? this.requestInterval.hashCode() : 0);
            result = 31 * result + (this.resourcePath != null ? this.resourcePath.hashCode() : 0);
            result = 31 * result + (this.routingControlArn != null ? this.routingControlArn.hashCode() : 0);
            result = 31 * result + (this.searchString != null ? this.searchString.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.triggers != null ? this.triggers.hashCode() : 0);
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
