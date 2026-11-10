// ============================================
// TEST/SUPPORT/SESSION-CHANNEL.TS — управляемая заглушка BroadcastChannel (1.10.0)
// ============================================
// Канал ничего не рассылает сам: сьют «шлёт» сообщение другой вкладки вручную.

import { act } from '@testing-library/react';
import { vi } from 'vitest';

/** Канал, созданный хуком: через него сьют видит отправленные сообщения. */
export interface TestChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
}

export const channels: TestChannel[] = [];

/** Заглушка канала: складывает экземпляры в channels и считает вызовы. */
export class ControlledChannel {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    close = vi.fn();
    constructor(public name: string) {
        channels.push(this as unknown as TestChannel);
    }
}

/** Очищает список каналов перед тестом. */
export function resetChannels(): void {
    channels.length = 0;
}

/** Доставляет сообщение «другой вкладки» в канал с указанным индексом. */
export function sendFromOtherTab(index: number, data: unknown): void {
    act(() => channels[index].onmessage?.(new MessageEvent('message', { data })));
}
