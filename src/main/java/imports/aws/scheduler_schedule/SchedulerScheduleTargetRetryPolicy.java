package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleTargetRetryPolicy")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleTargetRetryPolicy.Jsii$Proxy.class)
public interface SchedulerScheduleTargetRetryPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_event_age_in_seconds SchedulerSchedule#maximum_event_age_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumEventAgeInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_retry_attempts SchedulerSchedule#maximum_retry_attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRetryAttempts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleTargetRetryPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleTargetRetryPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleTargetRetryPolicy> {
        java.lang.Number maximumEventAgeInSeconds;
        java.lang.Number maximumRetryAttempts;

        /**
         * Sets the value of {@link SchedulerScheduleTargetRetryPolicy#getMaximumEventAgeInSeconds}
         * @param maximumEventAgeInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_event_age_in_seconds SchedulerSchedule#maximum_event_age_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumEventAgeInSeconds(java.lang.Number maximumEventAgeInSeconds) {
            this.maximumEventAgeInSeconds = maximumEventAgeInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleTargetRetryPolicy#getMaximumRetryAttempts}
         * @param maximumRetryAttempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_retry_attempts SchedulerSchedule#maximum_retry_attempts}.
         * @return {@code this}
         */
        public Builder maximumRetryAttempts(java.lang.Number maximumRetryAttempts) {
            this.maximumRetryAttempts = maximumRetryAttempts;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleTargetRetryPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleTargetRetryPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleTargetRetryPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleTargetRetryPolicy {
        private final java.lang.Number maximumEventAgeInSeconds;
        private final java.lang.Number maximumRetryAttempts;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumEventAgeInSeconds = software.amazon.jsii.Kernel.get(this, "maximumEventAgeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumRetryAttempts = software.amazon.jsii.Kernel.get(this, "maximumRetryAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumEventAgeInSeconds = builder.maximumEventAgeInSeconds;
            this.maximumRetryAttempts = builder.maximumRetryAttempts;
        }

        @Override
        public final java.lang.Number getMaximumEventAgeInSeconds() {
            return this.maximumEventAgeInSeconds;
        }

        @Override
        public final java.lang.Number getMaximumRetryAttempts() {
            return this.maximumRetryAttempts;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaximumEventAgeInSeconds() != null) {
                data.set("maximumEventAgeInSeconds", om.valueToTree(this.getMaximumEventAgeInSeconds()));
            }
            if (this.getMaximumRetryAttempts() != null) {
                data.set("maximumRetryAttempts", om.valueToTree(this.getMaximumRetryAttempts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleTargetRetryPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleTargetRetryPolicy.Jsii$Proxy that = (SchedulerScheduleTargetRetryPolicy.Jsii$Proxy) o;

            if (this.maximumEventAgeInSeconds != null ? !this.maximumEventAgeInSeconds.equals(that.maximumEventAgeInSeconds) : that.maximumEventAgeInSeconds != null) return false;
            return this.maximumRetryAttempts != null ? this.maximumRetryAttempts.equals(that.maximumRetryAttempts) : that.maximumRetryAttempts == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumEventAgeInSeconds != null ? this.maximumEventAgeInSeconds.hashCode() : 0;
            result = 31 * result + (this.maximumRetryAttempts != null ? this.maximumRetryAttempts.hashCode() : 0);
            return result;
        }
    }
}
