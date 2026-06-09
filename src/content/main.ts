import { createApp } from 'vue';
import ContentApp from './ContentApp.vue';
import sharedStyles from '../shared/styles/app.css?inline';

const rootId = 'ga-auth-helper-root';

if (!document.getElementById(rootId)) {
  const host = document.createElement('div');
  host.id = rootId;
  host.style.position = 'fixed';
  host.style.right = '20px';
  host.style.bottom = '20px';
  host.style.zIndex = '2147483647';

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = sharedStyles;

  const appRoot = document.createElement('div');

  shadowRoot.append(style, appRoot);
  document.documentElement.append(host);

  createApp(ContentApp).mount(appRoot);
}
