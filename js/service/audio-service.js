// ============================================
// JS/SERVICE/AUDIO-SERVICE.JS — управление звуком
// ============================================

/**
 * Сервис управления звуковым сопровождением.
 * Обрабатывает предзагрузку и воспроизведение звуков.
 * Ошибки игнорируются — игра работает без звука.
 */
var AudioService = (function () {
    /** @type {Map<string, HTMLAudioElement>} */
    var _sounds = new Map();

    /** @type {boolean} */
    var _isReady = false;

    return {
        /**
         * Предзагружает все звуки приложения.
         * Вызывается один раз при старте.
         */
        preload: function () {
            var soundNames = ['click', 'win', 'lose'];

            for (var i = 0; i < soundNames.length; i++) {
                (function (name) {
                    try {
                        var audio = new Audio('audio/' + name + '.mp3');
                        _sounds.set(name, audio);
                    } catch (e) {
                        console.warn('[AudioService] Ошибка загрузки звука: ' + name, e);
                    }
                })(soundNames[i]);
            }

            _isReady = true;
        },

        /**
         * Воспроизводит звук по имени.
         * @param {string} name — имя звука ('click', 'win', 'lose')
         */
        play: function (name) {
            if (!_isReady) {
                return;
            }

            var audio = _sounds.get(name);
            if (!audio) {
                return;
            }

            try {
                var clone = audio.cloneNode();
                clone.play().catch(function () {});
            } catch (e) {
                console.warn('[AudioService] Ошибка воспроизведения: ' + name, e);
            }
        }
    };
})();
