type UnauthorizedSessionHandler = () => void | Promise<void>;

let unauthorizedSessionHandler: UnauthorizedSessionHandler | null = null;

export function setUnauthorizedSessionHandler(handler: UnauthorizedSessionHandler | null): void {
  unauthorizedSessionHandler = handler;
}

export function notifyUnauthorizedSession(): void {
  if (!unauthorizedSessionHandler) {
    return;
  }

  void Promise.resolve(unauthorizedSessionHandler()).catch(() => {
    // Ignoruj błędy czyszczenia sesji - i tak rzucamy ApiError do warstwy UI.
  });
}
