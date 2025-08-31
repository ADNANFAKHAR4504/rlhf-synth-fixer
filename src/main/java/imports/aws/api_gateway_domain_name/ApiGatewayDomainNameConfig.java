package imports.aws.api_gateway_domain_name;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayDomainName.ApiGatewayDomainNameConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayDomainNameConfig.Jsii$Proxy.class)
public interface ApiGatewayDomainNameConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#domain_name ApiGatewayDomainName#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_arn ApiGatewayDomainName#certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_body ApiGatewayDomainName#certificate_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_chain ApiGatewayDomainName#certificate_chain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateChain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_name ApiGatewayDomainName#certificate_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_private_key ApiGatewayDomainName#certificate_private_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificatePrivateKey() {
        return null;
    }

    /**
     * endpoint_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#endpoint_configuration ApiGatewayDomainName#endpoint_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration getEndpointConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#id ApiGatewayDomainName#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * mutual_tls_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#mutual_tls_authentication ApiGatewayDomainName#mutual_tls_authentication}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication getMutualTlsAuthentication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ownership_verification_certificate_arn ApiGatewayDomainName#ownership_verification_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnershipVerificationCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#policy ApiGatewayDomainName#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_arn ApiGatewayDomainName#regional_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegionalCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_name ApiGatewayDomainName#regional_certificate_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegionalCertificateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#security_policy ApiGatewayDomainName#security_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags ApiGatewayDomainName#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags_all ApiGatewayDomainName#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayDomainNameConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayDomainNameConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayDomainNameConfig> {
        java.lang.String domainName;
        java.lang.String certificateArn;
        java.lang.String certificateBody;
        java.lang.String certificateChain;
        java.lang.String certificateName;
        java.lang.String certificatePrivateKey;
        imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration endpointConfiguration;
        java.lang.String id;
        imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication mutualTlsAuthentication;
        java.lang.String ownershipVerificationCertificateArn;
        java.lang.String policy;
        java.lang.String regionalCertificateArn;
        java.lang.String regionalCertificateName;
        java.lang.String securityPolicy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#domain_name ApiGatewayDomainName#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCertificateArn}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_arn ApiGatewayDomainName#certificate_arn}.
         * @return {@code this}
         */
        public Builder certificateArn(java.lang.String certificateArn) {
            this.certificateArn = certificateArn;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCertificateBody}
         * @param certificateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_body ApiGatewayDomainName#certificate_body}.
         * @return {@code this}
         */
        public Builder certificateBody(java.lang.String certificateBody) {
            this.certificateBody = certificateBody;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCertificateChain}
         * @param certificateChain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_chain ApiGatewayDomainName#certificate_chain}.
         * @return {@code this}
         */
        public Builder certificateChain(java.lang.String certificateChain) {
            this.certificateChain = certificateChain;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCertificateName}
         * @param certificateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_name ApiGatewayDomainName#certificate_name}.
         * @return {@code this}
         */
        public Builder certificateName(java.lang.String certificateName) {
            this.certificateName = certificateName;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCertificatePrivateKey}
         * @param certificatePrivateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#certificate_private_key ApiGatewayDomainName#certificate_private_key}.
         * @return {@code this}
         */
        public Builder certificatePrivateKey(java.lang.String certificatePrivateKey) {
            this.certificatePrivateKey = certificatePrivateKey;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#endpoint_configuration ApiGatewayDomainName#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#id ApiGatewayDomainName#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getMutualTlsAuthentication}
         * @param mutualTlsAuthentication mutual_tls_authentication block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#mutual_tls_authentication ApiGatewayDomainName#mutual_tls_authentication}
         * @return {@code this}
         */
        public Builder mutualTlsAuthentication(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication mutualTlsAuthentication) {
            this.mutualTlsAuthentication = mutualTlsAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getOwnershipVerificationCertificateArn}
         * @param ownershipVerificationCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#ownership_verification_certificate_arn ApiGatewayDomainName#ownership_verification_certificate_arn}.
         * @return {@code this}
         */
        public Builder ownershipVerificationCertificateArn(java.lang.String ownershipVerificationCertificateArn) {
            this.ownershipVerificationCertificateArn = ownershipVerificationCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#policy ApiGatewayDomainName#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getRegionalCertificateArn}
         * @param regionalCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_arn ApiGatewayDomainName#regional_certificate_arn}.
         * @return {@code this}
         */
        public Builder regionalCertificateArn(java.lang.String regionalCertificateArn) {
            this.regionalCertificateArn = regionalCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getRegionalCertificateName}
         * @param regionalCertificateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#regional_certificate_name ApiGatewayDomainName#regional_certificate_name}.
         * @return {@code this}
         */
        public Builder regionalCertificateName(java.lang.String regionalCertificateName) {
            this.regionalCertificateName = regionalCertificateName;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getSecurityPolicy}
         * @param securityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#security_policy ApiGatewayDomainName#security_policy}.
         * @return {@code this}
         */
        public Builder securityPolicy(java.lang.String securityPolicy) {
            this.securityPolicy = securityPolicy;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags ApiGatewayDomainName#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name#tags_all ApiGatewayDomainName#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayDomainNameConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayDomainNameConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayDomainNameConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayDomainNameConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayDomainNameConfig {
        private final java.lang.String domainName;
        private final java.lang.String certificateArn;
        private final java.lang.String certificateBody;
        private final java.lang.String certificateChain;
        private final java.lang.String certificateName;
        private final java.lang.String certificatePrivateKey;
        private final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration endpointConfiguration;
        private final java.lang.String id;
        private final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication mutualTlsAuthentication;
        private final java.lang.String ownershipVerificationCertificateArn;
        private final java.lang.String policy;
        private final java.lang.String regionalCertificateArn;
        private final java.lang.String regionalCertificateName;
        private final java.lang.String securityPolicy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateArn = software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateBody = software.amazon.jsii.Kernel.get(this, "certificateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateChain = software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateName = software.amazon.jsii.Kernel.get(this, "certificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificatePrivateKey = software.amazon.jsii.Kernel.get(this, "certificatePrivateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointConfiguration = software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mutualTlsAuthentication = software.amazon.jsii.Kernel.get(this, "mutualTlsAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication.class));
            this.ownershipVerificationCertificateArn = software.amazon.jsii.Kernel.get(this, "ownershipVerificationCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regionalCertificateArn = software.amazon.jsii.Kernel.get(this, "regionalCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regionalCertificateName = software.amazon.jsii.Kernel.get(this, "regionalCertificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityPolicy = software.amazon.jsii.Kernel.get(this, "securityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.certificateArn = builder.certificateArn;
            this.certificateBody = builder.certificateBody;
            this.certificateChain = builder.certificateChain;
            this.certificateName = builder.certificateName;
            this.certificatePrivateKey = builder.certificatePrivateKey;
            this.endpointConfiguration = builder.endpointConfiguration;
            this.id = builder.id;
            this.mutualTlsAuthentication = builder.mutualTlsAuthentication;
            this.ownershipVerificationCertificateArn = builder.ownershipVerificationCertificateArn;
            this.policy = builder.policy;
            this.regionalCertificateArn = builder.regionalCertificateArn;
            this.regionalCertificateName = builder.regionalCertificateName;
            this.securityPolicy = builder.securityPolicy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getCertificateArn() {
            return this.certificateArn;
        }

        @Override
        public final java.lang.String getCertificateBody() {
            return this.certificateBody;
        }

        @Override
        public final java.lang.String getCertificateChain() {
            return this.certificateChain;
        }

        @Override
        public final java.lang.String getCertificateName() {
            return this.certificateName;
        }

        @Override
        public final java.lang.String getCertificatePrivateKey() {
            return this.certificatePrivateKey;
        }

        @Override
        public final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameEndpointConfiguration getEndpointConfiguration() {
            return this.endpointConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication getMutualTlsAuthentication() {
            return this.mutualTlsAuthentication;
        }

        @Override
        public final java.lang.String getOwnershipVerificationCertificateArn() {
            return this.ownershipVerificationCertificateArn;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.lang.String getRegionalCertificateArn() {
            return this.regionalCertificateArn;
        }

        @Override
        public final java.lang.String getRegionalCertificateName() {
            return this.regionalCertificateName;
        }

        @Override
        public final java.lang.String getSecurityPolicy() {
            return this.securityPolicy;
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

            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getCertificateArn() != null) {
                data.set("certificateArn", om.valueToTree(this.getCertificateArn()));
            }
            if (this.getCertificateBody() != null) {
                data.set("certificateBody", om.valueToTree(this.getCertificateBody()));
            }
            if (this.getCertificateChain() != null) {
                data.set("certificateChain", om.valueToTree(this.getCertificateChain()));
            }
            if (this.getCertificateName() != null) {
                data.set("certificateName", om.valueToTree(this.getCertificateName()));
            }
            if (this.getCertificatePrivateKey() != null) {
                data.set("certificatePrivateKey", om.valueToTree(this.getCertificatePrivateKey()));
            }
            if (this.getEndpointConfiguration() != null) {
                data.set("endpointConfiguration", om.valueToTree(this.getEndpointConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMutualTlsAuthentication() != null) {
                data.set("mutualTlsAuthentication", om.valueToTree(this.getMutualTlsAuthentication()));
            }
            if (this.getOwnershipVerificationCertificateArn() != null) {
                data.set("ownershipVerificationCertificateArn", om.valueToTree(this.getOwnershipVerificationCertificateArn()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getRegionalCertificateArn() != null) {
                data.set("regionalCertificateArn", om.valueToTree(this.getRegionalCertificateArn()));
            }
            if (this.getRegionalCertificateName() != null) {
                data.set("regionalCertificateName", om.valueToTree(this.getRegionalCertificateName()));
            }
            if (this.getSecurityPolicy() != null) {
                data.set("securityPolicy", om.valueToTree(this.getSecurityPolicy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayDomainName.ApiGatewayDomainNameConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayDomainNameConfig.Jsii$Proxy that = (ApiGatewayDomainNameConfig.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.certificateArn != null ? !this.certificateArn.equals(that.certificateArn) : that.certificateArn != null) return false;
            if (this.certificateBody != null ? !this.certificateBody.equals(that.certificateBody) : that.certificateBody != null) return false;
            if (this.certificateChain != null ? !this.certificateChain.equals(that.certificateChain) : that.certificateChain != null) return false;
            if (this.certificateName != null ? !this.certificateName.equals(that.certificateName) : that.certificateName != null) return false;
            if (this.certificatePrivateKey != null ? !this.certificatePrivateKey.equals(that.certificatePrivateKey) : that.certificatePrivateKey != null) return false;
            if (this.endpointConfiguration != null ? !this.endpointConfiguration.equals(that.endpointConfiguration) : that.endpointConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.mutualTlsAuthentication != null ? !this.mutualTlsAuthentication.equals(that.mutualTlsAuthentication) : that.mutualTlsAuthentication != null) return false;
            if (this.ownershipVerificationCertificateArn != null ? !this.ownershipVerificationCertificateArn.equals(that.ownershipVerificationCertificateArn) : that.ownershipVerificationCertificateArn != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.regionalCertificateArn != null ? !this.regionalCertificateArn.equals(that.regionalCertificateArn) : that.regionalCertificateArn != null) return false;
            if (this.regionalCertificateName != null ? !this.regionalCertificateName.equals(that.regionalCertificateName) : that.regionalCertificateName != null) return false;
            if (this.securityPolicy != null ? !this.securityPolicy.equals(that.securityPolicy) : that.securityPolicy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.domainName.hashCode();
            result = 31 * result + (this.certificateArn != null ? this.certificateArn.hashCode() : 0);
            result = 31 * result + (this.certificateBody != null ? this.certificateBody.hashCode() : 0);
            result = 31 * result + (this.certificateChain != null ? this.certificateChain.hashCode() : 0);
            result = 31 * result + (this.certificateName != null ? this.certificateName.hashCode() : 0);
            result = 31 * result + (this.certificatePrivateKey != null ? this.certificatePrivateKey.hashCode() : 0);
            result = 31 * result + (this.endpointConfiguration != null ? this.endpointConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.mutualTlsAuthentication != null ? this.mutualTlsAuthentication.hashCode() : 0);
            result = 31 * result + (this.ownershipVerificationCertificateArn != null ? this.ownershipVerificationCertificateArn.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.regionalCertificateArn != null ? this.regionalCertificateArn.hashCode() : 0);
            result = 31 * result + (this.regionalCertificateName != null ? this.regionalCertificateName.hashCode() : 0);
            result = 31 * result + (this.securityPolicy != null ? this.securityPolicy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
