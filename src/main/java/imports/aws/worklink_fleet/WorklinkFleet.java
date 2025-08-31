package imports.aws.worklink_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet aws_worklink_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.worklinkFleet.WorklinkFleet")
public class WorklinkFleet extends com.hashicorp.cdktf.TerraformResource {

    protected WorklinkFleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WorklinkFleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.worklink_fleet.WorklinkFleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet aws_worklink_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public WorklinkFleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.worklink_fleet.WorklinkFleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a WorklinkFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorklinkFleet to import. This parameter is required.
     * @param importFromId The id of the existing WorklinkFleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the WorklinkFleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.worklink_fleet.WorklinkFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a WorklinkFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the WorklinkFleet to import. This parameter is required.
     * @param importFromId The id of the existing WorklinkFleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.worklink_fleet.WorklinkFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putIdentityProvider(final @org.jetbrains.annotations.NotNull imports.aws.worklink_fleet.WorklinkFleetIdentityProvider value) {
        software.amazon.jsii.Kernel.call(this, "putIdentityProvider", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetwork(final @org.jetbrains.annotations.NotNull imports.aws.worklink_fleet.WorklinkFleetNetwork value) {
        software.amazon.jsii.Kernel.call(this, "putNetwork", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuditStreamArn() {
        software.amazon.jsii.Kernel.call(this, "resetAuditStreamArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceCaCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceCaCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisplayName() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityProvider() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityProvider", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetwork() {
        software.amazon.jsii.Kernel.call(this, "resetNetwork", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOptimizeForEndUserLocation() {
        software.amazon.jsii.Kernel.call(this, "resetOptimizeForEndUserLocation", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCompanyCode() {
        return software.amazon.jsii.Kernel.get(this, "companyCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.worklink_fleet.WorklinkFleetIdentityProviderOutputReference getIdentityProvider() {
        return software.amazon.jsii.Kernel.get(this, "identityProvider", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetIdentityProviderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.worklink_fleet.WorklinkFleetNetworkOutputReference getNetwork() {
        return software.amazon.jsii.Kernel.get(this, "network", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetNetworkOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuditStreamArnInput() {
        return software.amazon.jsii.Kernel.get(this, "auditStreamArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceCaCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceCaCertificateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "displayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.worklink_fleet.WorklinkFleetIdentityProvider getIdentityProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderInput", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetIdentityProvider.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.worklink_fleet.WorklinkFleetNetwork getNetworkInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInput", software.amazon.jsii.NativeType.forClass(imports.aws.worklink_fleet.WorklinkFleetNetwork.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOptimizeForEndUserLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "optimizeForEndUserLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuditStreamArn() {
        return software.amazon.jsii.Kernel.get(this, "auditStreamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuditStreamArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "auditStreamArn", java.util.Objects.requireNonNull(value, "auditStreamArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceCaCertificate() {
        return software.amazon.jsii.Kernel.get(this, "deviceCaCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceCaCertificate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceCaCertificate", java.util.Objects.requireNonNull(value, "deviceCaCertificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayName", java.util.Objects.requireNonNull(value, "displayName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getOptimizeForEndUserLocation() {
        return software.amazon.jsii.Kernel.get(this, "optimizeForEndUserLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOptimizeForEndUserLocation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "optimizeForEndUserLocation", java.util.Objects.requireNonNull(value, "optimizeForEndUserLocation is required"));
    }

    public void setOptimizeForEndUserLocation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "optimizeForEndUserLocation", java.util.Objects.requireNonNull(value, "optimizeForEndUserLocation is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.worklink_fleet.WorklinkFleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.worklink_fleet.WorklinkFleet> {
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
        private final imports.aws.worklink_fleet.WorklinkFleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.worklink_fleet.WorklinkFleetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#name WorklinkFleet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#name WorklinkFleet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#audit_stream_arn WorklinkFleet#audit_stream_arn}.
         * <p>
         * @return {@code this}
         * @param auditStreamArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#audit_stream_arn WorklinkFleet#audit_stream_arn}. This parameter is required.
         */
        public Builder auditStreamArn(final java.lang.String auditStreamArn) {
            this.config.auditStreamArn(auditStreamArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#device_ca_certificate WorklinkFleet#device_ca_certificate}.
         * <p>
         * @return {@code this}
         * @param deviceCaCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#device_ca_certificate WorklinkFleet#device_ca_certificate}. This parameter is required.
         */
        public Builder deviceCaCertificate(final java.lang.String deviceCaCertificate) {
            this.config.deviceCaCertificate(deviceCaCertificate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#display_name WorklinkFleet#display_name}.
         * <p>
         * @return {@code this}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#display_name WorklinkFleet#display_name}. This parameter is required.
         */
        public Builder displayName(final java.lang.String displayName) {
            this.config.displayName(displayName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#id WorklinkFleet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#id WorklinkFleet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * identity_provider block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#identity_provider WorklinkFleet#identity_provider}
         * <p>
         * @return {@code this}
         * @param identityProvider identity_provider block. This parameter is required.
         */
        public Builder identityProvider(final imports.aws.worklink_fleet.WorklinkFleetIdentityProvider identityProvider) {
            this.config.identityProvider(identityProvider);
            return this;
        }

        /**
         * network block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#network WorklinkFleet#network}
         * <p>
         * @return {@code this}
         * @param network network block. This parameter is required.
         */
        public Builder network(final imports.aws.worklink_fleet.WorklinkFleetNetwork network) {
            this.config.network(network);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}.
         * <p>
         * @return {@code this}
         * @param optimizeForEndUserLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}. This parameter is required.
         */
        public Builder optimizeForEndUserLocation(final java.lang.Boolean optimizeForEndUserLocation) {
            this.config.optimizeForEndUserLocation(optimizeForEndUserLocation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}.
         * <p>
         * @return {@code this}
         * @param optimizeForEndUserLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#optimize_for_end_user_location WorklinkFleet#optimize_for_end_user_location}. This parameter is required.
         */
        public Builder optimizeForEndUserLocation(final com.hashicorp.cdktf.IResolvable optimizeForEndUserLocation) {
            this.config.optimizeForEndUserLocation(optimizeForEndUserLocation);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.worklink_fleet.WorklinkFleet}.
         */
        @Override
        public imports.aws.worklink_fleet.WorklinkFleet build() {
            return new imports.aws.worklink_fleet.WorklinkFleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
