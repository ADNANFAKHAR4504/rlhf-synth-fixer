package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard.Jsii$Proxy.class)
public interface FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#dashboard_arn FisExperimentTemplate#dashboard_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDashboardArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard> {
        java.lang.String dashboardArn;

        /**
         * Sets the value of {@link FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard#getDashboardArn}
         * @param dashboardArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#dashboard_arn FisExperimentTemplate#dashboard_arn}.
         * @return {@code this}
         */
        public Builder dashboardArn(java.lang.String dashboardArn) {
            this.dashboardArn = dashboardArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard {
        private final java.lang.String dashboardArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dashboardArn = software.amazon.jsii.Kernel.get(this, "dashboardArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dashboardArn = builder.dashboardArn;
        }

        @Override
        public final java.lang.String getDashboardArn() {
            return this.dashboardArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDashboardArn() != null) {
                data.set("dashboardArn", om.valueToTree(this.getDashboardArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard.Jsii$Proxy that = (FisExperimentTemplateExperimentReportConfigurationDataSourcesCloudwatchDashboard.Jsii$Proxy) o;

            return this.dashboardArn != null ? this.dashboardArn.equals(that.dashboardArn) : that.dashboardArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dashboardArn != null ? this.dashboardArn.hashCode() : 0;
            return result;
        }
    }
}
