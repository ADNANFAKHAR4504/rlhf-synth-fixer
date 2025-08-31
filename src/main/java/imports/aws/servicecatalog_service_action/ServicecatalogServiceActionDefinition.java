package imports.aws.servicecatalog_service_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.437Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogServiceAction.ServicecatalogServiceActionDefinition")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogServiceActionDefinition.Jsii$Proxy.class)
public interface ServicecatalogServiceActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#name ServicecatalogServiceAction#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#version ServicecatalogServiceAction#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#assume_role ServicecatalogServiceAction#assume_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAssumeRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#parameters ServicecatalogServiceAction#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#type ServicecatalogServiceAction#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogServiceActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogServiceActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogServiceActionDefinition> {
        java.lang.String name;
        java.lang.String version;
        java.lang.String assumeRole;
        java.lang.String parameters;
        java.lang.String type;

        /**
         * Sets the value of {@link ServicecatalogServiceActionDefinition#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#name ServicecatalogServiceAction#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogServiceActionDefinition#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#version ServicecatalogServiceAction#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogServiceActionDefinition#getAssumeRole}
         * @param assumeRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#assume_role ServicecatalogServiceAction#assume_role}.
         * @return {@code this}
         */
        public Builder assumeRole(java.lang.String assumeRole) {
            this.assumeRole = assumeRole;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogServiceActionDefinition#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#parameters ServicecatalogServiceAction#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.lang.String parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogServiceActionDefinition#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_service_action#type ServicecatalogServiceAction#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServicecatalogServiceActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogServiceActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogServiceActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogServiceActionDefinition {
        private final java.lang.String name;
        private final java.lang.String version;
        private final java.lang.String assumeRole;
        private final java.lang.String parameters;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.assumeRole = software.amazon.jsii.Kernel.get(this, "assumeRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.assumeRole = builder.assumeRole;
            this.parameters = builder.parameters;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.lang.String getAssumeRole() {
            return this.assumeRole;
        }

        @Override
        public final java.lang.String getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getAssumeRole() != null) {
                data.set("assumeRole", om.valueToTree(this.getAssumeRole()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.servicecatalogServiceAction.ServicecatalogServiceActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogServiceActionDefinition.Jsii$Proxy that = (ServicecatalogServiceActionDefinition.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!version.equals(that.version)) return false;
            if (this.assumeRole != null ? !this.assumeRole.equals(that.assumeRole) : that.assumeRole != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.assumeRole != null ? this.assumeRole.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
