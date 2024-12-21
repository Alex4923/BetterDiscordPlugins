/**
 * @name ScheduledMessage
 * @description Plugin to schedule message sending.
 * @version 1.1.0
 * @author Alexvo
 * @authorId 265931236885790721
 * @source https://github.com/Alex4923/BetterDiscordPlugins/tree/main/ScheduledMessage
 * @donate https://paypal.me/alex4923
 * @website https://www.alexvo2709.com/
 */

'use strict';

const React = BdApi.React;

var manifest = {
    "name": "ScheduledMessage",
    "version": "1.1.0",
    "author": "Alexvo",
    "description": "Plugin to schedule message sending.",
    "authorID": "265931236885790721"
};

const {
    Components,
    ContextMenu,
    Data,
    DOM,
    Net,
    Patcher,
    Plugins,
    ReactUtils,
    Themes,
    UI,
    Utils,
    Webpack
} = new BdApi(manifest.name);

var Styles = {
    sheets: [],
    _element: null,
    load() {
        DOM.addStyle(this.sheets.join("\n"));
    },
    unload() {
        DOM.removeStyle();
    }
};

const ScheduledMessagesStore = {
    messages: new Map(),
    checkInterval: null,
    
    addMessage(id, channelId, message, scheduledTime) {
        this.messages.set(id, {
            channelId,
            message,
            scheduledTime
        });
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
        this.state = {
            message: "",
            date: "",
            time: "",
            isVisible: false
        };
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({ isVisible: true });
        }, 10);
    }

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    handleClose = () => {
        this.setState({ isVisible: false });
        setTimeout(() => {
            if (this.props.onClose) {
                this.props.onClose();
            }
        }, 300);
    }

    scheduleMessage = () => {
        const { message, date, time } = this.state;
        const scheduledTime = new Date(`${date}T${time}`);
        const currentTime = new Date();

        if (!message || !date || !time) {
            BdApi.UI.showToast("Please fill in all fields", { type: "error" });
            return;
        }

        if (scheduledTime > currentTime) {
            const messageId = Date.now().toString();
            ScheduledMessagesStore.addMessage(messageId, this.props.channelId, message, scheduledTime.getTime());
            BdApi.UI.showToast("Message successfully scheduled", { type: "success" });
            this.handleClose();
        } else {
            BdApi.UI.showToast("The scheduled time is in the past", { type: "error" });
        }
    }

    render() {
        return React.createElement("div", {
            style: {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: this.state.isVisible ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.9)",
                opacity: this.state.isVisible ? 1 : 0,
                transition: "transform 0.3s, opacity 0.3s",  
                width: "800px",  
                height: "300px",  
                backgroundColor: "#2c2f33",
                color: "#fff",
                zIndex: 9999,
                padding: "20px",
                borderRadius: "10px",
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
            }
        }, [
            React.createElement("h2", {
                style: { marginBottom: "20px" }
            }, "Schedule a Message"),

            React.createElement("div", {
                style: { display: "flex", alignItems: "center", marginBottom: "10px" }
            }, [
                React.createElement("svg", {
                    width: "24",
                    height: "24",
                    viewBox: "0 0 24 24",
                    style: { marginRight: "10px" }
                }, React.createElement("path", {
                    fill: "rgba(255, 255, 255, 0.7)",  
                    d: "M21 6.5a2.5 2.5 0 00-2.5-2.5h-13A2.5 2.5 0 003 .5v11a2.5 2.5 0 002.5 2.5h13a2.5 2.5 0 002.5-2.5v-11zm-2 0v.5h-13v-.5a.5.5 0 01.5-.5h12a.5.5 0 01.5.5zm-13 11v-.5h13v.5a.5.5 0 01-.5.5h-12a.5.5 0 01-.5-.5zm13-2.5h-13v-7h13v7z"
                })),
                React.createElement("input", {
                    type: "text",
                    name: "message",
                    placeholder: "Message",
                    value: this.state.message,
                    onChange: this.handleInputChange,
                    style: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", backgroundColor: "#40444b", color: "#dcddde", width: "calc(100% - 34px)" }
                })
            ]),

            React.createElement("div", {
                style: { display: "flex", alignItems: "center", marginBottom: "10px", cursor: "pointer" },
                onClick: () => this.dateInput && this.dateInput.showPicker()
            }, [
                React.createElement("svg", {
                    width: "24",
                    height: "24",
                    viewBox: "0 0 24 24",
                    style: { marginRight: "10px" }
                }, React.createElement("path", {
                    fill: "rgba(255, 255, 255, 0.7)",  
                    d: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
                })),
                React.createElement("input", {
                    type: "date",
                    name: "date",
                    value: this.state.date,
                    onChange: this.handleInputChange,
                    ref: (input) => this.dateInput = input,
                    style: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", backgroundColor: "#40444b", color: "#dcddde", width: "calc(100% - 34px)", pointerEvents: "none" }
                })
            ]),
            
            React.createElement("div", {
                style: { display: "flex", alignItems: "center", marginBottom: "20px", cursor: "pointer" },
                onClick: () => this.timeInput && this.timeInput.showPicker()
            }, [
                React.createElement("svg", {
                    width: "24",
                    height: "24",
                    viewBox: "0 0 24 24",
                    style: { marginRight: "10px" }
                }, React.createElement("path", {
                    fill: "rgba(255, 255, 255, 0.7)",  
                    d: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.5h-4v-1h3V7h1v5.5z"
                })),
                React.createElement("input", {
                    type: "time",
                    name: "time",
                    value: this.state.time,
                    onChange: this.handleInputChange,
                    ref: (input) => this.timeInput = input,
                    style: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc", backgroundColor: "#40444b", color: "#dcddde", width: "calc(100% - 34px)", pointerEvents: "none" }
                })
            ]),

            React.createElement("div", {
                style: { display: "flex", justifyContent: "center", marginBottom: "10px", gap: "10px" } 
            }, [
                React.createElement("button", {
                    onClick: this.scheduleMessage,  
                    style: { padding: "10px", borderRadius: "5px", backgroundColor: "#7289da", color: "#fff", border: "none", cursor: "pointer", width: "calc(50% - 22px)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", marginLeft: "34px" } 
                }, [
                    React.createElement("svg", {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        style: { marginRight: "5px" }
                    }, React.createElement("path", {
                        fill: "rgba(255, 255, 255, 0.7)", 
                        d: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.5h-4v-1h3V7h1v5.5z"
                    })),
                    "Schedule Message"
                ]),

                React.createElement("button", {
                    onClick: this.handleClose,
                    style: { padding: "10px", borderRadius: "5px", backgroundColor: "#f04747", color: "#fff", border: "none", cursor: "pointer", width: "calc(50% - 22px)", display: "flex", alignItems: "center", justifyContent: "center" }
                }, [
                    React.createElement("svg", {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        style: { marginRight: "5px" }
                    }, React.createElement("path", {
                        fill: "rgba(255, 255, 255, 0.7)",  
                        d: "M6 18L18 6M6 6l12 12"  
                    })),
                    "Close"
                ])
            ])
        ]);
    }
}

let activeModal = null;

function openCustomModal(channelId) {
    if (activeModal) {
        document.body.removeChild(activeModal);
    }

    const modalContainer = document.createElement("div");
    modalContainer.id = "custom-modal-container";
    document.body.appendChild(modalContainer);
    activeModal = modalContainer;

    BdApi.ReactDOM.render(
        React.createElement(CustomModal, {
            channelId: channelId,
            onClose: () => {
                BdApi.ReactDOM.unmountComponentAtNode(modalContainer);
                document.body.removeChild(modalContainer);
                activeModal = null;
            }
        }),
        modalContainer
    );
}

class ScheduledMessage {
    constructor() {
        this.checkMessages = this.checkMessages.bind(this);
    }

    sendMessage(channelId, message) {
        const MessageActions = Webpack.getModule(m => m?.sendMessage && m?.editMessage);
        if (MessageActions) {
            MessageActions.sendMessage(channelId, { content: message });
            BdApi.UI.showToast("Message sent successfully", { type: "success" });
        } else {
            BdApi.UI.showToast("Failed to send message", { type: "error" });
        }
    }

    checkMessages() {
        const currentTime = Date.now();
        for (const [id, messageData] of ScheduledMessagesStore.messages) {
            if (currentTime >= messageData.scheduledTime) {
                this.sendMessage(messageData.channelId, messageData.message);
                ScheduledMessagesStore.removeMessage(id);
            }
        }
    }

    start() {
        this.patchChannelTextArea();
        ScheduledMessagesStore.checkInterval = setInterval(this.checkMessages, 1000);
    }

    stop() {
        Patcher.unpatchAll();
        if (ScheduledMessagesStore.checkInterval) {
            clearInterval(ScheduledMessagesStore.checkInterval);
            ScheduledMessagesStore.checkInterval = null;
        }
        ScheduledMessagesStore.clearAll();
        if (activeModal) {
            document.body.removeChild(activeModal);
            activeModal = null;
        }
    }
    patchChannelTextArea() {
        const ChannelTextArea = Webpack.getModule(m => m?.type?.render?.toString?.()?.includes?.("CHANNEL_TEXT_AREA"));
        Patcher.after(ChannelTextArea.type, "render", (_, __, res) => {
            const chatBar = Utils.findInTree(res, e => Array.isArray(e?.children) && e.children.some(c => c?.props?.className?.startsWith("attachButton")), {
                walkable: ["children", "props"]
            });
            if (!chatBar) return console.error("[ScheduledMessage] Failed to find ChatBar");
    
            const textAreaState = Utils.findInTree(chatBar, e => e?.props?.channel, {
                walkable: ["children"]
            });
            if (!textAreaState) return console.error("[ScheduledMessage] Failed to find textAreaState");
    
            const existingButton = chatBar.children.find(child => child?.props?.className?.startsWith("buttonContainer-"));
            const buttonClass = existingButton?.props?.className || "";
    
            chatBar.children.splice(-1, 0, React.createElement("div", {
                className: buttonClass, 
            }, React.createElement("button", {
                className: "button-", 
                onClick: () => openCustomModal(textAreaState.props.channel.id),
                style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s",
                    color: "var(--interactive-normal)",
                    minHeight: "44px",
                    margin: "0 8px"
                },
                onMouseEnter: (e) => e.currentTarget.style.transform = "scale(1.1)",
                onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
            }, React.createElement("svg", {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24"
            }, React.createElement("path", {
                fill: "currentColor",
                d: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.5h-4v-1h3V7h1v5.5z"
            })))));
        });
    }
}
module.exports = ScheduledMessage;