export type HelperEntity = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'ready';
};

export const helperEntities: HelperEntity[] = [
  {
    id: 'users',
    title: 'Пользователи',
    description: 'Тестовые аккаунты, роли и быстрые действия для авторизации.',
    status: 'ready'
  },
  {
    id: 'tokens',
    title: 'Токены',
    description: 'Просмотр и подстановка access/refresh токенов.',
    status: 'draft'
  },
  {
    id: 'environments',
    title: 'Окружения',
    description: 'Переключение dev/stage/test стендов без ручной рутины.',
    status: 'draft'
  }
];
