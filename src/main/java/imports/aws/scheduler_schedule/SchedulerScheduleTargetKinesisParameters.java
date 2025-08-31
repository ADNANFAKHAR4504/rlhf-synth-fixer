package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetKinesisParameters")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleTargetKinesisParameters.Jsii$Proxy.class)
public interface SchedulerScheduleTargetKinesisParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#partition_key SchedulerSchedule#partition_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPartitionKey();

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleTargetKinesisParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleTargetKinesisParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleTargetKinesisParameters> {
        java.lang.String partitionKey;

        /**
         * Sets the value of {@link SchedulerScheduleTargetKinesisParameters#getPartitionKey}
         * @param partitionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#partition_key SchedulerSchedule#partition_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder partitionKey(java.lang.String partitionKey) {
            this.partitionKey = partitionKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleTargetKinesisParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleTargetKinesisParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleTargetKinesisParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleTargetKinesisParameters {
        private final java.lang.String partitionKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.partitionKey = software.amazon.jsii.Kernel.get(this, "partitionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.partitionKey = java.util.Objects.requireNonNull(builder.partitionKey, "partitionKey is required");
        }

        @Override
        public final java.lang.String getPartitionKey() {
            return this.partitionKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("partitionKey", om.valueToTree(this.getPartitionKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleTargetKinesisParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleTargetKinesisParameters.Jsii$Proxy that = (SchedulerScheduleTargetKinesisParameters.Jsii$Proxy) o;

            return this.partitionKey.equals(that.partitionKey);
        }

        @Override
        public final int hashCode() {
            int result = this.partitionKey.hashCode();
            return result;
        }
    }
}
