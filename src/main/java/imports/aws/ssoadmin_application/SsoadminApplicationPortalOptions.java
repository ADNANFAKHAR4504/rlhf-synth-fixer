package imports.aws.ssoadmin_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.519Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminApplication.SsoadminApplicationPortalOptions")
@software.amazon.jsii.Jsii.Proxy(SsoadminApplicationPortalOptions.Jsii$Proxy.class)
public interface SsoadminApplicationPortalOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * sign_in_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#sign_in_options SsoadminApplication#sign_in_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSignInOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#visibility SsoadminApplication#visibility}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVisibility() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsoadminApplicationPortalOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminApplicationPortalOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminApplicationPortalOptions> {
        java.lang.Object signInOptions;
        java.lang.String visibility;

        /**
         * Sets the value of {@link SsoadminApplicationPortalOptions#getSignInOptions}
         * @param signInOptions sign_in_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#sign_in_options SsoadminApplication#sign_in_options}
         * @return {@code this}
         */
        public Builder signInOptions(com.hashicorp.cdktf.IResolvable signInOptions) {
            this.signInOptions = signInOptions;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminApplicationPortalOptions#getSignInOptions}
         * @param signInOptions sign_in_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#sign_in_options SsoadminApplication#sign_in_options}
         * @return {@code this}
         */
        public Builder signInOptions(java.util.List<? extends imports.aws.ssoadmin_application.SsoadminApplicationPortalOptionsSignInOptions> signInOptions) {
            this.signInOptions = signInOptions;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminApplicationPortalOptions#getVisibility}
         * @param visibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_application#visibility SsoadminApplication#visibility}.
         * @return {@code this}
         */
        public Builder visibility(java.lang.String visibility) {
            this.visibility = visibility;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminApplicationPortalOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminApplicationPortalOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminApplicationPortalOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminApplicationPortalOptions {
        private final java.lang.Object signInOptions;
        private final java.lang.String visibility;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.signInOptions = software.amazon.jsii.Kernel.get(this, "signInOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.visibility = software.amazon.jsii.Kernel.get(this, "visibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.signInOptions = builder.signInOptions;
            this.visibility = builder.visibility;
        }

        @Override
        public final java.lang.Object getSignInOptions() {
            return this.signInOptions;
        }

        @Override
        public final java.lang.String getVisibility() {
            return this.visibility;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSignInOptions() != null) {
                data.set("signInOptions", om.valueToTree(this.getSignInOptions()));
            }
            if (this.getVisibility() != null) {
                data.set("visibility", om.valueToTree(this.getVisibility()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminApplication.SsoadminApplicationPortalOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminApplicationPortalOptions.Jsii$Proxy that = (SsoadminApplicationPortalOptions.Jsii$Proxy) o;

            if (this.signInOptions != null ? !this.signInOptions.equals(that.signInOptions) : that.signInOptions != null) return false;
            return this.visibility != null ? this.visibility.equals(that.visibility) : that.visibility == null;
        }

        @Override
        public final int hashCode() {
            int result = this.signInOptions != null ? this.signInOptions.hashCode() : 0;
            result = 31 * result + (this.visibility != null ? this.visibility.hashCode() : 0);
            return result;
        }
    }
}
