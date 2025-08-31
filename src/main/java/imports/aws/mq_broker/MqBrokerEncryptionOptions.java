package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.902Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerEncryptionOptions")
@software.amazon.jsii.Jsii.Proxy(MqBrokerEncryptionOptions.Jsii$Proxy.class)
public interface MqBrokerEncryptionOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#kms_key_id MqBroker#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#use_aws_owned_key MqBroker#use_aws_owned_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseAwsOwnedKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MqBrokerEncryptionOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerEncryptionOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerEncryptionOptions> {
        java.lang.String kmsKeyId;
        java.lang.Object useAwsOwnedKey;

        /**
         * Sets the value of {@link MqBrokerEncryptionOptions#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#kms_key_id MqBroker#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerEncryptionOptions#getUseAwsOwnedKey}
         * @param useAwsOwnedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#use_aws_owned_key MqBroker#use_aws_owned_key}.
         * @return {@code this}
         */
        public Builder useAwsOwnedKey(java.lang.Boolean useAwsOwnedKey) {
            this.useAwsOwnedKey = useAwsOwnedKey;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerEncryptionOptions#getUseAwsOwnedKey}
         * @param useAwsOwnedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#use_aws_owned_key MqBroker#use_aws_owned_key}.
         * @return {@code this}
         */
        public Builder useAwsOwnedKey(com.hashicorp.cdktf.IResolvable useAwsOwnedKey) {
            this.useAwsOwnedKey = useAwsOwnedKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MqBrokerEncryptionOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerEncryptionOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerEncryptionOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerEncryptionOptions {
        private final java.lang.String kmsKeyId;
        private final java.lang.Object useAwsOwnedKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useAwsOwnedKey = software.amazon.jsii.Kernel.get(this, "useAwsOwnedKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyId = builder.kmsKeyId;
            this.useAwsOwnedKey = builder.useAwsOwnedKey;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getUseAwsOwnedKey() {
            return this.useAwsOwnedKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getUseAwsOwnedKey() != null) {
                data.set("useAwsOwnedKey", om.valueToTree(this.getUseAwsOwnedKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerEncryptionOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerEncryptionOptions.Jsii$Proxy that = (MqBrokerEncryptionOptions.Jsii$Proxy) o;

            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            return this.useAwsOwnedKey != null ? this.useAwsOwnedKey.equals(that.useAwsOwnedKey) : that.useAwsOwnedKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0;
            result = 31 * result + (this.useAwsOwnedKey != null ? this.useAwsOwnedKey.hashCode() : 0);
            return result;
        }
    }
}
