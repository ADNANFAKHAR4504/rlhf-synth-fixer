package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.Jsii$Proxy.class)
public interface KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#date_value KendraDataSource#date_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDateValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#long_value KendraDataSource#long_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLongValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#string_list_value KendraDataSource#string_list_value}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStringListValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#string_value KendraDataSource#string_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStringValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue> {
        java.lang.String dateValue;
        java.lang.Number longValue;
        java.util.List<java.lang.String> stringListValue;
        java.lang.String stringValue;

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue#getDateValue}
         * @param dateValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#date_value KendraDataSource#date_value}.
         * @return {@code this}
         */
        public Builder dateValue(java.lang.String dateValue) {
            this.dateValue = dateValue;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue#getLongValue}
         * @param longValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#long_value KendraDataSource#long_value}.
         * @return {@code this}
         */
        public Builder longValue(java.lang.Number longValue) {
            this.longValue = longValue;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue#getStringListValue}
         * @param stringListValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#string_list_value KendraDataSource#string_list_value}.
         * @return {@code this}
         */
        public Builder stringListValue(java.util.List<java.lang.String> stringListValue) {
            this.stringListValue = stringListValue;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue#getStringValue}
         * @param stringValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#string_value KendraDataSource#string_value}.
         * @return {@code this}
         */
        public Builder stringValue(java.lang.String stringValue) {
            this.stringValue = stringValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue {
        private final java.lang.String dateValue;
        private final java.lang.Number longValue;
        private final java.util.List<java.lang.String> stringListValue;
        private final java.lang.String stringValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dateValue = software.amazon.jsii.Kernel.get(this, "dateValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longValue = software.amazon.jsii.Kernel.get(this, "longValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stringListValue = software.amazon.jsii.Kernel.get(this, "stringListValue", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.stringValue = software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dateValue = builder.dateValue;
            this.longValue = builder.longValue;
            this.stringListValue = builder.stringListValue;
            this.stringValue = builder.stringValue;
        }

        @Override
        public final java.lang.String getDateValue() {
            return this.dateValue;
        }

        @Override
        public final java.lang.Number getLongValue() {
            return this.longValue;
        }

        @Override
        public final java.util.List<java.lang.String> getStringListValue() {
            return this.stringListValue;
        }

        @Override
        public final java.lang.String getStringValue() {
            return this.stringValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDateValue() != null) {
                data.set("dateValue", om.valueToTree(this.getDateValue()));
            }
            if (this.getLongValue() != null) {
                data.set("longValue", om.valueToTree(this.getLongValue()));
            }
            if (this.getStringListValue() != null) {
                data.set("stringListValue", om.valueToTree(this.getStringListValue()));
            }
            if (this.getStringValue() != null) {
                data.set("stringValue", om.valueToTree(this.getStringValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.Jsii$Proxy that = (KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.Jsii$Proxy) o;

            if (this.dateValue != null ? !this.dateValue.equals(that.dateValue) : that.dateValue != null) return false;
            if (this.longValue != null ? !this.longValue.equals(that.longValue) : that.longValue != null) return false;
            if (this.stringListValue != null ? !this.stringListValue.equals(that.stringListValue) : that.stringListValue != null) return false;
            return this.stringValue != null ? this.stringValue.equals(that.stringValue) : that.stringValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dateValue != null ? this.dateValue.hashCode() : 0;
            result = 31 * result + (this.longValue != null ? this.longValue.hashCode() : 0);
            result = 31 * result + (this.stringListValue != null ? this.stringListValue.hashCode() : 0);
            result = 31 * result + (this.stringValue != null ? this.stringValue.hashCode() : 0);
            return result;
        }
    }
}
