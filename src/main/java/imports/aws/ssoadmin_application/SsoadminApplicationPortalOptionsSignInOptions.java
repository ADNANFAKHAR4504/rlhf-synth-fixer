package imports.aws.ssoadmin_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.519Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminApplication.SsoadminApplicationPortalOptionsSignInOptions")
@software.amazon.jsii.Jsii.Proxy(SsoadminApplicationPortalOptionsSignInOptions.Jsii$Proxy.class)
public interface SsoadminApplicationPortalOptionsSignInOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#origin SsoadminApplication#origin}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOrigin();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#application_url SsoadminApplication#application_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsoadminApplicationPortalOptionsSignInOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminApplicationPortalOptionsSignInOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminApplicationPortalOptionsSignInOptions> {
        java.lang.String origin;
        java.lang.String applicationUrl;

        /**
         * Sets the value of {@link SsoadminApplicationPortalOptionsSignInOptions#getOrigin}
         * @param origin Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#origin SsoadminApplication#origin}. This parameter is required.
         * @return {@code this}
         */
        public Builder origin(java.lang.String origin) {
            this.origin = origin;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminApplicationPortalOptionsSignInOptions#getApplicationUrl}
         * @param applicationUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#application_url SsoadminApplication#application_url}.
         * @return {@code this}
         */
        public Builder applicationUrl(java.lang.String applicationUrl) {
            this.applicationUrl = applicationUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminApplicationPortalOptionsSignInOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminApplicationPortalOptionsSignInOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminApplicationPortalOptionsSignInOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminApplicationPortalOptionsSignInOptions {
        private final java.lang.String origin;
        private final java.lang.String applicationUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.origin = software.amazon.jsii.Kernel.get(this, "origin", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationUrl = software.amazon.jsii.Kernel.get(this, "applicationUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.origin = java.util.Objects.requireNonNull(builder.origin, "origin is required");
            this.applicationUrl = builder.applicationUrl;
        }

        @Override
        public final java.lang.String getOrigin() {
            return this.origin;
        }

        @Override
        public final java.lang.String getApplicationUrl() {
            return this.applicationUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("origin", om.valueToTree(this.getOrigin()));
            if (this.getApplicationUrl() != null) {
                data.set("applicationUrl", om.valueToTree(this.getApplicationUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminApplication.SsoadminApplicationPortalOptionsSignInOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminApplicationPortalOptionsSignInOptions.Jsii$Proxy that = (SsoadminApplicationPortalOptionsSignInOptions.Jsii$Proxy) o;

            if (!origin.equals(that.origin)) return false;
            return this.applicationUrl != null ? this.applicationUrl.equals(that.applicationUrl) : that.applicationUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.origin.hashCode();
            result = 31 * result + (this.applicationUrl != null ? this.applicationUrl.hashCode() : 0);
            return result;
        }
    }
}
