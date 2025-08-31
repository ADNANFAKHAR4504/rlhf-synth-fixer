package imports.aws.devicefarm_network_profile;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile aws_devicefarm_network_profile}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.991Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devicefarmNetworkProfile.DevicefarmNetworkProfile")
public class DevicefarmNetworkProfile extends com.hashicorp.cdktf.TerraformResource {

    protected DevicefarmNetworkProfile(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DevicefarmNetworkProfile(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile aws_devicefarm_network_profile} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DevicefarmNetworkProfile(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.devicefarm_network_profile.DevicefarmNetworkProfileConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DevicefarmNetworkProfile resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DevicefarmNetworkProfile to import. This parameter is required.
     * @param importFromId The id of the existing DevicefarmNetworkProfile that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DevicefarmNetworkProfile to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DevicefarmNetworkProfile resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DevicefarmNetworkProfile to import. This parameter is required.
     * @param importFromId The id of the existing DevicefarmNetworkProfile that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDownlinkBandwidthBits() {
        software.amazon.jsii.Kernel.call(this, "resetDownlinkBandwidthBits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDownlinkDelayMs() {
        software.amazon.jsii.Kernel.call(this, "resetDownlinkDelayMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDownlinkJitterMs() {
        software.amazon.jsii.Kernel.call(this, "resetDownlinkJitterMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDownlinkLossPercent() {
        software.amazon.jsii.Kernel.call(this, "resetDownlinkLossPercent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUplinkBandwidthBits() {
        software.amazon.jsii.Kernel.call(this, "resetUplinkBandwidthBits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUplinkDelayMs() {
        software.amazon.jsii.Kernel.call(this, "resetUplinkDelayMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUplinkJitterMs() {
        software.amazon.jsii.Kernel.call(this, "resetUplinkJitterMs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUplinkLossPercent() {
        software.amazon.jsii.Kernel.call(this, "resetUplinkLossPercent", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkBandwidthBitsInput() {
        return software.amazon.jsii.Kernel.get(this, "downlinkBandwidthBitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkDelayMsInput() {
        return software.amazon.jsii.Kernel.get(this, "downlinkDelayMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkJitterMsInput() {
        return software.amazon.jsii.Kernel.get(this, "downlinkJitterMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDownlinkLossPercentInput() {
        return software.amazon.jsii.Kernel.get(this, "downlinkLossPercentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProjectArnInput() {
        return software.amazon.jsii.Kernel.get(this, "projectArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUplinkBandwidthBitsInput() {
        return software.amazon.jsii.Kernel.get(this, "uplinkBandwidthBitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUplinkDelayMsInput() {
        return software.amazon.jsii.Kernel.get(this, "uplinkDelayMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUplinkJitterMsInput() {
        return software.amazon.jsii.Kernel.get(this, "uplinkJitterMsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUplinkLossPercentInput() {
        return software.amazon.jsii.Kernel.get(this, "uplinkLossPercentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDownlinkBandwidthBits() {
        return software.amazon.jsii.Kernel.get(this, "downlinkBandwidthBits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDownlinkBandwidthBits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "downlinkBandwidthBits", java.util.Objects.requireNonNull(value, "downlinkBandwidthBits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDownlinkDelayMs() {
        return software.amazon.jsii.Kernel.get(this, "downlinkDelayMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDownlinkDelayMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "downlinkDelayMs", java.util.Objects.requireNonNull(value, "downlinkDelayMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDownlinkJitterMs() {
        return software.amazon.jsii.Kernel.get(this, "downlinkJitterMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDownlinkJitterMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "downlinkJitterMs", java.util.Objects.requireNonNull(value, "downlinkJitterMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDownlinkLossPercent() {
        return software.amazon.jsii.Kernel.get(this, "downlinkLossPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDownlinkLossPercent(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "downlinkLossPercent", java.util.Objects.requireNonNull(value, "downlinkLossPercent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProjectArn() {
        return software.amazon.jsii.Kernel.get(this, "projectArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProjectArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "projectArn", java.util.Objects.requireNonNull(value, "projectArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUplinkBandwidthBits() {
        return software.amazon.jsii.Kernel.get(this, "uplinkBandwidthBits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUplinkBandwidthBits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uplinkBandwidthBits", java.util.Objects.requireNonNull(value, "uplinkBandwidthBits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUplinkDelayMs() {
        return software.amazon.jsii.Kernel.get(this, "uplinkDelayMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUplinkDelayMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uplinkDelayMs", java.util.Objects.requireNonNull(value, "uplinkDelayMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUplinkJitterMs() {
        return software.amazon.jsii.Kernel.get(this, "uplinkJitterMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUplinkJitterMs(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uplinkJitterMs", java.util.Objects.requireNonNull(value, "uplinkJitterMs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUplinkLossPercent() {
        return software.amazon.jsii.Kernel.get(this, "uplinkLossPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUplinkLossPercent(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uplinkLossPercent", java.util.Objects.requireNonNull(value, "uplinkLossPercent is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile> {
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
        private final imports.aws.devicefarm_network_profile.DevicefarmNetworkProfileConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.devicefarm_network_profile.DevicefarmNetworkProfileConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#name DevicefarmNetworkProfile#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#name DevicefarmNetworkProfile#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#project_arn DevicefarmNetworkProfile#project_arn}.
         * <p>
         * @return {@code this}
         * @param projectArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#project_arn DevicefarmNetworkProfile#project_arn}. This parameter is required.
         */
        public Builder projectArn(final java.lang.String projectArn) {
            this.config.projectArn(projectArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#description DevicefarmNetworkProfile#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#description DevicefarmNetworkProfile#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_bandwidth_bits DevicefarmNetworkProfile#downlink_bandwidth_bits}.
         * <p>
         * @return {@code this}
         * @param downlinkBandwidthBits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_bandwidth_bits DevicefarmNetworkProfile#downlink_bandwidth_bits}. This parameter is required.
         */
        public Builder downlinkBandwidthBits(final java.lang.Number downlinkBandwidthBits) {
            this.config.downlinkBandwidthBits(downlinkBandwidthBits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_delay_ms DevicefarmNetworkProfile#downlink_delay_ms}.
         * <p>
         * @return {@code this}
         * @param downlinkDelayMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_delay_ms DevicefarmNetworkProfile#downlink_delay_ms}. This parameter is required.
         */
        public Builder downlinkDelayMs(final java.lang.Number downlinkDelayMs) {
            this.config.downlinkDelayMs(downlinkDelayMs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_jitter_ms DevicefarmNetworkProfile#downlink_jitter_ms}.
         * <p>
         * @return {@code this}
         * @param downlinkJitterMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_jitter_ms DevicefarmNetworkProfile#downlink_jitter_ms}. This parameter is required.
         */
        public Builder downlinkJitterMs(final java.lang.Number downlinkJitterMs) {
            this.config.downlinkJitterMs(downlinkJitterMs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_loss_percent DevicefarmNetworkProfile#downlink_loss_percent}.
         * <p>
         * @return {@code this}
         * @param downlinkLossPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#downlink_loss_percent DevicefarmNetworkProfile#downlink_loss_percent}. This parameter is required.
         */
        public Builder downlinkLossPercent(final java.lang.Number downlinkLossPercent) {
            this.config.downlinkLossPercent(downlinkLossPercent);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#id DevicefarmNetworkProfile#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#id DevicefarmNetworkProfile#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags DevicefarmNetworkProfile#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags DevicefarmNetworkProfile#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags_all DevicefarmNetworkProfile#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#tags_all DevicefarmNetworkProfile#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#type DevicefarmNetworkProfile#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#type DevicefarmNetworkProfile#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_bandwidth_bits DevicefarmNetworkProfile#uplink_bandwidth_bits}.
         * <p>
         * @return {@code this}
         * @param uplinkBandwidthBits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_bandwidth_bits DevicefarmNetworkProfile#uplink_bandwidth_bits}. This parameter is required.
         */
        public Builder uplinkBandwidthBits(final java.lang.Number uplinkBandwidthBits) {
            this.config.uplinkBandwidthBits(uplinkBandwidthBits);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_delay_ms DevicefarmNetworkProfile#uplink_delay_ms}.
         * <p>
         * @return {@code this}
         * @param uplinkDelayMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_delay_ms DevicefarmNetworkProfile#uplink_delay_ms}. This parameter is required.
         */
        public Builder uplinkDelayMs(final java.lang.Number uplinkDelayMs) {
            this.config.uplinkDelayMs(uplinkDelayMs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_jitter_ms DevicefarmNetworkProfile#uplink_jitter_ms}.
         * <p>
         * @return {@code this}
         * @param uplinkJitterMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_jitter_ms DevicefarmNetworkProfile#uplink_jitter_ms}. This parameter is required.
         */
        public Builder uplinkJitterMs(final java.lang.Number uplinkJitterMs) {
            this.config.uplinkJitterMs(uplinkJitterMs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_loss_percent DevicefarmNetworkProfile#uplink_loss_percent}.
         * <p>
         * @return {@code this}
         * @param uplinkLossPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_network_profile#uplink_loss_percent DevicefarmNetworkProfile#uplink_loss_percent}. This parameter is required.
         */
        public Builder uplinkLossPercent(final java.lang.Number uplinkLossPercent) {
            this.config.uplinkLossPercent(uplinkLossPercent);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile}.
         */
        @Override
        public imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile build() {
            return new imports.aws.devicefarm_network_profile.DevicefarmNetworkProfile(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
