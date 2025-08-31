package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cmk_arn DlmLifecyclePolicy#cmk_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCmkArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration> {
        java.lang.String cmkArn;
        java.lang.Object encrypted;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration#getCmkArn}
         * @param cmkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cmk_arn DlmLifecyclePolicy#cmk_arn}.
         * @return {@code this}
         */
        public Builder cmkArn(java.lang.String cmkArn) {
            this.cmkArn = cmkArn;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration {
        private final java.lang.String cmkArn;
        private final java.lang.Object encrypted;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cmkArn = software.amazon.jsii.Kernel.get(this, "cmkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cmkArn = builder.cmkArn;
            this.encrypted = builder.encrypted;
        }

        @Override
        public final java.lang.String getCmkArn() {
            return this.cmkArn;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCmkArn() != null) {
                data.set("cmkArn", om.valueToTree(this.getCmkArn()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration.Jsii$Proxy) o;

            if (this.cmkArn != null ? !this.cmkArn.equals(that.cmkArn) : that.cmkArn != null) return false;
            return this.encrypted != null ? this.encrypted.equals(that.encrypted) : that.encrypted == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cmkArn != null ? this.cmkArn.hashCode() : 0;
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            return result;
        }
    }
}
