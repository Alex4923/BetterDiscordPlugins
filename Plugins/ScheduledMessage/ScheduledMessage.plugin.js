/**
 * @name ScheduledMessage
 * @description Plugin to schedule message sending.
 * @version 3.1.1
 * @author Alexvo
 * @authorId 265931236885790721
 * @source https://github.com/Alex4923/BetterDiscordPlugins/blob/main/Plugins/ScheduledMessage
 * @updateUrl https://raw.githubusercontent.com/Alex4923/BetterDiscordPlugins/main/Plugins/ScheduledMessage/ScheduledMessage.plugin.js
 * @donate https://paypal.me/alex4923
 * @website https://www.alexvo2709.com/
 */

'use strict';

const { React } = BdApi;

const PLUGIN_CHANGELOG = {
    version: "3.1.1",
    changelogDate: "2026-04-29",
    changelog: [
        {
            title: "Initial Release",
            type: "added",
            items: [
                "Update for the new Discord API and UI changes.",
                "Fixed minor bugs.",
            ]
        }
    ]
};

function showChangelog() {
    const { version, changelog, changelogDate } = PLUGIN_CHANGELOG;
    const saved = BdApi.Data.load("ScheduledMessage", "lastVersion");
    if (saved === version) return;

    const formatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
    const title = React.createElement("div", { className: "SM-Changelog-Title-Wrapper" },
        React.createElement("h1", null, "ScheduledMessage"),
        React.createElement("div", null, formatter.format(new Date(changelogDate)), " \u2014 v", version)
    );

    const items = changelog.map(item =>
        React.createElement("div", { className: "SM-Changelog-Item" },
            React.createElement("h4", { className: `SM-Changelog-Header ${item.type}` }, item.title),
            ...item.items.map(text => React.createElement("span", null, text))
        )
    );

    BdApi.UI.alert(title, items);
    BdApi.Data.save("ScheduledMessage", "lastVersion", version);
}

const Store = {
    messages: new Map(),
    add(id, channelId, message, scheduledTime) {
        this.messages.set(id, { channelId, message, scheduledTime, createdAt: Date.now() });
    },
    update(id, channelId, message, scheduledTime) {
        if (this.messages.has(id)) {
            this.messages.set(id, { ...this.messages.get(id), channelId, message, scheduledTime });
        }
    },
    remove(id) { this.messages.delete(id); },
    get(id) { return this.messages.get(id); },
    getAll() {
        return Array.from(this.messages.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.scheduledTime - b.scheduledTime);
    },
    clear() { this.messages.clear(); }
};

function toDatetimeLocal(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(v) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 4) return d;
    if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

function fmtTime(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function getChannelName(channelId) {
    try {
        return BdApi.Webpack.getStore("ChannelStore")?.getChannel?.(channelId)?.name || channelId.slice(-4);
    } catch {
        return channelId.slice(-4);
    }
}

const M = {};

function initModules() {
    M.openModal = BdApi.Webpack.getByKeys("openModal", "closeModal")?.openModal;

    let mc = BdApi.Webpack.getModule(m => {
        try {
            return typeof m?.ModalRoot    === "function"
                && typeof m?.ModalContent === "function"
                && typeof m?.ModalFooter  === "function";
        } catch { return false; }
    });

    if (!mc?.ModalRoot) {
        const byDisplayName = name => BdApi.Webpack.getModule(
            m => typeof m === "function" && (m.displayName === name || m.render?.displayName === name),
            { searchExports: true }
        );
        mc = {
            ModalRoot:        byDisplayName("ModalRoot")
                              ?? BdApi.Webpack.getModule(m => {
                                  try { const s = m?.toString?.(); return s?.includes("ENTERING") && s?.includes("headerId"); }
                                  catch { return false; }
                              }, { searchExports: true }),
            ModalHeader:      byDisplayName("ModalHeader"),
            ModalContent:     byDisplayName("ModalContent"),
            ModalFooter:      byDisplayName("ModalFooter"),
            ModalCloseButton: byDisplayName("ModalCloseButton"),
        };
    }

    M.ModalRoot        = mc?.ModalRoot;
    M.ModalHeader      = mc?.ModalHeader;
    M.ModalContent     = mc?.ModalContent;
    M.ModalFooter      = mc?.ModalFooter;
    M.ModalCloseButton = mc?.ModalCloseButton
        ?? BdApi.Webpack.getModule(
            m => typeof m === "function" && m.displayName === "ModalCloseButton",
            { searchExports: true }
        );

    const fc = BdApi.Webpack.getByKeys("FormTitle", "FormText");
    M.FormTitle = fc?.FormTitle;

    const bm = BdApi.Webpack.getByKeys("BorderColors");
    M.Button = bm?.default ?? bm;

    M.Tooltip = BdApi.Components?.Tooltip
        ?? BdApi.Webpack.getByKeys("Tooltip", "TooltipContainer")?.Tooltip
        ?? BdApi.Webpack.getModule(m => m?.displayName === "Tooltip", { searchExports: true });

    const chatBtnRaw = BdApi.Webpack.getByStrings?.("CHAT_INPUT_BUTTON_NOTIFICATION");
    M.ChatButton = typeof chatBtnRaw === "function" ? chatBtnRaw
        : chatBtnRaw?.A
        ?? (chatBtnRaw && Object.values(chatBtnRaw).find(v => typeof v === "function"));

    if (!M.ChatButton) {
        try {
            const el = document.querySelector('[class*="channelTextArea"] [class*="buttons"]');
            const fk = el && Object.keys(el).find(k => k.startsWith("__reactFiber"));
            if (fk) {
                const q = [[el[fk], 0]];
                const seen = new Set();
                while (q.length) {
                    const [f, d] = q.shift();
                    if (!f || seen.has(f) || d > 30) continue;
                    seen.add(f);
                    if (typeof f.type === "function") {
                        try {
                            if (f.type.toString().includes("CHAT_INPUT_BUTTON_NOTIFICATION")) {
                                M.ChatButton = f.type;
                                break;
                            }
                        } catch {}
                    }
                    if (f.child) q.push([f.child, d + 1]);
                    if (f.sibling) q.push([f.sibling, d + 1]);
                }
            }
        } catch {}
    }
}

function openScheduleModal(channelId) {
    M.openModal?.(props => React.createElement(ScheduleModal, { ...props, channelId }));
}

function openListModal() {
    M.openModal?.(props => React.createElement(ListModal, props));
}

function ModalWrap({ transitionState, size, children }) {
    if (M.ModalRoot) return React.createElement(M.ModalRoot, { transitionState, size }, children);
    return React.createElement("div", { className: "sm-box" }, children);
}

function ModalHead({ title, onClose }) {

    const titleEl = React.createElement("h2", {
        style: {
            margin: 0, flex: 1,
            fontSize: "20px", fontWeight: 700, lineHeight: "1.2",
            color: "var(--white-500, #f2f3f5)",
            fontFamily: "var(--font-display, 'gg sans', 'Noto Sans', sans-serif)"
        }
    }, title);
    const closeEl = React.createElement("button", { className: "sm-close", onClick: onClose, "aria-label": "Close" }, "×");

    if (M.ModalHeader) {
        return React.createElement(M.ModalHeader, { separator: true }, titleEl, closeEl);
    }
    return React.createElement("div", { className: "sm-modal-header" }, titleEl, closeEl);
}

function ModalBody({ style, children }) {
    if (M.ModalContent) return React.createElement(M.ModalContent, { style }, children);
    return React.createElement("div", { className: "sm-modal-body", style }, children);
}

function ModalFoot({ children }) {
    if (M.ModalFooter) return React.createElement(M.ModalFooter, null, children);
    return React.createElement("div", { className: "sm-modal-footer" }, children);
}

function Btn({ look, color, size, onClick, disabled, style, children }) {
    const { Button } = M;
    if (!Button) return React.createElement("button", { className: "sm-fb-btn", onClick, disabled, style }, children);
    return React.createElement(Button, { look, color, size, onClick, disabled, style }, children);
}

function FieldLabel({ children }) {
    if (M.FormTitle) return React.createElement(M.FormTitle, { tag: "h5" }, children);
    return React.createElement("label", { className: "sm-label" }, children);
}

function ScheduleModal({ channelId, transitionState, onClose }) {
    const { Button } = M;
    const [message, setMessage] = React.useState("");
    const [date, setDate]       = React.useState("");
    const [time, setTime]       = React.useState("");
    const disabled = !message || !date || !time;

    function schedule() {
        const t = new Date(`${date}T${time}`);
        if (isNaN(t) || t <= new Date()) {
            BdApi.UI.showToast("The scheduled time is in the past", { type: "error" });
            return;
        }
        Store.add(Date.now().toString(), channelId, message, t.getTime());
        BdApi.UI.showToast("Message scheduled successfully", { type: "success" });
        onClose();
    }

    function goToList() {
        onClose();
        setTimeout(openListModal, 200);
    }

    return React.createElement(ModalWrap, { transitionState, size: "small" },
        React.createElement(ModalHead, { title: "Schedule a Message", onClose }),
        React.createElement(ModalBody, { style: { padding: "16px 20px" } },
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
                React.createElement("div", null,
                    React.createElement(FieldLabel, null, "Message"),
                    React.createElement("textarea", {
                        className: "sm-textarea",
                        placeholder: "Type your message here...",
                        value: message,
                        onChange: e => setMessage(e.target.value)
                    })
                ),
                React.createElement("div", { className: "sm-datetime-row" },
                    React.createElement("div", null,
                        React.createElement(FieldLabel, null, "Date"),
                        React.createElement("input", {
                            type: "text", className: "sm-input",
                            placeholder: "YYYY-MM-DD", maxLength: 10, inputMode: "numeric",
                            value: date, onChange: e => setDate(fmtDate(e.target.value))
                        })
                    ),
                    React.createElement("div", null,
                        React.createElement(FieldLabel, null, "Time"),
                        React.createElement("input", {
                            type: "text", className: "sm-input",
                            placeholder: "HH:MM", maxLength: 5, inputMode: "numeric",
                            value: time, onChange: e => setTime(fmtTime(e.target.value))
                        })
                    )
                )
            )
        ),
        React.createElement(ModalFoot, null,
            React.createElement(Btn, {
                look: Button?.Looks?.LINK, color: Button?.Colors?.PRIMARY,
                onClick: goToList, style: { marginRight: "auto" }
            }, `Manage (${Store.getAll().length})`),
            React.createElement(Btn, {
                look: Button?.Looks?.LINK, color: Button?.Colors?.PRIMARY, onClick: onClose
            }, "Cancel"),
            React.createElement(Btn, {
                color: Button?.Colors?.BRAND, disabled, onClick: schedule
            }, "Schedule")
        )
    );
}

function ListModal({ transitionState, onClose }) {
    const { Button } = M;
    const [msgs, setMsgs]       = React.useState(Store.getAll());
    const [editing, setEditing] = React.useState(null);

    function refresh() { setMsgs(Store.getAll()); }

    function handleDelete(id) {
        Store.remove(id);
        BdApi.UI.showToast("Message deleted", { type: "success" });
        refresh();
    }

    function startEdit(msg) {
        const dt = toDatetimeLocal(msg.scheduledTime);
        setEditing({ id: msg.id, message: msg.message, date: dt.slice(0, 10), time: dt.slice(11) });
    }

    function saveEdit() {
        if (!editing.message || !editing.date || !editing.time) {
            BdApi.UI.showToast("Please fill in all fields", { type: "error" });
            return;
        }
        const t = new Date(`${editing.date}T${editing.time}`);
        if (isNaN(t) || t <= new Date()) {
            BdApi.UI.showToast("The scheduled time is in the past", { type: "error" });
            return;
        }
        const msg = Store.get(editing.id);
        Store.update(editing.id, msg.channelId, editing.message, t.getTime());
        BdApi.UI.showToast("Message updated", { type: "success" });
        setEditing(null);
        refresh();
    }

    return React.createElement(ModalWrap, { transitionState, size: "small" },
        React.createElement(ModalHead, { title: `Scheduled Messages (${msgs.length})`, onClose }),
        React.createElement(ModalBody, { style: { padding: "8px 20px" } },
            msgs.length === 0
                ? React.createElement("div", { className: "sm-empty" }, "No scheduled messages")
                : msgs.map(msg => {
                    const isEditing = editing?.id === msg.id;
                    return React.createElement("div", { key: msg.id, className: "sm-item" + (isEditing ? " sm-item-editing" : "") },
                        isEditing
                            ? React.createElement("div", { className: "sm-edit-form" },
                                React.createElement("textarea", {
                                    className: "sm-textarea",
                                    value: editing.message,
                                    onChange: e => setEditing({ ...editing, message: e.target.value }),
                                    placeholder: "Message content..."
                                }),
                                React.createElement("div", { className: "sm-datetime-row" },
                                    React.createElement("div", null,
                                        React.createElement(FieldLabel, null, "Date"),
                                        React.createElement("input", {
                                            type: "text", className: "sm-input",
                                            placeholder: "YYYY-MM-DD",
                                            value: editing.date,
                                            onChange: e => setEditing({ ...editing, date: fmtDate(e.target.value) })
                                        })
                                    ),
                                    React.createElement("div", null,
                                        React.createElement(FieldLabel, null, "Time"),
                                        React.createElement("input", {
                                            type: "text", className: "sm-input",
                                            placeholder: "HH:MM",
                                            value: editing.time,
                                            onChange: e => setEditing({ ...editing, time: fmtTime(e.target.value) })
                                        })
                                    )
                                ),
                                React.createElement("div", { className: "sm-edit-actions" },
                                    React.createElement(Btn, {
                                        look: Button?.Looks?.LINK, color: Button?.Colors?.PRIMARY,
                                        onClick: () => setEditing(null)
                                    }, "Cancel"),
                                    React.createElement(Btn, {
                                        color: Button?.Colors?.BRAND, onClick: saveEdit
                                    }, "Save")
                                )
                              )
                            : React.createElement(React.Fragment, null,
                                React.createElement("div", { className: "sm-item-row" },
                                    React.createElement("div", { className: "sm-item-content" }, msg.message),
                                    React.createElement("div", { className: "sm-item-actions" },
                                        React.createElement(Btn, {
                                            look: Button?.Looks?.LINK, color: Button?.Colors?.PRIMARY,
                                            size: Button?.Sizes?.SMALL, onClick: () => startEdit(msg)
                                        }, "Edit"),
                                        React.createElement(Btn, {
                                            color: Button?.Colors?.RED,
                                            size: Button?.Sizes?.SMALL, onClick: () => handleDelete(msg.id)
                                        }, "Delete")
                                    )
                                ),
                                React.createElement("div", { className: "sm-item-meta" },
                                    React.createElement("span", { className: "sm-item-channel" },
                                        `#${getChannelName(msg.channelId)}`
                                    ),
                                    React.createElement("span", null, " • "),
                                    new Date(msg.scheduledTime).toLocaleString()
                                )
                              )
                    );
                })
        ),
        React.createElement(ModalFoot, null,
            React.createElement(Btn, {
                look: Button?.Looks?.LINK, color: Button?.Colors?.PRIMARY, onClick: onClose
            }, "Close")
        )
    );
}

const CSS = `
    .sm-chat-btn {
        min-height: var(--space-32);
        min-width: var(--space-32);
    }

    .sm-fallback-btn {
        background: none; border: none; cursor: pointer; padding: 4px;
        border-radius: 4px; color: var(--interactive-normal);
        display: flex; align-items: center; justify-content: center;
        transition: color 0.1s ease, background 0.1s ease;
    }
    .sm-fallback-btn:hover { background: var(--background-modifier-hover); color: var(--interactive-hover); }

    .sm-box {
        background: var(--modal-background, var(--background-primary, #313338));
        border-radius: 4px;
        box-shadow: var(--elevation-high, 0 8px 32px rgba(0,0,0,.6));
        display: flex; flex-direction: column;
        width: 440px; max-width: 95vw;
    }
    .sm-modal-header {
        padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid var(--background-modifier-accent, rgba(255,255,255,.06));
        flex-shrink: 0;
    }
    .sm-modal-title {
        margin: 0; font-size: 20px; font-weight: 700; line-height: 1.2;
        color: var(--header-primary); font-family: var(--font-display, "gg sans", "Noto Sans", sans-serif);
        flex: 1;
    }
    .sm-modal-body { padding: 16px 20px; overflow-y: auto; }
    .sm-modal-footer {
        padding: 16px 20px; display: flex; gap: 8px; align-items: center;
        border-top: 1px solid var(--background-modifier-accent, rgba(255,255,255,.06));
        flex-shrink: 0;
    }
    .sm-close {
        background: transparent !important; border: none; cursor: pointer;
        color: var(--interactive-normal, #b5bac1) !important; border-radius: 4px;
        width: 24px; height: 24px; font-size: 20px; line-height: 1;
        display: flex; align-items: center; justify-content: center;
        transition: color .15s, background .15s;
    }
    .sm-close:hover { color: var(--interactive-hover, #dbdee1) !important; background: var(--background-modifier-hover); }

    .sm-fb-btn {
        padding: 9px 18px; border: none; border-radius: 3px; cursor: pointer;
        font-size: 14px; font-weight: 500; font-family: inherit;
        background: var(--brand-experiment, #5865f2); color: #fff;
        transition: filter .15s;
    }
    .sm-fb-btn:hover:not(:disabled) { filter: brightness(1.1); }
    .sm-fb-btn:disabled { opacity: .4; cursor: not-allowed; }

    .sm-textarea, .sm-input {
        width: 100%; padding: 10px 12px;
        background: var(--background-tertiary) !important; border: 1.5px solid rgba(0,0,0,0.4) !important;
        border-radius: 4px; color: var(--text-normal, #dbdee1) !important; font-size: 14px;
        outline: none; box-sizing: border-box; font-family: inherit;
        transition: border-color 0.15s;
    }
    .sm-textarea:focus, .sm-input:focus { border-color: var(--brand-experiment) !important; }
    .sm-textarea { min-height: 100px; resize: none; }
    .sm-input { cursor: text; }
    .sm-input::placeholder { color: var(--text-muted, #80848e) !important; opacity: 1; }
    .sm-datetime-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sm-label {
        font-size: 12px; font-weight: 700; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.4px;
        display: block; margin-bottom: 6px;
    }

    .sm-empty { text-align: center; padding: 32px; color: var(--text-muted); font-size: 14px; }
    .sm-item {
        background: var(--background-secondary-alt);
        border: 1px solid var(--background-modifier-accent);
        border-radius: 8px; padding: 12px 14px;
        margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px;
    }
    .sm-item:last-child { margin-bottom: 0; }
    .sm-item-row { display: flex; align-items: flex-start; gap: 8px; }
    .sm-item-content {
        flex: 1; color: var(--text-normal, #dbdee1) !important; font-size: 14px; line-height: 1.4;
        overflow: hidden; display: -webkit-box;
        -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .sm-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .sm-item-meta { font-size: 11px; color: var(--text-muted); }
    .sm-item-channel { color: var(--text-muted); font-weight: 500; }
    .sm-edit-form { display: flex; flex-direction: column; gap: 10px; }
    .sm-edit-actions { display: flex; gap: 8px; justify-content: flex-end; }

    .SM-Changelog-Title-Wrapper {
        font-size: 20px; font-weight: 600;
        font-family: var(--font-display);
        color: var(--header-primary); line-height: 1.2;
    }
    .SM-Changelog-Title-Wrapper div {
        font-size: 12px; font-weight: 400;
        font-family: var(--font-primary);
        color: var(--primary-300); line-height: 1.333;
        margin-top: 2px;
    }
    .SM-Changelog-Item { color: var(--text-normal, #c4c9ce); margin-bottom: 16px; }
    .SM-Changelog-Item .SM-Changelog-Header {
        display: flex; align-items: center;
        text-transform: uppercase; font-weight: 700; font-size: 12px;
        margin-bottom: 6px;
    }
    .SM-Changelog-Header::before {
        content: ""; display: inline-block;
        width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; flex-shrink: 0;
    }
    .SM-Changelog-Header.added::before    { background: #3ba55d; }
    .SM-Changelog-Header.fixed::before    { background: #3ba55d; }
    .SM-Changelog-Header.improved::before { background: var(--brand-experiment, #5865f2); }
    .SM-Changelog-Header.progress::before { background: #faa81a; }
    .SM-Changelog-Item span {
        display: block; font-size: 14px; line-height: 1.6;
        padding-left: 16px; color: var(--text-normal, #dbdee1);
    }
    .SM-Changelog-Item span::before { content: "\\2022  "; color: var(--text-muted); }
`;

class ScheduledMessage {
    constructor() {
        this.checkMessages = this.checkMessages.bind(this);
        this.checkInterval = null;
    }

    async sendMessage(channelId, message) {
        const MessageActions = BdApi.Webpack.getModule(m => m?.sendMessage && m?.editMessage);
        if (!MessageActions) {
            BdApi.UI.showToast("Failed to get MessageActions", { type: "error" });
            return false;
        }

        const NonceModule = BdApi.Webpack.getModule(m => (m?.v4 && m?.parse) || m?.uuidv4);
        const nonce = NonceModule?.v4?.() || NonceModule?.uuidv4?.() || Date.now().toString();

        const payload = {
            content: message,
            tts: false,
            invalidEmojis: [],
            validNonShortcutEmojis: [],
            allowedMentions: { parse: [] },
            nonce
        };

        try {
            await MessageActions.sendMessage(channelId, payload);
        } catch (e1) {
            try {
                await MessageActions.sendMessage(channelId, payload, { nonce });
            } catch (e2) {
                try {
                    await MessageActions.sendMessage(channelId, payload, undefined, { nonce });
                } catch (e3) {
                    console.error("[ScheduledMessage] sendMessage failed", e1, e2, e3);
                    BdApi.UI.showToast("Failed to send message (Discord API changed)", { type: "error" });
                    return false;
                }
            }
        }

        BdApi.UI.showToast("Message sent successfully", { type: "success" });
        return true;
    }

    async checkMessages() {
        const now = Date.now();
        for (const [id, data] of Store.messages) {
            if (now >= data.scheduledTime) {
                const ok = await this.sendMessage(data.channelId, data.message);
                if (ok) Store.remove(id);
            }
        }
    }

    getCurrentChannelId() {
        try {
            const id = BdApi.Webpack.getStore("SelectedChannelStore")?.getChannelId?.();
            if (id) return id;
        } catch {}
        try {
            const match = window.location.pathname.match(/\/channels\/(?:@me|\d+)\/(\d+)/);
            if (match?.[1]) return match[1];
        } catch {}
        return null;
    }

    patchButton() {
        const ClockIcon = (props) => React.createElement("svg", { ...props, width: "20", height: "20", viewBox: "0 0 24 24", "aria-hidden": "true" },
            React.createElement("path", { fill: "currentColor", d: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.5h-4v-1h3V7h1v5.5z" })
        );

        const mod = BdApi.Webpack.getModule(m => {
            try {
                return Object.values(m ?? {}).some(v => {
                    if (typeof v !== "function") return false;
                    try { const s = v.toString(); return s.includes("showAllButtons") && s.includes("handleSubmit"); }
                    catch { return false; }
                });
            } catch { return false; }
        });

        const key = mod && Object.keys(mod).find(k => {
            try { const s = mod[k]?.toString?.(); return s?.includes("showAllButtons") && s?.includes("handleSubmit"); }
            catch { return false; }
        });

        if (mod && key) {
            BdApi.Patcher.after("ScheduledMessage", mod, key, (_, [props], res) => {
                if (!Array.isArray(res?.props?.children)) return;

                if (!props || props.disabled) return;
                if (props.type?.analyticsName && props.type.analyticsName !== "normal") return;

                const channel = props.channel;
                if (!channel) return;

                const handleClick = () => openScheduleModal(channel.id);

                if (!M.ChatButton) {
                    try {
                        const el = document.querySelector('[class*="channelTextArea"] [class*="buttons"]');
                        const fk = el && Object.keys(el).find(k => k.startsWith("__reactFiber"));
                        if (fk) {
                            const q = [[el[fk], 0]];
                            const seen = new Set();
                            while (q.length) {
                                const [f, d] = q.shift();
                                if (!f || seen.has(f) || d > 30) continue;
                                seen.add(f);
                                if (typeof f.type === "function") {
                                    try {
                                        if (f.type.toString().includes("CHAT_INPUT_BUTTON_NOTIFICATION")) {
                                            M.ChatButton = f.type;
                                            break;
                                        }
                                    } catch {}
                                }
                                if (f.child) q.push([f.child, d + 1]);
                                if (f.sibling) q.push([f.sibling, d + 1]);
                            }
                        }
                    } catch {}
                }

                let btn;
                if (M.ChatButton) {
                    btn = M.Tooltip
                        ? React.createElement(M.Tooltip, { key: "sm-btn", text: "Schedule a message", position: "top" },
                            p => React.createElement("div", { ...p, onClick: handleClick },
                                React.createElement(M.ChatButton, { className: "sm-chat-btn", "aria-label": "Schedule a message" },
                                    React.createElement(ClockIcon)
                                )
                            )
                          )
                        : React.createElement("div", { key: "sm-btn", onClick: handleClick },
                            React.createElement(M.ChatButton, { className: "sm-chat-btn", "aria-label": "Schedule a message" },
                                React.createElement(ClockIcon)
                            )
                          );
                } else {
                    btn = M.Tooltip
                        ? React.createElement(M.Tooltip, { key: "sm-btn", text: "Schedule a message", position: "top" },
                            p => React.createElement("button", { ...p, className: "sm-fallback-btn", onClick: handleClick }, React.createElement(ClockIcon))
                          )
                        : React.createElement("button", { key: "sm-btn", className: "sm-fallback-btn", onClick: handleClick, title: "Schedule a message" }, React.createElement(ClockIcon));
                }

                res.props.children.unshift(btn);
            });
            return;
        }

        this._injectButtonDOM(ClockIcon);
        this._observer = new MutationObserver(() => this._injectButtonDOM(ClockIcon));
        this._observer.observe(document.body, { childList: true, subtree: true });
        this._btnInterval = setInterval(() => this._injectButtonDOM(ClockIcon), 2000);
    }

    _injectButtonDOM(ClockIcon) {
        const container = document.querySelector('[class*="channelTextArea"] [class*="buttons"]');
        if (!container || container.querySelector("#sm-btn")) return;

        if (!document.querySelector('[class*="channelTextArea"] [contenteditable="true"]')) return;

        const root = document.createElement("div");
        root.id = "sm-btn";
        root.style.cssText = "display: contents";

        const handleClick = () => {
            const id = this.getCurrentChannelId();
            if (id) openScheduleModal(id);
            else BdApi.UI.showToast("Unable to get current channel.", { type: "error" });
        };

        const btn = M.Tooltip
            ? React.createElement(M.Tooltip, { text: "Schedule a message" },
                p => React.createElement("button", { ...p, className: "sm-fallback-btn", onClick: handleClick },
                    React.createElement(ClockIcon)
                )
              )
            : React.createElement("button", {
                className: "sm-fallback-btn", onClick: handleClick, title: "Schedule a message"
              }, React.createElement(ClockIcon));

        const ReactDOM = BdApi.ReactDOM;
        if (ReactDOM?.createRoot) {
            root._r = ReactDOM.createRoot(root);
            root._r.render(btn);
        } else {
            ReactDOM?.render(btn, root);
        }

        container.insertBefore(root, container.lastElementChild);
    }

    checkForUpdate() {
        const UPDATE_URL = "https://raw.githubusercontent.com/Alex4923/BetterDiscordPlugins/main/Plugins/ScheduledMessage/ScheduledMessage.plugin.js";
        const CURRENT_VERSION = PLUGIN_CHANGELOG.version;

        fetch(UPDATE_URL)
            .then(r => r.text())
            .then(text => {
                const match = text.match(/@version\s+([^\s\r\n]+)/);
                if (!match) return;
                const remoteVersion = match[1].trim();

                const parse = v => v.split(".").map(Number);
                const [rMaj, rMin, rPat] = parse(remoteVersion);
                const [lMaj, lMin, lPat] = parse(CURRENT_VERSION);

                const isNewer = rMaj > lMaj
                    || (rMaj === lMaj && rMin > lMin)
                    || (rMaj === lMaj && rMin === lMin && rPat > lPat);

                if (!isNewer) return;

                BdApi.UI.showToast(
                    `ScheduledMessage v${remoteVersion} is available! Update the plugin in your BetterDiscord folder.`,
                    { type: "info", timeout: 10000 }
                );
            })
            .catch(() => {});
    }

    start() {
        BdApi.DOM.addStyle("ScheduledMessage", CSS);
        initModules();
        showChangelog();
        this.checkForUpdate();
        this.checkInterval = setInterval(this.checkMessages, 1000);
        this.patchButton();
    }

    stop() {
        BdApi.DOM.removeStyle("ScheduledMessage");
        BdApi.Patcher.unpatchAll("ScheduledMessage");
        clearInterval(this.checkInterval);
        clearInterval(this._btnInterval);
        this._observer?.disconnect();
        document.getElementById("sm-btn")?.remove();
        Store.clear();
    }
}

module.exports = ScheduledMessage;
