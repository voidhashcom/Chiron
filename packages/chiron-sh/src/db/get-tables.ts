import type { FieldAttribute } from ".";
import type { ChironOptions } from "../types";

export type ChironDbSchema = Record<
  string,
  {
    /**
     * The name of the table in the database
     */
    modelName: string;
    /**
     * The fields of the table
     */
    fields: Record<string, FieldAttribute>;
    /**
     * Whether to disable migrations for this table
     * @default false
     */
    disableMigrations?: boolean;
    /**
     * The order of the table
     */
    order?: number;
  }
>;

export const getSubscriptionManagementTables = (
  options: ChironOptions
): ChironDbSchema => {
  const pluginSchema = options.plugins?.reduce(
    (acc, plugin) => {
      const schema = plugin.schema;
      if (!schema) return acc;
      for (const [key, value] of Object.entries(schema)) {
        acc[key] = {
          fields: {
            ...acc[key]?.fields,
            ...value.fields,
          },
          modelName: value.modelName || key,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      { fields: Record<string, FieldAttribute>; modelName: string }
    >
  );

  const shouldAddRateLimitTable = options.rateLimit?.storage === "database";
  const rateLimitTable = {
    rateLimit: {
      modelName: options.rateLimit?.modelName || "rateLimit",
      fields: {
        key: {
          type: "string",
          fieldName: options.rateLimit?.fields?.key || "key",
        },
        count: {
          type: "number",
          fieldName: options.rateLimit?.fields?.count || "count",
        },
        lastRequest: {
          type: "number",
          bigint: true,
          fieldName: options.rateLimit?.fields?.lastRequest || "lastRequest",
        },
      },
    },
  } satisfies ChironDbSchema;

  const { customer, subscription, ...pluginTables } = pluginSchema || {};
  return {
    customer: {
      modelName: options.customer?.modelName || "chiron_customer",
      fields: {
        customUserId: {
          type: "string",
          required: true,
          fieldName: options.customer?.fields?.customUserId || "customUserId",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.customer?.fields?.createdAt || "createdAt",
        },
        updatedAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.customer?.fields?.updatedAt || "updatedAt",
        },
        ...customer?.fields,
        ...options.customer?.additionalFields,
      },
      order: 1,
    },
    subscription: {
      modelName: options.subscription?.modelName || "chiron_subscription",
      fields: {
        customerId: {
          type: "string",
          required: true,
          references: {
            model: "chiron_customers",
            field: "id",
          },
          fieldName: options.subscription?.fields?.customerId || "customerId",
        },
        status: {
          type: "string",
          required: true,
          fieldName: options.subscription?.fields?.status || "status",
        },
        provider: {
          type: "string",
          required: true,
          fieldName: options.subscription?.fields?.provider || "provider",
        },
        storeProductId: {
          type: "string",
          required: true,
          fieldName:
            options.subscription?.fields?.storeProductId || "storeProductId",
        },
        storeBasePlanId: {
          type: "string",
          required: true,
          fieldName:
            options.subscription?.fields?.storeBasePlanId || "storeBasePlanId",
        },
        storeTransactionId: {
          type: "string",
          required: true,
          fieldName:
            options.subscription?.fields?.storeTransactionId ||
            "storeTransactionId",
        },
        storeOriginalTransactionId: {
          type: "string",
          required: true,
          fieldName:
            options.subscription?.fields?.storeOriginalTransactionId ||
            "storeOriginalTransactionId",
        },
        startsAt: {
          type: "date",
          required: true,
          fieldName: options.subscription?.fields?.startsAt || "startsAt",
        },
        purchasedAt: {
          type: "date",
          required: true,
          fieldName: options.subscription?.fields?.purchasedAt || "purchasedAt",
        },
        originallyPurchasedAt: {
          type: "date",
          required: true,
          fieldName:
            options.subscription?.fields?.originallyPurchasedAt ||
            "originallyPurchasedAt",
        },
        expiresAt: {
          type: "date",
          required: true,
          fieldName: options.subscription?.fields?.expiresAt || "expiresAt",
        },
        renewalCancelledAt: {
          type: "date",
          required: false,
          fieldName:
            options.subscription?.fields?.renewalCancelledAt ||
            "renewalCancelledAt",
        },
        billingIssueDetectedAt: {
          type: "date",
          required: false,
          fieldName:
            options.subscription?.fields?.billingIssueDetectedAt ||
            "billingIssueDetectedAt",
        },
        isInGracePeriod: {
          type: "boolean",
          required: true,
          fieldName:
            options.subscription?.fields?.isInGracePeriod || "isInGracePeriod",
        },
        cancellationReason: {
          type: "string",
          required: false,
          fieldName:
            options.subscription?.fields?.cancellationReason ||
            "cancellationReason",
        },
        createdAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.subscription?.fields?.createdAt || "createdAt",
        },
        updatedAt: {
          type: "date",
          defaultValue: () => new Date(),
          required: true,
          fieldName: options.subscription?.fields?.updatedAt || "updatedAt",
        },
        ...subscription?.fields,
        ...options.subscription?.additionalFields,
      },
      order: 2,
    },

    // user: {
    // 	modelName: options.user?.modelName || "user",
    // 	fields: {
    // 		name: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.user?.fields?.name || "name",
    // 			sortable: true,
    // 		},
    // 		email: {
    // 			type: "string",
    // 			unique: true,
    // 			required: true,
    // 			fieldName: options.user?.fields?.email || "email",
    // 			sortable: true,
    // 		},
    // 		emailVerified: {
    // 			type: "boolean",
    // 			defaultValue: () => false,
    // 			required: true,
    // 			fieldName: options.user?.fields?.emailVerified || "emailVerified",
    // 		},
    // 		image: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.user?.fields?.image || "image",
    // 		},
    // 		createdAt: {
    // 			type: "date",
    // 			defaultValue: () => new Date(),
    // 			required: true,
    // 			fieldName: options.user?.fields?.createdAt || "createdAt",
    // 		},
    // 		updatedAt: {
    // 			type: "date",
    // 			defaultValue: () => new Date(),
    // 			required: true,
    // 			fieldName: options.user?.fields?.updatedAt || "updatedAt",
    // 		},
    // 		...user?.fields,
    // 		...options.user?.additionalFields,
    // 	},
    // 	order: 1,
    // },
    // session: {
    // 	modelName: options.session?.modelName || "session",
    // 	fields: {
    // 		expiresAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.session?.fields?.expiresAt || "expiresAt",
    // 		},
    // 		token: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.session?.fields?.token || "token",
    // 			unique: true,
    // 		},
    // 		createdAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.session?.fields?.createdAt || "createdAt",
    // 		},
    // 		updatedAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.session?.fields?.updatedAt || "updatedAt",
    // 		},
    // 		ipAddress: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.session?.fields?.ipAddress || "ipAddress",
    // 		},
    // 		userAgent: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.session?.fields?.userAgent || "userAgent",
    // 		},
    // 		userId: {
    // 			type: "string",
    // 			fieldName: options.session?.fields?.userId || "userId",
    // 			references: {
    // 				model: options.user?.modelName || "user",
    // 				field: "id",
    // 				onDelete: "cascade",
    // 			},
    // 			required: true,
    // 		},
    // 		...session?.fields,
    // 		...options.session?.additionalFields,
    // 	},
    // 	order: 2,
    // },
    // account: {
    // 	modelName: options.account?.modelName || "account",
    // 	fields: {
    // 		accountId: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.account?.fields?.accountId || "accountId",
    // 		},
    // 		providerId: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.account?.fields?.providerId || "providerId",
    // 		},
    // 		userId: {
    // 			type: "string",
    // 			references: {
    // 				model: options.user?.modelName || "user",
    // 				field: "id",
    // 				onDelete: "cascade",
    // 			},
    // 			required: true,
    // 			fieldName: options.account?.fields?.userId || "userId",
    // 		},
    // 		accessToken: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.account?.fields?.accessToken || "accessToken",
    // 		},
    // 		refreshToken: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.account?.fields?.refreshToken || "refreshToken",
    // 		},
    // 		idToken: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.account?.fields?.idToken || "idToken",
    // 		},
    // 		accessTokenExpiresAt: {
    // 			type: "date",
    // 			required: false,
    // 			fieldName:
    // 				options.account?.fields?.accessTokenExpiresAt ||
    // 				"accessTokenExpiresAt",
    // 		},
    // 		refreshTokenExpiresAt: {
    // 			type: "date",
    // 			required: false,
    // 			fieldName:
    // 				options.account?.fields?.accessTokenExpiresAt ||
    // 				"refreshTokenExpiresAt",
    // 		},
    // 		scope: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.account?.fields?.scope || "scope",
    // 		},
    // 		password: {
    // 			type: "string",
    // 			required: false,
    // 			fieldName: options.account?.fields?.password || "password",
    // 		},
    // 		createdAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.account?.fields?.createdAt || "createdAt",
    // 		},
    // 		updatedAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.account?.fields?.updatedAt || "updatedAt",
    // 		},
    // 		...account?.fields,
    // 	},
    // 	order: 3,
    // },
    // verification: {
    // 	modelName: options.verification?.modelName || "verification",
    // 	fields: {
    // 		identifier: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.verification?.fields?.identifier || "identifier",
    // 		},
    // 		value: {
    // 			type: "string",
    // 			required: true,
    // 			fieldName: options.verification?.fields?.value || "value",
    // 		},
    // 		expiresAt: {
    // 			type: "date",
    // 			required: true,
    // 			fieldName: options.verification?.fields?.expiresAt || "expiresAt",
    // 		},
    // 		createdAt: {
    // 			type: "date",
    // 			required: false,
    // 			defaultValue: () => new Date(),
    // 			fieldName: options.verification?.fields?.createdAt || "createdAt",
    // 		},
    // 		updatedAt: {
    // 			type: "date",
    // 			required: false,
    // 			defaultValue: () => new Date(),
    // 			fieldName: options.verification?.fields?.updatedAt || "updatedAt",
    // 		},
    // 	},
    // 	order: 4,
    // },
    ...pluginTables,
    ...(shouldAddRateLimitTable ? rateLimitTable : {}),
  } satisfies ChironDbSchema;
};
