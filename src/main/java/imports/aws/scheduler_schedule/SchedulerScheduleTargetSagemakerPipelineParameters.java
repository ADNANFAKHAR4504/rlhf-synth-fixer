package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetSagemakerPipelineParameters")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleTargetSagemakerPipelineParameters.Jsii$Proxy.class)
public interface SchedulerScheduleTargetSagemakerPipelineParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * pipeline_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#pipeline_parameter SchedulerSchedule#pipeline_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPipelineParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleTargetSagemakerPipelineParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleTargetSagemakerPipelineParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleTargetSagemakerPipelineParameters> {
        java.lang.Object pipelineParameter;

        /**
         * Sets the value of {@link SchedulerScheduleTargetSagemakerPipelineParameters#getPipelineParameter}
         * @param pipelineParameter pipeline_parameter block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#pipeline_parameter SchedulerSchedule#pipeline_parameter}
         * @return {@code this}
         */
        public Builder pipelineParameter(com.hashicorp.cdktf.IResolvable pipelineParameter) {
            this.pipelineParameter = pipelineParameter;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTargetSagemakerPipelineParameters#getPipelineParameter}
         * @param pipelineParameter pipeline_parameter block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#pipeline_parameter SchedulerSchedule#pipeline_parameter}
         * @return {@code this}
         */
        public Builder pipelineParameter(java.util.List<? extends imports.aws.scheduler_schedule.SchedulerScheduleTargetSagemakerPipelineParametersPipelineParameter> pipelineParameter) {
            this.pipelineParameter = pipelineParameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleTargetSagemakerPipelineParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleTargetSagemakerPipelineParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleTargetSagemakerPipelineParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleTargetSagemakerPipelineParameters {
        private final java.lang.Object pipelineParameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.pipelineParameter = software.amazon.jsii.Kernel.get(this, "pipelineParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.pipelineParameter = builder.pipelineParameter;
        }

        @Override
        public final java.lang.Object getPipelineParameter() {
            return this.pipelineParameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPipelineParameter() != null) {
                data.set("pipelineParameter", om.valueToTree(this.getPipelineParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleTargetSagemakerPipelineParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleTargetSagemakerPipelineParameters.Jsii$Proxy that = (SchedulerScheduleTargetSagemakerPipelineParameters.Jsii$Proxy) o;

            return this.pipelineParameter != null ? this.pipelineParameter.equals(that.pipelineParameter) : that.pipelineParameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.pipelineParameter != null ? this.pipelineParameter.hashCode() : 0;
            return result;
        }
    }
}
