package imports.aws.servicecatalog_provisioned_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.436Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductConfig")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogProvisionedProductConfig.Jsii$Proxy.class)
public interface ServicecatalogProvisionedProductConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#name ServicecatalogProvisionedProduct#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accept_language ServicecatalogProvisionedProduct#accept_language}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcceptLanguage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#id ServicecatalogProvisionedProduct#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreErrors() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#notification_arns ServicecatalogProvisionedProduct#notification_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotificationArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_id ServicecatalogProvisionedProduct#path_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPathId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_name ServicecatalogProvisionedProduct#path_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPathName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_id ServicecatalogProvisionedProduct#product_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProductId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_name ServicecatalogProvisionedProduct#product_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProductName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_id ServicecatalogProvisionedProduct#provisioning_artifact_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvisioningArtifactId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_name ServicecatalogProvisionedProduct#provisioning_artifact_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvisioningArtifactName() {
        return null;
    }

    /**
     * provisioning_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_parameters ServicecatalogProvisionedProduct#provisioning_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProvisioningParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRetainPhysicalResources() {
        return null;
    }

    /**
     * stack_set_provisioning_preferences block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#stack_set_provisioning_preferences ServicecatalogProvisionedProduct#stack_set_provisioning_preferences}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences getStackSetProvisioningPreferences() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags ServicecatalogProvisionedProduct#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags_all ServicecatalogProvisionedProduct#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#timeouts ServicecatalogProvisionedProduct#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogProvisionedProductConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogProvisionedProductConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogProvisionedProductConfig> {
        java.lang.String name;
        java.lang.String acceptLanguage;
        java.lang.String id;
        java.lang.Object ignoreErrors;
        java.util.List<java.lang.String> notificationArns;
        java.lang.String pathId;
        java.lang.String pathName;
        java.lang.String productId;
        java.lang.String productName;
        java.lang.String provisioningArtifactId;
        java.lang.String provisioningArtifactName;
        java.lang.Object provisioningParameters;
        java.lang.Object retainPhysicalResources;
        imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences stackSetProvisioningPreferences;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#name ServicecatalogProvisionedProduct#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getAcceptLanguage}
         * @param acceptLanguage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#accept_language ServicecatalogProvisionedProduct#accept_language}.
         * @return {@code this}
         */
        public Builder acceptLanguage(java.lang.String acceptLanguage) {
            this.acceptLanguage = acceptLanguage;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#id ServicecatalogProvisionedProduct#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getIgnoreErrors}
         * @param ignoreErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}.
         * @return {@code this}
         */
        public Builder ignoreErrors(java.lang.Boolean ignoreErrors) {
            this.ignoreErrors = ignoreErrors;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getIgnoreErrors}
         * @param ignoreErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#ignore_errors ServicecatalogProvisionedProduct#ignore_errors}.
         * @return {@code this}
         */
        public Builder ignoreErrors(com.hashicorp.cdktf.IResolvable ignoreErrors) {
            this.ignoreErrors = ignoreErrors;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getNotificationArns}
         * @param notificationArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#notification_arns ServicecatalogProvisionedProduct#notification_arns}.
         * @return {@code this}
         */
        public Builder notificationArns(java.util.List<java.lang.String> notificationArns) {
            this.notificationArns = notificationArns;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getPathId}
         * @param pathId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_id ServicecatalogProvisionedProduct#path_id}.
         * @return {@code this}
         */
        public Builder pathId(java.lang.String pathId) {
            this.pathId = pathId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getPathName}
         * @param pathName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#path_name ServicecatalogProvisionedProduct#path_name}.
         * @return {@code this}
         */
        public Builder pathName(java.lang.String pathName) {
            this.pathName = pathName;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProductId}
         * @param productId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_id ServicecatalogProvisionedProduct#product_id}.
         * @return {@code this}
         */
        public Builder productId(java.lang.String productId) {
            this.productId = productId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProductName}
         * @param productName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#product_name ServicecatalogProvisionedProduct#product_name}.
         * @return {@code this}
         */
        public Builder productName(java.lang.String productName) {
            this.productName = productName;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvisioningArtifactId}
         * @param provisioningArtifactId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_id ServicecatalogProvisionedProduct#provisioning_artifact_id}.
         * @return {@code this}
         */
        public Builder provisioningArtifactId(java.lang.String provisioningArtifactId) {
            this.provisioningArtifactId = provisioningArtifactId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvisioningArtifactName}
         * @param provisioningArtifactName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_artifact_name ServicecatalogProvisionedProduct#provisioning_artifact_name}.
         * @return {@code this}
         */
        public Builder provisioningArtifactName(java.lang.String provisioningArtifactName) {
            this.provisioningArtifactName = provisioningArtifactName;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvisioningParameters}
         * @param provisioningParameters provisioning_parameters block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_parameters ServicecatalogProvisionedProduct#provisioning_parameters}
         * @return {@code this}
         */
        public Builder provisioningParameters(com.hashicorp.cdktf.IResolvable provisioningParameters) {
            this.provisioningParameters = provisioningParameters;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvisioningParameters}
         * @param provisioningParameters provisioning_parameters block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#provisioning_parameters ServicecatalogProvisionedProduct#provisioning_parameters}
         * @return {@code this}
         */
        public Builder provisioningParameters(java.util.List<? extends imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductProvisioningParameters> provisioningParameters) {
            this.provisioningParameters = provisioningParameters;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getRetainPhysicalResources}
         * @param retainPhysicalResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}.
         * @return {@code this}
         */
        public Builder retainPhysicalResources(java.lang.Boolean retainPhysicalResources) {
            this.retainPhysicalResources = retainPhysicalResources;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getRetainPhysicalResources}
         * @param retainPhysicalResources Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#retain_physical_resources ServicecatalogProvisionedProduct#retain_physical_resources}.
         * @return {@code this}
         */
        public Builder retainPhysicalResources(com.hashicorp.cdktf.IResolvable retainPhysicalResources) {
            this.retainPhysicalResources = retainPhysicalResources;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getStackSetProvisioningPreferences}
         * @param stackSetProvisioningPreferences stack_set_provisioning_preferences block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#stack_set_provisioning_preferences ServicecatalogProvisionedProduct#stack_set_provisioning_preferences}
         * @return {@code this}
         */
        public Builder stackSetProvisioningPreferences(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences stackSetProvisioningPreferences) {
            this.stackSetProvisioningPreferences = stackSetProvisioningPreferences;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags ServicecatalogProvisionedProduct#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#tags_all ServicecatalogProvisionedProduct#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_provisioned_product#timeouts ServicecatalogProvisionedProduct#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getDependsOn}
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
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProvisionedProductConfig#getProvisioners}
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
         * @return a new instance of {@link ServicecatalogProvisionedProductConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogProvisionedProductConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogProvisionedProductConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogProvisionedProductConfig {
        private final java.lang.String name;
        private final java.lang.String acceptLanguage;
        private final java.lang.String id;
        private final java.lang.Object ignoreErrors;
        private final java.util.List<java.lang.String> notificationArns;
        private final java.lang.String pathId;
        private final java.lang.String pathName;
        private final java.lang.String productId;
        private final java.lang.String productName;
        private final java.lang.String provisioningArtifactId;
        private final java.lang.String provisioningArtifactName;
        private final java.lang.Object provisioningParameters;
        private final java.lang.Object retainPhysicalResources;
        private final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences stackSetProvisioningPreferences;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts timeouts;
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
            this.acceptLanguage = software.amazon.jsii.Kernel.get(this, "acceptLanguage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignoreErrors = software.amazon.jsii.Kernel.get(this, "ignoreErrors", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.notificationArns = software.amazon.jsii.Kernel.get(this, "notificationArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.pathId = software.amazon.jsii.Kernel.get(this, "pathId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pathName = software.amazon.jsii.Kernel.get(this, "pathName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.productId = software.amazon.jsii.Kernel.get(this, "productId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.productName = software.amazon.jsii.Kernel.get(this, "productName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningArtifactId = software.amazon.jsii.Kernel.get(this, "provisioningArtifactId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningArtifactName = software.amazon.jsii.Kernel.get(this, "provisioningArtifactName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningParameters = software.amazon.jsii.Kernel.get(this, "provisioningParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retainPhysicalResources = software.amazon.jsii.Kernel.get(this, "retainPhysicalResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stackSetProvisioningPreferences = software.amazon.jsii.Kernel.get(this, "stackSetProvisioningPreferences", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts.class));
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
            this.acceptLanguage = builder.acceptLanguage;
            this.id = builder.id;
            this.ignoreErrors = builder.ignoreErrors;
            this.notificationArns = builder.notificationArns;
            this.pathId = builder.pathId;
            this.pathName = builder.pathName;
            this.productId = builder.productId;
            this.productName = builder.productName;
            this.provisioningArtifactId = builder.provisioningArtifactId;
            this.provisioningArtifactName = builder.provisioningArtifactName;
            this.provisioningParameters = builder.provisioningParameters;
            this.retainPhysicalResources = builder.retainPhysicalResources;
            this.stackSetProvisioningPreferences = builder.stackSetProvisioningPreferences;
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
        public final java.lang.String getAcceptLanguage() {
            return this.acceptLanguage;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIgnoreErrors() {
            return this.ignoreErrors;
        }

        @Override
        public final java.util.List<java.lang.String> getNotificationArns() {
            return this.notificationArns;
        }

        @Override
        public final java.lang.String getPathId() {
            return this.pathId;
        }

        @Override
        public final java.lang.String getPathName() {
            return this.pathName;
        }

        @Override
        public final java.lang.String getProductId() {
            return this.productId;
        }

        @Override
        public final java.lang.String getProductName() {
            return this.productName;
        }

        @Override
        public final java.lang.String getProvisioningArtifactId() {
            return this.provisioningArtifactId;
        }

        @Override
        public final java.lang.String getProvisioningArtifactName() {
            return this.provisioningArtifactName;
        }

        @Override
        public final java.lang.Object getProvisioningParameters() {
            return this.provisioningParameters;
        }

        @Override
        public final java.lang.Object getRetainPhysicalResources() {
            return this.retainPhysicalResources;
        }

        @Override
        public final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences getStackSetProvisioningPreferences() {
            return this.stackSetProvisioningPreferences;
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
        public final imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts getTimeouts() {
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
            if (this.getAcceptLanguage() != null) {
                data.set("acceptLanguage", om.valueToTree(this.getAcceptLanguage()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIgnoreErrors() != null) {
                data.set("ignoreErrors", om.valueToTree(this.getIgnoreErrors()));
            }
            if (this.getNotificationArns() != null) {
                data.set("notificationArns", om.valueToTree(this.getNotificationArns()));
            }
            if (this.getPathId() != null) {
                data.set("pathId", om.valueToTree(this.getPathId()));
            }
            if (this.getPathName() != null) {
                data.set("pathName", om.valueToTree(this.getPathName()));
            }
            if (this.getProductId() != null) {
                data.set("productId", om.valueToTree(this.getProductId()));
            }
            if (this.getProductName() != null) {
                data.set("productName", om.valueToTree(this.getProductName()));
            }
            if (this.getProvisioningArtifactId() != null) {
                data.set("provisioningArtifactId", om.valueToTree(this.getProvisioningArtifactId()));
            }
            if (this.getProvisioningArtifactName() != null) {
                data.set("provisioningArtifactName", om.valueToTree(this.getProvisioningArtifactName()));
            }
            if (this.getProvisioningParameters() != null) {
                data.set("provisioningParameters", om.valueToTree(this.getProvisioningParameters()));
            }
            if (this.getRetainPhysicalResources() != null) {
                data.set("retainPhysicalResources", om.valueToTree(this.getRetainPhysicalResources()));
            }
            if (this.getStackSetProvisioningPreferences() != null) {
                data.set("stackSetProvisioningPreferences", om.valueToTree(this.getStackSetProvisioningPreferences()));
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
            struct.set("fqn", om.valueToTree("aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogProvisionedProductConfig.Jsii$Proxy that = (ServicecatalogProvisionedProductConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.acceptLanguage != null ? !this.acceptLanguage.equals(that.acceptLanguage) : that.acceptLanguage != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ignoreErrors != null ? !this.ignoreErrors.equals(that.ignoreErrors) : that.ignoreErrors != null) return false;
            if (this.notificationArns != null ? !this.notificationArns.equals(that.notificationArns) : that.notificationArns != null) return false;
            if (this.pathId != null ? !this.pathId.equals(that.pathId) : that.pathId != null) return false;
            if (this.pathName != null ? !this.pathName.equals(that.pathName) : that.pathName != null) return false;
            if (this.productId != null ? !this.productId.equals(that.productId) : that.productId != null) return false;
            if (this.productName != null ? !this.productName.equals(that.productName) : that.productName != null) return false;
            if (this.provisioningArtifactId != null ? !this.provisioningArtifactId.equals(that.provisioningArtifactId) : that.provisioningArtifactId != null) return false;
            if (this.provisioningArtifactName != null ? !this.provisioningArtifactName.equals(that.provisioningArtifactName) : that.provisioningArtifactName != null) return false;
            if (this.provisioningParameters != null ? !this.provisioningParameters.equals(that.provisioningParameters) : that.provisioningParameters != null) return false;
            if (this.retainPhysicalResources != null ? !this.retainPhysicalResources.equals(that.retainPhysicalResources) : that.retainPhysicalResources != null) return false;
            if (this.stackSetProvisioningPreferences != null ? !this.stackSetProvisioningPreferences.equals(that.stackSetProvisioningPreferences) : that.stackSetProvisioningPreferences != null) return false;
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
            result = 31 * result + (this.acceptLanguage != null ? this.acceptLanguage.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ignoreErrors != null ? this.ignoreErrors.hashCode() : 0);
            result = 31 * result + (this.notificationArns != null ? this.notificationArns.hashCode() : 0);
            result = 31 * result + (this.pathId != null ? this.pathId.hashCode() : 0);
            result = 31 * result + (this.pathName != null ? this.pathName.hashCode() : 0);
            result = 31 * result + (this.productId != null ? this.productId.hashCode() : 0);
            result = 31 * result + (this.productName != null ? this.productName.hashCode() : 0);
            result = 31 * result + (this.provisioningArtifactId != null ? this.provisioningArtifactId.hashCode() : 0);
            result = 31 * result + (this.provisioningArtifactName != null ? this.provisioningArtifactName.hashCode() : 0);
            result = 31 * result + (this.provisioningParameters != null ? this.provisioningParameters.hashCode() : 0);
            result = 31 * result + (this.retainPhysicalResources != null ? this.retainPhysicalResources.hashCode() : 0);
            result = 31 * result + (this.stackSetProvisioningPreferences != null ? this.stackSetProvisioningPreferences.hashCode() : 0);
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
