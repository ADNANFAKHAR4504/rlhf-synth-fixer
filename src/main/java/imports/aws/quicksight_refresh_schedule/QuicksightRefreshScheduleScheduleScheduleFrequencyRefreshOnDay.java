package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.123Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay")
@software.amazon.jsii.Jsii.Proxy(QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay.Jsii$Proxy.class)
public interface QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#day_of_month QuicksightRefreshSchedule#day_of_month}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDayOfMonth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#day_of_week QuicksightRefreshSchedule#day_of_week}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDayOfWeek() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay> {
        java.lang.String dayOfMonth;
        java.lang.String dayOfWeek;

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay#getDayOfMonth}
         * @param dayOfMonth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#day_of_month QuicksightRefreshSchedule#day_of_month}.
         * @return {@code this}
         */
        public Builder dayOfMonth(java.lang.String dayOfMonth) {
            this.dayOfMonth = dayOfMonth;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay#getDayOfWeek}
         * @param dayOfWeek Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#day_of_week QuicksightRefreshSchedule#day_of_week}.
         * @return {@code this}
         */
        public Builder dayOfWeek(java.lang.String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay {
        private final java.lang.String dayOfMonth;
        private final java.lang.String dayOfWeek;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dayOfMonth = software.amazon.jsii.Kernel.get(this, "dayOfMonth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dayOfWeek = software.amazon.jsii.Kernel.get(this, "dayOfWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dayOfMonth = builder.dayOfMonth;
            this.dayOfWeek = builder.dayOfWeek;
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDayOfMonth() != null) {
                data.set("dayOfMonth", om.valueToTree(this.getDayOfMonth()));
            }
            if (this.getDayOfWeek() != null) {
                data.set("dayOfWeek", om.valueToTree(this.getDayOfWeek()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay.Jsii$Proxy that = (QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay.Jsii$Proxy) o;

            if (this.dayOfMonth != null ? !this.dayOfMonth.equals(that.dayOfMonth) : that.dayOfMonth != null) return false;
            return this.dayOfWeek != null ? this.dayOfWeek.equals(that.dayOfWeek) : that.dayOfWeek == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dayOfMonth != null ? this.dayOfMonth.hashCode() : 0;
            result = 31 * result + (this.dayOfWeek != null ? this.dayOfWeek.hashCode() : 0);
            return result;
        }
    }
}
