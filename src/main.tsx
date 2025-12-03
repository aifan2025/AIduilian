import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App";
import "./index.css";

// 确保代码运行在浏览器环境中
if (typeof window !== 'undefined') {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          theme="auto"
          duration={3000}
          closeButton
          richColors
        />
      </BrowserRouter>
    </React.StrictMode>
  );
}
