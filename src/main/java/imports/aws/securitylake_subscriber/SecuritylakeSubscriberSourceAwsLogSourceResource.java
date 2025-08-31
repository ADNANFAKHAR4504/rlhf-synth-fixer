package imports.aws.securitylake_subscriber;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.421Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriber.SecuritylakeSubscriberSourceAwsLogSourceResource")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberSourceAwsLogSourceResource.Jsii$Proxy.class)
public interface SecuritylakeSubscriberSourceAwsLogSourceResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source_name SecuritylakeSubscriber#source_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source_version SecuritylakeSubscriber#source_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberSourceAwsLogSourceResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberSourceAwsLogSourceResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberSourceAwsLogSourceResource> {
        java.lang.String sourceName;
        java.lang.String sourceVersion;

        /**
         * Sets the value of {@link SecuritylakeSubscriberSourceAwsLogSourceResource#getSourceName}
         * @param sourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source_name SecuritylakeSubscriber#source_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceName(java.lang.String sourceName) {
            this.sourceName = sourceName;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberSourceAwsLogSourceResource#getSourceVersion}
         * @param sourceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#source_version SecuritylakeSubscriber#source_version}.
         * @return {@code this}
         */
        public Builder sourceVersion(java.lang.String sourceVersion) {
            this.sourceVersion = sourceVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeSubscriberSourceAwsLogSourceResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberSourceAwsLogSourceResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberSourceAwsLogSourceResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberSourceAwsLogSourceResource {
        private final java.lang.String sourceName;
        private final java.lang.String sourceVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceName = software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceVersion = software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceName = java.util.Objects.requireNonNull(builder.sourceName, "sourceName is required");
            this.sourceVersion = builder.sourceVersion;
        }

        @Override
        public final java.lang.String getSourceName() {
            return this.sourceName;
        }

        @Override
        public final java.lang.String getSourceVersion() {
            return this.sourceVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceName", om.valueToTree(this.getSourceName()));
            if (this.getSourceVersion() != null) {
                data.set("sourceVersion", om.valueToTree(this.getSourceVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriber.SecuritylakeSubscriberSourceAwsLogSourceResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberSourceAwsLogSourceResource.Jsii$Proxy that = (SecuritylakeSubscriberSourceAwsLogSourceResource.Jsii$Proxy) o;

            if (!sourceName.equals(that.sourceName)) return false;
            return this.sourceVersion != null ? this.sourceVersion.equals(that.sourceVersion) : that.sourceVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceName.hashCode();
            result = 31 * result + (this.sourceVersion != null ? this.sourceVersion.hashCode() : 0);
            return result;
        }
    }
}
