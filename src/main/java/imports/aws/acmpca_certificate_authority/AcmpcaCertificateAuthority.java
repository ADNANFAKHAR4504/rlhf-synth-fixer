package imports.aws.acmpca_certificate_authority;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority aws_acmpca_certificate_authority}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.895Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthority")
public class AcmpcaCertificateAuthority extends com.hashicorp.cdktf.TerraformResource {

    protected AcmpcaCertificateAuthority(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificateAuthority(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority aws_acmpca_certificate_authority} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AcmpcaCertificateAuthority(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AcmpcaCertificateAuthority resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AcmpcaCertificateAuthority to import. This parameter is required.
     * @param importFromId The id of the existing AcmpcaCertificateAuthority that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AcmpcaCertificateAuthority to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AcmpcaCertificateAuthority resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AcmpcaCertificateAuthority to import. This parameter is required.
     * @param importFromId The id of the existing AcmpcaCertificateAuthority that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCertificateAuthorityConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCertificateAuthorityConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRevocationConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRevocationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyStorageSecurityStandard() {
        software.amazon.jsii.Kernel.call(this, "resetKeyStorageSecurityStandard", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermanentDeletionTimeInDays() {
        software.amazon.jsii.Kernel.call(this, "resetPermanentDeletionTimeInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRevocationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRevocationConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsageMode() {
        software.amazon.jsii.Kernel.call(this, "resetUsageMode", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificate() {
        return software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference getCertificateAuthorityConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateChain() {
        return software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateSigningRequest() {
        return software.amazon.jsii.Kernel.get(this, "certificateSigningRequest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotAfter() {
        return software.amazon.jsii.Kernel.get(this, "notAfter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotBefore() {
        return software.amazon.jsii.Kernel.get(this, "notBefore", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOutputReference getRevocationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "revocationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSerial() {
        return software.amazon.jsii.Kernel.get(this, "serial", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration getCertificateAuthorityConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyStorageSecurityStandardInput() {
        return software.amazon.jsii.Kernel.get(this, "keyStorageSecurityStandardInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPermanentDeletionTimeInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "permanentDeletionTimeInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration getRevocationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "revocationConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsageModeInput() {
        return software.amazon.jsii.Kernel.get(this, "usageModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyStorageSecurityStandard() {
        return software.amazon.jsii.Kernel.get(this, "keyStorageSecurityStandard", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyStorageSecurityStandard(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyStorageSecurityStandard", java.util.Objects.requireNonNull(value, "keyStorageSecurityStandard is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPermanentDeletionTimeInDays() {
        return software.amazon.jsii.Kernel.get(this, "permanentDeletionTimeInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPermanentDeletionTimeInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "permanentDeletionTimeInDays", java.util.Objects.requireNonNull(value, "permanentDeletionTimeInDays is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getUsageMode() {
        return software.amazon.jsii.Kernel.get(this, "usageMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsageMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usageMode", java.util.Objects.requireNonNull(value, "usageMode is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority> {
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
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityConfig.Builder();
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
         * certificate_authority_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#certificate_authority_configuration AcmpcaCertificateAuthority#certificate_authority_configuration}
         * <p>
         * @return {@code this}
         * @param certificateAuthorityConfiguration certificate_authority_configuration block. This parameter is required.
         */
        public Builder certificateAuthorityConfiguration(final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration certificateAuthorityConfiguration) {
            this.config.certificateAuthorityConfiguration(certificateAuthorityConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#id AcmpcaCertificateAuthority#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#id AcmpcaCertificateAuthority#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#key_storage_security_standard AcmpcaCertificateAuthority#key_storage_security_standard}.
         * <p>
         * @return {@code this}
         * @param keyStorageSecurityStandard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#key_storage_security_standard AcmpcaCertificateAuthority#key_storage_security_standard}. This parameter is required.
         */
        public Builder keyStorageSecurityStandard(final java.lang.String keyStorageSecurityStandard) {
            this.config.keyStorageSecurityStandard(keyStorageSecurityStandard);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#permanent_deletion_time_in_days AcmpcaCertificateAuthority#permanent_deletion_time_in_days}.
         * <p>
         * @return {@code this}
         * @param permanentDeletionTimeInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#permanent_deletion_time_in_days AcmpcaCertificateAuthority#permanent_deletion_time_in_days}. This parameter is required.
         */
        public Builder permanentDeletionTimeInDays(final java.lang.Number permanentDeletionTimeInDays) {
            this.config.permanentDeletionTimeInDays(permanentDeletionTimeInDays);
            return this;
        }

        /**
         * revocation_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#revocation_configuration AcmpcaCertificateAuthority#revocation_configuration}
         * <p>
         * @return {@code this}
         * @param revocationConfiguration revocation_configuration block. This parameter is required.
         */
        public Builder revocationConfiguration(final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration revocationConfiguration) {
            this.config.revocationConfiguration(revocationConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags AcmpcaCertificateAuthority#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags AcmpcaCertificateAuthority#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags_all AcmpcaCertificateAuthority#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags_all AcmpcaCertificateAuthority#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#timeouts AcmpcaCertificateAuthority#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#type AcmpcaCertificateAuthority#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#type AcmpcaCertificateAuthority#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#usage_mode AcmpcaCertificateAuthority#usage_mode}.
         * <p>
         * @return {@code this}
         * @param usageMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#usage_mode AcmpcaCertificateAuthority#usage_mode}. This parameter is required.
         */
        public Builder usageMode(final java.lang.String usageMode) {
            this.config.usageMode(usageMode);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority}.
         */
        @Override
        public imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority build() {
            return new imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthority(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
