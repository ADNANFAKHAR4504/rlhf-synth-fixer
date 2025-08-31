package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResources")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionJobResources.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionJobResources extends software.amazon.jsii.JsiiSerializable {

    /**
     * cluster_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#cluster_config SagemakerDataQualityJobDefinition#cluster_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig getClusterConfig();

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionJobResources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionJobResources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionJobResources> {
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig clusterConfig;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionJobResources#getClusterConfig}
         * @param clusterConfig cluster_config block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#cluster_config SagemakerDataQualityJobDefinition#cluster_config}
         * @return {@code this}
         */
        public Builder clusterConfig(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig clusterConfig) {
            this.clusterConfig = clusterConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionJobResources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionJobResources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionJobResources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionJobResources {
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig clusterConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterConfig = software.amazon.jsii.Kernel.get(this, "clusterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterConfig = java.util.Objects.requireNonNull(builder.clusterConfig, "clusterConfig is required");
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionJobResourcesClusterConfig getClusterConfig() {
            return this.clusterConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterConfig", om.valueToTree(this.getClusterConfig()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionJobResources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionJobResources.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionJobResources.Jsii$Proxy) o;

            return this.clusterConfig.equals(that.clusterConfig);
        }

        @Override
        public final int hashCode() {
            int result = this.clusterConfig.hashCode();
            return result;
        }
    }
}
