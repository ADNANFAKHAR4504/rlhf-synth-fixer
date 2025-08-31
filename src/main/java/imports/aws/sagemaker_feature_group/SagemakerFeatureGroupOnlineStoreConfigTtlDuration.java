package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOnlineStoreConfigTtlDuration")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupOnlineStoreConfigTtlDuration.Jsii$Proxy.class)
public interface SagemakerFeatureGroupOnlineStoreConfigTtlDuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#unit SagemakerFeatureGroup#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#value SagemakerFeatureGroup#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupOnlineStoreConfigTtlDuration> {
        java.lang.String unit;
        java.lang.Number value;

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#unit SagemakerFeatureGroup#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#value SagemakerFeatureGroup#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.Number value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupOnlineStoreConfigTtlDuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupOnlineStoreConfigTtlDuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupOnlineStoreConfigTtlDuration {
        private final java.lang.String unit;
        private final java.lang.Number value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unit = builder.unit;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        public final java.lang.Number getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupOnlineStoreConfigTtlDuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupOnlineStoreConfigTtlDuration.Jsii$Proxy that = (SagemakerFeatureGroupOnlineStoreConfigTtlDuration.Jsii$Proxy) o;

            if (this.unit != null ? !this.unit.equals(that.unit) : that.unit != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.unit != null ? this.unit.hashCode() : 0;
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
