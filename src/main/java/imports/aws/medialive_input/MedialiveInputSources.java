package imports.aws.medialive_input;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.892Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveInput.MedialiveInputSources")
@software.amazon.jsii.Jsii.Proxy(MedialiveInputSources.Jsii$Proxy.class)
public interface MedialiveInputSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#password_param MedialiveInput#password_param}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPasswordParam();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#url MedialiveInput#url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#username MedialiveInput#username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUsername();

    /**
     * @return a {@link Builder} of {@link MedialiveInputSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveInputSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveInputSources> {
        java.lang.String passwordParam;
        java.lang.String url;
        java.lang.String username;

        /**
         * Sets the value of {@link MedialiveInputSources#getPasswordParam}
         * @param passwordParam Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#password_param MedialiveInput#password_param}. This parameter is required.
         * @return {@code this}
         */
        public Builder passwordParam(java.lang.String passwordParam) {
            this.passwordParam = passwordParam;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveInputSources#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#url MedialiveInput#url}. This parameter is required.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveInputSources#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_input#username MedialiveInput#username}. This parameter is required.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveInputSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveInputSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveInputSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveInputSources {
        private final java.lang.String passwordParam;
        private final java.lang.String url;
        private final java.lang.String username;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.passwordParam = software.amazon.jsii.Kernel.get(this, "passwordParam", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.passwordParam = java.util.Objects.requireNonNull(builder.passwordParam, "passwordParam is required");
            this.url = java.util.Objects.requireNonNull(builder.url, "url is required");
            this.username = java.util.Objects.requireNonNull(builder.username, "username is required");
        }

        @Override
        public final java.lang.String getPasswordParam() {
            return this.passwordParam;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("passwordParam", om.valueToTree(this.getPasswordParam()));
            data.set("url", om.valueToTree(this.getUrl()));
            data.set("username", om.valueToTree(this.getUsername()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveInput.MedialiveInputSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveInputSources.Jsii$Proxy that = (MedialiveInputSources.Jsii$Proxy) o;

            if (!passwordParam.equals(that.passwordParam)) return false;
            if (!url.equals(that.url)) return false;
            return this.username.equals(that.username);
        }

        @Override
        public final int hashCode() {
            int result = this.passwordParam.hashCode();
            result = 31 * result + (this.url.hashCode());
            result = 31 * result + (this.username.hashCode());
            return result;
        }
    }
}
