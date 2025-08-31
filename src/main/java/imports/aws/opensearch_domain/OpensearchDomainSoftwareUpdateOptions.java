package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainSoftwareUpdateOptions")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainSoftwareUpdateOptions.Jsii$Proxy.class)
public interface OpensearchDomainSoftwareUpdateOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#auto_software_update_enabled OpensearchDomain#auto_software_update_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoSoftwareUpdateEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainSoftwareUpdateOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainSoftwareUpdateOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainSoftwareUpdateOptions> {
        java.lang.Object autoSoftwareUpdateEnabled;

        /**
         * Sets the value of {@link OpensearchDomainSoftwareUpdateOptions#getAutoSoftwareUpdateEnabled}
         * @param autoSoftwareUpdateEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#auto_software_update_enabled OpensearchDomain#auto_software_update_enabled}.
         * @return {@code this}
         */
        public Builder autoSoftwareUpdateEnabled(java.lang.Boolean autoSoftwareUpdateEnabled) {
            this.autoSoftwareUpdateEnabled = autoSoftwareUpdateEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainSoftwareUpdateOptions#getAutoSoftwareUpdateEnabled}
         * @param autoSoftwareUpdateEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#auto_software_update_enabled OpensearchDomain#auto_software_update_enabled}.
         * @return {@code this}
         */
        public Builder autoSoftwareUpdateEnabled(com.hashicorp.cdktf.IResolvable autoSoftwareUpdateEnabled) {
            this.autoSoftwareUpdateEnabled = autoSoftwareUpdateEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainSoftwareUpdateOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainSoftwareUpdateOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainSoftwareUpdateOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainSoftwareUpdateOptions {
        private final java.lang.Object autoSoftwareUpdateEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoSoftwareUpdateEnabled = software.amazon.jsii.Kernel.get(this, "autoSoftwareUpdateEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoSoftwareUpdateEnabled = builder.autoSoftwareUpdateEnabled;
        }

        @Override
        public final java.lang.Object getAutoSoftwareUpdateEnabled() {
            return this.autoSoftwareUpdateEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoSoftwareUpdateEnabled() != null) {
                data.set("autoSoftwareUpdateEnabled", om.valueToTree(this.getAutoSoftwareUpdateEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainSoftwareUpdateOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainSoftwareUpdateOptions.Jsii$Proxy that = (OpensearchDomainSoftwareUpdateOptions.Jsii$Proxy) o;

            return this.autoSoftwareUpdateEnabled != null ? this.autoSoftwareUpdateEnabled.equals(that.autoSoftwareUpdateEnabled) : that.autoSoftwareUpdateEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoSoftwareUpdateEnabled != null ? this.autoSoftwareUpdateEnabled.hashCode() : 0;
            return result;
        }
    }
}
