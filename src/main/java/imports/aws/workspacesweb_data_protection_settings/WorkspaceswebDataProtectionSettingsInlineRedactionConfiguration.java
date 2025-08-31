package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.689Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration.Jsii$Proxy.class)
public interface WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_confidence_level WorkspaceswebDataProtectionSettings#global_confidence_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGlobalConfidenceLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_enforced_urls WorkspaceswebDataProtectionSettings#global_enforced_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlobalEnforcedUrls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_exempt_urls WorkspaceswebDataProtectionSettings#global_exempt_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGlobalExemptUrls() {
        return null;
    }

    /**
     * inline_redaction_pattern block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_pattern WorkspaceswebDataProtectionSettings#inline_redaction_pattern}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInlineRedactionPattern() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration> {
        java.lang.Number globalConfidenceLevel;
        java.util.List<java.lang.String> globalEnforcedUrls;
        java.util.List<java.lang.String> globalExemptUrls;
        java.lang.Object inlineRedactionPattern;

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration#getGlobalConfidenceLevel}
         * @param globalConfidenceLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_confidence_level WorkspaceswebDataProtectionSettings#global_confidence_level}.
         * @return {@code this}
         */
        public Builder globalConfidenceLevel(java.lang.Number globalConfidenceLevel) {
            this.globalConfidenceLevel = globalConfidenceLevel;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration#getGlobalEnforcedUrls}
         * @param globalEnforcedUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_enforced_urls WorkspaceswebDataProtectionSettings#global_enforced_urls}.
         * @return {@code this}
         */
        public Builder globalEnforcedUrls(java.util.List<java.lang.String> globalEnforcedUrls) {
            this.globalEnforcedUrls = globalEnforcedUrls;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration#getGlobalExemptUrls}
         * @param globalExemptUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#global_exempt_urls WorkspaceswebDataProtectionSettings#global_exempt_urls}.
         * @return {@code this}
         */
        public Builder globalExemptUrls(java.util.List<java.lang.String> globalExemptUrls) {
            this.globalExemptUrls = globalExemptUrls;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration#getInlineRedactionPattern}
         * @param inlineRedactionPattern inline_redaction_pattern block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_pattern WorkspaceswebDataProtectionSettings#inline_redaction_pattern}
         * @return {@code this}
         */
        public Builder inlineRedactionPattern(com.hashicorp.cdktf.IResolvable inlineRedactionPattern) {
            this.inlineRedactionPattern = inlineRedactionPattern;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration#getInlineRedactionPattern}
         * @param inlineRedactionPattern inline_redaction_pattern block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#inline_redaction_pattern WorkspaceswebDataProtectionSettings#inline_redaction_pattern}
         * @return {@code this}
         */
        public Builder inlineRedactionPattern(java.util.List<? extends imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern> inlineRedactionPattern) {
            this.inlineRedactionPattern = inlineRedactionPattern;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration {
        private final java.lang.Number globalConfidenceLevel;
        private final java.util.List<java.lang.String> globalEnforcedUrls;
        private final java.util.List<java.lang.String> globalExemptUrls;
        private final java.lang.Object inlineRedactionPattern;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.globalConfidenceLevel = software.amazon.jsii.Kernel.get(this, "globalConfidenceLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.globalEnforcedUrls = software.amazon.jsii.Kernel.get(this, "globalEnforcedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.globalExemptUrls = software.amazon.jsii.Kernel.get(this, "globalExemptUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inlineRedactionPattern = software.amazon.jsii.Kernel.get(this, "inlineRedactionPattern", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.globalConfidenceLevel = builder.globalConfidenceLevel;
            this.globalEnforcedUrls = builder.globalEnforcedUrls;
            this.globalExemptUrls = builder.globalExemptUrls;
            this.inlineRedactionPattern = builder.inlineRedactionPattern;
        }

        @Override
        public final java.lang.Number getGlobalConfidenceLevel() {
            return this.globalConfidenceLevel;
        }

        @Override
        public final java.util.List<java.lang.String> getGlobalEnforcedUrls() {
            return this.globalEnforcedUrls;
        }

        @Override
        public final java.util.List<java.lang.String> getGlobalExemptUrls() {
            return this.globalExemptUrls;
        }

        @Override
        public final java.lang.Object getInlineRedactionPattern() {
            return this.inlineRedactionPattern;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGlobalConfidenceLevel() != null) {
                data.set("globalConfidenceLevel", om.valueToTree(this.getGlobalConfidenceLevel()));
            }
            if (this.getGlobalEnforcedUrls() != null) {
                data.set("globalEnforcedUrls", om.valueToTree(this.getGlobalEnforcedUrls()));
            }
            if (this.getGlobalExemptUrls() != null) {
                data.set("globalExemptUrls", om.valueToTree(this.getGlobalExemptUrls()));
            }
            if (this.getInlineRedactionPattern() != null) {
                data.set("inlineRedactionPattern", om.valueToTree(this.getInlineRedactionPattern()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration.Jsii$Proxy that = (WorkspaceswebDataProtectionSettingsInlineRedactionConfiguration.Jsii$Proxy) o;

            if (this.globalConfidenceLevel != null ? !this.globalConfidenceLevel.equals(that.globalConfidenceLevel) : that.globalConfidenceLevel != null) return false;
            if (this.globalEnforcedUrls != null ? !this.globalEnforcedUrls.equals(that.globalEnforcedUrls) : that.globalEnforcedUrls != null) return false;
            if (this.globalExemptUrls != null ? !this.globalExemptUrls.equals(that.globalExemptUrls) : that.globalExemptUrls != null) return false;
            return this.inlineRedactionPattern != null ? this.inlineRedactionPattern.equals(that.inlineRedactionPattern) : that.inlineRedactionPattern == null;
        }

        @Override
        public final int hashCode() {
            int result = this.globalConfidenceLevel != null ? this.globalConfidenceLevel.hashCode() : 0;
            result = 31 * result + (this.globalEnforcedUrls != null ? this.globalEnforcedUrls.hashCode() : 0);
            result = 31 * result + (this.globalExemptUrls != null ? this.globalExemptUrls.hashCode() : 0);
            result = 31 * result + (this.inlineRedactionPattern != null ? this.inlineRedactionPattern.hashCode() : 0);
            return result;
        }
    }
}
