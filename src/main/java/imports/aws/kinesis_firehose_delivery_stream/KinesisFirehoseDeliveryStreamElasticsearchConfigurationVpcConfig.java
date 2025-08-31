package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.450Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#security_group_ids KinesisFirehoseDeliveryStream#security_group_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#subnet_ids KinesisFirehoseDeliveryStream#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig> {
        java.lang.String roleArn;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnetIds;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#role_arn KinesisFirehoseDeliveryStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#security_group_ids KinesisFirehoseDeliveryStream#security_group_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#subnet_ids KinesisFirehoseDeliveryStream#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig {
        private final java.lang.String roleArn;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnetIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.securityGroupIds = java.util.Objects.requireNonNull(builder.securityGroupIds, "securityGroupIds is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamElasticsearchConfigurationVpcConfig.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            if (!securityGroupIds.equals(that.securityGroupIds)) return false;
            return this.subnetIds.equals(that.subnetIds);
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.securityGroupIds.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            return result;
        }
    }
}
