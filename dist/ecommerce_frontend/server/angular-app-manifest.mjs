
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
      "chunk-KUEDKOV7.js",
      "chunk-B53JHKWC.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-3PPNE5PZ.js",
      "chunk-B53JHKWC.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/register"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NYJ4BFBC.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/verify"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-OBHG5EQS.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/forgot-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-PBGN6DGI.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/reset-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-7S3M7NBU.js"
    ],
    "route": "/auth/oauth2/callback"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/analytics"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/orders"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app/products"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/products/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/ai-assistant"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/cart"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/profile"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/stores/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/my-store"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/shipments"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/users"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/stores"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/categories"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/audit-logs"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-NO6P3G3O.js",
      "chunk-VFEG2OUK.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNDDBUND.js",
      "chunk-L5PURTTO.js"
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
    'index.csr.html': {size: 28661, hash: 'b50339758f5b22cf1ffc1d013bcaa2fe54b32f263b4e241d5ce052ac5791c644', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17626, hash: '6507c05bc627842b051fab66142e49bcde2ef5124ff022ee221d5df0c18da987', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-B3UTYC66.css': {size: 83859, hash: 'wWgmos/5HT0', text: () => import('./assets-chunks/styles-B3UTYC66_css.mjs').then(m => m.default)}
  },
};
