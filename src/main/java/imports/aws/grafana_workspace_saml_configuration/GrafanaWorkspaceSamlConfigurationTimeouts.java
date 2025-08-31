package imports.aws.grafana_workspace_saml_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.314Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspaceSamlConfiguration.GrafanaWorkspaceSamlConfigurationTimeouts")
@software.amazon.jsii.Jsii.Proxy(GrafanaWorkspaceSamlConfigurationTimeouts.Jsii$Proxy.class)
public interface GrafanaWorkspaceSamlConfigurationTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#create GrafanaWorkspaceSamlConfiguration#create}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#delete GrafanaWorkspaceSamlConfiguration#delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelete() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GrafanaWorkspaceSamlConfigurationTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GrafanaWorkspaceSamlConfigurationTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GrafanaWorkspaceSamlConfigurationTimeouts> {
        java.lang.String create;
        java.lang.String delete;

        /**
         * Sets the value of {@link GrafanaWorkspaceSamlConfigurationTimeouts#getCreate}
         * @param create Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#create GrafanaWorkspaceSamlConfiguration#create}.
         * @return {@code this}
         */
        public Builder create(java.lang.String create) {
            this.create = create;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceSamlConfigurationTimeouts#getDelete}
         * @param delete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace_saml_configuration#delete GrafanaWorkspaceSamlConfiguration#delete}.
         * @return {@code this}
         */
        public Builder delete(java.lang.String delete) {
            this.delete = delete;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GrafanaWorkspaceSamlConfigurationTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GrafanaWorkspaceSamlConfigurationTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GrafanaWorkspaceSamlConfigurationTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GrafanaWorkspaceSamlConfigurationTimeouts {
        private final java.lang.String create;
        private final java.lang.String delete;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.create = software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.delete = software.amazon.jsii.Kernel.get(this, "delete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.create = builder.create;
            this.delete = builder.delete;
        }

        @Override
        public final java.lang.String getCreate() {
            return this.create;
        }

        @Override
        public final java.lang.String getDelete() {
            return this.delete;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreate() != null) {
                data.set("create", om.valueToTree(this.getCreate()));
            }
            if (this.getDelete() != null) {
                data.set("delete", om.valueToTree(this.getDelete()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.grafanaWorkspaceSamlConfiguration.GrafanaWorkspaceSamlConfigurationTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GrafanaWorkspaceSamlConfigurationTimeouts.Jsii$Proxy that = (GrafanaWorkspaceSamlConfigurationTimeouts.Jsii$Proxy) o;

            if (this.create != null ? !this.create.equals(that.create) : that.create != null) return false;
            return this.delete != null ? this.delete.equals(that.delete) : that.delete == null;
        }

        @Override
        public final int hashCode() {
            int result = this.create != null ? this.create.hashCode() : 0;
            result = 31 * result + (this.delete != null ? this.delete.hashCode() : 0);
            return result;
        }
    }
}
