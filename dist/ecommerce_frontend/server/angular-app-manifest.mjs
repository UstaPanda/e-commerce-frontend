
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 1,
    "redirectTo": "/app/dashboard",
    "route": "/"
  },
  {
    "renderMode": 1,
    "redirectTo": "/auth/login",
    "route": "/auth"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-3KYLRIRG.js",
      "chunk-CZ2WFSIW.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/auth/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-P5XHUVST.js",
      "chunk-CZ2WFSIW.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/auth/register"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-JTNKU5KB.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/auth/verify"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-KUEJJEKJ.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/auth/forgot-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-R6GWWP6J.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/auth/reset-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-BB5LQQI7.js"
    ],
    "route": "/auth/oauth2/callback"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/analytics"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/orders"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app/products"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/products/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/ai-assistant"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/cart"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/profile"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/stores/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/my-store"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/shipments"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/users"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/stores"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/categories"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/audit-logs"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-UQZHJ4LN.js",
      "chunk-GEADY4MC.js",
      "chunk-MICSQ7AC.js",
      "chunk-6WHFJM6Z.js",
      "chunk-FJVRPGZ4.js",
      "chunk-JOEFHFUC.js",
      "chunk-NSQL3GN2.js"
    ],
    "route": "/app/admin/settings"
  },
  {
    "renderMode": 1,
    "redirectTo": "/app/dashboard",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 28665, hash: '4c058153190577a9681776c7aedd8b715f6b57f29a782f11482a79075fe3b91b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17630, hash: '1af5300a20497e9fbc528a13cc88b32e752f3666c78563acc56b7299ba12d094', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-NNIEJOHK.css': {size: 83941, hash: 'EuWjnxuucZ4', text: () => import('./assets-chunks/styles-NNIEJOHK_css.mjs').then(m => m.default)}
  },
};
