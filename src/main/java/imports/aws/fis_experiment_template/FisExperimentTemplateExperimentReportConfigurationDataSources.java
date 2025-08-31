package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSources")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateExperimentReportConfigurationDataSources.Jsii$Proxy.class)
public interface FisExperimentTemplateExperimentReportConfigurationDataSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_dashboard block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchDashboard() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateExperimentReportConfigurationDataSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateExperimentReportConfigurationDataSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateExperimentReportConfigurationDataSources> {
        java.lang.Object cloudwatchDashboard;

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfigurationDataSources#getCloudwatchDashboard}
         * @param cloudwatchDashboard cloudwatch_dashboard block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
         * @return {@code this}
         */
        public Builder cloudwatchDashboard(com.hashicorp.cdktf.IResolvable cloudwatchDashboard) {
            this.cloudwatchDashboard = cloudwatchDashboard;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfigurationDataSources#getCloudwatchDashboard}
         * @param cloudwatchDashboard cloudwatch_dashboard block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#cloudwatch_dashboard FisExperimentTemplate#cloudwatch_dashboard}
         * @return {@code this}
         */
        public Builder cloudwatchDashboard(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard> cloudwatchDashboard) {
            this.cloudwatchDashboard = cloudwatchDashboard;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateExperimentReportConfigurationDataSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateExperimentReportConfigurationDataSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateExperimentReportConfigurationDataSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateExperimentReportConfigurationDataSources {
        private final java.lang.Object cloudwatchDashboard;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchDashboard = software.amazon.jsii.Kernel.get(this, "cloudwatchDashboard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchDashboard = builder.cloudwatchDashboard;
        }

        @Override
        public final java.lang.Object getCloudwatchDashboard() {
            return this.cloudwatchDashboard;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchDashboard() != null) {
                data.set("cloudwatchDashboard", om.valueToTree(this.getCloudwatchDashboard()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateExperimentReportConfigurationDataSources.Jsii$Proxy that = (FisExperimentTemplateExperimentReportConfigurationDataSources.Jsii$Proxy) o;

            return this.cloudwatchDashboard != null ? this.cloudwatchDashboard.equals(that.cloudwatchDashboard) : that.cloudwatchDashboard == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchDashboard != null ? this.cloudwatchDashboard.hashCode() : 0;
            return result;
        }
    }
}
