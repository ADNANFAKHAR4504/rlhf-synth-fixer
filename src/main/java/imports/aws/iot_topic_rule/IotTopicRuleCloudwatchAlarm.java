package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.413Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleCloudwatchAlarm")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleCloudwatchAlarm.Jsii$Proxy.class)
public interface IotTopicRuleCloudwatchAlarm extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#alarm_name IotTopicRule#alarm_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarmName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#state_reason IotTopicRule#state_reason}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStateReason();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#state_value IotTopicRule#state_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStateValue();

    /**
     * @return a {@link Builder} of {@link IotTopicRuleCloudwatchAlarm}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleCloudwatchAlarm}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleCloudwatchAlarm> {
        java.lang.String alarmName;
        java.lang.String roleArn;
        java.lang.String stateReason;
        java.lang.String stateValue;

        /**
         * Sets the value of {@link IotTopicRuleCloudwatchAlarm#getAlarmName}
         * @param alarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#alarm_name IotTopicRule#alarm_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmName(java.lang.String alarmName) {
            this.alarmName = alarmName;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleCloudwatchAlarm#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleCloudwatchAlarm#getStateReason}
         * @param stateReason Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#state_reason IotTopicRule#state_reason}. This parameter is required.
         * @return {@code this}
         */
        public Builder stateReason(java.lang.String stateReason) {
            this.stateReason = stateReason;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleCloudwatchAlarm#getStateValue}
         * @param stateValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#state_value IotTopicRule#state_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder stateValue(java.lang.String stateValue) {
            this.stateValue = stateValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleCloudwatchAlarm}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleCloudwatchAlarm build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleCloudwatchAlarm}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleCloudwatchAlarm {
        private final java.lang.String alarmName;
        private final java.lang.String roleArn;
        private final java.lang.String stateReason;
        private final java.lang.String stateValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarmName = software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stateReason = software.amazon.jsii.Kernel.get(this, "stateReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stateValue = software.amazon.jsii.Kernel.get(this, "stateValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarmName = java.util.Objects.requireNonNull(builder.alarmName, "alarmName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.stateReason = java.util.Objects.requireNonNull(builder.stateReason, "stateReason is required");
            this.stateValue = java.util.Objects.requireNonNull(builder.stateValue, "stateValue is required");
        }

        @Override
        public final java.lang.String getAlarmName() {
            return this.alarmName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getStateReason() {
            return this.stateReason;
        }

        @Override
        public final java.lang.String getStateValue() {
            return this.stateValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alarmName", om.valueToTree(this.getAlarmName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("stateReason", om.valueToTree(this.getStateReason()));
            data.set("stateValue", om.valueToTree(this.getStateValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleCloudwatchAlarm"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleCloudwatchAlarm.Jsii$Proxy that = (IotTopicRuleCloudwatchAlarm.Jsii$Proxy) o;

            if (!alarmName.equals(that.alarmName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!stateReason.equals(that.stateReason)) return false;
            return this.stateValue.equals(that.stateValue);
        }

        @Override
        public final int hashCode() {
            int result = this.alarmName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.stateReason.hashCode());
            result = 31 * result + (this.stateValue.hashCode());
            return result;
        }
    }
}
