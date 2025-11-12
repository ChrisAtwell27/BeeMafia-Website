/**
 * Emoji Converter Service
 * Uses OpenAI API to convert text messages to emoji representations
 * Used for Mute Bee roles that cannot speak normally
 */

const OpenAI = require('openai');

class EmojiConverter {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.enabled = !!this.apiKey && this.apiKey !== 'your-openai-api-key-here';

        if (this.enabled) {
            this.client = new OpenAI({
                apiKey: this.apiKey
            });
            console.log('✅ Emoji converter service enabled');
        } else {
            console.warn('⚠️ Emoji converter disabled. Set OPENAI_API_KEY in .env to enable Mute Bee emoji conversion.');
        }

        // Cache recent conversions to save API calls
        this.cache = new Map();
        this.cacheMaxSize = 100;
    }

    /**
     * Convert text message to emojis using OpenAI
     */
    async convertToEmojis(text) {
        if (!this.enabled) {
            // Fallback: simple emoji conversion without API
            return this.fallbackConversion(text);
        }

        // Check cache first
        const cacheKey = text.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a translator that converts text into emoji sequences. Your job is to represent the meaning of the user's message using ONLY emojis. Rules:
1. Use only emojis (no text, no spaces between emojis)
2. Try to capture the essence and emotion of the message
3. Keep it concise (max 15 emojis)
4. Use common, recognizable emojis
5. If the message is suspicious/accusatory, use detective/suspicious emojis
6. If defending, use shield/innocent emojis
7. For voting/decisions, use pointing/thinking emojis
Examples:
"I think John is the killer" → 🤔👉🧑🔪
"I'm innocent, trust me!" → 😇🙏✅
"Let's vote for Sarah" → 🗳️👉👩
"Good morning everyone" → 🌅👋😊
"I don't trust him" → 🤨❌👤`
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            });

            let emojiMessage = completion.choices[0]?.message?.content || this.fallbackConversion(text);

            // Remove any remaining non-emoji characters (spaces, punctuation)
            emojiMessage = emojiMessage.replace(/[^\p{Emoji}\p{Emoji_Component}]/gu, '');

            // If no emojis were generated, use fallback
            if (!emojiMessage || emojiMessage.length === 0) {
                emojiMessage = this.fallbackConversion(text);
            }

            // Cache the result
            this.addToCache(cacheKey, emojiMessage);

            return emojiMessage;
        } catch (error) {
            console.error('❌ OpenAI emoji conversion error:', error.message);
            return this.fallbackConversion(text);
        }
    }

    /**
     * Fallback conversion when API is unavailable
     * Simple keyword-based emoji mapping
     */
    fallbackConversion(text) {
        const lowerText = text.toLowerCase();

        // Common mafia game phrases mapped to emojis
        const emojiMap = [
            { keywords: ['sus', 'suspect', 'suspicious'], emoji: '🤨' },
            { keywords: ['innocent', 'not me', 'trust'], emoji: '😇' },
            { keywords: ['vote', 'voting'], emoji: '🗳️' },
            { keywords: ['kill', 'murder', 'attack'], emoji: '🔪' },
            { keywords: ['dead', 'died'], emoji: '💀' },
            { keywords: ['night', 'tonight'], emoji: '🌙' },
            { keywords: ['day'], emoji: '☀️' },
            { keywords: ['wasp', 'mafia', 'bad'], emoji: '🐝' },
            { keywords: ['bee', 'town', 'good'], emoji: '🐝' },
            { keywords: ['see', 'saw', 'watch'], emoji: '👀' },
            { keywords: ['think', 'thought'], emoji: '🤔' },
            { keywords: ['yes', 'agree'], emoji: '✅' },
            { keywords: ['no', 'disagree'], emoji: '❌' },
            { keywords: ['hello', 'hi', 'hey'], emoji: '👋' },
            { keywords: ['bye', 'goodbye'], emoji: '👋' },
            { keywords: ['help'], emoji: '🆘' },
            { keywords: ['question'], emoji: '❓' },
            { keywords: ['love'], emoji: '❤️' },
            { keywords: ['happy', 'good'], emoji: '😊' },
            { keywords: ['sad'], emoji: '😢' },
            { keywords: ['angry', 'mad'], emoji: '😠' },
            { keywords: ['laugh', 'lol', 'haha'], emoji: '😂' }
        ];

        let emojis = [];

        // Add emojis based on keywords found
        emojiMap.forEach(({ keywords, emoji }) => {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                emojis.push(emoji);
            }
        });

        // If no keywords matched, use generic emojis based on length
        if (emojis.length === 0) {
            if (text.includes('?')) {
                emojis.push('❓');
            } else if (text.includes('!')) {
                emojis.push('❗');
            } else {
                emojis.push('🐝', '💬');
            }
        }

        return emojis.join('');
    }

    /**
     * Add result to cache with size limit
     */
    addToCache(key, value) {
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    /**
     * Clear cache (useful for testing or memory management)
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
module.exports = new EmojiConverter();
