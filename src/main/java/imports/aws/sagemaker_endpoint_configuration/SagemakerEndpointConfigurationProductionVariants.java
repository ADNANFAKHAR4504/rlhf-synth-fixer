package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariants")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationProductionVariants.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationProductionVariants extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#model_name SagemakerEndpointConfiguration#model_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getModelName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#accelerator_type SagemakerEndpointConfiguration#accelerator_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAcceleratorType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#container_startup_health_check_timeout_in_seconds SagemakerEndpointConfiguration#container_startup_health_check_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getContainerStartupHealthCheckTimeoutInSeconds() {
        return null;
    }

    /**
     * core_dump_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#core_dump_config SagemakerEndpointConfiguration#core_dump_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig getCoreDumpConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_ssm_access SagemakerEndpointConfiguration#enable_ssm_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableSsmAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#inference_ami_version SagemakerEndpointConfiguration#inference_ami_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInferenceAmiVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_instance_count SagemakerEndpointConfiguration#initial_instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInitialInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_variant_weight SagemakerEndpointConfiguration#initial_variant_weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInitialVariantWeight() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#instance_type SagemakerEndpointConfiguration#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * managed_instance_scaling block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#managed_instance_scaling SagemakerEndpointConfiguration#managed_instance_scaling}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling getManagedInstanceScaling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#model_data_download_timeout_in_seconds SagemakerEndpointConfiguration#model_data_download_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getModelDataDownloadTimeoutInSeconds() {
        return null;
    }

    /**
     * routing_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#routing_config SagemakerEndpointConfiguration#routing_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRoutingConfig() {
        return null;
    }

    /**
     * serverless_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#serverless_config SagemakerEndpointConfiguration#serverless_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig getServerlessConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#variant_name SagemakerEndpointConfiguration#variant_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVariantName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#volume_size_in_gb SagemakerEndpointConfiguration#volume_size_in_gb}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSizeInGb() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationProductionVariants}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationProductionVariants}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationProductionVariants> {
        java.lang.String modelName;
        java.lang.String acceleratorType;
        java.lang.Number containerStartupHealthCheckTimeoutInSeconds;
        imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig coreDumpConfig;
        java.lang.Object enableSsmAccess;
        java.lang.String inferenceAmiVersion;
        java.lang.Number initialInstanceCount;
        java.lang.Number initialVariantWeight;
        java.lang.String instanceType;
        imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling managedInstanceScaling;
        java.lang.Number modelDataDownloadTimeoutInSeconds;
        java.lang.Object routingConfig;
        imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig serverlessConfig;
        java.lang.String variantName;
        java.lang.Number volumeSizeInGb;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getModelName}
         * @param modelName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#model_name SagemakerEndpointConfiguration#model_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder modelName(java.lang.String modelName) {
            this.modelName = modelName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getAcceleratorType}
         * @param acceleratorType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#accelerator_type SagemakerEndpointConfiguration#accelerator_type}.
         * @return {@code this}
         */
        public Builder acceleratorType(java.lang.String acceleratorType) {
            this.acceleratorType = acceleratorType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getContainerStartupHealthCheckTimeoutInSeconds}
         * @param containerStartupHealthCheckTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#container_startup_health_check_timeout_in_seconds SagemakerEndpointConfiguration#container_startup_health_check_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder containerStartupHealthCheckTimeoutInSeconds(java.lang.Number containerStartupHealthCheckTimeoutInSeconds) {
            this.containerStartupHealthCheckTimeoutInSeconds = containerStartupHealthCheckTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getCoreDumpConfig}
         * @param coreDumpConfig core_dump_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#core_dump_config SagemakerEndpointConfiguration#core_dump_config}
         * @return {@code this}
         */
        public Builder coreDumpConfig(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig coreDumpConfig) {
            this.coreDumpConfig = coreDumpConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getEnableSsmAccess}
         * @param enableSsmAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_ssm_access SagemakerEndpointConfiguration#enable_ssm_access}.
         * @return {@code this}
         */
        public Builder enableSsmAccess(java.lang.Boolean enableSsmAccess) {
            this.enableSsmAccess = enableSsmAccess;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getEnableSsmAccess}
         * @param enableSsmAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_ssm_access SagemakerEndpointConfiguration#enable_ssm_access}.
         * @return {@code this}
         */
        public Builder enableSsmAccess(com.hashicorp.cdktf.IResolvable enableSsmAccess) {
            this.enableSsmAccess = enableSsmAccess;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getInferenceAmiVersion}
         * @param inferenceAmiVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#inference_ami_version SagemakerEndpointConfiguration#inference_ami_version}.
         * @return {@code this}
         */
        public Builder inferenceAmiVersion(java.lang.String inferenceAmiVersion) {
            this.inferenceAmiVersion = inferenceAmiVersion;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getInitialInstanceCount}
         * @param initialInstanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_instance_count SagemakerEndpointConfiguration#initial_instance_count}.
         * @return {@code this}
         */
        public Builder initialInstanceCount(java.lang.Number initialInstanceCount) {
            this.initialInstanceCount = initialInstanceCount;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getInitialVariantWeight}
         * @param initialVariantWeight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_variant_weight SagemakerEndpointConfiguration#initial_variant_weight}.
         * @return {@code this}
         */
        public Builder initialVariantWeight(java.lang.Number initialVariantWeight) {
            this.initialVariantWeight = initialVariantWeight;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#instance_type SagemakerEndpointConfiguration#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getManagedInstanceScaling}
         * @param managedInstanceScaling managed_instance_scaling block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#managed_instance_scaling SagemakerEndpointConfiguration#managed_instance_scaling}
         * @return {@code this}
         */
        public Builder managedInstanceScaling(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling managedInstanceScaling) {
            this.managedInstanceScaling = managedInstanceScaling;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getModelDataDownloadTimeoutInSeconds}
         * @param modelDataDownloadTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#model_data_download_timeout_in_seconds SagemakerEndpointConfiguration#model_data_download_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder modelDataDownloadTimeoutInSeconds(java.lang.Number modelDataDownloadTimeoutInSeconds) {
            this.modelDataDownloadTimeoutInSeconds = modelDataDownloadTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getRoutingConfig}
         * @param routingConfig routing_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#routing_config SagemakerEndpointConfiguration#routing_config}
         * @return {@code this}
         */
        public Builder routingConfig(com.hashicorp.cdktf.IResolvable routingConfig) {
            this.routingConfig = routingConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getRoutingConfig}
         * @param routingConfig routing_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#routing_config SagemakerEndpointConfiguration#routing_config}
         * @return {@code this}
         */
        public Builder routingConfig(java.util.List<? extends imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsRoutingConfig> routingConfig) {
            this.routingConfig = routingConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getServerlessConfig}
         * @param serverlessConfig serverless_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#serverless_config SagemakerEndpointConfiguration#serverless_config}
         * @return {@code this}
         */
        public Builder serverlessConfig(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig serverlessConfig) {
            this.serverlessConfig = serverlessConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getVariantName}
         * @param variantName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#variant_name SagemakerEndpointConfiguration#variant_name}.
         * @return {@code this}
         */
        public Builder variantName(java.lang.String variantName) {
            this.variantName = variantName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariants#getVolumeSizeInGb}
         * @param volumeSizeInGb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#volume_size_in_gb SagemakerEndpointConfiguration#volume_size_in_gb}.
         * @return {@code this}
         */
        public Builder volumeSizeInGb(java.lang.Number volumeSizeInGb) {
            this.volumeSizeInGb = volumeSizeInGb;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationProductionVariants}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationProductionVariants build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationProductionVariants}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationProductionVariants {
        private final java.lang.String modelName;
        private final java.lang.String acceleratorType;
        private final java.lang.Number containerStartupHealthCheckTimeoutInSeconds;
        private final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig coreDumpConfig;
        private final java.lang.Object enableSsmAccess;
        private final java.lang.String inferenceAmiVersion;
        private final java.lang.Number initialInstanceCount;
        private final java.lang.Number initialVariantWeight;
        private final java.lang.String instanceType;
        private final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling managedInstanceScaling;
        private final java.lang.Number modelDataDownloadTimeoutInSeconds;
        private final java.lang.Object routingConfig;
        private final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig serverlessConfig;
        private final java.lang.String variantName;
        private final java.lang.Number volumeSizeInGb;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.modelName = software.amazon.jsii.Kernel.get(this, "modelName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.acceleratorType = software.amazon.jsii.Kernel.get(this, "acceleratorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerStartupHealthCheckTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "containerStartupHealthCheckTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.coreDumpConfig = software.amazon.jsii.Kernel.get(this, "coreDumpConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig.class));
            this.enableSsmAccess = software.amazon.jsii.Kernel.get(this, "enableSsmAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inferenceAmiVersion = software.amazon.jsii.Kernel.get(this, "inferenceAmiVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initialInstanceCount = software.amazon.jsii.Kernel.get(this, "initialInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.initialVariantWeight = software.amazon.jsii.Kernel.get(this, "initialVariantWeight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.managedInstanceScaling = software.amazon.jsii.Kernel.get(this, "managedInstanceScaling", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling.class));
            this.modelDataDownloadTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "modelDataDownloadTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.routingConfig = software.amazon.jsii.Kernel.get(this, "routingConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serverlessConfig = software.amazon.jsii.Kernel.get(this, "serverlessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig.class));
            this.variantName = software.amazon.jsii.Kernel.get(this, "variantName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeSizeInGb = software.amazon.jsii.Kernel.get(this, "volumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.modelName = java.util.Objects.requireNonNull(builder.modelName, "modelName is required");
            this.acceleratorType = builder.acceleratorType;
            this.containerStartupHealthCheckTimeoutInSeconds = builder.containerStartupHealthCheckTimeoutInSeconds;
            this.coreDumpConfig = builder.coreDumpConfig;
            this.enableSsmAccess = builder.enableSsmAccess;
            this.inferenceAmiVersion = builder.inferenceAmiVersion;
            this.initialInstanceCount = builder.initialInstanceCount;
            this.initialVariantWeight = builder.initialVariantWeight;
            this.instanceType = builder.instanceType;
            this.managedInstanceScaling = builder.managedInstanceScaling;
            this.modelDataDownloadTimeoutInSeconds = builder.modelDataDownloadTimeoutInSeconds;
            this.routingConfig = builder.routingConfig;
            this.serverlessConfig = builder.serverlessConfig;
            this.variantName = builder.variantName;
            this.volumeSizeInGb = builder.volumeSizeInGb;
        }

        @Override
        public final java.lang.String getModelName() {
            return this.modelName;
        }

        @Override
        public final java.lang.String getAcceleratorType() {
            return this.acceleratorType;
        }

        @Override
        public final java.lang.Number getContainerStartupHealthCheckTimeoutInSeconds() {
            return this.containerStartupHealthCheckTimeoutInSeconds;
        }

        @Override
        public final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsCoreDumpConfig getCoreDumpConfig() {
            return this.coreDumpConfig;
        }

        @Override
        public final java.lang.Object getEnableSsmAccess() {
            return this.enableSsmAccess;
        }

        @Override
        public final java.lang.String getInferenceAmiVersion() {
            return this.inferenceAmiVersion;
        }

        @Override
        public final java.lang.Number getInitialInstanceCount() {
            return this.initialInstanceCount;
        }

        @Override
        public final java.lang.Number getInitialVariantWeight() {
            return this.initialVariantWeight;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsManagedInstanceScaling getManagedInstanceScaling() {
            return this.managedInstanceScaling;
        }

        @Override
        public final java.lang.Number getModelDataDownloadTimeoutInSeconds() {
            return this.modelDataDownloadTimeoutInSeconds;
        }

        @Override
        public final java.lang.Object getRoutingConfig() {
            return this.routingConfig;
        }

        @Override
        public final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig getServerlessConfig() {
            return this.serverlessConfig;
        }

        @Override
        public final java.lang.String getVariantName() {
            return this.variantName;
        }

        @Override
        public final java.lang.Number getVolumeSizeInGb() {
            return this.volumeSizeInGb;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("modelName", om.valueToTree(this.getModelName()));
            if (this.getAcceleratorType() != null) {
                data.set("acceleratorType", om.valueToTree(this.getAcceleratorType()));
            }
            if (this.getContainerStartupHealthCheckTimeoutInSeconds() != null) {
                data.set("containerStartupHealthCheckTimeoutInSeconds", om.valueToTree(this.getContainerStartupHealthCheckTimeoutInSeconds()));
            }
            if (this.getCoreDumpConfig() != null) {
                data.set("coreDumpConfig", om.valueToTree(this.getCoreDumpConfig()));
            }
            if (this.getEnableSsmAccess() != null) {
                data.set("enableSsmAccess", om.valueToTree(this.getEnableSsmAccess()));
            }
            if (this.getInferenceAmiVersion() != null) {
                data.set("inferenceAmiVersion", om.valueToTree(this.getInferenceAmiVersion()));
            }
            if (this.getInitialInstanceCount() != null) {
                data.set("initialInstanceCount", om.valueToTree(this.getInitialInstanceCount()));
            }
            if (this.getInitialVariantWeight() != null) {
                data.set("initialVariantWeight", om.valueToTree(this.getInitialVariantWeight()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getManagedInstanceScaling() != null) {
                data.set("managedInstanceScaling", om.valueToTree(this.getManagedInstanceScaling()));
            }
            if (this.getModelDataDownloadTimeoutInSeconds() != null) {
                data.set("modelDataDownloadTimeoutInSeconds", om.valueToTree(this.getModelDataDownloadTimeoutInSeconds()));
            }
            if (this.getRoutingConfig() != null) {
                data.set("routingConfig", om.valueToTree(this.getRoutingConfig()));
            }
            if (this.getServerlessConfig() != null) {
                data.set("serverlessConfig", om.valueToTree(this.getServerlessConfig()));
            }
            if (this.getVariantName() != null) {
                data.set("variantName", om.valueToTree(this.getVariantName()));
            }
            if (this.getVolumeSizeInGb() != null) {
                data.set("volumeSizeInGb", om.valueToTree(this.getVolumeSizeInGb()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariants"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationProductionVariants.Jsii$Proxy that = (SagemakerEndpointConfigurationProductionVariants.Jsii$Proxy) o;

            if (!modelName.equals(that.modelName)) return false;
            if (this.acceleratorType != null ? !this.acceleratorType.equals(that.acceleratorType) : that.acceleratorType != null) return false;
            if (this.containerStartupHealthCheckTimeoutInSeconds != null ? !this.containerStartupHealthCheckTimeoutInSeconds.equals(that.containerStartupHealthCheckTimeoutInSeconds) : that.containerStartupHealthCheckTimeoutInSeconds != null) return false;
            if (this.coreDumpConfig != null ? !this.coreDumpConfig.equals(that.coreDumpConfig) : that.coreDumpConfig != null) return false;
            if (this.enableSsmAccess != null ? !this.enableSsmAccess.equals(that.enableSsmAccess) : that.enableSsmAccess != null) return false;
            if (this.inferenceAmiVersion != null ? !this.inferenceAmiVersion.equals(that.inferenceAmiVersion) : that.inferenceAmiVersion != null) return false;
            if (this.initialInstanceCount != null ? !this.initialInstanceCount.equals(that.initialInstanceCount) : that.initialInstanceCount != null) return false;
            if (this.initialVariantWeight != null ? !this.initialVariantWeight.equals(that.initialVariantWeight) : that.initialVariantWeight != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.managedInstanceScaling != null ? !this.managedInstanceScaling.equals(that.managedInstanceScaling) : that.managedInstanceScaling != null) return false;
            if (this.modelDataDownloadTimeoutInSeconds != null ? !this.modelDataDownloadTimeoutInSeconds.equals(that.modelDataDownloadTimeoutInSeconds) : that.modelDataDownloadTimeoutInSeconds != null) return false;
            if (this.routingConfig != null ? !this.routingConfig.equals(that.routingConfig) : that.routingConfig != null) return false;
            if (this.serverlessConfig != null ? !this.serverlessConfig.equals(that.serverlessConfig) : that.serverlessConfig != null) return false;
            if (this.variantName != null ? !this.variantName.equals(that.variantName) : that.variantName != null) return false;
            return this.volumeSizeInGb != null ? this.volumeSizeInGb.equals(that.volumeSizeInGb) : that.volumeSizeInGb == null;
        }

        @Override
        public final int hashCode() {
            int result = this.modelName.hashCode();
            result = 31 * result + (this.acceleratorType != null ? this.acceleratorType.hashCode() : 0);
            result = 31 * result + (this.containerStartupHealthCheckTimeoutInSeconds != null ? this.containerStartupHealthCheckTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.coreDumpConfig != null ? this.coreDumpConfig.hashCode() : 0);
            result = 31 * result + (this.enableSsmAccess != null ? this.enableSsmAccess.hashCode() : 0);
            result = 31 * result + (this.inferenceAmiVersion != null ? this.inferenceAmiVersion.hashCode() : 0);
            result = 31 * result + (this.initialInstanceCount != null ? this.initialInstanceCount.hashCode() : 0);
            result = 31 * result + (this.initialVariantWeight != null ? this.initialVariantWeight.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.managedInstanceScaling != null ? this.managedInstanceScaling.hashCode() : 0);
            result = 31 * result + (this.modelDataDownloadTimeoutInSeconds != null ? this.modelDataDownloadTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.routingConfig != null ? this.routingConfig.hashCode() : 0);
            result = 31 * result + (this.serverlessConfig != null ? this.serverlessConfig.hashCode() : 0);
            result = 31 * result + (this.variantName != null ? this.variantName.hashCode() : 0);
            result = 31 * result + (this.volumeSizeInGb != null ? this.volumeSizeInGb.hashCode() : 0);
            return result;
        }
    }
}
