import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const serverUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  if (isPlatformServer(platformId) && req.url.startsWith('/')) {
    let newUrl = req.url;
    if (req.url.startsWith('/api/')) {
      // Route backend API calls directly to the backend container
      newUrl = `http://backend:8080${req.url}`;
    } else if (req.url.startsWith('/ai-api/')) {
      // Route AI API calls directly to the AI container, stripping the prefix
      newUrl = `http://ai:8001${req.url.replace('/ai-api/', '/')}`;
    } else {
      // Route any other relative URLs to the Nginx gateway
      newUrl = `http://gateway:80${req.url}`;
    }
    
    const serverReq = req.clone({ url: newUrl });
    return next(serverReq);
  }
  
  return next(req);
};
