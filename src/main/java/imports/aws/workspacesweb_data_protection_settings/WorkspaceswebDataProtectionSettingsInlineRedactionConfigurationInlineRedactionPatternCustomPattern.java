package imports.aws.workspacesweb_data_protection_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.689Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern.Jsii$Proxy.class)
public interface WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_name WorkspaceswebDataProtectionSettings#pattern_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPatternName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_regex WorkspaceswebDataProtectionSettings#pattern_regex}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPatternRegex();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#keyword_regex WorkspaceswebDataProtectionSettings#keyword_regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeywordRegex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_description WorkspaceswebDataProtectionSettings#pattern_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPatternDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern> {
        java.lang.String patternName;
        java.lang.String patternRegex;
        java.lang.String keywordRegex;
        java.lang.String patternDescription;

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern#getPatternName}
         * @param patternName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_name WorkspaceswebDataProtectionSettings#pattern_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder patternName(java.lang.String patternName) {
            this.patternName = patternName;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern#getPatternRegex}
         * @param patternRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_regex WorkspaceswebDataProtectionSettings#pattern_regex}. This parameter is required.
         * @return {@code this}
         */
        public Builder patternRegex(java.lang.String patternRegex) {
            this.patternRegex = patternRegex;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern#getKeywordRegex}
         * @param keywordRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#keyword_regex WorkspaceswebDataProtectionSettings#keyword_regex}.
         * @return {@code this}
         */
        public Builder keywordRegex(java.lang.String keywordRegex) {
            this.keywordRegex = keywordRegex;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern#getPatternDescription}
         * @param patternDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_data_protection_settings#pattern_description WorkspaceswebDataProtectionSettings#pattern_description}.
         * @return {@code this}
         */
        public Builder patternDescription(java.lang.String patternDescription) {
            this.patternDescription = patternDescription;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern {
        private final java.lang.String patternName;
        private final java.lang.String patternRegex;
        private final java.lang.String keywordRegex;
        private final java.lang.String patternDescription;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.patternName = software.amazon.jsii.Kernel.get(this, "patternName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.patternRegex = software.amazon.jsii.Kernel.get(this, "patternRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keywordRegex = software.amazon.jsii.Kernel.get(this, "keywordRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.patternDescription = software.amazon.jsii.Kernel.get(this, "patternDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.patternName = java.util.Objects.requireNonNull(builder.patternName, "patternName is required");
            this.patternRegex = java.util.Objects.requireNonNull(builder.patternRegex, "patternRegex is required");
            this.keywordRegex = builder.keywordRegex;
            this.patternDescription = builder.patternDescription;
        }

        @Override
        public final java.lang.String getPatternName() {
            return this.patternName;
        }

        @Override
        public final java.lang.String getPatternRegex() {
            return this.patternRegex;
        }

        @Override
        public final java.lang.String getKeywordRegex() {
            return this.keywordRegex;
        }

        @Override
        public final java.lang.String getPatternDescription() {
            return this.patternDescription;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("patternName", om.valueToTree(this.getPatternName()));
            data.set("patternRegex", om.valueToTree(this.getPatternRegex()));
            if (this.getKeywordRegex() != null) {
                data.set("keywordRegex", om.valueToTree(this.getKeywordRegex()));
            }
            if (this.getPatternDescription() != null) {
                data.set("patternDescription", om.valueToTree(this.getPatternDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebDataProtectionSettings.WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern.Jsii$Proxy that = (WorkspaceswebDataProtectionSettingsInlineRedactionConfigurationInlineRedactionPatternCustomPattern.Jsii$Proxy) o;

            if (!patternName.equals(that.patternName)) return false;
            if (!patternRegex.equals(that.patternRegex)) return false;
            if (this.keywordRegex != null ? !this.keywordRegex.equals(that.keywordRegex) : that.keywordRegex != null) return false;
            return this.patternDescription != null ? this.patternDescription.equals(that.patternDescription) : that.patternDescription == null;
        }

        @Override
        public final int hashCode() {
            int result = this.patternName.hashCode();
            result = 31 * result + (this.patternRegex.hashCode());
            result = 31 * result + (this.keywordRegex != null ? this.keywordRegex.hashCode() : 0);
            result = 31 * result + (this.patternDescription != null ? this.patternDescription.hashCode() : 0);
            return result;
        }
    }
}
