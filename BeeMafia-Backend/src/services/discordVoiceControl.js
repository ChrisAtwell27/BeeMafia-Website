/**
 * Discord Voice Control Service
 * Integrates with BobbyTheBot Webhook API to control Discord voice chat during Mafia games
 */

const fetch = require('node-fetch');

class DiscordVoiceControl {
    constructor() {
        this.apiUrl = process.env.DISCORD_API_URL || 'https://bobby-the-bot-i76i6.ondigitalocean.app';
        this.webhookSecret = process.env.MAFIA_WEBHOOK_SECRET;
        this.guildId = process.env.DISCORD_GUILD_ID;
        this.channelId = process.env.DISCORD_VOICE_CHANNEL_ID || '1434633691455426600';
        this.enabled = !!(this.webhookSecret && this.guildId);

        if (!this.enabled) {
            console.warn('⚠️ Discord voice control is disabled. Set MAFIA_WEBHOOK_SECRET and DISCORD_GUILD_ID in .env to enable.');
        } else {
            console.log(`✅ Discord voice control is enabled for channel ${this.channelId}`);
        }
    }

    /**
     * Make authenticated request to webhook API
     */
    async makeRequest(endpoint, method = 'POST', body = null) {
        if (!this.enabled) {
            console.log('🔇 Voice control disabled, skipping:', endpoint);
            return { success: false, error: 'Voice control disabled' };
        }

        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.webhookSecret}`
                }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ Discord API error (${response.status}):`, data);
                return { success: false, error: data.error || 'API request failed' };
            }

            return data;
        } catch (error) {
            console.error('❌ Discord voice control error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mute entire voice channel (e.g., night phase)
     */
    async muteChannel(reason = 'Night phase') {
        console.log(`🔇 Muting voice channel ${this.channelId}: ${reason}`);
        return await this.makeRequest('/api/voice/channel/mute', 'POST', {
            guildId: this.guildId,
            channelId: this.channelId,
            reason
        });
    }

    /**
     * Unmute entire voice channel (e.g., day phase)
     */
    async unmuteChannel(reason = 'Day phase') {
        console.log(`🔊 Unmuting voice channel ${this.channelId}: ${reason}`);
        return await this.makeRequest('/api/voice/channel/unmute', 'POST', {
            guildId: this.guildId,
            channelId: this.channelId,
            reason
        });
    }

    /**
     * Mute specific player
     */
    async mutePlayer(userId, reason = 'Game effect') {
        if (!userId) return { success: false, error: 'No userId provided' };

        console.log(`🤐 Muting player ${userId}: ${reason}`);
        return await this.makeRequest('/api/voice/mute', 'POST', {
            userId,
            guildId: this.guildId,
            reason
        });
    }

    /**
     * Unmute specific player
     */
    async unmutePlayer(userId, reason = 'Effect ended') {
        if (!userId) return { success: false, error: 'No userId provided' };

        console.log(`🔊 Unmuting player ${userId}: ${reason}`);
        return await this.makeRequest('/api/voice/unmute', 'POST', {
            userId,
            guildId: this.guildId,
            reason
        });
    }

    /**
     * Bulk mute/unmute operations
     * @param {Array} operations - Array of {userId, mute: boolean, reason: string}
     */
    async bulkUpdate(operations) {
        if (!operations || operations.length === 0) {
            return { success: true, message: 'No operations to perform' };
        }

        console.log(`🔄 Bulk voice update: ${operations.length} operations`);
        return await this.makeRequest('/api/voice/bulk', 'POST', {
            guildId: this.guildId,
            operations
        });
    }

    /**
     * Get current game state from Discord bot
     */
    async getGameState() {
        return await this.makeRequest(`/api/game/${this.guildId}`, 'GET');
    }

    /**
     * Get voice channel members
     */
    async getVoiceMembers() {
        return await this.makeRequest(`/api/voice/members/${this.guildId}`, 'GET');
    }

    /**
     * Sync game state with Discord voice chat
     * Handles phase transitions and applies all necessary mutes/unmutes
     */
    async syncGameState(game) {
        if (!this.enabled || !game) return;

        const operations = [];

        // Get all players in the game
        game.players.forEach(player => {
            const shouldBeMuted = this.shouldPlayerBeMuted(game, player);

            operations.push({
                userId: player.discordId || player.id,
                mute: shouldBeMuted,
                reason: this.getMuteReason(game, player)
            });
        });

        if (operations.length > 0) {
            return await this.bulkUpdate(operations);
        }
    }

    /**
     * Determine if a player should be muted based on game state
     */
    shouldPlayerBeMuted(game, player) {
        // Check if player has Mute Bee role - they are ALWAYS muted
        if (player.role) {
            // Import ROLES at runtime to avoid circular dependency
            const { ROLES } = require('../../../shared/roles');
            const roleInfo = ROLES[player.role];
            if (roleInfo && roleInfo.isMuteBee) {
                return true; // Mute Bees are permanently muted
            }
        }

        // Dead players are always muted
        if (!player.isAlive) {
            return true;
        }

        // During night/dusk phases, everyone is muted
        if (game.phase === 'night' || game.phase === 'dusk') {
            return true;
        }

        // During day/voting phases, check for blackmail
        if (game.phase === 'day' || game.phase === 'voting') {
            if (game.blackmailedPlayers && game.blackmailedPlayers.has(player.id)) {
                return true;
            }
            return false; // Everyone else can talk
        }

        // During setup/finished, unmute everyone
        return false;
    }

    /**
     * Get human-readable reason for muting
     */
    getMuteReason(game, player) {
        // Check if player has Mute Bee role
        if (player.role) {
            const { ROLES } = require('../../../shared/roles');
            const roleInfo = ROLES[player.role];
            if (roleInfo && roleInfo.isMuteBee) {
                return `Mute ${roleInfo.name} - permanently muted`;
            }
        }

        if (!player.isAlive) {
            return 'Player is dead';
        }

        if (game.phase === 'night') {
            return 'Night phase - discussion locked';
        }

        if (game.phase === 'dusk') {
            return 'Dusk phase - discussion locked';
        }

        if (game.blackmailedPlayers && game.blackmailedPlayers.has(player.id)) {
            return 'Blackmailed - cannot speak';
        }

        return 'Day phase - discussion open';
    }

    /**
     * Handle phase-specific voice control
     */
    async handlePhaseChange(game) {
        console.log(`🎮 Phase changed to: ${game.phase}`);

        switch (game.phase) {
            case 'dusk':
                // Mute everyone during dusk
                await this.muteChannel('Dusk phase - special night actions');
                break;

            case 'night':
                // Mute everyone during night
                await this.muteChannel('Night phase - discussion locked');
                break;

            case 'day':
                // Unmute everyone except blackmailed players
                await this.syncGameState(game);
                break;

            case 'voting':
                // Keep current state (blackmailed still muted)
                await this.syncGameState(game);
                break;

            case 'finished':
                // Unmute everyone at game end
                await this.unmuteChannel('Game finished');
                break;
        }
    }

    /**
     * Handle player death
     */
    async handlePlayerDeath(player) {
        if (!player.discordId && !player.id) return;

        await this.mutePlayer(
            player.discordId || player.id,
            'Player has died'
        );
    }

    /**
     * Handle blackmail effect
     */
    async handleBlackmail(playerId) {
        await this.mutePlayer(playerId, 'Blackmailed - cannot speak');
    }

    /**
     * Handle removal of blackmail
     */
    async handleUnblackmail(playerId) {
        await this.unmutePlayer(playerId, 'Blackmail effect ended');
    }
}

// Export singleton instance
module.exports = new DiscordVoiceControl();