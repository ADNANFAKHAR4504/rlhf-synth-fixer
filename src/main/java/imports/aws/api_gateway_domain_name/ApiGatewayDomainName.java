package imports.aws.api_gateway_domain_name;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name aws_api_gateway_domain_name}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.945Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayDomainName.ApiGatewayDomainName")
public class ApiGatewayDomainName extends com.hashicorp.cdktf.TerraformResource {

    protected ApiGatewayDomainName(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayDomainName(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.api_gateway_domain_name.ApiGatewayDomainName.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name aws_api_gateway_domain_name} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApiGatewayDomainName(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_domain_name.ApiGatewayDomainNameConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayDomainName resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayDomainName to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayDomainName that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApiGatewayDomainName to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_domain_name.ApiGatewayDomainName.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayDomainName resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayDomainName to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayDomainName that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_domain_name.ApiGatewayDomainName.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEndpointConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEndpointConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMutualTlsAuthentication(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication value) {
        software.amazon.jsii.Kernel.call(this, "putMutualTlsAuthentication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateBody() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateChain() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateChain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateName() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificatePrivateKey() {
        software.amazon.jsii.Kernel.call(this, "resetCertificatePrivateKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMutualTlsAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetMutualTlsAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOwnershipVerificationCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetOwnershipVerificationCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionalCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetRegionalCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionalCertificateName() {
        software.amazon.jsii.Kernel.call(this, "resetRegionalCertificateName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateUploadDate() {
        return software.amazon.jsii.Kernel.get(this, "certificateUploadDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudfrontDomainName() {
        return software.amazon.jsii.Kernel.get(this, "cloudfrontDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudfrontZoneId() {
        return software.amazon.jsii.Kernel.get(this, "cloudfrontZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainNameId() {
        return software.amazon.jsii.Kernel.get(this, "domainNameId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfigurationOutputReference getEndpointConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthenticationOutputReference getMutualTlsAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "mutualTlsAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthenticationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegionalDomainName() {
        return software.amazon.jsii.Kernel.get(this, "regionalDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegionalZoneId() {
        return software.amazon.jsii.Kernel.get(this, "regionalZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateChainInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateChainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateNameInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificatePrivateKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "certificatePrivateKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration getEndpointConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication getMutualTlsAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "mutualTlsAuthenticationInput", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOwnershipVerificationCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "ownershipVerificationCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionalCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "regionalCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionalCertificateNameInput() {
        return software.amazon.jsii.Kernel.get(this, "regionalCertificateNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "securityPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateArn", java.util.Objects.requireNonNull(value, "certificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateBody() {
        return software.amazon.jsii.Kernel.get(this, "certificateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateBody", java.util.Objects.requireNonNull(value, "certificateBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateChain() {
        return software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateChain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateChain", java.util.Objects.requireNonNull(value, "certificateChain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateName() {
        return software.amazon.jsii.Kernel.get(this, "certificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateName", java.util.Objects.requireNonNull(value, "certificateName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificatePrivateKey() {
        return software.amazon.jsii.Kernel.get(this, "certificatePrivateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificatePrivateKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificatePrivateKey", java.util.Objects.requireNonNull(value, "certificatePrivateKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnershipVerificationCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "ownershipVerificationCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOwnershipVerificationCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ownershipVerificationCertificateArn", java.util.Objects.requireNonNull(value, "ownershipVerificationCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegionalCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "regionalCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegionalCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "regionalCertificateArn", java.util.Objects.requireNonNull(value, "regionalCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegionalCertificateName() {
        return software.amazon.jsii.Kernel.get(this, "regionalCertificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegionalCertificateName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "regionalCertificateName", java.util.Objects.requireNonNull(value, "regionalCertificateName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityPolicy() {
        return software.amazon.jsii.Kernel.get(this, "securityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityPolicy", java.util.Objects.requireNonNull(value, "securityPolicy is required"));
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
     * A fluent builder for {@link imports.aws.api_gateway_domain_name.ApiGatewayDomainName}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.api_gateway_domain_name.ApiGatewayDomainName> {
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
        private final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.api_gateway_domain_name.ApiGatewayDomainNameConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#domain_name ApiGatewayDomainName#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#domain_name ApiGatewayDomainName#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_arn ApiGatewayDomainName#certificate_arn}.
         * <p>
         * @return {@code this}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_arn ApiGatewayDomainName#certificate_arn}. This parameter is required.
         */
        public Builder certificateArn(final java.lang.String certificateArn) {
            this.config.certificateArn(certificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_body ApiGatewayDomainName#certificate_body}.
         * <p>
         * @return {@code this}
         * @param certificateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_body ApiGatewayDomainName#certificate_body}. This parameter is required.
         */
        public Builder certificateBody(final java.lang.String certificateBody) {
            this.config.certificateBody(certificateBody);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_chain ApiGatewayDomainName#certificate_chain}.
         * <p>
         * @return {@code this}
         * @param certificateChain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_chain ApiGatewayDomainName#certificate_chain}. This parameter is required.
         */
        public Builder certificateChain(final java.lang.String certificateChain) {
            this.config.certificateChain(certificateChain);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_name ApiGatewayDomainName#certificate_name}.
         * <p>
         * @return {@code this}
         * @param certificateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_name ApiGatewayDomainName#certificate_name}. This parameter is required.
         */
        public Builder certificateName(final java.lang.String certificateName) {
            this.config.certificateName(certificateName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_private_key ApiGatewayDomainName#certificate_private_key}.
         * <p>
         * @return {@code this}
         * @param certificatePrivateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_private_key ApiGatewayDomainName#certificate_private_key}. This parameter is required.
         */
        public Builder certificatePrivateKey(final java.lang.String certificatePrivateKey) {
            this.config.certificatePrivateKey(certificatePrivateKey);
            return this;
        }

        /**
         * endpoint_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#endpoint_configuration ApiGatewayDomainName#endpoint_configuration}
         * <p>
         * @return {@code this}
         * @param endpointConfiguration endpoint_configuration block. This parameter is required.
         */
        public Builder endpointConfiguration(final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration endpointConfiguration) {
            this.config.endpointConfiguration(endpointConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#id ApiGatewayDomainName#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#id ApiGatewayDomainName#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * mutual_tls_authentication block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#mutual_tls_authentication ApiGatewayDomainName#mutual_tls_authentication}
         * <p>
         * @return {@code this}
         * @param mutualTlsAuthentication mutual_tls_authentication block. This parameter is required.
         */
        public Builder mutualTlsAuthentication(final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication mutualTlsAuthentication) {
            this.config.mutualTlsAuthentication(mutualTlsAuthentication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ownership_verification_certificate_arn ApiGatewayDomainName#ownership_verification_certificate_arn}.
         * <p>
         * @return {@code this}
         * @param ownershipVerificationCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ownership_verification_certificate_arn ApiGatewayDomainName#ownership_verification_certificate_arn}. This parameter is required.
         */
        public Builder ownershipVerificationCertificateArn(final java.lang.String ownershipVerificationCertificateArn) {
            this.config.ownershipVerificationCertificateArn(ownershipVerificationCertificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#policy ApiGatewayDomainName#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#policy ApiGatewayDomainName#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config.policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_arn ApiGatewayDomainName#regional_certificate_arn}.
         * <p>
         * @return {@code this}
         * @param regionalCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_arn ApiGatewayDomainName#regional_certificate_arn}. This parameter is required.
         */
        public Builder regionalCertificateArn(final java.lang.String regionalCertificateArn) {
            this.config.regionalCertificateArn(regionalCertificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_name ApiGatewayDomainName#regional_certificate_name}.
         * <p>
         * @return {@code this}
         * @param regionalCertificateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_name ApiGatewayDomainName#regional_certificate_name}. This parameter is required.
         */
        public Builder regionalCertificateName(final java.lang.String regionalCertificateName) {
            this.config.regionalCertificateName(regionalCertificateName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#security_policy ApiGatewayDomainName#security_policy}.
         * <p>
         * @return {@code this}
         * @param securityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#security_policy ApiGatewayDomainName#security_policy}. This parameter is required.
         */
        public Builder securityPolicy(final java.lang.String securityPolicy) {
            this.config.securityPolicy(securityPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags ApiGatewayDomainName#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags ApiGatewayDomainName#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags_all ApiGatewayDomainName#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags_all ApiGatewayDomainName#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.api_gateway_domain_name.ApiGatewayDomainName}.
         */
        @Override
        public imports.aws.api_gateway_domain_name.ApiGatewayDomainName build() {
            return new imports.aws.api_gateway_domain_name.ApiGatewayDomainName(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
