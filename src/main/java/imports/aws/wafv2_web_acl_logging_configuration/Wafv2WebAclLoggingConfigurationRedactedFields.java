package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationRedactedFields")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclLoggingConfigurationRedactedFields.Jsii$Proxy.class)
public interface Wafv2WebAclLoggingConfigurationRedactedFields extends software.amazon.jsii.JsiiSerializable {

    /**
     * method block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#method Wafv2WebAclLoggingConfiguration#method}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod getMethod() {
        return null;
    }

    /**
     * query_string block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#query_string Wafv2WebAclLoggingConfiguration#query_string}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString getQueryString() {
        return null;
    }

    /**
     * single_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#single_header Wafv2WebAclLoggingConfiguration#single_header}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader getSingleHeader() {
        return null;
    }

    /**
     * uri_path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#uri_path Wafv2WebAclLoggingConfiguration#uri_path}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath getUriPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclLoggingConfigurationRedactedFields}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclLoggingConfigurationRedactedFields}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclLoggingConfigurationRedactedFields> {
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod method;
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString queryString;
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader singleHeader;
        imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath uriPath;

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationRedactedFields#getMethod}
         * @param method method block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#method Wafv2WebAclLoggingConfiguration#method}
         * @return {@code this}
         */
        public Builder method(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod method) {
            this.method = method;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationRedactedFields#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#query_string Wafv2WebAclLoggingConfiguration#query_string}
         * @return {@code this}
         */
        public Builder queryString(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationRedactedFields#getSingleHeader}
         * @param singleHeader single_header block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#single_header Wafv2WebAclLoggingConfiguration#single_header}
         * @return {@code this}
         */
        public Builder singleHeader(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader singleHeader) {
            this.singleHeader = singleHeader;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclLoggingConfigurationRedactedFields#getUriPath}
         * @param uriPath uri_path block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#uri_path Wafv2WebAclLoggingConfiguration#uri_path}
         * @return {@code this}
         */
        public Builder uriPath(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath uriPath) {
            this.uriPath = uriPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclLoggingConfigurationRedactedFields}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclLoggingConfigurationRedactedFields build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclLoggingConfigurationRedactedFields}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclLoggingConfigurationRedactedFields {
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod method;
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString queryString;
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader singleHeader;
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath uriPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.method = software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod.class));
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString.class));
            this.singleHeader = software.amazon.jsii.Kernel.get(this, "singleHeader", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader.class));
            this.uriPath = software.amazon.jsii.Kernel.get(this, "uriPath", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.method = builder.method;
            this.queryString = builder.queryString;
            this.singleHeader = builder.singleHeader;
            this.uriPath = builder.uriPath;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsMethod getMethod() {
            return this.method;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsQueryString getQueryString() {
            return this.queryString;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsSingleHeader getSingleHeader() {
            return this.singleHeader;
        }

        @Override
        public final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsUriPath getUriPath() {
            return this.uriPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMethod() != null) {
                data.set("method", om.valueToTree(this.getMethod()));
            }
            if (this.getQueryString() != null) {
                data.set("queryString", om.valueToTree(this.getQueryString()));
            }
            if (this.getSingleHeader() != null) {
                data.set("singleHeader", om.valueToTree(this.getSingleHeader()));
            }
            if (this.getUriPath() != null) {
                data.set("uriPath", om.valueToTree(this.getUriPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationRedactedFields"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclLoggingConfigurationRedactedFields.Jsii$Proxy that = (Wafv2WebAclLoggingConfigurationRedactedFields.Jsii$Proxy) o;

            if (this.method != null ? !this.method.equals(that.method) : that.method != null) return false;
            if (this.queryString != null ? !this.queryString.equals(that.queryString) : that.queryString != null) return false;
            if (this.singleHeader != null ? !this.singleHeader.equals(that.singleHeader) : that.singleHeader != null) return false;
            return this.uriPath != null ? this.uriPath.equals(that.uriPath) : that.uriPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.method != null ? this.method.hashCode() : 0;
            result = 31 * result + (this.queryString != null ? this.queryString.hashCode() : 0);
            result = 31 * result + (this.singleHeader != null ? this.singleHeader.hashCode() : 0);
            result = 31 * result + (this.uriPath != null ? this.uriPath.hashCode() : 0);
            return result;
        }
    }
}
