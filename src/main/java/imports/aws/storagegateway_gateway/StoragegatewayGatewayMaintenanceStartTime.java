package imports.aws.storagegateway_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGatewayMaintenanceStartTime")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayGatewayMaintenanceStartTime.Jsii$Proxy.class)
public interface StoragegatewayGatewayMaintenanceStartTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#hour_of_day StoragegatewayGateway#hour_of_day}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHourOfDay();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#day_of_month StoragegatewayGateway#day_of_month}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDayOfMonth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#day_of_week StoragegatewayGateway#day_of_week}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDayOfWeek() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#minute_of_hour StoragegatewayGateway#minute_of_hour}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinuteOfHour() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayGatewayMaintenanceStartTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayGatewayMaintenanceStartTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayGatewayMaintenanceStartTime> {
        java.lang.Number hourOfDay;
        java.lang.String dayOfMonth;
        java.lang.String dayOfWeek;
        java.lang.Number minuteOfHour;

        /**
         * Sets the value of {@link StoragegatewayGatewayMaintenanceStartTime#getHourOfDay}
         * @param hourOfDay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#hour_of_day StoragegatewayGateway#hour_of_day}. This parameter is required.
         * @return {@code this}
         */
        public Builder hourOfDay(java.lang.Number hourOfDay) {
            this.hourOfDay = hourOfDay;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayMaintenanceStartTime#getDayOfMonth}
         * @param dayOfMonth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#day_of_month StoragegatewayGateway#day_of_month}.
         * @return {@code this}
         */
        public Builder dayOfMonth(java.lang.String dayOfMonth) {
            this.dayOfMonth = dayOfMonth;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayMaintenanceStartTime#getDayOfWeek}
         * @param dayOfWeek Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#day_of_week StoragegatewayGateway#day_of_week}.
         * @return {@code this}
         */
        public Builder dayOfWeek(java.lang.String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayMaintenanceStartTime#getMinuteOfHour}
         * @param minuteOfHour Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#minute_of_hour StoragegatewayGateway#minute_of_hour}.
         * @return {@code this}
         */
        public Builder minuteOfHour(java.lang.Number minuteOfHour) {
            this.minuteOfHour = minuteOfHour;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link StoragegatewayGatewayMaintenanceStartTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayGatewayMaintenanceStartTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayGatewayMaintenanceStartTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayGatewayMaintenanceStartTime {
        private final java.lang.Number hourOfDay;
        private final java.lang.String dayOfMonth;
        private final java.lang.String dayOfWeek;
        private final java.lang.Number minuteOfHour;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hourOfDay = software.amazon.jsii.Kernel.get(this, "hourOfDay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dayOfMonth = software.amazon.jsii.Kernel.get(this, "dayOfMonth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dayOfWeek = software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minuteOfHour = software.amazon.jsii.Kernel.get(this, "minuteOfHour", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hourOfDay = java.util.Objects.requireNonNull(builder.hourOfDay, "hourOfDay is required");
            this.dayOfMonth = builder.dayOfMonth;
            this.dayOfWeek = builder.dayOfWeek;
            this.minuteOfHour = builder.minuteOfHour;
        }

        @Override
        public final java.lang.Number getHourOfDay() {
            return this.hourOfDay;
        }

        @Override
        public final java.lang.String getDayOfMonth() {
            return this.dayOfMonth;
        }

        @Override
        public final java.lang.String getDayOfWeek() {
            return this.dayOfWeek;
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
            if (this.getDayOfMonth() != null) {
                data.set("dayOfMonth", om.valueToTree(this.getDayOfMonth()));
            }
            if (this.getDayOfWeek() != null) {
                data.set("dayOfWeek", om.valueToTree(this.getDayOfWeek()));
            }
            if (this.getMinuteOfHour() != null) {
                data.set("minuteOfHour", om.valueToTree(this.getMinuteOfHour()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.storagegatewayGateway.StoragegatewayGatewayMaintenanceStartTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayGatewayMaintenanceStartTime.Jsii$Proxy that = (StoragegatewayGatewayMaintenanceStartTime.Jsii$Proxy) o;

            if (!hourOfDay.equals(that.hourOfDay)) return false;
            if (this.dayOfMonth != null ? !this.dayOfMonth.equals(that.dayOfMonth) : that.dayOfMonth != null) return false;
            if (this.dayOfWeek != null ? !this.dayOfWeek.equals(that.dayOfWeek) : that.dayOfWeek != null) return false;
            return this.minuteOfHour != null ? this.minuteOfHour.equals(that.minuteOfHour) : that.minuteOfHour == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hourOfDay.hashCode();
            result = 31 * result + (this.dayOfMonth != null ? this.dayOfMonth.hashCode() : 0);
            result = 31 * result + (this.dayOfWeek != null ? this.dayOfWeek.hashCode() : 0);
            result = 31 * result + (this.minuteOfHour != null ? this.minuteOfHour.hashCode() : 0);
            return result;
        }
    }
}
