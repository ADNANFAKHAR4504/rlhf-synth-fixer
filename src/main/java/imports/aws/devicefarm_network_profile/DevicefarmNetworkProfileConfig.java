package imports.aws.devicefarm_network_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devicefarmNetworkProfile.DevicefarmNetworkProfileConfig")
@software.amazon.jsii.Jsii.Proxy(DevicefarmNetworkProfileConfig.Jsii$Proxy.class)
public interface DevicefarmNetworkProfileConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#name DevicefarmNetworkProfile#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#project_arn DevicefarmNetworkProfile#project_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProjectArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#description DevicefarmNetworkProfile#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_bandwidth_bits DevicefarmNetworkProfile#downlink_bandwidth_bits}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkBandwidthBits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_delay_ms DevicefarmNetworkProfile#downlink_delay_ms}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkDelayMs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_jitter_ms DevicefarmNetworkProfile#downlink_jitter_ms}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkJitterMs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_loss_percent DevicefarmNetworkProfile#downlink_loss_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkLossPercent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#id DevicefarmNetworkProfile#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags DevicefarmNetworkProfile#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags_all DevicefarmNetworkProfile#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#type DevicefarmNetworkProfile#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_bandwidth_bits DevicefarmNetworkProfile#uplink_bandwidth_bits}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUplinkBandwidthBits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_delay_ms DevicefarmNetworkProfile#uplink_delay_ms}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUplinkDelayMs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_jitter_ms DevicefarmNetworkProfile#uplink_jitter_ms}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUplinkJitterMs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_loss_percent DevicefarmNetworkProfile#uplink_loss_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUplinkLossPercent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevicefarmNetworkProfileConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevicefarmNetworkProfileConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevicefarmNetworkProfileConfig> {
        java.lang.String name;
        java.lang.String projectArn;
        java.lang.String description;
        java.lang.Number downlinkBandwidthBits;
        java.lang.Number downlinkDelayMs;
        java.lang.Number downlinkJitterMs;
        java.lang.Number downlinkLossPercent;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String type;
        java.lang.Number uplinkBandwidthBits;
        java.lang.Number uplinkDelayMs;
        java.lang.Number uplinkJitterMs;
        java.lang.Number uplinkLossPercent;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#name DevicefarmNetworkProfile#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getProjectArn}
         * @param projectArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#project_arn DevicefarmNetworkProfile#project_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder projectArn(java.lang.String projectArn) {
            this.projectArn = projectArn;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#description DevicefarmNetworkProfile#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDownlinkBandwidthBits}
         * @param downlinkBandwidthBits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_bandwidth_bits DevicefarmNetworkProfile#downlink_bandwidth_bits}.
         * @return {@code this}
         */
        public Builder downlinkBandwidthBits(java.lang.Number downlinkBandwidthBits) {
            this.downlinkBandwidthBits = downlinkBandwidthBits;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDownlinkDelayMs}
         * @param downlinkDelayMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_delay_ms DevicefarmNetworkProfile#downlink_delay_ms}.
         * @return {@code this}
         */
        public Builder downlinkDelayMs(java.lang.Number downlinkDelayMs) {
            this.downlinkDelayMs = downlinkDelayMs;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDownlinkJitterMs}
         * @param downlinkJitterMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_jitter_ms DevicefarmNetworkProfile#downlink_jitter_ms}.
         * @return {@code this}
         */
        public Builder downlinkJitterMs(java.lang.Number downlinkJitterMs) {
            this.downlinkJitterMs = downlinkJitterMs;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDownlinkLossPercent}
         * @param downlinkLossPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_loss_percent DevicefarmNetworkProfile#downlink_loss_percent}.
         * @return {@code this}
         */
        public Builder downlinkLossPercent(java.lang.Number downlinkLossPercent) {
            this.downlinkLossPercent = downlinkLossPercent;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#id DevicefarmNetworkProfile#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags DevicefarmNetworkProfile#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags_all DevicefarmNetworkProfile#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#type DevicefarmNetworkProfile#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getUplinkBandwidthBits}
         * @param uplinkBandwidthBits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_bandwidth_bits DevicefarmNetworkProfile#uplink_bandwidth_bits}.
         * @return {@code this}
         */
        public Builder uplinkBandwidthBits(java.lang.Number uplinkBandwidthBits) {
            this.uplinkBandwidthBits = uplinkBandwidthBits;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getUplinkDelayMs}
         * @param uplinkDelayMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_delay_ms DevicefarmNetworkProfile#uplink_delay_ms}.
         * @return {@code this}
         */
        public Builder uplinkDelayMs(java.lang.Number uplinkDelayMs) {
            this.uplinkDelayMs = uplinkDelayMs;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getUplinkJitterMs}
         * @param uplinkJitterMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_jitter_ms DevicefarmNetworkProfile#uplink_jitter_ms}.
         * @return {@code this}
         */
        public Builder uplinkJitterMs(java.lang.Number uplinkJitterMs) {
            this.uplinkJitterMs = uplinkJitterMs;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getUplinkLossPercent}
         * @param uplinkLossPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_loss_percent DevicefarmNetworkProfile#uplink_loss_percent}.
         * @return {@code this}
         */
        public Builder uplinkLossPercent(java.lang.Number uplinkLossPercent) {
            this.uplinkLossPercent = uplinkLossPercent;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getDependsOn}
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
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmNetworkProfileConfig#getProvisioners}
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
         * @return a new instance of {@link DevicefarmNetworkProfileConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevicefarmNetworkProfileConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevicefarmNetworkProfileConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevicefarmNetworkProfileConfig {
        private final java.lang.String name;
        private final java.lang.String projectArn;
        private final java.lang.String description;
        private final java.lang.Number downlinkBandwidthBits;
        private final java.lang.Number downlinkDelayMs;
        private final java.lang.Number downlinkJitterMs;
        private final java.lang.Number downlinkLossPercent;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String type;
        private final java.lang.Number uplinkBandwidthBits;
        private final java.lang.Number uplinkDelayMs;
        private final java.lang.Number uplinkJitterMs;
        private final java.lang.Number uplinkLossPercent;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.projectArn = software.amazon.jsii.Kernel.get(this, "projectArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.downlinkBandwidthBits = software.amazon.jsii.Kernel.get(this, "downlinkBandwidthBits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.downlinkDelayMs = software.amazon.jsii.Kernel.get(this, "downlinkDelayMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.downlinkJitterMs = software.amazon.jsii.Kernel.get(this, "downlinkJitterMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.downlinkLossPercent = software.amazon.jsii.Kernel.get(this, "downlinkLossPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uplinkBandwidthBits = software.amazon.jsii.Kernel.get(this, "uplinkBandwidthBits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uplinkDelayMs = software.amazon.jsii.Kernel.get(this, "uplinkDelayMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uplinkJitterMs = software.amazon.jsii.Kernel.get(this, "uplinkJitterMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uplinkLossPercent = software.amazon.jsii.Kernel.get(this, "uplinkLossPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.projectArn = java.util.Objects.requireNonNull(builder.projectArn, "projectArn is required");
            this.description = builder.description;
            this.downlinkBandwidthBits = builder.downlinkBandwidthBits;
            this.downlinkDelayMs = builder.downlinkDelayMs;
            this.downlinkJitterMs = builder.downlinkJitterMs;
            this.downlinkLossPercent = builder.downlinkLossPercent;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.type = builder.type;
            this.uplinkBandwidthBits = builder.uplinkBandwidthBits;
            this.uplinkDelayMs = builder.uplinkDelayMs;
            this.uplinkJitterMs = builder.uplinkJitterMs;
            this.uplinkLossPercent = builder.uplinkLossPercent;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getProjectArn() {
            return this.projectArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getDownlinkBandwidthBits() {
            return this.downlinkBandwidthBits;
        }

        @Override
        public final java.lang.Number getDownlinkDelayMs() {
            return this.downlinkDelayMs;
        }

        @Override
        public final java.lang.Number getDownlinkJitterMs() {
            return this.downlinkJitterMs;
        }

        @Override
        public final java.lang.Number getDownlinkLossPercent() {
            return this.downlinkLossPercent;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Number getUplinkBandwidthBits() {
            return this.uplinkBandwidthBits;
        }

        @Override
        public final java.lang.Number getUplinkDelayMs() {
            return this.uplinkDelayMs;
        }

        @Override
        public final java.lang.Number getUplinkJitterMs() {
            return this.uplinkJitterMs;
        }

        @Override
        public final java.lang.Number getUplinkLossPercent() {
            return this.uplinkLossPercent;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("projectArn", om.valueToTree(this.getProjectArn()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDownlinkBandwidthBits() != null) {
                data.set("downlinkBandwidthBits", om.valueToTree(this.getDownlinkBandwidthBits()));
            }
            if (this.getDownlinkDelayMs() != null) {
                data.set("downlinkDelayMs", om.valueToTree(this.getDownlinkDelayMs()));
            }
            if (this.getDownlinkJitterMs() != null) {
                data.set("downlinkJitterMs", om.valueToTree(this.getDownlinkJitterMs()));
            }
            if (this.getDownlinkLossPercent() != null) {
                data.set("downlinkLossPercent", om.valueToTree(this.getDownlinkLossPercent()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getUplinkBandwidthBits() != null) {
                data.set("uplinkBandwidthBits", om.valueToTree(this.getUplinkBandwidthBits()));
            }
            if (this.getUplinkDelayMs() != null) {
                data.set("uplinkDelayMs", om.valueToTree(this.getUplinkDelayMs()));
            }
            if (this.getUplinkJitterMs() != null) {
                data.set("uplinkJitterMs", om.valueToTree(this.getUplinkJitterMs()));
            }
            if (this.getUplinkLossPercent() != null) {
                data.set("uplinkLossPercent", om.valueToTree(this.getUplinkLossPercent()));
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
            struct.set("fqn", om.valueToTree("aws.devicefarmNetworkProfile.DevicefarmNetworkProfileConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevicefarmNetworkProfileConfig.Jsii$Proxy that = (DevicefarmNetworkProfileConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!projectArn.equals(that.projectArn)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.downlinkBandwidthBits != null ? !this.downlinkBandwidthBits.equals(that.downlinkBandwidthBits) : that.downlinkBandwidthBits != null) return false;
            if (this.downlinkDelayMs != null ? !this.downlinkDelayMs.equals(that.downlinkDelayMs) : that.downlinkDelayMs != null) return false;
            if (this.downlinkJitterMs != null ? !this.downlinkJitterMs.equals(that.downlinkJitterMs) : that.downlinkJitterMs != null) return false;
            if (this.downlinkLossPercent != null ? !this.downlinkLossPercent.equals(that.downlinkLossPercent) : that.downlinkLossPercent != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.uplinkBandwidthBits != null ? !this.uplinkBandwidthBits.equals(that.uplinkBandwidthBits) : that.uplinkBandwidthBits != null) return false;
            if (this.uplinkDelayMs != null ? !this.uplinkDelayMs.equals(that.uplinkDelayMs) : that.uplinkDelayMs != null) return false;
            if (this.uplinkJitterMs != null ? !this.uplinkJitterMs.equals(that.uplinkJitterMs) : that.uplinkJitterMs != null) return false;
            if (this.uplinkLossPercent != null ? !this.uplinkLossPercent.equals(that.uplinkLossPercent) : that.uplinkLossPercent != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.projectArn.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.downlinkBandwidthBits != null ? this.downlinkBandwidthBits.hashCode() : 0);
            result = 31 * result + (this.downlinkDelayMs != null ? this.downlinkDelayMs.hashCode() : 0);
            result = 31 * result + (this.downlinkJitterMs != null ? this.downlinkJitterMs.hashCode() : 0);
            result = 31 * result + (this.downlinkLossPercent != null ? this.downlinkLossPercent.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.uplinkBandwidthBits != null ? this.uplinkBandwidthBits.hashCode() : 0);
            result = 31 * result + (this.uplinkDelayMs != null ? this.uplinkDelayMs.hashCode() : 0);
            result = 31 * result + (this.uplinkJitterMs != null ? this.uplinkJitterMs.hashCode() : 0);
            result = 31 * result + (this.uplinkLossPercent != null ? this.uplinkLossPercent.hashCode() : 0);
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
