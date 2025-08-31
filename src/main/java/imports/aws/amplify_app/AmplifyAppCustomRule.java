package imports.aws.amplify_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.933Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyApp.AmplifyAppCustomRule")
@software.amazon.jsii.Jsii.Proxy(AmplifyAppCustomRule.Jsii$Proxy.class)
public interface AmplifyAppCustomRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#source AmplifyApp#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#target AmplifyApp#target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTarget();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#condition AmplifyApp#condition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#status AmplifyApp#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyAppCustomRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyAppCustomRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyAppCustomRule> {
        java.lang.String source;
        java.lang.String target;
        java.lang.String condition;
        java.lang.String status;

        /**
         * Sets the value of {@link AmplifyAppCustomRule#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#source AmplifyApp#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppCustomRule#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#target AmplifyApp#target}. This parameter is required.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppCustomRule#getCondition}
         * @param condition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#condition AmplifyApp#condition}.
         * @return {@code this}
         */
        public Builder condition(java.lang.String condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppCustomRule#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#status AmplifyApp#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AmplifyAppCustomRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyAppCustomRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyAppCustomRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyAppCustomRule {
        private final java.lang.String source;
        private final java.lang.String target;
        private final java.lang.String condition;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.condition = builder.condition;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.String getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("source", om.valueToTree(this.getSource()));
            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.amplifyApp.AmplifyAppCustomRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyAppCustomRule.Jsii$Proxy that = (AmplifyAppCustomRule.Jsii$Proxy) o;

            if (!source.equals(that.source)) return false;
            if (!target.equals(that.target)) return false;
            if (this.condition != null ? !this.condition.equals(that.condition) : that.condition != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.source.hashCode();
            result = 31 * result + (this.target.hashCode());
            result = 31 * result + (this.condition != null ? this.condition.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
