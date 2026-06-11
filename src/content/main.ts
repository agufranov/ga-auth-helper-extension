import { createApp, type ComponentPublicInstance } from "vue";
import ContentModal from "./ContentModal.vue";
import { observeCodeForm } from "./auth-flow";
import { createAuthHotkeyListener } from "../shared/domain/auth-hotkey-listener";
import extensionStyles from "../shared/styles/extension.css?inline";

observeCodeForm();

type ContentModalInstance = ComponentPublicInstance<{
  requestClose: () => void;
}>;

let modalApp: ReturnType<typeof createApp> | null = null;
let modalHost: HTMLElement | null = null;
let modalVm: ContentModalInstance | null = null;

function destroyModal() {
  modalApp?.unmount();
  modalHost?.remove();
  modalApp = null;
  modalHost = null;
  modalVm = null;
}

function closeModal() {
  if (modalVm) {
    modalVm.requestClose();
    return;
  }
  destroyModal();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "toggleModal") {
    if (modalApp) {
      closeModal();
    } else {
      openModal();
    }
    sendResponse({ ok: true });
  }

  return false;
});

function openModal() {
  if (modalApp) return;

  modalHost = document.createElement("div");
  modalHost.id = "ga-auth-helper-root";
  modalHost.style.all = "initial";

  const shadowRoot = modalHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = extensionStyles;

  const container = document.createElement("div");
  container.className = "ga-auth-ext";

  shadowRoot.append(style, container);
  document.documentElement.appendChild(modalHost);

  modalApp = createApp(ContentModal, {
    onClose: destroyModal,
  });

  modalVm = modalApp.mount(container) as ContentModalInstance;
}

const onAuthHotkey = createAuthHotkeyListener(() => {
  if (modalApp) {
    closeModal();
  } else {
    openModal();
  }
});

document.addEventListener("keydown", onAuthHotkey);
