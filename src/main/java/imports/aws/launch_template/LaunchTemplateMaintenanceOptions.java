package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateMaintenanceOptions")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateMaintenanceOptions.Jsii$Proxy.class)
public interface LaunchTemplateMaintenanceOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#auto_recovery LaunchTemplate#auto_recovery}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoRecovery() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateMaintenanceOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateMaintenanceOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateMaintenanceOptions> {
        java.lang.String autoRecovery;

        /**
         * Sets the value of {@link LaunchTemplateMaintenanceOptions#getAutoRecovery}
         * @param autoRecovery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#auto_recovery LaunchTemplate#auto_recovery}.
         * @return {@code this}
         */
        public Builder autoRecovery(java.lang.String autoRecovery) {
            this.autoRecovery = autoRecovery;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateMaintenanceOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateMaintenanceOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateMaintenanceOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateMaintenanceOptions {
        private final java.lang.String autoRecovery;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoRecovery = software.amazon.jsii.Kernel.get(this, "autoRecovery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoRecovery = builder.autoRecovery;
        }

        @Override
        public final java.lang.String getAutoRecovery() {
            return this.autoRecovery;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoRecovery() != null) {
                data.set("autoRecovery", om.valueToTree(this.getAutoRecovery()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateMaintenanceOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateMaintenanceOptions.Jsii$Proxy that = (LaunchTemplateMaintenanceOptions.Jsii$Proxy) o;

            return this.autoRecovery != null ? this.autoRecovery.equals(that.autoRecovery) : that.autoRecovery == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoRecovery != null ? this.autoRecovery.hashCode() : 0;
            return result;
        }
    }
}
