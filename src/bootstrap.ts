// ============================================
// SRC/BOOTSTRAP.TS — инициализация слоёв до первого рендера (1.8.0)
// ============================================
// Замена прежней IIFE-инициализации. Классические слои уже выполнились
// как <script>-теги в index.html; здесь только их связывание, без DOM и React.

/** Инициализирует звук, статистику, сессию и глобальные обработчики ошибок. */
export function bootstrap(): void {
    AudioService.preload();

    const repo = new LocalStorageRepository(CONFIG.STORAGE_PREFIX + 'stats');
    StatsService.init(repo);

    SessionService.init(new SessionRepository());

    ErrorHandler.init();
}
