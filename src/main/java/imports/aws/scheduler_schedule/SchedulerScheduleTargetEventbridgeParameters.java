package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetEventbridgeParameters")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleTargetEventbridgeParameters.Jsii$Proxy.class)
public interface SchedulerScheduleTargetEventbridgeParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#detail_type SchedulerSchedule#detail_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDetailType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#source SchedulerSchedule#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleTargetEventbridgeParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleTargetEventbridgeParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleTargetEventbridgeParameters> {
        java.lang.String detailType;
        java.lang.String source;

        /**
         * Sets the value of {@link SchedulerScheduleTargetEventbridgeParameters#getDetailType}
         * @param detailType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#detail_type SchedulerSchedule#detail_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder detailType(java.lang.String detailType) {
            this.detailType = detailType;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTargetEventbridgeParameters#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#source SchedulerSchedule#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleTargetEventbridgeParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleTargetEventbridgeParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleTargetEventbridgeParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleTargetEventbridgeParameters {
        private final java.lang.String detailType;
        private final java.lang.String source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.detailType = software.amazon.jsii.Kernel.get(this, "detailType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.detailType = java.util.Objects.requireNonNull(builder.detailType, "detailType is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
        }

        @Override
        public final java.lang.String getDetailType() {
            return this.detailType;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("detailType", om.valueToTree(this.getDetailType()));
            data.set("source", om.valueToTree(this.getSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleTargetEventbridgeParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleTargetEventbridgeParameters.Jsii$Proxy that = (SchedulerScheduleTargetEventbridgeParameters.Jsii$Proxy) o;

            if (!detailType.equals(that.detailType)) return false;
            return this.source.equals(that.source);
        }

        @Override
        public final int hashCode() {
            int result = this.detailType.hashCode();
            result = 31 * result + (this.source.hashCode());
            return result;
        }
    }
}
