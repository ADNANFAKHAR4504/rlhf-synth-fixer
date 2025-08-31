package imports.aws.m2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.840Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Application.M2ApplicationDefinition")
@software.amazon.jsii.Jsii.Proxy(M2ApplicationDefinition.Jsii$Proxy.class)
public interface M2ApplicationDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_application#content M2Application#content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_application#s3_location M2Application#s3_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Location() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link M2ApplicationDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link M2ApplicationDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<M2ApplicationDefinition> {
        java.lang.String content;
        java.lang.String s3Location;

        /**
         * Sets the value of {@link M2ApplicationDefinition#getContent}
         * @param content Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_application#content M2Application#content}.
         * @return {@code this}
         */
        public Builder content(java.lang.String content) {
            this.content = content;
            return this;
        }

        /**
         * Sets the value of {@link M2ApplicationDefinition#getS3Location}
         * @param s3Location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_application#s3_location M2Application#s3_location}.
         * @return {@code this}
         */
        public Builder s3Location(java.lang.String s3Location) {
            this.s3Location = s3Location;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link M2ApplicationDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public M2ApplicationDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link M2ApplicationDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements M2ApplicationDefinition {
        private final java.lang.String content;
        private final java.lang.String s3Location;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.content = software.amazon.jsii.Kernel.get(this, "content", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Location = software.amazon.jsii.Kernel.get(this, "s3Location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.content = builder.content;
            this.s3Location = builder.s3Location;
        }

        @Override
        public final java.lang.String getContent() {
            return this.content;
        }

        @Override
        public final java.lang.String getS3Location() {
            return this.s3Location;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContent() != null) {
                data.set("content", om.valueToTree(this.getContent()));
            }
            if (this.getS3Location() != null) {
                data.set("s3Location", om.valueToTree(this.getS3Location()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.m2Application.M2ApplicationDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            M2ApplicationDefinition.Jsii$Proxy that = (M2ApplicationDefinition.Jsii$Proxy) o;

            if (this.content != null ? !this.content.equals(that.content) : that.content != null) return false;
            return this.s3Location != null ? this.s3Location.equals(that.s3Location) : that.s3Location == null;
        }

        @Override
        public final int hashCode() {
            int result = this.content != null ? this.content.hashCode() : 0;
            result = 31 * result + (this.s3Location != null ? this.s3Location.hashCode() : 0);
            return result;
        }
    }
}
