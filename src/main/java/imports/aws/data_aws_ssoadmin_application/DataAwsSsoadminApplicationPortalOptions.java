package imports.aws.data_aws_ssoadmin_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.892Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsoadminApplication.DataAwsSsoadminApplicationPortalOptions")
@software.amazon.jsii.Jsii.Proxy(DataAwsSsoadminApplicationPortalOptions.Jsii$Proxy.class)
public interface DataAwsSsoadminApplicationPortalOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * sign_in_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application#sign_in_options DataAwsSsoadminApplication#sign_in_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSignInOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsSsoadminApplicationPortalOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsSsoadminApplicationPortalOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsSsoadminApplicationPortalOptions> {
        java.lang.Object signInOptions;

        /**
         * Sets the value of {@link DataAwsSsoadminApplicationPortalOptions#getSignInOptions}
         * @param signInOptions sign_in_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application#sign_in_options DataAwsSsoadminApplication#sign_in_options}
         * @return {@code this}
         */
        public Builder signInOptions(com.hashicorp.cdktf.IResolvable signInOptions) {
            this.signInOptions = signInOptions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSsoadminApplicationPortalOptions#getSignInOptions}
         * @param signInOptions sign_in_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application#sign_in_options DataAwsSsoadminApplication#sign_in_options}
         * @return {@code this}
         */
        public Builder signInOptions(java.util.List<? extends imports.aws.data_aws_ssoadmin_application.DataAwsSsoadminApplicationPortalOptionsSignInOptions> signInOptions) {
            this.signInOptions = signInOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsSsoadminApplicationPortalOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsSsoadminApplicationPortalOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsSsoadminApplicationPortalOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsSsoadminApplicationPortalOptions {
        private final java.lang.Object signInOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.signInOptions = software.amazon.jsii.Kernel.get(this, "signInOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.signInOptions = builder.signInOptions;
        }

        @Override
        public final java.lang.Object getSignInOptions() {
            return this.signInOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSignInOptions() != null) {
                data.set("signInOptions", om.valueToTree(this.getSignInOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsSsoadminApplication.DataAwsSsoadminApplicationPortalOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsSsoadminApplicationPortalOptions.Jsii$Proxy that = (DataAwsSsoadminApplicationPortalOptions.Jsii$Proxy) o;

            return this.signInOptions != null ? this.signInOptions.equals(that.signInOptions) : that.signInOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.signInOptions != null ? this.signInOptions.hashCode() : 0;
            return result;
        }
    }
}
