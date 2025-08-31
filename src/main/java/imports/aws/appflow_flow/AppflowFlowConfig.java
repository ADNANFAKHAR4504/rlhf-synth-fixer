package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.007Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowConfig.Jsii$Proxy.class)
public interface AppflowFlowConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * destination_flow_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_flow_config AppflowFlow#destination_flow_config}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDestinationFlowConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#name AppflowFlow#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * source_flow_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_flow_config AppflowFlow#source_flow_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfig getSourceFlowConfig();

    /**
     * task block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task AppflowFlow#task}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTask();

    /**
     * trigger_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_config AppflowFlow#trigger_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowTriggerConfig getTriggerConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#description AppflowFlow#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id AppflowFlow#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#kms_arn AppflowFlow#kms_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsArn() {
        return null;
    }

    /**
     * metadata_catalog_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#metadata_catalog_config AppflowFlow#metadata_catalog_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig getMetadataCatalogConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#tags AppflowFlow#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#tags_all AppflowFlow#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowConfig> {
        java.lang.Object destinationFlowConfig;
        java.lang.String name;
        imports.aws.appflow_flow.AppflowFlowSourceFlowConfig sourceFlowConfig;
        java.lang.Object task;
        imports.aws.appflow_flow.AppflowFlowTriggerConfig triggerConfig;
        java.lang.String description;
        java.lang.String id;
        java.lang.String kmsArn;
        imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig metadataCatalogConfig;
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
         * Sets the value of {@link AppflowFlowConfig#getDestinationFlowConfig}
         * @param destinationFlowConfig destination_flow_config block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_flow_config AppflowFlow#destination_flow_config}
         * @return {@code this}
         */
        public Builder destinationFlowConfig(com.hashicorp.cdktf.IResolvable destinationFlowConfig) {
            this.destinationFlowConfig = destinationFlowConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getDestinationFlowConfig}
         * @param destinationFlowConfig destination_flow_config block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_flow_config AppflowFlow#destination_flow_config}
         * @return {@code this}
         */
        public Builder destinationFlowConfig(java.util.List<? extends imports.aws.appflow_flow.AppflowFlowDestinationFlowConfig> destinationFlowConfig) {
            this.destinationFlowConfig = destinationFlowConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#name AppflowFlow#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getSourceFlowConfig}
         * @param sourceFlowConfig source_flow_config block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_flow_config AppflowFlow#source_flow_config}
         * @return {@code this}
         */
        public Builder sourceFlowConfig(imports.aws.appflow_flow.AppflowFlowSourceFlowConfig sourceFlowConfig) {
            this.sourceFlowConfig = sourceFlowConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getTask}
         * @param task task block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task AppflowFlow#task}
         * @return {@code this}
         */
        public Builder task(com.hashicorp.cdktf.IResolvable task) {
            this.task = task;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getTask}
         * @param task task block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task AppflowFlow#task}
         * @return {@code this}
         */
        public Builder task(java.util.List<? extends imports.aws.appflow_flow.AppflowFlowTask> task) {
            this.task = task;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getTriggerConfig}
         * @param triggerConfig trigger_config block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_config AppflowFlow#trigger_config}
         * @return {@code this}
         */
        public Builder triggerConfig(imports.aws.appflow_flow.AppflowFlowTriggerConfig triggerConfig) {
            this.triggerConfig = triggerConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#description AppflowFlow#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id AppflowFlow#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getKmsArn}
         * @param kmsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#kms_arn AppflowFlow#kms_arn}.
         * @return {@code this}
         */
        public Builder kmsArn(java.lang.String kmsArn) {
            this.kmsArn = kmsArn;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getMetadataCatalogConfig}
         * @param metadataCatalogConfig metadata_catalog_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#metadata_catalog_config AppflowFlow#metadata_catalog_config}
         * @return {@code this}
         */
        public Builder metadataCatalogConfig(imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig metadataCatalogConfig) {
            this.metadataCatalogConfig = metadataCatalogConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#tags AppflowFlow#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#tags_all AppflowFlow#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getDependsOn}
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
         * Sets the value of {@link AppflowFlowConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowConfig#getProvisioners}
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
         * @return a new instance of {@link AppflowFlowConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowConfig {
        private final java.lang.Object destinationFlowConfig;
        private final java.lang.String name;
        private final imports.aws.appflow_flow.AppflowFlowSourceFlowConfig sourceFlowConfig;
        private final java.lang.Object task;
        private final imports.aws.appflow_flow.AppflowFlowTriggerConfig triggerConfig;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String kmsArn;
        private final imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig metadataCatalogConfig;
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
            this.destinationFlowConfig = software.amazon.jsii.Kernel.get(this, "destinationFlowConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceFlowConfig = software.amazon.jsii.Kernel.get(this, "sourceFlowConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfig.class));
            this.task = software.amazon.jsii.Kernel.get(this, "task", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.triggerConfig = software.amazon.jsii.Kernel.get(this, "triggerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowTriggerConfig.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsArn = software.amazon.jsii.Kernel.get(this, "kmsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadataCatalogConfig = software.amazon.jsii.Kernel.get(this, "metadataCatalogConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig.class));
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
            this.destinationFlowConfig = java.util.Objects.requireNonNull(builder.destinationFlowConfig, "destinationFlowConfig is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.sourceFlowConfig = java.util.Objects.requireNonNull(builder.sourceFlowConfig, "sourceFlowConfig is required");
            this.task = java.util.Objects.requireNonNull(builder.task, "task is required");
            this.triggerConfig = java.util.Objects.requireNonNull(builder.triggerConfig, "triggerConfig is required");
            this.description = builder.description;
            this.id = builder.id;
            this.kmsArn = builder.kmsArn;
            this.metadataCatalogConfig = builder.metadataCatalogConfig;
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
        public final java.lang.Object getDestinationFlowConfig() {
            return this.destinationFlowConfig;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowSourceFlowConfig getSourceFlowConfig() {
            return this.sourceFlowConfig;
        }

        @Override
        public final java.lang.Object getTask() {
            return this.task;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowTriggerConfig getTriggerConfig() {
            return this.triggerConfig;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsArn() {
            return this.kmsArn;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowMetadataCatalogConfig getMetadataCatalogConfig() {
            return this.metadataCatalogConfig;
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

            data.set("destinationFlowConfig", om.valueToTree(this.getDestinationFlowConfig()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("sourceFlowConfig", om.valueToTree(this.getSourceFlowConfig()));
            data.set("task", om.valueToTree(this.getTask()));
            data.set("triggerConfig", om.valueToTree(this.getTriggerConfig()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsArn() != null) {
                data.set("kmsArn", om.valueToTree(this.getKmsArn()));
            }
            if (this.getMetadataCatalogConfig() != null) {
                data.set("metadataCatalogConfig", om.valueToTree(this.getMetadataCatalogConfig()));
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
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowConfig.Jsii$Proxy that = (AppflowFlowConfig.Jsii$Proxy) o;

            if (!destinationFlowConfig.equals(that.destinationFlowConfig)) return false;
            if (!name.equals(that.name)) return false;
            if (!sourceFlowConfig.equals(that.sourceFlowConfig)) return false;
            if (!task.equals(that.task)) return false;
            if (!triggerConfig.equals(that.triggerConfig)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsArn != null ? !this.kmsArn.equals(that.kmsArn) : that.kmsArn != null) return false;
            if (this.metadataCatalogConfig != null ? !this.metadataCatalogConfig.equals(that.metadataCatalogConfig) : that.metadataCatalogConfig != null) return false;
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
            int result = this.destinationFlowConfig.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.sourceFlowConfig.hashCode());
            result = 31 * result + (this.task.hashCode());
            result = 31 * result + (this.triggerConfig.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsArn != null ? this.kmsArn.hashCode() : 0);
            result = 31 * result + (this.metadataCatalogConfig != null ? this.metadataCatalogConfig.hashCode() : 0);
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
