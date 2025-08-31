package imports.aws.globalaccelerator_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.276Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorEndpointGroup.GlobalacceleratorEndpointGroupConfig")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorEndpointGroupConfig.Jsii$Proxy.class)
public interface GlobalacceleratorEndpointGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#listener_arn GlobalacceleratorEndpointGroup#listener_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getListenerArn();

    /**
     * endpoint_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_configuration GlobalacceleratorEndpointGroup#endpoint_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEndpointConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_group_region GlobalacceleratorEndpointGroup#endpoint_group_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointGroupRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_interval_seconds GlobalacceleratorEndpointGroup#health_check_interval_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckIntervalSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_path GlobalacceleratorEndpointGroup#health_check_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_port GlobalacceleratorEndpointGroup#health_check_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthCheckPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_protocol GlobalacceleratorEndpointGroup#health_check_protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHealthCheckProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#id GlobalacceleratorEndpointGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * port_override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#port_override GlobalacceleratorEndpointGroup#port_override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPortOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#threshold_count GlobalacceleratorEndpointGroup#threshold_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThresholdCount() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#timeouts GlobalacceleratorEndpointGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#traffic_dial_percentage GlobalacceleratorEndpointGroup#traffic_dial_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTrafficDialPercentage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorEndpointGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorEndpointGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorEndpointGroupConfig> {
        java.lang.String listenerArn;
        java.lang.Object endpointConfiguration;
        java.lang.String endpointGroupRegion;
        java.lang.Number healthCheckIntervalSeconds;
        java.lang.String healthCheckPath;
        java.lang.Number healthCheckPort;
        java.lang.String healthCheckProtocol;
        java.lang.String id;
        java.lang.Object portOverride;
        java.lang.Number thresholdCount;
        imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts timeouts;
        java.lang.Number trafficDialPercentage;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getListenerArn}
         * @param listenerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#listener_arn GlobalacceleratorEndpointGroup#listener_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder listenerArn(java.lang.String listenerArn) {
            this.listenerArn = listenerArn;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_configuration GlobalacceleratorEndpointGroup#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(com.hashicorp.cdktf.IResolvable endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_configuration GlobalacceleratorEndpointGroup#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(java.util.List<? extends imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupEndpointConfiguration> endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getEndpointGroupRegion}
         * @param endpointGroupRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#endpoint_group_region GlobalacceleratorEndpointGroup#endpoint_group_region}.
         * @return {@code this}
         */
        public Builder endpointGroupRegion(java.lang.String endpointGroupRegion) {
            this.endpointGroupRegion = endpointGroupRegion;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getHealthCheckIntervalSeconds}
         * @param healthCheckIntervalSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_interval_seconds GlobalacceleratorEndpointGroup#health_check_interval_seconds}.
         * @return {@code this}
         */
        public Builder healthCheckIntervalSeconds(java.lang.Number healthCheckIntervalSeconds) {
            this.healthCheckIntervalSeconds = healthCheckIntervalSeconds;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getHealthCheckPath}
         * @param healthCheckPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_path GlobalacceleratorEndpointGroup#health_check_path}.
         * @return {@code this}
         */
        public Builder healthCheckPath(java.lang.String healthCheckPath) {
            this.healthCheckPath = healthCheckPath;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getHealthCheckPort}
         * @param healthCheckPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_port GlobalacceleratorEndpointGroup#health_check_port}.
         * @return {@code this}
         */
        public Builder healthCheckPort(java.lang.Number healthCheckPort) {
            this.healthCheckPort = healthCheckPort;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getHealthCheckProtocol}
         * @param healthCheckProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#health_check_protocol GlobalacceleratorEndpointGroup#health_check_protocol}.
         * @return {@code this}
         */
        public Builder healthCheckProtocol(java.lang.String healthCheckProtocol) {
            this.healthCheckProtocol = healthCheckProtocol;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#id GlobalacceleratorEndpointGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getPortOverride}
         * @param portOverride port_override block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#port_override GlobalacceleratorEndpointGroup#port_override}
         * @return {@code this}
         */
        public Builder portOverride(com.hashicorp.cdktf.IResolvable portOverride) {
            this.portOverride = portOverride;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getPortOverride}
         * @param portOverride port_override block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#port_override GlobalacceleratorEndpointGroup#port_override}
         * @return {@code this}
         */
        public Builder portOverride(java.util.List<? extends imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupPortOverride> portOverride) {
            this.portOverride = portOverride;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getThresholdCount}
         * @param thresholdCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#threshold_count GlobalacceleratorEndpointGroup#threshold_count}.
         * @return {@code this}
         */
        public Builder thresholdCount(java.lang.Number thresholdCount) {
            this.thresholdCount = thresholdCount;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#timeouts GlobalacceleratorEndpointGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getTrafficDialPercentage}
         * @param trafficDialPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_endpoint_group#traffic_dial_percentage GlobalacceleratorEndpointGroup#traffic_dial_percentage}.
         * @return {@code this}
         */
        public Builder trafficDialPercentage(java.lang.Number trafficDialPercentage) {
            this.trafficDialPercentage = trafficDialPercentage;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getDependsOn}
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
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorEndpointGroupConfig#getProvisioners}
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
         * @return a new instance of {@link GlobalacceleratorEndpointGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorEndpointGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorEndpointGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorEndpointGroupConfig {
        private final java.lang.String listenerArn;
        private final java.lang.Object endpointConfiguration;
        private final java.lang.String endpointGroupRegion;
        private final java.lang.Number healthCheckIntervalSeconds;
        private final java.lang.String healthCheckPath;
        private final java.lang.Number healthCheckPort;
        private final java.lang.String healthCheckProtocol;
        private final java.lang.String id;
        private final java.lang.Object portOverride;
        private final java.lang.Number thresholdCount;
        private final imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts timeouts;
        private final java.lang.Number trafficDialPercentage;
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
            this.listenerArn = software.amazon.jsii.Kernel.get(this, "listenerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointConfiguration = software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endpointGroupRegion = software.amazon.jsii.Kernel.get(this, "endpointGroupRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.healthCheckIntervalSeconds = software.amazon.jsii.Kernel.get(this, "healthCheckIntervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthCheckPath = software.amazon.jsii.Kernel.get(this, "healthCheckPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.healthCheckPort = software.amazon.jsii.Kernel.get(this, "healthCheckPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthCheckProtocol = software.amazon.jsii.Kernel.get(this, "healthCheckProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.portOverride = software.amazon.jsii.Kernel.get(this, "portOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.thresholdCount = software.amazon.jsii.Kernel.get(this, "thresholdCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts.class));
            this.trafficDialPercentage = software.amazon.jsii.Kernel.get(this, "trafficDialPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.listenerArn = java.util.Objects.requireNonNull(builder.listenerArn, "listenerArn is required");
            this.endpointConfiguration = builder.endpointConfiguration;
            this.endpointGroupRegion = builder.endpointGroupRegion;
            this.healthCheckIntervalSeconds = builder.healthCheckIntervalSeconds;
            this.healthCheckPath = builder.healthCheckPath;
            this.healthCheckPort = builder.healthCheckPort;
            this.healthCheckProtocol = builder.healthCheckProtocol;
            this.id = builder.id;
            this.portOverride = builder.portOverride;
            this.thresholdCount = builder.thresholdCount;
            this.timeouts = builder.timeouts;
            this.trafficDialPercentage = builder.trafficDialPercentage;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getListenerArn() {
            return this.listenerArn;
        }

        @Override
        public final java.lang.Object getEndpointConfiguration() {
            return this.endpointConfiguration;
        }

        @Override
        public final java.lang.String getEndpointGroupRegion() {
            return this.endpointGroupRegion;
        }

        @Override
        public final java.lang.Number getHealthCheckIntervalSeconds() {
            return this.healthCheckIntervalSeconds;
        }

        @Override
        public final java.lang.String getHealthCheckPath() {
            return this.healthCheckPath;
        }

        @Override
        public final java.lang.Number getHealthCheckPort() {
            return this.healthCheckPort;
        }

        @Override
        public final java.lang.String getHealthCheckProtocol() {
            return this.healthCheckProtocol;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getPortOverride() {
            return this.portOverride;
        }

        @Override
        public final java.lang.Number getThresholdCount() {
            return this.thresholdCount;
        }

        @Override
        public final imports.aws.globalaccelerator_endpoint_group.GlobalacceleratorEndpointGroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Number getTrafficDialPercentage() {
            return this.trafficDialPercentage;
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

            data.set("listenerArn", om.valueToTree(this.getListenerArn()));
            if (this.getEndpointConfiguration() != null) {
                data.set("endpointConfiguration", om.valueToTree(this.getEndpointConfiguration()));
            }
            if (this.getEndpointGroupRegion() != null) {
                data.set("endpointGroupRegion", om.valueToTree(this.getEndpointGroupRegion()));
            }
            if (this.getHealthCheckIntervalSeconds() != null) {
                data.set("healthCheckIntervalSeconds", om.valueToTree(this.getHealthCheckIntervalSeconds()));
            }
            if (this.getHealthCheckPath() != null) {
                data.set("healthCheckPath", om.valueToTree(this.getHealthCheckPath()));
            }
            if (this.getHealthCheckPort() != null) {
                data.set("healthCheckPort", om.valueToTree(this.getHealthCheckPort()));
            }
            if (this.getHealthCheckProtocol() != null) {
                data.set("healthCheckProtocol", om.valueToTree(this.getHealthCheckProtocol()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPortOverride() != null) {
                data.set("portOverride", om.valueToTree(this.getPortOverride()));
            }
            if (this.getThresholdCount() != null) {
                data.set("thresholdCount", om.valueToTree(this.getThresholdCount()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTrafficDialPercentage() != null) {
                data.set("trafficDialPercentage", om.valueToTree(this.getTrafficDialPercentage()));
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
            struct.set("fqn", om.valueToTree("aws.globalacceleratorEndpointGroup.GlobalacceleratorEndpointGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorEndpointGroupConfig.Jsii$Proxy that = (GlobalacceleratorEndpointGroupConfig.Jsii$Proxy) o;

            if (!listenerArn.equals(that.listenerArn)) return false;
            if (this.endpointConfiguration != null ? !this.endpointConfiguration.equals(that.endpointConfiguration) : that.endpointConfiguration != null) return false;
            if (this.endpointGroupRegion != null ? !this.endpointGroupRegion.equals(that.endpointGroupRegion) : that.endpointGroupRegion != null) return false;
            if (this.healthCheckIntervalSeconds != null ? !this.healthCheckIntervalSeconds.equals(that.healthCheckIntervalSeconds) : that.healthCheckIntervalSeconds != null) return false;
            if (this.healthCheckPath != null ? !this.healthCheckPath.equals(that.healthCheckPath) : that.healthCheckPath != null) return false;
            if (this.healthCheckPort != null ? !this.healthCheckPort.equals(that.healthCheckPort) : that.healthCheckPort != null) return false;
            if (this.healthCheckProtocol != null ? !this.healthCheckProtocol.equals(that.healthCheckProtocol) : that.healthCheckProtocol != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.portOverride != null ? !this.portOverride.equals(that.portOverride) : that.portOverride != null) return false;
            if (this.thresholdCount != null ? !this.thresholdCount.equals(that.thresholdCount) : that.thresholdCount != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.trafficDialPercentage != null ? !this.trafficDialPercentage.equals(that.trafficDialPercentage) : that.trafficDialPercentage != null) return false;
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
            int result = this.listenerArn.hashCode();
            result = 31 * result + (this.endpointConfiguration != null ? this.endpointConfiguration.hashCode() : 0);
            result = 31 * result + (this.endpointGroupRegion != null ? this.endpointGroupRegion.hashCode() : 0);
            result = 31 * result + (this.healthCheckIntervalSeconds != null ? this.healthCheckIntervalSeconds.hashCode() : 0);
            result = 31 * result + (this.healthCheckPath != null ? this.healthCheckPath.hashCode() : 0);
            result = 31 * result + (this.healthCheckPort != null ? this.healthCheckPort.hashCode() : 0);
            result = 31 * result + (this.healthCheckProtocol != null ? this.healthCheckProtocol.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.portOverride != null ? this.portOverride.hashCode() : 0);
            result = 31 * result + (this.thresholdCount != null ? this.thresholdCount.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.trafficDialPercentage != null ? this.trafficDialPercentage.hashCode() : 0);
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
