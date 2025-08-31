package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamMskSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamMskSourceConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamMskSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * authentication_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#authentication_configuration KinesisFirehoseDeliveryStream#authentication_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration getAuthenticationConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#msk_cluster_arn KinesisFirehoseDeliveryStream#msk_cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMskClusterArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#topic_name KinesisFirehoseDeliveryStream#topic_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#read_from_timestamp KinesisFirehoseDeliveryStream#read_from_timestamp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReadFromTimestamp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamMskSourceConfiguration> {
        imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration authenticationConfiguration;
        java.lang.String mskClusterArn;
        java.lang.String topicName;
        java.lang.String readFromTimestamp;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration#getAuthenticationConfiguration}
         * @param authenticationConfiguration authentication_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#authentication_configuration KinesisFirehoseDeliveryStream#authentication_configuration}
         * @return {@code this}
         */
        public Builder authenticationConfiguration(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration authenticationConfiguration) {
            this.authenticationConfiguration = authenticationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration#getMskClusterArn}
         * @param mskClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#msk_cluster_arn KinesisFirehoseDeliveryStream#msk_cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder mskClusterArn(java.lang.String mskClusterArn) {
            this.mskClusterArn = mskClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration#getTopicName}
         * @param topicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#topic_name KinesisFirehoseDeliveryStream#topic_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicName(java.lang.String topicName) {
            this.topicName = topicName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration#getReadFromTimestamp}
         * @param readFromTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#read_from_timestamp KinesisFirehoseDeliveryStream#read_from_timestamp}.
         * @return {@code this}
         */
        public Builder readFromTimestamp(java.lang.String readFromTimestamp) {
            this.readFromTimestamp = readFromTimestamp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamMskSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamMskSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamMskSourceConfiguration {
        private final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration authenticationConfiguration;
        private final java.lang.String mskClusterArn;
        private final java.lang.String topicName;
        private final java.lang.String readFromTimestamp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authenticationConfiguration = software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration.class));
            this.mskClusterArn = software.amazon.jsii.Kernel.get(this, "mskClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicName = software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readFromTimestamp = software.amazon.jsii.Kernel.get(this, "readFromTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authenticationConfiguration = java.util.Objects.requireNonNull(builder.authenticationConfiguration, "authenticationConfiguration is required");
            this.mskClusterArn = java.util.Objects.requireNonNull(builder.mskClusterArn, "mskClusterArn is required");
            this.topicName = java.util.Objects.requireNonNull(builder.topicName, "topicName is required");
            this.readFromTimestamp = builder.readFromTimestamp;
        }

        @Override
        public final imports.aws.kinesis_firehose_delivery_stream.KinesisFirehoseDeliveryStreamMskSourceConfigurationAuthenticationConfiguration getAuthenticationConfiguration() {
            return this.authenticationConfiguration;
        }

        @Override
        public final java.lang.String getMskClusterArn() {
            return this.mskClusterArn;
        }

        @Override
        public final java.lang.String getTopicName() {
            return this.topicName;
        }

        @Override
        public final java.lang.String getReadFromTimestamp() {
            return this.readFromTimestamp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authenticationConfiguration", om.valueToTree(this.getAuthenticationConfiguration()));
            data.set("mskClusterArn", om.valueToTree(this.getMskClusterArn()));
            data.set("topicName", om.valueToTree(this.getTopicName()));
            if (this.getReadFromTimestamp() != null) {
                data.set("readFromTimestamp", om.valueToTree(this.getReadFromTimestamp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamMskSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamMskSourceConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamMskSourceConfiguration.Jsii$Proxy) o;

            if (!authenticationConfiguration.equals(that.authenticationConfiguration)) return false;
            if (!mskClusterArn.equals(that.mskClusterArn)) return false;
            if (!topicName.equals(that.topicName)) return false;
            return this.readFromTimestamp != null ? this.readFromTimestamp.equals(that.readFromTimestamp) : that.readFromTimestamp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authenticationConfiguration.hashCode();
            result = 31 * result + (this.mskClusterArn.hashCode());
            result = 31 * result + (this.topicName.hashCode());
            result = 31 * result + (this.readFromTimestamp != null ? this.readFromTimestamp.hashCode() : 0);
            return result;
        }
    }
}
