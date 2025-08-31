package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettings")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrenceMonthlySettings.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrenceMonthlySettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_month SsmcontactsRotation#day_of_month}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDayOfMonth();

    /**
     * hand_off_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHandOffTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrenceMonthlySettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrenceMonthlySettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrenceMonthlySettings> {
        java.lang.Number dayOfMonth;
        java.lang.Object handOffTime;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceMonthlySettings#getDayOfMonth}
         * @param dayOfMonth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_month SsmcontactsRotation#day_of_month}. This parameter is required.
         * @return {@code this}
         */
        public Builder dayOfMonth(java.lang.Number dayOfMonth) {
            this.dayOfMonth = dayOfMonth;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceMonthlySettings#getHandOffTime}
         * @param handOffTime hand_off_time block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
         * @return {@code this}
         */
        public Builder handOffTime(com.hashicorp.cdktf.IResolvable handOffTime) {
            this.handOffTime = handOffTime;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceMonthlySettings#getHandOffTime}
         * @param handOffTime hand_off_time block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
         * @return {@code this}
         */
        public Builder handOffTime(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime> handOffTime) {
            this.handOffTime = handOffTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrenceMonthlySettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrenceMonthlySettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrenceMonthlySettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrenceMonthlySettings {
        private final java.lang.Number dayOfMonth;
        private final java.lang.Object handOffTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dayOfMonth = software.amazon.jsii.Kernel.get(this, "dayOfMonth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.handOffTime = software.amazon.jsii.Kernel.get(this, "handOffTime", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dayOfMonth = java.util.Objects.requireNonNull(builder.dayOfMonth, "dayOfMonth is required");
            this.handOffTime = builder.handOffTime;
        }

        @Override
        public final java.lang.Number getDayOfMonth() {
            return this.dayOfMonth;
        }

        @Override
        public final java.lang.Object getHandOffTime() {
            return this.handOffTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dayOfMonth", om.valueToTree(this.getDayOfMonth()));
            if (this.getHandOffTime() != null) {
                data.set("handOffTime", om.valueToTree(this.getHandOffTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrenceMonthlySettings.Jsii$Proxy that = (SsmcontactsRotationRecurrenceMonthlySettings.Jsii$Proxy) o;

            if (!dayOfMonth.equals(that.dayOfMonth)) return false;
            return this.handOffTime != null ? this.handOffTime.equals(that.handOffTime) : that.handOffTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dayOfMonth.hashCode();
            result = 31 * result + (this.handOffTime != null ? this.handOffTime.hashCode() : 0);
            return result;
        }
    }
}
