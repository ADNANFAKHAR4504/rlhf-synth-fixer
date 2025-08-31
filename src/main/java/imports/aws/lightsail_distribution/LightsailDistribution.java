package imports.aws.lightsail_distribution;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution aws_lightsail_distribution}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.826Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistribution")
public class LightsailDistribution extends com.hashicorp.cdktf.TerraformResource {

    protected LightsailDistribution(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailDistribution(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lightsail_distribution.LightsailDistribution.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution aws_lightsail_distribution} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LightsailDistribution(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LightsailDistribution resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LightsailDistribution to import. This parameter is required.
     * @param importFromId The id of the existing LightsailDistribution that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LightsailDistribution to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lightsail_distribution.LightsailDistribution.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LightsailDistribution resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LightsailDistribution to import. This parameter is required.
     * @param importFromId The id of the existing LightsailDistribution that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lightsail_distribution.LightsailDistribution.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCacheBehavior(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior> __cast_cd4240 = (java.util.List<imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCacheBehavior", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCacheBehaviorSettings(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings value) {
        software.amazon.jsii.Kernel.call(this, "putCacheBehaviorSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDefaultCacheBehavior(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultCacheBehavior", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOrigin(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionOrigin value) {
        software.amazon.jsii.Kernel.call(this, "putOrigin", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCacheBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetCacheBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheBehaviorSettings() {
        software.amazon.jsii.Kernel.call(this, "resetCacheBehaviorSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateName() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetIsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAlternativeDomainNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "alternativeDomainNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorList getCacheBehavior() {
        return software.amazon.jsii.Kernel.get(this, "cacheBehavior", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsOutputReference getCacheBehaviorSettings() {
        return software.amazon.jsii.Kernel.get(this, "cacheBehaviorSettings", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehaviorOutputReference getDefaultCacheBehavior() {
        return software.amazon.jsii.Kernel.get(this, "defaultCacheBehavior", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehaviorOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionLocationList getLocation() {
        return software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionLocationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionOriginOutputReference getOrigin() {
        return software.amazon.jsii.Kernel.get(this, "origin", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionOriginOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "originPublicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSupportCode() {
        return software.amazon.jsii.Kernel.get(this, "supportCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBundleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "bundleIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCacheBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings getCacheBehaviorSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheBehaviorSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateNameInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior getDefaultCacheBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultCacheBehaviorInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "isEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionOrigin getOriginInput() {
        return software.amazon.jsii.Kernel.get(this, "originInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionOrigin.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBundleId() {
        return software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBundleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bundleId", java.util.Objects.requireNonNull(value, "bundleId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateName() {
        return software.amazon.jsii.Kernel.get(this, "certificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateName", java.util.Objects.requireNonNull(value, "certificateName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "isEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isEnabled", java.util.Objects.requireNonNull(value, "isEnabled is required"));
    }

    public void setIsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isEnabled", java.util.Objects.requireNonNull(value, "isEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lightsail_distribution.LightsailDistribution}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lightsail_distribution.LightsailDistribution> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.lightsail_distribution.LightsailDistributionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lightsail_distribution.LightsailDistributionConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * The bundle ID to use for the distribution.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#bundle_id LightsailDistribution#bundle_id}
         * <p>
         * @return {@code this}
         * @param bundleId The bundle ID to use for the distribution. This parameter is required.
         */
        public Builder bundleId(final java.lang.String bundleId) {
            this.config.bundleId(bundleId);
            return this;
        }

        /**
         * default_cache_behavior block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_cache_behavior LightsailDistribution#default_cache_behavior}
         * <p>
         * @return {@code this}
         * @param defaultCacheBehavior default_cache_behavior block. This parameter is required.
         */
        public Builder defaultCacheBehavior(final imports.aws.lightsail_distribution.LightsailDistributionDefaultCacheBehavior defaultCacheBehavior) {
            this.config.defaultCacheBehavior(defaultCacheBehavior);
            return this;
        }

        /**
         * The name of the distribution.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#name LightsailDistribution#name}
         * <p>
         * @return {@code this}
         * @param name The name of the distribution. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * origin block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#origin LightsailDistribution#origin}
         * <p>
         * @return {@code this}
         * @param origin origin block. This parameter is required.
         */
        public Builder origin(final imports.aws.lightsail_distribution.LightsailDistributionOrigin origin) {
            this.config.origin(origin);
            return this;
        }

        /**
         * cache_behavior block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
         * <p>
         * @return {@code this}
         * @param cacheBehavior cache_behavior block. This parameter is required.
         */
        public Builder cacheBehavior(final com.hashicorp.cdktf.IResolvable cacheBehavior) {
            this.config.cacheBehavior(cacheBehavior);
            return this;
        }
        /**
         * cache_behavior block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior LightsailDistribution#cache_behavior}
         * <p>
         * @return {@code this}
         * @param cacheBehavior cache_behavior block. This parameter is required.
         */
        public Builder cacheBehavior(final java.util.List<? extends imports.aws.lightsail_distribution.LightsailDistributionCacheBehavior> cacheBehavior) {
            this.config.cacheBehavior(cacheBehavior);
            return this;
        }

        /**
         * cache_behavior_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cache_behavior_settings LightsailDistribution#cache_behavior_settings}
         * <p>
         * @return {@code this}
         * @param cacheBehaviorSettings cache_behavior_settings block. This parameter is required.
         */
        public Builder cacheBehaviorSettings(final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings cacheBehaviorSettings) {
            this.config.cacheBehaviorSettings(cacheBehaviorSettings);
            return this;
        }

        /**
         * The name of the SSL/TLS certificate attached to the distribution, if any.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#certificate_name LightsailDistribution#certificate_name}
         * <p>
         * @return {@code this}
         * @param certificateName The name of the SSL/TLS certificate attached to the distribution, if any. This parameter is required.
         */
        public Builder certificateName(final java.lang.String certificateName) {
            this.config.certificateName(certificateName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#id LightsailDistribution#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * The IP address type of the distribution.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#ip_address_type LightsailDistribution#ip_address_type}
         * <p>
         * @return {@code this}
         * @param ipAddressType The IP address type of the distribution. This parameter is required.
         */
        public Builder ipAddressType(final java.lang.String ipAddressType) {
            this.config.ipAddressType(ipAddressType);
            return this;
        }

        /**
         * Indicates whether the distribution is enabled.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
         * <p>
         * @return {@code this}
         * @param isEnabled Indicates whether the distribution is enabled. This parameter is required.
         */
        public Builder isEnabled(final java.lang.Boolean isEnabled) {
            this.config.isEnabled(isEnabled);
            return this;
        }
        /**
         * Indicates whether the distribution is enabled.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#is_enabled LightsailDistribution#is_enabled}
         * <p>
         * @return {@code this}
         * @param isEnabled Indicates whether the distribution is enabled. This parameter is required.
         */
        public Builder isEnabled(final com.hashicorp.cdktf.IResolvable isEnabled) {
            this.config.isEnabled(isEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags LightsailDistribution#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#tags_all LightsailDistribution#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#timeouts LightsailDistribution#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lightsail_distribution.LightsailDistributionTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lightsail_distribution.LightsailDistribution}.
         */
        @Override
        public imports.aws.lightsail_distribution.LightsailDistribution build() {
            return new imports.aws.lightsail_distribution.LightsailDistribution(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
