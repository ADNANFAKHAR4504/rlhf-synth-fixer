package imports.aws.appconfig_extension;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.985Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigExtension.AppconfigExtensionParameter")
@software.amazon.jsii.Jsii.Proxy(AppconfigExtensionParameter.Jsii$Proxy.class)
public interface AppconfigExtensionParameter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#name AppconfigExtension#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#description AppconfigExtension#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#required AppconfigExtension#required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequired() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppconfigExtensionParameter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppconfigExtensionParameter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppconfigExtensionParameter> {
        java.lang.String name;
        java.lang.String description;
        java.lang.Object required;

        /**
         * Sets the value of {@link AppconfigExtensionParameter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#name AppconfigExtension#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigExtensionParameter#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#description AppconfigExtension#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigExtensionParameter#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#required AppconfigExtension#required}.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigExtensionParameter#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#required AppconfigExtension#required}.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppconfigExtensionParameter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppconfigExtensionParameter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppconfigExtensionParameter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppconfigExtensionParameter {
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Object required;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.required = builder.required;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getRequired() != null) {
                data.set("required", om.valueToTree(this.getRequired()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appconfigExtension.AppconfigExtensionParameter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppconfigExtensionParameter.Jsii$Proxy that = (AppconfigExtensionParameter.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.required != null ? this.required.equals(that.required) : that.required == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.required != null ? this.required.hashCode() : 0);
            return result;
        }
    }
}
