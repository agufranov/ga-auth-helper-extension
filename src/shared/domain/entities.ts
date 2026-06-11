export type TestAccount = {
  phone: string;
  comment: string;
  /** Если true — код не вводится автоматически, нужен ручной ввод */
  skipCode?: boolean;
};
