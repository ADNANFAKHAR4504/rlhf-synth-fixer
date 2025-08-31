package imports.aws.sfn_state_machine;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sfnStateMachine.SfnStateMachineEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(SfnStateMachineEncryptionConfiguration.Jsii$Proxy.class)
public interface SfnStateMachineEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#kms_data_key_reuse_period_seconds SfnStateMachine#kms_data_key_reuse_period_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getKmsDataKeyReusePeriodSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#kms_key_id SfnStateMachine#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#type SfnStateMachine#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SfnStateMachineEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SfnStateMachineEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SfnStateMachineEncryptionConfiguration> {
        java.lang.Number kmsDataKeyReusePeriodSeconds;
        java.lang.String kmsKeyId;
        java.lang.String type;

        /**
         * Sets the value of {@link SfnStateMachineEncryptionConfiguration#getKmsDataKeyReusePeriodSeconds}
         * @param kmsDataKeyReusePeriodSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#kms_data_key_reuse_period_seconds SfnStateMachine#kms_data_key_reuse_period_seconds}.
         * @return {@code this}
         */
        public Builder kmsDataKeyReusePeriodSeconds(java.lang.Number kmsDataKeyReusePeriodSeconds) {
            this.kmsDataKeyReusePeriodSeconds = kmsDataKeyReusePeriodSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SfnStateMachineEncryptionConfiguration#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#kms_key_id SfnStateMachine#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SfnStateMachineEncryptionConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#type SfnStateMachine#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SfnStateMachineEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SfnStateMachineEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SfnStateMachineEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SfnStateMachineEncryptionConfiguration {
        private final java.lang.Number kmsDataKeyReusePeriodSeconds;
        private final java.lang.String kmsKeyId;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsDataKeyReusePeriodSeconds = software.amazon.jsii.Kernel.get(this, "kmsDataKeyReusePeriodSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsDataKeyReusePeriodSeconds = builder.kmsDataKeyReusePeriodSeconds;
            this.kmsKeyId = builder.kmsKeyId;
            this.type = builder.type;
        }

        @Override
        public final java.lang.Number getKmsDataKeyReusePeriodSeconds() {
            return this.kmsDataKeyReusePeriodSeconds;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsDataKeyReusePeriodSeconds() != null) {
                data.set("kmsDataKeyReusePeriodSeconds", om.valueToTree(this.getKmsDataKeyReusePeriodSeconds()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sfnStateMachine.SfnStateMachineEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SfnStateMachineEncryptionConfiguration.Jsii$Proxy that = (SfnStateMachineEncryptionConfiguration.Jsii$Proxy) o;

            if (this.kmsDataKeyReusePeriodSeconds != null ? !this.kmsDataKeyReusePeriodSeconds.equals(that.kmsDataKeyReusePeriodSeconds) : that.kmsDataKeyReusePeriodSeconds != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsDataKeyReusePeriodSeconds != null ? this.kmsDataKeyReusePeriodSeconds.hashCode() : 0;
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
