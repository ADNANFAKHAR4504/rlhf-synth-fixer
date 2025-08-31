package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.377Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt")
@software.amazon.jsii.Jsii.Proxy(Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt.Jsii$Proxy.class)
public interface Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndInclusive() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartInclusive() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt> {
        java.lang.String endInclusive;
        java.lang.String startInclusive;

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt#getEndInclusive}
         * @param endInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
         * @return {@code this}
         */
        public Builder endInclusive(java.lang.String endInclusive) {
            this.endInclusive = endInclusive;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt#getStartInclusive}
         * @param startInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
         * @return {@code this}
         */
        public Builder startInclusive(java.lang.String startInclusive) {
            this.startInclusive = startInclusive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt {
        private final java.lang.String endInclusive;
        private final java.lang.String startInclusive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endInclusive = software.amazon.jsii.Kernel.get(this, "endInclusive", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startInclusive = software.amazon.jsii.Kernel.get(this, "startInclusive", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endInclusive = builder.endInclusive;
            this.startInclusive = builder.startInclusive;
        }

        @Override
        public final java.lang.String getEndInclusive() {
            return this.endInclusive;
        }

        @Override
        public final java.lang.String getStartInclusive() {
            return this.startInclusive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEndInclusive() != null) {
                data.set("endInclusive", om.valueToTree(this.getEndInclusive()));
            }
            if (this.getStartInclusive() != null) {
                data.set("startInclusive", om.valueToTree(this.getStartInclusive()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt.Jsii$Proxy that = (Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt.Jsii$Proxy) o;

            if (this.endInclusive != null ? !this.endInclusive.equals(that.endInclusive) : that.endInclusive != null) return false;
            return this.startInclusive != null ? this.startInclusive.equals(that.startInclusive) : that.startInclusive == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endInclusive != null ? this.endInclusive.hashCode() : 0;
            result = 31 * result + (this.startInclusive != null ? this.startInclusive.hashCode() : 0);
            return result;
        }
    }
}
