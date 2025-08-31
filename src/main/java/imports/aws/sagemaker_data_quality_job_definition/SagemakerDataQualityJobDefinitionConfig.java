package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionConfig.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * data_quality_app_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_app_specification SagemakerDataQualityJobDefinition#data_quality_app_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification getDataQualityAppSpecification();

    /**
     * data_quality_job_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_input SagemakerDataQualityJobDefinition#data_quality_job_input}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput getDataQualityJobInput();

    /**
     * data_quality_job_output_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_output_config SagemakerDataQualityJobDefinition#data_quality_job_output_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig getDataQualityJobOutputConfig();

    /**
     * job_resources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#job_resources SagemakerDataQualityJobDefinition#job_resources}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources getJobResources();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#role_arn SagemakerDataQualityJobDefinition#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * data_quality_baseline_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_baseline_config SagemakerDataQualityJobDefinition#data_quality_baseline_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig getDataQualityBaselineConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#id SagemakerDataQualityJobDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#name SagemakerDataQualityJobDefinition#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * network_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#network_config SagemakerDataQualityJobDefinition#network_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig getNetworkConfig() {
        return null;
    }

    /**
     * stopping_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#stopping_condition SagemakerDataQualityJobDefinition#stopping_condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition getStoppingCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags SagemakerDataQualityJobDefinition#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags_all SagemakerDataQualityJobDefinition#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionConfig> {
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification dataQualityAppSpecification;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput dataQualityJobInput;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig dataQualityJobOutputConfig;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources jobResources;
        java.lang.String roleArn;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig dataQualityBaselineConfig;
        java.lang.String id;
        java.lang.String name;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig networkConfig;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition stoppingCondition;
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
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getDataQualityAppSpecification}
         * @param dataQualityAppSpecification data_quality_app_specification block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_app_specification SagemakerDataQualityJobDefinition#data_quality_app_specification}
         * @return {@code this}
         */
        public Builder dataQualityAppSpecification(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification dataQualityAppSpecification) {
            this.dataQualityAppSpecification = dataQualityAppSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getDataQualityJobInput}
         * @param dataQualityJobInput data_quality_job_input block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_input SagemakerDataQualityJobDefinition#data_quality_job_input}
         * @return {@code this}
         */
        public Builder dataQualityJobInput(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput dataQualityJobInput) {
            this.dataQualityJobInput = dataQualityJobInput;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getDataQualityJobOutputConfig}
         * @param dataQualityJobOutputConfig data_quality_job_output_config block. This parameter is required.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_job_output_config SagemakerDataQualityJobDefinition#data_quality_job_output_config}
         * @return {@code this}
         */
        public Builder dataQualityJobOutputConfig(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig dataQualityJobOutputConfig) {
            this.dataQualityJobOutputConfig = dataQualityJobOutputConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getJobResources}
         * @param jobResources job_resources block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#job_resources SagemakerDataQualityJobDefinition#job_resources}
         * @return {@code this}
         */
        public Builder jobResources(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources jobResources) {
            this.jobResources = jobResources;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#role_arn SagemakerDataQualityJobDefinition#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getDataQualityBaselineConfig}
         * @param dataQualityBaselineConfig data_quality_baseline_config block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_quality_baseline_config SagemakerDataQualityJobDefinition#data_quality_baseline_config}
         * @return {@code this}
         */
        public Builder dataQualityBaselineConfig(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig dataQualityBaselineConfig) {
            this.dataQualityBaselineConfig = dataQualityBaselineConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#id SagemakerDataQualityJobDefinition#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#name SagemakerDataQualityJobDefinition#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getNetworkConfig}
         * @param networkConfig network_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#network_config SagemakerDataQualityJobDefinition#network_config}
         * @return {@code this}
         */
        public Builder networkConfig(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig networkConfig) {
            this.networkConfig = networkConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getStoppingCondition}
         * @param stoppingCondition stopping_condition block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#stopping_condition SagemakerDataQualityJobDefinition#stopping_condition}
         * @return {@code this}
         */
        public Builder stoppingCondition(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition stoppingCondition) {
            this.stoppingCondition = stoppingCondition;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags SagemakerDataQualityJobDefinition#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#tags_all SagemakerDataQualityJobDefinition#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionConfig {
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification dataQualityAppSpecification;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput dataQualityJobInput;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig dataQualityJobOutputConfig;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources jobResources;
        private final java.lang.String roleArn;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig dataQualityBaselineConfig;
        private final java.lang.String id;
        private final java.lang.String name;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig networkConfig;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition stoppingCondition;
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
            this.dataQualityAppSpecification = software.amazon.jsii.Kernel.get(this, "dataQualityAppSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification.class));
            this.dataQualityJobInput = software.amazon.jsii.Kernel.get(this, "dataQualityJobInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput.class));
            this.dataQualityJobOutputConfig = software.amazon.jsii.Kernel.get(this, "dataQualityJobOutputConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig.class));
            this.jobResources = software.amazon.jsii.Kernel.get(this, "jobResources", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataQualityBaselineConfig = software.amazon.jsii.Kernel.get(this, "dataQualityBaselineConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkConfig = software.amazon.jsii.Kernel.get(this, "networkConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig.class));
            this.stoppingCondition = software.amazon.jsii.Kernel.get(this, "stoppingCondition", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition.class));
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
            this.dataQualityAppSpecification = java.util.Objects.requireNonNull(builder.dataQualityAppSpecification, "dataQualityAppSpecification is required");
            this.dataQualityJobInput = java.util.Objects.requireNonNull(builder.dataQualityJobInput, "dataQualityJobInput is required");
            this.dataQualityJobOutputConfig = java.util.Objects.requireNonNull(builder.dataQualityJobOutputConfig, "dataQualityJobOutputConfig is required");
            this.jobResources = java.util.Objects.requireNonNull(builder.jobResources, "jobResources is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.dataQualityBaselineConfig = builder.dataQualityBaselineConfig;
            this.id = builder.id;
            this.name = builder.name;
            this.networkConfig = builder.networkConfig;
            this.stoppingCondition = builder.stoppingCondition;
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
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification getDataQualityAppSpecification() {
            return this.dataQualityAppSpecification;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInput getDataQualityJobInput() {
            return this.dataQualityJobInput;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfig getDataQualityJobOutputConfig() {
            return this.dataQualityJobOutputConfig;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResources getJobResources() {
            return this.jobResources;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig getDataQualityBaselineConfig() {
            return this.dataQualityBaselineConfig;
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
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfig getNetworkConfig() {
            return this.networkConfig;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionStoppingCondition getStoppingCondition() {
            return this.stoppingCondition;
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

            data.set("dataQualityAppSpecification", om.valueToTree(this.getDataQualityAppSpecification()));
            data.set("dataQualityJobInput", om.valueToTree(this.getDataQualityJobInput()));
            data.set("dataQualityJobOutputConfig", om.valueToTree(this.getDataQualityJobOutputConfig()));
            data.set("jobResources", om.valueToTree(this.getJobResources()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getDataQualityBaselineConfig() != null) {
                data.set("dataQualityBaselineConfig", om.valueToTree(this.getDataQualityBaselineConfig()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNetworkConfig() != null) {
                data.set("networkConfig", om.valueToTree(this.getNetworkConfig()));
            }
            if (this.getStoppingCondition() != null) {
                data.set("stoppingCondition", om.valueToTree(this.getStoppingCondition()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionConfig.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionConfig.Jsii$Proxy) o;

            if (!dataQualityAppSpecification.equals(that.dataQualityAppSpecification)) return false;
            if (!dataQualityJobInput.equals(that.dataQualityJobInput)) return false;
            if (!dataQualityJobOutputConfig.equals(that.dataQualityJobOutputConfig)) return false;
            if (!jobResources.equals(that.jobResources)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.dataQualityBaselineConfig != null ? !this.dataQualityBaselineConfig.equals(that.dataQualityBaselineConfig) : that.dataQualityBaselineConfig != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.networkConfig != null ? !this.networkConfig.equals(that.networkConfig) : that.networkConfig != null) return false;
            if (this.stoppingCondition != null ? !this.stoppingCondition.equals(that.stoppingCondition) : that.stoppingCondition != null) return false;
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
            int result = this.dataQualityAppSpecification.hashCode();
            result = 31 * result + (this.dataQualityJobInput.hashCode());
            result = 31 * result + (this.dataQualityJobOutputConfig.hashCode());
            result = 31 * result + (this.jobResources.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.dataQualityBaselineConfig != null ? this.dataQualityBaselineConfig.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.networkConfig != null ? this.networkConfig.hashCode() : 0);
            result = 31 * result + (this.stoppingCondition != null ? this.stoppingCondition.hashCode() : 0);
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
