package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.689Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern.Jsii$Proxy.class)
public interface WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#built_in_pattern_id WorkspaceswebDataProtectionSettings#built_in_pattern_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBuiltInPatternId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#confidence_level WorkspaceswebDataProtectionSettings#confidence_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConfidenceLevel() {
        return null;
    }

    /**
     * custom_pattern block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#custom_pattern WorkspaceswebDataProtectionSettings#custom_pattern}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomPattern() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#enforced_urls WorkspaceswebDataProtectionSettings#enforced_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnforcedUrls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#exempt_urls WorkspaceswebDataProtectionSettings#exempt_urls}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExemptUrls() {
        return null;
    }

    /**
     * redaction_place_holder block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder WorkspaceswebDataProtectionSettings#redaction_place_holder}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRedactionPlaceHolder() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern> {
        java.lang.String builtInPatternId;
        java.lang.Number confidenceLevel;
        java.lang.Object customPattern;
        java.util.List<java.lang.String> enforcedUrls;
        java.util.List<java.lang.String> exemptUrls;
        java.lang.Object redactionPlaceHolder;

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getBuiltInPatternId}
         * @param builtInPatternId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#built_in_pattern_id WorkspaceswebDataProtectionSettings#built_in_pattern_id}.
         * @return {@code this}
         */
        public Builder builtInPatternId(java.lang.String builtInPatternId) {
            this.builtInPatternId = builtInPatternId;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getConfidenceLevel}
         * @param confidenceLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#confidence_level WorkspaceswebDataProtectionSettings#confidence_level}.
         * @return {@code this}
         */
        public Builder confidenceLevel(java.lang.Number confidenceLevel) {
            this.confidenceLevel = confidenceLevel;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getCustomPattern}
         * @param customPattern custom_pattern block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#custom_pattern WorkspaceswebDataProtectionSettings#custom_pattern}
         * @return {@code this}
         */
        public Builder customPattern(com.hashicorp.cdktf.IResolvable customPattern) {
            this.customPattern = customPattern;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getCustomPattern}
         * @param customPattern custom_pattern block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#custom_pattern WorkspaceswebDataProtectionSettings#custom_pattern}
         * @return {@code this}
         */
        public Builder customPattern(java.util.List<? extends imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern> customPattern) {
            this.customPattern = customPattern;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getEnforcedUrls}
         * @param enforcedUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#enforced_urls WorkspaceswebDataProtectionSettings#enforced_urls}.
         * @return {@code this}
         */
        public Builder enforcedUrls(java.util.List<java.lang.String> enforcedUrls) {
            this.enforcedUrls = enforcedUrls;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getExemptUrls}
         * @param exemptUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#exempt_urls WorkspaceswebDataProtectionSettings#exempt_urls}.
         * @return {@code this}
         */
        public Builder exemptUrls(java.util.List<java.lang.String> exemptUrls) {
            this.exemptUrls = exemptUrls;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getRedactionPlaceHolder}
         * @param redactionPlaceHolder redaction_place_holder block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder WorkspaceswebDataProtectionSettings#redaction_place_holder}
         * @return {@code this}
         */
        public Builder redactionPlaceHolder(com.hashicorp.cdktf.IResolvable redactionPlaceHolder) {
            this.redactionPlaceHolder = redactionPlaceHolder;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern#getRedactionPlaceHolder}
         * @param redactionPlaceHolder redaction_place_holder block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#redaction_place_holder WorkspaceswebDataProtectionSettings#redaction_place_holder}
         * @return {@code this}
         */
        public Builder redactionPlaceHolder(java.util.List<? extends imports.aws.workspacesweb_data_protection_settings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternRedactionPlaceHolder> redactionPlaceHolder) {
            this.redactionPlaceHolder = redactionPlaceHolder;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern {
        private final java.lang.String builtInPatternId;
        private final java.lang.Number confidenceLevel;
        private final java.lang.Object customPattern;
        private final java.util.List<java.lang.String> enforcedUrls;
        private final java.util.List<java.lang.String> exemptUrls;
        private final java.lang.Object redactionPlaceHolder;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.builtInPatternId = software.amazon.jsii.Kernel.get(this, "builtInPatternId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.confidenceLevel = software.amazon.jsii.Kernel.get(this, "confidenceLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.customPattern = software.amazon.jsii.Kernel.get(this, "customPattern", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enforcedUrls = software.amazon.jsii.Kernel.get(this, "enforcedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.exemptUrls = software.amazon.jsii.Kernel.get(this, "exemptUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.redactionPlaceHolder = software.amazon.jsii.Kernel.get(this, "redactionPlaceHolder", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.builtInPatternId = builder.builtInPatternId;
            this.confidenceLevel = builder.confidenceLevel;
            this.customPattern = builder.customPattern;
            this.enforcedUrls = builder.enforcedUrls;
            this.exemptUrls = builder.exemptUrls;
            this.redactionPlaceHolder = builder.redactionPlaceHolder;
        }

        @Override
        public final java.lang.String getBuiltInPatternId() {
            return this.builtInPatternId;
        }

        @Override
        public final java.lang.Number getConfidenceLevel() {
            return this.confidenceLevel;
        }

        @Override
        public final java.lang.Object getCustomPattern() {
            return this.customPattern;
        }

        @Override
        public final java.util.List<java.lang.String> getEnforcedUrls() {
            return this.enforcedUrls;
        }

        @Override
        public final java.util.List<java.lang.String> getExemptUrls() {
            return this.exemptUrls;
        }

        @Override
        public final java.lang.Object getRedactionPlaceHolder() {
            return this.redactionPlaceHolder;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBuiltInPatternId() != null) {
                data.set("builtInPatternId", om.valueToTree(this.getBuiltInPatternId()));
            }
            if (this.getConfidenceLevel() != null) {
                data.set("confidenceLevel", om.valueToTree(this.getConfidenceLevel()));
            }
            if (this.getCustomPattern() != null) {
                data.set("customPattern", om.valueToTree(this.getCustomPattern()));
            }
            if (this.getEnforcedUrls() != null) {
                data.set("enforcedUrls", om.valueToTree(this.getEnforcedUrls()));
            }
            if (this.getExemptUrls() != null) {
                data.set("exemptUrls", om.valueToTree(this.getExemptUrls()));
            }
            if (this.getRedactionPlaceHolder() != null) {
                data.set("redactionPlaceHolder", om.valueToTree(this.getRedactionPlaceHolder()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern.Jsii$Proxy that = (WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPattern.Jsii$Proxy) o;

            if (this.builtInPatternId != null ? !this.builtInPatternId.equals(that.builtInPatternId) : that.builtInPatternId != null) return false;
            if (this.confidenceLevel != null ? !this.confidenceLevel.equals(that.confidenceLevel) : that.confidenceLevel != null) return false;
            if (this.customPattern != null ? !this.customPattern.equals(that.customPattern) : that.customPattern != null) return false;
            if (this.enforcedUrls != null ? !this.enforcedUrls.equals(that.enforcedUrls) : that.enforcedUrls != null) return false;
            if (this.exemptUrls != null ? !this.exemptUrls.equals(that.exemptUrls) : that.exemptUrls != null) return false;
            return this.redactionPlaceHolder != null ? this.redactionPlaceHolder.equals(that.redactionPlaceHolder) : that.redactionPlaceHolder == null;
        }

        @Override
        public final int hashCode() {
            int result = this.builtInPatternId != null ? this.builtInPatternId.hashCode() : 0;
            result = 31 * result + (this.confidenceLevel != null ? this.confidenceLevel.hashCode() : 0);
            result = 31 * result + (this.customPattern != null ? this.customPattern.hashCode() : 0);
            result = 31 * result + (this.enforcedUrls != null ? this.enforcedUrls.hashCode() : 0);
            result = 31 * result + (this.exemptUrls != null ? this.exemptUrls.hashCode() : 0);
            result = 31 * result + (this.redactionPlaceHolder != null ? this.redactionPlaceHolder.hashCode() : 0);
            return result;
        }
    }
}
