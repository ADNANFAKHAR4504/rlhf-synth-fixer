package imports.aws.eks_fargate_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.159Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksFargateProfile.EksFargateProfileSelector")
@software.amazon.jsii.Jsii.Proxy(EksFargateProfileSelector.Jsii$Proxy.class)
public interface EksFargateProfileSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_fargate_profile#namespace EksFargateProfile#namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_fargate_profile#labels EksFargateProfile#labels}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getLabels() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksFargateProfileSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksFargateProfileSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksFargateProfileSelector> {
        java.lang.String namespace;
        java.util.Map<java.lang.String, java.lang.String> labels;

        /**
         * Sets the value of {@link EksFargateProfileSelector#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_fargate_profile#namespace EksFargateProfile#namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link EksFargateProfileSelector#getLabels}
         * @param labels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_fargate_profile#labels EksFargateProfile#labels}.
         * @return {@code this}
         */
        public Builder labels(java.util.Map<java.lang.String, java.lang.String> labels) {
            this.labels = labels;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksFargateProfileSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksFargateProfileSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksFargateProfileSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksFargateProfileSelector {
        private final java.lang.String namespace;
        private final java.util.Map<java.lang.String, java.lang.String> labels;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.labels = software.amazon.jsii.Kernel.get(this, "labels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.namespace = java.util.Objects.requireNonNull(builder.namespace, "namespace is required");
            this.labels = builder.labels;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getLabels() {
            return this.labels;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("namespace", om.valueToTree(this.getNamespace()));
            if (this.getLabels() != null) {
                data.set("labels", om.valueToTree(this.getLabels()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksFargateProfile.EksFargateProfileSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksFargateProfileSelector.Jsii$Proxy that = (EksFargateProfileSelector.Jsii$Proxy) o;

            if (!namespace.equals(that.namespace)) return false;
            return this.labels != null ? this.labels.equals(that.labels) : that.labels == null;
        }

        @Override
        public final int hashCode() {
            int result = this.namespace.hashCode();
            result = 31 * result + (this.labels != null ? this.labels.hashCode() : 0);
            return result;
        }
    }
}
