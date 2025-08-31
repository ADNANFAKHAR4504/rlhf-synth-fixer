package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTriggerConfigTriggerPropertiesScheduled")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowTriggerConfigTriggerPropertiesScheduled.Jsii$Proxy.class)
public interface AppflowFlowTriggerConfigTriggerPropertiesScheduled extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_expression AppflowFlow#schedule_expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#data_pull_mode AppflowFlow#data_pull_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataPullMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#first_execution_from AppflowFlow#first_execution_from}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirstExecutionFrom() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_end_time AppflowFlow#schedule_end_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleEndTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_offset AppflowFlow#schedule_offset}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScheduleOffset() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_start_time AppflowFlow#schedule_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#timezone AppflowFlow#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowTriggerConfigTriggerPropertiesScheduled> {
        java.lang.String scheduleExpression;
        java.lang.String dataPullMode;
        java.lang.String firstExecutionFrom;
        java.lang.String scheduleEndTime;
        java.lang.Number scheduleOffset;
        java.lang.String scheduleStartTime;
        java.lang.String timezone;

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_expression AppflowFlow#schedule_expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getDataPullMode}
         * @param dataPullMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#data_pull_mode AppflowFlow#data_pull_mode}.
         * @return {@code this}
         */
        public Builder dataPullMode(java.lang.String dataPullMode) {
            this.dataPullMode = dataPullMode;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getFirstExecutionFrom}
         * @param firstExecutionFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#first_execution_from AppflowFlow#first_execution_from}.
         * @return {@code this}
         */
        public Builder firstExecutionFrom(java.lang.String firstExecutionFrom) {
            this.firstExecutionFrom = firstExecutionFrom;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getScheduleEndTime}
         * @param scheduleEndTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_end_time AppflowFlow#schedule_end_time}.
         * @return {@code this}
         */
        public Builder scheduleEndTime(java.lang.String scheduleEndTime) {
            this.scheduleEndTime = scheduleEndTime;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getScheduleOffset}
         * @param scheduleOffset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_offset AppflowFlow#schedule_offset}.
         * @return {@code this}
         */
        public Builder scheduleOffset(java.lang.Number scheduleOffset) {
            this.scheduleOffset = scheduleOffset;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getScheduleStartTime}
         * @param scheduleStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#schedule_start_time AppflowFlow#schedule_start_time}.
         * @return {@code this}
         */
        public Builder scheduleStartTime(java.lang.String scheduleStartTime) {
            this.scheduleStartTime = scheduleStartTime;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#timezone AppflowFlow#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowTriggerConfigTriggerPropertiesScheduled build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowTriggerConfigTriggerPropertiesScheduled}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowTriggerConfigTriggerPropertiesScheduled {
        private final java.lang.String scheduleExpression;
        private final java.lang.String dataPullMode;
        private final java.lang.String firstExecutionFrom;
        private final java.lang.String scheduleEndTime;
        private final java.lang.Number scheduleOffset;
        private final java.lang.String scheduleStartTime;
        private final java.lang.String timezone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataPullMode = software.amazon.jsii.Kernel.get(this, "dataPullMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firstExecutionFrom = software.amazon.jsii.Kernel.get(this, "firstExecutionFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleEndTime = software.amazon.jsii.Kernel.get(this, "scheduleEndTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleOffset = software.amazon.jsii.Kernel.get(this, "scheduleOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scheduleStartTime = software.amazon.jsii.Kernel.get(this, "scheduleStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.scheduleExpression = java.util.Objects.requireNonNull(builder.scheduleExpression, "scheduleExpression is required");
            this.dataPullMode = builder.dataPullMode;
            this.firstExecutionFrom = builder.firstExecutionFrom;
            this.scheduleEndTime = builder.scheduleEndTime;
            this.scheduleOffset = builder.scheduleOffset;
            this.scheduleStartTime = builder.scheduleStartTime;
            this.timezone = builder.timezone;
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        public final java.lang.String getDataPullMode() {
            return this.dataPullMode;
        }

        @Override
        public final java.lang.String getFirstExecutionFrom() {
            return this.firstExecutionFrom;
        }

        @Override
        public final java.lang.String getScheduleEndTime() {
            return this.scheduleEndTime;
        }

        @Override
        public final java.lang.Number getScheduleOffset() {
            return this.scheduleOffset;
        }

        @Override
        public final java.lang.String getScheduleStartTime() {
            return this.scheduleStartTime;
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

            data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));
            if (this.getDataPullMode() != null) {
                data.set("dataPullMode", om.valueToTree(this.getDataPullMode()));
            }
            if (this.getFirstExecutionFrom() != null) {
                data.set("firstExecutionFrom", om.valueToTree(this.getFirstExecutionFrom()));
            }
            if (this.getScheduleEndTime() != null) {
                data.set("scheduleEndTime", om.valueToTree(this.getScheduleEndTime()));
            }
            if (this.getScheduleOffset() != null) {
                data.set("scheduleOffset", om.valueToTree(this.getScheduleOffset()));
            }
            if (this.getScheduleStartTime() != null) {
                data.set("scheduleStartTime", om.valueToTree(this.getScheduleStartTime()));
            }
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowTriggerConfigTriggerPropertiesScheduled"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowTriggerConfigTriggerPropertiesScheduled.Jsii$Proxy that = (AppflowFlowTriggerConfigTriggerPropertiesScheduled.Jsii$Proxy) o;

            if (!scheduleExpression.equals(that.scheduleExpression)) return false;
            if (this.dataPullMode != null ? !this.dataPullMode.equals(that.dataPullMode) : that.dataPullMode != null) return false;
            if (this.firstExecutionFrom != null ? !this.firstExecutionFrom.equals(that.firstExecutionFrom) : that.firstExecutionFrom != null) return false;
            if (this.scheduleEndTime != null ? !this.scheduleEndTime.equals(that.scheduleEndTime) : that.scheduleEndTime != null) return false;
            if (this.scheduleOffset != null ? !this.scheduleOffset.equals(that.scheduleOffset) : that.scheduleOffset != null) return false;
            if (this.scheduleStartTime != null ? !this.scheduleStartTime.equals(that.scheduleStartTime) : that.scheduleStartTime != null) return false;
            return this.timezone != null ? this.timezone.equals(that.timezone) : that.timezone == null;
        }

        @Override
        public final int hashCode() {
            int result = this.scheduleExpression.hashCode();
            result = 31 * result + (this.dataPullMode != null ? this.dataPullMode.hashCode() : 0);
            result = 31 * result + (this.firstExecutionFrom != null ? this.firstExecutionFrom.hashCode() : 0);
            result = 31 * result + (this.scheduleEndTime != null ? this.scheduleEndTime.hashCode() : 0);
            result = 31 * result + (this.scheduleOffset != null ? this.scheduleOffset.hashCode() : 0);
            result = 31 * result + (this.scheduleStartTime != null ? this.scheduleStartTime.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
            return result;
        }
    }
}
