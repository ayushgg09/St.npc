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

function extractNpcNameFromTitle(comment: string): string | null {
    if (typeof comment !== 'string' || !comment.trim()) return null;
    const { prefix, suffix } = getEntryTitleAffixes();

    if (prefix && !comment.startsWith(prefix)) return null;
    if (suffix && !comment.endsWith(suffix)) return null;

    const startIdx = prefix.length;
    const endIdx = suffix ? comment.length - suffix.length : comment.length;
    const extracted = comment.slice(startIdx, endIdx).trim();
    return extracted || null;
}

interface TrackedNpcEntry {
    uid: number;
    name: string;
    comment: string;
    keys: string[];
    content: string;
}

async function getExistingNpcEntries(lorebookName: string): Promise<TrackedNpcEntry[]> {
    if (!lorebookName) return [];
    const worldData = await loadLorebookData(lorebookName);
    if (!worldData || typeof worldData.entries !== 'object') return [];

    const npcEntries: TrackedNpcEntry[] = [];
    for (const rawEntry of Object.values(worldData.entries)) {
        if (!rawEntry) continue;
        const canonicalName = extractNpcNameFromTitle(rawEntry.comment);
        if (!canonicalName) continue;

        npcEntries.push({
            uid: Number(rawEntry.uid),
            name: canonicalName,
            comment: String(rawEntry.comment ?? ''),
            keys: Array.isArray(rawEntry.key) ? [...rawEntry.key] : [],
            content: String(rawEntry.content ?? ''),
        });
    }
    return npcEntries;
}

function sanitizeAndMergeKeys(canonicalName: string, existingKeys: string[] = [], newKeys: string[] = []): string[] {
    const cleanName = String(canonicalName || '').trim();
    const userName = getUserName().toLowerCase();

    const combined = [
        ...(Array.isArray(existingKeys) ? existingKeys : []),
        ...(Array.isArray(newKeys) ? newKeys : []),
    ];

    if (cleanName) {
        combined.unshift(cleanName);
    }

    const seenLower = new Set<string>();
    const result: string[] = [];

    for (const rawKey of combined) {
        const trimmed = String(rawKey ?? '').trim();
        if (trimmed.length < 2) continue;

        const lower = trimmed.toLowerCase();
        if (lower === '{{user}}' || (userName && lower === userName)) continue;
        if (seenLower.has(lower)) continue;

        seenLower.add(lower);
        result.push(trimmed);
    }

    if (result.length === 0 && cleanName) {
        result.push(cleanName);
    }

    return result;
}

function applyEntryFields(entry: LorebookEntry, canonicalName: string, mergedKeys: string[], markdownContent: string): void {
    entry.comment = formatEntryTitle(canonicalName);
    entry.key = mergedKeys;
    entry.content = markdownContent;
    entry.disable = false;

    const mode = settings.entry_mode || 'normal';
    entry.constant = mode === 'constant';
    entry.vectorized = mode === 'vectorized';

    entry.position = Number(settings.entry_position ?? 1);
    entry.depth = Number(settings.entry_inchat_depth ?? 10);
    entry.role = Number(settings.entry_inchat_role ?? 0);

    entry.order = Number(settings.entry_order ?? 100);
    entry.scanDepth = Number(settings.entry_scan_depth ?? 10);
    entry.sticky = Number(settings.entry_sticky ?? 0);
    entry.ignoreBudget = Boolean(settings.entry_ignore_budget);
}

function findRawNpcEntry(worldData: LorebookData, uid?: number | null, canonicalName?: string | null): LorebookEntry | null {
    if (!worldData || typeof worldData.entries !== 'object') return null;

    if (uid !== undefined && uid !== null) {
        const direct = worldData.entries[String(uid)] ||
            Object.values(worldData.entries).find(e => Number(e?.uid) === Number(uid));
        if (direct) return direct;
    }

    if (canonicalName) {
        const lowerTarget = String(canonicalName).trim().toLowerCase();
        return Object.values(worldData.entries).find(e => {
            const extracted = extractNpcNameFromTitle(e?.comment);
            return extracted && extracted.toLowerCase() === lowerTarget;
        }) || null;
    }

    return null;
}

function getNextUid(worldData: LorebookData): number {
    let maxUid = 0;
    for (const entry of Object.values(worldData.entries)) {
        const u = Number(entry?.uid) || 0;
        if (u > maxUid) maxUid = u;
    }
    return maxUid + 1;
}

function deleteRawEntryByUid(worldData: LorebookData, targetUid: number): boolean {
    if (!worldData || typeof worldData.entries !== 'object') return false;
    let deleted = false;
    for (const [dictKey, entry] of Object.entries(worldData.entries)) {
        if (Number(entry?.uid) === Number(targetUid) || Number(dictKey) === Number(targetUid)) {
            delete worldData.entries[dictKey];
            deleted = true;
        }
    }
    return deleted;
}

async function batchUpsertNpcEntries(
    lorebookName: string,
    npcPayloads: Array<{ uid?: number; name: string; keys?: string[]; new_keys?: string[]; content: string }>
) {
    if (!lorebookName || !Array.isArray(npcPayloads) || npcPayloads.length === 0) return [];

    const worldData = await loadLorebookData(lorebookName);
    const results: Array<{
        uid: number;
        name: string;
        keys: string[];
        isNew: boolean;
        previousSnapshot: { uid: number; comment: string; key: string[]; content: string } | null;
    }> = [];

    for (const npcPayload of npcPayloads) {
        if (!npcPayload?.name) continue;
        const canonicalName = String(npcPayload.name).trim();
        let targetEntry = findRawNpcEntry(worldData, npcPayload.uid, canonicalName);
        let isNew = false;

        const previousSnapshot = targetEntry
            ? {
                uid: Number(targetEntry.uid),
                comment: String(targetEntry.comment ?? ''),
                key: Array.isArray(targetEntry.key) ? [...targetEntry.key] : [],
                content: String(targetEntry.content ?? ''),
            }
            : null;

        if (!targetEntry) {
            const newUid = getNextUid(worldData);
            targetEntry = {
                uid: newUid,
                comment: '',
                key: [],
                content: '',
                disable: false,
                constant: false,
                vectorized: false,
                position: 1,
                depth: 10,
                role: 0,
                order: 100,
                scanDepth: 10,
                sticky: 0,
                ignoreBudget: false,
            };
            worldData.entries[String(newUid)] = targetEntry;
            isNew = true;
        }

        const existingKeys = Array.isArray(targetEntry.key) ? targetEntry.key : [];
        const incomingKeys = isNew
            ? (npcPayload.keys || npcPayload.new_keys || [])
            : (npcPayload.new_keys || npcPayload.keys || []);

        const mergedKeys = sanitizeAndMergeKeys(canonicalName, existingKeys, incomingKeys);
        applyEntryFields(targetEntry, canonicalName, mergedKeys, String(npcPayload.content ?? '').trim());

        results.push({
            uid: Number(targetEntry.uid),
            name: canonicalName,
            keys: mergedKeys,
            isNew,
            previousSnapshot,
        });
    }

    await saveLorebookData(lorebookName, worldData);
    return results;
}

// ============================================================================
// 7. LLM Connection Manager (Scanner & Scribe Generation)
// ============================================================================

function getAvailableProfiles(): Array<{ id: string; name: string }> {
    const sources = [
        spindleCtx?.profiles,
        spindleCtx?.connections,
        spindleCtx?.settings?.connectionProfiles,
    ];
    for (const src of sources) {
        if (Array.isArray(src)) {
            return src.map((p: any) => ({
                id: String(p.id || p.name),
                name: String(p.name || p.id),
            }));
        }
        if (src && typeof src.list === 'function') {
            try {
                const list = src.list();
                if (Array.isArray(list)) {
                    return list.map((p: any) => ({
                        id: String(p.id || p.name),
                        name: String(p.name || p.id),
                    }));
                }
            } catch {
                // ignore
            }
        }
    }
    return [];
}

async function sendAgentRequest(params: {
    profileId: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
}): Promise<string> {
    const resolvedSystem = substituteParams(params.systemPrompt);
    const resolvedUser = substituteParams(params.userPrompt);
    const messages = [
        { role: 'system', content: resolvedSystem },
        { role: 'user', content: resolvedUser },
    ];

    const gen = spindleCtx?.generation || spindleCtx?.llm || spindleCtx?.ai;
    if (!gen) {
        throw new Error('Lumiverse generation API is unavailable in this extension context.');
    }

    const opts: Record<string, any> = {
        messages,
        prompt: resolvedUser,
        systemPrompt: resolvedSystem,
        system: resolvedSystem,
        maxTokens: Number(params.maxTokens) || 2000,
        max_tokens: Number(params.maxTokens) || 2000,
        temperature: Number(params.temperature ?? 0.2),
        stream: false,
        quiet: true,
    };

    if (params.profileId) {
        opts.profileId = params.profileId;
        opts.profile = params.profileId;
    }

    let response: any;
    if (typeof gen.generate === 'function') {
        response = await gen.generate(opts);
    } else if (typeof gen.complete === 'function') {
        response = await gen.complete(opts);
    } else if (typeof gen.chat === 'function') {
        response = await gen.chat(messages, opts);
    } else if (typeof gen.sendRequest === 'function') {
        response = await gen.sendRequest(opts);
    } else {
        throw new Error('No compatible generation method found on ctx.generation.');
    }

    if (typeof response === 'string') return response.trim();
    if (typeof response?.text === 'string') return response.text.trim();
    if (typeof response?.content === 'string') return response.content.trim();
    if (typeof response?.choices?.[0]?.message?.content === 'string') {
        return response.choices[0].message.content.trim();
    }
    return String(response ?? '').trim();
}

// ============================================================================
// 8. Stage 1 (Scanner) & Stage 2 (Parallel Scribe Workers)
// ============================================================================

function buildTranscriptSlice(startIdx: number, endIdx: number): string {
    const messages = getChatMessages();
    if (messages.length === 0) return '';

    const clampedStart = Math.max(0, startIdx);
    const clampedEnd = Math.min(messages.length, endIdx);

    const lines: string[] = [];
    for (let i = clampedStart; i < clampedEnd; i++) {
        const msg = messages[i];
        if (!msg || msg.isSystem || !msg.text) continue;
        lines.push(`[#${msg.index}] ${msg.name}:\n${msg.text}`);
    }

    return lines.join('\n\n---\n\n');
}

function parseScannerJson(rawText: string): {
    update: Array<{ uid?: number; name: string; new_keys?: string[] }>;
    create: Array<{ name: string; keys?: string[] }>;
} {
    let cleaned = String(rawText ?? '').trim();
    if (!cleaned) {
        throw new Error('Scanner LLM returned an empty response.');
    }

    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
    } else {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.slice(firstBrace, lastBrace + 1);
        }
    }

    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch (err: any) {
        throw new Error(`Scanner LLM returned invalid JSON: ${err.message}`);
    }

    if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.update) && !Array.isArray(parsed.create))) {
        throw new Error('Scanner JSON is missing required "update" / "create" arrays.');
    }

    return {
        update: Array.isArray(parsed.update) ? parsed.update : [],
        create: Array.isArray(parsed.create) ? parsed.create : [],
    };
}

async function runScannerStage(transcript: string, existingNpcs: TrackedNpcEntry[]) {
    const trackedRosterJson = JSON.stringify(
        existingNpcs.map(e => ({ uid: e.uid, name: e.name, keys: e.keys })),
        null,
        2
    );

    const userPrompt = [
        `### Already Tracked NPCs (JSON):`,
        trackedRosterJson,
        ``,
        `### Chat Transcript Slice:`,
        transcript,
    ].join('\n');

    const rawResponse = await sendAgentRequest({
        profileId: settings.agent_scanner_profile,
        systemPrompt: settings.prompt_scanning,
        userPrompt,
        maxTokens: Number(settings.agent_scanner_max_token) || 2000,
        temperature: Number(settings.agent_scanner_temperature ?? 0.1),
    });

    return parseScannerJson(rawResponse);
}

async function runSingleScribeWorker(
    mode: 'create' | 'update',
    task: { name: string; existingContent?: string },
    transcript: string
): Promise<string> {
    const npcName = String(task.name).trim();
    const replaceName = (str: string) => String(str ?? '').replace(/\{\{name\}\}/gi, npcName);

    const instructionPrompt = mode === 'create'
        ? replaceName(settings.prompt_creation)
        : replaceName(settings.prompt_updating);

    const outputTemplate = replaceName(settings.prompt_output_template);

    const userParts = [
        `### Target NPC: ${npcName}`,
        ``,
        `### Required Output Markdown Template:`,
        outputTemplate,
    ];

    if (mode === 'update' && task.existingContent) {
        userParts.push(
            ``,
            `### Current Existing Profile for "${npcName}":`,
            task.existingContent
        );
    }

    userParts.push(
        ``,
        `### New Chat Transcript Slice:`,
        transcript
    );

    const rawMarkdown = await sendAgentRequest({
        profileId: settings.agent_scribe_profile,
        systemPrompt: instructionPrompt,
        userPrompt: userParts.join('\n'),
        maxTokens: Number(settings.agent_scribe_max_token) || 5000,
        temperature: Number(settings.agent_scribe_temperature ?? 0.3),
    });

    const fenceMatch = rawMarkdown.match(/```(?:markdown|md|xml)?\s*([\s\S]*?)```/i);
    const cleanedMarkdown = (fenceMatch ? fenceMatch[1] : rawMarkdown).trim();

    if (!cleanedMarkdown || cleanedMarkdown.length < 20) {
        throw new Error(`Scribe LLM returned an empty or truncated profile for "${npcName}".`);
    }

    return cleanedMarkdown;
}

async function runWithConcurrency<T>(taskFns: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
    const maxWorkers = Math.max(1, Number(concurrency) || 3);
    const results = new Array<T>(taskFns.length);
    let nextIdx = 0;

    async function worker() {
        while (nextIdx < taskFns.length) {
            const current = nextIdx++;
            results[current] = await taskFns[current]();
        }
    }

    const workers = Array.from({ length: Math.min(maxWorkers, taskFns.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

// ============================================================================
// 9. Scan Scheduler, Executor, Catch-Up & Rollback Controls
// ============================================================================

function getScheduleStatus() {
    const totalMessages = getChatMessages().length;
    const tracker = getChatTracker();
    const lastScanned = Number(tracker.last_scanned_index) || 0;
    const interval = Math.max(1, Number(settings.trigger_message_interval) || 30);
    const offset = Math.max(0, Number(settings.trigger_message_offset) || 10);
    const nextTriggerAt = lastScanned + interval + offset;
    const isDue = totalMessages >= nextTriggerAt;

    const eligibleCeiling = Math.max(0, totalMessages - offset);
    const eligibleUnscanned = Math.max(0, eligibleCeiling - lastScanned);
    const catchUpSlicesCount = Math.floor(eligibleUnscanned / interval);

    const sliceStart = lastScanned;
    const sliceEnd = lastScanned + interval;

    return {
        totalMessages,
        lastScanned,
        interval,
        offset,
        nextTriggerAt,
        sliceStart,
        sliceEnd,
        isDue,
        eligibleCeiling,
        catchUpSlicesCount,
        snapshot: tracker.last_slice_snapshot || null,
        summary: `Chat Messages: ${totalMessages} | Last Scanned: ${lastScanned} | Next Auto-Scan at: msg #${nextTriggerAt} (Slice ${sliceStart}..${sliceEnd})`,
    };
}

let isMissingPopupOpen = false;

async function ensureChatLorebook(forcePopup = false): Promise<string | null> {
    const messages = getChatMessages();
    if (messages.length === 0) return null;

    const tracker = getChatTracker();
    if (tracker.bound_lorebook) return tracker.bound_lorebook;

    if (!forcePopup && (!settings.lorebook_missing || tracker.ignore_missing_lorebook)) {
        return null;
    }

    if (isMissingPopupOpen) return null;
    isMissingPopupOpen = true;

    return new Promise<string | null>((resolve) => {
        const previewName = formatNewLorebookName();
        const existingNames = getAllLorebookNames();

        const overlay = document.createElement('div');
        overlay.className = 'npc-book-overlay';
        overlay.innerHTML = `
            <div class="npc-book-dialog npc-book-missing-popup">
                <h3><span>No Chat Lorebook Bound</span></h3>
                <p>This chat does not have an active Chat Lorebook bound for storing NPC profiles. How would you like to proceed?</p>

                <div class="npc-book-missing-option">
                    <strong>Option 1: Create &amp; Bind a New Lorebook</strong>
                    <small>Creates <code>${escapeHtml(previewName)}</code> and binds it to this chat.</small>
                    <button type="button" id="npc_book_popup_create" class="npc-book-btn npc-book-btn-primary npc-book-full-btn">
                        + Create &amp; Bind New Lorebook
                    </button>
                </div>

                <div class="npc-book-missing-option">
                    <strong>Option 2: Bind an Existing Lorebook</strong>
                    <select id="npc_book_popup_select" class="npc-book-input">
                        <option value="">-- Select Existing Lorebook --</option>
                        ${existingNames.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')}
                    </select>
                    <button type="button" id="npc_book_popup_bind" class="npc-book-btn npc-book-full-btn">
                        Bind Selected Lorebook
                    </button>
                </div>

                <div class="npc-book-missing-option">
                    <strong>Option 3: Ignore for This Chat</strong>
                    <small>Suppresses automatic Lorebook prompts for the remainder of this chat.</small>
                    <button type="button" id="npc_book_popup_ignore" class="npc-book-btn npc-book-full-btn">
                        Ignore for This Chat
                    </button>
                </div>

                <div style="display:flex; justify-content:flex-end; margin-top:4px;">
                    <button type="button" id="npc_book_popup_cancel" class="npc-book-btn">Cancel</button>
                </div>
            </div>
        `;

        const cleanup = (val: string | null) => {
            isMissingPopupOpen = false;
            overlay.remove();
            resolve(val);
        };

        overlay.querySelector('#npc_book_popup_create')?.addEventListener('click', async () => {
            const created = await createAndBindChatLorebook();
            cleanup(created);
        });

        overlay.querySelector('#npc_book_popup_bind')?.addEventListener('click', async () => {
            const sel = overlay.querySelector('#npc_book_popup_select') as HTMLSelectElement | null;
            const selected = sel?.value;
            if (!selected) {
                showToast('warning', 'Please select a Lorebook from the dropdown first.');
                return;
            }
            tracker.bound_lorebook = selected;
            await saveChatTrackers();
            showToast('success', `Bound Chat Lorebook: ${selected}`);
            cleanup(selected);
        });

        overlay.querySelector('#npc_book_popup_ignore')?.addEventListener('click', async () => {
            tracker.ignore_missing_lorebook = true;
            await saveChatTrackers();
            showToast('info', 'NPC-Book will ignore missing Lorebook checks for this chat.');
            cleanup(null);
        });

        overlay.querySelector('#npc_book_popup_cancel')?.addEventListener('click', () => cleanup(null));

        document.body.appendChild(overlay);
    });
}

async function executeNpcScanSlice(options: { customStart?: number; customEnd?: number; manual?: boolean } = {}): Promise<boolean> {
    const { customStart, customEnd, manual = false } = options;

    if (runtimeState.isScanRunning) {
        showToast('warning', 'An NPC-Book scan is already in progress.');
        return false;
    }

    const lorebook = await ensureChatLorebook(manual);
    if (!lorebook) return false;

    const status = getScheduleStatus();
    const totalMessages = status.totalMessages;
    const startIdx = customStart !== undefined ? customStart : status.lastScanned;
    const endIdx = customEnd !== undefined
        ? customEnd
        : (manual ? Math.min(totalMessages, startIdx + status.interval) : status.sliceEnd);

    if (endIdx <= startIdx || startIdx >= totalMessages) {
        if (manual) {
            showToast('info', `No unscanned messages in range (${startIdx}..${endIdx}).`);
        }
        return false;
    }

    const transcript = buildTranscriptSlice(startIdx, endIdx);
    if (!transcript) {
        showToast('warning', `Transcript slice ${startIdx}..${endIdx} is empty.`);
        return false;
    }

    runtimeState.isScanRunning = true;
    triggerModalRefresh();

    try {
        showToast('info', `Stage 1: Scanning messages #${startIdx}..#${endIdx} for NPCs...`);

        const existingNpcs = await getExistingNpcEntries(lorebook);
        const scanResult = await runScannerStage(transcript, existingNpcs);

        const byUid = new Map(existingNpcs.map(e => [Number(e.uid), e]));
        const byName = new Map(existingNpcs.map(e => [e.name.toLowerCase(), e]));

        const scribeQueue: Array<{
            mode: 'create' | 'update';
            uid?: number;
            name: string;
            keys?: string[];
            new_keys?: string[];
            existingContent: string;
        }> = [];

        for (const upd of scanResult.update) {
            if (!upd?.name && upd?.uid === undefined) continue;
            const matched = (upd.uid !== undefined ? byUid.get(Number(upd.uid)) : null) ||
                (upd.name ? byName.get(String(upd.name).trim().toLowerCase()) : null);

            const canonicalName = matched ? matched.name : String(upd.name).trim();
            if (!canonicalName) continue;

            if (scribeQueue.some(q => q.name.toLowerCase() === canonicalName.toLowerCase())) continue;

            scribeQueue.push({
                mode: matched ? 'update' : 'create',
                uid: matched?.uid,
                name: canonicalName,
                new_keys: Array.isArray(upd.new_keys) ? upd.new_keys : [],
                existingContent: matched?.content || '',
            });
        }

        for (const crt of scanResult.create) {
            const rawName = String(crt?.name ?? '').trim();
            if (!rawName) continue;
            if (scribeQueue.some(q => q.name.toLowerCase() === rawName.toLowerCase())) continue;

            const matched = byName.get(rawName.toLowerCase());
            scribeQueue.push({
                mode: matched ? 'update' : 'create',
                uid: matched?.uid,
                name: matched ? matched.name : rawName,
                keys: Array.isArray(crt.keys) ? crt.keys : [],
                existingContent: matched?.content || '',
            });
        }

        const tracker = getChatTracker();
        const previousCursor = Number(tracker.last_scanned_index) || 0;
        const nextCursor = Math.max(previousCursor, endIdx);

        const createdUids: number[] = [];
        const updatedEntriesSnapshot: SliceSnapshot['updated_entries'] = [];

        if (scribeQueue.length === 0) {
            showToast('info', `No new or updated NPCs detected in messages #${startIdx}..#${endIdx}.`);
        } else {
            showToast('info', `Stage 2: Running Scribe for ${scribeQueue.length} NPC(s) (max ${settings.max_concurrent_scribes} parallel)...`);

            const workerFns = scribeQueue.map(task => async () => {
                const markdown = await runSingleScribeWorker(task.mode, task, transcript);
                return {
                    uid: task.uid,
                    name: task.name,
                    keys: task.keys,
                    new_keys: task.new_keys,
                    content: markdown,
                };
            });

            const generatedPayloads = await runWithConcurrency(workerFns, settings.max_concurrent_scribes);
            const upsertedResults = await batchUpsertNpcEntries(lorebook, generatedPayloads);

            for (const res of upsertedResults) {
                if (res.isNew) {
                    createdUids.push(Number(res.uid));
                } else if (res.previousSnapshot) {
                    updatedEntriesSnapshot.push(res.previousSnapshot);
                }
            }

            showToast('success', `Slice #${startIdx}..#${endIdx} complete: ${createdUids.length} created, ${updatedEntriesSnapshot.length} updated in "${lorebook}".`);
        }

        tracker.last_slice_snapshot = {
            previous_cursor: previousCursor,
            new_cursor: nextCursor,
            lorebook,
            created_uids: createdUids,
            updated_entries: updatedEntriesSnapshot,
        };
        tracker.last_scanned_index = nextCursor;
        await saveChatTrackers();
        return true;
    } catch (err: any) {
        console.error(`[${MODULE_NAME}] Pipeline aborted on slice #${startIdx}..#${endIdx}:`, err);
        showToast('error', `Slice #${startIdx}..#${endIdx} aborted (cursor unchanged): ${err.message || String(err)}`);
        return false;
    } finally {
        runtimeState.isScanRunning = false;
        triggerModalRefresh();
    }
}

async function runCatchUpLoop(): Promise<void> {
    if (runtimeState.isCatchUpRunning) {
        runtimeState.stopCatchUpRequested = true;
        showToast('info', 'Stopping catch-up after the current slice finishes...');
        triggerModalRefresh();
        return;
    }

    if (runtimeState.isScanRunning) {
        showToast('warning', 'An NPC-Book scan is already in progress.');
        return;
    }

    const lorebook = await ensureChatLorebook(true);
    if (!lorebook) return;

    const initialStatus = getScheduleStatus();
    if (initialStatus.catchUpSlicesCount <= 0) {
        showToast('info', `No full slices due for catch-up (Cursor: #${initialStatus.lastScanned}, Eligible ceiling: #${initialStatus.eligibleCeiling}).`);
        return;
    }

    runtimeState.isCatchUpRunning = true;
    runtimeState.stopCatchUpRequested = false;
    triggerModalRefresh();

    let completedSlices = 0;
    const totalToRun = initialStatus.catchUpSlicesCount;

    try {
        while (!runtimeState.stopCatchUpRequested) {
            const currentStatus = getScheduleStatus();
            if (!currentStatus.isDue) break;

            const sliceNum = completedSlices + 1;
            showToast('info', `Catch-Up (${sliceNum}/${totalToRun}): Scanning slice #${currentStatus.sliceStart}..#${currentStatus.sliceEnd}...`);

            const ok = await executeNpcScanSlice({
                customStart: currentStatus.sliceStart,
                customEnd: currentStatus.sliceEnd,
                manual: false,
            });

            if (!ok) {
                showToast('error', `Catch-up halted at slice #${currentStatus.sliceStart}..#${currentStatus.sliceEnd} due to error.`);
                break;
            }

            completedSlices++;
            triggerModalRefresh();
        }

        if (runtimeState.stopCatchUpRequested) {
            showToast('info', `Catch-up stopped by user after ${completedSlices} slice(s).`);
        } else if (completedSlices > 0) {
            showToast('success', `Catch-up finished! Processed ${completedSlices} slice(s).`);
        }
    } finally {
        runtimeState.isCatchUpRunning = false;
        runtimeState.stopCatchUpRequested = false;
        triggerModalRefresh();
    }
}

async function undoLastSlice() {
    if (runtimeState.isScanRunning || runtimeState.isCatchUpRunning) {
        showToast('warning', 'Cannot undo while a scan or catch-up is running.');
        return null;
    }

    const tracker = getChatTracker();
    const snap = tracker.last_slice_snapshot;
    if (!snap) {
        showToast('info', 'No slice snapshot available to undo.');
        return null;
    }

    const activeLorebook = tracker.bound_lorebook;
    const targetLorebook = snap.lorebook || activeLorebook;
    if (!targetLorebook) {
        showToast('error', 'No Lorebook associated with the snapshot.');
        return null;
    }

    if (activeLorebook && snap.lorebook && activeLorebook !== snap.lorebook) {
        showToast('error', `Snapshot belongs to Lorebook "${snap.lorebook}", but "${activeLorebook}" is currently bound.`);
        return null;
    }

    runtimeState.isScanRunning = true;
    triggerModalRefresh();
    try {
        const worldData = await loadLorebookData(targetLorebook);
        const createdUids = Array.isArray(snap.created_uids) ? snap.created_uids : [];
        let deletedCount = 0;
        for (const uid of createdUids) {
            if (deleteRawEntryByUid(worldData, uid)) deletedCount++;
        }

        const updatedEntries = Array.isArray(snap.updated_entries) ? snap.updated_entries : [];
        let restoredCount = 0;
        for (const prev of updatedEntries) {
            let entry = findRawNpcEntry(worldData, prev.uid, null);
            if (!entry) {
                entry = {
                    uid: prev.uid,
                    comment: '',
                    key: [],
                    content: '',
                    disable: false,
                    constant: false,
                    vectorized: false,
                    position: Number(settings.entry_position ?? 1),
                    depth: Number(settings.entry_inchat_depth ?? 10),
                    role: Number(settings.entry_inchat_role ?? 0),
                    order: Number(settings.entry_order ?? 100),
                    scanDepth: Number(settings.entry_scan_depth ?? 10),
                    sticky: Number(settings.entry_sticky ?? 0),
                    ignoreBudget: Boolean(settings.entry_ignore_budget),
                };
                worldData.entries[String(prev.uid)] = entry;
            }
            entry.comment = String(prev.comment ?? '');
            entry.key = Array.isArray(prev.key) ? [...prev.key] : [];
            entry.content = String(prev.content ?? '');
            restoredCount++;
        }

        if (createdUids.length > 0 || updatedEntries.length > 0) {
            await saveLorebookData(targetLorebook, worldData);
        }

        const prevCursor = Math.max(0, Number(snap.previous_cursor) || 0);
        const newCursor = Math.max(prevCursor, Number(snap.new_cursor) || prevCursor);

        tracker.last_scanned_index = prevCursor;
        tracker.last_slice_snapshot = null;
        await saveChatTrackers();

        showToast('success', `Rolled back slice #${prevCursor}..#${newCursor} (${deletedCount} created removed, ${restoredCount} restored).`);
        return { previous_cursor: prevCursor, new_cursor: newCursor, lorebook: targetLorebook };
    } catch (err: any) {
        showToast('error', `Undo failed: ${err.message || String(err)}`);
        return null;
    } finally {
        runtimeState.isScanRunning = false;
        triggerModalRefresh();
    }
}

async function rerollLastSlice(): Promise<void> {
    if (runtimeState.isScanRunning || runtimeState.isCatchUpRunning) {
        showToast('warning', 'An NPC-Book scan is already in progress.');
        return;
    }
    const rolledBack = await undoLastSlice();
    if (!rolledBack) return;

    await executeNpcScanSlice({
        customStart: rolledBack.previous_cursor,
        customEnd: rolledBack.new_cursor,
        manual: true,
    });
}

async function wipeNpcsAndReset(): Promise<boolean> {
    if (runtimeState.isScanRunning || runtimeState.isCatchUpRunning) {
        showToast('warning', 'Cannot wipe while a scan or catch-up is running.');
        return false;
    }

    const tracker = getChatTracker();
    const activeLorebook = tracker.bound_lorebook;
    const confirmMsg = activeLorebook
        ? `Delete all managed [NPC] entries from "${activeLorebook}" and reset the scan cursor to 0?\n\n(Non-NPC entries in "${activeLorebook}" will not be touched.)`
        : `Reset the scan cursor to 0 and clear the last slice snapshot for this chat?`;

    if (!window.confirm(confirmMsg)) return false;

    runtimeState.isScanRunning = true;
    triggerModalRefresh();
    try {
        let removedCount = 0;
        if (activeLorebook) {
            const worldData = await loadLorebookData(activeLorebook);
            for (const [dictKey, entry] of Object.entries(worldData.entries)) {
                if (entry && extractNpcNameFromTitle(entry.comment)) {
                    delete worldData.entries[dictKey];
                    removedCount++;
                }
            }
            if (removedCount > 0) {
                await saveLorebookData(activeLorebook, worldData);
            }
        }

        tracker.last_scanned_index = 0;
        tracker.last_slice_snapshot = null;
        tracker.sticky_counters = {};
        await saveChatTrackers();

        if (activeLorebook) {
            showToast('success', `Wiped ${removedCount} [NPC] entries from "${activeLorebook}" and reset cursor to 0.`);
        } else {
            showToast('success', 'Reset scan cursor to 0.');
        }
        return true;
    } catch (err: any) {
        showToast('error', `Wipe failed: ${err.message || String(err)}`);
        return false;
    } finally {
        runtimeState.isScanRunning = false;
        triggerModalRefresh();
    }
}

// ============================================================================
// 10. Prompt Interceptor (Keyword-Triggered & Constant NPC Context Injection)
// ============================================================================

async function evaluateActiveNpcEntriesForPrompt(): Promise<LorebookEntry[]> {
    const tracker = getChatTracker();
    if (!tracker.bound_lorebook) return [];

    const worldData = await loadLorebookData(tracker.bound_lorebook);
    const allEntries = Object.values(worldData.entries || {}).filter(e => e && !e.disable && e.content?.trim());
    if (allEntries.length === 0) return [];

    const messages = getChatMessages();
    const triggered: LorebookEntry[] = [];

    for (const entry of allEntries) {
        const uidKey = String(entry.uid);
        if (entry.constant) {
            triggered.push(entry);
            continue;
        }

        const scanDepth = Math.max(1, Number(entry.scanDepth ?? settings.entry_scan_depth ?? 10));
        const recentSlice = messages.slice(-scanDepth);
        const corpus = recentSlice.map(m => m.text).join('\n').toLowerCase();

        const keys = Array.isArray(entry.key) ? entry.key : [];
        const matched = keys.some(k => {
            const kw = String(k || '').trim().toLowerCase();
            return kw.length >= 2 && corpus.includes(kw);
        });

        if (matched) {
            if (Number(entry.sticky) > 0) {
                tracker.sticky_counters[uidKey] = Number(entry.sticky);
            }
            triggered.push(entry);
        } else if ((tracker.sticky_counters[uidKey] || 0) > 0) {
            tracker.sticky_counters[uidKey] = Math.max(0, tracker.sticky_counters[uidKey] - 1);
            triggered.push(entry);
        }
    }

    triggered.sort((a, b) => Number(a.order ?? 100) - Number(b.order ?? 100));
    return triggered;
}

function registerPromptInterceptor(): void {
    const interceptor = spindleCtx?.interceptor;
    if (!interceptor) return;

    const handler = async (payload: any) => {
        try {
            const activeEntries = await evaluateActiveNpcEntriesForPrompt();
            if (activeEntries.length === 0) return payload;

            const npcBlock = activeEntries.map(e => substituteParams(e.content)).join('\n\n');
            const position = Number(settings.entry_position ?? 1);

            if (Array.isArray(payload?.messages)) {
                if (position === 5) {
                    payload.messages.unshift({ role: 'system', content: npcBlock });
                } else if (position === 4) {
                    const depth = Math.max(0, Number(settings.entry_inchat_depth ?? 10));
                    const roleNum = Number(settings.entry_inchat_role ?? 0);
                    const roleStr = roleNum === 1 ? 'user' : roleNum === 2 ? 'assistant' : 'system';
                    const insertAt = Math.max(0, payload.messages.length - depth);
                    payload.messages.splice(insertAt, 0, { role: roleStr, content: npcBlock });
                } else {
                    const firstNonSystemIdx = payload.messages.findIndex((m: any) => m.role !== 'system');
                    if (firstNonSystemIdx > 0) {
                        payload.messages.splice(firstNonSystemIdx, 0, { role: 'system', content: npcBlock });
                    } else {
                        payload.messages.unshift({ role: 'system', content: npcBlock });
                    }
                }
            } else if (typeof payload?.systemPrompt === 'string') {
                payload.systemPrompt = position === 5
                    ? `${npcBlock}\n\n${payload.systemPrompt}`
                    : `${payload.systemPrompt}\n\n${npcBlock}`;
            }
        } catch (err) {
            console.warn(`[${MODULE_NAME}] Prompt interceptor warning:`, err);
        }
        return payload;
    };

    if (typeof interceptor.onBeforeGenerate === 'function') {
        interceptor.onBeforeGenerate(handler);
    } else if (typeof interceptor.register === 'function') {
        interceptor.register(handler);
    } else if (typeof interceptor.use === 'function') {
        interceptor.use(handler);
    }
}

// ============================================================================
// 11. Settings & Control Modal UI (4 Tabs)
// ============================================================================

function formatSnapshotSummary(snap: SliceSnapshot | null): string {
    if (!snap) return 'None available';
    const createdLen = Array.isArray(snap.created_uids) ? snap.created_uids.length : 0;
    const updatedLen = Array.isArray(snap.updated_entries) ? snap.updated_entries.length : 0;
    return `Slice #${snap.previous_cursor}..#${snap.new_cursor} (+${createdLen} new, ~${updatedLen} updated)`;
}

export async function openNpcBookModal(): Promise<void> {
    if (document.getElementById('npc_book_main_overlay')) return;

    const profiles = getAvailableProfiles();
    const tracker = getChatTracker();
    const currentLorebook = tracker.bound_lorebook || '';
    const allLorebooks = getAllLorebookNames();

    const overlay = document.createElement('div');
    overlay.id = 'npc_book_main_overlay';
    overlay.className = 'npc-book-overlay';

    overlay.innerHTML = `
        <div class="npc-book-dialog npc-book-modal-root">
            <div class="npc-book-header">
                <h3><span>NPC-Book</span></h3>
                <div id="npc_book_status_pill" class="npc-book-status-pill">Loading status...</div>
            </div>

            <div class="npc-book-tabs">
                <button type="button" class="npc-book-tab-btn active" data-tab="npc_book_tab_schedule">Schedule &amp; Lorebook</button>
                <button type="button" class="npc-book-tab-btn" data-tab="npc_book_tab_agents">LLM Agents</button>
                <button type="button" class="npc-book-tab-btn" data-tab="npc_book_tab_prompts">Prompts &amp; Template</button>
                <button type="button" class="npc-book-tab-btn" data-tab="npc_book_tab_entries">Tracked NPCs</button>
            </div>

            <!-- TAB 1: Schedule & Lorebook -->
            <div id="npc_book_tab_schedule" class="npc-book-tab-panel active">
                <div class="npc-book-section">
                    <div class="npc-book-section-title"><span>General &amp; Active Chat Lorebook</span></div>
                    <div class="npc-book-general-split">
                        <div class="npc-book-col-stack">
                            <label class="npc-book-checkbox-row">
                                <input type="checkbox" data-setting="extension_active" />
                                <span>Enable Automatic NPC Scanning</span>
                            </label>
                            <label class="npc-book-checkbox-row">
                                <input type="checkbox" data-setting="extension_notification" />
                                <span>Show Toast Notifications</span>
                            </label>
                            <label class="npc-book-checkbox-row">
                                <input type="checkbox" data-setting="lorebook_missing" />
                                <span>Prompt When Chat Has No Lorebook</span>
                            </label>
                        </div>

                        <div class="npc-book-col-stack">
                            <div class="npc-book-field">
                                <label>Bound Chat Lorebook</label>
                                <select id="npc_book_bound_lorebook" class="npc-book-input">
                                    <option value="">-- None Bound --</option>
                                    ${allLorebooks.map(w => `<option value="${escapeHtml(w)}" ${w === currentLorebook ? 'selected' : ''}>${escapeHtml(w)}</option>`).join('')}
                                </select>
                                <button type="button" id="npc_book_create_lorebook_btn" class="npc-book-btn npc-book-full-btn">
                                    + Create &amp; Bind New
                                </button>
                            </div>

                            <div class="npc-book-field">
                                <label>Auto-Created Lorebook Name Format</label>
                                <input type="text" class="npc-book-input" data-setting="lorebook_name" placeholder="~{{char}}_{{date}}" />
                                <small>Supports <code>{{char}}</code> and <code>{{date}}</code>.</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title"><span>Scan Schedule &amp; Rollback Controls</span></div>
                    <div class="npc-book-grid-2">
                        <div class="npc-book-field">
                            <label>Message Slice Interval</label>
                            <input type="number" class="npc-book-input" min="1" max="500" data-setting="trigger_message_interval" />
                            <small>Number of messages processed per scan slice.</small>
                        </div>
                        <div class="npc-book-field">
                            <label>Buffer Offset Before Triggering</label>
                            <input type="number" class="npc-book-input" min="0" max="200" data-setting="trigger_message_offset" />
                            <small>Wait this many extra messages past the slice end before scanning.</small>
                        </div>
                    </div>

                    <div class="npc-book-state-bar">
                        <div class="npc-book-state-item">
                            <span class="npc-book-state-label">Last Scanned Message Cursor:</span>
                            <strong id="npc_book_cursor_display">0</strong>
                        </div>
                        <div class="npc-book-state-item">
                            <span class="npc-book-state-label">Last Slice Snapshot:</span>
                            <span id="npc_book_snapshot_display">None available</span>
                        </div>
                    </div>

                    <div class="npc-book-action-toolbar">
                        <button type="button" id="npc_book_scan_now_btn" class="npc-book-btn npc-book-btn-primary">Scan Eligible Slice Now</button>
                        <button type="button" id="npc_book_catchup_btn" class="npc-book-btn">Catch Up All Slices</button>
                        <button type="button" id="npc_book_undo_btn" class="npc-book-btn" disabled>Undo Last Slice</button>
                        <button type="button" id="npc_book_reroll_btn" class="npc-book-btn" disabled>Reroll Last Slice</button>
                        <button type="button" id="npc_book_wipe_btn" class="npc-book-btn npc-book-danger-btn npc-book-span-full">Wipe NPCs &amp; Reset to 0</button>
                    </div>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title"><span>World Info Entry Defaults</span></div>
                    <div class="npc-book-grid-3">
                        <div class="npc-book-field">
                            <label>Entry Title Template</label>
                            <input type="text" class="npc-book-input" data-setting="entry_title_template" placeholder="[NPC] {{name}}" />
                            <small>Identifies managed NPC entries via <code>{{name}}</code>.</small>
                        </div>
                        <div class="npc-book-field">
                            <label>Activation Strategy</label>
                            <select class="npc-book-input" data-setting="entry_mode">
                                <option value="normal">Normal (Keyword-Triggered)</option>
                                <option value="constant">Constant (Always Active)</option>
                                <option value="vectorized">Vectorized (RAG)</option>
                            </select>
                        </div>
                        <div class="npc-book-field">
                            <label>Insertion Position</label>
                            <select class="npc-book-input" data-setting="entry_position" data-type="number">
                                <option value="0">Worldinfo before</option>
                                <option value="1">Worldinfo after</option>
                                <option value="2">Before Author's Note</option>
                                <option value="3">After Author's Note</option>
                                <option value="4">In-Chat @ Depth</option>
                                <option value="5">Top of System Prompt</option>
                                <option value="6">Bottom of System Prompt</option>
                            </select>
                        </div>
                    </div>

                    <div id="npc_book_inchat_row" class="npc-book-grid-2" style="display:none;">
                        <div class="npc-book-field">
                            <label>In-Chat Depth</label>
                            <input type="number" class="npc-book-input" min="0" max="999" data-setting="entry_inchat_depth" />
                        </div>
                        <div class="npc-book-field">
                            <label>In-Chat Role</label>
                            <select class="npc-book-input" data-setting="entry_inchat_role" data-type="number">
                                <option value="0">System</option>
                                <option value="1">User</option>
                                <option value="2">Assistant</option>
                            </select>
                        </div>
                    </div>

                    <div class="npc-book-grid-3">
                        <div class="npc-book-field">
                            <label>Insertion Order</label>
                            <input type="number" class="npc-book-input" min="0" max="9999" data-setting="entry_order" />
                        </div>
                        <div class="npc-book-field">
                            <label>Scan Depth</label>
                            <input type="number" class="npc-book-input" min="0" max="100" data-setting="entry_scan_depth" />
                        </div>
                        <div class="npc-book-field">
                            <label>Sticky Duration (Turns)</label>
                            <input type="number" class="npc-book-input" min="0" max="100" data-setting="entry_sticky" />
                        </div>
                    </div>

                    <label class="npc-book-checkbox-row">
                        <input type="checkbox" data-setting="entry_ignore_budget" />
                        <span>Ignore World Info Token Budget</span>
                    </label>
                </div>
            </div>

            <!-- TAB 2: LLM Agents -->
            <div id="npc_book_tab_agents" class="npc-book-tab-panel">
                <div class="npc-book-section">
                    <div class="npc-book-section-title"><span>Stage 1: Scanner Agent (JSON Roster Detection)</span></div>
                    <div class="npc-book-grid-3">
                        <div class="npc-book-field">
                            <label>Connection Profile</label>
                            <select class="npc-book-input" data-setting="agent_scanner_profile">
                                <option value="">-- Active Lumiverse API / Default --</option>
                                ${profiles.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="npc-book-field">
                            <label>Max Response Tokens</label>
                            <input type="number" class="npc-book-input" min="128" max="16384" data-setting="agent_scanner_max_token" />
                        </div>
                        <div class="npc-book-field">
                            <label>Temperature</label>
                            <input type="number" class="npc-book-input" min="0" max="2" step="0.05" data-setting="agent_scanner_temperature" />
                        </div>
                    </div>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title"><span>Stage 2: Scribe Agent (Markdown Profile Creation &amp; Updates)</span></div>
                    <div class="npc-book-grid-2">
                        <div class="npc-book-field">
                            <label>Connection Profile</label>
                            <select class="npc-book-input" data-setting="agent_scribe_profile">
                                <option value="">-- Active Lumiverse API / Default --</option>
                                ${profiles.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="npc-book-field">
                            <label>Max Concurrent Scribe Workers</label>
                            <input type="number" class="npc-book-input" min="1" max="10" data-setting="max_concurrent_scribes" />
                        </div>
                        <div class="npc-book-field">
                            <label>Max Response Tokens</label>
                            <input type="number" class="npc-book-input" min="256" max="32768" data-setting="agent_scribe_max_token" />
                        </div>
                        <div class="npc-book-field">
                            <label>Temperature</label>
                            <input type="number" class="npc-book-input" min="0" max="2" step="0.05" data-setting="agent_scribe_temperature" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 3: Prompts & Output Template -->
            <div id="npc_book_tab_prompts" class="npc-book-tab-panel">
                <div class="npc-book-section">
                    <div class="npc-book-section-title">
                        <span>Stage 1: Scanner System Prompt</span>
                        <button type="button" class="npc-book-btn npc-book-reset-prompt" data-reset-key="prompt_scanning">Reset Default</button>
                    </div>
                    <textarea class="npc-book-input npc-book-textarea" data-setting="prompt_scanning"></textarea>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title">
                        <span>Stage 2: Scribe Creation System Prompt</span>
                        <button type="button" class="npc-book-btn npc-book-reset-prompt" data-reset-key="prompt_creation">Reset Default</button>
                    </div>
                    <textarea class="npc-book-input npc-book-textarea" data-setting="prompt_creation"></textarea>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title">
                        <span>Stage 2: Scribe Update System Prompt</span>
                        <button type="button" class="npc-book-btn npc-book-reset-prompt" data-reset-key="prompt_updating">Reset Default</button>
                    </div>
                    <textarea class="npc-book-input npc-book-textarea" data-setting="prompt_updating"></textarea>
                </div>

                <div class="npc-book-section">
                    <div class="npc-book-section-title">
                        <span>NPC Profile Output Markdown Template</span>
                        <button type="button" class="npc-book-btn npc-book-reset-prompt" data-reset-key="prompt_output_template">Reset Default</button>
                    </div>
                    <textarea class="npc-book-input npc-book-textarea" data-setting="prompt_output_template"></textarea>
                </div>
            </div>

            <!-- TAB 4: Tracked NPCs Viewer -->
            <div id="npc_book_tab_entries" class="npc-book-tab-panel">
                <div id="npc_book_entries_list" class="npc-book-col-stack">
                    <small>No bound Lorebook or no NPC entries yet.</small>
                </div>
            </div>

            <div class="npc-book-footer">
                <button type="button" id="npc_book_close_btn" class="npc-book-btn npc-book-btn-primary">Close</button>
            </div>
        </div>
    `;

    overlay.querySelectorAll('[data-setting]').forEach(el => {
        const key = el.getAttribute('data-setting') as keyof NpcBookSettings;
        const val = settings[key];
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
            el.checked = Boolean(val);
        } else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
            el.value = String(val ?? '');
        }
    });

    const inchatRow = overlay.querySelector('#npc_book_inchat_row') as HTMLElement | null;
    if (inchatRow) {
        inchatRow.style.display = Number(settings.entry_position) === 4 ? 'grid' : 'none';
    }

    const boundSelect = overlay.querySelector('#npc_book_bound_lorebook') as HTMLSelectElement | null;

    const refreshStatusBanner = async () => {
        const activeTracker = getChatTracker();
        const activeLb = activeTracker.bound_lorebook || '';

        if (boundSelect && activeLb) {
            if (![...boundSelect.options].some(o => o.value === activeLb)) {
                const opt = document.createElement('option');
                opt.value = activeLb;
                opt.textContent = activeLb;
                boundSelect.appendChild(opt);
            }
            boundSelect.value = activeLb;
        }

        const status = getScheduleStatus();
        const tracked = activeLb ? await getExistingNpcEntries(activeLb) : [];

        const pill = overlay.querySelector('#npc_book_status_pill');
        if (pill) {
            pill.textContent = `${status.summary} | Tracked NPCs: ${tracked.length}`;
        }

        const cursorDisplay = overlay.querySelector('#npc_book_cursor_display');
        if (cursorDisplay) {
            cursorDisplay.textContent = `#${status.lastScanned} / ${status.totalMessages} (Eligible ceiling: #${status.eligibleCeiling})`;
        }

        const snapshotDisplay = overlay.querySelector('#npc_book_snapshot_display');
        if (snapshotDisplay) {
            snapshotDisplay.textContent = formatSnapshotSummary(status.snapshot);
        }

        const entriesContainer = overlay.querySelector('#npc_book_entries_list');
        if (entriesContainer) {
            if (tracked.length === 0) {
                entriesContainer.innerHTML = `<div class="npc-book-section"><small>No tracked NPCs in "${escapeHtml(activeLb || 'Unbound')}" yet.</small></div>`;
            } else {
                entriesContainer.innerHTML = tracked.map(npc => `
                    <div class="npc-book-section">
                        <div class="npc-book-section-title">
                            <span>${escapeHtml(npc.comment)}</span>
                            <small>Keys: ${escapeHtml(npc.keys.join(', '))}</small>
                        </div>
                        <pre class="npc-book-entry-pre">${escapeHtml(npc.content)}</pre>
                    </div>
                `).join('');
            }
        }

        const busy = runtimeState.isScanRunning || runtimeState.isCatchUpRunning;
        const hasSnapshot = Boolean(status.snapshot);

        const scanNowBtn = overlay.querySelector('#npc_book_scan_now_btn') as HTMLButtonElement | null;
        const catchUpBtn = overlay.querySelector('#npc_book_catchup_btn') as HTMLButtonElement | null;
        const undoBtn = overlay.querySelector('#npc_book_undo_btn') as HTMLButtonElement | null;
        const rerollBtn = overlay.querySelector('#npc_book_reroll_btn') as HTMLButtonElement | null;
        const wipeBtn = overlay.querySelector('#npc_book_wipe_btn') as HTMLButtonElement | null;

        if (scanNowBtn) scanNowBtn.disabled = busy;
        if (undoBtn) undoBtn.disabled = !hasSnapshot || busy;
        if (rerollBtn) rerollBtn.disabled = !hasSnapshot || busy;
        if (wipeBtn) wipeBtn.disabled = busy;

        if (catchUpBtn) {
            if (runtimeState.isCatchUpRunning) {
                catchUpBtn.disabled = runtimeState.stopCatchUpRequested;
                catchUpBtn.classList.add('npc-book-stop-btn');
                catchUpBtn.textContent = runtimeState.stopCatchUpRequested
                    ? 'Stopping After Current Slice...'
                    : `Stop After Current Slice (${status.catchUpSlicesCount} left)`;
            } else {
                catchUpBtn.classList.remove('npc-book-stop-btn');
                catchUpBtn.disabled = runtimeState.isScanRunning || status.catchUpSlicesCount <= 0;
                catchUpBtn.textContent = status.catchUpSlicesCount > 0
                    ? `Catch Up All Slices (${status.catchUpSlicesCount})`
                    : 'All Eligible Slices Scanned';
            }
        }
    };

    runtimeState.activeModalRefreshFn = refreshStatusBanner;

    const tabBtns = overlay.querySelectorAll('.npc-book-tab-btn');
    const tabPanels = overlay.querySelectorAll('.npc-book-tab-panel');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));
            tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === targetId));
        });
    });

    overlay.querySelectorAll('[data-setting]').forEach(el => {
        const key = el.getAttribute('data-setting') as keyof NpcBookSettings;
        const forceType = el.getAttribute('data-type');

        el.addEventListener('change', async () => {
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                (settings as any)[key] = el.checked;
            } else if ((el instanceof HTMLInputElement && el.type === 'number') || forceType === 'number') {
                (settings as any)[key] = Number(el.value);
            } else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
                (settings as any)[key] = el.value;
            }

            if (key === 'entry_position' && inchatRow) {
                inchatRow.style.display = Number(settings.entry_position) === 4 ? 'grid' : 'none';
            }

            await saveSettings();
            await refreshStatusBanner();
        });
    });

    overlay.querySelectorAll('.npc-book-reset-prompt').forEach(btn => {
        btn.addEventListener('click', async () => {
            const key = btn.getAttribute('data-reset-key') as keyof NpcBookSettings;
            const defaultVal = DEFAULT_SETTINGS[key];
            if (defaultVal !== undefined) {
                (settings as any)[key] = defaultVal;
                const textarea = overlay.querySelector(`textarea[data-setting="${key}"]`) as HTMLTextAreaElement | null;
                if (textarea) textarea.value = String(defaultVal);
                await saveSettings();
                showToast('info', `Reset "${key}" to factory default.`);
            }
        });
    });

    boundSelect?.addEventListener('change', async () => {
        const activeTracker = getChatTracker();
        const val = boundSelect.value;
        activeTracker.bound_lorebook = val;
        await saveChatTrackers();
        showToast(val ? 'success' : 'info', val ? `Bound Chat Lorebook: ${val}` : 'Unbound Chat Lorebook.');
        await refreshStatusBanner();
    });

    overlay.querySelector('#npc_book_create_lorebook_btn')?.addEventListener('click', async () => {
        const createdName = await createAndBindChatLorebook();
        if (createdName && boundSelect) {
            const opt = document.createElement('option');
            opt.value = createdName;
            opt.textContent = createdName;
            opt.selected = true;
            boundSelect.appendChild(opt);
            await refreshStatusBanner();
        }
    });

    overlay.querySelector('#npc_book_scan_now_btn')?.addEventListener('click', () => executeNpcScanSlice({ manual: true }));
    overlay.querySelector('#npc_book_catchup_btn')?.addEventListener('click', () => runCatchUpLoop());
    overlay.querySelector('#npc_book_undo_btn')?.addEventListener('click', () => undoLastSlice());
    overlay.querySelector('#npc_book_reroll_btn')?.addEventListener('click', () => rerollLastSlice());
    overlay.querySelector('#npc_book_wipe_btn')?.addEventListener('click', () => wipeNpcsAndReset());

    const closeModal = () => {
        runtimeState.activeModalRefreshFn = null;
        overlay.remove();
    };

    overlay.querySelector('#npc_book_close_btn')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    await refreshStatusBanner();
}

// ============================================================================
// 12. Scoped Styles & Launcher Button Injection
// ============================================================================

function injectStyles(): void {
    if (document.getElementById('npc_book_spindle_styles')) return;
    const style = document.createElement('style');
    style.id = 'npc_book_spindle_styles';
    style.textContent = `
        .npc-book-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0, 0, 0, 0.72); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 12px; }
        .npc-book-dialog { background: #1b1e24; color: #eef1f5; border: 1px solid #353b45; border-radius: 12px; padding: 16px; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55); max-height: 92vh; overflow-y: auto; }
        .npc-book-modal-root { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 780px; text-align: left; }
        .npc-book-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #353b45; padding-bottom: 8px; flex-wrap: wrap; gap: 8px; }
        .npc-book-header h3 { margin: 0; font-size: 1.15rem; }
        .npc-book-status-pill { font-size: 0.78rem; padding: 4px 10px; border-radius: 999px; background: rgba(0, 0, 0, 0.35); border: 1px solid #444c59; }
        .npc-book-tabs { display: flex; gap: 6px; border-bottom: 1px solid #353b45; padding-bottom: 8px; flex-wrap: wrap; }
        .npc-book-tab-btn { flex: 1; min-width: 110px; padding: 8px 10px; cursor: pointer; border-radius: 6px; border: 1px solid transparent; background: rgba(255, 255, 255, 0.05); color: #c8d0dc; font-weight: 600; font-size: 0.85rem; }
        .npc-book-tab-btn.active { background: #3b6ea5; color: #fff; border-color: #6396cc; }
        .npc-book-tab-panel { display: none; flex-direction: column; gap: 12px; max-height: 64vh; overflow-y: auto; padding-right: 4px; }
        .npc-book-tab-panel.active { display: flex; }
        .npc-book-section { background: rgba(0, 0, 0, 0.25); border: 1px solid #353b45; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .npc-book-section-title { font-size: 0.92rem; font-weight: 700; color: #8ab4f8; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .npc-book-general-split { display: grid; grid-template-columns: 2fr 3fr; gap: 16px; align-items: start; }
        .npc-book-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
        .npc-book-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 14px; }
        @media (max-width: 640px) { .npc-book-general-split, .npc-book-grid-2, .npc-book-grid-3, .npc-book-action-toolbar { grid-template-columns: 1fr; } }
        .npc-book-col-stack { display: flex; flex-direction: column; gap: 10px; }
        .npc-book-field { display: flex; flex-direction: column; gap: 4px; }
        .npc-book-field label { font-size: 0.84rem; font-weight: 600; }
        .npc-book-field small { font-size: 0.74rem; opacity: 0.75; }
        .npc-book-input { width: 100%; box-sizing: border-box; background: #12151a; color: #eef1f5; border: 1px solid #3f4754; border-radius: 6px; padding: 7px 10px; font-size: 0.88rem; }
        .npc-book-textarea { min-height: 115px; resize: vertical; font-family: monospace; font-size: 0.82rem; line-height: 1.35; }
        .npc-book-checkbox-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; padding: 3px 0; }
        .npc-book-state-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; padding: 8px 12px; border-radius: 6px; background: rgba(0, 0, 0, 0.35); border: 1px solid #353b45; font-size: 0.83rem; }
        .npc-book-action-toolbar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .npc-book-span-full { grid-column: 1 / -1; }
        .npc-book-btn { background: #282e38; color: #eef1f5; border: 1px solid #454f5e; border-radius: 6px; padding: 8px 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: center; }
        .npc-book-btn:hover:not(:disabled) { background: #343c49; }
        .npc-book-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .npc-book-btn-primary { background: #3b6ea5; border-color: #5d91c7; color: #fff; }
        .npc-book-btn-primary:hover:not(:disabled) { background: #487eb8; }
        .npc-book-stop-btn { border-color: #e09f3e; color: #ffd27d; background: rgba(180, 110, 20, 0.28); }
        .npc-book-danger-btn { border-color: rgba(220, 70, 70, 0.6); color: #ff9b9b; }
        .npc-book-full-btn { width: 100%; margin-top: 4px; }
        .npc-book-missing-popup { max-width: 480px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
        .npc-book-missing-option { background: rgba(0, 0, 0, 0.25); border: 1px solid #353b45; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .npc-book-entry-pre { margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 0.8rem; background: #12151a; padding: 8px; border-radius: 6px; border: 1px solid #2e343e; }
        .npc-book-footer { display: flex; justify-content: flex-end; border-top: 1px solid #353b45; padding-top: 10px; }
        #npc_book_floating_launcher { position: fixed; bottom: 74px; right: 14px; z-index: 9990; background: #252b35; color: #eef1f5; border: 1px solid #475263; border-radius: 999px; padding: 7px 13px; font-size: 0.8rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4); opacity: 0.86; }
        #npc_book_floating_launcher:hover { opacity: 1; background: #3b6ea5; }
        #npc_book_toast_container { position: fixed; top: 14px; right: 14px; z-index: 100000; display: flex; flex-direction: column; gap: 8px; max-width: 340px; pointer-events: none; }
        .npc-book-toast { background: #1f242d; color: #eef1f5; border-left: 4px solid #4a89dc; border-radius: 6px; padding: 10px 12px; font-size: 0.83rem; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45); display: flex; flex-direction: column; gap: 2px; transition: opacity 0.25s ease; }
        .npc-book-toast-success { border-left-color: #37bc9b; }
        .npc-book-toast-warning { border-left-color: #f6bb42; }
        .npc-book-toast-error { border-left-color: #da4453; }
        .npc-book-toast-hide { opacity: 0; }
    `;
    document.head.appendChild(style);
}

function registerLauncherButton(): void {
    if (spindleCtx?.ui?.registerMenuItem) {
        try {
            spindleCtx.ui.registerMenuItem({
                id: 'st_npc_book_menu',
                label: 'NPC-Book',
                title: 'Open NPC-Book Settings & Controls',
                onClick: () => openNpcBookModal(),
            });
        } catch {
            // fallback to floating launcher button
        }
    }

    if (document.getElementById('npc_book_floating_launcher')) return;
    const btn = document.createElement('button');
    btn.id = 'npc_book_floating_launcher';
    btn.type = 'button';
    btn.title = 'Open NPC-Book Settings & Controls';
    btn.textContent = 'NPC-Book';
    btn.addEventListener('click', () => openNpcBookModal());
    document.body.appendChild(btn);
}

// ============================================================================
// 13. Auto-Scan Trigger & Spindle Entry Point
// ============================================================================

async function checkAndRunAutoScan(): Promise<void> {
    if (
        !settings.extension_active ||
        runtimeState.isScanRunning ||
        runtimeState.isCatchUpRunning
    ) {
        return;
    }

    const status = getScheduleStatus();
    if (!status.isDue) return;

    await executeNpcScanSlice({
        customStart: status.sliceStart,
        customEnd: status.sliceEnd,
        manual: false,
    });
}

export async function setup(ctx: any): Promise<void> {
    spindleCtx = ctx;
    injectStyles();
    await loadAllPersistentData();
    registerLauncherButton();
    registerPromptInterceptor();

    const events = ctx?.events || ctx?.chat;
    const onMessageFinished = () => {
        setTimeout(() => {
            checkAndRunAutoScan().catch(err => console.warn(`[${MODULE_NAME}] Auto-scan check error:`, err));
        }, 600);
    };

    if (typeof events?.on === 'function') {
        events.on('message_received', onMessageFinished);
        events.on('character_message_rendered', onMessageFinished);
        events.on('generation_ended', onMessageFinished);
    }

    const commands = ctx?.commands || ctx?.slashCommands;
    if (typeof commands?.register === 'function') {
        try {
            commands.register('npc-scan', async (args: string) => {
                const parts = String(args ?? '').trim().split(/\s+/).filter(Boolean);
                if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
                    await executeNpcScanSlice({
                        customStart: Number(parts[0]),
                        customEnd: Number(parts[1]),
                        manual: true,
                    });
                } else {
                    await executeNpcScanSlice({ manual: true });
                }
            });
        } catch {
            // ignore if slash commands are not exposed
        }
    }

    console.log(`[${MODULE_NAME}] Initialized successfully on Lumiverse.`);
}

export default { setup };
