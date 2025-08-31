package imports.aws.glue_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueClassifier.GlueClassifierCsvClassifier")
@software.amazon.jsii.Jsii.Proxy(GlueClassifierCsvClassifier.Jsii$Proxy.class)
public interface GlueClassifierCsvClassifier extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#allow_single_column GlueClassifier#allow_single_column}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowSingleColumn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#contains_header GlueClassifier#contains_header}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContainsHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_datatype_configured GlueClassifier#custom_datatype_configured}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomDatatypeConfigured() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_datatypes GlueClassifier#custom_datatypes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCustomDatatypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#delimiter GlueClassifier#delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#disable_value_trimming GlueClassifier#disable_value_trimming}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableValueTrimming() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#header GlueClassifier#header}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#quote_symbol GlueClassifier#quote_symbol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQuoteSymbol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#serde GlueClassifier#serde}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSerde() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueClassifierCsvClassifier}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueClassifierCsvClassifier}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueClassifierCsvClassifier> {
        java.lang.Object allowSingleColumn;
        java.lang.String containsHeader;
        java.lang.Object customDatatypeConfigured;
        java.util.List<java.lang.String> customDatatypes;
        java.lang.String delimiter;
        java.lang.Object disableValueTrimming;
        java.util.List<java.lang.String> header;
        java.lang.String quoteSymbol;
        java.lang.String serde;

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getAllowSingleColumn}
         * @param allowSingleColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#allow_single_column GlueClassifier#allow_single_column}.
         * @return {@code this}
         */
        public Builder allowSingleColumn(java.lang.Boolean allowSingleColumn) {
            this.allowSingleColumn = allowSingleColumn;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getAllowSingleColumn}
         * @param allowSingleColumn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#allow_single_column GlueClassifier#allow_single_column}.
         * @return {@code this}
         */
        public Builder allowSingleColumn(com.hashicorp.cdktf.IResolvable allowSingleColumn) {
            this.allowSingleColumn = allowSingleColumn;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getContainsHeader}
         * @param containsHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#contains_header GlueClassifier#contains_header}.
         * @return {@code this}
         */
        public Builder containsHeader(java.lang.String containsHeader) {
            this.containsHeader = containsHeader;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getCustomDatatypeConfigured}
         * @param customDatatypeConfigured Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_datatype_configured GlueClassifier#custom_datatype_configured}.
         * @return {@code this}
         */
        public Builder customDatatypeConfigured(java.lang.Boolean customDatatypeConfigured) {
            this.customDatatypeConfigured = customDatatypeConfigured;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getCustomDatatypeConfigured}
         * @param customDatatypeConfigured Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_datatype_configured GlueClassifier#custom_datatype_configured}.
         * @return {@code this}
         */
        public Builder customDatatypeConfigured(com.hashicorp.cdktf.IResolvable customDatatypeConfigured) {
            this.customDatatypeConfigured = customDatatypeConfigured;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getCustomDatatypes}
         * @param customDatatypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_datatypes GlueClassifier#custom_datatypes}.
         * @return {@code this}
         */
        public Builder customDatatypes(java.util.List<java.lang.String> customDatatypes) {
            this.customDatatypes = customDatatypes;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getDelimiter}
         * @param delimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#delimiter GlueClassifier#delimiter}.
         * @return {@code this}
         */
        public Builder delimiter(java.lang.String delimiter) {
            this.delimiter = delimiter;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getDisableValueTrimming}
         * @param disableValueTrimming Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#disable_value_trimming GlueClassifier#disable_value_trimming}.
         * @return {@code this}
         */
        public Builder disableValueTrimming(java.lang.Boolean disableValueTrimming) {
            this.disableValueTrimming = disableValueTrimming;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getDisableValueTrimming}
         * @param disableValueTrimming Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#disable_value_trimming GlueClassifier#disable_value_trimming}.
         * @return {@code this}
         */
        public Builder disableValueTrimming(com.hashicorp.cdktf.IResolvable disableValueTrimming) {
            this.disableValueTrimming = disableValueTrimming;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getHeader}
         * @param header Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#header GlueClassifier#header}.
         * @return {@code this}
         */
        public Builder header(java.util.List<java.lang.String> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getQuoteSymbol}
         * @param quoteSymbol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#quote_symbol GlueClassifier#quote_symbol}.
         * @return {@code this}
         */
        public Builder quoteSymbol(java.lang.String quoteSymbol) {
            this.quoteSymbol = quoteSymbol;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierCsvClassifier#getSerde}
         * @param serde Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#serde GlueClassifier#serde}.
         * @return {@code this}
         */
        public Builder serde(java.lang.String serde) {
            this.serde = serde;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueClassifierCsvClassifier}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueClassifierCsvClassifier build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueClassifierCsvClassifier}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueClassifierCsvClassifier {
        private final java.lang.Object allowSingleColumn;
        private final java.lang.String containsHeader;
        private final java.lang.Object customDatatypeConfigured;
        private final java.util.List<java.lang.String> customDatatypes;
        private final java.lang.String delimiter;
        private final java.lang.Object disableValueTrimming;
        private final java.util.List<java.lang.String> header;
        private final java.lang.String quoteSymbol;
        private final java.lang.String serde;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowSingleColumn = software.amazon.jsii.Kernel.get(this, "allowSingleColumn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.containsHeader = software.amazon.jsii.Kernel.get(this, "containsHeader", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customDatatypeConfigured = software.amazon.jsii.Kernel.get(this, "customDatatypeConfigured", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customDatatypes = software.amazon.jsii.Kernel.get(this, "customDatatypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.delimiter = software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableValueTrimming = software.amazon.jsii.Kernel.get(this, "disableValueTrimming", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.quoteSymbol = software.amazon.jsii.Kernel.get(this, "quoteSymbol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serde = software.amazon.jsii.Kernel.get(this, "serde", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowSingleColumn = builder.allowSingleColumn;
            this.containsHeader = builder.containsHeader;
            this.customDatatypeConfigured = builder.customDatatypeConfigured;
            this.customDatatypes = builder.customDatatypes;
            this.delimiter = builder.delimiter;
            this.disableValueTrimming = builder.disableValueTrimming;
            this.header = builder.header;
            this.quoteSymbol = builder.quoteSymbol;
            this.serde = builder.serde;
        }

        @Override
        public final java.lang.Object getAllowSingleColumn() {
            return this.allowSingleColumn;
        }

        @Override
        public final java.lang.String getContainsHeader() {
            return this.containsHeader;
        }

        @Override
        public final java.lang.Object getCustomDatatypeConfigured() {
            return this.customDatatypeConfigured;
        }

        @Override
        public final java.util.List<java.lang.String> getCustomDatatypes() {
            return this.customDatatypes;
        }

        @Override
        public final java.lang.String getDelimiter() {
            return this.delimiter;
        }

        @Override
        public final java.lang.Object getDisableValueTrimming() {
            return this.disableValueTrimming;
        }

        @Override
        public final java.util.List<java.lang.String> getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.String getQuoteSymbol() {
            return this.quoteSymbol;
        }

        @Override
        public final java.lang.String getSerde() {
            return this.serde;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowSingleColumn() != null) {
                data.set("allowSingleColumn", om.valueToTree(this.getAllowSingleColumn()));
            }
            if (this.getContainsHeader() != null) {
                data.set("containsHeader", om.valueToTree(this.getContainsHeader()));
            }
            if (this.getCustomDatatypeConfigured() != null) {
                data.set("customDatatypeConfigured", om.valueToTree(this.getCustomDatatypeConfigured()));
            }
            if (this.getCustomDatatypes() != null) {
                data.set("customDatatypes", om.valueToTree(this.getCustomDatatypes()));
            }
            if (this.getDelimiter() != null) {
                data.set("delimiter", om.valueToTree(this.getDelimiter()));
            }
            if (this.getDisableValueTrimming() != null) {
                data.set("disableValueTrimming", om.valueToTree(this.getDisableValueTrimming()));
            }
            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getQuoteSymbol() != null) {
                data.set("quoteSymbol", om.valueToTree(this.getQuoteSymbol()));
            }
            if (this.getSerde() != null) {
                data.set("serde", om.valueToTree(this.getSerde()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueClassifier.GlueClassifierCsvClassifier"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueClassifierCsvClassifier.Jsii$Proxy that = (GlueClassifierCsvClassifier.Jsii$Proxy) o;

            if (this.allowSingleColumn != null ? !this.allowSingleColumn.equals(that.allowSingleColumn) : that.allowSingleColumn != null) return false;
            if (this.containsHeader != null ? !this.containsHeader.equals(that.containsHeader) : that.containsHeader != null) return false;
            if (this.customDatatypeConfigured != null ? !this.customDatatypeConfigured.equals(that.customDatatypeConfigured) : that.customDatatypeConfigured != null) return false;
            if (this.customDatatypes != null ? !this.customDatatypes.equals(that.customDatatypes) : that.customDatatypes != null) return false;
            if (this.delimiter != null ? !this.delimiter.equals(that.delimiter) : that.delimiter != null) return false;
            if (this.disableValueTrimming != null ? !this.disableValueTrimming.equals(that.disableValueTrimming) : that.disableValueTrimming != null) return false;
            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            if (this.quoteSymbol != null ? !this.quoteSymbol.equals(that.quoteSymbol) : that.quoteSymbol != null) return false;
            return this.serde != null ? this.serde.equals(that.serde) : that.serde == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowSingleColumn != null ? this.allowSingleColumn.hashCode() : 0;
            result = 31 * result + (this.containsHeader != null ? this.containsHeader.hashCode() : 0);
            result = 31 * result + (this.customDatatypeConfigured != null ? this.customDatatypeConfigured.hashCode() : 0);
            result = 31 * result + (this.customDatatypes != null ? this.customDatatypes.hashCode() : 0);
            result = 31 * result + (this.delimiter != null ? this.delimiter.hashCode() : 0);
            result = 31 * result + (this.disableValueTrimming != null ? this.disableValueTrimming.hashCode() : 0);
            result = 31 * result + (this.header != null ? this.header.hashCode() : 0);
            result = 31 * result + (this.quoteSymbol != null ? this.quoteSymbol.hashCode() : 0);
            result = 31 * result + (this.serde != null ? this.serde.hashCode() : 0);
            return result;
        }
    }
}
