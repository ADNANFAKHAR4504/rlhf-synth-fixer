package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration.Jsii$Proxy.class)
public interface FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_group_arn FisExperimentTemplate#log_group_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogGroupArn();

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration> {
        java.lang.String logGroupArn;

        /**
         * Sets the value of {@link FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration#getLogGroupArn}
         * @param logGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_group_arn FisExperimentTemplate#log_group_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder logGroupArn(java.lang.String logGroupArn) {
            this.logGroupArn = logGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration {
        private final java.lang.String logGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logGroupArn = software.amazon.jsii.Kernel.get(this, "logGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logGroupArn = java.util.Objects.requireNonNull(builder.logGroupArn, "logGroupArn is required");
        }

        @Override
        public final java.lang.String getLogGroupArn() {
            return this.logGroupArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logGroupArn", om.valueToTree(this.getLogGroupArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration.Jsii$Proxy that = (FisExperimentTemplateLogConfigurationCloudwatchLogsConfiguration.Jsii$Proxy) o;

            return this.logGroupArn.equals(that.logGroupArn);
        }

        @Override
        public final int hashCode() {
            int result = this.logGroupArn.hashCode();
            return result;
        }
    }
}
