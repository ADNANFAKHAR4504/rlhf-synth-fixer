package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.422Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleRepublish")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleRepublish.Jsii$Proxy.class)
public interface IotTopicRuleRepublish extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#topic IotTopicRule#topic}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopic();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#qos IotTopicRule#qos}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getQos() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleRepublish}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleRepublish}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleRepublish> {
        java.lang.String roleArn;
        java.lang.String topic;
        java.lang.Number qos;

        /**
         * Sets the value of {@link IotTopicRuleRepublish#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleRepublish#getTopic}
         * @param topic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#topic IotTopicRule#topic}. This parameter is required.
         * @return {@code this}
         */
        public Builder topic(java.lang.String topic) {
            this.topic = topic;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleRepublish#getQos}
         * @param qos Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#qos IotTopicRule#qos}.
         * @return {@code this}
         */
        public Builder qos(java.lang.Number qos) {
            this.qos = qos;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleRepublish}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleRepublish build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleRepublish}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleRepublish {
        private final java.lang.String roleArn;
        private final java.lang.String topic;
        private final java.lang.Number qos;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topic = software.amazon.jsii.Kernel.get(this, "topic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.qos = software.amazon.jsii.Kernel.get(this, "qos", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.topic = java.util.Objects.requireNonNull(builder.topic, "topic is required");
            this.qos = builder.qos;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getTopic() {
            return this.topic;
        }

        @Override
        public final java.lang.Number getQos() {
            return this.qos;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("topic", om.valueToTree(this.getTopic()));
            if (this.getQos() != null) {
                data.set("qos", om.valueToTree(this.getQos()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleRepublish"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleRepublish.Jsii$Proxy that = (IotTopicRuleRepublish.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            if (!topic.equals(that.topic)) return false;
            return this.qos != null ? this.qos.equals(that.qos) : that.qos == null;
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.topic.hashCode());
            result = 31 * result + (this.qos != null ? this.qos.hashCode() : 0);
            return result;
        }
    }
}
