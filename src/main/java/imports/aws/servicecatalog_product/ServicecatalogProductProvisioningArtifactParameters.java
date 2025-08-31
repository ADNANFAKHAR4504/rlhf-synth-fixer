package imports.aws.servicecatalog_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProduct.ServicecatalogProductProvisioningArtifactParameters")
@software.amazon.jsii.Jsii.Proxy(ServicecatalogProductProvisioningArtifactParameters.Jsii$Proxy.class)
public interface ServicecatalogProductProvisioningArtifactParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#description ServicecatalogProduct#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#disable_template_validation ServicecatalogProduct#disable_template_validation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableTemplateValidation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#name ServicecatalogProduct#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#template_physical_id ServicecatalogProduct#template_physical_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplatePhysicalId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#template_url ServicecatalogProduct#template_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#type ServicecatalogProduct#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ServicecatalogProductProvisioningArtifactParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ServicecatalogProductProvisioningArtifactParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ServicecatalogProductProvisioningArtifactParameters> {
        java.lang.String description;
        java.lang.Object disableTemplateValidation;
        java.lang.String name;
        java.lang.String templatePhysicalId;
        java.lang.String templateUrl;
        java.lang.String type;

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#description ServicecatalogProduct#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getDisableTemplateValidation}
         * @param disableTemplateValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#disable_template_validation ServicecatalogProduct#disable_template_validation}.
         * @return {@code this}
         */
        public Builder disableTemplateValidation(java.lang.Boolean disableTemplateValidation) {
            this.disableTemplateValidation = disableTemplateValidation;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getDisableTemplateValidation}
         * @param disableTemplateValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#disable_template_validation ServicecatalogProduct#disable_template_validation}.
         * @return {@code this}
         */
        public Builder disableTemplateValidation(com.hashicorp.cdktf.IResolvable disableTemplateValidation) {
            this.disableTemplateValidation = disableTemplateValidation;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#name ServicecatalogProduct#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getTemplatePhysicalId}
         * @param templatePhysicalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#template_physical_id ServicecatalogProduct#template_physical_id}.
         * @return {@code this}
         */
        public Builder templatePhysicalId(java.lang.String templatePhysicalId) {
            this.templatePhysicalId = templatePhysicalId;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getTemplateUrl}
         * @param templateUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#template_url ServicecatalogProduct#template_url}.
         * @return {@code this}
         */
        public Builder templateUrl(java.lang.String templateUrl) {
            this.templateUrl = templateUrl;
            return this;
        }

        /**
         * Sets the value of {@link ServicecatalogProductProvisioningArtifactParameters#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/servicecatalog_product#type ServicecatalogProduct#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ServicecatalogProductProvisioningArtifactParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ServicecatalogProductProvisioningArtifactParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ServicecatalogProductProvisioningArtifactParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ServicecatalogProductProvisioningArtifactParameters {
        private final java.lang.String description;
        private final java.lang.Object disableTemplateValidation;
        private final java.lang.String name;
        private final java.lang.String templatePhysicalId;
        private final java.lang.String templateUrl;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableTemplateValidation = software.amazon.jsii.Kernel.get(this, "disableTemplateValidation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templatePhysicalId = software.amazon.jsii.Kernel.get(this, "templatePhysicalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateUrl = software.amazon.jsii.Kernel.get(this, "templateUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.description = builder.description;
            this.disableTemplateValidation = builder.disableTemplateValidation;
            this.name = builder.name;
            this.templatePhysicalId = builder.templatePhysicalId;
            this.templateUrl = builder.templateUrl;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDisableTemplateValidation() {
            return this.disableTemplateValidation;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTemplatePhysicalId() {
            return this.templatePhysicalId;
        }

        @Override
        public final java.lang.String getTemplateUrl() {
            return this.templateUrl;
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

            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisableTemplateValidation() != null) {
                data.set("disableTemplateValidation", om.valueToTree(this.getDisableTemplateValidation()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTemplatePhysicalId() != null) {
                data.set("templatePhysicalId", om.valueToTree(this.getTemplatePhysicalId()));
            }
            if (this.getTemplateUrl() != null) {
                data.set("templateUrl", om.valueToTree(this.getTemplateUrl()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.servicecatalogProduct.ServicecatalogProductProvisioningArtifactParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ServicecatalogProductProvisioningArtifactParameters.Jsii$Proxy that = (ServicecatalogProductProvisioningArtifactParameters.Jsii$Proxy) o;

            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disableTemplateValidation != null ? !this.disableTemplateValidation.equals(that.disableTemplateValidation) : that.disableTemplateValidation != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.templatePhysicalId != null ? !this.templatePhysicalId.equals(that.templatePhysicalId) : that.templatePhysicalId != null) return false;
            if (this.templateUrl != null ? !this.templateUrl.equals(that.templateUrl) : that.templateUrl != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.description != null ? this.description.hashCode() : 0;
            result = 31 * result + (this.disableTemplateValidation != null ? this.disableTemplateValidation.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.templatePhysicalId != null ? this.templatePhysicalId.hashCode() : 0);
            result = 31 * result + (this.templateUrl != null ? this.templateUrl.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
