package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionNetworkConfig.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionNetworkConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableInterContainerTrafficEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableNetworkIsolation() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#vpc_config SagemakerDataQualityJobDefinition#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionNetworkConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionNetworkConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionNetworkConfig> {
        java.lang.Object enableInterContainerTrafficEncryption;
        java.lang.Object enableNetworkIsolation;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig vpcConfig;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionNetworkConfig#getEnableInterContainerTrafficEncryption}
         * @param enableInterContainerTrafficEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.
         * @return {@code this}
         */
        public Builder enableInterContainerTrafficEncryption(java.lang.Boolean enableInterContainerTrafficEncryption) {
            this.enableInterContainerTrafficEncryption = enableInterContainerTrafficEncryption;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionNetworkConfig#getEnableInterContainerTrafficEncryption}
         * @param enableInterContainerTrafficEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_inter_container_traffic_encryption SagemakerDataQualityJobDefinition#enable_inter_container_traffic_encryption}.
         * @return {@code this}
         */
        public Builder enableInterContainerTrafficEncryption(com.hashicorp.cdktf.IResolvable enableInterContainerTrafficEncryption) {
            this.enableInterContainerTrafficEncryption = enableInterContainerTrafficEncryption;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionNetworkConfig#getEnableNetworkIsolation}
         * @param enableNetworkIsolation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.
         * @return {@code this}
         */
        public Builder enableNetworkIsolation(java.lang.Boolean enableNetworkIsolation) {
            this.enableNetworkIsolation = enableNetworkIsolation;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionNetworkConfig#getEnableNetworkIsolation}
         * @param enableNetworkIsolation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#enable_network_isolation SagemakerDataQualityJobDefinition#enable_network_isolation}.
         * @return {@code this}
         */
        public Builder enableNetworkIsolation(com.hashicorp.cdktf.IResolvable enableNetworkIsolation) {
            this.enableNetworkIsolation = enableNetworkIsolation;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionNetworkConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#vpc_config SagemakerDataQualityJobDefinition#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionNetworkConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionNetworkConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionNetworkConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionNetworkConfig {
        private final java.lang.Object enableInterContainerTrafficEncryption;
        private final java.lang.Object enableNetworkIsolation;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig vpcConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableInterContainerTrafficEncryption = software.amazon.jsii.Kernel.get(this, "enableInterContainerTrafficEncryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableNetworkIsolation = software.amazon.jsii.Kernel.get(this, "enableNetworkIsolation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableInterContainerTrafficEncryption = builder.enableInterContainerTrafficEncryption;
            this.enableNetworkIsolation = builder.enableNetworkIsolation;
            this.vpcConfig = builder.vpcConfig;
        }

        @Override
        public final java.lang.Object getEnableInterContainerTrafficEncryption() {
            return this.enableInterContainerTrafficEncryption;
        }

        @Override
        public final java.lang.Object getEnableNetworkIsolation() {
            return this.enableNetworkIsolation;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionNetworkConfigVpcConfig getVpcConfig() {
            return this.vpcConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableInterContainerTrafficEncryption() != null) {
                data.set("enableInterContainerTrafficEncryption", om.valueToTree(this.getEnableInterContainerTrafficEncryption()));
            }
            if (this.getEnableNetworkIsolation() != null) {
                data.set("enableNetworkIsolation", om.valueToTree(this.getEnableNetworkIsolation()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionNetworkConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionNetworkConfig.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionNetworkConfig.Jsii$Proxy) o;

            if (this.enableInterContainerTrafficEncryption != null ? !this.enableInterContainerTrafficEncryption.equals(that.enableInterContainerTrafficEncryption) : that.enableInterContainerTrafficEncryption != null) return false;
            if (this.enableNetworkIsolation != null ? !this.enableNetworkIsolation.equals(that.enableNetworkIsolation) : that.enableNetworkIsolation != null) return false;
            return this.vpcConfig != null ? this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableInterContainerTrafficEncryption != null ? this.enableInterContainerTrafficEncryption.hashCode() : 0;
            result = 31 * result + (this.enableNetworkIsolation != null ? this.enableNetworkIsolation.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
            return result;
        }
    }
}
