package imports.aws.auditmanager_control;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.088Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerControl.AuditmanagerControlControlMappingSourcesSourceKeyword")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerControlControlMappingSourcesSourceKeyword.Jsii$Proxy.class)
public interface AuditmanagerControlControlMappingSourcesSourceKeyword extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#keyword_input_type AuditmanagerControl#keyword_input_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeywordInputType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#keyword_value AuditmanagerControl#keyword_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeywordValue();

    /**
     * @return a {@link Builder} of {@link AuditmanagerControlControlMappingSourcesSourceKeyword}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerControlControlMappingSourcesSourceKeyword}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerControlControlMappingSourcesSourceKeyword> {
        java.lang.String keywordInputType;
        java.lang.String keywordValue;

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSourcesSourceKeyword#getKeywordInputType}
         * @param keywordInputType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#keyword_input_type AuditmanagerControl#keyword_input_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder keywordInputType(java.lang.String keywordInputType) {
            this.keywordInputType = keywordInputType;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSourcesSourceKeyword#getKeywordValue}
         * @param keywordValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#keyword_value AuditmanagerControl#keyword_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder keywordValue(java.lang.String keywordValue) {
            this.keywordValue = keywordValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerControlControlMappingSourcesSourceKeyword}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerControlControlMappingSourcesSourceKeyword build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerControlControlMappingSourcesSourceKeyword}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerControlControlMappingSourcesSourceKeyword {
        private final java.lang.String keywordInputType;
        private final java.lang.String keywordValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keywordInputType = software.amazon.jsii.Kernel.get(this, "keywordInputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keywordValue = software.amazon.jsii.Kernel.get(this, "keywordValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keywordInputType = java.util.Objects.requireNonNull(builder.keywordInputType, "keywordInputType is required");
            this.keywordValue = java.util.Objects.requireNonNull(builder.keywordValue, "keywordValue is required");
        }

        @Override
        public final java.lang.String getKeywordInputType() {
            return this.keywordInputType;
        }

        @Override
        public final java.lang.String getKeywordValue() {
            return this.keywordValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("keywordInputType", om.valueToTree(this.getKeywordInputType()));
            data.set("keywordValue", om.valueToTree(this.getKeywordValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerControl.AuditmanagerControlControlMappingSourcesSourceKeyword"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerControlControlMappingSourcesSourceKeyword.Jsii$Proxy that = (AuditmanagerControlControlMappingSourcesSourceKeyword.Jsii$Proxy) o;

            if (!keywordInputType.equals(that.keywordInputType)) return false;
            return this.keywordValue.equals(that.keywordValue);
        }

        @Override
        public final int hashCode() {
            int result = this.keywordInputType.hashCode();
            result = 31 * result + (this.keywordValue.hashCode());
            return result;
        }
    }
}
