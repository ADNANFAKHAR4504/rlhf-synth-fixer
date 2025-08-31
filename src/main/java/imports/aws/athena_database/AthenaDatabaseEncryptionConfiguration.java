package imports.aws.athena_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.080Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.athenaDatabase.AthenaDatabaseEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(AthenaDatabaseEncryptionConfiguration.Jsii$Proxy.class)
public interface AthenaDatabaseEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_database#encryption_option AthenaDatabase#encryption_option}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEncryptionOption();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_database#kms_key AthenaDatabase#kms_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AthenaDatabaseEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AthenaDatabaseEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AthenaDatabaseEncryptionConfiguration> {
        java.lang.String encryptionOption;
        java.lang.String kmsKey;

        /**
         * Sets the value of {@link AthenaDatabaseEncryptionConfiguration#getEncryptionOption}
         * @param encryptionOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_database#encryption_option AthenaDatabase#encryption_option}. This parameter is required.
         * @return {@code this}
         */
        public Builder encryptionOption(java.lang.String encryptionOption) {
            this.encryptionOption = encryptionOption;
            return this;
        }

        /**
         * Sets the value of {@link AthenaDatabaseEncryptionConfiguration#getKmsKey}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/athena_database#kms_key AthenaDatabase#kms_key}.
         * @return {@code this}
         */
        public Builder kmsKey(java.lang.String kmsKey) {
            this.kmsKey = kmsKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AthenaDatabaseEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AthenaDatabaseEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AthenaDatabaseEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AthenaDatabaseEncryptionConfiguration {
        private final java.lang.String encryptionOption;
        private final java.lang.String kmsKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionOption = software.amazon.jsii.Kernel.get(this, "encryptionOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKey = software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionOption = java.util.Objects.requireNonNull(builder.encryptionOption, "encryptionOption is required");
            this.kmsKey = builder.kmsKey;
        }

        @Override
        public final java.lang.String getEncryptionOption() {
            return this.encryptionOption;
        }

        @Override
        public final java.lang.String getKmsKey() {
            return this.kmsKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("encryptionOption", om.valueToTree(this.getEncryptionOption()));
            if (this.getKmsKey() != null) {
                data.set("kmsKey", om.valueToTree(this.getKmsKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.athenaDatabase.AthenaDatabaseEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AthenaDatabaseEncryptionConfiguration.Jsii$Proxy that = (AthenaDatabaseEncryptionConfiguration.Jsii$Proxy) o;

            if (!encryptionOption.equals(that.encryptionOption)) return false;
            return this.kmsKey != null ? this.kmsKey.equals(that.kmsKey) : that.kmsKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionOption.hashCode();
            result = 31 * result + (this.kmsKey != null ? this.kmsKey.hashCode() : 0);
            return result;
        }
    }
}
