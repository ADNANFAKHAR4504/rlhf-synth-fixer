package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityBaselineConfig.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityBaselineConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * constraints_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#constraints_resource SagemakerDataQualityJobDefinition#constraints_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource getConstraintsResource() {
        return null;
    }

    /**
     * statistics_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#statistics_resource SagemakerDataQualityJobDefinition#statistics_resource}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource getStatisticsResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityBaselineConfig> {
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource constraintsResource;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource statisticsResource;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig#getConstraintsResource}
         * @param constraintsResource constraints_resource block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#constraints_resource SagemakerDataQualityJobDefinition#constraints_resource}
         * @return {@code this}
         */
        public Builder constraintsResource(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource constraintsResource) {
            this.constraintsResource = constraintsResource;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig#getStatisticsResource}
         * @param statisticsResource statistics_resource block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#statistics_resource SagemakerDataQualityJobDefinition#statistics_resource}
         * @return {@code this}
         */
        public Builder statisticsResource(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource statisticsResource) {
            this.statisticsResource = statisticsResource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityBaselineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityBaselineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityBaselineConfig {
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource constraintsResource;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource statisticsResource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.constraintsResource = software.amazon.jsii.Kernel.get(this, "constraintsResource", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource.class));
            this.statisticsResource = software.amazon.jsii.Kernel.get(this, "statisticsResource", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.constraintsResource = builder.constraintsResource;
            this.statisticsResource = builder.statisticsResource;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigConstraintsResource getConstraintsResource() {
            return this.constraintsResource;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfigStatisticsResource getStatisticsResource() {
            return this.statisticsResource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConstraintsResource() != null) {
                data.set("constraintsResource", om.valueToTree(this.getConstraintsResource()));
            }
            if (this.getStatisticsResource() != null) {
                data.set("statisticsResource", om.valueToTree(this.getStatisticsResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityBaselineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityBaselineConfig.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityBaselineConfig.Jsii$Proxy) o;

            if (this.constraintsResource != null ? !this.constraintsResource.equals(that.constraintsResource) : that.constraintsResource != null) return false;
            return this.statisticsResource != null ? this.statisticsResource.equals(that.statisticsResource) : that.statisticsResource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.constraintsResource != null ? this.constraintsResource.hashCode() : 0;
            result = 31 * result + (this.statisticsResource != null ? this.statisticsResource.hashCode() : 0);
            return result;
        }
    }
}
