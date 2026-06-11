export type ToggleModalMessage = {
  action: "toggleModal";
  tabId?: number;
};

export type ContentRelayResponse = {
  ok: boolean;
  error?: string;
};
