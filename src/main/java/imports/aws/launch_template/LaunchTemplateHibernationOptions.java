package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.520Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateHibernationOptions")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateHibernationOptions.Jsii$Proxy.class)
public interface LaunchTemplateHibernationOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#configured LaunchTemplate#configured}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getConfigured();

    /**
     * @return a {@link Builder} of {@link LaunchTemplateHibernationOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateHibernationOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateHibernationOptions> {
        java.lang.Object configured;

        /**
         * Sets the value of {@link LaunchTemplateHibernationOptions#getConfigured}
         * @param configured Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#configured LaunchTemplate#configured}. This parameter is required.
         * @return {@code this}
         */
        public Builder configured(java.lang.Boolean configured) {
            this.configured = configured;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateHibernationOptions#getConfigured}
         * @param configured Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#configured LaunchTemplate#configured}. This parameter is required.
         * @return {@code this}
         */
        public Builder configured(com.hashicorp.cdktf.IResolvable configured) {
            this.configured = configured;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateHibernationOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateHibernationOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateHibernationOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateHibernationOptions {
        private final java.lang.Object configured;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configured = software.amazon.jsii.Kernel.get(this, "configured", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configured = java.util.Objects.requireNonNull(builder.configured, "configured is required");
        }

        @Override
        public final java.lang.Object getConfigured() {
            return this.configured;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configured", om.valueToTree(this.getConfigured()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateHibernationOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateHibernationOptions.Jsii$Proxy that = (LaunchTemplateHibernationOptions.Jsii$Proxy) o;

            return this.configured.equals(that.configured);
        }

        @Override
        public final int hashCode() {
            int result = this.configured.hashCode();
            return result;
        }
    }
}
