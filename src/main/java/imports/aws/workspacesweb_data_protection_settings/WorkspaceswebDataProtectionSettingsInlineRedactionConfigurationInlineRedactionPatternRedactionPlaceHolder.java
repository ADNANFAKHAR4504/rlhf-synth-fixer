package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.690Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder.Jsii$Proxy.class)
public interface WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder_type WorkspaceswebDataProtectionSettings#redaction_place_holder_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRedactionPlaceHolderType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder_text WorkspaceswebDataProtectionSettings#redaction_place_holder_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedactionPlaceHolderText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder> {
        java.lang.String redactionPlaceHolderType;
        java.lang.String redactionPlaceHolderText;

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder#getRedactionPlaceHolderType}
         * @param redactionPlaceHolderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder_type WorkspaceswebDataProtectionSettings#redaction_place_holder_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder redactionPlaceHolderType(java.lang.String redactionPlaceHolderType) {
            this.redactionPlaceHolderType = redactionPlaceHolderType;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder#getRedactionPlaceHolderText}
         * @param redactionPlaceHolderText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder_text WorkspaceswebDataProtectionSettings#redaction_place_holder_text}.
         * @return {@code this}
         */
        public Builder redactionPlaceHolderText(java.lang.String redactionPlaceHolderText) {
            this.redactionPlaceHolderText = redactionPlaceHolderText;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder {
        private final java.lang.String redactionPlaceHolderType;
        private final java.lang.String redactionPlaceHolderText;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.redactionPlaceHolderType = software.amazon.jsii.Kernel.get(this, "redactionPlaceHolderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.redactionPlaceHolderText = software.amazon.jsii.Kernel.get(this, "redactionPlaceHolderText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.redactionPlaceHolderType = java.util.Objects.requireNonNull(builder.redactionPlaceHolderType, "redactionPlaceHolderType is required");
            this.redactionPlaceHolderText = builder.redactionPlaceHolderText;
        }

        @Override
        public final java.lang.String getRedactionPlaceHolderType() {
            return this.redactionPlaceHolderType;
        }

        @Override
        public final java.lang.String getRedactionPlaceHolderText() {
            return this.redactionPlaceHolderText;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("redactionPlaceHolderType", om.valueToTree(this.getRedactionPlaceHolderType()));
            if (this.getRedactionPlaceHolderText() != null) {
                data.set("redactionPlaceHolderText", om.valueToTree(this.getRedactionPlaceHolderText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder.Jsii$Proxy that = (WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder.Jsii$Proxy) o;

            if (!redactionPlaceHolderType.equals(that.redactionPlaceHolderType)) return false;
            return this.redactionPlaceHolderText != null ? this.redactionPlaceHolderText.equals(that.redactionPlaceHolderText) : that.redactionPlaceHolderText == null;
        }

        @Override
        public final int hashCode() {
            int result = this.redactionPlaceHolderType.hashCode();
            result = 31 * result + (this.redactionPlaceHolderText != null ? this.redactionPlaceHolderText.hashCode() : 0);
            return result;
        }
    }
}
