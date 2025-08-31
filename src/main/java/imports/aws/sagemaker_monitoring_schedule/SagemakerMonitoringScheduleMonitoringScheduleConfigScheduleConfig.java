package imports.aws.sagemaker_monitoring_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.334Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerMonitoringSchedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig.Jsii$Proxy.class)
public interface SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#schedule_expression SagemakerMonitoringSchedule#schedule_expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression();

    /**
     * @return a {@link Builder} of {@link SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig> {
        java.lang.String scheduleExpression;

        /**
         * Sets the value of {@link SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#schedule_expression SagemakerMonitoringSchedule#schedule_expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig {
        private final java.lang.String scheduleExpression;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.scheduleExpression = java.util.Objects.requireNonNull(builder.scheduleExpression, "scheduleExpression is required");
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerMonitoringSchedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig.Jsii$Proxy that = (SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig.Jsii$Proxy) o;

            return this.scheduleExpression.equals(that.scheduleExpression);
        }

        @Override
        public final int hashCode() {
            int result = this.scheduleExpression.hashCode();
            return result;
        }
    }
}
