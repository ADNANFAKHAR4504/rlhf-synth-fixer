package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainer")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelPrimaryContainer.Jsii$Proxy.class)
public interface SagemakerModelPrimaryContainer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContainerHostname() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImage() {
        return null;
    }

    /**
     * image_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig getImageConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInferenceSpecificationName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMode() {
        return null;
    }

    /**
     * model_data_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource getModelDataSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelDataUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelPackageName() {
        return null;
    }

    /**
     * multi_model_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig getMultiModelConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerModelPrimaryContainer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelPrimaryContainer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelPrimaryContainer> {
        java.lang.String containerHostname;
        java.util.Map<java.lang.String, java.lang.String> environment;
        java.lang.String image;
        imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig imageConfig;
        java.lang.String inferenceSpecificationName;
        java.lang.String mode;
        imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource modelDataSource;
        java.lang.String modelDataUrl;
        java.lang.String modelPackageName;
        imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig multiModelConfig;

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getContainerHostname}
         * @param containerHostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.
         * @return {@code this}
         */
        public Builder containerHostname(java.lang.String containerHostname) {
            this.containerHostname = containerHostname;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getEnvironment}
         * @param environment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.
         * @return {@code this}
         */
        public Builder environment(java.util.Map<java.lang.String, java.lang.String> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getImage}
         * @param image Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.
         * @return {@code this}
         */
        public Builder image(java.lang.String image) {
            this.image = image;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getImageConfig}
         * @param imageConfig image_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
         * @return {@code this}
         */
        public Builder imageConfig(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig imageConfig) {
            this.imageConfig = imageConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getInferenceSpecificationName}
         * @param inferenceSpecificationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.
         * @return {@code this}
         */
        public Builder inferenceSpecificationName(java.lang.String inferenceSpecificationName) {
            this.inferenceSpecificationName = inferenceSpecificationName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getModelDataSource}
         * @param modelDataSource model_data_source block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
         * @return {@code this}
         */
        public Builder modelDataSource(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource modelDataSource) {
            this.modelDataSource = modelDataSource;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getModelDataUrl}
         * @param modelDataUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.
         * @return {@code this}
         */
        public Builder modelDataUrl(java.lang.String modelDataUrl) {
            this.modelDataUrl = modelDataUrl;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getModelPackageName}
         * @param modelPackageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.
         * @return {@code this}
         */
        public Builder modelPackageName(java.lang.String modelPackageName) {
            this.modelPackageName = modelPackageName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainer#getMultiModelConfig}
         * @param multiModelConfig multi_model_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
         * @return {@code this}
         */
        public Builder multiModelConfig(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig multiModelConfig) {
            this.multiModelConfig = multiModelConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelPrimaryContainer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelPrimaryContainer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelPrimaryContainer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelPrimaryContainer {
        private final java.lang.String containerHostname;
        private final java.util.Map<java.lang.String, java.lang.String> environment;
        private final java.lang.String image;
        private final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig imageConfig;
        private final java.lang.String inferenceSpecificationName;
        private final java.lang.String mode;
        private final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource modelDataSource;
        private final java.lang.String modelDataUrl;
        private final java.lang.String modelPackageName;
        private final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig multiModelConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerHostname = software.amazon.jsii.Kernel.get(this, "containerHostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.image = software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageConfig = software.amazon.jsii.Kernel.get(this, "imageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig.class));
            this.inferenceSpecificationName = software.amazon.jsii.Kernel.get(this, "inferenceSpecificationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.modelDataSource = software.amazon.jsii.Kernel.get(this, "modelDataSource", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource.class));
            this.modelDataUrl = software.amazon.jsii.Kernel.get(this, "modelDataUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.modelPackageName = software.amazon.jsii.Kernel.get(this, "modelPackageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multiModelConfig = software.amazon.jsii.Kernel.get(this, "multiModelConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerHostname = builder.containerHostname;
            this.environment = builder.environment;
            this.image = builder.image;
            this.imageConfig = builder.imageConfig;
            this.inferenceSpecificationName = builder.inferenceSpecificationName;
            this.mode = builder.mode;
            this.modelDataSource = builder.modelDataSource;
            this.modelDataUrl = builder.modelDataUrl;
            this.modelPackageName = builder.modelPackageName;
            this.multiModelConfig = builder.multiModelConfig;
        }

        @Override
        public final java.lang.String getContainerHostname() {
            return this.containerHostname;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.String getImage() {
            return this.image;
        }

        @Override
        public final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerImageConfig getImageConfig() {
            return this.imageConfig;
        }

        @Override
        public final java.lang.String getInferenceSpecificationName() {
            return this.inferenceSpecificationName;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSource getModelDataSource() {
            return this.modelDataSource;
        }

        @Override
        public final java.lang.String getModelDataUrl() {
            return this.modelDataUrl;
        }

        @Override
        public final java.lang.String getModelPackageName() {
            return this.modelPackageName;
        }

        @Override
        public final imports.aws.sagemaker_model.SagemakerModelPrimaryContainerMultiModelConfig getMultiModelConfig() {
            return this.multiModelConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerHostname() != null) {
                data.set("containerHostname", om.valueToTree(this.getContainerHostname()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getImage() != null) {
                data.set("image", om.valueToTree(this.getImage()));
            }
            if (this.getImageConfig() != null) {
                data.set("imageConfig", om.valueToTree(this.getImageConfig()));
            }
            if (this.getInferenceSpecificationName() != null) {
                data.set("inferenceSpecificationName", om.valueToTree(this.getInferenceSpecificationName()));
            }
            if (this.getMode() != null) {
                data.set("mode", om.valueToTree(this.getMode()));
            }
            if (this.getModelDataSource() != null) {
                data.set("modelDataSource", om.valueToTree(this.getModelDataSource()));
            }
            if (this.getModelDataUrl() != null) {
                data.set("modelDataUrl", om.valueToTree(this.getModelDataUrl()));
            }
            if (this.getModelPackageName() != null) {
                data.set("modelPackageName", om.valueToTree(this.getModelPackageName()));
            }
            if (this.getMultiModelConfig() != null) {
                data.set("multiModelConfig", om.valueToTree(this.getMultiModelConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelPrimaryContainer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelPrimaryContainer.Jsii$Proxy that = (SagemakerModelPrimaryContainer.Jsii$Proxy) o;

            if (this.containerHostname != null ? !this.containerHostname.equals(that.containerHostname) : that.containerHostname != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.image != null ? !this.image.equals(that.image) : that.image != null) return false;
            if (this.imageConfig != null ? !this.imageConfig.equals(that.imageConfig) : that.imageConfig != null) return false;
            if (this.inferenceSpecificationName != null ? !this.inferenceSpecificationName.equals(that.inferenceSpecificationName) : that.inferenceSpecificationName != null) return false;
            if (this.mode != null ? !this.mode.equals(that.mode) : that.mode != null) return false;
            if (this.modelDataSource != null ? !this.modelDataSource.equals(that.modelDataSource) : that.modelDataSource != null) return false;
            if (this.modelDataUrl != null ? !this.modelDataUrl.equals(that.modelDataUrl) : that.modelDataUrl != null) return false;
            if (this.modelPackageName != null ? !this.modelPackageName.equals(that.modelPackageName) : that.modelPackageName != null) return false;
            return this.multiModelConfig != null ? this.multiModelConfig.equals(that.multiModelConfig) : that.multiModelConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerHostname != null ? this.containerHostname.hashCode() : 0;
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.image != null ? this.image.hashCode() : 0);
            result = 31 * result + (this.imageConfig != null ? this.imageConfig.hashCode() : 0);
            result = 31 * result + (this.inferenceSpecificationName != null ? this.inferenceSpecificationName.hashCode() : 0);
            result = 31 * result + (this.mode != null ? this.mode.hashCode() : 0);
            result = 31 * result + (this.modelDataSource != null ? this.modelDataSource.hashCode() : 0);
            result = 31 * result + (this.modelDataUrl != null ? this.modelDataUrl.hashCode() : 0);
            result = 31 * result + (this.modelPackageName != null ? this.modelPackageName.hashCode() : 0);
            result = 31 * result + (this.multiModelConfig != null ? this.multiModelConfig.hashCode() : 0);
            return result;
        }
    }
}
