package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.418Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleKafka")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleKafka.Jsii$Proxy.class)
public interface IotTopicRuleKafka extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#client_properties IotTopicRule#client_properties}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getClientProperties();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#destination_arn IotTopicRule#destination_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#topic IotTopicRule#topic}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopic();

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#header IotTopicRule#header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#key IotTopicRule#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#partition IotTopicRule#partition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPartition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleKafka}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleKafka}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleKafka> {
        java.util.Map<java.lang.String, java.lang.String> clientProperties;
        java.lang.String destinationArn;
        java.lang.String topic;
        java.lang.Object header;
        java.lang.String key;
        java.lang.String partition;

        /**
         * Sets the value of {@link IotTopicRuleKafka#getClientProperties}
         * @param clientProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#client_properties IotTopicRule#client_properties}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientProperties(java.util.Map<java.lang.String, java.lang.String> clientProperties) {
            this.clientProperties = clientProperties;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getDestinationArn}
         * @param destinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#destination_arn IotTopicRule#destination_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationArn(java.lang.String destinationArn) {
            this.destinationArn = destinationArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getTopic}
         * @param topic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#topic IotTopicRule#topic}. This parameter is required.
         * @return {@code this}
         */
        public Builder topic(java.lang.String topic) {
            this.topic = topic;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#header IotTopicRule#header}
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#header IotTopicRule#header}
         * @return {@code this}
         */
        public Builder header(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleKafkaHeader> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#key IotTopicRule#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleKafka#getPartition}
         * @param partition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#partition IotTopicRule#partition}.
         * @return {@code this}
         */
        public Builder partition(java.lang.String partition) {
            this.partition = partition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleKafka}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleKafka build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleKafka}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleKafka {
        private final java.util.Map<java.lang.String, java.lang.String> clientProperties;
        private final java.lang.String destinationArn;
        private final java.lang.String topic;
        private final java.lang.Object header;
        private final java.lang.String key;
        private final java.lang.String partition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientProperties = software.amazon.jsii.Kernel.get(this, "clientProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.destinationArn = software.amazon.jsii.Kernel.get(this, "destinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topic = software.amazon.jsii.Kernel.get(this, "topic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partition = software.amazon.jsii.Kernel.get(this, "partition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientProperties = java.util.Objects.requireNonNull(builder.clientProperties, "clientProperties is required");
            this.destinationArn = java.util.Objects.requireNonNull(builder.destinationArn, "destinationArn is required");
            this.topic = java.util.Objects.requireNonNull(builder.topic, "topic is required");
            this.header = builder.header;
            this.key = builder.key;
            this.partition = builder.partition;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getClientProperties() {
            return this.clientProperties;
        }

        @Override
        public final java.lang.String getDestinationArn() {
            return this.destinationArn;
        }

        @Override
        public final java.lang.String getTopic() {
            return this.topic;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getPartition() {
            return this.partition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientProperties", om.valueToTree(this.getClientProperties()));
            data.set("destinationArn", om.valueToTree(this.getDestinationArn()));
            data.set("topic", om.valueToTree(this.getTopic()));
            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }
            if (this.getPartition() != null) {
                data.set("partition", om.valueToTree(this.getPartition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleKafka"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleKafka.Jsii$Proxy that = (IotTopicRuleKafka.Jsii$Proxy) o;

            if (!clientProperties.equals(that.clientProperties)) return false;
            if (!destinationArn.equals(that.destinationArn)) return false;
            if (!topic.equals(that.topic)) return false;
            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            if (this.key != null ? !this.key.equals(that.key) : that.key != null) return false;
            return this.partition != null ? this.partition.equals(that.partition) : that.partition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientProperties.hashCode();
            result = 31 * result + (this.destinationArn.hashCode());
            result = 31 * result + (this.topic.hashCode());
            result = 31 * result + (this.header != null ? this.header.hashCode() : 0);
            result = 31 * result + (this.key != null ? this.key.hashCode() : 0);
            result = 31 * result + (this.partition != null ? this.partition.hashCode() : 0);
            return result;
        }
    }
}
