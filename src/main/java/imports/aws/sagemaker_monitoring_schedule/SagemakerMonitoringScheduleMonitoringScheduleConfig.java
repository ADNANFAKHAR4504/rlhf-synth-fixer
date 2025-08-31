package imports.aws.sagemaker_monitoring_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.334Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerMonitoringSchedule.SagemakerMonitoringScheduleMonitoringScheduleConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerMonitoringScheduleMonitoringScheduleConfig.Jsii$Proxy.class)
public interface SagemakerMonitoringScheduleMonitoringScheduleConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#monitoring_job_definition_name SagemakerMonitoringSchedule#monitoring_job_definition_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMonitoringJobDefinitionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#monitoring_type SagemakerMonitoringSchedule#monitoring_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMonitoringType();

    /**
     * schedule_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#schedule_config SagemakerMonitoringSchedule#schedule_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig getScheduleConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerMonitoringScheduleMonitoringScheduleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerMonitoringScheduleMonitoringScheduleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerMonitoringScheduleMonitoringScheduleConfig> {
        java.lang.String monitoringJobDefinitionName;
        java.lang.String monitoringType;
        imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig scheduleConfig;

        /**
         * Sets the value of {@link SagemakerMonitoringScheduleMonitoringScheduleConfig#getMonitoringJobDefinitionName}
         * @param monitoringJobDefinitionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#monitoring_job_definition_name SagemakerMonitoringSchedule#monitoring_job_definition_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder monitoringJobDefinitionName(java.lang.String monitoringJobDefinitionName) {
            this.monitoringJobDefinitionName = monitoringJobDefinitionName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerMonitoringScheduleMonitoringScheduleConfig#getMonitoringType}
         * @param monitoringType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#monitoring_type SagemakerMonitoringSchedule#monitoring_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder monitoringType(java.lang.String monitoringType) {
            this.monitoringType = monitoringType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerMonitoringScheduleMonitoringScheduleConfig#getScheduleConfig}
         * @param scheduleConfig schedule_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_monitoring_schedule#schedule_config SagemakerMonitoringSchedule#schedule_config}
         * @return {@code this}
         */
        public Builder scheduleConfig(imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig scheduleConfig) {
            this.scheduleConfig = scheduleConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerMonitoringScheduleMonitoringScheduleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerMonitoringScheduleMonitoringScheduleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerMonitoringScheduleMonitoringScheduleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerMonitoringScheduleMonitoringScheduleConfig {
        private final java.lang.String monitoringJobDefinitionName;
        private final java.lang.String monitoringType;
        private final imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig scheduleConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.monitoringJobDefinitionName = software.amazon.jsii.Kernel.get(this, "monitoringJobDefinitionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.monitoringType = software.amazon.jsii.Kernel.get(this, "monitoringType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleConfig = software.amazon.jsii.Kernel.get(this, "scheduleConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.monitoringJobDefinitionName = java.util.Objects.requireNonNull(builder.monitoringJobDefinitionName, "monitoringJobDefinitionName is required");
            this.monitoringType = java.util.Objects.requireNonNull(builder.monitoringType, "monitoringType is required");
            this.scheduleConfig = builder.scheduleConfig;
        }

        @Override
        public final java.lang.String getMonitoringJobDefinitionName() {
            return this.monitoringJobDefinitionName;
        }

        @Override
        public final java.lang.String getMonitoringType() {
            return this.monitoringType;
        }

        @Override
        public final imports.aws.sagemaker_monitoring_schedule.SagemakerMonitoringScheduleMonitoringScheduleConfigScheduleConfig getScheduleConfig() {
            return this.scheduleConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("monitoringJobDefinitionName", om.valueToTree(this.getMonitoringJobDefinitionName()));
            data.set("monitoringType", om.valueToTree(this.getMonitoringType()));
            if (this.getScheduleConfig() != null) {
                data.set("scheduleConfig", om.valueToTree(this.getScheduleConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerMonitoringSchedule.SagemakerMonitoringScheduleMonitoringScheduleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerMonitoringScheduleMonitoringScheduleConfig.Jsii$Proxy that = (SagemakerMonitoringScheduleMonitoringScheduleConfig.Jsii$Proxy) o;

            if (!monitoringJobDefinitionName.equals(that.monitoringJobDefinitionName)) return false;
            if (!monitoringType.equals(that.monitoringType)) return false;
            return this.scheduleConfig != null ? this.scheduleConfig.equals(that.scheduleConfig) : that.scheduleConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.monitoringJobDefinitionName.hashCode();
            result = 31 * result + (this.monitoringType.hashCode());
            result = 31 * result + (this.scheduleConfig != null ? this.scheduleConfig.hashCode() : 0);
            return result;
        }
    }
}
