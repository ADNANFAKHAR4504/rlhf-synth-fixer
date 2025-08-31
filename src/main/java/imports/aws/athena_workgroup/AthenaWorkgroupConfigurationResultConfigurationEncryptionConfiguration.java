package imports.aws.athena_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration.Jsii$Proxy.class)
public interface AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#encryption_option AthenaWorkgroup#encryption_option}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionOption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#kms_key_arn AthenaWorkgroup#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration> {
        java.lang.String encryptionOption;
        java.lang.String kmsKeyArn;

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration#getEncryptionOption}
         * @param encryptionOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#encryption_option AthenaWorkgroup#encryption_option}.
         * @return {@code this}
         */
        public Builder encryptionOption(java.lang.String encryptionOption) {
            this.encryptionOption = encryptionOption;
            return this;
        }

        /**
         * Sets the value of {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_workgroup#kms_key_arn AthenaWorkgroup#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration {
        private final java.lang.String encryptionOption;
        private final java.lang.String kmsKeyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionOption = software.amazon.jsii.Kernel.get(this, "encryptionOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionOption = builder.encryptionOption;
            this.kmsKeyArn = builder.kmsKeyArn;
        }

        @Override
        public final java.lang.String getEncryptionOption() {
            return this.encryptionOption;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionOption() != null) {
                data.set("encryptionOption", om.valueToTree(this.getEncryptionOption()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.athenaWorkgroup.AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration.Jsii$Proxy that = (AthenaWorkgroupConfigurationResultConfigurationEncryptionConfiguration.Jsii$Proxy) o;

            if (this.encryptionOption != null ? !this.encryptionOption.equals(that.encryptionOption) : that.encryptionOption != null) return false;
            return this.kmsKeyArn != null ? this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionOption != null ? this.encryptionOption.hashCode() : 0;
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            return result;
        }
    }
}
