package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.271Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters.Jsii$Proxy.class)
public interface CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * body block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#body CloudwatchEventConnection#body}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBody() {
        return null;
    }

    /**
     * header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#header CloudwatchEventConnection#header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * query_string block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#query_string CloudwatchEventConnection#query_string}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryString() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters> {
        java.lang.Object body;
        java.lang.Object header;
        java.lang.Object queryString;

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getBody}
         * @param body body block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#body CloudwatchEventConnection#body}
         * @return {@code this}
         */
        public Builder body(com.hashicorp.cdktf.IResolvable body) {
            this.body = body;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getBody}
         * @param body body block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#body CloudwatchEventConnection#body}
         * @return {@code this}
         */
        public Builder body(java.util.List<? extends imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersBody> body) {
            this.body = body;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#header CloudwatchEventConnection#header}
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getHeader}
         * @param header header block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#header CloudwatchEventConnection#header}
         * @return {@code this}
         */
        public Builder header(java.util.List<? extends imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader> header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#query_string CloudwatchEventConnection#query_string}
         * @return {@code this}
         */
        public Builder queryString(com.hashicorp.cdktf.IResolvable queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters#getQueryString}
         * @param queryString query_string block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#query_string CloudwatchEventConnection#query_string}
         * @return {@code this}
         */
        public Builder queryString(java.util.List<? extends imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersQueryString> queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters {
        private final java.lang.Object body;
        private final java.lang.Object header;
        private final java.lang.Object queryString;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.body = software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.body = builder.body;
            this.header = builder.header;
            this.queryString = builder.queryString;
        }

        @Override
        public final java.lang.Object getBody() {
            return this.body;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        public final java.lang.Object getQueryString() {
            return this.queryString;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBody() != null) {
                data.set("body", om.valueToTree(this.getBody()));
            }
            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }
            if (this.getQueryString() != null) {
                data.set("queryString", om.valueToTree(this.getQueryString()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters.Jsii$Proxy that = (CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters.Jsii$Proxy) o;

            if (this.body != null ? !this.body.equals(that.body) : that.body != null) return false;
            if (this.header != null ? !this.header.equals(that.header) : that.header != null) return false;
            return this.queryString != null ? this.queryString.equals(that.queryString) : that.queryString == null;
        }

        @Override
        public final int hashCode() {
            int result = this.body != null ? this.body.hashCode() : 0;
            result = 31 * result + (this.header != null ? this.header.hashCode() : 0);
            result = 31 * result + (this.queryString != null ? this.queryString.hashCode() : 0);
            return result;
        }
    }
}
