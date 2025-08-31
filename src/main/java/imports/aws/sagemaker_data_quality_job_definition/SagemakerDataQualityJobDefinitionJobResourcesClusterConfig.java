package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionJobResourcesClusterConfig.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionJobResourcesClusterConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_count SagemakerDataQualityJobDefinition#instance_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_type SagemakerDataQualityJobDefinition#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_size_in_gb SagemakerDataQualityJobDefinition#volume_size_in_gb}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSizeInGb();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_kms_key_id SagemakerDataQualityJobDefinition#volume_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionJobResourcesClusterConfig> {
        java.lang.Number instanceCount;
        java.lang.String instanceType;
        java.lang.Number volumeSizeInGb;
        java.lang.String volumeKmsKeyId;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_count SagemakerDataQualityJobDefinition#instance_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#instance_type SagemakerDataQualityJobDefinition#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig#getVolumeSizeInGb}
         * @param volumeSizeInGb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_size_in_gb SagemakerDataQualityJobDefinition#volume_size_in_gb}. This parameter is required.
         * @return {@code this}
         */
        public Builder volumeSizeInGb(java.lang.Number volumeSizeInGb) {
            this.volumeSizeInGb = volumeSizeInGb;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig#getVolumeKmsKeyId}
         * @param volumeKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#volume_kms_key_id SagemakerDataQualityJobDefinition#volume_kms_key_id}.
         * @return {@code this}
         */
        public Builder volumeKmsKeyId(java.lang.String volumeKmsKeyId) {
            this.volumeKmsKeyId = volumeKmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionJobResourcesClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionJobResourcesClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionJobResourcesClusterConfig {
        private final java.lang.Number instanceCount;
        private final java.lang.String instanceType;
        private final java.lang.Number volumeSizeInGb;
        private final java.lang.String volumeKmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeSizeInGb = software.amazon.jsii.Kernel.get(this, "volumeSizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeKmsKeyId = software.amazon.jsii.Kernel.get(this, "volumeKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceCount = java.util.Objects.requireNonNull(builder.instanceCount, "instanceCount is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.volumeSizeInGb = java.util.Objects.requireNonNull(builder.volumeSizeInGb, "volumeSizeInGb is required");
            this.volumeKmsKeyId = builder.volumeKmsKeyId;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.Number getVolumeSizeInGb() {
            return this.volumeSizeInGb;
        }

        @Override
        public final java.lang.String getVolumeKmsKeyId() {
            return this.volumeKmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            data.set("volumeSizeInGb", om.valueToTree(this.getVolumeSizeInGb()));
            if (this.getVolumeKmsKeyId() != null) {
                data.set("volumeKmsKeyId", om.valueToTree(this.getVolumeKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionJobResourcesClusterConfig.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionJobResourcesClusterConfig.Jsii$Proxy) o;

            if (!instanceCount.equals(that.instanceCount)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (!volumeSizeInGb.equals(that.volumeSizeInGb)) return false;
            return this.volumeKmsKeyId != null ? this.volumeKmsKeyId.equals(that.volumeKmsKeyId) : that.volumeKmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceCount.hashCode();
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.volumeSizeInGb.hashCode());
            result = 31 * result + (this.volumeKmsKeyId != null ? this.volumeKmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
