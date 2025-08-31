package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionConfig")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionConfig.Jsii$Proxy.class)
public interface LightsailDistributionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * The bundle ID to use for the distribution.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBundleId();

    /**
     * default_cache_behavior block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
     */
    @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior getDefaultCacheBehavior();

    /**
     * The name of the distribution.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * origin block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
     */
    @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionOrigin getOrigin();

    /**
     * cache_behavior block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheBehavior() {
        return null;
    }

    /**
     * cache_behavior_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings getCacheBehaviorSettings() {
        return null;
    }

    /**
     * The name of the SSL/TLS certificate attached to the distribution, if any.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * The IP address type of the distribution.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Indicates whether the distribution is enabled.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionConfig> {
        java.lang.String bundleId;
        imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior defaultCacheBehavior;
        java.lang.String name;
        imports.aws.lightsail_distribution.LightsailDistributionOrigin origin;
        java.lang.Object cacheBehavior;
        imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings cacheBehaviorSettings;
        java.lang.String certificateName;
        java.lang.String id;
        java.lang.String ipAddressType;
        java.lang.Object isEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.lightsail_distribution.LightsailDistributionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LightsailDistributionConfig#getBundleId}
         * @param bundleId The bundle ID to use for the distribution. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
         * @return {@code this}
         */
        public Builder bundleId(java.lang.String bundleId) {
            this.bundleId = bundleId;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getDefaultCacheBehavior}
         * @param defaultCacheBehavior default_cache_behavior block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
         * @return {@code this}
         */
        public Builder defaultCacheBehavior(imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior defaultCacheBehavior) {
            this.defaultCacheBehavior = defaultCacheBehavior;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getName}
         * @param name The name of the distribution. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getOrigin}
         * @param origin origin block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
         * @return {@code this}
         */
        public Builder origin(imports.aws.lightsail_distribution.LightsailDistributionOrigin origin) {
            this.origin = origin;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCacheBehavior}
         * @param cacheBehavior cache_behavior block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
         * @return {@code this}
         */
        public Builder cacheBehavior(com.hashicorp.cdktf.IResolvable cacheBehavior) {
            this.cacheBehavior = cacheBehavior;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCacheBehavior}
         * @param cacheBehavior cache_behavior block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
         * @return {@code this}
         */
        public Builder cacheBehavior(java.util.List<? extends imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior> cacheBehavior) {
            this.cacheBehavior = cacheBehavior;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCacheBehaviorSettings}
         * @param cacheBehaviorSettings cache_behavior_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
         * @return {@code this}
         */
        public Builder cacheBehaviorSettings(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings cacheBehaviorSettings) {
            this.cacheBehaviorSettings = cacheBehaviorSettings;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCertificateName}
         * @param certificateName The name of the SSL/TLS certificate attached to the distribution, if any.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
         * @return {@code this}
         */
        public Builder certificateName(java.lang.String certificateName) {
            this.certificateName = certificateName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getIpAddressType}
         * @param ipAddressType The IP address type of the distribution.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getIsEnabled}
         * @param isEnabled Indicates whether the distribution is enabled.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
         * @return {@code this}
         */
        public Builder isEnabled(java.lang.Boolean isEnabled) {
            this.isEnabled = isEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getIsEnabled}
         * @param isEnabled Indicates whether the distribution is enabled.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
         * @return {@code this}
         */
        public Builder isEnabled(com.hashicorp.cdktf.IResolvable isEnabled) {
            this.isEnabled = isEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lightsail_distribution.LightsailDistributionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getDependsOn}
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
         * Sets the value of {@link LightsailDistributionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionConfig#getProvisioners}
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
         * @return a new instance of {@link LightsailDistributionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionConfig {
        private final java.lang.String bundleId;
        private final imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior defaultCacheBehavior;
        private final java.lang.String name;
        private final imports.aws.lightsail_distribution.LightsailDistributionOrigin origin;
        private final java.lang.Object cacheBehavior;
        private final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings cacheBehaviorSettings;
        private final java.lang.String certificateName;
        private final java.lang.String id;
        private final java.lang.String ipAddressType;
        private final java.lang.Object isEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.lightsail_distribution.LightsailDistributionTimeouts timeouts;
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
            this.bundleId = software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultCacheBehavior = software.amazon.jsii.Kernel.get(this, "defaultCacheBehavior", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.origin = software.amazon.jsii.Kernel.get(this, "origin", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionOrigin.class));
            this.cacheBehavior = software.amazon.jsii.Kernel.get(this, "cacheBehavior", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheBehaviorSettings = software.amazon.jsii.Kernel.get(this, "cacheBehaviorSettings", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings.class));
            this.certificateName = software.amazon.jsii.Kernel.get(this, "certificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.isEnabled = software.amazon.jsii.Kernel.get(this, "isEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionTimeouts.class));
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
            this.bundleId = java.util.Objects.requireNonNull(builder.bundleId, "bundleId is required");
            this.defaultCacheBehavior = java.util.Objects.requireNonNull(builder.defaultCacheBehavior, "defaultCacheBehavior is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.origin = java.util.Objects.requireNonNull(builder.origin, "origin is required");
            this.cacheBehavior = builder.cacheBehavior;
            this.cacheBehaviorSettings = builder.cacheBehaviorSettings;
            this.certificateName = builder.certificateName;
            this.id = builder.id;
            this.ipAddressType = builder.ipAddressType;
            this.isEnabled = builder.isEnabled;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBundleId() {
            return this.bundleId;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior getDefaultCacheBehavior() {
            return this.defaultCacheBehavior;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionOrigin getOrigin() {
            return this.origin;
        }

        @Override
        public final java.lang.Object getCacheBehavior() {
            return this.cacheBehavior;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings getCacheBehaviorSettings() {
            return this.cacheBehaviorSettings;
        }

        @Override
        public final java.lang.String getCertificateName() {
            return this.certificateName;
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
        public final java.lang.Object getIsEnabled() {
            return this.isEnabled;
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
        public final imports.aws.lightsail_distribution.LightsailDistributionTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("bundleId", om.valueToTree(this.getBundleId()));
            data.set("defaultCacheBehavior", om.valueToTree(this.getDefaultCacheBehavior()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("origin", om.valueToTree(this.getOrigin()));
            if (this.getCacheBehavior() != null) {
                data.set("cacheBehavior", om.valueToTree(this.getCacheBehavior()));
            }
            if (this.getCacheBehaviorSettings() != null) {
                data.set("cacheBehaviorSettings", om.valueToTree(this.getCacheBehaviorSettings()));
            }
            if (this.getCertificateName() != null) {
                data.set("certificateName", om.valueToTree(this.getCertificateName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getIsEnabled() != null) {
                data.set("isEnabled", om.valueToTree(this.getIsEnabled()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionConfig.Jsii$Proxy that = (LightsailDistributionConfig.Jsii$Proxy) o;

            if (!bundleId.equals(that.bundleId)) return false;
            if (!defaultCacheBehavior.equals(that.defaultCacheBehavior)) return false;
            if (!name.equals(that.name)) return false;
            if (!origin.equals(that.origin)) return false;
            if (this.cacheBehavior != null ? !this.cacheBehavior.equals(that.cacheBehavior) : that.cacheBehavior != null) return false;
            if (this.cacheBehaviorSettings != null ? !this.cacheBehaviorSettings.equals(that.cacheBehaviorSettings) : that.cacheBehaviorSettings != null) return false;
            if (this.certificateName != null ? !this.certificateName.equals(that.certificateName) : that.certificateName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.isEnabled != null ? !this.isEnabled.equals(that.isEnabled) : that.isEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.bundleId.hashCode();
            result = 31 * result + (this.defaultCacheBehavior.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.origin.hashCode());
            result = 31 * result + (this.cacheBehavior != null ? this.cacheBehavior.hashCode() : 0);
            result = 31 * result + (this.cacheBehaviorSettings != null ? this.cacheBehaviorSettings.hashCode() : 0);
            result = 31 * result + (this.certificateName != null ? this.certificateName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.isEnabled != null ? this.isEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
