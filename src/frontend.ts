// ============================================================================
// ST-NPC-Book — Lumiverse Spindle Extension (Complete Single-File Port)
// ============================================================================

const MODULE_NAME = 'st_npc_book';
const STORAGE_SETTINGS_KEY = 'st_npc_book_settings_v1';
const STORAGE_LOREBOOKS_KEY = 'st_npc_book_lorebooks_v1';
const STORAGE_CHAT_TRACKERS_KEY = 'st_npc_book_chat_trackers_v1';

// ============================================================================
// 1. Default Settings & Factory Prompts
// ============================================================================

interface NpcBookSettings {
    extension_active: boolean;
    lorebook_missing: boolean;
    extension_notification: boolean;
    lorebook_name: string;

    trigger_message_interval: number;
    trigger_message_offset: number;

    entry_title_template: string;
    entry_mode: 'normal' | 'constant' | 'vectorized';
    entry_position: number;
    entry_inchat_role: number;
    entry_inchat_depth: number;
    entry_order: number;
    entry_scan_depth: number;
    entry_sticky: number;
    entry_ignore_budget: boolean;

    agent_scanner_profile: string;
    agent_scanner_max_token: number;
    agent_scanner_temperature: number;

    agent_scribe_profile: string;
    agent_scribe_max_token: number;
    agent_scribe_temperature: number;
    max_concurrent_scribes: number;

    prompt_scanning: string;
    prompt_creation: string;
    prompt_updating: string;
    prompt_output_template: string;
}

const DEFAULT_SETTINGS: NpcBookSettings = {
    extension_active: true,
    lorebook_missing: true,
    extension_notification: true,
    lorebook_name: '~{{char}}_{{date}}',

    trigger_message_interval: 30,
    trigger_message_offset: 10,

    entry_title_template: '[NPC] {{name}}',
    entry_mode: 'normal',
    entry_position: 1,
    entry_inchat_role: 0,
    entry_inchat_depth: 10,
    entry_order: 100,
    entry_scan_depth: 10,
    entry_sticky: 0,
    entry_ignore_budget: false,

    agent_scanner_profile: '',
    agent_scanner_max_token: 2000,
    agent_scanner_temperature: 0.1,

    agent_scribe_profile: '',
    agent_scribe_max_token: 5000,
    agent_scribe_temperature: 0.3,
    max_concurrent_scribes: 3,

    prompt_scanning: `You are an entity scanner for a roleplay campaign. Analyze the provided chat transcript slice and compare it against the list of Already Tracked NPCs.

Rules:
1. Add an existing NPC's UID to "update" ONLY if they actively appeared or had a meaningful change in state, relationship, location, appearance, or plot in this slice.
2. Add a character to "create" ONLY if they are a newly introduced, named, recurring NPC. Ignore {{user}}, the Narrator, and unnamed background extras.
3. Check existing aliases carefully so you never create a duplicate entry for an already tracked NPC.

Return ONLY valid JSON matching this schema:
{
  "update": [
    { "uid": 123, "name": "Canonical Name", "new_keys": ["optional new alias"] }
  ],
  "create": [
    { "name": "Canonical Name", "keys": ["First Name", "Full Name", "Alias/Title"] }
  ]
}`,

    prompt_creation: `Create a structured Lorebook character profile for the newly introduced NPC "{{name}}" based strictly on the provided chat transcript slice.

Rules:
1. Use the exact XML and field structure defined in the Output Template below.
2. Only record facts explicitly established or directly implied in the transcript. If a field is unknown, write "Unknown" or "None revealed".
3. Adhere strictly to {{name}}'s isolated perspective and current knowledge boundaries.
4. Keep all entries factual, concise, and free of narrative fluff.
5. Output ONLY the \`<character>\` XML block.`,

    prompt_updating: `Update the existing Lorebook character profile for the NPC "{{name}}" using the new events from the provided chat transcript slice.

CORE PRINCIPLE: You are maintaining a high-density CURRENT STATE SHEET, NOT a chronological story log or diary. Every update must actively compress, distil, and deduplicate the profile.

Critical Compaction Rules:
1. REWRITE, NEVER APPEND: Never tack new sentences onto the end of existing paragraphs using "She now...", "Recently...", or "She has begun to...". Completely rewrite updated fields so they read as a cohesive, present-tense snapshot.
2. COLLAPSE & MERGE SIMILAR ITEMS: Group specific instances into overarching traits instead of listing every occurrence (e.g., merge individual meals/drinks into general food preferences; merge repeated habits or similar conversations into a single distilled point).
3. PURGE RESOLVED & SUPERSEDED STATES: Delete completed goals, resolved misunderstandings, outgrown fears, obsolete steps of an already-completed arc, and minor scene-by-scene interactions. Once trust is established or a lesson is learned, keep only the final outcome and delete the stepping stones.
4. NO SCENE PLAY-BY-PLAY: Do not record who said what at the dinner table, minor daily routines (baths, brushing teeth, individual meals), or temporary dialogue exchanges as Secrets, Relationships, or Milestones.
5. ZERO CROSS-FIELD REDUNDANCY: Each fact, metaphor, or event belongs in ONLY ONE field. Do not repeat the same event or character quirk across Personality, Speech, Secrets, Relationships, and Milestones.

Field-Specific Guidelines:
- Role / Occupation: Core role in one short phrase.
- Appearance: Physical body attributes only. Concise and telegraphic.
- Current State: Immediate Location, current Attire, and current Physical/Emotional Condition (strictly present state, no recap of the scene that just happened).
- Personality: Distilled core traits, mindset, and worldview. Strip out repetitive examples and narrative recaps.
- Likes / Dislikes / Fears: Grouped by category rather than exhaustive item-by-item lists.
- Behavioral Habits: Only defining, recurring physical tics and default non-verbal reactions. Merge similar actions.
- Speech Patterns: Concise description of tone, cadence, and recurring verbal frameworks, plus 2 short direct quotes that best capture their current voice.
- Known Skills: High-level summary of actual competencies (omit basic daily life functions like brushing teeth or using a toilet).
- Current Goals & Dreams: Active, overarching objectives only. Delete immediately once achieved or abandoned.
- Secrets & Plot Knowledge: ONLY major hidden truths, hard-won world lore, or critical leverage. Delete trivia, overheard table talk, and resolved misunderstandings.
- Sexual Experience & Kinks: Strictly 2-4 crisp sentences. State experience level, current boundaries/attitude, and core preferences/limits. Omit clinical anatomy lessons, childhood trivia, or scene recaps.
- Relationship to {{user}} & Others: Describe the CURRENT dynamic, emotional baseline, and trust level. Collapse past arguments or bonding scenes into a single brief clause instead of retelling every interaction.
- Milestones: ONLY permanent, life-altering turning points that fundamentally redefined the character. Merge related developments into single arc-level milestones and purge minor firsts (meals, baths, toys, routine conversations).

Maintain the exact structure defined in the Output Template. Output ONLY the updated \`<character>\` XML block.`,

    prompt_output_template: `<character name="{{name}}">
Role / Occupation: 
Age: 
Background: 
Appearance: 
Current State:
- Location: 
- Attire: 
- Condition: 
Personality: 
Likes / Dislikes / Fears: 
Behavioral Habits:
- 
Speech Patterns:
- Style: 
- Quote 1: ""
- Quote 2: ""
Known Skills: 
Current Goals:
- 
Dreams:
- 
Secrets & Plot Knowledge:
- 
Sexual Experience & Kinks: 
Relationship to {{user}}: 
Relationship to Others:
- 
Milestones:
- 
</character>`
};

// ============================================================================
// 2. Data Types & Runtime State
// ============================================================================

interface LorebookEntry {
    uid: number;
    comment: string;
    key: string[];
    content: string;
    disable: boolean;
    constant: boolean;
    vectorized: boolean;
    position: number;
    depth: number;
    role: number;
    order: number;
    scanDepth: number;
    sticky: number;
    ignoreBudget: boolean;
}

interface LorebookData {
    name: string;
    entries: Record<string, LorebookEntry>;
}

interface SliceSnapshot {
    previous_cursor: number;
    new_cursor: number;
    lorebook: string;
    created_uids: number[];
    updated_entries: Array<{
        uid: number;
        comment: string;
        key: string[];
        content: string;
    }>;
}

interface ChatTracker {
    bound_lorebook: string;
    last_scanned_index: number;
    ignore_missing_lorebook: boolean;
    last_slice_snapshot: SliceSnapshot | null;
    sticky_counters: Record<string, number>;
}

let settings: NpcBookSettings = structuredClone(DEFAULT_SETTINGS);
let lorebooksStore: Record<string, LorebookData> = {};
let chatTrackersStore: Record<string, ChatTracker> = {};
let spindleCtx: any = null;

const runtimeState = {
    isScanRunning: false,
    isCatchUpRunning: false,
    stopCatchUpRequested: false,
    activeModalRefreshFn: null as (() => Promise<void>) | null,
};

// ============================================================================
// 3. Storage & Lumiverse Context Bridge
// ============================================================================

async function kvGet<T>(key: string, fallback: T): Promise<T> {
    try {
        if (spindleCtx?.storage?.get) {
            const val = await spindleCtx.storage.get(key);
            if (val !== undefined && val !== null) {
                return typeof val === 'string' ? JSON.parse(val) : (val as T);
            }
        }
    } catch (err) {
        console.warn(`[${MODULE_NAME}] ctx.storage.get fallback:`, err);
    }
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T;
    } catch {
        // ignore
    }
    return fallback;
}

async function kvSet(key: string, value: unknown): Promise<void> {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota errors
    }
    try {
        if (spindleCtx?.storage?.set) {
            await spindleCtx.storage.set(key, value);
        }
    } catch (err) {
        console.warn(`[${MODULE_NAME}] ctx.storage.set warning:`, err);
    }
}

async function loadAllPersistentData(): Promise<void> {
    const savedSettings = await kvGet<Partial<NpcBookSettings>>(STORAGE_SETTINGS_KEY, {});
    settings = { ...structuredClone(DEFAULT_SETTINGS), ...savedSettings };
    lorebooksStore = await kvGet<Record<string, LorebookData>>(STORAGE_LOREBOOKS_KEY, {});
    chatTrackersStore = await kvGet<Record<string, ChatTracker>>(STORAGE_CHAT_TRACKERS_KEY, {});
}

async function saveSettings(): Promise<void> {
    await kvSet(STORAGE_SETTINGS_KEY, settings);
}

async function saveLorebooks(): Promise<void> {
    await kvSet(STORAGE_LOREBOOKS_KEY, lorebooksStore);
}

async function saveChatTrackers(): Promise<void> {
    await kvSet(STORAGE_CHAT_TRACKERS_KEY, chatTrackersStore);
}

function getActiveChatId(): string {
    const c = spindleCtx?.chat;
    if (!c) return 'default_chat';
    if (typeof c.getActiveChatId === 'function') return String(c.getActiveChatId() || 'default_chat');
    if (c.activeChatId) return String(c.activeChatId);
    if (c.chatId) return String(c.chatId);
    if (c.id) return String(c.id);
    const charName = getCharacterName();
    return `chat_${charName}`;
}

function getCharacterName(): string {
    const c = spindleCtx?.chat;
    const ch = spindleCtx?.character || c?.character;
    if (typeof ch === 'string' && ch.trim()) return ch.trim();
    if (ch?.name) return String(ch.name).trim();
    if (c?.characterName) return String(c.characterName).trim();
    return 'Character';
}

function getUserName(): string {
    const u = spindleCtx?.user || spindleCtx?.persona || spindleCtx?.chat?.user;
    if (typeof u === 'string' && u.trim()) return u.trim();
    if (u?.name) return String(u.name).trim();
    return 'User';
}

interface NormalizedMessage {
    index: number;
    name: string;
    isUser: boolean;
    isSystem: boolean;
    text: string;
}

function getChatMessages(): NormalizedMessage[] {
    const c = spindleCtx?.chat;
    let rawMsgs: any[] = [];
    if (Array.isArray(c)) rawMsgs = c;
    else if (Array.isArray(c?.messages)) rawMsgs = c.messages;
    else if (typeof c?.getMessages === 'function') rawMsgs = c.getMessages() || [];

    const userName = getUserName();
    const charName = getCharacterName();

    return rawMsgs.map((m, idx) => {
        const role = String(m?.role || '').toLowerCase();
        const isSystem = Boolean(m?.is_system || m?.isSystem || role === 'system');
        const isUser = Boolean(m?.is_user || m?.isUser || role === 'user');
        const text = String(m?.mes ?? m?.content ?? m?.text ?? '').trim();
        const name = String(m?.name || m?.sender || (isUser ? userName : charName));
        return { index: idx, name, isUser, isSystem, text };
    });
}

function substituteParams(text: string): string {
    const user = getUserName();
    const char = getCharacterName();
    return String(text ?? '')
        .replace(/\{\{user\}\}/gi, user)
        .replace(/\{\{char\}\}/gi, char);
}

function getChatTracker(): ChatTracker {
    const chatId = getActiveChatId();
    if (!chatTrackersStore[chatId]) {
        chatTrackersStore[chatId] = {
            bound_lorebook: '',
            last_scanned_index: 0,
            ignore_missing_lorebook: false,
            last_slice_snapshot: null,
            sticky_counters: {},
        };
    }
    if (!chatTrackersStore[chatId].sticky_counters) {
        chatTrackersStore[chatId].sticky_counters = {};
    }
    return chatTrackersStore[chatId];
}

// ============================================================================
// 4. Toast Notifications & UI Refresh Helpers
// ============================================================================

function showToast(level: 'info' | 'success' | 'warning' | 'error', message: string): void {
    if (level !== 'error' && !settings.extension_notification) return;

    if (spindleCtx?.ui?.toast) {
        try {
            spindleCtx.ui.toast(message, { type: level, title: 'NPC-Book' });
            return;
        } catch {
            // fallback to custom toast
        }
    }

    let container = document.getElementById('npc_book_toast_container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'npc_book_toast_container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `npc-book-toast npc-book-toast-${level}`;
    toast.innerHTML = `<strong>NPC-Book</strong><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('npc-book-toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 4200);
}

function escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function triggerModalRefresh(): void {
    if (typeof runtimeState.activeModalRefreshFn === 'function') {
        runtimeState.activeModalRefreshFn().catch(err => {
            console.warn(`[${MODULE_NAME}] Modal refresh error:`, err);
        });
    }
}

// ============================================================================
// 5. Lorebook Storage & Native Bridge
// ============================================================================

function getAllLorebookNames(): string[] {
    const names = new Set<string>(Object.keys(lorebooksStore));
    const nativeLb = spindleCtx?.lorebook || spindleCtx?.worldInfo;
    if (nativeLb && typeof nativeLb.list === 'function') {
        try {
            const list = nativeLb.list();
            if (Array.isArray(list)) {
                for (const item of list) {
                    const n = typeof item === 'string' ? item : item?.name;
                    if (n) names.add(String(n));
                }
            }
        } catch {
            // ignore
        }
    }
    return Array.from(names);
}

async function loadLorebookData(lorebookName: string): Promise<LorebookData> {
    if (!lorebookName) return { name: '', entries: {} };

    // Sync from native Lumiverse lorebook API if available
    const nativeLb = spindleCtx?.lorebook || spindleCtx?.worldInfo;
    if (nativeLb && typeof nativeLb.get === 'function') {
        try {
            const nativeData = await nativeLb.get(lorebookName);
            if (nativeData && typeof nativeData.entries === 'object') {
                lorebooksStore[lorebookName] = {
                    name: lorebookName,
                    entries: nativeData.entries,
                };
                return lorebooksStore[lorebookName];
            }
        } catch {
            // fallback to local store
        }
    }

    if (!lorebooksStore[lorebookName]) {
        lorebooksStore[lorebookName] = { name: lorebookName, entries: {} };
    }
    return lorebooksStore[lorebookName];
}

async function saveLorebookData(lorebookName: string, data: LorebookData): Promise<void> {
    lorebooksStore[lorebookName] = data;
    await saveLorebooks();

    const nativeLb = spindleCtx?.lorebook || spindleCtx?.worldInfo;
    if (nativeLb && typeof nativeLb.save === 'function') {
        try {
            await nativeLb.save(lorebookName, data);
        } catch (err) {
            console.warn(`[${MODULE_NAME}] Native lorebook save fallback:`, err);
        }
    }
}

function formatNewLorebookName(): string {
    const safeChar = getCharacterName().replace(/[^a-zA-Z0-9_-]/g, '_');
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const template = settings.lorebook_name || '~{{char}}_{{date}}';
    return template
        .replace(/\{\{char\}\}/gi, safeChar)
        .replace(/\{\{date\}\}/gi, dateStr);
}

async function createAndBindChatLorebook(): Promise<string | null> {
    const messages = getChatMessages();
    if (messages.length === 0) {
        showToast('error', 'No active loaded chat to bind a Lorebook to.');
        return null;
    }

    let targetName = formatNewLorebookName();
    const existingNames = getAllLorebookNames();
    if (existingNames.includes(targetName)) {
        let suffix = 2;
        while (existingNames.includes(`${targetName}_${suffix}`)) {
            suffix++;
        }
        targetName = `${targetName}_${suffix}`;
    }

    await saveLorebookData(targetName, { name: targetName, entries: {} });

    const tracker = getChatTracker();
    tracker.bound_lorebook = targetName;
    await saveChatTrackers();

    showToast('success', `Created & bound Chat Lorebook: ${targetName}`);
    return targetName;
}

// ============================================================================
// 6. NPC Entry Matching, Key Sanitization & Upsert Logic
// ============================================================================

function getEntryTitleAffixes(): { prefix: string; suffix: string } {
    const tpl = String(settings.entry_title_template || '[NPC] {{name}}');
    const parts = tpl.split(/\{\{name\}\}/i);
    return {
        prefix: parts[0] ?? '[NPC] ',
        suffix: parts[1] ?? '',
    };
}

function formatEntryTitle(canonicalName: string): string {
    const tpl = String(settings.entry_title_template || '[NPC] {{name}}');
    if (/\{\{name\}\}/i.test(tpl)) {
        return tpl.replace(/\{\{name\}\}/gi, canonicalName.trim());
    }
    return `${tpl.trim()} ${canonicalName.trim()}`;
}

function extractNpcN
