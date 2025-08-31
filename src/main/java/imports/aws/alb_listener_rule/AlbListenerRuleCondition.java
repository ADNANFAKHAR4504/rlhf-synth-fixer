package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleCondition")
@software.amazon.jsii.Jsii.Proxy(AlbListenerRuleCondition.Jsii$Proxy.class)
public interface AlbListenerRuleCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * host_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#host_header AlbListenerRule#host_header}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader getHostHeader() {
        return null;
    }

    /**
     * http_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_header AlbListenerRule#http_header}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader getHttpHeader() {
        return null;
    }

    /**
     * http_request_method block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_request_method AlbListenerRule#http_request_method}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod getHttpRequestMethod() {
        return null;
    }

    /**
     * path_pattern block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#path_pattern AlbListenerRule#path_pattern}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern getPathPattern() {
        return null;
    }

    /**
     * query_string block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#query_string AlbListenerRule#query_string}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryString() {
        return null;
    }

    /**
     * source_ip block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#source_ip AlbListenerRule#source_ip}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp getSourceIp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbListenerRuleCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbListenerRuleCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbListenerRuleCondition> {
        imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader hostHeader;
        imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader httpHeader;
        imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod httpRequestMethod;
        imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern pathPattern;
        java.lang.Object queryString;
        imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp sourceIp;

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getHostHeader}
         * @param hostHeader host_header block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#host_header AlbListenerRule#host_header}
         * @return {@code this}
         */
        public Builder hostHeader(imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader hostHeader) {
            this.hostHeader = hostHeader;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getHttpHeader}
         * @param httpHeader http_header block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_header AlbListenerRule#http_header}
         * @return {@code this}
         */
        public Builder httpHeader(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader httpHeader) {
            this.httpHeader = httpHeader;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getHttpRequestMethod}
         * @param httpRequestMethod http_request_method block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#http_request_method AlbListenerRule#http_request_method}
         * @return {@code this}
         */
        public Builder httpRequestMethod(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod httpRequestMethod) {
            this.httpRequestMethod = httpRequestMethod;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getPathPattern}
         * @param pathPattern path_pattern block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#path_pattern AlbListenerRule#path_pattern}
         * @return {@code this}
         */
        public Builder pathPattern(imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern pathPattern) {
            this.pathPattern = pathPattern;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#query_string AlbListenerRule#query_string}
         * @return {@code this}
         */
        public Builder queryString(com.hashicorp.cdktf.IResolvable queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#query_string AlbListenerRule#query_string}
         * @return {@code this}
         */
        public Builder queryString(java.util.List<? extends imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryString> queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleCondition#getSourceIp}
         * @param sourceIp source_ip block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#source_ip AlbListenerRule#source_ip}
         * @return {@code this}
         */
        public Builder sourceIp(imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp sourceIp) {
            this.sourceIp = sourceIp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbListenerRuleCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbListenerRuleCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbListenerRuleCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbListenerRuleCondition {
        private final imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader hostHeader;
        private final imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader httpHeader;
        private final imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod httpRequestMethod;
        private final imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern pathPattern;
        private final java.lang.Object queryString;
        private final imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp sourceIp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hostHeader = software.amazon.jsii.Kernel.get(this, "hostHeader", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader.class));
            this.httpHeader = software.amazon.jsii.Kernel.get(this, "httpHeader", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader.class));
            this.httpRequestMethod = software.amazon.jsii.Kernel.get(this, "httpRequestMethod", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod.class));
            this.pathPattern = software.amazon.jsii.Kernel.get(this, "pathPattern", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern.class));
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceIp = software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hostHeader = builder.hostHeader;
            this.httpHeader = builder.httpHeader;
            this.httpRequestMethod = builder.httpRequestMethod;
            this.pathPattern = builder.pathPattern;
            this.queryString = builder.queryString;
            this.sourceIp = builder.sourceIp;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader getHostHeader() {
            return this.hostHeader;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader getHttpHeader() {
            return this.httpHeader;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod getHttpRequestMethod() {
            return this.httpRequestMethod;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern getPathPattern() {
            return this.pathPattern;
        }

        @Override
        public final java.lang.Object getQueryString() {
            return this.queryString;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp getSourceIp() {
            return this.sourceIp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHostHeader() != null) {
                data.set("hostHeader", om.valueToTree(this.getHostHeader()));
            }
            if (this.getHttpHeader() != null) {
                data.set("httpHeader", om.valueToTree(this.getHttpHeader()));
            }
            if (this.getHttpRequestMethod() != null) {
                data.set("httpRequestMethod", om.valueToTree(this.getHttpRequestMethod()));
            }
            if (this.getPathPattern() != null) {
                data.set("pathPattern", om.valueToTree(this.getPathPattern()));
            }
            if (this.getQueryString() != null) {
                data.set("queryString", om.valueToTree(this.getQueryString()));
            }
            if (this.getSourceIp() != null) {
                data.set("sourceIp", om.valueToTree(this.getSourceIp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albListenerRule.AlbListenerRuleCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbListenerRuleCondition.Jsii$Proxy that = (AlbListenerRuleCondition.Jsii$Proxy) o;

            if (this.hostHeader != null ? !this.hostHeader.equals(that.hostHeader) : that.hostHeader != null) return false;
            if (this.httpHeader != null ? !this.httpHeader.equals(that.httpHeader) : that.httpHeader != null) return false;
            if (this.httpRequestMethod != null ? !this.httpRequestMethod.equals(that.httpRequestMethod) : that.httpRequestMethod != null) return false;
            if (this.pathPattern != null ? !this.pathPattern.equals(that.pathPattern) : that.pathPattern != null) return false;
            if (this.queryString != null ? !this.queryString.equals(that.queryString) : that.queryString != null) return false;
            return this.sourceIp != null ? this.sourceIp.equals(that.sourceIp) : that.sourceIp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hostHeader != null ? this.hostHeader.hashCode() : 0;
            result = 31 * result + (this.httpHeader != null ? this.httpHeader.hashCode() : 0);
            result = 31 * result + (this.httpRequestMethod != null ? this.httpRequestMethod.hashCode() : 0);
            result = 31 * result + (this.pathPattern != null ? this.pathPattern.hashCode() : 0);
            result = 31 * result + (this.queryString != null ? this.queryString.hashCode() : 0);
            result = 31 * result + (this.sourceIp != null ? this.sourceIp.hashCode() : 0);
            return result;
        }
    }
}
