/**
 * @name ScheduledMessage
 * @description Plugin to schedule message sending.
 * @version 2.2.0
 * @author Alexvo
 * @authorId 265931236885790721
 * @source https://github.com/Alex4923/BetterDiscordPlugins/tree/main/ScheduledMessage
 * @donate https://paypal.me/alex4923
 * @website https://www.alexvo2709.com/
 */

'use strict';

const React = BdApi.React;

const UPDATE_CHECK_URL = "https://raw.githubusercontent.com/Alex4923/BetterDiscordPlugins/main/ScheduledMessage/ScheduledMessage.plugin.js";
const RELEASES_URL = "https://github.com/Alex4923/BetterDiscordPlugins/releases";
const CURRENT_VERSION = "2.2.0";
const UPDATE_BANNER_ID = "scheduled-message-updater-banner";

const ScheduledMessagesStore = {
    messages: new Map(),
    checkInterval: null,
    
    addMessage(id, channelId, message, scheduledTime) {
        this.messages.set(id, { channelId, message, scheduledTime });
    },
    
    removeMessage(id) {
        this.messages.delete(id);
    },
    
    clearAll() {
        this.messages.clear();
    }
};

class CustomModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { message: "", date: "", time: "", isVisible: false };
    }

    componentDidMount() {
        requestAnimationFrame(() => {
            this.setState({ isVisible: true });
        });
    }

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    handleDateFieldClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const dateInput = document.querySelector('#custom-modal-container input[name="date"]');
        if (dateInput) {
            dateInput.focus();
            try {
                if (dateInput.showPicker) {
                    dateInput.showPicker();
                } else {
                    dateInput.click();
                }
            } catch (e) {
                dateInput.click();
            }
        }
    }

    handleTimeFieldClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const timeInput = document.querySelector('#custom-modal-container input[name="time"]');
        if (timeInput) {
            timeInput.focus();
            try {
                if (timeInput.showPicker) {
                    timeInput.showPicker();
                } else {
                    timeInput.click();
                }
            } catch (e) {
                timeInput.click();
            }
        }
    }

    handleClose = () => {
        this.setState({ isVisible: false });
        setTimeout(() => this.props.onClose && this.props.onClose(), 400);
    }

    scheduleMessage = () => {
        const { message, date, time } = this.state;
        const scheduledTime = new Date(`${date}T${time}`);

        if (!message || !date || !time) {
            BdApi.UI.showToast("Please fill in all fields", { type: "error" });
            return;
        }

        if (scheduledTime > new Date()) {
            const messageId = Date.now().toString();
            ScheduledMessagesStore.addMessage(messageId, this.props.channelId, message, scheduledTime.getTime());
            BdApi.UI.showToast("Message successfully scheduled", { type: "success" });
            this.handleClose();
        } else {
            BdApi.UI.showToast("The scheduled time is in the past", { type: "error" });
        }
    }

    render() {
        const modalStyle = {
            position: "fixed", 
            top: "0", 
            left: "0", 
            width: "100%", 
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.85)", 
            backdropFilter: this.state.isVisible ? "blur(10px)" : "blur(0px)",
            WebkitBackdropFilter: this.state.isVisible ? "blur(10px)" : "blur(0px)",
            zIndex: "10000", 
            display: "flex",
            alignItems: "center", 
            justifyContent: "center",
            opacity: this.state.isVisible ? 1 : 0, 
            transition: "opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), backdrop-filter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxSizing: "border-box",
            fontFamily: "Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        };

        const containerStyle = {
            width: "560px", 
            maxWidth: "95vw", 
            maxHeight: "90vh",
            backgroundColor: "#36393f",
            border: "1px solid #4f545c", 
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            transform: this.state.isVisible ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
            transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxSizing: "border-box",
            overflow: "hidden",
            position: "relative"
        };

        const headerStyle = {
            background: "linear-gradient(135deg, #5865f2 0%, #7289da 50%, #4752c4 100%)",
            padding: "28px 32px", 
            borderRadius: "12px 12px 0 0", 
            position: "relative",
            boxSizing: "border-box",
            backgroundSize: "200% 200%",
            animation: "gradientShift 6s ease infinite"
        };

        const titleStyle = {
            margin: "0", 
            fontSize: "22px", 
            fontWeight: "700", 
            color: "white",
            fontFamily: "inherit",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            letterSpacing: "0.5px"
        };

        const closeButtonStyle = {
            position: "absolute", 
            top: "20px", 
            right: "20px", 
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)", 
            borderRadius: "8px", 
            width: "32px", 
            height: "32px",
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "18px",
            color: "white",
            lineHeight: "1",
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)"
        };

        const bodyStyle = {
            padding: "32px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px",
            boxSizing: "border-box",
            background: "linear-gradient(180deg, #36393f 0%, #32353b 100%)"
        };

        const labelStyle = {
            fontSize: "13px", 
            fontWeight: "700", 
            color: "#dcddde",
            textTransform: "uppercase", 
            marginBottom: "8px",
            display: "block",
            fontFamily: "inherit",
            letterSpacing: "0.5px",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.4)"
        };

        const inputStyle = {
            width: "100%", 
            padding: "14px 16px", 
            fontSize: "15px", 
            backgroundColor: "#40444b",
            border: "2px solid #4f545c", 
            borderRadius: "8px", 
            color: "#dcddde",
            outline: "none", 
            fontFamily: "inherit",
            boxSizing: "border-box",
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)"
        };

        const textareaStyle = {
            width: "100%", 
            padding: "16px", 
            fontSize: "15px", 
            backgroundColor: "#40444b",
            border: "2px solid #4f545c", 
            borderRadius: "8px", 
            color: "#dcddde",
            outline: "none", 
            fontFamily: "inherit",
            minHeight: "120px", 
            resize: "none", 
            overflow: "auto",
            boxSizing: "border-box",
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.05)",
            lineHeight: "1.5"
        };

        const rowStyle = {
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "20px",
            boxSizing: "border-box"
        };

        const fieldContainerStyle = {
            boxSizing: "border-box",
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
            borderRadius: "8px",
            padding: "0"
        };

        const clickableOverlayStyle = {
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            cursor: "pointer",
            zIndex: "2",
            backgroundColor: "transparent"
        };

        const clickableInputStyle = {
            ...inputStyle,
            cursor: "pointer",
            pointerEvents: "all",
            position: "relative",
            zIndex: "1"
        };

        const footerStyle = {
            padding: "24px 32px", 
            background: "linear-gradient(180deg, #2f3136 0%, #292b2f 100%)",
            borderTop: "1px solid rgba(79, 84, 92, 0.6)", 
            display: "flex",
            justifyContent: "flex-end", 
            gap: "16px", 
            borderRadius: "0 0 12px 12px",
            boxSizing: "border-box",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)"
        };

        const cancelButtonStyle = {
            padding: "12px 24px", 
            fontSize: "15px", 
            fontWeight: "600",
            borderRadius: "8px", 
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fontFamily: "inherit",
            boxSizing: "border-box",
            minWidth: "100px",
            backgroundColor: "transparent", 
            color: "#dcddde",
            border: "2px solid #4f545c",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
        };

        const submitButtonStyle = {
            padding: "12px 24px", 
            fontSize: "15px", 
            fontWeight: "600",
            border: "none", 
            borderRadius: "8px", 
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fontFamily: "inherit",
            boxSizing: "border-box",
            minWidth: "120px",
            position: "relative",
            overflow: "hidden",
            background: (!this.state.message || !this.state.date || !this.state.time) 
                ? "linear-gradient(135deg, #4f545c 0%, #3c4043 100%)" 
                : "linear-gradient(135deg, #5865f2 0%, #7289da 50%, #4752c4 100%)",
            color: (!this.state.message || !this.state.date || !this.state.time) ? "#8e9297" : "white",
            cursor: (!this.state.message || !this.state.date || !this.state.time) ? "not-allowed" : "pointer",
            boxShadow: (!this.state.message || !this.state.date || !this.state.time) 
                ? "0 4px 12px rgba(0, 0, 0, 0.15)" 
                : "0 6px 20px rgba(88, 101, 242, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            backgroundSize: "200% 200%"
        };

        return React.createElement("div", { 
            style: modalStyle, 
            onClick: this.handleClose 
        },
            React.createElement("div", { 
                style: containerStyle, 
                onClick: (e) => e.stopPropagation() 
            }, [
                React.createElement("div", { 
                    key: "header",
                    style: headerStyle 
                }, [
                    React.createElement("h2", { 
                        key: "title",
                        style: titleStyle 
                    }, "Schedule a Message"),
                    React.createElement("button", {
                        key: "close",
                        style: closeButtonStyle,
                        onClick: this.handleClose,
                        className: "close-btn"
                    }, "×")
                ]),
                React.createElement("div", { 
                    key: "body",
                    style: bodyStyle 
                }, [
                    React.createElement("div", { 
                        key: "message-field",
                        style: { boxSizing: "border-box" }
                    }, [
                        React.createElement("label", { 
                            key: "message-label",
                            style: labelStyle 
                        }, "Message"),
                        React.createElement("textarea", {
                            key: "message-input",
                            name: "message",
                            placeholder: "Type your message here...",
                            value: this.state.message,
                            onChange: this.handleInputChange,
                            style: textareaStyle
                        })
                    ]),
                    React.createElement("div", { 
                        key: "datetime-row",
                        style: rowStyle 
                    }, [
                        React.createElement("div", { 
                            key: "date-field",
                            style: fieldContainerStyle,
                            className: "field-container"
                        }, [
                            React.createElement("label", { 
                                key: "date-label",
                                style: labelStyle 
                            }, "Date"),
                            React.createElement("div", {
                                key: "date-input-container",
                                style: { position: "relative" }
                            }, [
                                React.createElement("input", {
                                    key: "date-input",
                                    type: "date",
                                    name: "date",
                                    value: this.state.date,
                                    onChange: this.handleInputChange,
                                    style: clickableInputStyle
                                }),
                                React.createElement("div", {
                                    key: "date-overlay",
                                    style: clickableOverlayStyle,
                                    onClick: this.handleDateFieldClick
                                })
                            ])
                        ]),
                        React.createElement("div", { 
                            key: "time-field",
                            style: fieldContainerStyle,
                            className: "field-container"
                        }, [
                            React.createElement("label", { 
                                key: "time-label",
                                style: labelStyle 
                            }, "Time"),
                            React.createElement("div", {
                                key: "time-input-container",
                                style: { position: "relative" }
                            }, [
                                React.createElement("input", {
                                    key: "time-input",
                                    type: "time",
                                    name: "time",
                                    value: this.state.time,
                                    onChange: this.handleInputChange,
                                    style: clickableInputStyle
                                }),
                                React.createElement("div", {
                                    key: "time-overlay",
                                    style: clickableOverlayStyle,
                                    onClick: this.handleTimeFieldClick
                                })
                            ])
                        ])
                    ])
                ]),
                React.createElement("div", { 
                    key: "footer",
                    style: footerStyle 
                }, [
                    React.createElement("button", {
                        key: "cancel-btn",
                        onClick: this.handleClose,
                        style: cancelButtonStyle,
                        className: "cancel-btn"
                    }, "Cancel"),
                    React.createElement("button", {
                        key: "submit-btn",
                        onClick: this.scheduleMessage,
                        disabled: !this.state.message || !this.state.date || !this.state.time,
                        style: submitButtonStyle,
                        className: "submit-btn"
                    }, "Schedule")
                ])
            ])
        );
    }
}

function injectAnimationCSS() {
    if (document.getElementById('scheduled-message-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'scheduled-message-animations';
    style.textContent = `
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        #scheduled-message-button {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        
        #scheduled-message-button:hover {
            transform: scale(1.15) !important;
            color: #5865f2 !important;
            filter: drop-shadow(0 0 8px rgba(88, 101, 242, 0.5));
        }
        
        /* Make date/time fields fully clickable */
        #custom-modal-container input[type="date"],
        #custom-modal-container input[type="time"] {
            cursor: pointer !important;
            width: 100% !important;
        }
        
        /* Style the date/time field containers */
        #custom-modal-container .field-container {
            transition: all 0.2s ease !important;
            position: relative !important;
        }
        
        #custom-modal-container .field-container:hover {
            transform: translateY(-1px);
        }
        
        #custom-modal-container .field-container:hover input {
            border-color: #5865f2 !important;
            box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2) !important;
        }
        
        /* Debug: Make overlay visible for testing (remove after confirmation) */
        #custom-modal-container .field-container div[style*="position: absolute"]:hover {
            background-color: rgba(88, 101, 242, 0.1) !important;
        }
        
        /* Input focus effects */
        #custom-modal-container input:focus,
        #custom-modal-container textarea:focus {
            border-color: #5865f2 !important;
            box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            transform: translateY(-1px);
        }
        
        /* Button hover effects */
        #custom-modal-container button:not(:disabled):hover {
            transform: translateY(-2px);
            filter: brightness(1.1);
        }
        
        /* Close button hover */
        #custom-modal-container .close-btn:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            transform: rotate(90deg) scale(1.1);
        }
        
        /* Gradient animation for submit button */
        #custom-modal-container .submit-btn:not(:disabled) {
            animation: gradientShift 3s ease infinite;
        }
        
        #custom-modal-container .submit-btn:not(:disabled):hover {
            box-shadow: 0 8px 25px rgba(88, 101, 242, 0.6), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
    `;
    document.head.appendChild(style);
}

function removeAnimationCSS() {
    const style = document.getElementById('scheduled-message-animations');
    if (style) style.remove();
}

let activeModal = null;
let reactRoot = null;

function openCustomModal(channelId) {
    
    if (activeModal) {
        return;
    }
    
    injectAnimationCSS();
    
    const existingModal = document.getElementById("custom-modal-container");
    if (existingModal) {
        existingModal.remove();
    }
    
    if (reactRoot) {
        try {
            reactRoot.unmount();
        } catch (e) {}
        reactRoot = null;
    }

    const modalContainer = document.createElement("div");
    modalContainer.id = "custom-modal-container";
    document.body.appendChild(modalContainer);
    activeModal = modalContainer;

    const ReactDOM = BdApi.ReactDOM || BdApi.React;
    const closeModal = () => {
        try {
            if (reactRoot) {
                reactRoot.unmount();
                reactRoot = null;
            } else if (ReactDOM.unmountComponentAtNode) {
                ReactDOM.unmountComponentAtNode(modalContainer);
            }
            if (modalContainer && modalContainer.parentNode) {
                modalContainer.parentNode.removeChild(modalContainer);
            }
        } catch (e) {
        }
        activeModal = null;
    };

    try {
        if (ReactDOM.createRoot) {
            reactRoot = ReactDOM.createRoot(modalContainer);
            reactRoot.render(
                React.createElement(CustomModal, { channelId: channelId, onClose: closeModal })
            );
        } else if (ReactDOM.render) {
            ReactDOM.render(
                React.createElement(CustomModal, { channelId: channelId, onClose: closeModal }),
                modalContainer
            );
        } else {
            BdApi.UI.showToast("Error: React rendering not available", { type: "error" });
        }
    } catch (error) {
        BdApi.UI.showToast("Error opening modal", { type: "error" });
    }
}

class ScheduledMessage {
    constructor() {
        this.checkMessages = this.checkMessages.bind(this);
        this.updateIntervalId = null;
    }

    compareVersions(a, b) {
        const pa = a.split('.').map(n => parseInt(n, 10));
        const pb = b.split('.').map(n => parseInt(n, 10));
        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na > nb) return 1;
            if (na < nb) return -1;
        }
        return 0;
    }

    removeUpdateBanner() {
        const banner = document.getElementById(UPDATE_BANNER_ID);
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    }

    showUpdateBanner(remoteVersion) {
        this.removeUpdateBanner();

        const banner = document.createElement('div');
        banner.id = UPDATE_BANNER_ID;
        banner.style.cssText = `
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            top: 52px; /* sous la bannière BetterDiscord */
            z-index: 9999;
            background: #202225;
            color: #fff;
            border: 1px solid #2f3136;
            border-radius: 8px;
            padding: 10px 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,.45);
            display: flex;
            gap: 12px;
            align-items: center;
            font-family: Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif;
        `;

        const text = document.createElement('div');
        text.textContent = `ScheduledMessage ${CURRENT_VERSION} → ${remoteVersion} available`;

        const btnDownload = document.createElement('a');
        btnDownload.href = UPDATE_CHECK_URL;
        btnDownload.target = "_blank";
        btnDownload.rel = "noreferrer";
        btnDownload.textContent = "Download";
        btnDownload.style.cssText = `
            background:#5865f2;border:none;padding:6px 10px;border-radius:6px;
            color:#fff;text-decoration:none;font-weight:600
        `;

        const btnChangelog = document.createElement('a');
        btnChangelog.href = RELEASES_URL;
        btnChangelog.target = "_blank";
        btnChangelog.rel = "noreferrer";
        btnChangelog.textContent = "Changelog";
        btnChangelog.style.cssText = `
            background:#4f545c;border:none;padding:6px 10px;border-radius:6px;
            color:#fff;text-decoration:none;font-weight:600
        `;

        const close = document.createElement('button');
        close.textContent = "✕";
        close.style.cssText = `
            background:transparent;border:none;color:#b9bbbe;cursor:pointer;
            font-size:16px;margin-left:4px
        `;
        close.onclick = () => this.removeUpdateBanner();

        banner.appendChild(text);
        banner.appendChild(btnDownload);
        banner.appendChild(btnChangelog);
        banner.appendChild(close);

        document.body.appendChild(banner);
    }

    async checkForUpdates() {
        try {
            const res = await BdApi.Net.fetch(UPDATE_CHECK_URL, { cache: "no-store" });
            if (!res?.ok) return;
            const text = await res.text();
            const match = text.match(/@version\s+([0-9.]+)/);
            const remote = match?.[1];
            if (!remote) return;
            if (this.compareVersions(remote, CURRENT_VERSION) > 0) {
                this.showUpdateBanner(remote);
            } else {
                this.removeUpdateBanner();
            }
        } catch (e) {
        }
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

        const options = { nonce }; 

        try {
            await MessageActions.sendMessage(channelId, payload);
        } catch (e1) {
            try {
                await MessageActions.sendMessage(channelId, payload, options);
            } catch (e2) {
                try {
                    await MessageActions.sendMessage(channelId, payload, undefined, options);
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
        for (const [id, data] of ScheduledMessagesStore.messages) {
            if (now >= data.scheduledTime) {
                const ok = await this.sendMessage(data.channelId, data.message);
                if (ok) ScheduledMessagesStore.removeMessage(id);
            }
        }
    }

    getCurrentChannelId() {
        try {
            const SelectedChannelStore = BdApi.Webpack.getStore("SelectedChannelStore");
            if (SelectedChannelStore?.getChannelId) {
                const channelId = SelectedChannelStore.getChannelId();
                if (channelId) return channelId;
            }
        } catch (e) {}

        try {
            const ChannelStore = BdApi.Webpack.getModule(m => m.getChannelId && typeof m.getChannelId === 'function');
            if (ChannelStore?.getChannelId) {
                const channelId = ChannelStore.getChannelId();
                if (channelId) return channelId;
            }
        } catch (e) {}

        try {
            const match = window.location.pathname.match(/\/channels\/(?:@me|\d+)\/(\d+)/);
            if (match && match[1]) return match[1];
        } catch (e) {}

        try {
            const textarea = document.querySelector('[data-slate-editor="true"]');
            if (textarea) {
                const channelTextArea = textarea.closest('[class*="channelTextArea"]');
                if (channelTextArea) {
                    const form = channelTextArea.closest('form');
                    if (form) {
                        const channelId = form.getAttribute('data-channel-id') || 
                                        form.querySelector('[data-channel-id]')?.getAttribute('data-channel-id');
                        if (channelId) return channelId;
                    }
                }
            }
        } catch (e) {}

        try {
            const stores = BdApi.Webpack.getModule(m => m.default?.getState && m.default.getState()?.selectedChannel);
            if (stores?.default?.getState) {
                const channelId = stores.default.getState()?.selectedChannel?.channelId;
                if (channelId) return channelId;
            }
        } catch (e) {}

        return null;
    }

    injectButton() {
        const textareaContainer = document.querySelector('[class*="channelTextArea"]');
        if (!textareaContainer) return;

        const buttonContainer = textareaContainer.querySelector('[class*="buttons"]');
        if (!buttonContainer || buttonContainer.querySelector('#scheduled-message-button')) return;

        const button = document.createElement('button');
        button.id = 'scheduled-message-button';
        button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.5h-4v-1h3V7h1v5.5z"/></svg>';
        button.style.cssText = `
            background: none; border: none; cursor: pointer; padding: 0;
            display: flex; align-items: center; justify-content: center;
            color: var(--interactive-normal); min-height: 44px; margin: 0 8px;
            border-radius: 4px; transition: all 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.color = 'var(--interactive-hover)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.color = 'var(--interactive-normal)';
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const channelId = this.getCurrentChannelId();
            
            if (channelId) {
                openCustomModal(channelId);
            } else {
                BdApi.UI.showToast("Unable to get current channel ID. Please make sure you're in a text channel.", { type: "error" });
            }
        });

        buttonContainer.insertBefore(button, buttonContainer.lastElementChild);
    }

    start() {
        ScheduledMessagesStore.checkInterval = setInterval(this.checkMessages, 1000);
        this.injectButton();
        this.observer = new MutationObserver(() => this.injectButton());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.buttonCheckInterval = setInterval(() => this.injectButton(), 2000);

        this.checkForUpdates();
        this.updateIntervalId = setInterval(() => this.checkForUpdates(), 6 * 60 * 60 * 1000); // 6h
    }

    stop() {
        if (ScheduledMessagesStore.checkInterval) {
            clearInterval(ScheduledMessagesStore.checkInterval);
            ScheduledMessagesStore.checkInterval = null;
        }

        if (this.buttonCheckInterval) {
            clearInterval(this.buttonCheckInterval);
            this.buttonCheckInterval = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        document.querySelectorAll('#scheduled-message-button').forEach(button => button.remove());
        ScheduledMessagesStore.clearAll();
        
        removeAnimationCSS();

        if (reactRoot) {
            try {
                reactRoot.unmount();
            } catch (e) {}
            reactRoot = null;
        }

        if (activeModal && activeModal.parentNode) {
            try {
                activeModal.parentNode.removeChild(activeModal);
            } catch (e) {}
            activeModal = null;
        }

        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        this.removeUpdateBanner();
    }
}

module.exports = ScheduledMessage;
