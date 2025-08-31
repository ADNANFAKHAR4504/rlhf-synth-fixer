package imports.aws.iot_domain_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.397Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotDomainConfiguration.IotDomainConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(IotDomainConfigurationConfig.Jsii$Proxy.class)
public interface IotDomainConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#name IotDomainConfiguration#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#application_protocol IotDomainConfiguration#application_protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#authentication_type IotDomainConfiguration#authentication_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationType() {
        return null;
    }

    /**
     * authorizer_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#authorizer_config IotDomainConfiguration#authorizer_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig getAuthorizerConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#domain_name IotDomainConfiguration#domain_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#id IotDomainConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#server_certificate_arns IotDomainConfiguration#server_certificate_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getServerCertificateArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#service_type IotDomainConfiguration#service_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#status IotDomainConfiguration#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tags IotDomainConfiguration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tags_all IotDomainConfiguration#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tls_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tls_config IotDomainConfiguration#tls_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig getTlsConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#validation_certificate_arn IotDomainConfiguration#validation_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidationCertificateArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotDomainConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotDomainConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotDomainConfigurationConfig> {
        java.lang.String name;
        java.lang.String applicationProtocol;
        java.lang.String authenticationType;
        imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig authorizerConfig;
        java.lang.String domainName;
        java.lang.String id;
        java.util.List<java.lang.String> serverCertificateArns;
        java.lang.String serviceType;
        java.lang.String status;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig tlsConfig;
        java.lang.String validationCertificateArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#name IotDomainConfiguration#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getApplicationProtocol}
         * @param applicationProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#application_protocol IotDomainConfiguration#application_protocol}.
         * @return {@code this}
         */
        public Builder applicationProtocol(java.lang.String applicationProtocol) {
            this.applicationProtocol = applicationProtocol;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#authentication_type IotDomainConfiguration#authentication_type}.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getAuthorizerConfig}
         * @param authorizerConfig authorizer_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#authorizer_config IotDomainConfiguration#authorizer_config}
         * @return {@code this}
         */
        public Builder authorizerConfig(imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig authorizerConfig) {
            this.authorizerConfig = authorizerConfig;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#domain_name IotDomainConfiguration#domain_name}.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#id IotDomainConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getServerCertificateArns}
         * @param serverCertificateArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#server_certificate_arns IotDomainConfiguration#server_certificate_arns}.
         * @return {@code this}
         */
        public Builder serverCertificateArns(java.util.List<java.lang.String> serverCertificateArns) {
            this.serverCertificateArns = serverCertificateArns;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getServiceType}
         * @param serviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#service_type IotDomainConfiguration#service_type}.
         * @return {@code this}
         */
        public Builder serviceType(java.lang.String serviceType) {
            this.serviceType = serviceType;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#status IotDomainConfiguration#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tags IotDomainConfiguration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tags_all IotDomainConfiguration#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getTlsConfig}
         * @param tlsConfig tls_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#tls_config IotDomainConfiguration#tls_config}
         * @return {@code this}
         */
        public Builder tlsConfig(imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig tlsConfig) {
            this.tlsConfig = tlsConfig;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getValidationCertificateArn}
         * @param validationCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#validation_certificate_arn IotDomainConfiguration#validation_certificate_arn}.
         * @return {@code this}
         */
        public Builder validationCertificateArn(java.lang.String validationCertificateArn) {
            this.validationCertificateArn = validationCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link IotDomainConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link IotDomainConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotDomainConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotDomainConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotDomainConfigurationConfig {
        private final java.lang.String name;
        private final java.lang.String applicationProtocol;
        private final java.lang.String authenticationType;
        private final imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig authorizerConfig;
        private final java.lang.String domainName;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> serverCertificateArns;
        private final java.lang.String serviceType;
        private final java.lang.String status;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig tlsConfig;
        private final java.lang.String validationCertificateArn;
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
            this.applicationProtocol = software.amazon.jsii.Kernel.get(this, "applicationProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerConfig = software.amazon.jsii.Kernel.get(this, "authorizerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig.class));
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverCertificateArns = software.amazon.jsii.Kernel.get(this, "serverCertificateArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.serviceType = software.amazon.jsii.Kernel.get(this, "serviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tlsConfig = software.amazon.jsii.Kernel.get(this, "tlsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig.class));
            this.validationCertificateArn = software.amazon.jsii.Kernel.get(this, "validationCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.applicationProtocol = builder.applicationProtocol;
            this.authenticationType = builder.authenticationType;
            this.authorizerConfig = builder.authorizerConfig;
            this.domainName = builder.domainName;
            this.id = builder.id;
            this.serverCertificateArns = builder.serverCertificateArns;
            this.serviceType = builder.serviceType;
            this.status = builder.status;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tlsConfig = builder.tlsConfig;
            this.validationCertificateArn = builder.validationCertificateArn;
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
        public final java.lang.String getApplicationProtocol() {
            return this.applicationProtocol;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        public final imports.aws.iot_domain_configuration.IotDomainConfigurationAuthorizerConfig getAuthorizerConfig() {
            return this.authorizerConfig;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getServerCertificateArns() {
            return this.serverCertificateArns;
        }

        @Override
        public final java.lang.String getServiceType() {
            return this.serviceType;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
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
        public final imports.aws.iot_domain_configuration.IotDomainConfigurationTlsConfig getTlsConfig() {
            return this.tlsConfig;
        }

        @Override
        public final java.lang.String getValidationCertificateArn() {
            return this.validationCertificateArn;
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
            if (this.getApplicationProtocol() != null) {
                data.set("applicationProtocol", om.valueToTree(this.getApplicationProtocol()));
            }
            if (this.getAuthenticationType() != null) {
                data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            }
            if (this.getAuthorizerConfig() != null) {
                data.set("authorizerConfig", om.valueToTree(this.getAuthorizerConfig()));
            }
            if (this.getDomainName() != null) {
                data.set("domainName", om.valueToTree(this.getDomainName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getServerCertificateArns() != null) {
                data.set("serverCertificateArns", om.valueToTree(this.getServerCertificateArns()));
            }
            if (this.getServiceType() != null) {
                data.set("serviceType", om.valueToTree(this.getServiceType()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTlsConfig() != null) {
                data.set("tlsConfig", om.valueToTree(this.getTlsConfig()));
            }
            if (this.getValidationCertificateArn() != null) {
                data.set("validationCertificateArn", om.valueToTree(this.getValidationCertificateArn()));
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
            struct.set("fqn", om.valueToTree("aws.iotDomainConfiguration.IotDomainConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotDomainConfigurationConfig.Jsii$Proxy that = (IotDomainConfigurationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.applicationProtocol != null ? !this.applicationProtocol.equals(that.applicationProtocol) : that.applicationProtocol != null) return false;
            if (this.authenticationType != null ? !this.authenticationType.equals(that.authenticationType) : that.authenticationType != null) return false;
            if (this.authorizerConfig != null ? !this.authorizerConfig.equals(that.authorizerConfig) : that.authorizerConfig != null) return false;
            if (this.domainName != null ? !this.domainName.equals(that.domainName) : that.domainName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.serverCertificateArns != null ? !this.serverCertificateArns.equals(that.serverCertificateArns) : that.serverCertificateArns != null) return false;
            if (this.serviceType != null ? !this.serviceType.equals(that.serviceType) : that.serviceType != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tlsConfig != null ? !this.tlsConfig.equals(that.tlsConfig) : that.tlsConfig != null) return false;
            if (this.validationCertificateArn != null ? !this.validationCertificateArn.equals(that.validationCertificateArn) : that.validationCertificateArn != null) return false;
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
            result = 31 * result + (this.applicationProtocol != null ? this.applicationProtocol.hashCode() : 0);
            result = 31 * result + (this.authenticationType != null ? this.authenticationType.hashCode() : 0);
            result = 31 * result + (this.authorizerConfig != null ? this.authorizerConfig.hashCode() : 0);
            result = 31 * result + (this.domainName != null ? this.domainName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.serverCertificateArns != null ? this.serverCertificateArns.hashCode() : 0);
            result = 31 * result + (this.serviceType != null ? this.serviceType.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tlsConfig != null ? this.tlsConfig.hashCode() : 0);
            result = 31 * result + (this.validationCertificateArn != null ? this.validationCertificateArn.hashCode() : 0);
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
