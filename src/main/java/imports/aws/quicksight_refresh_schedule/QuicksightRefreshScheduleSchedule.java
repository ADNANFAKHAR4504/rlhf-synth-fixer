package imports.aws.quicksight_refresh_schedule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightRefreshSchedule.QuicksightRefreshScheduleSchedule")
@software.amazon.jsii.Jsii.Proxy(QuicksightRefreshScheduleSchedule.Jsii$Proxy.class)
public interface QuicksightRefreshScheduleSchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#refresh_type QuicksightRefreshSchedule#refresh_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRefreshType();

    /**
     * schedule_frequency block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule_frequency QuicksightRefreshSchedule#schedule_frequency}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScheduleFrequency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#start_after_date_time QuicksightRefreshSchedule#start_after_date_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartAfterDateTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightRefreshScheduleSchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightRefreshScheduleSchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightRefreshScheduleSchedule> {
        java.lang.String refreshType;
        java.lang.Object scheduleFrequency;
        java.lang.String startAfterDateTime;

        /**
         * Sets the value of {@link QuicksightRefreshScheduleSchedule#getRefreshType}
         * @param refreshType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#refresh_type QuicksightRefreshSchedule#refresh_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder refreshType(java.lang.String refreshType) {
            this.refreshType = refreshType;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleSchedule#getScheduleFrequency}
         * @param scheduleFrequency schedule_frequency block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule_frequency QuicksightRefreshSchedule#schedule_frequency}
         * @return {@code this}
         */
        public Builder scheduleFrequency(com.hashicorp.cdktf.IResolvable scheduleFrequency) {
            this.scheduleFrequency = scheduleFrequency;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleSchedule#getScheduleFrequency}
         * @param scheduleFrequency schedule_frequency block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#schedule_frequency QuicksightRefreshSchedule#schedule_frequency}
         * @return {@code this}
         */
        public Builder scheduleFrequency(java.util.List<? extends imports.aws.quicksight_refresh_schedule.QuicksightRefreshScheduleScheduleScheduleFrequency> scheduleFrequency) {
            this.scheduleFrequency = scheduleFrequency;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightRefreshScheduleSchedule#getStartAfterDateTime}
         * @param startAfterDateTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_refresh_schedule#start_after_date_time QuicksightRefreshSchedule#start_after_date_time}.
         * @return {@code this}
         */
        public Builder startAfterDateTime(java.lang.String startAfterDateTime) {
            this.startAfterDateTime = startAfterDateTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightRefreshScheduleSchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightRefreshScheduleSchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightRefreshScheduleSchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightRefreshScheduleSchedule {
        private final java.lang.String refreshType;
        private final java.lang.Object scheduleFrequency;
        private final java.lang.String startAfterDateTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.refreshType = software.amazon.jsii.Kernel.get(this, "refreshType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleFrequency = software.amazon.jsii.Kernel.get(this, "scheduleFrequency", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.startAfterDateTime = software.amazon.jsii.Kernel.get(this, "startAfterDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.refreshType = java.util.Objects.requireNonNull(builder.refreshType, "refreshType is required");
            this.scheduleFrequency = builder.scheduleFrequency;
            this.startAfterDateTime = builder.startAfterDateTime;
        }

        @Override
        public final java.lang.String getRefreshType() {
            return this.refreshType;
        }

        @Override
        public final java.lang.Object getScheduleFrequency() {
            return this.scheduleFrequency;
        }

        @Override
        public final java.lang.String getStartAfterDateTime() {
            return this.startAfterDateTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("refreshType", om.valueToTree(this.getRefreshType()));
            if (this.getScheduleFrequency() != null) {
                data.set("scheduleFrequency", om.valueToTree(this.getScheduleFrequency()));
            }
            if (this.getStartAfterDateTime() != null) {
                data.set("startAfterDateTime", om.valueToTree(this.getStartAfterDateTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightRefreshSchedule.QuicksightRefreshScheduleSchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightRefreshScheduleSchedule.Jsii$Proxy that = (QuicksightRefreshScheduleSchedule.Jsii$Proxy) o;

            if (!refreshType.equals(that.refreshType)) return false;
            if (this.scheduleFrequency != null ? !this.scheduleFrequency.equals(that.scheduleFrequency) : that.scheduleFrequency != null) return false;
            return this.startAfterDateTime != null ? this.startAfterDateTime.equals(that.startAfterDateTime) : that.startAfterDateTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.refreshType.hashCode();
            result = 31 * result + (this.scheduleFrequency != null ? this.scheduleFrequency.hashCode() : 0);
            result = 31 * result + (this.startAfterDateTime != null ? this.startAfterDateTime.hashCode() : 0);
            return result;
        }
    }
}
