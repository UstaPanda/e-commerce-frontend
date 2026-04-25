
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
      "chunk-TED25TS2.js",
      "chunk-7KGKKYQT.js",
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
    'index.csr.html': {size: 28661, hash: '6150225f4b27e9518e1a1912b91f1cd44173dc70309dafac5ad391c3161e2152', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17626, hash: '7e05655e2f005950a92dd96dd66423a63faa795b7e04ceb58a67c6882dfd3382', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-HYDGL7JE.css': {size: 83889, hash: 'lQvVvX6SZyw', text: () => import('./assets-chunks/styles-HYDGL7JE_css.mjs').then(m => m.default)}
  },
};
