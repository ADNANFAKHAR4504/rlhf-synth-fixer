package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsEventSourceParameters")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsEventSourceParameters.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsEventSourceParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#description_regex DlmLifecyclePolicy#description_regex}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDescriptionRegex();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#event_type DlmLifecyclePolicy#event_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEventType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#snapshot_owner DlmLifecyclePolicy#snapshot_owner}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSnapshotOwner();

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsEventSourceParameters> {
        java.lang.String descriptionRegex;
        java.lang.String eventType;
        java.util.List<java.lang.String> snapshotOwner;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters#getDescriptionRegex}
         * @param descriptionRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#description_regex DlmLifecyclePolicy#description_regex}. This parameter is required.
         * @return {@code this}
         */
        public Builder descriptionRegex(java.lang.String descriptionRegex) {
            this.descriptionRegex = descriptionRegex;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters#getEventType}
         * @param eventType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#event_type DlmLifecyclePolicy#event_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder eventType(java.lang.String eventType) {
            this.eventType = eventType;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters#getSnapshotOwner}
         * @param snapshotOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#snapshot_owner DlmLifecyclePolicy#snapshot_owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder snapshotOwner(java.util.List<java.lang.String> snapshotOwner) {
            this.snapshotOwner = snapshotOwner;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsEventSourceParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsEventSourceParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsEventSourceParameters {
        private final java.lang.String descriptionRegex;
        private final java.lang.String eventType;
        private final java.util.List<java.lang.String> snapshotOwner;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.descriptionRegex = software.amazon.jsii.Kernel.get(this, "descriptionRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventType = software.amazon.jsii.Kernel.get(this, "eventType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotOwner = software.amazon.jsii.Kernel.get(this, "snapshotOwner", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.descriptionRegex = java.util.Objects.requireNonNull(builder.descriptionRegex, "descriptionRegex is required");
            this.eventType = java.util.Objects.requireNonNull(builder.eventType, "eventType is required");
            this.snapshotOwner = java.util.Objects.requireNonNull(builder.snapshotOwner, "snapshotOwner is required");
        }

        @Override
        public final java.lang.String getDescriptionRegex() {
            return this.descriptionRegex;
        }

        @Override
        public final java.lang.String getEventType() {
            return this.eventType;
        }

        @Override
        public final java.util.List<java.lang.String> getSnapshotOwner() {
            return this.snapshotOwner;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("descriptionRegex", om.valueToTree(this.getDescriptionRegex()));
            data.set("eventType", om.valueToTree(this.getEventType()));
            data.set("snapshotOwner", om.valueToTree(this.getSnapshotOwner()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsEventSourceParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsEventSourceParameters.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsEventSourceParameters.Jsii$Proxy) o;

            if (!descriptionRegex.equals(that.descriptionRegex)) return false;
            if (!eventType.equals(that.eventType)) return false;
            return this.snapshotOwner.equals(that.snapshotOwner);
        }

        @Override
        public final int hashCode() {
            int result = this.descriptionRegex.hashCode();
            result = 31 * result + (this.eventType.hashCode());
            result = 31 * result + (this.snapshotOwner.hashCode());
            return result;
        }
    }
}
