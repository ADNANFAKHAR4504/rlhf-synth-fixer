package imports.aws.verifiedaccess_trust_provider;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider aws_verifiedaccess_trust_provider}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.579Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessTrustProvider.VerifiedaccessTrustProvider")
public class VerifiedaccessTrustProvider extends com.hashicorp.cdktf.TerraformResource {

    protected VerifiedaccessTrustProvider(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessTrustProvider(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider aws_verifiedaccess_trust_provider} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VerifiedaccessTrustProvider(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VerifiedaccessTrustProvider resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VerifiedaccessTrustProvider to import. This parameter is required.
     * @param importFromId The id of the existing VerifiedaccessTrustProvider that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VerifiedaccessTrustProvider to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VerifiedaccessTrustProvider resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VerifiedaccessTrustProvider to import. This parameter is required.
     * @param importFromId The id of the existing VerifiedaccessTrustProvider that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeviceOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions value) {
        software.amazon.jsii.Kernel.call(this, "putDeviceOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNativeApplicationOidcOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions value) {
        software.amazon.jsii.Kernel.call(this, "putNativeApplicationOidcOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOidcOptions(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions value) {
        software.amazon.jsii.Kernel.call(this, "putOidcOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSseSpecification(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putSseSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceOptions() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceTrustProviderType() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceTrustProviderType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNativeApplicationOidcOptions() {
        software.amazon.jsii.Kernel.call(this, "resetNativeApplicationOidcOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOidcOptions() {
        software.amazon.jsii.Kernel.call(this, "resetOidcOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSseSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetSseSpecification", software.amazon.jsii.NativeType.VOID);
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

    public void resetUserTrustProviderType() {
        software.amazon.jsii.Kernel.call(this, "resetUserTrustProviderType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptionsOutputReference getDeviceOptions() {
        return software.amazon.jsii.Kernel.get(this, "deviceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptionsOutputReference getNativeApplicationOidcOptions() {
        return software.amazon.jsii.Kernel.get(this, "nativeApplicationOidcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptionsOutputReference getOidcOptions() {
        return software.amazon.jsii.Kernel.get(this, "oidcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecificationOutputReference getSseSpecification() {
        return software.amazon.jsii.Kernel.get(this, "sseSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions getDeviceOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceTrustProviderTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceTrustProviderTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions getNativeApplicationOidcOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "nativeApplicationOidcOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions getOidcOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "oidcOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyReferenceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "policyReferenceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification getSseSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "sseSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustProviderTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "trustProviderTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserTrustProviderTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "userTrustProviderTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceTrustProviderType() {
        return software.amazon.jsii.Kernel.get(this, "deviceTrustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceTrustProviderType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceTrustProviderType", java.util.Objects.requireNonNull(value, "deviceTrustProviderType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyReferenceName() {
        return software.amazon.jsii.Kernel.get(this, "policyReferenceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyReferenceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyReferenceName", java.util.Objects.requireNonNull(value, "policyReferenceName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustProviderType() {
        return software.amazon.jsii.Kernel.get(this, "trustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustProviderType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustProviderType", java.util.Objects.requireNonNull(value, "trustProviderType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserTrustProviderType() {
        return software.amazon.jsii.Kernel.get(this, "userTrustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserTrustProviderType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userTrustProviderType", java.util.Objects.requireNonNull(value, "userTrustProviderType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider> {
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
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#policy_reference_name VerifiedaccessTrustProvider#policy_reference_name}.
         * <p>
         * @return {@code this}
         * @param policyReferenceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#policy_reference_name VerifiedaccessTrustProvider#policy_reference_name}. This parameter is required.
         */
        public Builder policyReferenceName(final java.lang.String policyReferenceName) {
            this.config.policyReferenceName(policyReferenceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#trust_provider_type VerifiedaccessTrustProvider#trust_provider_type}.
         * <p>
         * @return {@code this}
         * @param trustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#trust_provider_type VerifiedaccessTrustProvider#trust_provider_type}. This parameter is required.
         */
        public Builder trustProviderType(final java.lang.String trustProviderType) {
            this.config.trustProviderType(trustProviderType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#description VerifiedaccessTrustProvider#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#description VerifiedaccessTrustProvider#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * device_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_options VerifiedaccessTrustProvider#device_options}
         * <p>
         * @return {@code this}
         * @param deviceOptions device_options block. This parameter is required.
         */
        public Builder deviceOptions(final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions deviceOptions) {
            this.config.deviceOptions(deviceOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_trust_provider_type VerifiedaccessTrustProvider#device_trust_provider_type}.
         * <p>
         * @return {@code this}
         * @param deviceTrustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_trust_provider_type VerifiedaccessTrustProvider#device_trust_provider_type}. This parameter is required.
         */
        public Builder deviceTrustProviderType(final java.lang.String deviceTrustProviderType) {
            this.config.deviceTrustProviderType(deviceTrustProviderType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#id VerifiedaccessTrustProvider#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#id VerifiedaccessTrustProvider#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * native_application_oidc_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#native_application_oidc_options VerifiedaccessTrustProvider#native_application_oidc_options}
         * <p>
         * @return {@code this}
         * @param nativeApplicationOidcOptions native_application_oidc_options block. This parameter is required.
         */
        public Builder nativeApplicationOidcOptions(final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions nativeApplicationOidcOptions) {
            this.config.nativeApplicationOidcOptions(nativeApplicationOidcOptions);
            return this;
        }

        /**
         * oidc_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#oidc_options VerifiedaccessTrustProvider#oidc_options}
         * <p>
         * @return {@code this}
         * @param oidcOptions oidc_options block. This parameter is required.
         */
        public Builder oidcOptions(final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions oidcOptions) {
            this.config.oidcOptions(oidcOptions);
            return this;
        }

        /**
         * sse_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#sse_specification VerifiedaccessTrustProvider#sse_specification}
         * <p>
         * @return {@code this}
         * @param sseSpecification sse_specification block. This parameter is required.
         */
        public Builder sseSpecification(final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification sseSpecification) {
            this.config.sseSpecification(sseSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags VerifiedaccessTrustProvider#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags VerifiedaccessTrustProvider#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags_all VerifiedaccessTrustProvider#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags_all VerifiedaccessTrustProvider#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#timeouts VerifiedaccessTrustProvider#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_trust_provider_type VerifiedaccessTrustProvider#user_trust_provider_type}.
         * <p>
         * @return {@code this}
         * @param userTrustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_trust_provider_type VerifiedaccessTrustProvider#user_trust_provider_type}. This parameter is required.
         */
        public Builder userTrustProviderType(final java.lang.String userTrustProviderType) {
            this.config.userTrustProviderType(userTrustProviderType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider}.
         */
        @Override
        public imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider build() {
            return new imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProvider(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
