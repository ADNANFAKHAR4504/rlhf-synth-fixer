package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHourOfDay();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinuteOfHour();

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime> {
        java.lang.Number hourOfDay;
        java.lang.Number minuteOfHour;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime#getHourOfDay}
         * @param hourOfDay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}. This parameter is required.
         * @return {@code this}
         */
        public Builder hourOfDay(java.lang.Number hourOfDay) {
            this.hourOfDay = hourOfDay;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime#getMinuteOfHour}
         * @param minuteOfHour Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}. This parameter is required.
         * @return {@code this}
         */
        public Builder minuteOfHour(java.lang.Number minuteOfHour) {
            this.minuteOfHour = minuteOfHour;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime {
        private final java.lang.Number hourOfDay;
        private final java.lang.Number minuteOfHour;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hourOfDay = software.amazon.jsii.Kernel.get(this, "hourOfDay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minuteOfHour = software.amazon.jsii.Kernel.get(this, "minuteOfHour", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hourOfDay = java.util.Objects.requireNonNull(builder.hourOfDay, "hourOfDay is required");
            this.minuteOfHour = java.util.Objects.requireNonNull(builder.minuteOfHour, "minuteOfHour is required");
        }

        @Override
        public final java.lang.Number getHourOfDay() {
            return this.hourOfDay;
        }

        @Override
        public final java.lang.Number getMinuteOfHour() {
            return this.minuteOfHour;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hourOfDay", om.valueToTree(this.getHourOfDay()));
            data.set("minuteOfHour", om.valueToTree(this.getMinuteOfHour()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime.Jsii$Proxy that = (SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime.Jsii$Proxy) o;

            if (!hourOfDay.equals(that.hourOfDay)) return false;
            return this.minuteOfHour.equals(that.minuteOfHour);
        }

        @Override
        public final int hashCode() {
            int result = this.hourOfDay.hashCode();
            result = 31 * result + (this.minuteOfHour.hashCode());
            return result;
        }
    }
}
