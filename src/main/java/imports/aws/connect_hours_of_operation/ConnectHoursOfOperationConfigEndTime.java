package imports.aws.connect_hours_of_operation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.384Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectHoursOfOperation.ConnectHoursOfOperationConfigEndTime")
@software.amazon.jsii.Jsii.Proxy(ConnectHoursOfOperationConfigEndTime.Jsii$Proxy.class)
public interface ConnectHoursOfOperationConfigEndTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#hours ConnectHoursOfOperation#hours}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHours();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#minutes ConnectHoursOfOperation#minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinutes();

    /**
     * @return a {@link Builder} of {@link ConnectHoursOfOperationConfigEndTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectHoursOfOperationConfigEndTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectHoursOfOperationConfigEndTime> {
        java.lang.Number hours;
        java.lang.Number minutes;

        /**
         * Sets the value of {@link ConnectHoursOfOperationConfigEndTime#getHours}
         * @param hours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#hours ConnectHoursOfOperation#hours}. This parameter is required.
         * @return {@code this}
         */
        public Builder hours(java.lang.Number hours) {
            this.hours = hours;
            return this;
        }

        /**
         * Sets the value of {@link ConnectHoursOfOperationConfigEndTime#getMinutes}
         * @param minutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#minutes ConnectHoursOfOperation#minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder minutes(java.lang.Number minutes) {
            this.minutes = minutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectHoursOfOperationConfigEndTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectHoursOfOperationConfigEndTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectHoursOfOperationConfigEndTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectHoursOfOperationConfigEndTime {
        private final java.lang.Number hours;
        private final java.lang.Number minutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hours = software.amazon.jsii.Kernel.get(this, "hours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minutes = software.amazon.jsii.Kernel.get(this, "minutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hours = java.util.Objects.requireNonNull(builder.hours, "hours is required");
            this.minutes = java.util.Objects.requireNonNull(builder.minutes, "minutes is required");
        }

        @Override
        public final java.lang.Number getHours() {
            return this.hours;
        }

        @Override
        public final java.lang.Number getMinutes() {
            return this.minutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hours", om.valueToTree(this.getHours()));
            data.set("minutes", om.valueToTree(this.getMinutes()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectHoursOfOperation.ConnectHoursOfOperationConfigEndTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectHoursOfOperationConfigEndTime.Jsii$Proxy that = (ConnectHoursOfOperationConfigEndTime.Jsii$Proxy) o;

            if (!hours.equals(that.hours)) return false;
            return this.minutes.equals(that.minutes);
        }

        @Override
        public final int hashCode() {
            int result = this.hours.hashCode();
            result = 31 * result + (this.minutes.hashCode());
            return result;
        }
    }
}
