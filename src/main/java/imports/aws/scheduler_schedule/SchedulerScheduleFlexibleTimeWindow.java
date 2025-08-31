package imports.aws.scheduler_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.schedulerSchedule.SchedulerScheduleFlexibleTimeWindow")
@software.amazon.jsii.Jsii.Proxy(SchedulerScheduleFlexibleTimeWindow.Jsii$Proxy.class)
public interface SchedulerScheduleFlexibleTimeWindow extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#mode SchedulerSchedule#mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_window_in_minutes SchedulerSchedule#maximum_window_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumWindowInMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SchedulerScheduleFlexibleTimeWindow}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SchedulerScheduleFlexibleTimeWindow}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SchedulerScheduleFlexibleTimeWindow> {
        java.lang.String mode;
        java.lang.Number maximumWindowInMinutes;

        /**
         * Sets the value of {@link SchedulerScheduleFlexibleTimeWindow#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#mode SchedulerSchedule#mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link SchedulerScheduleFlexibleTimeWindow#getMaximumWindowInMinutes}
         * @param maximumWindowInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/scheduler_schedule#maximum_window_in_minutes SchedulerSchedule#maximum_window_in_minutes}.
         * @return {@code this}
         */
        public Builder maximumWindowInMinutes(java.lang.Number maximumWindowInMinutes) {
            this.maximumWindowInMinutes = maximumWindowInMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SchedulerScheduleFlexibleTimeWindow}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SchedulerScheduleFlexibleTimeWindow build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SchedulerScheduleFlexibleTimeWindow}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SchedulerScheduleFlexibleTimeWindow {
        private final java.lang.String mode;
        private final java.lang.Number maximumWindowInMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumWindowInMinutes = software.amazon.jsii.Kernel.get(this, "maximumWindowInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mode = java.util.Objects.requireNonNull(builder.mode, "mode is required");
            this.maximumWindowInMinutes = builder.maximumWindowInMinutes;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.lang.Number getMaximumWindowInMinutes() {
            return this.maximumWindowInMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mode", om.valueToTree(this.getMode()));
            if (this.getMaximumWindowInMinutes() != null) {
                data.set("maximumWindowInMinutes", om.valueToTree(this.getMaximumWindowInMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.schedulerSchedule.SchedulerScheduleFlexibleTimeWindow"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SchedulerScheduleFlexibleTimeWindow.Jsii$Proxy that = (SchedulerScheduleFlexibleTimeWindow.Jsii$Proxy) o;

            if (!mode.equals(that.mode)) return false;
            return this.maximumWindowInMinutes != null ? this.maximumWindowInMinutes.equals(that.maximumWindowInMinutes) : that.maximumWindowInMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mode.hashCode();
            result = 31 * result + (this.maximumWindowInMinutes != null ? this.maximumWindowInMinutes.hashCode() : 0);
            return result;
        }
    }
}
