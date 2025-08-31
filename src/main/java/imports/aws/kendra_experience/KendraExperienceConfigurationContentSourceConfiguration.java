package imports.aws.kendra_experience;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.432Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraExperience.KendraExperienceConfigurationContentSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraExperienceConfigurationContentSourceConfiguration.Jsii$Proxy.class)
public interface KendraExperienceConfigurationContentSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#data_source_ids KendraExperience#data_source_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataSourceIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#direct_put_content KendraExperience#direct_put_content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDirectPutContent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#faq_ids KendraExperience#faq_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFaqIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraExperienceConfigurationContentSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraExperienceConfigurationContentSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraExperienceConfigurationContentSourceConfiguration> {
        java.util.List<java.lang.String> dataSourceIds;
        java.lang.Object directPutContent;
        java.util.List<java.lang.String> faqIds;

        /**
         * Sets the value of {@link KendraExperienceConfigurationContentSourceConfiguration#getDataSourceIds}
         * @param dataSourceIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#data_source_ids KendraExperience#data_source_ids}.
         * @return {@code this}
         */
        public Builder dataSourceIds(java.util.List<java.lang.String> dataSourceIds) {
            this.dataSourceIds = dataSourceIds;
            return this;
        }

        /**
         * Sets the value of {@link KendraExperienceConfigurationContentSourceConfiguration#getDirectPutContent}
         * @param directPutContent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#direct_put_content KendraExperience#direct_put_content}.
         * @return {@code this}
         */
        public Builder directPutContent(java.lang.Boolean directPutContent) {
            this.directPutContent = directPutContent;
            return this;
        }

        /**
         * Sets the value of {@link KendraExperienceConfigurationContentSourceConfiguration#getDirectPutContent}
         * @param directPutContent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#direct_put_content KendraExperience#direct_put_content}.
         * @return {@code this}
         */
        public Builder directPutContent(com.hashicorp.cdktf.IResolvable directPutContent) {
            this.directPutContent = directPutContent;
            return this;
        }

        /**
         * Sets the value of {@link KendraExperienceConfigurationContentSourceConfiguration#getFaqIds}
         * @param faqIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#faq_ids KendraExperience#faq_ids}.
         * @return {@code this}
         */
        public Builder faqIds(java.util.List<java.lang.String> faqIds) {
            this.faqIds = faqIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraExperienceConfigurationContentSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraExperienceConfigurationContentSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraExperienceConfigurationContentSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraExperienceConfigurationContentSourceConfiguration {
        private final java.util.List<java.lang.String> dataSourceIds;
        private final java.lang.Object directPutContent;
        private final java.util.List<java.lang.String> faqIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSourceIds = software.amazon.jsii.Kernel.get(this, "dataSourceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.directPutContent = software.amazon.jsii.Kernel.get(this, "directPutContent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.faqIds = software.amazon.jsii.Kernel.get(this, "faqIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSourceIds = builder.dataSourceIds;
            this.directPutContent = builder.directPutContent;
            this.faqIds = builder.faqIds;
        }

        @Override
        public final java.util.List<java.lang.String> getDataSourceIds() {
            return this.dataSourceIds;
        }

        @Override
        public final java.lang.Object getDirectPutContent() {
            return this.directPutContent;
        }

        @Override
        public final java.util.List<java.lang.String> getFaqIds() {
            return this.faqIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataSourceIds() != null) {
                data.set("dataSourceIds", om.valueToTree(this.getDataSourceIds()));
            }
            if (this.getDirectPutContent() != null) {
                data.set("directPutContent", om.valueToTree(this.getDirectPutContent()));
            }
            if (this.getFaqIds() != null) {
                data.set("faqIds", om.valueToTree(this.getFaqIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraExperience.KendraExperienceConfigurationContentSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraExperienceConfigurationContentSourceConfiguration.Jsii$Proxy that = (KendraExperienceConfigurationContentSourceConfiguration.Jsii$Proxy) o;

            if (this.dataSourceIds != null ? !this.dataSourceIds.equals(that.dataSourceIds) : that.dataSourceIds != null) return false;
            if (this.directPutContent != null ? !this.directPutContent.equals(that.directPutContent) : that.directPutContent != null) return false;
            return this.faqIds != null ? this.faqIds.equals(that.faqIds) : that.faqIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataSourceIds != null ? this.dataSourceIds.hashCode() : 0;
            result = 31 * result + (this.directPutContent != null ? this.directPutContent.hashCode() : 0);
            result = 31 * result + (this.faqIds != null ? this.faqIds.hashCode() : 0);
            return result;
        }
    }
}
