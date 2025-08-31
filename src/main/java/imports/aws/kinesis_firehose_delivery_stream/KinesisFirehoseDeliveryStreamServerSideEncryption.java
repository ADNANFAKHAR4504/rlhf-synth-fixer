package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.461Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamServerSideEncryption")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamServerSideEncryption.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamServerSideEncryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_arn KinesisFirehoseDeliveryStream#key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_type KinesisFirehoseDeliveryStream#key_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamServerSideEncryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamServerSideEncryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamServerSideEncryption> {
        java.lang.Object enabled;
        java.lang.String keyArn;
        java.lang.String keyType;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamServerSideEncryption#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamServerSideEncryption#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamServerSideEncryption#getKeyArn}
         * @param keyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_arn KinesisFirehoseDeliveryStream#key_arn}.
         * @return {@code this}
         */
        public Builder keyArn(java.lang.String keyArn) {
            this.keyArn = keyArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamServerSideEncryption#getKeyType}
         * @param keyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#key_type KinesisFirehoseDeliveryStream#key_type}.
         * @return {@code this}
         */
        public Builder keyType(java.lang.String keyType) {
            this.keyType = keyType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamServerSideEncryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamServerSideEncryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamServerSideEncryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamServerSideEncryption {
        private final java.lang.Object enabled;
        private final java.lang.String keyArn;
        private final java.lang.String keyType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.keyArn = software.amazon.jsii.Kernel.get(this, "keyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyType = software.amazon.jsii.Kernel.get(this, "keyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.keyArn = builder.keyArn;
            this.keyType = builder.keyType;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getKeyArn() {
            return this.keyArn;
        }

        @Override
        public final java.lang.String getKeyType() {
            return this.keyType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getKeyArn() != null) {
                data.set("keyArn", om.valueToTree(this.getKeyArn()));
            }
            if (this.getKeyType() != null) {
                data.set("keyType", om.valueToTree(this.getKeyType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamServerSideEncryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamServerSideEncryption.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamServerSideEncryption.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.keyArn != null ? !this.keyArn.equals(that.keyArn) : that.keyArn != null) return false;
            return this.keyType != null ? this.keyType.equals(that.keyType) : that.keyType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.keyArn != null ? this.keyArn.hashCode() : 0);
            result = 31 * result + (this.keyType != null ? this.keyType.hashCode() : 0);
            return result;
        }
    }
}
