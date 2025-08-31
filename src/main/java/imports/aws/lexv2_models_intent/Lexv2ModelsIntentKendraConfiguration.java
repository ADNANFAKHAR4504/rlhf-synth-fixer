package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.776Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentKendraConfiguration")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentKendraConfiguration.Jsii$Proxy.class)
public interface Lexv2ModelsIntentKendraConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_index Lexv2ModelsIntent#kendra_index}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKendraIndex();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#query_filter_string Lexv2ModelsIntent#query_filter_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQueryFilterString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#query_filter_string_enabled Lexv2ModelsIntent#query_filter_string_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryFilterStringEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentKendraConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentKendraConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentKendraConfiguration> {
        java.lang.String kendraIndex;
        java.lang.String queryFilterString;
        java.lang.Object queryFilterStringEnabled;

        /**
         * Sets the value of {@link Lexv2ModelsIntentKendraConfiguration#getKendraIndex}
         * @param kendraIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_index Lexv2ModelsIntent#kendra_index}. This parameter is required.
         * @return {@code this}
         */
        public Builder kendraIndex(java.lang.String kendraIndex) {
            this.kendraIndex = kendraIndex;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentKendraConfiguration#getQueryFilterString}
         * @param queryFilterString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#query_filter_string Lexv2ModelsIntent#query_filter_string}.
         * @return {@code this}
         */
        public Builder queryFilterString(java.lang.String queryFilterString) {
            this.queryFilterString = queryFilterString;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentKendraConfiguration#getQueryFilterStringEnabled}
         * @param queryFilterStringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#query_filter_string_enabled Lexv2ModelsIntent#query_filter_string_enabled}.
         * @return {@code this}
         */
        public Builder queryFilterStringEnabled(java.lang.Boolean queryFilterStringEnabled) {
            this.queryFilterStringEnabled = queryFilterStringEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentKendraConfiguration#getQueryFilterStringEnabled}
         * @param queryFilterStringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#query_filter_string_enabled Lexv2ModelsIntent#query_filter_string_enabled}.
         * @return {@code this}
         */
        public Builder queryFilterStringEnabled(com.hashicorp.cdktf.IResolvable queryFilterStringEnabled) {
            this.queryFilterStringEnabled = queryFilterStringEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentKendraConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentKendraConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentKendraConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentKendraConfiguration {
        private final java.lang.String kendraIndex;
        private final java.lang.String queryFilterString;
        private final java.lang.Object queryFilterStringEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kendraIndex = software.amazon.jsii.Kernel.get(this, "kendraIndex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryFilterString = software.amazon.jsii.Kernel.get(this, "queryFilterString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryFilterStringEnabled = software.amazon.jsii.Kernel.get(this, "queryFilterStringEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kendraIndex = java.util.Objects.requireNonNull(builder.kendraIndex, "kendraIndex is required");
            this.queryFilterString = builder.queryFilterString;
            this.queryFilterStringEnabled = builder.queryFilterStringEnabled;
        }

        @Override
        public final java.lang.String getKendraIndex() {
            return this.kendraIndex;
        }

        @Override
        public final java.lang.String getQueryFilterString() {
            return this.queryFilterString;
        }

        @Override
        public final java.lang.Object getQueryFilterStringEnabled() {
            return this.queryFilterStringEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kendraIndex", om.valueToTree(this.getKendraIndex()));
            if (this.getQueryFilterString() != null) {
                data.set("queryFilterString", om.valueToTree(this.getQueryFilterString()));
            }
            if (this.getQueryFilterStringEnabled() != null) {
                data.set("queryFilterStringEnabled", om.valueToTree(this.getQueryFilterStringEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentKendraConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentKendraConfiguration.Jsii$Proxy that = (Lexv2ModelsIntentKendraConfiguration.Jsii$Proxy) o;

            if (!kendraIndex.equals(that.kendraIndex)) return false;
            if (this.queryFilterString != null ? !this.queryFilterString.equals(that.queryFilterString) : that.queryFilterString != null) return false;
            return this.queryFilterStringEnabled != null ? this.queryFilterStringEnabled.equals(that.queryFilterStringEnabled) : that.queryFilterStringEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kendraIndex.hashCode();
            result = 31 * result + (this.queryFilterString != null ? this.queryFilterString.hashCode() : 0);
            result = 31 * result + (this.queryFilterStringEnabled != null ? this.queryFilterStringEnabled.hashCode() : 0);
            return result;
        }
    }
}
