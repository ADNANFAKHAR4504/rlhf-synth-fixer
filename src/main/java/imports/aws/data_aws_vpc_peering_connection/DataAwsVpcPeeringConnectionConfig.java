package imports.aws.data_aws_vpc_peering_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.914Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsVpcPeeringConnection.DataAwsVpcPeeringConnectionConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsVpcPeeringConnectionConfig.Jsii$Proxy.class)
public interface DataAwsVpcPeeringConnectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#cidr_block DataAwsVpcPeeringConnection#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#filter DataAwsVpcPeeringConnection#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#id DataAwsVpcPeeringConnection#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#owner_id DataAwsVpcPeeringConnection#owner_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_cidr_block DataAwsVpcPeeringConnection#peer_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_owner_id DataAwsVpcPeeringConnection#peer_owner_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerOwnerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_region DataAwsVpcPeeringConnection#peer_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_vpc_id DataAwsVpcPeeringConnection#peer_vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerVpcId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#region DataAwsVpcPeeringConnection#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#status DataAwsVpcPeeringConnection#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#tags DataAwsVpcPeeringConnection#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#timeouts DataAwsVpcPeeringConnection#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#vpc_id DataAwsVpcPeeringConnection#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsVpcPeeringConnectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsVpcPeeringConnectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsVpcPeeringConnectionConfig> {
        java.lang.String cidrBlock;
        java.lang.Object filter;
        java.lang.String id;
        java.lang.String ownerId;
        java.lang.String peerCidrBlock;
        java.lang.String peerOwnerId;
        java.lang.String peerRegion;
        java.lang.String peerVpcId;
        java.lang.String region;
        java.lang.String status;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts timeouts;
        java.lang.String vpcId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#cidr_block DataAwsVpcPeeringConnection#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#filter DataAwsVpcPeeringConnection#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#filter DataAwsVpcPeeringConnection#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#id DataAwsVpcPeeringConnection#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getOwnerId}
         * @param ownerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#owner_id DataAwsVpcPeeringConnection#owner_id}.
         * @return {@code this}
         */
        public Builder ownerId(java.lang.String ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getPeerCidrBlock}
         * @param peerCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_cidr_block DataAwsVpcPeeringConnection#peer_cidr_block}.
         * @return {@code this}
         */
        public Builder peerCidrBlock(java.lang.String peerCidrBlock) {
            this.peerCidrBlock = peerCidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getPeerOwnerId}
         * @param peerOwnerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_owner_id DataAwsVpcPeeringConnection#peer_owner_id}.
         * @return {@code this}
         */
        public Builder peerOwnerId(java.lang.String peerOwnerId) {
            this.peerOwnerId = peerOwnerId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getPeerRegion}
         * @param peerRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_region DataAwsVpcPeeringConnection#peer_region}.
         * @return {@code this}
         */
        public Builder peerRegion(java.lang.String peerRegion) {
            this.peerRegion = peerRegion;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getPeerVpcId}
         * @param peerVpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#peer_vpc_id DataAwsVpcPeeringConnection#peer_vpc_id}.
         * @return {@code this}
         */
        public Builder peerVpcId(java.lang.String peerVpcId) {
            this.peerVpcId = peerVpcId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#region DataAwsVpcPeeringConnection#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#status DataAwsVpcPeeringConnection#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#tags DataAwsVpcPeeringConnection#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#timeouts DataAwsVpcPeeringConnection#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/vpc_peering_connection#vpc_id DataAwsVpcPeeringConnection#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsVpcPeeringConnectionConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsVpcPeeringConnectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsVpcPeeringConnectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsVpcPeeringConnectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsVpcPeeringConnectionConfig {
        private final java.lang.String cidrBlock;
        private final java.lang.Object filter;
        private final java.lang.String id;
        private final java.lang.String ownerId;
        private final java.lang.String peerCidrBlock;
        private final java.lang.String peerOwnerId;
        private final java.lang.String peerRegion;
        private final java.lang.String peerVpcId;
        private final java.lang.String region;
        private final java.lang.String status;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts timeouts;
        private final java.lang.String vpcId;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownerId = software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerCidrBlock = software.amazon.jsii.Kernel.get(this, "peerCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerOwnerId = software.amazon.jsii.Kernel.get(this, "peerOwnerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerRegion = software.amazon.jsii.Kernel.get(this, "peerRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerVpcId = software.amazon.jsii.Kernel.get(this, "peerVpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidrBlock = builder.cidrBlock;
            this.filter = builder.filter;
            this.id = builder.id;
            this.ownerId = builder.ownerId;
            this.peerCidrBlock = builder.peerCidrBlock;
            this.peerOwnerId = builder.peerOwnerId;
            this.peerRegion = builder.peerRegion;
            this.peerVpcId = builder.peerVpcId;
            this.region = builder.region;
            this.status = builder.status;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.vpcId = builder.vpcId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOwnerId() {
            return this.ownerId;
        }

        @Override
        public final java.lang.String getPeerCidrBlock() {
            return this.peerCidrBlock;
        }

        @Override
        public final java.lang.String getPeerOwnerId() {
            return this.peerOwnerId;
        }

        @Override
        public final java.lang.String getPeerRegion() {
            return this.peerRegion;
        }

        @Override
        public final java.lang.String getPeerVpcId() {
            return this.peerVpcId;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.data_aws_vpc_peering_connection.DataAwsVpcPeeringConnectionTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOwnerId() != null) {
                data.set("ownerId", om.valueToTree(this.getOwnerId()));
            }
            if (this.getPeerCidrBlock() != null) {
                data.set("peerCidrBlock", om.valueToTree(this.getPeerCidrBlock()));
            }
            if (this.getPeerOwnerId() != null) {
                data.set("peerOwnerId", om.valueToTree(this.getPeerOwnerId()));
            }
            if (this.getPeerRegion() != null) {
                data.set("peerRegion", om.valueToTree(this.getPeerRegion()));
            }
            if (this.getPeerVpcId() != null) {
                data.set("peerVpcId", om.valueToTree(this.getPeerVpcId()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsVpcPeeringConnection.DataAwsVpcPeeringConnectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsVpcPeeringConnectionConfig.Jsii$Proxy that = (DataAwsVpcPeeringConnectionConfig.Jsii$Proxy) o;

            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ownerId != null ? !this.ownerId.equals(that.ownerId) : that.ownerId != null) return false;
            if (this.peerCidrBlock != null ? !this.peerCidrBlock.equals(that.peerCidrBlock) : that.peerCidrBlock != null) return false;
            if (this.peerOwnerId != null ? !this.peerOwnerId.equals(that.peerOwnerId) : that.peerOwnerId != null) return false;
            if (this.peerRegion != null ? !this.peerRegion.equals(that.peerRegion) : that.peerRegion != null) return false;
            if (this.peerVpcId != null ? !this.peerVpcId.equals(that.peerVpcId) : that.peerVpcId != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcId != null ? !this.vpcId.equals(that.vpcId) : that.vpcId != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cidrBlock != null ? this.cidrBlock.hashCode() : 0;
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ownerId != null ? this.ownerId.hashCode() : 0);
            result = 31 * result + (this.peerCidrBlock != null ? this.peerCidrBlock.hashCode() : 0);
            result = 31 * result + (this.peerOwnerId != null ? this.peerOwnerId.hashCode() : 0);
            result = 31 * result + (this.peerRegion != null ? this.peerRegion.hashCode() : 0);
            result = 31 * result + (this.peerVpcId != null ? this.peerVpcId.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
