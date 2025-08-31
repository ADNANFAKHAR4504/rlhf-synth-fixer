package imports.aws.cleanrooms_collaboration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsCollaboration.CleanroomsCollaborationMember")
@software.amazon.jsii.Jsii.Proxy(CleanroomsCollaborationMember.Jsii$Proxy.class)
public interface CleanroomsCollaborationMember extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#account_id CleanroomsCollaboration#account_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#display_name CleanroomsCollaboration#display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#member_abilities CleanroomsCollaboration#member_abilities}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMemberAbilities();

    /**
     * @return a {@link Builder} of {@link CleanroomsCollaborationMember}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsCollaborationMember}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsCollaborationMember> {
        java.lang.String accountId;
        java.lang.String displayName;
        java.util.List<java.lang.String> memberAbilities;

        /**
         * Sets the value of {@link CleanroomsCollaborationMember#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#account_id CleanroomsCollaboration#account_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationMember#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#display_name CleanroomsCollaboration#display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsCollaborationMember#getMemberAbilities}
         * @param memberAbilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_collaboration#member_abilities CleanroomsCollaboration#member_abilities}. This parameter is required.
         * @return {@code this}
         */
        public Builder memberAbilities(java.util.List<java.lang.String> memberAbilities) {
            this.memberAbilities = memberAbilities;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsCollaborationMember}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsCollaborationMember build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsCollaborationMember}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsCollaborationMember {
        private final java.lang.String accountId;
        private final java.lang.String displayName;
        private final java.util.List<java.lang.String> memberAbilities;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memberAbilities = software.amazon.jsii.Kernel.get(this, "memberAbilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountId = java.util.Objects.requireNonNull(builder.accountId, "accountId is required");
            this.displayName = java.util.Objects.requireNonNull(builder.displayName, "displayName is required");
            this.memberAbilities = java.util.Objects.requireNonNull(builder.memberAbilities, "memberAbilities is required");
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.util.List<java.lang.String> getMemberAbilities() {
            return this.memberAbilities;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountId", om.valueToTree(this.getAccountId()));
            data.set("displayName", om.valueToTree(this.getDisplayName()));
            data.set("memberAbilities", om.valueToTree(this.getMemberAbilities()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsCollaboration.CleanroomsCollaborationMember"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsCollaborationMember.Jsii$Proxy that = (CleanroomsCollaborationMember.Jsii$Proxy) o;

            if (!accountId.equals(that.accountId)) return false;
            if (!displayName.equals(that.displayName)) return false;
            return this.memberAbilities.equals(that.memberAbilities);
        }

        @Override
        public final int hashCode() {
            int result = this.accountId.hashCode();
            result = 31 * result + (this.displayName.hashCode());
            result = 31 * result + (this.memberAbilities.hashCode());
            return result;
        }
    }
}
