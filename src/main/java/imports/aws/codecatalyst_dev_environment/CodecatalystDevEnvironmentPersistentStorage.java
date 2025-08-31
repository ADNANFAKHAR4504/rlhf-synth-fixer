package imports.aws.codecatalyst_dev_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.308Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentPersistentStorage")
@software.amazon.jsii.Jsii.Proxy(CodecatalystDevEnvironmentPersistentStorage.Jsii$Proxy.class)
public interface CodecatalystDevEnvironmentPersistentStorage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#size CodecatalystDevEnvironment#size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSize();

    /**
     * @return a {@link Builder} of {@link CodecatalystDevEnvironmentPersistentStorage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodecatalystDevEnvironmentPersistentStorage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodecatalystDevEnvironmentPersistentStorage> {
        java.lang.Number size;

        /**
         * Sets the value of {@link CodecatalystDevEnvironmentPersistentStorage#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codecatalyst_dev_environment#size CodecatalystDevEnvironment#size}. This parameter is required.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodecatalystDevEnvironmentPersistentStorage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodecatalystDevEnvironmentPersistentStorage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodecatalystDevEnvironmentPersistentStorage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodecatalystDevEnvironmentPersistentStorage {
        private final java.lang.Number size;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.size = java.util.Objects.requireNonNull(builder.size, "size is required");
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("size", om.valueToTree(this.getSize()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codecatalystDevEnvironment.CodecatalystDevEnvironmentPersistentStorage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodecatalystDevEnvironmentPersistentStorage.Jsii$Proxy that = (CodecatalystDevEnvironmentPersistentStorage.Jsii$Proxy) o;

            return this.size.equals(that.size);
        }

        @Override
        public final int hashCode() {
            int result = this.size.hashCode();
            return result;
        }
    }
}
