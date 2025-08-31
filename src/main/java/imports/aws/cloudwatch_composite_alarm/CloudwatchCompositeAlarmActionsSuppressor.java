package imports.aws.cloudwatch_composite_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarmActionsSuppressor")
@software.amazon.jsii.Jsii.Proxy(CloudwatchCompositeAlarmActionsSuppressor.Jsii$Proxy.class)
public interface CloudwatchCompositeAlarmActionsSuppressor extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm CloudwatchCompositeAlarm#alarm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#extension_period CloudwatchCompositeAlarm#extension_period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getExtensionPeriod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#wait_period CloudwatchCompositeAlarm#wait_period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWaitPeriod();

    /**
     * @return a {@link Builder} of {@link CloudwatchCompositeAlarmActionsSuppressor}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchCompositeAlarmActionsSuppressor}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchCompositeAlarmActionsSuppressor> {
        java.lang.String alarm;
        java.lang.Number extensionPeriod;
        java.lang.Number waitPeriod;

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmActionsSuppressor#getAlarm}
         * @param alarm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#alarm CloudwatchCompositeAlarm#alarm}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarm(java.lang.String alarm) {
            this.alarm = alarm;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmActionsSuppressor#getExtensionPeriod}
         * @param extensionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#extension_period CloudwatchCompositeAlarm#extension_period}. This parameter is required.
         * @return {@code this}
         */
        public Builder extensionPeriod(java.lang.Number extensionPeriod) {
            this.extensionPeriod = extensionPeriod;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchCompositeAlarmActionsSuppressor#getWaitPeriod}
         * @param waitPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_composite_alarm#wait_period CloudwatchCompositeAlarm#wait_period}. This parameter is required.
         * @return {@code this}
         */
        public Builder waitPeriod(java.lang.Number waitPeriod) {
            this.waitPeriod = waitPeriod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchCompositeAlarmActionsSuppressor}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchCompositeAlarmActionsSuppressor build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchCompositeAlarmActionsSuppressor}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchCompositeAlarmActionsSuppressor {
        private final java.lang.String alarm;
        private final java.lang.Number extensionPeriod;
        private final java.lang.Number waitPeriod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarm = software.amazon.jsii.Kernel.get(this, "alarm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.extensionPeriod = software.amazon.jsii.Kernel.get(this, "extensionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.waitPeriod = software.amazon.jsii.Kernel.get(this, "waitPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarm = java.util.Objects.requireNonNull(builder.alarm, "alarm is required");
            this.extensionPeriod = java.util.Objects.requireNonNull(builder.extensionPeriod, "extensionPeriod is required");
            this.waitPeriod = java.util.Objects.requireNonNull(builder.waitPeriod, "waitPeriod is required");
        }

        @Override
        public final java.lang.String getAlarm() {
            return this.alarm;
        }

        @Override
        public final java.lang.Number getExtensionPeriod() {
            return this.extensionPeriod;
        }

        @Override
        public final java.lang.Number getWaitPeriod() {
            return this.waitPeriod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alarm", om.valueToTree(this.getAlarm()));
            data.set("extensionPeriod", om.valueToTree(this.getExtensionPeriod()));
            data.set("waitPeriod", om.valueToTree(this.getWaitPeriod()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchCompositeAlarm.CloudwatchCompositeAlarmActionsSuppressor"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchCompositeAlarmActionsSuppressor.Jsii$Proxy that = (CloudwatchCompositeAlarmActionsSuppressor.Jsii$Proxy) o;

            if (!alarm.equals(that.alarm)) return false;
            if (!extensionPeriod.equals(that.extensionPeriod)) return false;
            return this.waitPeriod.equals(that.waitPeriod);
        }

        @Override
        public final int hashCode() {
            int result = this.alarm.hashCode();
            result = 31 * result + (this.extensionPeriod.hashCode());
            result = 31 * result + (this.waitPeriod.hashCode());
            return result;
        }
    }
}
