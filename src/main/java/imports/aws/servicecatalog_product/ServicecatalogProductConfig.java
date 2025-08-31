package imports.aws.servicecatalog_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProduct.ServicecatalogProductConfig")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogProductConfig.Jsii$Proxy.class)
public interface ServicecatalogProductConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#name ServicecatalogProduct#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#owner ServicecatalogProduct#owner}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwner();

    /**
     * provisioning_artifact_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#provisioning_artifact_parameters ServicecatalogProduct#provisioning_artifact_parameters}
     */
    @org.jetbrains.annotations.NotNull imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters getProvisioningArtifactParameters();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#type ServicecatalogProduct#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#accept_language ServicecatalogProduct#accept_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcceptLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#description ServicecatalogProduct#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#distributor ServicecatalogProduct#distributor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDistributor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#id ServicecatalogProduct#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_description ServicecatalogProduct#support_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSupportDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_email ServicecatalogProduct#support_email}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSupportEmail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_url ServicecatalogProduct#support_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSupportUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#tags ServicecatalogProduct#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#tags_all ServicecatalogProduct#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#timeouts ServicecatalogProduct#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_product.ServicecatalogProductTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogProductConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogProductConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogProductConfig> {
        java.lang.String name;
        java.lang.String owner;
        imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters provisioningArtifactParameters;
        java.lang.String type;
        java.lang.String acceptLanguage;
        java.lang.String description;
        java.lang.String distributor;
        java.lang.String id;
        java.lang.String supportDescription;
        java.lang.String supportEmail;
        java.lang.String supportUrl;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.servicecatalog_product.ServicecatalogProductTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#name ServicecatalogProduct#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#owner ServicecatalogProduct#owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getProvisioningArtifactParameters}
         * @param provisioningArtifactParameters provisioning_artifact_parameters block. This parameter is required.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#provisioning_artifact_parameters ServicecatalogProduct#provisioning_artifact_parameters}
         * @return {@code this}
         */
        public Builder provisioningArtifactParameters(imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters provisioningArtifactParameters) {
            this.provisioningArtifactParameters = provisioningArtifactParameters;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#type ServicecatalogProduct#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getAcceptLanguage}
         * @param acceptLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#accept_language ServicecatalogProduct#accept_language}.
         * @return {@code this}
         */
        public Builder acceptLanguage(java.lang.String acceptLanguage) {
            this.acceptLanguage = acceptLanguage;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#description ServicecatalogProduct#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getDistributor}
         * @param distributor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#distributor ServicecatalogProduct#distributor}.
         * @return {@code this}
         */
        public Builder distributor(java.lang.String distributor) {
            this.distributor = distributor;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#id ServicecatalogProduct#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getSupportDescription}
         * @param supportDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_description ServicecatalogProduct#support_description}.
         * @return {@code this}
         */
        public Builder supportDescription(java.lang.String supportDescription) {
            this.supportDescription = supportDescription;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getSupportEmail}
         * @param supportEmail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_email ServicecatalogProduct#support_email}.
         * @return {@code this}
         */
        public Builder supportEmail(java.lang.String supportEmail) {
            this.supportEmail = supportEmail;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getSupportUrl}
         * @param supportUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#support_url ServicecatalogProduct#support_url}.
         * @return {@code this}
         */
        public Builder supportUrl(java.lang.String supportUrl) {
            this.supportUrl = supportUrl;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#tags ServicecatalogProduct#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#tags_all ServicecatalogProduct#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#timeouts ServicecatalogProduct#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.servicecatalog_product.ServicecatalogProductTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getDependsOn}
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
         * Sets the value of {@link ServicecatalogProductConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductConfig#getProvisioners}
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
         * @return a new instance of {@link ServicecatalogProductConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogProductConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogProductConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogProductConfig {
        private final java.lang.String name;
        private final java.lang.String owner;
        private final imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters provisioningArtifactParameters;
        private final java.lang.String type;
        private final java.lang.String acceptLanguage;
        private final java.lang.String description;
        private final java.lang.String distributor;
        private final java.lang.String id;
        private final java.lang.String supportDescription;
        private final java.lang.String supportEmail;
        private final java.lang.String supportUrl;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.servicecatalog_product.ServicecatalogProductTimeouts timeouts;
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
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningArtifactParameters = software.amazon.jsii.Kernel.get(this, "provisioningArtifactParameters", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acceptLanguage = software.amazon.jsii.Kernel.get(this, "acceptLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.distributor = software.amazon.jsii.Kernel.get(this, "distributor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportDescription = software.amazon.jsii.Kernel.get(this, "supportDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportEmail = software.amazon.jsii.Kernel.get(this, "supportEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportUrl = software.amazon.jsii.Kernel.get(this, "supportUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_product.ServicecatalogProductTimeouts.class));
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
            this.owner = java.util.Objects.requireNonNull(builder.owner, "owner is required");
            this.provisioningArtifactParameters = java.util.Objects.requireNonNull(builder.provisioningArtifactParameters, "provisioningArtifactParameters is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.acceptLanguage = builder.acceptLanguage;
            this.description = builder.description;
            this.distributor = builder.distributor;
            this.id = builder.id;
            this.supportDescription = builder.supportDescription;
            this.supportEmail = builder.supportEmail;
            this.supportUrl = builder.supportUrl;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        public final imports.aws.servicecatalog_product.ServicecatalogProductProvisioningArtifactParameters getProvisioningArtifactParameters() {
            return this.provisioningArtifactParameters;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getAcceptLanguage() {
            return this.acceptLanguage;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDistributor() {
            return this.distributor;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getSupportDescription() {
            return this.supportDescription;
        }

        @Override
        public final java.lang.String getSupportEmail() {
            return this.supportEmail;
        }

        @Override
        public final java.lang.String getSupportUrl() {
            return this.supportUrl;
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
        public final imports.aws.servicecatalog_product.ServicecatalogProductTimeouts getTimeouts() {
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("owner", om.valueToTree(this.getOwner()));
            data.set("provisioningArtifactParameters", om.valueToTree(this.getProvisioningArtifactParameters()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAcceptLanguage() != null) {
                data.set("acceptLanguage", om.valueToTree(this.getAcceptLanguage()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDistributor() != null) {
                data.set("distributor", om.valueToTree(this.getDistributor()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSupportDescription() != null) {
                data.set("supportDescription", om.valueToTree(this.getSupportDescription()));
            }
            if (this.getSupportEmail() != null) {
                data.set("supportEmail", om.valueToTree(this.getSupportEmail()));
            }
            if (this.getSupportUrl() != null) {
                data.set("supportUrl", om.valueToTree(this.getSupportUrl()));
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
            struct.set("fqn", om.valueToTree("aws.servicecatalogProduct.ServicecatalogProductConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogProductConfig.Jsii$Proxy that = (ServicecatalogProductConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!owner.equals(that.owner)) return false;
            if (!provisioningArtifactParameters.equals(that.provisioningArtifactParameters)) return false;
            if (!type.equals(that.type)) return false;
            if (this.acceptLanguage != null ? !this.acceptLanguage.equals(that.acceptLanguage) : that.acceptLanguage != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.distributor != null ? !this.distributor.equals(that.distributor) : that.distributor != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.supportDescription != null ? !this.supportDescription.equals(that.supportDescription) : that.supportDescription != null) return false;
            if (this.supportEmail != null ? !this.supportEmail.equals(that.supportEmail) : that.supportEmail != null) return false;
            if (this.supportUrl != null ? !this.supportUrl.equals(that.supportUrl) : that.supportUrl != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.owner.hashCode());
            result = 31 * result + (this.provisioningArtifactParameters.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.acceptLanguage != null ? this.acceptLanguage.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.distributor != null ? this.distributor.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.supportDescription != null ? this.supportDescription.hashCode() : 0);
            result = 31 * result + (this.supportEmail != null ? this.supportEmail.hashCode() : 0);
            result = 31 * result + (this.supportUrl != null ? this.supportUrl.hashCode() : 0);
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
