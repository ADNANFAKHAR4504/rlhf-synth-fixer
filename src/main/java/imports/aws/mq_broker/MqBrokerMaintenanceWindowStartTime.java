package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerMaintenanceWindowStartTime")
@software.amazon.jsii.Jsii.Proxy(MqBrokerMaintenanceWindowStartTime.Jsii$Proxy.class)
public interface MqBrokerMaintenanceWindowStartTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#day_of_week MqBroker#day_of_week}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDayOfWeek();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#time_of_day MqBroker#time_of_day}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTimeOfDay();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#time_zone MqBroker#time_zone}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTimeZone();

    /**
     * @return a {@link Builder} of {@link MqBrokerMaintenanceWindowStartTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerMaintenanceWindowStartTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerMaintenanceWindowStartTime> {
        java.lang.String dayOfWeek;
        java.lang.String timeOfDay;
        java.lang.String timeZone;

        /**
         * Sets the value of {@link MqBrokerMaintenanceWindowStartTime#getDayOfWeek}
         * @param dayOfWeek Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#day_of_week MqBroker#day_of_week}. This parameter is required.
         * @return {@code this}
         */
        public Builder dayOfWeek(java.lang.String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerMaintenanceWindowStartTime#getTimeOfDay}
         * @param timeOfDay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#time_of_day MqBroker#time_of_day}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeOfDay(java.lang.String timeOfDay) {
            this.timeOfDay = timeOfDay;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerMaintenanceWindowStartTime#getTimeZone}
         * @param timeZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#time_zone MqBroker#time_zone}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeZone(java.lang.String timeZone) {
            this.timeZone = timeZone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MqBrokerMaintenanceWindowStartTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerMaintenanceWindowStartTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerMaintenanceWindowStartTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerMaintenanceWindowStartTime {
        private final java.lang.String dayOfWeek;
        private final java.lang.String timeOfDay;
        private final java.lang.String timeZone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dayOfWeek = software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeOfDay = software.amazon.jsii.Kernel.get(this, "timeOfDay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeZone = software.amazon.jsii.Kernel.get(this, "timeZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dayOfWeek = java.util.Objects.requireNonNull(builder.dayOfWeek, "dayOfWeek is required");
            this.timeOfDay = java.util.Objects.requireNonNull(builder.timeOfDay, "timeOfDay is required");
            this.timeZone = java.util.Objects.requireNonNull(builder.timeZone, "timeZone is required");
        }

        @Override
        public final java.lang.String getDayOfWeek() {
            return this.dayOfWeek;
        }

        @Override
        public final java.lang.String getTimeOfDay() {
            return this.timeOfDay;
        }

        @Override
        public final java.lang.String getTimeZone() {
            return this.timeZone;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dayOfWeek", om.valueToTree(this.getDayOfWeek()));
            data.set("timeOfDay", om.valueToTree(this.getTimeOfDay()));
            data.set("timeZone", om.valueToTree(this.getTimeZone()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerMaintenanceWindowStartTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerMaintenanceWindowStartTime.Jsii$Proxy that = (MqBrokerMaintenanceWindowStartTime.Jsii$Proxy) o;

            if (!dayOfWeek.equals(that.dayOfWeek)) return false;
            if (!timeOfDay.equals(that.timeOfDay)) return false;
            return this.timeZone.equals(that.timeZone);
        }

        @Override
        public final int hashCode() {
            int result = this.dayOfWeek.hashCode();
            result = 31 * result + (this.timeOfDay.hashCode());
            result = 31 * result + (this.timeZone.hashCode());
            return result;
        }
    }
}
