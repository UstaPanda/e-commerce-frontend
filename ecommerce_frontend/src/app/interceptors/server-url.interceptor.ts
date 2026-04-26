import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const serverUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  if (isPlatformServer(platformId) && req.url.startsWith('/')) {
    // Read the gateway URL from environment variables during SSR
    const processEnv = (globalThis as any).process?.env;
    const ssrBaseUrl = processEnv?.['SSR_GATEWAY_URL'] || 'http://gateway:80';
    
    // Route all relative API requests through the internal Nginx gateway
    const newUrl = `${ssrBaseUrl}${req.url}`;
    
    const serverReq = req.clone({ url: newUrl });
    return next(serverReq);
  }
  
  return next(req);
};
