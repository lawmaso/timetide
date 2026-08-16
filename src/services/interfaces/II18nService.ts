export interface II18nService {
    t(key: string): string
    getLocale(): string
    setLocale(locale: string): Promise<void>
    onLocaleChange(callback: (locale: string) => void): () => void  // returns an unsubscribe fn
}
