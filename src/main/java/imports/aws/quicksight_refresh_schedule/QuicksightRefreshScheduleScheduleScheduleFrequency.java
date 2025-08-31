package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.123Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequency")
@software.amazon.jsii.Jsii.Proxy(QuicksightRefreshScheduleScheduleScheduleFrequency.Jsii$Proxy.class)
public interface QuicksightRefreshScheduleScheduleScheduleFrequency extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#interval QuicksightRefreshSchedule#interval}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInterval();

    /**
     * refresh_on_day block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#refresh_on_day QuicksightRefreshSchedule#refresh_on_day}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRefreshOnDay() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#time_of_the_day QuicksightRefreshSchedule#time_of_the_day}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimeOfTheDay() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#timezone QuicksightRefreshSchedule#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightRefreshScheduleScheduleScheduleFrequency}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightRefreshScheduleScheduleScheduleFrequency}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightRefreshScheduleScheduleScheduleFrequency> {
        java.lang.String interval;
        java.lang.Object refreshOnDay;
        java.lang.String timeOfTheDay;
        java.lang.String timezone;

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequency#getInterval}
         * @param interval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#interval QuicksightRefreshSchedule#interval}. This parameter is required.
         * @return {@code this}
         */
        public Builder interval(java.lang.String interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequency#getRefreshOnDay}
         * @param refreshOnDay refresh_on_day block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#refresh_on_day QuicksightRefreshSchedule#refresh_on_day}
         * @return {@code this}
         */
        public Builder refreshOnDay(com.hashicorp.cdktf.IResolvable refreshOnDay) {
            this.refreshOnDay = refreshOnDay;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequency#getRefreshOnDay}
         * @param refreshOnDay refresh_on_day block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#refresh_on_day QuicksightRefreshSchedule#refresh_on_day}
         * @return {@code this}
         */
        public Builder refreshOnDay(java.util.List<? extends imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequencyRefreshOnDay> refreshOnDay) {
            this.refreshOnDay = refreshOnDay;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequency#getTimeOfTheDay}
         * @param timeOfTheDay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#time_of_the_day QuicksightRefreshSchedule#time_of_the_day}.
         * @return {@code this}
         */
        public Builder timeOfTheDay(java.lang.String timeOfTheDay) {
            this.timeOfTheDay = timeOfTheDay;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleScheduleScheduleFrequency#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#timezone QuicksightRefreshSchedule#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightRefreshScheduleScheduleScheduleFrequency}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightRefreshScheduleScheduleScheduleFrequency build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightRefreshScheduleScheduleScheduleFrequency}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightRefreshScheduleScheduleScheduleFrequency {
        private final java.lang.String interval;
        private final java.lang.Object refreshOnDay;
        private final java.lang.String timeOfTheDay;
        private final java.lang.String timezone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.refreshOnDay = software.amazon.jsii.Kernel.get(this, "refreshOnDay", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeOfTheDay = software.amazon.jsii.Kernel.get(this, "timeOfTheDay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.interval = java.util.Objects.requireNonNull(builder.interval, "interval is required");
            this.refreshOnDay = builder.refreshOnDay;
            this.timeOfTheDay = builder.timeOfTheDay;
            this.timezone = builder.timezone;
        }

        @Override
        public final java.lang.String getInterval() {
            return this.interval;
        }

        @Override
        public final java.lang.Object getRefreshOnDay() {
            return this.refreshOnDay;
        }

        @Override
        public final java.lang.String getTimeOfTheDay() {
            return this.timeOfTheDay;
        }

        @Override
        public final java.lang.String getTimezone() {
            return this.timezone;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("interval", om.valueToTree(this.getInterval()));
            if (this.getRefreshOnDay() != null) {
                data.set("refreshOnDay", om.valueToTree(this.getRefreshOnDay()));
            }
            if (this.getTimeOfTheDay() != null) {
                data.set("timeOfTheDay", om.valueToTree(this.getTimeOfTheDay()));
            }
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightRefreshSchedule.QuicksightRefreshScheduleScheduleScheduleFrequency"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightRefreshScheduleScheduleScheduleFrequency.Jsii$Proxy that = (QuicksightRefreshScheduleScheduleScheduleFrequency.Jsii$Proxy) o;

            if (!interval.equals(that.interval)) return false;
            if (this.refreshOnDay != null ? !this.refreshOnDay.equals(that.refreshOnDay) : that.refreshOnDay != null) return false;
            if (this.timeOfTheDay != null ? !this.timeOfTheDay.equals(that.timeOfTheDay) : that.timeOfTheDay != null) return false;
            return this.timezone != null ? this.timezone.equals(that.timezone) : that.timezone == null;
        }

        @Override
        public final int hashCode() {
            int result = this.interval.hashCode();
            result = 31 * result + (this.refreshOnDay != null ? this.refreshOnDay.hashCode() : 0);
            result = 31 * result + (this.timeOfTheDay != null ? this.timeOfTheDay.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
            return result;
        }
    }
}
