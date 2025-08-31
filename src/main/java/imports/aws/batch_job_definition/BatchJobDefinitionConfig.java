package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionConfig")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionConfig.Jsii$Proxy.class)
public interface BatchJobDefinitionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContainerProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeregisterOnNewRevision() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEcsProperties() {
        return null;
    }

    /**
     * eks_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksProperties getEksProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPlatformCapabilities() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPropagateTags() {
        return null;
    }

    /**
     * retry_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy getRetryStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSchedulingPriority() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionTimeout getTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionConfig> {
        java.lang.String name;
        java.lang.String type;
        java.lang.String containerProperties;
        java.lang.Object deregisterOnNewRevision;
        java.lang.String ecsProperties;
        imports.aws.batch_job_definition.BatchJobDefinitionEksProperties eksProperties;
        java.lang.String id;
        java.lang.String nodeProperties;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.util.List<java.lang.String> platformCapabilities;
        java.lang.Object propagateTags;
        imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy retryStrategy;
        java.lang.Number schedulingPriority;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.batch_job_definition.BatchJobDefinitionTimeout timeout;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getContainerProperties}
         * @param containerProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.
         * @return {@code this}
         */
        public Builder containerProperties(java.lang.String containerProperties) {
            this.containerProperties = containerProperties;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getDeregisterOnNewRevision}
         * @param deregisterOnNewRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
         * @return {@code this}
         */
        public Builder deregisterOnNewRevision(java.lang.Boolean deregisterOnNewRevision) {
            this.deregisterOnNewRevision = deregisterOnNewRevision;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getDeregisterOnNewRevision}
         * @param deregisterOnNewRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
         * @return {@code this}
         */
        public Builder deregisterOnNewRevision(com.hashicorp.cdktf.IResolvable deregisterOnNewRevision) {
            this.deregisterOnNewRevision = deregisterOnNewRevision;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getEcsProperties}
         * @param ecsProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.
         * @return {@code this}
         */
        public Builder ecsProperties(java.lang.String ecsProperties) {
            this.ecsProperties = ecsProperties;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getEksProperties}
         * @param eksProperties eks_properties block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
         * @return {@code this}
         */
        public Builder eksProperties(imports.aws.batch_job_definition.BatchJobDefinitionEksProperties eksProperties) {
            this.eksProperties = eksProperties;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getNodeProperties}
         * @param nodeProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.
         * @return {@code this}
         */
        public Builder nodeProperties(java.lang.String nodeProperties) {
            this.nodeProperties = nodeProperties;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getPlatformCapabilities}
         * @param platformCapabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.
         * @return {@code this}
         */
        public Builder platformCapabilities(java.util.List<java.lang.String> platformCapabilities) {
            this.platformCapabilities = platformCapabilities;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getPropagateTags}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
         * @return {@code this}
         */
        public Builder propagateTags(java.lang.Boolean propagateTags) {
            this.propagateTags = propagateTags;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getPropagateTags}
         * @param propagateTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
         * @return {@code this}
         */
        public Builder propagateTags(com.hashicorp.cdktf.IResolvable propagateTags) {
            this.propagateTags = propagateTags;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getRetryStrategy}
         * @param retryStrategy retry_strategy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
         * @return {@code this}
         */
        public Builder retryStrategy(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy retryStrategy) {
            this.retryStrategy = retryStrategy;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getSchedulingPriority}
         * @param schedulingPriority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.
         * @return {@code this}
         */
        public Builder schedulingPriority(java.lang.Number schedulingPriority) {
            this.schedulingPriority = schedulingPriority;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getTimeout}
         * @param timeout timeout block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
         * @return {@code this}
         */
        public Builder timeout(imports.aws.batch_job_definition.BatchJobDefinitionTimeout timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getDependsOn}
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
         * Sets the value of {@link BatchJobDefinitionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionConfig#getProvisioners}
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
         * @return a new instance of {@link BatchJobDefinitionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionConfig {
        private final java.lang.String name;
        private final java.lang.String type;
        private final java.lang.String containerProperties;
        private final java.lang.Object deregisterOnNewRevision;
        private final java.lang.String ecsProperties;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksProperties eksProperties;
        private final java.lang.String id;
        private final java.lang.String nodeProperties;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.util.List<java.lang.String> platformCapabilities;
        private final java.lang.Object propagateTags;
        private final imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy retryStrategy;
        private final java.lang.Number schedulingPriority;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.batch_job_definition.BatchJobDefinitionTimeout timeout;
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
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerProperties = software.amazon.jsii.Kernel.get(this, "containerProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deregisterOnNewRevision = software.amazon.jsii.Kernel.get(this, "deregisterOnNewRevision", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ecsProperties = software.amazon.jsii.Kernel.get(this, "ecsProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eksProperties = software.amazon.jsii.Kernel.get(this, "eksProperties", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksProperties.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeProperties = software.amazon.jsii.Kernel.get(this, "nodeProperties", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.platformCapabilities = software.amazon.jsii.Kernel.get(this, "platformCapabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.propagateTags = software.amazon.jsii.Kernel.get(this, "propagateTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retryStrategy = software.amazon.jsii.Kernel.get(this, "retryStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy.class));
            this.schedulingPriority = software.amazon.jsii.Kernel.get(this, "schedulingPriority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionTimeout.class));
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
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.containerProperties = builder.containerProperties;
            this.deregisterOnNewRevision = builder.deregisterOnNewRevision;
            this.ecsProperties = builder.ecsProperties;
            this.eksProperties = builder.eksProperties;
            this.id = builder.id;
            this.nodeProperties = builder.nodeProperties;
            this.parameters = builder.parameters;
            this.platformCapabilities = builder.platformCapabilities;
            this.propagateTags = builder.propagateTags;
            this.retryStrategy = builder.retryStrategy;
            this.schedulingPriority = builder.schedulingPriority;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeout = builder.timeout;
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
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getContainerProperties() {
            return this.containerProperties;
        }

        @Override
        public final java.lang.Object getDeregisterOnNewRevision() {
            return this.deregisterOnNewRevision;
        }

        @Override
        public final java.lang.String getEcsProperties() {
            return this.ecsProperties;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksProperties getEksProperties() {
            return this.eksProperties;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getNodeProperties() {
            return this.nodeProperties;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.util.List<java.lang.String> getPlatformCapabilities() {
            return this.platformCapabilities;
        }

        @Override
        public final java.lang.Object getPropagateTags() {
            return this.propagateTags;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategy getRetryStrategy() {
            return this.retryStrategy;
        }

        @Override
        public final java.lang.Number getSchedulingPriority() {
            return this.schedulingPriority;
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
        public final imports.aws.batch_job_definition.BatchJobDefinitionTimeout getTimeout() {
            return this.timeout;
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
            data.set("type", om.valueToTree(this.getType()));
            if (this.getContainerProperties() != null) {
                data.set("containerProperties", om.valueToTree(this.getContainerProperties()));
            }
            if (this.getDeregisterOnNewRevision() != null) {
                data.set("deregisterOnNewRevision", om.valueToTree(this.getDeregisterOnNewRevision()));
            }
            if (this.getEcsProperties() != null) {
                data.set("ecsProperties", om.valueToTree(this.getEcsProperties()));
            }
            if (this.getEksProperties() != null) {
                data.set("eksProperties", om.valueToTree(this.getEksProperties()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNodeProperties() != null) {
                data.set("nodeProperties", om.valueToTree(this.getNodeProperties()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPlatformCapabilities() != null) {
                data.set("platformCapabilities", om.valueToTree(this.getPlatformCapabilities()));
            }
            if (this.getPropagateTags() != null) {
                data.set("propagateTags", om.valueToTree(this.getPropagateTags()));
            }
            if (this.getRetryStrategy() != null) {
                data.set("retryStrategy", om.valueToTree(this.getRetryStrategy()));
            }
            if (this.getSchedulingPriority() != null) {
                data.set("schedulingPriority", om.valueToTree(this.getSchedulingPriority()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
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
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionConfig.Jsii$Proxy that = (BatchJobDefinitionConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            if (this.containerProperties != null ? !this.containerProperties.equals(that.containerProperties) : that.containerProperties != null) return false;
            if (this.deregisterOnNewRevision != null ? !this.deregisterOnNewRevision.equals(that.deregisterOnNewRevision) : that.deregisterOnNewRevision != null) return false;
            if (this.ecsProperties != null ? !this.ecsProperties.equals(that.ecsProperties) : that.ecsProperties != null) return false;
            if (this.eksProperties != null ? !this.eksProperties.equals(that.eksProperties) : that.eksProperties != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.nodeProperties != null ? !this.nodeProperties.equals(that.nodeProperties) : that.nodeProperties != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.platformCapabilities != null ? !this.platformCapabilities.equals(that.platformCapabilities) : that.platformCapabilities != null) return false;
            if (this.propagateTags != null ? !this.propagateTags.equals(that.propagateTags) : that.propagateTags != null) return false;
            if (this.retryStrategy != null ? !this.retryStrategy.equals(that.retryStrategy) : that.retryStrategy != null) return false;
            if (this.schedulingPriority != null ? !this.schedulingPriority.equals(that.schedulingPriority) : that.schedulingPriority != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
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
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.containerProperties != null ? this.containerProperties.hashCode() : 0);
            result = 31 * result + (this.deregisterOnNewRevision != null ? this.deregisterOnNewRevision.hashCode() : 0);
            result = 31 * result + (this.ecsProperties != null ? this.ecsProperties.hashCode() : 0);
            result = 31 * result + (this.eksProperties != null ? this.eksProperties.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.nodeProperties != null ? this.nodeProperties.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.platformCapabilities != null ? this.platformCapabilities.hashCode() : 0);
            result = 31 * result + (this.propagateTags != null ? this.propagateTags.hashCode() : 0);
            result = 31 * result + (this.retryStrategy != null ? this.retryStrategy.hashCode() : 0);
            result = 31 * result + (this.schedulingPriority != null ? this.schedulingPriority.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
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
