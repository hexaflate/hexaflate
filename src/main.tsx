import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { domainConfig } from './config/domainConfig'

if (domainConfig.webTitle) {
  document.title = domainConfig.webTitle;
}

if (domainConfig.webFavicon) {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = domainConfig.webFavicon;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = domainConfig.webFavicon;
    document.head.appendChild(newLink);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
