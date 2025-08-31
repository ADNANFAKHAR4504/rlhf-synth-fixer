package imports.aws.neptunegraph_graph;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph aws_neptunegraph_graph}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.934Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptunegraphGraph.NeptunegraphGraph")
public class NeptunegraphGraph extends com.hashicorp.cdktf.TerraformResource {

    protected NeptunegraphGraph(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NeptunegraphGraph(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.neptunegraph_graph.NeptunegraphGraph.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph aws_neptunegraph_graph} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public NeptunegraphGraph(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.neptunegraph_graph.NeptunegraphGraphConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a NeptunegraphGraph resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NeptunegraphGraph to import. This parameter is required.
     * @param importFromId The id of the existing NeptunegraphGraph that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the NeptunegraphGraph to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.neptunegraph_graph.NeptunegraphGraph.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a NeptunegraphGraph resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NeptunegraphGraph to import. This parameter is required.
     * @param importFromId The id of the existing NeptunegraphGraph that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.neptunegraph_graph.NeptunegraphGraph.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVectorSearchConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration> __cast_cd4240 = (java.util.List<imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVectorSearchConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeletionProtection() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGraphName() {
        software.amazon.jsii.Kernel.call(this, "resetGraphName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGraphNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetGraphNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPublicConnectivity() {
        software.amazon.jsii.Kernel.call(this, "resetPublicConnectivity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicaCount() {
        software.amazon.jsii.Kernel.call(this, "resetReplicaCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVectorSearchConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetVectorSearchConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.neptunegraph_graph.NeptunegraphGraphTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.neptunegraph_graph.NeptunegraphGraphTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfigurationList getVectorSearchConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "vectorSearchConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGraphNameInput() {
        return software.amazon.jsii.Kernel.get(this, "graphNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGraphNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "graphNamePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedMemoryInput() {
        return software.amazon.jsii.Kernel.get(this, "provisionedMemoryInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPublicConnectivityInput() {
        return software.amazon.jsii.Kernel.get(this, "publicConnectivityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReplicaCountInput() {
        return software.amazon.jsii.Kernel.get(this, "replicaCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVectorSearchConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "vectorSearchConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeletionProtection() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeletionProtection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtection", java.util.Objects.requireNonNull(value, "deletionProtection is required"));
    }

    public void setDeletionProtection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtection", java.util.Objects.requireNonNull(value, "deletionProtection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGraphName() {
        return software.amazon.jsii.Kernel.get(this, "graphName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGraphName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "graphName", java.util.Objects.requireNonNull(value, "graphName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGraphNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "graphNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGraphNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "graphNamePrefix", java.util.Objects.requireNonNull(value, "graphNamePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyIdentifier", java.util.Objects.requireNonNull(value, "kmsKeyIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedMemory() {
        return software.amazon.jsii.Kernel.get(this, "provisionedMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProvisionedMemory(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "provisionedMemory", java.util.Objects.requireNonNull(value, "provisionedMemory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPublicConnectivity() {
        return software.amazon.jsii.Kernel.get(this, "publicConnectivity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPublicConnectivity(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publicConnectivity", java.util.Objects.requireNonNull(value, "publicConnectivity is required"));
    }

    public void setPublicConnectivity(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publicConnectivity", java.util.Objects.requireNonNull(value, "publicConnectivity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReplicaCount() {
        return software.amazon.jsii.Kernel.get(this, "replicaCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReplicaCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "replicaCount", java.util.Objects.requireNonNull(value, "replicaCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.neptunegraph_graph.NeptunegraphGraph}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.neptunegraph_graph.NeptunegraphGraph> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.neptunegraph_graph.NeptunegraphGraphConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.neptunegraph_graph.NeptunegraphGraphConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * The provisioned memory-optimized Neptune Capacity Units (m-NCUs) to use for the graph.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#provisioned_memory NeptunegraphGraph#provisioned_memory}
         * <p>
         * @return {@code this}
         * @param provisionedMemory The provisioned memory-optimized Neptune Capacity Units (m-NCUs) to use for the graph. This parameter is required.
         */
        public Builder provisionedMemory(final java.lang.Number provisionedMemory) {
            this.config.provisionedMemory(provisionedMemory);
            return this;
        }

        /**
         * A value that indicates whether the graph has deletion protection enabled.
         * <p>
         * The graph can't be deleted when deletion protection is enabled.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#deletion_protection NeptunegraphGraph#deletion_protection}
         * <p>
         * @return {@code this}
         * @param deletionProtection A value that indicates whether the graph has deletion protection enabled. This parameter is required.
         */
        public Builder deletionProtection(final java.lang.Boolean deletionProtection) {
            this.config.deletionProtection(deletionProtection);
            return this;
        }
        /**
         * A value that indicates whether the graph has deletion protection enabled.
         * <p>
         * The graph can't be deleted when deletion protection is enabled.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#deletion_protection NeptunegraphGraph#deletion_protection}
         * <p>
         * @return {@code this}
         * @param deletionProtection A value that indicates whether the graph has deletion protection enabled. This parameter is required.
         */
        public Builder deletionProtection(final com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.config.deletionProtection(deletionProtection);
            return this;
        }

        /**
         * The graph name.
         * <p>
         * For example: my-graph-1.
         * The name must contain from 1 to 63 letters, numbers, or hyphens,
         * and its first character must be a letter. It cannot end with a hyphen or contain two consecutive hyphens.
         * If you don't specify a graph name, a unique graph name is generated for you using the prefix graph-for,
         * followed by a combination of Stack Name and a UUID.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name NeptunegraphGraph#graph_name}
         * <p>
         * @return {@code this}
         * @param graphName The graph name. This parameter is required.
         */
        public Builder graphName(final java.lang.String graphName) {
            this.config.graphName(graphName);
            return this;
        }

        /**
         * Allows user to specify name prefix and have remainder of name automatically generated.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name_prefix NeptunegraphGraph#graph_name_prefix}
         * <p>
         * @return {@code this}
         * @param graphNamePrefix Allows user to specify name prefix and have remainder of name automatically generated. This parameter is required.
         */
        public Builder graphNamePrefix(final java.lang.String graphNamePrefix) {
            this.config.graphNamePrefix(graphNamePrefix);
            return this;
        }

        /**
         * Specifies a KMS key to use to encrypt data in the new graph.
         * <p>
         * Value must be ARN of KMS Key.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#kms_key_identifier NeptunegraphGraph#kms_key_identifier}
         * <p>
         * @return {@code this}
         * @param kmsKeyIdentifier Specifies a KMS key to use to encrypt data in the new graph. This parameter is required.
         */
        public Builder kmsKeyIdentifier(final java.lang.String kmsKeyIdentifier) {
            this.config.kmsKeyIdentifier(kmsKeyIdentifier);
            return this;
        }

        /**
         * Specifies whether or not the graph can be reachable over the internet.
         * <p>
         * All access to graphs is IAM authenticated.
         * When the graph is publicly available, its domain name system (DNS) endpoint resolves to
         * the public IP address from the internet. When the graph isn't publicly available, you need
         * to create a PrivateGraphEndpoint in a given VPC to ensure the DNS name resolves to a private
         * IP address that is reachable from the VPC.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#public_connectivity NeptunegraphGraph#public_connectivity}
         * <p>
         * @return {@code this}
         * @param publicConnectivity Specifies whether or not the graph can be reachable over the internet. This parameter is required.
         */
        public Builder publicConnectivity(final java.lang.Boolean publicConnectivity) {
            this.config.publicConnectivity(publicConnectivity);
            return this;
        }
        /**
         * Specifies whether or not the graph can be reachable over the internet.
         * <p>
         * All access to graphs is IAM authenticated.
         * When the graph is publicly available, its domain name system (DNS) endpoint resolves to
         * the public IP address from the internet. When the graph isn't publicly available, you need
         * to create a PrivateGraphEndpoint in a given VPC to ensure the DNS name resolves to a private
         * IP address that is reachable from the VPC.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#public_connectivity NeptunegraphGraph#public_connectivity}
         * <p>
         * @return {@code this}
         * @param publicConnectivity Specifies whether or not the graph can be reachable over the internet. This parameter is required.
         */
        public Builder publicConnectivity(final com.hashicorp.cdktf.IResolvable publicConnectivity) {
            this.config.publicConnectivity(publicConnectivity);
            return this;
        }

        /**
         * The number of replicas in other AZs.  Value must be between 0 and 2.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#replica_count NeptunegraphGraph#replica_count}
         * <p>
         * @return {@code this}
         * @param replicaCount The number of replicas in other AZs.  Value must be between 0 and 2. This parameter is required.
         */
        public Builder replicaCount(final java.lang.Number replicaCount) {
            this.config.replicaCount(replicaCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#tags NeptunegraphGraph#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#tags NeptunegraphGraph#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#timeouts NeptunegraphGraph#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * vector_search_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_configuration NeptunegraphGraph#vector_search_configuration}
         * <p>
         * @return {@code this}
         * @param vectorSearchConfiguration vector_search_configuration block. This parameter is required.
         */
        public Builder vectorSearchConfiguration(final com.hashicorp.cdktf.IResolvable vectorSearchConfiguration) {
            this.config.vectorSearchConfiguration(vectorSearchConfiguration);
            return this;
        }
        /**
         * vector_search_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_configuration NeptunegraphGraph#vector_search_configuration}
         * <p>
         * @return {@code this}
         * @param vectorSearchConfiguration vector_search_configuration block. This parameter is required.
         */
        public Builder vectorSearchConfiguration(final java.util.List<? extends imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration> vectorSearchConfiguration) {
            this.config.vectorSearchConfiguration(vectorSearchConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.neptunegraph_graph.NeptunegraphGraph}.
         */
        @Override
        public imports.aws.neptunegraph_graph.NeptunegraphGraph build() {
            return new imports.aws.neptunegraph_graph.NeptunegraphGraph(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
