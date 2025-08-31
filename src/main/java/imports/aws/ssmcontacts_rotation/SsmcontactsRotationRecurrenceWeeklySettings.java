package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.515Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettings")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrenceWeeklySettings.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrenceWeeklySettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_week SsmcontactsRotation#day_of_week}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDayOfWeek();

    /**
     * hand_off_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHandOffTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrenceWeeklySettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrenceWeeklySettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrenceWeeklySettings> {
        java.lang.String dayOfWeek;
        java.lang.Object handOffTime;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceWeeklySettings#getDayOfWeek}
         * @param dayOfWeek Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_week SsmcontactsRotation#day_of_week}. This parameter is required.
         * @return {@code this}
         */
        public Builder dayOfWeek(java.lang.String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceWeeklySettings#getHandOffTime}
         * @param handOffTime hand_off_time block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
         * @return {@code this}
         */
        public Builder handOffTime(com.hashicorp.cdktf.IResolvable handOffTime) {
            this.handOffTime = handOffTime;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceWeeklySettings#getHandOffTime}
         * @param handOffTime hand_off_time block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
         * @return {@code this}
         */
        public Builder handOffTime(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime> handOffTime) {
            this.handOffTime = handOffTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrenceWeeklySettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrenceWeeklySettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrenceWeeklySettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrenceWeeklySettings {
        private final java.lang.String dayOfWeek;
        private final java.lang.Object handOffTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dayOfWeek = software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.handOffTime = software.amazon.jsii.Kernel.get(this, "handOffTime", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dayOfWeek = java.util.Objects.requireNonNull(builder.dayOfWeek, "dayOfWeek is required");
            this.handOffTime = builder.handOffTime;
        }

        @Override
        public final java.lang.String getDayOfWeek() {
            return this.dayOfWeek;
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

            data.set("dayOfWeek", om.valueToTree(this.getDayOfWeek()));
            if (this.getHandOffTime() != null) {
                data.set("handOffTime", om.valueToTree(this.getHandOffTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrenceWeeklySettings.Jsii$Proxy that = (SsmcontactsRotationRecurrenceWeeklySettings.Jsii$Proxy) o;

            if (!dayOfWeek.equals(that.dayOfWeek)) return false;
            return this.handOffTime != null ? this.handOffTime.equals(that.handOffTime) : that.handOffTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dayOfWeek.hashCode();
            result = 31 * result + (this.handOffTime != null ? this.handOffTime.hashCode() : 0);
            return result;
        }
    }
}
