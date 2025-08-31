package imports.aws.appconfig_configuration_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.983Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigConfigurationProfile.AppconfigConfigurationProfileValidator")
@software.amazon.jsii.Jsii.Proxy(AppconfigConfigurationProfileValidator.Jsii$Proxy.class)
public interface AppconfigConfigurationProfileValidator extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_configuration_profile#type AppconfigConfigurationProfile#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_configuration_profile#content AppconfigConfigurationProfile#content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppconfigConfigurationProfileValidator}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppconfigConfigurationProfileValidator}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppconfigConfigurationProfileValidator> {
        java.lang.String type;
        java.lang.String content;

        /**
         * Sets the value of {@link AppconfigConfigurationProfileValidator#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_configuration_profile#type AppconfigConfigurationProfile#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigConfigurationProfileValidator#getContent}
         * @param content Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_configuration_profile#content AppconfigConfigurationProfile#content}.
         * @return {@code this}
         */
        public Builder content(java.lang.String content) {
            this.content = content;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppconfigConfigurationProfileValidator}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppconfigConfigurationProfileValidator build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppconfigConfigurationProfileValidator}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppconfigConfigurationProfileValidator {
        private final java.lang.String type;
        private final java.lang.String content;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.content = software.amazon.jsii.Kernel.get(this, "content", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.content = builder.content;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getContent() {
            return this.content;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getContent() != null) {
                data.set("content", om.valueToTree(this.getContent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appconfigConfigurationProfile.AppconfigConfigurationProfileValidator"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppconfigConfigurationProfileValidator.Jsii$Proxy that = (AppconfigConfigurationProfileValidator.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.content != null ? this.content.equals(that.content) : that.content == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.content != null ? this.content.hashCode() : 0);
            return result;
        }
    }
}
