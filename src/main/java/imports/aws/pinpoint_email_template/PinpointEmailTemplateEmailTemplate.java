package imports.aws.pinpoint_email_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.060Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointEmailTemplate.PinpointEmailTemplateEmailTemplate")
@software.amazon.jsii.Jsii.Proxy(PinpointEmailTemplateEmailTemplate.Jsii$Proxy.class)
public interface PinpointEmailTemplateEmailTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#default_substitutions PinpointEmailTemplate#default_substitutions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultSubstitutions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#description PinpointEmailTemplate#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#header PinpointEmailTemplate#header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#html_part PinpointEmailTemplate#html_part}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHtmlPart() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#recommender_id PinpointEmailTemplate#recommender_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecommenderId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#subject PinpointEmailTemplate#subject}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubject() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#text_part PinpointEmailTemplate#text_part}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTextPart() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PinpointEmailTemplateEmailTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PinpointEmailTemplateEmailTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PinpointEmailTemplateEmailTemplate> {
        java.lang.String defaultSubstitutions;
        java.lang.String description;
        java.lang.Object header;
        java.lang.String htmlPart;
        java.lang.String recommenderId;
        java.lang.String subject;
        java.lang.String textPart;

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getDefaultSubstitutions}
         * @param defaultSubstitutions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#default_substitutions PinpointEmailTemplate#default_substitutions}.
         * @return {@code this}
         */
        public Builder defaultSubstitutions(java.lang.String defaultSubstitutions) {
            this.defaultSubstitutions = defaultSubstitutions;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#description PinpointEmailTemplate#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#header PinpointEmailTemplate#header}
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#header PinpointEmailTemplate#header}
         * @return {@code this}
         */
        public Builder header(java.util.List<? extends imports.aws.pinpoint_email_template.PinpointEmailTemplateEmailTemplateHeader> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getHtmlPart}
         * @param htmlPart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#html_part PinpointEmailTemplate#html_part}.
         * @return {@code this}
         */
        public Builder htmlPart(java.lang.String htmlPart) {
            this.htmlPart = htmlPart;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getRecommenderId}
         * @param recommenderId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#recommender_id PinpointEmailTemplate#recommender_id}.
         * @return {@code this}
         */
        public Builder recommenderId(java.lang.String recommenderId) {
            this.recommenderId = recommenderId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getSubject}
         * @param subject Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#subject PinpointEmailTemplate#subject}.
         * @return {@code this}
         */
        public Builder subject(java.lang.String subject) {
            this.subject = subject;
            return this;
        }

        /**
         * Sets the value of {@link PinpointEmailTemplateEmailTemplate#getTextPart}
         * @param textPart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_email_template#text_part PinpointEmailTemplate#text_part}.
         * @return {@code this}
         */
        public Builder textPart(java.lang.String textPart) {
            this.textPart = textPart;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PinpointEmailTemplateEmailTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PinpointEmailTemplateEmailTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PinpointEmailTemplateEmailTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PinpointEmailTemplateEmailTemplate {
        private final java.lang.String defaultSubstitutions;
        private final java.lang.String description;
        private final java.lang.Object header;
        private final java.lang.String htmlPart;
        private final java.lang.String recommenderId;
        private final java.lang.String subject;
        private final java.lang.String textPart;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultSubstitutions = software.amazon.jsii.Kernel.get(this, "defaultSubstitutions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.htmlPart = software.amazon.jsii.Kernel.get(this, "htmlPart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recommenderId = software.amazon.jsii.Kernel.get(this, "recommenderId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subject = software.amazon.jsii.Kernel.get(this, "subject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.textPart = software.amazon.jsii.Kernel.get(this, "textPart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultSubstitutions = builder.defaultSubstitutions;
            this.description = builder.description;
            this.header = builder.header;
            this.htmlPart = builder.htmlPart;
            this.recommenderId = builder.recommenderId;
            this.subject = builder.subject;
            this.textPart = builder.textPart;
        }

        @Override
        public final java.lang.String getDefaultSubstitutions() {
            return this.defaultSubstitutions;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.String getHtmlPart() {
            return this.htmlPart;
        }

        @Override
        public final java.lang.String getRecommenderId() {
            return this.recommenderId;
        }

        @Override
        public final java.lang.String getSubject() {
            return this.subject;
        }

        @Override
        public final java.lang.String getTextPart() {
            return this.textPart;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultSubstitutions() != null) {
                data.set("defaultSubstitutions", om.valueToTree(this.getDefaultSubstitutions()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getHtmlPart() != null) {
                data.set("htmlPart", om.valueToTree(this.getHtmlPart()));
            }
            if (this.getRecommenderId() != null) {
                data.set("recommenderId", om.valueToTree(this.getRecommenderId()));
            }
            if (this.getSubject() != null) {
                data.set("subject", om.valueToTree(this.getSubject()));
            }
            if (this.getTextPart() != null) {
                data.set("textPart", om.valueToTree(this.getTextPart()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pinpointEmailTemplate.PinpointEmailTemplateEmailTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PinpointEmailTemplateEmailTemplate.Jsii$Proxy that = (PinpointEmailTemplateEmailTemplate.Jsii$Proxy) o;

            if (this.defaultSubstitutions != null ? !this.defaultSubstitutions.equals(that.defaultSubstitutions) : that.defaultSubstitutions != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            if (this.htmlPart != null ? !this.htmlPart.equals(that.htmlPart) : that.htmlPart != null) return false;
            if (this.recommenderId != null ? !this.recommenderId.equals(that.recommenderId) : that.recommenderId != null) return false;
            if (this.subject != null ? !this.subject.equals(that.subject) : that.subject != null) return false;
            return this.textPart != null ? this.textPart.equals(that.textPart) : that.textPart == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultSubstitutions != null ? this.defaultSubstitutions.hashCode() : 0;
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.header != null ? this.header.hashCode() : 0);
            result = 31 * result + (this.htmlPart != null ? this.htmlPart.hashCode() : 0);
            result = 31 * result + (this.recommenderId != null ? this.recommenderId.hashCode() : 0);
            result = 31 * result + (this.subject != null ? this.subject.hashCode() : 0);
            result = 31 * result + (this.textPart != null ? this.textPart.hashCode() : 0);
            return result;
        }
    }
}
