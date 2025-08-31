package imports.aws.ssoadmin_permissions_boundary_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.525Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminPermissionsBoundaryAttachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundary")
@software.amazon.jsii.Jsii.Proxy(SsoadminPermissionsBoundaryAttachmentPermissionsBoundary.Jsii$Proxy.class)
public interface SsoadminPermissionsBoundaryAttachmentPermissionsBoundary extends software.amazon.jsii.JsiiSerializable {

    /**
     * customer_managed_policy_reference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_permissions_boundary_attachment#customer_managed_policy_reference SsoadminPermissionsBoundaryAttachment#customer_managed_policy_reference}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference getCustomerManagedPolicyReference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_permissions_boundary_attachment#managed_policy_arn SsoadminPermissionsBoundaryAttachment#managed_policy_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getManagedPolicyArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminPermissionsBoundaryAttachmentPermissionsBoundary> {
        imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference customerManagedPolicyReference;
        java.lang.String managedPolicyArn;

        /**
         * Sets the value of {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary#getCustomerManagedPolicyReference}
         * @param customerManagedPolicyReference customer_managed_policy_reference block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_permissions_boundary_attachment#customer_managed_policy_reference SsoadminPermissionsBoundaryAttachment#customer_managed_policy_reference}
         * @return {@code this}
         */
        public Builder customerManagedPolicyReference(imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference customerManagedPolicyReference) {
            this.customerManagedPolicyReference = customerManagedPolicyReference;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary#getManagedPolicyArn}
         * @param managedPolicyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_permissions_boundary_attachment#managed_policy_arn SsoadminPermissionsBoundaryAttachment#managed_policy_arn}.
         * @return {@code this}
         */
        public Builder managedPolicyArn(java.lang.String managedPolicyArn) {
            this.managedPolicyArn = managedPolicyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminPermissionsBoundaryAttachmentPermissionsBoundary build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminPermissionsBoundaryAttachmentPermissionsBoundary}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminPermissionsBoundaryAttachmentPermissionsBoundary {
        private final imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference customerManagedPolicyReference;
        private final java.lang.String managedPolicyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customerManagedPolicyReference = software.amazon.jsii.Kernel.get(this, "customerManagedPolicyReference", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference.class));
            this.managedPolicyArn = software.amazon.jsii.Kernel.get(this, "managedPolicyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customerManagedPolicyReference = builder.customerManagedPolicyReference;
            this.managedPolicyArn = builder.managedPolicyArn;
        }

        @Override
        public final imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference getCustomerManagedPolicyReference() {
            return this.customerManagedPolicyReference;
        }

        @Override
        public final java.lang.String getManagedPolicyArn() {
            return this.managedPolicyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomerManagedPolicyReference() != null) {
                data.set("customerManagedPolicyReference", om.valueToTree(this.getCustomerManagedPolicyReference()));
            }
            if (this.getManagedPolicyArn() != null) {
                data.set("managedPolicyArn", om.valueToTree(this.getManagedPolicyArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminPermissionsBoundaryAttachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundary"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminPermissionsBoundaryAttachmentPermissionsBoundary.Jsii$Proxy that = (SsoadminPermissionsBoundaryAttachmentPermissionsBoundary.Jsii$Proxy) o;

            if (this.customerManagedPolicyReference != null ? !this.customerManagedPolicyReference.equals(that.customerManagedPolicyReference) : that.customerManagedPolicyReference != null) return false;
            return this.managedPolicyArn != null ? this.managedPolicyArn.equals(that.managedPolicyArn) : that.managedPolicyArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customerManagedPolicyReference != null ? this.customerManagedPolicyReference.hashCode() : 0;
            result = 31 * result + (this.managedPolicyArn != null ? this.managedPolicyArn.hashCode() : 0);
            return result;
        }
    }
}
