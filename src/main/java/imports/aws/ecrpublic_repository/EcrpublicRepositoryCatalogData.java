package imports.aws.ecrpublic_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrpublicRepository.EcrpublicRepositoryCatalogData")
@software.amazon.jsii.Jsii.Proxy(EcrpublicRepositoryCatalogData.Jsii$Proxy.class)
public interface EcrpublicRepositoryCatalogData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#about_text EcrpublicRepository#about_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAboutText() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#architectures EcrpublicRepository#architectures}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArchitectures() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#description EcrpublicRepository#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#logo_image_blob EcrpublicRepository#logo_image_blob}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogoImageBlob() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#operating_systems EcrpublicRepository#operating_systems}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOperatingSystems() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#usage_text EcrpublicRepository#usage_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsageText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrpublicRepositoryCatalogData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrpublicRepositoryCatalogData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrpublicRepositoryCatalogData> {
        java.lang.String aboutText;
        java.util.List<java.lang.String> architectures;
        java.lang.String description;
        java.lang.String logoImageBlob;
        java.util.List<java.lang.String> operatingSystems;
        java.lang.String usageText;

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getAboutText}
         * @param aboutText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#about_text EcrpublicRepository#about_text}.
         * @return {@code this}
         */
        public Builder aboutText(java.lang.String aboutText) {
            this.aboutText = aboutText;
            return this;
        }

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getArchitectures}
         * @param architectures Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#architectures EcrpublicRepository#architectures}.
         * @return {@code this}
         */
        public Builder architectures(java.util.List<java.lang.String> architectures) {
            this.architectures = architectures;
            return this;
        }

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#description EcrpublicRepository#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getLogoImageBlob}
         * @param logoImageBlob Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#logo_image_blob EcrpublicRepository#logo_image_blob}.
         * @return {@code this}
         */
        public Builder logoImageBlob(java.lang.String logoImageBlob) {
            this.logoImageBlob = logoImageBlob;
            return this;
        }

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getOperatingSystems}
         * @param operatingSystems Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#operating_systems EcrpublicRepository#operating_systems}.
         * @return {@code this}
         */
        public Builder operatingSystems(java.util.List<java.lang.String> operatingSystems) {
            this.operatingSystems = operatingSystems;
            return this;
        }

        /**
         * Sets the value of {@link EcrpublicRepositoryCatalogData#getUsageText}
         * @param usageText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecrpublic_repository#usage_text EcrpublicRepository#usage_text}.
         * @return {@code this}
         */
        public Builder usageText(java.lang.String usageText) {
            this.usageText = usageText;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrpublicRepositoryCatalogData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrpublicRepositoryCatalogData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrpublicRepositoryCatalogData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrpublicRepositoryCatalogData {
        private final java.lang.String aboutText;
        private final java.util.List<java.lang.String> architectures;
        private final java.lang.String description;
        private final java.lang.String logoImageBlob;
        private final java.util.List<java.lang.String> operatingSystems;
        private final java.lang.String usageText;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aboutText = software.amazon.jsii.Kernel.get(this, "aboutText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.architectures = software.amazon.jsii.Kernel.get(this, "architectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logoImageBlob = software.amazon.jsii.Kernel.get(this, "logoImageBlob", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operatingSystems = software.amazon.jsii.Kernel.get(this, "operatingSystems", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.usageText = software.amazon.jsii.Kernel.get(this, "usageText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aboutText = builder.aboutText;
            this.architectures = builder.architectures;
            this.description = builder.description;
            this.logoImageBlob = builder.logoImageBlob;
            this.operatingSystems = builder.operatingSystems;
            this.usageText = builder.usageText;
        }

        @Override
        public final java.lang.String getAboutText() {
            return this.aboutText;
        }

        @Override
        public final java.util.List<java.lang.String> getArchitectures() {
            return this.architectures;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getLogoImageBlob() {
            return this.logoImageBlob;
        }

        @Override
        public final java.util.List<java.lang.String> getOperatingSystems() {
            return this.operatingSystems;
        }

        @Override
        public final java.lang.String getUsageText() {
            return this.usageText;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAboutText() != null) {
                data.set("aboutText", om.valueToTree(this.getAboutText()));
            }
            if (this.getArchitectures() != null) {
                data.set("architectures", om.valueToTree(this.getArchitectures()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getLogoImageBlob() != null) {
                data.set("logoImageBlob", om.valueToTree(this.getLogoImageBlob()));
            }
            if (this.getOperatingSystems() != null) {
                data.set("operatingSystems", om.valueToTree(this.getOperatingSystems()));
            }
            if (this.getUsageText() != null) {
                data.set("usageText", om.valueToTree(this.getUsageText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrpublicRepository.EcrpublicRepositoryCatalogData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrpublicRepositoryCatalogData.Jsii$Proxy that = (EcrpublicRepositoryCatalogData.Jsii$Proxy) o;

            if (this.aboutText != null ? !this.aboutText.equals(that.aboutText) : that.aboutText != null) return false;
            if (this.architectures != null ? !this.architectures.equals(that.architectures) : that.architectures != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.logoImageBlob != null ? !this.logoImageBlob.equals(that.logoImageBlob) : that.logoImageBlob != null) return false;
            if (this.operatingSystems != null ? !this.operatingSystems.equals(that.operatingSystems) : that.operatingSystems != null) return false;
            return this.usageText != null ? this.usageText.equals(that.usageText) : that.usageText == null;
        }

        @Override
        public final int hashCode() {
            int result = this.aboutText != null ? this.aboutText.hashCode() : 0;
            result = 31 * result + (this.architectures != null ? this.architectures.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.logoImageBlob != null ? this.logoImageBlob.hashCode() : 0);
            result = 31 * result + (this.operatingSystems != null ? this.operatingSystems.hashCode() : 0);
            result = 31 * result + (this.usageText != null ? this.usageText.hashCode() : 0);
            return result;
        }
    }
}
