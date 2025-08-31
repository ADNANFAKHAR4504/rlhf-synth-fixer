package imports.aws.acmpca_certificate;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate aws_acmpca_certificate}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificate.AcmpcaCertificate")
public class AcmpcaCertificate extends com.hashicorp.cdktf.TerraformResource {

    protected AcmpcaCertificate(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmpcaCertificate(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.acmpca_certificate.AcmpcaCertificate.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate aws_acmpca_certificate} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AcmpcaCertificate(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate.AcmpcaCertificateConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AcmpcaCertificate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AcmpcaCertificate to import. This parameter is required.
     * @param importFromId The id of the existing AcmpcaCertificate that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AcmpcaCertificate to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.acmpca_certificate.AcmpcaCertificate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AcmpcaCertificate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AcmpcaCertificate to import. This parameter is required.
     * @param importFromId The id of the existing AcmpcaCertificate that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.acmpca_certificate.AcmpcaCertificate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putValidity(final @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate.AcmpcaCertificateValidity value) {
        software.amazon.jsii.Kernel.call(this, "putValidity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiPassthrough() {
        software.amazon.jsii.Kernel.call(this, "resetApiPassthrough", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateArn() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateChain() {
        return software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate.AcmpcaCertificateValidityOutputReference getValidity() {
        return software.amazon.jsii.Kernel.get(this, "validity", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate.AcmpcaCertificateValidityOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiPassthroughInput() {
        return software.amazon.jsii.Kernel.get(this, "apiPassthroughInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateAuthorityArnInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateSigningRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateSigningRequestInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSigningAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "templateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate.AcmpcaCertificateValidity getValidityInput() {
        return software.amazon.jsii.Kernel.get(this, "validityInput", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate.AcmpcaCertificateValidity.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiPassthrough() {
        return software.amazon.jsii.Kernel.get(this, "apiPassthrough", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiPassthrough(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiPassthrough", java.util.Objects.requireNonNull(value, "apiPassthrough is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateAuthorityArn() {
        return software.amazon.jsii.Kernel.get(this, "certificateAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateAuthorityArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateAuthorityArn", java.util.Objects.requireNonNull(value, "certificateAuthorityArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateSigningRequest() {
        return software.amazon.jsii.Kernel.get(this, "certificateSigningRequest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateSigningRequest(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateSigningRequest", java.util.Objects.requireNonNull(value, "certificateSigningRequest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "signingAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSigningAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "signingAlgorithm", java.util.Objects.requireNonNull(value, "signingAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateArn() {
        return software.amazon.jsii.Kernel.get(this, "templateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateArn", java.util.Objects.requireNonNull(value, "templateArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.acmpca_certificate.AcmpcaCertificate}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.acmpca_certificate.AcmpcaCertificate> {
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
        private final imports.aws.acmpca_certificate.AcmpcaCertificateConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.acmpca_certificate.AcmpcaCertificateConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#certificate_authority_arn AcmpcaCertificate#certificate_authority_arn}.
         * <p>
         * @return {@code this}
         * @param certificateAuthorityArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#certificate_authority_arn AcmpcaCertificate#certificate_authority_arn}. This parameter is required.
         */
        public Builder certificateAuthorityArn(final java.lang.String certificateAuthorityArn) {
            this.config.certificateAuthorityArn(certificateAuthorityArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#certificate_signing_request AcmpcaCertificate#certificate_signing_request}.
         * <p>
         * @return {@code this}
         * @param certificateSigningRequest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#certificate_signing_request AcmpcaCertificate#certificate_signing_request}. This parameter is required.
         */
        public Builder certificateSigningRequest(final java.lang.String certificateSigningRequest) {
            this.config.certificateSigningRequest(certificateSigningRequest);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#signing_algorithm AcmpcaCertificate#signing_algorithm}.
         * <p>
         * @return {@code this}
         * @param signingAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#signing_algorithm AcmpcaCertificate#signing_algorithm}. This parameter is required.
         */
        public Builder signingAlgorithm(final java.lang.String signingAlgorithm) {
            this.config.signingAlgorithm(signingAlgorithm);
            return this;
        }

        /**
         * validity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#validity AcmpcaCertificate#validity}
         * <p>
         * @return {@code this}
         * @param validity validity block. This parameter is required.
         */
        public Builder validity(final imports.aws.acmpca_certificate.AcmpcaCertificateValidity validity) {
            this.config.validity(validity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#api_passthrough AcmpcaCertificate#api_passthrough}.
         * <p>
         * @return {@code this}
         * @param apiPassthrough Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#api_passthrough AcmpcaCertificate#api_passthrough}. This parameter is required.
         */
        public Builder apiPassthrough(final java.lang.String apiPassthrough) {
            this.config.apiPassthrough(apiPassthrough);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#id AcmpcaCertificate#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#id AcmpcaCertificate#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#template_arn AcmpcaCertificate#template_arn}.
         * <p>
         * @return {@code this}
         * @param templateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate#template_arn AcmpcaCertificate#template_arn}. This parameter is required.
         */
        public Builder templateArn(final java.lang.String templateArn) {
            this.config.templateArn(templateArn);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.acmpca_certificate.AcmpcaCertificate}.
         */
        @Override
        public imports.aws.acmpca_certificate.AcmpcaCertificate build() {
            return new imports.aws.acmpca_certificate.AcmpcaCertificate(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
