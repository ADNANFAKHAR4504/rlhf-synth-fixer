package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.416Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionIotEvents")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleErrorActionIotEvents.Jsii$Proxy.class)
public interface IotTopicRuleErrorActionIotEvents extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#input_name IotTopicRule#input_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBatchMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#message_id IotTopicRule#message_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleErrorActionIotEvents}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleErrorActionIotEvents}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleErrorActionIotEvents> {
        java.lang.String inputName;
        java.lang.String roleArn;
        java.lang.Object batchMode;
        java.lang.String messageId;

        /**
         * Sets the value of {@link IotTopicRuleErrorActionIotEvents#getInputName}
         * @param inputName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#input_name IotTopicRule#input_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputName(java.lang.String inputName) {
            this.inputName = inputName;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionIotEvents#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionIotEvents#getBatchMode}
         * @param batchMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
         * @return {@code this}
         */
        public Builder batchMode(java.lang.Boolean batchMode) {
            this.batchMode = batchMode;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionIotEvents#getBatchMode}
         * @param batchMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
         * @return {@code this}
         */
        public Builder batchMode(com.hashicorp.cdktf.IResolvable batchMode) {
            this.batchMode = batchMode;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionIotEvents#getMessageId}
         * @param messageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#message_id IotTopicRule#message_id}.
         * @return {@code this}
         */
        public Builder messageId(java.lang.String messageId) {
            this.messageId = messageId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleErrorActionIotEvents}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleErrorActionIotEvents build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleErrorActionIotEvents}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleErrorActionIotEvents {
        private final java.lang.String inputName;
        private final java.lang.String roleArn;
        private final java.lang.Object batchMode;
        private final java.lang.String messageId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputName = software.amazon.jsii.Kernel.get(this, "inputName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchMode = software.amazon.jsii.Kernel.get(this, "batchMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.messageId = software.amazon.jsii.Kernel.get(this, "messageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputName = java.util.Objects.requireNonNull(builder.inputName, "inputName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.batchMode = builder.batchMode;
            this.messageId = builder.messageId;
        }

        @Override
        public final java.lang.String getInputName() {
            return this.inputName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getBatchMode() {
            return this.batchMode;
        }

        @Override
        public final java.lang.String getMessageId() {
            return this.messageId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputName", om.valueToTree(this.getInputName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getBatchMode() != null) {
                data.set("batchMode", om.valueToTree(this.getBatchMode()));
            }
            if (this.getMessageId() != null) {
                data.set("messageId", om.valueToTree(this.getMessageId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleErrorActionIotEvents"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleErrorActionIotEvents.Jsii$Proxy that = (IotTopicRuleErrorActionIotEvents.Jsii$Proxy) o;

            if (!inputName.equals(that.inputName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.batchMode != null ? !this.batchMode.equals(that.batchMode) : that.batchMode != null) return false;
            return this.messageId != null ? this.messageId.equals(that.messageId) : that.messageId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.batchMode != null ? this.batchMode.hashCode() : 0);
            result = 31 * result + (this.messageId != null ? this.messageId.hashCode() : 0);
            return result;
        }
    }
}
