package imports.aws.evidently_feature;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.213Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyFeature.EvidentlyFeatureVariationsValue")
@software.amazon.jsii.Jsii.Proxy(EvidentlyFeatureVariationsValue.Jsii$Proxy.class)
public interface EvidentlyFeatureVariationsValue extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#bool_value EvidentlyFeature#bool_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBoolValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#double_value EvidentlyFeature#double_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDoubleValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#long_value EvidentlyFeature#long_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLongValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#string_value EvidentlyFeature#string_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStringValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyFeatureVariationsValue}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyFeatureVariationsValue}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyFeatureVariationsValue> {
        java.lang.String boolValue;
        java.lang.String doubleValue;
        java.lang.String longValue;
        java.lang.String stringValue;

        /**
         * Sets the value of {@link EvidentlyFeatureVariationsValue#getBoolValue}
         * @param boolValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#bool_value EvidentlyFeature#bool_value}.
         * @return {@code this}
         */
        public Builder boolValue(java.lang.String boolValue) {
            this.boolValue = boolValue;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyFeatureVariationsValue#getDoubleValue}
         * @param doubleValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#double_value EvidentlyFeature#double_value}.
         * @return {@code this}
         */
        public Builder doubleValue(java.lang.String doubleValue) {
            this.doubleValue = doubleValue;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyFeatureVariationsValue#getLongValue}
         * @param longValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#long_value EvidentlyFeature#long_value}.
         * @return {@code this}
         */
        public Builder longValue(java.lang.String longValue) {
            this.longValue = longValue;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyFeatureVariationsValue#getStringValue}
         * @param stringValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_feature#string_value EvidentlyFeature#string_value}.
         * @return {@code this}
         */
        public Builder stringValue(java.lang.String stringValue) {
            this.stringValue = stringValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyFeatureVariationsValue}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyFeatureVariationsValue build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyFeatureVariationsValue}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyFeatureVariationsValue {
        private final java.lang.String boolValue;
        private final java.lang.String doubleValue;
        private final java.lang.String longValue;
        private final java.lang.String stringValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.boolValue = software.amazon.jsii.Kernel.get(this, "boolValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.doubleValue = software.amazon.jsii.Kernel.get(this, "doubleValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longValue = software.amazon.jsii.Kernel.get(this, "longValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stringValue = software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.boolValue = builder.boolValue;
            this.doubleValue = builder.doubleValue;
            this.longValue = builder.longValue;
            this.stringValue = builder.stringValue;
        }

        @Override
        public final java.lang.String getBoolValue() {
            return this.boolValue;
        }

        @Override
        public final java.lang.String getDoubleValue() {
            return this.doubleValue;
        }

        @Override
        public final java.lang.String getLongValue() {
            return this.longValue;
        }

        @Override
        public final java.lang.String getStringValue() {
            return this.stringValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBoolValue() != null) {
                data.set("boolValue", om.valueToTree(this.getBoolValue()));
            }
            if (this.getDoubleValue() != null) {
                data.set("doubleValue", om.valueToTree(this.getDoubleValue()));
            }
            if (this.getLongValue() != null) {
                data.set("longValue", om.valueToTree(this.getLongValue()));
            }
            if (this.getStringValue() != null) {
                data.set("stringValue", om.valueToTree(this.getStringValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyFeature.EvidentlyFeatureVariationsValue"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyFeatureVariationsValue.Jsii$Proxy that = (EvidentlyFeatureVariationsValue.Jsii$Proxy) o;

            if (this.boolValue != null ? !this.boolValue.equals(that.boolValue) : that.boolValue != null) return false;
            if (this.doubleValue != null ? !this.doubleValue.equals(that.doubleValue) : that.doubleValue != null) return false;
            if (this.longValue != null ? !this.longValue.equals(that.longValue) : that.longValue != null) return false;
            return this.stringValue != null ? this.stringValue.equals(that.stringValue) : that.stringValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.boolValue != null ? this.boolValue.hashCode() : 0;
            result = 31 * result + (this.doubleValue != null ? this.doubleValue.hashCode() : 0);
            result = 31 * result + (this.longValue != null ? this.longValue.hashCode() : 0);
            result = 31 * result + (this.stringValue != null ? this.stringValue.hashCode() : 0);
            return result;
        }
    }
}
