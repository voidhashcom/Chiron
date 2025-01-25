import { defineConfig } from "tsup";

export default defineConfig((env) => {
	return {
		entry: {
			index: "./src/index.ts",
			social: "./src/social-providers/index.ts",
			types: "./src/types/index.ts",
			client: "./src/client/index.ts",
			crypto: "./src/crypto/index.ts",
			cookies: "./src/cookies/index.ts",
			"adapters/prisma": "./src/adapters/prisma-adapter/index.ts",
			"adapters/drizzle": "./src/adapters/drizzle-adapter/index.ts",
			"adapters/mongodb": "./src/adapters/mongodb-adapter/index.ts",
			"adapters/kysely": "./src/adapters/kysely-adapter/index.ts",
			"adapters/memory": "./src/adapters/memory-adapter/index.ts",
			"adapters/test": "./src/adapters/test.ts",
			db: "./src/db/index.ts",
			oauth2: "./src/oauth2/index.ts",
			react: "./src/client/react/index.ts",
			vue: "./src/client/vue/index.ts",
			svelte: "./src/client/svelte/index.ts",
			solid: "./src/client/solid/index.ts",
			plugins: "./src/plugins/index.ts",
			"plugins/access": "./src/plugins/organization/access/index.ts",
			api: "./src/api/index.ts",
			"client/plugins": "./src/client/plugins/index.ts",
			"svelte-kit": "./src/integrations/svelte-kit.ts",
			"solid-start": "./src/integrations/solid-start.ts",
			"next-js": "./src/integrations/next-js.ts",
			node: "./src/integrations/node.ts",
			"plugins/admin": "./src/plugins/admin/index.ts",
			"plugins/anonymous": "./src/plugins/anonymous/index.ts",
			"plugins/bearer": "./src/plugins/bearer/index.ts",
			"plugin/custom-session": "./src/plugins/custom-session/index.ts",
			"plugins/email-otp": "./src/plugins/email-otp/index.ts",
			"plugins/generic-oauth": "./src/plugins/generic-oauth/index.ts",
			"plugins/jwt": "./src/plugins/jwt/index.ts",
			"plugins/magic-link": "./src/plugins/magic-link/index.ts",
			"plugins/multi-session": "./src/plugins/multi-session/index.ts",
			"plugins/one-tap": "./src/plugins/one-tap/index.ts",
			"plugins/open-api": "./src/plugins/open-api/index.ts",
			"plugins/organization": "./src/plugins/organization/index.ts",
			"plugins/oidc-provider": "./src/plugins/oidc-provider/index.ts",
			"plugins/passkey": "./src/plugins/passkey/index.ts",
			"plugins/phone-number": "./src/plugins/phone-number/index.ts",
			"plugins/sso": "./src/plugins/sso/index.ts",
			"plugins/two-factor": "./src/plugins/two-factor/index.ts",
			"plugins/username": "./src/plugins/username/index.ts",
		},
		format: ["esm", "cjs"],
		splitting: true,
		cjsInterop: true,
		skipNodeModulesBundle: true,
		treeshake: true,
	};
});
