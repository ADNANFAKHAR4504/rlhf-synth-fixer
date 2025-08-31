package imports.aws.auditmanager_control;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.088Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerControl.AuditmanagerControlControlMappingSources")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerControlControlMappingSources.Jsii$Proxy.class)
public interface AuditmanagerControlControlMappingSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_name AuditmanagerControl#source_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_set_up_option AuditmanagerControl#source_set_up_option}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceSetUpOption();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_type AuditmanagerControl#source_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_description AuditmanagerControl#source_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_frequency AuditmanagerControl#source_frequency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceFrequency() {
        return null;
    }

    /**
     * source_keyword block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_keyword AuditmanagerControl#source_keyword}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceKeyword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#troubleshooting_text AuditmanagerControl#troubleshooting_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTroubleshootingText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AuditmanagerControlControlMappingSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerControlControlMappingSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerControlControlMappingSources> {
        java.lang.String sourceName;
        java.lang.String sourceSetUpOption;
        java.lang.String sourceType;
        java.lang.String sourceDescription;
        java.lang.String sourceFrequency;
        java.lang.Object sourceKeyword;
        java.lang.String troubleshootingText;

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceName}
         * @param sourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_name AuditmanagerControl#source_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceName(java.lang.String sourceName) {
            this.sourceName = sourceName;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceSetUpOption}
         * @param sourceSetUpOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_set_up_option AuditmanagerControl#source_set_up_option}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceSetUpOption(java.lang.String sourceSetUpOption) {
            this.sourceSetUpOption = sourceSetUpOption;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceType}
         * @param sourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_type AuditmanagerControl#source_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceType(java.lang.String sourceType) {
            this.sourceType = sourceType;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceDescription}
         * @param sourceDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_description AuditmanagerControl#source_description}.
         * @return {@code this}
         */
        public Builder sourceDescription(java.lang.String sourceDescription) {
            this.sourceDescription = sourceDescription;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceFrequency}
         * @param sourceFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_frequency AuditmanagerControl#source_frequency}.
         * @return {@code this}
         */
        public Builder sourceFrequency(java.lang.String sourceFrequency) {
            this.sourceFrequency = sourceFrequency;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceKeyword}
         * @param sourceKeyword source_keyword block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_keyword AuditmanagerControl#source_keyword}
         * @return {@code this}
         */
        public Builder sourceKeyword(com.hashicorp.cdktf.IResolvable sourceKeyword) {
            this.sourceKeyword = sourceKeyword;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getSourceKeyword}
         * @param sourceKeyword source_keyword block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#source_keyword AuditmanagerControl#source_keyword}
         * @return {@code this}
         */
        public Builder sourceKeyword(java.util.List<? extends imports.aws.auditmanager_control.AuditmanagerControlControlMappingSourcesSourceKeyword> sourceKeyword) {
            this.sourceKeyword = sourceKeyword;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerControlControlMappingSources#getTroubleshootingText}
         * @param troubleshootingText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_control#troubleshooting_text AuditmanagerControl#troubleshooting_text}.
         * @return {@code this}
         */
        public Builder troubleshootingText(java.lang.String troubleshootingText) {
            this.troubleshootingText = troubleshootingText;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerControlControlMappingSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerControlControlMappingSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerControlControlMappingSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerControlControlMappingSources {
        private final java.lang.String sourceName;
        private final java.lang.String sourceSetUpOption;
        private final java.lang.String sourceType;
        private final java.lang.String sourceDescription;
        private final java.lang.String sourceFrequency;
        private final java.lang.Object sourceKeyword;
        private final java.lang.String troubleshootingText;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceName = software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceSetUpOption = software.amazon.jsii.Kernel.get(this, "sourceSetUpOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceType = software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceDescription = software.amazon.jsii.Kernel.get(this, "sourceDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceFrequency = software.amazon.jsii.Kernel.get(this, "sourceFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceKeyword = software.amazon.jsii.Kernel.get(this, "sourceKeyword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.troubleshootingText = software.amazon.jsii.Kernel.get(this, "troubleshootingText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceName = java.util.Objects.requireNonNull(builder.sourceName, "sourceName is required");
            this.sourceSetUpOption = java.util.Objects.requireNonNull(builder.sourceSetUpOption, "sourceSetUpOption is required");
            this.sourceType = java.util.Objects.requireNonNull(builder.sourceType, "sourceType is required");
            this.sourceDescription = builder.sourceDescription;
            this.sourceFrequency = builder.sourceFrequency;
            this.sourceKeyword = builder.sourceKeyword;
            this.troubleshootingText = builder.troubleshootingText;
        }

        @Override
        public final java.lang.String getSourceName() {
            return this.sourceName;
        }

        @Override
        public final java.lang.String getSourceSetUpOption() {
            return this.sourceSetUpOption;
        }

        @Override
        public final java.lang.String getSourceType() {
            return this.sourceType;
        }

        @Override
        public final java.lang.String getSourceDescription() {
            return this.sourceDescription;
        }

        @Override
        public final java.lang.String getSourceFrequency() {
            return this.sourceFrequency;
        }

        @Override
        public final java.lang.Object getSourceKeyword() {
            return this.sourceKeyword;
        }

        @Override
        public final java.lang.String getTroubleshootingText() {
            return this.troubleshootingText;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceName", om.valueToTree(this.getSourceName()));
            data.set("sourceSetUpOption", om.valueToTree(this.getSourceSetUpOption()));
            data.set("sourceType", om.valueToTree(this.getSourceType()));
            if (this.getSourceDescription() != null) {
                data.set("sourceDescription", om.valueToTree(this.getSourceDescription()));
            }
            if (this.getSourceFrequency() != null) {
                data.set("sourceFrequency", om.valueToTree(this.getSourceFrequency()));
            }
            if (this.getSourceKeyword() != null) {
                data.set("sourceKeyword", om.valueToTree(this.getSourceKeyword()));
            }
            if (this.getTroubleshootingText() != null) {
                data.set("troubleshootingText", om.valueToTree(this.getTroubleshootingText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerControl.AuditmanagerControlControlMappingSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerControlControlMappingSources.Jsii$Proxy that = (AuditmanagerControlControlMappingSources.Jsii$Proxy) o;

            if (!sourceName.equals(that.sourceName)) return false;
            if (!sourceSetUpOption.equals(that.sourceSetUpOption)) return false;
            if (!sourceType.equals(that.sourceType)) return false;
            if (this.sourceDescription != null ? !this.sourceDescription.equals(that.sourceDescription) : that.sourceDescription != null) return false;
            if (this.sourceFrequency != null ? !this.sourceFrequency.equals(that.sourceFrequency) : that.sourceFrequency != null) return false;
            if (this.sourceKeyword != null ? !this.sourceKeyword.equals(that.sourceKeyword) : that.sourceKeyword != null) return false;
            return this.troubleshootingText != null ? this.troubleshootingText.equals(that.troubleshootingText) : that.troubleshootingText == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceName.hashCode();
            result = 31 * result + (this.sourceSetUpOption.hashCode());
            result = 31 * result + (this.sourceType.hashCode());
            result = 31 * result + (this.sourceDescription != null ? this.sourceDescription.hashCode() : 0);
            result = 31 * result + (this.sourceFrequency != null ? this.sourceFrequency.hashCode() : 0);
            result = 31 * result + (this.sourceKeyword != null ? this.sourceKeyword.hashCode() : 0);
            result = 31 * result + (this.troubleshootingText != null ? this.troubleshootingText.hashCode() : 0);
            return result;
        }
    }
}
