package imports.aws.servicecatalog_provisioning_artifact;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.437Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisioningArtifact.ServicecatalogProvisioningArtifactConfig")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogProvisioningArtifactConfig.Jsii$Proxy.class)
public interface ServicecatalogProvisioningArtifactConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#product_id ServicecatalogProvisioningArtifact#product_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProductId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#accept_language ServicecatalogProvisioningArtifact#accept_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcceptLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#active ServicecatalogProvisioningArtifact#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#description ServicecatalogProvisioningArtifact#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#disable_template_validation ServicecatalogProvisioningArtifact#disable_template_validation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableTemplateValidation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#guidance ServicecatalogProvisioningArtifact#guidance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGuidance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#id ServicecatalogProvisioningArtifact#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#name ServicecatalogProvisioningArtifact#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#template_physical_id ServicecatalogProvisioningArtifact#template_physical_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplatePhysicalId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#template_url ServicecatalogProvisioningArtifact#template_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateUrl() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#timeouts ServicecatalogProvisioningArtifact#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#type ServicecatalogProvisioningArtifact#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogProvisioningArtifactConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogProvisioningArtifactConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogProvisioningArtifactConfig> {
        java.lang.String productId;
        java.lang.String acceptLanguage;
        java.lang.Object active;
        java.lang.String description;
        java.lang.Object disableTemplateValidation;
        java.lang.String guidance;
        java.lang.String id;
        java.lang.String name;
        java.lang.String templatePhysicalId;
        java.lang.String templateUrl;
        imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts timeouts;
        java.lang.String type;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getProductId}
         * @param productId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#product_id ServicecatalogProvisioningArtifact#product_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder productId(java.lang.String productId) {
            this.productId = productId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getAcceptLanguage}
         * @param acceptLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#accept_language ServicecatalogProvisioningArtifact#accept_language}.
         * @return {@code this}
         */
        public Builder acceptLanguage(java.lang.String acceptLanguage) {
            this.acceptLanguage = acceptLanguage;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#active ServicecatalogProvisioningArtifact#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#active ServicecatalogProvisioningArtifact#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#description ServicecatalogProvisioningArtifact#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getDisableTemplateValidation}
         * @param disableTemplateValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#disable_template_validation ServicecatalogProvisioningArtifact#disable_template_validation}.
         * @return {@code this}
         */
        public Builder disableTemplateValidation(java.lang.Boolean disableTemplateValidation) {
            this.disableTemplateValidation = disableTemplateValidation;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getDisableTemplateValidation}
         * @param disableTemplateValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#disable_template_validation ServicecatalogProvisioningArtifact#disable_template_validation}.
         * @return {@code this}
         */
        public Builder disableTemplateValidation(com.hashicorp.cdktf.IResolvable disableTemplateValidation) {
            this.disableTemplateValidation = disableTemplateValidation;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getGuidance}
         * @param guidance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#guidance ServicecatalogProvisioningArtifact#guidance}.
         * @return {@code this}
         */
        public Builder guidance(java.lang.String guidance) {
            this.guidance = guidance;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#id ServicecatalogProvisioningArtifact#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#name ServicecatalogProvisioningArtifact#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getTemplatePhysicalId}
         * @param templatePhysicalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#template_physical_id ServicecatalogProvisioningArtifact#template_physical_id}.
         * @return {@code this}
         */
        public Builder templatePhysicalId(java.lang.String templatePhysicalId) {
            this.templatePhysicalId = templatePhysicalId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getTemplateUrl}
         * @param templateUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#template_url ServicecatalogProvisioningArtifact#template_url}.
         * @return {@code this}
         */
        public Builder templateUrl(java.lang.String templateUrl) {
            this.templateUrl = templateUrl;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#timeouts ServicecatalogProvisioningArtifact#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioning_artifact#type ServicecatalogProvisioningArtifact#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getDependsOn}
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
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisioningArtifactConfig#getProvisioners}
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
         * @return a new instance of {@link ServicecatalogProvisioningArtifactConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogProvisioningArtifactConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogProvisioningArtifactConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogProvisioningArtifactConfig {
        private final java.lang.String productId;
        private final java.lang.String acceptLanguage;
        private final java.lang.Object active;
        private final java.lang.String description;
        private final java.lang.Object disableTemplateValidation;
        private final java.lang.String guidance;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.String templatePhysicalId;
        private final java.lang.String templateUrl;
        private final imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts timeouts;
        private final java.lang.String type;
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
            this.productId = software.amazon.jsii.Kernel.get(this, "productId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acceptLanguage = software.amazon.jsii.Kernel.get(this, "acceptLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableTemplateValidation = software.amazon.jsii.Kernel.get(this, "disableTemplateValidation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.guidance = software.amazon.jsii.Kernel.get(this, "guidance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templatePhysicalId = software.amazon.jsii.Kernel.get(this, "templatePhysicalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateUrl = software.amazon.jsii.Kernel.get(this, "templateUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.productId = java.util.Objects.requireNonNull(builder.productId, "productId is required");
            this.acceptLanguage = builder.acceptLanguage;
            this.active = builder.active;
            this.description = builder.description;
            this.disableTemplateValidation = builder.disableTemplateValidation;
            this.guidance = builder.guidance;
            this.id = builder.id;
            this.name = builder.name;
            this.templatePhysicalId = builder.templatePhysicalId;
            this.templateUrl = builder.templateUrl;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getProductId() {
            return this.productId;
        }

        @Override
        public final java.lang.String getAcceptLanguage() {
            return this.acceptLanguage;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDisableTemplateValidation() {
            return this.disableTemplateValidation;
        }

        @Override
        public final java.lang.String getGuidance() {
            return this.guidance;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTemplatePhysicalId() {
            return this.templatePhysicalId;
        }

        @Override
        public final java.lang.String getTemplateUrl() {
            return this.templateUrl;
        }

        @Override
        public final imports.aws.servicecatalog_provisioning_artifact.ServicecatalogProvisioningArtifactTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
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

            data.set("productId", om.valueToTree(this.getProductId()));
            if (this.getAcceptLanguage() != null) {
                data.set("acceptLanguage", om.valueToTree(this.getAcceptLanguage()));
            }
            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisableTemplateValidation() != null) {
                data.set("disableTemplateValidation", om.valueToTree(this.getDisableTemplateValidation()));
            }
            if (this.getGuidance() != null) {
                data.set("guidance", om.valueToTree(this.getGuidance()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTemplatePhysicalId() != null) {
                data.set("templatePhysicalId", om.valueToTree(this.getTemplatePhysicalId()));
            }
            if (this.getTemplateUrl() != null) {
                data.set("templateUrl", om.valueToTree(this.getTemplateUrl()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
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
            struct.set("fqn", om.valueToTree("aws.servicecatalogProvisioningArtifact.ServicecatalogProvisioningArtifactConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogProvisioningArtifactConfig.Jsii$Proxy that = (ServicecatalogProvisioningArtifactConfig.Jsii$Proxy) o;

            if (!productId.equals(that.productId)) return false;
            if (this.acceptLanguage != null ? !this.acceptLanguage.equals(that.acceptLanguage) : that.acceptLanguage != null) return false;
            if (this.active != null ? !this.active.equals(that.active) : that.active != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disableTemplateValidation != null ? !this.disableTemplateValidation.equals(that.disableTemplateValidation) : that.disableTemplateValidation != null) return false;
            if (this.guidance != null ? !this.guidance.equals(that.guidance) : that.guidance != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.templatePhysicalId != null ? !this.templatePhysicalId.equals(that.templatePhysicalId) : that.templatePhysicalId != null) return false;
            if (this.templateUrl != null ? !this.templateUrl.equals(that.templateUrl) : that.templateUrl != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
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
            int result = this.productId.hashCode();
            result = 31 * result + (this.acceptLanguage != null ? this.acceptLanguage.hashCode() : 0);
            result = 31 * result + (this.active != null ? this.active.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.disableTemplateValidation != null ? this.disableTemplateValidation.hashCode() : 0);
            result = 31 * result + (this.guidance != null ? this.guidance.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.templatePhysicalId != null ? this.templatePhysicalId.hashCode() : 0);
            result = 31 * result + (this.templateUrl != null ? this.templateUrl.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
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
